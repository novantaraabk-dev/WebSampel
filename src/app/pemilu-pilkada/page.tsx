'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { Header } from '@/components/landing/Header';
import { Footer } from '@/components/landing/Footer';
import { BackgroundPattern } from '@/components/landing/BackgroundPattern';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import {
  PemiluPilkadaConfig,
  TpsWilayahItem,
  RekapitulasiSuaraItem,
  PenyelenggaraItem,
  PilkadaDesaItem,
  PilgubTpsItem
} from '@/lib/types';
import {
  ALL_SEED_ELECTION_DATA,
  SEED_PEMILU_2024,
  SEED_PILKADA_2024,
  SEED_PILKADES_2025,
  HASIL_PILBUP_CILACAP_KECAMATAN,
  TOTAL_PILBUP_KECAMATAN,
  HASIL_PILBUP_SAMPELDES_PASLON,
  HASIL_PILGUB_TPS_SAMPELDES,
  HASIL_PILGUB_SAMPELDES_PASLON
} from '@/lib/pemilu-pilkada-data';
import {
  Vote,
  Users,
  CheckCircle2,
  MapPin,
  BarChart3,
  Search,
  Award,
  ShieldCheck,
  Calendar,
  Layers,
  Table as TableIcon,
  LayoutGrid,
  HeartHandshake,
  UserCheck,
  ArrowRight,
  TrendingUp,
  Percent,
  Landmark,
  PieChart as PieIcon,
  Phone,
  FileCheck2,
  Info,
  ChevronDown,
  ChevronUp,
  FileText,
  Sparkles,
  CheckSquare
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  PieChart,
  Pie,
  Legend
} from 'recharts';
import { cn } from '@/lib/utils';

