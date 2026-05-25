import { NextRequest, NextResponse } from 'next/server';
import { uploadAsset } from '@/lib/signage/storage';
import { createAsset, getSites } from '@/lib/signage/db';

/**
 * 上傳素材
 * POST /api/signage/assets/upload
 *
 * Body (multipart/form-data):
 *   - file: 檔案 (.html)
 *   - site_id: 廠區 ID（必填）
 *   - description: 說明（選填）
 *
 * 支援同時上傳多個檔案：欄位名稱 file 重複出現
 */
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const siteIdStr = formData.get('site_id');
    const description = formData.get('description');
    const files = formData.getAll('file').filter((v): v is File => v instanceof File);

    if (!siteIdStr) {
      return NextResponse.json({ success: false, message: '缺少 site_id' }, { status: 400 });
    }
    if (files.length === 0) {
      return NextResponse.json({ success: false, message: '未上傳任何檔案' }, { status: 400 });
    }

    const siteId = Number(siteIdStr);
    const sitesResult = await getSites();
    if (!sitesResult.success || !sitesResult.data) {
      return NextResponse.json({ success: false, message: '無法讀取廠區' }, { status: 500 });
    }
    const site = (sitesResult.data as Array<{ id: number; code: string }>).find(s => s.id === siteId);
    if (!site) {
      return NextResponse.json({ success: false, message: '找不到指定的廠區' }, { status: 404 });
    }

    const uploaded: unknown[] = [];
    const failed: { filename: string; error: string }[] = [];

    for (const file of files) {
      // 基本驗證：副檔名與大小
      if (!file.name.toLowerCase().endsWith('.html')) {
        failed.push({ filename: file.name, error: '僅支援 .html 檔案' });
        continue;
      }
      if (file.size > 50 * 1024 * 1024) {
        failed.push({ filename: file.name, error: '檔案超過 50 MB' });
        continue;
      }

      const blobResult = await uploadAsset(site.code, file.name, file);
      if (!blobResult.success) {
        failed.push({ filename: file.name, error: '上傳到 Blob 失敗' });
        continue;
      }

      const dbResult = await createAsset({
        site_id: siteId,
        filename: file.name,
        blob_url: blobResult.url,
        description: typeof description === 'string' ? description : undefined,
      });

      if (!dbResult.success) {
        failed.push({ filename: file.name, error: '寫入資料庫失敗' });
        continue;
      }

      uploaded.push(dbResult.data);
    }

    return NextResponse.json({
      success: failed.length === 0,
      message: failed.length === 0
        ? `成功上傳 ${uploaded.length} 個檔案`
        : `${uploaded.length} 個成功、${failed.length} 個失敗`,
      data: { uploaded, failed },
    }, { status: failed.length === 0 ? 201 : 207 });
  } catch (error) {
    console.error('上傳素材 API 錯誤：', error);
    return NextResponse.json({
      success: false,
      message: '伺服器內部錯誤',
      error: error instanceof Error ? error.message : String(error),
    }, { status: 500 });
  }
}
