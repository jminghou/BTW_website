import { NextRequest, NextResponse } from 'next/server';
import { getAssets } from '@/lib/signage/db';

/**
 * 取得素材清單
 * GET /api/signage/assets?site_id=<id>
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const siteIdStr = searchParams.get('site_id');
    const siteId = siteIdStr ? Number(siteIdStr) : undefined;

    const result = await getAssets(siteId);
    if (result.success) {
      return NextResponse.json({ success: true, data: result.data });
    }
    return NextResponse.json({
      success: false,
      message: '取得素材失敗',
      error: result.error,
    }, { status: 500 });
  } catch (error) {
    console.error('取得素材 API 錯誤：', error);
    return NextResponse.json({ success: false, message: '伺服器內部錯誤' }, { status: 500 });
  }
}
