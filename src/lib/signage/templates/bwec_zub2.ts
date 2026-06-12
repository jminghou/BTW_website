/**
 * 華邦竹北（版型2）直式週菜單 EDM
 * 由 BTW_EDM_3.0/edm_module/bwec_zub2.py 移植（b_h1 標準版型，逐日列出實際日期）。
 *
 * 特點：售價一律餐補後減 40（非純數字維持原值）；使用 bwec_ntc.json 設定與 bwec_ntc.css。
 * 星期改由日期推算（舊版中文星期會顯示 None）。
 */
import { createB1Convert } from './_b_h1_common';
import { makeTvConvert } from './_tv';
import { WINBOND_LOC, WINBOND_MEAL } from './bwec_ntc';

/** 餐補後售價：一律 -40（非純數字維持原值，同舊版 try/except） */
const zub2Price = (price: string | number): string | number => {
  if (typeof price !== 'string') return price;
  const s = price.trim();
  if (!/^[+-]?\d+$/.test(s)) return price;
  return parseInt(s, 10) - 40;
};

export const convertBwecZub2 = createB1Convert({
  key: 'bwec_zub2',
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
  resolveLocation: (raw) => WINBOND_LOC[raw] ?? raw,
  defaultLocation: '華邦/新唐',
  mealPeriodMap: WINBOND_MEAL,
  layout: 'standard',
  weekMode: 'monday',
  emptyDayHeight: 120,
  weekWindow: 'actual',
  noWeekSplit: true,
  noWeekdayFilter: true,
  priceTransform: (p) => zub2Price(p),
});

export const convertBwecZub2Tv = makeTvConvert(convertBwecZub2, 1080, 1528);
