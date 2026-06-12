/**
 * 華邦台南（新唐/華邦）直式週菜單 EDM
 * 由 BTW_EDM_3.0/edm_module/bwec_ntc.py 移植（b_h1 標準版型）。
 *
 * 特點：售價為「餐補後價」——台南大樓減 50、其餘減 40；菜單一律套小字級 class。
 * CSS 已預生成為 public/signage-assets/css/bwec_ntc.css。
 */
import { createB1Convert, SMALL_FONT_STYLE } from './_b_h1_common';
import { makeTvConvert } from './_tv';

/** 華邦/新唐據點對照（ntc / nan / zub2 共用基底） */
export const WINBOND_LOC: Record<string, string> = {
  南港辦公室: '南港辦公室',
  台南大樓: '台南大樓',
  華邦竹北大樓: '竹北大樓',
  新唐竹北大樓: '竹北大樓',
};
export const WINBOND_MEAL: Record<string, string> = { 午餐: '午餐', 晚餐: '晚餐', 下午茶: '飲料' };

/** 餐補後售價：台南大樓 -50、其餘 -40；非純數字售價維持原值（同舊版 try/except） */
export const winbondPrice = (price: string | number, location: string): string | number => {
  if (typeof price !== 'string') return price; // Python: 非字串 .strip() 失敗 → 原值
  const s = price.trim();
  if (!/^[+-]?\d+$/.test(s)) return price; // Python: int() 失敗 → 原值
  const n = parseInt(s, 10);
  return location !== '台南大樓' ? n - 40 : n - 50;
};

export const convertBwecNtc = createB1Convert({
  key: 'bwec_ntc',
  cssPath: '../../css/bwec_ntc.css',
  images: {
    corner_logo: '../../pic/btw_side_logo_white.png',
    company_logo: '../../pic/logos/winbond_logo.png',
    qr_code: '../../pic/qrcode/qr_winbond.png',
  },
  qrText: '註冊&客服專線',
  copyright: '© 2025 浩華企業股份有限公司 By The Way. All rights reserved.',
  notices: {
    訂餐時間: '前一天11:59前。每週五可預訂下週餐點。',
    取餐時間: '11:40-13:00',
    異常處理: '請掃碼QRCode，或搜尋@meals聯絡客服由專人為您服務。',
    補充說明: '※非供餐時段不提供取餐服務，若有不便敬請見諒。',
  },
  resolveLocation: (raw) => WINBOND_LOC[raw] ?? '台南大樓', // ntc 預設台南大樓
  defaultLocation: '華邦/新唐',
  mealPeriodMap: WINBOND_MEAL,
  layout: 'standard',
  weekMode: 'monday',
  emptyDayHeight: 120,
  priceTransform: winbondPrice,
  menuItemsClass: 'menu-items small-font',
  extraInlineStyle: SMALL_FONT_STYLE,
});

export const convertBwecNtcTv = makeTvConvert(convertBwecNtc, 1080, 1528);
