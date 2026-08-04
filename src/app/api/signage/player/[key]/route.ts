import { NextRequest, NextResponse } from 'next/server';
import {
  getScreenByKey,
  getSchedulesByScreenKey,
  getPlaylistItemsByPlaylistId,
} from '@/lib/signage/db';
import { matchSchedule, type ScheduleRow } from '@/lib/signage/schedule';
import { assetProxyUrl } from '@/lib/signage/assetVersion';
import { cachedSignageRead } from '@/lib/signage/cache';

/**
 * 這支路由必須每次請求都真的執行（排程比對相依於「現在幾點」，不能整包快取回應）。
 * 但「執行」不等於「查 DB」：下方三筆讀取都走 cachedSignageRead，
 * 平常命中 Data Cache 完全不碰資料庫，後台一寫入就自動失效。
 *
 * 歷史說明：
 *   這裡原本用 force-dynamic 關掉框架快取，是為了修「播放清單改了但播放器
 *   讀到舊快照」的 bug——但那等於連同省錢的快取一起關掉，再靠 CDN 的
 *   s-maxage=180 補救。結果是每 3 分鐘一定回源查一次 DB，而 Neon 要閒置
 *   滿 5 分鐘才休眠 → 只要有螢幕開著 compute 就永遠醒著（帳單來源）。
 *   正解是「快取 + 寫入時 tag 失效」，既不會讀到舊資料、又不用一直查 DB，
 *   而且排程改動比原本的 3 分鐘更快生效。
 */
export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface ScreenRow {
  id: number;
  name: string;
}

/** 螢幕基本資料：查無此螢幕是穩定結果可快取，連線失敗則丟出錯誤不快取 */
function loadScreen(key: string) {
  return cachedSignageRead(['screen', key], async () => {
    const result = await getScreenByKey(key);
    if (result.success && result.data) return result.data as unknown as ScreenRow;
    if (result.error === '找不到指定的螢幕') return null;
    throw new Error('讀取螢幕資料失敗');
  });
}

function loadSchedules(key: string) {
  return cachedSignageRead(['schedules', key], async () => {
    const result = await getSchedulesByScreenKey(key);
    if (!result.success) throw new Error('取得排程失敗');
    return (result.data as unknown as ScheduleRow[]) ?? [];
  });
}

interface RawPlaylistItem {
  asset_id: number;
  filename: string;
  blob_url: string;
  duration_seconds: number;
  description: string | null;
}

function loadPlaylistItems(playlistId: number) {
  return cachedSignageRead(['playlist-items', String(playlistId)], async () => {
    const result = await getPlaylistItemsByPlaylistId(playlistId);
    if (!result.success) throw new Error('取得播放清單項目失敗');
    return (result.data as unknown as RawPlaylistItem[]) ?? [];
  });
}

/**
 * 刻意不做 CDN 快取。
 *
 * 省 DB 的工作已經由 Data Cache 接手（輪詢命中時 0 次查詢），
 * 這裡再加 s-maxage 只會有壞處：手動設定的 Cache-Control 會在 CDN 產生
 * 一個 revalidateTag purge 不到的快取條目，讓後台改好的排程被卡住到期為止。
 * 拿掉之後，排程改動在下一次輪詢（最慢 60 秒）就會上螢幕。
 */
const NO_STORE = { 'Cache-Control': 'no-store' } as const;

/**
 * 播放器核心 API
 * GET /api/signage/player/[key]
 *
 * 對應 v2.0 backend/api/player.py:get_current_schedule
 * 由螢幕端定期輪詢，回傳當前該播放的清單
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { key: string } },
) {
  const key = params.key;

  if (!key) {
    return NextResponse.json({
      status: 'error',
      message: '缺少 screen key 參數',
    }, { status: 400 });
  }

  try {
    // 1. 找螢幕（與排程互不相依，同時發出）
    const [screen, schedules] = await Promise.all([
      loadScreen(key),
      loadSchedules(key),
    ]);
    if (!screen) {
      return NextResponse.json({
        status: 'error',
        message: '找不到對應的螢幕',
      }, { status: 404 });
    }

    // 2. 匹配當前排程（相依於「現在幾點」，所以每次請求都要重算，不能快取結果）
    const matched = matchSchedule(schedules);
    if (!matched) {
      return NextResponse.json({
        status: 'idle',
        message: '目前無排程',
        items: [],
        screen_name: screen.name,
        current_time: new Date().toISOString(),
      }, { headers: NO_STORE });
    }

    // 3. 取出該排程對應的播放清單項目
    const rawItems = await loadPlaylistItems(matched.playlist_id);

    // 透過 proxy 路由提供 .html，避免 Vercel Blob 的 attachment disposition
    // 讓 iframe 能正常嵌入渲染（而非觸發下載）。
    // 網址帶 ?v={blob 版本碼}：素材一經編輯版本碼就變，iframe 會重載、CDN 也會 miss
    // → 前台立即看到新內容（最慢只差一個排程輪詢週期）。
    const items = rawItems.map(it => ({
      url: assetProxyUrl(it.asset_id, it.blob_url),
      duration: it.duration_seconds,
      filename: it.filename,
      description: it.description,
    }));

    return NextResponse.json({
      status: 'playing',
      playlist_name: matched.playlist_name,
      playlist_id: matched.playlist_id,
      schedule_id: matched.id,
      items,
      screen_name: screen.name,
      current_time: new Date().toISOString(),
    }, { headers: NO_STORE });
  } catch (error) {
    console.error('播放器 API 錯誤：', error);
    return NextResponse.json({
      status: 'error',
      message: '伺服器內部錯誤',
    }, { status: 500 });
  }
}
