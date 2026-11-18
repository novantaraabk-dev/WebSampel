'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Header } from '@/components/landing/Header';
import { Footer } from '@/components/landing/Footer';
import { BackgroundPattern } from '@/components/landing/BackgroundPattern';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import {
  Store,
  ShoppingBag,
  Info,
  Search,
  MapPin,
  CheckCircle2,
  MessageCircle,
  ImageIcon,
  Loader2,
  TrendingUp,
  ShieldCheck,
  PackageCheck,
  ChevronRight,
  ExternalLink
} from 'lucide-react';
import { PotensiDesa, ProductUmkm } from '@/lib/types';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';

function ShopeeIcon({ className = "h-4 w-4" }: { className?: string }) {
  return <ShoppingBag className={className} />;
}

function TokopediaIcon({ className = "h-4 w-4" }: { className?: string }) {
  return <Store className={className} />;
}

function LazadaIcon({ className = "h-4 w-4" }: { className?: string }) {
  return <ShoppingBag className={className} />;
}

const PRODUCT_CATEGORIES = [
  'Semua Kategori',
  'Kuliner & Olahan',
  'Kerajinan & Kriya',
  'Pertanian & Perkebunan',
  'Fashion & Tekstil',
  'Jasa Kreatif',
  'Lainnya'
];

