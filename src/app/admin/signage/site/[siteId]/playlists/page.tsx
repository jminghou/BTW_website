'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

interface Playlist {
  id: number;
  site_id: number;
  name: string;
  description: string | null;
}

interface Asset {
  id: number;
  filename: string;
  blob_url: string;
}

interface PlaylistItem {
  asset_id: number;
  filename?: string;
  duration_seconds: number;
  order: number;
}

const DEFAULT_DURATION = 180; // 所有新增清單項目預設 180 秒

export default function SitePlaylistsPage() {
  const params = useParams<{ siteId: string }>();
  const siteId = params?.siteId;

  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [actionMsg, setActionMsg] = useState('');
  const [busy, setBusy] = useState(false);

  // 新增/編輯清單表單
  const [editing, setEditing] = useState<Playlist | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', description: '' });

  // 編輯項目
  const [itemsEditing, setItemsEditing] = useState<Playlist | null>(null);
  const [items, setItems] = useState<PlaylistItem[]>([]);
  const [availableAssets, setAvailableAssets] = useState<Asset[]>([]);
  const [itemSaveMsg, setItemSaveMsg] = useState('');

  const load = async () => {
    if (!siteId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/signage/playlists?site_id=${siteId}`);
      const json = await res.json();
      if (json.success) setPlaylists(json.data || []);
      setSelectedIds(new Set());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [siteId]);

  // ---- 一鍵素材轉列表 ----
  const handleAutoCreate = async () => {
    if (!siteId) return;
    if (!confirm('將把本廠區所有素材各建立一個播放清單（每項 180 秒），已存在同名清單會跳過。確定嗎？')) return;
    setBusy(true);
    setActionMsg('');
    try {
      const res = await fetch('/api/signage/playlists/auto-create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ site_id: Number(siteId), duration: DEFAULT_DURATION }),
      });
      const json = await res.json();
      setActionMsg(json.message || (json.success ? '完成' : '失敗'));
      if (json.success) await load();
    } catch {
      setActionMsg('網路錯誤');
    } finally {
      setBusy(false);
    }
  };

  // ---- 批次選取/刪除 ----
  const toggleSelect = (id: number) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };
  const selectAll = () => setSelectedIds(new Set(playlists.map(p => p.id)));
  const deselectAll = () => setSelectedIds(new Set());

  const handleBatchDelete = async () => {
    if (selectedIds.size === 0) return;
    if (!confirm(`確定要刪除選中的 ${selectedIds.size} 個播放清單嗎？`)) return;
    setBusy(true);
    try {
      const res = await fetch('/api/signage/playlists/batch-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: Array.from(selectedIds) }),
      });
      const json = await res.json();
      setActionMsg(json.message || (json.success ? '完成' : '失敗'));
      if (json.success) await load();
    } finally {
      setBusy(false);
    }
  };

  // ---- 新增/編輯清單 ----
  const openNew = () => { setEditing(null); setForm({ name: '', description: '' }); setShowForm(true); };
  const openEdit = (p: Playlist) => { setEditing(p); setForm({ name: p.name, description: p.description ?? '' }); setShowForm(true); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload: Record<string, unknown> = { name: form.name, description: form.description };
    if (!editing) payload.site_id = Number(siteId);
    const url = editing ? `/api/signage/playlists/${editing.id}` : '/api/signage/playlists';
    const res = await fetch(url, {
      method: editing ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    if (json.success) { setShowForm(false); await load(); }
    else alert(json.message || '操作失敗');
  };

  const handleDelete = async (id: number) => {
    if (!confirm('確定要刪除此播放清單嗎？相關排程也會一併刪除。')) return;
    const res = await fetch(`/api/signage/playlists/${id}`, { method: 'DELETE' });
    const json = await res.json();
    if (json.success) await load();
    else alert(json.message || '刪除失敗');
  };

  // ---- 編輯項目 ----
  const openItemsEditor = async (p: Playlist) => {
    setItemsEditing(p);
    setItemSaveMsg('');
    const [detail, assetsRes] = await Promise.all([
      fetch(`/api/signage/playlists/${p.id}`).then(r => r.json()),
      fetch(`/api/signage/assets?site_id=${siteId}`).then(r => r.json()),
    ]);
    type RawItem = { asset_id: number; filename: string; duration_seconds: number; order: number };
    if (detail.success) {
      setItems((detail.data.items as RawItem[] || []).map(it => ({
        asset_id: it.asset_id, filename: it.filename, duration_seconds: it.duration_seconds, order: it.order,
      })));
    }
    if (assetsRes.success) setAvailableAssets(assetsRes.data || []);
  };

  const addItem = (assetId: number) => {
    const asset = availableAssets.find(a => a.id === assetId);
    if (!asset) return;
    setItems(prev => [...prev, { asset_id: assetId, filename: asset.filename, duration_seconds: DEFAULT_DURATION, order: prev.length }]);
  };
  const removeItem = (idx: number) => setItems(prev => prev.filter((_, i) => i !== idx).map((it, i) => ({ ...it, order: i })));
  const moveItem = (idx: number, dir: -1 | 1) => {
    setItems(prev => {
      const next = [...prev];
      const t = idx + dir;
      if (t < 0 || t >= next.length) return prev;
      [next[idx], next[t]] = [next[t], next[idx]];
      return next.map((it, i) => ({ ...it, order: i }));
    });
  };
  const updateDuration = (idx: number, v: number) => setItems(prev => prev.map((it, i) => i === idx ? { ...it, duration_seconds: Math.max(1, v) } : it));

  const saveItems = async () => {
    if (!itemsEditing) return;
    setItemSaveMsg('儲存中...');
    const res = await fetch(`/api/signage/playlists/${itemsEditing.id}/items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: items.map((it, i) => ({ asset_id: it.asset_id, duration_seconds: it.duration_seconds, order: i })) }),
    });
    const json = await res.json();
    setItemSaveMsg(json.success ? '✅ 已儲存' : `❌ ${json.message}`);
  };

  const allSelected = playlists.length > 0 && selectedIds.size === playlists.length;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">播放列表</h1>

      {/* 工具列 */}
      <div className="flex flex-wrap items-center gap-2">
        <button onClick={openNew} className="bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2 rounded-lg text-sm font-medium">
          新增播放列表
        </button>
        <button onClick={handleAutoCreate} disabled={busy} className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium">
          一鍵素材轉列表
        </button>
        <button onClick={allSelected ? deselectAll : selectAll} className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg text-sm font-medium">
          {allSelected ? '取消全選' : '全選'}
        </button>
        <button onClick={handleBatchDelete} disabled={selectedIds.size === 0 || busy}
          className="bg-red-600 hover:bg-red-700 disabled:opacity-40 text-white px-4 py-2 rounded-lg text-sm font-medium">
          刪除選取項目 ({selectedIds.size})
        </button>
        {actionMsg && <span className="text-sm text-gray-600 ml-2">{actionMsg}</span>}
      </div>

      {showForm && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">{editing ? '編輯播放列表' : '新增播放列表'}</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">名稱 *</label>
              <input type="text" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                placeholder="例如：晨間輪播" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">說明</label>
              <input type="text" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500" />
            </div>
            <div className="flex gap-2">
              <button type="submit" className="bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2 rounded-lg text-sm font-medium">{editing ? '更新' : '建立'}</button>
              <button type="button" onClick={() => setShowForm(false)} className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium">取消</button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-3 py-3 w-10">
                <input type="checkbox" checked={allSelected} onChange={() => allSelected ? deselectAll() : selectAll()} />
              </th>
              <th className="px-4 py-3 text-left font-medium text-gray-700">名稱</th>
              <th className="px-4 py-3 text-left font-medium text-gray-700">描述</th>
              <th className="px-4 py-3 text-right font-medium text-gray-700">操作</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-400">載入中...</td></tr>
            ) : playlists.length === 0 ? (
              <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-400">尚無播放清單</td></tr>
            ) : playlists.map(p => (
              <tr key={p.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="px-3 py-3"><input type="checkbox" checked={selectedIds.has(p.id)} onChange={() => toggleSelect(p.id)} /></td>
                <td className="px-4 py-3 font-medium">{p.name}</td>
                <td className="px-4 py-3 text-gray-600">{p.description || '—'}</td>
                <td className="px-4 py-3 text-right whitespace-nowrap">
                  <button onClick={() => openItemsEditor(p)} className="text-cyan-600 hover:underline mr-3">編輯內容</button>
                  <button onClick={() => openEdit(p)} className="text-cyan-600 hover:underline mr-3">改名</button>
                  <button onClick={() => handleDelete(p.id)} className="text-red-600 hover:underline">刪除</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 編輯項目對話框 */}
      {itemsEditing && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[60] p-4" onClick={() => setItemsEditing(null)}>
          <div className="bg-white rounded-xl max-w-3xl w-full max-h-[85vh] overflow-y-auto p-6 space-y-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">編輯播放項目 — {itemsEditing.name}</h2>
              <button onClick={() => setItemsEditing(null)} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">×</button>
            </div>

            <div className="flex items-center gap-2">
              <select id="addAsset" className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm">
                <option value="">+ 選擇素材加入清單（預設 {DEFAULT_DURATION} 秒）</option>
                {availableAssets.map(a => <option key={a.id} value={a.id}>{a.filename}</option>)}
              </select>
              <button onClick={() => {
                const sel = document.getElementById('addAsset') as HTMLSelectElement;
                if (sel.value) { addItem(Number(sel.value)); sel.value = ''; }
              }} className="bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2 rounded-lg text-sm font-medium">加入</button>
            </div>

            <div className="space-y-2">
              {items.length === 0 ? (
                <p className="text-gray-400 text-sm text-center py-6">尚未加入任何素材</p>
              ) : items.map((it, idx) => (
                <div key={`${it.asset_id}-${idx}`} className="flex items-center gap-2 bg-gray-50 p-3 rounded-lg">
                  <span className="text-gray-400 w-6">{idx + 1}</span>
                  <span className="flex-1 font-mono text-sm text-gray-700 truncate">{it.filename}</span>
                  <div className="flex items-center gap-1 text-sm">
                    <input type="number" min={1} value={it.duration_seconds} onChange={e => updateDuration(idx, Number(e.target.value))}
                      className="w-20 px-2 py-1 border border-gray-300 rounded text-right" />
                    <span className="text-gray-500">秒</span>
                  </div>
                  <button onClick={() => moveItem(idx, -1)} disabled={idx === 0} className="text-gray-500 hover:text-gray-900 disabled:opacity-20 px-2">↑</button>
                  <button onClick={() => moveItem(idx, 1)} disabled={idx === items.length - 1} className="text-gray-500 hover:text-gray-900 disabled:opacity-20 px-2">↓</button>
                  <button onClick={() => removeItem(idx)} className="text-red-500 hover:text-red-700 px-2">✕</button>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between border-t pt-4">
              <span className="text-sm text-gray-500">{itemSaveMsg}</span>
              <div className="flex gap-2">
                <button onClick={() => setItemsEditing(null)} className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium">關閉</button>
                <button onClick={saveItems} className="bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2 rounded-lg text-sm font-medium">儲存項目</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
