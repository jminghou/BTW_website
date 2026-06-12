/**
 * 橫式「整月合併」EDM 共用產生器（b2 系列：奕力/立錡 飲料、奕力 晚餐4欄）
 *
 * 版面（template_b2_h1 / b2_4x，1528×1080）：依「據點」彙整所有平日日期為一張，
 * 逐日列出（日期標籤 MM/DD（中文星期）），每間餐廳一張圖＋餐點列，頁尾僅版權。
 * 對應舊版以 json_workday2 過濾平日＋清理餐廳名後合併。
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

export interface LandscapeOptions {
  cssPath: string;
  images: B1Images;
  copyright: string;
  resolveLocation: (raw: string) => string;
  defaultLocation: string;
  mealPeriodMap: Record<string, string>;
  defaultMeal: string;
  frameW: number;
  frameH: number;
  /** 是否顯示售價（飲料版 true；晚餐4欄版 false） */
  showPrice: boolean;
  /** 售價轉換（立錡飲料 -5）；非純數字維持原值 */
  priceTransform?: (price: string | number) => string | number;
  /** 額外 inline 樣式（晚餐4欄版的 .container/.date-section 覆寫） */
  extraInlineStyle?: string;
}

function generateHtml(data: MealItem[], opts: LandscapeOptions): string {
  const datesList = Array.from(new Set(data.map((it) => it.日期))).sort();
  const sp = datesList[0].split('-');
  const ep = datesList[datesList.length - 1].split('-');
  const dateRange = `${sp[1]}/${sp[2]}-${ep[1]}/${ep[2]}`;

  const rawLoc = data[0].據點 || opts.defaultLocation;
  const location = opts.resolveLocation(rawLoc);
  const rawMeal = data[0].時段 || opts.defaultMeal;
  const mealPeriod = opts.mealPeriodMap[rawMeal] ?? rawMeal;

  let html = buildHead(opts.cssPath, opts.frameW, opts.frameH, opts.extraInlineStyle ?? '');
  html += buildTitleOpen(opts.images, dateRange, location, mealPeriod);

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
        const priceDiv = opts.showPrice
          ? `
                                    <div class="price">
                                        <span class="price-prefix">NT$</span>
                                        <span class="price-number">${esc(opts.priceTransform ? opts.priceTransform(item.售價) : item.售價)}</span>
                                    </div>`
          : '';
        html += `
                                <div class="menu-row">
                                    <div class="menu-name">
                                        <span class="chinese-name">${esc(item.餐點名稱)}</span>
                                        <span class="english-name">${esc(item.英文名稱 ?? '')}</span>
                                    </div>${priceDiv}
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
            <div class="copyright">${esc(opts.copyright)}</div>
        </div>
    </body>
    </html>
    `;
  return html;
}

/** 依「據點」合併所有平日日期為一張橫式 EDM（清理餐廳名、過濾平日） */
export function createLandscapeConvert(opts: LandscapeOptions) {
  return (meals: MealItem[]): ConvertedMenu[] => {
    if (!Array.isArray(meals) || meals.length === 0) {
      throw new Error('JSON 內容必須是非空的餐點資料陣列');
    }
    const valid = meals
      .filter((m) => m.日期 && m.餐點名稱 && m.餐廳名稱 && pyWeekday(dateToObj(m.日期)) < 5)
      .map((m) => ({ ...m, 餐廳名稱: cleanRestaurantName(m.餐廳名稱 ?? ''), 英文名稱: m.英文名稱 ?? null }));
    if (valid.length === 0) {
      throw new Error('沒有可用的平日餐點資料（需含 餐點名稱、餐廳名稱、日期）');
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
      const ds = Array.from(new Set(items.map((it) => it.日期))).sort();
      const sp = ds[0].split('-');
      const ep = ds[ds.length - 1].split('-');
      const location = opts.resolveLocation(items[0].據點 || opts.defaultLocation);
      const mealPeriod = opts.mealPeriodMap[items[0].時段 || opts.defaultMeal] ?? (items[0].時段 || opts.defaultMeal);
      result.push({
        filename: `${location}_${mealPeriod}_${sp[1]}-${sp[2]}_${ep[1]}-${ep[2]}.html`,
        html: generateHtml(items, opts),
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
  };
}
