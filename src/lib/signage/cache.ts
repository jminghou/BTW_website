import { revalidateTag, unstable_cache } from 'next/cache';

/**
 * 看版讀取快取（Next.js Data Cache）
 *
 * 為什麼需要：
 *   Neon 是「compute 醒著多久」計費，最後一筆查詢後要閒置滿 autosuspend 門檻
 *   （預設 5 分鐘）才會休眠。播放端每台螢幕每分鐘輪詢一次排程，只要有任何一台
 *   螢幕開著，DB 就永遠等不到那段空檔 → compute 時數 ≈ 螢幕開機時數。
 *   （實測：約 14 小時/天，幾乎全部帳單都來自這裡，且與螢幕數量無關。）
 *
 * 做法：
 *   播放端的 DB 讀取一律走這裡快取，並且「不設時間到期」（revalidate: false），
 *   只有真的寫入資料時才用 tag 讓它失效。
 *   → 平常輪詢完全不碰 DB；後台一存檔，下一次輪詢就拿到新內容（比舊的 3 分鐘
 *     邊緣快取還快），兩邊兼得。
 *
 * 為什麼不用時間到期當保險：
 *   每一次「孤立的查詢」都會讓 compute 醒滿一個 autosuspend 週期（預設 5 分鐘）。
 *   就算把 TTL 拉到 1 小時，20 台螢幕分散到期仍會製造數十次喚醒 ≈ 每天數小時。
 *   所以這裡刻意採「只靠 tag 失效」，並用兩道保險確保不會有漏網的寫入：
 *     1. src/lib/signage/db.ts 在 sql 層攔截所有 INSERT/UPDATE/DELETE 自動失效，
 *        新增 API 路由不需要（也不會忘記）手動呼叫。
 *     2. POST /api/signage/cache 可手動清空，萬一真的卡住有逃生口。
 */

/** 所有看版讀取共用的失效標籤。任何寫入都會讓整組快取失效。 */
export const SIGNAGE_TAG = 'signage';

/**
 * 售完狀態專用標籤。與 SIGNAGE_TAG 分開，避免現場點售完時
 * 把播放清單／素材快取整組打掉（那會讓每台廣告機立刻重打 DB）。
 */
export const SIGNAGE_SOLDOUT_TAG = 'signage-soldout';

type CachedFn<Args extends unknown[], T> = (...args: Args) => Promise<T>;

/**
 * 在模組層建立 Data Cache。動態參數必須當函式引數傳入，
 * Next 才會把它編進 cache key（cb.toString + keyParts + JSON.stringify(args)）。
 *
 * 舊寫法 `unstable_cache(async () => query(key), ['signage', key])()` 每次請求
 * 都會 new 一個包著 closure 的 cache。正式環境 minify 後 cb.toString() 常撞在一起，
 * 不同螢幕就會讀到同一格排程：A 電腦播櫃台菜單、B 電腦播到用餐區菲律賓餐。
 */
export function createSignageCached<Args extends unknown[], T>(
  keyPrefix: string,
  fn: CachedFn<Args, T>,
): CachedFn<Args, T> {
  return unstable_cache(fn, ['signage', keyPrefix], {
    tags: [SIGNAGE_TAG],
    revalidate: false,
  });
}

/**
 * 包一層 Data Cache 的看版讀取。
 *
 * @param keyParts 唯一識別這筆讀取的鍵（需含所有查詢參數，例如螢幕 key、playlist id）
 * @param read     實際查 DB 的函式。查不到等「穩定結果」請正常回傳；
 *                 連線失敗等暫時性錯誤請 throw，unstable_cache 不會快取丟出錯誤的結果。
 */
export function cachedSignageRead<T>(
  keyParts: string[],
  read: () => Promise<T>,
): Promise<T> {
  const cacheKey = keyParts.join('|');
  // 引數也編進 cache key，避免只靠 closure / minify 後的函式字串辨識
  const cached = unstable_cache(
    async (_k: string) => read(),
    ['signage', ...keyParts],
    { tags: [SIGNAGE_TAG], revalidate: false },
  );
  return cached(cacheKey);
}

/** 售完狀態讀取：平常輪詢打快取；現場點售完才失效再查 DB。 */
export function cachedSoldOutRead<T>(
  menuKey: string,
  read: () => Promise<T>,
): Promise<T> {
  const cached = unstable_cache(
    async (_k: string) => read(),
    ['signage-soldout', menuKey],
    { tags: [SIGNAGE_SOLDOUT_TAG, soldOutTagFor(menuKey)], revalidate: false },
  );
  return cached(menuKey);
}

function soldOutTagFor(menuKey: string): string {
  return `soldout-${menuKey.replace(/[^a-zA-Z0-9_-]/g, '_')}`;
}

/**
 * 讓所有看版讀取快取失效。
 *
 * 由 db.ts 的 sql 包裝層在寫入成功後自動呼叫，一般不需手動使用。
 * revalidateTag 僅能在請求執行環境（Route Handler / Server Action）中呼叫，
 * 因此這裡吞掉例外：快取沒失效頂多內容晚一點更新，不該讓寫入本身失敗。
 */
export function revalidateSignage(): void {
  try {
    revalidateTag(SIGNAGE_TAG);
  } catch (error) {
    console.warn('看版快取失效通知失敗（資料已寫入成功）：', error);
  }
}

/** 只讓售完狀態快取失效，不動播放清單。 */
export function revalidateSoldOut(menuKey?: string): void {
  try {
    revalidateTag(SIGNAGE_SOLDOUT_TAG);
    if (menuKey) revalidateTag(soldOutTagFor(menuKey));
  } catch (error) {
    console.warn('售完快取失效通知失敗（資料已寫入成功）：', error);
  }
}
