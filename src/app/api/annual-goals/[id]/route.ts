import { NextRequest, NextResponse } from 'next/server';
import { updateAnnualGoal, deleteAnnualGoal } from '@/lib/db';

/**
 * 年度目標個別項目 API 路由
 * PUT /api/annual-goals/[id] - 更新指定的年度目標
 * DELETE /api/annual-goals/[id] - 刪除指定的年度目標
 */

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const goalId = parseInt(params.id);
    
    if (isNaN(goalId)) {
      return NextResponse.json({
        success: false,
        message: '無效的目標ID'
      }, { status: 400 });
    }

    const body = await request.json();
    const { label, current_value, target_value, color } = body;

    // 建立更新資料物件
    const updateData: any = {};
    
    if (label !== undefined) updateData.label = label;
    if (current_value !== undefined) updateData.current_value = parseInt(current_value);
    if (target_value !== undefined) updateData.target_value = parseInt(target_value);
    if (color !== undefined) updateData.color = color;

    // 數值驗證
    if (updateData.current_value !== undefined && updateData.current_value < 0) {
      return NextResponse.json({
        success: false,
        message: '當前值不能為負數'
      }, { status: 400 });
    }

    if (updateData.target_value !== undefined && updateData.target_value <= 0) {
      return NextResponse.json({
        success: false,
        message: '目標值必須大於0'
      }, { status: 400 });
    }

    const result = await updateAnnualGoal(goalId, updateData);

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: '年度目標更新成功！',
        data: result.data
      });
    } else {
      return NextResponse.json({
        success: false,
        message: result.error
      }, { status: result.error === '找不到指定的年度目標' ? 404 : 500 });
    }
  } catch (error) {
    console.error('更新年度目標失敗:', error);
    return NextResponse.json({
      success: false,
      message: '伺服器內部錯誤',
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const goalId = parseInt(params.id);
    
    if (isNaN(goalId)) {
      return NextResponse.json({
        success: false,
        message: '無效的目標ID'
      }, { status: 400 });
    }

    const result = await deleteAnnualGoal(goalId);

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: '年度目標刪除成功！',
        data: result.data
      });
    } else {
      return NextResponse.json({
        success: false,
        message: result.error
      }, { status: result.error === '找不到指定的年度目標' ? 404 : 500 });
    }
  } catch (error) {
    console.error('刪除年度目標失敗:', error);
    return NextResponse.json({
      success: false,
      message: '伺服器內部錯誤',
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
