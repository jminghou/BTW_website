/**
 * b_h1 系列（直式週菜單 EDM）共用工具與標準版型產生器
 *
 * BTW_EDM_3.0 裡 b_cathay_ta / b_cesbg_* / b_honhai_kh / b_kgibank / b_coupang /
 * b_lcfc 這一票 .py 幾乎是同一份 generate_html，只差：
 *   - 設定（logo / QR / 須知 / 版權 / 據點顯示）
 *   - 版面（標準含圖 vs 三欄無圖）
 *   - 週視窗（以週一為錨 vs 以資料首日起連續五天）
 *   - 空白日高度、是否顯示英文名、是否有額外 inline 樣式
 *
 * 這個模組把共用部分抽出來，各客戶檔只要呼叫 createB1Convert(options)。
 * CSS 與上傳資料無關，已預先產生為 public/signage-assets/css/<key>.css。
 */

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
  分類?: string;
}

export interface ConvertedMenu {
  filename: string;
  html: string;
  meta: {
    location: string;
    mealTime: string;
    date: string;
    itemCount: number;
    warnings: string[];
  };
}

export const DEFAULT_IMAGE = '../../pic/暫缺圖片_便當.png';

export const PY_WEEKDAY_ABBR = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
export const WEEKDAY_CH: Record<string, string> = {
  MON: '一', TUE: '二', WED: '三', THU: '四', FRI: '五', SAT: '六', SUN: '日',
  星期一: '一', 星期二: '二', 星期三: '三', 星期四: '四', 星期五: '五', 星期六: '六', 星期日: '日',
};

