'use client';

import React, { useState, useMemo } from 'react';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import { AsetDesa, KategoriAsetDesa } from '@/lib/types';
import { SEED_ASET_DESA } from '@/app/admin/tata-kelola-desa/_components/aset-desa-tab';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Landmark,
  Building,
  Car,
  Tractor,
  Search,
  MapPin,
  Layers,
  CheckCircle2,
  AlertCircle,
  Printer,
  Eye,
  X,
  PhoneCall,
  ShieldCheck,
  ArrowUpRight,
  Table as TableIcon,
  LayoutGrid,
  Sparkles,
  Info,
  ChevronRight,
  Maximize2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

export function AsetDesaPublicTab() {
  const firestore = useFirestore();

  // Queries
  const asetQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'asetDesa'), orderBy('createdAt', 'desc'));
  }, [firestore]);

  const { data: dbAset, isLoading } = useCollection<AsetDesa>(asetQuery);

  // Fallback to seed data if database is empty
  const rawData = useMemo(() => {
    if (dbAset && dbAset.length > 0) {
      return dbAset;
    }
    return SEED_ASET_DESA;
  }, [dbAset]);

  // States
  const [activeKategori, setActiveKategori] = useState<KategoriAsetDesa>('tanah');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [selectedItem, setSelectedItem] = useState<AsetDesa | null>(null);

  // Filtered by category and search
  const filteredList = useMemo(() => {
    return rawData.filter(item => {
      if (item.kategori !== activeKategori) return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        item.namaAset?.toLowerCase().includes(q) ||
        item.kodeAset?.toLowerCase().includes(q) ||
        item.namaBangunan?.toLowerCase().includes(q) ||
        item.jenisMerk?.toLowerCase().includes(q) ||
        item.nomorPolisi?.toLowerCase().includes(q) ||
        item.namaAlat?.toLowerCase().includes(q) ||
        item.lokasi?.toLowerCase().includes(q) ||
        item.pemanfaatan?.toLowerCase().includes(q) ||
        item.pengelola?.toLowerCase().includes(q) ||
        item.penanggungJawab?.toLowerCase().includes(q)
      );
    });
  }, [rawData, activeKategori, searchQuery]);

  // Summary Metrics
  const metrics = useMemo(() => {
    const tanah = rawData.filter(i => i.kategori === 'tanah');
    const gedung = rawData.filter(i => i.kategori === 'gedung');
    const kendaraan = rawData.filter(i => i.kategori === 'kendaraan');
    const alsintan = rawData.filter(i => i.kategori === 'alsintan');

    return {
      totalTanah: tanah.length,
      totalGedung: gedung.length,
      totalKendaraan: kendaraan.length,
      totalAlsintan: alsintan.length,
      ambulanceReady: kendaraan.some(k => k.jenisMerk?.toLowerCase().includes('ambulans') && k.kondisi === 'Baik')
    };
  }, [rawData]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 sm:space-y-10">
      {/* ── TOP HERO HIGHLIGHT BANNER (NEUMORPHIC ELEVATED DARK) ── */}
      <section className="neu-card-elevated-dark rounded-[28px] border border-white/10 p-6 sm:p-8 md:p-10 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-[#00a884]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full neu-inset border border-white/10 text-xs font-mono font-bold text-[#00a884]">
                <ShieldCheck className="h-3.5 w-3.5" />
                <span>INVENTARISASI &amp; AKUNTABILITAS ASET DESA</span>
              </div>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-condensed font-bold uppercase tracking-tight text-white leading-none">
                Buku Inventaris <span className="text-[#00a884]">Aset Desa</span> Sampeldes
              </h2>
              <p className="text-xs sm:text-sm text-stone-300 max-w-2xl leading-relaxed">
                Pencatatan resmi barang milik desa yang bersumber dari kekayaan asli desa, APBDes, serta perolehan hak lainnya. Disajikan secara terbuka guna mendukung tata kelola aset yang tertib hukum, tertib administrasi, dan tertib fisik.
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrint}
                className="neu-btn rounded-xl text-xs font-bold gap-2 text-slate-800 dark:text-white border-stone-300 dark:border-white/10 h-10 px-4"
              >
                <Printer className="h-4 w-4" />
                <span>Cetak Rekap</span>
              </Button>
            </div>
          </div>

          {/* 4 STATS PILLS */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 pt-2">
            <div
              onClick={() => setActiveKategori('tanah')}
              className={cn(
                "p-3.5 sm:p-4 rounded-2xl transition-all cursor-pointer border",
                activeKategori === 'tanah'
                  ? "bg-slate-900 border-[#00a884] shadow-lg shadow-[#00a884]/10"
                  : "neu-inset border-white/5 hover:border-white/20"
              )}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] sm:text-xs font-bold text-stone-300 uppercase tracking-wider">1. Tanah Kas Desa</span>
                <Landmark className="h-4 w-4 text-[#00a884]" />
              </div>
              <div className="mt-2 text-xl sm:text-2xl font-condensed font-extrabold text-white">
                {metrics.totalTanah} <span className="text-xs font-normal text-stone-400">Bidang</span>
              </div>
            </div>

            <div
              onClick={() => setActiveKategori('gedung')}
              className={cn(
                "p-3.5 sm:p-4 rounded-2xl transition-all cursor-pointer border",
                activeKategori === 'gedung'
                  ? "bg-slate-900 border-[#00a884] shadow-lg shadow-[#00a884]/10"
                  : "neu-inset border-white/5 hover:border-white/20"
              )}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] sm:text-xs font-bold text-stone-300 uppercase tracking-wider">2. Gedung &amp; Bangunan</span>
                <Building className="h-4 w-4 text-emerald-400" />
              </div>
              <div className="mt-2 text-xl sm:text-2xl font-condensed font-extrabold text-white">
                {metrics.totalGedung} <span className="text-xs font-normal text-stone-400">Unit</span>
              </div>
            </div>

            <div
              onClick={() => setActiveKategori('kendaraan')}
              className={cn(
                "p-3.5 sm:p-4 rounded-2xl transition-all cursor-pointer border",
                activeKategori === 'kendaraan'
                  ? "bg-slate-900 border-[#00a884] shadow-lg shadow-[#00a884]/10"
                  : "neu-inset border-white/5 hover:border-white/20"
              )}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] sm:text-xs font-bold text-stone-300 uppercase tracking-wider">3. Kendaraan &amp; Ambulans</span>
                <Car className="h-4 w-4 text-amber-400" />
              </div>
              <div className="mt-2 text-xl sm:text-2xl font-condensed font-extrabold text-white">
                {metrics.totalKendaraan} <span className="text-xs font-normal text-stone-400">Armada</span>
              </div>
            </div>

            <div
              onClick={() => setActiveKategori('alsintan')}
              className={cn(
                "p-3.5 sm:p-4 rounded-2xl transition-all cursor-pointer border",
                activeKategori === 'alsintan'
                  ? "bg-slate-900 border-[#00a884] shadow-lg shadow-[#00a884]/10"
                  : "neu-inset border-white/5 hover:border-white/20"
              )}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] sm:text-xs font-bold text-stone-300 uppercase tracking-wider">4. Alsintan &amp; Sarana</span>
                <Tractor className="h-4 w-4 text-cyan-400" />
              </div>
              <div className="mt-2 text-xl sm:text-2xl font-condensed font-extrabold text-white">
                {metrics.totalAlsintan} <span className="text-xs font-normal text-stone-400">Unit</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── SUB-TABS SELECTOR & CONTROLS (NEUMORPHIC) ── */}
      <div className="neu-card-elevated rounded-2xl sm:rounded-[24px] border border-white/80 dark:border-white/10 p-3 sm:p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4">
        {/* BUTTONS TABS */}
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          <Button
            type="button"
            variant="ghost"
            onClick={() => setActiveKategori('tanah')}
            className={cn(
              "rounded-xl text-xs font-condensed font-bold uppercase tracking-wider px-3.5 py-2 h-10 transition-all gap-2",
              activeKategori === 'tanah'
                ? "neu-btn-dark bg-[#070b10] text-[#00a884] shadow-md"
                : "neu-btn text-slate-700 dark:text-stone-300 hover:text-slate-950"
            )}
          >
            <Landmark className="h-4 w-4" />
            <span>Tab 1. Tanah Kas Desa</span>
          </Button>

          <Button
            type="button"
            variant="ghost"
            onClick={() => setActiveKategori('gedung')}
            className={cn(
              "rounded-xl text-xs font-condensed font-bold uppercase tracking-wider px-3.5 py-2 h-10 transition-all gap-2",
              activeKategori === 'gedung'
                ? "neu-btn-dark bg-[#070b10] text-[#00a884] shadow-md"
                : "neu-btn text-slate-700 dark:text-stone-300 hover:text-slate-950"
            )}
          >
            <Building className="h-4 w-4" />
            <span>Tab 2. Gedung &amp; Bangunan</span>
          </Button>

          <Button
            type="button"
            variant="ghost"
            onClick={() => setActiveKategori('kendaraan')}
            className={cn(
              "rounded-xl text-xs font-condensed font-bold uppercase tracking-wider px-3.5 py-2 h-10 transition-all gap-2",
              activeKategori === 'kendaraan'
                ? "neu-btn-dark bg-[#070b10] text-[#00a884] shadow-md"
                : "neu-btn text-slate-700 dark:text-stone-300 hover:text-slate-950"
            )}
          >
            <Car className="h-4 w-4" />
            <span>Tab 3. Kendaraan &amp; Ambulans</span>
          </Button>

          <Button
            type="button"
            variant="ghost"
            onClick={() => setActiveKategori('alsintan')}
            className={cn(
              "rounded-xl text-xs font-condensed font-bold uppercase tracking-wider px-3.5 py-2 h-10 transition-all gap-2",
              activeKategori === 'alsintan'
                ? "neu-btn-dark bg-[#070b10] text-[#00a884] shadow-md"
                : "neu-btn text-slate-700 dark:text-stone-300 hover:text-slate-950"
            )}
          >
            <Tractor className="h-4 w-4" />
            <span>Tab 4. Alsintan &amp; Sarana</span>
          </Button>
        </div>

        {/* SEARCH & VIEW SWITCHER */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:w-60">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-stone-400" />
            <Input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Cari aset..."
              className="neu-inset pl-9 h-10 rounded-xl text-xs bg-transparent border border-stone-300/40 dark:border-white/10 text-slate-900 dark:text-white placeholder:text-stone-400"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-slate-800 dark:hover:text-white"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center neu-inset p-1 rounded-xl border border-stone-300/40 dark:border-white/10 shrink-0">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => setViewMode('cards')}
              className={cn(
                "h-8 w-8 rounded-lg transition-all",
                viewMode === 'cards'
                  ? "bg-[#070b10] text-[#00a884] shadow-xs"
                  : "text-stone-500 hover:text-slate-900 dark:hover:text-white"
              )}
              title="Tampilan Kartu"
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => setViewMode('table')}
              className={cn(
                "h-8 w-8 rounded-lg transition-all",
                viewMode === 'table'
                  ? "bg-[#070b10] text-[#00a884] shadow-xs"
                  : "text-stone-500 hover:text-slate-900 dark:hover:text-white"
              )}
              title="Tampilan Tabel"
            >
              <TableIcon className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* ── CONTENT RENDERING ── */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <Skeleton key={i} className="h-56 rounded-2xl neu-inset" />
          ))}
        </div>
      ) : filteredList.length === 0 ? (
        <div className="neu-card-elevated rounded-[28px] border border-white/80 dark:border-white/10 p-12 text-center space-y-3">
          <div className="mx-auto w-12 h-12 rounded-full neu-inset flex items-center justify-center text-stone-400">
            <AlertCircle className="h-6 w-6" />
          </div>
          <h3 className="text-base font-bold text-slate-800 dark:text-white">Tidak Ada Data Ditemukan</h3>
          <p className="text-xs text-stone-500 dark:text-stone-400 max-w-sm mx-auto">
            {searchQuery
              ? `Tidak ada aset yang cocok dengan kata kunci "${searchQuery}". Coba kata kunci lainnya.`
              : 'Belum ada data pada kategori ini.'}
          </p>
        </div>
      ) : viewMode === 'cards' ? (
        /* ── CARDS VIEW (NEUMORPHIC CARDS) ── */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {filteredList.map((item, idx) => (
            <div
              key={item.id || idx}
              className="neu-card-elevated rounded-2xl sm:rounded-[24px] border border-white/80 dark:border-white/10 hover:border-[#00a884] transition-all duration-300 overflow-hidden flex flex-col justify-between group"
            >
              {/* PHOTO / HEADER BANNER */}
              {item.fotoUrl ? (
                <div className="relative aspect-[16/10] w-full overflow-hidden neu-inset cursor-pointer" onClick={() => setSelectedItem(item)}>
                  <img
                    src={item.fotoUrl}
                    alt={item.namaAset || item.namaBangunan || item.jenisMerk || item.namaAlat || 'Aset Desa'}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end justify-between p-3.5">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#00a884] px-2 py-0.5 rounded-md bg-black/60 border border-white/10">
                      {item.kodeAset || item.nomorPolisi || `ITEM-${idx + 1}`}
                    </span>
                    <button className="p-1 rounded-full bg-black/60 text-white hover:bg-black/80">
                      <Maximize2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-4 pb-0 flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-800 dark:text-[#00a884] px-2 py-0.5 rounded-md neu-inset border border-stone-300/40 dark:border-white/10">
                    {item.kodeAset || item.nomorPolisi || `ITEM-${idx + 1}`}
                  </span>
                  {item.kondisi && (
                    <Badge variant="outline" className={cn(
                      "text-[10px] font-bold uppercase tracking-wider",
                      item.kondisi.toLowerCase().includes('baik')
                        ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30"
                        : "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30"
                    )}>
                      {item.kondisi}
                    </Badge>
                  )}
                </div>
              )}

              {/* CARD BODY DETAILS BASED ON CATEGORY */}
              <div className="p-4 sm:p-5 space-y-3.5 flex-1 flex flex-col justify-between">
                <div className="space-y-1.5">
                  <h3 className="text-base sm:text-lg font-condensed font-bold uppercase tracking-tight text-slate-900 dark:text-white leading-tight">
                    {activeKategori === 'tanah' && item.namaAset}
                    {activeKategori === 'gedung' && item.namaBangunan}
                    {activeKategori === 'kendaraan' && item.jenisMerk}
                    {activeKategori === 'alsintan' && item.namaAlat}
                  </h3>

                  {item.lokasi && (
                    <div className="flex items-start gap-1.5 text-xs text-stone-600 dark:text-stone-300 font-medium">
                      <MapPin className="h-3.5 w-3.5 text-emerald-700 dark:text-[#00a884] shrink-0 mt-0.5" />
                      <span className="line-clamp-1">{item.lokasi}</span>
                    </div>
                  )}
                </div>

                {/* PARAMETER DETAILS INSET BOX */}
                <div className="neu-inset rounded-xl p-3 border border-stone-300/40 dark:border-white/10 space-y-2 text-xs">
                  {/* TAB 1: TANAH FIELDS */}
                  {activeKategori === 'tanah' && (
                    <>
                      <div className="flex justify-between items-center text-slate-800 dark:text-stone-200">
                        <span className="text-stone-500 dark:text-stone-400">Luas Tanah:</span>
                        <span className="font-mono font-bold text-slate-900 dark:text-white">{item.luas || '-'}</span>
                      </div>
                      <div className="flex justify-between items-center text-slate-800 dark:text-stone-200">
                        <span className="text-stone-500 dark:text-stone-400">Bukti Hak:</span>
                        <span className="font-semibold">{item.buktiKepemilikan || '-'}</span>
                      </div>
                      <div className="flex justify-between items-center text-slate-800 dark:text-stone-200">
                        <span className="text-stone-500 dark:text-stone-400">Pemanfaatan:</span>
                        <span className="font-semibold text-right">{item.pemanfaatan || '-'}</span>
                      </div>
                      <div className="pt-1 border-t border-stone-200/50 dark:border-white/5 flex justify-between items-center">
                        <span className="text-stone-500 dark:text-stone-400">Kontribusi PADes:</span>
                        <span className="font-bold text-emerald-800 dark:text-[#00a884]">{item.kontribusiPades || '-'}</span>
                      </div>
                    </>
                  )}

                  {/* TAB 2: GEDUNG FIELDS */}
                  {activeKategori === 'gedung' && (
                    <>
                      <div className="flex justify-between items-center text-slate-800 dark:text-stone-200">
                        <span className="text-stone-500 dark:text-stone-400">Luas Bangunan:</span>
                        <span className="font-mono font-bold text-slate-900 dark:text-white">{item.luasBangunan || '-'}</span>
                      </div>
                      <div className="flex justify-between items-center text-slate-800 dark:text-stone-200">
                        <span className="text-stone-500 dark:text-stone-400">Tahun Bangun:</span>
                        <span className="font-semibold">{item.tahunBangun || '-'}</span>
                      </div>
                      <div className="flex justify-between items-center text-slate-800 dark:text-stone-200">
                        <span className="text-stone-500 dark:text-stone-400">Sumber Anggaran:</span>
                        <span className="font-semibold text-right">{item.sumberAnggaran || '-'}</span>
                      </div>
                      <div className="pt-1 border-t border-stone-200/50 dark:border-white/5 flex justify-between items-center">
                        <span className="text-stone-500 dark:text-stone-400">Status Fungsi:</span>
                        <span className="font-bold text-emerald-800 dark:text-[#00a884]">{item.statusPemanfaatan || '-'}</span>
                      </div>
                    </>
                  )}

                  {/* TAB 3: KENDARAAN FIELDS */}
                  {activeKategori === 'kendaraan' && (
                    <>
                      <div className="flex justify-between items-center text-slate-800 dark:text-stone-200">
                        <span className="text-stone-500 dark:text-stone-400">Nomor Polisi:</span>
                        <span className="font-mono font-bold text-slate-900 dark:text-white text-xs px-1.5 py-0.5 rounded bg-stone-200/60 dark:bg-stone-800">{item.nomorPolisi || '-'}</span>
                      </div>
                      <div className="flex justify-between items-center text-slate-800 dark:text-stone-200">
                        <span className="text-stone-500 dark:text-stone-400">Tahun / Sumber:</span>
                        <span className="font-semibold">{item.tahunPerolehan} ({item.sumberDana || '-'})</span>
                      </div>
                      <div className="flex justify-between items-center text-slate-800 dark:text-stone-200">
                        <span className="text-stone-500 dark:text-stone-400">Kondisi Fisik:</span>
                        <span className="font-bold text-emerald-800 dark:text-[#00a884]">{item.kondisi || 'Baik'}</span>
                      </div>
                      <div className="pt-1 border-t border-stone-200/50 dark:border-white/5 flex flex-col gap-0.5">
                        <span className="text-[10px] text-stone-500 dark:text-stone-400">Peruntukan &amp; PIC:</span>
                        <span className="font-semibold text-slate-900 dark:text-white line-clamp-1">{item.penanggungJawab || '-'}</span>
                      </div>
                    </>
                  )}

                  {/* TAB 4: ALSINTAN FIELDS */}
                  {activeKategori === 'alsintan' && (
                    <>
                      <div className="flex justify-between items-center text-slate-800 dark:text-stone-200">
                        <span className="text-stone-500 dark:text-stone-400">Jumlah Unit:</span>
                        <span className="font-mono font-bold text-slate-900 dark:text-white">{item.jumlah || '-'}</span>
                      </div>
                      <div className="flex justify-between items-center text-slate-800 dark:text-stone-200">
                        <span className="text-stone-500 dark:text-stone-400">Tahun &amp; Sumber:</span>
                        <span className="font-semibold text-right">{item.tahunSumberDana || '-'}</span>
                      </div>
                      <div className="flex justify-between items-center text-slate-800 dark:text-stone-200">
                        <span className="text-stone-500 dark:text-stone-400">Kelompok Pengelola:</span>
                        <span className="font-semibold text-right">{item.pengelola || '-'}</span>
                      </div>
                      <div className="pt-1 border-t border-stone-200/50 dark:border-white/5 flex justify-between items-center">
                        <span className="text-stone-500 dark:text-stone-400">Status Pinjam:</span>
                        <span className="font-bold text-emerald-800 dark:text-[#00a884]">{item.statusPinjam || '-'}</span>
                      </div>
                    </>
                  )}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedItem(item)}
                  className="w-full neu-btn rounded-xl text-xs font-condensed font-bold uppercase tracking-wider text-slate-800 dark:text-white h-9 gap-1.5"
                >
                  <Eye className="h-3.5 w-3.5" />
                  <span>Lihat Detail Aset</span>
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* ── TABLE VIEW (NEUMORPHIC TABLE CONTAINER) ── */
        <div className="neu-card-elevated rounded-[28px] border border-white/80 dark:border-white/10 p-2 sm:p-4 overflow-hidden">
          <div className="overflow-x-auto neu-inset rounded-2xl border border-stone-300/40 dark:border-white/10">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#070b10] text-[#00a884] font-condensed font-bold uppercase tracking-wider text-[11px] border-b border-white/10">
                <tr>
                  <th className="py-4 px-4 text-center w-12">No</th>
                  {activeKategori === 'tanah' && (
                    <>
                      <th className="py-4 px-4">Kode &amp; Nama Aset</th>
                      <th className="py-4 px-4">Lokasi (Blok/Dusun)</th>
                      <th className="py-4 px-4">Luas (m²)</th>
                      <th className="py-4 px-4">Bukti Kepemilikan</th>
                      <th className="py-4 px-4">Pemanfaatan Saat Ini</th>
                      <th className="py-4 px-4">Kontribusi PADes / Ket.</th>
                    </>
                  )}
                  {activeKategori === 'gedung' && (
                    <>
                      <th className="py-4 px-4">Nama Bangunan</th>
                      <th className="py-4 px-4">Lokasi</th>
                      <th className="py-4 px-4">Luas Bangunan</th>
                      <th className="py-4 px-4">Tahun Bangun / Rehab</th>
                      <th className="py-4 px-4">Sumber Anggaran</th>
                      <th className="py-4 px-4">Status Pemanfaatan</th>
                    </>
                  )}
                  {activeKategori === 'kendaraan' && (
                    <>
                      <th className="py-4 px-4">Jenis &amp; Merk</th>
                      <th className="py-4 px-4">Nomor Polisi</th>
                      <th className="py-4 px-4">Tahun Perolehan</th>
                      <th className="py-4 px-4">Sumber Dana</th>
                      <th className="py-4 px-4">Kondisi</th>
                      <th className="py-4 px-4">Peruntukan &amp; PIC</th>
                    </>
                  )}
                  {activeKategori === 'alsintan' && (
                    <>
                      <th className="py-4 px-4">Nama Alat / Barang</th>
                      <th className="py-4 px-4">Jumlah</th>
                      <th className="py-4 px-4">Tahun &amp; Sumber Dana</th>
                      <th className="py-4 px-4">Kondisi</th>
                      <th className="py-4 px-4">Pengelola / Kelompok</th>
                      <th className="py-4 px-4">Status Pinjam Pakai</th>
                    </>
                  )}
                  <th className="py-4 px-4 text-center w-24">Detail</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200/60 dark:divide-white/5 text-slate-800 dark:text-stone-200">
                {filteredList.map((item, idx) => (
                  <tr key={item.id || idx} className="hover:bg-black/5 dark:hover:bg-white/[0.02] transition-colors">
                    <td className="py-3.5 px-4 text-center font-mono font-bold text-stone-400">{idx + 1}</td>

                    {/* TAB 1: TANAH */}
                    {activeKategori === 'tanah' && (
                      <>
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-900 dark:text-white text-sm">{item.namaAset}</div>
                          <div className="text-[10px] font-mono text-emerald-800 dark:text-[#00a884] font-semibold">{item.kodeAset || '-'}</div>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-1.5">
                            <MapPin className="h-3 w-3 text-stone-400 shrink-0" />
                            <span>{item.lokasi || '-'}</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 font-mono font-bold text-slate-900 dark:text-white">{item.luas || '-'}</td>
                        <td className="py-3.5 px-4">
                          <span className="inline-block px-2 py-0.5 rounded-full neu-inset text-[10px] font-semibold border border-stone-300/40 dark:border-white/10">
                            {item.buktiKepemilikan || '-'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">{item.pemanfaatan || '-'}</td>
                        <td className="py-3.5 px-4 font-bold text-emerald-800 dark:text-[#00a884]">{item.kontribusiPades || '-'}</td>
                      </>
                    )}

                    {/* TAB 2: GEDUNG */}
                    {activeKategori === 'gedung' && (
                      <>
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-900 dark:text-white text-sm">{item.namaBangunan}</div>
                          {item.keterangan && <div className="text-[10px] text-stone-500 line-clamp-1">{item.keterangan}</div>}
                        </td>
                        <td className="py-3.5 px-4">{item.lokasi || '-'}</td>
                        <td className="py-3.5 px-4 font-mono font-bold text-slate-900 dark:text-white">{item.luasBangunan || '-'}</td>
                        <td className="py-3.5 px-4">{item.tahunBangun || '-'}</td>
                        <td className="py-3.5 px-4">{item.sumberAnggaran || '-'}</td>
                        <td className="py-3.5 px-4">
                          <span className="inline-block px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 text-[10px] font-bold border border-emerald-500/30">
                            {item.statusPemanfaatan || '-'}
                          </span>
                        </td>
                      </>
                    )}

                    {/* TAB 3: KENDARAAN */}
                    {activeKategori === 'kendaraan' && (
                      <>
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-900 dark:text-white text-sm">{item.jenisMerk}</div>
                        </td>
                        <td className="py-3.5 px-4 font-mono font-bold text-emerald-800 dark:text-[#00a884]">{item.nomorPolisi || '-'}</td>
                        <td className="py-3.5 px-4">{item.tahunPerolehan || '-'}</td>
                        <td className="py-3.5 px-4">{item.sumberDana || '-'}</td>
                        <td className="py-3.5 px-4">
                          <span className={cn(
                            "inline-block px-2 py-0.5 rounded-full text-[10px] font-bold border",
                            item.kondisi?.toLowerCase().includes('baik')
                              ? "bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border-emerald-500/30"
                              : "bg-amber-500/10 text-amber-800 dark:text-amber-300 border-amber-500/30"
                          )}>
                            {item.kondisi || 'Baik'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">{item.penanggungJawab || '-'}</td>
                      </>
                    )}

                    {/* TAB 4: ALSINTAN */}
                    {activeKategori === 'alsintan' && (
                      <>
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-900 dark:text-white text-sm">{item.namaAlat}</div>
                        </td>
                        <td className="py-3.5 px-4 font-mono font-bold text-slate-900 dark:text-white">{item.jumlah || '-'}</td>
                        <td className="py-3.5 px-4">{item.tahunSumberDana || '-'}</td>
                        <td className="py-3.5 px-4">
                          <span className={cn(
                            "inline-block px-2 py-0.5 rounded-full text-[10px] font-bold border",
                            item.kondisi?.toLowerCase().includes('baik')
                              ? "bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border-emerald-500/30"
                              : "bg-amber-500/10 text-amber-800 dark:text-amber-300 border-amber-500/30"
                          )}>
                            {item.kondisi || 'Baik'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">{item.pengelola || '-'}</td>
                        <td className="py-3.5 px-4">
                          <span className="inline-block px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-800 dark:text-blue-300 text-[10px] font-bold border border-blue-500/30">
                            {item.statusPinjam || '-'}
                          </span>
                        </td>
                      </>
                    )}

                    <td className="py-3.5 px-4 text-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedItem(item)}
                        className="h-8 px-2.5 neu-btn rounded-lg text-[11px] font-bold gap-1 text-slate-800 dark:text-white"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        <span>Lihat</span>
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── MODAL DETAIL DIALOG (NEUMORPHIC) ── */}
      <Dialog open={!!selectedItem} onOpenChange={(open) => !open && setSelectedItem(null)}>
        <DialogContent className="max-w-xl neu-card-elevated-dark border border-white/10 text-white p-5 sm:p-7 rounded-[28px] overflow-hidden">
          {selectedItem && (
            <div className="space-y-5">
              <DialogHeader>
                <div className="flex items-center gap-2">
                  <span className="p-1.5 bg-[#00a884]/20 text-[#00a884] rounded-lg">
                    {selectedItem.kategori === 'tanah' && <Landmark className="h-4 w-4" />}
                    {selectedItem.kategori === 'gedung' && <Building className="h-4 w-4" />}
                    {selectedItem.kategori === 'kendaraan' && <Car className="h-4 w-4" />}
                    {selectedItem.kategori === 'alsintan' && <Tractor className="h-4 w-4" />}
                  </span>
                  <span className="text-[10px] font-mono font-bold text-[#00a884] uppercase tracking-wider">
                    {selectedItem.kodeAset || selectedItem.nomorPolisi || selectedItem.kategori.toUpperCase()}
                  </span>
                </div>
                <DialogTitle className="text-xl sm:text-2xl font-condensed font-bold uppercase tracking-tight text-white mt-1 leading-tight">
                  {selectedItem.namaAset || selectedItem.namaBangunan || selectedItem.jenisMerk || selectedItem.namaAlat}
                </DialogTitle>
                <DialogDescription className="text-xs text-stone-400">
                  Data register resmi inventaris barang milik Desa Sampeldes, Kec. Gandrungmangu.
                </DialogDescription>
              </DialogHeader>

              {/* FOTO DOKUMENTASI */}
              {selectedItem.fotoUrl && (
                <div className="relative aspect-[16/9] w-full rounded-2xl overflow-hidden neu-inset border border-white/10">
                  <img
                    src={selectedItem.fotoUrl}
                    alt="Foto Aset"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              {/* DETAIL PARAMETERS */}
              <div className="neu-inset rounded-2xl p-4 border border-white/10 space-y-2.5 text-xs">
                {selectedItem.lokasi && (
                  <div className="flex justify-between items-start gap-2">
                    <span className="text-stone-400">Lokasi / Dusun:</span>
                    <span className="font-semibold text-right text-white">{selectedItem.lokasi}</span>
                  </div>
                )}

                {selectedItem.luas && (
                  <div className="flex justify-between items-center gap-2">
                    <span className="text-stone-400">Luas Tanah:</span>
                    <span className="font-mono font-bold text-[#00a884]">{selectedItem.luas}</span>
                  </div>
                )}

                {selectedItem.buktiKepemilikan && (
                  <div className="flex justify-between items-center gap-2">
                    <span className="text-stone-400">Bukti Kepemilikan:</span>
                    <span className="font-semibold text-white">{selectedItem.buktiKepemilikan}</span>
                  </div>
                )}

                {selectedItem.pemanfaatan && (
                  <div className="flex justify-between items-center gap-2">
                    <span className="text-stone-400">Pemanfaatan:</span>
                    <span className="font-semibold text-white text-right">{selectedItem.pemanfaatan}</span>
                  </div>
                )}

                {selectedItem.kontribusiPades && (
                  <div className="flex justify-between items-center gap-2 pt-1 border-t border-white/5">
                    <span className="text-stone-400">Kontribusi PADes / Ket:</span>
                    <span className="font-bold text-[#00a884]">{selectedItem.kontribusiPades}</span>
                  </div>
                )}

                {selectedItem.luasBangunan && (
                  <div className="flex justify-between items-center gap-2">
                    <span className="text-stone-400">Luas Bangunan:</span>
                    <span className="font-mono font-bold text-[#00a884]">{selectedItem.luasBangunan}</span>
                  </div>
                )}

                {selectedItem.tahunBangun && (
                  <div className="flex justify-between items-center gap-2">
                    <span className="text-stone-400">Tahun Bangun / Rehab:</span>
                    <span className="font-semibold text-white">{selectedItem.tahunBangun}</span>
                  </div>
                )}

                {selectedItem.sumberAnggaran && (
                  <div className="flex justify-between items-center gap-2">
                    <span className="text-stone-400">Sumber Anggaran:</span>
                    <span className="font-semibold text-white">{selectedItem.sumberAnggaran}</span>
                  </div>
                )}

                {selectedItem.statusPemanfaatan && (
                  <div className="flex justify-between items-center gap-2 pt-1 border-t border-white/5">
                    <span className="text-stone-400">Status Pemanfaatan:</span>
                    <span className="font-bold text-[#00a884]">{selectedItem.statusPemanfaatan}</span>
                  </div>
                )}

                {selectedItem.nomorPolisi && (
                  <div className="flex justify-between items-center gap-2">
                    <span className="text-stone-400">Nomor Polisi:</span>
                    <span className="font-mono font-bold text-[#00a884] px-2 py-0.5 rounded bg-black/60 border border-white/10">{selectedItem.nomorPolisi}</span>
                  </div>
                )}

                {selectedItem.tahunPerolehan && (
                  <div className="flex justify-between items-center gap-2">
                    <span className="text-stone-400">Tahun Perolehan:</span>
                    <span className="font-semibold text-white">{selectedItem.tahunPerolehan}</span>
                  </div>
                )}

                {selectedItem.sumberDana && (
                  <div className="flex justify-between items-center gap-2">
                    <span className="text-stone-400">Sumber Dana:</span>
                    <span className="font-semibold text-white">{selectedItem.sumberDana}</span>
                  </div>
                )}

                {selectedItem.kondisi && (
                  <div className="flex justify-between items-center gap-2">
                    <span className="text-stone-400">Kondisi:</span>
                    <span className="font-bold text-emerald-400">{selectedItem.kondisi}</span>
                  </div>
                )}

                {selectedItem.penanggungJawab && (
                  <div className="flex flex-col gap-1 pt-1 border-t border-white/5">
                    <span className="text-stone-400">Peruntukan &amp; Penanggung Jawab (PIC):</span>
                    <span className="font-semibold text-white">{selectedItem.penanggungJawab}</span>
                  </div>
                )}

                {selectedItem.jumlah && (
                  <div className="flex justify-between items-center gap-2">
                    <span className="text-stone-400">Jumlah:</span>
                    <span className="font-mono font-bold text-[#00a884]">{selectedItem.jumlah}</span>
                  </div>
                )}

                {selectedItem.tahunSumberDana && (
                  <div className="flex justify-between items-center gap-2">
                    <span className="text-stone-400">Tahun &amp; Sumber Dana:</span>
                    <span className="font-semibold text-white">{selectedItem.tahunSumberDana}</span>
                  </div>
                )}

                {selectedItem.pengelola && (
                  <div className="flex justify-between items-center gap-2">
                    <span className="text-stone-400">Pengelola / Pemegang:</span>
                    <span className="font-semibold text-white">{selectedItem.pengelola}</span>
                  </div>
                )}

                {selectedItem.statusPinjam && (
                  <div className="flex justify-between items-center gap-2 pt-1 border-t border-white/5">
                    <span className="text-stone-400">Status Pinjam Pakai:</span>
                    <span className="font-bold text-[#00a884]">{selectedItem.statusPinjam}</span>
                  </div>
                )}
              </div>

              {selectedItem.keterangan && (
                <div className="p-3.5 rounded-xl neu-inset border border-white/5 text-xs text-stone-300 leading-relaxed">
                  <span className="font-bold text-[#00a884] block mb-1">Catatan Tambahan:</span>
                  {selectedItem.keterangan}
                </div>
              )}

              <div className="flex justify-end pt-2">
                <Button
                  onClick={() => setSelectedItem(null)}
                  className="bg-[#00a884] hover:bg-[#059669] text-slate-950 font-bold text-xs uppercase tracking-wider rounded-xl h-10 px-6"
                >
                  Tutup
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

