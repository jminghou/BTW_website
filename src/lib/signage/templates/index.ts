import { convertVis3, type MealItem, type ConvertedMenu } from './vis3';

/**
 * 版型註冊表
 * 未來新增版型轉檔邏輯 = 在此多註冊一個 entry。
 */
export interface SignageTemplate {
  key: string;
  name: string;
  convert: (meals: MealItem[]) => ConvertedMenu[];
}

export const templates: Record<string, SignageTemplate> = {
  vis3: {
    key: 'vis3',
    name: 'VIS 三欄式菜單',
    convert: convertVis3,
  },
};

export const DEFAULT_TEMPLATE = 'vis3';

export type { MealItem, ConvertedMenu };
