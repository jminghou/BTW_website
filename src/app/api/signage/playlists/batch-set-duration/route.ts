import { NextRequest, NextResponse } from 'next/server';
import { batchSetPlaylistItemsDuration } from '@/lib/signage/db';

/**
 * 批次統一修改多個播放清單內所有項目的播放秒數
 * POST /api/signage/playlists/batch-set-duration
 * Body: { playlist_ids: number[], duration_seconds: number }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const playlistIds: number[] = Array.isArray(body?.playlist_ids)
      ? body.playlist_ids.map(Number).filter((n: number) => Number.isFinite(n) && n > 0)
      : [];

    const durationSeconds = Number(body?.duration_seconds);

    if (playlistIds.length === 0) {
      return NextResponse.json({ success: false, message: '未提供要更新的播放清單 ID' }, { status: 400 });
    }
    if (!Number.isFinite(durationSeconds) || durationSeconds < 1) {
      return NextResponse.json({ success: false, message: '播放秒數必須是大於 0 的數字' }, { status: 400 });
    }

    const result = await batchSetPlaylistItemsDuration(playlistIds, durationSeconds);
    if (!result.success) {
      return NextResponse.json({
        success: false,
        message: typeof result.error === 'string' ? result.error : '批次修改秒數失敗',
      }, { status: 500 });
    }

    const data = result.data as { playlist_count: number; item_count: number; duration_seconds: number };
    return NextResponse.json({
      success: true,
      message: `已將 ${data.playlist_count} 個播放清單共 ${data.item_count} 筆項目的秒數統一改為 ${data.duration_seconds} 秒`,
      data,
    });
  } catch (error) {
    console.error('批次修改秒數 API 錯誤：', error);
    return NextResponse.json({ success: false, message: '伺服器內部錯誤' }, { status: 500 });
  }
}
