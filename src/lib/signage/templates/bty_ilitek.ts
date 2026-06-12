/**
 * 台元 奕力 直式週菜單 EDM
 * 由 BTW_EDM_3.0/edm_module/bty_ilitek.py 移植（b_h1 標準版型，空白日 120px）。
 * CSS 已預生成為 public/signage-assets/css/bty_ilitek.css。
 */
import { createB1Convert } from './_b_h1_common';
import { makeTvConvert } from './_tv';

/** 奕力據點對照（ilitek / sigmstar 共用） */
export const ILITEK_LOC: Record<string, string> = {
  '奕力-午餐便當專區': '奕力',
  '奕力-晚餐便當專區': '奕力',
  '奕力-自費飲料專區': '奕力',
};
/** 奕力時段對照 */
export const ILITEK_MEAL: Record<string, string> = {
  午餐: '午餐時段',
  晚餐: '晚餐時段',
  下午茶: '自費飲料',
};
/** bty 立錡/星宸 要排除的分類與餐廳（飲料類） */
export const BTY_DRINK_FILTER = (m: { 分類?: string; 餐廳名稱?: string }): boolean =>
  !['飲料', '無糖', '微糖', '無糖飲料'].includes(m.分類 ?? '') &&
  !['脆大爺脆皮甜甜圈', '茶湯會'].includes(m.餐廳名稱 ?? '');

export const convertBtyIlitek = createB1Convert({
  key: 'bty_ilitek',
  cssPath: '../../css/bty_ilitek.css',
  images: {
    corner_logo: '../../pic/btw_side_logo_white.png',
    company_logo: '../../pic/logos/ilitek_logo.png',
    qr_code: '../../pic/qrcode/qr-ilitek.png',
  },
  qrText: '註冊&客服專線',
  copyright: '© 2025 浩華企業股份有限公司 By The Way. All rights reserved.',
  notices: {
    訂餐時間: '午餐：當日10:00前 ， 晚餐：當日14:00前',
    取餐時間: '午餐：11:40-14:30 ， 晚餐：17:30-20:00',
    異常處理: '請掃碼QRCode，或搜尋@ilitek聯絡客服由專人為您服務。',
    補充說明: '※非供餐時段不提供取餐服務，若有不便敬請見諒。',
  },
  resolveLocation: (raw) => ILITEK_LOC[raw] ?? raw,
  defaultLocation: '奕力-午餐便當專區',
  mealPeriodMap: ILITEK_MEAL,
  layout: 'standard',
  weekMode: 'monday',
  emptyDayHeight: 120,
});

export const convertBtyIlitekTv = makeTvConvert(convertBtyIlitek, 1080, 1528);
