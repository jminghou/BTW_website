import { NextRequest, NextResponse } from 'next/server';
import { createPlaylistsFromAssetIds } from '@/lib/signage/db';

/**
 * 將選取的素材各轉成一個同名播放清單（批次寫入，不會逾時）
 * POST /api/signage/playlists/create-from-assets
 * Body: { asset_ids: number[], duration?: number }（duration 預設 180）
 *
 * 同廠區已有同名清單者略過。建議一次選 10~50 個。
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const assetIds: number[] = Array.isArray(body?.asset_ids)
      ? body.asset_ids.map(Number).filter((n: number) => Number.isFinite(n) && n > 0)
      : [];
    const duration = body?.duration ? Number(body.duration) : 180;

    if (assetIds.length === 0) {
      return NextResponse.json({ success: false, message: '未提供要轉換的素材' }, { status: 400 });
    }

    const result = await createPlaylistsFromAssetIds(assetIds, duration);
    if (!result.success) {
      return NextResponse.json({
        success: false,
        message: typeof result.error === 'string' ? result.error : '素材轉列表失敗',
      }, { status: 500 });
    }

    const { created, skipped } = result.data as { created: number; skipped: number };
    return NextResponse.json({
      success: true,
      message: `新增 ${created} 個播放清單，略過 ${skipped} 個（已存在同名或重複）`,
      data: result.data,
    }, { status: 201 });
  } catch (error) {
    console.error('素材轉列表 API 錯誤：', error);
    return NextResponse.json({ success: false, message: '伺服器內部錯誤' }, { status: 500 });
  }
}
