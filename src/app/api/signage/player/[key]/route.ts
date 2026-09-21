import { NextRequest, NextResponse } from 'next/server';
import {
  getScreenByKey,
  getSchedulesByScreenKey,
  getPlaylistItemsByPlaylistId,
} from '@/lib/signage/db';
import { matchSchedules, type ScheduleRow } from '@/lib/signage/schedule';
import { assetProxyUrl } from '@/lib/signage/assetVersion';
import { signageMediaKind } from '@/lib/signage/mediaType';
import { createSignageCached, revalidateSignage } from '@/lib/signage/cache';

/**
 * 這支路由必須每次請求都真的執行（排程比對相依於「現在幾點」，不能整包快取回應）。
 * 但「執行」不等於「查 DB」：下方三筆讀取都走 Data Cache，
 * 平常命中完全不碰資料庫，後台一寫入就自動失效。
 *
 * 快取必須在模組層建立，並把螢幕 key / playlist id 當函式引數傳入；
 * 否則正式環境 minify 後不同螢幕會撞成同一格，A 電腦播櫃台、B 電腦播到用餐區。
 */
export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface ScreenRow {
  id: number;
  name: string;
  unique_key: string;
}

interface RawPlaylistItem {
  asset_id: number;
  filename: string;
  blob_url: string;
  duration_seconds: number;
  description: string | null;
}

const loadScreen = createSignageCached('screen', async (key: string) => {
  const result = await getScreenByKey(key);
  if (result.success && result.data) return result.data as unknown as ScreenRow;
  if (result.error === '找不到指定的螢幕') return null;
  throw new Error('讀取螢幕資料失敗');
});

const loadSchedules = createSignageCached('schedules', async (key: string) => {
  const result = await getSchedulesByScreenKey(key);
  if (!result.success) throw new Error('取得排程失敗');
  return (result.data as unknown as ScheduleRow[]) ?? [];
});

const loadPlaylistItems = createSignageCached('playlist-items', async (playlistId: string) => {
  const result = await getPlaylistItemsByPlaylistId(Number(playlistId));
  if (!result.success) throw new Error('取得播放清單項目失敗');
  return (result.data as unknown as RawPlaylistItem[]) ?? [];
});

/**
 * 刻意不做 CDN 快取。
 *
 * 省 DB 的工作已經由 Data Cache 接手（輪詢命中時 0 次查詢），
 * 這裡再加 s-maxage 只會有壞處：手動設定的 Cache-Control 會在 CDN 產生
 * 一個 revalidateTag purge 不到的快取條目，讓後台改好的排程被卡住到期為止。
 */
const NO_STORE = {
  'Cache-Control': 'private, no-store, no-cache, must-revalidate',
  Pragma: 'no-cache',
  'CDN-Cache-Control': 'no-store',
  'Vercel-CDN-Cache-Control': 'no-store',
} as const;

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
    let [screen, schedules] = await Promise.all([
      loadScreen(key),
      loadSchedules(key),
    ]);
    if (!screen) {
      return NextResponse.json({
        status: 'error',
        message: '找不到對應的螢幕',
      }, { status: 404, headers: NO_STORE });
    }

    // Data Cache 若把別台螢幕寫進同一格，這裡打回 DB，避免櫃台播到用餐區清單。
    if (screen.unique_key && screen.unique_key !== key) {
      revalidateSignage();
      const freshScreen = await getScreenByKey(key);
      if (!freshScreen.success || !freshScreen.data) {
        return NextResponse.json({
          status: 'error',
          message: '找不到對應的螢幕',
        }, { status: 404, headers: NO_STORE });
      }
      screen = freshScreen.data as unknown as ScreenRow;
    }
    if (schedules.some(s => s.screen_id !== screen.id)) {
      const fresh = await getSchedulesByScreenKey(key);
      if (!fresh.success) throw new Error('取得排程失敗');
      schedules = (fresh.data as unknown as ScheduleRow[]) ?? [];
      revalidateSignage();
    }
    schedules = schedules.filter(s => s.screen_id === screen.id);

    const matched = matchSchedules(schedules);
    if (matched.length === 0) {
      return NextResponse.json({
        status: 'idle',
        message: '目前無排程',
        items: [],
        screen_key: key,
        screen_name: screen.name,
        current_time: new Date().toISOString(),
      }, { headers: NO_STORE });
    }

    const itemLists = await Promise.all(matched.map(async (schedule) => {
      let rawItems = await loadPlaylistItems(String(schedule.playlist_id));
      if (rawItems.length === 0) {
        const fresh = await getPlaylistItemsByPlaylistId(schedule.playlist_id);
        if (fresh.success && Array.isArray(fresh.data) && fresh.data.length > 0) {
          rawItems = fresh.data as unknown as RawPlaylistItem[];
          revalidateSignage();
        }
      }
      return rawItems;
    }));
    const rawItems = itemLists.flat();

    const items = rawItems.map(it => ({
      url: assetProxyUrl(it.asset_id, it.blob_url),
      duration: it.duration_seconds,
      filename: it.filename,
      description: it.description,
      kind: signageMediaKind(it.filename),
    }));

    return NextResponse.json({
      status: 'playing',
      playlist_name: matched.map(s => s.playlist_name).filter(Boolean).join(' + '),
      playlist_id: matched[0].playlist_id,
      schedule_id: matched[0].id,
      items,
      screen_key: key,
      screen_name: screen.name,
      current_time: new Date().toISOString(),
    }, { headers: NO_STORE });
  } catch (error) {
    console.error('播放器 API 錯誤：', error);
    return NextResponse.json({
      status: 'error',
      message: '伺服器內部錯誤',
    }, { status: 500, headers: NO_STORE });
  }
}
