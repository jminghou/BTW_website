/**
 * VIS 廣告機「每日版」
 * 由 BTW_EDM_3.0/edm_module/vis_ad_day2.py 移植（convert_ad_json_to_html）。
 *
 * 版面：每個日期一個 date-section（左側 sidebar：logo／星期＋日／據點／時段／日期＋提醒／底部 logo；
 * 右側 menu-grid：每道餐點一張卡，含餐廳名、圖、中英文名、介紹、售價）。
 * 自帶 vis_ad_day_style.css（已從舊專案複製到 public/signage-assets/css/）。
 *
 * 與其他版型不同：此為廣告機產品線，非 b_h1 EDM。依「據點+時段」彙整所有日期為一份。
 */
import { type MealItem, type ConvertedMenu, esc } from './_b_h1_common';
import { makeTvConvert } from './_tv';

const LOCATION_MAP: Record<string, string> = {
  '世界先進一廠 fab1': 'FAB 1',
  '世界先進二廠 fab2': 'FAB 2',
  '世界先進三廠 fab3': 'FAB 3',
};
const MEAL_MAP: Record<string, string> = { 午餐: '午餐', 晚餐: '晚餐' };
/** 星期對照（同舊版：僅英文鍵，中文星期會原樣顯示） */
const WEEKDAY_ABBR: Record<string, string> = {
  Monday: 'MON', Tuesday: 'TUE', Wednesday: 'WED', Thursday: 'THU', Friday: 'FRI', Saturday: 'SAT', Sunday: 'SUN',
};

function generateHtml(data: MealItem[]): string {
  let html = `
<!DOCTYPE html>
<html lang="zh-TW">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>餐廳菜單</title>
    <link rel="stylesheet" href="../../css/vis_ad_day_style.css">
</head>
<body>
    <div class="container">
`;

  // 按日期分組（維持插入順序）
  const dates = new Map<string, { weekday: string; day: string; items: MealItem[] }>();
  for (const item of data) {
    const date = item.日期;
    const weekdayShort = WEEKDAY_ABBR[item.星期 ?? ''] ?? item.星期 ?? '';
    const day = String(parseInt(date.split('-').slice(-1)[0], 10));
    if (!dates.has(date)) dates.set(date, { weekday: weekdayShort, day, items: [] });
    dates.get(date)!.items.push(item);
  }

  for (const dateEntry of dates) {
    const date = dateEntry[0];
    const dateInfo = dateEntry[1];
    const firstItem = dateInfo.items[0] ?? ({} as MealItem);
    const location = LOCATION_MAP[firstItem.據點 ?? ''] ?? (firstItem.據點 ?? '');
    const mealTime = MEAL_MAP[firstItem.時段 ?? ''] ?? (firstItem.時段 ?? '');
    const formattedDate = date.replace(/-/g, '.');

    html += `
        <div class="date-section">
            <div class="sidebar">
                <div class="logo-info">
                    <img src="../../pic/vis-logo.png" alt="VIS Logo">
                </div>
                <div class="info-block date-info">
                    <div class="weekday">${esc(dateInfo.weekday)}</div>
                    <div class="day">${esc(dateInfo.day)}</div>
                </div>
                <div class="info-block location-info">
                    <div class="location">${esc(location)}</div>
                </div>
                <div class="info-block meal-time-info">
                    <div class="meal-time">${esc(mealTime)}</div>
                </div>
                <div class="date-text-info">
                    <div class="date-text">${esc(formattedDate)}</div>
                    <div class="notice-text">本系列餐點限VIS員工餐廳內供應，配菜依照季節調整</div>
                </div>
                <div class="bottom-logo-info">
                    <img src="../../pic/btw_logo-vis.png" alt="BTW Logo">
                </div>
            </div>
            <div class="menu-grid">
        `;

    for (const item of dateInfo.items) {
      const description = item.介紹 ?? '';
      html += `
                <div class="menu-item">
                    <div class="menu-content-outer">
                        <div class="restaurant-name">${esc(item.餐廳名稱)}</div>
                        <div class="menu-content-inner">
                            <div class="image-container">
                                <div class="menu-image">
                                    <img src="${esc(item.圖片網址 ?? '')}" alt="${esc(item.餐點名稱)}">
                                </div>
                            </div>
                            <div class="menu-info">
                                <div class="menu-name">
                                    <span class="chinese-name">${esc(item.餐點名稱)}</span>
                                    <span class="english-name">${esc(item.英文名稱 ?? '')}</span>
                                </div>
                                <div class="description">${esc(description)}</div>
                                <div class="price">
                                    <span class="price-prefix">NT$</span>
                                    <span class="price-number">${esc(item.售價)}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
    }

    html += `
            </div>
        </div>
        `;
  }

  html += `
    </div>
</body>
</html>
`;
  return html;
}

/** 依「據點+時段」彙整所有日期為一份廣告機 HTML */
export function convertVisAdDay2(meals: MealItem[]): ConvertedMenu[] {
  if (!Array.isArray(meals) || meals.length === 0) {
    throw new Error('JSON 內容必須是非空的餐點資料陣列');
  }
  const valid = meals.filter((m) => m.日期 && m.據點 != null);
  if (valid.length === 0) throw new Error('沒有可用的餐點資料');

  const groups = new Map<string, MealItem[]>();
  for (const m of valid) {
    const k = `${m.據點}|${m.時段}`;
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k)!.push(m);
  }

  const result: ConvertedMenu[] = [];
  for (const items of groups.values()) {
    items.sort((a, b) => a.日期.localeCompare(b.日期));
    const ds = Array.from(new Set(items.map((it) => it.日期))).sort();
    const sp = ds[0].split('-');
    const ep = ds[ds.length - 1].split('-');
    const rawLoc = items[0].據點;
    const location = LOCATION_MAP[rawLoc] ?? rawLoc;
    const mealTime = MEAL_MAP[items[0].時段] ?? items[0].時段;
    result.push({
      filename: `${location}_${mealTime}_${sp[1]}-${sp[2]}_${ep[1]}-${ep[2]}.html`,
      html: generateHtml(items),
      meta: {
        location,
        mealTime,
        date: `${sp[1]}-${sp[2]}_${ep[1]}-${ep[2]}`,
        itemCount: items.length,
        warnings: [],
      },
    });
  }
  return result;
}

export const convertVisAdDay2Tv = makeTvConvert(convertVisAdDay2, 1920, 1080);
