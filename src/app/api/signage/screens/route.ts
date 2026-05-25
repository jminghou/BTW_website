import { NextRequest, NextResponse } from 'next/server';
import { getScreens, createScreen } from '@/lib/signage/db';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const siteIdStr = searchParams.get('site_id');
    const siteId = siteIdStr ? Number(siteIdStr) : undefined;
    const result = await getScreens(siteId);
    if (result.success) return NextResponse.json({ success: true, data: result.data });
    return NextResponse.json({ success: false, message: '取得螢幕失敗', error: result.error }, { status: 500 });
  } catch (error) {
    console.error('螢幕 API 錯誤：', error);
    return NextResponse.json({ success: false, message: '伺服器內部錯誤' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { site_id, name, description } = body;
    if (!site_id || !name) {
      return NextResponse.json({ success: false, message: '請填寫所有必填欄位 (site_id, name)' }, { status: 400 });
    }
    const result = await createScreen({ site_id: Number(site_id), name, description });
    if (result.success) {
      return NextResponse.json({ success: true, data: result.data, message: '螢幕建立成功' }, { status: 201 });
    }
    return NextResponse.json({ success: false, message: '建立螢幕失敗', error: result.error }, { status: 500 });
  } catch (error) {
    console.error('螢幕 API 錯誤：', error);
    return NextResponse.json({ success: false, message: '伺服器內部錯誤' }, { status: 500 });
  }
}
