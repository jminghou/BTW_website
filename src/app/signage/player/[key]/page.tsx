'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams } from 'next/navigation';

interface PlayerItem {
  url: string;
  duration: number;
  filename: string;
  description: string | null;
}

interface PlayerResponse {
  status: 'playing' | 'idle' | 'error';
  message?: string;
  playlist_name?: string;
  playlist_id?: number;
  schedule_id?: number;
  items: PlayerItem[];
  screen_name?: string;
  current_time?: string;
}

const POLL_INTERVAL_MS = 60_000; // 每分鐘輪詢一次排程

export default function PlayerPage() {
  const params = useParams<{ key: string }>();
  const key = params?.key;

  const [data, setData] = useState<PlayerResponse | null>(null);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [showStatus, setShowStatus] = useState(false);
  const playlistSignatureRef = useRef<string>('');

  // ------- 取得排程（含初次與定期重新整理） -------
  const fetchSchedule = useCallback(async () => {
    if (!key) return;
    try {
      const res = await fetch(`/api/signage/player/${encodeURIComponent(key)}`, { cache: 'no-store' });
      const json: PlayerResponse = await res.json();
      setData(json);

      // 若播放清單內容有變，重置 index 從頭開始播
      const sig = JSON.stringify(json.items?.map(i => i.url) ?? []);
      if (sig !== playlistSignatureRef.current) {
        playlistSignatureRef.current = sig;
        setCurrentIdx(0);
      }
    } catch (err) {
      console.error('取得排程失敗：', err);
      setData({ status: 'error', message: '網路錯誤', items: [] });
    }
  }, [key]);

  useEffect(() => {
    fetchSchedule();
    const timer = setInterval(fetchSchedule, POLL_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [fetchSchedule]);

  // ------- 輪播切換邏輯 -------
  useEffect(() => {
    const items = data?.items ?? [];
    if (items.length === 0) return;

    const duration = Math.max(1, items[currentIdx]?.duration ?? 10) * 1000;
    const timer = setTimeout(() => {
      setCurrentIdx(i => (i + 1) % items.length);
    }, duration);
    return () => clearTimeout(timer);
  }, [currentIdx, data]);

  // ------- 快捷鍵：Ctrl+S 切換狀態顯示、Ctrl+R 手動重整 -------
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        setShowStatus(v => !v);
      } else if (e.ctrlKey && e.key === 'r') {
        e.preventDefault();
        fetchSchedule();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [fetchSchedule]);

  // ------- 待機/錯誤畫面 -------
  const items = data?.items ?? [];
  const isIdle = !data || data.status !== 'playing' || items.length === 0;

  if (isIdle) {
    return (
      <div className="fixed inset-0 w-screen h-screen bg-black text-white flex flex-col items-center justify-center">
        <div className="text-6xl mb-4">📺</div>
        <div className="text-2xl mb-2">{data?.status === 'error' ? '系統錯誤' : '待機中'}</div>
        <div className="text-sm opacity-60">{data?.message ?? '目前沒有排程內容'}</div>
        {data?.screen_name && (
          <div className="absolute bottom-4 right-4 text-xs opacity-40">{data.screen_name}</div>
        )}
      </div>
    );
  }

  const current = items[currentIdx];

  return (
    <div className="fixed inset-0 w-screen h-screen bg-black">
      <iframe
        key={current.url}
        src={current.url}
        className="w-full h-full border-0"
        title={current.filename}
      />

      {showStatus && (
        <div className="absolute top-2 left-2 bg-black/70 text-white text-xs px-3 py-2 rounded-lg space-y-1 max-w-xs">
          <div>螢幕：{data?.screen_name}</div>
          <div>清單：{data?.playlist_name}</div>
          <div>項目：{currentIdx + 1} / {items.length}</div>
          <div className="truncate">當前：{current.filename}</div>
          <div>時長：{current.duration} 秒</div>
          <div className="opacity-50 mt-1">Ctrl+S 隱藏 ／ Ctrl+R 重整</div>
        </div>
      )}
    </div>
  );
}
