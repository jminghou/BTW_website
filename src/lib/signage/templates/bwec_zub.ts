/**
 * 華邦竹北 橫式週海報 EDM
 * 由 BTW_EDM_3.0/edm_module/bwec_zub.py 移植。
 *
 * 版面與 vis_edm（VIS 橫式週海報）相同：天數 > 2 時把餐廳合併成最多 2 塊、
 * 品項多時用 compact 緊湊樣式。差異：wec_zub.css、winbond logo、不顯示英文名、
 * 售價為餐補後價 max(0, 原價-40)、僅平日（無週末檔）。
 * CSS 已從舊專案複製到 public/signage-assets/css/wec_zub.css。
 */
import {
  type MealItem,
  type ConvertedMenu,
  esc,
  pad2,
  cleanRestaurantName,
  dateToObj,
  pyWeekday,
  fmtYmd,
  fmtMmdd,
  addDays,
} from './_b_h1_common';

const LOCATION_MAP: Record<string, string> = {
  南港辦公室: '南港辦公室',
  台南大樓: '台南大樓',
  華邦竹北大樓: '竹北大樓',
  新唐竹北大樓: '竹北大樓',
};
const WEEKDAY_ABBR_MAP: Record<string, string> = {
  Monday: 'MON', Tuesday: 'TUE', Wednesday: 'WED', Thursday: 'THU', Friday: 'FRI', Saturday: 'SAT', Sunday: 'SUN',
  星期一: 'MON', 星期二: 'TUE', 星期三: 'WED', 星期四: 'THU', 星期五: 'FRI', 星期六: 'SAT', 星期日: 'SUN',
};
const PY_WEEKDAY_EN = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const DEFAULT_IMAGE = '../../pic/暫缺圖片_便當.png';

function priceInt(v: string | number): number {
  const n = parseInt(String(v ?? ''), 10);
  return Number.isNaN(n) ? 0 : n;
}
/** 餐補後售價：純數字 → max(0, n-40)；否則維持原值（同舊版 isdigit 判斷） */
function zubPrice(v: string | number): string | number {
  const s = String(v ?? '').trim();
  if (v && /^\d+$/.test(s)) return Math.max(0, parseInt(s, 10) - 40);
  return v;
}
function restaurantLabelHtml(name: string): string {
  return String(name ?? '').split('<br>').map((p) => esc(p)).join('<br>');
}
function createEmptyRecord(date: string, weekdayEn: string): MealItem {
  return { 餐點名稱: '', 英文名稱: null, 售價: '', 圖片網址: '', 餐廳名稱: '', 據點: '', 時段: '', 日期: date, 星期: weekdayEn };
}

/** 合併餐廳，確保最多 2 個區塊（同 vis_edm / Python merge_restaurants_for_layout） */
function mergeRestaurantsForLayout(restaurants: Map<string, MealItem[]>): Map<string, MealItem[]> {
  if (restaurants.size <= 2) return restaurants;
  const infos = Array.from(restaurants.entries()).map(([name, items]) => ({
    name, count: items.length, maxPrice: Math.max(...items.map((it) => priceInt(it.售價))), items,
  }));
  infos.sort((a, b) => a.count - b.count || a.maxPrice - b.maxPrice);
  const merged = new Map<string, MealItem[]>();
  if (restaurants.size === 3) {
    const [r1, r2, r3] = infos;
    merged.set(`${r1.name}<br>${r2.name}`, [...r1.items, ...r2.items].slice(0, 6));
    merged.set(r3.name, r3.items);
  } else {
    const mid = Math.floor(infos.length / 2);
    const g1 = infos.slice(0, mid);
    const g2 = infos.slice(mid);
    merged.set(g1.map((r) => r.name).join('<br>'), g1.flatMap((r) => r.items).slice(0, 6));
    merged.set(g2.map((r) => r.name).join('<br>'), g2.flatMap((r) => r.items).slice(0, 6));
  }
  return merged;
}

