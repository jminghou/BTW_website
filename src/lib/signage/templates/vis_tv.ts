/**
 * VIS 三欄式菜單版型轉檔器（電視版）
 * 由 vis3.ts（VIS_世界_電腦版）完整複製，作為電視版微調的基礎
 *
 * 輸入：餐點資料陣列（JSON）
 * 輸出：每個「據點+時段+日期」一份菜單 HTML
 *
 * 產生的 HTML 用 ../../css、../../js、../../pic 引用共用資源，
 * 由 /api/signage/asset/[id] proxy 改寫成 /signage-assets/...
 */

export interface MealItem {
  餐點名稱: string;
  英文名稱?: string;
  售價: string | number;
  圖片網址?: string;
  餐廳名稱: string;
  據點: string;
  時段: string;
  日期: string; // YYYY-MM-DD
  星期: string; // 星期一 ~ 星期日
  介紹?: string;
}

export interface ConvertedMenu {
  filename: string; // 例：F3_L_2026-05-25.html
  html: string;
  meta: {
    location: string; // FAB 3
    mealTime: string; // 午餐
    date: string; // 2026-05-25
    itemCount: number;
    warnings: string[];
  };
}

// ==================== 對照表（同 Python） ====================

const LOCATION_MAP: Record<string, string> = {
  '世界先進一廠 fab1': 'FAB 1',
  '世界先進二廠 fab2': 'FAB 2',
  '世界先進三廠 fab3': 'FAB 3',
};

const LOCATION_ABBR_MAP: Record<string, string> = {
  '世界先進三廠 fab3': 'F3',
  '世界先進二廠 fab2': 'F2',
  '世界先進一廠 fab1': 'F1',
};

const MEAL_TIME_ABBR_MAP: Record<string, string> = {
  早餐: 'B',
  午餐: 'L',
  晚餐: 'D',
  宵夜: 'N',
};

const WEEKDAY_ABBR_MAP: Record<string, string> = {
  星期一: 'MON',
  星期二: 'TUE',
  星期三: 'WED',
  星期四: 'THU',
  星期五: 'FRI',
  星期六: 'SAT',
  星期日: 'SUN',
};

const DEFAULT_IMAGE = '../../pic/暫缺圖片_便當.png';
const MAX_SPOTLIGHT_BADGE = 10; // 編號圖只有 01~10

function convertLocationName(loc: string): string {
  return LOCATION_MAP[loc] ?? loc;
}
function convertLocationAbbr(loc: string): string {
  return LOCATION_ABBR_MAP[loc] ?? '';
}
function convertMealTimeAbbr(mt: string): string {
  return MEAL_TIME_ABBR_MAP[mt] ?? '';
}
function convertWeekdayAbbr(wd: string): string {
  return WEEKDAY_ABBR_MAP[wd] ?? wd;
}

