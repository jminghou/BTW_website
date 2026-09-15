/**
 * 週菜單 EDM 素材檔名：廠區簡寫_餐別簡寫_日期區間.html
 * 例：F3_L_2026-09-14_2026-09-18.html
 */

const LOCATION_ABBR_MAP: Record<string, string> = {
  '世界先進一廠 fab1': 'F1',
  '世界先進二廠 fab2': 'F2',
  '世界先進三廠 fab3': 'F3',
  '世界先進五廠 fab5': 'F5',
};

const MEAL_TIME_ABBR_MAP: Record<string, string> = {
  早餐: 'B',
  午餐: 'L',
  晚餐: 'D',
  宵夜: 'N',
};

export function locationAbbr(loc: string): string {
  if (LOCATION_ABBR_MAP[loc]) return LOCATION_ABBR_MAP[loc];
  const fab = loc.match(/fab\s*(\d+)/i);
  return fab ? `F${fab[1]}` : loc;
}

export function mealTimeAbbr(mt: string): string {
  return MEAL_TIME_ABBR_MAP[mt] ?? mt;
}

/** extra 用於週末檔等後綴（例：weekend → F3_L_2026-09-19_2026-09-20_weekend.html） */
export function weeklyEdmFilename(
  rawLocation: string,
  mealTime: string,
  start: string,
  end: string,
  extra = '',
): string {
  const loc = locationAbbr(rawLocation);
  const meal = mealTime ? `_${mealTimeAbbr(mealTime)}` : '';
  const suffix = extra ? `_${extra}` : '';
  return `${loc}${meal}_${start}_${end}${suffix}.html`;
}
