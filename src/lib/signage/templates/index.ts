import { type MealItem, type ConvertedMenu } from './vis3';
import { convertVisTv } from './vis_tv';
import { convertVisEdmTv } from './vis_edm';
import { convertBCathayTaTv } from './b_cathay_ta';
import { convertBCesbgHsTv } from './b_cesbg_hs';
import { convertBCesbgKhTv } from './b_cesbg_kh';
import { convertBCesbgTuTv } from './b_cesbg_tu';
import { convertBCesbgHsDrinkTv } from './b_cesbg_hs_drink';
import { convertBHonhaiKhTv } from './b_honhai_kh';
import { convertBKgibankTv } from './b_kgibank';
import { convertBCoupangTv } from './b_coupang';
import { convertBLcfcTv } from './b_lcfc';
import { convertBTtaTv } from './b_tta';
import { convertBMedSTv } from './b_med_s';
import { convertBMedTnaTv } from './b_med_tna';
import { convertBMedAbTv } from './b_med_ab';
import { convertBMedCpcTv } from './b_med_cpc';
import { convertBMedTprxTv } from './b_med_tprx';
import { convertBSebgDrinkTv } from './b_sebg_drink';
import { convertBMedCpcCTv } from './b_med_cpc_c';
import { convertBMedAbScTv } from './b_med_ab_s_c';
import { convertBtyIlitekTv } from './bty_ilitek';
import { convertBtyRichtekTv } from './bty_richtek';
import { convertBtySigmstarTv } from './bty_sigmstar';
import { convertBwecNtcTv } from './bwec_ntc';
import { convertBwecNanTv } from './bwec_nan';
import { convertBasicDemoTv } from './basic_demo';
import { convertTyIlitek2Tv } from './ty_ilitek2';
import { convertBwecZub2Tv } from './bwec_zub2';
import { convertB2IlitekDrinkTv } from './b2_ilitek_drink';
import { convertB2RichtekDrinkTv } from './b2_richtek_drink';
import { convertB2IlitekDinnerTv } from './b2_ilitek_dinner';
import { convertBwecZubTv } from './bwec_zub';
import { convertVisAdDay2Tv } from './vis_ad_day2';

