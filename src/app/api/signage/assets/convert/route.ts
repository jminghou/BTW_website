import { NextRequest, NextResponse } from 'next/server';
import { uploadAsset } from '@/lib/signage/storage';
import { createAsset, getSites } from '@/lib/signage/db';
import { templates, DEFAULT_TEMPLATE, type MealItem, type ConvertedMenu } from '@/lib/signage/templates';

/** 一次最多同時進行的上傳數，避免一次打爆 Blob / Neon 連線 */
const UPLOAD_CONCURRENCY = 8;

/**
 * 受限併發的平行 map：把 items 切成每批 limit 個，批次內平行、批次間循序。
 */
async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<R>,
): Promise<R[]> {
  const results: R[] = [];
  for (let i = 0; i < items.length; i += limit) {
    const batch = items.slice(i, i + limit);
    const settled = await Promise.all(batch.map(fn));
    results.push(...settled);
  }
  return results;
}

/**
 * 上傳餐點資料 JSON，自動轉成菜單 HTML 並存為素材
 * POST /api/signage/assets/convert
 *
 * Body (multipart/form-data):
 *   - site_id: 廠區 ID（必填）
 *   - template: 版型 key（選填，預設 vis3）
 *   - file: 一個或多個 .json 檔
 *
 * 一個 JSON 可能依「據點+時段+日期」拆成多份菜單 HTML，各自存成素材。
 * 轉檔（CPU）循序進行；上傳 Blob + 寫資料庫（IO）以受限併發平行進行，避免逾時。
 */
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const siteIdStr = formData.get('site_id');
    const templateKey = (formData.get('template') as string) || DEFAULT_TEMPLATE;
    const files = formData.getAll('file').filter((v): v is File => v instanceof File);

    if (!siteIdStr) {
      return NextResponse.json({ success: false, message: '缺少 site_id' }, { status: 400 });
    }
    if (files.length === 0) {
      return NextResponse.json({ success: false, message: '未上傳任何 JSON 檔' }, { status: 400 });
    }

    const template = templates[templateKey];
    if (!template) {
      return NextResponse.json({ success: false, message: `未知的版型：${templateKey}` }, { status: 400 });
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

    const uploaded: { filename: string; warnings: string[] }[] = [];
    const failed: { filename: string; error: string }[] = [];

    // ---- 第一階段（循序、快速）：解析 JSON + 轉檔，攤平成菜單任務清單 ----
    const tasks: { menu: ConvertedMenu; sourceName: string }[] = [];

    for (const file of files) {
      if (!file.name.toLowerCase().endsWith('.json')) {
        failed.push({ filename: file.name, error: '僅支援 .json 檔案' });
        continue;
      }

      let meals: MealItem[];
      try {
        const text = await file.text();
        meals = JSON.parse(text);
      } catch {
        failed.push({ filename: file.name, error: 'JSON 格式錯誤，無法解析' });
        continue;
      }

      try {
        for (const menu of template.convert(meals)) {
          tasks.push({ menu, sourceName: file.name });
        }
      } catch (err) {
        failed.push({
          filename: file.name,
          error: err instanceof Error ? err.message : '轉檔失敗',
        });
      }
    }

    // ---- 第二階段（受限併發、平行）：上傳 Blob + 寫資料庫 ----
    const outcomes = await mapWithConcurrency(tasks, UPLOAD_CONCURRENCY, async ({ menu, sourceName }) => {
      const htmlBlob = new Blob([menu.html], { type: 'text/html; charset=utf-8' });
      const blobResult = await uploadAsset(site.code, menu.filename, htmlBlob);
      if (!blobResult.success) {
        return { ok: false as const, filename: menu.filename, error: '上傳到 Blob 失敗' };
      }

      const dbResult = await createAsset({
        site_id: siteId,
        filename: menu.filename,
        blob_url: blobResult.url,
        description: `由 ${sourceName} 自動轉檔（${menu.meta.location} ${menu.meta.mealTime} ${menu.meta.date}）`,
      });
      if (!dbResult.success) {
        return { ok: false as const, filename: menu.filename, error: '寫入資料庫失敗' };
      }

      return { ok: true as const, filename: menu.filename, warnings: menu.meta.warnings };
    });

    for (const o of outcomes) {
      if (o.ok) uploaded.push({ filename: o.filename, warnings: o.warnings });
      else failed.push({ filename: o.filename, error: o.error });
    }

    return NextResponse.json({
      success: failed.length === 0,
      message: failed.length === 0
        ? `成功產生 ${uploaded.length} 個菜單`
        : `${uploaded.length} 個成功、${failed.length} 個失敗`,
      data: { uploaded, failed },
    }, { status: failed.length === 0 ? 201 : 207 });
  } catch (error) {
    console.error('JSON 轉檔 API 錯誤：', error);
    return NextResponse.json({
      success: false,
      message: '伺服器內部錯誤',
      error: error instanceof Error ? error.message : String(error),
    }, { status: 500 });
  }
}
