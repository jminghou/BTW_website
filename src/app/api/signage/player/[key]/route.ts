import { NextRequest, NextResponse } from 'next/server';
import { getPlayerBundleByScreenKey } from '@/lib/signage/db';
import { matchSchedules } from '@/lib/signage/schedule';
import { assetProxyUrl } from '@/lib/signage/assetVersion';
import { signageMediaKind } from '@/lib/signage/mediaType';

/**
 * 配對結果不可放進永不過期的 Data Cache：換餐只看台灣時間，不會寫資料庫。
 * 每次回源仍查 DB（一趟 JOIN）。CDN 以路徑裡的 screen key 快取 60 秒，
 * 不同看板不會互拿內容。不設 stale-while-revalidate，避免換餐延遲超過 60 秒。
 * 先前 Data Cache 鍵在正式環境會把不同螢幕的清單撞在一起。
 */
export const dynamic = 'force-dynamic';
export const revalidate = 0;
/** 正常一趟查詢遠低於此。避免連線卡住時按配置記憶體一直計費。 */
export const maxDuration = 10;

const NO_STORE = {
  'Cache-Control': 'private, no-store, no-cache, must-revalidate',
  Pragma: 'no-cache',
  'CDN-Cache-Control': 'no-store',
  'Vercel-CDN-Cache-Control': 'no-store',
} as const;

/** 瀏覽器每次都問 CDN；同一個 screen key 在 60 秒內不回源。 */
const CDN_60 = {
  'Cache-Control': 'public, max-age=0, must-revalidate',
  'CDN-Cache-Control': 'public, s-maxage=60',
  'Vercel-CDN-Cache-Control': 'public, s-maxage=60',
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
    const bundleResult = await getPlayerBundleByScreenKey(key);
    if (!bundleResult.success) throw new Error('取得播放內容失敗');
    if (!bundleResult.data) {
      return NextResponse.json({
        status: 'error',
        message: '找不到對應的螢幕',
      }, { status: 404, headers: NO_STORE });
    }
    const { screen, schedules: bundleSchedules } = bundleResult.data;
    if (screen.unique_key && screen.unique_key !== key) {
      return NextResponse.json({
        status: 'error',
        message: '螢幕代碼不符',
      }, { status: 409, headers: NO_STORE });
    }

    const siteId = Number(screen.site_id);
    // 只播這台螢幕所屬廠區的清單與素材。別廠的排程、空清單同名補檔都不會進來。
    const schedules = bundleSchedules.filter(
      s => s.screen_id === screen.id && Number(s.playlist_site_id) === siteId,
    );

    const matched = matchSchedules(schedules);
    if (matched.length === 0) {
      return NextResponse.json({
        status: 'idle',
        message: '目前無排程',
        items: [],
        screen_key: key,
        screen_name: screen.name,
        current_time: new Date().toISOString(),
      }, { headers: CDN_60 });
    }

    const itemsByScheduleId = new Map(bundleSchedules.map(s => [s.id, s.items]));
    const withItems = matched
      .map(schedule => ({
        schedule,
        rows: (itemsByScheduleId.get(schedule.id) ?? []).filter(row => Number(row.site_id) === siteId),
      }))
      .filter(entry => entry.rows.length > 0);
    const rawItems = withItems.flatMap(entry => entry.rows);

    if (rawItems.length === 0) {
      return NextResponse.json({
        status: 'idle',
        message: '目前排程沒有可播放的素材',
        items: [],
        screen_key: key,
        screen_name: screen.name,
        current_time: new Date().toISOString(),
      }, { headers: CDN_60 });
    }

    const items = rawItems.map(it => ({
      url: `${assetProxyUrl(it.asset_id, it.blob_url)}&sk=${encodeURIComponent(key)}`,
      duration: it.duration_seconds,
      filename: it.filename,
      description: it.description,
      kind: signageMediaKind(it.filename),
    }));

    return NextResponse.json({
      status: 'playing',
      playlist_name: withItems.map(entry => entry.schedule.playlist_name).filter(Boolean).join(' + '),
      playlist_id: withItems[0].schedule.playlist_id,
      schedule_id: withItems[0].schedule.id,
      items,
      screen_key: key,
      screen_name: screen.name,
      current_time: new Date().toISOString(),
    }, { headers: CDN_60 });
  } catch (error) {
    console.error('播放器 API 錯誤：', error);
    return NextResponse.json({
      status: 'error',
      message: '伺服器內部錯誤',
    }, { status: 500, headers: NO_STORE });
  }
}
