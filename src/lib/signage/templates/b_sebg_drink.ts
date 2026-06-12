/**
 * 奕力 自費飲料 橫式 EDM
 * 由 BTW_EDM_3.0/edm_module/b_sebg_drink.py 移植（該檔載入 b2_demo.json 設定）。
 *
 * 結構同 b_cesbg_hs_drink：橫式 1528×1080、所有日期合併為一張、逐日列出、
 * 頁尾僅版權。差異：使用 b2_demo 設定（奕力 logo/QR/據點時段對照），
 * 且不做平日過濾（沿用舊版 b_sebg_drink 行為）、依「據點」合併為一張。
 * CSS 已預生成為 public/signage-assets/css/b2_demo.css。
 */
import {
  type MealItem,
  type ConvertedMenu,
  esc,
  WEEKDAY_CH,
  buildHead,
  buildTitleOpen,
  type B1Images,
} from './_b_h1_common';
import { makeTvConvert } from './_tv';

const CSS_PATH = '../../css/b2_demo.css';
const IMAGES: B1Images = {
  corner_logo: '../../pic/btw_side_logo_white.png',
  company_logo: '../../pic/logos/ilitek_logo.png',
  qr_code: '../../pic/qrcode/qr-ilitek.png',
};
const COPYRIGHT = '© 2025 浩華企業股份有限公司 By The Way. All rights reserved.';
const LOC_MAP: Record<string, string> = {
  '奕力-午餐便當專區': '奕力',
  '奕力-晚餐便當專區': '奕力',
  '奕力-自費飲料專區': '奕力',
};
const MEAL_MAP: Record<string, string> = {
  午餐: '午餐時段',
  晚餐: '晚餐時段',
  下午茶: '自費飲料',
};

function generateHtml(data: MealItem[]): string {
  const datesList = Array.from(new Set(data.map((it) => it.日期))).sort();
  const sp = datesList[0].split('-');
  const ep = datesList[datesList.length - 1].split('-');
  const dateRange = `${sp[1]}/${sp[2]}-${ep[1]}/${ep[2]}`;

  const rawLoc = data[0].據點 || '奕力-午餐便當專區';
  const location = LOC_MAP[rawLoc] ?? rawLoc;
  const rawMeal = data[0].時段 || '午餐';
  const mealPeriod = MEAL_MAP[rawMeal] ?? rawMeal;

  let html = buildHead(CSS_PATH, 1528, 1080);
  html += buildTitleOpen(IMAGES, dateRange, location, mealPeriod);

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

/** 依「據點」合併所有日期為一張（不做平日過濾，沿用舊版 b_sebg_drink） */
export function convertBSebgDrink(meals: MealItem[]): ConvertedMenu[] {
  if (!Array.isArray(meals) || meals.length === 0) {
    throw new Error('JSON 內容必須是非空的餐點資料陣列');
  }
  const valid = meals.filter((m) => m.餐點名稱 && m.餐廳名稱 && m.日期);
  if (valid.length === 0) {
    throw new Error('沒有可用的餐點資料（需含 餐點名稱、餐廳名稱、日期）');
  }

  const groups = new Map<string, MealItem[]>();
  for (const m of valid) {
    const k = m.據點 || '';
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k)!.push(m);
  }

  const result: ConvertedMenu[] = [];
  for (const items of groups.values()) {
    items.sort((a, b) => a.日期.localeCompare(b.日期));
    const datesList = Array.from(new Set(items.map((it) => it.日期))).sort();
    const sp = datesList[0].split('-');
    const ep = datesList[datesList.length - 1].split('-');
    const rawLoc = items[0].據點 || '奕力-午餐便當專區';
    const location = LOC_MAP[rawLoc] ?? rawLoc;
    const rawMeal = items[0].時段 || '午餐';
    const mealPeriod = MEAL_MAP[rawMeal] ?? rawMeal;
    result.push({
      filename: `${location}_${mealPeriod}_${sp[1]}-${sp[2]}_${ep[1]}-${ep[2]}.html`,
      html: generateHtml(items),
      meta: {
        location,
        mealTime: mealPeriod,
        date: `${sp[1]}-${sp[2]}_${ep[1]}-${ep[2]}`,
        itemCount: items.length,
        warnings: [],
      },
    });
  }
  return result;
}

export const convertBSebgDrinkTv = makeTvConvert(convertBSebgDrink, 1528, 1080);
