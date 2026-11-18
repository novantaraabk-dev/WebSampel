'use client';

import React, { useState, useMemo } from 'react';
import { useCollection, useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, doc } from 'firebase/firestore';
import {
  PetaKebencanaanConfig,
  RisikoBencanaItem,
  TempatEvakuasiItem,
  KontakDaruratItem,
  SopBencanaItem
} from '@/lib/types';
import {
  SEED_PETA_KEBENCANAAN,
  SEED_RISIKO_BENCANA,
  SEED_TEMPAT_EVAKUASI,
  SEED_KONTAK_DARURAT,
  SEED_SOP_BENCANA
} from '@/app/admin/profil-desa/_components/admin-rawan-bencana-tab';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  AlertTriangle,
  Map,
  ShieldAlert,
  PhoneCall,
  LifeBuoy,
  BookOpen,
  Search,
  MapPin,
  Users,
  CheckCircle2,
  Phone,
  ExternalLink,
  Download,
  Maximize2,
  X,
  Table as TableIcon,
  LayoutGrid,
  ChevronRight,
  Info,
  Clock,
  ShieldCheck,
  HelpCircle,
  Flame,
  Droplets,
  Wind,
  Navigation,
  Layers,
  Compass
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { VillageMap } from '@/components/village-map';

export function RawanBencanaPublicTab() {
  const firestore = useFirestore();

  // 1. Data Config Peta & Narasi
  const configDocRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, 'rawanBencanaConfig', 'default');
  }, [firestore]);
  const { data: dbConfig, isLoading: isLoadingConfig } = useDoc<PetaKebencanaanConfig>(configDocRef);

  const config = useMemo(() => {
    let activeData = SEED_PETA_KEBENCANAAN;
    if (dbConfig && dbConfig.gambarPetaUrl) {
      activeData = dbConfig;
    }
    // Filter out old world map placeholder if present in Firestore or state
    if (activeData.gambarPetaUrl && activeData.gambarPetaUrl.includes('1524661135-423995f22d0b')) {
      return {
        ...activeData,
        gambarPetaUrl: '/images/peta-kebencanaan-sampeldes.jpg'
      };
    }
    return activeData;
  }, [dbConfig]);

  // 2. Data Risiko Bencana
  const risikoQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'risikoBencana'), orderBy('createdAt', 'desc'));
  }, [firestore]);
  const { data: dbRisiko, isLoading: isLoadingRisiko } = useCollection<RisikoBencanaItem>(risikoQuery);

  const risikoList = useMemo(() => {
    if (dbRisiko && dbRisiko.length > 0) {
      return dbRisiko;
    }
    return SEED_RISIKO_BENCANA;
  }, [dbRisiko]);

  // 3. Data Tempat Evakuasi (TES)
  const evakuasiQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'tempatEvakuasi'), orderBy('createdAt', 'desc'));
  }, [firestore]);
  const { data: dbEvakuasi, isLoading: isLoadingEvakuasi } = useCollection<TempatEvakuasiItem>(evakuasiQuery);

  const evakuasiList = useMemo(() => {
    if (dbEvakuasi && dbEvakuasi.length > 0) {
      return dbEvakuasi;
    }
    return SEED_TEMPAT_EVAKUASI;
  }, [dbEvakuasi]);

  // States
  const [activeSubTab, setActiveSubTab] = useState<'peta' | 'risiko' | 'evakuasi' | 'sop'>('peta');
  const [petaViewType, setPetaViewType] = useState<'tematik' | 'gis'>('tematik');
  const [searchRisiko, setSearchRisiko] = useState<string>('');
  const [viewModeRisiko, setViewModeRisiko] = useState<'cards' | 'table'>('table');
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [selectedTes, setSelectedTes] = useState<TempatEvakuasiItem | null>(null);

  // Filtered Risiko List
  const filteredRisiko = useMemo(() => {
    if (!searchRisiko.trim()) return risikoList;
    const q = searchRisiko.toLowerCase();
    return risikoList.filter(item =>
      item.jenisBencana.toLowerCase().includes(q) ||
      item.lokasiRawan.toLowerCase().includes(q) ||
      item.musimPemicu.toLowerCase().includes(q) ||
      item.rekomendasiMitigasi.toLowerCase().includes(q)
    );
  }, [risikoList, searchRisiko]);

  return (
    <div className="space-y-6 sm:space-y-10">
      {/* ── HERO BANNER: RAWAN BENCANA & EVAKUASI (NEUMORPHIC DARK) ── */}
      <section className="neu-card-elevated-dark rounded-[28px] border border-white/10 p-6 sm:p-8 md:p-10 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-72 h-72 bg-[#00a884]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full neu-inset border border-white/10 text-xs font-mono font-bold text-rose-400">
                <ShieldAlert className="h-3.5 w-3.5" />
                <span>PETA RESMI KEBENCANAAN &amp; EVAKUASI DESA SAMPELDES</span>
              </div>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-condensed font-bold uppercase tracking-tight text-white leading-none">
                Peta Rawan Bencana <span className="text-[#00a884]">&amp; Jalur Evakuasi</span>
              </h2>
              <p className="text-xs sm:text-sm text-stone-300 max-w-2xl leading-relaxed">
                Pusat data mitigasi bencana, pemetaan zona risiko per dusun, direktori Tempat Evakuasi Sementara (TES), serta standar operasional tanggap darurat untuk keselamatan seluruh warga Desa Sampeldes.
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <a href="#kontak-cepat" onClick={() => setActiveSubTab('sop')}>
                <Button
                  className="bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs uppercase tracking-wider rounded-xl gap-2 h-10 px-4 shadow-sm"
                >
                  <PhoneCall className="h-4 w-4" />
                  <span>Kontak Cepat Darurat</span>
                </Button>
              </a>
            </div>
          </div>

          {/* 4 HIGHLIGHT PILLS */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 pt-2">
            <div
              onClick={() => setActiveSubTab('peta')}
              className={cn(
                "p-3.5 sm:p-4 rounded-2xl transition-all cursor-pointer border",
                activeSubTab === 'peta'
                  ? "bg-slate-900 border-[#00a884] shadow-lg shadow-[#00a884]/10"
                  : "neu-inset border-white/5 hover:border-white/20"
              )}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] sm:text-xs font-bold text-stone-300 uppercase tracking-wider">Tab 1. Peta Kebencanaan</span>
                <Map className="h-4 w-4 text-[#00a884]" />
              </div>
              <div className="mt-2 text-xl sm:text-2xl font-condensed font-extrabold text-white">
                Rute Aman <span className="text-xs font-normal text-stone-400">Terpetakan</span>
              </div>
            </div>

            <div
              onClick={() => setActiveSubTab('risiko')}
              className={cn(
                "p-3.5 sm:p-4 rounded-2xl transition-all cursor-pointer border",
                activeSubTab === 'risiko'
                  ? "bg-slate-900 border-[#00a884] shadow-lg shadow-[#00a884]/10"
                  : "neu-inset border-white/5 hover:border-white/20"
              )}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] sm:text-xs font-bold text-stone-300 uppercase tracking-wider">Tab 2. Risiko per Wilayah</span>
                <AlertTriangle className="h-4 w-4 text-amber-400" />
              </div>
              <div className="mt-2 text-xl sm:text-2xl font-condensed font-extrabold text-white">
                {risikoList.length} <span className="text-xs font-normal text-stone-400">Titik Rawan</span>
              </div>
            </div>

            <div
              onClick={() => setActiveSubTab('evakuasi')}
              className={cn(
                "p-3.5 sm:p-4 rounded-2xl transition-all cursor-pointer border",
                activeSubTab === 'evakuasi'
                  ? "bg-slate-900 border-[#00a884] shadow-lg shadow-[#00a884]/10"
                  : "neu-inset border-white/5 hover:border-white/20"
              )}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] sm:text-xs font-bold text-stone-300 uppercase tracking-wider">Tab 3. Titik Kumpul (TES)</span>
                <LifeBuoy className="h-4 w-4 text-emerald-400" />
              </div>
              <div className="mt-2 text-xl sm:text-2xl font-condensed font-extrabold text-white">
                {evakuasiList.length} <span className="text-xs font-normal text-stone-400">Posko Siaga</span>
              </div>
            </div>

            <div
              onClick={() => setActiveSubTab('sop')}
              className={cn(
                "p-3.5 sm:p-4 rounded-2xl transition-all cursor-pointer border",
                activeSubTab === 'sop'
                  ? "bg-slate-900 border-[#00a884] shadow-lg shadow-[#00a884]/10"
                  : "neu-inset border-white/5 hover:border-white/20"
              )}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] sm:text-xs font-bold text-stone-300 uppercase tracking-wider">Tab 4. SOP &amp; Hotline</span>
                <PhoneCall className="h-4 w-4 text-rose-400" />
              </div>
              <div className="mt-2 text-xl sm:text-2xl font-condensed font-extrabold text-white">
                24 Jam <span className="text-xs font-normal text-stone-400">Hotline Darurat</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── SUB-TABS SELECTOR CONTROLS (NEUMORPHIC) ── */}
      <div className="neu-card-elevated rounded-2xl sm:rounded-[24px] border border-white/80 dark:border-white/10 p-2 sm:p-3 flex flex-wrap items-center gap-1.5 sm:gap-2">
        <Button
          type="button"
          variant="ghost"
          onClick={() => setActiveSubTab('peta')}
          className={cn(
            "rounded-xl text-xs font-condensed font-bold uppercase tracking-wider px-3.5 py-2 h-10 transition-all gap-2",
            activeSubTab === 'peta'
              ? "neu-btn-dark bg-[#070b10] text-[#00a884] shadow-md"
              : "neu-btn text-slate-700 dark:text-stone-300 hover:text-slate-950"
          )}
        >
          <Map className="h-4 w-4" />
          <span>Tab 1. Peta Interaktif &amp; Narasi</span>
        </Button>

        <Button
          type="button"
          variant="ghost"
          onClick={() => setActiveSubTab('risiko')}
          className={cn(
            "rounded-xl text-xs font-condensed font-bold uppercase tracking-wider px-3.5 py-2 h-10 transition-all gap-2",
            activeSubTab === 'risiko'
              ? "neu-btn-dark bg-[#070b10] text-[#00a884] shadow-md"
              : "neu-btn text-slate-700 dark:text-stone-300 hover:text-slate-950"
          )}
        >
          <AlertTriangle className="h-4 w-4" />
          <span>Tab 2. Risiko Bencana per Dusun</span>
        </Button>

        <Button
          type="button"
          variant="ghost"
          onClick={() => setActiveSubTab('evakuasi')}
          className={cn(
            "rounded-xl text-xs font-condensed font-bold uppercase tracking-wider px-3.5 py-2 h-10 transition-all gap-2",
            activeSubTab === 'evakuasi'
              ? "neu-btn-dark bg-[#070b10] text-[#00a884] shadow-md"
              : "neu-btn text-slate-700 dark:text-stone-300 hover:text-slate-950"
          )}
        >
          <LifeBuoy className="h-4 w-4" />
          <span>Tab 3. Titik Kumpul &amp; TES</span>
        </Button>

        <Button
          type="button"
          variant="ghost"
          onClick={() => setActiveSubTab('sop')}
          className={cn(
            "rounded-xl text-xs font-condensed font-bold uppercase tracking-wider px-3.5 py-2 h-10 transition-all gap-2",
            activeSubTab === 'sop'
              ? "neu-btn-dark bg-[#070b10] text-[#00a884] shadow-md"
              : "neu-btn text-slate-700 dark:text-stone-300 hover:text-slate-950"
          )}
        >
          <PhoneCall className="h-4 w-4" />
          <span>Tab 4. SOP &amp; Kontak Cepat</span>
        </Button>
      </div>

      {/* ─── TAB 1: PETA INTERAKTIF KEBENCANAAN & EVAKUASI ─── */}
      {activeSubTab === 'peta' && (
        <div className="space-y-6 sm:space-y-8">
          {/* Peta Display Container */}
          <div className="neu-card-elevated rounded-[28px] border border-white/80 dark:border-white/10 p-4 sm:p-6 md:p-8 space-y-5">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-stone-200/80 dark:border-white/10">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 rounded-lg neu-inset text-emerald-800 dark:text-[#00a884]">
                    <Navigation className="h-4 w-4" />
                  </span>
                  <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-[#00a884]">
                    Peta Evakuasi Spasial
                  </span>
                </div>
                <h3 className="text-lg sm:text-2xl font-condensed font-bold uppercase tracking-tight text-slate-900 dark:text-white">
                  {petaViewType === 'tematik' ? config.judulPeta : 'Peta Spasial Interaktif Desa Sampeldes & Gandrungmangu (GIS)'}
                </h3>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {/* Switcher Tab Mode */}
                <div className="flex items-center p-1 rounded-xl neu-inset border border-stone-300/40 dark:border-white/10 bg-stone-100/60 dark:bg-black/30">
                  <button
                    type="button"
                    onClick={() => setPetaViewType('tematik')}
                    className={cn(
                      'px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer',
                      petaViewType === 'tematik'
                        ? 'bg-emerald-800 text-white shadow-xs dark:bg-[#00a884] dark:text-slate-900'
                        : 'text-stone-600 dark:text-stone-300 hover:text-slate-900 dark:hover:text-white'
                    )}
                  >
                    <Layers className="h-3.5 w-3.5" />
                    <span>Peta Tematik</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPetaViewType('gis')}
                    className={cn(
                      'px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer',
                      petaViewType === 'gis'
                        ? 'bg-emerald-800 text-white shadow-xs dark:bg-[#00a884] dark:text-slate-900'
                        : 'text-stone-600 dark:text-stone-300 hover:text-slate-900 dark:hover:text-white'
                    )}
                  >
                    <Compass className="h-3.5 w-3.5" />
                    <span>GIS Interaktif</span>
                  </button>
                </div>

                {petaViewType === 'tematik' && config.tanggalUpdate && (
                  <span className="text-xs font-mono font-bold text-stone-500 neu-inset px-3 py-1.5 rounded-xl border border-stone-300/40 dark:border-white/10 hidden sm:inline-block">
                    Update: {config.tanggalUpdate}
                  </span>
                )}
                {petaViewType === 'tematik' && config.gambarPetaUrl && (
                  <a href={config.gambarPetaUrl} download="Peta-Kebencanaan-Desa-Sampeldes.jpg" target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" size="sm" className="neu-btn rounded-xl text-xs font-bold gap-1.5 text-slate-800 dark:text-white h-9">
                      <Download className="h-3.5 w-3.5" />
                      <span>Unduh Peta</span>
                    </Button>
                  </a>
                )}
                {petaViewType === 'gis' && (
                  <a
                    href="https://www.google.com/maps?q=-7.5136184,108.8401798"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button variant="outline" size="sm" className="neu-btn rounded-xl text-xs font-bold gap-1.5 text-slate-800 dark:text-white h-9">
                      <ExternalLink className="h-3.5 w-3.5" />
                      <span>Buka Google Maps</span>
                    </Button>
                  </a>
                )}
              </div>
            </div>

            {/* PETA VIEW CONTENT */}
            {petaViewType === 'tematik' ? (
              /* PETA IMAGE VIEWER (TEMATIK SAMPELDES) */
              <div
                className="relative aspect-[16/9] w-full rounded-2xl sm:rounded-[24px] overflow-hidden neu-inset border border-stone-300/40 dark:border-white/10 group cursor-pointer"
                onClick={() => config.gambarPetaUrl && setSelectedPhoto(config.gambarPetaUrl)}
              >
                <img
                  src={config.gambarPetaUrl || SEED_PETA_KEBENCANAAN.gambarPetaUrl}
                  alt="Peta Rawan Bencana Sampeldes"
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-80 group-hover:opacity-100 transition-opacity flex items-end justify-between p-4 sm:p-6">
                  <div className="text-white space-y-1">
                    <p className="text-xs sm:text-sm font-bold flex items-center gap-1.5 text-[#00a884]">
                      <MapPin className="h-4 w-4" />
                      <span>Desa Sampeldes, Kec. Gandrungmangu, Kab. Cilacap</span>
                    </p>
                    <p className="text-[10px] sm:text-xs text-stone-300">Klik gambar peta untuk melihat dalam resolusi penuh (Zoom)</p>
                  </div>
                  <button className="p-2.5 rounded-xl bg-black/60 text-white hover:bg-black/90 transition-colors border border-white/10">
                    <Maximize2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ) : (
              /* PETA GIS INTERAKTIF (LEAFLET GANDRUNGMANGU/SAMPELDES) */
              <div className="relative w-full h-[460px] sm:h-[540px] rounded-2xl sm:rounded-[24px] overflow-hidden neu-inset border border-stone-300/40 dark:border-white/10">
                <VillageMap lat={-7.5136184} lng={108.8401798} />
                <div className="absolute bottom-3 left-3 z-10 bg-slate-900/90 backdrop-blur-md text-white px-3.5 py-2 rounded-xl border border-white/10 text-xs shadow-lg flex items-center gap-2 pointer-events-none">
                  <MapPin className="h-3.5 w-3.5 text-emerald-400" />
                  <span>Koordinat Kantor Desa Sampeldes: <strong>-7.5136184, 108.8401798</strong></span>
                </div>
              </div>
            )}

            {/* LEGENDA PETA KEBENCANAAN */}
            <div className="space-y-3 pt-2">
              <h4 className="text-xs sm:text-sm font-condensed font-bold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
                <Layers className="h-4 w-4 text-emerald-800 dark:text-[#00a884]" />
                <span>Legenda Kategori &amp; Simbol Peta</span>
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {(config.legenda || SEED_PETA_KEBENCANAAN.legenda || []).map((leg, i) => (
                  <div key={i} className="p-3.5 rounded-xl neu-inset border border-stone-300/40 dark:border-white/10 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="w-3.5 h-3.5 rounded-full shrink-0 shadow-xs" style={{ backgroundColor: leg.warna }} />
                      <span className="font-condensed font-bold text-xs uppercase text-slate-900 dark:text-white">{leg.label}</span>
                    </div>
                    <p className="text-[11px] text-stone-600 dark:text-stone-300 leading-relaxed pl-5.5">{leg.deskripsi}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* NARASI REDAKSI KESIAPSIAGAAN */}
            {config.deskripsiNarasi && (
              <div className="neu-inset rounded-2xl p-4 sm:p-6 border border-stone-300/40 dark:border-white/10 space-y-2">
                <h4 className="text-xs sm:text-sm font-condensed font-bold uppercase tracking-wider text-emerald-800 dark:text-[#00a884] flex items-center gap-2">
                  <Info className="h-4 w-4" />
                  <span>Narasi Mitigasi &amp; Kesiapsiagaan Spasial</span>
                </h4>
                <p className="text-xs sm:text-sm text-stone-700 dark:text-stone-300 leading-relaxed whitespace-pre-line font-medium">
                  {config.deskripsiNarasi}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── TAB 2: TABEL PEMETAAN RISIKO BENCANA PER WILAYAH ─── */}
      {activeSubTab === 'risiko' && (
        <div className="space-y-6">
          {/* Header Controls */}
          <div className="neu-card-elevated rounded-2xl p-3.5 sm:p-4 border border-white/80 dark:border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1 sm:max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-stone-400" />
              <Input
                value={searchRisiko}
                onChange={e => setSearchRisiko(e.target.value)}
                placeholder="Cari jenis bencana, dusun, atau mitigasi..."
                className="neu-inset pl-9 h-10 rounded-xl text-xs bg-transparent border border-stone-300/40 dark:border-white/10 text-slate-900 dark:text-white placeholder:text-stone-400"
              />
              {searchRisiko && (
                <button
                  onClick={() => setSearchRisiko('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-slate-800"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto">
              <div className="flex items-center neu-inset p-1 rounded-xl border border-stone-300/40 dark:border-white/10">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => setViewModeRisiko('table')}
                  className={cn(
                    "h-8 w-8 rounded-lg",
                    viewModeRisiko === 'table' ? "bg-[#070b10] text-[#00a884]" : "text-stone-500"
                  )}
                  title="Tampilan Tabel"
                >
                  <TableIcon className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => setViewModeRisiko('cards')}
                  className={cn(
                    "h-8 w-8 rounded-lg",
                    viewModeRisiko === 'cards' ? "bg-[#070b10] text-[#00a884]" : "text-stone-500"
                  )}
                  title="Tampilan Kartu"
                >
                  <LayoutGrid className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* TABLE VIEW */}
          {viewModeRisiko === 'table' ? (
            <div className="neu-card-elevated rounded-[28px] border border-white/80 dark:border-white/10 p-2 sm:p-4 overflow-hidden">
              <div className="overflow-x-auto neu-inset rounded-2xl border border-stone-300/40 dark:border-white/10">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#070b10] text-[#00a884] font-condensed font-bold uppercase tracking-wider text-[11px] border-b border-white/10">
                    <tr>
                      <th className="py-4 px-4 w-12 text-center">No</th>
                      <th className="py-4 px-4">Jenis Ancaman Bencana</th>
                      <th className="py-4 px-4">Lokasi Rawan (Dusun / RT / RW)</th>
                      <th className="py-4 px-4">Musim / Pemicu Utama</th>
                      <th className="py-4 px-4">Dampak Potensial</th>
                      <th className="py-4 px-4">Rekomendasi Tindakan &amp; Mitigasi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-200/60 dark:divide-white/5 text-slate-800 dark:text-stone-200">
                    {filteredRisiko.map((item, idx) => (
                      <tr key={item.id || idx} className="hover:bg-black/5 dark:hover:bg-white/[0.02] transition-colors">
                        <td className="py-3.5 px-4 text-center font-mono font-bold text-stone-400">{idx + 1}</td>
                        <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                          <div className="flex items-center gap-1.5">
                            <span className={cn(
                              "w-2.5 h-2.5 rounded-full shrink-0",
                              item.tingkatRisiko === 'Tinggi' ? "bg-rose-500" : item.tingkatRisiko === 'Sedang' ? "bg-amber-500" : "bg-emerald-500"
                            )} />
                            <span>{item.jenisBencana}</span>
                          </div>
                          {item.tingkatRisiko && (
                            <span className={cn(
                              "inline-block px-1.5 py-0.5 rounded text-[9px] font-bold uppercase mt-1",
                              item.tingkatRisiko === 'Tinggi' ? "bg-rose-500/10 text-rose-700 dark:text-rose-300" : item.tingkatRisiko === 'Sedang' ? "bg-amber-500/10 text-amber-700 dark:text-amber-300" : "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                            )}>
                              Risiko {item.tingkatRisiko}
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-1.5">
                            <MapPin className="h-3.5 w-3.5 text-stone-400 shrink-0" />
                            <span>{item.lokasiRawan}</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-stone-600 dark:text-stone-300 leading-relaxed">{item.musimPemicu}</td>
                        <td className="py-3.5 px-4 text-stone-600 dark:text-stone-300 leading-relaxed">{item.dampakPotensial}</td>
                        <td className="py-3.5 px-4 text-emerald-800 dark:text-[#00a884] font-medium leading-relaxed">{item.rekomendasiMitigasi}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            /* CARDS VIEW */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              {filteredRisiko.map((item, idx) => (
                <div key={item.id || idx} className="neu-card-elevated rounded-2xl sm:rounded-[24px] border border-white/80 dark:border-white/10 p-5 space-y-3.5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        "p-1.5 rounded-lg neu-inset",
                        item.tingkatRisiko === 'Tinggi' ? "text-rose-600" : item.tingkatRisiko === 'Sedang' ? "text-amber-600" : "text-emerald-600"
                      )}>
                        <AlertTriangle className="h-4 w-4" />
                      </span>
                      <h4 className="text-base font-condensed font-bold uppercase text-slate-900 dark:text-white">{item.jenisBencana}</h4>
                    </div>
                    <Badge variant="outline" className={cn(
                      "text-[10px] font-bold uppercase",
                      item.tingkatRisiko === 'Tinggi' ? "border-rose-500/40 text-rose-700 dark:text-rose-400" : item.tingkatRisiko === 'Sedang' ? "border-amber-500/40 text-amber-700 dark:text-amber-400" : "border-emerald-500/40 text-emerald-700 dark:text-emerald-400"
                    )}>
                      Risiko {item.tingkatRisiko || 'Tinggi'}
                    </Badge>
                  </div>

                  <div className="neu-inset rounded-xl p-3.5 border border-stone-300/40 dark:border-white/10 space-y-2.5 text-xs">
                    <div>
                      <span className="text-stone-500 block text-[10px] font-bold uppercase tracking-wider">Lokasi Rawan:</span>
                      <span className="font-semibold text-slate-900 dark:text-white flex items-center gap-1 mt-0.5">
                        <MapPin className="h-3.5 w-3.5 text-emerald-700" />
                        {item.lokasiRawan}
                      </span>
                    </div>

                    <div>
                      <span className="text-stone-500 block text-[10px] font-bold uppercase tracking-wider">Musim / Pemicu Utama:</span>
                      <span className="text-stone-700 dark:text-stone-300">{item.musimPemicu}</span>
                    </div>

                    <div>
                      <span className="text-stone-500 block text-[10px] font-bold uppercase tracking-wider">Dampak Potensial:</span>
                      <span className="text-stone-700 dark:text-stone-300">{item.dampakPotensial}</span>
                    </div>

                    <div className="pt-2 border-t border-stone-200/60 dark:border-white/5">
                      <span className="text-emerald-800 dark:text-[#00a884] block text-[10px] font-bold uppercase tracking-wider">Rekomendasi Tindakan &amp; Mitigasi:</span>
                      <span className="font-medium text-slate-900 dark:text-stone-200">{item.rekomendasiMitigasi}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ─── TAB 3: DIREKTORI TITIK KUMPUL & TEMPAT EVAKUASI SEMENTARA (TES) ─── */}
      {activeSubTab === 'evakuasi' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
            {evakuasiList.map((item, idx) => (
              <div
                key={item.id || idx}
                className="neu-card-elevated rounded-2xl sm:rounded-[24px] border border-white/80 dark:border-white/10 hover:border-[#00a884] transition-all duration-300 overflow-hidden flex flex-col justify-between group"
              >
                {item.fotoUrl && (
                  <div className="relative aspect-[16/10] w-full overflow-hidden neu-inset cursor-pointer" onClick={() => setSelectedPhoto(item.fotoUrl || null)}>
                    <img
                      src={item.fotoUrl}
                      alt={item.kodeNama}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end justify-between p-3.5">
                      <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#00a884] px-2 py-0.5 rounded-md bg-black/60 border border-white/10">
                        {item.statusKesiapan || 'Siap Digunakan'}
                      </span>
                    </div>
                  </div>
                )}

                <div className="p-4 sm:p-5 space-y-3.5 flex-1 flex flex-col justify-between">
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-mono font-bold text-emerald-800 dark:text-[#00a884] uppercase tracking-wider">
                      TEMPAT EVAKUASI SEMENTARA
                    </span>
                    <h3 className="text-base sm:text-lg font-condensed font-bold uppercase tracking-tight text-slate-900 dark:text-white leading-tight">
                      {item.kodeNama}
                    </h3>
                    <div className="flex items-start gap-1.5 text-xs text-stone-600 dark:text-stone-300">
                      <MapPin className="h-3.5 w-3.5 text-emerald-700 shrink-0 mt-0.5" />
                      <span>{item.alamatDusun}</span>
                    </div>
                  </div>

                  <div className="neu-inset rounded-xl p-3 border border-stone-300/40 dark:border-white/10 space-y-2 text-xs">
                    <div className="flex justify-between items-center text-slate-800 dark:text-stone-200">
                      <span className="text-stone-500 dark:text-stone-400">Kapasitas:</span>
                      <span className="font-mono font-bold text-slate-900 dark:text-white">{item.kapasitas}</span>
                    </div>

                    <div className="pt-1 border-t border-stone-200/50 dark:border-white/5 space-y-1">
                      <span className="text-stone-500 dark:text-stone-400 block text-[10px] font-bold uppercase">Fasilitas Tersedia:</span>
                      <p className="text-[11px] text-stone-700 dark:text-stone-300 leading-relaxed font-medium">
                        {item.fasilitas}
                      </p>
                    </div>

                    <div className="pt-1 border-t border-stone-200/50 dark:border-white/5 space-y-1">
                      <span className="text-emerald-800 dark:text-[#00a884] block text-[10px] font-bold uppercase">Penanggung Jawab (PIC):</span>
                      <p className="text-xs font-bold text-slate-900 dark:text-white">
                        {item.penanggungJawab}
                      </p>
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedTes(item)}
                    className="w-full neu-btn rounded-xl text-xs font-condensed font-bold uppercase tracking-wider text-slate-800 dark:text-white h-9 gap-1.5"
                  >
                    <LifeBuoy className="h-3.5 w-3.5 text-emerald-700" />
                    <span>Lihat Detail &amp; Fasilitas</span>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── TAB 4: PANDUAN SOP TANGGAP DARURAT & KONTAK CEPAT ─── */}
      {activeSubTab === 'sop' && (
        <div id="kontak-cepat" className="space-y-8">
          {/* KONTAK DARURAT HOTLINE SPEED DIAL */}
          <div className="neu-card-elevated-dark rounded-[28px] border border-white/10 p-6 sm:p-8 text-white space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 rounded-lg bg-rose-500/20 text-rose-400">
                    <PhoneCall className="h-4 w-4" />
                  </span>
                  <span className="text-xs font-mono font-bold uppercase tracking-wider text-rose-400">
                    HOTLINE TANGGAP DARURAT 24 JAM
                  </span>
                </div>
                <h3 className="text-xl sm:text-2xl font-condensed font-bold uppercase text-white">
                  Kontak Cepat Kebencanaan Desa Sampeldes
                </h3>
              </div>
              <p className="text-xs text-stone-400 max-w-md">
                Klik tombol nomor telepon untuk melakukan panggilan darurat langsung ke petugas siaga desa dan instansi terkait.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              {SEED_KONTAK_DARURAT.map((kontak, i) => (
                <div
                  key={i}
                  className={cn(
                    "p-4 rounded-2xl border transition-all flex flex-col justify-between gap-3",
                    kontak.isHotlineUtama
                      ? "bg-slate-900/90 border-[#00a884]/40 shadow-md shadow-[#00a884]/5"
                      : "neu-inset border-white/5"
                  )}
                >
                  <div className="space-y-1">
                    {kontak.isHotlineUtama && (
                      <span className="inline-block px-2 py-0.5 rounded-md bg-[#00a884]/20 text-[#00a884] text-[9px] font-bold uppercase tracking-wider mb-1">
                        Hotline Utama
                      </span>
                    )}
                    <h4 className="font-bold text-xs sm:text-sm text-white leading-snug line-clamp-2">
                      {kontak.namaInstansi}
                    </h4>
                    <p className="text-[10px] text-stone-400">{kontak.peran}</p>
                    <span className="text-[9px] text-stone-500 block font-mono">{kontak.layananJam}</span>
                  </div>

                  <a
                    href={`tel:${kontak.nomorTelepon.replace(/[^0-9+]/g, '')}`}
                    className="block w-full"
                  >
                    <Button
                      size="sm"
                      className="w-full bg-[#00a884] hover:bg-[#c2cf42] text-slate-950 font-bold text-xs rounded-xl h-9 gap-1.5 shadow-xs"
                    >
                      <Phone className="h-3.5 w-3.5" />
                      <span>{kontak.nomorTelepon}</span>
                    </Button>
                  </a>
                </div>
              ))}
            </div>
          </div>

          {/* SOP 3 TAHAP: PRA, SAAT, PASCA BENCANA */}
          <div className="neu-card-elevated rounded-[28px] border border-white/80 dark:border-white/10 p-6 sm:p-8 space-y-6">
            <div className="space-y-1.5 pb-3 border-b border-stone-200/80 dark:border-white/10">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg neu-inset text-emerald-800 dark:text-[#00a884]">
                  <BookOpen className="h-4 w-4" />
                </span>
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-[#00a884]">
                  STANDAR OPERASIONAL PROSEDUR (SOP)
                </span>
              </div>
              <h3 className="text-xl sm:text-2xl font-condensed font-bold uppercase text-slate-900 dark:text-white">
                Protokol Keselamatan Warga Dalam 3 Fase
              </h3>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {SEED_SOP_BENCANA.map((sop, i) => (
                <div key={i} className="neu-inset rounded-2xl p-5 border border-stone-300/40 dark:border-white/10 flex flex-col justify-between space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        "w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs text-white",
                        sop.fase === 'pra' ? "bg-amber-500" : sop.fase === 'saat' ? "bg-rose-500" : "bg-emerald-500"
                      )}>
                        {i + 1}
                      </span>
                      <h4 className="font-condensed font-bold text-sm uppercase text-slate-900 dark:text-white">
                        {sop.judul}
                      </h4>
                    </div>

                    <p className="text-xs text-stone-600 dark:text-stone-300 font-medium leading-relaxed">
                      {sop.deskripsi}
                    </p>

                    <div className="space-y-2 pt-2 border-t border-stone-200/60 dark:border-white/5">
                      {sop.langkah.map((l, j) => (
                        <div key={j} className="flex items-start gap-2 text-xs text-slate-800 dark:text-stone-200 leading-relaxed">
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-700 shrink-0 mt-0.5" />
                          <span>{l}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL LIGHTBOX FOTO RESOLUSI PENUH ─── */}
      <Dialog open={!!selectedPhoto} onOpenChange={(open) => !open && setSelectedPhoto(null)}>
        <DialogContent className="max-w-4xl p-2 bg-black/95 border-white/20 text-white rounded-2xl overflow-hidden">
          <DialogHeader className="sr-only">
            <DialogTitle>Pratinjau Peta Kebencanaan &amp; Jalur Evakuasi</DialogTitle>
            <DialogDescription>Tampilan visual resolusi tinggi peta tematik kerawanan bencana Desa Sampeldes</DialogDescription>
          </DialogHeader>
          {selectedPhoto && (
            <div className="relative w-full max-h-[85vh] flex items-center justify-center">
              <img src={selectedPhoto} alt="Visual Resolusi Tinggi" className="max-w-full max-h-[80vh] object-contain rounded-xl" />
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ─── MODAL DETAIL TEMPAT EVAKUASI (TES) ─── */}
      <Dialog open={!!selectedTes} onOpenChange={(open) => !open && setSelectedTes(null)}>
        <DialogContent className="max-w-xl neu-card-elevated-dark border border-white/10 text-white p-5 sm:p-7 rounded-[28px] overflow-hidden">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-[#00a884]/20 text-[#00a884] rounded-lg">
                <LifeBuoy className="h-4 w-4" />
              </span>
              <span className="text-[10px] font-mono font-bold text-[#00a884] uppercase tracking-wider">
                {selectedTes?.statusKesiapan || 'TEMPAT EVAKUASI SEMENTARA'}
              </span>
            </div>
            <DialogTitle className="text-xl font-condensed font-bold uppercase text-white mt-1 leading-tight">
              {selectedTes?.kodeNama || 'Detail Tempat Evakuasi Sementara (TES)'}
            </DialogTitle>
            <DialogDescription className="text-xs text-stone-400">
              {selectedTes?.alamatDusun || 'Fasilitas dan penanggung jawab titik kumpul evakuasi'}
            </DialogDescription>
          </DialogHeader>

          {selectedTes && (
            <div className="space-y-4 pt-2">
              {selectedTes.fotoUrl && (
                <div className="relative aspect-[16/9] w-full rounded-2xl overflow-hidden neu-inset border border-white/10">
                  <img src={selectedTes.fotoUrl} alt="Foto TES" className="w-full h-full object-cover" />
                </div>
              )}

              <div className="neu-inset rounded-2xl p-4 border border-white/10 space-y-2.5 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-stone-400">Kapasitas Daya Tampung:</span>
                  <span className="font-mono font-bold text-[#00a884] text-sm">{selectedTes.kapasitas}</span>
                </div>

                <div className="pt-2 border-t border-white/5 space-y-1">
                  <span className="text-stone-400 block font-bold uppercase text-[10px]">Fasilitas Lengkap:</span>
                  <p className="text-stone-200 leading-relaxed">{selectedTes.fasilitas}</p>
                </div>

                <div className="pt-2 border-t border-white/5 space-y-1">
                  <span className="text-[#00a884] block font-bold uppercase text-[10px]">Penanggung Jawab / Kontak:</span>
                  <p className="text-white font-bold">{selectedTes.penanggungJawab}</p>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <Button
                  onClick={() => setSelectedTes(null)}
                  className="bg-[#00a884] hover:bg-[#c2cf42] text-slate-950 font-bold text-xs uppercase tracking-wider rounded-xl h-10 px-6"
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

