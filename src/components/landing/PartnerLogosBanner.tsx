'use client';

import React, { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react';
import { doc } from 'firebase/firestore';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { FooterLogosInfo, FooterLogoItem } from '@/lib/types';

const TOTAL_REPEAT_SETS = 10;

export function PartnerLogosBanner() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [direction, setDirection] = useState<'right' | 'left'>('right');
  const [isHovered, setIsHovered] = useState(false);

  // Ambil data logo dari Firestore: footerLogos/default (sama seperti di /admin/settings)
  const firestore = useFirestore();
  const footerLogosRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, 'footerLogos', 'default');
  }, [firestore]);

  const { data: footerLogosData, isLoading } = useDoc<FooterLogosInfo>(footerLogosRef, {
    suppressGlobalError: true,
  });

  // Ekstrak list logo yang valid
  const rawLogos: FooterLogoItem[] = useMemo(() => {
    if (!footerLogosData) return [];

    if (Array.isArray(footerLogosData.items) && footerLogosData.items.length > 0) {
      return footerLogosData.items.filter((item) => item.url && item.url.trim() !== '');
    }

    // Fallback format legacy (logo1..logo4)
    const legacy: FooterLogoItem[] = [];
    [1, 2, 3, 4].forEach((num) => {
      const url = (footerLogosData as any)[`logo${num}Url`];
      const link = (footerLogosData as any)[`logo${num}Link`];
      if (url && typeof url === 'string') {
        legacy.push({
          id: `legacy-${num}`,
          url,
          link: link || '',
          name: `Logo ${num}`,
        });
      }
    });
    return legacy;
  }, [footerLogosData]);

  // Gandakan array logo sebanyak TOTAL_REPEAT_SETS (10 set) agar looping berjalan mulus tanpa henti
  const displayLogos = useMemo(() => {
    if (rawLogos.length === 0) return [];
    const result: Array<FooterLogoItem & { uniqueKey: string }> = [];

    for (let r = 0; r < TOTAL_REPEAT_SETS; r++) {
      rawLogos.forEach((item, idx) => {
        result.push({
          ...item,
          uniqueKey: `${item.id || idx}-repeat-${r}-${idx}`,
        });
      });
    }
    return result;
  }, [rawLogos]);

  // Normalisasi posisi scroll agar selalu berada di rentang tengah (looping tanpa henti)
  const normalizeScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el || displayLogos.length === 0) return;

    const setWidth = el.scrollWidth / TOTAL_REPEAT_SETS;
    if (setWidth <= 0) return;

    const shiftDistance = Math.floor(TOTAL_REPEAT_SETS / 2) * setWidth;

    // Jika bergeser ke kanan mendekati batas akhir
    if (el.scrollLeft >= (TOTAL_REPEAT_SETS - 2) * setWidth) {
      el.scrollLeft -= shiftDistance;
    }
    // Jika bergeser ke kiri mendekati batas awal
    else if (el.scrollLeft <= setWidth) {
      el.scrollLeft += shiftDistance;
    }
  }, [displayLogos.length]);

  // Inisialisasi posisi scroll di tengah track saat komponen pertama kali dimuat
  useEffect(() => {
    const container = scrollRef.current;
    if (!container || displayLogos.length === 0) return;

    const timer = setTimeout(() => {
      const setWidth = container.scrollWidth / TOTAL_REPEAT_SETS;
      if (setWidth > 0 && container.scrollLeft === 0) {
        container.scrollLeft = 4 * setWidth;
      }
    }, 50);

    return () => clearTimeout(timer);
  }, [displayLogos.length]);

  // Geser terus-menerus sesuai arah (continuous infinite motion)
  useEffect(() => {
    const container = scrollRef.current;
    if (!container || displayLogos.length === 0) return;

    let animationFrameId: number;
    let lastTime = performance.now();

    const animate = (currentTime: number) => {
      if (!isHovered && container) {
        const elapsed = currentTime - lastTime;
        // Kecepatan gerak: ~45px per detik
        const move = Math.min(elapsed * 0.048, 3);
        const delta = direction === 'right' ? move : -move;
        container.scrollLeft += delta;
        normalizeScroll();
      }
      lastTime = currentTime;
      animationFrameId = requestAnimationFrame(animate);
    };

    animationFrameId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [isHovered, direction, displayLogos.length, normalizeScroll]);

  // Tangani klik tombol panah: langsung geser ke arah yang dipilih dan ubah arah gerak terus-menerus
  const handleArrowClick = useCallback(
    (newDirection: 'left' | 'right') => {
      setDirection(newDirection);
      const container = scrollRef.current;
      if (!container) return;

      // Geser seketika sejauh 220px (1 kartu) untuk feedback instan, lalu lanjut bergeser terus-menerus ke arah tersebut
      const step = newDirection === 'left' ? -220 : 220;
      container.scrollLeft += step;
      normalizeScroll();
    },
    [normalizeScroll]
  );

  // Jangan render jika data kosong dan selesai loading
  if (!isLoading && rawLogos.length === 0) {
    return null;
  }

  return (
    <section className="relative z-10 w-full bg-transparent py-8 sm:py-12 select-none">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Carousel Container dengan Tombol Panah Kiri & Kanan */}
        <div className="relative flex items-center gap-2 sm:gap-3">
          {/* Tombol Panah Kiri */}
          <button
            type="button"
            onClick={() => handleArrowClick('left')}
            aria-label="Geser terus ke kiri"
            title="Geser terus ke kiri"
            className="flex h-9 w-9 sm:h-12 sm:w-12 items-center justify-center rounded-full bg-white dark:bg-slate-800/90 hover:bg-teal-50 dark:hover:bg-teal-950/40 text-slate-700 dark:text-slate-200 hover:text-teal-600 border border-slate-200/90 dark:border-slate-700/80 hover:border-teal-400 dark:hover:border-teal-400 shadow-sm hover:shadow-md transition-all duration-200 shrink-0 cursor-pointer active:scale-95 group focus:outline-none focus:ring-2 focus:ring-teal-400"
          >
            <ChevronLeft className="h-4 w-4 sm:h-6 sm:w-6 transition-transform group-hover:-translate-x-0.5" />
          </button>

          {/* Area Track Scrolling */}
          <div className="relative flex-1 overflow-hidden rounded-2xl">
            <div
              ref={scrollRef}
              onScroll={normalizeScroll}
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
              onTouchStart={() => setIsHovered(true)}
              onTouchEnd={() => {
                setTimeout(() => setIsHovered(false), 1500);
              }}
              className="flex items-center gap-3 sm:gap-4 overflow-x-auto scrollbar-none py-2 px-1 sm:px-2 select-none cursor-grab active:cursor-grabbing"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {isLoading ? (
                // Skeleton loading state
                Array.from({ length: 8 }).map((_, i) => (
                  <div
                    key={`skeleton-${i}`}
                    className="h-16 sm:h-20 w-32 sm:w-44 shrink-0 rounded-2xl bg-white/60 dark:bg-slate-800/60 animate-pulse border border-slate-200/60 dark:border-slate-700/60"
                  />
                ))
              ) : (
                // Kartu Logo Mitra (Sesuai contoh gambar: rounded squircle putih dengan bayangan rapi)
                displayLogos.map((item) => {
                  const cardContent = (
                    <div className="relative flex h-full w-full items-center justify-center p-2.5 sm:p-3">
                      <Image
                        src={item.url}
                        alt={item.name || 'Logo Mitra'}
                        width={140}
                        height={70}
                        className="max-h-11 sm:max-h-14 w-auto object-contain filter drop-shadow-xs transition-transform duration-300 group-hover:scale-105"
                        unoptimized
                      />
                      {item.link && (
                        <div className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hover:text-teal-600">
                          <ExternalLink className="h-3 w-3" />
                        </div>
                      )}
                    </div>
                  );

                  return item.link ? (
                    <a
                      key={item.uniqueKey}
                      href={item.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      title={item.name ? `${item.name} (Buka tautan)` : 'Buka tautan mitra'}
                      className="group relative flex h-16 sm:h-20 w-32 sm:w-44 shrink-0 items-center justify-center rounded-2xl bg-white border border-slate-200/80 shadow-[0_2px_12px_rgba(0,0,0,0.06)] transition-all duration-300 hover:scale-105 hover:shadow-[0_8px_20px_rgba(20,184,166,0.18)] hover:border-teal-500/50"
                    >
                      {cardContent}
                    </a>
                  ) : (
                    <div
                      key={item.uniqueKey}
                      title={item.name || 'Logo Mitra'}
                      className="group relative flex h-16 sm:h-20 w-32 sm:w-44 shrink-0 items-center justify-center rounded-2xl bg-white border border-slate-200/80 shadow-[0_2px_12px_rgba(0,0,0,0.06)] transition-all duration-300 hover:scale-105 hover:shadow-[0_8px_20px_rgba(20,184,166,0.18)] hover:border-teal-500/50"
                    >
                      {cardContent}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Tombol Panah Kanan */}
          <button
            type="button"
            onClick={() => handleArrowClick('right')}
            aria-label="Geser terus ke kanan"
            title="Geser terus ke kanan"
            className="flex h-9 w-9 sm:h-12 sm:w-12 items-center justify-center rounded-full bg-white dark:bg-slate-800/90 hover:bg-teal-50 dark:hover:bg-teal-950/40 text-slate-700 dark:text-slate-200 hover:text-teal-600 border border-slate-200/90 dark:border-slate-700/80 hover:border-teal-400 dark:hover:border-teal-400 shadow-sm hover:shadow-md transition-all duration-200 shrink-0 cursor-pointer active:scale-95 group focus:outline-none focus:ring-2 focus:ring-teal-400"
          >
            <ChevronRight className="h-4 w-4 sm:h-6 sm:w-6 transition-transform group-hover:translate-x-0.5" />
          </button>
        </div>
      </div>
    </section>
  );
}
