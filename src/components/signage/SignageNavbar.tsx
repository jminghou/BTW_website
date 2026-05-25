'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

const NAV_ITEMS = [
  { href: '/admin/signage', label: '總覽' },
  { href: '/admin/signage/regions', label: '區域' },
  { href: '/admin/signage/sites', label: '廠區' },
  { href: '/admin/signage/screens', label: '螢幕' },
  { href: '/admin/signage/assets', label: '素材' },
  { href: '/admin/signage/playlists', label: '播放清單' },
  { href: '/admin/signage/schedules', label: '排程' },
];

export default function SignageNavbar() {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('userInfo');
    }
    router.push('/admin');
  };

  return (
    <nav className="bg-white border-b border-gray-200 fixed w-full z-50 top-0 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 bg-gradient-to-r from-cyan-500 to-cyan-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">BTW</span>
            </div>
            <span className="text-sm font-medium text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
              電子看版
            </span>
          </div>

          <div className="hidden md:flex items-center gap-1">
            {NAV_ITEMS.map(item => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                    active
                      ? 'text-cyan-600 bg-cyan-50'
                      : 'text-gray-600 hover:text-cyan-600 hover:bg-gray-50'
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
            <Link
              href="/admin"
              className="ml-2 px-3 py-2 text-sm text-gray-500 hover:text-gray-700 border-l border-gray-200 pl-4"
            >
              ← 回主後台
            </Link>
            <button
              onClick={handleLogout}
              className="ml-2 bg-gray-600 hover:bg-gray-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              登出
            </button>
          </div>
        </div>

        {/* 行動版橫向捲動 */}
        <div className="md:hidden -mx-4 px-4 pb-2 overflow-x-auto">
          <div className="flex gap-1 whitespace-nowrap">
            {NAV_ITEMS.map(item => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-3 py-1.5 text-sm rounded-lg ${
                    active ? 'text-cyan-600 bg-cyan-50' : 'text-gray-600 bg-gray-50'
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
}
