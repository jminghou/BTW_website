import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { cachedSoldOutRead, revalidateSoldOut } from '@/lib/signage/cache';
import { getSoldOutDishes, setSoldOutDishes } from '@/lib/signage/db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const MAX_KEY_LEN = 200;
const MAX_ITEMS = 40;
const MAX_NAME_LEN = 120;

/** 瀏覽器／CDN 不快取；伺服器端 Data Cache 另走 cachedSoldOutRead。 */
const NO_STORE = {
  'Cache-Control': 'no-store, max-age=0, must-revalidate',
};

function normalizeKey(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  const key = raw.trim();
  if (!key || key.length > MAX_KEY_LEN) return null;
  return key;
}

function normalizeItems(raw: unknown): string[] | null {
  if (!Array.isArray(raw)) return null;
  if (raw.length > MAX_ITEMS) return null;
  const items: string[] = [];
  for (const n of raw) {
    if (typeof n !== 'string') return null;
    const name = n.trim();
    if (!name || name.length > MAX_NAME_LEN) return null;
    if (!items.includes(name)) items.push(name);
  }
  return items;
}

/**
 * 菜單售完狀態（跨裝置同步）
 * 平常 GET 命中 Data Cache，不打 DB；POST／PUT 寫入後才失效快取。
 * GET  /api/signage/soldout?key=asset:123
 * POST /api/signage/soldout  body: { key, items: string[] }
 */
export async function GET(req: NextRequest) {
  try {
    const key = normalizeKey(req.nextUrl.searchParams.get('key'));
    if (!key) {
      return NextResponse.json({ success: false, message: '缺少或無效的 key' }, { status: 400, headers: NO_STORE });
    }

    const data = await cachedSoldOutRead(key, async () => {
      const read = await getSoldOutDishes(key);
      if (!read.success) throw new Error('讀取售完狀態失敗');
      return read.data;
    });

    return NextResponse.json({ success: true, data }, { headers: NO_STORE });
  } catch (error) {
    console.error('售完狀態 GET 錯誤：', error);
    return NextResponse.json({ success: false, message: '伺服器內部錯誤' }, { status: 500, headers: NO_STORE });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const key = normalizeKey(body?.key);
    const items = normalizeItems(body?.items);
    if (!key) {
      return NextResponse.json({ success: false, message: '缺少或無效的 key' }, { status: 400, headers: NO_STORE });
    }
    if (!items) {
      return NextResponse.json({ success: false, message: '缺少或無效的 items' }, { status: 400, headers: NO_STORE });
    }

    const result = await setSoldOutDishes(key, items);
    if (!result.success) {
      return NextResponse.json({ success: false, message: '儲存售完狀態失敗' }, { status: 500, headers: NO_STORE });
    }

    revalidateSoldOut(key);
    try {
      revalidatePath('/api/signage/soldout');
    } catch {
      // 路由失效失敗不影響已寫入的資料
    }
    return NextResponse.json({ success: true, data: items }, { headers: NO_STORE });
  } catch (error) {
    console.error('售完狀態 POST 錯誤：', error);
    return NextResponse.json({ success: false, message: '伺服器內部錯誤' }, { status: 500, headers: NO_STORE });
  }
}

export async function PUT(req: NextRequest) {
  return POST(req);
}