export default function PemiluPilkadaPage() {
  const firestore = useFirestore();

  // State Pilihan Kategori & Tahun
  const [activeTab, setActiveTab] = useState<'pemilu' | 'pilkada' | 'pilkades'>('pemilu');
  const [selectedYear, setSelectedYear] = useState<number>(2024);

  // Filter & View State untuk Tabel TPS
  const [searchTps, setSearchTps] = useState<string>('');
  const [tpsViewMode, setTpsViewMode] = useState<'table' | 'cards'>('table');

  // Sub-tab khusus Pemilu 2024 (5 kategori resmi)
  const [pemiluSubTab, setPemiluSubTab] = useState<'pilpres' | 'dpr_ri' | 'dprd_kab' | 'dpd' | 'audit_tps'>('pilpres');
  const [pilpresViewMode, setPilpresViewMode] = useState<'cards' | 'table'>('cards');
  const [dpdViewMode, setDpdViewMode] = useState<'ranking' | 'table'>('ranking');
  const [searchDprRi, setSearchDprRi] = useState<string>('');
  const [searchDprdKab, setSearchDprdKab] = useState<string>('');
  const [expandedDprParties, setExpandedDprParties] = useState<Record<number, boolean>>({});
  const [expandedDprdParties, setExpandedDprdParties] = useState<Record<number, boolean>>({});

  // Sub-tab khusus Pilkada 2024 (Bupati Cilacap vs Gubernur Jawa Tengah)
  const [pilkadaSubTab, setPilkadaSubTab] = useState<'pilbup' | 'pilgub'>('pilbup');
  const [pilbupViewMode, setPilbupViewMode] = useState<'cards' | 'table'>('table');
  const [pilgubViewMode, setPilgubViewMode] = useState<'cards' | 'table'>('table');

  // Baca query parameter URL secara aman di client side (?tab=pilkada&sub=pilgub)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get('tab') || params.get('kategori');
      if (tabParam === 'pilkada' || tabParam === 'pilkades' || tabParam === 'pemilu') {
        setActiveTab(tabParam);
        if (tabParam === 'pilkades') setSelectedYear(2025);
        else setSelectedYear(2024);
      }
      const sub = params.get('sub');
      if (sub === 'pilbup' || sub === 'pilgub') {
        setPilkadaSubTab(sub);
      }
    }
  }, []);

  // Dokumen Firestore sesuai `${kategori}_${tahun}`
  const docId = `${activeTab}_${selectedYear}`;
  const electionDocRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, 'pemiluPilkada', docId);
  }, [firestore, docId]);

  const { data: firestoreData, isLoading } = useDoc<PemiluPilkadaConfig>(electionDocRef);

  // Fallback ke seed data jika dokumen Firestore belum diinput oleh admin
  const currentData: PemiluPilkadaConfig = useMemo(() => {
    const baseData = ALL_SEED_ELECTION_DATA[docId] || (
      activeTab === 'pemilu' ? { ...SEED_PEMILU_2024, tahun: selectedYear } :
        activeTab === 'pilkada' ? { ...SEED_PILKADA_2024, tahun: selectedYear } :
          { ...SEED_PILKADES_2025, tahun: selectedYear }
    );

    if (firestoreData && firestoreData.totalDpt) {
      const hasOldDummyPps = firestoreData.penyelenggaraList?.some(
        p => p.nama?.includes('Ahmad Fauzi') || p.nama?.includes('Slamet Riyadi') || p.nama?.includes('Siti Nurhayati')
      );
      const activePpsList = (hasOldDummyPps || !firestoreData.penyelenggaraList || firestoreData.penyelenggaraList.length === 0)
        ? baseData.penyelenggaraList
        : firestoreData.penyelenggaraList;

      // Deteksi jika dokumen Pilkada di Firestore masih menyimpan data dummy lama (DPT 6048 atau kandidat Bambang)
      const isOldPilkadaDummy = activeTab === 'pilkada' && (
        firestoreData.totalDpt === 6048 ||
        firestoreData.rekapitulasiList?.some(r => r.namaKandidat?.includes('Bambang') || r.namaKandidat?.includes('Sudirman')) ||
        !firestoreData.pilkadaBupatiDesaList ||
        firestoreData.pilkadaBupatiDesaList.length === 0
      );

      return {
        ...baseData,
        ...firestoreData,
        totalDpt: isOldPilkadaDummy ? baseData.totalDpt : (firestoreData.totalDpt || baseData.totalDpt),
        totalSuaraMasuk: isOldPilkadaDummy ? baseData.totalSuaraMasuk : (firestoreData.totalSuaraMasuk || baseData.totalSuaraMasuk),
        totalSuaraSah: isOldPilkadaDummy ? baseData.totalSuaraSah : (firestoreData.totalSuaraSah || baseData.totalSuaraSah),
        totalSuaraTidakSah: isOldPilkadaDummy ? baseData.totalSuaraTidakSah : (firestoreData.totalSuaraTidakSah || baseData.totalSuaraTidakSah),
        tingkatPartisipasi: isOldPilkadaDummy ? baseData.tingkatPartisipasi : (firestoreData.tingkatPartisipasi || baseData.tingkatPartisipasi),
        penyelenggaraList: activePpsList,
        // Fallback array data resmi terbaru jika belum tersimpan di Firestore
        dprRiList: (firestoreData.dprRiList && firestoreData.dprRiList.length > 0) ? firestoreData.dprRiList : baseData.dprRiList,
        dprdKabList: (firestoreData.dprdKabList && firestoreData.dprdKabList.length > 0) ? firestoreData.dprdKabList : baseData.dprdKabList,
        dpdList: (firestoreData.dpdList && firestoreData.dpdList.length > 0) ? firestoreData.dpdList : baseData.dpdList,
        pilpresTpsList: (firestoreData.pilpresTpsList && firestoreData.pilpresTpsList.length > 0) ? firestoreData.pilpresTpsList : baseData.pilpresTpsList,
        tpsRekapDetail: (firestoreData.tpsRekapDetail && firestoreData.tpsRekapDetail.length > 0) ? firestoreData.tpsRekapDetail : baseData.tpsRekapDetail,
        tpsList: (firestoreData.tpsList && (activeTab === 'pilkada' ? (isOldPilkadaDummy ? baseData.tpsList : firestoreData.tpsList) : firestoreData.tpsList.length >= 24)) ? (isOldPilkadaDummy ? baseData.tpsList : firestoreData.tpsList) : baseData.tpsList,
        pilkadaBupatiDesaList: (firestoreData.pilkadaBupatiDesaList && firestoreData.pilkadaBupatiDesaList.length > 0) ? firestoreData.pilkadaBupatiDesaList : baseData.pilkadaBupatiDesaList,
        pilgubTpsList: (firestoreData.pilgubTpsList && firestoreData.pilgubTpsList.length > 0) ? firestoreData.pilgubTpsList : baseData.pilgubTpsList,
        rekapitulasiPilgubList: (firestoreData.rekapitulasiPilgubList && firestoreData.rekapitulasiPilgubList.length > 0) ? firestoreData.rekapitulasiPilgubList : baseData.rekapitulasiPilgubList,
        rekapitulasiList: isOldPilkadaDummy ? baseData.rekapitulasiList : (firestoreData.rekapitulasiList || baseData.rekapitulasiList),
      };
    }
    return baseData;
  }, [firestoreData, docId, activeTab, selectedYear]);

  // Daftar Tahun yang Tersedia
  const availableYears = [2025, 2024, 2019, 2018];

  // Handler pergantian tab otomatis menyesuaikan tahun rekomendasi
  const handleTabChange = (tab: 'pemilu' | 'pilkada' | 'pilkades') => {
    setActiveTab(tab);
    if (tab === 'pilkades') {
      setSelectedYear(2025);
    } else {
      setSelectedYear(2024);
    }
  };

  // Filter Sebaran TPS
  const filteredTps = useMemo(() => {
    const list = currentData.tpsList || [];
    if (!searchTps.trim()) return list;
    const q = searchTps.toLowerCase();
    return list.filter(
      t =>
        t.nomorTps.toLowerCase().includes(q) ||
        t.namaTempat.toLowerCase().includes(q) ||
        t.cakupanWilayah.toLowerCase().includes(q)
    );
  }, [currentData.tpsList, searchTps]);

  // Filter DPR RI
  const filteredDprRi = useMemo(() => {
    const list = currentData.dprRiList || [];
    if (!searchDprRi.trim()) return list;
    const q = searchDprRi.toLowerCase();
    return list.filter(p =>
      p.namaParpol.toLowerCase().includes(q) ||
      p.calegList.some(c => c.namaCaleg.toLowerCase().includes(q))
    );
  }, [currentData.dprRiList, searchDprRi]);

  // Filter DPRD Kabupaten
  const filteredDprdKab = useMemo(() => {
    const list = currentData.dprdKabList || [];
    if (!searchDprdKab.trim()) return list;
    const q = searchDprdKab.toLowerCase();
    return list.filter(p =>
      p.namaParpol.toLowerCase().includes(q) ||
      p.calegList.some(c => c.namaCaleg.toLowerCase().includes(q))
    );
  }, [currentData.dprdKabList, searchDprdKab]);

  // Toggle Accordion Parpol
  const toggleDprParty = (no: number) => {
    setExpandedDprParties(prev => ({ ...prev, [no]: !prev[no] }));
  };
  const toggleAllDpr = (expand: boolean) => {
    if (!expand) {
      setExpandedDprParties({});
    } else {
      const all: Record<number, boolean> = {};
      (currentData.dprRiList || []).forEach(p => { all[p.nomorParpol] = true; });
      setExpandedDprParties(all);
    }
  };

  const toggleDprdParty = (no: number) => {
    setExpandedDprdParties(prev => ({ ...prev, [no]: !prev[no] }));
  };
  const toggleAllDprd = (expand: boolean) => {
    if (!expand) {
      setExpandedDprdParties({});
    } else {
      const all: Record<number, boolean> = {};
      (currentData.dprdKabList || []).forEach(p => { all[p.nomorParpol] = true; });
      setExpandedDprdParties(all);
    }
  };

  // Kalkulasi total agregat TPS
  const tpsTotals = useMemo(() => {
    const list = currentData.tpsList || [];
    return list.reduce(
      (acc, curr) => ({
        laki: acc.laki + (curr.dptLaki || 0),
        perempuan: acc.perempuan + (curr.dptPerempuan || 0),
        total: acc.total + (curr.totalDpt || 0),
      }),
      { laki: 0, perempuan: 0, total: 0 }
    );
  }, [currentData.tpsList]);

  // Format Helper Angka
  const formatNum = (val: number | undefined) => {
    return new Intl.NumberFormat('id-ID').format(val || 0);
  };

  return (
    <div className="relative flex flex-col min-h-screen bg-[#F8FAFC] dark:bg-[#060b11] text-slate-900 dark:text-slate-100 font-sans overflow-x-hidden w-full">
      <BackgroundPattern />
      <Header />

      <main className="relative flex-1 pt-24 sm:pt-28 pb-16 sm:pb-24">
        <div className="container mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-6 max-w-7xl space-y-8">

          {/* ─── HERO HEADER NEUMORPHIC ─── */}
          <div className="p-6 sm:p-8 md:p-10 rounded-3xl text-white relative overflow-hidden border border-teal-500/20 bg-gradient-to-br from-[#081d27] via-[#0b2836] to-[#041117] shadow-2xl">
            <div className="absolute top-0 right-0 w-96 h-96 bg-teal-500/15 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
            <div className="relative z-10 space-y-4 max-w-3xl">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-teal-500/15 border border-teal-500/30 text-teal-300 text-xs font-mono font-bold tracking-wider uppercase">
                <Vote className="h-4 w-4 text-teal-400" />
                <span>Portal Keterbukaan Demokrasi Desa Sampeldes</span>
              </div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-condensed font-black uppercase tracking-tight text-white leading-none">
                Data Pemilu, Pilkada &amp; Pilkades
              </h1>
              <p className="text-xs sm:text-sm md:text-base text-slate-300 leading-relaxed">
                Transparansi penetapan Daftar Pemilih Tetap (DPT), sebaran lokasi Tempat Pemungutan Suara (TPS), visualisasi demografi pemilih, rekapitulasi hasil penghitungan suara, dan daftar nama penyelenggara tingkat desa.
              </p>
            </div>

            {/* Filter Bar: Tab Kategori + Pilih Tahun */}
            <div className="relative z-10 pt-6 mt-6 border-t border-white/10 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
              {/* Tab Kategori Pemilihan */}
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  onClick={() => handleTabChange('pemilu')}
                  className={cn(
                    'h-10 px-4 rounded-xl font-condensed font-bold uppercase text-xs tracking-wider transition-all gap-2',
                    activeTab === 'pemilu'
                      ? 'bg-teal-500 text-slate-950 hover:bg-teal-400 shadow-lg'
                      : 'bg-white/10 hover:bg-white/15 text-white border border-white/10'
                  )}
                >
                  <Vote className="h-4 w-4" />
                  <span>Tab 1. Pemilu</span>
                </Button>
                <Button
                  onClick={() => handleTabChange('pilkada')}
                  className={cn(
                    'h-10 px-4 rounded-xl font-condensed font-bold uppercase text-xs tracking-wider transition-all gap-2',
                    activeTab === 'pilkada'
                      ? 'bg-teal-500 text-slate-950 hover:bg-teal-400 shadow-lg'
                      : 'bg-white/10 hover:bg-white/15 text-white border border-white/10'
                  )}
                >
                  <Landmark className="h-4 w-4" />
                  <span>Tab 2. Pilkada</span>
                </Button>
                <Button
                  onClick={() => handleTabChange('pilkades')}
                  className={cn(
                    'h-10 px-4 rounded-xl font-condensed font-bold uppercase text-xs tracking-wider transition-all gap-2',
                    activeTab === 'pilkades'
                      ? 'bg-teal-500 text-slate-950 hover:bg-teal-400 shadow-lg'
                      : 'bg-white/10 hover:bg-white/15 text-white border border-white/10'
                  )}
                >
                  <Users className="h-4 w-4" />
                  <span>Tab 3. Pilkades</span>
                </Button>
              </div>

              {/* Selector Tahun */}
              <div className="flex items-center gap-3">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5 shrink-0">
                  <Calendar className="h-3.5 w-3.5 text-teal-400" />
                  <span>Tahun Penyelenggaraan:</span>
                </span>
                <Select value={String(selectedYear)} onValueChange={(val) => setSelectedYear(Number(val))}>
                  <SelectTrigger className="w-36 h-10 bg-slate-900/90 border border-white/20 text-white rounded-xl text-xs font-bold font-mono focus:ring-2 focus:ring-teal-400">
                    <SelectValue placeholder="Pilih Tahun" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border border-white/10 text-white rounded-xl">
                    {availableYears.map(year => (
                      <SelectItem key={year} value={String(year)} className="text-xs font-mono font-bold">
                        Tahun {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Banner Nama Kegiatan & Deskripsi */}
          <div className="neu-card-elevated p-4 sm:p-5 rounded-2xl border border-white/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-emerald-50 text-emerald-800 border-emerald-300 font-bold uppercase text-[10px]">
                  {activeTab.toUpperCase()}
                </Badge>
                <span className="text-xs text-stone-500 font-mono">Pelaksanaan: {currentData.tanggalPelaksanaan || `${selectedYear}`}</span>
              </div>
              <h2 className="text-lg sm:text-xl font-condensed font-black uppercase tracking-tight text-slate-900">
                {currentData.namaKegiatan}
              </h2>
            </div>
            <p className="text-xs text-stone-600 sm:max-w-md leading-relaxed sm:text-right">
              {currentData.deskripsi}
            </p>
          </div>

          {/* ─── BAGIAN 1: KARTU RINGKASAN STATISTIK PEMILIH ─── */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-emerald-800 text-white">
                <BarChart3 className="h-4 w-4" />
              </span>
              <h3 className="text-base sm:text-lg font-condensed font-black uppercase tracking-wider text-slate-900">
                1. Ringkasan Statistik Pemilih
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Card 1: Total DPT */}
              <div className="neu-card-elevated p-5 rounded-2xl border border-white/80 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-stone-500">Total DPT Desa</span>
                  <span className="p-2 bg-emerald-50 text-emerald-800 rounded-xl">
                    <Users className="h-4 w-4" />
                  </span>
                </div>
                <div className="space-y-0.5">
                  <div className="text-2xl sm:text-3xl font-condensed font-black text-slate-900">
                    {formatNum(currentData.totalDpt)} <span className="text-sm font-sans font-bold text-stone-500">Jiwa</span>
                  </div>
                  <p className="text-[11px] text-stone-500">Daftar Pemilih Tetap Terverifikasi</p>
                </div>
              </div>

              {/* Card 2: Rasio L vs P */}
              <div className="neu-card-elevated p-5 rounded-2xl border border-white/80 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-stone-500">Rasio Laki vs Perempuan</span>
                  <span className="p-2 bg-sky-50 text-sky-800 rounded-xl">
                    <UserCheck className="h-4 w-4" />
                  </span>
                </div>
                <div className="space-y-1.5">
                  <div className="flex justify-between items-baseline text-xs font-mono font-bold">
                    <span className="text-sky-900">L: {formatNum(currentData.dptLaki)}</span>
                    <span className="text-rose-900">P: {formatNum(currentData.dptPerempuan)}</span>
                  </div>
                  {/* Progress Bar L vs P */}
                  <div className="w-full h-2 rounded-full bg-rose-200 overflow-hidden flex">
                    <div
                      className="h-full bg-sky-700"
                      style={{
                        width: `${currentData.totalDpt ? ((currentData.dptLaki / currentData.totalDpt) * 100).toFixed(1) : 50}%`
                      }}
                      title={`Laki-laki: ${currentData.totalDpt ? ((currentData.dptLaki / currentData.totalDpt) * 100).toFixed(1) : 50}%`}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-stone-500">
                    <span>{currentData.totalDpt ? ((currentData.dptLaki / currentData.totalDpt) * 100).toFixed(1) : 0}% L</span>
                    <span>{currentData.totalDpt ? ((currentData.dptPerempuan / currentData.totalDpt) * 100).toFixed(1) : 0}% P</span>
                  </div>
                </div>
              </div>

              {/* Card 3: Jumlah Lokasi TPS */}
              <div className="neu-card-elevated p-5 rounded-2xl border border-white/80 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-stone-500">Jumlah Lokasi TPS</span>
                  <span className="p-2 bg-amber-50 text-amber-800 rounded-xl">
                    <MapPin className="h-4 w-4" />
                  </span>
                </div>
                <div className="space-y-0.5">
                  <div className="text-2xl sm:text-3xl font-condensed font-black text-slate-900">
                    {currentData.jumlahTps} <span className="text-sm font-sans font-bold text-stone-500">Titik TPS</span>
                  </div>
                  <p className="text-[11px] text-stone-500">
                    Rata-rata ±{currentData.jumlahTps ? Math.round(currentData.totalDpt / currentData.jumlahTps) : 0} pemilih / TPS
                  </p>
                </div>
              </div>

              {/* Card 4: Tingkat Partisipasi */}
              <div className="neu-card-elevated p-5 rounded-2xl border border-white/80 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-stone-500">Partisipasi Pemilih</span>
                  <span className="p-2 bg-emerald-50 text-emerald-800 rounded-xl">
                    <TrendingUp className="h-4 w-4" />
                  </span>
                </div>
                <div className="space-y-0.5">
                  <div className="text-2xl sm:text-3xl font-condensed font-black text-emerald-900">
                    {currentData.tingkatPartisipasi}%
                  </div>
                  <p className="text-[11px] text-stone-500">
                    {currentData.totalSuaraMasuk ? `${formatNum(currentData.totalSuaraMasuk)} suara hadir menggunakan hak pilih` : 'Tingkat kehadiran tinggi'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* ─── BAGIAN 2: VISUALISASI DEMOGRAFI PEMILIH (GRAFIK INTERAKTIF) ─── */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-emerald-800 text-white">
                <PieIcon className="h-4 w-4" />
              </span>
              <h3 className="text-base sm:text-lg font-condensed font-black uppercase tracking-wider text-slate-900">
                2. Visualisasi Demografi Pemilih (Interaktif)
              </h3>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              {/* Grafik Usia / Generasi Pemilih */}
              <div className="lg:col-span-7 neu-card-elevated p-5 sm:p-6 rounded-2xl border border-white/80 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold uppercase tracking-wider text-slate-900">
                      Klasifikasi Usia &amp; Generasi Pemilih
                    </h4>
                    <p className="text-xs text-stone-500">Proporsi pemilih berdasarkan rentang generasi umur</p>
                  </div>
                  <Badge variant="outline" className="font-mono text-xs font-bold text-emerald-800 bg-emerald-50">
                    4 Kelompok Usia
                  </Badge>
                </div>

                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={currentData.demografiGenerasi || []} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                      <XAxis dataKey="nama" tick={{ fontSize: 11, fill: '#64748b' }} interval={0} />
                      <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#0f172a',
                          borderColor: 'rgba(255,255,255,0.1)',
                          borderRadius: '12px',
                          color: '#fff',
                          fontSize: '12px'
                        }}
                        formatter={(value: any, name: any, props: any) => [
                          `${formatNum(value)} Jiwa (${props.payload.persen}%)`,
                          `Rentang: ${props.payload.rentangUsia}`
                        ]}
                      />
                      <Bar dataKey="jumlah" radius={[8, 8, 0, 0]}>
                        {(currentData.demografiGenerasi || []).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color || '#059669'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Legend Chips Generasi */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-stone-300/60">
                  {(currentData.demografiGenerasi || []).map((gen, idx) => (
                    <div key={idx} className="p-2 rounded-xl neu-inset text-center space-y-0.5">
                      <div className="flex items-center justify-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: gen.color || '#059669' }} />
                        <span className="text-[11px] font-bold text-slate-800">{gen.nama}</span>
                      </div>
                      <p className="text-[10px] text-stone-500">{gen.rentangUsia}</p>
                      <p className="text-xs font-mono font-bold text-slate-900">{formatNum(gen.jumlah)} ({gen.persen}%)</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Data Pemilih Disabilitas */}
              <div className="lg:col-span-5 neu-card-elevated p-5 sm:p-6 rounded-2xl border border-white/80 space-y-4 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold uppercase tracking-wider text-slate-900">
                        Pemilih Disabilitas &amp; Kebutuhan Khusus
                      </h4>
                      <p className="text-xs text-stone-500">Pendataan hak pilih inklusif ramah disabilitas</p>
                    </div>
                    <Badge variant="outline" className="font-mono text-xs font-bold text-sky-800 bg-sky-50">
                      Inklusif
                    </Badge>
                  </div>

                  <div className="space-y-3 mt-4">
                    {(currentData.demografiDisabilitas || []).map((dis, idx) => (
                      <div key={idx} className="p-3 rounded-xl neu-inset flex items-center justify-between border border-stone-300/40">
                        <div className="flex items-center gap-2.5">
                          <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: dis.color || '#0284c7' }} />
                          <span className="text-xs font-bold text-slate-800">{dis.jenis}</span>
                        </div>
                        <span className="font-mono font-bold text-xs text-slate-900 bg-white/70 px-2.5 py-0.5 rounded-lg border border-stone-200">
                          {dis.jumlah} Pemilih
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Banner Aksesibilitas TPS */}
                <div className="p-3.5 rounded-xl bg-emerald-50/80 border border-emerald-200 text-xs text-emerald-950 space-y-1 mt-4">
                  <div className="flex items-center gap-1.5 font-bold text-[11px] uppercase tracking-wider text-emerald-900">
                    <ShieldCheck className="h-3.5 w-3.5 text-emerald-700" />
                    <span>Layanan TPS Ramah Disabilitas:</span>
                  </div>
                  <p className="text-[11px] leading-relaxed text-emerald-900/90">
                    Seluruh TPS Desa Sampeldes difasilitasi akses jalan tanpa undakan tangga curam, template surat suara braille untuk tuna netra, dan izin pendampingan pemilih prioritas.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* ─── BAGIAN 3: TABEL SEBARAN TPS & WILAYAH CAKUPAN ─── */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-emerald-800 text-white">
                  <MapPin className="h-4 w-4" />
                </span>
                <div>
                  <h3 className="text-base sm:text-lg font-condensed font-black uppercase tracking-wider text-slate-900">
                    3. Tabel Sebaran TPS &amp; Wilayah Cakupan
                  </h3>
                  <p className="text-xs text-stone-500">Nomor TPS, lokasi penempatan, rincian DPT laki/perempuan, dan wilayah RT/RW</p>
                </div>
              </div>

              {/* Search & Toggle Mode */}
              <div className="flex items-center gap-2">
                <div className="relative w-48 sm:w-60">
                  <Search className="h-3.5 w-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <Input
                    value={searchTps}
                    onChange={(e) => setSearchTps(e.target.value)}
                    placeholder="Cari TPS, Lokasi, Dusun..."
                    className="h-9 pl-8 pr-3 text-xs bg-white/80 border-stone-300 rounded-xl"
                  />
                </div>
                <div className="flex items-center p-0.5 rounded-xl neu-inset border border-stone-300/60">
                  <button
                    onClick={() => setTpsViewMode('table')}
                    className={cn(
                      'p-1.5 rounded-lg text-xs font-bold transition-all',
                      tpsViewMode === 'table' ? 'bg-white shadow-xs text-emerald-900' : 'text-stone-500 hover:text-slate-900'
                    )}
                    title="Tampilan Tabel"
                  >
                    <TableIcon className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => setTpsViewMode('cards')}
                    className={cn(
                      'p-1.5 rounded-lg text-xs font-bold transition-all',
                      tpsViewMode === 'cards' ? 'bg-white shadow-xs text-emerald-900' : 'text-stone-500 hover:text-slate-900'
                    )}
                    title="Tampilan Kartu"
                  >
                    <LayoutGrid className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* TABEL VIEW */}
            {tpsViewMode === 'table' ? (
              <div className="neu-card-elevated rounded-2xl overflow-hidden border border-white/80 shadow-sm">
                <div className="overflow-x-auto max-h-[520px] relative scrollbar-thin">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead className="bg-slate-900 text-white font-condensed font-bold uppercase tracking-wider text-[11px] sticky top-0 z-20 shadow-xs">
                      <tr>
                        <th className="py-3 px-3.5 text-center w-28 min-w-[110px] border-r border-slate-800">Nomor TPS</th>
                        <th className="py-3 px-3.5 min-w-[220px] border-r border-slate-800">Lokasi / Nama Tempat TPS</th>
                        <th className="py-3 px-3.5 min-w-[260px] border-r border-slate-800">Cakupan Wilayah (Dusun / RT / RW)</th>
                        <th className="py-3 px-3.5 text-right w-28 min-w-[95px] border-r border-slate-800 text-sky-300">DPT (L)</th>
                        <th className="py-3 px-3.5 text-right w-28 min-w-[95px] border-r border-slate-800 text-rose-300">DPT (P)</th>
                        <th className="py-3 px-3.5 text-right w-32 min-w-[110px] bg-emerald-950 text-teal-400">Total DPT</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-200/80 bg-white/70">
                      {filteredTps.length > 0 ? (
                        filteredTps.map((tps, idx) => (
                          <tr key={tps.id || idx} className="hover:bg-emerald-50/50 transition-colors">
                            <td className="py-2.5 px-3 text-center border-r border-stone-200/80">
                              <span className="inline-flex items-center justify-center whitespace-nowrap px-2.5 py-1 rounded-md bg-emerald-100/90 border border-emerald-400/70 font-mono font-bold text-xs text-emerald-950 shadow-2xs">
                                {tps.nomorTps}
                              </span>
                            </td>
                            <td className="py-2.5 px-3.5 font-bold text-slate-900 border-r border-stone-200/80">
                              {tps.namaTempat}
                            </td>
                            <td className="py-2.5 px-3.5 text-stone-700 border-r border-stone-200/80">
                              {tps.cakupanWilayah}
                            </td>
                            <td className="py-2.5 px-3.5 text-right font-mono text-sky-900 font-bold border-r border-stone-200/80 whitespace-nowrap">
                              {formatNum(tps.dptLaki)}
                            </td>
                            <td className="py-2.5 px-3.5 text-right font-mono text-rose-900 font-bold border-r border-stone-200/80 whitespace-nowrap">
                              {formatNum(tps.dptPerempuan)}
                            </td>
                            <td className="py-2.5 px-3.5 text-right font-mono font-black text-slate-950 bg-emerald-100/60 whitespace-nowrap">
                              {formatNum(tps.totalDpt)}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={6} className="py-8 text-center text-stone-500 text-xs">
                            Tidak ditemukan TPS yang cocok dengan kata kunci pencarian.
                          </td>
                        </tr>
                      )}
                    </tbody>
                    <tfoot className="bg-slate-900 text-white font-bold sticky bottom-0 z-20 shadow-[0_-4px_14px_rgba(0,0,0,0.2)] border-t-2 border-emerald-500">
                      <tr>
                        <td colSpan={3} className="py-3 px-4 uppercase tracking-wider text-xs font-sans text-amber-300 font-bold border-r border-slate-800">
                          Total Agregat ({filteredTps.length} TPS Terpilih):
                        </td>
                        <td className="py-3 px-3.5 text-right font-mono text-xs font-bold text-sky-300 border-r border-slate-800 whitespace-nowrap">
                          {formatNum(filteredTps.reduce((acc, c) => acc + (c.dptLaki || 0), 0))}
                        </td>
                        <td className="py-3 px-3.5 text-right font-mono text-xs font-bold text-rose-300 border-r border-slate-800 whitespace-nowrap">
                          {formatNum(filteredTps.reduce((acc, c) => acc + (c.dptPerempuan || 0), 0))}
                        </td>
                        <td className="py-3 px-3.5 text-right font-mono font-black text-sm text-teal-400 bg-emerald-950 whitespace-nowrap">
                          {formatNum(filteredTps.reduce((acc, c) => acc + (c.totalDpt || 0), 0))}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            ) : (
              /* CARDS VIEW */
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {filteredTps.map((tps, idx) => (
                  <div key={tps.id || idx} className="neu-card-elevated p-4 rounded-2xl border border-white/80 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-black text-xs text-emerald-900 px-2.5 py-0.5 rounded-lg bg-emerald-100 border border-emerald-300">
                        {tps.nomorTps}
                      </span>
                      <span className="font-mono font-black text-slate-950 text-sm">
                        {formatNum(tps.totalDpt)} <span className="text-[10px] font-sans font-bold text-stone-500">DPT</span>
                      </span>
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-xs line-clamp-1">{tps.namaTempat}</h4>
                      <p className="text-[11px] text-stone-500 line-clamp-2 mt-0.5">{tps.cakupanWilayah}</p>
                    </div>
                    <div className="pt-2 border-t border-stone-200 flex justify-between text-[11px] font-mono">
                      <span className="text-sky-900 font-bold">L: {formatNum(tps.dptLaki)}</span>
                      <span className="text-rose-900 font-bold">P: {formatNum(tps.dptPerempuan)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ─── BAGIAN 4: REKAPITULASI & ARSIP HASIL SUARA TINGKAT DESA ─── */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-emerald-800 text-white">
                  <Award className="h-4 w-4" />
                </span>
                <div>
                  <h3 className="text-base sm:text-lg font-condensed font-black uppercase tracking-wider text-slate-900">
                    4. Rekapitulasi &amp; Arsip Hasil Suara Tingkat Desa
                  </h3>
                  <p className="text-xs text-stone-500">
                    {activeTab === 'pemilu'
                      ? 'Arsip resmi perolehan suara Pemilu 2024 (Pilpres, DPR RI, DPRD Kab, DPD RI & Rekap 24 TPS)'
                      : activeTab === 'pilkada'
                        ? 'Arsip perolehan suara resmi Pemilihan Bupati Cilacap & Gubernur Jawa Tengah 2024'
                        : 'Perolehan suara kontestan / pasangan calon berdasarkan berita acara pleno rekapitulasi desa'}
                  </p>
                </div>
              </div>

              {/* Sub-Tabs Khusus Pemilu 2024 */}
              {activeTab === 'pemilu' && (
                <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-xl bg-stone-200/80 border border-stone-300">
                  <button
                    type="button"
                    onClick={() => setPemiluSubTab('pilpres')}
                    className={cn(
                      'px-3 py-1.5 rounded-lg text-xs font-condensed font-bold uppercase tracking-wider transition-all flex items-center gap-1.5',
                      pemiluSubTab === 'pilpres'
                        ? 'bg-slate-900 text-white shadow-sm'
                        : 'text-stone-700 hover:text-slate-900 hover:bg-white/50'
                    )}
                  >
                    <Vote className="h-3.5 w-3.5" />
                    <span>Pilpres</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPemiluSubTab('dpr_ri')}
                    className={cn(
                      'px-3 py-1.5 rounded-lg text-xs font-condensed font-bold uppercase tracking-wider transition-all flex items-center gap-1.5',
                      pemiluSubTab === 'dpr_ri'
                        ? 'bg-slate-900 text-white shadow-sm'
                        : 'text-stone-700 hover:text-slate-900 hover:bg-white/50'
                    )}
                  >
                    <Landmark className="h-3.5 w-3.5" />
                    <span>DPR RI</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPemiluSubTab('dprd_kab')}
                    className={cn(
                      'px-3 py-1.5 rounded-lg text-xs font-condensed font-bold uppercase tracking-wider transition-all flex items-center gap-1.5',
                      pemiluSubTab === 'dprd_kab'
                        ? 'bg-slate-900 text-white shadow-sm'
                        : 'text-stone-700 hover:text-slate-900 hover:bg-white/50'
                    )}
                  >
                    <Award className="h-3.5 w-3.5" />
                    <span>DPRD Kab</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPemiluSubTab('dpd')}
                    className={cn(
                      'px-3 py-1.5 rounded-lg text-xs font-condensed font-bold uppercase tracking-wider transition-all flex items-center gap-1.5',
                      pemiluSubTab === 'dpd'
                        ? 'bg-slate-900 text-white shadow-sm'
                        : 'text-stone-700 hover:text-slate-900 hover:bg-white/50'
                    )}
                  >
                    <Users className="h-3.5 w-3.5" />
                    <span>DPD RI Jateng</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPemiluSubTab('audit_tps')}
                    className={cn(
                      'px-3 py-1.5 rounded-lg text-xs font-condensed font-bold uppercase tracking-wider transition-all flex items-center gap-1.5',
                      pemiluSubTab === 'audit_tps'
                        ? 'bg-slate-900 text-white shadow-sm'
                        : 'text-stone-700 hover:text-slate-900 hover:bg-white/50'
                    )}
                  >
                    <TableIcon className="h-3.5 w-3.5" />
                    <span>Audit 24 TPS</span>
                  </button>
                </div>
              )}

              {/* Sub-Tabs Khusus Pilkada 2024 */}
              {activeTab === 'pilkada' && (
                <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-xl bg-stone-200/80 border border-stone-300">
                  <button
                    type="button"
                    onClick={() => setPilkadaSubTab('pilbup')}
                    className={cn(
                      'px-3 py-1.5 rounded-lg text-xs font-condensed font-bold uppercase tracking-wider transition-all flex items-center gap-1.5',
                      pilkadaSubTab === 'pilbup'
                        ? 'bg-slate-900 text-white shadow-sm'
                        : 'text-stone-700 hover:text-slate-900 hover:bg-white/50'
                    )}
                  >
                    <Landmark className="h-3.5 w-3.5" />
                    <span>Pemilihan Bupati Cilacap</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPilkadaSubTab('pilgub')}
                    className={cn(
                      'px-3 py-1.5 rounded-lg text-xs font-condensed font-bold uppercase tracking-wider transition-all flex items-center gap-1.5',
                      pilkadaSubTab === 'pilgub'
                        ? 'bg-slate-900 text-white shadow-sm'
                        : 'text-stone-700 hover:text-slate-900 hover:bg-white/50'
                    )}
                  >
                    <Vote className="h-3.5 w-3.5" />
                    <span>Pemilihan Gubernur Jateng</span>
                  </button>
                </div>
              )}
            </div>

            {/* ── KONTEN TAB 1: PILPRES 2024 ── */}
            {activeTab === 'pemilu' && pemiluSubTab === 'pilpres' && (
              <div className="space-y-4">
                {/* Header Sub & View Toggle */}
                <div className="neu-card-elevated p-4 rounded-2xl border border-white/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h4 className="font-condensed font-black uppercase text-slate-900 text-sm sm:text-base">
                      Perolehan Calon Presiden &amp; Wakil Presiden 2024
                    </h4>
                    <p className="text-xs text-stone-500">Hasil Pemilihan Umum Presiden di Desa Sampeldes (24 TPS)</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant={pilpresViewMode === 'cards' ? 'default' : 'outline'}
                      onClick={() => setPilpresViewMode('cards')}
                      className={cn(
                        'h-8 px-3 text-xs font-condensed font-bold uppercase',
                        pilpresViewMode === 'cards' ? 'bg-slate-900 text-white' : 'bg-white/80'
                      )}
                    >
                      <LayoutGrid className="h-3.5 w-3.5 mr-1" />
                      Ringkasan Paslon
                    </Button>
                    <Button
                      size="sm"
                      variant={pilpresViewMode === 'table' ? 'default' : 'outline'}
                      onClick={() => setPilpresViewMode('table')}
                      className={cn(
                        'h-8 px-3 text-xs font-condensed font-bold uppercase',
                        pilpresViewMode === 'table' ? 'bg-slate-900 text-white' : 'bg-white/80'
                      )}
                    >
                      <TableIcon className="h-3.5 w-3.5 mr-1" />
                      Tabel Rincian 24 TPS
                    </Button>
                  </div>
                </div>

                {pilpresViewMode === 'cards' ? (
                  /* KARTU PASLON PRESIDEN */
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {(currentData.rekapitulasiList || []).map((paslon, idx) => (
                      <div
                        key={paslon.id || idx}
                        className={cn(
                          'neu-card-elevated p-5 sm:p-6 rounded-2xl border transition-all relative overflow-hidden flex flex-col justify-between',
                          paslon.isPemenang ? 'border-amber-400 ring-2 ring-amber-400/30' : 'border-white/80'
                        )}
                      >
                        {paslon.isPemenang && (
                          <div className="absolute top-0 right-0 bg-amber-400 text-slate-950 font-bold text-[10px] font-mono px-3 py-1 rounded-bl-xl shadow-xs uppercase tracking-wider flex items-center gap-1">
                            <Award className="h-3 w-3" />
                            <span>Suara Terbanyak</span>
                          </div>
                        )}

                        <div className="space-y-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-mono font-black text-lg shrink-0 shadow-sm">
                              0{paslon.nomorUrut}
                            </div>
                            <div className="min-w-0">
                              <span className="text-[10px] font-mono font-bold text-stone-500 uppercase">Pasangan Calon 0{paslon.nomorUrut}</span>
                              <h4 className="font-condensed font-bold uppercase text-slate-900 text-sm sm:text-base leading-tight truncate">
                                {paslon.namaKandidat}
                              </h4>
                            </div>
                          </div>

                          {paslon.namaWakil && (
                            <p className="text-xs text-stone-600 font-semibold">
                              Wakil: <span className="text-slate-800 font-bold">{paslon.namaWakil}</span>
                            </p>
                          )}

                          {paslon.keterangan && (
                            <p className="text-[11px] text-stone-500 line-clamp-2 italic leading-relaxed">
                              {paslon.keterangan}
                            </p>
                          )}
                        </div>

                        <div className="mt-4 pt-3 border-t border-stone-200 space-y-2">
                          <div className="flex justify-between items-baseline">
                            <span className="text-xs text-stone-500 font-bold uppercase">Perolehan Suara:</span>
                            <span className="text-xl sm:text-2xl font-mono font-black text-slate-950">
                              {formatNum(paslon.perolehanSuara)} <span className="text-xs font-sans font-bold text-stone-500">Suara</span>
                            </span>
                          </div>

                          {/* Progress Bar Persentase */}
                          <div className="space-y-1">
                            <div className="w-full h-2.5 rounded-full bg-stone-200 overflow-hidden">
                              <div
                                className={cn('h-full transition-all', paslon.isPemenang ? 'bg-amber-500' : 'bg-emerald-700')}
                                style={{ width: `${paslon.persentase || 0}%` }}
                              />
                            </div>
                            <div className="flex justify-between text-[11px] font-mono font-bold text-stone-600">
                              <span>Persentase Sah:</span>
                              <span className={paslon.isPemenang ? 'text-amber-800' : 'text-emerald-800'}>{paslon.persentase || 0}%</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  /* TABEL PEROLEHAN CALON PRESIDEN 2024 BERDASARKAN TPS (SESUAI GAMBAR 1) */
                  <div className="neu-card-elevated rounded-2xl overflow-hidden border border-white/80 shadow-sm">
                    <div className="p-3.5 bg-slate-900 text-white flex items-center justify-between text-xs font-mono">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="bg-emerald-500/20 text-emerald-300 border-emerald-400/40 text-[10px]">
                          DATA RESMI FORM HASIL
                        </Badge>
                        <span className="font-bold uppercase tracking-wider">Perolehan Suara Calon Presiden 2024 Berdasarkan TPS</span>
                      </div>
                      <div className="text-stone-300 text-[11px]">
                        Total 24 TPS • DPT Desa: 6.026
                      </div>
                    </div>
                    <div className="overflow-x-auto max-h-[550px] relative scrollbar-thin">
                      <table className="w-full text-xs text-left border-collapse">
                        <thead className="bg-slate-800 text-white font-condensed font-bold uppercase tracking-wider text-[11px] sticky top-0 z-20 shadow-xs">
                          <tr>
                            <th className="py-2.5 px-3 text-center w-20 border-r border-slate-700">Desa</th>
                            <th className="py-2.5 px-3 text-center w-20 border-r border-slate-700">TPS</th>
                            <th className="py-2.5 px-3 text-right w-20 border-r border-slate-700">DPT</th>
                            <th className="py-2.5 px-3 text-right w-20 bg-sky-950 text-sky-200 border-r border-slate-700">01</th>
                            <th className="py-2.5 px-2 text-right w-16 bg-sky-950 text-sky-200 border-r border-slate-700">%</th>
                            <th className="py-2.5 px-3 text-right w-20 bg-amber-950 text-amber-200 border-r border-slate-700">02</th>
                            <th className="py-2.5 px-2 text-right w-16 bg-amber-950 text-amber-200 border-r border-slate-700">%</th>
                            <th className="py-2.5 px-3 text-right w-20 bg-red-950 text-red-200 border-r border-slate-700">03</th>
                            <th className="py-2.5 px-2 text-right w-16 bg-red-950 text-red-200 border-r border-slate-700">%</th>
                            <th className="py-2.5 px-3 text-right w-20 border-r border-slate-700 text-rose-300">Tidak Sah</th>
                            <th className="py-2.5 px-3 text-right w-20 border-r border-slate-700 text-emerald-300">Sah</th>
                            <th className="py-2.5 px-3 text-right w-24 bg-emerald-950 text-teal-400 border-r border-slate-700">Kehadiran</th>
                            <th className="py-2.5 px-3 text-right w-20 bg-emerald-950 text-teal-400">% HDR</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-200/80 bg-white/70 font-mono">
                          {(currentData.pilpresTpsList || []).map((row, idx) => (
                            <tr key={idx} className="hover:bg-emerald-50/60 transition-colors">
                              <td className="py-2 px-3 text-center font-sans font-bold text-stone-600 text-[11px] border-r border-stone-200/80">SAMPELDES</td>
                              <td className="py-2 px-3 text-center font-bold text-emerald-900 bg-emerald-50/40 border-r border-stone-200/80">{row.tps}</td>
                              <td className="py-2 px-3 text-right font-bold text-slate-800 border-r border-stone-200/80 whitespace-nowrap">{formatNum(row.dpt)}</td>
                              <td className="py-2 px-3 text-right font-bold text-sky-900 bg-sky-50/50 border-r border-stone-200/80 whitespace-nowrap">{formatNum(row.suara01)}</td>
                              <td className="py-2 px-2 text-right text-[11px] text-sky-700 bg-sky-50/30 border-r border-stone-200/80 whitespace-nowrap">{row.persen01}</td>
                              <td className="py-2 px-3 text-right font-bold text-amber-900 bg-amber-50/50 border-r border-stone-200/80 whitespace-nowrap">{formatNum(row.suara02)}</td>
                              <td className="py-2 px-2 text-right text-[11px] text-amber-700 bg-amber-50/30 border-r border-stone-200/80 whitespace-nowrap">{row.persen02}</td>
                              <td className="py-2 px-3 text-right font-bold text-red-900 bg-red-50/50 border-r border-stone-200/80 whitespace-nowrap">{formatNum(row.suara03)}</td>
                              <td className="py-2 px-2 text-right text-[11px] text-red-700 bg-red-50/30 border-r border-stone-200/80 whitespace-nowrap">{row.persen03}</td>
                              <td className="py-2 px-3 text-right font-bold text-rose-800 border-r border-stone-200/80 whitespace-nowrap">{formatNum(row.tidakSah)}</td>
                              <td className="py-2 px-3 text-right font-bold text-slate-900 border-r border-stone-200/80 whitespace-nowrap">{formatNum(row.sah)}</td>
                              <td className="py-2 px-3 text-right font-black text-emerald-950 bg-emerald-100/60 border-r border-stone-200/80 whitespace-nowrap">{formatNum(row.kehadiran)}</td>
                              <td className="py-2 px-3 text-right font-bold text-emerald-800 bg-emerald-100/40 whitespace-nowrap">{row.persenHdr}</td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot className="bg-slate-900 text-white font-bold sticky bottom-0 z-20 font-mono text-[11px] shadow-[0_-4px_14px_rgba(0,0,0,0.2)] border-t-2 border-emerald-500">
                          <tr>
                            <td colSpan={2} className="py-3 px-3 uppercase text-center font-sans tracking-wider text-amber-300 border-r border-slate-800">TOTAL DESA</td>
                            <td className="py-3 px-3 text-right text-stone-200 border-r border-slate-800 whitespace-nowrap">6.026</td>
                            <td className="py-3 px-3 text-right text-sky-300 font-black border-r border-slate-800 whitespace-nowrap">657</td>
                            <td className="py-3 px-2 text-right text-sky-300 border-r border-slate-800 whitespace-nowrap">15,2%</td>
                            <td className="py-3 px-3 text-right text-amber-300 font-black border-r border-slate-800 whitespace-nowrap">2.430</td>
                            <td className="py-3 px-2 text-right text-amber-300 border-r border-slate-800 whitespace-nowrap">56,1%</td>
                            <td className="py-3 px-3 text-right text-red-300 font-black border-r border-slate-800 whitespace-nowrap">1.248</td>
                            <td className="py-3 px-2 text-right text-red-300 border-r border-slate-800 whitespace-nowrap">28,8%</td>
                            <td className="py-3 px-3 text-right text-rose-300 font-black border-r border-slate-800 whitespace-nowrap">74</td>
                            <td className="py-3 px-3 text-right text-emerald-300 font-black border-r border-slate-800 whitespace-nowrap">4.335</td>
                            <td className="py-3 px-3 text-right text-teal-400 font-black text-xs border-r border-slate-800 whitespace-nowrap">4.409</td>
                            <td className="py-3 px-3 text-right text-teal-400 font-black whitespace-nowrap">73,2%</td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>
                )}

                {/* Ringkasan Angka Sah/Tidak Sah */}
                <div className="p-4 rounded-2xl neu-inset border border-stone-300/60 grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                  <div>
                    <span className="text-[10px] text-stone-500 font-bold uppercase block">Total Hak Pilih (DPT)</span>
                    <span className="font-mono font-black text-slate-900 text-sm sm:text-base">{formatNum(currentData.totalDpt)}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-stone-500 font-bold uppercase block">Total Pengguna Hak Pilih</span>
                    <span className="font-mono font-black text-emerald-900 text-sm sm:text-base">{formatNum(currentData.totalSuaraMasuk)}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-stone-500 font-bold uppercase block">Suara Sah Pilpres</span>
                    <span className="font-mono font-black text-sky-900 text-sm sm:text-base">{formatNum(currentData.totalSuaraSah)}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-stone-500 font-bold uppercase block">Suara Tidak Sah</span>
                    <span className="font-mono font-black text-rose-900 text-sm sm:text-base">{formatNum(currentData.totalSuaraTidakSah)}</span>
                  </div>
                </div>
              </div>
            )}

            {/* ── KONTEN TAB 2: DPR RI (DAPIL JATENG VIII) ── */}
            {activeTab === 'pemilu' && pemiluSubTab === 'dpr_ri' && (
              <div className="space-y-4">
                <div className="neu-card-elevated p-4 sm:p-5 rounded-2xl border border-white/80 flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <Badge className="bg-sky-100 text-sky-900 border-sky-300 text-[10px] font-bold">
                        DAPIL JAWA TENGAH VIII
                      </Badge>
                      <span className="text-xs text-stone-500 font-mono">Banyumas &amp; Cilacap</span>
                    </div>
                    <h4 className="font-condensed font-black uppercase text-slate-900 text-base sm:text-lg mt-0.5">
                      Perolehan Suara Pemilu DPR RI 2024
                    </h4>
                    <p className="text-xs text-stone-600">
                      Rincian perolehan suara 18 Partai Politik dan Calon Anggota DPR RI di Desa Sampeldes serta perbandingan total Dapil (D HSL)
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => toggleAllDpr(true)}
                      className="h-8 px-2.5 text-xs font-condensed font-bold uppercase bg-white/80"
                    >
                      Buka Semua
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => toggleAllDpr(false)}
                      className="h-8 px-2.5 text-xs font-condensed font-bold uppercase bg-white/80"
                    >
                      Tutup Semua
                    </Button>
                  </div>
                </div>

                {/* Search Bar DPR RI */}
                <div className="relative">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
                  <Input
                    placeholder="Cari nama partai atau nama calon legislatif DPR RI..."
                    value={searchDprRi}
                    onChange={(e) => setSearchDprRi(e.target.value)}
                    className="pl-10 h-10 bg-white/80 rounded-xl border-stone-300 text-xs font-medium"
                  />
                </div>

                {/* List 18 Partai Politik DPR RI */}
                <div className="space-y-3">
                  {filteredDprRi.map((parpol) => {
                    const isExpanded = expandedDprParties[parpol.nomorParpol] ?? false;
                    return (
                      <div
                        key={parpol.nomorParpol}
                        className="neu-card-elevated rounded-2xl border border-white/80 overflow-hidden transition-all"
                      >
                        {/* Header Bar Partai */}
                        <div
                          onClick={() => toggleDprParty(parpol.nomorParpol)}
                          className="p-3.5 sm:p-4 bg-white/90 hover:bg-emerald-50/50 cursor-pointer transition-colors flex items-center justify-between gap-3"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <span className="w-8 h-8 rounded-lg bg-slate-900 text-white font-mono font-bold text-xs flex items-center justify-center shrink-0">
                              {parpol.nomorParpol}
                            </span>
                            <div className="min-w-0">
                              <h5 className="font-condensed font-bold uppercase text-slate-900 text-xs sm:text-sm truncate">
                                {parpol.namaParpol}
                              </h5>
                              <p className="text-[11px] text-stone-500 font-mono">
                                Suara Partai: <span className="font-bold text-slate-800">{formatNum(parpol.suaraPartai)}</span> (Sampeldes) • <span className="font-bold text-stone-700">{formatNum(parpol.suaraPartaiDapil)}</span> (D HSL)
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 shrink-0">
                            <div className="text-right">
                              <span className="text-[10px] font-mono uppercase text-stone-500 block">Total Suara:</span>
                              <span className="font-mono font-black text-emerald-950 text-sm sm:text-base">
                                {formatNum(parpol.totalSuaraSampeldes)} <span className="text-[10px] font-sans font-bold text-stone-500">Suara</span>
                              </span>
                            </div>
                            <span className="p-1 rounded-lg bg-stone-100 text-stone-600">
                              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                            </span>
                          </div>
                        </div>

                        {/* Collapsible Caleg Table */}
                        {isExpanded && (
                          <div className="p-3 sm:p-4 bg-stone-50/70 border-t border-stone-200">
                            <div className="overflow-x-auto rounded-xl border border-stone-200 bg-white">
                              <table className="w-full text-xs text-left">
                                <thead className="bg-slate-100 text-slate-800 font-condensed font-bold uppercase text-[11px]">
                                  <tr>
                                    <th className="py-2 px-3 text-center w-12">No</th>
                                    <th className="py-2 px-3">Nama Calon Anggota DPR RI</th>
                                    <th className="py-2 px-3 text-right w-32 bg-emerald-50 text-emerald-950">Suara Sampeldes</th>
                                    <th className="py-2 px-3 text-right w-32 bg-sky-50 text-sky-950">D HSL (Dapil)</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-stone-100">
                                  {/* Baris Coblos Partai */}
                                  <tr className="bg-stone-50/80 font-bold text-stone-800">
                                    <td className="py-2 px-3 text-center font-mono">-</td>
                                    <td className="py-2 px-3 italic">Suara Coblos Partai ({parpol.namaParpol})</td>
                                    <td className="py-2 px-3 text-right font-mono font-bold text-emerald-900 bg-emerald-50/40">
                                      {formatNum(parpol.suaraPartai)}
                                    </td>
                                    <td className="py-2 px-3 text-right font-mono font-bold text-sky-900 bg-sky-50/40">
                                      {formatNum(parpol.suaraPartaiDapil)}
                                    </td>
                                  </tr>

                                  {/* Baris Caleg */}
                                  {parpol.calegList.map((caleg) => {
                                    const maxVotes = Math.max(...parpol.calegList.map(c => c.suaraSampeldes));
                                    const isTop = caleg.suaraSampeldes > 0 && caleg.suaraSampeldes === maxVotes;
                                    return (
                                      <tr key={caleg.noUrut} className={cn('hover:bg-slate-50 transition-colors', isTop && 'bg-amber-50/40')}>
                                        <td className="py-2 px-3 text-center font-mono font-bold text-stone-600">
                                          {caleg.noUrut}
                                        </td>
                                        <td className="py-2 px-3 font-medium text-slate-900">
                                          <div className="flex items-center gap-1.5">
                                            <span>{caleg.namaCaleg}</span>
                                            {isTop && (
                                              <Badge className="bg-amber-400 text-slate-950 text-[9px] font-bold px-1.5 py-0">
                                                Tertinggi
                                              </Badge>
                                            )}
                                          </div>
                                        </td>
                                        <td className="py-2 px-3 text-right font-mono font-bold text-emerald-950 bg-emerald-50/30">
                                          {caleg.suaraSampeldes > 0 ? formatNum(caleg.suaraSampeldes) : '-'}
                                        </td>
                                        <td className="py-2 px-3 text-right font-mono font-bold text-sky-950 bg-sky-50/30">
                                          {caleg.suaraDapil && caleg.suaraDapil > 0 ? formatNum(caleg.suaraDapil) : '-'}
                                        </td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                                <tfoot className="bg-slate-900 text-white font-bold text-xs font-mono">
                                  <tr>
                                    <td colSpan={2} className="py-2.5 px-3 uppercase tracking-wider font-sans text-center">
                                      TOTAL SUARA SAH PARTAI &amp; CALEG
                                    </td>
                                    <td className="py-2.5 px-3 text-right text-teal-400 font-black text-sm">
                                      {formatNum(parpol.totalSuaraSampeldes)}
                                    </td>
                                    <td className="py-2.5 px-3 text-right text-sky-300 font-black text-sm">
                                      {formatNum(parpol.totalSuaraDapil)}
                                    </td>
                                  </tr>
                                </tfoot>
                              </table>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── KONTEN TAB 3: DPRD KABUPATEN CILACAP ── */}
            {activeTab === 'pemilu' && pemiluSubTab === 'dprd_kab' && (
              <div className="space-y-4">
                <div className="neu-card-elevated p-4 sm:p-5 rounded-2xl border border-white/80 flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <Badge className="bg-emerald-100 text-emerald-900 border-emerald-300 text-[10px] font-bold">
                        DAPIL CILACAP
                      </Badge>
                      <span className="text-xs text-stone-500 font-mono">Desa Sampeldes</span>
                    </div>
                    <h4 className="font-condensed font-black uppercase text-slate-900 text-base sm:text-lg mt-0.5">
                      Perolehan Suara Pemilu DPRD Kabupaten Cilacap 2024
                    </h4>
                    <p className="text-xs text-stone-600">
                      Rincian perolehan suara 18 Partai Politik dan Calon Anggota DPRD Kabupaten di TPS Desa Sampeldes
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => toggleAllDprd(true)}
                      className="h-8 px-2.5 text-xs font-condensed font-bold uppercase bg-white/80"
                    >
                      Buka Semua
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => toggleAllDprd(false)}
                      className="h-8 px-2.5 text-xs font-condensed font-bold uppercase bg-white/80"
                    >
                      Tutup Semua
                    </Button>
                  </div>
                </div>

                {/* Search Bar DPRD Kab */}
                <div className="relative">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
                  <Input
                    placeholder="Cari nama partai atau nama calon legislatif DPRD Kabupaten..."
                    value={searchDprdKab}
                    onChange={(e) => setSearchDprdKab(e.target.value)}
                    className="pl-10 h-10 bg-white/80 rounded-xl border-stone-300 text-xs font-medium"
                  />
                </div>

                {/* List 18 Partai Politik DPRD Kab */}
                <div className="space-y-3">
                  {filteredDprdKab.map((parpol) => {
                    const isExpanded = expandedDprdParties[parpol.nomorParpol] ?? false;
                    return (
                      <div
                        key={parpol.nomorParpol}
                        className="neu-card-elevated rounded-2xl border border-white/80 overflow-hidden transition-all"
                      >
                        {/* Header Bar Partai */}
                        <div
                          onClick={() => toggleDprdParty(parpol.nomorParpol)}
                          className="p-3.5 sm:p-4 bg-white/90 hover:bg-emerald-50/50 cursor-pointer transition-colors flex items-center justify-between gap-3"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <span className="w-8 h-8 rounded-lg bg-slate-900 text-white font-mono font-bold text-xs flex items-center justify-center shrink-0">
                              {parpol.nomorParpol}
                            </span>
                            <div className="min-w-0">
                              <h5 className="font-condensed font-bold uppercase text-slate-900 text-xs sm:text-sm truncate">
                                {parpol.namaParpol}
                              </h5>
                              <p className="text-[11px] text-stone-500 font-mono">
                                Suara Partai: <span className="font-bold text-slate-800">{formatNum(parpol.suaraPartai)}</span> Suara
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 shrink-0">
                            <div className="text-right">
                              <span className="text-[10px] font-mono uppercase text-stone-500 block">Total Suara:</span>
                              <span className="font-mono font-black text-emerald-950 text-sm sm:text-base">
                                {formatNum(parpol.totalSuaraSampeldes)} <span className="text-[10px] font-sans font-bold text-stone-500">Suara</span>
                              </span>
                            </div>
                            <span className="p-1 rounded-lg bg-stone-100 text-stone-600">
                              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                            </span>
                          </div>
                        </div>

                        {/* Collapsible Caleg Table */}
                        {isExpanded && (
                          <div className="p-3 sm:p-4 bg-stone-50/70 border-t border-stone-200">
                            <div className="overflow-x-auto rounded-xl border border-stone-200 bg-white">
                              <table className="w-full text-xs text-left">
                                <thead className="bg-slate-100 text-slate-800 font-condensed font-bold uppercase text-[11px]">
                                  <tr>
                                    <th className="py-2 px-3 text-center w-12">No</th>
                                    <th className="py-2 px-3">Nama Calon Anggota DPRD Kabupaten</th>
                                    <th className="py-2 px-3 text-right w-36 bg-emerald-50 text-emerald-950">Suara Sampeldes</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-stone-100">
                                  {/* Baris Coblos Partai */}
                                  <tr className="bg-stone-50/80 font-bold text-stone-800">
                                    <td className="py-2 px-3 text-center font-mono">-</td>
                                    <td className="py-2 px-3 italic">Suara Coblos Partai ({parpol.namaParpol})</td>
                                    <td className="py-2 px-3 text-right font-mono font-bold text-emerald-900 bg-emerald-50/40">
                                      {formatNum(parpol.suaraPartai)}
                                    </td>
                                  </tr>

                                  {/* Baris Caleg */}
                                  {parpol.calegList.length > 0 ? (
                                    parpol.calegList.map((caleg) => {
                                      const maxVotes = Math.max(...parpol.calegList.map(c => c.suaraSampeldes));
                                      const isTop = caleg.suaraSampeldes > 0 && caleg.suaraSampeldes === maxVotes;
                                      return (
                                        <tr key={caleg.noUrut} className={cn('hover:bg-slate-50 transition-colors', isTop && 'bg-amber-50/40')}>
                                          <td className="py-2 px-3 text-center font-mono font-bold text-stone-600">
                                            {caleg.noUrut}
                                          </td>
                                          <td className="py-2 px-3 font-medium text-slate-900">
                                            <div className="flex items-center gap-1.5">
                                              <span>{caleg.namaCaleg}</span>
                                              {isTop && (
                                                <Badge className="bg-amber-400 text-slate-950 text-[9px] font-bold px-1.5 py-0">
                                                  Tertinggi ({formatNum(caleg.suaraSampeldes)})
                                                </Badge>
                                              )}
                                            </div>
                                          </td>
                                          <td className="py-2 px-3 text-right font-mono font-bold text-emerald-950 bg-emerald-50/30">
                                            {caleg.suaraSampeldes > 0 ? formatNum(caleg.suaraSampeldes) : '-'}
                                          </td>
                                        </tr>
                                      );
                                    })
                                  ) : (
                                    <tr>
                                      <td colSpan={3} className="py-3 text-center text-stone-400 text-xs italic">
                                        Tidak ada calon legislatif yang terdaftar / suara kosong
                                      </td>
                                    </tr>
                                  )}
                                </tbody>
                                <tfoot className="bg-slate-900 text-white font-bold text-xs font-mono">
                                  <tr>
                                    <td colSpan={2} className="py-2.5 px-3 uppercase tracking-wider font-sans text-center">
                                      TOTAL SUARA SAH PARTAI &amp; CALEG
                                    </td>
                                    <td className="py-2.5 px-3 text-right text-teal-400 font-black text-sm">
                                      {formatNum(parpol.totalSuaraSampeldes)}
                                    </td>
                                  </tr>
                                </tfoot>
                              </table>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── KONTEN TAB 4: DPD RI JAWA TENGAH ── */}
            {activeTab === 'pemilu' && pemiluSubTab === 'dpd' && (
              <div className="space-y-4">
                <div className="neu-card-elevated p-4 sm:p-5 rounded-2xl border border-white/80 flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <Badge className="bg-purple-100 text-purple-900 border-purple-300 text-[10px] font-bold">
                        DEWAN PERWAKILAN DAERAH (DPD)
                      </Badge>
                      <span className="text-xs text-stone-500 font-mono">Provinsi Jawa Tengah</span>
                    </div>
                    <h4 className="font-condensed font-black uppercase text-slate-900 text-base sm:text-lg mt-0.5">
                      Perolehan Calon DPD RI Jawa Tengah 2024
                    </h4>
                    <p className="text-xs text-stone-600">
                      Hasil pemungutan suara 11 Calon DPD di TPS 1 s/d TPS 24 Desa Sampeldes (Total 4.099 Suara) dan perbandingan total Kecamatan (51.503 Suara)
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant={dpdViewMode === 'ranking' ? 'default' : 'outline'}
                      onClick={() => setDpdViewMode('ranking')}
                      className={cn(
                        'h-8 px-3 text-xs font-condensed font-bold uppercase',
                        dpdViewMode === 'ranking' ? 'bg-slate-900 text-white' : 'bg-white/80'
                      )}
                    >
                      <Award className="h-3.5 w-3.5 mr-1" />
                      Peringkat Suara
                    </Button>
                    <Button
                      size="sm"
                      variant={dpdViewMode === 'table' ? 'default' : 'outline'}
                      onClick={() => setDpdViewMode('table')}
                      className={cn(
                        'h-8 px-3 text-xs font-condensed font-bold uppercase',
                        dpdViewMode === 'table' ? 'bg-slate-900 text-white' : 'bg-white/80'
                      )}
                    >
                      <TableIcon className="h-3.5 w-3.5 mr-1" />
                      Tabel Rincian 24 TPS
                    </Button>
                  </div>
                </div>

                {dpdViewMode === 'ranking' ? (
                  /* RANKING VIEW 11 CALON DPD */
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                    {[...(currentData.dpdList || [])]
                      .sort((a, b) => b.suaraSampeldes - a.suaraSampeldes)
                      .map((calon, rankIdx) => {
                        const totalSampeldes = 4099;
                        const persen = ((calon.suaraSampeldes / totalSampeldes) * 100).toFixed(1);
                        const isTop = rankIdx === 0;
                        return (
                          <div
                            key={calon.noUrut}
                            className={cn(
                              'neu-card-elevated p-4 rounded-2xl border transition-all flex flex-col justify-between space-y-3',
                              isTop ? 'border-amber-400 ring-2 ring-amber-400/30 bg-amber-50/20' : 'border-white/80'
                            )}
                          >
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <span className={cn(
                                  'font-mono font-bold text-xs px-2.5 py-0.5 rounded-lg border',
                                  isTop ? 'bg-amber-400 text-slate-950 border-amber-500' : 'bg-stone-100 text-stone-700 border-stone-200'
                                )}>
                                  Peringkat #{rankIdx + 1}
                                </span>
                                <span className="text-[10px] font-mono text-stone-500">
                                  No Urut {calon.noUrut}
                                </span>
                              </div>
                              <h5 className="font-condensed font-bold uppercase text-slate-900 text-xs sm:text-sm line-clamp-2">
                                {calon.namaCalon}
                              </h5>
                            </div>

                            <div className="pt-2 border-t border-stone-200 space-y-1.5">
                              <div className="flex justify-between items-baseline">
                                <span className="text-[11px] text-stone-500 uppercase font-bold">Suara Sampeldes:</span>
                                <span className="font-mono font-black text-slate-950 text-base">
                                  {formatNum(calon.suaraSampeldes)} <span className="text-xs font-sans font-bold text-stone-500">Suara</span>
                                </span>
                              </div>
                              <div className="w-full h-2 rounded-full bg-stone-200 overflow-hidden">
                                <div
                                  className={cn('h-full', isTop ? 'bg-amber-500' : 'bg-purple-600')}
                                  style={{ width: `${persen}%` }}
                                />
                              </div>
                              <div className="flex justify-between text-[10px] font-mono font-bold text-stone-600">
                                <span>Porsi: {persen}%</span>
                                <span>Kecamatan: {formatNum(calon.suaraKecamatan)}</span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                ) : (
                  /* TABEL RINCIAN DPD 24 TPS (SESUAI GAMBAR 2) */
                  <div className="neu-card-elevated rounded-2xl overflow-hidden border border-white/80 shadow-sm">
                    <div className="p-3.5 bg-slate-900 text-white flex items-center justify-between text-xs font-mono">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="bg-purple-500/20 text-purple-300 border-purple-400/40 text-[10px]">
                          DATA RESMI
                        </Badge>
                        <span className="font-bold uppercase tracking-wider">Perolehan Calon DPD Jateng Berdasarkan TPS (1-24)</span>
                      </div>
                      <div className="text-stone-300 text-[11px]">
                        TTL Desa: 4.099 Suara • TTL Kec: 51.503 Suara
                      </div>
                    </div>
                    <div className="overflow-x-auto max-h-[550px] relative scrollbar-thin">
                      <table className="w-full text-xs text-left border-collapse">
                        <thead className="bg-slate-800 text-white font-condensed font-bold uppercase tracking-wider text-[11px] sticky top-0 z-20 shadow-xs">
                          <tr>
                            <th className="py-2.5 px-3 text-center w-12 sticky left-0 bg-slate-800 z-30 border-r border-slate-700">No</th>
                            <th className="py-2.5 px-3 min-w-[220px] sticky left-12 bg-slate-800 z-30 border-r border-slate-700">Nama Calon DPD</th>
                            <th className="py-2.5 px-3 text-right min-w-[90px] bg-amber-950 text-amber-200 border-r border-slate-700">Kec. TTL</th>
                            {Array.from({ length: 24 }, (_, i) => (
                              <th key={i} className="py-2.5 px-2 text-center w-10 text-[10px] text-stone-300 border-r border-slate-700/60">
                                {i + 1}
                              </th>
                            ))}
                            <th className="py-2.5 px-3 text-right min-w-[90px] bg-emerald-950 text-teal-400 sticky right-0 z-30">
                              Sampeldes TTL
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-200/80 bg-white/70 font-mono">
                          {(currentData.dpdList || []).map((calon) => (
                            <tr key={calon.noUrut} className="hover:bg-purple-50/50 transition-colors">
                              <td className="py-2 px-3 text-center font-bold text-stone-600 sticky left-0 bg-white/95 z-10 border-r border-stone-200/80">
                                {calon.noUrut}
                              </td>
                              <td className="py-2 px-3 font-sans font-bold text-slate-900 sticky left-12 bg-white/95 z-10 whitespace-nowrap border-r border-stone-200/80">
                                {calon.namaCalon}
                              </td>
                              <td className="py-2 px-3 text-right font-bold text-amber-900 bg-amber-50/40 border-r border-stone-200/80 whitespace-nowrap">
                                {formatNum(calon.suaraKecamatan)}
                              </td>
                              {(calon.suaraPerTps || []).map((val: number, tpsIdx: number) => (
                                <td key={tpsIdx} className="py-2 px-2 text-center text-slate-800 border-r border-stone-200/50">
                                  {val > 0 ? val : '-'}
                                </td>
                              ))}
                              <td className="py-2 px-3 text-right font-black text-emerald-950 bg-emerald-100/70 sticky right-0 z-10 whitespace-nowrap">
                                {formatNum(calon.suaraSampeldes)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot className="bg-slate-900 text-white font-bold sticky bottom-0 z-20 font-mono text-[11px] shadow-[0_-4px_14px_rgba(0,0,0,0.2)] border-t-2 border-purple-500">
                          <tr>
                            <td colSpan={2} className="py-3 px-3 uppercase text-center font-sans tracking-wider text-amber-300 sticky left-0 bg-slate-900 z-30 border-r border-slate-800">
                              TOTAL SUARA DPD
                            </td>
                            <td className="py-3 px-3 text-right text-amber-300 font-black border-r border-slate-800 whitespace-nowrap">51.503</td>
                            {/* Hitung total per TPS */}
                            {Array.from({ length: 24 }, (_, tIdx) => {
                              const tpsSum = (currentData.dpdList || []).reduce((acc, c) => acc + (c.suaraPerTps?.[tIdx] || 0), 0);
                              return (
                                <td key={tIdx} className="py-3 px-2 text-center text-stone-300 text-[10px] border-r border-slate-800/60 whitespace-nowrap">
                                  {tpsSum}
                                </td>
                              );
                            })}
                            <td className="py-3 px-3 text-right text-teal-400 font-black text-xs sticky right-0 bg-slate-900 z-30 whitespace-nowrap">
                              4.099
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── KONTEN TAB 5: AUDIT 24 TPS (DPT & SURAT SUARA LENGKAP DARI GAMBAR 3) ── */}
            {activeTab === 'pemilu' && pemiluSubTab === 'audit_tps' && (
              <div className="space-y-4">
                <div className="neu-card-elevated p-4 sm:p-5 rounded-2xl border border-white/80 flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <Badge className="bg-emerald-100 text-emerald-900 border-emerald-300 text-[10px] font-bold">
                        FORM MODEL D.HASIL DESA
                      </Badge>
                      <span className="text-xs text-stone-500 font-mono">Kelurahan / Desa Sampeldes</span>
                    </div>
                    <h4 className="font-condensed font-black uppercase text-slate-900 text-base sm:text-lg mt-0.5">
                      Rekapitulasi Pemilih Terdaftar DPT &amp; Audit Penggunaan Surat Suara (TPS 01 - 24)
                    </h4>
                    <p className="text-xs text-stone-600">
                      Data resmi hasil rekapitulasi 24 TPS: DPT L/P, Pengguna Hak Pilih, Surat Suara Diterima, Sah, Tidak Sah, Rusak, &amp; Tidak Digunakan
                    </p>
                  </div>
                </div>

                {/* Ringkasan Angka Audit */}
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
                  <div className="neu-card-elevated p-3 rounded-xl border border-white/80 text-center">
                    <span className="text-[10px] font-bold uppercase text-stone-500 block">DPT Total</span>
                    <span className="font-mono font-black text-slate-900 text-sm">6.026</span>
                    <span className="text-[9px] text-stone-400 block font-mono">L:3.046 P:2.980</span>
                  </div>
                  <div className="neu-card-elevated p-3 rounded-xl border border-white/80 text-center">
                    <span className="text-[10px] font-bold uppercase text-stone-500 block">Kehadiran Pemilih</span>
                    <span className="font-mono font-black text-emerald-900 text-sm">4.362</span>
                    <span className="text-[9px] text-emerald-700 block font-mono">DPK: 20</span>
                  </div>
                  <div className="neu-card-elevated p-3 rounded-xl border border-white/80 text-center">
                    <span className="text-[10px] font-bold uppercase text-stone-500 block">Surat Suara Diterima</span>
                    <span className="font-mono font-black text-slate-900 text-sm">6.162</span>
                    <span className="text-[9px] text-stone-400 block">Inc. Cadangan 2%</span>
                  </div>
                  <div className="neu-card-elevated p-3 rounded-xl border border-white/80 text-center bg-sky-50/40">
                    <span className="text-[10px] font-bold uppercase text-sky-900 block">Surat Suara Sah</span>
                    <span className="font-mono font-black text-sky-950 text-sm">4.056</span>
                    <span className="text-[9px] text-sky-700 block font-mono">93.0%</span>
                  </div>
                  <div className="neu-card-elevated p-3 rounded-xl border border-white/80 text-center bg-rose-50/40">
                    <span className="text-[10px] font-bold uppercase text-rose-900 block">Suara Tidak Sah</span>
                    <span className="font-mono font-black text-rose-950 text-sm">306</span>
                    <span className="text-[9px] text-rose-700 block font-mono">7.0%</span>
                  </div>
                  <div className="neu-card-elevated p-3 rounded-xl border border-white/80 text-center bg-amber-50/40">
                    <span className="text-[10px] font-bold uppercase text-amber-900 block">Suara Rusak</span>
                    <span className="font-mono font-black text-amber-950 text-sm">1</span>
                    <span className="text-[9px] text-amber-700 block">Keliru Coblos</span>
                  </div>
                  <div className="neu-card-elevated p-3 rounded-xl border border-white/80 text-center">
                    <span className="text-[10px] font-bold uppercase text-stone-500 block">Tidak Digunakan</span>
                    <span className="font-mono font-black text-stone-800 text-sm">1.799</span>
                    <span className="text-[9px] text-stone-400 block">Sisa Blanko</span>
                  </div>
                </div>

                {/* Tabel Audit 24 TPS (Gambar 3) */}
                <div className="neu-card-elevated rounded-2xl overflow-hidden border border-white/80 shadow-sm">
                  <div className="overflow-x-auto max-h-[550px] relative scrollbar-thin">
                    <table className="w-full text-xs text-left border-collapse">
                      <thead className="bg-slate-900 text-white font-condensed font-bold uppercase tracking-wider text-[11px] sticky top-0 z-20 shadow-xs">
                        <tr>
                          <th rowSpan={2} className="py-2.5 px-3 text-center border-r border-slate-700 sticky left-0 bg-slate-900 z-30">TPS</th>
                          <th colSpan={3} className="py-2 px-3 text-center border-r border-slate-700 bg-slate-800">Pemilih Terdaftar DPT</th>
                          <th colSpan={4} className="py-2 px-3 text-center border-r border-slate-700 bg-slate-800/90">Pengguna Hak Pilih</th>
                          <th colSpan={6} className="py-2 px-3 text-center bg-emerald-950 text-teal-400">Audit Surat Suara</th>
                        </tr>
                        <tr className="text-[10px] bg-slate-800 border-t border-slate-700">
                          <th className="py-2 px-2.5 text-right w-14 border-r border-slate-700/60">Laki</th>
                          <th className="py-2 px-2.5 text-right w-14 border-r border-slate-700/60">Peremp</th>
                          <th className="py-2 px-2.5 text-right w-16 border-r border-slate-700 bg-slate-800">Total DPT</th>
                          <th className="py-2 px-2 text-right w-14 border-r border-slate-700/60">DPT</th>
                          <th className="py-2 px-2 text-right w-12 border-r border-slate-700/60">DPTb</th>
                          <th className="py-2 px-2 text-right w-12 border-r border-slate-700/60">DPK</th>
                          <th className="py-2 px-2.5 text-right w-16 border-r border-slate-700 bg-emerald-900/60 text-white">Jumlah</th>
                          <th className="py-2 px-2.5 text-right w-16 border-r border-slate-700/60">Diterima</th>
                          <th className="py-2 px-2.5 text-right w-16 text-sky-300 border-r border-slate-700/60">Sah</th>
                          <th className="py-2 px-2 text-right w-14 text-rose-300 border-r border-slate-700/60">Tdk Sah</th>
                          <th className="py-2 px-2.5 text-right w-16 font-bold border-r border-slate-700/60">Jml Suara</th>
                          <th className="py-2 px-2 text-right w-12 text-amber-300 border-r border-slate-700/60">Rusak</th>
                          <th className="py-2 px-2.5 text-right w-16 text-stone-300">Sisa</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-200/80 bg-white/70 font-mono text-[11px]">
                        {(currentData.tpsRekapDetail || []).map((row, idx) => (
                          <tr key={idx} className="hover:bg-emerald-50/60 transition-colors">
                            <td className="py-2 px-3 text-center font-bold text-emerald-900 bg-emerald-50/40 border-r border-stone-200 sticky left-0 z-10 whitespace-nowrap">
                              {row.tps}
                            </td>
                            <td className="py-2 px-2.5 text-right text-sky-900 border-r border-stone-200/60 whitespace-nowrap">{formatNum(row.dptL)}</td>
                            <td className="py-2 px-2.5 text-right text-rose-900 border-r border-stone-200/60 whitespace-nowrap">{formatNum(row.dptP)}</td>
                            <td className="py-2 px-2.5 text-right font-bold text-slate-900 border-r border-stone-200 bg-stone-50 whitespace-nowrap">
                              {formatNum(row.dptTotal)}
                            </td>
                            <td className="py-2 px-2 text-right text-slate-800 border-r border-stone-200/60 whitespace-nowrap">{formatNum(row.penggunaDpt)}</td>
                            <td className="py-2 px-2 text-right text-stone-500 border-r border-stone-200/60 whitespace-nowrap">{row.penggunaDptb ? row.penggunaDptb : '0'}</td>
                            <td className="py-2 px-2 text-right text-emerald-700 font-bold border-r border-stone-200/60 whitespace-nowrap">{row.penggunaDpk > 0 ? row.penggunaDpk : '0'}</td>
                            <td className="py-2 px-2.5 text-right font-bold text-emerald-950 bg-emerald-50/60 border-r border-stone-200 whitespace-nowrap">
                              {formatNum(row.penggunaTotal)}
                            </td>
                            <td className="py-2 px-2.5 text-right text-slate-800 border-r border-stone-200/60 whitespace-nowrap">{formatNum(row.ssDiterima)}</td>
                            <td className="py-2 px-2.5 text-right font-bold text-sky-900 bg-sky-50/30 border-r border-stone-200/60 whitespace-nowrap">{formatNum(row.ssSah)}</td>
                            <td className="py-2 px-2 text-right text-rose-800 bg-rose-50/30 border-r border-stone-200/60 whitespace-nowrap">{formatNum(row.ssTidakSah)}</td>
                            <td className="py-2 px-2.5 text-right font-bold text-slate-950 border-r border-stone-200/60 whitespace-nowrap">{formatNum(row.ssSah + row.ssTidakSah)}</td>
                            <td className="py-2 px-2 text-right text-amber-800 border-r border-stone-200/60 whitespace-nowrap">{row.ssRusak > 0 ? row.ssRusak : '0'}</td>
                            <td className="py-2 px-2.5 text-right text-stone-600 whitespace-nowrap">{formatNum(row.ssTidakDigunakan)}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-slate-900 text-white font-bold sticky bottom-0 z-20 font-mono text-[11px] shadow-[0_-4px_14px_rgba(0,0,0,0.2)] border-t-2 border-emerald-500">
                        <tr>
                          <td className="py-3 px-3 uppercase text-center font-sans tracking-wider text-amber-300 sticky left-0 bg-slate-900 z-30 border-r border-slate-700 whitespace-nowrap">
                            TOTAL SAMPELDES
                          </td>
                          <td className="py-3 px-2.5 text-right text-sky-300 border-r border-slate-800 whitespace-nowrap">3.046</td>
                          <td className="py-3 px-2.5 text-right text-rose-300 border-r border-slate-800 whitespace-nowrap">2.980</td>
                          <td className="py-3 px-2.5 text-right text-teal-400 font-black border-r border-slate-700 whitespace-nowrap">6.026</td>
                          <td className="py-3 px-2 text-right border-r border-slate-800 whitespace-nowrap">4.342</td>
                          <td className="py-3 px-2 text-right text-stone-400 border-r border-slate-800 whitespace-nowrap">0</td>
                          <td className="py-3 px-2 text-right text-emerald-300 border-r border-slate-800 whitespace-nowrap">20</td>
                          <td className="py-3 px-2.5 text-right text-teal-400 font-black border-r border-slate-700 whitespace-nowrap">4.362</td>
                          <td className="py-3 px-2.5 text-right border-r border-slate-800 whitespace-nowrap">6.162</td>
                          <td className="py-3 px-2.5 text-right text-sky-300 font-black border-r border-slate-800 whitespace-nowrap">4.056</td>
                          <td className="py-3 px-2 text-right text-rose-300 font-black border-r border-slate-800 whitespace-nowrap">306</td>
                          <td className="py-3 px-2.5 text-right font-black border-r border-slate-800 whitespace-nowrap">4.362</td>
                          <td className="py-3 px-2 text-right text-amber-300 font-black border-r border-slate-800 whitespace-nowrap">1</td>
                          <td className="py-3 px-2.5 text-right text-stone-300 font-black whitespace-nowrap">1.799</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* ── KONTEN KHUSUS PILKADA 2024 (BUPATI CILACAP & GUBERNUR JATENG) ── */}
            {activeTab === 'pilkada' && (
              <div className="space-y-4">
                {/* 1. SUB-TAB PEMILIHAN BUPATI CILACAP */}
                {pilkadaSubTab === 'pilbup' && (
                  <div className="space-y-4">
                    {/* Header Banner & View Toggle */}
                    <div className="neu-card-elevated p-4 sm:p-5 rounded-2xl border border-white/80 flex flex-col md:flex-row md:items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <Badge className="bg-amber-100 text-amber-950 border-amber-300 text-[10px] font-bold">
                            PILKADA KABUPATEN CILACAP 2024
                          </Badge>
                          <span className="text-xs text-stone-500 font-mono">Kecamatan Gandrungmangu</span>
                        </div>
                        <h4 className="font-condensed font-black uppercase text-slate-900 text-base sm:text-lg mt-0.5">
                          Pemilihan Bupati &amp; Wakil Bupati Cilacap
                        </h4>
                        <p className="text-xs text-stone-600">
                          Hasil perolehan suara 4 pasangan calon di Desa Sampeldes dan rekapitulasi pleno 14 Desa se-Kecamatan Gandrungmangu (172 TPS Masuk 100%)
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant={pilbupViewMode === 'cards' ? 'default' : 'outline'}
                          onClick={() => setPilbupViewMode('cards')}
                          className={cn(
                            'h-8 px-3 text-xs font-condensed font-bold uppercase',
                            pilbupViewMode === 'cards' ? 'bg-slate-900 text-white' : 'bg-white/80'
                          )}
                        >
                          <LayoutGrid className="h-3.5 w-3.5 mr-1" />
                          Ringkasan 4 Paslon
                        </Button>
                        <Button
                          size="sm"
                          variant={pilbupViewMode === 'table' ? 'default' : 'outline'}
                          onClick={() => setPilbupViewMode('table')}
                          className={cn(
                            'h-8 px-3 text-xs font-condensed font-bold uppercase',
                            pilbupViewMode === 'table' ? 'bg-slate-900 text-white' : 'bg-white/80'
                          )}
                        >
                          <TableIcon className="h-3.5 w-3.5 mr-1" />
                          Tabel 14 Desa se-Kecamatan
                        </Button>
                      </div>
                    </div>

                    {pilbupViewMode === 'cards' ? (
                      /* KARTU 4 PASLON BUPATI CILACAP */
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {(currentData.rekapitulasiList || []).map((paslon, idx) => {
                          const badgeColors = [
                            'bg-red-600 text-white',
                            'bg-blue-600 text-white',
                            'bg-emerald-600 text-white',
                            'bg-amber-600 text-white',
                          ];
                          const kecVotes = [3300, 7227, 20322, 19533];
                          const kecPct = ['6,5%', '14,3%', '40,3%', '38,8%'];

                          return (
                            <div
                              key={paslon.id || idx}
                              className={cn(
                                'neu-card-elevated p-5 rounded-2xl border transition-all relative overflow-hidden flex flex-col justify-between space-y-3',
                                paslon.isPemenang ? 'border-emerald-500 ring-2 ring-emerald-400/40 bg-emerald-50/20' : 'border-white/80'
                              )}
                            >
                              {paslon.isPemenang && (
                                <div className="absolute top-0 right-0 bg-emerald-600 text-white font-bold text-[10px] font-mono px-3 py-1 rounded-bl-xl shadow-xs uppercase tracking-wider flex items-center gap-1">
                                  <Award className="h-3 w-3" />
                                  <span>Suara Terbanyak</span>
                                </div>
                              )}

                              <div className="space-y-2">
                                <div className="flex items-center gap-2.5">
                                  <div className={cn(
                                    'w-10 h-10 rounded-xl flex items-center justify-center font-mono font-black text-lg shrink-0 shadow-sm',
                                    badgeColors[idx % 4]
                                  )}>
                                    0{paslon.nomorUrut}
                                  </div>
                                  <div className="min-w-0">
                                    <span className="text-[10px] font-mono font-bold text-stone-500 uppercase">
                                      Paslon 0{paslon.nomorUrut}
                                    </span>
                                    <h4 className="font-condensed font-black uppercase text-slate-900 text-xs sm:text-sm leading-tight line-clamp-2">
                                      {paslon.namaKandidat}
                                    </h4>
                                  </div>
                                </div>

                                {paslon.namaWakil && (
                                  <p className="text-xs text-stone-700 font-medium">
                                    Wakil: <span className="text-slate-900 font-bold">{paslon.namaWakil}</span>
                                  </p>
                                )}

                                {paslon.keterangan && (
                                  <p className="text-[11px] text-stone-500 line-clamp-2 italic leading-relaxed">
                                    {paslon.keterangan}
                                  </p>
                                )}
                              </div>

                              <div className="pt-2 border-t border-stone-200 space-y-2">
                                <div>
                                  <div className="flex justify-between items-baseline">
                                    <span className="text-[11px] text-stone-500 font-bold uppercase">Suara Sampeldes:</span>
                                    <span className="text-lg font-mono font-black text-slate-950">
                                      {formatNum(paslon.perolehanSuara)} <span className="text-xs font-sans font-bold text-stone-500">Suara</span>
                                    </span>
                                  </div>
                                  <div className="w-full h-2 rounded-full bg-stone-200 overflow-hidden mt-1">
                                    <div
                                      className={cn('h-full', paslon.isPemenang ? 'bg-emerald-600' : 'bg-slate-700')}
                                      style={{ width: `${paslon.persentase || 0}%` }}
                                    />
                                  </div>
                                  <div className="flex justify-between text-[10px] font-mono font-bold text-stone-600 mt-0.5">
                                    <span>Porsi Sampeldes:</span>
                                    <span className={paslon.isPemenang ? 'text-emerald-800' : 'text-slate-800'}>
                                      {paslon.persentase}%
                                    </span>
                                  </div>
                                </div>

                                <div className="p-2 rounded-lg bg-stone-100/90 text-[10px] font-mono flex justify-between items-center text-stone-700">
                                  <span>Total Kecamatan:</span>
                                  <span className="font-bold text-slate-900">
                                    {formatNum(kecVotes[idx])} ({kecPct[idx]})
                                  </span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      /* TABEL 14 DESA SE-KECAMATAN GANDRUNGMANGU (SESUAI GAMBAR 1) */
                      <div className="neu-card-elevated rounded-2xl overflow-hidden border border-white/80 shadow-sm">
                        <div className="p-3.5 bg-[#3e2723] text-white flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-mono">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge variant="outline" className="bg-amber-400/20 text-amber-300 border-amber-400/50 text-[10px] font-bold">
                              DATA RESMI REKAPITULASI
                            </Badge>
                            <span className="font-bold uppercase tracking-wider text-sm text-[#fff8e1]">
                              PEMILIHAN BUPATI CILACAP (14 DESA SE-KECAMATAN GANDRUNGMANGU)
                            </span>
                          </div>
                          <div className="text-amber-200 text-[11px]">
                            172 TPS Masuk 100% • DPT Kec: 85.539 • Hadir: 52.927 (61,9%)
                          </div>
                        </div>

                        <div className="overflow-x-auto max-h-[550px] relative scrollbar-thin">
                          <table className="w-full text-xs text-left border-collapse">
                            <thead className="bg-[#4a2e18] text-white font-condensed font-bold uppercase tracking-wider text-[11px] sticky top-0 z-20 shadow-xs">
                              <tr>
                                <th rowSpan={2} className="py-2.5 px-3 text-center border-r border-[#5d3a1e] sticky left-0 bg-[#4a2e18] z-30 w-12">
                                  NO
                                </th>
                                <th rowSpan={2} className="py-2.5 px-3 border-r border-[#5d3a1e] sticky left-12 bg-[#4a2e18] z-30 min-w-[150px]">
                                  DESA
                                </th>
                                <th colSpan={2} className="py-1 px-2 text-center border-r border-red-700 bg-[#e53935] text-white">
                                  1
                                </th>
                                <th colSpan={2} className="py-1 px-2 text-center border-r border-blue-700 bg-[#1e88e5] text-white">
                                  2
                                </th>
                                <th colSpan={2} className="py-1 px-2 text-center border-r border-emerald-700 bg-[#43a047] text-white">
                                  3
                                </th>
                                <th colSpan={2} className="py-1 px-2 text-center border-r border-orange-700 bg-[#fb8c00] text-white">
                                  4
                                </th>
                                <th rowSpan={2} className="py-2.5 px-2.5 text-right border-r border-[#5d3a1e] min-w-[70px]">
                                  TDK SAH
                                </th>
                                <th rowSpan={2} className="py-2.5 px-2.5 text-right border-r border-[#5d3a1e] min-w-[75px]">
                                  SAH
                                </th>
                                <th rowSpan={2} className="py-2.5 px-2 text-center border-r border-[#5d3a1e] min-w-[65px]">
                                  TPS MASUK
                                </th>
                                <th rowSpan={2} className="py-2.5 px-2 text-center border-r border-[#5d3a1e] min-w-[65px]">
                                  % TPS MSK
                                </th>
                                <th rowSpan={2} className="py-2.5 px-2 text-center border-r border-[#5d3a1e] min-w-[50px]">
                                  TPS
                                </th>
                                <th rowSpan={2} className="py-2.5 px-2.5 text-right border-r border-[#5d3a1e] min-w-[75px]">
                                  DPT
                                </th>
                                <th rowSpan={2} className="py-2.5 px-2.5 text-right border-r border-[#5d3a1e] min-w-[75px] bg-[#3e2723] text-amber-200">
                                  Hadir
                                </th>
                                <th rowSpan={2} className="py-2.5 px-2 text-center min-w-[65px] bg-[#3e2723] text-teal-400">
                                  % Hadir
                                </th>
                              </tr>
                              <tr className="text-[10px]">
                                <th className="py-1 px-2 text-right bg-[#c62828] text-white w-14">Jml</th>
                                <th className="py-1 px-1.5 text-center bg-[#b71c1c] text-white border-r border-red-900 w-12">%1</th>
                                <th className="py-1 px-2 text-right bg-[#1565c0] text-white w-14">Jml</th>
                                <th className="py-1 px-1.5 text-center bg-[#0d47a1] text-white border-r border-blue-900 w-12">%2</th>
                                <th className="py-1 px-2 text-right bg-[#2e7d32] text-white w-14">Jml</th>
                                <th className="py-1 px-1.5 text-center bg-[#1b5e20] text-white border-r border-emerald-900 w-12">%3</th>
                                <th className="py-1 px-2 text-right bg-[#ef6c00] text-white w-14">Jml</th>
                                <th className="py-1 px-1.5 text-center bg-[#e65100] text-white border-r border-orange-900 w-12">%4</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-stone-200/80 bg-white/70 font-mono text-[11px]">
                              {(currentData.pilkadaBupatiDesaList || HASIL_PILBUP_CILACAP_KECAMATAN).map((row) => {
                                const isSampeldes = row.namaDesa === 'SAMPELDES';
                                return (
                                  <tr
                                    key={row.no}
                                    className={cn(
                                      'transition-colors',
                                      isSampeldes
                                        ? 'bg-amber-100/90 font-bold border-y-2 border-amber-500 text-slate-950'
                                        : 'hover:bg-stone-100/80'
                                    )}
                                  >
                                    <td className={cn(
                                      'py-2 px-3 text-center border-r border-stone-200 sticky left-0 z-10 whitespace-nowrap',
                                      isSampeldes ? 'bg-amber-100 font-black' : 'bg-white/95 text-stone-600'
                                    )}>
                                      {row.no}
                                    </td>
                                    <td className={cn(
                                      'py-2 px-3 font-sans font-bold border-r border-stone-200 sticky left-12 z-10 whitespace-nowrap',
                                      isSampeldes ? 'bg-amber-100 text-emerald-950' : 'bg-white/95 text-slate-900'
                                    )}>
                                      <span>{row.namaDesa}</span>
                                      {isSampeldes && (
                                        <Badge className="ml-1.5 bg-emerald-700 text-white text-[9px] px-1 py-0 uppercase">
                                          Desa Kita
                                        </Badge>
                                      )}
                                    </td>
                                    <td className="py-2 px-2 text-right text-red-900 whitespace-nowrap">{formatNum(row.paslon1)}</td>
                                    <td className="py-2 px-1.5 text-center text-stone-600 border-r border-stone-200 text-[10px] whitespace-nowrap">{row.persen1}%</td>
                                    <td className="py-2 px-2 text-right text-blue-900 whitespace-nowrap">{formatNum(row.paslon2)}</td>
                                    <td className="py-2 px-1.5 text-center text-stone-600 border-r border-stone-200 text-[10px] whitespace-nowrap">{row.persen2}%</td>
                                    <td className="py-2 px-2 text-right text-emerald-900 font-bold bg-emerald-50/40 whitespace-nowrap">{formatNum(row.paslon3)}</td>
                                    <td className="py-2 px-1.5 text-center text-emerald-700 font-bold border-r border-stone-200 text-[10px] bg-emerald-50/40 whitespace-nowrap">{row.persen3}%</td>
                                    <td className="py-2 px-2 text-right text-orange-900 whitespace-nowrap">{formatNum(row.paslon4)}</td>
                                    <td className="py-2 px-1.5 text-center text-stone-600 border-r border-stone-200 text-[10px] whitespace-nowrap">{row.persen4}%</td>
                                    <td className="py-2 px-2.5 text-right text-stone-600 border-r border-stone-200 whitespace-nowrap">{formatNum(row.tdkSah)}</td>
                                    <td className="py-2 px-2.5 text-right font-bold text-slate-900 border-r border-stone-200 whitespace-nowrap">{formatNum(row.sah)}</td>
                                    <td className="py-2 px-2 text-center text-stone-700 border-r border-stone-200 whitespace-nowrap">{row.tpsMasuk}</td>
                                    <td className="py-2 px-2 text-center text-stone-700 border-r border-stone-200 whitespace-nowrap">{row.persenTpsMsk}%</td>
                                    <td className="py-2 px-2 text-center text-stone-700 border-r border-stone-200 whitespace-nowrap">{row.tps}</td>
                                    <td className="py-2 px-2.5 text-right text-slate-800 border-r border-stone-200 whitespace-nowrap">{formatNum(row.dpt)}</td>
                                    <td className={cn(
                                      'py-2 px-2.5 text-right font-bold border-r border-stone-200 whitespace-nowrap',
                                      isSampeldes ? 'text-emerald-950 font-black' : 'text-slate-950 bg-stone-50'
                                    )}>
                                      {formatNum(row.hadir)}
                                    </td>
                                    <td className={cn(
                                      'py-2 px-2 text-center font-bold whitespace-nowrap',
                                      isSampeldes ? 'text-emerald-900 font-black' : 'text-stone-800'
                                    )}>
                                      {row.persenHadir}%
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                            <tfoot className="bg-[#3e2723] text-white font-bold sticky bottom-0 z-20 font-mono text-[11px] border-t-2 border-amber-500 shadow-[0_-4px_14px_rgba(0,0,0,0.2)]">
                              <tr>
                                <td colSpan={2} className="py-3 px-3 uppercase text-center font-sans sticky left-0 bg-[#3e2723] z-30 border-r border-[#5d3a1e] tracking-wider text-amber-200 whitespace-nowrap">
                                  JUMLAH KECAMATAN
                                </td>
                                <td className="py-3 px-2 text-right text-red-200 font-black bg-[#c62828] whitespace-nowrap">3.300</td>
                                <td className="py-3 px-1.5 text-center text-red-100 bg-[#b71c1c] border-r border-red-900 whitespace-nowrap">6,5%</td>
                                <td className="py-3 px-2 text-right text-blue-200 font-black bg-[#1565c0] whitespace-nowrap">7.227</td>
                                <td className="py-3 px-1.5 text-center text-blue-100 bg-[#0d47a1] border-r border-blue-900 whitespace-nowrap">14,3%</td>
                                <td className="py-3 px-2 text-right text-emerald-200 font-black bg-[#2e7d32] whitespace-nowrap">20.322</td>
                                <td className="py-3 px-1.5 text-center text-emerald-100 bg-[#1b5e20] border-r border-emerald-900 whitespace-nowrap">40,3%</td>
                                <td className="py-3 px-2 text-right text-orange-200 font-black bg-[#ef6c00] whitespace-nowrap">19.533</td>
                                <td className="py-3 px-1.5 text-center text-orange-100 bg-[#e65100] border-r border-orange-900 whitespace-nowrap">38,8%</td>
                                <td className="py-3 px-2.5 text-right text-stone-200 border-r border-[#5d3a1e] whitespace-nowrap">2.545</td>
                                <td className="py-3 px-2.5 text-right text-emerald-300 font-black border-r border-[#5d3a1e] whitespace-nowrap">50.382</td>
                                <td className="py-3 px-2 text-center text-stone-200 border-r border-[#5d3a1e] whitespace-nowrap">172</td>
                                <td className="py-3 px-2 text-center text-emerald-300 border-r border-[#5d3a1e] whitespace-nowrap">100%</td>
                                <td className="py-3 px-2 text-center text-stone-200 border-r border-[#5d3a1e] whitespace-nowrap">172</td>
                                <td className="py-3 px-2.5 text-right text-stone-200 border-r border-[#5d3a1e] whitespace-nowrap">85.539</td>
                                <td className="py-3 px-2.5 text-right text-teal-400 font-black border-r border-[#5d3a1e] whitespace-nowrap">52.927</td>
                                <td className="py-3 px-2 text-center text-teal-400 font-black whitespace-nowrap">61,9%</td>
                              </tr>
                            </tfoot>
                          </table>
                        </div>
                      </div>
                    )}

                    {/* Ringkasan Angka Rekapitulasi Desa Sampeldes (Bupati) */}
                    <div className="p-4 rounded-2xl neu-inset border border-stone-300/60 grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                      <div>
                        <span className="text-[10px] text-stone-500 font-bold uppercase block">Total Hak Pilih (DPT Sampeldes)</span>
                        <span className="font-mono font-black text-slate-900 text-sm sm:text-base">6.116</span>
                        <span className="text-[9px] text-stone-400 block font-mono">12 TPS (100% Masuk)</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-stone-500 font-bold uppercase block">Pengguna Hak Pilih (Hadir)</span>
                        <span className="font-mono font-black text-emerald-900 text-sm sm:text-base">3.932</span>
                        <span className="text-[9px] text-emerald-700 block font-mono">Partisipasi 64,3%</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-stone-500 font-bold uppercase block">Suara Sah (Bupati)</span>
                        <span className="font-mono font-black text-sky-900 text-sm sm:text-base">3.750</span>
                        <span className="text-[9px] text-sky-700 block font-mono">95,4% dari Suara Hadir</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-stone-500 font-bold uppercase block">Suara Tidak Sah</span>
                        <span className="font-mono font-black text-rose-900 text-sm sm:text-base">182</span>
                        <span className="text-[9px] text-rose-700 block font-mono">4,6% dari Suara Hadir</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* 2. SUB-TAB PEMILIHAN GUBERNUR JAWA TENGAH */}
                {pilkadaSubTab === 'pilgub' && (
                  <div className="space-y-4">
                    {/* Header Banner & View Toggle */}
                    <div className="neu-card-elevated p-4 sm:p-5 rounded-2xl border border-white/80 flex flex-col md:flex-row md:items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <Badge className="bg-sky-100 text-sky-950 border-sky-300 text-[10px] font-bold">
                            PILKADA PROVINSI JAWA TENGAH 2024
                          </Badge>
                          <span className="text-xs text-stone-500 font-mono">Desa Sampeldes (12 TPS)</span>
                        </div>
                        <h4 className="font-condensed font-black uppercase text-slate-900 text-base sm:text-lg mt-0.5">
                          Pemilihan Gubernur &amp; Wakil Gubernur Jawa Tengah
                        </h4>
                        <p className="text-xs text-stone-600">
                          Hasil perolehan suara 2 pasangan calon di Desa Sampeldes berdasarkan rincian resmi TPS 1 s/d TPS 12 (100% Masuk)
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant={pilgubViewMode === 'cards' ? 'default' : 'outline'}
                          onClick={() => setPilgubViewMode('cards')}
                          className={cn(
                            'h-8 px-3 text-xs font-condensed font-bold uppercase',
                            pilgubViewMode === 'cards' ? 'bg-slate-900 text-white' : 'bg-white/80'
                          )}
                        >
                          <LayoutGrid className="h-3.5 w-3.5 mr-1" />
                          Ringkasan 2 Paslon
                        </Button>
                        <Button
                          size="sm"
                          variant={pilgubViewMode === 'table' ? 'default' : 'outline'}
                          onClick={() => setPilgubViewMode('table')}
                          className={cn(
                            'h-8 px-3 text-xs font-condensed font-bold uppercase',
                            pilgubViewMode === 'table' ? 'bg-slate-900 text-white' : 'bg-white/80'
                          )}
                        >
                          <TableIcon className="h-3.5 w-3.5 mr-1" />
                          Tabel 12 TPS Sampeldes
                        </Button>
                      </div>
                    </div>

                    {pilgubViewMode === 'cards' ? (
                      /* KARTU 2 PASLON GUBERNUR JATENG */
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {(currentData.rekapitulasiPilgubList || HASIL_PILGUB_SAMPELDES_PASLON).map((paslon, idx) => {
                          const isP1 = paslon.nomorUrut === 1;
                          return (
                            <div
                              key={paslon.id || idx}
                              className={cn(
                                'neu-card-elevated p-6 rounded-2xl border transition-all relative overflow-hidden flex flex-col justify-between space-y-4',
                                paslon.isPemenang ? 'border-blue-500 ring-2 ring-blue-400/40 bg-blue-50/20' : 'border-white/80'
                              )}
                            >
                              {paslon.isPemenang && (
                                <div className="absolute top-0 right-0 bg-blue-600 text-white font-bold text-[10px] font-mono px-3 py-1 rounded-bl-xl shadow-xs uppercase tracking-wider flex items-center gap-1">
                                  <Award className="h-3 w-3" />
                                  <span>Suara Terbanyak</span>
                                </div>
                              )}

                              <div className="space-y-3">
                                <div className="flex items-center gap-3">
                                  <div className={cn(
                                    'w-12 h-12 rounded-xl flex items-center justify-center font-mono font-black text-xl shrink-0 shadow-sm text-white',
                                    isP1 ? 'bg-red-600' : 'bg-blue-600'
                                  )}>
                                    0{paslon.nomorUrut}
                                  </div>
                                  <div className="min-w-0">
                                    <span className="text-[10px] font-mono font-bold text-stone-500 uppercase">
                                      Pasangan Calon 0{paslon.nomorUrut}
                                    </span>
                                    <h4 className="font-condensed font-black uppercase text-slate-900 text-sm sm:text-base leading-tight line-clamp-2">
                                      {paslon.namaKandidat}
                                    </h4>
                                  </div>
                                </div>

                                {paslon.namaWakil && (
                                  <p className="text-xs text-stone-700 font-medium">
                                    Wakil: <span className="text-slate-900 font-bold">{paslon.namaWakil}</span>
                                  </p>
                                )}

                                {paslon.keterangan && (
                                  <p className="text-xs text-stone-500 italic leading-relaxed">
                                    {paslon.keterangan}
                                  </p>
                                )}
                              </div>

                              <div className="pt-3 border-t border-stone-200 space-y-2">
                                <div className="flex justify-between items-baseline">
                                  <span className="text-xs text-stone-500 font-bold uppercase">Perolehan Suara:</span>
                                  <span className="text-2xl font-mono font-black text-slate-950">
                                    {formatNum(paslon.perolehanSuara)} <span className="text-xs font-sans font-bold text-stone-500">Suara</span>
                                  </span>
                                </div>

                                <div className="w-full h-3 rounded-full bg-stone-200 overflow-hidden">
                                  <div
                                    className={cn('h-full', isP1 ? 'bg-red-600' : 'bg-blue-600')}
                                    style={{ width: `${paslon.persentase || 0}%` }}
                                  />
                                </div>

                                <div className="flex justify-between text-xs font-mono font-bold text-stone-700">
                                  <span>Persentase Suara Sah:</span>
                                  <span className={isP1 ? 'text-red-700' : 'text-blue-700'}>
                                    {paslon.persentase}% ({formatNum(paslon.perolehanSuara)} / 3.773)
                                  </span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      /* TABEL RINCIAN 12 TPS DESA SAMPELDES (SESUAI GAMBAR 2) */
                      <div className="neu-card-elevated rounded-2xl overflow-hidden border border-white/80 shadow-sm">
                        <div className="p-3.5 bg-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-mono">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge variant="outline" className="bg-sky-400/20 text-sky-300 border-sky-400/50 text-[10px] font-bold">
                              DATA FORM HASIL TPS
                            </Badge>
                            <span className="font-bold uppercase tracking-wider text-sm text-white">
                              PEMILIHAN GUBERNUR JAWA TENGAH (RINCIAN TPS DESA SAMPELDES)
                            </span>
                          </div>
                          <div className="text-stone-300 text-[11px]">
                            Kecamatan: GANDRUNGMANGU • Desa: SAMPELDES • Total: 12 TPS
                          </div>
                        </div>

                        <div className="overflow-x-auto max-h-[550px] relative scrollbar-thin">
                          <table className="w-full text-xs text-left border-collapse">
                            <thead className="bg-slate-800 text-white font-condensed font-bold uppercase tracking-wider text-[11px] sticky top-0 z-20 shadow-xs">
                              <tr>
                                <th className="py-2.5 px-3 border-r border-slate-700 min-w-[130px]">KECAMATAN</th>
                                <th className="py-2.5 px-3 border-r border-slate-700 min-w-[110px]">DESA</th>
                                <th className="py-2.5 px-3 text-center border-r border-slate-700 min-w-[80px]">TPS</th>
                                <th className="py-2.5 px-3 text-right border-r border-slate-700 min-w-[80px]">DPT</th>
                                <th className="py-2.5 px-3 text-right border-r border-slate-700 min-w-[100px] bg-red-700 text-white">
                                  Paslon 1
                                </th>
                                <th className="py-2.5 px-3 text-right border-r border-slate-700 min-w-[100px] bg-blue-700 text-white">
                                  Paslon 2
                                </th>
                                <th className="py-2.5 px-3 text-right border-r border-slate-700 min-w-[90px]">Tidak Sah</th>
                                <th className="py-2.5 px-3 text-right border-r border-slate-700 min-w-[100px] font-bold">Total Suara</th>
                                <th className="py-2.5 px-2.5 text-center border-r border-slate-700 min-w-[70px]">Status</th>
                                <th className="py-2.5 px-3 text-right min-w-[100px] bg-emerald-950 text-teal-400">
                                  Kehadiran (%)
                                </th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-stone-200/80 bg-white/70 font-mono text-[11px]">
                              {(currentData.pilgubTpsList || HASIL_PILGUB_TPS_SAMPELDES).map((row, idx) => (
                                <tr key={idx} className="hover:bg-sky-50/60 transition-colors">
                                  <td className="py-2 px-3 text-stone-600 font-sans border-r border-stone-200 whitespace-nowrap">{row.kecamatan}</td>
                                  <td className="py-2 px-3 font-sans font-bold text-slate-800 border-r border-stone-200 whitespace-nowrap">{row.desa}</td>
                                  <td className="py-2 px-3 text-center font-bold text-sky-950 bg-sky-50/40 border-r border-stone-200 whitespace-nowrap">{row.nomorTps}</td>
                                  <td className="py-2 px-3 text-right font-bold text-slate-800 border-r border-stone-200 whitespace-nowrap">{formatNum(row.dpt)}</td>
                                  <td className="py-2 px-3 text-right text-red-900 font-bold bg-red-50/40 border-r border-stone-200 whitespace-nowrap">{formatNum(row.paslon1)}</td>
                                  <td className="py-2 px-3 text-right text-blue-900 font-bold bg-blue-50/40 border-r border-stone-200 whitespace-nowrap">{formatNum(row.paslon2)}</td>
                                  <td className="py-2 px-3 text-right text-stone-600 border-r border-stone-200 whitespace-nowrap">{formatNum(row.tidakSah)}</td>
                                  <td className="py-2 px-3 text-right font-black text-slate-950 border-r border-stone-200 whitespace-nowrap">{formatNum(row.totalSuara)}</td>
                                  <td className="py-2 px-2.5 text-center border-r border-stone-200 whitespace-nowrap">
                                    <Badge variant="outline" className="bg-emerald-50 text-emerald-800 border-emerald-300 text-[9px] px-1.5 py-0 font-bold">
                                      {row.status === 1 ? '1' : row.status}
                                    </Badge>
                                  </td>
                                  <td className="py-2 px-3 text-right font-black text-emerald-950 bg-emerald-50/50 whitespace-nowrap">
                                    {row.kehadiran}%
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                            <tfoot className="bg-slate-900 text-white font-bold sticky bottom-0 z-20 font-mono text-[11px] border-t-2 border-sky-400 shadow-[0_-4px_14px_rgba(0,0,0,0.2)]">
                              <tr>
                                <td colSpan={3} className="py-3 px-3 uppercase text-center font-sans tracking-wider text-sky-300 border-r border-slate-700 whitespace-nowrap">
                                  TOTAL DESA SAMPELDES (12 TPS)
                                </td>
                                <td className="py-3 px-3 text-right text-stone-200 border-r border-slate-700 whitespace-nowrap">6.116</td>
                                <td className="py-3 px-3 text-right text-red-200 font-black bg-red-900 border-r border-slate-700 whitespace-nowrap">1.319 (35,0%)</td>
                                <td className="py-3 px-3 text-right text-blue-200 font-black bg-blue-900 border-r border-slate-700 whitespace-nowrap">2.454 (65,0%)</td>
                                <td className="py-3 px-3 text-right text-stone-200 border-r border-slate-700 whitespace-nowrap">159</td>
                                <td className="py-3 px-3 text-right text-white font-black border-r border-slate-700 whitespace-nowrap">3.932</td>
                                <td className="py-3 px-2.5 text-center text-emerald-300 border-r border-slate-700 whitespace-nowrap">12 / 12</td>
                                <td className="py-3 px-3 text-right text-teal-400 font-black text-xs whitespace-nowrap">64,29%</td>
                              </tr>
                            </tfoot>
                          </table>
                        </div>
                      </div>
                    )}

                    {/* Ringkasan Angka Rekapitulasi Desa Sampeldes (Gubernur) */}
                    <div className="p-4 rounded-2xl neu-inset border border-stone-300/60 grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                      <div>
                        <span className="text-[10px] text-stone-500 font-bold uppercase block">Total Hak Pilih (DPT Sampeldes)</span>
                        <span className="font-mono font-black text-slate-900 text-sm sm:text-base">6.116</span>
                        <span className="text-[9px] text-stone-400 block font-mono">12 TPS (100% Masuk)</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-stone-500 font-bold uppercase block">Pengguna Hak Pilih (Hadir)</span>
                        <span className="font-mono font-black text-emerald-900 text-sm sm:text-base">3.932</span>
                        <span className="text-[9px] text-emerald-700 block font-mono">Partisipasi 64,29%</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-stone-500 font-bold uppercase block">Suara Sah (Gubernur)</span>
                        <span className="font-mono font-black text-sky-900 text-sm sm:text-base">3.773</span>
                        <span className="text-[9px] text-sky-700 block font-mono">95,96% dari Suara Hadir</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-stone-500 font-bold uppercase block">Suara Tidak Sah</span>
                        <span className="font-mono font-black text-rose-900 text-sm sm:text-base">159</span>
                        <span className="text-[9px] text-rose-700 block font-mono">4,04% dari Suara Hadir</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── KONTEN KHUSUS PILKADES ── */}
            {activeTab === 'pilkades' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {(currentData.rekapitulasiList || []).map((paslon, idx) => (
                    <div
                      key={paslon.id || idx}
                      className={cn(
                        'neu-card-elevated p-5 sm:p-6 rounded-2xl border transition-all relative overflow-hidden flex flex-col justify-between',
                        paslon.isPemenang ? 'border-amber-400 ring-2 ring-amber-400/30' : 'border-white/80'
                      )}
                    >
                      {paslon.isPemenang && (
                        <div className="absolute top-0 right-0 bg-amber-400 text-slate-950 font-bold text-[10px] font-mono px-3 py-1 rounded-bl-xl shadow-xs uppercase tracking-wider flex items-center gap-1">
                          <Award className="h-3 w-3" />
                          <span>Suara Terbanyak</span>
                        </div>
                      )}

                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-mono font-black text-lg shrink-0 shadow-sm">
                            0{paslon.nomorUrut}
                          </div>
                          <div className="min-w-0">
                            <span className="text-[10px] font-mono font-bold text-stone-500 uppercase">Nomor Urut 0{paslon.nomorUrut}</span>
                            <h4 className="font-condensed font-bold uppercase text-slate-900 text-sm sm:text-base leading-tight truncate">
                              {paslon.namaKandidat}
                            </h4>
                          </div>
                        </div>

                        {paslon.namaWakil && (
                          <p className="text-xs text-stone-600 font-semibold">
                            Wakil: <span className="text-slate-800 font-bold">{paslon.namaWakil}</span>
                          </p>
                        )}

                        {paslon.keterangan && (
                          <p className="text-[11px] text-stone-500 line-clamp-2 italic leading-relaxed">
                            {paslon.keterangan}
                          </p>
                        )}
                      </div>

                      <div className="mt-4 pt-3 border-t border-stone-200 space-y-2">
                        <div className="flex justify-between items-baseline">
                          <span className="text-xs text-stone-500 font-bold uppercase">Perolehan Suara:</span>
                          <span className="text-xl sm:text-2xl font-mono font-black text-slate-950">
                            {formatNum(paslon.perolehanSuara)} <span className="text-xs font-sans font-bold text-stone-500">Suara</span>
                          </span>
                        </div>

                        {/* Progress Bar Persentase */}
                        <div className="space-y-1">
                          <div className="w-full h-2.5 rounded-full bg-stone-200 overflow-hidden">
                            <div
                              className={cn('h-full transition-all', paslon.isPemenang ? 'bg-amber-500' : 'bg-emerald-700')}
                              style={{ width: `${paslon.persentase || 0}%` }}
                            />
                          </div>
                          <div className="flex justify-between text-[11px] font-mono font-bold text-stone-600">
                            <span>Persentase Sah:</span>
                            <span className={paslon.isPemenang ? 'text-amber-800' : 'text-emerald-800'}>{paslon.persentase || 0}%</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Rekap Suara Sah & Tidak Sah */}
                <div className="p-4 rounded-2xl neu-inset border border-stone-300/60 grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                  <div>
                    <span className="text-[10px] text-stone-500 font-bold uppercase block">Total Hak Pilih (DPT)</span>
                    <span className="font-mono font-black text-slate-900 text-sm sm:text-base">{formatNum(currentData.totalDpt)}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-stone-500 font-bold uppercase block">Total Pengguna Hak Pilih</span>
                    <span className="font-mono font-black text-emerald-900 text-sm sm:text-base">{formatNum(currentData.totalSuaraMasuk)}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-stone-500 font-bold uppercase block">Suara Sah</span>
                    <span className="font-mono font-black text-sky-900 text-sm sm:text-base">{formatNum(currentData.totalSuaraSah)}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-stone-500 font-bold uppercase block">Suara Tidak Sah</span>
                    <span className="font-mono font-black text-rose-900 text-sm sm:text-base">{formatNum(currentData.totalSuaraTidakSah)}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ─── BAGIAN 5: PENYELENGGARA TINGKAT DESA ─── */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-emerald-800 text-white">
                <HeartHandshake className="h-4 w-4" />
              </span>
              <div>
                <h3 className="text-base sm:text-lg font-condensed font-black uppercase tracking-wider text-slate-900">
                  5. Penyelenggara Tingkat Desa {activeTab === 'pilkades' ? '(Panitia Pilkades)' : '(PPS & Sekretariat PPS)'}
                </h3>
                <p className="text-xs text-stone-500">Struktur personalia penyelenggara dan sekretariat pemungutan suara Desa Sampeldes</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {(currentData.penyelenggaraList || []).map((person, idx) => (
                <div key={person.id || idx} className="neu-card-elevated p-4 rounded-2xl border border-white/80 space-y-2.5">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <Badge
                        variant="outline"
                        className={cn(
                          'text-[10px] font-bold uppercase font-mono px-2 py-0.5',
                          person.kategori === 'pps'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                            : person.kategori === 'sekretariat'
                              ? 'bg-sky-50 text-sky-800 border-sky-300'
                              : 'bg-amber-50 text-amber-800 border-amber-300'
                        )}
                      >
                        {person.kategori === 'pps' ? 'KOMISIONER PPS' : person.kategori === 'sekretariat' ? 'SEKRETARIAT PPS' : 'PANITIA PILKADES'}
                      </Badge>
                      {(person.jenisKelamin || person.agama) && (
                        <Badge variant="secondary" className="text-[9px] font-mono px-1.5 py-0.5 bg-stone-100 text-stone-700 border-stone-200">
                          {person.jenisKelamin || '-'}{person.agama ? ` • ${person.agama}` : ''}
                        </Badge>
                      )}
                    </div>
                    <span className="w-2 h-2 rounded-full bg-emerald-600" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-xs sm:text-sm leading-snug">{person.nama}</h4>
                    <p className="text-[11px] text-stone-600 font-medium mt-1 leading-relaxed">{person.jabatan}</p>
                  </div>
                  <div className="pt-2 border-t border-stone-200 flex items-center justify-between text-[11px]">
                    <span className="text-stone-500 text-[10px]">Desa: <strong className="text-stone-700">{person.desa || 'SAMPELDES'}</strong></span>
                    {person.kontak ? (
                      <a
                        href={`https://wa.me/${person.kontak.replace(/[^0-9]/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-emerald-800 font-bold hover:underline flex items-center gap-1 font-mono text-[11px]"
                      >
                        <Phone className="h-3 w-3" />
                        <span>{person.kontak}</span>
                      </a>
                    ) : (
                      <span className="text-stone-400 text-[10px]">-</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Info & Help Banner */}
          <div className="neu-card-elevated p-5 sm:p-6 rounded-[24px] border border-white/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800 uppercase tracking-wider">
                <Info className="h-4 w-4" />
                <span>Pusat Layanan Informasi Pemilih Sampeldes</span>
              </div>
              <p className="text-xs text-stone-600 leading-relaxed max-w-2xl">
                Warga Desa Sampeldes yang ingin memeriksa status DPT mandiri atau mengajukan permohonan pindah memilih (Formulir A-Pindah Memilih) dapat menghubungi sekretariat PPS di Balai Desa Sampeldes atau mengakses portal resmi KPU Cek DPT Online.
              </p>
            </div>
            <a
              href="https://cekdptonline.kpu.go.id"
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0"
            >
              <Button className="neu-btn-dark font-bold text-xs uppercase tracking-wider px-5 h-11 rounded-xl">
                <span>Cek DPT Online KPU</span>
                <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
              </Button>
            </a>
          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
}
