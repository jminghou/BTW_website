'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';

interface Region {
  id: number;
  name: string;
  description: string | null;
}

interface Site {
  id: number;
  region_id: number;
  region_name: string | null;
  name: string;
  code: string;
  description: string | null;
}

type Density = 'compact' | 'comfortable';
type SortOption = 'name' | 'code';

const REGION_LABELS: Record<string, string> = {
  HS: '新竹地區',
  TP: '台北地區',
};

function getRegionLabel(region: Region) {
  return REGION_LABELS[region.name.toUpperCase()] ?? region.name;
}

function SearchIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m21 21-4.35-4.35m2.1-5.4a7.5 7.5 0 1 1-15 0 7.5 7.5 0 0 1 15 0Z" />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m9 18 6-6-6-6" />
    </svg>
  );
}

function RowsIcon({ comfortable = false }: { comfortable?: boolean }) {
  return (
    <svg aria-hidden="true" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
      {comfortable ? (
        <>
          <rect x="4" y="4" width="16" height="6" rx="1.5" strokeWidth={2} />
          <rect x="4" y="14" width="16" height="6" rx="1.5" strokeWidth={2} />
        </>
      ) : (
        <>
          <path strokeLinecap="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </>
      )}
    </svg>
  );
}

export default function SignageOverviewPage() {
  const [regions, setRegions] = useState<Region[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [regionFilter, setRegionFilter] = useState('all');
  const [sortBy, setSortBy] = useState<SortOption>('name');
  const [density, setDensity] = useState<Density>('compact');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const [r, s] = await Promise.all([
        fetch('/api/signage/regions').then(r => r.json()),
        fetch('/api/signage/sites').then(r => r.json()),
      ]);
      if (r.success) setRegions(r.data || []);
      if (s.success) setSites(s.data || []);
      if (!r.success || !s.success) setError('部分資料載入失敗，請稍後再試。');
    } catch {
      setError('無法載入廠區資料，請檢查網路連線。');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filteredSites = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase('zh-TW');

    return sites
      .filter(site => regionFilter === 'all' || site.region_id === Number(regionFilter))
      .filter(site => {
        if (!normalizedQuery) return true;
        return [site.name, site.code, site.description, site.region_name]
          .filter(Boolean)
          .some(value => String(value).toLocaleLowerCase('zh-TW').includes(normalizedQuery));
      })
      .sort((a, b) => a[sortBy].localeCompare(b[sortBy], 'zh-TW', { numeric: true }));
  }, [query, regionFilter, sites, sortBy]);

  const grouped = useMemo(() => regions
    .map(region => ({
      region,
      sites: filteredSites.filter(site => site.region_id === region.id),
    }))
    .filter(group => group.sites.length > 0), [filteredSites, regions]);

  const orphanSites = useMemo(
    () => filteredSites.filter(site => !regions.some(region => region.id === site.region_id)),
    [filteredSites, regions],
  );

  const rowPadding = density === 'compact' ? 'py-2.5' : 'py-4';

  const renderSiteRow = (site: Site) => (
    <Link
      key={site.id}
      href={`/admin/signage/site/${site.id}/playlists`}
      className={`group grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-t border-slate-100 px-4 ${rowPadding} transition-colors first:border-t-0 hover:bg-cyan-50/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-cyan-500 sm:grid-cols-12 sm:px-5`}
    >
      <div className="min-w-0 sm:col-span-5">
        <div className="truncate text-sm font-semibold text-slate-800 group-hover:text-cyan-700">
          {site.name}
        </div>
        <div className="mt-0.5 truncate font-mono text-[11px] text-slate-400 sm:hidden">
          {site.code}
        </div>
      </div>

      <div className="hidden min-w-0 sm:col-span-3 sm:block">
        {site.description ? (
          <span className="inline-flex max-w-full truncate rounded-md bg-slate-100 px-2 py-1 text-xs text-slate-600">
            {site.description}
          </span>
        ) : (
          <span className="text-xs text-slate-300">未設定</span>
        )}
      </div>

      <div className="hidden min-w-0 truncate font-mono text-xs text-slate-400 sm:col-span-3 sm:block">
        {site.code}
      </div>

      <span className="flex items-center justify-end text-slate-300 transition-all group-hover:translate-x-0.5 group-hover:text-cyan-600 sm:col-span-1">
        <span className="sr-only">進入 {site.name} 管理</span>
        <ArrowIcon />
      </span>
    </Link>
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-1 flex items-center gap-1.5 text-xs font-medium text-slate-400">
            <span>電子看版</span>
            <span aria-hidden="true">/</span>
            <span className="text-slate-600">廠區總覽</span>
          </div>
          <div className="flex items-baseline gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">廠區總覽</h1>
            {!loading && <span className="text-sm text-slate-400">{sites.length} 個廠區</span>}
          </div>
        </div>
        <Link href="/admin/signage/sites?new=1" className="inline-flex items-center justify-center rounded-lg bg-cyan-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-cyan-700">
          ＋ 新增廠區
        </Link>
      </div>

      <div className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-white p-3 shadow-sm sm:flex-row sm:items-center">
        <label className="relative min-w-0 flex-1">
          <span className="sr-only">搜尋廠區</span>
          <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-400">
            <SearchIcon />
          </span>
          <input
            type="search"
            value={query}
            onChange={event => setQuery(event.target.value)}
            placeholder="搜尋廠區名稱、代號或用途"
            className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm text-slate-800 outline-none transition focus:border-cyan-400 focus:bg-white focus:ring-2 focus:ring-cyan-100"
          />
        </label>

        <select
          aria-label="篩選區域"
          value={regionFilter}
          onChange={event => setRegionFilter(event.target.value)}
          className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-600 outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100"
        >
          <option value="all">所有區域</option>
          {regions.map(region => (
            <option key={region.id} value={region.id}>{getRegionLabel(region)}</option>
          ))}
        </select>

        <select
          aria-label="排序廠區"
          value={sortBy}
          onChange={event => setSortBy(event.target.value as SortOption)}
          className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-600 outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100"
        >
          <option value="name">依名稱排序</option>
          <option value="code">依代號排序</option>
        </select>

        <div className="flex h-10 items-center rounded-lg border border-slate-200 bg-slate-50 p-1" aria-label="顯示密度">
          <button
            type="button"
            onClick={() => setDensity('compact')}
            aria-label="緊湊顯示"
            aria-pressed={density === 'compact'}
            title="緊湊顯示"
            className={`flex h-8 w-8 items-center justify-center rounded-md transition-colors ${density === 'compact' ? 'bg-white text-cyan-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
          >
            <RowsIcon />
          </button>
          <button
            type="button"
            onClick={() => setDensity('comfortable')}
            aria-label="舒適顯示"
            aria-pressed={density === 'comfortable'}
            title="舒適顯示"
            className={`flex h-8 w-8 items-center justify-center rounded-md transition-colors ${density === 'comfortable' ? 'bg-white text-cyan-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
          >
            <RowsIcon comfortable />
          </button>
        </div>
      </div>

      {error && (
        <div role="alert" className="flex items-center justify-between rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <span>{error}</span>
          <button type="button" onClick={load} className="font-semibold hover:underline">重新載入</button>
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {[1, 2].map(group => (
            <div key={group} className="overflow-hidden rounded-xl border border-slate-200 bg-white">
              <div className="h-14 animate-pulse bg-slate-100" />
              <div className="h-12 animate-pulse border-t border-slate-100 bg-white" />
              <div className="h-12 animate-pulse border-t border-slate-100 bg-white" />
            </div>
          ))}
        </div>
      ) : sites.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
          <h2 className="font-semibold text-slate-800">尚未建立廠區</h2>
          <p className="mt-1 text-sm text-slate-500">請先建立區域，再新增第一個廠區。</p>
          <Link href="/admin/signage/regions" className="mt-4 inline-flex rounded-lg bg-cyan-600 px-4 py-2 text-sm font-semibold text-white hover:bg-cyan-700">
            開始設定
          </Link>
        </div>
      ) : filteredSites.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
          <h2 className="font-semibold text-slate-800">找不到符合條件的廠區</h2>
          <p className="mt-1 text-sm text-slate-500">請調整搜尋關鍵字或區域篩選。</p>
          <button
            type="button"
            onClick={() => { setQuery(''); setRegionFilter('all'); }}
            className="mt-4 text-sm font-semibold text-cyan-700 hover:underline"
          >
            清除篩選條件
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {grouped.map(({ region, sites: regionSites }) => (
            <section key={region.id} className="overflow-hidden rounded-xl border border-slate-200 border-l-4 border-l-cyan-500 bg-white shadow-sm">
              <div className="flex items-center justify-between gap-4 bg-slate-50/80 px-4 py-3 sm:px-5">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h2 className="truncate text-sm font-bold text-slate-800">{getRegionLabel(region)}</h2>
                    {getRegionLabel(region) !== region.name && (
                      <span className="rounded bg-slate-200/70 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-slate-500">
                        {region.name}
                      </span>
                    )}
                    <span className="whitespace-nowrap text-xs text-slate-400">{regionSites.length} 個廠區</span>
                  </div>
                  {region.description && (
                    <p className="mt-0.5 truncate text-xs text-slate-400">{region.description}</p>
                  )}
                </div>
                <Link href="/admin/signage/regions" className="whitespace-nowrap text-xs font-semibold text-slate-500 hover:text-cyan-700">
                  區域設定
                </Link>
              </div>

              <div className="hidden grid-cols-12 gap-3 border-y border-slate-100 bg-white px-5 py-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400 sm:grid">
                <span className="col-span-5">廠區名稱</span>
                <span className="col-span-3">用途</span>
                <span className="col-span-3">系統代號</span>
                <span className="col-span-1 text-right">管理</span>
              </div>

              <div>
                {regionSites.map(renderSiteRow)}
              </div>
            </section>
          ))}

          {orphanSites.length > 0 && (
            <section className="overflow-hidden rounded-xl border border-amber-200 border-l-4 border-l-amber-400 bg-white shadow-sm">
              <div className="flex items-center justify-between gap-4 bg-amber-50/70 px-4 py-3 sm:px-5">
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-bold text-slate-800">未分類</h2>
                  <span className="text-xs text-slate-400">{orphanSites.length} 個廠區</span>
                </div>
                <Link href="/admin/signage/sites" className="whitespace-nowrap text-xs font-semibold text-amber-700 hover:underline">
                  修正分類
                </Link>
              </div>
              <div className="hidden grid-cols-12 gap-3 border-y border-slate-100 bg-white px-5 py-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400 sm:grid">
                <span className="col-span-5">廠區名稱</span>
                <span className="col-span-3">用途</span>
                <span className="col-span-3">系統代號</span>
                <span className="col-span-1 text-right">管理</span>
              </div>
              <div>
                {orphanSites.map(renderSiteRow)}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
