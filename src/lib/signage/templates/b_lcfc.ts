/**
 * 聯寶電腦（LCFC）直式週菜單 EDM
 * 由 BTW_EDM_3.0/edm_module/b_lcfc.py 移植（b_h1 三欄無圖版型）。
 * 特點：強制據點顯示「聯寶」；週一錨 Mon~Fri；空白日 120px；不顯示英文名與餐點圖。
 * CSS 已預生成為 public/signage-assets/css/b_lcfc.css。
 */
import { createB1Convert, THREE_COL_INLINE_STYLE } from './_b_h1_common';
import { makeTvConvert } from './_tv';

export const convertBLcfc = createB1Convert({
  key: 'b_lcfc',
  cssPath: '../../css/b_lcfc.css',
  images: {
    corner_logo: '../../pic/btw_side_logo_white.png',
    company_logo: '../../pic/logos/lcfc_logo.png',
    qr_code: '../../pic/qrcode/qr_lcfc.png',
  },
  qrText: '註冊&客服專線',
  copyright: '© 2025 浩華企業股份有限公司 By The Way. All rights reserved.',
  notices: {
    訂餐時間: '當日 10點 前',
    取餐時間: '12:00 - 13:30',
    異常處理: '請掃碼QRCode，或搜尋 @lcfc 聯絡客服由專人為您服務。',
    補充說明: '※非供餐時段不提供取餐服務，若有不便敬請見諒。',
  },
  resolveLocation: () => '聯寶',
  defaultLocation: '聯寶',
  layout: 'noimage3col',
  weekMode: 'monday',
  emptyDayHeight: 120,
  extraInlineStyle: THREE_COL_INLINE_STYLE,
});

export const convertBLcfcTv = makeTvConvert(convertBLcfc, 1080, 1528);
