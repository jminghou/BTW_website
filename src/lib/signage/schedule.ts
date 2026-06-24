/**
 * 排程匹配邏輯
 * 對應 v2.0 backend/api/player.py:38-75
 *
 * 優先順序：
 *   1. 特定日期 (play_date = today) 的排程：優先級最高
 *   2. 日期區間 (start_date <= today <= end_date 且 today 的星期 ∈ days_of_week)
 *   3. 週期性 (days_of_week 包含今日) 的排程
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
  play_date: string | null; // 特定單日 "YYYY-MM-DD" 或 null
  start_date?: string | null; // 日期區間起 "YYYY-MM-DD" 或 null
  end_date?: string | null; // 日期區間迄 "YYYY-MM-DD" 或 null
  playlist_name?: string;
  screen_name?: string;
}

/**
 * 看版系統的時區固定為台灣（UTC+8）。
 * 正式環境（Vercel）伺服器時區是 UTC，若直接用 now.getHours() 等本機方法，
 * 會比台灣時間少 8 小時，導致排程時間視窗永遠對不上 → 螢幕一直待機中。
 * 因此所有「現在」的計算都改用 Intl 以 Asia/Taipei 取台灣牆上時間。
 */
const SIGNAGE_TIMEZONE = 'Asia/Taipei';

/**
 * 取得「現在」在台灣時區的牆上時間各欄位
 */
function getTaipeiParts(now: Date): {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
} {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: SIGNAGE_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).formatToParts(now);

  const get = (type: string) => Number(parts.find(p => p.type === type)?.value ?? '0');
  let hour = get('hour');
  if (hour === 24) hour = 0; // Intl 在午夜可能回傳 24
  return {
    year: get('year'),
    month: get('month'),
    day: get('day'),
    hour,
    minute: get('minute'),
    second: get('second'),
  };
}

/**
 * 取得「現在」對應 v2.0 的週幾（週一 = 1, 週日 = 7），以台灣時區計算
 * Python: weekday() 回傳 0=Mon ~ 6=Sun，加 1 後 1=Mon ~ 7=Sun
 */
export function getCurrentDayOfWeek(now: Date = new Date()): number {
  const { year, month, day } = getTaipeiParts(now);
  // 用該台灣日期的 UTC 午夜算星期幾，避免再被本機時區干擾
  const jsDay = new Date(Date.UTC(year, month - 1, day)).getUTCDay(); // 0=Sun ~ 6=Sat
  return jsDay === 0 ? 7 : jsDay;
}

/**
 * 取得「現在」的台灣時間字串 "HH:MM:SS"
 */
export function getCurrentTimeString(now: Date = new Date()): string {
  const { hour, minute, second } = getTaipeiParts(now);
  const h = String(hour).padStart(2, '0');
  const m = String(minute).padStart(2, '0');
  const s = String(second).padStart(2, '0');
  return `${h}:${m}:${s}`;
}

/**
 * 取得「現在」的台灣日期字串 "YYYY-MM-DD"
 */
export function getCurrentDateString(now: Date = new Date()): string {
  const { year, month, day } = getTaipeiParts(now);
  const m = String(month).padStart(2, '0');
  const d = String(day).padStart(2, '0');
  return `${year}-${m}-${d}`;
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
 * 該排程的 days_of_week 是否包含指定星期
 * days_of_week 為非法 JSON 時回傳 false
 */
function dayMatches(schedule: ScheduleRow, currentDay: number): boolean {
  try {
    const days = JSON.parse(schedule.days_of_week) as number[];
    return Array.isArray(days) && days.includes(currentDay);
  } catch {
    return false;
  }
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
  let candidateRange: ScheduleRow | null = null;
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

    const startDate = toDateString(schedule.start_date);
    const endDate = toDateString(schedule.end_date);

    // 2. 日期區間排程：今天落在區間內、且星期符合（次高優先）
    if (startDate && endDate) {
      if (
        !candidateRange &&
        startDate <= currentDate &&
        currentDate <= endDate &&
        dayMatches(schedule, currentDay)
      ) {
        candidateRange = schedule;
      }
      continue;
    }

    // 3. 週期性排程：尚未鎖定才記錄
    if (!candidateRecurring && dayMatches(schedule, currentDay)) {
      candidateRecurring = schedule;
    }
  }

  return candidateSpecific ?? candidateRange ?? candidateRecurring;
}
