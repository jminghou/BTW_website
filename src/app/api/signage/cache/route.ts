import { NextResponse } from 'next/server';
import { revalidateSignage } from '@/lib/signage/cache';

/**
 * 手動清空看版讀取快取
 * POST /api/signage/cache
 *
 * 逃生口。正常情況不需要用：任何寫入都會由 db.ts 的 sql 包裝層自動失效。
 * 留著是因為播放端快取刻意設成「不會自動到期」（見 src/lib/signage/cache.ts），
 * 萬一遇到失效沒被觸發的意外，要有辦法不用重新部署就把螢幕拉回最新內容。
 */
export async function POST() {
  revalidateSignage();
  return NextResponse.json({
    status: 'ok',
    message: '看版快取已清空，螢幕會在下一次輪詢取得最新內容',
  });
}
