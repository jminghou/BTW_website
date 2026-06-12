/**
 * 國泰（中港 / 忠明文心）直式週菜單 EDM 版型轉檔器
 * 由 BTW_EDM_3.0/edm_module/b_cathay_ta.py 移植。
 *
 * 與舊版差異：
 *   1. 舊版的 CSS 是執行時由 edm_mod_json/b_cathay_ta.json（設定）+
 *      css/template_b_h1.css（基底）動態合成寫檔。CSS 內容與上傳資料無關、
 *      永遠相同，因此已預先產生為靜態檔
 *      public/signage-assets/css/b_cathay_ta.css，此處 HTML 直接引用，
 *      不再於轉檔時產生 CSS。
 *   2. 舊版是兩階段（json_workday2 先把原始 JSON 依週切檔並過濾平日，
 *      再由 b_cathay_ta.py 產生 HTML）。新網站為單階段 convert()，
 *      因此把「清理餐廳名 → 依 據點+時段 分組 → 按週切分（僅平日週一~五）」
 *      一併做完，每一份再產生一張 EDM。
 *
 * 版面：1080 × 1528 直式海報（標題列＋每日餐廳 grid＋頁尾 QR/須知）。
 * 國泰為一般 EDM（normal_edm），不含週末。
 *
 * 產生的 HTML 用 ../../css、../../pic 引用共用資源，
 * 由 /api/signage/asset/[id] proxy 改寫成 /signage-assets/...
 */

import { makeTvConvert } from './_tv';

export interface MealItem {
  餐點名稱: string;
  英文名稱?: string | null;
  售價: string | number;
  圖片網址?: string;
  餐廳名稱: string;
  據點: string;
  時段: string;
  日期: string; // YYYY-MM-DD
  星期?: string;
  介紹?: string;
}

export interface ConvertedMenu {
  filename: string; // 例：中港經貿_午餐_06-08_06-12.html
  html: string;
  meta: {
    location: string; // 國泰大樓
    mealTime: string; // 午餐
    date: string; // 06-08_06-12（一週區間）
    itemCount: number;
    warnings: string[];
  };
}

// ==================== 設定（由 edm_mod_json/b_cathay_ta.json 內聯而來） ====================

const CSS_PATH = '../../css/b_cathay_ta.css';

const IMAGES = {
  corner_logo: '../../pic/btw_side_logo_white.png',
  company_logo: '../../pic/logos/cathay_logo.png',
  qr_code: '../../pic/qrcode/qr_cathay.png',
};

const NOTICES = {
  訂餐時間: '當日 10點 前',
  取餐時間: '午餐時段 11:40-13:30',
  異常處理: '請掃碼QRCode，或搜尋@cathay_ta聯絡客服由專人為您服務。',
  補充說明: '※非供餐時段不提供取餐服務，若有不便敬請見諒。',
};

const QR_CODE_TEXT = '註冊&客服專線';
const COPYRIGHT = '© 2025 浩華企業股份有限公司 By The Way. All rights reserved.';

const LOCATION_MAPPING: Record<string, string> = {
  default: '國泰大樓',
  中港經貿: '國泰大樓', // 待文心據點開後，中港忠明菜單分開，地點須改為「中港經貿」
  忠明大樓: '忠明大樓',
  文心大樓: '文心大樓',
};

const MEAL_PERIOD_MAPPING: Record<string, string> = {
  午餐: '午餐',
  晚餐: '晚餐',
};

const DEFAULT_IMAGE = '../../pic/暫缺圖片_便當.png';

/** 以「週一=0 ... 週日=6」（同 Python datetime.weekday()）索引的英文星期縮寫 */
const PY_WEEKDAY_ABBR = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
const WEEKDAY_CH: Record<string, string> = {
  MON: '一',
  TUE: '二',
  WED: '三',
  THU: '四',
  FRI: '五',
  SAT: '六',
  SUN: '日',
};

// ==================== 小工具 ====================

