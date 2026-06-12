/**
 * 台元 星宸 直式週菜單 EDM
 * 由 BTW_EDM_3.0/edm_module/bty_sigmstar.py 移植（b_h1 標準版型 + 排除飲料類）。
 * CSS 已預生成為 public/signage-assets/css/bty_sigmstar.css。
 */
import { createB1Convert } from './_b_h1_common';
import { makeTvConvert } from './_tv';
import { ILITEK_LOC, ILITEK_MEAL, BTY_DRINK_FILTER } from './bty_ilitek';

export const convertBtySigmstar = createB1Convert({
  key: 'bty_sigmstar',
  cssPath: '../../css/bty_sigmstar.css',
  images: {
    corner_logo: '../../pic/btw_side_logo_white.png',
    company_logo: '../../pic/logos/sigmstar_logo.png',
    qr_code: '../../pic/qrcode/qr-sigmstar.png',
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
  itemFilter: BTY_DRINK_FILTER,
});

export const convertBtySigmstarTv = makeTvConvert(convertBtySigmstar, 1080, 1528);
