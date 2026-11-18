'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronUp, ChevronDown } from 'lucide-react';

export interface SlideItem {
  id: string;
  number: string;
  title: string;
  tag: string;
}

export const SLIDES: SlideItem[] = [
  { id: 'hero-roto-section', number: '01', title: 'Beranda', tag: 'Desa Sampeldes' },
  { id: 'jelajahi-desa', number: '02', title: 'Profil Desa', tag: 'Kepemimpinan' },
  { id: 'layanan-desa', number: '03', title: 'Layanan & Alur', tag: 'Anjungan Mandiri' },
  { id: 'berita-desa', number: '04', title: 'Warta Desa', tag: 'Kabar & Liputan' },
  { id: 'agenda-desa-section', number: '05', title: 'Agenda Desa', tag: 'Jadwal Kegiatan' },
  { id: 'pbb-section', number: '06', title: 'Pajak PBB-P2', tag: 'Cek Online SPPT' },
  { id: 'statistik-desa', number: '07', title: 'Statistik', tag: 'Data Kependudukan' },
  { id: 'pengumuman-desa', number: '08', title: 'Pengumuman', tag: 'Maklumat Resmi' },
  { id: 'umkm-desa', number: '09', title: 'Sentra UMKM', tag: 'Produk Warga' },
  { id: 'kontak-warga', number: '10', title: 'Partisipasi', tag: 'Aspirasi & Kontak' },
  { id: 'footer-desa', number: '11', title: 'Informasi', tag: 'Kantor Balai Desa' },
];

