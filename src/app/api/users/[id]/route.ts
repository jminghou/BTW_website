import { NextRequest, NextResponse } from 'next/server';
import { updateUser, deleteUser, changeUserPassword } from '@/lib/db';

/**
 * 個別用戶管理 API 路由
 * PUT /api/users/[id] - 更新用戶資訊
 * DELETE /api/users/[id] - 刪除用戶
 * PATCH /api/users/[id] - 更改密碼
 */

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = parseInt(params.id);
    if (isNaN(userId)) {
      return NextResponse.json({
        success: false,
        message: '無效的用戶 ID'
      }, { status: 400 });
    }

    const userData = await request.json();
    const result = await updateUser(userId, userData);
    
    if (result.success) {
      return NextResponse.json({
        success: true,
        message: '用戶更新成功',
        data: result.data
      }, { status: 200 });
    } else {
      return NextResponse.json({
        success: false,
        message: result.error
      }, { status: 400 });
    }
  } catch (error) {
    console.error('更新用戶 API 路由錯誤：', error);
    return NextResponse.json({
      success: false,
      message: '伺服器內部錯誤'
    }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = parseInt(params.id);
    if (isNaN(userId)) {
      return NextResponse.json({
        success: false,
        message: '無效的用戶 ID'
      }, { status: 400 });
    }

    const result = await deleteUser(userId);
    
    if (result.success) {
      return NextResponse.json({
        success: true,
        message: '用戶刪除成功',
        data: result.data
      }, { status: 200 });
    } else {
      return NextResponse.json({
        success: false,
        message: result.error
      }, { status: 400 });
    }
  } catch (error) {
    console.error('刪除用戶 API 路由錯誤：', error);
    return NextResponse.json({
      success: false,
      message: '伺服器內部錯誤'
    }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = parseInt(params.id);
    if (isNaN(userId)) {
      return NextResponse.json({
        success: false,
        message: '無效的用戶 ID'
      }, { status: 400 });
    }

    const { newPassword } = await request.json();
    
    if (!newPassword || newPassword.length < 4) {
      return NextResponse.json({
        success: false,
        message: '密碼長度至少需要 4 個字元'
      }, { status: 400 });
    }

    const result = await changeUserPassword(userId, newPassword);
    
    if (result.success) {
      return NextResponse.json({
        success: true,
        message: '密碼更新成功',
        data: result.data
      }, { status: 200 });
    } else {
      return NextResponse.json({
        success: false,
        message: result.error
      }, { status: 400 });
    }
  } catch (error) {
    console.error('更改密碼 API 路由錯誤：', error);
    return NextResponse.json({
      success: false,
      message: '伺服器內部錯誤'
    }, { status: 500 });
  }
}