/** 產生單一份（一週、單一據點+時段、已補滿週一~五）的橫式 EDM HTML */
function generateMenuHtml(data: MealItem[]): string {
  const firstItem = data.find((it) => it.據點) ?? data[0];
  const datesList = Array.from(new Set(data.map((it) => it.日期))).sort();
  const sp = datesList[0].split('-').slice(-2);
  const ep = datesList[datesList.length - 1].split('-').slice(-2);
  const dateRange = `${sp[0]}/${sp[1]}-${ep[0]}/${ep[1]}`;
  const rawLocation = firstItem.據點 || '世界先進五廠 fab5';
  const location = LOCATION_MAP[rawLocation] ?? rawLocation;
  const mealPeriod = firstItem.時段 || '午餐';

  let html = `<!DOCTYPE html>
<html lang="zh-TW">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>餐廳菜單</title>
    <link rel="stylesheet" href="../../css/wec_zub.css">
</head>
<body>
    <div class="frame">
        <div class="background-image"></div>
        <div class="edm-title">
            <div class="title-left">
                <img src="../../pic/logos/winbond_logo.png" alt="Logo" class="title-logo">
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

  const dates = new Map<string, { weekday: string; day: string; items: MealItem[] }>();
  for (const item of data) {
    const date = item.日期;
    const weekdayShort = WEEKDAY_ABBR_MAP[item.星期 ?? ''] ?? item.星期 ?? '';
    const day = String(parseInt(date.split('-').slice(-1)[0], 10));
    if (!dates.has(date)) dates.set(date, { weekday: weekdayShort, day, items: [] });
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

    const mealPeriods = new Map<string, Map<string, MealItem[]>>();
    for (const item of dateInfo.items) {
      const period = item.時段;
      if (!mealPeriods.has(period)) mealPeriods.set(period, new Map());
      const restMap = mealPeriods.get(period)!;
      if (!restMap.has(item.餐廳名稱)) restMap.set(item.餐廳名稱, []);
      restMap.get(item.餐廳名稱)!.push(item);
    }

    for (const [period, restaurants] of mealPeriods) {
      if (period === '') continue; // 補空日整天略過
      const mergedRestaurants = totalDays > 2 ? mergeRestaurantsForLayout(restaurants) : restaurants;
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
            if (totalItems % 2 === 1) firstGroupSize = Math.floor((totalItems - 1) / 2);
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
          const displayName = totalGroups === 1 ? labelHtml : `${labelHtml} (${groupIndex + 1})`;
          const headImg =
            currentItems[0].圖片網址 && currentItems[0].圖片網址!.trim() ? currentItems[0].圖片網址! : DEFAULT_IMAGE;

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
                                        </div>
                                        <div class="price${compactClass}">
                                            <span class="price-prefix${compactClass}">NT$</span>
                                            <span class="price-number${compactClass}">${esc(zubPrice(item.售價))}</span>
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
  return html;
}

/** 依「據點+時段」分組、按週切分（僅平日，補滿週一~五；無週末檔） */
export function convertBwecZub(meals: MealItem[]): ConvertedMenu[] {
  if (!Array.isArray(meals) || meals.length === 0) {
    throw new Error('JSON 內容必須是非空的餐點資料陣列');
  }
  const cleaned = meals
    .filter((m) => m.餐點名稱 && m.據點 && m.時段 && m.日期)
    .map((m) => ({ ...m, 餐廳名稱: cleanRestaurantName(m.餐廳名稱 ?? ''), 英文名稱: m.英文名稱 ?? null }));
  if (cleaned.length === 0) throw new Error('沒有可用的餐點資料');

  const groups = new Map<string, MealItem[]>();
  for (const m of cleaned) {
    const k = `${m.據點}|${m.時段}`;
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k)!.push(m);
  }

  const result: ConvertedMenu[] = [];
  for (const items of groups.values()) {
    const rawLocation = items[0].據點;
    const mealTime = items[0].時段;
    items.sort((a, b) => a.日期.localeCompare(b.日期));

    const weeks = new Map<string, MealItem[]>();
    for (const item of items) {
      const monday = addDays(dateToObj(item.日期), -pyWeekday(dateToObj(item.日期)));
      const wk = fmtYmd(monday);
      if (!weeks.has(wk)) weeks.set(wk, []);
      weeks.get(wk)!.push(item);
    }

    for (const wk of Array.from(weeks.keys()).sort()) {
      const weekItems = weeks.get(wk)!;
      const monday = dateToObj(wk);
      const weekdayItems = weekItems.filter((i) => pyWeekday(dateToObj(i.日期)) < 5);
      if (weekdayItems.length === 0) continue;

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
      result.push({
        filename: `${rawLocation}_${mealTime}_${start}_${end}.html`,
        html: generateMenuHtml(seq),
        meta: {
          location: LOCATION_MAP[rawLocation] ?? rawLocation,
          mealTime,
          date: `${start}_${end}`,
          itemCount: weekdayItems.length,
          warnings: [],
        },
      });
    }
  }
  return result;
}

import { makeTvConvert } from './_tv';
export const convertBwecZubTv = makeTvConvert(convertBwecZub, 1920, 1080);
