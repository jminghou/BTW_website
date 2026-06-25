import { NextRequest, NextResponse } from 'next/server';
import { deduplicateSchedulesBySite } from '@/lib/signage/db';

/**
 * 一次性清理既有重複排程
 * POST /api/signage/schedules/deduplicate
 * Body: { site_id: number, keep?: 'latest' | 'oldest' }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const siteId = Number(body?.site_id);
    const keepRaw = String(body?.keep || 'latest');
    const keep = keepRaw === 'oldest' ? 'oldest' : 'latest';

    if (!siteId || Number.isNaN(siteId)) {
      return NextResponse.json({ success: false, message: '缺少或無效的 site_id' }, { status: 400 });
    }

    const result = await deduplicateSchedulesBySite(siteId, keep);
    if (!result.success) {
      return NextResponse.json({
        success: false,
        message: '清理重複排程失敗',
        error: result.error,
      }, { status: 500 });
    }

    const deleted = (result.data as { deleted: number }).deleted;
    return NextResponse.json({
      success: true,
      message: `已清理 ${deleted} 筆重複排程（保留${keep === 'latest' ? '最新' : '最舊'}）`,
      data: result.data,
    });
  } catch (error) {
    console.error('清理重複排程 API 錯誤：', error);
    return NextResponse.json({ success: false, message: '伺服器內部錯誤' }, { status: 500 });
  }
}