/**
 * 版型註冊表（電子看板「上傳 JSON 自動轉檔」用）
 *
 * 目前後台只提供「電視版」（依視窗百分比等比縮放置中，適配電視盒）。
 * 各電視版底層仍沿用原電腦版的轉檔函式（同檔案內 convertX → convertXTv），
 * 只是電腦版不再註冊於此清單、後台下拉不顯示。
 *
 * ── 如何新增版型 ─────────────────────────────────────────
 * 1. 複製 vis3.ts 為 <key>.ts，例如 mtk1.ts
 * 2. 將 convertVis3 改名為 convert<Key>，調整 CUSTOM_CSS 或 generateGroupHtml
 *    以反映該客戶的視覺需求；輸入仍為共用的 MealItem[]
 * 3. 若要電視版，於該檔 export const convert<Key>Tv = makeTvConvert(convert<Key>, W, H)
 * 4. 在下方 templates 物件加一條 entry（convert 指向電視版）
 * 5. 若該版型需要獨立的靜態 css/js 資源，放到 public/signage-assets/
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
  vis_tv: {
    key: 'vis_tv',
    displayName: 'VIS_世界_電視版',
    customer: '世界先進',
    description: '三欄式每日菜單（電視盒播放版）',
    convert: convertVisTv,
  },
  vis_edm_tv: {
    key: 'vis_edm_tv',
    displayName: 'VIS_世界_週菜單EDM_電視版',
    customer: '世界先進',
    description: '世界週菜單 EDM 的電視盒版；1920×1080 設計畫布依視窗百分比等比縮放置中',
    convert: convertVisEdmTv,
  },
  b_cathay_ta_tv: {
    key: 'b_cathay_ta_tv',
    displayName: '國泰_中港忠明文心_週菜單EDM_電視版',
    customer: '國泰',
    description: '國泰週菜單 EDM 的電視盒版；1080×1528 設計畫布依視窗百分比等比縮放置中',
    convert: convertBCathayTaTv,
  },
  b_cesbg_hs_tv: {
    key: 'b_cesbg_hs_tv',
    displayName: '鴻佰竹北_週菜單EDM_電視版',
    customer: '鴻佰',
    description: '鴻佰竹北週菜單 EDM 的電視盒版；1080×1528 依視窗百分比等比縮放置中',
    convert: convertBCesbgHsTv,
  },
  b_cesbg_kh_tv: {
    key: 'b_cesbg_kh_tv',
    displayName: '鴻佰高軟_週菜單EDM_電視版',
    customer: '鴻佰',
    description: '鴻佰高軟週菜單 EDM 的電視盒版；1080×1528 依視窗百分比等比縮放置中',
    convert: convertBCesbgKhTv,
  },
  b_cesbg_tu_tv: {
    key: 'b_cesbg_tu_tv',
    displayName: '鴻佰土城_週菜單EDM_電視版',
    customer: '鴻佰',
    description: '鴻佰土城週菜單 EDM 的電視盒版；1080×1528 依視窗百分比等比縮放置中',
    convert: convertBCesbgTuTv,
  },
  b_cesbg_hs_drink_tv: {
    key: 'b_cesbg_hs_drink_tv',
    displayName: '鴻佰竹北_自費飲料EDM_電視版',
    customer: '鴻佰',
    description: '鴻佰竹北飲料 EDM 的電視盒版；1528×1080 依視窗百分比等比縮放置中',
    convert: convertBCesbgHsDrinkTv,
  },
  b_honhai_kh_tv: {
    key: 'b_honhai_kh_tv',
    displayName: '鴻佰鴻海_週菜單EDM_電視版',
    customer: '鴻佰',
    description: '鴻佰鴻海週菜單 EDM 的電視盒版；1080×1528 依視窗百分比等比縮放置中',
    convert: convertBHonhaiKhTv,
  },
  b_kgibank_tv: {
    key: 'b_kgibank_tv',
    displayName: '凱基銀行_週菜單EDM_電視版',
    customer: '凱基',
    description: '凱基週菜單 EDM 的電視盒版；1080×1528 依視窗百分比等比縮放置中',
    convert: convertBKgibankTv,
  },
  b_coupang_tv: {
    key: 'b_coupang_tv',
    displayName: '酷澎_週菜單EDM_電視版',
    customer: '酷澎',
    description: '酷澎週菜單 EDM 的電視盒版；1080×1528 依視窗百分比等比縮放置中',
    convert: convertBCoupangTv,
  },
  b_lcfc_tv: {
    key: 'b_lcfc_tv',
    displayName: '聯寶電腦_週菜單EDM_電視版',
    customer: '聯寶',
    description: '聯寶週菜單 EDM 的電視盒版；1080×1528 依視窗百分比等比縮放置中',
    convert: convertBLcfcTv,
  },
  b_tta_tv: {
    key: 'b_tta_tv',
    displayName: '國科會TTA_週菜單EDM_電視版',
    customer: '國科會',
    description: '國科會 TTA 週菜單 EDM 的電視盒版；1080×1528 依視窗百分比等比縮放置中',
    convert: convertBTtaTv,
  },
  b_med_s_tv: {
    key: 'b_med_s_tv',
    displayName: '聯發科S棟_週菜單EDM_電視版',
    customer: '聯發科',
    description: '聯發科 S棟 週菜單 EDM 的電視盒版；1080×1528 依視窗百分比等比縮放置中',
    convert: convertBMedSTv,
  },
  b_med_tna_tv: {
    key: 'b_med_tna_tv',
    displayName: '聯發科台南TNA_週菜單EDM_電視版',
    customer: '聯發科',
    description: '聯發科 台南 TNA 週菜單 EDM 的電視盒版；1080×1528 依視窗百分比等比縮放置中',
    convert: convertBMedTnaTv,
  },
  b_med_ab_tv: {
    key: 'b_med_ab_tv',
    displayName: '聯發科總部AB_週菜單EDM_電視版',
    customer: '聯發科',
    description: '聯發科 總部AB棟 週菜單 EDM（午晚餐合併、含餐期標籤）的電視盒版；1080×1528 等比縮放置中',
    convert: convertBMedAbTv,
  },
  b_med_cpc_tv: {
    key: 'b_med_cpc_tv',
    displayName: '聯發科昌益CPC_週菜單EDM_電視版',
    customer: '聯發科',
    description: '聯發科 昌益 CPC 週菜單 EDM 的電視盒版；1080×1528 依視窗百分比等比縮放置中',
    convert: convertBMedCpcTv,
  },
  b_med_tprx_tv: {
    key: 'b_med_tprx_tv',
    displayName: '聯發科行善瑞光TPRX_週菜單EDM_電視版',
    customer: '聯發科',
    description: '聯發科 行善/瑞光 週菜單 EDM（單餐廳多品項自動分欄）的電視盒版；1080×1528 等比縮放置中',
    convert: convertBMedTprxTv,
  },
  b_sebg_drink_tv: {
    key: 'b_sebg_drink_tv',
    displayName: '奕力_自費飲料EDM_電視版',
    customer: '奕力',
    description: '奕力 自費飲料 橫式 EDM 的電視盒版；1528×1080 依視窗百分比等比縮放置中',
    convert: convertBSebgDrinkTv,
  },
  b_med_cpc_c_tv: {
    key: 'b_med_cpc_c_tv',
    displayName: '聯發科昌益CPC_月曆EDM_電視版',
    customer: '聯發科',
    description: '聯發科 昌益 CPC 整月「美食報報」月曆（午/晚餐雙欄列餐廳）的電視盒版；1080×1528 等比縮放置中',
    convert: convertBMedCpcCTv,
  },
  b_med_ab_s_c_tv: {
    key: 'b_med_ab_s_c_tv',
    displayName: '聯發科總部AB_S棟_月曆EDM_電視版',
    customer: '聯發科',
    description: '聯發科 總部AB棟/S棟 整月「美食報報」月曆（雙公司、午/晚餐各列首間餐廳）的電視盒版；1080×1528 等比縮放置中',
    convert: convertBMedAbScTv,
  },
  bty_ilitek_tv: {
    key: 'bty_ilitek_tv',
    displayName: '台元_奕力_週菜單EDM_電視版',
    customer: '台元',
    description: '台元 奕力 週菜單 EDM 的電視盒版；1080×1528 依視窗百分比等比縮放置中',
    convert: convertBtyIlitekTv,
  },
  bty_richtek_tv: {
    key: 'bty_richtek_tv',
    displayName: '台元_立錡_週菜單EDM_電視版',
    customer: '台元',
    description: '台元 立錡 週菜單 EDM（排除飲料類）的電視盒版；1080×1528 等比縮放置中',
    convert: convertBtyRichtekTv,
  },
  bty_sigmstar_tv: {
    key: 'bty_sigmstar_tv',
    displayName: '台元_星宸_週菜單EDM_電視版',
    customer: '台元',
    description: '台元 星宸 週菜單 EDM（排除飲料類）的電視盒版；1080×1528 等比縮放置中',
    convert: convertBtySigmstarTv,
  },
  bwec_ntc_tv: {
    key: 'bwec_ntc_tv',
    displayName: '華邦台南_週菜單EDM_電視版',
    customer: '華邦',
    description: '華邦/新唐 台南 週菜單 EDM（餐補後售價、小字級）的電視盒版；1080×1528 等比縮放置中',
    convert: convertBwecNtcTv,
  },
  bwec_nan_tv: {
    key: 'bwec_nan_tv',
    displayName: '華邦南港_週菜單EDM_電視版',
    customer: '華邦',
    description: '華邦/新唐 南港 週菜單 EDM（三欄無圖、餐補後售價）的電視盒版；1080×1528 等比縮放置中',
    convert: convertBwecNanTv,
  },
  basic_demo_tv: {
    key: 'basic_demo_tv',
    displayName: '基礎示範_週菜單EDM_電視版',
    customer: '奕力',
    description: '基礎示範（奕力）週菜單 EDM 的電視盒版；逐日列出實際日期；1080×1528 等比縮放置中',
    convert: convertBasicDemoTv,
  },
  ty_ilitek2_tv: {
    key: 'ty_ilitek2_tv',
    displayName: '台元_奕力2_週菜單EDM_電視版',
    customer: '台元',
    description: '台元 奕力（版型2）週菜單 EDM 的電視盒版；逐日列出實際日期；1080×1528 等比縮放置中',
    convert: convertTyIlitek2Tv,
  },
  bwec_zub2_tv: {
    key: 'bwec_zub2_tv',
    displayName: '華邦竹北2_週菜單EDM_電視版',
    customer: '華邦',
    description: '華邦/新唐 竹北（版型2）週菜單 EDM（餐補後售價）的電視盒版；逐日列出實際日期；1080×1528 等比縮放置中',
    convert: convertBwecZub2Tv,
  },
  b2_ilitek_drink_tv: {
    key: 'b2_ilitek_drink_tv',
    displayName: '奕力_自費飲料EDM_b2_電視版',
    customer: '奕力',
    description: '奕力 自費飲料 橫式 EDM（b2，含售價）的電視盒版；1528×1080 等比縮放置中',
    convert: convertB2IlitekDrinkTv,
  },
  b2_richtek_drink_tv: {
    key: 'b2_richtek_drink_tv',
    displayName: '立錡_飲料EDM_b2_電視版',
    customer: '立錡',
    description: '立錡 飲料 橫式 EDM（b2，售價 -5）的電視盒版；1528×1080 等比縮放置中',
    convert: convertB2RichtekDrinkTv,
  },
  b2_ilitek_dinner_tv: {
    key: 'b2_ilitek_dinner_tv',
    displayName: '奕力_晚餐4欄EDM_b2_電視版',
    customer: '奕力',
    description: '奕力 晚餐 橫式四欄 EDM（b2，不顯示售價）的電視盒版；1528×1080 等比縮放置中',
    convert: convertB2IlitekDinnerTv,
  },
  bwec_zub_tv: {
    key: 'bwec_zub_tv',
    displayName: '華邦竹北_橫式週海報EDM_電視版',
    customer: '華邦',
    description: '華邦/新唐 竹北 橫式週海報 EDM（餐廳合併最多2塊、餐補後售價）的電視盒版；1920×1080 等比縮放置中',
    convert: convertBwecZubTv,
  },
  vis_ad_day2_tv: {
    key: 'vis_ad_day2_tv',
    displayName: 'VIS_世界_廣告機每日版_電視版',
    customer: '世界先進',
    description: 'VIS 廣告機每日版（側欄＋餐點卡，逐日列出）；採自適應流式版面（max-width 1800px 置中）',
    convert: convertVisAdDay2Tv,
  },
};

export const DEFAULT_TEMPLATE = 'vis_tv';

export type { MealItem, ConvertedMenu };
