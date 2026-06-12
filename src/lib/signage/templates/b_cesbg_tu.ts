/**
 * CESBG 土城（鴻佰土城）直式週菜單 EDM
 * 由 BTW_EDM_3.0/edm_module/b_cesbg_tu.py 移植。
 *
 * 與標準 b_h1 的差異：當某日「只有 1 間餐廳」時，改用橫向圖卡版面
 * （restaurant-section_tu / menu-images_tu，每道菜一張圖＋名稱＋價格）；
 * 多間餐廳時走標準版面但不顯示英文名。
 * CSS 已預生成為 public/signage-assets/css/b_cesbg_tu.css。
 */
import {
  type MealItem,
  type ConvertedMenu,
  esc,
  DEFAULT_IMAGE,
  buildHead,
  buildTitleOpen,
  buildFooter,
  buildWeekWindow,
  weeklyConvert,
  type B1Images,
  type B1Notices,
} from './_b_h1_common';
import { makeTvConvert } from './_tv';

const CSS_PATH = '../../css/b_cesbg_tu.css';
const IMAGES: B1Images = {
  corner_logo: '../../pic/btw_side_logo_white.png',
  company_logo: '../../pic/logos/foxconn_logo.png',
  qr_code: '../../pic/qrcode/qr_cesbg_tu.png',
};
const QR_TEXT = '註冊&客服專線';
const COPYRIGHT = '© 2025 浩華企業股份有限公司 By The Way. All rights reserved.';
const NOTICES: B1Notices = {
  訂餐時間: '前一天 16:00 前',
  取餐時間: '午餐時段 12:00 起',
  異常處理: '請掃碼QRCode，或搜尋@cesbg_tc聯絡客服由專人為您服務。',
  補充說明: '※非供餐時段不提供取餐服務，若有不便敬請見諒。',
};
const MEAL_MAP: Record<string, string> = { 午餐: '午餐', 晚餐: '晚餐' };
const LOCATION = 'CESBG 土城';

/** tu 專屬的 <head> 內嵌樣式（橫向圖卡版面） */
const TU_INLINE_STYLE = `
        .menu-images_tu {
            display: flex;
            gap: 10px;
            margin-bottom: 15px;
        }
        .menu-image_tu {
            width: 200px;
            height: 200px;
            flex-shrink: 0;
        }
        .menu-image_tu img {
            width: 50%;
            height: 70%;
            object-fit: fill;
        }`;

function generateHtml(data: MealItem[]): string {
  const firstItem = data.find((it) => it.據點) ?? data[0];
  const datesList = Array.from(new Set(data.map((it) => it.日期))).sort();
  const sp = datesList[0].split('-').slice(-2);
  const ep = datesList[datesList.length - 1].split('-').slice(-2);
  const dateRange = `${sp[0]}/${sp[1]}-${ep[0]}/${ep[1]}`;

  const mealSet = new Set<string>();
  for (const it of data) {
    const raw = it.時段 || '午餐';
    mealSet.add(MEAL_MAP[raw] ?? raw);
  }
  const mealList = Array.from(mealSet).sort();
  const mealPeriodDisplay = mealList.length > 1 ? mealList.join(' / ') : mealList[0] ?? '午餐';

  let html = buildHead(CSS_PATH, 1080, 1528, TU_INLINE_STYLE);
  html += buildTitleOpen(IMAGES, dateRange, LOCATION, mealPeriodDisplay);

  const dateItems = new Map<string, MealItem[]>();
  for (const it of data) {
    if (!dateItems.has(it.日期)) dateItems.set(it.日期, []);
    dateItems.get(it.日期)!.push(it);
  }

  const cells = buildWeekWindow(new Set(dateItems.keys()), datesList[0], 'monday');

  for (const cell of cells) {
    html += `
        <div class="date-section">
            <div class="date-info">
                <div class="date-display">${cell.month}/${cell.day}  (${cell.weekdayCh})  ${cell.weekday}</div>
            </div>
            <div class="restaurants-grid">
        `;

    if (cell.hasData) {
      const mealPeriods = new Map<string, Map<string, MealItem[]>>();
      for (const it of dateItems.get(cell.dateStr)!) {
        const period = it.時段;
        if (!mealPeriods.has(period)) mealPeriods.set(period, new Map());
        const rm = mealPeriods.get(period)!;
        if (!rm.has(it.餐廳名稱)) rm.set(it.餐廳名稱, []);
        rm.get(it.餐廳名稱)!.push(it);
      }

      for (const restaurants of mealPeriods.values()) {
        const singleRestaurant = restaurants.size === 1;
        for (const [restName, restItems] of restaurants) {
          if (singleRestaurant) {
            // 單一餐廳：橫向圖卡版面
            html += `
                    <div class="restaurant-section_tu">
                        <div class="menu-content">
                            <div class="restaurant-name">${esc(restName)}</div>
                            <div class="menu-details">
                                <div class="menu-images_tu">
                        `;
            for (const item of restItems) {
              const img =
                item.圖片網址 && item.圖片網址.trim() ? item.圖片網址 : DEFAULT_IMAGE;
              html += `
                                    <div class="menu-image_tu">
                                        <img src="${esc(img)}" alt="${esc(item.餐點名稱)}">
                                        <div class="menu-caption">
                                            <span class="chinese-name">${esc(item.餐點名稱)}</span>
                                            <span class="price">${esc(item.售價)}</span>
                                        </div>
                                    </div>
                            `;
            }
          } else {
            // 多間餐廳：標準版面（不顯示英文名）
            const img =
              restItems[0].圖片網址 && restItems[0].圖片網址!.trim()
                ? restItems[0].圖片網址!
                : DEFAULT_IMAGE;
            html += `
                    <div class="restaurant-section">
                        <div class="menu-content">
                            <div class="restaurant-name">${esc(restName)}</div>
                            <div class="menu-details">
                                <div class="menu-image">
                                    <img src="${esc(img)}" alt="${esc(restItems[0].餐點名稱)}">
                                </div>
                                <div class="menu-items">
                    `;
            for (const item of restItems) {
              html += `
                                    <div class="menu-row">
                                        <div class="menu-name">
                                            <span class="chinese-name">${esc(item.餐點名稱)}</span>
                                        </div>
                                        <div class="price">
                                            <span class="price-prefix">NT$</span>
                                            <span class="price-number">${esc(item.售價)}</span>
                                        </div>
                                    </div>
                            `;
            }
          }
          // 共用收尾（4 個 </div>）
          html += `
                                </div>
                            </div>
                        </div>
                    </div>
                        `;
        }
      }
    } else {
      html += `
            <!-- 這一天沒有餐點數據，顯示空白區域 -->
            <div style="height: 180px;"></div>
            `;
    }

    html += `
            </div>
        </div>
        `;
  }

  html += buildFooter(IMAGES, QR_TEXT, NOTICES, COPYRIGHT);
  return html;
}

export function convertBCesbgTu(meals: MealItem[]): ConvertedMenu[] {
  return weeklyConvert(meals, () => LOCATION, generateHtml);
}

export const convertBCesbgTuTv = makeTvConvert(convertBCesbgTu, 1080, 1528);
