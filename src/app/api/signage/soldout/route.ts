import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { cachedSoldOutRead, revalidateSoldOut } from '@/lib/signage/cache';
import { getSoldOutDishes, mergeSoldOutDish, setSoldOutDishes } from '@/lib/signage/db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
/**
 * Next.js 的 maxDuration 是整支路由共用的。
 * GET 平常打到 Data Cache 就回，幾毫秒內結束。
 * POST／PUT 要等 Neon 冷啟動，5 秒會被掐掉，所以天花板放到 15 秒。
 */
export const maxDuration = 15;

const MAX_KEY_LEN = 200;
const MAX_ITEMS = 40;
const MAX_NAME_LEN = 120;

/** 瀏覽器與 CDN 都不快取。售完狀態一被舊回應蓋掉，現場點擊就會跳回去。 */
const NO_STORE = {
  'Cache-Control': 'no-store, max-age=0, must-revalidate',
  'CDN-Cache-Control': 'no-store',
  'Vercel-CDN-Cache-Control': 'no-store',
};

function normalizeKey(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  const key = raw.trim();
  if (!key || key.length > MAX_KEY_LEN) return null;
  return key;
}

function normalizeName(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  const name = raw.trim();
  if (!name || name.length > MAX_NAME_LEN) return null;
  return name;
}

function normalizeItems(raw: unknown): string[] | null {
  if (!Array.isArray(raw)) return null;
  if (raw.length > MAX_ITEMS) return null;
  const items: string[] = [];
  for (const n of raw) {
    const name = normalizeName(n);
    if (!name) return null;
    if (!items.includes(name)) items.push(name);
  }
  return items;
}

type SoldOutWrite =
  | { mode: 'item'; key: string; name: string; soldOut: boolean }
  | { mode: 'list'; key: string; items: string[] };

type ParseResult =
  | { ok: true; write: SoldOutWrite }
  | { ok: false; message: string };

/**
 * `{ key, name, soldOut }` 是單項明示寫入。
 * `{ key, items }` 是整份覆寫，留給既有呼叫端。兩者同時出現時以單項為準。
 */
function parseSoldOutWrite(body: unknown): ParseResult {
  if (!body || typeof body !== 'object') {
    return { ok: false, message: '缺少或無效的內容' };
  }
  const record = body as Record<string, unknown>;
  const key = normalizeKey(record.key);
  if (!key) return { ok: false, message: '缺少或無效的 key' };

  const hasSoldOut = Object.prototype.hasOwnProperty.call(record, 'soldOut');
  const hasName = Object.prototype.hasOwnProperty.call(record, 'name');
  const hasItems = Object.prototype.hasOwnProperty.call(record, 'items');

  if (hasSoldOut || (hasName && !hasItems)) {
    const name = normalizeName(record.name);
    if (!name) return { ok: false, message: '缺少或無效的 name' };
    if (typeof record.soldOut !== 'boolean') {
      return { ok: false, message: '缺少或無效的 soldOut' };
    }
    return { ok: true, write: { mode: 'item', key, name, soldOut: record.soldOut } };
  }

  const items = normalizeItems(record.items);
  if (!items) return { ok: false, message: '缺少或無效的 items' };
  return { ok: true, write: { mode: 'list', key, items } };
}

type SoldOutWriteResult =
  | { success: true; data: string[]; version: number }
  | { success: false; error: unknown };

async function applySoldOutWrite(write: SoldOutWrite): Promise<SoldOutWriteResult> {
  switch (write.mode) {
    case 'item':
      return mergeSoldOutDish(write.key, write.name, write.soldOut, MAX_ITEMS);
    case 'list':
      return setSoldOutDishes(write.key, write.items);
    default: {
      const unexpected: never = write;
      throw new Error(`未處理的售完寫入：${JSON.stringify(unexpected)}`);
    }
  }
}

function jsonError(message: string, status: number) {
  return NextResponse.json({ success: false, message }, { status, headers: NO_STORE });
}

/**
 * 菜單售完狀態（跨裝置同步）
 * GET 不快取。回應的 version 是資料庫 updated_at 的毫秒數，播放端用來丟掉過期輪詢。
 * POST／PUT：
 *   { key, name, soldOut } 單項合併
 *   { key, items }         整份覆寫
 * 兩者都回 { data, version }。data 仍是售完名稱陣列。
 */
export async function GET(req: NextRequest) {
  try {
    const key = normalizeKey(req.nextUrl.searchParams.get('key'));
    if (!key) return jsonError('缺少或無效的 key', 400);

    const snapshot = await cachedSoldOutRead(key, async () => {
      const read = await getSoldOutDishes(key);
      if (!read.success) throw new Error('讀取售完狀態失敗');
      return { data: read.data, version: read.version };
    });

    return NextResponse.json(
      { success: true, data: snapshot.data, version: snapshot.version },
      { headers: NO_STORE },
    );
  } catch (error) {
    console.error('售完狀態 GET 錯誤：', error);
    return jsonError('伺服器內部錯誤', 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    const parsed = parseSoldOutWrite(body);
    if (!parsed.ok) return jsonError(parsed.message, 400);

    const write = parsed.write;
    const result = await applySoldOutWrite(write);
    if (!result.success) return jsonError('儲存售完狀態失敗', 500);

    revalidateSoldOut(write.key);
    try {
      revalidatePath('/api/signage/soldout');
    } catch {
      // 路由失效失敗不影響已寫入的資料
    }

    if (write.mode === 'item' && write.soldOut && !result.data.includes(write.name)) {
      return jsonError('售完項目已達上限', 400);
    }

    return NextResponse.json(
      { success: true, data: result.data, version: result.version },
      { headers: NO_STORE },
    );
  } catch (error) {
    console.error('售完狀態 POST 錯誤：', error);
    return jsonError('伺服器內部錯誤', 500);
  }
}

export async function PUT(req: NextRequest) {
  return POST(req);
}
