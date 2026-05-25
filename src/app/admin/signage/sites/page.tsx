'use client';

import { useEffect, useState } from 'react';

interface Site {
  id: number;
  region_id: number;
  region_name: string | null;
  name: string;
  code: string;
  description: string | null;
}

interface Region {
  id: number;
  name: string;
}

export default function SitesPage() {
  const [sites, setSites] = useState<Site[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState<Site | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ region_id: '', name: '', code: '', description: '' });
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const [s, r] = await Promise.all([
        fetch('/api/signage/sites').then(r => r.json()),
        fetch('/api/signage/regions').then(r => r.json()),
      ]);
      if (s.success) setSites(s.data || []);
      if (r.success) setRegions(r.data || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const openNew = () => {
    setEditing(null);
    setForm({ region_id: regions[0]?.id?.toString() || '', name: '', code: '', description: '' });
    setShowForm(true);
    setError('');
  };

  const openEdit = (s: Site) => {
    setEditing(s);
    setForm({ region_id: s.region_id.toString(), name: s.name, code: s.code, description: s.description ?? '' });
    setShowForm(true);
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const payload: Record<string, unknown> = {
        region_id: Number(form.region_id),
        name: form.name,
        description: form.description,
      };
      if (!editing) payload.code = form.code;
      const url = editing ? `/api/signage/sites/${editing.id}` : '/api/signage/sites';
      const res = await fetch(url, {
        method: editing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (json.success) {
        setShowForm(false);
        await load();
      } else {
        setError(json.message || '操作失敗');
      }
    } catch {
      setError('網路錯誤');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('確定要刪除此廠區嗎？該廠區下的所有螢幕、播放清單也會一併刪除。')) return;
    const res = await fetch(`/api/signage/sites/${id}`, { method: 'DELETE' });
    const json = await res.json();
    if (json.success) await load();
    else alert(json.message || '刪除失敗');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">廠區管理</h1>
          <p className="text-sm text-gray-500 mt-1">區域下的實際廠區。代號用於分類素材，建立後無法修改。</p>
        </div>
        <button
          onClick={openNew}
          disabled={regions.length === 0}
          className="bg-cyan-600 hover:bg-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg text-sm font-medium"
        >
          + 新增廠區
        </button>
      </div>

      {regions.length === 0 && !loading && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-lg text-sm">
          請先建立區域，才能新增廠區。
        </div>
      )}

      {showForm && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">{editing ? '編輯廠區' : '新增廠區'}</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">所屬區域 *</label>
              <select required value={form.region_id} onChange={e => setForm({ ...form, region_id: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500">
                {regions.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">名稱 *</label>
              <input type="text" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                placeholder="例如：台北一廠"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                廠區代號 * {editing && <span className="text-gray-400 text-xs">（建立後無法修改）</span>}
              </label>
              <input type="text" required disabled={!!editing}
                value={form.code}
                onChange={e => setForm({ ...form, code: e.target.value })}
                placeholder="例如：site_001（僅限英文、數字、底線）"
                pattern="[a-zA-Z0-9_]+"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 disabled:bg-gray-100" />
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
              <th className="px-4 py-3 text-left font-medium text-gray-700">ID</th>
              <th className="px-4 py-3 text-left font-medium text-gray-700">區域</th>
              <th className="px-4 py-3 text-left font-medium text-gray-700">名稱</th>
              <th className="px-4 py-3 text-left font-medium text-gray-700">代號</th>
              <th className="px-4 py-3 text-left font-medium text-gray-700">說明</th>
              <th className="px-4 py-3 text-right font-medium text-gray-700">操作</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">載入中...</td></tr>
            ) : sites.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">尚無資料</td></tr>
            ) : sites.map(s => (
              <tr key={s.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="px-4 py-3 text-gray-500">{s.id}</td>
                <td className="px-4 py-3">{s.region_name}</td>
                <td className="px-4 py-3 font-medium">{s.name}</td>
                <td className="px-4 py-3 font-mono text-cyan-600">{s.code}</td>
                <td className="px-4 py-3 text-gray-600">{s.description || '—'}</td>
                <td className="px-4 py-3 text-right">
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
