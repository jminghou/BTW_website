'use client';

import { useEffect, useRef, useState } from 'react';
import AssetHtmlEditor from '@/components/signage/AssetHtmlEditor';
import { useParams } from 'next/navigation';
import { assetProxyUrl } from '@/lib/signage/assetVersion';
import { extractFilenameDate, matchFilename } from '@/lib/signage/filenameFilter';
import { isImageFilename } from '@/lib/signage/mediaType';

interface Asset {
  id: number;
  filename: string;
  blob_url: string;
  description: string | null;
  upload_timestamp: string;
}

interface TemplateMeta {
  key: string;
  displayName: string;
  customer: string;
  description: string;
}

export default function SiteAssetsPage() {
  const params = useParams<{ siteId: string }>();
  const siteId = params?.siteId;

  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  // 檔名快速篩選關鍵字（依檔名命名邏輯：廠區_餐期_年份-月份-日期）
  const [filterText, setFilterText] = useState('');
  // 管理素材：依檔名中的日期區間批次刪除
  const [manageStartDate, setManageStartDate] = useState('');
  const [manageEndDate, setManageEndDate] = useState('');
  const [managingDelete, setManagingDelete] = useState(false);
  const [manageMessage, setManageMessage] = useState('');
  // 檔名排序方向：null＝維持原順序（上傳時間）／asc 升冪／desc 降冪
  const [filenameSort, setFilenameSort] = useState<'asc' | 'desc' | null>(null);
  // 記住上一次點選的列索引，作為 Shift 範圍選取的錨點
  const lastIndexRef = useRef<number | null>(null);

  const [uploadMode, setUploadMode] = useState<'html' | 'json' | 'image'>('html');
  const [uploadDesc, setUploadDesc] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState('');
  const [uploadDetail, setUploadDetail] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // JSON 轉檔版型清單
  const [availableTemplates, setAvailableTemplates] = useState<TemplateMeta[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');

  const load = async () => {
    if (!siteId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/signage/assets?site_id=${siteId}`);
      const json = await res.json();
      if (json.success) setAssets(json.data || []);
      setSelectedIds(new Set());
      lastIndexRef.current = null;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [siteId]);

  // 載入可用版型（一次即可）
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/signage/templates');
        const json = await res.json();
        if (json.success) {
          setAvailableTemplates(json.data || []);
          setSelectedTemplate(json.default || (json.data?.[0]?.key ?? ''));
        }
      } catch {
        // 取不到就維持空陣列；JSON 分頁會顯示提示
      }
    })();
  }, []);

  const switchMode = (mode: 'html' | 'json' | 'image') => {
    setUploadMode(mode);
    setUploadResult('');
    setUploadDetail([]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!siteId || !fileInputRef.current?.files?.length) return;
    setUploading(true);
    setUploadResult('');
    setUploadDetail([]);
    try {
      const fd = new FormData();
      fd.append('site_id', siteId);
      Array.from(fileInputRef.current.files).forEach(f => fd.append('file', f));

      let res: Response;
      if (uploadMode === 'json') {
        if (selectedTemplate) fd.append('template', selectedTemplate);
        res = await fetch('/api/signage/assets/convert', { method: 'POST', body: fd });
      } else {
        if (uploadDesc) fd.append('description', uploadDesc);
        res = await fetch('/api/signage/assets/upload', { method: 'POST', body: fd });
      }
      const json = await res.json();
      setUploadResult(json.message || (json.success ? '成功' : '失敗'));

      if (uploadMode === 'json' && json.data) {
        const lines: string[] = [];
        for (const u of json.data.uploaded ?? []) {
          lines.push(`✅ ${u.filename}` + (u.warnings?.length ? `（⚠ ${u.warnings.join('；')}）` : ''));
        }
        for (const f of json.data.failed ?? []) lines.push(`❌ ${f.filename}：${f.error}`);
        setUploadDetail(lines);
      } else if ((uploadMode === 'html' || uploadMode === 'image') && json.data?.failed?.length) {
        setUploadDetail(json.data.failed.map((f: { filename: string; error: string }) => `❌ ${f.filename}：${f.error}`));
      }

      if (fileInputRef.current) fileInputRef.current.value = '';
      setUploadDesc('');
      await load();
    } catch {
      setUploadResult('上傳失敗：網路錯誤');
    } finally {
      setUploading(false);
    }
  };

  // 套用檔名篩選後的清單
  const filteredAssets = assets.filter(a => matchFilename(a.filename, filterText));
  // 再依檔名排序（以中文筆劃＋數字大小比較：'zh-Hant-u-co-stroke' + numeric）；
  // 選取、全選、Shift 範圍選取與列表渲染皆以此排序後的清單為準
  const displayAssets = filenameSort
    ? [...filteredAssets].sort((a, b) => {
        const r = a.filename.localeCompare(b.filename, 'zh-Hant-u-co-stroke', { numeric: true });
        return filenameSort === 'asc' ? r : -r;
      })
    : filteredAssets;
  const manageRangeInvalid = Boolean(
    manageStartDate && manageEndDate && manageStartDate > manageEndDate,
  );
  const assetsInManageRange = manageStartDate && manageEndDate && !manageRangeInvalid
    ? assets.filter(a => {
        const date = extractFilenameDate(a.filename);
        return date !== null && date >= manageStartDate && date <= manageEndDate;
      })
    : [];
  const allFilteredSelected = displayAssets.length > 0 && displayAssets.every(a => selectedIds.has(a.id));
  // 點檔名標題循環切換：原順序 → 升冪 → 降冪 → 原順序
  const toggleFilenameSort = () =>
    setFilenameSort(prev => (prev === null ? 'asc' : prev === 'asc' ? 'desc' : null));

  const toggleSelect = (id: number) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };
  const toggleSelectAll = () => {
    if (allFilteredSelected) {
      setSelectedIds(prev => {
        const next = new Set(prev);
        displayAssets.forEach(a => next.delete(a.id));
        return next;
      });
    } else {
      setSelectedIds(prev => {
        const next = new Set(prev);
        displayAssets.forEach(a => next.add(a.id));
        return next;
      });
    }
  };

  // 點檔名／核取方塊時呼叫；按住 Shift 則從上一個錨點到本列整段一併選取
  const selectRow = (index: number, id: number, shiftKey: boolean) => {
    if (shiftKey && lastIndexRef.current !== null) {
      const start = Math.min(lastIndexRef.current, index);
      const end = Math.max(lastIndexRef.current, index);
      const rangeIds = displayAssets.slice(start, end + 1).map(a => a.id);
      setSelectedIds(prev => {
        const next = new Set(prev);
        rangeIds.forEach(rid => next.add(rid));
        return next;
      });
    } else {
      toggleSelect(id);
      lastIndexRef.current = index;
    }
  };

  const [editingAsset, setEditingAsset] = useState<{ id: number; filename: string } | null>(null);
  const openEdit = (next: Asset) => setEditingAsset({ id: next.id, filename: next.filename });

  const [convertingMsg, setConvertingMsg] = useState('');
  const [converting, setConverting] = useState(false);
  const handleConvertToPlaylists = async () => {
    if (selectedIds.size === 0) return;
    if (!confirm(`確定將選取的 ${selectedIds.size} 個素材各轉成一個播放清單？已存在同名清單會略過。`)) return;
    setConverting(true);
    setConvertingMsg('轉換中...');
    try {
      const res = await fetch('/api/signage/playlists/create-from-assets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ asset_ids: Array.from(selectedIds) }),
      });
      const json = await res.json();
      setConvertingMsg(json.success ? `✅ ${json.message}` : `❌ ${json.message}`);
      if (json.success) setSelectedIds(new Set());
    } catch {
      setConvertingMsg('❌ 網路錯誤');
    } finally {
      setConverting(false);
    }
  };

  const handleBatchDelete = async () => {
    if (selectedIds.size === 0) return;
    if (!confirm(`確定要刪除選中的 ${selectedIds.size} 個素材嗎？`)) return;
    const res = await fetch('/api/signage/assets/batch-delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: Array.from(selectedIds) }),
    });
    const json = await res.json();
    if (json.success) await load();
    else alert(json.message || '批次刪除失敗');
  };

  const handleDeleteByDateRange = async () => {
    if (
      !manageStartDate ||
      !manageEndDate ||
      manageRangeInvalid ||
      assetsInManageRange.length === 0 ||
      managingDelete
    ) return;

    const targetIds = assetsInManageRange.map(asset => asset.id);
    const rangeLabel = `${manageStartDate} 至 ${manageEndDate}`;
    if (!confirm(
      `確定要刪除 ${rangeLabel} 的全部素材嗎？\n\n共 ${targetIds.length} 個素材，此操作無法復原。`,
    )) return;

    setManagingDelete(true);
    setManageMessage('刪除中...');
    try {
      const res = await fetch('/api/signage/assets/batch-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: targetIds }),
      });
      const json = await res.json();
      if (!json.success) {
        setManageMessage(`❌ ${json.message || '刪除失敗'}`);
        return;
      }

      setManageMessage(`✅ 已刪除 ${rangeLabel} 的 ${targetIds.length} 個素材`);
      await load();
    } catch {
      setManageMessage('❌ 刪除失敗：網路錯誤');
    } finally {
      setManagingDelete(false);
    }
  };

  // 轉檔（瀏覽器螢幕快照）：把素材 HTML 截成 PNG 後直接下載
  const [shotId, setShotId] = useState<number | null>(null);
  const handleScreenshot = async (asset: Asset) => {
    setShotId(asset.id);
    try {
      const res = await fetch(`/api/signage/assets/${asset.id}/screenshot`);
      if (!res.ok) {
        let msg = '轉檔失敗';
        try {
          const j = await res.json();
          msg = j.message || msg;
        } catch {
          /* 非 JSON 回應就用預設訊息 */
        }
        alert(msg);
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = asset.filename.replace(/\.html?$/i, '') + '.png';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      alert('轉檔失敗：網路錯誤');
    } finally {
      setShotId(null);
    }
  };

  // 批次轉檔：逐一截圖選取的素材，於瀏覽器端打包成單一 ZIP 下載。
  // 採「逐一送請求」而非一次請求截多張，避免單一 Serverless 函式逾時、
  // 也避免同時啟動多個 Chromium 造成記憶體不足。
  const [batchShooting, setBatchShooting] = useState(false);
  const [batchMsg, setBatchMsg] = useState('');
  const handleBatchScreenshot = async () => {
    if (selectedIds.size === 0 || batchShooting) return;
    // 依目前列表順序處理選取項目
    const targets = assets.filter(a => selectedIds.has(a.id) && !isImageFilename(a.filename));
    if (targets.length === 0) {
      alert('選取的項目都是圖片，無需轉檔');
      return;
    }
    setBatchShooting(true);
    setBatchMsg(`轉檔中… 0/${targets.length}`);
    try {
      const JSZip = (await import('jszip')).default;
      const zip = new JSZip();
      const usedNames = new Set<string>();
      const failed: string[] = [];
      let done = 0;

      for (const asset of targets) {
        const baseName = asset.filename.replace(/\.html?$/i, '') || `asset_${asset.id}`;
        try {
          const res = await fetch(`/api/signage/assets/${asset.id}/screenshot`);
          if (!res.ok) {
            let msg = `HTTP ${res.status}`;
            try {
              const j = await res.json();
              msg = j.message || msg;
            } catch {
              /* 非 JSON 回應 */
            }
            failed.push(`${baseName}：${msg}`);
          } else {
            const blob = await res.blob();
            // 去重檔名（同名素材接 _2、_3…）
            let name = `${baseName}.png`;
            let n = 2;
            while (usedNames.has(name)) name = `${baseName}_${n++}.png`;
            usedNames.add(name);
            zip.file(name, blob);
          }
        } catch {
          failed.push(`${baseName}：網路錯誤`);
        }
        done++;
        setBatchMsg(`轉檔中… ${done}/${targets.length}`);
      }

      const okCount = usedNames.size;
      if (okCount === 0) {
        setBatchMsg(`❌ 全部失敗（${failed.length} 張）`);
        alert('批次轉檔全部失敗：\n' + failed.join('\n'));
        return;
      }

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `素材轉檔_${okCount}張.zip`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);

      setBatchMsg(`✅ 已打包 ${okCount} 張${failed.length ? `，${failed.length} 張失敗` : ''}`);
      if (failed.length) alert('部分素材轉檔失敗：\n' + failed.join('\n'));
    } finally {
      setBatchShooting(false);
    }
  };

  const handleDeleteOne = async (id: number) => {
    if (!confirm('確定要刪除此素材嗎？')) return;
    const res = await fetch(`/api/signage/assets/${id}`, { method: 'DELETE' });
    const json = await res.json();
    if (json.success) await load();
    else alert(json.message || '刪除失敗');
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">素材庫</h1>

      {/* 上傳區 */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold mb-4">上傳素材</h2>
        <div className="flex gap-2 mb-5 border-b border-gray-200">
          <button type="button" onClick={() => switchMode('html')}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${uploadMode === 'html' ? 'border-cyan-600 text-cyan-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            直接上傳 HTML
          </button>
          <button type="button" onClick={() => switchMode('image')}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${uploadMode === 'image' ? 'border-cyan-600 text-cyan-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            上傳圖片
          </button>
          <button type="button" onClick={() => switchMode('json')}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${uploadMode === 'json' ? 'border-cyan-600 text-cyan-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            上傳 JSON 自動轉檔
          </button>
        </div>

        <form onSubmit={handleUpload} className="space-y-4">
          {(uploadMode === 'html' || uploadMode === 'image') && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">說明（選填）</label>
              <input type="text" value={uploadDesc} onChange={e => setUploadDesc(e.target.value)}
                className="w-full md:w-1/2 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500" />
            </div>
          )}
          {uploadMode === 'image' && (
            <div className="bg-blue-50 border border-blue-200 text-blue-800 text-sm rounded-lg px-4 py-3">
              支援 PNG、JPG。上傳後可加入播放清單，並可與 HTML 菜單混在同一份清單裡輪播；切換時使用淡入淡出。
            </div>
          )}
          {uploadMode === 'json' && (
            <div className="bg-blue-50 border border-blue-200 text-blue-800 text-sm rounded-lg px-4 py-3">
              上傳餐點資料 JSON，系統會自動依「據點＋時段＋日期」轉成菜單 HTML；一個 JSON 含多天會自動拆成多個菜單。
            </div>
          )}
          {uploadMode === 'json' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">選擇版型 *</label>
              {availableTemplates.length === 0 ? (
                <p className="text-sm text-gray-400">尚無可用版型</p>
              ) : (
                <>
                  <select
                    value={selectedTemplate}
                    onChange={e => setSelectedTemplate(e.target.value)}
                    className="w-full md:w-1/2 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500"
                  >
                    {availableTemplates.map(t => (
                      <option key={t.key} value={t.key}>
                        {t.displayName}（{t.customer}）
                      </option>
                    ))}
                  </select>
                  {(() => {
                    const t = availableTemplates.find(x => x.key === selectedTemplate);
                    return t?.description ? (
                      <p className="text-xs text-gray-500 mt-1">{t.description}</p>
                    ) : null;
                  })()}
                </>
              )}
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {uploadMode === 'json'
                ? '選擇 JSON 檔（可一次選多個 .json） *'
                : uploadMode === 'image'
                  ? '選擇圖片（可一次選多個 .png / .jpg） *'
                  : '選擇檔案（可一次選多個 .html） *'}
            </label>
            <input ref={fileInputRef} type="file" accept={
              uploadMode === 'json'
                ? '.json,application/json'
                : uploadMode === 'image'
                  ? '.png,.jpg,.jpeg,image/png,image/jpeg'
                  : '.html'
            } multiple required
              className="w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-cyan-50 file:text-cyan-700 hover:file:bg-cyan-100" />
          </div>
          <button type="submit" disabled={uploading}
            className="bg-cyan-600 hover:bg-cyan-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium">
            {uploading ? (uploadMode === 'json' ? '轉檔中...' : '上傳中...') : (uploadMode === 'json' ? '⚙ 轉檔並上傳' : '⬆ 上傳')}
          </button>
          {uploadResult && <p className="text-sm font-medium">{uploadResult}</p>}
          {uploadDetail.length > 0 && (
            <ul className="text-sm space-y-1 bg-gray-50 rounded-lg p-3 max-h-60 overflow-y-auto">
              {uploadDetail.map((line, i) => <li key={i}>{line}</li>)}
            </ul>
          )}
        </form>
      </div>

      {/* 列表 */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-4">
        {/* 檔名快速篩選：直接輸入即時過濾（例：16＝某日、L＝午餐、F3＝廠區，可空白組合） */}
        <div className="relative w-full md:w-96">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
          <input
            type="text"
            value={filterText}
            onChange={e => setFilterText(e.target.value)}
            placeholder="篩選檔名… 例：16（某日）、L（午餐）、F3（廠區）"
            className="w-full pl-9 pr-9 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-cyan-500"
          />
          {filterText && (
            <button type="button" onClick={() => setFilterText('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-lg leading-none">×</button>
          )}
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button onClick={toggleSelectAll} className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-lg text-sm">
              {allFilteredSelected ? '取消全選' : '全選'}
            </button>
            <span className="text-sm text-gray-500">已選 {selectedIds.size} 個</span>
            {filterText && <span className="text-sm text-gray-400">（篩選出 {filteredAssets.length} / {assets.length}）</span>}
            {convertingMsg && <span className="text-sm text-gray-600">{convertingMsg}</span>}
            {batchMsg && <span className="text-sm text-gray-600">{batchMsg}</span>}
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handleBatchScreenshot} disabled={selectedIds.size === 0 || batchShooting}
              className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-30 text-white px-3 py-1.5 rounded-lg text-sm">
              {batchShooting ? '批次轉檔中…' : `批次轉檔 (${selectedIds.size})`}
            </button>
            <button onClick={handleConvertToPlaylists} disabled={selectedIds.size === 0 || converting}
              className="bg-green-600 hover:bg-green-700 disabled:opacity-30 text-white px-3 py-1.5 rounded-lg text-sm">
              素材轉列表 ({selectedIds.size})
            </button>
            <button onClick={handleBatchDelete} disabled={selectedIds.size === 0}
              className="bg-red-600 hover:bg-red-700 disabled:opacity-30 text-white px-3 py-1.5 rounded-lg text-sm">
              刪除選取項目 ({selectedIds.size})
            </button>
          </div>
        </div>

        <table className="w-full text-sm table-fixed">
          <colgroup>
            <col className="w-10" />        {/* 核取方塊 */}
            <col className="w-[28%]" />     {/* 檔名（縮短） */}
            <col className="w-[42%]" />     {/* 說明（拉寬） */}
            <col className="w-32" />        {/* 上傳時間 */}
            <col className="w-52" />        {/* 操作 */}
          </colgroup>
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-3 py-3 w-10">
                <input type="checkbox" onChange={toggleSelectAll} checked={allFilteredSelected} />
              </th>
              <th className="px-3 py-3 text-left font-medium text-gray-700">
                <button type="button" onClick={toggleFilenameSort}
                  className="inline-flex items-center gap-1 hover:text-cyan-700"
                  title="依檔名（筆劃／數字）排序">
                  檔名
                  <span className="flex flex-col leading-[0.6] text-[9px]">
                    <span className={filenameSort === 'asc' ? 'text-cyan-600' : 'text-gray-300'}>▲</span>
                    <span className={filenameSort === 'desc' ? 'text-cyan-600' : 'text-gray-300'}>▼</span>
                  </span>
                </button>
              </th>
              <th className="px-3 py-3 text-left font-medium text-gray-700">說明</th>
              <th className="px-3 py-3 text-left font-medium text-gray-700">上傳時間</th>
              <th className="px-3 py-3 text-right font-medium text-gray-700">操作</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="px-3 py-8 text-center text-gray-400">載入中...</td></tr>
            ) : assets.length === 0 ? (
              <tr><td colSpan={5} className="px-3 py-8 text-center text-gray-400">尚無素材</td></tr>
            ) : displayAssets.length === 0 ? (
              <tr><td colSpan={5} className="px-3 py-8 text-center text-gray-400">沒有符合「{filterText}」的素材</td></tr>
            ) : displayAssets.map((a, idx) => (
              <tr key={a.id} className={`border-b border-gray-100 hover:bg-gray-50 ${selectedIds.has(a.id) ? 'bg-cyan-50' : ''}`}>
                <td className="px-3 py-3 align-top">
                  <input type="checkbox" checked={selectedIds.has(a.id)} onChange={() => {}}
                    onClick={e => selectRow(idx, a.id, e.shiftKey)} />
                </td>
                <td
                  className="px-3 py-3 font-mono text-cyan-700 cursor-pointer select-none align-top"
                  onClick={e => selectRow(idx, a.id, e.shiftKey)}
                  title={a.filename}
                >
                  <div className="break-all overflow-hidden [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2] leading-5">
                    {a.filename}
                  </div>
                  {isImageFilename(a.filename) && (
                    <span className="mt-1 inline-block text-[10px] px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">圖片</span>
                  )}
                </td>
                <td className="px-3 py-3 text-gray-600 text-[11px] align-top" title={a.description || '—'}>
                  <div className="break-all overflow-hidden [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2] leading-4">
                    {a.description || '—'}
                  </div>
                </td>
                <td
                  className="px-3 py-3 text-xs text-gray-400 align-top"
                  title={new Date(a.upload_timestamp).toLocaleString('zh-TW')}
                >
                  <div className="break-words overflow-hidden [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2] leading-4">
                    {new Date(a.upload_timestamp).toLocaleString('zh-TW')}
                  </div>
                </td>
                <td className="px-3 py-3 text-right whitespace-nowrap align-top">
                  <a href={assetProxyUrl(a.id, a.blob_url)} target="_blank" rel="noopener noreferrer" className="text-cyan-600 hover:underline mr-3">預覽</a>
                  {!isImageFilename(a.filename) && (
                    <>
                      <button onClick={() => openEdit(a)} className="text-amber-600 hover:underline mr-3">編輯</button>
                      <button onClick={() => handleScreenshot(a)} disabled={shotId === a.id}
                        className="text-indigo-600 hover:underline mr-3 disabled:opacity-50">
                        {shotId === a.id ? '轉檔中…' : '轉檔'}
                      </button>
                    </>
                  )}
                  <button onClick={() => handleDeleteOne(a.id)} className="text-red-600 hover:underline">刪除</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 管理素材 */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold mb-2">管理素材</h2>
        <p className="text-sm text-gray-500 mb-5">
          選擇素材日期區間後，可一次刪除區間內的全部素材。日期依檔名中的 YYYY-MM-DD 判定，並包含起訖日。
        </p>

        <div className="flex flex-col md:flex-row md:items-end gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">開始日期</label>
            <input
              type="date"
              value={manageStartDate}
              onChange={e => {
                setManageStartDate(e.target.value);
                setManageMessage('');
              }}
              className="w-full md:w-52 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">結束日期</label>
            <input
              type="date"
              value={manageEndDate}
              onChange={e => {
                setManageEndDate(e.target.value);
                setManageMessage('');
              }}
              className="w-full md:w-52 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500"
            />
          </div>
          <button
            type="button"
            onClick={handleDeleteByDateRange}
            disabled={
              !manageStartDate ||
              !manageEndDate ||
              manageRangeInvalid ||
              assetsInManageRange.length === 0 ||
              managingDelete
            }
            className="bg-red-600 hover:bg-red-700 disabled:opacity-30 text-white px-4 py-2 rounded-lg text-sm font-medium"
          >
            {managingDelete ? '刪除中...' : `刪除此區間素材 (${assetsInManageRange.length})`}
          </button>
        </div>

        {manageRangeInvalid && (
          <p className="mt-3 text-sm text-red-600">結束日期不可早於開始日期。</p>
        )}
        {!manageRangeInvalid && manageStartDate && manageEndDate && assetsInManageRange.length === 0 && (
          <p className="mt-3 text-sm text-gray-500">此日期區間沒有可刪除的素材。</p>
        )}
        {manageMessage && <p className="mt-3 text-sm font-medium">{manageMessage}</p>}
      </div>

      <AssetHtmlEditor
        asset={editingAsset}
        onClose={() => setEditingAsset(null)}
        onSaved={() => { void load(); }}
      />
    </div>
  );
}
