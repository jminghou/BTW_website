/**
 * 台元 奕力（版型2）直式週菜單 EDM
 * 由 BTW_EDM_3.0/edm_module/ty_ilitek2.py 移植（b_h1 標準版型，逐日列出實際日期）。
 *
 * 修正：舊版圖片路徑為錯字（btw_siee_logo_white.png / logo-ilitek.png，檔案不存在），
 *       本版改用正確檔案；星期亦改由日期推算（舊版中文星期會顯示 None）。
 * CSS：ty_ilitek2.css（已從舊專案複製到 public/signage-assets/css/）。
 */
import { createB1Convert } from './_b_h1_common';
import { makeTvConvert } from './_tv';
import { ILITEK_LOC, ILITEK_MEAL } from './bty_ilitek';

export const convertTyIlitek2 = createB1Convert({
  key: 'ty_ilitek2',
  cssPath: '../../css/ty_ilitek2.css',
  images: {
    corner_logo: '../../pic/btw_side_logo_white.png',
    company_logo: '../../pic/logos/ilitek_logo.png',
    qr_code: '../../pic/qrcode/qr-ilitek.png',
  },
  qrText: '註冊客服專線',
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
  weekWindow: 'actual',
  noWeekSplit: true,
  noWeekdayFilter: true,
});

export const convertTyIlitek2Tv = makeTvConvert(convertTyIlitek2, 1080, 1528);
