import { NextRequest, NextResponse } from 'next/server';
import { replacePlaylistItems } from '@/lib/signage/db';

/**
 * 取代播放清單的所有項目（PUT-style replace）
 * POST /api/signage/playlists/[id]/items
 * Body: { items: [{ asset_id, duration_seconds, order }] }
 */
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const playlistId = Number(params.id);
    if (!playlistId || isNaN(playlistId)) {
      return NextResponse.json({ success: false, message: '無效的播放清單 ID' }, { status: 400 });
    }

    const body = await req.json();
    const items = Array.isArray(body?.items) ? body.items : [];

    type Item = { asset_id: number; duration_seconds: number; order: number };
    const normalized: Item[] = items
      .filter((it: unknown): it is Item => {
        const item = it as { asset_id?: unknown; duration_seconds?: unknown };
        return Number(item?.asset_id) > 0 && Number(item?.duration_seconds) > 0;
      })
      .map((it: Item, idx: number) => ({
        asset_id: Number(it.asset_id),
        duration_seconds: Number(it.duration_seconds),
        order: typeof it.order === 'number' ? it.order : idx,
      }));

    const result = await replacePlaylistItems(playlistId, normalized);
    if (result.success) {
      return NextResponse.json({ success: true, data: result.data, message: '播放清單已更新' });
    }
    return NextResponse.json({
      success: false,
      message: typeof result.error === 'string' ? result.error : '更新失敗',
    }, { status: 500 });
  } catch (error) {
    console.error('播放清單項目 API 錯誤：', error);
    return NextResponse.json({ success: false, message: '伺服器內部錯誤' }, { status: 500 });
  }
}
