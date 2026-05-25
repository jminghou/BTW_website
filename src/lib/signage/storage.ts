import { put, del } from '@vercel/blob';

/**
 * Vercel Blob 儲存封裝
 * 路徑慣例：signage/{site_code}/{filename}
 *
 * 需要環境變數：BLOB_READ_WRITE_TOKEN
 * 取得方式：Vercel Dashboard → Storage → Blob → Create Store
 */

export async function uploadAsset(
  siteCode: string,
  filename: string,
  data: File | Blob | ArrayBuffer | Buffer,
): Promise<{ success: true; url: string } | { success: false; error: unknown }> {
  try {
    const safeSite = siteCode.replace(/[^a-zA-Z0-9_-]/g, '_');
    const safeName = filename.replace(/[^\w.\-一-龥]/g, '_');
    const path = `signage/${safeSite}/${Date.now()}_${safeName}`;

    const blob = await put(path, data as Blob, {
      access: 'public',
      contentType: 'text/html; charset=utf-8',
      addRandomSuffix: false,
    });

    return { success: true, url: blob.url };
  } catch (error) {
    console.error('Vercel Blob 上傳失敗：', error);
    return { success: false, error };
  }
}

export async function deleteAssetBlob(url: string): Promise<{ success: boolean; error?: unknown }> {
  try {
    await del(url);
    return { success: true };
  } catch (error) {
    console.error('Vercel Blob 刪除失敗：', error);
    return { success: false, error };
  }
}
