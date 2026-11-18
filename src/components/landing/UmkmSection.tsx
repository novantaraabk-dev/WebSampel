'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  Store,
  MessageCircle,
  Sparkles,
  Sprout,
  UtensilsCrossed,
  Leaf,
  ShoppingBag,
  ExternalLink,
  MapPin,
  Tag,
  CheckCircle2,
} from 'lucide-react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import { ProductUmkm } from '@/lib/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

const DEFAULT_PRODUCTS: ProductUmkm[] = [
  {
    id: 'prod-1',
    name: 'Kopi Robusta Sangrai Sampeldes',
    category: 'Kuliner & Olahan',
    businessName: 'Kopi Lereng Sampeldes',
    owner: 'Kelompok Tani Kopi',
    price: 45000,
    priceUnit: '/250 gr',
    phone: '62895321109179',
    badge: 'BEST SELLER',
    imageUrl: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?q=80&w=800&auto=format&fit=crop',
    description: 'Biji kopi robusta pilihan dari lereng kebun warga Sampeldes, disangrai dengan profil medium-dark untuk aroma semerbak dan rasa legit mantap.',
  },
  {
    id: 'prod-2',
    name: 'Beras Organik Pandanwangi',
    category: 'Pertanian & Pangan',
    businessName: 'Gapoktan Sri Makmur',
    owner: 'Pak Suyono',
    price: 78000,
    priceUnit: '/5 kg',
    phone: '62895321109179',
    badge: 'ORGANIK RESMI',
    imageUrl: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?q=80&w=800&auto=format&fit=crop',
    description: 'Beras pulen beraroma harum alami yang ditanam tanpa pestisida kimia di lahan persawahan subur Desa Sampeldes.',
  },
  {
    id: 'prod-3',
    name: 'Bawang Merah Panen Segar',
    category: 'Pertanian & Pangan',
    businessName: 'Poktan Sumber Rejeki',
    owner: 'Bu Warsini',
    price: 32000,
    priceUnit: '/kg',
    phone: '62895321109179',
    badge: 'PANEN SEGAR',
    imageUrl: 'https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?q=80&w=800&auto=format&fit=crop',
    description: 'Bawang merah varietas unggulan dengan umbi padat, aroma tajam, dan daya simpan lama hasil panen petani lokal.',
  },
  {
    id: 'prod-4',
    name: 'Keripik Tempe Renyah Gurih',
    category: 'Kuliner & Olahan',
    businessName: 'Cemilan Gurih Barokah',
    owner: 'Ibu Siti Khotimah',
    price: 15000,
    priceUnit: '/pouch 200gr',
    phone: '62895321109179',
    badge: 'CEMILAN KELUARGA',
    imageUrl: 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?q=80&w=800&auto=format&fit=crop',
    description: 'Olahan kedelai lokal fermentasi alami dibalut bumbu rempah tradisional, digoreng renyah tanpa pengawet buatan.',
  },
  {
    id: 'prod-5',
    name: 'Kerajinan Anyaman Bambu & Pandan',
    category: 'Kerajinan & Kriya',
    businessName: 'Sentra Bambu Kreatif',
    owner: 'Pak Slamet',
    price: 65000,
    priceUnit: '/set',
    phone: '62895321109179',
    badge: 'KERAJINAN TANGAN',
    imageUrl: 'https://images.unsplash.com/photo-1590736969955-71cc94801759?q=80&w=800&auto=format&fit=crop',
    description: 'Karya seni anyaman tangan asli perajin Sampeldes, cocok untuk perabot estetik rumah tangga ramah lingkungan.',
  },
  {
    id: 'prod-6',
    name: 'Madu Hutan Asli Murni',
    category: 'Sehat & Herbal',
    businessName: 'Madu Sari Hutan',
    owner: 'Mas Hendra',
    price: 85000,
    priceUnit: '/botol 350ml',
    phone: '62895321109179',
    badge: '100% ALAMI',
    imageUrl: 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?q=80&w=800&auto=format&fit=crop',
    description: 'Madu lebah liar hutan murni tanpa campuran sirup gula, kaya khasiat antibakteri alami untuk menjaga imunitas tubuh.',
  },
  {
    id: 'prod-7',
    name: 'Gula Kelapa Kristal Organik',
    category: 'Kuliner & Olahan',
    businessName: 'Nira Kelapa Lestari',
    owner: 'Kelompok Penderes Nira',
    price: 25000,
    priceUnit: '/500 gr',
    phone: '62895321109179',
    badge: 'BEBAS PENGAWET',
    imageUrl: 'https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=800&auto=format&fit=crop',
    description: 'Gula semut kelapa murni berindeks glikemik rendah, diolah higienis dari nira pohon kelapa desa Sampeldes.',
  },
  {
    id: 'prod-8',
    name: 'Jamur Tiram Segar Sampeldes',
    category: 'Pertanian & Pangan',
    businessName: 'Omah Jamur Sampeldes',
    owner: 'Kang Manto',
    price: 18000,
    priceUnit: '/kg',
    phone: '62895321109179',
    badge: 'PANEN HARIAN',
    imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=800&auto=format&fit=crop',
    description: 'Jamur tiram putih segar hasil budidaya kumbung lembap terkontrol, bertekstur lembut dan kaya protein nabati.',
  },
];

