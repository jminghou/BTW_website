import { NextRequest, NextResponse } from 'next/server';
import { deleteSchedulesForMonth } from '@/lib/signage/db';

/**
 * 清空某螢幕在指定月份月曆上的全部排程
 * POST /api/signage/schedules/clear-month
 * Body: { site_id: number, screen_id: number, year: number, month: number }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const siteId = Number(body?.site_id);
    const screenId = Number(body?.screen_id);
    const year = Number(body?.year);
    const month = Number(body?.month);

    if (!siteId || Number.isNaN(siteId) || !screenId || Number.isNaN(screenId)) {
      return NextResponse.json({ success: false, message: '缺少或無效的 site_id / screen_id' }, { status: 400 });
    }
    if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12) {
      return NextResponse.json({ success: false, message: '年份或月份不正確' }, { status: 400 });
    }

    const result = await deleteSchedulesForMonth(siteId, screenId, year, month);
    if (!result.success) {
      const message = typeof result.error === 'string' ? result.error : '刪除當月排程失敗';
      const status = message.includes('找不到') || message.includes('不正確') ? 400 : 500;
      return NextResponse.json({ success: false, message }, { status });
    }

    const deleted = (result.data as { deleted: number }).deleted;
    return NextResponse.json({
      success: true,
      message: deleted > 0 ? `已刪除 ${deleted} 筆當月排程` : '這個月沒有可刪除的排程',
      data: result.data,
    });
  } catch (error) {
    console.error('刪除當月排程 API 錯誤：', error);
    return NextResponse.json({ success: false, message: '伺服器內部錯誤' }, { status: 500 });
  }
}
