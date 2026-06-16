import { NextRequest, NextResponse } from 'next/server';
import { deleteAsset, getAssetById, getSiteById, updateAssetBlobUrl } from '@/lib/signage/db';
import { deleteAssetBlob, uploadAsset } from '@/lib/signage/storage';

/**
 * 取得單一素材的原始 HTML 內容（供後台編輯用）
 * GET /api/signage/assets/[id]
 *
 * 回傳 Blob 內的原始 HTML（不改寫相對路徑），讓使用者編輯實際存檔的程式碼。
 */
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = Number(params.id);
    if (!id || isNaN(id)) {
      return NextResponse.json({ success: false, message: '無效的 ID' }, { status: 400 });
    }

    const result = await getAssetById(id);
    if (!result.success || !result.data) {
      return NextResponse.json({ success: false, message: '找不到指定的素材' }, { status: 404 });
    }

    const asset = result.data as { id: number; filename: string; blob_url: string };
    const blobRes = await fetch(asset.blob_url, { cache: 'no-store' });
    if (!blobRes.ok) {
      return NextResponse.json(
        { success: false, message: `讀取 Blob 失敗（${blobRes.status}）` },
        { status: 502 },
      );
    }
    const html = await blobRes.text();

    return NextResponse.json({
      success: true,
      data: { id: asset.id, filename: asset.filename, html },
    });
  } catch (error) {
    console.error('取得素材內容 API 錯誤：', error);
    return NextResponse.json({ success: false, message: '伺服器內部錯誤' }, { status: 500 });
  }
}

/**
 * 更新單一素材的 HTML 內容
 * PUT /api/signage/assets/[id]
 * Body (JSON): { html: string }
 *
 * 作法：把新內容上傳成「新的」Blob、改寫 DB 的 blob_url、再刪除舊 Blob。
 * 不直接覆寫同一個 Blob URL，避免 CDN 仍回傳舊內容的快取問題。
 */
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = Number(params.id);
    if (!id || isNaN(id)) {
      return NextResponse.json({ success: false, message: '無效的 ID' }, { status: 400 });
    }

    const body = await req.json().catch(() => null);
    const html = body?.html;
    if (typeof html !== 'string') {
      return NextResponse.json({ success: false, message: '缺少要儲存的 HTML 內容' }, { status: 400 });
    }

    const assetResult = await getAssetById(id);
    if (!assetResult.success || !assetResult.data) {
      return NextResponse.json({ success: false, message: '找不到指定的素材' }, { status: 404 });
    }
    const asset = assetResult.data as { id: number; site_id: number | null; filename: string; blob_url: string };

    // 取得廠區代號作為 Blob 路徑前綴（沒有所屬廠區時退回 'shared'）
    let siteCode = 'shared';
    if (asset.site_id != null) {
      const siteResult = await getSiteById(asset.site_id);
      if (siteResult.success && siteResult.data) {
        siteCode = (siteResult.data as { code: string }).code;
      }
    }

    // 上傳成新的 Blob
    const uploadResult = await uploadAsset(siteCode, asset.filename, Buffer.from(html, 'utf-8'));
    if (!uploadResult.success) {
      return NextResponse.json({ success: false, message: '上傳到 Blob 失敗' }, { status: 502 });
    }

    // 更新 DB 指向新的 Blob
    const updateResult = await updateAssetBlobUrl(id, uploadResult.url);
    if (!updateResult.success) {
      // 寫入 DB 失敗就把剛上傳的新 Blob 清掉，避免孤兒檔
      await deleteAssetBlob(uploadResult.url);
      return NextResponse.json({ success: false, message: '寫入資料庫失敗' }, { status: 500 });
    }

    // 刪除舊 Blob（失敗不影響整體成功）
    if (asset.blob_url && asset.blob_url !== uploadResult.url) {
      await deleteAssetBlob(asset.blob_url);
    }

    return NextResponse.json({ success: true, message: '已儲存', data: updateResult.data });
  } catch (error) {
    console.error('更新素材內容 API 錯誤：', error);
    return NextResponse.json({ success: false, message: '伺服器內部錯誤' }, { status: 500 });
  }
}

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
