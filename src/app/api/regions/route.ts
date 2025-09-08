import { NextRequest, NextResponse } from 'next/server';
import { getRegions, createRegion } from '@/lib/db';

/**
 * 區域資料 API 路由
 * GET /api/regions - 取得所有區域資料
 * POST /api/regions - 建立新的區域資料
 */

export async function GET() {
  try {
    const result = await getRegions();
    
    if (result.success && result.data) {
      return NextResponse.json({
        success: true,
        message: '區域資料讀取成功',
        data: result.data
      });
    } else {
      return NextResponse.json({
        success: false,
        message: '取得區域資料失敗',
        error: result.error
      }, { status: 500 });
    }
  } catch (error) {
    console.error('讀取區域資料失敗:', error);
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
    const { name, restaurants, orders, revenue, design_progress } = body;

    // 基本驗證
    if (!name || restaurants === undefined || orders === undefined || !revenue || !design_progress) {
      return NextResponse.json({
        success: false,
        message: '請填寫所有必填欄位'
      }, { status: 400 });
    }

    // 數值驗證
    if (restaurants < 0 || orders < 0) {
      return NextResponse.json({
        success: false,
        message: '據點數和訂單數不能為負數'
      }, { status: 400 });
    }

    const result = await createRegion({
      name,
      restaurants: parseInt(restaurants),
      orders: parseInt(orders),
      revenue,
      design_progress
    });

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: '區域資料建立成功！',
        data: result.data
      }, { status: 201 });
    } else {
      return NextResponse.json({
        success: false,
        message: '建立區域資料失敗',
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
