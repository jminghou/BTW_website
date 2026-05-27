import { NextRequest, NextResponse } from 'next/server';
import { batchDeletePlaylists } from '@/lib/signage/db';

/**
 * 批次刪除播放清單
 * POST /api/signage/playlists/batch-delete
 * Body: { ids: number[] }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const ids: number[] = Array.isArray(body?.ids) ? body.ids.map(Number).filter(Boolean) : [];

    if (ids.length === 0) {
      return NextResponse.json({ success: false, message: '未提供要刪除的 ID' }, { status: 400 });
    }

    const result = await batchDeletePlaylists(ids);
    if (!result.success) {
      return NextResponse.json({ success: false, message: '批次刪除失敗', error: result.error }, { status: 500 });
    }

    const deleted = (result.data as unknown[]) ?? [];
    return NextResponse.json({
      success: true,
      message: `成功刪除 ${deleted.length} 個播放清單`,
      data: { count: deleted.length },
    });
  } catch (error) {
    console.error('批次刪除播放清單 API 錯誤：', error);
    return NextResponse.json({ success: false, message: '伺服器內部錯誤' }, { status: 500 });
  }
}
