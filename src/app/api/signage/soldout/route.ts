import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { cachedSoldOutRead, revalidateSoldOut } from '@/lib/signage/cache';
import { getSoldOutDishes, setSoldOutDishes } from '@/lib/signage/db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
/** 命中 Data Cache 時約十幾毫秒。避免連線卡住時長時間計費。 */
export const maxDuration = 5;

const MAX_KEY_LEN = 200;
const MAX_ITEMS = 40;
const MAX_NAME_LEN = 120;

/** 瀏覽器不快取。錯誤回應另外標 no-store，避免 CDN 記住失敗。 */
const NO_STORE = {
  'Cache-Control': 'no-store, max-age=0, must-revalidate',
  'CDN-Cache-Control': 'no-store',
  'Vercel-CDN-Cache-Control': 'no-store',
};

/**
 * 同一個 ?key= 在 30 秒內由 CDN 回覆，不啟動函式。
 * 不設 stale-while-revalidate，跨裝置售完延遲上限就是這 30 秒。
 * 本機雙擊仍立刻改畫面；這只影響其他裝置同步。
 */
const CDN_30 = {
  'Cache-Control': 'public, max-age=0, must-revalidate',
  'CDN-Cache-Control': 'public, s-maxage=30',
  'Vercel-CDN-Cache-Control': 'public, s-maxage=30',
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
 * 平常 GET 由 CDN 快取 30 秒，過期後才進函式；函式內再命中 Data Cache，不打 DB。
 * POST／PUT 寫入後失效 Data Cache。CDN 最慢 30 秒內仍可能回舊的 GET。
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

    return NextResponse.json({ success: true, data }, { headers: CDN_30 });
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
