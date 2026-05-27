'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

interface Screen {
  id: number;
  site_id: number;
  name: string;
  unique_key: string;
  description: string | null;
}

export default function SiteScreensPage() {
  const params = useParams<{ siteId: string }>();
  const siteId = params?.siteId;

  const [screens, setScreens] = useState<Screen[]>([]);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState<Screen | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', description: '' });
  const [error, setError] = useState('');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const load = async () => {
    if (!siteId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/signage/screens?site_id=${siteId}`);
      const json = await res.json();
      if (json.success) setScreens(json.data || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [siteId]);

  const openNew = () => {
    setEditing(null);
    setForm({ name: '', description: '' });
    setShowForm(true);
    setError('');
  };

  const openEdit = (s: Screen) => {
    setEditing(s);
    setForm({ name: s.name, description: s.description ?? '' });
    setShowForm(true);
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const payload: Record<string, unknown> = { name: form.name, description: form.description };
      if (!editing) payload.site_id = Number(siteId);
      const url = editing ? `/api/signage/screens/${editing.id}` : '/api/signage/screens';
      const res = await fetch(url, {
        method: editing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (json.success) { setShowForm(false); await load(); }
      else setError(json.message || '操作失敗');
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
    navigator.clipboard.writeText(`${window.location.origin}/signage/player/${key}`);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">螢幕管理</h1>
        <button onClick={openNew} className="bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2 rounded-lg text-sm font-medium">
          + 新增螢幕
        </button>
      </div>

      {showForm && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">{editing ? '編輯螢幕' : '新增螢幕'}</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
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
              <th className="px-4 py-3 text-left font-medium text-gray-700">螢幕名稱</th>
              <th className="px-4 py-3 text-left font-medium text-gray-700">播放網址（點擊複製）</th>
              <th className="px-4 py-3 text-right font-medium text-gray-700">操作</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={3} className="px-4 py-8 text-center text-gray-400">載入中...</td></tr>
            ) : screens.length === 0 ? (
              <tr><td colSpan={3} className="px-4 py-8 text-center text-gray-400">尚無螢幕</td></tr>
            ) : screens.map(s => (
              <tr key={s.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">
                  {s.name}
                  {s.description && <div className="text-xs text-gray-400">{s.description}</div>}
                </td>
                <td className="px-4 py-3">
                  <button onClick={() => copyPlayerUrl(s.unique_key)} className="font-mono text-xs text-cyan-700 hover:underline text-left" title="點擊複製">
                    /signage/player/{s.unique_key.substring(0, 8)}...
                    {copiedKey === s.unique_key && <span className="ml-2 text-green-600">✓ 已複製</span>}
                  </button>
                </td>
                <td className="px-4 py-3 text-right">
                  <a href={`/signage/player/${s.unique_key}`} target="_blank" rel="noopener noreferrer" className="text-cyan-600 hover:underline mr-3">預覽</a>
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
