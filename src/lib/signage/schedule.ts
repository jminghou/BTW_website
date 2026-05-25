/**
 * 排程匹配邏輯
 * 對應 v2.0 backend/api/player.py:38-75
 *
 * 優先順序：
 *   1. 特定日期 (play_date = today) 的排程：優先級最高
 *   2. 週期性 (days_of_week 包含今日) 的排程
 *
 * 時間視窗：start_time <= 現在 <= end_time
 */

export interface ScheduleRow {
  id: number;
  screen_id: number;
  playlist_id: number;
  start_time: string; // "HH:MM:SS"
  end_time: string; // "HH:MM:SS"
  days_of_week: string; // JSON 字串 "[1,2,3,4,5]"
  play_date: string | null; // "YYYY-MM-DD" 或 null
  playlist_name?: string;
  screen_name?: string;
}

/**
 * 取得「現在」對應 v2.0 的週幾（週一 = 1, 週日 = 7）
 * Python: weekday() 回傳 0=Mon ~ 6=Sun，加 1 後 1=Mon ~ 7=Sun
 * JS: getDay() 回傳 0=Sun ~ 6=Sat，需轉換
 */
export function getCurrentDayOfWeek(now: Date = new Date()): number {
  const jsDay = now.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
  return jsDay === 0 ? 7 : jsDay;
}

/**
 * 取得「現在」的本地時間字串 "HH:MM:SS"
 */
export function getCurrentTimeString(now: Date = new Date()): string {
  const h = String(now.getHours()).padStart(2, '0');
  const m = String(now.getMinutes()).padStart(2, '0');
  const s = String(now.getSeconds()).padStart(2, '0');
  return `${h}:${m}:${s}`;
}

/**
 * 取得「現在」的本地日期字串 "YYYY-MM-DD"
 */
export function getCurrentDateString(now: Date = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * 將 PG 的 time/date 欄位正規化成字串 (確保比較邏輯穩定)
 */
function toTimeString(val: unknown): string {
  if (val instanceof Date) return getCurrentTimeString(val);
  return String(val);
}

function toDateString(val: unknown): string | null {
  if (val === null || val === undefined) return null;
  if (val instanceof Date) return getCurrentDateString(val);
  // PG 回傳 Date 物件或 "YYYY-MM-DD" 字串；都標準化為 "YYYY-MM-DD"
  const s = String(val);
  return s.length >= 10 ? s.substring(0, 10) : s;
}

/**
 * 主匹配函式：從一組排程中挑出當前該播的那一筆
 * 找不到時回傳 null
 */
export function matchSchedule(
  schedules: ScheduleRow[],
  now: Date = new Date(),
): ScheduleRow | null {
  const currentTime = getCurrentTimeString(now);
  const currentDate = getCurrentDateString(now);
  const currentDay = getCurrentDayOfWeek(now);

  let candidateSpecific: ScheduleRow | null = null;
  let candidateRecurring: ScheduleRow | null = null;

  for (const schedule of schedules) {
    const startTime = toTimeString(schedule.start_time);
    const endTime = toTimeString(schedule.end_time);

    // 時間視窗檢查
    if (!(startTime <= currentTime && currentTime <= endTime)) continue;

    const playDate = toDateString(schedule.play_date);

    // 1. 特定日期排程：找到立即採用（最高優先）
    if (playDate) {
      if (playDate === currentDate) {
        candidateSpecific = schedule;
        break;
      }
      // 有指定日期但不是今天 → 略過
      continue;
    }

    // 2. 週期性排程：尚未鎖定才記錄
    if (!candidateRecurring) {
      try {
        const days = JSON.parse(schedule.days_of_week) as number[];
        if (Array.isArray(days) && days.includes(currentDay)) {
          candidateRecurring = schedule;
        }
      } catch {
        // days_of_week 非法 JSON，略過此排程
      }
    }
  }

  return candidateSpecific ?? candidateRecurring;
}
