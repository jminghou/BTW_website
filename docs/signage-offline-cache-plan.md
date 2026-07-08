# 電子看板 — 播放端在地快取 / 省頻寬技術規劃

## 1. 目標

1. 播放端（安卓看板盒 / 電視內建瀏覽器）**連一次網頁就把整份播放清單存在本機**，反覆播放不再重複下載。
2. 只有後台**素材被編輯（版本碼改變）**時，播放端才重新下載那一支素材。
3. 一個播放清單可放**多個素材網頁**，整份一起快取、一起輪播。
4. 網路不穩 / 短暫斷線時，仍能從本機繼續播。

## 2. 現況與真正的頻寬破口

資料流：`player/[key]/page.tsx` → 每 60 秒輪詢 `/api/signage/player/[key]`（回傳 items 清單）→ 每個 item 用 iframe 載入 `/api/signage/asset/{id}?v={版本碼}` → proxy 去 Vercel Blob 抓 HTML → HTML 內共用資源指向 `/signage-assets/*`（6.3MB，主要是 4MB 字型）。

**破口在 `page.tsx` 的 `withFrameToken()`（第 35–44、129 行）：**
每次輪播切換都在 iframe 網址加一個**隨機 `__signageFrameToken`**，導致：

- 網址每圈都不同 → 瀏覽器快取與 CDN 快取**每一圈都 miss**
- 即使內容沒改，每輪一圈就重抓所有頁面 HTML，proxy 每次再回 Blob 抓一次
- 24 小時 × 每台螢幕 × 持續不斷

`?v={版本碼}`（`assetVersion.ts`）本身是對的（內容改才變），但那個隨機 token 把快取整個打壞了。

**輪詢本身不是問題**：`/api/signage/player/[key]` 回應帶 `s-maxage=180`，相同內容由 CDN 邊緣供應，每台每分鐘約 1KB JSON，可忽略。

## 3. 核心策略：兩層式（重點）

安卓盒 / 電視瀏覽器對 Service Worker 支援不一致，因此**不把 SW 當唯一解**：

- **Layer 1（相容基線，任何瀏覽器都有效）**：修好 HTTP 快取。讓「同一版本」的素材下載一次後，之後完全走瀏覽器本機快取，只有版本碼變才重抓。**這一層就能砍掉 99% 的重複頻寬**，且零 SW 依賴。
- **Layer 2（SW 加強，支援的裝置才啟用）**：加上 Service Worker 做預抓、永久保存、離線續播。用 feature-detect，不支援的裝置自動退回 Layer 1。

---

## 4. Layer 1 — 相容基線（必做）

### 4.1 移除破壞快取的隨機 token
**檔案：`src/app/signage/player/[key]/page.tsx`**
- 移除 `withFrameToken()` 與第 129 行的隨機 token 產生。
- iframe `src` 直接使用 `item.url`（即 `/api/signage/asset/{id}?v=...`，穩定、可快取）。
- 淡入淡出「ready 握手」改為不依賴 URL token：注入的腳本改為回傳自己的識別（例如 `location.search` 的 `v` 值或 asset 路徑），父層以「pending frame 的 url」比對 `signage-ready` 訊息，而非隨機 token。

**檔案：`src/app/api/signage/asset/[id]/route.ts`**
- `injectReadyHandshakeScript` 改為**一律注入**（不再依賴 `__signageFrameToken` query），腳本內回傳自身 `v` 作為識別。
- 移除對 `__signageFrameToken` 的讀取。

### 4.2 強化素材 proxy 的快取標頭
**檔案：`src/app/api/signage/asset/[id]/route.ts`（第 148 行）**
- 因為 `?v=` 只要內容改就變，同一個 `?v=` 的內容**永不改變** → 可設為極長且 immutable：
  ```
  Cache-Control: public, max-age=31536000, immutable
  ```
- 效果：播放盒對某個版本只會下載一次，之後永遠走本機快取，直到版本碼變。

### 4.3 強化共用靜態資源快取
**檔案：`next.config.js`**
- 新增 `headers()`，讓 `/signage-assets/:path*` 有長快取（字型 4MB 尤其重要）：
  ```js
  async headers() {
    return [{
      source: '/signage-assets/:path*',
      headers: [{ key: 'Cache-Control', value: 'public, max-age=86400, stale-while-revalidate=604800' }],
    }];
  }
  ```
- 取捨：共用 logo/字型是穩定檔名。設 1 天 + SWR 一週兼顧「更新共用圖時最慢隔天生效」。若可接受手動改名破快取，也可設 immutable 拉更長。

