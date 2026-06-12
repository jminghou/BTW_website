/**
 * 聯發科 昌益 CPC 月曆版 EDM（美食報報）
 * 由 BTW_EDM_3.0/edm_module/b_med_cpc_c.py 移植。
 *
 * 月曆版面（1080×1528）：整月逐日一列，左午餐 / 右晚餐雙欄，每欄列出該餐期所有餐廳
 * （只顯示餐廳名、不含品項與圖）。排除餐廳名含「85度c」或「路易莎」者。無頁尾。
 * CSS 已預生成為 public/signage-assets/css/b_med_cpc_c.css。
 */
import {
  type MealItem,
  type ConvertedMenu,
  esc,
  dateToObj,
  pyWeekday,
  PY_WEEKDAY_ABBR,
  buildHead,
  monthlyConvert,
  type B1Images,
} from './_b_h1_common';
import { makeTvConvert } from './_tv';
import { MED_LOC } from './b_med_s';

const CSS_PATH = '../../css/b_med_cpc_c.css';
const IMAGES: B1Images = {
  corner_logo: '../../pic/btw_side_logo_white.png',
  company_logo: '../../pic/logos/mediatek_logo.png',
  qr_code: '../../pic/qrcode/qr_mediatek.png',
};

/** 一欄（午餐 / 晚餐）：列出該餐期所有餐廳的名稱 */
function mealColumn(colClass: string, title: string, restMap: Map<string, MealItem[]> | undefined): string {
  let h = `
                        <div class="meal-column ${colClass}">
                            <div class="meal-column-title">${title}</div>
                `;
  if (restMap && restMap.size > 0) {
    h += `
                            <div class="restaurants-grid">
                    `;
    for (const restName of restMap.keys()) {
      h += `
                            <div class="restaurant-section">
                                <div class="menu-content">
                                    <div class="restaurant-name">${esc(restName)}</div>
                                </div>
                            </div>
                        `;
    }
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
  const firstItem = data[0];
  const location = MED_LOC[firstItem.據點 || '聯發科'] ?? (firstItem.據點 || '聯發科');

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
                                <span class="info-location">${esc(location)}</span>
                            </div>
                        </div>
                        <div class="title-info">
                            <span class="info-value">美食報報</span>
                        </div>
                    </div>
                </div>

                <div class="container">
                    <div class="meal-labels-container">
                        <div class="meal-labels">
                            <div class="lunch-label">午餐時段</div>
                            <div class="dinner-label">晚餐時段</div>
                        </div>
                    </div>
`;

  // 按日期分組
  const dateItems = new Map<string, MealItem[]>();
  for (const it of data) {
    if (!dateItems.has(it.日期)) dateItems.set(it.日期, []);
    dateItems.get(it.日期)!.push(it);
  }

  for (const dateStr of Array.from(dateItems.keys()).sort()) {
    const dt = dateToObj(dateStr);
    const weekdayAbbr = PY_WEEKDAY_ABBR[pyWeekday(dt)];
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
            `;

    const items = dateItems.get(dateStr)!;
    if (items.length > 0) {
      const periods = new Map<string, Map<string, MealItem[]>>();
      for (const it of items) {
        if (!periods.has(it.時段)) periods.set(it.時段, new Map());
        const rm = periods.get(it.時段)!;
        if (!rm.has(it.餐廳名稱)) rm.set(it.餐廳名稱, []);
        rm.get(it.餐廳名稱)!.push(it);
      }
      html += `
                    <div class="meal-row">
                `;
      html += mealColumn('lunch-column', '午餐', periods.get('午餐'));
      html += mealColumn('dinner-column', '晚餐', periods.get('晚餐'));
      html += `
                    </div>
                `;
    } else {
      html += `
                    <div class="no-data">
                        <!-- 這一天沒有餐點數據，顯示輕微縮小的空白區域 -->
                        <div style="height: 54px; text-align: center; color: #888; padding-top: 18px; font-size: 10.8px;">本日無餐廳數據</div>
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
        </div>
    </body>
    </html>
    `;
  return html;
}

/** 排除餐廳名含「85度c」或「路易莎」（同舊版 cpc_c） */
const cpcFilter = (m: MealItem): boolean => {
  const r = m.餐廳名稱 ?? '';
  return !r.includes('85度c') && !r.includes('路易莎');
};

export function convertBMedCpcC(meals: MealItem[]): ConvertedMenu[] {
  return monthlyConvert(meals, cpcFilter, generateHtml);
}

export const convertBMedCpcCTv = makeTvConvert(convertBMedCpcC, 1080, 1528);
