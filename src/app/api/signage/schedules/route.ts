import { NextRequest, NextResponse } from 'next/server';
import { getSchedules, createSchedule } from '@/lib/signage/db';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const screenIdStr = searchParams.get('screen_id');
    const screenId = screenIdStr ? Number(screenIdStr) : undefined;
    const result = await getSchedules(screenId);
    if (result.success) return NextResponse.json({ success: true, data: result.data });
    return NextResponse.json({ success: false, message: '取得排程失敗', error: result.error }, { status: 500 });
  } catch (error) {
    console.error('排程 API 錯誤：', error);
    return NextResponse.json({ success: false, message: '伺服器內部錯誤' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { screen_id, playlist_id, start_time, end_time, days_of_week, play_date, start_date, end_date } = body;
    if (!screen_id || !playlist_id || !start_time || !end_time || !Array.isArray(days_of_week)) {
      return NextResponse.json({
        success: false,
        message: '請填寫所有必填欄位 (screen_id, playlist_id, start_time, end_time, days_of_week)',
      }, { status: 400 });
    }
    const result = await createSchedule({
      screen_id: Number(screen_id),
      playlist_id: Number(playlist_id),
      start_time,
      end_time,
      days_of_week: days_of_week.map(Number),
      play_date: play_date || null,
      start_date: start_date || null,
      end_date: end_date || null,
    });
    if (result.success) {
      return NextResponse.json({ success: true, data: result.data, message: '排程建立成功' }, { status: 201 });
    }
    return NextResponse.json({ success: false, message: '建立排程失敗', error: result.error }, { status: 500 });
  } catch (error) {
    console.error('排程 API 錯誤：', error);
    return NextResponse.json({ success: false, message: '伺服器內部錯誤' }, { status: 500 });
  }
}
