import { NextResponse } from 'next/server';
import { createSignageTables } from '@/lib/signage/db';

/**
 * 初始化看版系統資料表
 * POST /api/signage/init
 */
export async function POST() {
  try {
    const result = await createSignageTables();

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: result.message,
      }, { status: 200 });
    } else {
      return NextResponse.json({
        success: false,
        message: '建立看版資料表失敗',
        error: result.error,
      }, { status: 500 });
    }
  } catch (error) {
    console.error('看版 init API 錯誤：', error);
    return NextResponse.json({
      success: false,
      message: '伺服器內部錯誤',
      error,
    }, { status: 500 });
  }
}
