/**
 * 奕力 自費飲料 橫式 EDM（b2）
 * 由 BTW_EDM_3.0/edm_module/b2_ilitek_drink.py 移植（橫式整月合併，含售價）。
 * CSS 已預生成為 public/signage-assets/css/b2_ilitek_drink.css。
 */
import { createLandscapeConvert } from './_landscape';
import { makeTvConvert } from './_tv';

export const ILITEK_LOC: Record<string, string> = {
  '奕力-午餐便當專區': '奕力',
  '奕力-晚餐便當專區': '奕力',
  '奕力-自費飲料專區': '奕力',
};
export const ILITEK_DRINK_MEAL: Record<string, string> = {
  午餐: '午餐時段',
  晚餐: '晚餐時段',
  下午茶: '自費飲料',
};

export const convertB2IlitekDrink = createLandscapeConvert({
  cssPath: '../../css/b2_ilitek_drink.css',
  images: {
    corner_logo: '../../pic/btw_side_logo_white.png',
    company_logo: '../../pic/logos/ilitek_logo.png',
    qr_code: '../../pic/qrcode/qr-ilitek.png',
  },
  copyright: '© 2025 浩華企業股份有限公司 By The Way. All rights reserved.',
  resolveLocation: (raw) => ILITEK_LOC[raw] ?? raw,
  defaultLocation: '奕力-午餐便當專區',
  mealPeriodMap: ILITEK_DRINK_MEAL,
  defaultMeal: '午餐',
  frameW: 1528,
  frameH: 1080,
  showPrice: true,
});

export const convertB2IlitekDrinkTv = makeTvConvert(convertB2IlitekDrink, 1528, 1080);
