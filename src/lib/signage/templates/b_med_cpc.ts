/**
 * 聯發科 昌益 CPC 直式週菜單 EDM
 * 由 BTW_EDM_3.0/edm_module/b_med_cpc.py 移植。
 *
 * 與標準 b_h1 差異：當該張為「晚餐」時，date-info / date-display 改用
 * _cpc 變體 class（含一段預留的麵包資訊註解）。其餘為標準含圖版面。
 * CSS 已預生成為 public/signage-assets/css/b_med_cpc.css。
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
import { MED_LOC } from './b_med_s';

const CSS_PATH = '../../css/b_med_cpc.css';
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

function generateHtml(data: MealItem[]): string {
  const firstItem = data.find((it) => it.據點) ?? data[0];
  const datesList = Array.from(new Set(data.map((it) => it.日期))).sort();
  const sp = datesList[0].split('-').slice(-2);
  const ep = datesList[datesList.length - 1].split('-').slice(-2);
  const dateRange = `${sp[0]}/${sp[1]}-${ep[0]}/${ep[1]}`;
  const location = MED_LOC[firstItem.據點 || '聯發科'] ?? (firstItem.據點 || '聯發科');

  const rawMeal = firstItem.時段 || '午餐';
  const mealPeriod = MEAL_MAP[rawMeal] ?? rawMeal;
  const isDinner = mealPeriod === '晚餐';

  let html = buildHead(CSS_PATH, 1080, 1528);
  html += buildTitleOpen(IMAGES, dateRange, location, mealPeriod);

  const dateItems = new Map<string, MealItem[]>();
  for (const it of data) {
    if (!dateItems.has(it.日期)) dateItems.set(it.日期, []);
    dateItems.get(it.日期)!.push(it);
  }
  const cells = buildWeekWindow(new Set(dateItems.keys()), datesList[0], 'monday');

  for (const cell of cells) {
    const dateDisplay = `${cell.month}/${cell.day}  (${cell.weekdayCh})  ${cell.weekday}`;
    const dateInfo = isDinner
      ? `<div class="date-info date-info_cpc">
                    <div class="date-display date-display_cpc">${dateDisplay}</div>
                    <!-- <div class="bread-data">85度C每日精選麵包 $65/75/85</div> -->`
      : `<div class="date-info">
                   <div class="date-display">${dateDisplay}
                   </div>`;

    html += `
            <div class="date-section">
               ${dateInfo}
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
      for (const restaurants of mealPeriods.values()) {
        for (const [restName, restItems] of restaurants) {
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

export function convertBMedCpc(meals: MealItem[]): ConvertedMenu[] {
  return weeklyConvert(meals, (raw) => MED_LOC[raw] ?? raw, generateHtml);
}

export const convertBMedCpcTv = makeTvConvert(convertBMedCpc, 1080, 1528);
