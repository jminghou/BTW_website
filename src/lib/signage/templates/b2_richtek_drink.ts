/**
 * 立錡 飲料 橫式 EDM（b2）
 * 由 BTW_EDM_3.0/edm_module/b2_richtek_drink.py 移植（橫式整月合併，售價一律 -5）。
 * 共用 b2_demo.css（同舊版設定）。
 */
import { createLandscapeConvert } from './_landscape';
import { makeTvConvert } from './_tv';

/** 立錡飲料售價：一律 -5（非純數字維持原值，同舊版 try/except，含整數型售價） */
const richtekDrinkPrice = (price: string | number): string | number => {
  const s = String(price).trim();
  if (!/^[+-]?\d+$/.test(s)) return price;
  return parseInt(s, 10) - 5;
};

export const convertB2RichtekDrink = createLandscapeConvert({
  cssPath: '../../css/b2_demo.css',
  images: {
    corner_logo: '../../pic/btw_side_logo_white.png',
    company_logo: '../../pic/logos/richtek_logo.png',
    qr_code: '../../pic/qrcode/qr-richtek.png',
  },
  copyright: '© 2025 浩華企業股份有限公司 By The Way. All rights reserved.',
  resolveLocation: (raw) =>
    ({ '奕力-午餐便當專區': '立錡', '奕力-晚餐便當專區': '立錡', '奕力-自費飲料專區': '立錡' }[raw] ?? raw),
  defaultLocation: '奕力-午餐便當專區',
  mealPeriodMap: { 午餐: '午餐時段', 晚餐: '晚餐時段', 下午茶: '飲料' },
  defaultMeal: '午餐',
  frameW: 1528,
  frameH: 1080,
  showPrice: true,
  priceTransform: richtekDrinkPrice,
});

export const convertB2RichtekDrinkTv = makeTvConvert(convertB2RichtekDrink, 1528, 1080);
