/**
 * 鴻佰竹北 自費飲料 橫式 EDM
 * 由 BTW_EDM_3.0/edm_module/b_cesbg_hs_drink.py 移植。
 *
 * 與直式 b_h1 系列差異很大：
 *   - 橫式 1528×1080
 *   - 不按週切分、不補空白日：把（同一時段的）所有平日日期合併成「一張」EDM，
 *     依日期排序逐日列出（對應舊版「讀取整個 working_json 後合併」的行為）
 *   - 日期標籤為「MM/DD (中文星期)」，無英文星期縮寫
 *   - 頁尾只有版權，無 QR 與須知
 * CSS 已預生成為 public/signage-assets/css/b_cesbg_hs_drink.css。
 */
import {
  type MealItem,
  type ConvertedMenu,
  esc,
  WEEKDAY_CH,
  cleanRestaurantName,
  dateToObj,
  pyWeekday,
  buildHead,
  buildTitleOpen,
  type B1Images,
} from './_b_h1_common';
import { makeTvConvert } from './_tv';

const CSS_PATH = '../../css/b_cesbg_hs_drink.css';
const IMAGES: B1Images = {
  corner_logo: '../../pic/btw_side_logo_white.png',
  company_logo: '../../pic/logos/ingrasys_logo.png',
  qr_code: '../../pic/qrcode/qr_cesbg_hs.png',
};
const COPYRIGHT = '© 2025 浩華企業股份有限公司 By The Way. All rights reserved.';
const LOCATION = '鴻佰竹北';
const MEAL_PERIOD_MAP: Record<string, string> = {
  午餐: '午餐時段',
  晚餐: '晚餐時段',
  下午茶: '自費飲料',
};

/** 把「同一時段、所有日期」的資料產生一張橫式 EDM */
function generateHtml(data: MealItem[]): string {
  const datesList = Array.from(new Set(data.map((it) => it.日期))).sort();
  const sp = datesList[0].split('-');
  const ep = datesList[datesList.length - 1].split('-');
  const dateRange = `${sp[1]}/${sp[2]}-${ep[1]}/${ep[2]}`;

  const rawMeal = data[0].時段 || '午餐';
  const mealPeriod = MEAL_PERIOD_MAP[rawMeal] ?? rawMeal;

  let html = buildHead(CSS_PATH, 1528, 1080);
  html += buildTitleOpen(IMAGES, dateRange, LOCATION, mealPeriod);

  // 按日期 → 餐廳分組
  const byDate = new Map<string, Map<string, MealItem[]>>();
  for (const it of data) {
    if (!byDate.has(it.日期)) byDate.set(it.日期, new Map());
    const rm = byDate.get(it.日期)!;
    if (!rm.has(it.餐廳名稱)) rm.set(it.餐廳名稱, []);
    rm.get(it.餐廳名稱)!.push(it);
  }

  for (const date of Array.from(byDate.keys()).sort()) {
    const restaurants = byDate.get(date)!;
    const parts = date.split('-');
    const month = parts[1];
    const day = String(parseInt(parts[parts.length - 1], 10));
    const firstRest = Array.from(restaurants.values())[0][0];
    const weekdayCh = WEEKDAY_CH[firstRest.星期 ?? ''] ?? '';

    html += `
        <div class="date-section">
            <div class="date-info">
                <div class="date-display">${month}/${day} (${weekdayCh})</div>
            </div>
            <div class="restaurants-grid">
        `;

    for (const [restName, items] of restaurants) {
      if (items.length === 0) continue;
      const img = items[0].圖片網址 && items[0].圖片網址!.trim() ? items[0].圖片網址! : '';
      html += `
                <div class="restaurant-section">
                    <div class="menu-content">
                        <div class="restaurant-name">${esc(restName)}</div>
                        <div class="menu-details">
                            <div class="menu-image">
                                <img src="${esc(img)}" alt="${esc(items[0].餐點名稱)}">
                            </div>
                            <div class="menu-items">
            `;
      for (const item of items) {
        html += `
                                <div class="menu-row">
                                    <div class="menu-name">
                                        <span class="chinese-name">${esc(item.餐點名稱)}</span>
                                        <span class="english-name">${esc(item.英文名稱 ?? '')}</span>
                                    </div>
                                    <div class="price">
                                        <span class="price-prefix">NT$</span>
                                        <span class="price-number">${esc(item.售價)}</span>
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

    html += `
            </div>
        </div>
        `;
  }

  html += `
                </div>
            </div>
            <div class="copyright">${esc(COPYRIGHT)}</div>
        </div>
    </body>
    </html>
    `;
  return html;
}

/**
 * 依「時段」分組（據點固定鴻佰竹北），每個時段把所有平日日期合併成一張橫式 EDM。
 * 檔名：鴻佰竹北_<mapped時段>_<起MM-DD>_<迄MM-DD>.html
 */
export function convertBCesbgHsDrink(meals: MealItem[]): ConvertedMenu[] {
  if (!Array.isArray(meals) || meals.length === 0) {
    throw new Error('JSON 內容必須是非空的餐點資料陣列');
  }

  const cleaned = meals
    .filter((m) => m.日期 && m.時段 && pyWeekday(dateToObj(m.日期)) < 5)
    .map((m) => ({ ...m, 餐廳名稱: cleanRestaurantName(m.餐廳名稱 ?? ''), 英文名稱: m.英文名稱 ?? null }))
    .filter((m) => m.餐點名稱 && m.餐廳名稱);

  if (cleaned.length === 0) {
    throw new Error('沒有可用的平日餐點資料（需含 餐點名稱、餐廳名稱、時段、日期）');
  }

  // 依時段分組（一般情況下飲料只有單一時段）
  const groups = new Map<string, MealItem[]>();
  for (const m of cleaned) {
    if (!groups.has(m.時段)) groups.set(m.時段, []);
    groups.get(m.時段)!.push(m);
  }

  const result: ConvertedMenu[] = [];
  for (const items of groups.values()) {
    items.sort((a, b) => a.日期.localeCompare(b.日期));
    const datesList = Array.from(new Set(items.map((it) => it.日期))).sort();
    const sp = datesList[0].split('-');
    const ep = datesList[datesList.length - 1].split('-');
    const rawMeal = items[0].時段;
    const mealPeriod = MEAL_PERIOD_MAP[rawMeal] ?? rawMeal;
    result.push({
      filename: `${LOCATION}_${mealPeriod}_${sp[1]}-${sp[2]}_${ep[1]}-${ep[2]}.html`,
      html: generateHtml(items),
      meta: {
        location: LOCATION,
        mealTime: mealPeriod,
        date: `${sp[1]}-${sp[2]}_${ep[1]}-${ep[2]}`,
        itemCount: items.length,
        warnings: [],
      },
    });
  }

  return result;
}

export const convertBCesbgHsDrinkTv = makeTvConvert(convertBCesbgHsDrink, 1528, 1080);
