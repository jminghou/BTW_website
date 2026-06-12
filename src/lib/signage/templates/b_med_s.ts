/**
 * 聯發科 S棟 直式週菜單 EDM
 * 由 BTW_EDM_3.0/edm_module/b_med_s.py 移植（b_h1 標準版型）。
 * CSS 已預生成為 public/signage-assets/css/b_med_s.css。
 */
import { createB1Convert } from './_b_h1_common';
import { makeTvConvert } from './_tv';

/** 聯發科各據點顯示名稱對照（s / tna / ab 共用） */
export const MED_LOC: Record<string, string> = {
  聯發科總部: '總部AB棟',
  'CP-C 同仁': '昌益 CPC',
  'CP-C OT/DS': '昌益 CPC',
  'HC-S 同仁': 'S棟',
  'HC-S OT/DS': 'S棟',
  'TP-R 同仁': '行善/瑞光',
  'TP-X 同仁': '行善/瑞光',
  'TN-A 同仁': '台南 TNA',
};

export const convertBMedS = createB1Convert({
  key: 'b_med_s',
  cssPath: '../../css/b_med_s.css',
  images: {
    corner_logo: '../../pic/btw_side_logo_white.png',
    company_logo: '../../pic/logos/mediatek_logo.png',
    qr_code: '../../pic/qrcode/qr_mediatek.png',
  },
  qrText: '註冊&客服專線',
  copyright: '© 2025 浩華企業股份有限公司 By The Way. All rights reserved.',
  notices: {
    訂餐時間: '午餐時段 當日 10:00 前 、晚餐時段 當日 16:00 前',
    取餐時間: '午餐時段 12:00-13:30 、晚餐時段 17:30-19:30',
    異常處理: '請掃碼QRCode，或搜尋@mtktw聯絡客服由專人為您服務。',
    補充說明: '※非供餐時段不提供取餐服務，若有不便敬請見諒。',
  },
  resolveLocation: (raw) => MED_LOC[raw] ?? raw,
  defaultLocation: '聯發科',
  layout: 'standard',
  weekMode: 'monday',
  emptyDayHeight: 180,
});

export const convertBMedSTv = makeTvConvert(convertBMedS, 1080, 1528);
