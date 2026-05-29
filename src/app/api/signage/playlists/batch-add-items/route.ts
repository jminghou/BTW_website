import { NextRequest, NextResponse } from 'next/server';
import { batchAppendItemsToPlaylists } from '@/lib/signage/db';

/**
 * 批次將同一組素材附加到多個既有播放清單的尾端
 * POST /api/signage/playlists/batch-add-items
 * Body: { playlist_ids: number[], items: [{ asset_id, duration_seconds }] }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const playlistIds: number[] = Array.isArray(body?.playlist_ids)
      ? body.playlist_ids.map(Number).filter((n: number) => Number.isFinite(n) && n > 0)
      : [];

    type RawItem = { asset_id?: unknown; duration_seconds?: unknown };
    const items = Array.isArray(body?.items)
      ? (body.items as RawItem[])
          .map(it => ({
            asset_id: Number(it?.asset_id),
            duration_seconds: Number(it?.duration_seconds),
          }))
          .filter(it => it.asset_id > 0 && it.duration_seconds > 0)
      : [];

    if (playlistIds.length === 0) {
      return NextResponse.json({ success: false, message: '未提供要更新的播放清單 ID' }, { status: 400 });
    }
    if (items.length === 0) {
      return NextResponse.json({ success: false, message: '未提供要加入的素材' }, { status: 400 });
    }

    const result = await batchAppendItemsToPlaylists(playlistIds, items);
    if (!result.success) {
      return NextResponse.json({
        success: false,
        message: typeof result.error === 'string' ? result.error : '批次加入失敗',
      }, { status: 500 });
    }

    const data = result.data as { playlist_count: number; item_count: number; inserted: number };
    return NextResponse.json({
      success: true,
      message: `已將 ${data.item_count} 個素材附加到 ${data.playlist_count} 個播放清單（共新增 ${data.inserted} 筆項目）`,
      data,
    });
  } catch (error) {
    console.error('批次加入素材 API 錯誤：', error);
    return NextResponse.json({ success: false, message: '伺服器內部錯誤' }, { status: 500 });
  }
}