/** 基本 HTML escape，避免菜名含特殊字元破版 */
function esc(v: unknown): string {
  return String(v ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/** 兩位數補零（idx 1 → "01"） */
function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

/** 解析售價為數字；含 $、逗號等符號會被去除，無法解析者回傳 Infinity（排到最後） */
function parsePrice(v: string | number): number {
  if (typeof v === 'number') return Number.isFinite(v) ? v : Infinity;
  const n = parseFloat(String(v ?? '').replace(/[^\d.]/g, ''));
  return Number.isNaN(n) ? Infinity : n;
}

/**
 * 同一間餐廳內依售價由低到高排序。
 * 餐廳的出現順序維持原始資料的先後（以首次出現為準），
 * 僅在各餐廳群組「內部」依價格升冪重排，達成「同餐廳價低在上、價高在下」。
 * 售價相同者維持原順序（穩定排序）。
 */
function sortByRestaurantThenPrice(items: MealItem[]): MealItem[] {
  const order: string[] = [];
  const groups = new Map<string, MealItem[]>();
  for (const item of items) {
    const r = item.餐廳名稱 ?? '';
    if (!groups.has(r)) {
      groups.set(r, []);
      order.push(r);
    }
    groups.get(r)!.push(item);
  }
  const result: MealItem[] = [];
  for (const r of order) {
    const group = groups.get(r)!;
    group.sort((a, b) => parsePrice(a.售價) - parsePrice(b.售價));
    result.push(...group);
  }
  return result;
}

// ==================== 內嵌 CSS（原樣搬自 Python） ====================

const CUSTOM_CSS = `
    <style>
        /* 新版 3欄式佈局樣式 */
        .main-layout {
            display: flex;
            position: absolute;
            left: 260px; /* 側邊欄右側 */
            top: 60px;
            width: 1600px;
            height: 960px;
            gap: 40px;
        }

        /* 中間欄位：大圖展示區 */
        .spotlight-section {
            width: 800px;
            background: #ffffff;
            border-radius: 20px;
            padding: 20px;
            display: flex;
            flex-direction: column;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
            position: relative;
            overflow: hidden;
        }

        /* 輪播項目容器 */
        .spotlight-item {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            padding: 20px;
            box-sizing: border-box;
            display: flex;
            flex-direction: column;
            background: #ffffff;
            opacity: 0;
            transition: opacity 1s ease-in-out;
            pointer-events: none;
            z-index: 1;
        }

        .spotlight-item.active {
            opacity: 1;
            pointer-events: auto;
            z-index: 2;
        }

        .spotlight-header {
            display: flex;
            align-items: center;
            gap: 10px;
            margin-bottom: 15px;
        }

        .spotlight-header img {
            height: 40px;
            width: auto;
        }

        .spotlight-image-container {
            flex: 1;
            width: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
            background: #fff;
            border-radius: 10px;
            overflow: hidden;
            margin-bottom: 5px;
            position: relative;
        }

        .spotlight-number-badge {
            position: absolute;
            top: -15px;
            left: -15px;
            width: auto;
            height: auto;
            z-index: 10;
        }

        .spotlight-image-container .spotlight-main-image {
            width: 100%;
            height: 100%;
            object-fit: cover;
            object-position: center;
        }

        /* 餐廳名稱標籤 (移到圖片下方) */
        .spotlight-restaurant-tag {
            display: inline-block;
            background-color: #17a1b1;
            color: white;
            padding: 8px 24px;
            border-radius: 50px;
            font-size: 20px;
            font-weight: 700;
            margin-top: 10px;
            margin-bottom: 10px;
            align-self: flex-start;
        }

        /* 分隔線 */
        .spotlight-separator {
            width: 100%;
            border-top: 2px dashed #999;
            margin-bottom: 10px;
        }

        .spotlight-info {
            padding: 5px 10px;
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
            margin-top: auto;
        }

        .spotlight-names {
            flex: 1;
            text-align: left;
        }

        .spotlight-chinese-name {
            font-size: 47px;
            font-weight: 900;
            color: #000;
            margin-bottom: 2px;
            line-height: 1.2;
        }

        .spotlight-english-name {
            font-size: 21px;
            color: #000;
            font-weight: 400;
            line-height: 1.2;
        }

        .spotlight-price-block {
            display: flex;
            align-items: baseline;
            justify-content: flex-end;
            color: #a32224;
            margin-left: 20px;
        }

        .spotlight-price-prefix {
            font-size: 21px;
            font-weight: 700;
            margin-right: 5px;
        }

        .spotlight-price {
            font-size: 64px;
            font-weight: 900;
            line-height: 1;
        }

        /* 右側欄位：餐點列表 */
        .menu-list-section {
            flex: 1;
            display: flex;
            flex-direction: column;
            gap: 15px;
            overflow-y: auto;
            padding-right: 20px;
        }

        /* 密集模式 (> 6 items) */
        .menu-list-section.dense {
            gap: 5px;
        }

        /* ===== 電視盒適配：改用相對單位填滿視窗 ===== */
        /* 用 viewport units 讓最外層永遠等於電視實際可視範圍，
           並蓋掉共用檔 vis_ad_machine.css 寫死的 1920px/1080px */
        html, body {
            background-color: #EAE1C2;
            margin: 0;
            padding: 0;
            width: 100vw;
            height: 100vh;
            overflow: hidden; /* 縮放後不出現捲軸 */
        }

        /* .container 維持 1920x1080「設計畫布」尺寸，
           由下方 transform 等比縮放後置中，填滿電視盒視窗 */
        .container {
            background-color: #EAE1C2;
            width: 1920px;
            height: 1080px;
            position: absolute;
            top: 0;
            left: 0;
            transform-origin: top left;
            /* 預設縮放比：以寬度為基準（電視多為 16:9，與畫布同比例）。
               實際比例會由頁尾 inline script 依視窗大小精算後覆寫，
               即使 JS 失效也有此 CSS 後援，不會出現「角落放大」 */
            transform: scale(calc(100vw / 1920));
        }

        /* 隱藏捲軸但保留功能 */
        .menu-list-section::-webkit-scrollbar {
            width: 6px;
        }
        .menu-list-section::-webkit-scrollbar-thumb {
            background-color: rgba(0,0,0,0.2);
            border-radius: 3px;
        }

        .restaurant-group-header {
            display: inline-block;
            background-color: #17a1b1;
            color: white;
            padding: 8px 24px;
            border-radius: 50px;
            font-size: 20px;
            font-weight: 700;
            margin-top: 10px;
            margin-bottom: 5px;
            align-self: flex-start;
        }

        .menu-list-item {
            display: flex;
            align-items: center;
            padding: 10px 20px;
            border-bottom: 2px dashed #999;
            background-color: transparent;
            transition: all 0.3s ease;
            position: relative;
        }

        /* 密集模式下的項目 */
        .menu-list-section.dense .menu-list-item {
            padding: 5px 20px;
        }

        /* 最後一個項目不顯示虛線 */
        .menu-list-item:last-child {
            border-bottom: none;
        }

        /* 輪播到的項目 (Active) */
        .menu-list-item.active {
            background-color: #ffffff;
            border: 2px solid #a32224;
            border-radius: 16px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
            margin-bottom: 5px;
        }

        /* 紅色三角形箭頭 */
        .menu-list-item.active::before {
            content: '';
            position: absolute;
            left: -15px;
            top: 50%;
            transform: translateY(-50%);
            width: 0;
            height: 0;
            border-top: 10px solid transparent;
            border-bottom: 10px solid transparent;
            border-right: 15px solid #a32224;
        }

        .item-number-badge {
            width: 44px;
            height: 44px;
            border-radius: 50%;
            background-color: #17a1b1;
            color: white;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 24px;
            font-weight: 900;
            margin-right: 20px;
            flex-shrink: 0;
        }

        .menu-list-item.active .item-number-badge {
            background-color: #a32224;
        }

        .item-info {
            flex: 1;
            display: flex;
            flex-direction: column;
            justify-content: center;
        }

        .item-name {
            font-size: 32px;
            font-weight: 700;
            color: #202a65;
            margin-bottom: 2px;
            line-height: 1.2;
        }

        .item-english-name {
            font-size: 26px;
            color: #666;
            font-weight: 400;
            line-height: 1.2;
        }

        .item-price-block {
            font-size: 38px;
            font-weight: 900;
            color: #a32224;
            white-space: nowrap;
            margin-left: 20px;
        }

        .item-price-prefix {
            font-size: 18px;
            font-weight: 700;
        }

        /* 側邊欄調整 */
        .sidebar {
            z-index: 100;
        }

        /* 隱藏舊的 menu-grid */
        .menu-grid {
            display: none !important;
        }
    </style>
    `;

// ==================== 主轉檔函式 ====================

/** 產生單一組（同據點+時段+日期）的菜單 HTML */
function generateGroupHtml(itemsRaw: MealItem[]): { html: string; warnings: string[] } {
  const warnings: string[] = [];
  // 同一間餐廳內依售價由低到高排序，輪播大圖與右側列表共用此順序
  const items = sortByRestaurantThenPrice(itemsRaw);
  const first = items[0];

  const location = convertLocationName(first.據點 ?? '');
  const mealTime = first.時段 ?? '';
  const weekday = convertWeekdayAbbr(first.星期 ?? '');
  const date = first.日期 ?? '';
  const day = date ? String(parseInt(date.split('-').slice(-1)[0], 10)) : '';
  const formattedDate = date.replace(/-/g, '.');

  // sidebar
  let html = `
<!DOCTYPE html>
<html lang="zh-TW">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no, viewport-fit=cover">
    <title>餐廳菜單</title>
    <link rel="stylesheet" href="../../css/vis_ad_machine.css">
    ${CUSTOM_CSS}
</head>
<body>
    <div class="container">

        <div class="sidebar">
            <div class="logo-info">
                <img src="../../pic/VIS_logo.png" alt="VIS Logo">
            </div>
            <div class="info-block date-info">
                <div class="weekday">${esc(weekday)}</div>
                <div class="day">${esc(day)}</div>
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
        <div class="main-layout">`;

  // spotlight 輪播區
  html += `<div class="spotlight-section">`;
  items.forEach((item, idx) => {
    const activeClass = idx === 0 ? 'active' : '';
    const badgeNum = idx + 1;
    if (badgeNum > MAX_SPOTLIGHT_BADGE) {
      warnings.push(`第 ${badgeNum} 項超過編號圖上限（${MAX_SPOTLIGHT_BADGE}），編號圖會缺漏`);
    }
    const img = item.圖片網址 && item.圖片網址.trim() ? item.圖片網址 : DEFAULT_IMAGE;
    html += `
                <div class="spotlight-item ${activeClass}">
                    <div class="spotlight-image-container">
                        <img class="spotlight-number-badge" src="../../pic/numbers/${pad2(badgeNum)}.png" alt="${badgeNum}">
                        <img class="spotlight-main-image" src="${esc(img)}" alt="${esc(item.餐點名稱)}">
                    </div>

                    <div class="spotlight-restaurant-tag">${esc(item.餐廳名稱)}</div>
                    <div class="spotlight-separator"></div>

                    <div class="spotlight-info">
                        <div class="spotlight-names">
                            <div class="spotlight-chinese-name">${esc(item.餐點名稱)}</div>
                            <div class="spotlight-english-name">${esc(item.英文名稱 ?? '')}</div>
                        </div>
                        <div class="spotlight-price-block">
                            <span class="spotlight-price-prefix">NT$</span>
                            <span class="spotlight-price">${esc(item.售價)}</span>
                        </div>
                    </div>
                </div>
                `;
  });
  html += `</div>`; // End spotlight-section

  // menu-list 右側列表
  const sectionClass = items.length > 6 ? 'menu-list-section dense' : 'menu-list-section';
  html += `<div class="${sectionClass}">`;
  let currentRestaurant: string | null = null;
  items.forEach((item, i) => {
    const idx = i + 1;
    const restaurant = item.餐廳名稱;
    if (restaurant !== currentRestaurant) {
      html += `<div class="restaurant-group-header">${esc(restaurant)}</div>`;
      currentRestaurant = restaurant;
    }
    const activeClass = idx === 1 ? 'active' : '';
    html += `
            <div class="menu-list-item ${activeClass}">
                <div class="item-number-badge">${idx}</div>
                <div class="item-info">
                    <div class="item-name">${esc(item.餐點名稱)}</div>
                    <div class="item-english-name">${esc(item.英文名稱 ?? '')}</div>
                </div>
                <div class="item-price-block">
                    <span class="item-price-prefix">NT$</span>
                    ${esc(item.售價)}
                </div>
            </div>
            `;
  });
  html += `</div>`; // End menu-list-section
  html += `</div>`; // End main-layout

  html += `
    </div>
    <script src="../../js/spotlight_slideshow.js"></script>
    <script>
    /* 電視盒等比縮放：把 1920x1080 設計畫布等比縮放並置中，
       填滿電視盒實際視窗（含非 16:9 時自動留邊置中，不裁切、不偏角落） */
    (function () {
        var DESIGN_W = 1920, DESIGN_H = 1080;
        function fitScreen() {
            var c = document.querySelector('.container');
            if (!c) return;
            var vw = window.innerWidth, vh = window.innerHeight;
            var scale = Math.min(vw / DESIGN_W, vh / DESIGN_H);
            var offsetX = (vw - DESIGN_W * scale) / 2;
            var offsetY = (vh - DESIGN_H * scale) / 2;
            c.style.transform =
                'translate(' + offsetX + 'px, ' + offsetY + 'px) scale(' + scale + ')';
        }
        window.addEventListener('resize', fitScreen);
        window.addEventListener('orientationchange', fitScreen);
        window.addEventListener('load', fitScreen);
        if (document.readyState !== 'loading') fitScreen();
        else document.addEventListener('DOMContentLoaded', fitScreen);
    })();
    </script>
</body>
</html>
`;

  return { html, warnings };
}

/**
 * 主入口：把餐點資料依「據點+時段+日期」分組，每組產生一份菜單 HTML
 */
export function convertVisTv(meals: MealItem[]): ConvertedMenu[] {
  if (!Array.isArray(meals) || meals.length === 0) {
    throw new Error('JSON 內容必須是非空的餐點資料陣列');
  }

  // 依 據點|時段|日期 分組（維持原始順序）
  const groups = new Map<string, MealItem[]>();
  for (const m of meals) {
    if (!m.餐點名稱 || !m.據點 || !m.時段 || !m.日期) {
      throw new Error('每筆資料都必須有 餐點名稱、據點、時段、日期 欄位');
    }
    const key = `${m.據點}|${m.時段}|${m.日期}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(m);
  }

  const result: ConvertedMenu[] = [];
  for (const items of groups.values()) {
    const first = items[0];
    const abbrLoc = convertLocationAbbr(first.據點);
    const abbrMeal = convertMealTimeAbbr(first.時段);
    const filename = `${abbrLoc}_${abbrMeal}_${first.日期}.html`;

    const { html, warnings } = generateGroupHtml(items);
    result.push({
      filename,
      html,
      meta: {
        location: convertLocationName(first.據點),
        mealTime: first.時段,
        date: first.日期,
        itemCount: items.length,
        warnings,
      },
    });
  }

  return result;
}
