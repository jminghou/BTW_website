/**
 * 台元 立錡 直式週菜單 EDM
 * 由 BTW_EDM_3.0/edm_module/bty_richtek.py 移植（b_h1 標準版型 + 排除飲料類）。
 * CSS 已預生成為 public/signage-assets/css/bty_richtek.css。
 */
import { createB1Convert } from './_b_h1_common';
import { makeTvConvert } from './_tv';
import { BTY_DRINK_FILTER } from './bty_ilitek';

export const convertBtyRichtek = createB1Convert({
  key: 'bty_richtek',
  cssPath: '../../css/bty_richtek.css',
  images: {
    corner_logo: '../../pic/btw_side_logo_white.png',
    company_logo: '../../pic/logos/richtek_logo.png',
    qr_code: '../../pic/qrcode/qr-richtek.png',
  },
  qrText: '註冊&客服專線',
  copyright: '© 2025 浩華企業股份有限公司 By The Way. All rights reserved.',
  notices: {
    訂餐時間: '當日10:00',
    取餐時間: '11:50-14:00',
    異常處理: '請掃碼QRCode，或搜尋@richtek聯絡客服由專人為您服務。',
    補充說明: '※非供餐時段不提供取餐服務，若有不便敬請見諒。',
  },
  resolveLocation: (raw) =>
    ({ '立錡-DDS': 'DDS 9F 餐廳', '立錡-總公司餐廳': '總公司 13F 餐廳' }[raw] ?? raw),
  defaultLocation: '奕力-午餐便當專區',
  mealPeriodMap: { 午餐: '午餐', 晚餐: '晚餐', 下午茶: '飲料' },
  layout: 'standard',
  weekMode: 'monday',
  emptyDayHeight: 120,
  itemFilter: BTY_DRINK_FILTER,
});

export const convertBtyRichtekTv = makeTvConvert(convertBtyRichtek, 1080, 1528);
