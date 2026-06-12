/**
 * 凱基銀行 直式週菜單 EDM
 * 由 BTW_EDM_3.0/edm_module/b_kgibank.py 移植（b_h1 標準版型，頁尾多一條「取餐地點」）。
 * CSS 已預生成為 public/signage-assets/css/b_kgibank.css。
 */
import { createB1Convert } from './_b_h1_common';
import { makeTvConvert } from './_tv';

export const convertBKgibank = createB1Convert({
  key: 'b_kgibank',
  cssPath: '../../css/b_kgibank.css',
  images: {
    corner_logo: '../../pic/btw_side_logo_white.png',
    company_logo: '../../pic/logos/kgibank_logo.svg',
    qr_code: '../../pic/qrcode/qr_kgibank.png',
  },
  qrText: '註冊&客服專線',
  copyright: '© 2025 浩華企業股份有限公司 By The Way. All rights reserved.',
  notices: {
    訂餐時間: '當日 10點 前',
    取餐時間: '午餐時段 11:40-13:30',
    取餐地點: '一樓後門卸貨區',
    異常處理: '請掃碼QRCode，或搜尋 @kgibtw 聯絡客服由專人為您服務。',
    補充說明: '※非供餐時段不提供取餐服務，若有不便敬請見諒。',
  },
  resolveLocation: () => '凱基大樓',
  defaultLocation: '凱基大樓',
  layout: 'standard',
  weekMode: 'monday',
  emptyDayHeight: 180,
});

export const convertBKgibankTv = makeTvConvert(convertBKgibank, 1080, 1528);
