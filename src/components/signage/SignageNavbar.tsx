'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

const TOP_NAV = [
  { href: '/admin/signage', label: '總覽' },
  { href: '/admin/signage/regions', label: '區域' },
  { href: '/admin/signage/sites', label: '廠區' },
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
    <nav className="bg-white border-b border-gray-200 fixed w-full z-50 top-0 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-8 w-8 bg-gradient-to-r from-cyan-500 to-cyan-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold text-sm">BTW</span>
            </div>
            {siteId ? (
              <span className="text-base font-bold text-cyan-700 truncate">{siteName || '載入中...'}</span>
            ) : (
              <span className="text-sm font-medium text-gray-500 bg-gray-100 px-3 py-1 rounded-full">電子看版</span>
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
                        active ? 'text-cyan-600 bg-cyan-50' : 'text-gray-600 hover:text-cyan-600 hover:bg-gray-50'
                      }`}
                    >
                      {t.label}
                    </Link>
                  );
                })}
                <Link href="/admin/signage" className="ml-2 px-3 py-2 text-sm text-gray-500 hover:text-gray-700 border-l border-gray-200 pl-4">
                  ← 回廠區列表
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
                        active ? 'text-cyan-600 bg-cyan-50' : 'text-gray-600 hover:text-cyan-600 hover:bg-gray-50'
                      }`}
                    >
                      {item.label}
                    </Link>
                  );
                })}
                <Link href="/admin" className="ml-2 px-3 py-2 text-sm text-gray-500 hover:text-gray-700 border-l border-gray-200 pl-4">
                  ← 回主後台
                </Link>
              </>
            )}
            <button onClick={handleLogout} className="ml-2 bg-gray-600 hover:bg-gray-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors">
              登出
            </button>
          </div>
        </div>

        {/* 行動版橫向捲動 */}
        <div className="md:hidden -mx-4 px-4 pb-2 overflow-x-auto">
          <div className="flex gap-1 whitespace-nowrap">
            {siteId ? (
              <>
                {SITE_TABS.map(t => {
                  const active = currentSeg === t.seg;
                  return (
                    <Link key={t.seg} href={`/admin/signage/site/${siteId}/${t.seg}`}
                      className={`px-3 py-1.5 text-sm rounded-lg ${active ? 'text-cyan-600 bg-cyan-50' : 'text-gray-600 bg-gray-50'}`}>
                      {t.label}
                    </Link>
                  );
                })}
                <Link href="/admin/signage" className="px-3 py-1.5 text-sm rounded-lg text-gray-500 bg-gray-50">← 廠區列表</Link>
              </>
            ) : (
              TOP_NAV.map(item => {
                const active = pathname === item.href;
                return (
                  <Link key={item.href} href={item.href}
                    className={`px-3 py-1.5 text-sm rounded-lg ${active ? 'text-cyan-600 bg-cyan-50' : 'text-gray-600 bg-gray-50'}`}>
                    {item.label}
                  </Link>
                );
              })
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
