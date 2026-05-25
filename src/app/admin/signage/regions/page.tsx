'use client';

import { useEffect, useState } from 'react';

interface Region {
  id: number;
  name: string;
  description: string | null;
  created_at: string;
}

export default function RegionsPage() {
  const [regions, setRegions] = useState<Region[]>([]);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState<Region | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', description: '' });
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/signage/regions');
      const json = await res.json();
      if (json.success) setRegions(json.data || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const openNew = () => {
    setEditing(null);
    setForm({ name: '', description: '' });
    setShowForm(true);
    setError('');
  };

  const openEdit = (r: Region) => {
    setEditing(r);
    setForm({ name: r.name, description: r.description ?? '' });
    setShowForm(true);
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const url = editing ? `/api/signage/regions/${editing.id}` : '/api/signage/regions';
      const method = editing ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
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
    if (!confirm('確定要刪除此區域嗎？該區域下的所有廠區、螢幕、播放清單也會一併刪除。')) return;
    const res = await fetch(`/api/signage/regions/${id}`, { method: 'DELETE' });
    const json = await res.json();
    if (json.success) await load();
    else alert(json.message || '刪除失敗');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">區域管理</h1>
          <p className="text-sm text-gray-500 mt-1">管理地理區域，如北部、中部、南部</p>
        </div>
        <button onClick={openNew} className="bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2 rounded-lg text-sm font-medium">
          + 新增區域
        </button>
      </div>

      {showForm && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">{editing ? '編輯區域' : '新增區域'}</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">名稱 *</label>
              <input type="text" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">說明</label>
              <input type="text" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent" />
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
              <th className="px-4 py-3 text-left font-medium text-gray-700">名稱</th>
              <th className="px-4 py-3 text-left font-medium text-gray-700">說明</th>
              <th className="px-4 py-3 text-right font-medium text-gray-700">操作</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-400">載入中...</td></tr>
            ) : regions.length === 0 ? (
              <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-400">尚無資料</td></tr>
            ) : regions.map(r => (
              <tr key={r.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="px-4 py-3 text-gray-500">{r.id}</td>
                <td className="px-4 py-3 font-medium">{r.name}</td>
                <td className="px-4 py-3 text-gray-600">{r.description || '—'}</td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => openEdit(r)} className="text-cyan-600 hover:underline mr-3">編輯</button>
                  <button onClick={() => handleDelete(r.id)} className="text-red-600 hover:underline">刪除</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
