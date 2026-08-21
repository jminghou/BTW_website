/*
 * 電子看板播放端 Service Worker（Layer 2）
 *
 * 目的：把整份播放清單（素材 HTML + 共用靜態資源 + 外部圖片）永久存進 Cache Storage，
 *       讓安卓看板盒 / 電視瀏覽器重開機、清 HTTP 快取後仍能離線續播，
 *       線上時只有素材編輯（?v= 版本碼變）才會重新下載那一支。
 *
 * 策略：
 *   - 排程 JSON（/api/signage/player/）與播放頁面導覽：network-first
 *       （線上永遠取最新排程；離線時退回上次快取，避免斷網跳待機）
 *   - 版本化素材 HTML（/api/signage/asset/）與共用資源（/signage-assets/）：cache-first
 *   - 素材頁面內的外部圖片/字型/樣式/腳本：cache-first
 *   - 其餘請求不介入
 *
 * 不支援 Service Worker 的裝置由播放端 feature-detect 略過註冊，自動退回 Layer 1。
 */

const CACHE = 'signage-cache-v2';

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    // 清掉舊版本命名的快取
    const names = await caches.keys();
    await Promise.all(
      names
        .filter((n) => n.startsWith('signage-cache-') && n !== CACHE)
        .map((n) => caches.delete(n)),
    );
    await self.clients.claim();
  })());
});

self.addEventListener('message', (event) => {
  const data = event.data || {};
  if (data.type === 'precache' && Array.isArray(data.urls)) {
    event.waitUntil(precache(data.urls));
  } else if (data.type === 'purge' && Array.isArray(data.keepUrls)) {
    event.waitUntil(purgeOldAssets(data.keepUrls));
  }
});

/** 預抓整份清單的素材頁面；已快取者略過，避免重複下載 */
async function precache(urls) {
  const cache = await caches.open(CACHE);
  await Promise.all(urls.map(async (u) => {
    try {
      const req = new Request(u, { credentials: 'same-origin' });
      const existing = await cache.match(req, { ignoreVary: true });
      if (existing) return;
      const res = await fetch(req);
      if (res && (res.ok || res.type === 'opaque')) {
        await cache.put(req, res.clone());
      }
    } catch (_) {
      // 單支失敗不影響其他素材
    }
  }));
}

/** 清掉素材快取中「不在目前清單」的舊版本（素材編輯後 ?v= 改變，舊版本會被留下） */
async function purgeOldAssets(keepUrls) {
  const cache = await caches.open(CACHE);
  const keep = new Set(keepUrls.map(normalizePath).filter(Boolean));
  const requests = await cache.keys();
  await Promise.all(requests.map(async (req) => {
    const url = new URL(req.url);
    if (url.pathname.startsWith('/api/signage/asset/')) {
      if (!keep.has(url.pathname + url.search)) {
        await cache.delete(req);
      }
    }
  }));
}

function normalizePath(u) {
  try {
    const x = new URL(u, self.location.origin);
    return x.pathname + x.search;
  } catch (_) {
    return '';
  }
}

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  let url;
  try {
    url = new URL(req.url);
  } catch (_) {
    return;
  }
  const sameOrigin = url.origin === self.location.origin;

  // 排程 JSON 與播放頁面導覽：network-first（線上最新、離線續命）
  if (
    sameOrigin &&
    (url.pathname.startsWith('/api/signage/player/') ||
      (req.mode === 'navigate' && url.pathname.startsWith('/signage/player/')))
  ) {
    event.respondWith(networkFirst(req));
    return;
  }

  // 版本化素材 HTML 與共用靜態資源：cache-first
  if (
    sameOrigin &&
    (url.pathname.startsWith('/api/signage/asset/') ||
      url.pathname.startsWith('/signage-assets/'))
  ) {
    event.respondWith(cacheFirst(req));
    return;
  }

  // 素材頁面內的外部圖片/字型/樣式/腳本：cache-first
  if (['image', 'font', 'style', 'script'].includes(req.destination)) {
    event.respondWith(cacheFirst(req));
    return;
  }
  // 其餘不介入
});

async function cacheFirst(req) {
  const cache = await caches.open(CACHE);
  const cached = await cache.match(req, { ignoreVary: true });
  if (cached) return cached;
  try {
    const res = await fetch(req);
    if (res && (res.ok || res.type === 'opaque')) {
      cache.put(req, res.clone()).catch(() => {});
    }
    return res;
  } catch (_) {
    return new Response('', { status: 504, statusText: 'Offline and not cached' });
  }
}

async function networkFirst(req) {
  const cache = await caches.open(CACHE);
  try {
    const res = await fetch(req);
    if (res && res.ok) {
      cache.put(req, res.clone()).catch(() => {});
    }
    return res;
  } catch (err) {
    const cached = await cache.match(req, { ignoreVary: true });
    if (cached) return cached;
    throw err;
  }
}
