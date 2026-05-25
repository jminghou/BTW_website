'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Counts {
  regions: number;
  sites: number;
  screens: number;
  assets: number;
  playlists: number;
  schedules: number;
}

export default function SignageOverviewPage() {
  const [counts, setCounts] = useState<Counts | null>(null);
  const [initStatus, setInitStatus] = useState<string>('');
  const [isInit, setIsInit] = useState(false);

  const loadCounts = async () => {
    try {
      const [r, s, sc, a, p, sch] = await Promise.all([
        fetch('/api/signage/regions').then(r => r.json()),
        fetch('/api/signage/sites').then(r => r.json()),
        fetch('/api/signage/screens').then(r => r.json()),
        fetch('/api/signage/assets').then(r => r.json()),
        fetch('/api/signage/playlists').then(r => r.json()),
        fetch('/api/signage/schedules').then(r => r.json()),
      ]);
      setCounts({
        regions: r.data?.length ?? 0,
        sites: s.data?.length ?? 0,
        screens: sc.data?.length ?? 0,
        assets: a.data?.length ?? 0,
        playlists: p.data?.length ?? 0,
        schedules: sch.data?.length ?? 0,
      });
    } catch {
      setCounts(null);
    }
  };

  useEffect(() => { loadCounts(); }, []);

  const handleInit = async () => {
    setIsInit(true);
    setInitStatus('');
    try {
      const res = await fetch('/api/signage/init', { method: 'POST' });
      const json = await res.json();
      setInitStatus(json.success ? '✅ 資料表已建立' : `❌ ${json.message}`);
      if (json.success) await loadCounts();
    } catch {
      setInitStatus('❌ 網路錯誤');
    }
    setIsInit(false);
  };

  const stats = [
    { label: '區域', href: '/admin/signage/regions', value: counts?.regions ?? '—' },
    { label: '廠區', href: '/admin/signage/sites', value: counts?.sites ?? '—' },
    { label: '螢幕', href: '/admin/signage/screens', value: counts?.screens ?? '—' },
    { label: '素材', href: '/admin/signage/assets', value: counts?.assets ?? '—' },
    { label: '播放清單', href: '/admin/signage/playlists', value: counts?.playlists ?? '—' },
    { label: '排程', href: '/admin/signage/schedules', value: counts?.schedules ?? '—' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">電子看版總覽</h1>
        <p className="text-gray-500 mt-1">管理區域、廠區、螢幕、素材、播放清單與排程</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {stats.map(s => (
          <Link
            key={s.label}
            href={s.href}
            className="bg-white border border-gray-200 rounded-lg p-5 hover:shadow-md transition-shadow"
          >
            <div className="text-sm text-gray-500">{s.label}</div>
            <div className="text-2xl font-bold text-cyan-600 mt-2">{s.value}</div>
          </Link>
        ))}
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">資料庫初始化</h2>
        <p className="text-sm text-gray-600 mb-4">
          第一次使用本系統時，請按下「初始化資料表」建立 7 張看版相關資料表（regions、sites、screens、assets、playlists、playlist_items、schedules）。已存在的資料表不會被覆蓋。
        </p>
        <button
          onClick={handleInit}
          disabled={isInit}
          className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium"
        >
          {isInit ? '初始化中...' : '🛠️ 初始化資料表'}
        </button>
        {initStatus && <p className="mt-3 text-sm">{initStatus}</p>}
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-blue-900 mb-2">📋 操作流程</h2>
        <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
          <li>建立 <Link className="underline" href="/admin/signage/regions">區域</Link>（例：北部、中部）</li>
          <li>在區域下建立 <Link className="underline" href="/admin/signage/sites">廠區</Link>（需指定英數代號用於分類素材）</li>
          <li>為廠區註冊 <Link className="underline" href="/admin/signage/screens">螢幕</Link>（系統自動產生唯一 key）</li>
          <li>上傳 .html <Link className="underline" href="/admin/signage/assets">素材</Link>（支援批次上傳）</li>
          <li>建立 <Link className="underline" href="/admin/signage/playlists">播放清單</Link>（將素材依序加入並設定時長）</li>
          <li>設定 <Link className="underline" href="/admin/signage/schedules">排程</Link>（指定螢幕、播放清單、時段、星期）</li>
          <li>在螢幕設備上開啟 <code className="bg-blue-100 px-1 rounded">/signage/player/[螢幕 key]</code> 並全螢幕播放</li>
        </ol>
      </div>
    </div>
  );
}
