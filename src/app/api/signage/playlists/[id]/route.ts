import { NextRequest, NextResponse } from 'next/server';
import { getPlaylistById, updatePlaylist, deletePlaylist } from '@/lib/signage/db';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = Number(params.id);
    if (!id || isNaN(id)) {
      return NextResponse.json({ success: false, message: '無效的 ID' }, { status: 400 });
    }
    const result = await getPlaylistById(id);
    if (result.success) return NextResponse.json({ success: true, data: result.data });
    return NextResponse.json({
      success: false,
      message: typeof result.error === 'string' ? result.error : '取得失敗',
    }, { status: 404 });
  } catch (error) {
    console.error('播放清單 API 錯誤：', error);
    return NextResponse.json({ success: false, message: '伺服器內部錯誤' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = Number(params.id);
    if (!id || isNaN(id)) {
      return NextResponse.json({ success: false, message: '無效的 ID' }, { status: 400 });
    }
    const body = await req.json();
    const result = await updatePlaylist(id, body);
    if (result.success) return NextResponse.json({ success: true, data: result.data });
    return NextResponse.json({
      success: false,
      message: typeof result.error === 'string' ? result.error : '更新失敗',
    }, { status: 404 });
  } catch (error) {
    console.error('播放清單 API 錯誤：', error);
    return NextResponse.json({ success: false, message: '伺服器內部錯誤' }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = Number(params.id);
    if (!id || isNaN(id)) {
      return NextResponse.json({ success: false, message: '無效的 ID' }, { status: 400 });
    }
    const result = await deletePlaylist(id);
    if (result.success) return NextResponse.json({ success: true, message: '播放清單已刪除' });
    return NextResponse.json({
      success: false,
      message: typeof result.error === 'string' ? result.error : '刪除失敗',
    }, { status: 404 });
  } catch (error) {
    console.error('播放清單 API 錯誤：', error);
    return NextResponse.json({ success: false, message: '伺服器內部錯誤' }, { status: 500 });
  }
}
