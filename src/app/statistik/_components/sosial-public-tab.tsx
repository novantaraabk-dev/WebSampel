'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  HandHeart,
  TrendingDown,
  Users,
  ExternalLink,
  Coins,
  ShieldCheck,
  CheckCircle2,
  Info,
  Layers,
  BarChart3,
  Home,
  Zap,
  Droplets,
  Heart,
  FileSpreadsheet,
  ArrowRight,
  TrendingUp,
  AlertCircle,
  PieChart as PieChartIcon,
  Sparkles,
  Award,
  Check,
  Building2,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  CartesianGrid,
  Legend,
} from 'recharts';
import { useFirestore, useDoc, useCollection, useMemoFirebase } from '@/firebase';
import { doc, collection, query, limit } from 'firebase/firestore';
import { StatistikSosialConfig, DtsenItem } from '@/lib/types';
import { SEED_STATISTIK_SOSIAL, SEED_DTSEN_SAMPLE_LIST } from '@/lib/statistik-sosial-data';
import { cn } from '@/lib/utils';

const CHART_COLORS = ['#059669', '#0284c7', '#eab308', '#ea580c', '#8b5cf6', '#e11d48'];

export function SosialPublicTab() {
  const firestore = useFirestore();

  // 3 Sub-Tabs sinkron dengan /admin/statistik
  const [activeSubTab, setActiveSubTab] = useState<'impor' | 'desil' | 'bansos'>('impor');

  // 1. Dokumen Konfigurasi Statistik Sosial (Diinput admin di Tab 2 & 3)
  const configDocRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, 'statisticsSocial', 'default');
  }, [firestore]);

  const { data: configData } = useDoc<StatistikSosialConfig>(configDocRef);

  // 2. Koleksi Data DTSEN Individu (Diimpor admin di Tab 1)
  const dtsenQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'dtsenList'), limit(150));
  }, [firestore]);

  const { data: dtsenListFirestore, isLoading: isLoadingDtsen } = useCollection<DtsenItem>(dtsenQuery);

  // Fallback Data Konfigurasi
  const config: StatistikSosialConfig = useMemo(() => {
    if (configData && configData.desilList) return configData;
    return SEED_STATISTIK_SOSIAL;
  }, [configData]);

  // Fallback Data DTSEN List
  const dtsenList: DtsenItem[] = useMemo(() => {
    if (dtsenListFirestore && dtsenListFirestore.length > 0) return dtsenListFirestore;
    return SEED_DTSEN_SAMPLE_LIST;
  }, [dtsenListFirestore]);



  // Agregasi Grafik DTSEN Berdasarkan 43 Variabel Kemiskinan
  const dtsenAnalytics = useMemo(() => {
    const list = dtsenList;
    const total = list.length || 1;

    // 1. Daya Listrik
    const dayaMap: Record<string, number> = {
      '450 VA': 0,
      '900 VA': 0,
      '1300 VA+': 0,
      'Non-PLN': 0,
    };
    list.forEach((item) => {
      const d = (item.daya_terpasang || '').toUpperCase();
      if (d.includes('450')) dayaMap['450 VA']++;
      else if (d.includes('900')) dayaMap['900 VA']++;
      else if (d.includes('1300') || d.includes('2200')) dayaMap['1300 VA+']++;
      else dayaMap['Non-PLN']++;
    });
    const dayaData = Object.entries(dayaMap).map(([name, value]) => ({
      name,
      value,
      persen: Number(((value / total) * 100).toFixed(1)),
    }));

    // 2. Status Kepemilikan Rumah
    const rumahMap: Record<string, number> = {
      'Milik Sendiri': 0,
      Menumpang: 0,
      'Sewa / Kontrak': 0,
      Lainnya: 0,
    };
    list.forEach((item) => {
      const s = (item.status_kepemilikan_rumah || '').toLowerCase();
      if (s.includes('sendiri')) rumahMap['Milik Sendiri']++;
      else if (s.includes('numpang')) rumahMap['Menumpang']++;
      else if (s.includes('sewa') || s.includes('kontrak')) rumahMap['Sewa / Kontrak']++;
      else rumahMap['Lainnya']++;
    });
    const rumahData = Object.entries(rumahMap).map(([name, value]) => ({
      name,
      value,
      persen: Number(((value / total) * 100).toFixed(1)),
    }));

    // 3. Sanitasi BAB
    const babMap: Record<string, number> = {
      'Jamban Sendiri': 0,
      'Jamban Bersama': 0,
      'Jamban Umum': 0,
      'Belum Memiliki': 0,
    };
    list.forEach((item) => {
      const f = (item.fasilitas_bab || '').toLowerCase();
      if (f.includes('sendiri')) babMap['Jamban Sendiri']++;
      else if (f.includes('bersama')) babMap['Jamban Bersama']++;
      else if (f.includes('umum')) babMap['Jamban Umum']++;
      else babMap['Belum Memiliki']++;
    });
    const sanitasiData = Object.entries(babMap).map(([name, value]) => ({
      name,
      value,
      persen: Number(((value / total) * 100).toFixed(1)),
    }));

    // 4. Sumber Air Minum
    const airMap: Record<string, number> = {
      'Sumur Terlindung': 0,
      'Sumur Gali / Bor': 0,
      'PDAM / Ledeng': 0,
      'Mata Air / Lainnya': 0,
    };
    list.forEach((item) => {
      const a = (item.sumber_air_minum_utama || '').toLowerCase();
      if (a.includes('lindung')) airMap['Sumur Terlindung']++;
      else if (a.includes('bor') || a.includes('gali') || a.includes('pompa')) airMap['Sumur Gali / Bor']++;
      else if (a.includes('pdam') || a.includes('ledeng')) airMap['PDAM / Ledeng']++;
      else airMap['Mata Air / Lainnya']++;
    });
    const airData = Object.entries(airMap).map(([name, value]) => ({
      name,
      value,
      persen: Number(((value / total) * 100).toFixed(1)),
    }));

    // 5. Kepemilikan Aset Rumah Tangga & Ternak
    let motorCount = 0;
    let gasCount = 0;
    let kulkasCount = 0;
    let hpCount = 0;
    let ternakCount = 0;
    list.forEach((item) => {
      const m = (item.aset_bergerak_sepeda_motor || '').toLowerCase();
      if (m.includes('ya') || m.includes('unit') || m.includes('1') || m.includes('ada')) motorCount++;

      const g = (item.aset_bergerak_tabung_gas || '').toLowerCase();
      if (g.includes('ya') || g.includes('tabung') || g.includes('1') || g.includes('ada')) gasCount++;

      const k = (item.aset_bergerak_lemari_es || '').toLowerCase();
      if (k.includes('ya') || k.includes('ada')) kulkasCount++;

      const h = (item.aset_bergerak_smartphone || '').toLowerCase();
      if (h.includes('ya') || h.includes('ada')) hpCount++;

      const sapi = Number(item.jumlah_ternak_sapi) || 0;
      const kambing = Number(item.jumlah_ternak_kambing_domba) || 0;
      if (sapi > 0 || kambing > 0) ternakCount++;
    });

    const asetData = [
      { nama: 'Tabung Gas 3 Kg', jumlah: gasCount, persen: Number(((gasCount / total) * 100).toFixed(1)), fill: '#059669' },
      { nama: 'Sepeda Motor', jumlah: motorCount, persen: Number(((motorCount / total) * 100).toFixed(1)), fill: '#0284c7' },
      { nama: 'Smartphone', jumlah: hpCount, persen: Number(((hpCount / total) * 100).toFixed(1)), fill: '#8b5cf6' },
      { nama: 'Lemari Es (Kulkas)', jumlah: kulkasCount, persen: Number(((kulkasCount / total) * 100).toFixed(1)), fill: '#ea580c' },
      { nama: 'Ternak (Kambing/Sapi)', jumlah: ternakCount, persen: Number(((ternakCount / total) * 100).toFixed(1)), fill: '#eab308' },
    ];

    return {
      dayaData,
      rumahData,
      sanitasiData,
      airData,
      asetData,
      totalSample: list.length,
    };
  }, [dtsenList]);

  const formatNum = (num: number | undefined) => {
    return new Intl.NumberFormat('id-ID').format(num || 0);
  };

  const formatRupiah = (num: number | undefined) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(num || 0);
  };

  return (
    <div className="space-y-6 sm:space-y-8 w-full min-w-0">
      {/* ─── NARRATIVE HEADER BANNER ─── */}
      <div className="neu-card-elevated-dark p-6 sm:p-8 rounded-[28px] text-white relative overflow-hidden border border-white/10 shadow-xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 space-y-3 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-mono font-bold tracking-wider uppercase">
            <HandHeart className="h-3.5 w-3.5" />
            <span>Kesejahteraan &amp; Jaring Pengaman Sosial Desa Sampeldes</span>
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-condensed font-black uppercase tracking-tight text-white leading-tight">
            Statistik Sosial, DTSEN &amp; Penyaluran Bansos
          </h2>
          <p className="text-xs sm:text-sm text-stone-300 leading-relaxed font-medium">
            Keterbukaan data pemetaan kemiskinan berbasis Data Terpadu Sosial Ekonomi Nasional (DTSEN 43 Variabel), rekapitulasi desil dan tren kemiskinan tahunan, serta transparansi penyaluran bantuan sosial resmi (BLT-DD, PKH, BPNT, Beras CBP, dan PBI-JKN).
          </p>
        </div>

        {/* ─── 3 SUB-TABS NAVIGASI (Sinkron dengan /admin/statistik) ─── */}
        <div className="relative z-10 pt-5 mt-5 border-t border-white/10 flex flex-wrap gap-2.5">
          <Button
            onClick={() => setActiveSubTab('impor')}
            className={cn(
              'h-10 px-4 rounded-xl font-condensed font-bold uppercase text-xs tracking-wider transition-all gap-2',
              activeSubTab === 'impor'
                ? 'bg-[#00a884] text-slate-950 hover:bg-[#059669] shadow-md'
                : 'bg-white/10 hover:bg-white/15 text-white border border-white/10'
            )}
          >
            <FileSpreadsheet className="h-4 w-4" />
            <span>1. Impor Excel DTSEN &amp; Data Warga (43 Kolom)</span>
          </Button>

          <Button
            onClick={() => setActiveSubTab('desil')}
            className={cn(
              'h-10 px-4 rounded-xl font-condensed font-bold uppercase text-xs tracking-wider transition-all gap-2',
              activeSubTab === 'desil'
                ? 'bg-[#00a884] text-slate-950 hover:bg-[#059669] shadow-md'
                : 'bg-white/10 hover:bg-white/15 text-white border border-white/10'
            )}
          >
            <TrendingDown className="h-4 w-4" />
            <span>2. Rekap Desil 1-4 &amp; Tren Kemiskinan</span>
          </Button>

          <Button
            onClick={() => setActiveSubTab('bansos')}
            className={cn(
              'h-10 px-4 rounded-xl font-condensed font-bold uppercase text-xs tracking-wider transition-all gap-2',
              activeSubTab === 'bansos'
                ? 'bg-[#00a884] text-slate-950 hover:bg-[#059669] shadow-md'
                : 'bg-white/10 hover:bg-white/15 text-white border border-white/10'
            )}
          >
            <Coins className="h-4 w-4" />
            <span>3. Penyaluran Bantuan Sosial (Bansos)</span>
          </Button>
        </div>
      </div>

      {/* ───────────────────────────────────────────────────────────────────── */}
      {/* SUB-TAB 1: IMPOR EXCEL DTSEN & DATA WARGA (43 KOLOM)                  */}
      {/* ───────────────────────────────────────────────────────────────────── */}
      {activeSubTab === 'impor' && (
        <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-500">
          {/* Header Info & Indikator Survei DTSEN 43 Kolom */}
          <div className="p-5 sm:p-6 rounded-[28px] neu-card-elevated border border-white/60 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-200 dark:border-white/10 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base sm:text-lg font-condensed font-black uppercase text-slate-900 dark:text-white flex items-center gap-2">
                    <FileSpreadsheet className="h-5 w-5 text-emerald-600" />
                    Indikator Hasil Survei DTSEN / Regsosek (43 Variabel)
                  </h3>
                  <Badge className="bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border-emerald-500/30 text-[10px] font-bold">
                    Terdata {formatNum(config.totalKpmDtsen)} KPM
                  </Badge>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                  Grafik profil kemiskinan dan kelayakan hidup keluarga penerima manfaat yang diambil langsung dari data survei lapangan 43 kolom.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono font-bold text-slate-500 dark:text-slate-400">
                  Data Aktif: {dtsenAnalytics.totalSample} Sampel Terverifikasi
                </span>
              </div>
            </div>

            {/* 4 Mini KPI Cards DTSEN */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <div className="p-3.5 rounded-2xl neu-inset text-center space-y-1">
                <span className="text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400">
                  Total Terdata (KPM)
                </span>
                <p className="text-xl sm:text-2xl font-condensed font-black text-slate-900 dark:text-white">
                  {formatNum(config.totalKpmDtsen)}
                </p>
                <span className="text-[10px] text-emerald-700 font-bold block">Registrasi Regsosek</span>
              </div>

              <div className="p-3.5 rounded-2xl neu-inset text-center space-y-1">
                <span className="text-[10px] font-bold uppercase text-red-600">
                  Desil 1 (Ekstrem)
                </span>
                <p className="text-xl sm:text-2xl font-condensed font-black text-red-600">
                  {formatNum(config.desilList?.[0]?.jumlahKpm || 0)}
                </p>
                <span className="text-[10px] text-stone-500 font-medium block">
                  {config.desilList?.[0]?.persen || 0}% Total Warga
                </span>
              </div>

              <div className="p-3.5 rounded-2xl neu-inset text-center space-y-1">
                <span className="text-[10px] font-bold uppercase text-amber-600">
                  Daya Listrik 450 VA
                </span>
                <p className="text-xl sm:text-2xl font-condensed font-black text-slate-900 dark:text-white">
                  {dtsenAnalytics.dayaData[0]?.persen || 0}%
                </p>
                <span className="text-[10px] text-stone-500 font-medium block">Subsidi Terbanyak</span>
              </div>

              <div className="p-3.5 rounded-2xl neu-inset text-center space-y-1">
                <span className="text-[10px] font-bold uppercase text-blue-600">
                  Rumah Milik Sendiri
                </span>
                <p className="text-xl sm:text-2xl font-condensed font-black text-slate-900 dark:text-white">
                  {dtsenAnalytics.rumahData[0]?.persen || 0}%
                </p>
                <span className="text-[10px] text-stone-500 font-medium block">Legalitas Hunian</span>
              </div>
            </div>
          </div>

          {/* ─── GRAFIK DTSEN DARI 43 KOLOM ─── */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
            {/* Grafik 1: Daya Listrik & Kelistrikan KPM */}
            <div className="neu-card-elevated p-5 sm:p-6 rounded-2xl border border-white/80 space-y-4">
              <div className="flex items-center justify-between border-b border-stone-200 dark:border-white/10 pb-3">
                <div>
                  <h4 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
                    <Zap className="h-4 w-4 text-amber-500" />
                    1. Distribusi Daya Listrik Terpasang
                  </h4>
                  <p className="text-xs text-stone-500">Persentase KPM berdasarkan daya listrik PLN (Variabel 18-19)</p>
                </div>
              </div>

              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dtsenAnalytics.dayaData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} />
                    <YAxis tick={{ fontSize: 11, fill: '#64748b' }} unit="%" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        borderColor: 'rgba(255,255,255,0.1)',
                        borderRadius: '12px',
                        color: '#fff',
                        fontSize: '12px',
                      }}
                      formatter={(val: any, name: any, props: any) => [
                        `${val}% (${props.payload.value} Sampel)`,
                        props.payload.name,
                      ]}
                    />
                    <Bar dataKey="persen" radius={[8, 8, 0, 0]}>
                      {dtsenAnalytics.dayaData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                {dtsenAnalytics.dayaData.map((item, idx) => (
                  <div key={idx} className="p-2 rounded-xl neu-inset flex justify-between items-center">
                    <span className="text-slate-700 dark:text-slate-300 font-medium">{item.name}:</span>
                    <span className="font-bold text-slate-950 dark:text-white font-mono">{item.persen}%</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Grafik 2: Status Kepemilikan Rumah */}
            <div className="neu-card-elevated p-5 sm:p-6 rounded-2xl border border-white/80 space-y-4">
              <div className="flex items-center justify-between border-b border-stone-200 dark:border-white/10 pb-3">
                <div>
                  <h4 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
                    <Home className="h-4 w-4 text-emerald-600" />
                    2. Status Kepemilikan Bangunan Rumah
                  </h4>
                  <p className="text-xs text-stone-500">Legalitas tempat tinggal keluarga (Variabel 10)</p>
                </div>
              </div>

              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={dtsenAnalytics.rumahData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={75}
                      paddingAngle={3}
                    >
                      {dtsenAnalytics.rumahData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        borderColor: 'rgba(255,255,255,0.1)',
                        borderRadius: '12px',
                        color: '#fff',
                        fontSize: '12px',
                      }}
                      formatter={(val: any, name: any, props: any) => [
                        `${props.payload.persen}% (${val} KPM)`,
                        props.payload.name,
                      ]}
                    />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-950 dark:text-emerald-200 flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                <p className="text-[11px] leading-relaxed">
                  Mayoritas warga menempati rumah milik sendiri, sebagian kecil menumpang di lahan keluarga atau kerabat.
                </p>
              </div>
            </div>

            {/* Grafik 3: Sanitasi BAB & Akses Air Minum */}
            <div className="neu-card-elevated p-5 sm:p-6 rounded-2xl border border-white/80 space-y-4">
              <div className="flex items-center justify-between border-b border-stone-200 dark:border-white/10 pb-3">
                <div>
                  <h4 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
                    <Droplets className="h-4 w-4 text-blue-500" />
                    3. Fasilitas Sanitasi BAB &amp; Kloset
                  </h4>
                  <p className="text-xs text-stone-500">Kelayakan pembuangan tinja dan jamban (Variabel 20-22)</p>
                </div>
              </div>

              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dtsenAnalytics.sanitasiData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748b' }} interval={0} />
                    <YAxis tick={{ fontSize: 11, fill: '#64748b' }} unit="%" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        borderColor: 'rgba(255,255,255,0.1)',
                        borderRadius: '12px',
                        color: '#fff',
                        fontSize: '12px',
                      }}
                      formatter={(val: any, name: any, props: any) => [
                        `${val}% (${props.payload.value} KPM)`,
                        props.payload.name,
                      ]}
                    />
                    <Bar dataKey="persen" fill="#0284c7" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px]">
                {dtsenAnalytics.sanitasiData.map((item, idx) => (
                  <div key={idx} className="p-2 rounded-xl neu-inset flex justify-between items-center">
                    <span className="text-slate-700 dark:text-slate-300 truncate font-medium">{item.name}:</span>
                    <span className="font-bold text-slate-950 dark:text-white font-mono shrink-0 ml-1">{item.persen}%</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Grafik 4: Kepemilikan Aset Rumah Tangga & Ternak */}
            <div className="neu-card-elevated p-5 sm:p-6 rounded-2xl border border-white/80 space-y-4">
              <div className="flex items-center justify-between border-b border-stone-200 dark:border-white/10 pb-3">
                <div>
                  <h4 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
                    <Coins className="h-4 w-4 text-yellow-600" />
                    4. Kepemilikan Aset Produktif &amp; Transportasi
                  </h4>
                  <p className="text-xs text-stone-500">Persentase kepemilikan aset bergerak KPM (Variabel 23-42)</p>
                </div>
              </div>

              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={dtsenAnalytics.asetData}
                    layout="vertical"
                    margin={{ top: 5, right: 25, left: 40, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} opacity={0.3} />
                    <XAxis type="number" tick={{ fontSize: 10, fill: '#64748b' }} unit="%" domain={[0, 100]} />
                    <YAxis type="category" dataKey="nama" tick={{ fontSize: 10, fill: '#64748b' }} width={90} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        borderColor: 'rgba(255,255,255,0.1)',
                        borderRadius: '12px',
                        color: '#fff',
                        fontSize: '12px',
                      }}
                      formatter={(val: any, name: any, props: any) => [
                        `${val}% (${props.payload.jumlah} KPM)`,
                        props.payload.nama,
                      ]}
                    />
                    <Bar dataKey="persen" radius={[0, 8, 8, 0]}>
                      {dtsenAnalytics.asetData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-950 dark:text-amber-200 flex items-start gap-2">
                <Info className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                <p className="text-[11px] leading-relaxed">
                  Tabung gas LPG 3 kg dan sepeda motor merupakan aset paling vital bagi mobilitas ekonomi harian warga desa.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────────────── */}
      {/* SUB-TAB 2: REKAP DESIL 1-4 & TREN KEMISKINAN                         */}
      {/* ───────────────────────────────────────────────────────────────────── */}
      {activeSubTab === 'desil' && (
        <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-500">
          {/* 4 KARTU DESIL KESEJAHTERAAN (Inputan Admin Tab 2) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base sm:text-lg font-condensed font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
                  <TrendingDown className="h-5 w-5 text-red-500" />
                  Klasifikasi Desil Kesejahteraan (Desil 1 s/d 4)
                </h3>
                <p className="text-xs text-stone-500">
                  Jumlah Keluarga Penerima Manfaat (KPM) berdasarkan penetapan desil kemiskinan nasional.
                </p>
              </div>
              <Badge variant="outline" className="font-mono text-xs font-bold text-rose-800 bg-rose-50 border-rose-300">
                Total {formatNum(config.totalKpmDtsen)} KPM
              </Badge>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {(config.desilList || []).map((item, idx) => (
                <div
                  key={idx}
                  className="neu-card-elevated p-5 rounded-2xl border border-white/80 space-y-3 relative overflow-hidden"
                >
                  <div className="flex items-center justify-between">
                    <span
                      className="px-2.5 py-0.5 rounded-lg text-white font-mono font-black text-xs uppercase"
                      style={{ backgroundColor: item.warna || '#f97316' }}
                    >
                      Desil {item.desil}
                    </span>
                    <span className="text-xs font-bold text-stone-500 font-mono">
                      {item.persen}%
                    </span>
                  </div>

                  <div>
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white leading-tight">
                      {item.kategori}
                    </h4>
                    <p className="text-2xl sm:text-3xl font-condensed font-black text-slate-950 dark:text-white mt-1">
                      {formatNum(item.jumlahKpm)} <span className="text-xs font-sans font-bold text-stone-500">KPM</span>
                    </p>
                  </div>

                  <p className="text-[11px] text-stone-600 dark:text-stone-300 line-clamp-3 leading-relaxed pt-2 border-t border-stone-200 dark:border-white/10">
                    {item.keterangan}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* DUA GRAFIK INTERAKTIF: DESIL & TREN PENURUNAN KEMISKINAN */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6">
            {/* Grafik Desil */}
            <div className="lg:col-span-6 neu-card-elevated p-5 sm:p-6 rounded-2xl border border-white/80 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                    Grafik Jumlah KPM per Desil DTSEN
                  </h4>
                  <p className="text-xs text-stone-500">Perbandingan jumlah keluarga di tiap strata kemiskinan</p>
                </div>
                <BarChart3 className="h-4 w-4 text-emerald-800" />
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={config.desilList || []} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                    <XAxis dataKey="kategori" tick={{ fontSize: 10, fill: '#64748b' }} interval={0} />
                    <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        borderColor: 'rgba(255,255,255,0.1)',
                        borderRadius: '12px',
                        color: '#fff',
                        fontSize: '12px',
                      }}
                      formatter={(val: any, name: any, props: any) => [
                        `${formatNum(val)} KPM (${props.payload.persen}%)`,
                        props.payload.label,
                      ]}
                    />
                    <Bar dataKey="jumlahKpm" radius={[8, 8, 0, 0]}>
                      {(config.desilList || []).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.warna || '#059669'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-stone-800 text-xs text-stone-600 dark:text-stone-300 flex items-start gap-2">
                <Info className="h-4 w-4 text-slate-500 shrink-0 mt-0.5" />
                <p className="text-[11px] leading-relaxed">
                  <strong>Prioritas Intervensi:</strong> KPM pada Desil 1 dan Desil 2 merupakan fokus sasaran bantuan tunai langsung (BLT-DD) dan jaminan kesehatan KIS PBI tanpa premi.
                </p>
              </div>
            </div>

            {/* Grafik Tren Penurunan Kemiskinan */}
            <div className="lg:col-span-6 neu-card-elevated p-5 sm:p-6 rounded-2xl border border-white/80 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                    Tren Penurunan Kemiskinan Desa (2021 - 2025)
                  </h4>
                  <p className="text-xs text-stone-500">Evaluasi efektivitas program pemberdayaan Pemerintah Desa</p>
                </div>
                <Badge variant="outline" className="bg-emerald-50 text-emerald-800 border-emerald-300 font-mono text-xs font-bold flex items-center gap-1">
                  <TrendingDown className="h-3.5 w-3.5 text-emerald-700" />
                  <span>Tren Menurun</span>
                </Badge>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={config.trenList || []} margin={{ top: 10, right: 15, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                    <XAxis dataKey="tahun" tick={{ fontSize: 11, fill: '#64748b' }} />
                    <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        borderColor: 'rgba(255,255,255,0.1)',
                        borderRadius: '12px',
                        color: '#fff',
                        fontSize: '12px',
                      }}
                      formatter={(val: any, name: any, props: any) => [
                        `${formatNum(val)} Jiwa (${props.payload.persentase}%)`,
                        `Tahun ${props.payload.tahun}`,
                      ]}
                    />
                    <Line
                      type="monotone"
                      dataKey="jumlahWargaMiskin"
                      stroke="#059669"
                      strokeWidth={3}
                      dot={{ r: 5, fill: '#059669', strokeWidth: 2, stroke: '#fff' }}
                      activeDot={{ r: 7 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Grid 3 Highlight Tahun */}
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                {(config.trenList || []).slice(0, 3).map((item, idx) => (
                  <div key={idx} className="p-2.5 rounded-xl neu-inset">
                    <span className="text-[10px] text-stone-500 block">Tahun {item.tahun}</span>
                    <span className="font-mono font-bold text-slate-800 dark:text-white">{formatNum(item.jumlahWargaMiskin)} Jiwa</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* TABEL REKAPITULASI TREN KEMISKINAN TAHUNAN */}
          <div className="neu-card-elevated rounded-[28px] p-5 sm:p-6 border border-white/60 space-y-4">
            <h4 className="text-base font-condensed font-bold uppercase text-slate-900 dark:text-white">
              Tabel Rekapitulasi Tren Kemiskinan Tahunan Desa Sampeldes
            </h4>

            <div className="overflow-x-auto rounded-2xl border border-stone-200 dark:border-white/10 neu-inset">
              <table className="w-full text-left text-xs text-slate-800 dark:text-slate-200">
                <thead className="bg-stone-200/60 dark:bg-stone-800/60 text-slate-900 dark:text-white uppercase font-condensed font-bold tracking-wider text-[11px] border-b border-stone-300 dark:border-white/10">
                  <tr>
                    <th className="py-3 px-3.5 text-center">Tahun</th>
                    <th className="py-3 px-3.5">Jumlah Warga Miskin</th>
                    <th className="py-3 px-3.5 text-center">Persentase</th>
                    <th className="py-3 px-3.5 text-center">KPM Penerima BLT</th>
                    <th className="py-3 px-3.5">Keterangan / Kebijakan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-200 dark:divide-white/10">
                  {(config.trenList || []).map((row, idx) => (
                    <tr key={idx} className="hover:bg-white/40 dark:hover:bg-white/5 transition-colors">
                      <td className="py-2.5 px-3.5 text-center font-bold font-mono text-slate-900 dark:text-white">
                        {row.tahun}
                      </td>
                      <td className="py-2.5 px-3.5 font-bold text-emerald-800 dark:text-emerald-400 font-mono">
                        {formatNum(row.jumlahWargaMiskin)} Jiwa
                      </td>
                      <td className="py-2.5 px-3.5 text-center font-bold font-mono">
                        {row.persentase}%
                      </td>
                      <td className="py-2.5 px-3.5 text-center font-bold font-mono">
                        {row.kpmBlt} KPM
                      </td>
                      <td className="py-2.5 px-3.5 text-slate-600 dark:text-slate-300 text-[11px]">
                        {row.keterangan || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────────────── */}
      {/* SUB-TAB 3: PENYALURAN BANTUAN SOSIAL (BANSOS)                         */}
      {/* ───────────────────────────────────────────────────────────────────── */}
      {activeSubTab === 'bansos' && (
        <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-500">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base sm:text-lg font-condensed font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
                <Coins className="h-5 w-5 text-emerald-600" />
                Statistik Penyaluran Bantuan Sosial (Per Jenis Program)
              </h3>
              <p className="text-xs text-stone-500">
                Penyaluran resmi bersumber dari Dana Desa (APBDes Sampeldes), Kemensos RI, Bapanas, Bulog, dan Kemenkes.
              </p>
            </div>
            <Link href="/tata-kelola-desa?tab=realisasi">
              <Button
                variant="outline"
                size="sm"
                className="h-9 gap-1.5 text-xs font-bold border-emerald-600 text-emerald-900 hover:bg-emerald-50 rounded-xl"
              >
                <Coins className="h-3.5 w-3.5 text-emerald-700" />
                <span>Cek Realisasi APBDes (BLT-DD)</span>
                <ArrowRight className="h-3 w-3 ml-1" />
              </Button>
            </Link>
          </div>

          {/* GRID KARTU PROGRAM BANSOS (Inputan Admin Tab 3) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {(config.bansosList || []).map((bansos, idx) => (
              <div
                key={bansos.id || idx}
                className="neu-card-elevated p-5 sm:p-6 rounded-2xl border border-white/80 space-y-4 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Badge
                      variant="outline"
                      className={cn(
                        'text-[10px] font-bold uppercase font-mono px-2.5 py-0.5',
                        bansos.kode === 'blt-dd'
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                          : bansos.kode === 'pkh'
                            ? 'bg-rose-50 text-rose-800 border-rose-300'
                            : bansos.kode === 'bpnt'
                              ? 'bg-sky-50 text-sky-800 border-sky-300'
                              : 'bg-amber-50 text-amber-800 border-amber-300'
                      )}
                    >
                      {bansos.sumberDana}
                    </Badge>
                    <span className="w-2 h-2 rounded-full bg-emerald-600" />
                  </div>

                  <div>
                    <h4 className="font-condensed font-bold uppercase text-slate-900 dark:text-white text-base leading-snug">
                      {bansos.namaProgram}
                    </h4>
                    <p className="text-[11px] text-stone-500 mt-0.5">{bansos.periode}</p>
                  </div>

                  <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed">
                    {bansos.keterangan}
                  </p>
                </div>

                <div className="pt-3 border-t border-stone-200 dark:border-white/10 space-y-2">
                  <div className="flex justify-between items-baseline">
                    <span className="text-xs font-bold text-stone-500 uppercase">Jumlah Penerima:</span>
                    <span className="text-xl sm:text-2xl font-mono font-black text-slate-950 dark:text-white">
                      {formatNum(bansos.jumlahKpm)}{' '}
                      <span className="text-xs font-sans font-bold text-stone-500">{bansos.satuan}</span>
                    </span>
                  </div>

                  {bansos.paguAnggaran && (
                    <div className="p-2.5 rounded-xl neu-inset flex justify-between items-center text-xs">
                      <span className="text-stone-600 dark:text-stone-400 font-bold">Total Pagu Anggaran:</span>
                      <span className="font-mono font-black text-emerald-900 dark:text-emerald-300">
                        {formatRupiah(bansos.paguAnggaran)}
                      </span>
                    </div>
                  )}

                  <div className="flex items-center gap-1.5 text-[11px] text-emerald-800 dark:text-emerald-300 font-bold pt-1">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-700 shrink-0" />
                    <span>{bansos.statusPenyaluran}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Banner Integrasi Keterbukaan Realisasi APBDes */}
          <div className="p-5 sm:p-6 rounded-[24px] neu-card-elevated-dark text-white border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#00a884] uppercase tracking-wider">
                <ShieldCheck className="h-4 w-4" />
                <span>Prinsip Akuntabilitas &amp; Anti Korupsi</span>
              </div>
              <p className="text-xs text-stone-300 leading-relaxed max-w-2xl">
                Seluruh data penerima Bantuan Langsung Tunai (BLT Dana Desa) dan jaring pengaman sosial di Desa Sampeldes dimusyawarahkan melalui Musyawarah Desa Khusus (Musdessus) dan dilaporkan secara berkala dalam Laporan Realisasi APBDes.
              </p>
            </div>
            <Link href="/tata-kelola-desa" className="shrink-0">
              <Button className="neu-btn-gold text-slate-950 font-bold text-xs uppercase tracking-wider px-5 h-11 rounded-xl">
                <span>Buka Tata Kelola APBDes</span>
                <ExternalLink className="h-3.5 w-3.5 ml-1.5" />
              </Button>
            </Link>
          </div>
        </div>
      )}

    </div>
  );
}

