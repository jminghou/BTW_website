'use client';

import { useEffect, useState } from 'react';

interface Playlist {
  id: number;
  site_id: number;
  site_name: string | null;
  name: string;
  description: string | null;
}

interface Site {
  id: number;
  name: string;
  code: string;
}

interface Asset {
  id: number;
  site_id: number | null;
  filename: string;
  blob_url: string;
}

interface PlaylistItem {
  id?: number;
  asset_id: number;
  filename?: string;
  blob_url?: string;
  duration_seconds: number;
  order: number;
}

export default function PlaylistsPage() {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState<Playlist | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ site_id: '', name: '', description: '' });

  // 編輯項目用
  const [itemsEditing, setItemsEditing] = useState<Playlist | null>(null);
  const [items, setItems] = useState<PlaylistItem[]>([]);
  const [availableAssets, setAvailableAssets] = useState<Asset[]>([]);
  const [itemSaveMsg, setItemSaveMsg] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const [p, s] = await Promise.all([
        fetch('/api/signage/playlists').then(r => r.json()),
        fetch('/api/signage/sites').then(r => r.json()),
      ]);
      if (p.success) setPlaylists(p.data || []);
      if (s.success) setSites(s.data || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const openNew = () => {
    setEditing(null);
    setForm({ site_id: sites[0]?.id?.toString() || '', name: '', description: '' });
    setShowForm(true);
  };

  const openEdit = (p: Playlist) => {
    setEditing(p);
    setForm({ site_id: p.site_id.toString(), name: p.name, description: p.description ?? '' });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload: Record<string, unknown> = { name: form.name, description: form.description };
    if (!editing) payload.site_id = Number(form.site_id);
    const url = editing ? `/api/signage/playlists/${editing.id}` : '/api/signage/playlists';
    const res = await fetch(url, {
      method: editing ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    if (json.success) {
      setShowForm(false);
      await load();
    } else alert(json.message || '操作失敗');
  };

  const handleDelete = async (id: number) => {
    if (!confirm('確定要刪除此播放清單嗎？相關排程也會一併刪除。')) return;
    const res = await fetch(`/api/signage/playlists/${id}`, { method: 'DELETE' });
    const json = await res.json();
    if (json.success) await load();
    else alert(json.message || '刪除失敗');
  };

  const openItemsEditor = async (p: Playlist) => {
    setItemsEditing(p);
    setItemSaveMsg('');
    const [detail, assetsRes] = await Promise.all([
      fetch(`/api/signage/playlists/${p.id}`).then(r => r.json()),
      fetch(`/api/signage/assets?site_id=${p.site_id}`).then(r => r.json()),
    ]);
    type RawItem = {
      asset_id: number;
      filename: string;
      blob_url: string;
      duration_seconds: number;
      order: number;
    };
    if (detail.success) {
      setItems((detail.data.items as RawItem[] || []).map((it) => ({
        asset_id: it.asset_id,
        filename: it.filename,
        blob_url: it.blob_url,
        duration_seconds: it.duration_seconds,
        order: it.order,
      })));
    }
    if (assetsRes.success) setAvailableAssets(assetsRes.data || []);
  };

  const addItem = (assetId: number) => {
    const asset = availableAssets.find(a => a.id === assetId);
    if (!asset) return;
    setItems(prev => [...prev, {
      asset_id: assetId,
      filename: asset.filename,
      blob_url: asset.blob_url,
      duration_seconds: 10,
      order: prev.length,
    }]);
  };

  const removeItem = (idx: number) => {
    setItems(prev => prev.filter((_, i) => i !== idx).map((it, i) => ({ ...it, order: i })));
  };

  const moveItem = (idx: number, dir: -1 | 1) => {
    setItems(prev => {
      const next = [...prev];
      const target = idx + dir;
      if (target < 0 || target >= next.length) return prev;
      [next[idx], next[target]] = [next[target], next[idx]];
      return next.map((it, i) => ({ ...it, order: i }));
    });
  };

  const updateDuration = (idx: number, v: number) => {
    setItems(prev => prev.map((it, i) => i === idx ? { ...it, duration_seconds: Math.max(1, v) } : it));
  };

  const saveItems = async () => {
    if (!itemsEditing) return;
    setItemSaveMsg('儲存中...');
    const res = await fetch(`/api/signage/playlists/${itemsEditing.id}/items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: items.map((it, i) => ({
        asset_id: it.asset_id,
        duration_seconds: it.duration_seconds,
        order: i,
      })) }),
    });
    const json = await res.json();
    setItemSaveMsg(json.success ? '✅ 已儲存' : `❌ ${json.message}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">播放清單管理</h1>
          <p className="text-sm text-gray-500 mt-1">建立播放清單，把素材依序加入並設定播放時長</p>
        </div>
        <button onClick={openNew} disabled={sites.length === 0}
          className="bg-cyan-600 hover:bg-cyan-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium">
          + 新增播放清單
        </button>
      </div>

      {showForm && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">{editing ? '編輯播放清單' : '新增播放清單'}</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            {!editing && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">所屬廠區 *</label>
                <select required value={form.site_id} onChange={e => setForm({ ...form, site_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500">
                  {sites.map(s => <option key={s.id} value={s.id}>{s.name} ({s.code})</option>)}
                </select>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">名稱 *</label>
              <input type="text" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                placeholder="例如：晨間輪播"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">說明</label>
              <input type="text" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500" />
            </div>
            <div className="flex gap-2">
              <button type="submit" className="bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2 rounded-lg text-sm font-medium">
                {editing ? '更新' : '建立'}
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium">
                取消
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-gray-700">廠區</th>
              <th className="px-4 py-3 text-left font-medium text-gray-700">名稱</th>
              <th className="px-4 py-3 text-left font-medium text-gray-700">說明</th>
              <th className="px-4 py-3 text-right font-medium text-gray-700">操作</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-400">載入中...</td></tr>
            ) : playlists.length === 0 ? (
              <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-400">尚無資料</td></tr>
            ) : playlists.map(p => (
              <tr key={p.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="px-4 py-3">{p.site_name}</td>
                <td className="px-4 py-3 font-medium">{p.name}</td>
                <td className="px-4 py-3 text-gray-600">{p.description || '—'}</td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => openItemsEditor(p)} className="text-cyan-600 hover:underline mr-3">編輯項目</button>
                  <button onClick={() => openEdit(p)} className="text-cyan-600 hover:underline mr-3">編輯</button>
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
                <option value="">+ 選擇素材加入清單</option>
                {availableAssets.map(a => <option key={a.id} value={a.id}>{a.filename}</option>)}
              </select>
              <button
                onClick={() => {
                  const sel = document.getElementById('addAsset') as HTMLSelectElement;
                  if (sel.value) {
                    addItem(Number(sel.value));
                    sel.value = '';
                  }
                }}
                className="bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2 rounded-lg text-sm font-medium">
                加入
              </button>
            </div>

            <div className="space-y-2">
              {items.length === 0 ? (
                <p className="text-gray-400 text-sm text-center py-6">尚未加入任何素材</p>
              ) : items.map((it, idx) => (
                <div key={`${it.asset_id}-${idx}`} className="flex items-center gap-2 bg-gray-50 p-3 rounded-lg">
                  <span className="text-gray-400 w-6">{idx + 1}</span>
                  <span className="flex-1 font-mono text-sm text-gray-700">{it.filename}</span>
                  <div className="flex items-center gap-1 text-sm">
                    <input type="number" min={1} value={it.duration_seconds}
                      onChange={e => updateDuration(idx, Number(e.target.value))}
                      className="w-20 px-2 py-1 border border-gray-300 rounded text-right" />
                    <span className="text-gray-500">秒</span>
                  </div>
                  <button onClick={() => moveItem(idx, -1)} disabled={idx === 0}
                    className="text-gray-500 hover:text-gray-900 disabled:opacity-20 px-2">↑</button>
                  <button onClick={() => moveItem(idx, 1)} disabled={idx === items.length - 1}
                    className="text-gray-500 hover:text-gray-900 disabled:opacity-20 px-2">↓</button>
                  <button onClick={() => removeItem(idx)} className="text-red-500 hover:text-red-700 px-2">✕</button>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between border-t pt-4">
              <span className="text-sm text-gray-500">{itemSaveMsg}</span>
              <div className="flex gap-2">
                <button onClick={() => setItemsEditing(null)} className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium">
                  關閉
                </button>
                <button onClick={saveItems} className="bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2 rounded-lg text-sm font-medium">
                  儲存項目
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
