'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

const TOP_NAV = [
  { href: '/admin/signage', label: '總覽' },
  { href: '/admin/signage/regions', label: '區域管理' },
  { href: '/admin/signage/sites', label: '廠區管理' },
];

const SITE_TABS = [
  { seg: 'screens', label: '螢幕管理' },
  { seg: 'assets', label: '素材庫' },
  { seg: 'playlists', label: '播放列表' },
  { seg: 'schedules', label: '排程管理' },
];

export default function SignageNavbar() {
  const pathname = usePathname() || '';
  const router = useRouter();
  const [siteName, setSiteName] = useState<string>('');

  // 判斷是否在某個廠區內：/admin/signage/site/[id]/...
  const siteMatch = pathname.match(/^\/admin\/signage\/site\/(\d+)(?:\/([^/]+))?/);
  const siteId = siteMatch ? siteMatch[1] : null;
  const currentSeg = siteMatch ? siteMatch[2] : null;

  useEffect(() => {
    if (!siteId) { setSiteName(''); return; }
    let active = true;
    fetch(`/api/signage/sites`).then(r => r.json()).then(json => {
      if (!active || !json.success) return;
      const site = (json.data as Array<{ id: number; name: string }>).find(s => s.id === Number(siteId));
      setSiteName(site?.name ?? `廠區 #${siteId}`);
    }).catch(() => {});
    return () => { active = false; };
  }, [siteId]);

  const handleLogout = () => {
    if (typeof window !== 'undefined') localStorage.removeItem('userInfo');
    router.push('/admin');
  };

  return (
    <nav className="fixed top-0 z-50 w-full border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-3 min-w-0">
            <Link href="/admin/signage" className="flex flex-shrink-0 items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-600 shadow-sm">
                <span className="text-sm font-bold text-white">BTW</span>
              </span>
              <span className="hidden text-sm font-bold tracking-tight text-slate-800 sm:block">電子看版</span>
            </Link>
            {siteId && (
              <>
                <span className="hidden text-slate-300 sm:block" aria-hidden="true">/</span>
                <span className="truncate text-sm font-semibold text-cyan-700">{siteName || '載入中...'}</span>
              </>
            )}
          </div>

          {/* 桌面導航 */}
          <div className="hidden md:flex items-center gap-1">
            {siteId ? (
              <>
                {SITE_TABS.map(t => {
                  const active = currentSeg === t.seg;
                  return (
                    <Link
                      key={t.seg}
                      href={`/admin/signage/site/${siteId}/${t.seg}`}
                      className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                        active ? 'text-cyan-700 bg-cyan-50' : 'text-slate-600 hover:text-cyan-700 hover:bg-slate-50'
                      }`}
                    >
                      {t.label}
                    </Link>
                  );
                })}
                <Link href="/admin/signage" className="ml-2 border-l border-slate-200 py-2 pl-4 pr-3 text-sm text-slate-500 hover:text-slate-800">
                  返回總覽
                </Link>
              </>
            ) : (
              <>
                {TOP_NAV.map(item => {
                  const active = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                        active ? 'text-cyan-700 bg-cyan-50' : 'text-slate-600 hover:text-cyan-700 hover:bg-slate-50'
                      }`}
                    >
                      {item.label}
                    </Link>
                  );
                })}
              </>
            )}

            <details className="group relative ml-2">
              <summary className="flex cursor-pointer list-none items-center gap-2 rounded-lg border border-slate-200 bg-white py-1.5 pl-1.5 pr-2 text-sm text-slate-600 transition-colors hover:bg-slate-50 [&::-webkit-details-marker]:hidden">
                <span className="flex h-7 w-7 items-center justify-center rounded-md bg-slate-100 text-xs font-bold text-slate-600">管</span>
                <span className="hidden lg:inline">管理員</span>
                <svg aria-hidden="true" className="h-3.5 w-3.5 transition-transform group-open:rotate-180" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m6 9 6 6 6-6" />
                </svg>
              </summary>
              <div className="absolute right-0 mt-2 w-40 overflow-hidden rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
                <Link href="/admin" className="block px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-900">
                  回主後台
                </Link>
                <div className="my-1 border-t border-slate-100" />
                <button onClick={handleLogout} className="block w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50">
                  登出
                </button>
              </div>
            </details>
          </div>
        </div>

        {/* 行動版橫向捲動 */}
        <div className="-mx-4 overflow-x-auto px-4 pb-2 md:hidden">
          <div className="flex gap-1 whitespace-nowrap">
            {siteId ? (
              <>
                {SITE_TABS.map(t => {
                  const active = currentSeg === t.seg;
                  return (
                    <Link key={t.seg} href={`/admin/signage/site/${siteId}/${t.seg}`}
                      className={`rounded-lg px-3 py-1.5 text-sm ${active ? 'bg-cyan-50 text-cyan-700' : 'bg-slate-50 text-slate-600'}`}>
                      {t.label}
                    </Link>
                  );
                })}
                <Link href="/admin/signage" className="rounded-lg bg-slate-50 px-3 py-1.5 text-sm text-slate-500">返回總覽</Link>
              </>
            ) : (
              TOP_NAV.map(item => {
                const active = pathname === item.href;
                return (
                  <Link key={item.href} href={item.href}
                    className={`rounded-lg px-3 py-1.5 text-sm ${active ? 'bg-cyan-50 text-cyan-700' : 'bg-slate-50 text-slate-600'}`}>
                    {item.label}
                  </Link>
                );
              })
            )}
            <Link href="/admin" className="rounded-lg bg-slate-50 px-3 py-1.5 text-sm text-slate-500">主後台</Link>
            <button onClick={handleLogout} className="rounded-lg px-3 py-1.5 text-sm text-red-600 hover:bg-red-50">登出</button>
          </div>
        </div>
      </div>
    </nav>
  );
}
