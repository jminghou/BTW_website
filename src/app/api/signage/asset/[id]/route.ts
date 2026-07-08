import { NextRequest, NextResponse } from 'next/server';
import { getAssetById } from '@/lib/signage/db';

function injectReadyHandshakeScript(html: string): string {
  const prelude = `
<style id="__signage-bootstrap-style">
html.__signage-pending,
html.__signage-pending body {
  background: #000 !important;
  opacity: 0 !important;
}
</style>
<script>
(function () {
  try { document.documentElement.classList.add('__signage-pending'); } catch (e) {}
})();
</script>`;
  const script = `
<script>
(function () {
  var sent = false;

  function postReady(stage) {
    if (sent) return;
    sent = true;
    try {
      if (window.parent && window.parent !== window) {
        // 回報自身網址（含 ?v= 版本碼）供播放端比對是哪一支素材已就緒。
        // 不再使用隨機 token，網址保持穩定才能被瀏覽器 / CDN 快取。
        var href = location.pathname + location.search;
        window.parent.postMessage({ type: 'signage-ready', href: href, stage: stage }, '*');
      }
    } catch (e) {
      // ignore
    }
  }

  function afterPaint() {
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        postReady('paint');
      });
    });
  }

  function markReady() {
    try {
      if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(afterPaint).catch(afterPaint);
        return;
      }
    } catch (e) {
      // ignore
    }
    afterPaint();
  }

  function reveal() {
    try { document.documentElement.classList.remove('__signage-pending'); } catch (e) {}
  }

  if (document.readyState === 'complete') {
    markReady();
  } else {
    window.addEventListener('load', markReady, { once: true });
  }

  setTimeout(function () {
    reveal();
    postReady('timeout');
  }, 1500);

  window.addEventListener('load', function () {
    reveal();
  }, { once: true });
})();
</script>`;

  let output = html;
  if (/<head[^>]*>/i.test(output)) {
    output = output.replace(/<head([^>]*)>/i, `<head$1>${prelude}`);
  } else {
    output = `${prelude}\n${output}`;
  }

  if (/<\/body>/i.test(html)) {
    return output.replace(/<\/body>/i, `${script}</body>`);
  }
  if (/<\/html>/i.test(output)) {
    return output.replace(/<\/html>/i, `${script}</html>`);
  }
  return `${output}\n${script}`;
}

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
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const id = Number(params.id);
  if (!id || isNaN(id)) {
    return new NextResponse('Invalid asset id', { status: 400 });
  }
  // 網址帶 ?v={版本碼} 時，該版本內容永不改變（編輯會產生新版本碼 → 新網址），
  // 故可安全地長期 immutable 快取，播放端每個版本只下載一次。
  // 若無版本碼（少數素材 blob 路徑無時間戳），退回短快取以免鎖住舊內容。
  const hasVersion = req.nextUrl.searchParams.has('v');

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

    const outputHtml = injectReadyHandshakeScript(rewritten);

    return new NextResponse(outputHtml, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Disposition': 'inline',
        'Cache-Control': hasVersion
          ? 'public, max-age=31536000, immutable'
          : 'public, max-age=60, s-maxage=60',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (error) {
    console.error('素材代理錯誤：', error);
    return new NextResponse('Server error', { status: 500 });
  }
}
