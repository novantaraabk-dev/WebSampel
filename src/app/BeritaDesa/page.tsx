'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Header } from '@/components/landing/Header';
import { Footer } from '@/components/landing/Footer';
import { BackgroundPattern } from '@/components/landing/BackgroundPattern';
import { Button } from '@/components/ui/button';
import {
  Calendar,
  User,
  ChevronLeft,
  ChevronRight,
  Search,
  Sparkles,
  ArrowRight,
  Camera,
  Clock,
  TrendingUp,
  X,
  PlayCircle
} from 'lucide-react';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import { News } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

const POPULAR_TAGS = ['PERTANIAN', 'PEMBANGUNAN', 'CILACAP', 'DESA DIGITAL', 'GOTONG ROYONG', 'KESEHATAN'];

const MONTH_NAMES_ID = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

const DAY_NAMES_SHORT = ['MIN', 'SEN', 'SEL', 'RAB', 'KAM', 'JUM', 'SAB'];

// Helper to extract a YYYY-MM-DD date key from news item (Mengutamakan tanggal berita item.date)
function extractNewsDateKey(item: News): string | null {
  // 1. PRIORITAS UTAMA: Tanggal Berita (item.date)
  if (item.date && typeof item.date === 'string' && item.date.trim()) {
    const raw = item.date.trim();

    // Pemetaan nama bulan bahasa Indonesia
    const monthsMap: Record<string, number> = {
      jan: 1, januari: 1,
      feb: 2, februari: 2,
      mar: 3, maret: 3,
      apr: 4, april: 4,
      mei: 5,
      jun: 6, juni: 6,
      jul: 7, juli: 7,
      agu: 8, agustus: 8,
      sep: 9, september: 9,
      okt: 10, oktober: 10,
      nop: 11, nov: 11, november: 11,
      des: 12, desember: 12
    };

    const parts = raw.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(Boolean);
    let day: number | null = null;
    let month: number | null = null;
    let year: number | null = null;

    for (const p of parts) {
      if (/^\d{4}$/.test(p)) {
        year = parseInt(p, 10);
      } else if (/^\d{1,2}$/.test(p) && !day) {
        day = parseInt(p, 10);
      } else if (monthsMap[p] && !month) {
        month = monthsMap[p];
      }
    }

    if (day && month && year) {
      return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    }

    // Format ISO string: YYYY-MM-DD
    const isoMatch = raw.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
    if (isoMatch) {
      return `${isoMatch[1]}-${String(parseInt(isoMatch[2], 10)).padStart(2, '0')}-${String(parseInt(isoMatch[3], 10)).padStart(2, '0')}`;
    }

    // Format DD/MM/YYYY atau DD-MM-YYYY
    const dmyMatch = raw.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
    if (dmyMatch) {
      return `${dmyMatch[3]}-${String(parseInt(dmyMatch[2], 10)).padStart(2, '0')}-${String(parseInt(dmyMatch[1], 10)).padStart(2, '0')}`;
    }

    // Coba standard Date parse
    const parsed = new Date(raw);
    if (!Number.isNaN(parsed.getTime())) {
      return `${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(2, '0')}-${String(parsed.getDate()).padStart(2, '0')}`;
    }
  }

  // 2. FALLBACK HANYA JIKA item.date benar-benar kosong:
  if (item.createdAt?.toDate) {
    const d = item.createdAt.toDate();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }
  if (item.updatedAt?.toDate) {
    const d = item.updatedAt.toDate();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  return null;
}

const DEFAULT_SAMPLE_NEWS: News[] = [
  {
    id: 'karnaval-hut-ri-81',
    title: 'DIRGAHAYU KARNAVAL HUT RI KE 81 DESA SAMPELDES',
    subtitle: 'Masyarakat Desa Sampeldes tumpah ruah merayakan peringatan Hari Kemerdekaan Republik Indonesia dengan parade budaya dan pakaian adat nusantara.',
    date: '18 AGUSTUS 2026',
    author: 'MIMIN DESA SAMPELDES',
    isHeadline: true,
    imageUrl: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?q=80&w=1200',
    imageUrls: [
      'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?q=80&w=1200',
      'https://images.unsplash.com/photo-1511632765486-a01980e01a18?q=80&w=600',
      'https://images.unsplash.com/photo-1531206715517-5c0ba140b2b8?q=80&w=600',
      'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?q=80&w=600'
    ]
  },
  {
    id: 'blt-dd-2026',
    title: 'PENYALURAN BLT-DD TAHUN 2026 DESA SAMPELDES',
    subtitle: 'Penyaluran BLT-DD Tahun 2026 Bulan Juni - September kepada 10 Keluarga Penerima Manfaat (KPM) bertempat di Balai Desa Sampeldes.',
    date: 'JUMAT, 04 SEPTEMBER 2026',
    author: 'MIMIN DESA SAMPELDES',
    imageUrl: 'https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?q=80&w=1200',
    imageUrls: [
      'https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?q=80&w=1200',
      'https://images.unsplash.com/photo-1577495508048-b635879837f1?q=80&w=600',
      'https://images.unsplash.com/photo-1593113598332-cd288d649433?q=80&w=600',
      'https://images.unsplash.com/photo-1544717305-2782549b5136?q=80&w=600'
    ]
  },
  {
    id: 'musrenbang-desa',
    title: 'MUSRENBANG DESA SAMPELDES TAHUN ANGGARAN 2027',
    subtitle: 'Musyawarah Perencanaan Pembangunan Desa Sampeldes guna menyepakati prioritas kegiatan pembangunan dan pemberdayaan masyarakat desa.',
    date: 'SENIN, 14 SEPTEMBER 2026',
    author: 'MIMIN DESA SAMPELDES',
    imageUrl: 'https://images.unsplash.com/photo-1517048676732-d65bc937f952?q=80&w=800',
    imageUrls: [
      'https://images.unsplash.com/photo-1517048676732-d65bc937f952?q=80&w=800',
      'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?q=80&w=600'
    ]
  },
  {
    id: 'bimtek-jagung',
    title: 'BIMBINGAN TEKNIS PENINGKATAN PRODUKSI JAGUNG',
    subtitle: 'Pelatihan teknis budidaya jagung hibrida dan pengendalian hama terpadu bersama kelompok tani Makmur Jaya Desa Sampeldes.',
    date: 'RABU, 16 SEPTEMBER 2026',
    author: 'MIMIN DESA SAMPELDES',
    imageUrl: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?q=80&w=800',
    imageUrls: ['https://images.unsplash.com/photo-1500382017468-9049fed747ef?q=80&w=800']
  },
  {
    id: 'pemilihan-rt-rw-02',
    title: 'PEMILIHAN KETUA RT DAN RW 02 DUSUN SAMPELDES',
    subtitle: 'Prosesi pemilihan ketua RT dan RW 02 berlangsung tertib dan demokratis dengan partisipasi antusias dari seluruh warga lingkungan.',
    date: 'MINGGU, 6 SEPTEMBER 2026',
    author: 'MIMIN DESA SAMPELDES',
    imageUrl: 'https://images.unsplash.com/photo-1540910419892-4a36d2c3266c?q=80&w=800',
    imageUrls: ['https://images.unsplash.com/photo-1540910419892-4a36d2c3266c?q=80&w=800']
  },
  {
    id: 'pemilihan-rt-rw-01',
    title: 'PEMILIHAN KETUA RT DAN RW 01 DUSUN SAMPELDES',
    subtitle: 'Musyawarah warga dusun dalam menetapkan pengurus rukun tetangga dan rukun warga masa bakti 2026-2031.',
    date: 'SABTU, 5 SEPTEMBER 2026',
    author: 'MIMIN DESA SAMPELDES',
    imageUrl: 'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?q=80&w=800',
    imageUrls: ['https://images.unsplash.com/photo-1517457373958-b7bdd4587205?q=80&w=800']
  }
];

export default function PublicBeritaListPage() {
  const firestore = useFirestore();
  const [searchQueryText, setSearchQueryText] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState(6);

  // Digital clock live time
  const [currentTime, setCurrentTime] = useState<Date | null>(null);

  // Calendar month state
  const [calendarMonth, setCalendarMonth] = useState<Date>(() => new Date(2026, 9, 8)); // Oktober 2026

  const carouselRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setCurrentTime(new Date());
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const newsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'news'), orderBy('updatedAt', 'desc'));
  }, [firestore]);

  const { data: allNews, isLoading } = useCollection<News>(newsQuery);

  const effectiveNews = useMemo(() => {
    if (allNews && allNews.length > 0) return allNews;
    return DEFAULT_SAMPLE_NEWS;
  }, [allNews]);

  // Map of dateKey -> array of news items for calendar highlights
  const newsDateMap = useMemo(() => {
    const map: Record<string, News[]> = {};
    effectiveNews.forEach((item) => {
      const key = extractNewsDateKey(item);
      if (key) {
        if (!map[key]) map[key] = [];
        map[key].push(item);
      }
    });
    return map;
  }, [effectiveNews]);

  // Filtered news based on search, tag, or calendar date
  const filteredNews = useMemo(() => {
    return effectiveNews.filter((item) => {
      const q = searchQueryText.toLowerCase().trim();
      const matchesSearch = !q ||
        item.title?.toLowerCase().includes(q) ||
        item.subtitle?.toLowerCase().includes(q) ||
        item.author?.toLowerCase().includes(q);

      const matchesTag = !selectedTag ||
        item.title?.toLowerCase().includes(selectedTag.toLowerCase()) ||
        item.subtitle?.toLowerCase().includes(selectedTag.toLowerCase()) ||
        item.content?.toLowerCase().includes(selectedTag.toLowerCase());

      const itemDateKey = extractNewsDateKey(item);
      const matchesDate = !selectedCalendarDate || itemDateKey === selectedCalendarDate;

      return matchesSearch && matchesTag && matchesDate;
    });
  }, [effectiveNews, searchQueryText, selectedTag, selectedCalendarDate]);

  // Main headline and feed separation
  const { headline, topStories, infoPentingList, feed } = useMemo(() => {
    const sorted = [...effectiveNews];
    const headlines = sorted.filter(n => n.isHeadline);
    const mainHeadline = headlines.length > 0 ? headlines[0] : sorted[0];

    // Top horizontal stories
    const stories = sorted.slice(0, 10);

    // Info penting top 4 items
    const infoItems = sorted.filter(n => n.id !== mainHeadline.id).slice(0, 4);

    // Feed items from filtered set
    const feedItems = filteredNews.filter(n => n.id !== mainHeadline.id || Boolean(searchQueryText || selectedTag || selectedCalendarDate));

    return {
      headline: mainHeadline,
      topStories: stories,
      infoPentingList: infoItems.length > 0 ? infoItems : sorted.slice(0, 4),
      feed: feedItems
    };
  }, [effectiveNews, filteredNews, searchQueryText, selectedTag, selectedCalendarDate]);

  // Carousel scroll functions
  const scrollCarousel = (direction: 'left' | 'right') => {
    if (carouselRef.current) {
      const amount = direction === 'left' ? -340 : 340;
      carouselRef.current.scrollBy({ left: amount, behavior: 'smooth' });
    }
  };

  // Calendar calculations
  const calendarYear = calendarMonth.getFullYear();
  const calendarMonthIndex = calendarMonth.getMonth();

  const calendarDays = useMemo(() => {
    const firstDayOfMonth = new Date(calendarYear, calendarMonthIndex, 1).getDay(); // 0 = Sun
    const totalDays = new Date(calendarYear, calendarMonthIndex + 1, 0).getDate();
    const prevMonthTotalDays = new Date(calendarYear, calendarMonthIndex, 0).getDate();

    const days: Array<{ dayNumber: number; monthOffset: number; dateKey: string; isCurrentMonth: boolean }> = [];

    // Previous month filler days
    for (let i = firstDayOfMonth - 1; i >= 0; i--) {
      const day = prevMonthTotalDays - i;
      const prevDate = new Date(calendarYear, calendarMonthIndex - 1, day);
      const key = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      days.push({ dayNumber: day, monthOffset: -1, dateKey: key, isCurrentMonth: false });
    }

    // Current month days
    for (let i = 1; i <= totalDays; i++) {
      const key = `${calendarYear}-${String(calendarMonthIndex + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      days.push({ dayNumber: i, monthOffset: 0, dateKey: key, isCurrentMonth: true });
    }

    // Next month filler days (fill to 35 or 42 cells)
    const totalCells = days.length <= 35 ? 35 : 42;
    const remaining = totalCells - days.length;
    for (let i = 1; i <= remaining; i++) {
      const nextDate = new Date(calendarYear, calendarMonthIndex + 1, i);
      const key = `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      days.push({ dayNumber: i, monthOffset: 1, dateKey: key, isCurrentMonth: false });
    }

    return days;
  }, [calendarYear, calendarMonthIndex]);

  const todayKey = useMemo(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  }, []);

  return (
    <div className="relative flex min-h-screen flex-col bg-[#F8FAFC] dark:bg-[#060b11] text-slate-900 dark:text-slate-100 overflow-x-hidden font-sans">
      <BackgroundPattern />
      <Header />

      <main className="relative flex-1 pt-20 sm:pt-24 pb-16 sm:pb-24">

        {/* CONTAINER UTAMA */}
        <div className="container mx-auto px-3 sm:px-6 lg:px-8 space-y-6 sm:space-y-8 max-w-7xl">

          {/* 1. TOP SECTION: HORIZONTAL STORY CAROUSEL STRIP */}
          <section className="relative pt-2">
            <div className="flex items-center justify-between mb-2 sm:mb-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 shadow-[0_0_8px_rgba(5,150,105,0.6)] animate-pulse" />
                <h3 className="text-xs sm:text-sm font-sans font-extrabold uppercase tracking-wider text-slate-800">
                  Dokumentasi &amp; Warta Kegiatan
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => scrollCarousel('left')}
                  aria-label="Scroll Kiri"
                  className="neu-btn-circle w-8 h-8 text-slate-700 hover:text-emerald-800 transition-all cursor-pointer"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  onClick={() => scrollCarousel('right')}
                  aria-label="Scroll Kanan"
                  className="neu-btn-circle w-8 h-8 text-slate-700 hover:text-emerald-800 transition-all cursor-pointer"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div
              ref={carouselRef}
              className="flex gap-3.5 sm:gap-4 overflow-x-auto scroll-smooth scrollbar-none no-scrollbar pb-3 -mx-3 px-3 sm:mx-0 sm:px-0"
            >
              {isLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="w-[160px] sm:w-[195px] shrink-0 space-y-2">
                    <Skeleton className="aspect-[16/10] w-full rounded-2xl" />
                    <Skeleton className="h-4 w-full rounded" />
                    <Skeleton className="h-3 w-2/3 rounded" />
                  </div>
                ))
              ) : topStories.map((item) => {
                const thumb = item.imageUrls?.[0] || item.imageUrl || 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?q=80&w=800';
                return (
                  <Link
                    key={item.id}
                    href={`/BeritaDesa/detail?id=${item.id}`}
                    className="neu-convex group shrink-0 w-[160px] sm:w-[195px] p-2.5 rounded-2xl transition-all duration-300 hover:-translate-y-1"
                  >
                    <div className="neu-inset p-1 rounded-xl mb-1.5 overflow-hidden">
                      <div className="aspect-[16/10] w-full rounded-lg overflow-hidden bg-slate-200 relative">
                        <img
                          src={thumb}
                          alt={item.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          loading="lazy"
                        />
                        {(item.imageUrls?.length || 0) > 1 && (
                          <span className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded-full bg-slate-950/80 text-white text-[8px] font-bold">
                            📸 {item.imageUrls?.length}
                          </span>
                        )}
                      </div>
                    </div>
                    <h4 className="text-[11px] sm:text-xs font-sans font-bold uppercase leading-snug line-clamp-2 text-slate-900 group-hover:text-emerald-800 transition-colors tracking-tight">
                      {item.title}
                    </h4>
                  </Link>
                );
              })}
            </div>
          </section>

          {/* 2. HEADLINE ROW (2 COLUMNS: LARGE HEADLINE BANNER + INFO PENTING & TOPIK POPULER) */}
          <section className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 items-stretch">

            {/* LEFT: GIANT HEADLINE CARD (COL 8) */}
            <div className="lg:col-span-8 h-full">
              {isLoading ? (
                <Skeleton className="h-[360px] sm:h-[430px] w-full rounded-[28px] sm:rounded-[36px]" />
              ) : headline ? (
                <Link
                  href={`/BeritaDesa/detail?id=${headline.id}`}
                  className="neu-card-elevated group relative block rounded-[28px] sm:rounded-[36px] overflow-hidden h-[360px] sm:h-[430px] w-full transition-all duration-300 hover:scale-[1.008]"
                >
                  <img
                    src={headline.imageUrls?.[0] || headline.imageUrl || 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?q=80&w=1200'}
                    alt={headline.title}
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-slate-950/45 to-transparent" />

                  <div className="absolute inset-0 p-5 sm:p-8 md:p-10 flex flex-col justify-end space-y-3 sm:space-y-4">
                    {/* Badge Berita Utama */}
                    <div>
                      <span className="neu-pill-elevated inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-slate-900 text-[10px] sm:text-xs font-sans font-bold uppercase tracking-wider">
                        <Sparkles className="h-3 w-3 text-emerald-700" />
                        BERITA UTAMA
                      </span>
                    </div>

                    {/* Judul Besar */}
                    <h2 className="text-xl sm:text-3xl md:text-4xl lg:text-5xl font-display font-light uppercase text-white tracking-tight leading-[0.95] drop-shadow-md line-clamp-3 group-hover:text-amber-300 transition-colors">
                      {headline.title}
                    </h2>

                    {/* Metadata */}
                    <div className="flex flex-wrap items-center gap-3 sm:gap-5 text-xs font-semibold text-slate-300">
                      <span className="inline-flex items-center gap-1.5 font-sans font-bold uppercase tracking-wider text-[11px] sm:text-xs">
                        <Calendar className="h-3.5 w-3.5 text-amber-400" />
                        {headline.date}
                      </span>
                      <span className="inline-flex items-center gap-1.5 font-sans font-bold uppercase tracking-wider text-[11px] sm:text-xs text-emerald-300">
                        <User className="h-3.5 w-3.5" />
                        {headline.author || 'MIMIN DESA SAMPELDES'}
                      </span>
                    </div>
                  </div>
                </Link>
              ) : null}
            </div>

            {/* RIGHT: INFO PENTING + TOPIK POPULER (COL 4) */}
            <div className="lg:col-span-4 flex flex-col justify-between gap-4">

              {/* WIDGET: INFO PENTING NEUMORPHIC */}
              <div className="neu-card-elevated rounded-[28px] p-5 sm:p-6 text-slate-900 space-y-4 relative overflow-hidden flex-1">
                <div className="absolute top-4 right-4 text-emerald-700/10 pointer-events-none">
                  <TrendingUp className="h-16 w-16" />
                </div>

                <div className="flex items-center justify-between border-b border-stone-300/60 pb-3 relative z-10">
                  <h3 className="font-display font-light tracking-wider uppercase text-base sm:text-lg text-slate-900">
                    INFO <span className="font-bold text-emerald-800">PENTING</span>
                  </h3>
                  <span className="neu-pill px-2.5 py-0.5 rounded-full text-[9px] font-sans uppercase tracking-widest text-emerald-800 font-bold">
                    SAMPELDES
                  </span>
                </div>

                <div className="space-y-3 relative z-10">
                  {infoPentingList.map((item, idx) => (
                    <Link
                      key={item.id}
                      href={`/BeritaDesa/detail?id=${item.id}`}
                      className="group flex items-start gap-3 py-1.5 border-b border-stone-200/50 last:border-b-0"
                    >
                      <span className="font-display font-light text-2xl text-emerald-800 shrink-0 leading-none">
                        0{idx + 1}
                      </span>
                      <div className="min-w-0 flex-1 space-y-0.5">
                        <h4 className="text-xs font-sans font-bold uppercase leading-snug line-clamp-2 text-slate-900 group-hover:text-emerald-800 transition-colors">
                          {item.title}
                        </h4>
                        <p className="text-[10px] text-slate-500 font-medium font-sans">
                          {item.date}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>

              {/* WIDGET: TOPIK POPULER */}
              <div className="space-y-2 pt-1">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-3.5 bg-emerald-700 rounded-full" />
                  <span className="font-sans font-extrabold uppercase text-xs tracking-wider text-slate-800">
                    TOPIK POPULER
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {POPULAR_TAGS.map((tag) => {
                    const isSelected = selectedTag === tag;
                    return (
                      <button
                        key={tag}
                        onClick={() => setSelectedTag(isSelected ? null : tag)}
                        className={cn(
                          "rounded-full text-[10.5px] font-sans font-bold uppercase px-3.5 py-1 transition-all cursor-pointer",
                          isSelected
                            ? "neu-btn-dark font-bold text-white shadow-sm"
                            : "neu-pill text-slate-700 hover:text-slate-900 hover:-translate-y-0.5"
                        )}
                      >
                        #{tag}
                      </button>
                    );
                  })}
                </div>
              </div>

            </div>
          </section>

          {/* 3. SECTION HEADER: "BERITA TERBARU" + SEARCH BAR */}
          <section className="pt-4 sm:pt-6 border-t border-stone-300/60 flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h2 className="text-2xl sm:text-4xl font-display font-light text-slate-900 uppercase tracking-tight">
                  BERITA <span className="font-bold text-emerald-800">TERBARU</span>
                </h2>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 font-sans font-medium">
                Kumpulan dokumentasi kegiatan, informasi resmi, dan artikel pembangunan Desa Sampeldes.
              </p>
            </div>

            {/* Quick search input Neumorphic */}
            <div className="neu-inset rounded-full relative w-full md:w-80 flex items-center px-3.5">
              <Search className="h-4 w-4 text-slate-400 shrink-0" />
              <Input
                value={searchQueryText}
                onChange={(e) => setSearchQueryText(e.target.value)}
                placeholder="Cari berita desa..."
                className="pl-2 pr-7 h-11 bg-transparent border-0 text-slate-900 text-xs shadow-none focus-visible:ring-0 placeholder:text-slate-500"
              />
              {searchQueryText && (
                <button
                  onClick={() => setSearchQueryText('')}
                  className="text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </section>

          {/* Active filters notice if any */}
          {(selectedTag || selectedCalendarDate || searchQueryText) && (
            <div className="flex flex-wrap items-center gap-2 p-3 bg-white rounded-2xl border border-stone-200 text-xs">
              <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">Filter Aktif:</span>
              {selectedTag && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-900 text-white text-[10px] font-bold">
                  Topik: #{selectedTag}
                  <button onClick={() => setSelectedTag(null)}><X className="h-3 w-3" /></button>
                </span>
              )}
              {selectedCalendarDate && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-700 text-white text-[10px] font-bold">
                  Tanggal: {selectedCalendarDate}
                  <button onClick={() => setSelectedCalendarDate(null)}><X className="h-3 w-3" /></button>
                </span>
              )}
              {searchQueryText && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-200 text-slate-800 text-[10px] font-bold">
                  Kata Kunci: "{searchQueryText}"
                  <button onClick={() => setSearchQueryText('')}><X className="h-3 w-3" /></button>
                </span>
              )}
              <button
                onClick={() => {
                  setSelectedTag(null);
                  setSelectedCalendarDate(null);
                  setSearchQueryText('');
                }}
                className="text-[10px] font-black uppercase text-rose-600 hover:underline ml-auto"
              >
                Reset Semua Filter
              </button>
            </div>
          )}

          {/* 4. MAIN CONTENT GRID (2 COLUMNS: LARGE MULTI-PHOTO FEED + SIDEBAR WIDGETS) */}
          <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-start">

            {/* LEFT: FEED BERITA UTAMA DENGAN MULTI-PHOTO GRID (COL 8) */}
            <div className="lg:col-span-8 space-y-6">
              {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="bg-white rounded-[2.5rem] border border-stone-200 p-6 space-y-4">
                    <Skeleton className="aspect-video w-full rounded-2xl" />
                    <Skeleton className="h-6 w-3/4 rounded" />
                    <Skeleton className="h-4 w-1/2 rounded" />
                  </div>
                ))
              ) : feed.length === 0 ? (
                <div className="bg-white p-10 rounded-[2.5rem] border border-stone-200 text-center space-y-3">
                  <Search className="h-10 w-10 text-slate-300 mx-auto" />
                  <h3 className="text-base font-condensed font-extrabold uppercase text-slate-700">
                    Tidak ada berita ditemukan
                  </h3>
                  <p className="text-xs text-slate-500">
                    Tidak ditemukan berita dengan filter atau pencarian saat ini.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedTag(null);
                      setSelectedCalendarDate(null);
                      setSearchQueryText('');
                    }}
                    className="rounded-full text-xs font-bold"
                  >
                    Tampilkan Semua Berita
                  </Button>
                </div>
              ) : (
                feed.slice(0, visibleCount).map((item) => {
                  const images = item.imageUrls && item.imageUrls.length > 0
                    ? item.imageUrls.filter(Boolean)
                    : (item.imageUrl ? [item.imageUrl] : []);
                  const photoCount = images.length;
                  const mainImage = images[0] || 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?q=80&w=1200';
                  const extraImages = images.slice(1, 4);

                  return (
                    <article
                      key={item.id}
                      className="neu-card-elevated rounded-[28px] sm:rounded-[36px] p-4 sm:p-6 space-y-4 hover:-translate-y-1 transition-all duration-300 group overflow-hidden"
                    >
                      {/* MULTI-PHOTO GALLERY GRID */}
                      <Link href={`/BeritaDesa/detail?id=${item.id}`} className="block space-y-2.5">
                        {/* Top Large Photo in Recessed Well */}
                        <div className="neu-inset p-1.5 sm:p-2 rounded-2xl sm:rounded-[22px]">
                          <div className="aspect-[16/10] sm:aspect-[16/9] w-full rounded-xl sm:rounded-[18px] overflow-hidden bg-slate-200 relative">
                            <img
                              src={mainImage}
                              alt={item.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                              loading="lazy"
                            />
                          </div>
                        </div>

                        {/* Bottom Row of 3 Photos (if 4+ photos) */}
                        {photoCount >= 4 && (
                          <div className="grid grid-cols-3 gap-2 sm:gap-2.5">
                            {extraImages.map((imgUrl, idx) => (
                              <div
                                key={idx}
                                className="neu-inset p-1 rounded-xl"
                              >
                                <div className="aspect-[4/3] rounded-lg overflow-hidden bg-slate-200 relative">
                                  <img
                                    src={imgUrl}
                                    alt={`${item.title} - foto ${idx + 2}`}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                    loading="lazy"
                                  />
                                  {idx === 2 && photoCount > 4 && (
                                    <div className="absolute inset-0 bg-slate-950/60 flex items-center justify-center text-white font-bold text-xs uppercase tracking-wider backdrop-blur-[1px]">
                                      +{photoCount - 4} FOTO
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* If 2 or 3 photos */}
                        {photoCount === 2 && (
                          <div className="neu-inset p-1 rounded-xl">
                            <div className="aspect-[16/8] rounded-lg overflow-hidden bg-slate-200">
                              <img src={images[1]} alt={item.title} className="w-full h-full object-cover" />
                            </div>
                          </div>
                        )}
                        {photoCount === 3 && (
                          <div className="grid grid-cols-2 gap-2">
                            {images.slice(1, 3).map((imgUrl, idx) => (
                              <div key={idx} className="neu-inset p-1 rounded-xl">
                                <div className="aspect-[16/9] rounded-lg overflow-hidden bg-slate-200">
                                  <img src={imgUrl} alt={item.title} className="w-full h-full object-cover" />
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </Link>

                      {/* ARTICLE DETAILS */}
                      <div className="space-y-1.5 pt-1">
                        {/* Meta row: Date on left, Author on right */}
                        <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider">
                          <span className="text-emerald-800 font-sans">
                            {item.date}
                          </span>
                          <span className="text-slate-500 font-sans text-[10.5px]">
                            PENULIS: {item.author || 'MIMIN DESA SAMPELDES'}
                          </span>
                        </div>

                        {/* Title */}
                        <Link href={`/BeritaDesa/detail?id=${item.id}`}>
                          <h3 className="text-lg sm:text-2xl font-display font-light uppercase tracking-tight text-slate-900 leading-snug group-hover:text-emerald-800 transition-colors line-clamp-2">
                            {item.title}
                          </h3>
                        </Link>

                        {/* Excerpt */}
                        {item.subtitle && (
                          <p className="text-xs sm:text-sm text-slate-600 line-clamp-2 leading-relaxed font-sans">
                            {item.subtitle}
                          </p>
                        )}
                      </div>

                      {/* BOTTOM ACTION BAR */}
                      <div className="pt-2 flex items-center justify-between border-t border-stone-300/60">
                        <Link href={`/BeritaDesa/detail?id=${item.id}`}>
                          <button
                            type="button"
                            className="neu-btn inline-flex items-center gap-1.5 px-4 sm:px-5 py-2 rounded-full text-slate-900 hover:text-emerald-800 transition-all text-xs font-sans font-bold uppercase tracking-wider cursor-pointer"
                          >
                            <span>Baca Selengkapnya</span>
                            <ArrowRight className="h-3.5 w-3.5" />
                          </button>
                        </Link>

                        {photoCount > 0 && (
                          <div className="neu-pill inline-flex items-center gap-1 px-3 py-1 rounded-full text-emerald-800 font-sans font-bold uppercase text-[10px] sm:text-xs tracking-wider">
                            <Camera className="h-3.5 w-3.5 text-emerald-700" />
                            <span>{photoCount} FOTO</span>
                          </div>
                        )}
                      </div>
                    </article>
                  );
                })
              )}

              {/* Load More Button */}
              {feed.length > visibleCount && (
                <div className="text-center pt-4">
                  <button
                    onClick={() => setVisibleCount((prev) => prev + 4)}
                    className="neu-btn px-8 h-12 rounded-full text-slate-900 hover:text-emerald-800 font-sans font-bold uppercase text-xs tracking-wider cursor-pointer transition-all hover:scale-105 active:scale-95"
                  >
                    Muat Lebih Banyak Berita
                  </button>
                </div>
              )}
            </div>

            {/* RIGHT: SIDEBAR WIDGETS (WAKTU REAL-TIME + KALENDER + ARSIP BERITA) (COL 4) */}
            <aside className="lg:col-span-4 space-y-6">

              {/* WIDGET 1: WAKTU REAL-TIME NEUMORPHIC */}
              <div className="neu-card-elevated rounded-[28px] p-5 sm:p-6 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 shadow-[0_0_8px_rgba(5,150,105,0.6)] animate-pulse" />
                    <span className="font-sans font-bold uppercase tracking-wider text-xs text-slate-800">
                      WAKTU REAL-TIME
                    </span>
                  </div>
                  <span className="neu-pill px-2.5 py-0.5 rounded-full text-[10px] font-sans font-bold text-emerald-800 uppercase">
                    WIB
                  </span>
                </div>

                {/* Clock Display */}
                <div className="neu-inset rounded-2xl py-3 text-center my-1">
                  <div className="text-3xl sm:text-4xl font-mono font-bold text-emerald-800 tracking-widest">
                    {currentTime ? (
                      <>
                        {String(currentTime.getHours()).padStart(2, '0')}&nbsp;:&nbsp;
                        {String(currentTime.getMinutes()).padStart(2, '0')}&nbsp;:&nbsp;
                        {String(currentTime.getSeconds()).padStart(2, '0')}
                      </>
                    ) : (
                      '-- : -- : --'
                    )}
                  </div>
                </div>

                {/* Date Display */}
                <div className="flex items-center justify-center gap-2 text-xs text-slate-600 font-sans font-medium pt-1 border-t border-stone-300/60">
                  <Calendar className="h-3.5 w-3.5 text-emerald-700" />
                  <span>
                    {currentTime ? currentTime.toLocaleDateString('id-ID', {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    }) : 'Memuat tanggal...'}
                  </span>
                </div>
              </div>

              {/* WIDGET 2: KALENDER INTERAKTIF NEUMORPHIC */}
              <div className="neu-card-elevated rounded-[28px] p-5 sm:p-6 space-y-4">
                {/* Header Kalender */}
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-display font-light uppercase text-base text-slate-900 tracking-tight">
                      {MONTH_NAMES_ID[calendarMonthIndex]} {calendarYear}
                    </h4>
                    <span className="text-[10px] font-sans font-bold uppercase tracking-wider text-slate-500">
                      PILIH TANGGAL BERITA
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setCalendarMonth(new Date(calendarYear, calendarMonthIndex - 1, 1))}
                      aria-label="Bulan Sebelumnya"
                      className="neu-btn-circle w-7 h-7 text-slate-700 transition-all cursor-pointer"
                    >
                      <ChevronLeft className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => setCalendarMonth(new Date())}
                      className="neu-pill text-[9.5px] font-sans font-bold uppercase px-2.5 py-1 rounded-full text-slate-800 cursor-pointer"
                    >
                      Hari ini
                    </button>
                    <button
                      onClick={() => setCalendarMonth(new Date(calendarYear, calendarMonthIndex + 1, 1))}
                      aria-label="Bulan Berikutnya"
                      className="neu-btn-circle w-7 h-7 text-slate-700 transition-all cursor-pointer"
                    >
                      <ChevronRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {/* Day Labels */}
                <div className="grid grid-cols-7 gap-1 text-center">
                  {DAY_NAMES_SHORT.map((day, idx) => (
                    <div
                      key={day}
                      className={cn(
                        "text-[9.5px] font-sans font-bold uppercase tracking-wider py-1",
                        idx === 0 ? "text-rose-600" : "text-slate-500"
                      )}
                    >
                      {day}
                    </div>
                  ))}
                </div>

                {/* Days Grid */}
                <div className="grid grid-cols-7 gap-1 text-center">
                  {calendarDays.map((cell, idx) => {
                    const hasNews = Boolean(newsDateMap[cell.dateKey]);
                    const isSelected = selectedCalendarDate === cell.dateKey;
                    const isToday = cell.dateKey === todayKey;

                    return (
                      <button
                        key={idx}
                        onClick={() => {
                          if (hasNews) {
                            setSelectedCalendarDate(isSelected ? null : cell.dateKey);
                          }
                        }}
                        disabled={!hasNews && !cell.isCurrentMonth}
                        className={cn(
                          "aspect-square rounded-full flex flex-col items-center justify-center text-xs font-sans font-bold transition-all relative",
                          cell.isCurrentMonth ? "text-slate-800" : "text-slate-400",
                          hasNews && "cursor-pointer font-bold",
                          hasNews && !isSelected && "neu-convex text-emerald-800 border border-emerald-600/30",
                          isSelected && "neu-btn-dark text-white font-bold shadow-xs",
                          isToday && !isSelected && "ring-1 ring-emerald-700",
                          !hasNews && !cell.isCurrentMonth && "opacity-35"
                        )}
                        title={hasNews ? `${newsDateMap[cell.dateKey].length} berita pada tanggal ini` : undefined}
                      >
                        <span>{cell.dayNumber}</span>
                        {hasNews && (
                          <span
                            className={cn(
                              "w-1 h-1 rounded-full absolute bottom-1",
                              isSelected ? "bg-white" : "bg-emerald-600"
                            )}
                          />
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Legend */}
                <div className="pt-2 border-t border-stone-300/60 flex items-center justify-between text-[10px]">
                  <span className="flex items-center gap-1.5 text-emerald-800 font-sans font-bold">
                    <span className="w-2 h-2 rounded-full bg-emerald-600" />
                    Ada berita
                  </span>
                  {selectedCalendarDate && (
                    <button
                      onClick={() => setSelectedCalendarDate(null)}
                      className="text-rose-600 font-bold hover:underline cursor-pointer"
                    >
                      Batal Pilih
                    </button>
                  )}
                </div>
              </div>

              {/* WIDGET 3: ARSIP BERITA TERBARU NEUMORPHIC */}
              <div className="neu-card-elevated rounded-[28px] p-5 sm:p-6 space-y-4">
                <div className="border-b border-stone-300/60 pb-2">
                  <h4 className="font-display font-light uppercase text-xs sm:text-sm tracking-wider text-slate-900">
                    ARSIP BERITA TERBARU
                  </h4>
                  <p className="text-[10px] text-slate-500 font-sans font-medium">
                    Pilih tanggal di kalender atau baca arsip di bawah
                  </p>
                </div>

                <div className="space-y-3">
                  {(allNews || []).slice(0, 5).map((item) => {
                    const thumb = item.imageUrls?.[0] || item.imageUrl || 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?q=80&w=300';
                    return (
                      <Link
                        key={item.id}
                        href={`/BeritaDesa/detail?id=${item.id}`}
                        className="group flex items-center gap-3 py-1 border-b border-stone-200/50 last:border-b-0"
                      >
                        <div className="neu-inset p-1 rounded-xl shrink-0">
                          <img
                            src={thumb}
                            alt={item.title}
                            className="w-11 h-11 rounded-lg object-cover"
                            loading="lazy"
                          />
                        </div>
                        <div className="min-w-0 flex-1 space-y-0.5">
                          <h5 className="font-sans font-bold uppercase text-[11.5px] leading-snug line-clamp-2 text-slate-900 group-hover:text-emerald-800 transition-colors">
                            {item.title}
                          </h5>
                          <div className="flex items-center justify-between text-[10px] font-sans">
                            <span className="text-slate-400">{item.date}</span>
                            <span className="text-emerald-800 font-bold group-hover:underline">Baca &rarr;</span>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>

            </aside>

          </section>

        </div>
      </main>

      <Footer />
    </div>
  );
}
