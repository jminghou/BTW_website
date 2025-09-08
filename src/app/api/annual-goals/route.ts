import { NextRequest, NextResponse } from 'next/server';
import { getAnnualGoals, createAnnualGoal } from '@/lib/db';

/**
 * 年度目標 API 路由
 * GET /api/annual-goals - 取得所有年度目標
 * POST /api/annual-goals - 建立新的年度目標
 */

export async function GET() {
  try {
    const result = await getAnnualGoals();
    
    if (result.success && result.data) {
      return NextResponse.json({
        success: true,
        message: '年度目標資料讀取成功',
        data: result.data
      });
    } else {
      return NextResponse.json({
        success: false,
        message: '取得年度目標資料失敗',
        error: result.error
      }, { status: 500 });
    }
  } catch (error) {
    console.error('讀取年度目標資料失敗:', error);
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
    const { label, current_value, target_value, color } = body;

    // 基本驗證
    if (!label || current_value === undefined || target_value === undefined || !color) {
      return NextResponse.json({
        success: false,
        message: '請填寫所有必填欄位'
      }, { status: 400 });
    }

    // 數值驗證
    if (current_value < 0 || target_value <= 0) {
      return NextResponse.json({
        success: false,
        message: '目標值必須大於0，當前值不能為負數'
      }, { status: 400 });
    }

    const result = await createAnnualGoal({
      label,
      current_value: parseInt(current_value),
      target_value: parseInt(target_value),
      color
    });

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: '年度目標建立成功！',
        data: result.data
      }, { status: 201 });
    } else {
      return NextResponse.json({
        success: false,
        message: '建立年度目標失敗',
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
