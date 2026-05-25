import { NextRequest, NextResponse } from 'next/server';
import { batchDeleteAssets } from '@/lib/signage/db';
import { deleteAssetBlob } from '@/lib/signage/storage';

/**
 * 批次刪除素材
 * POST /api/signage/assets/batch-delete
 * Body: { ids: number[] }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const ids: number[] = Array.isArray(body?.ids) ? body.ids.map(Number).filter(Boolean) : [];

    if (ids.length === 0) {
      return NextResponse.json({ success: false, message: '未提供要刪除的 ID' }, { status: 400 });
    }

    const dbResult = await batchDeleteAssets(ids);
    if (!dbResult.success) {
      return NextResponse.json({
        success: false,
        message: '批次刪除失敗',
        error: dbResult.error,
      }, { status: 500 });
    }

    // 並行刪除 Blob（不阻塞、不影響整體成功）
    const deleted = (dbResult.data as Array<{ blob_url?: string }>) ?? [];
    await Promise.allSettled(deleted.map(d => d.blob_url ? deleteAssetBlob(d.blob_url) : null));

    return NextResponse.json({
      success: true,
      message: `成功刪除 ${deleted.length} 個素材`,
      data: { count: deleted.length },
    });
  } catch (error) {
    console.error('批次刪除素材 API 錯誤：', error);
    return NextResponse.json({ success: false, message: '伺服器內部錯誤' }, { status: 500 });
  }
}
