/**
 * 聯發科 行善/瑞光（TP-R / TP-X）直式週菜單 EDM
 * 由 BTW_EDM_3.0/edm_module/b_med_tprx.py 移植。
 *
 * 與標準 b_h1 差異：當某日「只有 1 間餐廳」且該餐廳餐點 ≥ 4 道時，
 * 拆成兩個並排框架（前半 / 後半，各自一張圖）。其餘為標準含圖版面。
 * 英文名為空時以 &nbsp; 佔位（同舊版）。
 * CSS 已預生成為 public/signage-assets/css/b_med_tprx.css。
 */
import {
  type MealItem,
  type ConvertedMenu,
  esc,
  buildHead,
  buildTitleOpen,
  buildFooter,
  buildWeekWindow,
  weeklyConvert,
  type B1Images,
  type B1Notices,
} from './_b_h1_common';
import { makeTvConvert } from './_tv';
import { MED_LOC } from './b_med_s';

const CSS_PATH = '../../css/b_med_tprx.css';
const IMAGES: B1Images = {
  corner_logo: '../../pic/btw_side_logo_white.png',
  company_logo: '../../pic/logos/mediatek_logo.png',
  qr_code: '../../pic/qrcode/qr_mediatek.png',
};
const QR_TEXT = '註冊&客服專線';
const COPYRIGHT = '© 2025 浩華企業股份有限公司 By The Way. All rights reserved.';
const NOTICES: B1Notices = {
  訂餐時間: '午餐時段 當日 10:00 前 、晚餐時段 當日 16:00 前',
  取餐時間: '午餐時段 11:50-13:30 、晚餐時段 17:30-19:30',
  異常處理: '請掃碼QRCode，或搜尋@mtktw聯絡客服由專人為您服務。',
  補充說明: '※非供餐時段不提供取餐服務，若有不便敬請見諒。',
};
const MEAL_MAP: Record<string, string> = { 午餐: '午餐', 晚餐: '晚餐' };
/** tprx 多了 TP-R OT 兩個對照 */
const TPRX_LOC: Record<string, string> = {
  ...MED_LOC,
  'TP-R OT/DS': '行善/瑞光',
  'TP-R OT_DS': '行善/瑞光',
};

/** 一列餐點（英文名空 → &nbsp;） */
function menuRow(item: MealItem): string {
  return `
                                    <div class="menu-row">
                                        <div class="menu-name">
                                            <span class="chinese-name">${esc(item.餐點名稱)}</span>
                                            <span class="english-name">${item.英文名稱 ? esc(item.英文名稱) : '&nbsp;'}</span>
                                        </div>
                                        <div class="price">
                                            <span class="price-prefix">NT$</span>
                                            <span class="price-number">${esc(item.售價)}</span>
                                        </div>
                                    </div>
                            `;
}

/** 一個餐廳框架（標題＋圖＋指定餐點） */
function restaurantFrame(restName: string, img: string, alt: string, items: MealItem[]): string {
  let h = `
                        <div class="restaurant-section">
                            <div class="menu-content">
                                <div class="restaurant-name">${esc(restName)}</div>
                                <div class="menu-details">
                                    <div class="menu-image">
                                        <img src="${esc(img)}" alt="${esc(alt)}">
                                    </div>
                                    <div class="menu-items">
                        `;
  for (const item of items) h += menuRow(item);
  h += `
                                    </div>
                                </div>
                            </div>
                        </div>
                        `;
  return h;
}

function generateHtml(data: MealItem[]): string {
  const firstItem = data.find((it) => it.據點) ?? data[0];
  const datesList = Array.from(new Set(data.map((it) => it.日期))).sort();
  const sp = datesList[0].split('-').slice(-2);
  const ep = datesList[datesList.length - 1].split('-').slice(-2);
  const dateRange = `${sp[0]}/${sp[1]}-${ep[0]}/${ep[1]}`;
  const location = TPRX_LOC[firstItem.據點 || '聯發科'] ?? (firstItem.據點 || '聯發科');

  const mealSet = new Set<string>();
  for (const it of data) mealSet.add(MEAL_MAP[it.時段 || '午餐'] ?? (it.時段 || '午餐'));
  const mealList = Array.from(mealSet).sort();
  const mealPeriodDisplay = mealList.length > 1 ? mealList.join(' / ') : mealList[0] ?? '午餐';

  let html = buildHead(CSS_PATH, 1080, 1528);
  html += buildTitleOpen(IMAGES, dateRange, location, mealPeriodDisplay);

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
        if (!mealPeriods.has(it.時段)) mealPeriods.set(it.時段, new Map());
        const rm = mealPeriods.get(it.時段)!;
        if (!rm.has(it.餐廳名稱)) rm.set(it.餐廳名稱, []);
        rm.get(it.餐廳名稱)!.push(it);
      }
      const totalRestaurants = Array.from(mealPeriods.values()).reduce((a, m) => a + m.size, 0);

      for (const restaurants of mealPeriods.values()) {
        for (const [restName, restItems] of restaurants) {
          if (totalRestaurants === 1 && restItems.length >= 4) {
            const perFrame = Math.floor((restItems.length + 1) / 2);
            const first = restItems.slice(0, perFrame);
            const second = restItems.slice(perFrame);
            const secondImgItem = restItems[perFrame] ?? restItems[0];
            html += restaurantFrame(restName, first[0].圖片網址 ?? '', first[0].餐點名稱, first);
            html += restaurantFrame(restName, secondImgItem.圖片網址 ?? '', secondImgItem.餐點名稱, second);
          } else {
            html += restaurantFrame(restName, restItems[0].圖片網址 ?? '', restItems[0].餐點名稱, restItems);
          }
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

export function convertBMedTprx(meals: MealItem[]): ConvertedMenu[] {
  return weeklyConvert(meals, (raw) => TPRX_LOC[raw] ?? raw, generateHtml);
}

export const convertBMedTprxTv = makeTvConvert(convertBMedTprx, 1080, 1528);
