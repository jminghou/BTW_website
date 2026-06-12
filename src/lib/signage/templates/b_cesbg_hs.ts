/**
 * 鴻佰竹北（CESBG 竹北）直式週菜單 EDM
 * 由 BTW_EDM_3.0/edm_module/b_cesbg_hs.py 移植（b_h1 標準版型）。
 * CSS 已預生成為 public/signage-assets/css/b_cesbg_hs.css。
 */
import { createB1Convert } from './_b_h1_common';
import { makeTvConvert } from './_tv';

export const convertBCesbgHs = createB1Convert({
  key: 'b_cesbg_hs',
  cssPath: '../../css/b_cesbg_hs.css',
  images: {
    corner_logo: '../../pic/btw_side_logo_white.png',
    company_logo: '../../pic/logos/ingrasys_logo.png',
    qr_code: '../../pic/qrcode/qr_cesbg_hs.png',
  },
  qrText: '註冊&客服專線',
  copyright: '© 2025 浩華企業股份有限公司 By The Way. All rights reserved.',
  notices: {
    訂餐時間: '前一天 14:00 前',
    取餐時間: '午餐時段 12:00 起',
    異常處理: '請掃碼QRCode，或搜尋@ingrasys聯絡客服由專人為您服務。',
    補充說明: '※非供餐時段不提供取餐服務，若有不便敬請見諒。',
  },
  resolveLocation: () => '鴻佰竹北',
  defaultLocation: '鴻佰竹北',
  layout: 'standard',
  weekMode: 'monday',
  emptyDayHeight: 180,
});

export const convertBCesbgHsTv = makeTvConvert(convertBCesbgHs, 1080, 1528);
