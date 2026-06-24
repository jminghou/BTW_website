import { NextRequest, NextResponse } from 'next/server';
import { testConnection } from '@/lib/db';

// 一律即時執行，不要被快取或靜態化（避免拿到舊結果）
export const dynamic = 'force-dynamic';

/**
 * 把錯誤物件攤平成可序列化的 JSON。
 * NeonDbError 的 message / code 是非列舉屬性，直接 JSON.stringify 會被吃掉，
 * 只剩 {"name":"NeonDbError"}，導致看不到真正原因。這裡手動取出關鍵欄位。
 */
function serializeError(error: unknown) {
  if (error && typeof error === 'object') {
    const e = error as Record<string, unknown>;
    return {
      name: e.name,
      message: e.message,        // 真正的錯誤訊息
      code: e.code,              // Postgres SQLSTATE（28P01=密碼錯, 53300=連線數爆, 3D000=DB不存在...）
      severity: e.severity,
      detail: e.detail,
      routine: e.routine,
      cause: e.cause ? String(e.cause) : undefined,
    };
  }
  return { message: String(error) };
}

/**
 * 顯示目前實際讀到的連線目標（密碼遮蔽），用來確認 Vercel 是否吃到正確的值。
 */
function describeDatabaseUrl() {
  const raw = process.env.DATABASE_URL;
  if (!raw) return { present: false, note: 'DATABASE_URL 不存在（這個環境根本沒讀到值）' };
  try {
    const u = new URL(raw);
    return {
      present: true,
      host: u.hostname,
      database: u.pathname.replace(/^\//, ''),
      user: u.username,
      isPooler: u.hostname.includes('-pooler'),
      // 偵測常見的複製貼上錯誤
      hasWhitespace: /\s/.test(raw),
      wrappedInQuotes: /^["'].*["']$/.test(raw),
      length: raw.length,
    };
  } catch {
    return { present: true, parseError: true, note: '值存在但格式不正確（可能被截斷或夾雜雜訊）' };
  }
}

/**
 * 測試資料庫連接的 API 路由
 * GET /api/db/test
 */
export async function GET() {
  const target = describeDatabaseUrl();
  try {
    const result = await testConnection();

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: '資料庫連接成功！',
        target,
        data: result.data
      }, { status: 200 });
    } else {
      return NextResponse.json({
        success: false,
        message: '資料庫連接失敗',
        target,
        error: serializeError(result.error)
      }, { status: 500 });
    }
  } catch (error) {
    console.error('API 路由錯誤：', error);
    return NextResponse.json({
      success: false,
      message: '伺服器內部錯誤',
      target,
      error: serializeError(error)
    }, { status: 500 });
  }
} 