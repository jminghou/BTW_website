'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';

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
interface Screen { id: number; name: string }
interface Playlist { id: number; name: string }

const WEEK_HEADERS = ['日', '一', '二', '三', '四', '五', '六'];
const DAYS = [
  { v: 1, label: '一' }, { v: 2, label: '二' }, { v: 3, label: '三' },
  { v: 4, label: '四' }, { v: 5, label: '五' }, { v: 6, label: '六' }, { v: 7, label: '日' },
];

function toDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
}
function isoWeekday(d: Date): number {
  return ((d.getDay() + 6) % 7) + 1;
}
/** 依開始時間推餐期標籤與顏色 */
function slotStyle(startTime: string): { label: string; cls: string } {
  const h = parseInt(startTime.substring(0, 2), 10);
  if (h >= 10 && h < 15) return { label: '午', cls: 'bg-amber-100 text-amber-800' };
  if (h >= 15 && h < 20) return { label: '晚', cls: 'bg-indigo-100 text-indigo-800' };
  if (h >= 20 || h < 5) return { label: '宵', cls: 'bg-slate-200 text-slate-700' };
  if (h >= 5 && h < 10) return { label: '早', cls: 'bg-orange-100 text-orange-800' };
  return { label: '', cls: 'bg-cyan-100 text-cyan-800' };
}

interface FormState {
  screen_id: string; playlist_id: string;
  start_time: string; end_time: string;
  days_of_week: number[]; play_date: string;
}

