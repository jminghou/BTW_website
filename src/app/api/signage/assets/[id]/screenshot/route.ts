import { NextRequest, NextResponse } from 'next/server';
import { getAssetById } from '@/lib/signage/db';
import { screenshotAssetUrl } from '@/lib/signage/screenshot';

/**
 * 素材轉檔（瀏覽器螢幕快照）
 * GET /api/signage/assets/[id]/screenshot
 *
 * 用無頭 Chromium 把素材 HTML 渲染後截成 PNG 回傳（附 attachment，瀏覽器直接下載）。
 * 截圖尺寸自動依素材的設計畫布決定（1920×1080 / 1080×1528 / 1528×1080…）。
 */
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60; // 啟動 Chromium + 渲染可能耗時，放寬到 60 秒

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const id = Number(params.id);
  if (!id || isNaN(id)) {
    return NextResponse.json({ success: false, message: '無效的 ID' }, { status: 400 });
  }

  const result = await getAssetById(id);
  if (!result.success || !result.data) {
    return NextResponse.json({ success: false, message: '找不到指定的素材' }, { status: 404 });
  }
  const asset = result.data as { id: number; filename: string; blob_url: string };

  // 用素材代理 URL 渲染：proxy 會把相對資源路徑改寫成絕對路徑、並回傳可內嵌的 text/html，
  // Chromium 直接載入即得到與前台 iframe 完全一致的畫面。
  const proxyUrl = `${req.nextUrl.origin}/api/signage/asset/${id}`;

  // 先取一次 HTML 原文用來偵測設計畫布尺寸
  let html = '';
  try {
    const r = await fetch(proxyUrl, { cache: 'no-store' });
    html = await r.text();
  } catch {
    /* 取不到也沒關係，截圖端會退回預設尺寸 */
  }

  try {
    const { buffer } = await screenshotAssetUrl(proxyUrl, html);
    const pngName = asset.filename.replace(/\.html?$/i, '') + '.png';
    const encoded = encodeURIComponent(pngName);
    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        'Content-Type': 'image/png',
        // filename* 用 UTF-8 編碼以正確處理中文檔名
        'Content-Disposition': `attachment; filename="${encoded}"; filename*=UTF-8''${encoded}`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    console.error('素材轉檔截圖失敗：', error);
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : '截圖失敗' },
      { status: 500 },
    );
  }
}
