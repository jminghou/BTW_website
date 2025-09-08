import { NextRequest, NextResponse } from 'next/server';
import { updateCompanyStat, deleteCompanyStat } from '@/lib/db';

/**
 * 公司統計個別項目 API 路由
 * PUT /api/company-stats/[id] - 更新指定的公司統計
 * DELETE /api/company-stats/[id] - 刪除指定的公司統計
 */

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const statId = parseInt(params.id);
    
    if (isNaN(statId)) {
      return NextResponse.json({
        success: false,
        message: '無效的統計ID'
      }, { status: 400 });
    }

    const body = await request.json();
    const { label, value, trend, color } = body;

    // 建立更新資料物件
    const updateData: any = {};
    
    if (label !== undefined) updateData.label = label;
    if (value !== undefined) updateData.value = value;
    if (trend !== undefined) updateData.trend = trend;
    if (color !== undefined) updateData.color = color;

    const result = await updateCompanyStat(statId, updateData);

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: '公司統計更新成功！',
        data: result.data
      });
    } else {
      return NextResponse.json({
        success: false,
        message: result.error
      }, { status: result.error === '找不到指定的公司統計' ? 404 : 500 });
    }
  } catch (error) {
    console.error('更新公司統計失敗:', error);
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
    const statId = parseInt(params.id);
    
    if (isNaN(statId)) {
      return NextResponse.json({
        success: false,
        message: '無效的統計ID'
      }, { status: 400 });
    }

    const result = await deleteCompanyStat(statId);

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: '公司統計刪除成功！',
        data: result.data
      });
    } else {
      return NextResponse.json({
        success: false,
        message: result.error
      }, { status: result.error === '找不到指定的公司統計' ? 404 : 500 });
    }
  } catch (error) {
    console.error('刪除公司統計失敗:', error);
    return NextResponse.json({
      success: false,
      message: '伺服器內部錯誤',
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
