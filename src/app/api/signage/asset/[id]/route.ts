import { NextRequest, NextResponse } from 'next/server';
import { getAssetById } from '@/lib/signage/db';

/**
 * 素材 HTML 代理路由
 * GET /api/signage/asset/[id]
 *
 * 為什麼需要 proxy？
 *   Vercel Blob 對 .html 檔案預設回傳 `Content-Disposition: attachment`
 *   （安全機制：防止瀏覽器執行任意 HTML 造成 XSS 風險）
 *   → 瀏覽器或 iframe 載入時會觸發下載而不是渲染
 *
 *   這個代理路由把 .html 從 Blob 抓回來，
 *   重新加上 `Content-Type: text/html` 與 inline disposition，
 *   讓 iframe 能正常嵌入顯示。
 */
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const id = Number(params.id);
  if (!id || isNaN(id)) {
    return new NextResponse('Invalid asset id', { status: 400 });
  }

  const result = await getAssetById(id);
  if (!result.success || !result.data) {
    return new NextResponse('Asset not found', { status: 404 });
  }

  const blobUrl = (result.data as { blob_url: string }).blob_url;

  try {
    const blobRes = await fetch(blobUrl);
    if (!blobRes.ok) {
      return new NextResponse(`Failed to fetch from Blob (${blobRes.status})`, { status: 502 });
    }

    const html = await blobRes.text();

    // 把菜單 HTML 內指向共用資源的相對路徑改寫為絕對路徑
    //   ../../css/x.css  →  /signage-assets/css/x.css
    //   ../../js/y.js    →  /signage-assets/js/y.js
    //   ../../pic/z.png  →  /signage-assets/pic/z.png
    // 容忍任意層數的 ../；菜單圖片用的 https:// 絕對 URL 不受影響。
    // CSS 內部的 ../font、../pic 不在 HTML 內，由瀏覽器相對於
    // /signage-assets/css/ 自動解析，無需在此改寫。
    const rewritten = html.replace(
      /(?:\.\.\/)+(css|js|pic|font)\//g,
      '/signage-assets/$1/',
    );

    return new NextResponse(rewritten, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Disposition': 'inline',
        'Cache-Control': 'public, max-age=300, s-maxage=300',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (error) {
    console.error('素材代理錯誤：', error);
    return new NextResponse('Server error', { status: 500 });
  }
}
