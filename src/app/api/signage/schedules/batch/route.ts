import { NextRequest, NextResponse } from 'next/server';
import { batchCreateSchedules } from '@/lib/signage/db';

/**
 * 批次建立排程
 * POST /api/signage/schedules/batch
 * Body: { screen_ids: number[], playlist_id, start_time, end_time, days_of_week: number[], play_date?: string|null }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { screen_ids, playlist_id, start_time, end_time, days_of_week, play_date, start_date, end_date } = body;

    if (!Array.isArray(screen_ids) || screen_ids.length === 0) {
      return NextResponse.json({ success: false, message: '請選擇至少一個螢幕' }, { status: 400 });
    }
    if (!playlist_id || !start_time || !end_time || !Array.isArray(days_of_week)) {
      return NextResponse.json({
        success: false,
        message: '請填寫所有必填欄位 (playlist_id, start_time, end_time, days_of_week)',
      }, { status: 400 });
    }

    const result = await batchCreateSchedules({
      screen_ids: screen_ids.map(Number),
      playlist_id: Number(playlist_id),
      start_time,
      end_time,
      days_of_week: days_of_week.map(Number),
      play_date: play_date || null,
      start_date: start_date || null,
      end_date: end_date || null,
    });

    if (result.success) {
      const data = result.data as unknown[];
      return NextResponse.json({
        success: true,
        data,
        message: `已套用排程到 ${data.length} 個螢幕`,
      }, { status: 201 });
    }
    return NextResponse.json({
      success: false,
      message: typeof result.error === 'string' ? result.error : '批次建立失敗',
    }, { status: 500 });
  } catch (error) {
    console.error('批次排程 API 錯誤：', error);
    return NextResponse.json({ success: false, message: '伺服器內部錯誤' }, { status: 500 });
  }
}
