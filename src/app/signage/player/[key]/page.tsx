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

const POLL_INTERVAL_MS = 60_000; // 每分鐘輪詢一次（命中邊緣快取不會打 DB，故不增加成本；確保 3 分鐘快取過期後螢幕能盡快抓到新內容）
const FADE_DURATION_MS = 1500;
const READY_SETTLE_MS = 150; // iframe onLoad 後稍等首屏穩定再淡入，降低閃爍感
const READY_FALLBACK_MS = 1600; // 若素材未送 ready 訊號，超時後仍執行切換

type SlotName = 'a' | 'b';
type FrameSlot = {
  item: PlayerItem | null;
};

export default function PlayerPage() {
  const params = useParams<{ key: string }>();
  const key = params?.key;

  const [data, setData] = useState<PlayerResponse | null>(null);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [showStatus, setShowStatus] = useState(false);
  const [slotA, setSlotA] = useState<FrameSlot>({ item: null });
  const [slotB, setSlotB] = useState<FrameSlot>({ item: null });
  const [activeSlot, setActiveSlot] = useState<SlotName>('a');
  const [pendingSlot, setPendingSlot] = useState<SlotName | null>(null);
  const [isFading, setIsFading] = useState(false);
  const playlistSignatureRef = useRef<string>('');
  const swSyncSigRef = useRef<string>('');
  const settleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fadeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const readyFallbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const transitionStartedRef = useRef(false);
  const items = data?.items ?? [];

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
      // 斷網容錯：若已有正在播放的清單，保留現有內容繼續播（靠 Service Worker 快取），
      // 不要因為一次輪詢失敗就跳待機/錯誤畫面。下次輪詢成功會自動恢復。
      setData(prev =>
        prev && prev.status === 'playing' && (prev.items?.length ?? 0) > 0
          ? prev
          : { status: 'error', message: '網路錯誤', items: [] },
      );
    }
  }, [key]);

  useEffect(() => {
    fetchSchedule();
    const timer = setInterval(fetchSchedule, POLL_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [fetchSchedule]);

  // ------- 註冊 Service Worker（Layer 2）：支援的裝置才啟用，離線續播 + 永久快取 -------
  useEffect(() => {
    if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return;
    navigator.serviceWorker.register('/signage-sw.js').catch(err => {
      console.warn('Service Worker 註冊失敗（退回 Layer 1 一般快取）：', err);
    });
  }, []);

  // ------- 清單變動時通知 SW 預抓整份清單、清掉舊版本素材 -------
  useEffect(() => {
    if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return;
    const urls = (data?.items ?? []).map(i => i.url);
    const sig = urls.join('|');
    // 每次輪詢回應都含變動的 current_time，故 data 物件每分鐘都換新；
    // 這裡以「素材網址集合」為準，只有真的換清單/換版本才通知 SW，避免每分鐘重抓。
    if (sig === swSyncSigRef.current) return;
    swSyncSigRef.current = sig;
    if (urls.length === 0) return;
    navigator.serviceWorker.ready.then(reg => {
      const sw = reg.active;
      if (!sw) return;
      sw.postMessage({ type: 'precache', urls });
      sw.postMessage({ type: 'purge', keepUrls: urls });
    }).catch(() => {});
  }, [data]);

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

  // ------- 雙緩衝轉場：預載入新素材後再淡入淡出 -------
  const current = items[currentIdx];
  useEffect(() => {
    if (!current) {
      setSlotA({ item: null });
      setSlotB({ item: null });
      setActiveSlot('a');
      setPendingSlot(null);
      setIsFading(false);
      transitionStartedRef.current = false;
      return;
    }

    const activeFrame = activeSlot === 'a' ? slotA : slotB;
    if (!activeFrame.item) {
      if (activeSlot === 'a') setSlotA({ item: current });
      else setSlotB({ item: current });
      return;
    }

    if (activeFrame.item.url === current.url) return;

    const nextPending: SlotName = activeSlot === 'a' ? 'b' : 'a';
    const pendingFrame = nextPending === 'a' ? slotA : slotB;
    if (pendingFrame.item?.url === current.url) return;

    if (nextPending === 'a') setSlotA({ item: current });
    else setSlotB({ item: current });
    setPendingSlot(nextPending);
    setIsFading(false);
    transitionStartedRef.current = false;
  }, [activeSlot, current, slotA, slotB]);

  const startTransition = useCallback(() => {
    if (!pendingSlot) return;
    const pendingFrame = pendingSlot === 'a' ? slotA : slotB;
    if (!pendingFrame.item) return;
    if (transitionStartedRef.current) return;
    transitionStartedRef.current = true;

    const nextSlot = pendingSlot;
    if (readyFallbackTimerRef.current) clearTimeout(readyFallbackTimerRef.current);
    if (settleTimerRef.current) clearTimeout(settleTimerRef.current);
    if (fadeTimerRef.current) clearTimeout(fadeTimerRef.current);

    settleTimerRef.current = setTimeout(() => {
      setIsFading(true);
      fadeTimerRef.current = setTimeout(() => {
        setActiveSlot(nextSlot);
        setPendingSlot(null);
        setIsFading(false);
        transitionStartedRef.current = false;
      }, FADE_DURATION_MS);
    }, READY_SETTLE_MS);
  }, [pendingSlot, slotA, slotB]);

  useEffect(() => {
    if (!pendingSlot) return;
    const pendingFrame = pendingSlot === 'a' ? slotA : slotB;
    if (!pendingFrame.item) return;
    if (readyFallbackTimerRef.current) clearTimeout(readyFallbackTimerRef.current);

    readyFallbackTimerRef.current = setTimeout(() => {
      startTransition();
    }, READY_FALLBACK_MS);
  }, [pendingSlot, slotA, slotB, startTransition]);

  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      const payload = e.data as { type?: string; href?: string };
      if (!payload || payload.type !== 'signage-ready') return;
      if (!pendingSlot) return;
      const pendingFrame = pendingSlot === 'a' ? slotA : slotB;
      if (!pendingFrame.item) return;
      // 素材頁面回報自身網址；與 pending 素材網址相符才觸發轉場，
      // 避免舊 frame 的延遲訊息誤觸。缺 href 時仍相容觸發。
      if (payload.href && payload.href !== pendingFrame.item.url) return;
      startTransition();
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [pendingSlot, slotA, slotB, startTransition]);

  useEffect(() => {
    return () => {
      if (readyFallbackTimerRef.current) clearTimeout(readyFallbackTimerRef.current);
      if (settleTimerRef.current) clearTimeout(settleTimerRef.current);
      if (fadeTimerRef.current) clearTimeout(fadeTimerRef.current);
    };
  }, []);

  // ------- 快捷鍵：Ctrl+S 切換狀態顯示、Ctrl+R 手動重整 -------
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        setShowStatus(v => !v);
      } else if (e.ctrlKey && e.altKey && (e.key === 'r' || e.key === 'R')) {
        // 緊急復原：解除 Service Worker 註冊並清空快取後重載（退回 Layer 1）
        // 用 Ctrl+Alt+R 避免與瀏覽器 Ctrl+Shift+R 硬重載搶事件
        e.preventDefault();
        (async () => {
          try {
            if ('serviceWorker' in navigator) {
              const regs = await navigator.serviceWorker.getRegistrations();
              await Promise.all(regs.map(r => r.unregister()));
            }
            if ('caches' in window) {
              const names = await caches.keys();
              await Promise.all(names.map(n => caches.delete(n)));
            }
          } catch (err) {
            console.warn('清除 Service Worker / 快取失敗：', err);
          } finally {
            window.location.reload();
          }
        })();
      } else if (e.ctrlKey && e.key === 'r') {
        e.preventDefault();
        fetchSchedule();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [fetchSchedule]);

  // ------- 待機/錯誤畫面 -------
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

  const activeFrame = activeSlot === 'a' ? slotA : slotB;
  const active = activeFrame.item;
  const transitionDurationClass = `duration-[${FADE_DURATION_MS}ms]`;
  const slotASrc = slotA.item ? slotA.item.url : '';
  const slotBSrc = slotB.item ? slotB.item.url : '';
  const slotAOpacity = activeSlot === 'a'
    ? (isFading && pendingSlot === 'b' ? 'opacity-0' : 'opacity-100')
    : (pendingSlot === 'a' ? (isFading ? 'opacity-100' : 'opacity-0') : 'opacity-0');
  const slotBOpacity = activeSlot === 'b'
    ? (isFading && pendingSlot === 'a' ? 'opacity-0' : 'opacity-100')
    : (pendingSlot === 'b' ? (isFading ? 'opacity-100' : 'opacity-0') : 'opacity-0');

  return (
    <div className="fixed inset-0 w-screen h-screen bg-black">
      {slotA.item && (
        <iframe
          src={slotASrc}
          className={`absolute inset-0 w-full h-full border-0 transition-opacity ${transitionDurationClass} ${slotAOpacity}`}
          title={slotA.item.filename}
        />
      )}

      {slotB.item && (
        <iframe
          src={slotBSrc}
          className={`absolute inset-0 w-full h-full border-0 transition-opacity ${transitionDurationClass} ${slotBOpacity}`}
          title={slotB.item.filename}
        />
      )}

      {showStatus && (
        <div className="absolute top-2 left-2 bg-black/70 text-white text-xs px-3 py-2 rounded-lg space-y-1 max-w-xs">
          <div>螢幕：{data?.screen_name}</div>
          <div>清單：{data?.playlist_name}</div>
          <div>項目：{currentIdx + 1} / {items.length}</div>
          <div className="truncate">當前：{active?.filename ?? '載入中'}</div>
          <div>時長：{active?.duration ?? '-'} 秒</div>
          <div className="opacity-50 mt-1">Ctrl+S 隱藏 ／ Ctrl+R 重整 ／ Ctrl+Alt+R 清快取</div>
        </div>
      )}
    </div>
  );
}
