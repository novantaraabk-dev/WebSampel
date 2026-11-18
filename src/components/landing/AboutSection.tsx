'use client';

import React, { useMemo, useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { UserCircle2, ShieldCheck, ChevronRight, ChevronLeft, ArrowLeft, ArrowRight, Sparkles } from 'lucide-react';
import { useFirestore, useCollection, useDoc, useMemoFirebase } from '@/firebase';
import { collection, doc, query, orderBy } from 'firebase/firestore';
import { Official, VillageProfileInfo } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';

const DEFAULT_PERANGKAT: Official[] = [
  {
    id: 'perangkat-1',
    name: 'TUKIMAN',
    position: 'Kepala Desa',
    category: 'perangkat',
    period: '2020 – 2026',
    imageUrl: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=600&auto=format&fit=crop',
  },
  {
    id: 'perangkat-2',
    name: 'Siti Rahmawati, S.A.P.',
    position: 'Sekretaris Desa',
    category: 'perangkat',
    period: 'Administrasi Umum',
    imageUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=600&auto=format&fit=crop',
  },
  {
    id: 'perangkat-3',
    name: 'Ahmad Fauzi, S.Pd.',
    position: 'Kasi Pemerintahan',
    category: 'perangkat',
    period: 'Tata Praja & Hukum',
    imageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=600&auto=format&fit=crop',
  },
  {
    id: 'perangkat-4',
    name: 'Rudi Hermawan',
    position: 'Kasi Kesejahteraan',
    category: 'perangkat',
    period: 'Pemberdayaan & Pembangunan',
    imageUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=600&auto=format&fit=crop',
  },
  {
    id: 'perangkat-5',
    name: 'Budi Santoso, S.Kom.',
    position: 'Kasi Pelayanan Umum',
    category: 'perangkat',
    period: 'Layanan Surat & NIK',
    imageUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?q=80&w=600&auto=format&fit=crop',
  },
  {
    id: 'perangkat-6',
    name: 'Dewi Lestari, S.E.',
    position: 'Kaur Keuangan',
    category: 'perangkat',
    period: 'Pengelolaan APBDes',
    imageUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?q=80&w=600&auto=format&fit=crop',
  },
  {
    id: 'perangkat-7',
    name: 'Tri Wahyuni',
    position: 'Kaur Perencanaan',
    category: 'perangkat',
    period: 'Program & RKPDes',
    imageUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=600&auto=format&fit=crop',
  },
  {
    id: 'perangkat-8',
    name: 'Joko Susilo',
    position: 'Kadus I Sampeldes',
    category: 'perangkat',
    period: 'Wilayah Dusun I',
    imageUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=600&auto=format&fit=crop',
  },
];

export function AboutSection() {
  const firestore = useFirestore();

  // Ambil data profil & Foto Kades dari /admin/settings (villageProfile/default -> kadesPhotoUrl)
  const profileRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, 'villageProfile', 'default');
  }, [firestore]);

  const { data: profileData } = useDoc<VillageProfileInfo>(profileRef);

  // Query sama persis seperti di /profil-desa (Kenali Kami)
  const officialsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'officials'), orderBy('name', 'asc'));
  }, [firestore]);

  const { data: officials, isLoading } = useCollection<Official>(officialsQuery);

  // Filter & Urutkan Hirarki Perangkat Desa (Kades -> Sekdes -> Kasi/Kaur -> Kadus -> Staf)
  const perangkatList = useMemo(() => {
    let list: Official[] = DEFAULT_PERANGKAT;

    if (officials && officials.length > 0) {
      const getPerangkatRank = (pos: string) => {
        const p = (pos || '').toLowerCase();
        if (p.includes('kepala desa') || p.includes('kades')) return 1;
        if (p.includes('sekretaris') || p.includes('sekdes')) return 2;
        if (p.includes('kasi') || p.includes('kaur')) return 3;
        if (p.includes('kadus') || p.includes('kepala dusun')) return 4;
        if (p.includes('staf') || p.includes('staff')) return 5;
        return 6;
      };

      const filtered = officials
        .filter((o) => o.category === 'perangkat')
        .sort((a, b) => {
          const rankDiff = getPerangkatRank(a.position) - getPerangkatRank(b.position);
          if (rankDiff !== 0) return rankDiff;
          return (a.name || '').localeCompare(b.name || '');
        });

      if (filtered.length > 0) {
        list = filtered;
      }
    }

    if (profileData?.kadesPhotoUrl) {
      return list.map((o) => {
        const p = (o.position || '').toLowerCase();
        if (p.includes('kepala desa') || p.includes('kades')) {
          return { ...o, imageUrl: profileData.kadesPhotoUrl || o.imageUrl };
        }
        return o;
      });
    }

    return list;
  }, [officials, profileData]);

  // Siapkan list berganda untuk continuous infinite smooth scroll
  const displayList = useMemo(() => {
    if (perangkatList.length === 0) return [];
    let base = [...perangkatList];
    while (base.length < 12) {
      base = [...base, ...perangkatList];
    }
    // Dua set identik agar saat mencapai scrollWidth / 2, reset ke 0 seamless tanpa kedipan
    return [...base, ...base];
  }, [perangkatList]);

  // Carousel & Auto-scroll State
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeftState, setScrollLeftState] = useState(0);
  const hasMovedRef = useRef(false);
  const resumeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Smooth continuous auto-scroll menggunakan requestAnimationFrame
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    let animationFrameId: number;
    let lastTime = performance.now();

    const step = (currentTime: number) => {
      const delta = currentTime - lastTime;
      lastTime = currentTime;

      if (!isPaused && !isDragging && container) {
        // Kecepatan scroll halus (px per ms) -> ~35px/detik
        const speed = 0.04;
        container.scrollLeft += speed * delta;

        // Loop tak terbatas: saat mencapai separuh lebar konten (set ke-2), reset ke set ke-1
        const halfWidth = container.scrollWidth / 2;
        if (halfWidth > 0) {
          if (container.scrollLeft >= halfWidth) {
            container.scrollLeft -= halfWidth;
          } else if (container.scrollLeft <= 0) {
            container.scrollLeft += halfWidth;
          }
        }
      }

      animationFrameId = requestAnimationFrame(step);
    };

    animationFrameId = requestAnimationFrame(step);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [isPaused, isDragging]);

  // Handlers geser manual via Mouse Drag
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!scrollContainerRef.current) return;
    setIsDragging(true);
    setIsPaused(true);
    hasMovedRef.current = false;
    setStartX(e.pageX - scrollContainerRef.current.offsetLeft);
    setScrollLeftState(scrollContainerRef.current.scrollLeft);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !scrollContainerRef.current) return;
    const x = e.pageX - scrollContainerRef.current.offsetLeft;
    const walk = (x - startX) * 1.3;
    if (Math.abs(walk) > 4) {
      hasMovedRef.current = true;
    }
    scrollContainerRef.current.scrollLeft = scrollLeftState - walk;

    // Boundary check during manual drag
    const halfWidth = scrollContainerRef.current.scrollWidth / 2;
    if (halfWidth > 0) {
      if (scrollContainerRef.current.scrollLeft >= halfWidth) {
        scrollContainerRef.current.scrollLeft -= halfWidth;
        setScrollLeftState((prev) => prev - halfWidth);
      } else if (scrollContainerRef.current.scrollLeft <= 0) {
        scrollContainerRef.current.scrollLeft += halfWidth;
        setScrollLeftState((prev) => prev + halfWidth);
      }
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    if (resumeTimeoutRef.current) clearTimeout(resumeTimeoutRef.current);
    resumeTimeoutRef.current = setTimeout(() => {
      setIsPaused(false);
    }, 1500);
  };

  // Navigasi Tombol Geser Kiri / Kanan
  const handleScrollManual = (direction: 'left' | 'right') => {
    if (!scrollContainerRef.current) return;
    setIsPaused(true);
    const scrollAmount = 260;
    scrollContainerRef.current.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    });

    if (resumeTimeoutRef.current) clearTimeout(resumeTimeoutRef.current);
    resumeTimeoutRef.current = setTimeout(() => {
      setIsPaused(false);
    }, 3000);
  };

  return (
    <section
      id="perangkat-desa"
      className="relative w-full py-12 sm:py-20 lg:py-24 bg-transparent overflow-hidden select-none"
    >
      {/* Background Micro Glow */}
      <div className="absolute top-1/3 left-1/4 w-80 h-80 bg-teal-500/5 dark:bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-emerald-500/5 dark:bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* HEADER SECTION (KENALI KAMI • PERANGKAT DESA) */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 sm:gap-6 mb-5 sm:mb-10">
          <div className="max-w-2xl text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-50 dark:bg-teal-950/40 border border-teal-200/60 dark:border-teal-700/30 text-teal-700 dark:text-teal-300 text-[9px] sm:text-[11px] font-bold tracking-[0.2em] uppercase mb-2.5 sm:mb-3">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse" />
              <span>APARATUR PEMERINTAHAN DESA</span>
            </div>

            <h2 className="text-xl sm:text-3xl lg:text-4xl font-extrabold uppercase tracking-tight text-slate-900 dark:text-white font-condensed">
              PERANGKAT DESA YANG{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-600 to-emerald-500 dark:from-teal-400 dark:to-emerald-400">
                MELAYANI ANDA SEPENUH HATI
              </span>
            </h2>
            <p className="mt-2 text-[11px] sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Didukung sumber daya manusia yang berintegritas, ramah, dan profesional dalam mengemban amanah serta melayani masyarakat Desa Sampeldes.
            </p>
          </div>

          {/* KONTROL GESER KIRI / KANAN & STATUS ANIMASI */}
          <div className="flex items-center gap-3 shrink-0 self-start md:self-end">
            <div className="hidden sm:flex items-center gap-2 text-[11px] font-semibold text-slate-500 dark:text-slate-400 mr-2">
              <span className="inline-block w-2 h-2 rounded-full bg-teal-500" />
              <span>{isPaused ? 'Dijeda (Hover / Drag)' : 'Bergeser Otomatis'}</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleScrollManual('left')}
                aria-label="Geser ke kiri"
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white dark:bg-[#0c1822] border border-stone-200 dark:border-white/10 text-slate-700 dark:text-slate-200 hover:text-teal-600 dark:hover:text-teal-400 hover:border-teal-500/50 shadow-xs hover:shadow-md flex items-center justify-center transition-all duration-200 active:scale-95"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              <button
                type="button"
                onClick={() => handleScrollManual('right')}
                aria-label="Geser ke kanan"
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white dark:bg-[#0c1822] border border-stone-200 dark:border-white/10 text-slate-700 dark:text-slate-200 hover:text-teal-600 dark:hover:text-teal-400 hover:border-teal-500/50 shadow-xs hover:shadow-md flex items-center justify-center transition-all duration-200 active:scale-95"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* SINGLE-ROW SMOOTH CAROUSEL (KARTU SATU BARIS DAPAT DIGESER KIRI/KANAN & ANIMASI OTOMATIS) */}
        <div className="relative w-full -mx-4 px-4 sm:mx-0 sm:px-0">
          {/* Subtle Left & Right Edge Fade Gradients */}
          <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-8 sm:w-16 bg-gradient-to-r from-[#fbf9f5]/90 via-[#fbf9f5]/50 to-transparent dark:from-[#060b11]/90 dark:via-[#060b11]/50 z-10" />
          <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-8 sm:w-16 bg-gradient-to-l from-[#fbf9f5]/90 via-[#fbf9f5]/50 to-transparent dark:from-[#060b11]/90 dark:via-[#060b11]/50 z-10" />

          {isLoading ? (
            <div className="flex gap-3 sm:gap-4 overflow-hidden py-3 px-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="w-[118px] min-[400px]:w-[130px] sm:w-[215px] shrink-0 p-2 sm:p-3 rounded-xl sm:rounded-2xl bg-[#fbf9f5] dark:bg-[#0c1822] border border-stone-200/80 dark:border-white/10 space-y-2.5 overflow-hidden relative"
                >
                  <Skeleton className="aspect-[3/4] w-full rounded-xl" />
                  <Skeleton className="h-3 w-3/4 mx-auto" />
                  <Skeleton className="h-2.5 w-1/2 mx-auto" />
                </div>
              ))}
            </div>
          ) : (
            <div
              ref={scrollContainerRef}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={() => {
                handleMouseUp();
                setIsPaused(false);
              }}
              onMouseEnter={() => setIsPaused(true)}
              onTouchStart={() => setIsPaused(true)}
              onTouchEnd={() => {
                if (resumeTimeoutRef.current) clearTimeout(resumeTimeoutRef.current);
                resumeTimeoutRef.current = setTimeout(() => setIsPaused(false), 2000);
              }}
              className={`flex items-stretch gap-2 sm:gap-4 overflow-x-auto no-scrollbar py-3 px-2 cursor-grab active:cursor-grabbing select-none ${isDragging ? 'scroll-auto' : 'scroll-smooth'
                }`}
            >
              {displayList.map((person, idx) => {
                const isKades =
                  (person.position || '').toLowerCase().includes('kepala desa') ||
                  (person.position || '').toLowerCase().includes('kades');
                const isSekdes = (person.position || '').toLowerCase().includes('sekretaris');

                return (
                  <div
                    key={`${person.id || person.name}-${idx}`}
                    className="w-[118px] min-[400px]:w-[130px] sm:w-[215px] shrink-0 group relative bg-[#fcfbf9]/95 dark:bg-[#0b1720]/95 backdrop-blur-md rounded-xl sm:rounded-[1.4rem] p-1.5 sm:p-3 border border-teal-900/15 dark:border-teal-500/20 shadow-sm hover:shadow-xl hover:shadow-teal-900/10 dark:hover:shadow-teal-500/5 hover:border-teal-500/60 dark:hover:border-teal-400/50 hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between text-center overflow-hidden"
                  >
                    {/* 1. BEGROUND SILUET ALAM PADA KARTU (SESUAI TEMA SILUET HUTAN & PERBUKITAN) */}
                    <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl sm:rounded-[1.4rem] z-0">
                      <img
                        src="https://images.unsplash.com/photo-1511497584788-876760111969?q=80&w=800&auto=format&fit=crop"
                        alt=""
                        className="w-full h-full object-cover object-bottom opacity-[0.08] dark:opacity-[0.18] mix-blend-luminosity contrast-125 pointer-events-none group-hover:scale-108 transition-transform duration-700"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#fcfbf9] via-transparent to-[#fcfbf9]/40 dark:from-[#0b1720] dark:via-transparent dark:to-[#0b1720]/40" />
                    </div>

                    <div className="relative z-10 flex flex-col justify-between h-full">
                      {/* Compact Portrait Image with Aspect 3/4 */}
                      <div className="relative aspect-[3/4] w-full overflow-hidden rounded-lg sm:rounded-xl bg-[#edf3f0] dark:bg-[#07131b] border border-teal-900/10 dark:border-teal-500/20 shadow-inner">
                        {/* 2. BEGROUND SILUET PADA AREA FOTO APARATUR */}
                        <div className="absolute inset-0 z-0">
                          <img
                            src="https://images.unsplash.com/photo-1511497584788-876760111969?q=80&w=800&auto=format&fit=crop"
                            alt=""
                            className="w-full h-full object-cover object-center opacity-30 dark:opacity-45 mix-blend-luminosity contrast-150"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-teal-950/75 via-teal-900/35 to-teal-800/15 dark:from-[#040e14]/90 dark:via-[#071822]/60 dark:to-transparent" />
                        </div>

                        {person.imageUrl ? (
                          <img
                            src={person.imageUrl}
                            alt={person.name}
                            className="relative z-1 w-full h-full object-cover object-top group-hover:scale-106 transition-transform duration-500 ease-out pointer-events-none"
                            loading="lazy"
                          />
                        ) : (
                          <div className="relative z-1 w-full h-full flex flex-col items-center justify-end pb-3 text-white">
                            {/* Stylized Avatar Icon dengan Backdrop Siluet */}
                            <div className="relative mb-1">
                              <div className="w-10 h-10 sm:w-16 sm:h-16 rounded-full bg-teal-500/20 dark:bg-teal-400/15 border border-white/40 dark:border-white/20 backdrop-blur-xs flex items-center justify-center shadow-lg">
                                <UserCircle2 className="h-7 w-7 sm:h-12 sm:w-12 text-teal-800/80 dark:text-teal-200 drop-shadow" />
                              </div>
                              <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full bg-teal-800/90 dark:bg-teal-700/90 text-[7.5px] font-black uppercase tracking-wider text-teal-100 backdrop-blur-xs whitespace-nowrap shadow-xs">
                                APARATUR
                              </span>
                            </div>
                          </div>
                        )}

                        {/* Floating Badge Khusus Pimpinan (Kades / Sekdes) */}
                        {isKades && (
                          <div className="absolute top-1.5 left-1.5 sm:top-2 sm:left-2 z-20 px-1.5 sm:px-2 py-0.5 rounded-md bg-amber-500/95 text-[7px] sm:text-[8.5px] font-black uppercase tracking-wider text-slate-950 shadow-md">
                            KADES
                          </div>
                        )}
                        {isSekdes && (
                          <div className="absolute top-1.5 left-1.5 sm:top-2 sm:left-2 z-20 px-1.5 sm:px-2 py-0.5 rounded-md bg-teal-600/95 text-[7px] sm:text-[8.5px] font-black uppercase tracking-wider text-white shadow-md">
                            SEKDES
                          </div>
                        )}

                        <div className="absolute inset-0 z-10 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>

                      {/* Name & Position Info */}
                      <div className="pt-1.5 sm:pt-2.5 pb-0.5 sm:pb-1 px-0.5 flex flex-col items-center">
                        <div className="hidden sm:block w-4 h-0.5 bg-gradient-to-r from-teal-500 to-emerald-400 rounded-full group-hover:w-8 transition-all duration-300 mb-1.5" />

                        <h3
                          title={person.name}
                          className="text-[10px] sm:text-[13px] font-condensed font-extrabold uppercase tracking-tight text-slate-900 dark:text-white group-hover:text-teal-600 dark:group-hover:text-teal-300 transition-colors line-clamp-2 leading-tight break-words"
                        >
                          {person.name}
                        </h3>

                        <p
                          title={person.position}
                          className="text-[8px] sm:text-[10.5px] font-bold text-teal-700 dark:text-teal-400 uppercase tracking-wide sm:tracking-wider line-clamp-1 mt-0.5 sm:mt-1"
                        >
                          {person.position}
                        </p>

                        {person.period && (
                          <p className="hidden sm:block text-[9.5px] text-slate-500 dark:text-slate-400 font-medium line-clamp-1 mt-0.5">
                            {person.period}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* BOTTOM ACTION BUTTON: LIHAT SELURUH STRUKTUR PEMERINTAHAN & BPD */}
        <div className="mt-6 sm:mt-10 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/profil-desa?tab=perangkat"
            className="inline-flex items-center gap-2 px-4 sm:px-6 py-2.5 rounded-full bg-slate-900 hover:bg-teal-900 dark:bg-white/10 dark:hover:bg-teal-600 text-white font-bold text-[10px] sm:text-xs tracking-wider uppercase shadow-xs transition-all duration-300 hover:scale-105"
          >
            <ShieldCheck className="h-4 w-4 text-teal-400 shrink-0" />
            <span><span className="hidden sm:inline">Lihat </span>Struktur Lembaga &amp; BPD<span className="hidden sm:inline"> di Profil Desa</span></span>
            <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </section>
  );
}

export default AboutSection;
