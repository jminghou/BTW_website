import { NextRequest, NextResponse } from 'next/server';
import { updatePartner, deletePartner } from '@/lib/db';

/**
 * 企業客戶個別項目 API 路由
 * PUT /api/partners/[id] - 更新指定的企業客戶
 * DELETE /api/partners/[id] - 刪除指定的企業客戶
 */

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const partnerId = parseInt(params.id);
    
    if (isNaN(partnerId)) {
      return NextResponse.json({
        success: false,
        message: '無效的客戶ID'
      }, { status: 400 });
    }

    const body = await request.json();
    const { name, category, status, monthly_orders } = body;

    // 建立更新資料物件
    const updateData: any = {};
    
    if (name !== undefined) updateData.name = name;
    if (category !== undefined) updateData.category = category;
    if (status !== undefined) updateData.status = status;
    if (monthly_orders !== undefined) updateData.monthly_orders = parseInt(monthly_orders);

    // 數值驗證
    if (updateData.monthly_orders !== undefined && updateData.monthly_orders < 0) {
      return NextResponse.json({
        success: false,
        message: '月訂單量不能為負數'
      }, { status: 400 });
    }

    const result = await updatePartner(partnerId, updateData);

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: '企業客戶更新成功！',
        data: result.data
      });
    } else {
      return NextResponse.json({
        success: false,
        message: result.error
      }, { status: result.error === '找不到指定的企業客戶' ? 404 : 500 });
    }
  } catch (error) {
    console.error('更新企業客戶失敗:', error);
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
    const partnerId = parseInt(params.id);
    
    if (isNaN(partnerId)) {
      return NextResponse.json({
        success: false,
        message: '無效的客戶ID'
      }, { status: 400 });
    }

    const result = await deletePartner(partnerId);

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: '企業客戶刪除成功！',
        data: result.data
      });
    } else {
      return NextResponse.json({
        success: false,
        message: result.error
      }, { status: result.error === '找不到指定的企業客戶' ? 404 : 500 });
    }
  } catch (error) {
    console.error('刪除企業客戶失敗:', error);
    return NextResponse.json({
      success: false,
      message: '伺服器內部錯誤',
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
