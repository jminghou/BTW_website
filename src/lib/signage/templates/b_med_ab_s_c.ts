/**
 * 聯發科 總部AB棟 / S棟 月曆版 EDM（美食報報，雙公司）
 * 由 BTW_EDM_3.0/edm_module/b_med_ab_s_c.py 移植。
 *
 * 月曆版面（1080×1528）：整月逐日一列，並列兩間公司（總部AB棟 / S棟），
 * 各公司再分左午餐 / 右晚餐，每欄只顯示「排序後第一間」餐廳名。無頁尾。
 * 注意：星期縮寫為首字大寫（Mon），非全大寫。
 * CSS 已預生成為 public/signage-assets/css/b_med_ab_s_c.css。
 */
import {
  type MealItem,
  type ConvertedMenu,
  esc,
  dateToObj,
  pyWeekday,
  buildHead,
  monthlyConvert,
  type B1Images,
} from './_b_h1_common';
import { makeTvConvert } from './_tv';
import { MED_LOC } from './b_med_s';

const CSS_PATH = '../../css/b_med_ab_s_c.css';
const IMAGES: B1Images = {
  corner_logo: '../../pic/btw_side_logo_white.png',
  company_logo: '../../pic/logos/mediatek_logo.png',
  qr_code: '../../pic/qrcode/qr_mediatek.png',
};
const COMPANIES = ['總部AB棟', 'S棟'];
/** 首字大寫的星期縮寫（週一=0 ... 週日=6），對應 Python strftime('%A')[:3] */
const PY_WEEKDAY_EN3 = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

/** 一欄（午餐 / 晚餐）：只顯示排序後第一間餐廳 */
function mealColumn(colClass: string, title: string, restaurants: string[]): string {
  let h = `
                                <div class="meal-column ${colClass}">
                                    <div class="meal-column-title">${title}</div>
                `;
  if (restaurants.length > 0) {
    const first = restaurants.slice().sort()[0];
    h += `
                                    <div class="restaurants-grid">
                    `;
    h += `
                                        <div class="restaurant-section">
                                            <div class="menu-content">
                                                <div class="restaurant-name">${esc(first)}</div>
                                            </div>
                                        </div>
                        `;
    h += `
                                    </div>
                    `;
  } else {
    h += `
                                    <div class="no-restaurants">無${title}數據</div>
                    `;
  }
  h += `
                                </div>
                `;
  return h;
}

function generateHtml(data: MealItem[], monthYear: string): string {
  let html = buildHead(CSS_PATH, 1080, 1528);
  html += `
<body>
    <div class="frame">
        <div class="corner-logo">
            <img src="${IMAGES.corner_logo}" alt="Corner Logo">
        </div>
        <div class="edm-title">
            <div class="logo-container">
                <img src="${IMAGES.company_logo}" alt="Logo" class="title-logo">
            </div>
            <div class="main-content-wrapper">
                <div class="title-info-container">
                    <div class="title-info-group">
                        <div class="title-info">
                            <span class="info-value">${esc(monthYear)}</span>
                        </div>
                        <div class="location-period-group">
                            <div class="title-info">
                                <span class="info-location">聯發科餐廳</span>
                            </div>
                        </div>
                        <div class="title-info">
                            <span class="info-value">美食報報</span>
                        </div>
                    </div>
                </div>

                <div class="container">
                    <div class="meal-labels-container">
                        <div class="company-column">
                            <div class="company-title">${esc(COMPANIES[0])}</div>
                            <div class="meal-labels">
                                <div class="lunch-label">午餐時段</div>
                                <div class="dinner-label">晚餐時段</div>
                            </div>
                        </div>
                        <div class="company-column">
                            <div class="company-title">${esc(COMPANIES[1])}</div>
                            <div class="meal-labels">
                                <div class="lunch-label">午餐時段</div>
                                <div class="dinner-label">晚餐時段</div>
                            </div>
                        </div>
                    </div>
`;

  const dateItems = new Map<string, MealItem[]>();
  for (const it of data) {
    if (!dateItems.has(it.日期)) dateItems.set(it.日期, []);
    dateItems.get(it.日期)!.push(it);
  }

  for (const dateStr of Array.from(dateItems.keys()).sort()) {
    const dt = dateToObj(dateStr);
    const weekdayAbbr = PY_WEEKDAY_EN3[pyWeekday(dt)];
    const day = String(dt.getDate());

    html += `
            <div class="date-section">
                <div class="date-info">
                    <div class="date-display">
                        <div class="date-day">${day}</div>
                        <div class="date-weekday">${weekdayAbbr}</div>
                    </div>
                </div>
                <div class="meal-content">
                    <div class="companies-row">
            `;

    const items = dateItems.get(dateStr)!;
    for (const company of COMPANIES) {
      const companyItems = items.filter((it) => (MED_LOC[it.據點 ?? ''] ?? '') === company);
      const lunchRest = Array.from(
        new Set(companyItems.filter((it) => it.時段 === '午餐').map((it) => it.餐廳名稱).filter(Boolean)),
      );
      const dinnerRest = Array.from(
        new Set(companyItems.filter((it) => it.時段 === '晚餐').map((it) => it.餐廳名稱).filter(Boolean)),
      );

      html += `
                        <div class="company-column">
                            <div class="company-meal-row">
                `;
      html += mealColumn('lunch-column', '午餐', lunchRest);
      html += mealColumn('dinner-column', '晚餐', dinnerRest);
      html += `
                            </div>
                        </div>
                `;
    }

    html += `
                    </div>
                </div>
            </div>
            `;
  }

  html += `
                </div>
            </div>
        </div>
    </body>
    </html>
    `;
  return html;
}

export function convertBMedAbSc(meals: MealItem[]): ConvertedMenu[] {
  return monthlyConvert(meals, () => true, generateHtml);
}

export const convertBMedAbScTv = makeTvConvert(convertBMedAbSc, 1080, 1528);
