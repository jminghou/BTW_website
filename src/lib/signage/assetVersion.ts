/**
 * 從 blob_url 取出「版本碼」。
 *
 * 素材每次上傳或編輯都會寫成新的 Blob 路徑：
 *   signage/{site}/{Date.now()}_{filename}
 * 取出路徑中的時間戳前綴當版本碼，內容一變、版本碼就變。
 *
 * 用途：把它接在素材代理網址後面當 `?v=` 參數做「快取破壞」。
 *   asset id 不變 → 代理網址不變 → 前台 iframe 不會重載、CDN 也回舊快取。
 *   加上會變動的 ?v= 後，編輯一存檔網址就變，前台與預覽立即看到新內容。
 *
 * 取不到時回傳空字串（呼叫端會略過 ?v=，退回原本行為）。
 */
export function assetVersion(blobUrl: string | null | undefined): string {
  if (!blobUrl) return '';
  const m = blobUrl.match(/\/(\d+)_/);
  return m ? m[1] : '';
}

/**
 * 素材代理輸出的後處理版本。blob 的 ?v= 只代表檔案內容；
 * 代理還會改寫腳本／注入售完同步，這層一變就必須換網址，
 * 否則 CDN、廣告機 Service Worker 會一直吐舊 HTML。
 */
const ASSET_RUNTIME = '5';

/** 產生帶版本碼的素材代理網址，供前台 iframe 與後台預覽使用 */
export function assetProxyUrl(assetId: number, blobUrl: string | null | undefined): string {
  const v = assetVersion(blobUrl);
  const base = v ? `/api/signage/asset/${assetId}?v=${v}` : `/api/signage/asset/${assetId}`;
  const sep = v ? '&' : '?';
  return `${base}${sep}r=${ASSET_RUNTIME}`;
}
