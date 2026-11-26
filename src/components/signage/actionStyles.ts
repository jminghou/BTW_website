/**
 * 電子看版後台的操作按鈕。
 * 同一類功能全站共用同一套樣式，避免每一顆按鈕各用一種顏色。
 */
const base =
  'inline-flex items-center justify-center h-10 rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed';

export const signageAction = {
  /** 新增、建立、儲存、上傳、更新 */
  primary: `${base} bg-cyan-600 px-4 text-white hover:bg-cyan-700`,
  /** 一鍵轉換、批次處理、設定等非破壞性工具 */
  tool: `${base} border border-cyan-600 bg-white px-4 text-cyan-700 hover:bg-cyan-50`,
  /** 與 tool 同一邏輯的下拉選單 */
  toolSelect:
    'h-10 appearance-none cursor-pointer rounded-lg border border-cyan-600 bg-white pl-4 pr-9 text-sm font-medium text-cyan-700 hover:bg-cyan-50 disabled:cursor-not-allowed disabled:opacity-50',
  toolChevron: 'pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-cyan-700',
  /** 刪除、清理 */
  danger: `${base} border border-rose-600 bg-white px-4 text-rose-700 hover:bg-rose-50`,
  /** 全選、取消、關閉、月份切換 */
  quiet: `${base} border border-slate-300 bg-white px-4 text-slate-700 hover:bg-slate-50`,
  quietIcon: `${base} w-10 border border-slate-300 bg-white text-slate-700 hover:bg-slate-50`,
  /** 列表列上的檢視、編輯 */
  link: 'text-sm text-cyan-600 hover:underline',
  /** 列表列上的刪除 */
  linkDanger: 'text-sm text-red-600 hover:underline',
} as const;
