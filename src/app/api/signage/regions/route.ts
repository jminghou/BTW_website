import { NextRequest, NextResponse } from 'next/server';
import { getRegions, createRegion } from '@/lib/signage/db';

export async function GET() {
  try {
    const result = await getRegions();
    if (result.success) return NextResponse.json({ success: true, data: result.data });
    return NextResponse.json({ success: false, message: '取得區域失敗', error: result.error }, { status: 500 });
  } catch (error) {
    console.error('區域 API 錯誤：', error);
    return NextResponse.json({ success: false, message: '伺服器內部錯誤' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, description } = body;
    if (!name) {
      return NextResponse.json({ success: false, message: '請填寫區域名稱' }, { status: 400 });
    }
    const result = await createRegion({ name, description });
    if (result.success) {
      return NextResponse.json({ success: true, data: result.data, message: '區域建立成功' }, { status: 201 });
    }
    return NextResponse.json({ success: false, message: '建立區域失敗', error: result.error }, { status: 500 });
  } catch (error) {
    console.error('區域 API 錯誤：', error);
    return NextResponse.json({ success: false, message: '伺服器內部錯誤' }, { status: 500 });
  }
}
