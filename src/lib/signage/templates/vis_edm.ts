/**
 * VIS 一週橫式 EDM 海報版型轉檔器
 * 由 BTW_EDM_3.0/edm_module/vis_edm.py 移植，並折入原本分散在
 * edmjson_module/json_workday2.py、json_weekend2.py 的前處理邏輯。
 *
 * 與舊版差異：
 *   舊版是兩階段（先把原始大 JSON 拆成「一週一檔」的小 JSON，
 *   再由 vis_edm.py 把每個小檔轉成一份 HTML）。
 *   新網站的版型介面是單階段（convert(meals) => ConvertedMenu[]），
 *   因此這裡把「清理餐廳名 → 依 據點+時段 分組 → 按週切分 →
 *   平日補滿週一~五、週末補滿週六日」一併做完，每一份再產生一張 EDM。
 *
 * 輸入：餐點資料陣列（後台匯出的原始 JSON）
 * 輸出：每個「據點 + 時段 + 一週（平日 / 週末分開）」一份 EDM HTML
 *
 * 產生的 HTML 用 ../../css、../../pic 引用共用資源，
 * 由 /api/signage/asset/[id] proxy 改寫成 /signage-assets/...
 */

import { makeTvConvert } from './_tv';

export interface MealItem {
  餐點名稱: string;
  英文名稱?: string | null;
  售價: string | number;
  圖片網址?: string;
  餐廳名稱: string;
  據點: string;
  時段: string;
  日期: string; // YYYY-MM-DD
  星期: string; // 星期一 ~ 星期日（原始）
  介紹?: string;
}

export interface ConvertedMenu {
  filename: string; // 例：世界先進三廠 fab3_午餐_06-08_06-12.html
  html: string;
  meta: {
    location: string; // FAB 3
    mealTime: string; // 午餐
    date: string; // 06-08_06-12（一週區間）
    itemCount: number;
    warnings: string[];
  };
}

// ==================== 對照表（同 Python） ====================

const LOCATION_MAP: Record<string, string> = {
  '世界先進一廠 fab1': 'FAB 1',
  '世界先進二廠 fab2': 'FAB 2',
  '世界先進三廠 fab3': 'FAB 3',
  '世界先進五廠 fab5': 'FAB 5',
};

const WEEKDAY_ABBR_MAP: Record<string, string> = {
  Monday: 'MON',
  Tuesday: 'TUE',
  Wednesday: 'WED',
  Thursday: 'THU',
  Friday: 'FRI',
  Saturday: 'SAT',
  Sunday: 'SUN',
  星期一: 'MON',
  星期二: 'TUE',
  星期三: 'WED',
  星期四: 'THU',
  星期五: 'FRI',
  星期六: 'SAT',
  星期日: 'SUN',
};

/** 以「週一=0 ... 週日=6」（同 Python datetime.weekday()）索引的英文星期名，用於補空日 */
const PY_WEEKDAY_EN = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];

const DEFAULT_IMAGE = '../../pic/暫缺圖片_便當.png';

function convertLocationName(loc: string): string {
  return LOCATION_MAP[loc] ?? loc;
}

