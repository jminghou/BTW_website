import { NextRequest, NextResponse } from 'next/server';
import { testConnection } from '@/lib/db';

/**
 * 測試資料庫連接的 API 路由
 * GET /api/db/test
 */
export async function GET() {
  try {
    const result = await testConnection();
    
    if (result.success) {
      return NextResponse.json({
        success: true,
        message: '資料庫連接成功！',
        data: result.data
      }, { status: 200 });
    } else {
      return NextResponse.json({
        success: false,
        message: '資料庫連接失敗',
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