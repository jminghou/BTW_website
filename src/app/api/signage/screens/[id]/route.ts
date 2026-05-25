import { NextRequest, NextResponse } from 'next/server';
import { updateScreen, deleteScreen } from '@/lib/signage/db';

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = Number(params.id);
    if (!id || isNaN(id)) {
      return NextResponse.json({ success: false, message: '無效的 ID' }, { status: 400 });
    }
    const body = await req.json();
    const result = await updateScreen(id, body);
    if (result.success) return NextResponse.json({ success: true, data: result.data });
    return NextResponse.json({
      success: false,
      message: typeof result.error === 'string' ? result.error : '更新失敗',
    }, { status: 404 });
  } catch (error) {
    console.error('螢幕 API 錯誤：', error);
    return NextResponse.json({ success: false, message: '伺服器內部錯誤' }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = Number(params.id);
    if (!id || isNaN(id)) {
      return NextResponse.json({ success: false, message: '無效的 ID' }, { status: 400 });
    }
    const result = await deleteScreen(id);
    if (result.success) return NextResponse.json({ success: true, message: '螢幕已刪除' });
    return NextResponse.json({
      success: false,
      message: typeof result.error === 'string' ? result.error : '刪除失敗',
    }, { status: 404 });
  } catch (error) {
    console.error('螢幕 API 錯誤：', error);
    return NextResponse.json({ success: false, message: '伺服器內部錯誤' }, { status: 500 });
  }
}