export default function SiteSchedulesPage() {
  const params = useParams<{ siteId: string }>();
  const siteId = params?.siteId;

  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [screens, setScreens] = useState<Screen[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [actionMsg, setActionMsg] = useState('');

  // 月曆游標
  const [cursor, setCursor] = useState(() => { const n = new Date(); return new Date(n.getFullYear(), n.getMonth(), 1); });

  // 新增/編輯排程
  const [editing, setEditing] = useState<Schedule | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<FormState>({
    screen_id: '', playlist_id: '', start_time: '08:00', end_time: '18:00',
    days_of_week: [1, 2, 3, 4, 5], play_date: '',
  });

  // 某日詳情
  const [dayDetail, setDayDetail] = useState<string | null>(null);

  // 餐期排程設定
  interface MealSlotRow { meal_key: 'B' | 'L' | 'D' | 'N'; start_time: string; end_time: string; enabled: boolean }
  const MEAL_LABELS: Record<string, string> = { B: '早餐', L: '午餐', D: '晚餐', N: '宵夜' };
  const [showMealSlots, setShowMealSlots] = useState(false);
  const [mealSlots, setMealSlots] = useState<MealSlotRow[]>([]);
  const [mealSaveMsg, setMealSaveMsg] = useState('');

  const openMealSlots = async () => {
    if (!siteId) return;
    setMealSaveMsg('');
    const res = await fetch(`/api/signage/meal-slots?site_id=${siteId}`);
    const json = await res.json();
    if (json.success) setMealSlots(json.data || []);
    setShowMealSlots(true);
  };

  const updateMealSlot = (key: string, field: 'start_time' | 'end_time' | 'enabled', value: string | boolean) => {
    setMealSlots(prev => prev.map(s => s.meal_key === key ? { ...s, [field]: value } : s));
  };

  const saveMealSlots = async () => {
    if (!siteId) return;
    setMealSaveMsg('儲存中...');
    const res = await fetch('/api/signage/meal-slots', {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ site_id: Number(siteId), slots: mealSlots }),
    });
    const json = await res.json();
    setMealSaveMsg(json.success ? '✅ 已儲存' : `❌ ${json.message}`);
  };

  const load = async () => {
    if (!siteId) return;
    setLoading(true);
    try {
      const [sc, p, allSched] = await Promise.all([
        fetch(`/api/signage/screens?site_id=${siteId}`).then(r => r.json()),
        fetch(`/api/signage/playlists?site_id=${siteId}`).then(r => r.json()),
        fetch(`/api/signage/schedules`).then(r => r.json()),
      ]);
      const siteScreens: Screen[] = sc.success ? sc.data || [] : [];
      setScreens(siteScreens);
      if (p.success) setPlaylists(p.data || []);
      const ids = new Set(siteScreens.map(s => s.id));
      setSchedules((allSched.success ? allSched.data || [] : []).filter((s: Schedule) => ids.has(s.screen_id)));
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, [siteId]);

  // ---- 月曆格子 (6 週 42 格) ----
  const grid = useMemo(() => {
    const year = cursor.getFullYear();
    const month = cursor.getMonth();
    const first = new Date(year, month, 1);
    const start = new Date(year, month, 1 - first.getDay());
    return Array.from({ length: 42 }, (_, i) => {
      const d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
      return { date: d, inMonth: d.getMonth() === month, dateStr: toDateStr(d) };
    });
  }, [cursor]);

  const todayStr = toDateStr(new Date());

  // 某日適用的排程
  const schedulesForDate = (d: Date): Schedule[] => {
    const ds = toDateStr(d);
    const wd = isoWeekday(d);
    return schedules
      .filter(s => {
        const pd = s.play_date ? s.play_date.substring(0, 10) : null;
        if (pd) return pd === ds;
        try { return (JSON.parse(s.days_of_week) as number[]).includes(wd); } catch { return false; }
      })
      .sort((a, b) => a.start_time.localeCompare(b.start_time));
  };

  // ---- 一鍵列表轉排程 ----
  const handleAutoGenerate = async () => {
    if (!siteId) return;
    if (!confirm('將依播放清單內素材的檔名（如 F3_L_2026-05-25）自動判斷餐期與日期，為本廠區所有螢幕產生排程。確定嗎？')) return;
    setBusy(true);
    setActionMsg('');
    try {
      const res = await fetch('/api/signage/schedules/auto-generate', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ site_id: Number(siteId) }),
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

  // ---- 新增/編輯 ----
  const openNew = (prefillDate?: string) => {
    setEditing(null);
    setForm({
      screen_id: screens[0]?.id?.toString() || '',
      playlist_id: playlists[0]?.id?.toString() || '',
      start_time: '08:00', end_time: '18:00',
      days_of_week: prefillDate ? [isoWeekday(new Date(prefillDate))] : [1, 2, 3, 4, 5],
      play_date: prefillDate || '',
    });
    setShowForm(true);
  };
  const openEdit = (s: Schedule) => {
    setEditing(s);
    const days = (() => { try { return JSON.parse(s.days_of_week) as number[]; } catch { return []; } })();
    setForm({
      screen_id: s.screen_id.toString(), playlist_id: s.playlist_id.toString(),
      start_time: s.start_time.substring(0, 5), end_time: s.end_time.substring(0, 5),
      days_of_week: days, play_date: s.play_date ? s.play_date.substring(0, 10) : '',
    });
    setShowForm(true);
  };
  const toggleDay = (d: number) => setForm(f => ({
    ...f, days_of_week: f.days_of_week.includes(d) ? f.days_of_week.filter(x => x !== d) : [...f.days_of_week, d].sort(),
  }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      screen_id: Number(form.screen_id), playlist_id: Number(form.playlist_id),
      start_time: form.start_time, end_time: form.end_time,
      days_of_week: form.days_of_week, play_date: form.play_date || null,
    };
    const url = editing ? `/api/signage/schedules/${editing.id}` : '/api/signage/schedules';
    const res = await fetch(url, { method: editing ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    const json = await res.json();
    if (json.success) { setShowForm(false); await load(); }
    else alert(json.message || '操作失敗');
  };

  const handleDelete = async (id: number) => {
    if (!confirm('確定要刪除此排程嗎？')) return;
    const res = await fetch(`/api/signage/schedules/${id}`, { method: 'DELETE' });
    const json = await res.json();
    if (json.success) await load();
    else alert(json.message || '刪除失敗');
  };

  const monthLabel = `${cursor.getFullYear()}年 ${cursor.getMonth() + 1}月`;
  const noBase = (screens.length === 0 || playlists.length === 0) && !loading;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button onClick={() => openNew()} disabled={screens.length === 0 || playlists.length === 0}
            className="bg-cyan-600 hover:bg-cyan-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium">
            新增排程
          </button>
          <button onClick={handleAutoGenerate} disabled={busy || screens.length === 0}
            className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium">
            一鍵列表轉排程
          </button>
          <button onClick={openMealSlots}
            className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-lg text-sm font-medium">
            餐期排程
          </button>
          {actionMsg && <span className="text-sm text-gray-600 ml-1">{actionMsg}</span>}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setCursor(c => new Date(c.getFullYear(), c.getMonth() - 1, 1))}
            className="bg-gray-500 hover:bg-gray-600 text-white w-10 h-10 rounded-lg">‹</button>
          <button onClick={() => { const n = new Date(); setCursor(new Date(n.getFullYear(), n.getMonth(), 1)); }}
            className="bg-gray-500 hover:bg-gray-600 text-white px-4 h-10 rounded-lg text-sm font-medium">今天</button>
          <button onClick={() => setCursor(c => new Date(c.getFullYear(), c.getMonth() + 1, 1))}
            className="bg-gray-500 hover:bg-gray-600 text-white w-10 h-10 rounded-lg">›</button>
        </div>
      </div>

      {noBase && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-lg text-sm">
          請先在本廠區建立螢幕與播放清單，才能設定排程。
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-lg px-5 py-4">
        <h2 className="text-2xl font-bold text-gray-800">{monthLabel}</h2>
      </div>

      {/* 月曆 */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="grid grid-cols-7 bg-cyan-500 text-white text-center font-medium">
          {WEEK_HEADERS.map(w => <div key={w} className="py-3">{w}</div>)}
        </div>
        <div className="grid grid-cols-7">
          {grid.map(({ date, inMonth, dateStr }, i) => {
            const daySchedules = schedulesForDate(date);
            const isToday = dateStr === todayStr;
            return (
              <button
                key={i}
                onClick={() => setDayDetail(dateStr)}
                className={`min-h-[112px] border-b border-r border-gray-200 p-2 text-left align-top hover:bg-cyan-50/50 transition-colors flex flex-col ${
                  inMonth ? 'bg-white' : 'bg-gray-50'
                } ${i % 7 === 0 ? 'border-l' : ''}`}
              >
                <span className={`text-sm font-medium mb-1 ${
                  inMonth ? 'text-gray-800' : 'text-gray-400'
                } ${isToday ? 'bg-cyan-600 text-white rounded-full w-6 h-6 flex items-center justify-center' : ''}`}>
                  {date.getDate()}
                </span>
                <div className="space-y-1 overflow-hidden">
                  {daySchedules.slice(0, 3).map(s => {
                    const st = slotStyle(s.start_time);
                    return (
                      <div key={s.id} className={`text-[11px] leading-tight px-1.5 py-0.5 rounded truncate ${st.cls}`}>
                        <span className="font-semibold">{st.label}</span> {s.playlist_name}
                      </div>
                    );
                  })}
                  {daySchedules.length > 3 && (
                    <div className="text-[11px] text-gray-400 px-1.5">+{daySchedules.length - 3} 筆…</div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 新增/編輯排程 modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[60] p-4" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[85vh] overflow-y-auto p-6 space-y-4" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-semibold">{editing ? '編輯排程' : '新增排程'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">螢幕 *</label>
                  <select required value={form.screen_id} onChange={e => setForm({ ...form, screen_id: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500">
                    {screens.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">播放清單 *</label>
                  <select required value={form.playlist_id} onChange={e => setForm({ ...form, playlist_id: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500">
                    {playlists.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
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
                <label className="block text-sm font-medium text-gray-700 mb-1">特定日期（選填，設定後優先於星期）</label>
                <input type="date" value={form.play_date} onChange={e => setForm({ ...form, play_date: e.target.value })}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500" />
              </div>
              <div className="flex gap-2">
                <button type="submit" className="bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2 rounded-lg text-sm font-medium">{editing ? '更新' : '建立'}</button>
                <button type="button" onClick={() => setShowForm(false)} className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium">取消</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 某日詳情 modal */}
      {dayDetail && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[60] p-4" onClick={() => setDayDetail(null)}>
          <div className="bg-white rounded-xl max-w-lg w-full max-h-[85vh] overflow-y-auto p-6 space-y-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">{dayDetail} 的排程</h2>
              <button onClick={() => setDayDetail(null)} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">×</button>
            </div>
            {(() => {
              const list = schedulesForDate(new Date(dayDetail));
              if (list.length === 0) return <p className="text-gray-400 text-sm py-4 text-center">這天沒有排程</p>;
              return (
                <div className="space-y-2">
                  {list.map(s => {
                    const st = slotStyle(s.start_time);
                    return (
                      <div key={s.id} className="flex items-center gap-2 bg-gray-50 p-3 rounded-lg">
                        <span className={`text-xs px-2 py-0.5 rounded font-semibold ${st.cls}`}>{st.label}</span>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm truncate">{s.playlist_name}</div>
                          <div className="text-xs text-gray-500">{s.screen_name}｜{s.start_time.substring(0, 5)}–{s.end_time.substring(0, 5)}{s.play_date ? '' : '（每週）'}</div>
                        </div>
                        <button onClick={() => openEdit(s)} className="text-cyan-600 hover:underline text-sm">編輯</button>
                        <button onClick={() => handleDelete(s.id)} className="text-red-600 hover:underline text-sm">刪除</button>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
            <div className="border-t pt-4">
              <button
                onClick={() => { const d = dayDetail; setDayDetail(null); openNew(d); }}
                disabled={screens.length === 0 || playlists.length === 0}
                className="bg-cyan-600 hover:bg-cyan-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium">
                + 在這天新增排程
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 餐期排程設定 modal */}
      {showMealSlots && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[60] p-4" onClick={() => setShowMealSlots(false)}>
          <div className="bg-white rounded-xl max-w-xl w-full max-h-[85vh] overflow-y-auto p-6 space-y-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">餐期排程設定</h2>
              <button onClick={() => setShowMealSlots(false)} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">×</button>
            </div>
            <p className="text-sm text-gray-500">
              「一鍵列表轉排程」會依檔名餐期（B/L/D/N）對應到下列時段。結束時間若早於開始時間，視為**跨日**（自動拆成當日與隔日兩段，適合宵夜）。
            </p>

            <div className="space-y-2">
              <div className="grid grid-cols-[auto_1fr_1fr] gap-3 items-center text-xs font-medium text-gray-500 px-1">
                <span>啟用 / 餐期</span><span>開始時間</span><span>結束時間</span>
              </div>
              {mealSlots.map(s => (
                <div key={s.meal_key} className={`grid grid-cols-[auto_1fr_1fr] gap-3 items-center p-2 rounded-lg ${s.enabled ? 'bg-gray-50' : 'bg-gray-50/50 opacity-60'}`}>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={s.enabled} onChange={e => updateMealSlot(s.meal_key, 'enabled', e.target.checked)} />
                    <span className="font-medium text-sm whitespace-nowrap">{MEAL_LABELS[s.meal_key]} <span className="text-gray-400">({s.meal_key})</span></span>
                  </label>
                  <input type="time" value={s.start_time} disabled={!s.enabled}
                    onChange={e => updateMealSlot(s.meal_key, 'start_time', e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg disabled:bg-gray-100" />
                  <input type="time" value={s.end_time} disabled={!s.enabled}
                    onChange={e => updateMealSlot(s.meal_key, 'end_time', e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg disabled:bg-gray-100" />
                </div>
              ))}
            </div>

            <div className="text-xs text-gray-400">
              範例：宵夜設 21:00 → 02:00，會自動產生「當日 21:00–23:59:59」＋「隔日 00:00–02:00」兩筆排程。
            </div>

            <div className="flex items-center justify-between border-t pt-4">
              <span className="text-sm text-gray-500">{mealSaveMsg}</span>
              <div className="flex gap-2">
                <button onClick={() => setShowMealSlots(false)} className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium">關閉</button>
                <button onClick={saveMealSlots} className="bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2 rounded-lg text-sm font-medium">儲存設定</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
