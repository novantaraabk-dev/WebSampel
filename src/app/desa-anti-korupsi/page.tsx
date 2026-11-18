'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Header } from '@/components/landing/Header';
import { Footer } from '@/components/landing/Footer';
import { BackgroundPattern } from '@/components/landing/BackgroundPattern';
import { antiKorupsiData, AntiKorupsiMainMenu, AntiKorupsiSubMenu, AntiKorupsiItem } from '@/lib/desa-anti-korupsi-data';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query } from 'firebase/firestore';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ShieldCheck, FileText, Image as ImageIcon, ExternalLink, Download, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DBItemData {
  id: string; // matches item.id, e.g. "1.1.1"
  itemId: string;
  pdfUrl?: string;
  pdfName?: string;
  imageUrl?: string;
  imageName?: string;
  pdfs?: Array<{ url: string; name: string }>;
  images?: Array<{ url: string; name: string }>;
  tahunData?: {
    [tahun: string]: {
      pdfs?: Array<{ url: string; name: string }>;
      images?: Array<{ url: string; name: string }>;
    };
  };
  updatedAt?: any;
}

const extractFileIdFromUrl = (url: string): string => {
  if (!url) return '';
  const match = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (match) return match[1];
  const idMatch = url.match(/id=([a-zA-Z0-9_-]+)/);
  return idMatch ? idMatch[1] : url;
};

const getEmbedImageUrl = (url: string): string => {
  if (!url) return '';
  if (url.includes('drive.google.com') || url.includes('docs.google.com')) {
    const fileId = extractFileIdFromUrl(url);
    return fileId ? `https://lh3.googleusercontent.com/d/${fileId}` : url;
  }
  return url;
};

const getPdfsForYear = (files: DBItemData | undefined, year: string): Array<{ url: string; name: string }> => {
  if (!files) return [];

  if (files.tahunData?.[year]?.pdfs && files.tahunData[year].pdfs.length > 0) {
    return files.tahunData[year].pdfs;
  }

  const topPdfs = files.pdfs || (files.pdfUrl ? [{ url: files.pdfUrl, name: files.pdfName || 'Dokumen PDF' }] : []);

  return topPdfs.filter(pdf => {
    if (pdf.name?.includes('2024')) return year === '2024';
    if (pdf.name?.includes('2025')) return year === '2025';
    if (pdf.name?.includes('2026')) return year === '2026';
    return year === '2026';
  });
};

const getImagesForYear = (files: DBItemData | undefined, year: string): Array<{ url: string; name: string }> => {
  if (!files) return [];

  if (files.tahunData?.[year]?.images && files.tahunData[year].images.length > 0) {
    return files.tahunData[year].images;
  }

  const topImages = files.images || (files.imageUrl ? [{ url: files.imageUrl, name: files.imageName || 'Foto Dukung' }] : []);

  return topImages.filter(img => {
    if (img.name?.includes('2024')) return year === '2024';
    if (img.name?.includes('2025')) return year === '2025';
    if (img.name?.includes('2026')) return year === '2026';
    return year === '2026';
  });
};

