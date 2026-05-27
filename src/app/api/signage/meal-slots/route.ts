import { NextRequest, NextResponse } from 'next/server';
import { getMealSlots, updateMealSlots, type MealSlot } from '@/lib/signage/db';

/**
 * 餐期時段設定（每廠區）
 * GET  /api/signage/meal-slots?site_id=X   取得設定（首次自動植入預設）
 * PUT  /api/signage/meal-slots             更新設定，body: { site_id, slots: MealSlot[] }
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const siteId = Number(searchParams.get('site_id'));
    if (!siteId || isNaN(siteId)) {
      return NextResponse.json({ success: false, message: '缺少或無效的 site_id' }, { status: 400 });
    }
    const result = await getMealSlots(siteId);
    if (result.success) return NextResponse.json({ success: true, data: result.data });
    return NextResponse.json({ success: false, message: '取得餐期設定失敗', error: result.error }, { status: 500 });
  } catch (error) {
    console.error('餐期設定 API 錯誤：', error);
    return NextResponse.json({ success: false, message: '伺服器內部錯誤' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const siteId = Number(body?.site_id);
    const slots = body?.slots as MealSlot[];
    if (!siteId || isNaN(siteId)) {
      return NextResponse.json({ success: false, message: '缺少或無效的 site_id' }, { status: 400 });
    }
    if (!Array.isArray(slots)) {
      return NextResponse.json({ success: false, message: '缺少 slots' }, { status: 400 });
    }
    // 基本驗證：時間格式 HH:MM
    for (const s of slots) {
      if (!/^\d{2}:\d{2}$/.test(s.start_time) || !/^\d{2}:\d{2}$/.test(s.end_time)) {
        return NextResponse.json({ success: false, message: `餐期 ${s.meal_key} 時間格式錯誤` }, { status: 400 });
      }
    }
    const result = await updateMealSlots(siteId, slots);
    if (result.success) return NextResponse.json({ success: true, message: '餐期設定已儲存' });
    return NextResponse.json({ success: false, message: '儲存失敗', error: result.error }, { status: 500 });
  } catch (error) {
    console.error('餐期設定 API 錯誤：', error);
    return NextResponse.json({ success: false, message: '伺服器內部錯誤' }, { status: 500 });
  }
}
