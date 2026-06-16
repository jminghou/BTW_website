/**
 * 檔名快速篩選。
 *
 * 素材／播放清單的檔名命名邏輯為：廠區_餐期_年份-月份-日期
 *   例：F3_L_2026-06-16.html
 *   餐期 B/L/D/N 對應 早餐/午餐/晚餐/宵夜
 *
 * 設計成「直接輸入即篩選」：把查詢字串以空白拆成多個關鍵字（AND），
 * 每個關鍵字都對「去掉副檔名的檔名」做不分大小寫的子字串比對，全部命中才保留。
 *   輸入 "16"   → 帶出所有 16 號（命中 …-16）
 *   輸入 "L"    → 帶出所有午餐（命中 _L_ 區段；先去副檔名才不會被 .html 的 l 干擾）
 *   輸入 "F3"   → 帶出該廠區
 *   輸入 "F3 L" → 同時符合廠區 F3 與午餐
 *
 * 空查詢一律視為符合（不篩選）。
 */
export function matchFilename(filename: string, query: string): boolean {
  const terms = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (terms.length === 0) return true;
  const name = filename.toLowerCase().replace(/\.[^.]+$/, ''); // 去掉副檔名，避免 .html 的字母干擾
  return terms.every(t => name.includes(t));
}