### 4.4 變更偵測（已內建，無需新增）
`page.tsx` 第 74 行已用 items 的 url 集合做 signature 比對；url 內含 `?v=`，素材一編輯 signature 就變 → 自動 reset 重播新內容。**Layer 1 不需新增任何 API。**

### Layer 1 預期成效
- 首圈下載全部；之後每圈輪播**零內容下載**，只剩每分鐘約 1KB 的輪詢 JSON（多半由 CDN 供應）。
- 相容所有瀏覽器（含舊安卓盒 / 電視瀏覽器）。
- 唯一弱點：HTTP 快取在低儲存空間裝置上可能被清掉而偶爾重抓 → 由 Layer 2 解決。

---

## 5. Layer 2 — Service Worker 加強（選配、加分）

### 5.1 新增 `public/signage-sw.js`
- `install`：`skipWaiting()`。
- `activate`：`clients.claim()`。
- `fetch`：對 `/api/signage/asset/`、`/signage-assets/`、以及跨網域素材圖片 → **cache-first**（有快取回快取，否則抓網路並寫入快取）；其餘請求 passthrough。
- `message`：
  - `precache`：`caches.open()` + `cache.addAll(itemUrls)` 首次把整份清單頁面預抓。
  - `purge`：收到最新 url 清單，刪除快取中不在清單內的舊版本項目（清掉被編輯前的舊 `?v=`）。

### 5.2 播放端註冊與更新流程
**檔案：`src/app/signage/player/[key]/page.tsx`**
- `if ('serviceWorker' in navigator)` 才註冊 `/signage-sw.js`（feature-detect；不支援就純跑 Layer 1）。
- 拿到 items 後 `postMessage({type:'precache', urls})` 給 SW 預抓整份清單。
- 既有 60 秒輪詢偵測到 signature 改變時，`postMessage({type:'purge', urls})` 讓 SW 清掉舊版本並抓新版，再重載 iframe。

### 5.3 離線續播
- SW cache-first 下，即使 `fetch` 失敗（斷網），iframe 仍由快取供應 → 持續播放。
- 輪詢 API 失敗時保留現有 items 不清空（`page.tsx` 需微調錯誤處理，避免斷網時跳「待機中」）。

### Layer 2 預期成效
- 內容永久保存在 Cache Storage，重開機 / 清 HTTP 快取都不受影響。
- 完整離線續播。
- 穩定後頻寬 ≈ 每分鐘約 1KB 輪詢，內容為零。

---

## 6. 多頁打包（點 4）— 已支援，無需改結構
- `signage_playlist_items` 一個清單可含多素材；`batch-add-items` API 可一次把多個素材加進清單；播放端已會依 `duration` 輪播。
- 本規劃只是讓「整份多頁清單」被當成一個快取集合一次抓齊、反覆播。
- （選配）後台可加一顆「把選取的多個素材建成單一輪播清單」的便捷鈕，但非必要。

---

## 7. 相容性與風險
| 項目 | 說明 / 緩解 |
|------|------|
| 安卓盒不支援 SW | feature-detect 自動退回 Layer 1，仍大幅省頻寬 |
| immutable 快取誤鎖舊內容 | 只對「含 `?v=` 版本碼」的素材用 immutable；`?v=` 一定隨編輯改變，不會鎖住 |
| 共用素材（logo/字型）更新 | 用 1 天 + SWR，或改檔名破快取 |
| 低儲存空間裝置清快取 | Layer 2 的 Cache Storage 較 HTTP 快取持久 |
| 握手改版導致轉場閃爍 | 保留 ready 握手與 1.5s fallback，只改「識別方式」不改轉場邏輯 |

## 8. 回滾方案
- Layer 1 全部是「移除 token + 調標頭」，如出問題可單獨還原 `Cache-Control` 或還原 `withFrameToken`。
- Layer 2 SW 若異常：播放端加一顆「解除註冊 SW + 清快取」的隱藏快捷鍵（比照現有 Ctrl+R），或直接不註冊即回到 Layer 1。

## 9. 建議交付順序
1. **Layer 1**（移除隨機 token + 調快取標頭 + next.config headers）— 影響最大、風險最低，先上。
2. 觀察頻寬下降（Vercel Analytics / 盒子端網路用量）。
3. **Layer 2**（SW 預抓 + 離線續播）— 追求永久保存與離線韌性時再加。

## 10. 受影響檔案清單
- `src/app/signage/player/[key]/page.tsx`（移 token、握手比對、SW 註冊、離線容錯）
- `src/app/api/signage/asset/[id]/route.ts`（一律注入握手、快取標頭）
- `next.config.js`（signage-assets headers）
- `public/signage-sw.js`（新增，Layer 2）
