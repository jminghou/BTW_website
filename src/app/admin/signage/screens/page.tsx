'use client';

import { useEffect, useState } from 'react';

interface Screen {
  id: number;
  site_id: number;
  site_name: string | null;
  site_code: string | null;
  name: string;
  unique_key: string;
  description: string | null;
}

interface Site {
  id: number;
  name: string;
  code: string;
}

export default function ScreensPage() {
  const [screens, setScreens] = useState<Screen[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState<Screen | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ site_id: '', name: '', description: '' });
  const [error, setError] = useState('');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const [sc, s] = await Promise.all([
        fetch('/api/signage/screens').then(r => r.json()),
        fetch('/api/signage/sites').then(r => r.json()),
      ]);
      if (sc.success) setScreens(sc.data || []);
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
    setError('');
  };

  const openEdit = (s: Screen) => {
    setEditing(s);
    setForm({ site_id: s.site_id.toString(), name: s.name, description: s.description ?? '' });
    setShowForm(true);
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const payload: Record<string, unknown> = { name: form.name, description: form.description };
      if (!editing) payload.site_id = Number(form.site_id);
      const url = editing ? `/api/signage/screens/${editing.id}` : '/api/signage/screens';
      const res = await fetch(url, {
        method: editing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (json.success) {
        setShowForm(false);
        await load();
      } else setError(json.message || '操作失敗');
    } catch {
      setError('網路錯誤');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('確定要刪除此螢幕嗎？相關排程也會一併刪除。')) return;
    const res = await fetch(`/api/signage/screens/${id}`, { method: 'DELETE' });
    const json = await res.json();
    if (json.success) await load();
    else alert(json.message || '刪除失敗');
  };

  const copyPlayerUrl = (key: string) => {
    const url = `${window.location.origin}/signage/player/${key}`;
    navigator.clipboard.writeText(url);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">螢幕管理</h1>
          <p className="text-sm text-gray-500 mt-1">每個螢幕有唯一 key，在播放設備上開啟對應網址即可播放</p>
        </div>
        <button onClick={openNew} disabled={sites.length === 0}
          className="bg-cyan-600 hover:bg-cyan-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium">
          + 新增螢幕
        </button>
      </div>

      {sites.length === 0 && !loading && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-lg text-sm">
          請先建立廠區，才能新增螢幕。
        </div>
      )}

      {showForm && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">{editing ? '編輯螢幕' : '新增螢幕'}</h2>
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
                placeholder="例如：A 棟大廳"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">說明</label>
              <input type="text" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500" />
            </div>
            {error && <p className="text-red-600 text-sm">{error}</p>}
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
              <th className="px-4 py-3 text-left font-medium text-gray-700">螢幕名稱</th>
              <th className="px-4 py-3 text-left font-medium text-gray-700">播放網址（點擊複製）</th>
              <th className="px-4 py-3 text-right font-medium text-gray-700">操作</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-400">載入中...</td></tr>
            ) : screens.length === 0 ? (
              <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-400">尚無資料</td></tr>
            ) : screens.map(s => (
              <tr key={s.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="px-4 py-3">
                  <div>{s.site_name}</div>
                  <div className="text-xs text-gray-400 font-mono">{s.site_code}</div>
                </td>
                <td className="px-4 py-3 font-medium">
                  {s.name}
                  {s.description && <div className="text-xs text-gray-400">{s.description}</div>}
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => copyPlayerUrl(s.unique_key)}
                    className="font-mono text-xs text-cyan-700 hover:underline text-left"
                    title="點擊複製到剪貼簿"
                  >
                    /signage/player/{s.unique_key.substring(0, 8)}...
                    {copiedKey === s.unique_key && <span className="ml-2 text-green-600">✓ 已複製</span>}
                  </button>
                </td>
                <td className="px-4 py-3 text-right">
                  <a href={`/signage/player/${s.unique_key}`} target="_blank" rel="noopener noreferrer"
                    className="text-cyan-600 hover:underline mr-3">預覽</a>
                  <button onClick={() => openEdit(s)} className="text-cyan-600 hover:underline mr-3">編輯</button>
                  <button onClick={() => handleDelete(s.id)} className="text-red-600 hover:underline">刪除</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
