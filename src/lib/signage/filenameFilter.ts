/**
 * 檔名快速篩選。
 *
 * 素材／播放清單的檔名命名邏輯為：廠區_餐期_年份-月份-日期
 *   例：F3_L_2026-06-16.html
 *   餐期 B/L/D/N 對應 早餐/午餐/晚餐/宵夜
 *
 * 設計成「直接輸入即篩選」：把查詢字串以空白拆成多個關鍵字（AND），全部命中才保留。
 * 每個關鍵字的比對規則：
 *   - 純數字 → 只比對「日期（DD）」欄位，且以數值相等判斷，避免誤中月份/年份或其他數字。
 *       輸入 "16" → 只帶出 16 號；輸入 "6" → 只帶出 6 號（不會連帶 16、26）。
 *   - 其他文字 → 對「去掉副檔名的檔名」做不分大小寫的子字串比對。
 *       輸入 "L" → 帶出午餐（命中 _L_ 區段）；輸入 "F3" → 帶出該廠區。
 *   - 可空白組合，例：輸入 "F3 16" → 同時符合廠區 F3 與 16 號。
 *
 * 空查詢一律視為符合（不篩選）。
 */
export function matchFilename(filename: string, query: string): boolean {
  const terms = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (terms.length === 0) return true;
  const name = filename.toLowerCase().replace(/\.[^.]+$/, ''); // 去掉副檔名，避免 .html 的字母干擾
  const day = extractDay(name);
  return terms.every(t => {
    // 純數字：只認日期欄位，依數值比對（兼容有無前導零）
    if (/^\d+$/.test(t)) return day !== null && day === parseInt(t, 10);
    return name.includes(t);
  });
}

/**
 * 從檔名取出完整日期（YYYY-MM-DD）。
 * 會驗證日期是否真實存在，取不到或日期無效時回傳 null。
 */
export function extractFilenameDate(name: string): string | null {
  const m = name.match(/(?:^|[^0-9])(\d{4})-(\d{1,2})-(\d{1,2})(?=$|[^0-9])/);
  if (!m) return null;

  const year = Number(m[1]);
  const month = Number(m[2]);
  const day = Number(m[3]);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }

  return `${m[1]}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

/** 從檔名取出日期欄位的「日（DD）」；取不到回傳 null。 */
function extractDay(name: string): number | null {
  const date = extractFilenameDate(name);
  return date ? Number(date.slice(-2)) : null;
}
