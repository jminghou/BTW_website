import { NextRequest, NextResponse } from 'next/server';
import { autoGenerateSchedulesFromPlaylists } from '@/lib/signage/db';

/**
 * 一鍵列表轉排程
 * POST /api/signage/schedules/auto-generate
 * Body: { site_id: number, screen_id: number, mode?: 'daily' | 'weekly', playlist_ids?: number[] }
 *
 * daily：依 *_[BLDN]_YYYY-MM-DD.html 排單日
 * weekly：依 *_[BLDN]_YYYY-MM-DD_YYYY-MM-DD.html 排滿日期區間每一天
 * 只套用到指定螢幕；playlist_ids 可再限縮要用的清單。
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const siteId = Number(body?.site_id);
    const screenId = Number(body?.screen_id);
    const mode = body?.mode === 'weekly' ? 'weekly' : 'daily';
    const playlistIds = Array.isArray(body?.playlist_ids)
      ? body.playlist_ids.map(Number).filter((id: number) => Number.isFinite(id) && id > 0)
      : undefined;

    if (!siteId || isNaN(siteId)) {
      return NextResponse.json({ success: false, message: '缺少或無效的 site_id' }, { status: 400 });
    }
    if (!screenId || isNaN(screenId)) {
      return NextResponse.json({ success: false, message: '請先選擇要產生排程的螢幕' }, { status: 400 });
    }

    const result = await autoGenerateSchedulesFromPlaylists(siteId, mode, {
      screenId,
      playlistIds,
    });
    if (!result.success) {
      return NextResponse.json({
        success: false,
        message: typeof result.error === 'string' ? result.error : '一鍵轉排程失敗',
      }, { status: typeof result.error === 'string' ? 400 : 500 });
    }

    const { created, updated, skipped } = result.data as { created: number; updated: number; skipped: number };
    return NextResponse.json({
      success: true,
      message: `新增 ${created} 筆排程、補填 ${updated} 筆、略過 ${skipped} 筆`,
      data: result.data,
    }, { status: 201 });
  } catch (error) {
    console.error('一鍵列表轉排程 API 錯誤：', error);
    return NextResponse.json({ success: false, message: '伺服器內部錯誤' }, { status: 500 });
  }
}
