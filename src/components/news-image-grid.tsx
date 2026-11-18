'use client';

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { ChevronLeft, ChevronRight, Maximize2, Sparkles, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NewsImageGridProps {
  imageUrls?: string[];
  imageUrl?: string;
  title: string;
  className?: string;
  interactive?: boolean;
}

export function NewsImageGrid({
  imageUrls,
  imageUrl,
  title,
  className,
  interactive = true,
}: NewsImageGridProps) {
  // Gabungkan imageUrls dan single imageUrl menjadi array bersih
  const images = React.useMemo(() => {
    if (imageUrls && imageUrls.length > 0) {
      return imageUrls.filter(Boolean);
    }
    if (imageUrl) {
      return [imageUrl];
    }
    return [];
  }, [imageUrls, imageUrl]);

  const [activeIndex, setActiveIndex] = useState<number>(0);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  if (images.length === 0) {
    return null;
  }

  // Jaga agar activeIndex tidak out of bounds
  const currentActive = activeIndex < images.length ? activeIndex : 0;
  const currentImage = images[currentActive];

  const getOptimizedUrl = (url: string, width = 1200) => {
    if (!url || !url.includes('res.cloudinary.com')) return url;
    return url.replace('/image/upload/', `/image/upload/w_${width},q_auto,f_auto/`);
  };

  const openLightbox = (index: number) => {
    if (!interactive) return;
    setLightboxIndex(index);
  };

  const nextImage = () => {
    if (lightboxIndex === null) return;
    setLightboxIndex((lightboxIndex + 1) % images.length);
  };

  const prevImage = () => {
    if (lightboxIndex === null) return;
    setLightboxIndex((lightboxIndex - 1 + images.length) % images.length);
  };

  const count = images.length;

  return (
    <div className={cn('w-full select-none space-y-3', className)}>
      {/* 1. GAMBAR UTAMA (PROMINENT MAIN IMAGE ON TOP) */}
      <div
        onClick={() => openLightbox(currentActive)}
        className={cn(
          'group relative aspect-[16/10] sm:aspect-video w-full overflow-hidden rounded-2xl sm:rounded-3xl bg-slate-100 dark:bg-slate-900 border border-slate-200/80 dark:border-white/10 shadow-sm transition-all',
          interactive && 'cursor-pointer hover:shadow-md'
        )}
      >
        <img
          src={getOptimizedUrl(currentImage, 1400)}
          alt={`${title} - Foto ${currentActive + 1}`}
          className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.02]"
          loading="eager"
        />

        {/* Overlay Badges */}
        <div className="absolute top-3 left-3 flex items-center gap-2">
          {currentActive === 0 ? (
            <span className="bg-emerald-600/90 text-white backdrop-blur-md text-[10px] sm:text-xs font-black uppercase px-3 py-1 rounded-full shadow-md flex items-center gap-1.5 tracking-wider">
              <Sparkles className="w-3 h-3 text-emerald-200" />
              Foto Utama
            </span>
          ) : (
            <span className="bg-slate-900/80 text-white backdrop-blur-md text-[10px] sm:text-xs font-bold uppercase px-3 py-1 rounded-full shadow-md">
              Foto {currentActive + 1}
            </span>
          )}

          {count > 1 && (
            <span className="bg-black/50 text-white/90 backdrop-blur-md text-[10px] sm:text-xs font-mono font-bold px-2.5 py-1 rounded-full shadow">
              {currentActive + 1} / {count}
            </span>
          )}
        </div>

        {/* Zoom Button Icon on Hover */}
        {interactive && (
          <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-full bg-slate-950/60 backdrop-blur-md text-white flex items-center justify-center shadow-lg hover:bg-slate-950/80 transition-colors">
              <Maximize2 className="h-4 w-4" />
            </div>
          </div>
        )}

        {/* Bottom subtle hint */}
        {interactive && (
          <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-slate-950/60 via-slate-950/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex justify-between items-center text-white text-[11px] font-medium">
            <span>Klik untuk memperbesar foto</span>
            <span className="font-mono text-[10px] text-white/80">{count} Dokumentasi Foto</span>
          </div>
        )}
      </div>

      {/* 2. THUMBNAILS DI BAWAH (HANYA MUNCUL KETIKA > 1 FOTO) */}
      {count > 1 && (
        <div className="pt-1">
          <div className="flex items-center justify-between mb-2 px-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 font-mono">
              Galeri Foto Kegiatan ({count} Foto):
            </span>
            <span className="text-[10px] text-stone-500 italic hidden sm:inline">
              Pilih foto kecil di bawah untuk mengganti tampilan gambar utama
            </span>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2 sm:gap-2.5">
            {images.map((img, idx) => {
              const isSelected = idx === currentActive;
              return (
                <button
                  type="button"
                  key={idx}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setActiveIndex(idx);
                  }}
                  className={cn(
                    'group relative aspect-[4/3] w-full overflow-hidden rounded-xl bg-slate-100 dark:bg-slate-800 border transition-all text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500',
                    isSelected
                      ? 'ring-2 ring-emerald-600 border-emerald-500 shadow-sm scale-[1.03] z-10'
                      : 'border-slate-200/90 dark:border-white/10 opacity-70 hover:opacity-100 hover:scale-[1.01]'
                  )}
                  title={`Lihat foto ${idx + 1}`}
                >
                  <img
                    src={getOptimizedUrl(img, 400)}
                    alt={`${title} - Thumbnail ${idx + 1}`}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    loading="lazy"
                  />

                  {/* Active Indicator Overlay */}
                  {isSelected && (
                    <div className="absolute inset-0 bg-emerald-600/15 pointer-events-none border-2 border-emerald-500 rounded-xl flex items-start justify-end p-1">
                      <span className="bg-emerald-600 text-white rounded-full p-0.5 shadow">
                        <CheckCircle2 className="w-3 h-3" />
                      </span>
                    </div>
                  )}

                  {/* Number Badge */}
                  <span
                    className={cn(
                      'absolute bottom-1 left-1 text-[9px] font-bold font-mono px-1.5 py-0.2 rounded shadow-xs',
                      isSelected ? 'bg-emerald-600 text-white' : 'bg-slate-900/75 text-white'
                    )}
                  >
                    #{idx + 1}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. LIGHTBOX DIALOG MODAL (FULL RESOLUTION ZOOM) */}
      {interactive && (
        <Dialog open={lightboxIndex !== null} onOpenChange={(open) => !open && setLightboxIndex(null)}>
          <DialogContent className="max-w-5xl bg-slate-950/95 border-none text-white p-0 overflow-hidden sm:rounded-3xl">
            <DialogTitle className="sr-only">{title} Galeri Foto</DialogTitle>
            {lightboxIndex !== null && (
              <div className="relative flex flex-col items-center justify-center min-h-[260px] sm:min-h-[480px] max-h-[85vh] p-3 sm:p-5">
                <img
                  src={images[lightboxIndex]}
                  alt={`${title} - Galeri ${lightboxIndex + 1}`}
                  className="max-h-[70vh] sm:max-h-[75vh] w-auto max-w-full object-contain rounded-xl sm:rounded-2xl shadow-2xl"
                />

                {/* Left & Right Navigation */}
                {images.length > 1 && (
                  <>
                    <button
                      onClick={prevImage}
                      className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md flex items-center justify-center text-white transition-all shadow-md active:scale-95"
                      aria-label="Previous image"
                    >
                      <ChevronLeft className="h-6 w-6" />
                    </button>
                    <button
                      onClick={nextImage}
                      className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md flex items-center justify-center text-white transition-all shadow-md active:scale-95"
                      aria-label="Next image"
                    >
                      <ChevronRight className="h-6 w-6" />
                    </button>
                  </>
                )}

                {/* Lightbox Footer & Thumbnails */}
                <div className="mt-3 sm:mt-4 flex flex-col items-center gap-2 w-full px-4 text-xs">
                  <div className="flex items-center justify-between w-full text-slate-300 font-medium">
                    <span className="line-clamp-1">{title}</span>
                    <span className="font-mono font-bold tracking-widest text-emerald-400 bg-emerald-950/50 px-2 py-0.5 rounded-full border border-emerald-500/30">
                      {lightboxIndex + 1} / {images.length}
                    </span>
                  </div>

                  {images.length > 1 && (
                    <div className="flex items-center gap-1.5 overflow-x-auto max-w-full py-1 scrollbar-thin">
                      {images.map((img, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => setLightboxIndex(i)}
                          className={cn(
                            'h-10 w-14 rounded-md overflow-hidden shrink-0 border transition-all',
                            lightboxIndex === i ? 'ring-2 ring-emerald-500 border-white scale-105' : 'opacity-50 hover:opacity-100 border-white/20'
                          )}
                        >
                          <img src={getOptimizedUrl(img, 200)} alt={`Thumb ${i + 1}`} className="h-full w-full object-cover" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
