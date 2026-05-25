import { NextRequest, NextResponse } from 'next/server';
import { getSites, createSite } from '@/lib/signage/db';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const regionIdStr = searchParams.get('region_id');
    const regionId = regionIdStr ? Number(regionIdStr) : undefined;
    const result = await getSites(regionId);
    if (result.success) return NextResponse.json({ success: true, data: result.data });
    return NextResponse.json({ success: false, message: '取得廠區失敗', error: result.error }, { status: 500 });
  } catch (error) {
    console.error('廠區 API 錯誤：', error);
    return NextResponse.json({ success: false, message: '伺服器內部錯誤' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { region_id, name, code, description } = body;
    if (!region_id || !name || !code) {
      return NextResponse.json({ success: false, message: '請填寫所有必填欄位 (region_id, name, code)' }, { status: 400 });
    }
    const result = await createSite({ region_id: Number(region_id), name, code, description });
    if (result.success) {
      return NextResponse.json({ success: true, data: result.data, message: '廠區建立成功' }, { status: 201 });
    }
    return NextResponse.json({
      success: false,
      message: typeof result.error === 'string' ? result.error : '建立廠區失敗',
    }, { status: 400 });
  } catch (error) {
    console.error('廠區 API 錯誤：', error);
    return NextResponse.json({ success: false, message: '伺服器內部錯誤' }, { status: 500 });
  }
}
