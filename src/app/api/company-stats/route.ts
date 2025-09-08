import { NextRequest, NextResponse } from 'next/server';
import { getCompanyStats, createCompanyStat } from '@/lib/db';

/**
 * 公司統計 API 路由
 * GET /api/company-stats - 取得所有公司統計
 * POST /api/company-stats - 建立新的公司統計
 */

export async function GET() {
  try {
    const result = await getCompanyStats();
    
    if (result.success && result.data) {
      return NextResponse.json({
        success: true,
        message: '公司統計資料讀取成功',
        data: result.data
      });
    } else {
      return NextResponse.json({
        success: false,
        message: '取得公司統計資料失敗',
        error: result.error
      }, { status: 500 });
    }
  } catch (error) {
    console.error('讀取公司統計資料失敗:', error);
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
    const { label, value, trend, color } = body;

    // 基本驗證
    if (!label || !value || !trend || !color) {
      return NextResponse.json({
        success: false,
        message: '請填寫所有必填欄位'
      }, { status: 400 });
    }

    const result = await createCompanyStat({
      label,
      value,
      trend,
      color
    });

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: '公司統計建立成功！',
        data: result.data
      }, { status: 201 });
    } else {
      return NextResponse.json({
        success: false,
        message: '建立公司統計失敗',
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
