import { NextRequest, NextResponse } from 'next/server';
import {
  getScreenByKey,
  getSchedulesByScreenKey,
  getPlaylistItemsByPlaylistId,
} from '@/lib/signage/db';
import { matchSchedules, type ScheduleRow } from '@/lib/signage/schedule';
import { assetProxyUrl } from '@/lib/signage/assetVersion';
import { signageMediaKind } from '@/lib/signage/mediaType';

/**
 * 播放器排程必須每次打 DB，不可走 Data Cache。
 * 先前快取鍵在正式環境會把不同螢幕的清單撞在一起，
 * 同一支網址在 A 電腦播櫃台菜單、B 電腦播到用餐區菲律賓餐。
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

const NO_STORE = {
  'Cache-Control': 'private, no-store, no-cache, must-revalidate',
  Pragma: 'no-cache',
  'CDN-Cache-Control': 'no-store',
  'Vercel-CDN-Cache-Control': 'no-store',
} as const;

export async function GET(
  req: NextRequest,
  { params }: { params: { key: string } },
) {
  const key = params.key;

  if (!key) {
    return NextResponse.json({
      status: 'error',
      message: '缺少 screen key 參數',
    }, { status: 400, headers: NO_STORE });
  }

  try {
    const screenResult = await getScreenByKey(key);
    if (!screenResult.success || !screenResult.data) {
      return NextResponse.json({
        status: 'error',
        message: '找不到對應的螢幕',
      }, { status: 404, headers: NO_STORE });
    }
    const screen = screenResult.data as unknown as ScreenRow;
    if (screen.unique_key && screen.unique_key !== key) {
      return NextResponse.json({
        status: 'error',
        message: '螢幕代碼不符',
      }, { status: 409, headers: NO_STORE });
    }

    const scheduleResult = await getSchedulesByScreenKey(key);
    if (!scheduleResult.success) throw new Error('取得排程失敗');
    const schedules = ((scheduleResult.data as unknown as ScheduleRow[]) ?? [])
      .filter(s => s.screen_id === screen.id);

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
      const result = await getPlaylistItemsByPlaylistId(schedule.playlist_id);
      if (!result.success) throw new Error('取得播放清單項目失敗');
      return (result.data as unknown as RawPlaylistItem[]) ?? [];
    }));
    const rawItems = itemLists.flat();

    const items = rawItems.map(it => ({
      url: `${assetProxyUrl(it.asset_id, it.blob_url)}&sk=${encodeURIComponent(key)}`,
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
