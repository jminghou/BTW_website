import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * 舊版播放器每 15 秒用 ?t=時間戳 打排程，CDN 會把每一筆當成不同網址。
 * 轉到不帶 t 的同一網址，已開著、還沒更新程式的看板也能吃到 60 秒 CDN。
 * 只處理這條路徑，不碰官網與其他 API。
 */
export function middleware(request: NextRequest) {
  if (request.method !== 'GET' || !request.nextUrl.searchParams.has('t')) {
    return NextResponse.next();
  }

  const url = request.nextUrl.clone();
  url.searchParams.delete('t');
  const redirect = NextResponse.redirect(url, 307);
  redirect.headers.set('Cache-Control', 'no-store');
  redirect.headers.set('CDN-Cache-Control', 'no-store');
  redirect.headers.set('Vercel-CDN-Cache-Control', 'no-store');
  return redirect;
}

export const config = {
  matcher: '/api/signage/player/:path*',
};
