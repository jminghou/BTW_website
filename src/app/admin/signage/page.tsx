'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Region {
  id: number;
  name: string;
}

interface Site {
  id: number;
  region_id: number;
  region_name: string | null;
  name: string;
  code: string;
  description: string | null;
}

export default function SignageOverviewPage() {
  const [regions, setRegions] = useState<Region[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(false);
  const [initStatus, setInitStatus] = useState('');
  const [isInit, setIsInit] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [r, s] = await Promise.all([
        fetch('/api/signage/regions').then(r => r.json()),
        fetch('/api/signage/sites').then(r => r.json()),
      ]);
      if (r.success) setRegions(r.data || []);
      if (s.success) setSites(s.data || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleInit = async () => {
    setIsInit(true);
    setInitStatus('');
    try {
      const res = await fetch('/api/signage/init', { method: 'POST' });
      const json = await res.json();
      setInitStatus(json.success ? '✅ 資料表已建立' : `❌ ${json.message}`);
      if (json.success) await load();
    } catch {
      setInitStatus('❌ 網路錯誤');
    }
    setIsInit(false);
  };

  // 依區域分組廠區
  const grouped = regions.map(r => ({
    region: r,
    sites: sites.filter(s => s.region_id === r.id),
  }));
  const orphanSites = sites.filter(s => !regions.some(r => r.id === s.region_id));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">電子看版 — 廠區總覽</h1>
          <p className="text-gray-500 mt-1">選擇一個廠區進入管理（螢幕 / 素材 / 播放清單 / 排程）</p>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/signage/regions" className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium">
            區域管理
          </Link>
          <Link href="/admin/signage/sites" className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium">
            廠區管理
          </Link>
        </div>
      </div>

      {loading ? (
        <p className="text-gray-400">載入中...</p>
      ) : sites.length === 0 ? (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-lg text-sm">
          尚無廠區。請先到「區域管理」建立區域，再到「廠區管理」建立廠區。
        </div>
      ) : (
        <div className="space-y-6">
          {grouped.map(({ region, sites: rSites }) => rSites.length > 0 && (
            <div key={region.id}>
              <h2 className="text-sm font-semibold text-gray-500 mb-2">{region.name}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {rSites.map(site => (
                  <Link
                    key={site.id}
                    href={`/admin/signage/site/${site.id}/playlists`}
                    className="bg-white border border-gray-200 rounded-lg p-5 hover:shadow-md hover:border-cyan-300 transition-all group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="min-w-0">
                        <div className="font-semibold text-gray-900 truncate">{site.name}</div>
                        <div className="text-xs text-gray-400 font-mono mt-0.5">{site.code}</div>
                      </div>
                      <span className="text-cyan-600 text-sm font-medium group-hover:translate-x-0.5 transition-transform">進入管理 →</span>
                    </div>
                    {site.description && <div className="text-sm text-gray-500 mt-2">{site.description}</div>}
                  </Link>
                ))}
              </div>
            </div>
          ))}

          {orphanSites.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-gray-500 mb-2">未分類</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {orphanSites.map(site => (
                  <Link key={site.id} href={`/admin/signage/site/${site.id}/playlists`}
                    className="bg-white border border-gray-200 rounded-lg p-5 hover:shadow-md hover:border-cyan-300 transition-all">
                    <div className="font-semibold text-gray-900">{site.name}</div>
                    <div className="text-xs text-gray-400 font-mono">{site.code}</div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">資料庫初始化</h2>
        <p className="text-sm text-gray-600 mb-4">
          第一次使用本系統時，按下「初始化資料表」建立 7 張看版相關資料表。已存在的資料表不會被覆蓋。
        </p>
        <button onClick={handleInit} disabled={isInit}
          className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium">
          {isInit ? '初始化中...' : '🛠️ 初始化資料表'}
        </button>
        {initStatus && <p className="mt-3 text-sm">{initStatus}</p>}
      </div>
    </div>
  );
}
