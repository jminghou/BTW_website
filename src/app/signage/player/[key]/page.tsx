'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import { isImageFilename, type SignageMediaKind } from '@/lib/signage/mediaType';

interface PlayerItem {
  url: string;
  duration: number;
  filename: string;
  description: string | null;
  kind?: SignageMediaKind;
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

const POLL_INTERVAL_MS = 15_000;
const FADE_DURATION_MS = 800;
const READY_SETTLE_MS = 80;
const HTML_READY_FALLBACK_MS = 1600;
const IMAGE_READY_FALLBACK_MS = 400;

type SlotName = 'a' | 'b';
type FrameSlot = {
  item: PlayerItem | null;
};

function isImageItem(item: PlayerItem | null | undefined): boolean {
  if (!item) return false;
  return item.kind === 'image' || isImageFilename(item.filename);
}

function PlayerMedia({
  item,
  opacityClass,
  onReady,
}: {
  item: PlayerItem;
  opacityClass: string;
  onReady?: () => void;
}) {
  const readyRef = useRef(onReady);
  readyRef.current = onReady;
  const common = `absolute inset-0 h-full w-full border-0 bg-black transition-opacity duration-[800ms] ${opacityClass}`;

  if (isImageItem(item)) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={item.url}
        alt={item.filename}
        className={`${common} object-contain`}
        onLoad={() => readyRef.current?.()}
        onError={() => readyRef.current?.()}
      />
    );
  }

  return <iframe src={item.url} className={common} title={item.filename} />;
}

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
  const pendingSlotRef = useRef<SlotName | null>(null);
  const items = data?.items ?? [];

  useEffect(() => {
    pendingSlotRef.current = pendingSlot;
  }, [pendingSlot]);

  const fetchSchedule = useCallback(async () => {
    if (!key) return;
    try {
      const res = await fetch(`/api/signage/player/${encodeURIComponent(key)}`, { cache: 'no-store' });
      const json: PlayerResponse = await res.json();
      setData(json);

      const sig = JSON.stringify((json.items ?? []).map(i => `${i.url}:${i.duration}`));
      if (sig !== playlistSignatureRef.current) {
        playlistSignatureRef.current = sig;
        setCurrentIdx(0);
      }
    } catch (err) {
      console.error('取得排程失敗：', err);
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

  useEffect(() => {
    if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return;
    navigator.serviceWorker.register('/signage-sw.js').catch(err => {
      console.warn('Service Worker 註冊失敗（退回 Layer 1 一般快取）：', err);
    });
  }, []);

  useEffect(() => {
    if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return;
    const urls = (data?.items ?? []).map(i => i.url);
    const sig = urls.join('|');
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

  const rotationKey = items.map(i => `${i.url}:${i.duration}`).join('|');
  const current = items[currentIdx];
  const visible = !pendingSlot && !isFading;

  // 畫面穩定顯示後才開始算停留秒數，避免淡入淡出比停留時間還長而卡住
  useEffect(() => {
    if (items.length <= 1) return;
    if (!visible) return;

    const duration = Math.max(1, items[currentIdx]?.duration ?? 10) * 1000;
    const timer = setTimeout(() => {
      setCurrentIdx(i => (i + 1) % items.length);
    }, duration);
    return () => clearTimeout(timer);
  }, [currentIdx, rotationKey, visible]);

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
    if (pendingFrame.item?.url === current.url && pendingSlot === nextPending) return;

    if (nextPending === 'a') setSlotA({ item: current });
    else setSlotB({ item: current });
    setPendingSlot(nextPending);
    setIsFading(false);
    transitionStartedRef.current = false;
  }, [activeSlot, current, slotA, slotB, pendingSlot]);

  const startTransition = useCallback(() => {
    if (!pendingSlotRef.current) return;
    const nextSlot = pendingSlotRef.current;
    const pendingFrame = nextSlot === 'a' ? slotA : slotB;
    if (!pendingFrame.item) return;
    if (transitionStartedRef.current) return;
    transitionStartedRef.current = true;

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
  }, [slotA, slotB]);

  useEffect(() => {
    if (!pendingSlot) return;
    const pendingFrame = pendingSlot === 'a' ? slotA : slotB;
    if (!pendingFrame.item) return;

    const wait = isImageItem(pendingFrame.item) ? IMAGE_READY_FALLBACK_MS : HTML_READY_FALLBACK_MS;
    if (readyFallbackTimerRef.current) clearTimeout(readyFallbackTimerRef.current);
    readyFallbackTimerRef.current = setTimeout(() => {
      startTransition();
    }, wait);

    return () => {
      if (readyFallbackTimerRef.current) clearTimeout(readyFallbackTimerRef.current);
    };
  }, [pendingSlot, slotA, slotB, startTransition]);

  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      const payload = e.data as { type?: string; href?: string };
      if (!payload || payload.type !== 'signage-ready') return;
      if (!pendingSlotRef.current) return;
      const pendingFrame = pendingSlotRef.current === 'a' ? slotA : slotB;
      if (!pendingFrame.item) return;
      if (payload.href && payload.href !== pendingFrame.item.url) return;
      startTransition();
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [slotA, slotB, startTransition]);

  useEffect(() => {
    return () => {
      if (readyFallbackTimerRef.current) clearTimeout(readyFallbackTimerRef.current);
      if (settleTimerRef.current) clearTimeout(settleTimerRef.current);
      if (fadeTimerRef.current) clearTimeout(fadeTimerRef.current);
    };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        setShowStatus(v => !v);
      } else if (e.ctrlKey && e.altKey && (e.key === 'r' || e.key === 'R')) {
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
  const slotAOpacity = activeSlot === 'a'
    ? (isFading && pendingSlot === 'b' ? 'opacity-0' : 'opacity-100')
    : (pendingSlot === 'a' ? (isFading ? 'opacity-100' : 'opacity-0') : 'opacity-0');
  const slotBOpacity = activeSlot === 'b'
    ? (isFading && pendingSlot === 'a' ? 'opacity-0' : 'opacity-100')
    : (pendingSlot === 'b' ? (isFading ? 'opacity-100' : 'opacity-0') : 'opacity-0');

  return (
    <div className="fixed inset-0 w-screen h-screen overflow-hidden bg-black">
      {slotA.item && (
        <PlayerMedia
          item={slotA.item}
          opacityClass={slotAOpacity}
          onReady={pendingSlot === 'a' ? startTransition : undefined}
        />
      )}

      {slotB.item && (
        <PlayerMedia
          item={slotB.item}
          opacityClass={slotBOpacity}
          onReady={pendingSlot === 'b' ? startTransition : undefined}
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
