/**
 * 奕力 晚餐 橫式四欄 EDM（b2）
 * 由 BTW_EDM_3.0/edm_module/b2_ilitek_dinner.py 移植（橫式整月合併，四欄、不顯示售價）。
 * CSS 已預生成為 public/signage-assets/css/b2_ilitek_dinner.css（template_b2_4x）。
 */
import { createLandscapeConvert } from './_landscape';
import { makeTvConvert } from './_tv';
import { ILITEK_LOC, ILITEK_DRINK_MEAL } from './b2_ilitek_drink';

/** 四欄佈局覆寫（強制 .container flex、每個 .date-section 佔 25%） */
const DINNER_4COL_STYLE = `
        .container {
            display: flex;
            flex-wrap: wrap;
            justify-content: flex-start;
            gap: 10px;
        }
        .date-section {
            flex: 0 0 calc(25% - 8px) !important; /* 強制使用四欄布局 */
        }`;

export const convertB2IlitekDinner = createLandscapeConvert({
  cssPath: '../../css/b2_ilitek_dinner.css',
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
  showPrice: false,
  extraInlineStyle: DINNER_4COL_STYLE,
});

export const convertB2IlitekDinnerTv = makeTvConvert(convertB2IlitekDinner, 1528, 1080);
