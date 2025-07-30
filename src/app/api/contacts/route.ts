import { NextRequest, NextResponse } from 'next/server';
import { saveContact, getContacts, deleteContact } from '../../../lib/db';

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
    console.error('API 錯誤：', error);
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
        message: '聯絡表單資料讀取成功',
        data: result.data
      });
    } else {
      return NextResponse.json({
        success: false,
        message: '取得聯絡表單資料失敗',
        error: result.error
      }, { status: 500 });
    }
  } catch (error) {
    console.error('讀取聯絡表單資料失敗:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : String(error) 
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: '缺少必要的 ID 參數' },
        { status: 400 }
      );
    }

    const result = await deleteContact(parseInt(id));
    
    if (result.success) {
      return NextResponse.json({
        success: true,
        message: `成功刪除聯絡表單資料 (ID: ${id})`,
        deletedId: parseInt(id)
      });
    } else {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: typeof result.error === 'string' && result.error.includes('找不到') ? 404 : 500 }
      );
    }
  } catch (error) {
    console.error('刪除聯絡表單資料失敗:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : String(error) 
      },
      { status: 500 }
    );
  }
} 