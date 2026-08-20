import { NextRequest, NextResponse } from 'next/server';
import { deleteDisconnectedPlaylistsBySite } from '@/lib/signage/db';

/**
 * 刪除指定廠區內已沒有任何有效素材的播放清單
 * POST /api/signage/playlists/delete-disconnected
 * Body: { site_id: number }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const siteId = Number(body?.site_id);

    if (!siteId || Number.isNaN(siteId)) {
      return NextResponse.json(
        { success: false, message: '缺少或無效的 site_id' },
        { status: 400 },
      );
    }

    const result = await deleteDisconnectedPlaylistsBySite(siteId);
    if (!result.success) {
      return NextResponse.json({
        success: false,
        message: '刪除失聯列表失敗',
        error: result.error,
      }, { status: 500 });
    }

    const deleted = (result.data as Array<{ id: number; name: string }>) ?? [];
    return NextResponse.json({
      success: true,
      message: deleted.length > 0
        ? `已刪除 ${deleted.length} 個失聯列表`
        : '沒有發現失聯列表',
      data: { count: deleted.length },
    });
  } catch (error) {
    console.error('刪除失聯列表 API 錯誤：', error);
    return NextResponse.json(
      { success: false, message: '伺服器內部錯誤' },
      { status: 500 },
    );
  }
}
