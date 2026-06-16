import { NextRequest, NextResponse } from 'next/server';
import {
  getScreenByKey,
  getSchedulesByScreenKey,
  getPlaylistItemsByPlaylistId,
} from '@/lib/signage/db';
import { matchSchedule, type ScheduleRow } from '@/lib/signage/schedule';
import { assetProxyUrl } from '@/lib/signage/assetVersion';

/**
 * 強制每次請求都即時查資料庫，不走 Next.js 的 Data Cache。
 *
 * 為什麼必要：
 *   GET Route Handler 內的 DB 讀取預設會被 Next.js 快取，且不會自動失效。
 *   曾發生「播放清單已改成 2 個項目，但播放器一直讀到 playlist 建立當下的
 *   舊狀態（1 個項目、180 秒）」→ 螢幕只播第一頁。
 *   標記 force-dynamic + revalidate=0 可關閉框架層快取，確保排程/清單即時生效。
 *
 *   注意：下方仍對「回應本身」設 Cache-Control s-maxage=60，
 *   那是 CDN 邊緣快取（最多延遲 60 秒，刻意保留以減少 Neon 連線），
 *   與這裡關閉的「資料讀取快取」是不同層級，兩者並存沒有衝突。
 */
export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * 播放器核心 API
 * GET /api/signage/player/[key]
 *
 * 對應 v2.0 backend/api/player.py:get_current_schedule
 * 由螢幕端定期輪詢，回傳當前該播放的清單
 *
 * 加 Cache-Control: max-age=60 讓 Vercel Edge 與瀏覽器可快取一分鐘
 * → 降低對 Neon DB 的擊穿次數（讓 DB 能 auto-suspend 省運算時數）
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
    // 1. 找螢幕
    const screenResult = await getScreenByKey(key);
    if (!screenResult.success || !screenResult.data) {
      return NextResponse.json({
        status: 'error',
        message: '找不到對應的螢幕',
      }, { status: 404 });
    }
    const screen = screenResult.data as { id: number; name: string };

    // 2. 取該螢幕所有排程
    const schedulesResult = await getSchedulesByScreenKey(key);
    if (!schedulesResult.success) {
      return NextResponse.json({
        status: 'error',
        message: '取得排程失敗',
      }, { status: 500 });
    }
    const schedules = (schedulesResult.data as unknown as ScheduleRow[]) ?? [];

    // 3. 匹配當前排程
    const matched = matchSchedule(schedules);
    if (!matched) {
      return NextResponse.json({
        status: 'idle',
        message: '目前無排程',
        items: [],
        screen_name: screen.name,
        current_time: new Date().toISOString(),
      }, {
        headers: { 'Cache-Control': 'public, max-age=60, s-maxage=60' },
      });
    }

    // 4. 取出該排程對應的播放清單項目
    const itemsResult = await getPlaylistItemsByPlaylistId(matched.playlist_id);
    if (!itemsResult.success) {
      return NextResponse.json({
        status: 'error',
        message: '取得播放清單項目失敗',
      }, { status: 500 });
    }
    const rawItems = (itemsResult.data as unknown as Array<{
      asset_id: number;
      filename: string;
      blob_url: string;
      duration_seconds: number;
      description: string | null;
    }>) ?? [];

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
    }, {
      headers: { 'Cache-Control': 'public, max-age=60, s-maxage=60' },
    });
  } catch (error) {
    console.error('播放器 API 錯誤：', error);
    return NextResponse.json({
      status: 'error',
      message: '伺服器內部錯誤',
    }, { status: 500 });
  }
}