export default function DesaAntiKorupsi() {
  const [activeTab, setActiveTab] = useState<string>("1");
  const [selectedYear, setSelectedYear] = useState<string>("semua");
  const [selectedImages, setSelectedImages] = useState<Array<{ url: string; name: string; tahun?: string }> | null>(null);
  const [activeImageIndex, setActiveImageIndex] = useState<number>(0);
  const [activeItemTitle, setActiveItemTitle] = useState<string>('');
  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);

  const firestore = useFirestore();

  // Load uploaded documents from firestore
  const antiKorupsiQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'desaAntiKorupsi'));
  }, [firestore]);

  const { data: dbItems, isLoading, error } = useCollection<DBItemData>(antiKorupsiQuery);

  // Map database items by their ID for fast lookup
  const uploadedFilesMap = useMemo(() => {
    const map = new Map<string, DBItemData>();
    if (dbItems) {
      dbItems.forEach(item => {
        map.set(item.itemId || item.id, item);
      });
    }
    return map;
  }, [dbItems]);

  const activePilar = useMemo(() => {
    return antiKorupsiData.find(p => p.id === activeTab);
  }, [activeTab]);

  return (
    <div className="relative flex min-h-screen flex-col bg-[#F8FAFC] dark:bg-[#060b11] text-slate-900 dark:text-slate-100 overflow-x-hidden font-sans">
      <BackgroundPattern />
      <Header />

      <main className="relative flex-1 pt-20 sm:pt-24 pb-12 sm:pb-16">
        {/* Hero Section */}
        <section className="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8 pt-6 sm:pt-12 pb-4 sm:pb-8">
          <div className="text-center max-w-3xl mx-auto space-y-2 sm:space-y-3">
            <div className="flex items-center justify-center gap-2">
              <span className="w-5 h-[2px] bg-teal-500 shrink-0" />
              <span className="text-[11px] sm:text-xs font-bold uppercase tracking-widest text-teal-700 dark:text-teal-300">
                Program Integritas Desa
              </span>
            </div>

            <h1 className="text-2xl min-[380px]:text-3xl sm:text-4xl md:text-5xl font-condensed font-bold text-slate-900 dark:text-white uppercase tracking-tight leading-[0.95]">
              Desa <span className="text-teal-600 dark:text-teal-400">Anti Korupsi</span>
            </h1>

            <p className="text-xs sm:text-sm leading-relaxed text-slate-600 dark:text-slate-400 max-w-2xl mx-auto font-medium">
              Wujud nyata transparansi, akuntabilitas, dan integritas Pemerintah Desa Sampeldes dengan akses terbuka terhadap dokumen perencanaan, pengawasan, pelayanan publik, dan kearifan lokal.
            </p>
          </div>
        </section>

        {/* Main Content Area */}
        <section className="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8">
          {/* Navigation Pilar Tabs - 5 Columns or 3+2 Grid on Mobile */}
          <div className="rounded-2xl p-2 sm:p-2.5 border border-slate-200/80 dark:border-white/10 bg-white/90 dark:bg-[#081d27]/90 backdrop-blur-md grid grid-cols-3 sm:grid-cols-5 gap-2 mb-6 sm:mb-8">
            {antiKorupsiData.map((pilar, idx) => {
              const isActive = activeTab === pilar.id;
              return (
                <button
                  key={pilar.id}
                  onClick={() => setActiveTab(pilar.id)}
                  className={cn(
                    "py-2.5 sm:py-3 px-2 sm:px-3 rounded-xl text-center text-[10px] min-[380px]:text-[11px] sm:text-xs font-condensed font-bold uppercase tracking-tight transition-all duration-300 cursor-pointer",
                    idx === 3 ? "col-span-1 min-[380px]:col-span-1" : "",
                    idx === 4 ? "col-span-2 min-[380px]:col-span-2 sm:col-span-1" : "",
                    isActive
                      ? "bg-teal-600 text-white shadow-md scale-[1.01]"
                      : "text-slate-600 dark:text-slate-300 hover:text-teal-600 dark:hover:text-teal-400 hover:bg-slate-100 dark:hover:bg-white/5"
                  )}
                >
                  <span className="block text-[8px] min-[380px]:text-[9px] opacity-80 mb-0.5 tracking-wider font-sans font-bold">PILAR {pilar.id.replace('pilar-', '')}</span>
                  <span className="line-clamp-1">{pilar.title}</span>
                </button>
              );
            })}
          </div>

          {/* Active Pilar Detail */}
          {activePilar && (
            <div className="space-y-4 sm:space-y-6 animate-fadeIn">
              <div className="border-l-4 border-teal-500 pl-3.5 sm:pl-4 py-1">
                <h2 className="text-base sm:text-xl font-condensed font-bold text-slate-900 dark:text-white uppercase tracking-tight leading-snug">
                  Pilar {activePilar.id.replace('pilar-', '')}: {activePilar.title}
                </h2>
                <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                  Berikut adalah daftar regulasi, dokumen pendukung, dan bukti implementasi pilar anti-korupsi.
                </p>
              </div>

              {isLoading ? (
                <div className="space-y-3 sm:space-y-4">
                  {[1, 2, 3].map((n) => (
                    <Skeleton key={n} className="h-14 sm:h-16 w-full rounded-2xl" />
                  ))}
                </div>
              ) : error ? (
                <div className="p-5 sm:p-6 bg-red-50/80 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 rounded-2xl flex items-center gap-3 text-red-700 dark:text-red-400">
                  <AlertCircle className="h-5 w-5 shrink-0" />
                  <p className="text-xs sm:text-sm font-medium">Gagal memuat dokumen. Silakan coba beberapa saat lagi.</p>
                </div>
              ) : (
                <Accordion type="single" collapsible className="space-y-3.5 w-full">
                  {activePilar.subMenus.map((subMenu) => (
                    <AccordionItem
                      key={subMenu.id}
                      value={subMenu.id}
                      className="rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white/95 dark:bg-[#081d27]/90 backdrop-blur-md overflow-hidden px-4 sm:px-6 transition-all duration-200 hover:border-teal-500/40 shadow-sm"
                    >
                      <AccordionTrigger className="hover:no-underline py-4 text-left">
                        <div className="flex items-start gap-2.5 sm:gap-3">
                          <span className="font-mono text-teal-700 dark:text-teal-300 font-bold bg-teal-500/10 px-2 py-0.5 rounded-lg text-[10px] sm:text-xs shrink-0 mt-0.5 border border-teal-500/20">
                            {subMenu.id}
                          </span>
                          <span className="text-xs sm:text-sm font-condensed font-bold uppercase tracking-tight text-slate-900 dark:text-white leading-snug hover:text-teal-600 dark:hover:text-teal-400 transition-colors">
                            {subMenu.title}
                          </span>
                        </div>
                      </AccordionTrigger>

                      <AccordionContent className="pb-4 sm:pb-6 pt-1 sm:pt-2 border-t border-slate-100 dark:border-white/10">
                        <div className="space-y-2.5 sm:space-y-3 mt-2 sm:mt-4">
                          {subMenu.items.map((item) => {
                            const files = uploadedFilesMap.get(item.id);
                            const yearsToDisplay = selectedYear === 'semua' ? ['2024', '2025', '2026'] : [selectedYear];

                            const hasAnyFile = yearsToDisplay.some(yr => {
                              const p = getPdfsForYear(files, yr);
                              const img = getImagesForYear(files, yr);
                              return p.length > 0 || img.length > 0;
                            });

                            return (
                              <div
                                key={item.id}
                                className="p-3.5 sm:p-5 rounded-xl bg-slate-50/80 dark:bg-white/[0.03] border border-slate-200/60 dark:border-white/5 transition-all space-y-2.5 sm:space-y-3.5"
                              >
                                <div className="flex items-start gap-2.5 sm:gap-3">
                                  <span className="font-mono text-[10px] sm:text-[11px] text-teal-800 dark:text-teal-200 font-bold bg-teal-500/15 px-2.5 py-0.5 rounded-full shrink-0 mt-0.5 border border-teal-500/30">
                                    {item.id}
                                  </span>
                                  <h4 className="text-xs sm:text-sm md:text-base font-bold text-slate-800 dark:text-slate-200 leading-snug">
                                    {item.title}
                                  </h4>
                                </div>

                                {hasAnyFile ? (
                                  <div className="space-y-2 sm:space-y-2.5 pt-1">
                                    {yearsToDisplay.map((yr) => {
                                      const yearPdfs = getPdfsForYear(files, yr);
                                      const yearImages = getImagesForYear(files, yr);

                                      if (yearPdfs.length === 0 && yearImages.length === 0) return null;

                                      return (
                                        <div
                                          key={yr}
                                          className="bg-white dark:bg-[#0a2330] border border-slate-200/80 dark:border-white/10 rounded-xl p-3 sm:p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3 transition-colors shadow-xs"
                                        >
                                          <div className="flex items-center gap-1.5 shrink-0">
                                            <span className="px-2.5 py-0.5 rounded-full bg-teal-500/15 text-teal-800 dark:text-teal-200 text-[10px] sm:text-[11px] font-bold uppercase font-mono tracking-wide border border-teal-500/30">
                                              Tahun {yr}
                                            </span>
                                          </div>

                                          <div className="flex flex-wrap items-center gap-2 flex-1 sm:justify-end">
                                            {yearPdfs.map((pdf, idx) => (
                                              <a
                                                key={`pdf-${yr}-${idx}`}
                                                href={pdf.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                title={pdf.name}
                                              >
                                                <Button
                                                  variant="outline"
                                                  size="sm"
                                                  className="h-8 sm:h-9 rounded-full bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/30 dark:hover:bg-rose-950/50 text-rose-800 dark:text-rose-300 border border-rose-200/70 dark:border-rose-900/40 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider max-w-full gap-1.5 px-3 sm:px-4"
                                                >
                                                  <FileText className="h-3.5 w-3.5 text-rose-600 shrink-0" />
                                                  <span className="max-w-[120px] min-[380px]:max-w-[150px] sm:max-w-[200px] truncate">
                                                    {pdf.name}
                                                  </span>
                                                  <ExternalLink className="h-2.5 w-2.5 text-rose-400 shrink-0" />
                                                </Button>
                                              </a>
                                            ))}

                                            {yearImages.map((img, idx) => (
                                              <Button
                                                key={`img-${yr}-${idx}`}
                                                variant="outline"
                                                size="sm"
                                                onClick={() => {
                                                  setSelectedImages(yearImages);
                                                  setActiveImageIndex(idx);
                                                  setActiveItemTitle(`${item.title} (Tahun ${yr})`);
                                                  setIsDialogOpen(true);
                                                }}
                                                title={img.name}
                                                className="h-8 sm:h-9 rounded-full bg-teal-50 hover:bg-teal-100 dark:bg-teal-950/30 dark:hover:bg-teal-950/50 text-teal-800 dark:text-teal-200 border border-teal-200/70 dark:border-teal-900/40 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider max-w-full gap-1.5 px-3 sm:px-4 transition-colors"
                                              >
                                                <ImageIcon className="h-3.5 w-3.5 text-teal-600 shrink-0" />
                                                <span className="max-w-[120px] min-[380px]:max-w-[150px] sm:max-w-[200px] truncate">
                                                  {img.name}
                                                </span>
                                              </Button>
                                            ))}
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                ) : (
                                  <p className="text-[10.5px] sm:text-[11px] font-medium text-slate-400 italic pt-0.5 pl-0.5">
                                    Belum ada dokumen terunggah untuk item ini.
                                  </p>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              )}
            </div>
          )}
        </section>
      </main>

      {/* Dialog for Image documentation */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl bg-white dark:bg-[#081d27] rounded-2xl border border-slate-200 dark:border-white/10 p-5 sm:p-7 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-slate-900 dark:text-white text-sm sm:text-base font-condensed font-bold uppercase tracking-tight flex items-center gap-1.5 sm:gap-2">
              <ShieldCheck className="h-4 w-4 sm:h-5 sm:w-5 text-teal-600 shrink-0" />
              <span className="line-clamp-1">Dokumentasi: {activeItemTitle}</span>
            </DialogTitle>
          </DialogHeader>

          {selectedImages && selectedImages.length > 0 && (
            <div className="space-y-4 mt-4">
              {/* Main image preview */}
              <div className="relative aspect-video w-full overflow-hidden rounded-2xl neu-inset flex items-center justify-center p-2">
                <img
                  src={getEmbedImageUrl(selectedImages[activeImageIndex]?.url || '')}
                  alt={selectedImages[activeImageIndex]?.name || ''}
                  className="h-full w-full object-contain rounded-xl"
                />

                {/* Left / Right navigation buttons */}
                {selectedImages.length > 1 && (
                  <>
                    <button
                      onClick={() => setActiveImageIndex((prev) => (prev > 0 ? prev - 1 : selectedImages.length - 1))}
                      className="absolute left-3 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full bg-white/90 dark:bg-[#081d27]/90 text-slate-700 dark:text-slate-200 flex items-center justify-center transition-transform hover:scale-110 shadow-md text-sm font-bold border border-slate-200 dark:border-white/10"
                    >
                      &#10094;
                    </button>
                    <button
                      onClick={() => setActiveImageIndex((prev) => (prev < selectedImages.length - 1 ? prev + 1 : 0))}
                      className="absolute right-3 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full bg-white/90 dark:bg-[#081d27]/90 text-slate-700 dark:text-slate-200 flex items-center justify-center transition-transform hover:scale-110 shadow-md text-sm font-bold border border-slate-200 dark:border-white/10"
                    >
                      &#10095;
                    </button>
                  </>
                )}
              </div>

              {/* Caption */}
              <p className="text-center text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                {selectedImages[activeImageIndex]?.name || `Foto ${activeImageIndex + 1}`}
              </p>

              {/* Thumbnail Row */}
              {selectedImages.length > 1 && (
                <div className="flex gap-2.5 justify-center overflow-x-auto py-2 border-t border-slate-100 dark:border-white/10 max-w-full">
                  {selectedImages.map((img, idx) => {
                    const isActive = idx === activeImageIndex;
                    const fileId = extractFileIdFromUrl(img.url);
                    const thumbUrl = fileId ? `https://lh3.googleusercontent.com/d/${fileId}` : img.url;
                    return (
                      <button
                        key={idx}
                        onClick={() => setActiveImageIndex(idx)}
                        className={`relative h-11 w-16 overflow-hidden rounded-xl border-2 transition-all shrink-0 ${isActive ? 'border-teal-500 ring-2 ring-teal-500/40 scale-105 shadow-md' : 'border-transparent opacity-70 hover:opacity-100'
                          }`}
                      >
                        <img
                          src={thumbUrl}
                          alt={`Thumb ${idx + 1}`}
                          className="h-full w-full object-cover"
                        />
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          <div className="flex justify-between items-center mt-5 border-t border-slate-100 dark:border-white/10 pt-4">
            {selectedImages && selectedImages.length > 1 && (
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Foto {activeImageIndex + 1} dari {selectedImages.length}
              </span>
            )}
            <div className="flex justify-end gap-2 ml-auto">
              {selectedImages && selectedImages[activeImageIndex] && (
                <a
                  href={selectedImages[activeImageIndex].url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button size="sm" className="h-9 rounded-full bg-teal-600 hover:bg-teal-500 text-white text-[10px] font-bold uppercase tracking-wider shadow-sm">
                    <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                    Buka Asli
                  </Button>
                </a>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
}