/** 基本 HTML escape */
export function esc(v: unknown): string {
  return String(v ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

/** 清理餐廳名稱：只保留最後一個破折號後的內容（同 Python clean_restaurant_name） */
export function cleanRestaurantName(name: string): string {
  if (name.includes('-')) return name.split('-').slice(-1)[0].trim();
  return name;
}

// 日期工具（以本地零時計算，避免時區誤差）
export function dateToObj(ymd: string): Date {
  const [y, m, d] = ymd.split('-').map(Number);
  return new Date(y, m - 1, d);
}
/** 週一=0 ... 週日=6（同 Python datetime.weekday()） */
export function pyWeekday(dt: Date): number {
  return (dt.getDay() + 6) % 7;
}
export function fmtYmd(dt: Date): string {
  return `${dt.getFullYear()}-${pad2(dt.getMonth() + 1)}-${pad2(dt.getDate())}`;
}
export function fmtMmdd(dt: Date): string {
  return `${pad2(dt.getMonth() + 1)}-${pad2(dt.getDate())}`;
}
export function addDays(dt: Date, n: number): Date {
  return new Date(dt.getFullYear(), dt.getMonth(), dt.getDate() + n);
}

export interface B1Images {
  corner_logo: string;
  company_logo: string;
  qr_code: string;
}

/** 須知（直式版型頁尾用）；取餐地點 為選填（kgibank 才有） */
export interface B1Notices {
  訂餐時間: string;
  取餐時間: string;
  取餐地點?: string;
  異常處理: string;
  補充說明: string;
}

/** 產生 <head>（含內嵌 frame 尺寸樣式與可選的額外樣式） */
export function buildHead(
  cssPath: string,
  frameW: number,
  frameH: number,
  extraStyle = '',
): string {
  return `
<!DOCTYPE html>
<html lang="zh-TW">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>餐廳菜單</title>
    <link rel="stylesheet" href="${cssPath}">
    <style>
        html, body {
            margin: 0;
            padding: 0;
            width: ${frameW}px;
            height: ${frameH}px;
            background: transparent !important;
        }
        .frame {
            width: ${frameW}px;
            height: ${frameH}px;
            margin: 0;
            position: absolute;
            left: 0;
            top: 0;
        }${extraStyle}
    </style>
</head>`;
}

/** 產生標題列（角落 logo、公司 logo、日期區間、據點、時段）＋ container 開頭 */
export function buildTitleOpen(
  images: B1Images,
  dateRange: string,
  location: string,
  mealPeriodDisplay: string,
): string {
  return `
<body>
    <div class="frame">
        <div class="corner-logo">
            <img src="${images.corner_logo}" alt="Corner Logo">
        </div>
        <div class="edm-title">
            <div class="logo-container">
                <img src="${images.company_logo}" alt="Logo" class="title-logo">
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
}

/** 產生頁尾（QR + 須知 + 版權）；kgibank 多一條「取餐地點」 */
export function buildFooter(images: B1Images, qrText: string, notices: B1Notices, copyright: string): string {
  // kgibank 的「取餐地點」是接在「取餐時間」notice-item 內的額外 title+content（非獨立 item）
  const locationNotice = notices.取餐地點
    ? `
                        <div class="notice-title">取餐地點：</div>
                        <div class="notice-content">${esc(notices.取餐地點)}</div>`
    : '';
  return `
                </div>
            </div>
            <div class="footer">
                <div class="qr-code">
                    <div class="qr-wrapper">
                        <img src="${images.qr_code}" alt="QR Code" class="qr-image">
                        <div class="qr-text">${esc(qrText)}</div>
                    </div>
                </div>
                <div class="notice">
                    <div class="notice-item">
                        <div class="notice-title">訂餐時間：</div>
                        <div class="notice-content">${esc(notices.訂餐時間)}</div>
                    </div>
                    <div class="notice-item">
                        <div class="notice-title">取餐時間：</div>
                        <div class="notice-content">${esc(notices.取餐時間)}</div>${locationNotice}
                    </div>
                    <div class="notice-item">
                        <div class="notice-title">取餐異常？</div>
                        <div class="notice-content">${esc(notices.異常處理)}
                        <P>${esc(notices.補充說明)}</P></div>
                    </div>
                    <div class="copyright">${esc(copyright)}</div>
                </div>
            </div>
        </div>
    </body>
    </html>
    `;
}

/** 一週（單一據點+時段）的日期視窗：以週一為錨，或以資料首日起連續五天 */
export interface DayCell {
  dateStr: string;
  weekday: string;
  weekdayCh: string;
  month: string;
  day: string;
  hasData: boolean;
}
export function buildWeekWindow(
  datesWithData: Set<string>,
  firstDate: string,
  weekMode: 'monday' | 'consecutive',
): DayCell[] {
  const firstObj = dateToObj(firstDate);
  const anchor =
    weekMode === 'monday' ? addDays(firstObj, -pyWeekday(firstObj)) : firstObj;
  const cells: DayCell[] = [];
  for (let i = 0; i < 5; i++) {
    const cur = addDays(anchor, i);
    const dateStr = fmtYmd(cur);
    const weekday = PY_WEEKDAY_ABBR[pyWeekday(cur)];
    cells.push({
      dateStr,
      weekday,
      weekdayCh: WEEKDAY_CH[weekday] ?? '',
      month: pad2(cur.getMonth() + 1),
      day: String(cur.getDate()),
      hasData: datesWithData.has(dateStr),
    });
  }
  return cells;
}

export interface B1Options {
  key: string;
  cssPath: string;
  images: B1Images;
  qrText: string;
  copyright: string;
  notices: B1Notices;
  /** 由原始據點求顯示用據點名稱（多數客戶固定回傳同一個名稱） */
  resolveLocation: (raw: string) => string;
  defaultLocation: string;
  mealPeriodMap?: Record<string, string>;
  /** standard：含餐點圖與英文名；noimage3col：三欄、無圖、無英文名 */
  layout: 'standard' | 'noimage3col';
  weekMode: 'monday' | 'consecutive';
  emptyDayHeight: number;
  /** 三欄版型需要的額外 inline 樣式（會接在 <head> 內嵌樣式尾端） */
  extraInlineStyle?: string;
  /** 在餐廳名稱旁顯示餐期標籤（午餐/晚餐），用於同一張同時呈現午晚餐（b_med_ab） */
  showPeriodLabel?: boolean;
  /** 合併午晚餐：依「據點」分組（不分時段）、檔名不含時段（對應 json_lunch_dinner） */
  combinePeriods?: boolean;
  /** 額外過濾資料（例如排除特定分類／餐廳）；回傳 false 的項目剔除 */
  itemFilter?: (m: MealItem) => boolean;
  /** 售價轉換（例如餐補減 40/50）；回傳顯示用售價字串/數字 */
  priceTransform?: (price: string | number, location: string) => string | number;
  /** menu-items 容器 class（bwec_ntc 用 'menu-items small-font'） */
  menuItemsClass?: string;
  /**
   * 日期視窗：
   *   'fill'（預設）= 補滿週一~週五、空白日顯示空白區（資料經 json_workday2 補過）
   *   'actual' = 只渲染實際有資料的日期、不補空白（basic_demo / ty_ilitek2 / bwec_zub2）
   */
  weekWindow?: 'fill' | 'actual';
  /**
   * 分組／切檔方式：
   *   false（預設）= 依「據點+時段」分組後再「按週」切檔（一週一張）
   *   true = 依「據點+時段」分組為一張、不按週切（所有日期同一張，配合 weekWindow:'actual'）
   */
  noWeekSplit?: boolean;
  /** 不過濾平日（basic_demo / ty_ilitek2 / bwec_zub2 舊碼不濾週末） */
  noWeekdayFilter?: boolean;
}

const DEFAULT_MEAL_MAP: Record<string, string> = { 午餐: '午餐', 晚餐: '晚餐' };

/** bwec 系列「品項多時縮小字級」內嵌樣式（搭配 menuItemsClass:'menu-items small-font'） */
export const SMALL_FONT_STYLE = `
        /* 當餐點數量多時縮小字級 */
        .menu-items.small-font .menu-row .menu-name .chinese-name {
            font-size: 0.8em;
        }
        .menu-items.small-font .menu-row .price .price-prefix,
        .menu-items.small-font .menu-row .price .price-number {
            font-size: 0.8em;
        }
        /* 縮小行距 */
        .menu-items.small-font {
            gap: 0px;
        }
        .menu-items.small-font .menu-row {
            margin-bottom: 1px;
            line-height: 1.2;
        }`;

/** coupang / lcfc 用的三欄無圖版面內嵌樣式（對應 Python f-string 內的 <style> 覆寫） */
export const THREE_COL_INLINE_STYLE = `
        /* 調整餐廳部分為3間並各佔33% */
        .restaurants-grid {
            display: flex;
            flex-direction: row;
            flex-wrap: wrap;
            gap: 3px;
            justify-content: space-between;
            padding: 5px 15px;
        }
        .restaurant-section {
            flex: 0 0 calc(33% - 5px);
            padding: 5px 5px 5px;
            border-radius: calc(var(--border-radius) - 5px);
            display: flex;
            align-items: flex-start;
            min-height: 120px;
            margin-bottom: -10px;
        }
        /* 移除圖片相關樣式，調整菜單內容佈局 */
        .menu-details {
            display: flex;
            flex-direction: column;
            width: 100%;
        }
        .menu-items {
            flex: 1;
            display: flex;
            flex-direction: column;
            gap: 1px;
            width: 100%;
        }
        .restaurant-name {
            margin-bottom: 6px;
            padding-bottom: 2px;
        }`;

/** 產生單一份（一週、單一據點+時段）的 HTML */
function generateHtml(data: MealItem[], opts: B1Options): string {
  const mealMap = opts.mealPeriodMap ?? DEFAULT_MEAL_MAP;
  const includeImage = opts.layout === 'standard';
  const includeEnglish = opts.layout === 'standard';

  const firstItem = data.find((it) => it.據點) ?? data[0];
  const datesList = Array.from(new Set(data.map((it) => it.日期))).sort();
  const sp = datesList[0].split('-').slice(-2);
  const ep = datesList[datesList.length - 1].split('-').slice(-2);
  const dateRange = `${sp[0]}/${sp[1]}-${ep[0]}/${ep[1]}`;

  const rawLocation = firstItem.據點 || opts.defaultLocation;
  const location = opts.resolveLocation(rawLocation);

  const mealSet = new Set<string>();
  for (const it of data) {
    const raw = it.時段 || '午餐';
    mealSet.add(mealMap[raw] ?? raw);
  }
  const mealList = Array.from(mealSet).sort();
  const mealPeriodDisplay = mealList.length > 1 ? mealList.join(' / ') : mealList[0] ?? '午餐';

  let html = buildHead(opts.cssPath, 1080, 1528, opts.extraInlineStyle ?? '');
  html += buildTitleOpen(opts.images, dateRange, location, mealPeriodDisplay);

  // 按日期分組
  const dateItems = new Map<string, MealItem[]>();
  for (const it of data) {
    if (!dateItems.has(it.日期)) dateItems.set(it.日期, []);
    dateItems.get(it.日期)!.push(it);
  }

  const cells =
    opts.weekWindow === 'actual'
      ? // 只渲染實際有資料的日期（不補空白週）
        datesList.map((dateStr) => {
          const dt = dateToObj(dateStr);
          const weekday = PY_WEEKDAY_ABBR[pyWeekday(dt)];
          return {
            dateStr,
            weekday,
            weekdayCh: WEEKDAY_CH[weekday] ?? '',
            month: pad2(dt.getMonth() + 1),
            day: String(dt.getDate()),
            hasData: true,
          };
        })
      : buildWeekWindow(new Set(dateItems.keys()), datesList[0], opts.weekMode);

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

      for (const [period, restaurants] of mealPeriods) {
        for (const [restName, restItems] of restaurants) {
          // 餐期標籤版（ab）餐廳名與標籤各自一行；標準版維持單行
          const restNameInner = opts.showPeriodLabel
            ? `
                                ${esc(restName)}
                                <span class="period-display">${esc(mealMap[period] ?? period)}</span>
                            `
            : esc(restName);
          const imageDiv = includeImage
            ? `
                                <div class="menu-image">
                                    <img src="${esc(restItems[0].圖片網址 && restItems[0].圖片網址!.trim() ? restItems[0].圖片網址! : DEFAULT_IMAGE)}" alt="${esc(restItems[0].餐點名稱)}">
                                </div>`
            : '';
          html += `
                    <div class="restaurant-section">
                        <div class="menu-content">
                            <div class="restaurant-name">${restNameInner}</div>
                            <div class="menu-details">${imageDiv}
                                <div class="${opts.menuItemsClass ?? 'menu-items'}">
                    `;
          for (const item of restItems) {
            const engSpan = includeEnglish
              ? `
                                            <span class="english-name">${esc(item.英文名稱 ?? '')}</span>`
              : '';
            const price = opts.priceTransform ? opts.priceTransform(item.售價, location) : item.售價;
            html += `
                                    <div class="menu-row">
                                        <div class="menu-name">
                                            <span class="chinese-name">${esc(item.餐點名稱)}</span>${engSpan}
                                        </div>
                                        <div class="price">
                                            <span class="price-prefix">NT$</span>
                                            <span class="price-number">${esc(price)}</span>
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
            <div style="height: ${opts.emptyDayHeight}px;"></div>
            `;
    }

    html += `
            </div>
        </div>
        `;
  }

  html += buildFooter(opts.images, opts.qrText, opts.notices, opts.copyright);
  return html;
}

/**
 * 產生 b_h1 系列標準/三欄版型的 convert 函式。
 *
 * 流程（同 vis_edm / b_cathay_ta）：
 *   1. 過濾平日、過濾無效資料、清理餐廳名
 *   2. 依「據點 + 時段」分組
 *   3. 各組按週（週一錨）切分，每週一份 EDM；檔名週區間固定為週一~週五
 */
/**
 * b_h1 系列共用的「依據點+時段分組、按週切分」轉檔骨架。
 * 各客戶只要提供 resolveLocation 與一個把「一週資料 → HTML」的 genHtml。
 * 檔名週區間固定為週一~週五（對應舊版 json_workday2 命名）。
 */
export function weeklyConvert(
  meals: MealItem[],
  resolveLocation: (raw: string) => string,
  genHtml: (weekItems: MealItem[]) => string,
  opts: {
    combinePeriods?: boolean;
    itemFilter?: (m: MealItem) => boolean;
    noWeekSplit?: boolean;
    noWeekdayFilter?: boolean;
  } = {},
): ConvertedMenu[] {
  const { combinePeriods = false, itemFilter, noWeekSplit = false, noWeekdayFilter = false } = opts;
  if (!Array.isArray(meals) || meals.length === 0) {
    throw new Error('JSON 內容必須是非空的餐點資料陣列');
  }

  const cleaned = meals
    .filter((m) => m.日期 && m.據點 && m.時段 && (noWeekdayFilter || pyWeekday(dateToObj(m.日期)) < 5))
    .map((m) => ({
      ...m,
      餐廳名稱: cleanRestaurantName(m.餐廳名稱 ?? ''),
      英文名稱: m.英文名稱 ?? null,
    }))
    .filter((m) => m.餐點名稱 && m.餐廳名稱 && (itemFilter ? itemFilter(m) : true));

  if (cleaned.length === 0) {
    throw new Error('沒有可用的平日餐點資料（需含 餐點名稱、餐廳名稱、據點、時段、日期）');
  }

  const groups = new Map<string, MealItem[]>();
  for (const m of cleaned) {
    const k = combinePeriods ? m.據點 : `${m.據點}|${m.時段}`;
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k)!.push(m);
  }

  const result: ConvertedMenu[] = [];
  for (const items of groups.values()) {
    const rawLocation = items[0].據點;
    const mealTime = combinePeriods ? '' : items[0].時段;
    items.sort((a, b) => a.日期.localeCompare(b.日期));

    // 切檔單位：noWeekSplit → 整組一張（區間取實際首尾日）；否則按週（區間固定週一~週五）
    const buckets: Array<{ items: MealItem[]; start: string; end: string }> = [];
    if (noWeekSplit) {
      const ds = Array.from(new Set(items.map((i) => i.日期))).sort();
      buckets.push({ items, start: fmtMmdd(dateToObj(ds[0])), end: fmtMmdd(dateToObj(ds[ds.length - 1])) });
    } else {
      const weeks = new Map<string, MealItem[]>();
      for (const item of items) {
        const monday = addDays(dateToObj(item.日期), -pyWeekday(dateToObj(item.日期)));
        const wk = fmtYmd(monday);
        if (!weeks.has(wk)) weeks.set(wk, []);
        weeks.get(wk)!.push(item);
      }
      for (const wk of Array.from(weeks.keys()).sort()) {
        const monday = dateToObj(wk);
        buckets.push({ items: weeks.get(wk)!, start: fmtMmdd(monday), end: fmtMmdd(addDays(monday, 4)) });
      }
    }

    for (const { items: weekItems, start, end } of buckets) {
      // 合併午晚餐時檔名不含時段（對應舊版 json_lunch_dinner 命名）
      const filename = combinePeriods
        ? `${rawLocation}_${start}_${end}.html`
        : `${rawLocation}_${mealTime}_${start}_${end}.html`;
      result.push({
        filename,
        html: genHtml(weekItems),
        meta: {
          location: resolveLocation(rawLocation),
          mealTime,
          date: `${start}_${end}`,
          itemCount: weekItems.length,
          warnings: [],
        },
      });
    }
  }

  return result;
}

/**
 * 月曆版（b_calendar 系列）轉檔骨架：依「年月」分組，每個月一張整月日曆。
 * 僅平日（週一~五）、清理餐廳名、套用各版型自訂過濾（例如排除特定餐廳）。
 * 檔名：{year}_{month}月_菜單.html（對應舊版 b_med_*_c）。
 */
export function monthlyConvert(
  meals: MealItem[],
  itemFilter: (m: MealItem) => boolean,
  genHtml: (monthItems: MealItem[], monthYear: string) => string,
): ConvertedMenu[] {
  if (!Array.isArray(meals) || meals.length === 0) {
    throw new Error('JSON 內容必須是非空的餐點資料陣列');
  }
  const valid = meals
    .filter(
      (m) =>
        m.餐點名稱 &&
        m.餐廳名稱 &&
        m.日期 &&
        pyWeekday(dateToObj(m.日期)) < 5 &&
        itemFilter(m),
    )
    .map((m) => ({ ...m, 餐廳名稱: cleanRestaurantName(m.餐廳名稱 ?? '') }));
  if (valid.length === 0) {
    throw new Error('沒有可用的平日餐點資料');
  }

  const groups = new Map<string, MealItem[]>();
  for (const m of valid) {
    const [y, mo] = m.日期.split('-');
    const key = `${y}-${Number(mo)}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(m);
  }

  const result: ConvertedMenu[] = [];
  for (const [key, items] of groups) {
    items.sort((a, b) => a.日期.localeCompare(b.日期));
    const [y, mo] = key.split('-');
    const monthYear = `${y}年 ${mo}月`;
    result.push({
      filename: `${y}_${mo}月_菜單.html`,
      html: genHtml(items, monthYear),
      meta: { location: '', mealTime: '', date: monthYear, itemCount: items.length, warnings: [] },
    });
  }
  return result;
}

export function createB1Convert(opts: B1Options) {
  return (meals: MealItem[]): ConvertedMenu[] =>
    weeklyConvert(meals, opts.resolveLocation, (weekItems) => generateHtml(weekItems, opts), {
      combinePeriods: opts.combinePeriods ?? false,
      itemFilter: opts.itemFilter,
      noWeekSplit: opts.noWeekSplit ?? false,
      noWeekdayFilter: opts.noWeekdayFilter ?? false,
    });
}
