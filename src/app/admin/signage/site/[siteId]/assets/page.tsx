'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams } from 'next/navigation';

interface Asset {
  id: number;
  filename: string;
  blob_url: string;
  description: string | null;
  upload_timestamp: string;
}

export default function SiteAssetsPage() {
  const params = useParams<{ siteId: string }>();
  const siteId = params?.siteId;

  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  const [uploadMode, setUploadMode] = useState<'html' | 'json'>('html');
  const [uploadDesc, setUploadDesc] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState('');
  const [uploadDetail, setUploadDetail] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    if (!siteId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/signage/assets?site_id=${siteId}`);
      const json = await res.json();
      if (json.success) setAssets(json.data || []);
      setSelectedIds(new Set());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [siteId]);

  const switchMode = (mode: 'html' | 'json') => {
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
      } else if (uploadMode === 'html' && json.data?.failed?.length) {
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

  const toggleSelect = (id: number) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };
  const toggleSelectAll = () => {
    if (selectedIds.size === assets.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(assets.map(a => a.id)));
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
          <button type="button" onClick={() => switchMode('json')}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${uploadMode === 'json' ? 'border-cyan-600 text-cyan-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            上傳 JSON 自動轉檔
          </button>
        </div>

        <form onSubmit={handleUpload} className="space-y-4">
          {uploadMode === 'html' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">說明（選填）</label>
              <input type="text" value={uploadDesc} onChange={e => setUploadDesc(e.target.value)}
                className="w-full md:w-1/2 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500" />
            </div>
          )}
          {uploadMode === 'json' && (
            <div className="bg-blue-50 border border-blue-200 text-blue-800 text-sm rounded-lg px-4 py-3">
              上傳餐點資料 JSON，系統會自動依「據點＋時段＋日期」轉成菜單 HTML；一個 JSON 含多天會自動拆成多個菜單。
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {uploadMode === 'json' ? '選擇 JSON 檔（可一次選多個 .json） *' : '選擇檔案（可一次選多個 .html） *'}
            </label>
            <input ref={fileInputRef} type="file" accept={uploadMode === 'json' ? '.json,application/json' : '.html'} multiple required
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
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button onClick={toggleSelectAll} className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-lg text-sm">
              {assets.length > 0 && selectedIds.size === assets.length ? '取消全選' : '全選'}
            </button>
            <span className="text-sm text-gray-500">已選 {selectedIds.size} 個</span>
          </div>
          <button onClick={handleBatchDelete} disabled={selectedIds.size === 0}
            className="bg-red-600 hover:bg-red-700 disabled:opacity-30 text-white px-3 py-1.5 rounded-lg text-sm">
            刪除選取項目 ({selectedIds.size})
          </button>
        </div>

        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-3 py-3 w-10">
                <input type="checkbox" onChange={toggleSelectAll} checked={assets.length > 0 && selectedIds.size === assets.length} />
              </th>
              <th className="px-3 py-3 text-left font-medium text-gray-700">檔名</th>
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
            ) : assets.map(a => (
              <tr key={a.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="px-3 py-3"><input type="checkbox" checked={selectedIds.has(a.id)} onChange={() => toggleSelect(a.id)} /></td>
                <td className="px-3 py-3 font-mono text-cyan-700">{a.filename}</td>
                <td className="px-3 py-3 text-gray-600">{a.description || '—'}</td>
                <td className="px-3 py-3 text-xs text-gray-400">{new Date(a.upload_timestamp).toLocaleString('zh-TW')}</td>
                <td className="px-3 py-3 text-right">
                  <a href={`/api/signage/asset/${a.id}`} target="_blank" rel="noopener noreferrer" className="text-cyan-600 hover:underline mr-3">預覽</a>
                  <button onClick={() => handleDeleteOne(a.id)} className="text-red-600 hover:underline">刪除</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
