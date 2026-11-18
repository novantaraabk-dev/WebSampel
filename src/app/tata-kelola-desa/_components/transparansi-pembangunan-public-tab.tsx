'use client';

import React, { useState, useMemo } from 'react';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import { PembangunanDesa } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  HardHat,
  MapPin,
  Coins,
  Layers,
  Calendar,
  Search,
  CheckCircle2,
  Clock,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  X,
  Image as ImageIcon,
  Maximize2,
  FileText,
  Share2,
  Users,
  Building,
  Activity,
  ArrowRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent } from '@/components/ui/dialog';

// Default / fallback demonstration data jika Firestore belum memiliki data
const DEFAULT_PEMBANGUNAN_SEED: PembangunanDesa[] = [
  {
    id: 'seed-1',
    judul: 'Pembangunan Rabat Beton Jalan Usaha Tani Dusun Pangampiran',
    lokasi: 'Dusun Pangampiran RT 03 / RW 01, Desa Sampeldes',
    volume: 'Panjang 350 Meter x Lebar 2,5 Meter x Tebal 0,15 Meter',
    anggaran: 148500000,
    sumberAnggaran: 'Dana Desa (DD)',
    tahun: 2026,
    status: 'selesai',
    pelaksana: 'Tim Pelaksana Kegiatan (TPK) Desa Sampeldes',
    tanggal: '2026-03-15',
    fotoUrls: [
      'https://images.unsplash.com/photo-1541888946425-d0fbb1861593?q=80&w=1200&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1590381105924-c72589b9ef3f?q=80&w=1200&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1504307651254-35680f356dfd?q=80&w=1200&auto=format&fit=crop'
    ],
    fotoUrl: 'https://images.unsplash.com/photo-1541888946425-d0fbb1861593?q=80&w=1200&auto=format&fit=crop',
    redaksi: `SAMPELDES – Sebagai wujud nyata komitmen transparansi dan akuntabilitas tata kelola pemerintahan desa, Pemerintah Desa Sampeldes, Kecamatan Gandrungmangu, Kabupaten Cilacap berhasil merampungkan kegiatan Pembangunan Rabat Beton Jalan Usaha Tani di Dusun Pangampiran RT 03 / RW 01.

Proyek infrastruktur vital ini dikerjakan dengan volume fisik sepanjang 350 meter, lebar 2,5 meter, dan ketebalan beton 0,15 meter, menyerap total alokasi anggaran sebesar Rp 148.500.000 yang bersumber dari Dana Desa (DD) Tahun Anggaran 2026. Pelaksanaan pekerjaan dipimpin oleh Tim Pelaksana Kegiatan (TPK) Desa Sampeldes dengan mengedepankan asas padat karya tunai serta gotong royong tenaga kerja lokal warga sekitar.

Keberadaan jalan rabat beton yang mulus ini diharapkan dapat memangkas waktu tempuh pengangkutan hasil panen pertanian, menekan biaya logistik para petani, serta mempermudah mobilitas harian anak-anak sekolah dan warga Dusun Pangampiran. Pemerintah Desa Sampeldes mengimbau seluruh elemen warga untuk bersama-sama merawat dan memelihara badan jalan agar kemanfaatannya dapat dinikmati dalam jangka panjang.`
  },
  {
    id: 'seed-2',
    judul: 'Pembangunan Talud Penahan Tanah (TPT) & Drainase Permukiman',
    lokasi: 'Dusun Ciloning RT 02 / RW 02, Desa Sampeldes',
    volume: 'Panjang 180 Meter x Tinggi 1,5 Meter',
    anggaran: 87200000,
    sumberAnggaran: 'Dana Desa (DD)',
    tahun: 2026,
    status: 'selesai',
    pelaksana: 'Tim Pelaksana Kegiatan (TPK) Desa Sampeldes',
    tanggal: '2026-02-20',
    fotoUrls: [
      'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?q=80&w=1200&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1503387762-592deb58ef4e?q=80&w=1200&auto=format&fit=crop'
    ],
    fotoUrl: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?q=80&w=1200&auto=format&fit=crop',
    redaksi: `SAMPELDES – Pemerintah Desa Sampeldes merealisasikan pembangunan Talud Penahan Tanah (TPT) dan perbaikan drainase di kawasan Dusun Ciloning guna mengantisipasi ancaman longsor dan genangan air saat musim penghujan tiba.

Kegiatan pembangunan dengan volume fisik sepanjang 180 meter dan tinggi pasangan batu 1,5 meter ini dibiayai melalui Dana Desa (DD) Tahun 2026 dengan nilai anggaran Rp 87.200.000. Pengerjaan melibatkan partisipasi aktif warga setempat bersama pengawasan teknis dari aparatur desa.

Dengan selesainya pembangunan talud ini, bahu jalan dan permukiman warga kini menjadi lebih kokoh dan aman dari risiko erosi tanah. Saluran drainase yang tertata rapi juga menjamin kebersihan lingkungan pemukiman dan kenyamanan warga Dusun Ciloning.`
  },
  {
    id: 'seed-3',
    judul: 'Rehabilitasi Gedung Posyandu & Penyediaan Sarana Air Bersih',
    lokasi: 'Dusun Sampeldes RT 01 / RW 02, Desa Sampeldes',
    volume: '1 Unit Gedung + Tandon Air 2.000 Liter',
    anggaran: 54000000,
    sumberAnggaran: 'Alokasi Dana Desa (ADD)',
    tahun: 2026,
    status: 'berjalan',
    pelaksana: 'TPK & Kader Posyandu Desa Sampeldes',
    tanggal: '2026-04-02',
    fotoUrls: [
      'https://images.unsplash.com/photo-1584467735871-8e85353a8413?q=80&w=1200&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1516549655169-df83a0774514?q=80&w=1200&auto=format&fit=crop'
    ],
    fotoUrl: 'https://images.unsplash.com/photo-1584467735871-8e85353a8413?q=80&w=1200&auto=format&fit=crop',
    redaksi: `SAMPELDES – Untuk meningkatkan mutu layanan kesehatan dasar bagi ibu hamil, balita, dan lansia, Pemerintah Desa Sampeldes mengalokasikan program rehabilitasi gedung Posyandu terpadu serta instalasi sarana air bersih di Dusun Sampeldes.

Program ini bersumber dari Alokasi Dana Desa (ADD) Tahun 2026 senilai Rp 54.000.000, mencakup renovasi ruang periksa, pengecatan, perbaikan atap, serta pemasangan tandon air bersih higienis berkapasitas 2.000 liter. Pekerjaan saat ini sedang berlangsung dengan progres mencapai 70%.

Diharapkan sarana Posyandu yang lebih representatif dan higienis ini dapat mendorong pencegahan stunting serta memperkuat derajat kesehatan seluruh keluarga di Desa Sampeldes.`
  }
];

