import { NextRequest, NextResponse } from 'next/server';
import { createTables } from '@/lib/db';

/**
 * 初始化資料庫表格的 API 路由
 * POST /api/db/init
 */
export async function POST() {
  try {
    const result = await createTables();
    
    if (result.success) {
      return NextResponse.json({
        success: true,
        message: result.message
      }, { status: 200 });
    } else {
      return NextResponse.json({
        success: false,
        message: '建立資料表失敗',
        error: result.error
      }, { status: 500 });
    }
  } catch (error) {
    console.error('API 路由錯誤：', error);
    return NextResponse.json({
      success: false,
      message: '伺服器內部錯誤',
      error: error
    }, { status: 500 });
  }
} 