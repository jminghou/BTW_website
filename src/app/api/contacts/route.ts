import { NextRequest, NextResponse } from 'next/server';
import { saveContact, getContacts } from '@/lib/db';

/**
 * 聯絡表單 API 路由
 * POST /api/contacts - 儲存聯絡表單資料
 * GET /api/contacts - 取得所有聯絡表單資料
 */

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { identity, user_name, title, user_email, phone, message } = body;

    // 基本驗證
    if (!identity || !user_name || !title || !user_email || !message) {
      return NextResponse.json({
        success: false,
        message: '請填寫所有必填欄位'
      }, { status: 400 });
    }

    const result = await saveContact({
      identity,
      user_name,
      title,
      user_email,
      phone,
      message
    });

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: '聯絡表單提交成功！',
        data: result.data
      }, { status: 201 });
    } else {
      return NextResponse.json({
        success: false,
        message: '儲存聯絡表單資料失敗',
        error: result.error
      }, { status: 500 });
    }
  } catch (error) {
    console.error('API 路由錯誤：', error);
    return NextResponse.json({
      success: false,
      message: '伺服器內部錯誤',
      error: error
    }, { status: 500 });
  }
}

export async function GET() {
  try {
    const result = await getContacts();
    
    if (result.success && result.data) {
      return NextResponse.json({
        success: true,
        data: result.data,
        count: result.data.length
      }, { status: 200 });
    } else {
      return NextResponse.json({
        success: false,
        message: '取得聯絡表單資料失敗',
        error: result.error
      }, { status: 500 });
    }
  } catch (error) {
    console.error('API 路由錯誤：', error);
    return NextResponse.json({
      success: false,
      message: '伺服器內部錯誤',
      error: error
    }, { status: 500 });
  }
} 