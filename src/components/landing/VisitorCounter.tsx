'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useFirestore, useMemoFirebase, useDoc } from '@/firebase';
import { doc, runTransaction, serverTimestamp } from 'firebase/firestore';
import { Users, Calendar, Globe, Radio } from 'lucide-react';

/**
 * Struktur data penghitung pengunjung (koleksi `counters`):
 * - counters/visitors                 → total kumulatif (+ ringkasan legacy)
 * - counters/visitors_month_YYYY-MM   → jumlah kunjungan per bulan
 * - counters/visitors_day_YYYY-MM-DD  → jumlah kunjungan per hari
 *
 * Setiap kunjungan menaikkan ketiga dokumen dalam satu transaksi atomik,
 * lalu UI mendengarkan ketiganya secara real-time (onSnapshot).
 * Karena dokumen bulan & hari dikunci berdasarkan tanggal (WIB), angka
 * otomatis "reset" saat berganti hari/bulan tanpa perlu cron.
 */

interface MainStats {
  total?: number;
  today?: number;
  thisMonth?: number;
  lastDate?: string;
  lastMonth?: string;
}

interface PeriodStats {
  count?: number;
}

const TIME_ZONE = 'Asia/Jakarta';

/** Mengembalikan kunci tanggal & bulan berdasarkan zona waktu WIB. */
function getDateKeys(date = new Date()) {
  // en-CA menghasilkan format YYYY-MM-DD
  const dayKey = new Intl.DateTimeFormat('en-CA', {
    timeZone: TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
  return { dayKey, monthKey: dayKey.slice(0, 7) };
}

/** Hook animasi hitung naik agar perubahan angka terasa "live". */
function useCountUp(target: number | null, duration = 900) {
  const [value, setValue] = useState<number | null>(target);
  const fromRef = useRef<number>(target ?? 0);

  useEffect(() => {
    if (target === null) return;
    const from = fromRef.current;
    if (from === target) {
      setValue(target);
      return;
    }
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      const current = Math.round(from + (target - from) * eased);
      setValue(current);
      if (p < 1) raf = requestAnimationFrame(tick);
      else fromRef.current = target;
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      fromRef.current = target;
    };
  }, [target, duration]);

  return value;
}

/** Angka statistik dengan animasi + efek kilat saat bertambah. */
function StatValue({ value, highlight = false }: { value: number | null; highlight?: boolean }) {
  const animated = useCountUp(value);
  const [flash, setFlash] = useState(false);
  const prev = useRef<number | null>(value);

  useEffect(() => {
    if (value !== null && prev.current !== null && value > prev.current) {
      setFlash(true);
      const t = setTimeout(() => setFlash(false), 900);
      prev.current = value;
      return () => clearTimeout(t);
    }
    prev.current = value;
  }, [value]);

  if (animated === null) {
    return <span className="inline-block h-3 w-8 rounded bg-slate-700/70 animate-pulse align-middle" />;
  }

  return (
    <span
      className={[
        'font-mono tabular-nums text-[11px] sm:text-xs transition-all duration-500',
        highlight ? 'font-black text-amber-400' : 'font-bold text-white',
        flash ? 'scale-110 text-emerald-300 drop-shadow-[0_0_6px_rgba(110,231,183,0.7)]' : '',
      ].join(' ')}
    >
      {animated.toLocaleString('id-ID')}
    </span>
  );
}

export function VisitorCounter() {
  const firestore = useFirestore();
  const [keys, setKeys] = useState(() => getDateKeys());

  // Periksa pergantian hari/bulan setiap 30 detik agar listener ikut berpindah
  useEffect(() => {
    const id = setInterval(() => {
      const next = getDateKeys();
      setKeys((prev) => (prev.dayKey === next.dayKey ? prev : next));
    }, 30_000);
    return () => clearInterval(id);
  }, []);

  const mainRef = useMemoFirebase(
    () => (firestore ? doc(firestore, 'counters', 'visitors') : null),
    [firestore]
  );
  const monthRef = useMemoFirebase(
    () => (firestore ? doc(firestore, 'counters', `visitors_month_${keys.monthKey}`) : null),
    [firestore, keys.monthKey]
  );
  const dayRef = useMemoFirebase(
    () => (firestore ? doc(firestore, 'counters', `visitors_day_${keys.dayKey}`) : null),
    [firestore, keys.dayKey]
  );

  const opts = { realtime: true, suppressGlobalError: true } as const;
  const main = useDoc<MainStats>(mainRef, opts);
  const month = useDoc<PeriodStats>(monthRef, opts);
  const day = useDoc<PeriodStats>(dayRef, opts);

  // Catat kunjungan (sekali per sesi browser per hari)
  useEffect(() => {
    if (!firestore) return;
    const { dayKey, monthKey } = keys;
    const sessionKey = `Sampeldes_visit_${dayKey}`;
    if (typeof window === 'undefined' || sessionStorage.getItem(sessionKey)) return;
    sessionStorage.setItem(sessionKey, 'pending');

    const mainDoc = doc(firestore, 'counters', 'visitors');
    const monthDoc = doc(firestore, 'counters', `visitors_month_${monthKey}`);
    const dayDoc = doc(firestore, 'counters', `visitors_day_${dayKey}`);

    runTransaction(firestore, async (tx) => {
      const [mainSnap, monthSnap, daySnap] = await Promise.all([
        tx.get(mainDoc),
        tx.get(monthDoc),
        tx.get(dayDoc),
      ]);
      const m = (mainSnap.data() || {}) as MainStats;

      // Migrasi: jika dokumen periode belum ada, ambil nilai lama dari ringkasan legacy
      const prevMonth = monthSnap.exists()
        ? Number(monthSnap.data()?.count) || 0
        : m.lastMonth === monthKey ? Number(m.thisMonth) || 0 : 0;
      const prevDay = daySnap.exists()
        ? Number(daySnap.data()?.count) || 0
        : m.lastDate === dayKey ? Number(m.today) || 0 : 0;

      const newMonth = prevMonth + 1;
      const newDay = prevDay + 1;
      const newTotal = (Number(m.total) || 0) + 1;

      tx.set(monthDoc, { type: 'visitorMonth', period: monthKey, count: newMonth, updatedAt: serverTimestamp() }, { merge: true });
      tx.set(dayDoc, { type: 'visitorDay', period: dayKey, month: monthKey, count: newDay, updatedAt: serverTimestamp() }, { merge: true });
      tx.set(
        mainDoc,
        {
          total: newTotal,
          thisMonth: newMonth,
          today: newDay,
          lastDate: dayKey,
          lastMonth: monthKey,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
    })
      .then(() => sessionStorage.setItem(sessionKey, 'true'))
      .catch((err) => {
        sessionStorage.removeItem(sessionKey);
        console.debug('Visitor counter tracking info:', err);
      });
  }, [firestore, keys]);

  // Kalkulasi tampilan real-time
  const legacy = main.data;
  const loaded = !main.isLoading && !month.isLoading && !day.isLoading && !!firestore;

  const todayCount = !loaded
    ? null
    : day.data?.count ?? (legacy?.lastDate === keys.dayKey ? Number(legacy?.today) || 0 : 0);

  const monthCount = !loaded
    ? null
    : month.data?.count ?? (legacy?.lastMonth === keys.monthKey ? Number(legacy?.thisMonth) || 0 : 0);

  const totalCount = !loaded ? null : Math.max(Number(legacy?.total) || 0, monthCount ?? 0);

  const monthLabel = new Intl.DateTimeFormat('id-ID', { month: 'long', timeZone: TIME_ZONE }).format(new Date());

  return (
    <div className="inline-flex flex-wrap items-center gap-2 sm:gap-3 rounded-xl sm:rounded-full bg-slate-900/90 border border-amber-500/30 px-3.5 py-1.5 sm:px-4 sm:py-2 backdrop-blur-md shadow-lg text-xs">
      {/* Label & Realtime Indicator */}
      <div className="flex items-center gap-2 pr-1">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
        </span>
        <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-300">
          Pengunjung
        </span>
        <span className="text-[8px] sm:text-[9px] font-semibold uppercase tracking-wider text-amber-400 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded-full flex items-center gap-1">
          <Radio className="h-2 w-2 animate-pulse text-amber-400" />
          Live
        </span>
      </div>

      <div className="hidden sm:block h-3.5 w-px bg-slate-700" />

      {/* Hari Ini */}
      <div className="flex items-center gap-1.5 px-1 text-slate-400">
        <Users className="h-3 w-3 text-amber-400 shrink-0" />
        <span className="text-[10px] sm:text-[11px]">Hari ini:</span>
        <StatValue value={todayCount} />
      </div>

      <div className="h-3.5 w-px bg-slate-700" />

      {/* Bulan Ini */}
      <div className="flex items-center gap-1.5 px-1 text-slate-400" title={`Total kunjungan bulan ${monthLabel}`}>
        <Calendar className="h-3 w-3 text-amber-400 shrink-0" />
        <span className="text-[10px] sm:text-[11px]">Bulan ini:</span>
        <StatValue value={monthCount} />
      </div>

      <div className="h-3.5 w-px bg-slate-700" />

      {/* Total */}
      <div className="flex items-center gap-1.5 pl-1 text-slate-400" title="Total kunjungan sepanjang waktu">
        <Globe className="h-3 w-3 text-amber-400 shrink-0" />
        <span className="text-[10px] sm:text-[11px]">Total:</span>
        <StatValue value={totalCount} highlight />
      </div>
    </div>
  );
}
