import { NextResponse } from 'next/server';
import { templates, DEFAULT_TEMPLATE } from '@/lib/signage/templates';

/**
 * 取得目前已註冊的看板版型清單（不含 convert 函式本身）
 * GET /api/signage/templates
 *
 * Response: {
 *   success: true,
 *   data: [{ key, displayName, customer, description }],
 *   default: '<key>'
 * }
 */
export async function GET() {
  try {
    const data = Object.values(templates).map(t => ({
      key: t.key,
      displayName: t.displayName,
      customer: t.customer,
      description: t.description ?? '',
    }));

    return NextResponse.json({
      success: true,
      data,
      default: DEFAULT_TEMPLATE,
    });
  } catch (error) {
    console.error('取得版型清單 API 錯誤：', error);
    return NextResponse.json({ success: false, message: '伺服器內部錯誤' }, { status: 500 });
  }
}
