/**
 * 國科會 TTA 直式週菜單 EDM
 * 由 BTW_EDM_3.0/edm_module/b_tta.py 移植（b_h1 標準版型）。
 * CSS 已預生成為 public/signage-assets/css/b_tta.css。
 */
import { createB1Convert } from './_b_h1_common';
import { makeTvConvert } from './_tv';

const LOC: Record<string, string> = { TTA南部據點: '台南國科大樓' };

export const convertBTta = createB1Convert({
  key: 'b_tta',
  cssPath: '../../css/b_tta.css',
  images: {
    corner_logo: '../../pic/btw_side_logo_white.png',
    company_logo: '../../pic/logos/tta_logo.png',
    qr_code: '../../pic/qrcode/qr_tta.png',
  },
  qrText: '註冊&客服專線',
  copyright: '© 2025 浩華企業股份有限公司 By The Way. All rights reserved.',
  notices: {
    訂餐時間: '當日 10:00 前',
    取餐時間: '11:50-13:30',
    異常處理: '請掃碼QRCode，或搜尋@mtktw聯絡客服由專人為您服務。',
    補充說明: '※非供餐時段不提供取餐服務，若有不便敬請見諒。',
  },
  resolveLocation: (raw) => LOC[raw] ?? raw,
  defaultLocation: '聯發科',
  layout: 'standard',
  weekMode: 'monday',
  emptyDayHeight: 180,
});

export const convertBTtaTv = makeTvConvert(convertBTta, 1080, 1528);
