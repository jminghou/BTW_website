import { NextRequest, NextResponse } from 'next/server';
import { updateRegion, deleteRegion } from '@/lib/db';

/**
 * 區域資料個別項目 API 路由
 * PUT /api/regions/[id] - 更新指定的區域資料
 * DELETE /api/regions/[id] - 刪除指定的區域資料
 */

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const regionId = parseInt(params.id);
    
    if (isNaN(regionId)) {
      return NextResponse.json({
        success: false,
        message: '無效的區域ID'
      }, { status: 400 });
    }

    const body = await request.json();
    const { name, restaurants, orders, revenue, design_progress } = body;

    // 建立更新資料物件
    const updateData: any = {};
    
    if (name !== undefined) updateData.name = name;
    if (restaurants !== undefined) updateData.restaurants = parseInt(restaurants);
    if (orders !== undefined) updateData.orders = parseInt(orders);
    if (revenue !== undefined) updateData.revenue = revenue;
    if (design_progress !== undefined) updateData.design_progress = design_progress;

    // 數值驗證
    if (updateData.restaurants !== undefined && updateData.restaurants < 0) {
      return NextResponse.json({
        success: false,
        message: '據點數不能為負數'
      }, { status: 400 });
    }

    if (updateData.orders !== undefined && updateData.orders < 0) {
      return NextResponse.json({
        success: false,
        message: '訂單數不能為負數'
      }, { status: 400 });
    }

    const result = await updateRegion(regionId, updateData);

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: '區域資料更新成功！',
        data: result.data
      });
    } else {
      return NextResponse.json({
        success: false,
        message: result.error
      }, { status: result.error === '找不到指定的區域資料' ? 404 : 500 });
    }
  } catch (error) {
    console.error('更新區域資料失敗:', error);
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
    const regionId = parseInt(params.id);
    
    if (isNaN(regionId)) {
      return NextResponse.json({
        success: false,
        message: '無效的區域ID'
      }, { status: 400 });
    }

    const result = await deleteRegion(regionId);

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: '區域資料刪除成功！',
        data: result.data
      });
    } else {
      return NextResponse.json({
        success: false,
        message: result.error
      }, { status: result.error === '找不到指定的區域資料' ? 404 : 500 });
    }
  } catch (error) {
    console.error('刪除區域資料失敗:', error);
    return NextResponse.json({
      success: false,
      message: '伺服器內部錯誤',
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
