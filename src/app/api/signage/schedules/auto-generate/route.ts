import { NextRequest, NextResponse } from 'next/server';
import { autoGenerateSchedulesFromPlaylists } from '@/lib/signage/db';

/**
 * 一鍵列表轉排程
 * POST /api/signage/schedules/auto-generate
 * Body: { site_id: number }
 *
 * 依該廠區播放清單內素材的檔名（*_[LDN]_YYYY-MM-DD.html）自動產生排程，
 * 為該廠區所有螢幕各建一筆，時段沿用舊系統參數。
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const siteId = Number(body?.site_id);
    if (!siteId || isNaN(siteId)) {
      return NextResponse.json({ success: false, message: '缺少或無效的 site_id' }, { status: 400 });
    }

    const result = await autoGenerateSchedulesFromPlaylists(siteId);
    if (!result.success) {
      return NextResponse.json({
        success: false,
        message: typeof result.error === 'string' ? result.error : '一鍵轉排程失敗',
      }, { status: typeof result.error === 'string' ? 400 : 500 });
    }

    const { created, updated, skipped } = result.data as { created: number; updated: number; skipped: number };
    return NextResponse.json({
      success: true,
      message: `新增 ${created} 筆排程、補填 ${updated} 筆、略過 ${skipped} 筆`,
      data: result.data,
    }, { status: 201 });
  } catch (error) {
    console.error('一鍵列表轉排程 API 錯誤：', error);
    return NextResponse.json({ success: false, message: '伺服器內部錯誤' }, { status: 500 });
  }
}