/** 基本 HTML escape，避免菜名／餐廳名含特殊字元破版 */
function esc(v: unknown): string {
  return String(v ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/** 兩位數補零（1 → "01"） */
function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

/**
 * 餐廳顯示名稱轉成安全 HTML：
 * 合併後的名稱可能含 <br>（多間餐廳併一塊），保留為換行，其餘逐段 escape。
 */
function restaurantLabelHtml(name: string): string {
  return String(name ?? '')
    .split('<br>')
    .map((part) => esc(part))
    .join('<br>');
}

/** 售價轉整數（合併排序用）；無法解析者視為 0 */
function priceInt(v: string | number): number {
  if (typeof v === 'number') return Number.isFinite(v) ? Math.trunc(v) : 0;
  const n = parseInt(String(v ?? '').replace(/[^\d.-]/g, ''), 10);
  return Number.isNaN(n) ? 0 : n;
}

/** 清理餐廳名稱：只保留最後一個破折號後的內容（同 Python clean_restaurant_name） */
function cleanRestaurantName(name: string): string {
  if (name.includes('-')) {
    return name.split('-').slice(-1)[0].trim();
  }
  return name;
}

// ==================== 日期工具（避免時區誤差，一律以本地零時計算） ====================

function dateToObj(ymd: string): Date {
  const [y, m, d] = ymd.split('-').map(Number);
  return new Date(y, m - 1, d);
}
/** 週一=0 ... 週日=6（同 Python datetime.weekday()） */
function pyWeekday(dt: Date): number {
  return (dt.getDay() + 6) % 7;
}
function fmtYmd(dt: Date): string {
  return `${dt.getFullYear()}-${pad2(dt.getMonth() + 1)}-${pad2(dt.getDate())}`;
}
function fmtMmdd(dt: Date): string {
  return `${pad2(dt.getMonth() + 1)}-${pad2(dt.getDate())}`;
}
function addDays(dt: Date, n: number): Date {
  return new Date(dt.getFullYear(), dt.getMonth(), dt.getDate() + n);
}

/** 建立一筆空白餐點（補滿沒有資料的日期；對應 Python create_empty_record） */
function createEmptyRecord(date: string, weekdayEn: string): MealItem {
  return {
    餐點名稱: '',
    英文名稱: null,
    售價: '',
    圖片網址: '',
    餐廳名稱: '',
    據點: '',
    時段: '',
    日期: date,
    星期: weekdayEn,
  };
}

// ==================== 餐廳合併（同 Python merge_restaurants_for_layout） ====================

/**
 * 合併餐廳以確保最多只有 2 個餐廳區塊。
 *   - 餐廳數 <= 2：原樣返回
 *   - 3 間：依（餐點數, 最高價）排序後合併前兩名（餐點數少的），限每塊最多 6 項
 *   - 4 間以上：依（餐點數, 最高價）排序後對半分兩組，各限最多 6 項
 */
function mergeRestaurantsForLayout(
  restaurants: Map<string, MealItem[]>,
): Map<string, MealItem[]> {
  if (restaurants.size <= 2) return restaurants;

  const restInfos = Array.from(restaurants.entries()).map(([name, items]) => ({
    name,
    count: items.length,
    maxPrice: Math.max(...items.map((it) => priceInt(it.售價))),
    items,
  }));

  // 依（餐點數, 最高價）排序
  restInfos.sort((a, b) => a.count - b.count || a.maxPrice - b.maxPrice);

  const merged = new Map<string, MealItem[]>();

  if (restaurants.size === 3) {
    const [r1, r2, r3] = restInfos;
    const mergedName = `${r1.name}<br>${r2.name}`;
    merged.set(mergedName, [...r1.items, ...r2.items].slice(0, 6));
    merged.set(r3.name, r3.items);
  } else {
    const mid = Math.floor(restInfos.length / 2);
    const group1 = restInfos.slice(0, mid);
    const group2 = restInfos.slice(mid);

    const group1Name = group1.map((r) => r.name).join('<br>');
    const group1Items = group1.flatMap((r) => r.items).slice(0, 6);
    const group2Name = group2.map((r) => r.name).join('<br>');
    const group2Items = group2.flatMap((r) => r.items).slice(0, 6);

    merged.set(group1Name, group1Items);
    merged.set(group2Name, group2Items);
  }

  return merged;
}

// ==================== 主 HTML 產生（同 Python generate_menu_html） ====================

/** 把一份（已補滿日期、單一據點+時段）的資料產生一張 EDM HTML */
function generateMenuHtml(data: MealItem[]): { html: string; warnings: string[] } {
  const warnings: string[] = [];

  // 找到第一個有據點的資料，否則 fallback 到 data[0]（補空日的 據點 為空字串）
  const firstItem = data.find((item) => item.據點) ?? data[0];

  // 日期區間（mm/dd-mm/dd）
  const datesList = Array.from(new Set(data.map((item) => item.日期))).sort();
  const startParts = datesList[0].split('-').slice(-2);
  const endParts = datesList[datesList.length - 1].split('-').slice(-2);
  const dateRange = `${startParts[0]}/${startParts[1]}-${endParts[0]}/${endParts[1]}`;

  const rawLocation = firstItem.據點 || '世界先進五廠 fab5';
  const location = convertLocationName(rawLocation);
  const mealPeriod = firstItem.時段 || '午餐';

  let html = `<!DOCTYPE html>
<html lang="zh-TW">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>餐廳菜單</title>
    <link rel="stylesheet" href="../../css/vis5_style.css">
</head>
<body>
    <div class="frame">
        <div class="background-image"></div>
        <div class="edm-title">
            <div class="title-left">
                <img src="../../pic/VIS_logo.png" alt="Logo" class="title-logo">
                <span class="info-value">${esc(dateRange)}</span>
                <span class="info-location">${esc(location)}</span>
                <span class="info-value">${esc(mealPeriod)}</span>
            </div>
            <div class="title-right">
                <img src="../../pic/btw_side_logo_white.png" alt="side logo">
                <div class="title-right-text">※ 非供餐時段不提供取餐服務，若有不便敬請見諒</div>
            </div>
        </div>
        <div class="container-wrapper">
            <div class="container">
    `;

  // 依日期分組（維持插入順序＝時間順序）
  const dates = new Map<string, { weekday: string; day: string; items: MealItem[] }>();
  for (const item of data) {
    const date = item.日期;
    const weekdayShort = WEEKDAY_ABBR_MAP[item.星期] ?? item.星期;
    const day = String(parseInt(date.split('-').slice(-1)[0], 10));
    if (!dates.has(date)) {
      dates.set(date, { weekday: weekdayShort, day, items: [] });
    }
    dates.get(date)!.items.push(item);
  }

  const totalDays = dates.size;

  for (const dateInfo of dates.values()) {
    html += `
        <div class="date-section">
            <div class="date-info">
                <div class="weekday">${esc(dateInfo.weekday)}</div>
                <div class="day">${esc(dateInfo.day)}</div>
            </div>
            <div class="restaurants-grid">
        `;

    // 分時段 → 分餐廳
    const mealPeriods = new Map<string, Map<string, MealItem[]>>();
    for (const item of dateInfo.items) {
      const period = item.時段;
      if (!mealPeriods.has(period)) mealPeriods.set(period, new Map());
      const restMap = mealPeriods.get(period)!;
      const restName = item.餐廳名稱;
      if (!restMap.has(restName)) restMap.set(restName, []);
      restMap.get(restName)!.push(item);
    }

    for (const [period, restaurants] of mealPeriods) {
      // 補空日的 period 為空字串，整天略過（同 Python 的 if item['時段'] != ""）
      if (period === '') continue;

      // 天數 > 2 時，限制每天最多 2 個餐廳區塊
      const mergedRestaurants =
        totalDays > 2 ? mergeRestaurantsForLayout(restaurants) : restaurants;

      const restaurantsCountToday = mergedRestaurants.size;

      for (const [restName, restItems] of mergedRestaurants) {
        const totalItems = restItems.length;

        let useCompactStyle = false;
        let itemsPerGroup = 3;
        let totalGroups = 1;
        let groupSizes: number[] | null = null;

        if (totalDays > 2 && restaurantsCountToday === 1) {
          if (totalItems <= 6) {
            itemsPerGroup = 3;
            totalGroups = Math.ceil(totalItems / itemsPerGroup);
            useCompactStyle = false;
          } else {
            totalGroups = 2;
            let firstGroupSize = Math.floor(totalItems / 2);
            if (totalItems % 2 === 1) {
              firstGroupSize = Math.floor((totalItems - 1) / 2);
            }
            groupSizes = [firstGroupSize, totalItems - firstGroupSize];
            useCompactStyle = true;
          }
        } else if (totalDays > 2 && totalItems > 3) {
          useCompactStyle = true;
          itemsPerGroup = totalItems;
          totalGroups = 1;
        } else {
          itemsPerGroup = 3;
          totalGroups = Math.ceil(totalItems / itemsPerGroup);
        }

        const labelHtml = restaurantLabelHtml(restName);
        const compactClass = useCompactStyle ? ' compact-style' : '';

        for (let groupIndex = 0; groupIndex < totalGroups; groupIndex++) {
          let startIdx: number;
          let endIdx: number;
          if (groupSizes && groupIndex < groupSizes.length) {
            startIdx = groupSizes.slice(0, groupIndex).reduce((a, b) => a + b, 0);
            endIdx = startIdx + groupSizes[groupIndex];
          } else {
            startIdx = groupIndex * itemsPerGroup;
            endIdx = Math.min((groupIndex + 1) * itemsPerGroup, totalItems);
          }

          const currentItems = restItems.slice(startIdx, endIdx);
          if (currentItems.length === 0) continue;
          const displayName =
            totalGroups === 1 ? labelHtml : `${labelHtml} (${groupIndex + 1})`;
          const headImg =
            currentItems[0].圖片網址 && currentItems[0].圖片網址!.trim()
              ? currentItems[0].圖片網址!
              : DEFAULT_IMAGE;

          html += `
                    <div class="restaurant-section${compactClass}">
                        <div class="menu-content">
                            <div class="restaurant-info">
                                <div class="restaurant-name">${displayName}</div>
                            </div>
                            <div class="menu-details">
                                <div class="menu-image">
                                    <img src="${esc(headImg)}" alt="${esc(currentItems[0].餐點名稱)}">
                                </div>
                                <div class="menu-items${compactClass}">
        `;

          for (const item of currentItems) {
            html += `
                                    <div class="menu-row${compactClass}">
                                        <div class="menu-name${compactClass}">
                                            <span class="chinese-name${compactClass}">${esc(item.餐點名稱)}</span>
                                            <span class="english-name${compactClass}">${item.英文名稱 ? esc(item.英文名稱) : '&nbsp;'}</span>
                                        </div>
                                        <div class="price${compactClass}">
                                            <span class="price-prefix${compactClass}">NT$</span>
                                            <span class="price-number${compactClass}">${esc(item.售價)}</span>
                                        </div>
                                    </div>
        `;
          }

          html += `
                                </div>
                            </div>
                        </div>
                    </div>
                    `;
        }
      }
    }

    html += `
            </div>
        </div>
        `;
  }

  html += `
        </div>
    </div>
</body>
</html>
`;

  return { html, warnings };
}

// ==================== 主入口 ====================

/**
 * 把原始餐點資料轉成一份或多份 EDM HTML。
 *
 * 流程：
 *   1. 清理餐廳名稱、補英文名稱欄位
 *   2. 依「據點 + 時段」分組
 *   3. 各組依日期排序，按週（週一為錨）切分
 *   4. 平日（週一~五）固定補滿五天輸出一張；
 *      週末（週六日）若有資料則補滿兩天輸出一張（檔名加 _weekend）
 */
export function convertVisEdm(meals: MealItem[]): ConvertedMenu[] {
  if (!Array.isArray(meals) || meals.length === 0) {
    throw new Error('JSON 內容必須是非空的餐點資料陣列');
  }

  // 前處理：清理餐廳名稱、補英文名稱欄位
  const cleaned = meals.map((m) => {
    if (!m.餐點名稱 || !m.據點 || !m.時段 || !m.日期) {
      throw new Error('每筆資料都必須有 餐點名稱、據點、時段、日期 欄位');
    }
    return {
      ...m,
      餐廳名稱: cleanRestaurantName(m.餐廳名稱 ?? ''),
      英文名稱: m.英文名稱 ?? null,
    };
  });

  // 依 據點 + 時段 分組
  const groups = new Map<string, MealItem[]>();
  for (const m of cleaned) {
    const key = `${m.據點}|${m.時段}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(m);
  }

  const result: ConvertedMenu[] = [];

  for (const items of groups.values()) {
    const rawLocation = items[0].據點;
    const mealTime = items[0].時段;

    // 依日期排序後，按週（週一錨點）切分
    items.sort((a, b) => a.日期.localeCompare(b.日期));
    const weeks = new Map<string, MealItem[]>();
    for (const item of items) {
      const dt = dateToObj(item.日期);
      const monday = addDays(dt, -pyWeekday(dt));
      const wkKey = fmtYmd(monday);
      if (!weeks.has(wkKey)) weeks.set(wkKey, []);
      weeks.get(wkKey)!.push(item);
    }

    const sortedWeekKeys = Array.from(weeks.keys()).sort();

    for (const wkKey of sortedWeekKeys) {
      const weekItems = weeks.get(wkKey)!;
      const monday = dateToObj(wkKey);

      const weekdayItems = weekItems.filter((i) => pyWeekday(dateToObj(i.日期)) < 5);
      const weekendItems = weekItems.filter((i) => pyWeekday(dateToObj(i.日期)) >= 5);

      // ---- 平日：固定補滿週一~週五 ----
      if (weekdayItems.length > 0) {
        const dayBuckets = new Map<string, MealItem[]>();
        for (const i of weekdayItems) {
          if (!dayBuckets.has(i.日期)) dayBuckets.set(i.日期, []);
          dayBuckets.get(i.日期)!.push(i);
        }
        const seq: MealItem[] = [];
        for (let offset = 0; offset < 5; offset++) {
          const dt = addDays(monday, offset);
          const ymd = fmtYmd(dt);
          const dayItems = dayBuckets.get(ymd);
          if (dayItems) seq.push(...dayItems);
          else seq.push(createEmptyRecord(ymd, PY_WEEKDAY_EN[offset]));
        }

        const start = fmtMmdd(monday);
        const end = fmtMmdd(addDays(monday, 4));
        const { html, warnings } = generateMenuHtml(seq);
        result.push({
          filename: `${rawLocation}_${mealTime}_${start}_${end}.html`,
          html,
          meta: {
            location: convertLocationName(rawLocation),
            mealTime,
            date: `${start}_${end}`,
            itemCount: weekdayItems.length,
            warnings,
          },
        });
      }

      // ---- 週末：有資料才輸出，補滿週六日 ----
      if (weekendItems.length > 0) {
        const sat = addDays(monday, 5);
        const sun = addDays(monday, 6);
        const dayBuckets = new Map<string, MealItem[]>();
        for (const i of weekendItems) {
          if (!dayBuckets.has(i.日期)) dayBuckets.set(i.日期, []);
          dayBuckets.get(i.日期)!.push(i);
        }
        const seq: MealItem[] = [];
        for (const dt of [sat, sun]) {
          const ymd = fmtYmd(dt);
          const dayItems = dayBuckets.get(ymd);
          if (dayItems) seq.push(...dayItems);
          else seq.push(createEmptyRecord(ymd, PY_WEEKDAY_EN[pyWeekday(dt)]));
        }

        const start = fmtMmdd(sat);
        const end = fmtMmdd(sun);
        const { html, warnings } = generateMenuHtml(seq);
        result.push({
          filename: `${rawLocation}_${mealTime}_${start}_${end}_weekend.html`,
          html,
          meta: {
            location: convertLocationName(rawLocation),
            mealTime,
            date: `${start}_${end}`,
            itemCount: weekendItems.length,
            warnings,
          },
        });
      }
    }
  }

  return result;
}

export const convertVisEdmTv = makeTvConvert(convertVisEdm, 1920, 1080);
