import { cleanRestaurantName } from './templates/_b_h1_common';

/**
 * 電子看版轉檔一律不輸出的餐廳。
 * 比對時會先去掉前綴（最後一個破折號之後），再與名單完全相符才排除。
 */
export const EXCLUDED_SIGNAGE_RESTAURANTS = ['長宏人力'] as const;

export function isExcludedSignageRestaurant(name: string | null | undefined): boolean {
  const normalized = (name ?? '').trim().replace(/[－—]/g, '-');
  if (!normalized) return false;
  const cleaned = cleanRestaurantName(normalized).trim();
  return (EXCLUDED_SIGNAGE_RESTAURANTS as readonly string[]).includes(cleaned);
}

export function filterExcludedSignageMeals<T extends { 餐廳名稱?: string | null }>(meals: T[]): T[] {
  return meals.filter((meal) => !isExcludedSignageRestaurant(meal?.餐廳名稱));
}
