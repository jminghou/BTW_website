import { NextRequest, NextResponse } from 'next/server';
import { autoCreatePlaylistsFromAssets } from '@/lib/signage/db';

/**
 * 一鍵素材轉列表
 * POST /api/signage/playlists/auto-create
 * Body: { site_id: number, duration?: number }（duration 預設 180）
 *
 * 為該廠區每個素材各建一個同名播放清單（含 1 個 item，預設 180 秒），同名已存在則跳過。
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const siteId = Number(body?.site_id);
    const duration = body?.duration ? Number(body.duration) : 180;

    if (!siteId || isNaN(siteId)) {
      return NextResponse.json({ success: false, message: '缺少或無效的 site_id' }, { status: 400 });
    }

    const result = await autoCreatePlaylistsFromAssets(siteId, duration);
    if (!result.success) {
      return NextResponse.json({ success: false, message: '一鍵轉換失敗', error: result.error }, { status: 500 });
    }

    const { created, skipped } = result.data as { created: number; skipped: number };
    return NextResponse.json({
      success: true,
      message: `新增 ${created} 個清單，略過 ${skipped} 個已存在`,
      data: result.data,
    }, { status: 201 });
  } catch (error) {
    console.error('一鍵素材轉列表 API 錯誤：', error);
    return NextResponse.json({ success: false, message: '伺服器內部錯誤' }, { status: 500 });
  }
}
