import { NextRequest, NextResponse } from 'next/server';
import { getPartners, createPartner } from '@/lib/db';

/**
 * 企業客戶 API 路由
 * GET /api/partners - 取得所有企業客戶
 * POST /api/partners - 建立新的企業客戶
 */

export async function GET() {
  try {
    const result = await getPartners();
    
    if (result.success && result.data) {
      return NextResponse.json({
        success: true,
        message: '企業客戶資料讀取成功',
        data: result.data
      });
    } else {
      return NextResponse.json({
        success: false,
        message: '取得企業客戶資料失敗',
        error: result.error
      }, { status: 500 });
    }
  } catch (error) {
    console.error('讀取企業客戶資料失敗:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : String(error) 
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, category, status, monthly_orders } = body;

    // 基本驗證
    if (!name || !category || !status || monthly_orders === undefined) {
      return NextResponse.json({
        success: false,
        message: '請填寫所有必填欄位'
      }, { status: 400 });
    }

    // 數值驗證
    if (monthly_orders < 0) {
      return NextResponse.json({
        success: false,
        message: '月訂單量不能為負數'
      }, { status: 400 });
    }

    const result = await createPartner({
      name,
      category,
      status,
      monthly_orders: parseInt(monthly_orders)
    });

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: '企業客戶建立成功！',
        data: result.data
      }, { status: 201 });
    } else {
      return NextResponse.json({
        success: false,
        message: '建立企業客戶失敗',
        error: result.error
      }, { status: 500 });
    }
  } catch (error) {
    console.error('API 錯誤：', error);
    return NextResponse.json({
      success: false,
      message: '伺服器內部錯誤',
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