export function FullpageScrollController() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const isScrollingRef = useRef(false);

  // 1. Pasang CSS snap-active ke document.documentElement pada halaman landing
  useEffect(() => {
    document.documentElement.classList.add('snap-active');
    return () => {
      document.documentElement.classList.remove('snap-active');
    };
  }, []);

  // 2. Observer untuk mendeteksi slide/layar mana yang saat ini aktif di viewport
  useEffect(() => {
    const observerCallback: IntersectionObserverCallback = (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const foundIdx = SLIDES.findIndex((s) => s.id === entry.target.id);
          if (foundIdx !== -1) {
            setActiveIndex(foundIdx);
          }
        }
      });
    };

    const observer = new IntersectionObserver(observerCallback, {
      root: null,
      rootMargin: '-30% 0px -30% 0px',
      threshold: 0.2,
    });

    SLIDES.forEach((slide) => {
      const el = document.getElementById(slide.id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  // 3. Fungsi Navigasi ke Slide Tertentu
  const scrollToSlide = useCallback((index: number) => {
    if (index < 0 || index >= SLIDES.length) return;
    const targetSlide = SLIDES[index];
    const targetElement = document.getElementById(targetSlide.id);
    if (targetElement) {
      isScrollingRef.current = true;
      targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setActiveIndex(index);
      setTimeout(() => {
        isScrollingRef.current = false;
      }, 850);
    }
  }, []);

  // 4. Keyboard Listener untuk Navigasi Layar per Layar (ArrowDown / ArrowUp / PageDown / PageUp)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeTag = document.activeElement?.tagName?.toLowerCase();
      if (activeTag === 'input' || activeTag === 'textarea' || activeTag === 'select') {
        return;
      }

      if (e.key === 'ArrowDown' || e.key === 'PageDown') {
        e.preventDefault();
        scrollToSlide(activeIndex + 1);
      } else if (e.key === 'ArrowUp' || e.key === 'PageUp') {
        e.preventDefault();
        scrollToSlide(activeIndex - 1);
      } else if (e.key === 'Home') {
        e.preventDefault();
        scrollToSlide(0);
      } else if (e.key === 'End') {
        e.preventDefault();
        scrollToSlide(SLIDES.length - 1);
      }
    };

    window.addEventListener('keydown', handleKeyDown, { passive: false });
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeIndex, scrollToSlide]);

  return (
    <>
      <aside
        aria-label="Navigasi Layar per Layar"
        className="fixed right-3 sm:right-6 top-1/2 -translate-y-1/2 z-40 hidden md:flex flex-col items-end gap-2.5 select-none pointer-events-auto"
      >
        {/* Tombol Panah Atas (Slide Sebelumnya) */}
        <button
          type="button"
          onClick={() => scrollToSlide(activeIndex - 1)}
          disabled={activeIndex === 0}
          aria-label="Layar Sebelumnya"
          title="Layar Sebelumnya (↑)"
          className="flex h-7 w-7 items-center justify-center rounded-full bg-white/80 hover:bg-white text-slate-700 hover:text-slate-900 border border-stone-200/90 shadow-sm backdrop-blur-md transition-all disabled:opacity-30 disabled:pointer-events-none hover:scale-110 active:scale-95 cursor-pointer mb-1"
        >
          <ChevronUp className="h-4 w-4 stroke-[2]" />
        </button>

        {/* Indikator Slide Aktif (e.g. 02 / 11) */}
        <div className="text-[10px] font-mono font-semibold tracking-wider text-slate-500 bg-white/70 backdrop-blur-sm px-2 py-0.5 rounded-full border border-stone-200/60 shadow-xs mb-1">
          <span className="text-slate-900 font-bold">{SLIDES[activeIndex]?.number}</span>
          <span className="text-slate-400 mx-0.5">/</span>
          <span>{SLIDES[SLIDES.length - 1]?.number}</span>
        </div>

        {/* Rangkaian Dots Indikator per Layar */}
        <div className="flex flex-col items-end gap-2 py-1">
          {SLIDES.map((slide, idx) => {
            const isActive = activeIndex === idx;
            const isHovered = hoveredIndex === idx;

            return (
              <div
                key={slide.id}
                className="relative flex items-center justify-end group cursor-pointer"
                onMouseEnter={() => setHoveredIndex(idx)}
                onMouseLeave={() => setHoveredIndex(null)}
                onClick={() => scrollToSlide(idx)}
              >
                {/* Tooltip Judul Slide Saat Hover (Muncul di Kiri Dot) */}
                <AnimatePresence>
                  {(isHovered || isActive) && (
                    <motion.div
                      initial={{ opacity: 0, x: 8, scale: 0.95 }}
                      animate={{ opacity: 1, x: 0, scale: 1 }}
                      exit={{ opacity: 0, x: 8, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      className={`mr-3 hidden lg:flex items-center gap-2 whitespace-nowrap rounded-full px-3 py-1 shadow-md backdrop-blur-md text-[10px] font-sans uppercase tracking-widest font-semibold ${isActive
                          ? 'bg-slate-900 text-white border border-slate-700'
                          : 'bg-white/95 text-slate-700 border border-stone-200/90'
                        }`}
                    >
                      <span className="font-mono text-[9px] opacity-75">{slide.number}</span>
                      <span>{slide.title}</span>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Dot Indikator */}
                <button
                  type="button"
                  aria-label={`Lompat ke layar ${slide.number}: ${slide.title}`}
                  className={`relative flex items-center justify-center transition-all duration-300 rounded-full cursor-pointer ${isActive
                      ? 'w-3 h-8 bg-slate-900 border border-slate-700 shadow-sm'
                      : 'w-2 h-2 bg-slate-400/50 hover:bg-slate-800 hover:scale-125'
                    }`}
                >
                  {isActive && (
                    <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse" />
                  )}
                </button>
              </div>
            );
          })}
        </div>

        {/* Tombol Panah Bawah (Slide Berikutnya) */}
        <button
          type="button"
          onClick={() => scrollToSlide(activeIndex + 1)}
          disabled={activeIndex === SLIDES.length - 1}
          aria-label="Layar Berikutnya"
          title="Layar Berikutnya (↓)"
          className="flex h-7 w-7 items-center justify-center rounded-full bg-white/80 hover:bg-white text-slate-700 hover:text-slate-900 border border-stone-200/90 shadow-sm backdrop-blur-md transition-all disabled:opacity-30 disabled:pointer-events-none hover:scale-110 active:scale-95 cursor-pointer mt-1"
        >
          <ChevronDown className="h-4 w-4 stroke-[2]" />
        </button>
      </aside>

      {/* Indikator & Kontrol Slide Layar Mobile (Muncul di layar kecil < md) */}
      <div
        aria-label="Navigasi Layar Mobile"
        className="fixed bottom-3 right-3 z-40 md:hidden flex items-center gap-1.5 p-1 rounded-full neu-convex select-none shadow-lg backdrop-blur-md border border-stone-300/40"
      >
        <button
          type="button"
          onClick={() => scrollToSlide(activeIndex - 1)}
          disabled={activeIndex === 0}
          aria-label="Slide Sebelumnya"
          className="flex h-7 w-7 items-center justify-center rounded-full neu-btn text-slate-700 disabled:opacity-30 disabled:pointer-events-none active:scale-95 cursor-pointer"
        >
          <ChevronUp className="h-3.5 w-3.5 stroke-[2]" />
        </button>

        <div className="flex items-center gap-1 px-1.5 py-0.5">
          <span className="text-[10px] font-mono font-bold text-slate-900">{SLIDES[activeIndex]?.number}</span>
          <span className="text-[9px] text-slate-400">/</span>
          <span className="text-[9px] font-mono text-slate-500">{SLIDES[SLIDES.length - 1]?.number}</span>
          <span className="text-[9px] font-sans font-semibold text-emerald-800 uppercase tracking-wider ml-1 max-w-[85px] truncate hidden xs:inline-block">
            {SLIDES[activeIndex]?.title}
          </span>
        </div>

        <button
          type="button"
          onClick={() => scrollToSlide(activeIndex + 1)}
          disabled={activeIndex === SLIDES.length - 1}
          aria-label="Slide Berikutnya"
          className="flex h-7 w-7 items-center justify-center rounded-full neu-btn text-slate-700 disabled:opacity-30 disabled:pointer-events-none active:scale-95 cursor-pointer"
        >
          <ChevronDown className="h-3.5 w-3.5 stroke-[2]" />
        </button>
      </div>
    </>
  );
}
