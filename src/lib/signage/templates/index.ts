import { convertVis3, type MealItem, type ConvertedMenu } from './vis3';
import { convertVisTv } from './vis_tv';

/**
 * 版型註冊表（電子看板「上傳 JSON 自動轉檔」用）
 *
 * ── 如何新增版型 ─────────────────────────────────────────
 * 1. 複製 vis3.ts 為 <key>.ts，例如 mtk1.ts
 * 2. 將 convertVis3 改名為 convert<Key>，調整 CUSTOM_CSS 或 generateGroupHtml
 *    以反映該客戶的視覺需求；輸入仍為共用的 MealItem[]
 * 3. 在下方 templates 物件加一條 entry：
 *      <key>: {
 *        key: '<key>',                // 內部識別碼（穩定不變）
 *        displayName: '聯發科版型2',     // UI 顯示名稱
 *        customer: '聯發科',            // 客戶識別
 *        description: '一句話描述...',  // UI 旁邊小字
 *        convert: convert<Key>,
 *      }
 * 4. 若該版型需要獨立的靜態 css/js 資源，放到 public/signage-assets/<key>/
 *    並在 generateGroupHtml 內以 ../../<key>/... 引用
 * ────────────────────────────────────────────────────────
 */
export interface SignageTemplate {
  /** 內部識別碼（穩定不變，會被存在資料庫描述、API 請求中） */
  key: string;
  /** UI 顯示名稱（例如「世界先進版型1」） */
  displayName: string;
  /** 客戶識別（例如「世界先進」），未來可用於分組或過濾 */
  customer: string;
  /** 一句話描述，UI 旁邊小字或 tooltip 用 */
  description?: string;
  /** 轉檔函式：將 MealItem 陣列轉為一份或多份菜單 HTML */
  convert: (meals: MealItem[]) => ConvertedMenu[];
}

export const templates: Record<string, SignageTemplate> = {
  vis3: {
    key: 'vis3',
    displayName: 'VIS_世界_電腦版',
    customer: '世界先進',
    description: '三欄式菜單（左：日期/據點/時段；中：輪播主秀；右：餐點列表）',
    convert: convertVis3,
  },
  vis_tv: {
    key: 'vis_tv',
    displayName: 'VIS_世界_電視版',
    customer: '世界先進',
    description: '由電腦版完整複製，作為電視版微調的基礎',
    convert: convertVisTv,
  },
};

export const DEFAULT_TEMPLATE = 'vis3';

export type { MealItem, ConvertedMenu };
