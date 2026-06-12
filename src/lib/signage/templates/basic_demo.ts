/**
 * 基礎示範（奕力）直式週菜單 EDM
 * 由 BTW_EDM_3.0/edm_module/basic_demo.py 移植（b_h1 標準版型）。
 *
 * 特點：依「據點+時段」彙整為一張、逐日列出實際有資料的日期（不補空白、不分週、不濾週末）。
 * 註：舊版以 item['星期'] 查不完整的對照表，遇中文星期會顯示成「(None) 星期一」；
 *     本版改由日期推算星期，正確顯示「(一) MON」。
 * CSS 已預生成為 public/signage-assets/css/basic_demo.css。
 */
import { createB1Convert } from './_b_h1_common';
import { makeTvConvert } from './_tv';
import { ILITEK_LOC, ILITEK_MEAL } from './bty_ilitek';

export const convertBasicDemo = createB1Convert({
  key: 'basic_demo',
  cssPath: '../../css/basic_demo.css',
  images: {
    corner_logo: '../../pic/btw_side_logo_white.png',
    company_logo: '../../pic/logos/ilitek_logo.png',
    qr_code: '../../pic/qrcode/qr-ilitek.png',
  },
  qrText: '註冊&客服專線',
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

export const convertBasicDemoTv = makeTvConvert(convertBasicDemo, 1080, 1528);