/** 基本 HTML escape，避免菜名／餐廳名含特殊字元破版 */
function esc(v: unknown): string {
  return String(v ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

/** 清理餐廳名稱：只保留最後一個破折號後的內容（同 Python json_workday2.clean_restaurant_name） */
function cleanRestaurantName(name: string): string {
  if (name.includes('-')) {
    return name.split('-').slice(-1)[0].trim();
  }
  return name;
}

// ==================== 日期工具（以本地零時計算，避免時區誤差） ====================

function dateToObj(ymd: string): Date {
  const [y, m, d] = ymd.split('-').map(Number);
  return new Date(y, m - 1, d);
}
/** 週一=0 ... 週日=6（同 Python datetime.weekday()） */
function pyWeekday(dt: Date): number {
  return (dt.getDay() + 6) % 7;
}
function fmtYmd(dt: Date): string {
  return `${dt.getFullYear()}-${pad2(dt.getMonth() + 1)}-${pad2(dt.getDate())}`;
}
function fmtMmdd(dt: Date): string {
  return `${pad2(dt.getMonth() + 1)}-${pad2(dt.getDate())}`;
}
function addDays(dt: Date, n: number): Date {
  return new Date(dt.getFullYear(), dt.getMonth(), dt.getDate() + n);
}

// ==================== 主 HTML 產生（同 Python generate_html） ====================

/** 把一週（單一據點+時段，僅含有資料的平日）的資料產生一張直式 EDM HTML */
function generateHtml(data: MealItem[]): { html: string; warnings: string[] } {
  const warnings: string[] = [];

  // 找到第一個有據點的資料，否則 fallback 到 data[0]
  const firstItem = data.find((item) => item.據點) ?? data[0];

  // 日期區間（mm/dd-mm/dd）— 取自實際有資料的日期
  const datesList = Array.from(new Set(data.map((item) => item.日期))).sort();
  const startParts = datesList[0].split('-').slice(-2);
  const endParts = datesList[datesList.length - 1].split('-').slice(-2);
  const dateRange = `${startParts[0]}/${startParts[1]}-${endParts[0]}/${endParts[1]}`;

  const rawLocation = firstItem.據點 || '國泰大樓';
  const location = LOCATION_MAPPING[rawLocation] ?? rawLocation;

  // 收集所有時段，排序後組合顯示文字
  const mealPeriodsSet = new Set<string>();
  for (const item of data) {
    const rawPeriod = item.時段 || '午餐';
    mealPeriodsSet.add(MEAL_PERIOD_MAPPING[rawPeriod] ?? rawPeriod);
  }
  const mealPeriodsList = Array.from(mealPeriodsSet).sort();
  const mealPeriodDisplay =
    mealPeriodsList.length > 1
      ? mealPeriodsList.join(' / ')
      : mealPeriodsList[0] ?? '午餐';

  let html = `
<!DOCTYPE html>
<html lang="zh-TW">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>餐廳菜單</title>
    <link rel="stylesheet" href="${CSS_PATH}">
    <style>
        html, body {
            margin: 0;
            padding: 0;
            width: 1080px;
            height: 1528px;
            background: transparent !important;
        }
        .frame {
            width: 1080px;
            height: 1528px;
            margin: 0;
            position: absolute;
            left: 0;
            top: 0;
        }
    </style>
</head>
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
                            <span class="info-value">${esc(dateRange)}</span>
                        </div>
                        <div class="location-period-group">
                            <div class="title-info">
                                <span class="info-location">${esc(location)}</span>
                            </div>
                            <div class="title-info">
                                <span class="info-value">${esc(mealPeriodDisplay)}</span>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="container">
`;

  // 按日期分組（僅有資料的日期）
  const dateItems = new Map<string, MealItem[]>();
  for (const item of data) {
    const date = item.日期;
    if (!dateItems.has(date)) dateItems.set(date, []);
    dateItems.get(date)!.push(item);
  }

  // 確保一週五天（週一~週五）都顯示，以第一天所在週的週一為基準
  const firstDate = datesList[0];
  const monday = addDays(dateToObj(firstDate), -pyWeekday(dateToObj(firstDate)));

  const weekdayDates: Array<{
    dateStr: string;
    weekday: string;
    weekdayCh: string;
    month: string;
    day: string;
    hasData: boolean;
  }> = [];
  for (let i = 0; i < 5; i++) {
    const current = addDays(monday, i);
    const dateStr = fmtYmd(current);
    const weekday = PY_WEEKDAY_ABBR[pyWeekday(current)];
    weekdayDates.push({
      dateStr,
      weekday,
      weekdayCh: WEEKDAY_CH[weekday] ?? '',
      month: pad2(current.getMonth() + 1),
      day: String(current.getDate()), // 去前導零
      hasData: dateItems.has(dateStr),
    });
  }

  for (const dateInfo of weekdayDates) {
    html += `
        <div class="date-section">
            <div class="date-info">
                <div class="date-display">${dateInfo.month}/${dateInfo.day}  (${dateInfo.weekdayCh})  ${dateInfo.weekday}</div>
            </div>
            <div class="restaurants-grid">
        `;

    if (dateInfo.hasData) {
      // 按時段 → 餐廳分組
      const mealPeriods = new Map<string, Map<string, MealItem[]>>();
      for (const item of dateItems.get(dateInfo.dateStr)!) {
        const period = item.時段;
        if (!mealPeriods.has(period)) mealPeriods.set(period, new Map());
        const restMap = mealPeriods.get(period)!;
        const restName = item.餐廳名稱;
        if (!restMap.has(restName)) restMap.set(restName, []);
        restMap.get(restName)!.push(item);
      }

      for (const restaurants of mealPeriods.values()) {
        for (const [restName, restItems] of restaurants) {
          const headImg =
            restItems[0].圖片網址 && restItems[0].圖片網址!.trim()
              ? restItems[0].圖片網址!
              : DEFAULT_IMAGE;
          html += `
                    <div class="restaurant-section">
                        <div class="menu-content">
                            <div class="restaurant-name">${esc(restName)}</div>
                            <div class="menu-details">
                                <div class="menu-image">
                                    <img src="${esc(headImg)}" alt="${esc(restItems[0].餐點名稱)}">
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

  html += `
                </div>
            </div>
            <div class="footer">
                <div class="qr-code">
                    <div class="qr-wrapper">
                        <img src="${IMAGES.qr_code}" alt="QR Code" class="qr-image">
                        <div class="qr-text">${esc(QR_CODE_TEXT)}</div>
                    </div>
                </div>
                <div class="notice">
                    <div class="notice-item">
                        <div class="notice-title">訂餐時間：</div>
                        <div class="notice-content">${esc(NOTICES.訂餐時間)}</div>
                    </div>
                    <div class="notice-item">
                        <div class="notice-title">取餐時間：</div>
                        <div class="notice-content">${esc(NOTICES.取餐時間)}</div>
                    </div>
                    <div class="notice-item">
                        <div class="notice-title">取餐異常？</div>
                        <div class="notice-content">${esc(NOTICES.異常處理)}
                        <P>${esc(NOTICES.補充說明)}</P></div>
                    </div>
                    <div class="copyright">${esc(COPYRIGHT)}</div>
                </div>
            </div>
        </div>
    </body>
    </html>
    `;

  return { html, warnings };
}

// ==================== 主入口 ====================

/**
 * 把原始餐點資料轉成一份或多份國泰直式 EDM HTML。
 *
 * 流程：
 *   1. 清理餐廳名稱、補英文名稱欄位
 *   2. 過濾平日（週一~週五）、過濾沒有餐點名稱／餐廳名稱的資料
 *   3. 依「據點 + 時段」分組
 *   4. 各組依日期排序，按週（週一為錨）切分，每週一張 EDM
 *      （缺少的平日由 HTML 內顯示空白區域）
 */
export function convertBCathayTa(meals: MealItem[]): ConvertedMenu[] {
  if (!Array.isArray(meals) || meals.length === 0) {
    throw new Error('JSON 內容必須是非空的餐點資料陣列');
  }

  // 前處理：清理餐廳名稱、補英文名稱、過濾平日與無效資料
  const cleaned = meals
    .filter((m) => {
      if (!m.日期 || !m.據點 || !m.時段) return false;
      // 只保留週一~週五
      return pyWeekday(dateToObj(m.日期)) < 5;
    })
    .map((m) => ({
      ...m,
      餐廳名稱: cleanRestaurantName(m.餐廳名稱 ?? ''),
      英文名稱: m.英文名稱 ?? null,
    }))
    // 過濾掉沒有餐點名稱或餐廳名稱的資料（同 Python convert_json_to_html）
    .filter((m) => m.餐點名稱 && m.餐廳名稱);

  if (cleaned.length === 0) {
    throw new Error('沒有可用的平日餐點資料（需含 餐點名稱、餐廳名稱、據點、時段、日期）');
  }

  // 依 據點 + 時段 分組
  const groups = new Map<string, MealItem[]>();
  for (const m of cleaned) {
    const key = `${m.據點}|${m.時段}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(m);
  }

  const result: ConvertedMenu[] = [];

  for (const items of groups.values()) {
    const rawLocation = items[0].據點;
    const mealTime = items[0].時段;

    // 依日期排序後，按週（週一錨點）切分
    items.sort((a, b) => a.日期.localeCompare(b.日期));
    const weeks = new Map<string, MealItem[]>();
    for (const item of items) {
      const monday = addDays(dateToObj(item.日期), -pyWeekday(dateToObj(item.日期)));
      const wkKey = fmtYmd(monday);
      if (!weeks.has(wkKey)) weeks.set(wkKey, []);
      weeks.get(wkKey)!.push(item);
    }

    for (const wkKey of Array.from(weeks.keys()).sort()) {
      const weekItems = weeks.get(wkKey)!;
      const monday = dateToObj(wkKey);
      const start = fmtMmdd(monday);
      const end = fmtMmdd(addDays(monday, 4));

      const { html, warnings } = generateHtml(weekItems);
      result.push({
        filename: `${rawLocation}_${mealTime}_${start}_${end}.html`,
        html,
        meta: {
          location: LOCATION_MAPPING[rawLocation] ?? rawLocation,
          mealTime,
          date: `${start}_${end}`,
          itemCount: weekItems.length,
          warnings,
        },
      });
    }
  }

  return result;
}

export const convertBCathayTaTv = makeTvConvert(convertBCathayTa, 1080, 1528);