export function TransparansiPembangunanPublicTab() {
  const firestore = useFirestore();

  // Queries
  const pembangunanQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'transparansiPembangunan'), orderBy('tahun', 'desc'));
  }, [firestore]);

  const { data: dbPembangunan, isLoading } = useCollection<PembangunanDesa>(pembangunanQuery);

  // Fallback ke seed jika database masih kosong
  const rawData = useMemo(() => {
    if (dbPembangunan && dbPembangunan.length > 0) {
      return dbPembangunan;
    }
    return DEFAULT_PEMBANGUNAN_SEED;
  }, [dbPembangunan]);

  // Available Years
  const availableYears = useMemo(() => {
    const years = Array.from(new Set(rawData.map(item => Number(item.tahun)).filter(Boolean)));
    years.sort((a, b) => b - a);
    if (!years.includes(new Date().getFullYear())) {
      years.unshift(new Date().getFullYear());
    }
    return years;
  }, [rawData]);

  // States
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [selectedSumber, setSelectedSumber] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Lightbox Modal State
  const [lightboxImages, setLightboxImages] = useState<string[]>([]);
  const [activeImageIndex, setActiveImageIndex] = useState<number>(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState<boolean>(false);

  // Filtered Items
  const filteredItems = useMemo(() => {
    return rawData.filter(item => {
      const matchYear = selectedYear === 'all' || Number(item.tahun) === Number(selectedYear);
      const matchSumber = selectedSumber === 'all' || item.sumberAnggaran?.toLowerCase().includes(selectedSumber.toLowerCase());
      const q = searchQuery.toLowerCase().trim();
      const matchSearch = !q || (
        item.judul?.toLowerCase().includes(q) ||
        item.lokasi?.toLowerCase().includes(q) ||
        item.sumberAnggaran?.toLowerCase().includes(q) ||
        item.redaksi?.toLowerCase().includes(q)
      );
      return matchYear && matchSumber && matchSearch;
    });
  }, [rawData, selectedYear, selectedSumber, searchQuery]);

  // Total Anggaran
  const totalAnggaran = useMemo(() => {
    return filteredItems.reduce((acc, curr) => acc + (Number(curr.anggaran) || 0), 0);
  }, [filteredItems]);

  const totalSelesai = useMemo(() => {
    return filteredItems.filter(item => item.status === 'selesai').length;
  }, [filteredItems]);

  const totalBerjalan = useMemo(() => {
    return filteredItems.filter(item => item.status === 'berjalan' || item.status === 'perencanaan').length;
  }, [filteredItems]);

  // Currency Formatter
  const formatRupiah = (val: number | string) => {
    const num = typeof val === 'number' ? val : parseFloat(String(val).replace(/[^0-9]/g, '')) || 0;
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(num);
  };

  // Open Lightbox
  const openLightbox = (photos: string[], index: number = 0) => {
    setLightboxImages(photos);
    setActiveImageIndex(index);
    setIsLightboxOpen(true);
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* ─── HERO HEADER BANNER TRANSPARANSI PEMBANGUNAN ─── */}
      <div className="rounded-3xl p-6 sm:p-9 border border-slate-200/80 dark:border-white/10 relative overflow-hidden bg-gradient-to-br from-white via-slate-50 to-slate-100 dark:from-[#081d27] dark:via-[#0b2836] dark:to-[#041117] shadow-lg">
        {/* Subtle decorative glow */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-bl from-teal-500/10 via-emerald-500/10 to-transparent rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="w-6 h-[2px] bg-teal-500 rounded-full" />
              <span className="text-xs font-condensed font-black tracking-widest text-teal-700 dark:text-teal-300 uppercase">
                Akuntabilitas Fisik &amp; Anggaran Desa
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-condensed font-black text-slate-900 dark:text-white uppercase tracking-tight leading-tight">
              Transparansi Pembangunan Desa Sampeldes
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">
              Dokumentasi resmi seluruh realisasi pembangunan fisik, infrastruktur jalan, drainase, dan fasilitas umum di setiap dusun. Terbuka, transparan, dan dapat diawasi oleh seluruh masyarakat Desa Sampeldes.
            </p>
          </div>

          <div className="shrink-0 flex items-center gap-3">
            <div className="neu-convex p-4 rounded-2xl border border-white/80 text-center min-w-[130px]">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Total Proyek</span>
              <span className="text-2xl sm:text-3xl font-condensed font-black text-emerald-800 block">
                {filteredItems.length}
              </span>
              <span className="text-[9.5px] font-medium text-slate-400">Kegiatan Fisik</span>
            </div>
            <div className="neu-convex p-4 rounded-2xl border border-white/80 text-center min-w-[150px]">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Alokasi Anggaran</span>
              <span className="text-lg sm:text-xl font-condensed font-black text-amber-800 block font-mono">
                {formatRupiah(totalAnggaran)}
              </span>
              <span className="text-[9.5px] font-medium text-slate-400">Tercatat Publik</span>
            </div>
          </div>
        </div>
      </div>

      {/* ─── TOOLBAR FILTER & SEARCH ─── */}
      <div className="neu-card-elevated rounded-[24px] p-4 sm:p-5 border border-white/80 flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4">
        <div className="flex items-center gap-2.5 flex-wrap flex-1">
          {/* Filter Tahun */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-600 uppercase font-condensed">Tahun:</span>
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger className="w-32 h-9 rounded-xl font-bold text-xs neu-convex border border-white/80 text-slate-800 cursor-pointer">
                <SelectValue placeholder="Semua Tahun" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Tahun</SelectItem>
                {availableYears.map(year => (
                  <SelectItem key={year} value={year.toString()}>
                    Tahun {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Filter Sumber Dana */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-600 uppercase font-condensed">Sumber:</span>
            <Select value={selectedSumber} onValueChange={setSelectedSumber}>
              <SelectTrigger className="w-40 sm:w-48 h-9 rounded-xl font-bold text-xs neu-convex border border-white/80 text-slate-800 cursor-pointer truncate">
                <SelectValue placeholder="Semua Sumber" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Sumber Dana</SelectItem>
                <SelectItem value="Dana Desa">Dana Desa (DD)</SelectItem>
                <SelectItem value="Alokasi Dana Desa">Alokasi Dana Desa (ADD)</SelectItem>
                <SelectItem value="Bantuan Keuangan">Bantuan Keuangan</SelectItem>
                <SelectItem value="Pendapatan Asli Desa">Pendapatan Asli Desa (PADes)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Input Pencarian */}
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Cari kegiatan, dusun, atau lokasi..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="neu-inset pl-9 h-9 text-xs rounded-xl border border-white/60 text-slate-800 focus:border-emerald-600"
          />
        </div>
      </div>

      {/* ─── GRID KARTU KEGIATAN PEMBANGUNAN ─── */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-96 rounded-[28px] bg-stone-300/60" />
          ))}
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="neu-card-elevated rounded-[28px] p-12 text-center border border-white/80 space-y-3">
          <HardHat className="h-12 w-12 text-slate-400 mx-auto" />
          <h4 className="text-base font-bold text-slate-800 font-condensed uppercase">
            Tidak Ada Kegiatan Pembangunan yang Ditemukan
          </h4>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Silakan ubah filter tahun, sumber dana, atau kata kunci pencarian Anda untuk menampilkan hasil lainnya.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-7">
          {filteredItems.map((item, idx) => {
            return (
              <PembangunanCardItem
                key={item.id || idx}
                item={item}
                formatRupiah={formatRupiah}
                onOpenLightbox={openLightbox}
              />
            );
          })}
        </div>
      )}

      {/* ─── FULLSCREEN LIGHTBOX MODAL UNTUK PREVIEW FOTO ─── */}
      <Dialog open={isLightboxOpen} onOpenChange={setIsLightboxOpen}>
        <DialogContent className="max-w-4xl p-2 sm:p-4 bg-black/95 border border-white/20 text-white rounded-3xl overflow-hidden">
          <div className="relative flex flex-col items-center justify-center min-h-[300px] sm:min-h-[500px]">
            {/* Close Button */}
            <button
              onClick={() => setIsLightboxOpen(false)}
              className="absolute top-2 right-2 z-20 bg-white/20 hover:bg-white/40 text-white rounded-full p-2 transition-colors cursor-pointer"
              title="Tutup"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Main Lightbox Image */}
            {lightboxImages[activeImageIndex] && (
              <div className="relative w-full max-h-[75vh] flex items-center justify-center overflow-hidden rounded-2xl">
                <img
                  src={lightboxImages[activeImageIndex]}
                  alt={`Dokumentasi Pembangunan ${activeImageIndex + 1}`}
                  className="max-h-[75vh] max-w-full object-contain rounded-xl"
                />
              </div>
            )}

            {/* Navigation Arrows */}
            {lightboxImages.length > 1 && (
              <>
                <button
                  onClick={() => setActiveImageIndex(prev => (prev === 0 ? lightboxImages.length - 1 : prev - 1))}
                  className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black/90 text-white p-2.5 rounded-full border border-white/20 transition-all cursor-pointer"
                  title="Foto Sebelumnya"
                >
                  <ChevronLeft className="h-6 w-6" />
                </button>
                <button
                  onClick={() => setActiveImageIndex(prev => (prev === lightboxImages.length - 1 ? 0 : prev + 1))}
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black/90 text-white p-2.5 rounded-full border border-white/20 transition-all cursor-pointer"
                  title="Foto Selanjutnya"
                >
                  <ChevronRight className="h-6 w-6" />
                </button>
              </>
            )}

            {/* Thumbnail Strip */}
            {lightboxImages.length > 1 && (
              <div className="flex items-center justify-center gap-2 mt-3 pb-1 overflow-x-auto max-w-full">
                {lightboxImages.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveImageIndex(i)}
                    className={cn(
                      "w-14 h-14 rounded-lg overflow-hidden border-2 transition-all shrink-0 cursor-pointer",
                      i === activeImageIndex ? "border-emerald-400 scale-105" : "border-white/30 opacity-60 hover:opacity-100"
                    )}
                  >
                    <img src={img} alt={`Thumb ${i + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SUB-KOMPONEN KARTU PEMBANGUNAN INDIVIDUAL (DENGAN MULTI-FOTO CAROUSEL & REDAKSI)
// ─────────────────────────────────────────────────────────────────────────────

function PembangunanCardItem({
  item,
  formatRupiah,
  onOpenLightbox,
}: {
  item: PembangunanDesa;
  formatRupiah: (val: number | string) => string;
  onOpenLightbox: (photos: string[], index: number) => void;
}) {
  const [photoIndex, setPhotoIndex] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);

  const photos = useMemo(() => {
    if (Array.isArray(item.fotoUrls) && item.fotoUrls.length > 0) {
      return item.fotoUrls;
    }
    if (item.fotoUrl) {
      return [item.fotoUrl];
    }
    return [];
  }, [item]);

  const hasPhotos = photos.length > 0;
  const currentPhoto = photos[photoIndex] || photos[0];

  const handlePrevPhoto = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPhotoIndex(prev => (prev === 0 ? photos.length - 1 : prev - 1));
  };

  const handleNextPhoto = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPhotoIndex(prev => (prev === photos.length - 1 ? 0 : prev + 1));
  };

  return (
    <div className="neu-card-elevated rounded-[28px] overflow-hidden border border-white/80 flex flex-col bg-white/70 hover:shadow-xl transition-all duration-300">

      {/* ─── BAGIAN FOTO DOKUMENTASI (DENGAN SLIDER MULTI-FOTO) ─── */}
      <div className="relative aspect-[16/10] bg-slate-900 overflow-hidden group select-none">
        {hasPhotos ? (
          <>
            <img
              src={currentPhoto}
              alt={item.judul}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            {/* Dark gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />

            {/* Multi-Photo Indicator Pill */}
            <div className="absolute top-3 right-3 flex items-center gap-1.5 z-10">
              <span className="bg-black/60 backdrop-blur-md text-white text-[10.5px] font-mono font-bold px-2.5 py-1 rounded-full border border-white/20 shadow-xs flex items-center gap-1">
                <ImageIcon className="h-3 w-3" />
                <span>{photoIndex + 1}/{photos.length} Foto</span>
              </span>
              <button
                type="button"
                onClick={() => onOpenLightbox(photos, photoIndex)}
                className="bg-black/60 backdrop-blur-md text-white p-1.5 rounded-full border border-white/20 hover:bg-emerald-600 transition-colors cursor-pointer"
                title="Perbesar Foto"
              >
                <Maximize2 className="h-3 w-3" />
              </button>
            </div>

            {/* Slider Navigation Arrows (hanya tampil jika foto > 1) */}
            {photos.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={handlePrevPhoto}
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-black/50 hover:bg-black/80 text-white flex items-center justify-center backdrop-blur-xs border border-white/20 transition-all opacity-0 group-hover:opacity-100 cursor-pointer"
                  title="Foto sebelumnya"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={handleNextPhoto}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-black/50 hover:bg-black/80 text-white flex items-center justify-center backdrop-blur-xs border border-white/20 transition-all opacity-0 group-hover:opacity-100 cursor-pointer"
                  title="Foto berikutnya"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>

                {/* Dot Indicators */}
                <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 flex items-center gap-1 z-10">
                  {photos.map((_, dotIdx) => (
                    <button
                      key={dotIdx}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setPhotoIndex(dotIdx);
                      }}
                      className={cn(
                        "w-2 h-2 rounded-full transition-all cursor-pointer",
                        dotIdx === photoIndex ? "bg-teal-400 w-5" : "bg-white/50 hover:bg-white"
                      )}
                    />
                  ))}
                </div>
              </>
            )}
          </>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 bg-slate-800">
            <HardHat className="h-10 w-10 text-slate-600 mb-1" />
            <span className="text-xs font-bold text-slate-400">Dokumentasi Lapangan Belum Diunggah</span>
          </div>
        )}

        {/* Badge Floating: Sumber Dana & Status */}
        <div className="absolute top-3 left-3 flex items-center gap-1.5 z-10 flex-wrap">
          <span className="neu-btn-gold px-2.5 py-0.5 rounded-full font-condensed font-black text-[10px] tracking-wider uppercase text-slate-950 shadow-sm border border-black/10">
            {item.sumberAnggaran}
          </span>
          <span className={cn(
            "px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider backdrop-blur-md shadow-sm border",
            item.status === 'selesai'
              ? "bg-emerald-500/90 text-white border-emerald-400/30"
              : item.status === 'berjalan'
                ? "bg-amber-500/90 text-white border-amber-400/30"
                : "bg-blue-500/90 text-white border-blue-400/30"
          )}>
            {item.status === 'selesai' ? 'Selesai 100%' : item.status === 'berjalan' ? 'Sedang Berjalan' : 'Tahap Perencanaan'}
          </span>
        </div>
      </div>

      {/* ─── KONTEN DETAIL & REDAKSI KEGIATAN ─── */}
      <div className="p-5 sm:p-6 flex-1 flex flex-col justify-between space-y-4">
        <div className="space-y-3">
          {/* Judul Kegiatan */}
          <h3 className="font-condensed font-black text-lg sm:text-xl text-slate-900 uppercase leading-snug tracking-tight">
            {item.judul}
          </h3>

          {/* Grid Informasi Teknis & Anggaran */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
            <div className="neu-inset p-2.5 rounded-xl border border-white/60 flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-800 flex items-center justify-center shrink-0">
                <Coins className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-bold text-slate-500 uppercase block">Anggaran Proyek</span>
                <span className="text-xs sm:text-sm font-mono font-black text-slate-900 block truncate">
                  {formatRupiah(item.anggaran)}
                </span>
              </div>
            </div>

            <div className="neu-inset p-2.5 rounded-xl border border-white/60 flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-800 flex items-center justify-center shrink-0">
                <Layers className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-bold text-slate-500 uppercase block">Volume Fisik</span>
                <span className="text-xs sm:text-sm font-bold text-slate-900 block truncate" title={item.volume}>
                  {item.volume || '-'}
                </span>
              </div>
            </div>
          </div>

          {/* Lokasi & Pelaksana Bar */}
          <div className="space-y-1.5 text-xs text-slate-600 bg-stone-100/70 p-3 rounded-xl border border-stone-200/60">
            <div className="flex items-start gap-1.5">
              <MapPin className="h-3.5 w-3.5 text-rose-500 shrink-0 mt-0.5" />
              <span className="font-semibold text-slate-800">
                Lokasi: <span className="font-normal text-slate-700">{item.lokasi || '-'}</span>
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
              <HardHat className="h-3.5 w-3.5 text-emerald-700 shrink-0" />
              <span>Pelaksana: {item.pelaksana || 'Tim Pelaksana Kegiatan (TPK) Desa Sampeldes'}</span>
              <span>&bull;</span>
              <span>Tahun {item.tahun}</span>
            </div>
          </div>

          {/* Redaksi Berita Kegiatan (Seperti Berita) */}
          {item.redaksi && (
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-condensed font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1">
                  <FileText className="h-3.5 w-3.5 text-emerald-700" />
                  <span>Redaksi Laporan Berita:</span>
                </span>
              </div>
              <div className={cn(
                "text-xs leading-relaxed text-slate-600 transition-all whitespace-pre-line font-serif",
                !isExpanded && "line-clamp-3"
              )}>
                {item.redaksi}
              </div>
              {item.redaksi.length > 200 && (
                <button
                  type="button"
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="text-[11px] font-bold text-emerald-800 hover:text-emerald-950 flex items-center gap-1 cursor-pointer pt-0.5"
                >
                  <span>{isExpanded ? 'Sembunyikan Sebagian' : 'Baca Uraian Lengkap Berita'}</span>
                  <ChevronRight className={cn("h-3 w-3 transition-transform", isExpanded && "rotate-90")} />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Footer Card */}
        <div className="pt-3 border-t border-slate-200/60 flex items-center justify-between text-[11px] text-slate-500">
          <span className="flex items-center gap-1">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
            <span>Dokumentasi Resmi Sampeldes</span>
          </span>
          {photos.length > 0 && (
            <button
              type="button"
              onClick={() => onOpenLightbox(photos, 0)}
              className="font-bold text-emerald-700 hover:text-emerald-900 cursor-pointer flex items-center gap-1"
            >
              <span>Buka Galeri Foto</span>
              <ArrowRight className="h-3 w-3" />
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
