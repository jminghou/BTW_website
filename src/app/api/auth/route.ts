import { NextRequest, NextResponse } from 'next/server';
import { authenticateUser } from '@/lib/db';

/**
 * 用戶身份驗證 API 路由
 * POST /api/auth
 */
export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json({
        success: false,
        message: '請提供帳號和密碼'
      }, { status: 400 });
    }

    const result = await authenticateUser(username, password);
    
    if (result.success) {
      return NextResponse.json({
        success: true,
        message: '登入成功',
        data: result.data
      }, { status: 200 });
    } else {
      return NextResponse.json({
        success: false,
        message: result.error
      }, { status: 401 });
    }
  } catch (error) {
    console.error('驗證 API 路由錯誤：', error);
    return NextResponse.json({
      success: false,
      message: '伺服器內部錯誤'
    }, { status: 500 });
  }
}