function UmkmInfoGallery({ item }: { item: PotensiDesa }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [fullscreenUrl, setFullscreenUrl] = useState<string | null>(null);

  const images = item.imageUrls || [];
  const hasMultiple = images.length > 1;

  if (images.length === 0) {
    return null;
  }

  const currentImage = images[activeIndex] || images[0];

  return (
    <div className="space-y-4 w-full">
      {/* Main Showcase Image Container (Dynamic Landscape / Portrait) */}
      <div className="relative w-full overflow-hidden rounded-2xl sm:rounded-[2.5rem] bg-slate-950 border border-stone-200/80 shadow-md group flex items-center justify-center min-h-[190px] sm:min-h-[400px] md:min-h-[500px] max-h-[680px]">
        {/* Ambient Blur Backdrop for matching portrait / custom aspect ratios */}
        <div
          className="absolute inset-0 bg-cover bg-center blur-2xl opacity-40 scale-110 pointer-events-none transition-all duration-700"
          style={{ backgroundImage: `url(${currentImage})` }}
        />

        {/* Main Photo (Full Landscape / Portrait without forceful cropping) */}
        <img
          src={currentImage}
          alt={`${item.title} - Foto ${activeIndex + 1}`}
          onClick={() => setFullscreenUrl(currentImage)}
          className="relative z-10 max-h-[640px] w-auto max-w-full object-contain cursor-zoom-in transition-transform duration-500 group-hover:scale-[1.01] p-1 md:p-2"
        />

        {/* Counter Badge */}
        {hasMultiple && (
          <div className="absolute bottom-2 right-2 sm:bottom-4 sm:right-4 bg-slate-900/85 backdrop-blur-md text-white px-2.5 py-1 sm:px-3.5 sm:py-1.5 rounded-full text-[9px] sm:text-[11px] font-black uppercase tracking-wider shadow-lg z-20 border border-white/10">
            Foto {activeIndex + 1} dari {images.length}
          </div>
        )}

        {/* Navigation Arrows */}
        {hasMultiple && (
          <>
            <div
              role="button"
              tabIndex={0}
              onClick={(e: React.MouseEvent) => {
                e.stopPropagation();
                setActiveIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
              }}
              onKeyDown={(e: React.KeyboardEvent) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  setActiveIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
                }
              }}
              className="absolute left-3 md:left-5 top-1/2 -translate-y-1/2 h-10 w-10 md:h-12 md:w-12 rounded-full bg-white/90 hover:bg-white text-slate-800 shadow-xl flex items-center justify-center transition-all opacity-85 hover:opacity-100 hover:scale-110 z-20 cursor-pointer"
              aria-label="Foto Sebelumnya"
            >
              <ChevronRight className="h-5 w-5 md:h-6 md:w-6 rotate-180" />
            </div>

            <div
              role="button"
              tabIndex={0}
              onClick={(e: React.MouseEvent) => {
                e.stopPropagation();
                setActiveIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
              }}
              onKeyDown={(e: React.KeyboardEvent) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  setActiveIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
                }
              }}
              className="absolute right-3 md:right-5 top-1/2 -translate-y-1/2 h-10 w-10 md:h-12 md:w-12 rounded-full bg-white/90 hover:bg-white text-slate-800 shadow-xl flex items-center justify-center transition-all opacity-85 hover:opacity-100 hover:scale-110 z-20 cursor-pointer"
              aria-label="Foto Selanjutnya"
            >
              <ChevronRight className="h-5 w-5 md:h-6 md:w-6" />
            </div>
          </>
        )}
      </div>

      {/* Thumbnails Row for Multiple Photos */}
      {hasMultiple && (
        <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar pt-1 items-center">
          {images.map((url, idx) => (
            <div
              key={idx}
              role="button"
              tabIndex={0}
              onClick={() => setActiveIndex(idx)}
              onKeyDown={(e: React.KeyboardEvent) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  setActiveIndex(idx);
                }
              }}
              className={cn(
                "relative h-16 w-22 sm:h-20 sm:w-28 rounded-2xl overflow-hidden border-2 transition-all shrink-0 bg-slate-900 shadow-sm cursor-pointer",
                activeIndex === idx
                  ? "border-teal-400 ring-4 ring-teal-500/30 scale-105 shadow-md"
                  : "border-slate-200 opacity-60 hover:opacity-100"
              )}
            >
              <img src={url} alt={`Thumbnail ${idx + 1}`} className="w-full h-full object-cover" />
            </div>
          ))}
        </div>
      )}

      {/* Lightbox Zoom Modal */}
      <Dialog open={!!fullscreenUrl} onOpenChange={(open: boolean) => !open && setFullscreenUrl(null)}>
        {fullscreenUrl && (
          <DialogContent className="max-w-5xl p-2 bg-black/95 border-none text-white rounded-3xl overflow-hidden">
            <DialogHeader className="sr-only">
              <DialogTitle>Pratinjau Foto {item.title}</DialogTitle>
            </DialogHeader>
            <div className="relative w-full max-h-[90vh] flex items-center justify-center p-2">
              <img
                src={fullscreenUrl}
                alt="Fullscreen View"
                className="max-h-[85vh] w-auto max-w-full object-contain rounded-2xl shadow-2xl"
              />
            </div>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}

function UmkmPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const tabParam = searchParams.get('tab');

  const [activeTab, setActiveTab] = useState<'informasi' | 'katalog'>('informasi');
  const [selectedProduct, setSelectedProduct] = useState<ProductUmkm | null>(null);
  const [selectedInfo, setSelectedInfo] = useState<PotensiDesa | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Semua Kategori');

  const firestore = useFirestore();

  // Sync tab with URL search parameter
  useEffect(() => {
    if (tabParam === 'katalog' || tabParam === 'katalog-produk') {
      setActiveTab('katalog');
    } else if (tabParam === 'informasi') {
      setActiveTab('informasi');
    }
  }, [tabParam]);

  const handleTabChange = (tab: 'informasi' | 'katalog') => {
    setActiveTab(tab);
    const url = new URL(window.location.href);
    url.searchParams.set('tab', tab);
    router.push(url.pathname + url.search, { scroll: false });
  };

  // Fetch Firestore potensi desa filtered by UMKM category
  const potentialsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'potensiDesa'), orderBy('createdAt', 'desc'));
  }, [firestore]);

  const { data: allPotentials, isLoading: isLoadingPotentials } = useCollection<PotensiDesa>(potentialsQuery, { suppressGlobalError: true });

  const umkmPotentials = useMemo(() => {
    if (!allPotentials) return [];
    return allPotentials.filter(item => item.category === 'umkm-industri');
  }, [allPotentials]);

  // Fetch Firestore products
  const productsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'katalogProduk'), orderBy('createdAt', 'desc'));
  }, [firestore]);

  const { data: firestoreProducts, isLoading: isLoadingProducts } = useCollection<ProductUmkm>(productsQuery, { suppressGlobalError: true });

  // Active product dataset (Only from Firestore uploaded by Admin)
  const activeProducts = useMemo(() => {
    return firestoreProducts || [];
  }, [firestoreProducts]);

  // Filter products by search and category
  const filteredProducts = useMemo(() => {
    return activeProducts.filter(prod => {
      const matchSearch =
        prod.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        prod.businessName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (prod.owner && prod.owner.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (prod.description && prod.description.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchCategory =
        selectedCategory === 'Semua Kategori' || prod.category === selectedCategory;

      return matchSearch && matchCategory;
    });
  }, [activeProducts, searchQuery, selectedCategory]);

  return (
    <div className="relative flex min-h-screen flex-col bg-[#F8FAFC] dark:bg-[#060b11] text-slate-900 dark:text-slate-100 overflow-x-hidden pt-24 font-sans">
      <BackgroundPattern />
      <Header />

      <main className="relative flex-1 container mx-auto px-3 sm:px-4 py-6 sm:py-10 md:py-16 max-w-7xl">
        {/* Banner Title */}
        <div className="text-center space-y-2 sm:space-y-3 max-w-3xl mx-auto mb-6 sm:mb-10 md:mb-12 animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="flex items-center justify-center gap-2">
            <span className="w-5 h-[2px] bg-teal-600 dark:bg-teal-400 shrink-0" />
            <span className="text-[11px] sm:text-xs font-bold uppercase tracking-widest text-teal-700 dark:text-teal-400">
              Pemberdayaan Ekonomi &amp; Kreativitas Warga
            </span>
          </div>
          <h1 className="text-2xl min-[380px]:text-3xl md:text-5xl lg:text-6xl font-condensed font-bold text-slate-900 dark:text-white leading-[0.95] uppercase tracking-tight">
            UMKM &amp; <span className="text-teal-600 dark:text-teal-400">Industri Kreatif</span>
          </h1>
          <p className="text-slate-600 font-medium text-xs sm:text-base max-w-2xl mx-auto leading-relaxed">
            Pusat informasi wirausaha mandiri, galeri produk unggulan karya warga, serta wadah promosi produk lokal Desa Sampeldes.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex justify-center mb-6 sm:mb-10">
          <div className="neu-inset p-1.5 rounded-full border border-white/50 grid grid-cols-2 sm:inline-flex gap-1.5 sm:gap-2 w-full max-w-md sm:w-auto">
            <button
              onClick={() => handleTabChange('informasi')}
              className={cn(
                "flex items-center justify-center gap-1.5 sm:gap-2 px-4 sm:px-7 py-2.5 rounded-full text-[11px] sm:text-xs md:text-sm font-condensed font-bold uppercase tracking-tight transition-all duration-300 text-center",
                activeTab === 'informasi'
                  ? "neu-btn-dark text-teal-400 shadow-sm"
                  : "text-slate-600 hover:text-slate-950"
              )}
            >
              <Info className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
              <span className="line-clamp-1">1. Informasi</span>
            </button>

            <button
              onClick={() => handleTabChange('katalog')}
              className={cn(
                "flex items-center justify-center gap-1.5 sm:gap-2 px-4 sm:px-7 py-2.5 rounded-full text-[11px] sm:text-xs md:text-sm font-condensed font-bold uppercase tracking-tight transition-all duration-300 text-center",
                activeTab === 'katalog'
                  ? "neu-btn-dark text-teal-400 shadow-sm"
                  : "text-slate-600 hover:text-slate-950"
              )}
            >
              <ShoppingBag className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
              <span className="line-clamp-1">2. Katalog</span>
              <span className={cn(
                "text-[9px] sm:text-[10px] px-2 py-0.5 rounded-full font-bold transition-colors shrink-0",
                activeTab === 'katalog' ? "bg-teal-500 text-slate-950" : "bg-black/10 text-slate-700"
              )}>
                {activeProducts.length}
              </span>
            </button>
          </div>
        </div>

        {/* TAB 1: INFORMASI */}
        {activeTab === 'informasi' && (
          <div className="space-y-6 sm:space-y-12 animate-in fade-in duration-500">
            {/* Highlights Grid - 3 cards (compact on mobile) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-6">
              <div className="neu-card-elevated rounded-[28px] border border-white/60 p-5 sm:p-6 hover:scale-[1.01] transition-all">
                <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-2xl neu-inset text-emerald-700 flex items-center justify-center mb-3 sm:mb-4">
                  <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6" />
                </div>
                <h3 className="text-base sm:text-lg font-condensed font-bold uppercase tracking-tight text-slate-900">
                  Pemberdayaan Ekonomi
                </h3>
                <p className="text-[11px] sm:text-xs md:text-sm text-slate-500 font-medium mt-1 sm:mt-1.5 leading-relaxed">
                  Mendukung pertumbuhan puluhan pelaku usaha mikro di sektor olahan pangan, kerajinan tangan, dan agrobisnis di seluruh wilayah dusun.
                </p>
              </div>

              <div className="neu-card-elevated rounded-[28px] border border-white/60 p-5 sm:p-6 hover:scale-[1.01] transition-all">
                <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-2xl neu-inset text-emerald-700 flex items-center justify-center mb-3 sm:mb-4">
                  <ShieldCheck className="h-5 w-5 sm:h-6 sm:w-6" />
                </div>
                <h3 className="text-base sm:text-lg font-condensed font-bold uppercase tracking-tight text-slate-900">
                  Pendampingan &amp; Legalitas
                </h3>
                <p className="text-[11px] sm:text-xs md:text-sm text-slate-500 font-medium mt-1 sm:mt-1.5 leading-relaxed">
                  Fasilitasi penerbitan NIB (Nomor Induk Berusaha), sertifikasi P-IRT, sertifikat Halal, serta pelatihan pengemasan higienis berstandar.
                </p>
              </div>

              <div className="neu-card-elevated rounded-[28px] border border-white/60 p-5 sm:p-6 hover:scale-[1.01] transition-all">
                <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-2xl neu-inset text-emerald-700 flex items-center justify-center mb-3 sm:mb-4">
                  <PackageCheck className="h-5 w-5 sm:h-6 sm:w-6" />
                </div>
                <h3 className="text-base sm:text-lg font-condensed font-bold uppercase tracking-tight text-slate-900">
                  Akses Pasar &amp; Digitalisasi
                </h3>
                <p className="text-[11px] sm:text-xs md:text-sm text-slate-500 font-medium mt-1 sm:mt-1.5 leading-relaxed">
                  Integrasi promosi melalui portal digital desa, kemitraan BUMDes, pameran UMKM kecamatan Cilacap, dan marketplace online.
                </p>
              </div>
            </div>

            {/* Grid Kartu Informasi UMKM */}
            <div className="space-y-4 sm:space-y-8">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-200/80 pb-3 sm:pb-4">
                <div>
                  <h2 className="text-base sm:text-xl md:text-2xl font-black text-slate-900 uppercase font-display">
                    Warta &amp; Potensi UMKM Desa
                  </h2>
                  <p className="text-[11px] sm:text-xs md:text-sm text-slate-500 font-medium mt-0.5">
                    Klik kartu di bawah untuk membuka informasi dan galeri foto lengkap.
                  </p>
                </div>
                {umkmPotentials.length > 0 && (
                  <Badge className="bg-teal-500/20 text-teal-700 dark:text-teal-300 border-none font-black text-[10px] sm:text-xs px-2.5 sm:px-3 py-0.5 sm:py-1 w-fit">
                    {umkmPotentials.length} Informasi
                  </Badge>
                )}
              </div>

              {isLoadingPotentials ? (
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-6 md:gap-8">
                  {[1, 2, 3, 4].map((n) => (
                    <div key={n} className="bg-white p-3 sm:p-5 rounded-2xl sm:rounded-[2rem] shadow-sm space-y-3">
                      <Skeleton className="aspect-[16/10] w-full rounded-xl sm:rounded-2xl" />
                      <Skeleton className="h-4 sm:h-6 w-3/4 rounded-md" />
                      <Skeleton className="h-3 sm:h-4 w-1/2 rounded-md" />
                      <Skeleton className="h-3 sm:h-4 w-full rounded-md" />
                    </div>
                  ))}
                </div>
              ) : umkmPotentials.length > 0 ? (
                // 2 Columns on Mobile for UMKM Potentials
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-6 md:gap-8">
                  {umkmPotentials.map((item) => {
                    const coverImage = item.imageUrls?.[0];
                    const photoCount = item.imageUrls?.length || 0;

                    return (
                      <div
                        key={item.id}
                        onClick={() => setSelectedInfo(item)}
                        className="group cursor-pointer bg-white rounded-2xl sm:rounded-[2rem] border-0 shadow-xs sm:shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden flex flex-col justify-between"
                      >
                        <div>
                          {/* Gambar Kecil / Thumbnail Cover */}
                          <div className="relative aspect-[16/10] w-full overflow-hidden bg-slate-900">
                            {coverImage ? (
                              <img
                                src={coverImage}
                                alt={item.title}
                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-slate-100 text-slate-300">
                                <ImageIcon className="h-8 w-8 sm:h-10 sm:w-10" />
                              </div>
                            )}

                            {/* Badge Overlay */}
                            <div className="absolute top-1.5 left-1.5 sm:top-3 sm:left-3 z-10">
                              <Badge className="bg-teal-500 text-slate-950 font-bold uppercase text-[7.5px] min-[380px]:text-[8.5px] sm:text-[10px] tracking-wider shadow-sm border-none px-2 py-0.5">
                                UMKM Desa
                              </Badge>
                            </div>

                            {photoCount > 1 && (
                              <div className="absolute top-1.5 right-1.5 sm:top-3 sm:right-3 z-10 bg-slate-900/80 backdrop-blur-md text-white px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full text-[7.5px] min-[380px]:text-[8.5px] sm:text-[10px] font-black uppercase tracking-wider flex items-center gap-1 shadow-sm">
                                <ImageIcon className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                                <span>{photoCount}</span>
                              </div>
                            )}
                          </div>

                          {/* Konten Kartu: Judul & Sub Judul */}
                          <div className="p-2.5 min-[380px]:p-3 sm:p-5 md:p-6 space-y-1.5 sm:space-y-2.5">
                            <h3 className="text-xs min-[380px]:text-sm sm:text-base md:text-lg font-black text-slate-900 group-hover:text-teal-600 dark:text-teal-400 transition-colors uppercase font-display leading-snug line-clamp-2">
                              {item.title}
                            </h3>

                            {item.subtitle && (
                              <p className="text-[9px] min-[380px]:text-[10px] sm:text-xs md:text-sm font-bold text-teal-600 dark:text-teal-400 uppercase tracking-wide line-clamp-1 border-l-2 border-teal-400 pl-1.5 sm:pl-2">
                                {item.subtitle}
                              </p>
                            )}

                            {item.narrative && (
                              <p className="text-[9.5px] min-[380px]:text-[10.5px] sm:text-xs text-slate-500 leading-relaxed line-clamp-2 pt-0.5 font-medium">
                                {item.narrative}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Footer Kartu: Tombol Klik Buka Informasi */}
                        <div className="p-2.5 min-[380px]:p-3 sm:p-5 md:p-6 pt-0">
                          <div className="pt-2 sm:pt-3 flex items-center justify-between text-[9px] min-[380px]:text-[10px] sm:text-xs font-bold text-teal-600 dark:text-teal-400 group-hover:text-teal-700 dark:group-hover:text-teal-300 transition-colors border-t border-slate-100">
                            <span>Buka Informasi</span>
                            <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4 transition-transform group-hover:translate-x-1" />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                /* Curated default overview article */
                <div className="bg-white rounded-[2.5rem] p-8 md:p-12 shadow-sm space-y-8">
                  <div className="max-w-3xl space-y-4">
                    <Badge className="bg-teal-500/20 text-teal-700 dark:text-teal-300 border-none font-bold uppercase text-[10px] px-3 py-1">
                      Profil Industri & Usaha Warga
                    </Badge>
                    <h2 className="text-2xl md:text-3xl font-black text-slate-900 font-display italic uppercase">
                      Ekosistem Usaha Mikro & Industri Kreatif Sampeldes
                    </h2>
                    <p className="text-slate-600 leading-relaxed font-medium text-sm md:text-base">
                      Desa Sampeldes memiliki potensi ekonomi mikro yang dinamis dan bertumbuh pesat. Didukung oleh kekayaan bahan baku pertanian seperti kelapa, singkong, bambu, serta keuletan para pengrajin dan pelaku kuliner rumahan, wirausaha desa menjadi tulang punggung penggerak kemandirian ekonomi keluarga.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                    <div className="flex gap-4">
                      <div className="h-10 w-10 rounded-xl bg-teal-500/20 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0 font-black">
                        1
                      </div>
                      <div className="space-y-1">
                        <h4 className="font-bold text-slate-900 text-sm">Sentra Olahan Pangan & Makanan Ringan</h4>
                        <p className="text-xs text-slate-500 leading-relaxed">
                          Produksi keripik singkong, gula semut organik, sambal pecel tradisional, dan berbagai kudapan khas siap konsumsi dan oleh-oleh.
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <div className="h-10 w-10 rounded-xl bg-teal-500/20 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0 font-black">
                        2
                      </div>
                      <div className="space-y-1">
                        <h4 className="font-bold text-slate-900 text-sm">Kriya Anyaman Bambu & Kerajinan Tangan</h4>
                        <p className="text-xs text-slate-500 leading-relaxed">
                          Pengrajin besek, hantaran, kap lampu bambu, dan dekorasi ramah lingkungan yang memanfaatkan rumpun bambu lokal.
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <div className="h-10 w-10 rounded-xl bg-teal-500/20 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0 font-black">
                        3
                      </div>
                      <div className="space-y-1">
                        <h4 className="font-bold text-slate-900 text-sm">Batik & Seni Kreatif Tradisional</h4>
                        <p className="text-xs text-slate-500 leading-relaxed">
                          Kreasi kain batik tulis dan cap dengan motif kearifan lokal yang dikembangkan oleh kelompok ibu-ibu PKK desa.
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <div className="h-10 w-10 rounded-xl bg-teal-500/20 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0 font-black">
                        4
                      </div>
                      <div className="space-y-1">
                        <h4 className="font-bold text-slate-900 text-sm">Produk Kesehatan & Madu Hutan</h4>
                        <p className="text-xs text-slate-500 leading-relaxed">
                          Budidaya lebah madu klanceng dan cerana serta produksi jamu herbal instan untuk menjaga kebugaran tubuh.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Switch to Catalog Banner */}
                  <div className="neu-card-elevated-dark rounded-[28px] border border-white/10 p-6 sm:p-8 text-white flex flex-col sm:flex-row items-center justify-between gap-5 shadow-lg">
                    <div className="space-y-1.5 text-center sm:text-left">
                      <h3 className="font-condensed font-bold text-lg sm:text-2xl uppercase tracking-tight text-white">
                        Ingin Melihat Produk-Produk Warga?
                      </h3>
                      <p className="text-xs md:text-sm text-slate-300 font-medium">
                        Jelajahi galeri katalog lengkap dan pesan langsung ke pengrajin / penjual lokal Sampeldes.
                      </p>
                    </div>
                    <Button
                      onClick={() => handleTabChange('katalog')}
                      className="neu-btn-gold rounded-full text-slate-950 font-condensed font-bold uppercase tracking-wider px-7 h-11 shrink-0"
                    >
                      Buka Katalog Produk
                      <ChevronRight className="h-4 w-4 ml-1.5" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: KATALOG PRODUK */}
        {activeTab === 'katalog' && (
          <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-500">
            {/* Search & Filter Bar */}
            <div className="neu-card-elevated rounded-[28px] border border-white/60 p-4 sm:p-6 space-y-3 sm:space-y-4">
              <div className="flex flex-col md:flex-row gap-3 sm:gap-4 items-center justify-between">
                <div className="relative w-full md:max-w-md">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-700" />
                  <Input
                    value={searchQuery}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                    placeholder="Cari produk, usaha, pemilik..."
                    className="pl-10 pr-4 h-11 rounded-full neu-inset border border-white/60 font-medium text-xs sm:text-sm focus:border-emerald-600"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] sm:text-xs text-slate-500 hover:text-slate-800 neu-pill px-2.5 py-0.5 rounded-full font-bold"
                    >
                      Clear
                    </button>
                  )}
                </div>

                <div className="text-[10px] sm:text-xs font-bold text-slate-500 self-end md:self-auto font-condensed uppercase tracking-wider">
                  Menampilkan <span className="text-emerald-800 font-bold">{filteredProducts.length}</span> produk
                </div>
              </div>

              {/* Category Pills */}
              <div className="flex flex-wrap gap-2 pt-1">
                {PRODUCT_CATEGORIES.map((cat) => {
                  const isActive = selectedCategory === cat;
                  return (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={cn(
                        "px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-full text-[10px] sm:text-xs font-condensed font-bold uppercase tracking-tight transition-all whitespace-nowrap",
                        isActive
                          ? "neu-btn-dark text-teal-400 shadow-sm"
                          : "neu-pill text-slate-700 hover:text-slate-900"
                      )}
                    >
                      {cat}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Products Grid - 2 Columns on Mobile */}
            {isLoadingProducts ? (
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-6 md:gap-8">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="bg-white rounded-[1.4rem] border border-stone-200/90 p-3 sm:p-4 shadow-xs space-y-2.5">
                    <Skeleton className="aspect-[4/3] w-full rounded-xl" />
                    <Skeleton className="h-3 sm:h-4 w-20 sm:w-28" />
                    <Skeleton className="h-4 sm:h-6 w-full" />
                    <Skeleton className="h-3 sm:h-4 w-1/2" />
                  </div>
                ))}
              </div>
            ) : activeProducts.length === 0 ? (
              <div className="rounded-[1.4rem] border border-stone-200/90 bg-white p-8 sm:p-12 text-center max-w-lg mx-auto shadow-xs">
                <div className="flex flex-col items-center justify-center space-y-2.5 sm:space-y-3">
                  <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-full bg-teal-500/20 text-teal-600 dark:text-teal-400 flex items-center justify-center">
                    <Store className="h-6 w-6 sm:h-7 sm:w-7" />
                  </div>
                  <h3 className="text-slate-900 font-condensed font-bold text-base sm:text-lg uppercase tracking-tight">
                    Belum Ada Produk UMKM
                  </h3>
                  <p className="text-[11px] sm:text-xs text-slate-500 leading-relaxed font-medium">
                    Data katalog produk UMKM Desa belum diunggah oleh Admin.
                  </p>
                </div>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="rounded-[1.4rem] border border-stone-200/90 bg-white p-8 sm:p-12 text-center max-w-lg mx-auto shadow-xs">
                <div className="flex flex-col items-center justify-center space-y-2.5 sm:space-y-3">
                  <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-full bg-teal-500/20 text-teal-600 dark:text-teal-400 flex items-center justify-center">
                    <Search className="h-6 w-6 sm:h-7 sm:w-7" />
                  </div>
                  <h3 className="text-slate-900 font-condensed font-bold text-base sm:text-lg uppercase tracking-tight">
                    Produk Tidak Ditemukan
                  </h3>
                  <p className="text-[11px] sm:text-xs text-slate-500 font-medium">
                    Coba gunakan kata kunci pencarian lain atau pilih Semua Kategori.
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedCategory('Semua Kategori');
                    }}
                    className="rounded-full text-[10px] sm:text-xs font-condensed font-bold uppercase tracking-wider border-slate-300 hover:bg-[#070b10] hover:text-teal-400 h-8 sm:h-9"
                  >
                    Reset Filter
                  </Button>
                </div>
              </div>
            ) : (
              // 2 Columns on Mobile for Products
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6 md:gap-8">
                {filteredProducts.map((prod) => (
                  <div
                    key={prod.id}
                    className="group neu-card-elevated rounded-[28px] border border-white/60 hover:scale-[1.02] transition-all duration-300 overflow-hidden flex flex-col justify-between"
                  >
                    {/* Image Container */}
                    <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-100">
                      <img
                        src={prod.imageUrl}
                        alt={prod.name}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      {prod.badge && (
                        <div className="absolute top-2 left-2 sm:top-3 sm:left-3 bg-slate-900/80 backdrop-blur-sm text-white px-2 py-0.5 sm:px-3 sm:py-1 rounded-full text-[7.5px] min-[380px]:text-[8.5px] sm:text-[10px] font-black uppercase tracking-wider shadow-sm">
                          {prod.badge}
                        </div>
                      )}
                      <div className="absolute top-2 right-2 sm:top-3 sm:right-3 bg-white/95 backdrop-blur-sm text-slate-800 border border-stone-200/80 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full text-[7.5px] min-[380px]:text-[8.5px] sm:text-[10px] font-bold uppercase tracking-wider shadow-xs line-clamp-1 max-w-[100px] sm:max-w-none">
                        {prod.category}
                      </div>
                    </div>

                    {/* Card Content */}
                    <div className="p-3.5 sm:p-5 md:p-6 flex-1 flex flex-col justify-between space-y-2 sm:space-y-3">
                      <div className="space-y-1 sm:space-y-1.5">
                        <div className="flex items-center gap-1 sm:gap-1.5 text-[9px] min-[380px]:text-[10px] sm:text-[11px] font-bold text-slate-500">
                          <Store className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-emerald-700 shrink-0" />
                          <span className="truncate">{prod.businessName}</span>
                        </div>

                        <h3 className="font-condensed font-bold text-slate-900 text-xs min-[380px]:text-sm sm:text-base uppercase tracking-tight leading-snug group-hover:text-emerald-800 transition-colors line-clamp-2">
                          {prod.name}
                        </h3>

                        <p className="text-[9.5px] min-[380px]:text-[10.5px] sm:text-xs text-slate-500 line-clamp-2 font-medium leading-relaxed">
                          {prod.description}
                        </p>
                      </div>

                      <div className="pt-1.5 sm:pt-2 space-y-2 sm:space-y-3">
                        <div className="flex flex-col min-[380px]:flex-row min-[380px]:items-baseline justify-between gap-0.5">
                          <div className="text-[9px] sm:text-xs text-slate-400 font-condensed font-bold uppercase tracking-wider">
                            Harga:
                          </div>
                          <div className="text-left min-[380px]:text-right">
                            <span className="text-xs min-[380px]:text-sm sm:text-base font-condensed font-bold text-emerald-800">
                              Rp {prod.price.toLocaleString('id-ID')}
                            </span>
                            <span className="text-[9px] sm:text-[10px] font-medium text-slate-400 ml-0.5">
                              /{prod.priceUnit}
                            </span>
                          </div>
                        </div>

                        {/* Marketplace Quick Links if Available */}
                        {(prod.shopeeUrl || prod.tokopediaUrl || prod.lazadaUrl) && (
                          <div className="flex items-center flex-wrap gap-1 pt-0.5">
                            {prod.shopeeUrl && (
                              <a
                                href={prod.shopeeUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="h-6 px-2 rounded-full bg-orange-50 hover:bg-[#EE4D2D] text-[#EE4D2D] hover:text-white transition-all flex items-center gap-1 text-[8.5px] sm:text-[10px] font-bold"
                                title="Beli di Shopee"
                                onClick={(e: React.MouseEvent) => e.stopPropagation()}
                              >
                                <ShopeeIcon className="h-2.5 w-2.5 sm:h-3 sm:w-3 shrink-0" />
                                <span>Shopee</span>
                              </a>
                            )}
                            {prod.tokopediaUrl && (
                              <a
                                href={prod.tokopediaUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="h-6 px-2 rounded-full bg-emerald-50 hover:bg-[#03AC0E] text-[#03AC0E] hover:text-white transition-all flex items-center gap-1 text-[8.5px] sm:text-[10px] font-bold"
                                title="Beli di Tokopedia"
                                onClick={(e: React.MouseEvent) => e.stopPropagation()}
                              >
                                <TokopediaIcon className="h-2.5 w-2.5 sm:h-3 sm:w-3 shrink-0" />
                                <span>Tokopedia</span>
                              </a>
                            )}
                            {prod.lazadaUrl && (
                              <a
                                href={prod.lazadaUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="h-6 px-2 rounded-full bg-blue-50 hover:bg-[#0F146D] text-[#0F146D] hover:text-white transition-all flex items-center gap-1 text-[8.5px] sm:text-[10px] font-bold"
                                title="Beli di Lazada"
                                onClick={(e: React.MouseEvent) => e.stopPropagation()}
                              >
                                <LazadaIcon className="h-2.5 w-2.5 sm:h-3 sm:w-3 shrink-0" />
                                <span>Lazada</span>
                              </a>
                            )}
                          </div>
                        )}

                        <div className="grid grid-cols-2 gap-2 pt-1">
                          <Button
                            type="button"
                            onClick={() => setSelectedProduct(prod)}
                            className="neu-btn rounded-full h-8 sm:h-9 text-[8.5px] min-[380px]:text-[9.5px] sm:text-xs font-condensed font-bold uppercase tracking-wider text-slate-700 px-1 transition-all"
                          >
                            Detail
                          </Button>

                          <a
                            href={`https://wa.me/${prod.phone}?text=${encodeURIComponent(
                              `Halo ${prod.owner} (${prod.businessName}), saya tertarik untuk memesan produk "${prod.name}" yang tertera di website resmi Desa Sampeldes.`
                            )}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1"
                          >
                            <Button className="neu-btn-dark w-full rounded-full h-8 sm:h-9 text-[8.5px] min-[380px]:text-[9.5px] sm:text-xs font-condensed font-bold uppercase tracking-wider text-teal-400 flex items-center justify-center gap-1 px-1">
                              <MessageCircle className="h-3 w-3 sm:h-3.5 sm:w-3.5 shrink-0" />
                              <span>Order</span>
                            </Button>
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Registration Banner for local MSMEs */}
            <div className="mt-8 sm:mt-12 neu-card-elevated-dark rounded-[32px] border border-white/10 p-6 sm:p-10 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="space-y-2 text-center md:text-left max-w-xl">
                <Badge className="bg-emerald-500/20 text-teal-400 border border-emerald-400/30 font-bold uppercase text-[8.5px] sm:text-[10px] px-3 py-1">
                  Promosi Gratis untuk Warga Desa
                </Badge>
                <h3 className="text-base sm:text-xl md:text-2xl font-black font-display uppercase tracking-tight">
                  Punya Usaha atau Produk di Sampeldes?
                </h3>
                <p className="text-[11px] sm:text-xs md:text-sm text-slate-300 font-medium leading-relaxed">
                  Daftarkan produk UMKM atau industri kreatif Anda untuk dipromosikan secara resmi di Katalog Produk Desa Sampeldes tanpa dipungut biaya.
                </p>
              </div>

              <a
                href="https://wa.me/62895321109179?text=Halo%20Admin%20Desa%20Sampeldes,%20saya%20ingin%20mendaftarkan%20produk%20UMKM%20saya%20ke%20Katalog%20Produk%20Desa."
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto"
              >
                <Button className="neu-btn-gold w-full sm:w-auto rounded-full text-slate-950 font-black px-7 sm:px-8 h-11 sm:h-12 text-xs sm:text-sm whitespace-nowrap transition-all">
                  Daftarkan Produk Anda
                  <ExternalLink className="h-4 w-4 ml-2" />
                </Button>
              </a>
            </div>
          </div>
        )}
      </main>

      {/* Product Detail Modal */}
      <Dialog open={!!selectedProduct} onOpenChange={(open: boolean) => !open && setSelectedProduct(null)}>
        {selectedProduct && (
          <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl bg-white dark:bg-[#081d27] border border-slate-200/80 dark:border-white/10 shadow-2xl p-5 sm:p-7 md:p-8">
            <DialogHeader className="space-y-1.5 sm:space-y-2 text-left">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <Badge className="bg-teal-500/15 text-teal-700 dark:text-teal-300 border-none font-bold text-[9px] sm:text-[10px] uppercase">
                  {selectedProduct.category}
                </Badge>
                {selectedProduct.badge && (
                  <Badge className="bg-slate-900 text-white border-none font-bold text-[9px] sm:text-[10px] uppercase">
                    {selectedProduct.badge}
                  </Badge>
                )}
              </div>
              <DialogTitle className="text-lg sm:text-xl md:text-2xl font-condensed font-bold uppercase tracking-tight text-slate-900">
                {selectedProduct.name}
              </DialogTitle>
              <DialogDescription className="text-[11px] sm:text-xs font-medium text-slate-500">
                Usaha: {selectedProduct.businessName} &bull; Pemilik: {selectedProduct.owner}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 sm:space-y-6 mt-2 sm:mt-4">
              <div className="aspect-[16/10] relative w-full overflow-hidden rounded-xl bg-slate-100">
                <img
                  src={selectedProduct.imageUrl}
                  alt={selectedProduct.name}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="space-y-1.5 sm:space-y-2">
                <h4 className="text-[10px] sm:text-xs font-condensed font-bold uppercase tracking-widest text-slate-400">
                  Deskripsi Produk
                </h4>
                <p className="text-xs sm:text-sm text-slate-600 font-medium leading-relaxed">
                  {selectedProduct.description}
                </p>
              </div>

              {selectedProduct.features && selectedProduct.features.length > 0 && (
                <div className="space-y-1.5 sm:space-y-2">
                  <h4 className="text-[10px] sm:text-xs font-condensed font-bold uppercase tracking-widest text-slate-400">
                    Keunggulan &amp; Kualitas
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 sm:gap-2">
                    {selectedProduct.features.map((feat, idx) => (
                      <div key={idx} className="flex items-center gap-1.5 sm:gap-2 text-[10.5px] sm:text-xs font-semibold text-slate-700 bg-slate-50 p-2 sm:p-2.5 rounded-xl">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="bg-teal-500/10 rounded-xl p-3 sm:p-4 space-y-2 sm:space-y-3 border border-teal-400/40/40">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] sm:text-xs font-condensed font-bold text-teal-700 dark:text-teal-300 uppercase">Harga Produk</span>
                  <span className="text-base sm:text-xl font-condensed font-bold text-teal-700 dark:text-teal-300">
                    Rp {selectedProduct.price.toLocaleString('id-ID')} <span className="text-[10px] sm:text-xs font-medium text-slate-500">/ {selectedProduct.priceUnit}</span>
                  </span>
                </div>

                <div className="text-[10.5px] sm:text-xs text-slate-600 flex items-start gap-1.5 sm:gap-2 pt-1.5 sm:pt-2 border-t border-teal-400/40/30">
                  <MapPin className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400 shrink-0 mt-0.5" />
                  <span>Lokasi: {selectedProduct.location}</span>
                </div>
              </div>

              {/* Marketplace Links in Detail Modal */}
              {(selectedProduct.shopeeUrl || selectedProduct.tokopediaUrl || selectedProduct.lazadaUrl) && (
                <div className="space-y-2 pt-1">
                  <h4 className="text-[10px] sm:text-xs font-condensed font-bold uppercase tracking-widest text-slate-400">
                    Toko Online / Marketplace Resmi
                  </h4>
                  <div className="grid grid-cols-3 gap-1.5 sm:gap-2.5">
                    {selectedProduct.shopeeUrl && (
                      <a
                        href={selectedProduct.shopeeUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full"
                      >
                        <Button className="w-full rounded-full h-8 sm:h-10 bg-[#EE4D2D] hover:bg-[#D73211] text-white font-bold text-[10px] sm:text-xs shadow-xs flex items-center justify-center gap-1 sm:gap-2 px-1">
                          <ShopeeIcon className="h-3.5 w-3.5 shrink-0" />
                          <span>Shopee</span>
                        </Button>
                      </a>
                    )}
                    {selectedProduct.tokopediaUrl && (
                      <a
                        href={selectedProduct.tokopediaUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full"
                      >
                        <Button className="w-full rounded-full h-8 sm:h-10 bg-[#03AC0E] hover:bg-[#028B0B] text-white font-bold text-[10px] sm:text-xs shadow-xs flex items-center justify-center gap-1 sm:gap-2 px-1">
                          <TokopediaIcon className="h-3.5 w-3.5 shrink-0" />
                          <span>Tokopedia</span>
                        </Button>
                      </a>
                    )}
                    {selectedProduct.lazadaUrl && (
                      <a
                        href={selectedProduct.lazadaUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full"
                      >
                        <Button className="w-full rounded-full h-8 sm:h-10 bg-[#0F146D] hover:bg-[#090C45] text-white font-bold text-[10px] sm:text-xs shadow-xs flex items-center justify-center gap-1 sm:gap-2 px-1">
                          <LazadaIcon className="h-3.5 w-3.5 shrink-0" />
                          <span>Lazada</span>
                        </Button>
                      </a>
                    )}
                  </div>
                </div>
              )}

              <div className="flex gap-2 sm:gap-3 pt-1 sm:pt-2">
                <Button
                  type="button"
                  onClick={() => setSelectedProduct(null)}
                  className="flex-1 rounded-full h-9 sm:h-10 font-condensed font-bold uppercase tracking-wider text-xs sm:text-sm text-slate-700 border border-slate-300 bg-slate-100 hover:bg-slate-200"
                >
                  Tutup
                </Button>
                <a
                  href={`https://wa.me/${selectedProduct.phone}?text=${encodeURIComponent(
                    `Halo ${selectedProduct.owner} (${selectedProduct.businessName}), saya ingin memesan "${selectedProduct.name}" melalui informasi Portal Resmi Desa Sampeldes.`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1"
                >
                  <Button className="w-full rounded-xl h-9 sm:h-12 font-bold text-xs sm:text-sm bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs sm:shadow-md shadow-emerald-600/20 flex items-center justify-center gap-1.5 sm:gap-2">
                    <MessageCircle className="h-4 w-4 sm:h-5 sm:w-5" />
                    <span>Pesan via WhatsApp</span>
                  </Button>
                </a>
              </div>
            </div>
          </DialogContent>
        )}
      </Dialog>

      {/* UMKM Information Detail Modal */}
      <Dialog open={!!selectedInfo} onOpenChange={(open: boolean) => !open && setSelectedInfo(null)}>
        {selectedInfo && (
          <DialogContent className="max-w-4xl max-h-[92vh] overflow-y-auto p-5 sm:p-7 md:p-10 rounded-3xl bg-white dark:bg-[#081d27] border border-slate-200/80 dark:border-white/10 shadow-2xl space-y-4 sm:space-y-6">
            <DialogHeader className="space-y-2 sm:space-y-3 text-left">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-xl shrink-0 neu-inset text-emerald-800">
                  <Store className="h-4 w-4" />
                </div>
                <span className="text-[10px] md:text-xs font-black tracking-widest text-slate-500 uppercase">
                  Informasi UMKM Desa
                </span>
              </div>

              <DialogTitle className="text-xl sm:text-2xl md:text-3xl font-black text-slate-900 uppercase font-display italic tracking-tight leading-tight">
                {selectedInfo.title}
              </DialogTitle>

              {selectedInfo.subtitle && (
                <p className="text-xs sm:text-sm md:text-base font-bold text-emerald-800 uppercase tracking-wider border-l-2 sm:border-l-4 border-emerald-600 pl-2 sm:pl-3.5 py-0.5">
                  {selectedInfo.subtitle}
                </p>
              )}
            </DialogHeader>

            {/* Foto Di Atas Redaksi (Landscape / Portrait Adaptif Penuh) */}
            {selectedInfo.imageUrls && selectedInfo.imageUrls.length > 0 && (
              <div className="w-full">
                <UmkmInfoGallery item={selectedInfo} />
              </div>
            )}

            {/* Redaksi / Narasi Berita & Potensi (Rata Kiri Kanan) */}
            <div className="prose prose-slate max-w-none pt-1 sm:pt-2">
              <p className="text-slate-700 leading-relaxed font-medium text-xs sm:text-base md:text-lg whitespace-pre-line text-justify [text-justify:inter-word]">
                {selectedInfo.narrative}
              </p>
            </div>

            <div className="flex justify-end pt-2 sm:pt-4">
              <Button
                type="button"
                onClick={() => setSelectedInfo(null)}
                className="neu-btn rounded-full px-7 sm:px-9 h-10 sm:h-11 font-bold text-xs sm:text-sm text-slate-700"
              >
                Tutup
              </Button>
            </div>
          </DialogContent>
        )}
      </Dialog>

      <Footer />
    </div>
  );
}

export default function UmkmPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen w-full items-center justify-center bg-[#F8FAFC] dark:bg-[#060b11]">
          <div className="flex flex-col items-center">
            <Loader2 className="h-10 w-10 animate-spin text-teal-600 dark:text-teal-400 mb-4" />
            <p className="text-[10px] font-black tracking-[0.4em] text-slate-400 uppercase">
              Menyiapkan Halaman UMKM...
            </p>
          </div>
        </div>
      }
    >
      <UmkmPageContent />
    </Suspense>
  );
}
