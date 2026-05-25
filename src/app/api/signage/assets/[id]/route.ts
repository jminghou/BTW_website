import { NextRequest, NextResponse } from 'next/server';
import { deleteAsset } from '@/lib/signage/db';
import { deleteAssetBlob } from '@/lib/signage/storage';

/**
 * 刪除單一素材（同時刪除 DB 紀錄與 Vercel Blob）
 * DELETE /api/signage/assets/[id]
 */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const id = Number(params.id);
    if (!id || isNaN(id)) {
      return NextResponse.json({ success: false, message: '無效的 ID' }, { status: 400 });
    }

    const dbResult = await deleteAsset(id);
    if (!dbResult.success) {
      return NextResponse.json({
        success: false,
        message: typeof dbResult.error === 'string' ? dbResult.error : '刪除失敗',
      }, { status: 404 });
    }

    // 嘗試刪除 Blob（失敗不影響整體成功）
    const blobUrl = (dbResult.data as { blob_url?: string } | undefined)?.blob_url;
    if (blobUrl) {
      await deleteAssetBlob(blobUrl);
    }

    return NextResponse.json({ success: true, message: '素材已刪除' });
  } catch (error) {
    console.error('刪除素材 API 錯誤：', error);
    return NextResponse.json({ success: false, message: '伺服器內部錯誤' }, { status: 500 });
  }
}
