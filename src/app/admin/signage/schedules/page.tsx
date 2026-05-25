'use client';

import { useEffect, useState } from 'react';

interface Schedule {
  id: number;
  screen_id: number;
  screen_name: string | null;
  playlist_id: number;
  playlist_name: string | null;
  start_time: string;
  end_time: string;
  days_of_week: string;
  play_date: string | null;
}

interface Screen { id: number; name: string; site_name: string | null }
interface Playlist { id: number; name: string; site_id: number; site_name: string | null }

const DAYS = [
  { v: 1, label: '一' },
  { v: 2, label: '二' },
  { v: 3, label: '三' },
  { v: 4, label: '四' },
  { v: 5, label: '五' },
  { v: 6, label: '六' },
  { v: 7, label: '日' },
];

interface FormState {
  screen_id: string;
  playlist_id: string;
  start_time: string;
  end_time: string;
  days_of_week: number[];
  play_date: string;
}

export default function SchedulesPage() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [screens, setScreens] = useState<Screen[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState<Schedule | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [showBatch, setShowBatch] = useState(false);
  const [form, setForm] = useState<FormState>({
    screen_id: '', playlist_id: '',
    start_time: '08:00', end_time: '18:00',
    days_of_week: [1, 2, 3, 4, 5],
    play_date: '',
  });
  const [batchScreens, setBatchScreens] = useState<Set<number>>(new Set());

  const load = async () => {
    setLoading(true);
    try {
      const [s, sc, p] = await Promise.all([
        fetch('/api/signage/schedules').then(r => r.json()),
        fetch('/api/signage/screens').then(r => r.json()),
        fetch('/api/signage/playlists').then(r => r.json()),
      ]);
      if (s.success) setSchedules(s.data || []);
      if (sc.success) setScreens(sc.data || []);
      if (p.success) setPlaylists(p.data || []);
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const openNew = () => {
    setEditing(null);
    setForm({
      screen_id: screens[0]?.id?.toString() || '',
      playlist_id: playlists[0]?.id?.toString() || '',
      start_time: '08:00', end_time: '18:00',
      days_of_week: [1, 2, 3, 4, 5], play_date: '',
    });
    setShowForm(true);
  };

  const openEdit = (s: Schedule) => {
    setEditing(s);
    const days = (() => { try { return JSON.parse(s.days_of_week) as number[]; } catch { return [] } })();
    setForm({
      screen_id: s.screen_id.toString(),
      playlist_id: s.playlist_id.toString(),
      start_time: s.start_time.substring(0, 5),
      end_time: s.end_time.substring(0, 5),
      days_of_week: days,
      play_date: s.play_date ? s.play_date.substring(0, 10) : '',
    });
    setShowForm(true);
  };

  const toggleDay = (d: number) => {
    setForm(f => ({
      ...f,
      days_of_week: f.days_of_week.includes(d) ? f.days_of_week.filter(x => x !== d) : [...f.days_of_week, d].sort(),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      screen_id: Number(form.screen_id),
      playlist_id: Number(form.playlist_id),
      start_time: form.start_time,
      end_time: form.end_time,
      days_of_week: form.days_of_week,
      play_date: form.play_date || null,
    };
    const url = editing ? `/api/signage/schedules/${editing.id}` : '/api/signage/schedules';
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

  const handleBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      screen_ids: Array.from(batchScreens),
      playlist_id: Number(form.playlist_id),
      start_time: form.start_time,
      end_time: form.end_time,
      days_of_week: form.days_of_week,
      play_date: form.play_date || null,
    };
    const res = await fetch('/api/signage/schedules/batch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    if (json.success) {
      setShowBatch(false);
      setBatchScreens(new Set());
      await load();
      alert(`${json.message}`);
    } else alert(json.message || '批次操作失敗');
  };

  const handleDelete = async (id: number) => {
    if (!confirm('確定要刪除此排程嗎？')) return;
    const res = await fetch(`/api/signage/schedules/${id}`, { method: 'DELETE' });
    const json = await res.json();
    if (json.success) await load();
    else alert(json.message || '刪除失敗');
  };

  const formatDays = (json: string) => {
    try {
      const days = JSON.parse(json) as number[];
      return days.map(d => DAYS.find(x => x.v === d)?.label || d).join('、');
    } catch { return json; }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">排程管理</h1>
          <p className="text-sm text-gray-500 mt-1">為螢幕指定時段播放清單。特定日期排程優先於週期性排程。</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowBatch(true)} disabled={screens.length === 0 || playlists.length === 0}
            className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium">
            📋 批次套用
          </button>
          <button onClick={openNew} disabled={screens.length === 0 || playlists.length === 0}
            className="bg-cyan-600 hover:bg-cyan-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium">
            + 新增排程
          </button>
        </div>
      </div>

      {showForm && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">{editing ? '編輯排程' : '新增排程'}</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">螢幕 *</label>
                <select required value={form.screen_id} onChange={e => setForm({ ...form, screen_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500">
                  {screens.map(s => <option key={s.id} value={s.id}>{s.site_name} / {s.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">播放清單 *</label>
                <select required value={form.playlist_id} onChange={e => setForm({ ...form, playlist_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500">
                  {playlists.map(p => <option key={p.id} value={p.id}>{p.site_name} / {p.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">開始時間 *</label>
                <input type="time" required value={form.start_time} onChange={e => setForm({ ...form, start_time: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">結束時間 *</label>
                <input type="time" required value={form.end_time} onChange={e => setForm({ ...form, end_time: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">星期幾</label>
              <div className="flex gap-2">
                {DAYS.map(d => (
                  <button key={d.v} type="button" onClick={() => toggleDay(d.v)}
                    className={`w-10 h-10 rounded-lg border ${form.days_of_week.includes(d.v) ? 'bg-cyan-600 text-white border-cyan-600' : 'bg-white text-gray-700 border-gray-300'}`}>
                    {d.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                特定日期（選填，設定後優先於星期）
              </label>
              <input type="date" value={form.play_date} onChange={e => setForm({ ...form, play_date: e.target.value })}
                className="w-full md:w-auto px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500" />
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

      {/* 批次套用對話框 */}
      {showBatch && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[60] p-4" onClick={() => setShowBatch(false)}>
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[85vh] overflow-y-auto p-6 space-y-4" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-semibold">批次套用排程到多個螢幕</h2>
            <form onSubmit={handleBatch} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">選擇螢幕（多選） *</label>
                <div className="border border-gray-200 rounded-lg max-h-48 overflow-y-auto">
                  {screens.length === 0 ? (
                    <p className="p-4 text-gray-400 text-sm">尚無螢幕</p>
                  ) : screens.map(s => (
                    <label key={s.id} className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-0">
                      <input type="checkbox" checked={batchScreens.has(s.id)}
                        onChange={() => setBatchScreens(prev => {
                          const next = new Set(prev);
                          if (next.has(s.id)) next.delete(s.id); else next.add(s.id);
                          return next;
                        })} />
                      <span className="text-sm">{s.site_name} / {s.name}</span>
                    </label>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-1">已選 {batchScreens.size} 個螢幕</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">播放清單 *</label>
                <select required value={form.playlist_id} onChange={e => setForm({ ...form, playlist_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                  <option value="">請選擇</option>
                  {playlists.map(p => <option key={p.id} value={p.id}>{p.site_name} / {p.name}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">開始 *</label>
                  <input type="time" required value={form.start_time} onChange={e => setForm({ ...form, start_time: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">結束 *</label>
                  <input type="time" required value={form.end_time} onChange={e => setForm({ ...form, end_time: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">星期幾</label>
                <div className="flex gap-2">
                  {DAYS.map(d => (
                    <button key={d.v} type="button" onClick={() => toggleDay(d.v)}
                      className={`w-10 h-10 rounded-lg border ${form.days_of_week.includes(d.v) ? 'bg-cyan-600 text-white border-cyan-600' : 'bg-white text-gray-700 border-gray-300'}`}>
                      {d.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">特定日期（選填）</label>
                <input type="date" value={form.play_date} onChange={e => setForm({ ...form, play_date: e.target.value })}
                  className="px-3 py-2 border border-gray-300 rounded-lg" />
              </div>

              <div className="flex justify-end gap-2 border-t pt-4">
                <button type="button" onClick={() => setShowBatch(false)} className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium">
                  取消
                </button>
                <button type="submit" disabled={batchScreens.size === 0 || !form.playlist_id}
                  className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium">
                  套用到 {batchScreens.size} 個螢幕
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-gray-700">螢幕</th>
              <th className="px-4 py-3 text-left font-medium text-gray-700">播放清單</th>
              <th className="px-4 py-3 text-left font-medium text-gray-700">時段</th>
              <th className="px-4 py-3 text-left font-medium text-gray-700">星期</th>
              <th className="px-4 py-3 text-left font-medium text-gray-700">特定日期</th>
              <th className="px-4 py-3 text-right font-medium text-gray-700">操作</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">載入中...</td></tr>
            ) : schedules.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">尚無排程</td></tr>
            ) : schedules.map(s => (
              <tr key={s.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="px-4 py-3">{s.screen_name}</td>
                <td className="px-4 py-3 font-medium">{s.playlist_name}</td>
                <td className="px-4 py-3 font-mono text-xs">{s.start_time.substring(0, 5)} – {s.end_time.substring(0, 5)}</td>
                <td className="px-4 py-3 text-gray-600">{formatDays(s.days_of_week)}</td>
                <td className="px-4 py-3 text-cyan-700">{s.play_date ? s.play_date.substring(0, 10) : '—'}</td>
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
