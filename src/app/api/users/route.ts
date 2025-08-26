import { NextRequest, NextResponse } from 'next/server';
import { getUsers, createUser } from '@/lib/db';

/**
 * 用戶管理 API 路由
 * GET /api/users - 取得所有用戶
 * POST /api/users - 建立新用戶
 */

export async function GET() {
  try {
    const result = await getUsers();
    
    if (result.success) {
      return NextResponse.json({
        success: true,
        data: result.data
      }, { status: 200 });
    } else {
      return NextResponse.json({
        success: false,
        message: '取得用戶列表失敗',
        error: result.error
      }, { status: 500 });
    }
  } catch (error) {
    console.error('取得用戶 API 路由錯誤：', error);
    return NextResponse.json({
      success: false,
      message: '伺服器內部錯誤'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const userData = await request.json();
    
    const { username, password, display_name, email, role } = userData;

    if (!username || !password || !display_name || !email) {
      return NextResponse.json({
        success: false,
        message: '請提供所有必要欄位：用戶名、密碼、顯示名稱、email'
      }, { status: 400 });
    }

    const result = await createUser({
      username,
      password,
      display_name,
      email,
      role
    });
    
    if (result.success) {
      return NextResponse.json({
        success: true,
        message: '用戶建立成功',
        data: result.data
      }, { status: 201 });
    } else {
      return NextResponse.json({
        success: false,
        message: result.error
      }, { status: 400 });
    }
  } catch (error) {
    console.error('建立用戶 API 路由錯誤：', error);
    return NextResponse.json({
      success: false,
      message: '伺服器內部錯誤'
    }, { status: 500 });
  }
}