const CATEGORY_TABS = [
  { id: 'all', label: 'Semua Komoditas', icon: ShoppingBag },
  { id: 'Pertanian & Pangan', label: 'Pertanian & Pangan', icon: Sprout },
  { id: 'Kuliner & Olahan', label: 'Kuliner & Olahan', icon: UtensilsCrossed },
  { id: 'Kerajinan & Kriya', label: 'Kerajinan & Kriya', icon: Sparkles },
  { id: 'Sehat & Herbal', label: 'Sehat & Herbal', icon: Leaf },
];

export function UmkmSection() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [activeIndex, setActiveIndex] = useState<number>(0);
  const [detailModalItem, setDetailModalItem] = useState<ProductUmkm | null>(null);
  const [isMobile, setIsMobile] = useState<boolean>(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Ambil data produk langsung dari koleksi Firestore katalogProduk (sama dengan /umkm-dan-industri-kreatif)
  const firestore = useFirestore();
  const productsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'katalogProduk'), orderBy('createdAt', 'desc'));
  }, [firestore]);

  const { data: firestoreProducts } = useCollection<ProductUmkm>(productsQuery, {
    suppressGlobalError: true,
  });

  const allProducts = useMemo(() => {
    if (firestoreProducts && firestoreProducts.length > 0) {
      return firestoreProducts;
    }
    return DEFAULT_PRODUCTS;
  }, [firestoreProducts]);

  // Hitung jumlah item per kategori
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: allProducts.length };
    allProducts.forEach((p) => {
      const cat = p.category || 'Lainnya';
      counts[cat] = (counts[cat] || 0) + 1;
      if (cat.includes('Pertanian') || cat.includes('Perkebunan')) {
        counts['Pertanian & Pangan'] = (counts['Pertanian & Pangan'] || 0) + 1;
      }
    });
    return counts;
  }, [allProducts]);

  // Filter produk berdasarkan tab kategori yang dipilih
  const filteredProducts = useMemo(() => {
    if (selectedCategory === 'all') return allProducts;
    return allProducts.filter((p) => {
      if (selectedCategory === 'Pertanian & Pangan') {
        return (
          p.category === 'Pertanian & Pangan' ||
          p.category === 'Pertanian & Perkebunan' ||
          p.category?.includes('Pertanian')
        );
      }
      return p.category === selectedCategory;
    });
  }, [allProducts, selectedCategory]);

  // Reset activeIndex saat kategori berubah
  useEffect(() => {
    setActiveIndex(0);
  }, [selectedCategory]);

  const total = filteredProducts.length;
  const safeIndex = total > 0 ? (activeIndex >= total ? 0 : activeIndex) : 0;
  const activeProduct = filteredProducts[safeIndex] || filteredProducts[0] || DEFAULT_PRODUCTS[0];

  const handleNext = () => {
    if (total <= 1) return;
    setActiveIndex((prev) => (prev + 1) % total);
  };

  const handlePrev = () => {
    if (total <= 1) return;
    setActiveIndex((prev) => (prev - 1 + total) % total);
  };

  const getWhatsAppUrl = (prod: ProductUmkm) => {
    const rawPhone = prod.phone || '62895321109179';
    const cleanPhone = rawPhone.replace(/\D/g, '').replace(/^0/, '62');
    const text = `Halo Admin/Penjual ${prod.businessName || 'UMKM Sampeldes'}, saya tertarik memesan produk "${prod.name}" (Rp ${Number(prod.price || 0).toLocaleString('id-ID')} ${prod.priceUnit || ''}) dari Website Resmi Desa Sampeldes. Apakah stok tersedia?`;
    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
  };

  return (
    <section
      id="potensi-desa"
      className="relative w-full py-16 sm:py-20 lg:py-24 bg-transparent overflow-hidden select-none"
    >
      {/* Background Micro Glows */}
      <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-teal-500/5 dark:bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-emerald-500/5 dark:bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* HEADER SECTION (SESUAI KONSEP GAMBAR 2) */}
        <div className="text-center max-w-3xl mx-auto mb-8 sm:mb-10">
          <p className="text-[11px] sm:text-xs font-bold uppercase tracking-[0.28em] text-teal-700 dark:text-teal-400 mb-2">
            PEMBERDAYAAN EKONOMI LOKAL
          </p>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold uppercase tracking-tight text-slate-900 dark:text-white font-condensed">
            SENTRA UMKM WARGA
          </h2>
          <p className="mt-2 text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            Etalase komoditas unggulan pertanian, olahan pangan gurih, kerajinan kriya, dan produk kreatif karya warga Desa Sampeldes.
          </p>
        </div>

        {/* CATEGORY FILTER TABS (SESUAI KONSEP GAMBAR 2) */}
        <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-2.5 mb-10 sm:mb-12">
          {CATEGORY_TABS.map((tab) => {
            const Icon = tab.icon;
            const count = categoryCounts[tab.id] || 0;
            const isActive = selectedCategory === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => setSelectedCategory(tab.id)}
                className={`inline-flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-full text-xs font-bold transition-all duration-300 cursor-pointer ${
                  isActive
                    ? 'bg-slate-900 text-white dark:bg-teal-600 shadow-md scale-105'
                    : 'bg-white/80 dark:bg-white/5 text-slate-700 dark:text-slate-300 border border-stone-200/80 dark:border-white/10 hover:border-teal-400 hover:text-teal-600'
                }`}
              >
                <Icon className={`h-3.5 w-3.5 ${isActive ? 'text-teal-400 dark:text-white' : 'text-teal-600 dark:text-teal-400'}`} />
                <span>{tab.label}</span>
                <span
                  className={`ml-0.5 px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                    isActive
                      ? 'bg-white/20 text-teal-300 dark:text-white'
                      : 'bg-stone-200/70 dark:bg-white/10 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* ACTIVE PRODUCT TITLE & PRICE BANNER (SESUAI KONSEP GAMBAR 2) */}
        <div className="text-center mb-8 max-w-2xl mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeProduct.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
            >
              <h3 className="text-lg sm:text-2xl md:text-3xl font-extrabold uppercase tracking-tight text-slate-900 dark:text-white font-condensed">
                {activeProduct.name}
              </h3>

              <div className="mt-2 flex flex-wrap items-center justify-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  {activeProduct.businessName || activeProduct.owner}
                </span>
                <span>•</span>
                <span>{activeProduct.category}</span>
                <span>•</span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-black bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border border-teal-200/80 dark:border-teal-800/60 shadow-xs">
                  Rp {Number(activeProduct.price || 0).toLocaleString('id-ID')}
                  <span className="font-normal text-[11px] ml-1 opacity-80">{activeProduct.priceUnit || ''}</span>
                </span>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* 3D COVERFLOW SHOWCASE CAROUSEL (SESUAI KONSEP GAMBAR 2) */}
        <div className="relative w-full max-w-5xl mx-auto py-4 sm:py-6 overflow-hidden">
          <div className="relative flex items-center justify-center min-h-[360px] sm:min-h-[420px]">
            {filteredProducts.map((prod, idx) => {
              // Hitung offset relatif terhadap safeIndex
              let offset = idx - safeIndex;
              if (offset < -Math.floor(total / 2)) offset += total;
              if (offset > Math.floor(total / 2)) offset -= total;

              const isCenter = offset === 0;
              const isNear = Math.abs(offset) === 1;
              const isFar = Math.abs(offset) === 2;
              const isVisible = isMobile ? Math.abs(offset) <= 1 : Math.abs(offset) <= 2;

              if (!isVisible) return null;

              // Style posisi transform dan z-index
              const spacing = isMobile ? 85 : 140;
              const translateX = offset * spacing;
              const scale = isCenter ? (isMobile ? 1.04 : 1.08) : isNear ? 0.92 : 0.82;
              const zIndex = isCenter ? 30 : isNear ? 20 : 10;
              const opacity = isCenter ? 1 : isNear ? (isMobile ? 0.5 : 0.72) : 0.4;

              return (
                <motion.div
                  key={prod.id}
                  onClick={() => setActiveIndex(idx)}
                  animate={{
                    x: translateX,
                    scale,
                    opacity,
                    zIndex,
                  }}
                  transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                  className={`absolute w-[220px] min-[400px]:w-[240px] sm:w-[280px] h-[330px] sm:h-[390px] rounded-[1.8rem] overflow-hidden cursor-pointer transition-shadow duration-300 flex flex-col justify-between ${
                    isCenter
                      ? 'ring-2 ring-teal-400 border border-white/40 shadow-[0_20px_50px_rgba(13,148,136,0.35)]'
                      : 'border border-stone-200/60 dark:border-white/10 shadow-md'
                  }`}
                >
                  {/* Photo Background */}
                  <Image
                    src={prod.imageUrl || 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?q=80&w=800'}
                    alt={prod.name}
                    fill
                    sizes="(max-width: 640px) 240px, 280px"
                    className="object-cover object-center"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/35 to-black/25" />

                  {/* Top Floating Badge */}
                  <div className="relative z-10 p-3.5 flex items-start justify-between">
                    {prod.badge && (
                      <span className="px-2.5 py-1 rounded-md bg-white/90 dark:bg-[#070b10]/85 text-slate-900 dark:text-white text-[9.5px] font-black uppercase tracking-wider backdrop-blur-md shadow-xs border border-white/20">
                        {prod.badge}
                      </span>
                    )}
                  </div>

                  {/* Bottom Information on Card */}
                  <div className="relative z-10 p-4 space-y-2 text-white">
                    <div className="flex items-center gap-1.5 text-teal-300 text-[10px] font-bold uppercase tracking-wider">
                      <Store className="h-3 w-3 shrink-0" />
                      <span className="line-clamp-1">{prod.businessName || prod.owner}</span>
                    </div>

                    <h4 className="text-sm sm:text-base font-extrabold uppercase tracking-tight line-clamp-1 font-condensed">
                      {prod.name}
                    </h4>

                    <div className="text-xs font-black text-amber-300">
                      Rp {Number(prod.price || 0).toLocaleString('id-ID')}
                      <span className="text-[10px] text-white/70 font-normal ml-1">{prod.priceUnit || ''}</span>
                    </div>

                    {/* Action Buttons (Only visible on active centered card) */}
                    {isCenter && (
                      <div className="pt-2 flex items-center gap-2 pointer-events-auto">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDetailModalItem(prod);
                          }}
                          className="flex-1 py-1.5 rounded-full bg-white text-slate-950 font-black text-[11px] uppercase tracking-wider hover:bg-teal-400 hover:text-slate-950 transition-colors shadow-xs"
                        >
                          Rincian &rarr;
                        </button>
                        <a
                          href={getWhatsAppUrl(prod)}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="flex-1 py-1.5 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white font-black text-[11px] uppercase tracking-wider flex items-center justify-center gap-1 transition-colors shadow-xs"
                        >
                          <MessageCircle className="h-3.5 w-3.5" />
                          <span>Pesan</span>
                        </a>
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* CAROUSEL CONTROLS & INDICATOR DOTS */}
          <div className="mt-8 flex flex-col items-center gap-4">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handlePrev}
                aria-label="Produk Sebelumnya"
                className="h-10 w-10 rounded-full bg-white dark:bg-white/10 border border-stone-200 dark:border-white/10 text-slate-700 dark:text-white hover:bg-teal-50 hover:border-teal-400 hover:text-teal-700 flex items-center justify-center transition-all cursor-pointer shadow-xs"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>

              <button
                type="button"
                onClick={handleNext}
                aria-label="Produk Selanjutnya"
                className="h-10 w-10 rounded-full bg-teal-600 text-white hover:bg-teal-500 flex items-center justify-center transition-all cursor-pointer shadow-md shadow-teal-700/20"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>

            {/* Indicator Dots */}
            <div className="flex items-center gap-1.5">
              {filteredProducts.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setActiveIndex(i)}
                  aria-label={`Slide ke-${i + 1}`}
                  className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                    i === safeIndex
                      ? 'w-6 bg-slate-900 dark:bg-teal-400'
                      : 'w-1.5 bg-stone-300 dark:bg-white/20 hover:bg-stone-400'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* BOTTOM ACTION LINK (LIHAT SEMUA KATALOG UMKM WARGA) */}
        <div className="mt-8 text-center">
          <Link
            href="/umkm-dan-industri-kreatif?tab=katalog"
            className="inline-flex items-center gap-2.5 px-8 py-3.5 rounded-full bg-[#fbf9f5] dark:bg-white/10 border border-stone-200/90 dark:border-white/15 text-slate-900 dark:text-white font-extrabold text-xs tracking-widest uppercase shadow-xs hover:shadow-lg hover:border-teal-400 hover:text-teal-700 dark:hover:text-teal-300 transition-all duration-300 hover:scale-105"
          >
            <span>Lihat Semua Katalog UMKM Warga</span>
            <ArrowRight className="h-4 w-4 text-teal-600 dark:text-teal-400" />
          </Link>
        </div>
      </div>

      {/* RINCIAN PRODUK MODAL DIALOG */}
      {detailModalItem && (
        <Dialog open={!!detailModalItem} onOpenChange={() => setDetailModalItem(null)}>
          <DialogContent className="max-w-md sm:max-w-lg p-0 overflow-hidden rounded-[1.8rem] bg-white dark:bg-[#0c1822] border border-stone-200 dark:border-white/10">
            <div className="relative aspect-[16/10] w-full overflow-hidden bg-slate-900">
              <Image
                src={detailModalItem.imageUrl || 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?q=80&w=800'}
                alt={detailModalItem.name}
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
              {detailModalItem.badge && (
                <div className="absolute top-3 left-3 px-2.5 py-1 rounded-md bg-teal-600 text-white text-[10px] font-black uppercase tracking-wider shadow-md">
                  {detailModalItem.badge}
                </div>
              )}
            </div>

            <div className="p-5 sm:p-6 space-y-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400">
                  {detailModalItem.category}
                </span>
                <DialogTitle className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white uppercase font-condensed mt-0.5">
                  {detailModalItem.name}
                </DialogTitle>
                <div className="mt-1 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                  <Store className="h-3.5 w-3.5 text-teal-500" />
                  <span className="font-semibold text-slate-700 dark:text-slate-300">{detailModalItem.businessName}</span>
                  {detailModalItem.owner && <span>({detailModalItem.owner})</span>}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-teal-50 dark:bg-teal-950/40 border border-teal-200/60 dark:border-teal-800/40 flex items-center justify-between">
                <div>
                  <p className="text-[10px] uppercase font-bold text-teal-800 dark:text-teal-400">Harga Produk</p>
                  <p className="text-lg font-black text-teal-900 dark:text-teal-300">
                    Rp {Number(detailModalItem.price || 0).toLocaleString('id-ID')}
                    <span className="text-xs font-normal text-slate-500 dark:text-slate-400 ml-1">
                      {detailModalItem.priceUnit || ''}
                    </span>
                  </p>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-bold">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Karya Warga</span>
                </div>
              </div>

              <DialogDescription className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                {detailModalItem.description}
              </DialogDescription>

              <div className="pt-2 flex flex-col sm:flex-row gap-2">
                <a
                  href={getWhatsAppUrl(detailModalItem)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-sm transition-colors"
                >
                  <MessageCircle className="h-4 w-4" />
                  <span>Pesan via WhatsApp</span>
                </a>
                <Link
                  href="/umkm-dan-industri-kreatif?tab=katalog"
                  className="py-2.5 px-4 rounded-xl border border-stone-200 dark:border-white/10 text-slate-700 dark:text-slate-300 font-bold text-xs uppercase tracking-wider hover:bg-slate-50 dark:hover:bg-white/5 text-center transition-colors"
                >
                  Katalog Lengkap
                </Link>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </section>
  );
}

export default UmkmSection;
