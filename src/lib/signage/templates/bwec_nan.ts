/**
 * 華邦南港 直式週菜單 EDM
 * 由 BTW_EDM_3.0/edm_module/bwec_nan.py 移植（b_h1 三欄無圖版型 + 餐補價 + 小字級）。
 * 共用 bwec_ntc.css（同 bwec_ntc.json 設定）。
 */
import { createB1Convert, THREE_COL_INLINE_STYLE, SMALL_FONT_STYLE } from './_b_h1_common';
import { makeTvConvert } from './_tv';
import { WINBOND_MEAL, winbondPrice } from './bwec_ntc';

/** 南港版多了新唐/華邦南港辦公室對照 */
const NAN_LOC: Record<string, string> = {
  南港辦公室: '南港辦公室',
  新唐南港辦公室: '南港辦公室',
  華邦南港辦公室: '南港辦公室',
  台南大樓: '台南大樓',
  華邦竹北大樓: '竹北大樓',
  新唐竹北大樓: '竹北大樓',
};

export const convertBwecNan = createB1Convert({
  key: 'bwec_nan',
  cssPath: '../../css/bwec_ntc.css',
  images: {
    corner_logo: '../../pic/btw_side_logo_white.png',
    company_logo: '../../pic/logos/winbond_logo.png',
    qr_code: '../../pic/qrcode/qr_winbond.png',
  },
  qrText: '註冊&客服專線',
  copyright: '© 2025 浩華企業股份有限公司 By The Way. All rights reserved.',
  notices: {
    訂餐時間: '當天早上09:00前。每週五可預訂下週餐點。',
    取餐時間: '12:00-13:00',
    異常處理: '請掃碼QRCode，或搜尋@meals聯絡客服由專人為您服務。',
    補充說明: '※非供餐時段不提供取餐服務，若有不便敬請見諒。',
  },
  resolveLocation: (raw) => NAN_LOC[raw] ?? raw, // nan 預設原值
  defaultLocation: '華邦/新唐',
  mealPeriodMap: WINBOND_MEAL,
  layout: 'noimage3col',
  weekMode: 'monday',
  emptyDayHeight: 120,
  priceTransform: winbondPrice,
  menuItemsClass: 'menu-items small-font',
  extraInlineStyle: THREE_COL_INLINE_STYLE + SMALL_FONT_STYLE,
});

export const convertBwecNanTv = makeTvConvert(convertBwecNan, 1080, 1528);
