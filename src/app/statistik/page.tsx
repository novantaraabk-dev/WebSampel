'use client';

import React, { useState, useEffect, useMemo, useRef, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { Logo } from '@/components/logo';
import { Header } from '@/components/landing/Header';
import { Footer } from '@/components/landing/Footer';
import { BackgroundPattern } from '@/components/landing/BackgroundPattern';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Users,
  GraduationCap,
  Activity,
  Heart,
  TrendingUp,
  Building2,
  Target,
  Award,
  ArrowLeft,
  ArrowRight,
  ChevronDown,
  ShieldCheck,
  Download,
  FileDown,
  Home,
  UserCheck,
  CheckCircle2,
  Calendar,
  MapPin,
  Stethoscope,
  BookOpen,
  Sparkles,
  Layers,
  Coins,
  Store,
  Sprout,
  HeartPulse,
  Scale,
  HandHeart,
  Check,
  Info,
  AlertTriangle,
  Trees,
  Laptop,
  Search,
  Zap,
  Briefcase,
  Truck,
  Sun,
  Filter,
  BarChart3
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line
} from 'recharts';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { SosialPublicTab } from './_components/sosial-public-tab';

const COLORS = ['#1e293b', '#eab308', '#059669', '#0d9488', '#8b5cf6', '#f43f5e'];

// Formatter angka deterministik standar Indonesia (pemisah ribuan titik)
// Menjamin output string 100% identik pada SSR Server dan Browser Client untuk mencegah React Hydration Mismatch
const formatNumberId = (num: number | string | undefined | null): string => {
  if (num === null || num === undefined) return '0';
  const parts = num.toString().split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return parts.join(',');
};

const tabs = [
  { id: 'kependudukan', label: 'Kependudukan', icon: Users, desc: 'Demografi & Sebaran Penduduk 8.775 Jiwa (BPS) / 8.563 Jiwa (Desa)' },
  { id: 'pendidikan', label: 'Pendidikan', icon: GraduationCap, desc: 'Satuan Pendidikan SDN 01-06 & Lembaga Terdaftar' },
  { id: 'kesehatan', label: 'Kesehatan', icon: Activity, desc: '8 Fokus Pelayanan Dasar & Posyandu 4 RW' },
  { id: 'sosial', label: 'Sosial', icon: HandHeart, desc: 'Partisipasi Warga, Gotong Royong & Lembaga Desa' },
  { id: 'ekonomi', label: 'Ekonomi', icon: TrendingUp, desc: 'Pertanian, UMKM & 7 Fokus Penguatan Ekonomi' },
  { id: 'pembangunan', label: 'Pembangunan Desa', icon: Building2, desc: 'Infrastruktur Jalan, Aksesibilitas & Wilayah' },
  { id: 'sdgs', label: 'SDGs Desa', icon: Target, desc: '18 Gol Pembangunan Berkelanjutan' },
  { id: 'indeks', label: 'Indeks Desa', icon: Award, desc: 'Status Maju (2025-2026) Menuju Kategori Mandiri (2027)' },
];

export default function StatistikPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] dark:bg-[#060b11]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
      </div>
    }>
      <StatistikContent />
    </Suspense>
  );
}

function StatistikContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const queryTab = searchParams?.get('tab');
  const initialTab = queryTab && tabs.some(t => t.id === queryTab) ? queryTab : 'kependudukan';
  const [activeTab, setActiveTab] = useState(initialTab);

  const firestore = useFirestore();

  const statsRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, 'villageProfile', 'statistics');
  }, [firestore]);

  const profileRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, 'villageProfile', 'default');
  }, [firestore]);

  const { data: statsDoc } = useDoc<any>(statsRef);
  const { data: profileDoc } = useDoc<any>(profileRef);

  useEffect(() => {
    if (queryTab && tabs.some(t => t.id === queryTab)) {
      setActiveTab(queryTab);
    }
  }, [queryTab]);

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    router.replace(`/statistik?tab=${tabId}`, { scroll: false });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const activeTabObj = tabs.find(t => t.id === activeTab) || tabs[0];

  return (
    <div className="relative flex flex-col min-h-screen bg-[#F8FAFC] dark:bg-[#060b11] text-slate-900 dark:text-slate-100 font-sans overflow-x-hidden w-full">
      <BackgroundPattern />
      <Header />

      <main className="relative flex-1 pt-24 sm:pt-28 pb-12 sm:pb-20">
        {/* MAIN CONTAINER */}
        <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 md:py-8 w-full min-w-0">
          {/* PAGE TITLE */}
          <div className="mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-condensed font-bold uppercase tracking-tight text-slate-900 leading-tight">
              Statistik & Indikator Desa Sampeldes
            </h1>
          </div>

          <div className="grid lg:grid-cols-12 gap-5 sm:gap-6 lg:gap-10 items-start w-full min-w-0">

            {/* SIDEBAR NAVIGATION */}
            <aside className="lg:col-span-3 lg:sticky lg:top-28 z-40 w-full min-w-0">
              {/* Desktop Navigation List */}
              <div className="hidden lg:flex neu-card-elevated rounded-[28px] p-4 border border-white/60 flex-col gap-2">
                <div className="px-3 py-1.5 border-b border-black/5 mb-1">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-700 font-condensed">Kategori Statistik</p>
                </div>
                {tabs.map((tab) => {
                  const isCurrent = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => handleTabChange(tab.id)}
                      className={cn(
                        "flex items-center gap-3.5 px-4 py-3 rounded-2xl transition-all duration-300 whitespace-nowrap w-full group text-left",
                        isCurrent
                          ? "neu-btn-dark text-teal-400 font-bold shadow-md scale-[1.02]"
                          : "text-slate-700 hover:text-slate-950 hover:bg-black/5 font-bold"
                      )}
                    >
                      <tab.icon className={cn("h-4 w-4 shrink-0 transition-transform group-hover:scale-110", isCurrent ? "text-teal-400" : "text-slate-600")} />
                      <div className="flex flex-col overflow-hidden">
                        <span className="font-condensed font-bold uppercase text-xs tracking-wider leading-tight">{tab.label}</span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Mobile Navigation */}
              <div className="block lg:hidden w-full mb-5 space-y-2.5">
                {/* Quick Dropdown Selector for instant switching */}
                <div className="flex items-center gap-2">
                  <Select value={activeTab} onValueChange={handleTabChange}>
                    <SelectTrigger className="w-full h-11 neu-card-elevated border border-white/60 rounded-xl font-condensed font-bold uppercase tracking-wider text-xs">
                      <div className="flex items-center gap-2 truncate">
                        <activeTabObj.icon className="h-4 w-4 text-emerald-700 shrink-0" />
                        <span className="truncate">{activeTabObj.label}</span>
                      </div>
                    </SelectTrigger>
                    <SelectContent className="bg-white dark:bg-[#081d27] rounded-2xl shadow-xl border border-white/60 max-h-72">
                      {tabs.map((tab) => (
                        <SelectItem key={tab.id} value={tab.id} className="font-condensed font-bold uppercase text-xs py-2.5">
                          <div className="flex items-center gap-2">
                            <tab.icon className="h-4 w-4 text-emerald-700 shrink-0" />
                            <span>{tab.label}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Wrapped Chip Pills - Fits Mobile Screen Perfectly (Zero Horizontal Scroll) */}
                <div className="flex flex-wrap items-center gap-2 w-full pt-0.5">
                  {tabs.map((tab) => {
                    const isCurrent = activeTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => handleTabChange(tab.id)}
                        className={cn(
                          "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-condensed font-bold uppercase tracking-wider transition-all",
                          isCurrent
                            ? "neu-btn-dark text-teal-400 shadow-sm"
                            : "neu-pill text-slate-800 hover:text-slate-950 font-bold"
                        )}
                      >
                        <tab.icon className={cn("h-3 w-3 shrink-0", isCurrent ? "text-teal-400" : "text-slate-700")} />
                        <span>{tab.label}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Active Tab Subtitle Info Banner */}
                <div className="flex items-center gap-2 px-3.5 py-2 neu-inset rounded-xl border border-white/40 dark:border-white/10 dark:bg-stone-900/60 text-emerald-950 dark:text-emerald-200 text-[10px] sm:text-[11px]">
                  <activeTabObj.icon className="h-3.5 w-3.5 text-emerald-700 dark:text-emerald-400 shrink-0" />
                  <p className="truncate font-medium">
                    <span className="font-condensed font-bold uppercase text-slate-900 dark:text-white">{activeTabObj.label}</span>
                    <span className="text-slate-700 dark:text-slate-300 ml-1.5 hidden min-[380px]:inline font-medium">— {activeTabObj.desc}</span>
                  </p>
                </div>
              </div>

              {/* Quick Summary Card (Desktop Only to keep mobile scroll focused) */}
              <div className="hidden lg:block neu-card-elevated p-5 rounded-[28px] border border-white/60 space-y-3 mt-5">
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-800 dark:text-emerald-400 uppercase tracking-wider">
                  <MapPin className="h-4 w-4 text-emerald-700 dark:text-emerald-400" />
                  <span>Indikator Pokok Wilayah</span>
                </div>
                <div className="neu-inset rounded-2xl p-3.5 space-y-2 text-xs text-slate-700 dark:text-slate-300 divide-y divide-black/5 dark:divide-white/10 dark:border-white/10 dark:bg-stone-900/60">
                  <div className="flex justify-between py-1">
                    <span className="text-slate-700 dark:text-slate-300 font-medium">Penduduk (BPS 2024):</span>
                    <span className="font-bold text-slate-950 dark:text-white">8.775 Jiwa (7,49%)</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-700 dark:text-slate-300 font-medium">Pemutakhiran Desa:</span>
                    <span className="font-bold text-slate-950 dark:text-white">
                      {formatNumberId(statsDoc?.total || 10171)} Jiwa ({formatNumberId(statsDoc?.totalKK || 3169)} KK)
                    </span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-700 dark:text-slate-300 font-medium">Luas Wilayah:</span>
                    <span className="font-bold text-slate-950 dark:text-white">
                      {profileDoc?.luasWilayahKm2 || profileDoc?.luasWilayah || '11,07'} km² (9,28%)
                    </span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-700 dark:text-slate-300 font-medium">Kepadatan:</span>
                    <span className="font-bold text-slate-950 dark:text-white">
                      {statsDoc?.density || Math.round((statsDoc?.total || 10171) / Number(profileDoc?.luasWilayahKm2 || profileDoc?.luasWilayah || 11.07))} jiwa/km²
                    </span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-700 dark:text-slate-300 font-medium">Rasio Gender:</span>
                    <span className="font-bold text-slate-950 dark:text-white">
                      {statsDoc?.sexRatio || (statsDoc?.maleCount && statsDoc?.femaleCount ? ((statsDoc.maleCount / statsDoc.femaleCount) * 100).toFixed(2).replace('.', ',') : '101,13')}
                    </span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-700 dark:text-slate-300 font-medium">Dusun Resmi:</span>
                    <span className="font-bold text-slate-950 dark:text-white">
                      {profileDoc?.jumlahDusun ? `${profileDoc.jumlahDusun} Dusun` : '2 Dusun (Pangampiran & Ciloning)'}
                    </span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-700 dark:text-slate-300 font-medium">RW / RT:</span>
                    <span className="font-bold text-slate-950 dark:text-white">
                      {profileDoc?.jumlahRW || 4} RW / {profileDoc?.jumlahRT || 41} RT
                    </span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-700 dark:text-slate-300 font-medium">Ke Ibu Kota Kec:</span>
                    <span className="font-bold text-slate-950 dark:text-white">
                      ± {profileDoc?.jarakKecamatanKm || profileDoc?.jarakKecamatan || 3} km
                    </span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-700 dark:text-slate-300 font-medium">Ke Ibu Kota Kab:</span>
                    <span className="font-bold text-slate-950 dark:text-white">
                      ± {profileDoc?.jarakKabupatenKm || profileDoc?.jarakKabupaten || 45} km
                    </span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-700 dark:text-slate-300 font-medium">Status IDM:</span>
                    <span className="font-bold text-emerald-800 dark:text-emerald-400">
                      {profileDoc?.statusIdm || 'Maju (Target Mandiri 2027)'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Quick Access Card (Desktop Only) */}
              <div className="hidden lg:block mt-6 p-6 neu-card-elevated-dark rounded-[28px] text-white relative overflow-hidden border border-white/10 shadow-lg">
                <div className="absolute top-0 right-0 p-6 opacity-10 pointer-events-none"><ShieldCheck className="w-24 h-24 text-white" /></div>
                <div className="relative z-10 space-y-3">
                  <div className="flex items-center gap-2 text-xs font-semibold tracking-wider text-teal-400 uppercase">
                    <span className="w-4 h-[2px] bg-teal-500 shrink-0" />
                    <span>Akses Cepat</span>
                  </div>
                  <h4 className="text-xl font-condensed font-bold uppercase tracking-tight text-white leading-snug">
                    Butuh bantuan administrasi desa?
                  </h4>
                  <p className="text-xs text-slate-200 leading-relaxed font-medium">
                    Layanan pengajuan surat dan dokumen kependudukan kini dapat diakses secara daring 24 jam.
                  </p>
                  <Link href="/layanan-surat/">
                    <Button className="neu-btn-gold text-slate-950 font-bold uppercase tracking-wider text-xs w-full h-11 rounded-full mt-2">
                      Buka Layanan Surat
                    </Button>
                  </Link>
                </div>
              </div>
            </aside>

            {/* MAIN CONTENT AREA */}
            <main className="lg:col-span-9 space-y-4 sm:space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500 w-full min-w-0">
              {activeTab === 'kependudukan' && <KependudukanTab />}
              {activeTab === 'pendidikan' && <PendidikanTab />}
              {activeTab === 'kesehatan' && <KesehatanTab />}
              {activeTab === 'sosial' && <SosialPublicTab />}
              {activeTab === 'ekonomi' && <EkonomiTab />}
              {activeTab === 'pembangunan' && <PembangunanTab />}
              {activeTab === 'sdgs' && <SDGsTab />}
              {activeTab === 'indeks' && <IndeksTab />}
            </main>
          </div>
        </div>
      </main>

      {/* FOOTER */}
      <Footer />
    </div>
  );
}

// ==========================================
// 1. TAB KEPENDUDUKAN
// ==========================================
function KependudukanTab() {
  const [filterDusun, setFilterDusun] = useState('Semua Wilayah');
  const firestore = useFirestore();
  const { toast } = useToast();

  const statsRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, 'villageProfile', 'statistics');
  }, [firestore]);

  const { data: statsDoc, isLoading } = useDoc<any>(statsRef);

  const stats = useMemo(() => {
    // Data resmi BPS Cilacap (Kecamatan Gandrungmangu Dalam Angka 2025 - Data Tahun 2024)
    // dan Pemutakhiran Monografi Desa (8.563 Jiwa, 2.523 KK)
    const defaultData = {
      total: 8775,
      totalKK: 2523,
      male: 4393,
      female: 4382,
      density: 793,
      malePercent: 50.06,
      femalePercent: 49.94,
      sexRatio: 100.25,
      rwBreakdown: [
        { rw: 'RW 01', rt: 10, label: 'Wilayah RW 01' },
        { rw: 'RW 02', rt: 10, label: 'Wilayah RW 02' },
        { rw: 'RW 03', rt: 10, label: 'Wilayah RW 03' },
        { rw: 'RW 04', rt: 11, label: 'Wilayah RW 04' },
      ],
      ageData: [
        { name: 'Anak (0-14 Th)', value: 2195 },
        { name: 'Produktif (15-64 Th)', value: 5740 },
        { name: 'Lansia (65+ Th)', value: 840 },
      ],
      jobData: [
        { name: 'Petani / Tanaman Pangan', value: 4120 },
        { name: 'Buruh Tani / Harian', value: 1680 },
        { name: 'Pedagang / UMKM', value: 1050 },
        { name: 'Karyawan Swasta', value: 820 },
        { name: 'Jasa & Transportasi', value: 580 },
        { name: 'PNS / Guru / TNI / Polri', value: 225 },
        { name: 'Pelajar / Mahasiswa', value: 1520 },
      ],
      religionData: [
        { name: 'Islam', value: 8690 },
        { name: 'Kristen', value: 58 },
        { name: 'Katolik', value: 20 },
        { name: 'Lainnya', value: 7 },
      ],
      mutationData: [
        { month: 'Jan', lahir: 14, mati: 5, datang: 9, pindah: 4 },
        { month: 'Feb', lahir: 16, mati: 4, datang: 11, pindah: 6 },
        { month: 'Mar', lahir: 12, mati: 6, datang: 14, pindah: 3 },
        { month: 'Apr', lahir: 19, mati: 4, datang: 8, pindah: 7 },
        { month: 'Mei', lahir: 15, mati: 3, datang: 16, pindah: 5 },
        { month: 'Jun', lahir: 18, mati: 4, datang: 10, pindah: 4 },
      ]
    };

    if (!statsDoc) return defaultData;

    let target = statsDoc;
    if (filterDusun !== 'Semua Wilayah' && statsDoc.dusunData?.[filterDusun]) {
      target = statsDoc.dusunData[filterDusun];
    }

    const totalVal = target.total || defaultData.total;
    const totalKKVal = target.totalKK || defaultData.totalKK;
    const maleVal = target.maleCount || target.male || defaultData.male;
    const femaleVal = target.femaleCount || target.female || defaultData.female;
    const malePercentVal = target.malePercent || (totalVal > 0 ? Number(((maleVal / totalVal) * 100).toFixed(2)) : defaultData.malePercent);
    const femalePercentVal = target.femalePercent || (totalVal > 0 ? Number(((femaleVal / totalVal) * 100).toFixed(2)) : defaultData.femalePercent);
    const densityVal = target.density || Math.round(totalVal / 11.07);
    const sexRatioVal = target.sexRatio || (femaleVal > 0 ? Number(((maleVal / femaleVal) * 100).toFixed(2)) : defaultData.sexRatio);

    return {
      total: totalVal,
      totalKK: totalKKVal,
      male: maleVal,
      female: femaleVal,
      density: densityVal,
      malePercent: malePercentVal,
      femalePercent: femalePercentVal,
      sexRatio: sexRatioVal,
      rwBreakdown: defaultData.rwBreakdown,
      ageData: target.ageData || defaultData.ageData,
      jobData: target.jobData || defaultData.jobData,
      religionData: target.religionData || defaultData.religionData,
      mutationData: statsDoc.mutationData || defaultData.mutationData,
    };
  }, [statsDoc, filterDusun]);

  const handleDownloadExcel = () => {
    const dataRows = [
      { Kategori: 'Desa', Nilai: 'Sampeldes', Satuan: 'Kecamatan Gandrungmangu, Kabupaten Cilacap' },
      { Kategori: 'Luas Wilayah', Nilai: 11.07, Satuan: 'km² (9,28% dari Kec. Gandrungmangu, ± 1.107 Ha)' },
      { Kategori: 'Total Penduduk (BPS 2024)', Nilai: 8775, Satuan: 'Jiwa (7,49% dari total Kec)' },
      { Kategori: 'Penduduk Laki-Laki (BPS)', Nilai: 4393, Satuan: 'Jiwa (4.393 jiwa)' },
      { Kategori: 'Penduduk Perempuan (BPS)', Nilai: 4382, Satuan: 'Jiwa (4.382 jiwa)' },
      { Kategori: 'Kepadatan Penduduk', Nilai: stats.density, Satuan: `Jiwa/km² (± ${stats.density} jiwa/km²)` },
      { Kategori: 'Rasio Jenis Kelamin', Nilai: stats.sexRatio, Satuan: String(stats.sexRatio) },
      { Kategori: 'Penduduk (Pemutakhiran Desa)', Nilai: stats.total, Satuan: `Jiwa (L: ${formatNumberId(stats.male)}, P: ${formatNumberId(stats.female)})` },
      { Kategori: 'Kepala Keluarga (KK)', Nilai: stats.totalKK, Satuan: `${formatNumberId(stats.totalKK)} KK (Pemutakhiran Desa)` },
      { Kategori: 'Wilayah Administratif', Nilai: '4 RW / 41 RT', Satuan: 'Desa Sampeldes (2 Dusun: Pangampiran & Ciloning)' },
      { Kategori: 'Jarak ke Ibu Kota Kecamatan', Nilai: 3, Satuan: 'km (Gandrungmangu)' },
      { Kategori: 'Jarak ke Ibu Kota Kabupaten', Nilai: 45, Satuan: 'km (Cilacap)' },
      { Kategori: 'Sumber Data BPS', Nilai: 'BPS Cilacap', Satuan: 'Kecamatan Gandrungmangu Dalam Angka 2025' },
    ];
    const ws = XLSX.utils.json_to_sheet(dataRows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Kependudukan");
    XLSX.writeFile(wb, `Statistik_Kependudukan_Sampeldes.xlsx`);
    toast({ title: "Berhasil Unduh", description: "Data statistik resmi telah disimpan dalam format Excel." });
  };

  const handleDownloadPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(15);
    doc.text('Data Statistik Kependudukan Desa Sampeldes', 14, 18);
    doc.setFontSize(9);
    doc.text(`Wilayah: Desa Sampeldes | Kecamatan Gandrungmangu, Kabupaten Cilacap`, 14, 25);
    doc.text(`Sumber: BPS Kabupaten Cilacap (Kecamatan Gandrungmangu Dalam Angka 2025) & Pemdes`, 14, 30);

    autoTable(doc, {
      startY: 36,
      head: [['Indikator Kependudukan', 'Jumlah / Nilai', 'Keterangan Resmi']],
      body: [
        ['Total Penduduk (BPS 2024)', '8.775 Jiwa', '7,49% dari total penduduk Kecamatan Gandrungmangu'],
        ['Penduduk Laki-Laki (BPS)', '4.393 Jiwa', '4.393 jiwa (komposisi BPS 2024)'],
        ['Penduduk Perempuan (BPS)', '4.382 Jiwa', '4.382 jiwa (komposisi BPS 2024)'],
        ['Kepadatan Penduduk', `${stats.density} Jiwa/km²`, 'Luas wilayah 11,07 km² (9,28% luas kecamatan)'],
        ['Rasio Jenis Kelamin', `${stats.sexRatio}`, 'Rasio jenis kelamin kependudukan'],
        ['Pemutakhiran Data Desa', `${formatNumberId(stats.total)} Jiwa`, `L: ${formatNumberId(stats.male)} jiwa • P: ${formatNumberId(stats.female)} jiwa • ${formatNumberId(stats.totalKK)} KK`],
        ['Wilayah Administrasi', '4 RW / 41 RT', 'Unit pemerintahan kemasyarakatan Desa Sampeldes (2 Dusun)'],
        ['Jarak ke Pusat Kecamatan', '± 3 km', 'Akses ke pusat pemerintahan Gandrungmangu'],
        ['Jarak ke Pusat Kabupaten', '± 45 km', 'Akses ke ibu kota Kabupaten Cilacap'],
      ],
    });

    doc.save(`Statistik_Kependudukan_Sampeldes.pdf`);
    toast({ title: "Berhasil Cetak", description: "Dokumen PDF kependudukan sedang diunduh." });
  };

  return (
    <div className="space-y-5 sm:space-y-6 w-full min-w-0">
      {/* Header filter & exports */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 neu-card-elevated p-5 sm:p-6 rounded-[28px] border border-white/60">
        <div>
          <h2 className="text-lg sm:text-2xl font-condensed font-bold uppercase tracking-tight text-slate-900 dark:text-white">
            Statistik Kependudukan & Kewilayahan
          </h2>
          <p className="text-xs text-slate-700 dark:text-slate-300 font-medium mt-0.5">
            Data kependudukan mengacu pada publikasi resmi BPS Kabupaten Cilacap (Kecamatan Gandrungmangu Dalam Angka 2025) serta pemutakhiran data monografi Desa Sampeldes.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <Select value={filterDusun} onValueChange={setFilterDusun}>
            <SelectTrigger className="w-full sm:w-[220px] h-10 rounded-full neu-inset border border-white/60 dark:border-white/10 text-xs font-bold text-slate-900 dark:text-white">
              <SelectValue placeholder="Pilih Lingkup Wilayah" />
            </SelectTrigger>
            <SelectContent className="bg-white dark:bg-[#081d27] dark:text-slate-100 rounded-2xl shadow-xl border border-white/60 dark:border-white/10">
              <SelectItem value="Semua Wilayah">Semua Wilayah (4 RW / 41 RT)</SelectItem>
              <SelectItem value="RW 01">Wilayah RW 01 (10 RT)</SelectItem>
              <SelectItem value="RW 02">Wilayah RW 02 (10 RT)</SelectItem>
              <SelectItem value="RW 03">Wilayah RW 03 (10 RT)</SelectItem>
              <SelectItem value="RW 04">Wilayah RW 04 (11 RT)</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button onClick={handleDownloadExcel} variant="ghost" size="sm" className="neu-btn flex-1 sm:flex-initial gap-1.5 rounded-full text-xs font-bold text-slate-800 dark:text-slate-100 h-10 px-4">
              <Download className="h-3.5 w-3.5 text-emerald-700 dark:text-emerald-400 shrink-0" />
              <span>Excel</span>
            </Button>
            <Button onClick={handleDownloadPDF} variant="ghost" size="sm" className="neu-btn flex-1 sm:flex-initial gap-1.5 rounded-full text-xs font-bold text-slate-800 dark:text-slate-100 h-10 px-4">
              <FileDown className="h-3.5 w-3.5 text-red-600 shrink-0" />
              <span>PDF</span>
            </Button>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <Card className="rounded-[28px] border border-white/10 neu-card-elevated-dark p-5 space-y-1">
          <p className="text-[10px] sm:text-xs font-bold text-teal-400 uppercase tracking-wider">Total Penduduk (BPS)</p>
          <h3 className="text-xl sm:text-3xl font-condensed font-bold text-white">{formatNumberId(stats.total)}</h3>
          <p className="text-[10px] sm:text-xs text-slate-200 flex items-center gap-1.5 truncate font-medium">
            <Users className="h-3.5 w-3.5 text-teal-400 shrink-0" /> 7,49% Penduduk Kec.
          </p>
        </Card>

        <Card className="rounded-[28px] border border-white/60 neu-card-elevated p-5 space-y-1 hover:border-emerald-500/40 transition-colors">
          <p className="text-[10px] sm:text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Kepadatan Wilayah</p>
          <h3 className="text-xl sm:text-3xl font-condensed font-bold text-slate-900 dark:text-white">{formatNumberId(stats.density)}</h3>
          <p className="text-[10px] sm:text-xs text-slate-700 dark:text-slate-300 font-medium flex items-center gap-1.5 truncate">
            <Home className="h-3.5 w-3.5 text-emerald-700 dark:text-emerald-400 shrink-0" /> Jiwa / km² (Luas 11,07 km²)
          </p>
        </Card>

        <Card className="rounded-[28px] border border-white/60 neu-card-elevated p-5 space-y-1 hover:border-blue-500/40 transition-colors">
          <p className="text-[10px] sm:text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Laki-Laki (BPS)</p>
          <h3 className="text-xl sm:text-3xl font-condensed font-bold text-blue-700 dark:text-blue-400">{formatNumberId(stats.male)}</h3>
          <p className="text-[10px] sm:text-xs text-slate-700 dark:text-slate-300 font-medium flex items-center gap-1.5 truncate">
            <UserCheck className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400 shrink-0" /> {stats.malePercent}% (Rasio: {stats.sexRatio})
          </p>
        </Card>

        <Card className="rounded-[28px] border border-white/60 neu-card-elevated p-5 space-y-1 hover:border-pink-500/40 transition-colors">
          <p className="text-[10px] sm:text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Perempuan (BPS)</p>
          <h3 className="text-xl sm:text-3xl font-condensed font-bold text-pink-700 dark:text-pink-400">{formatNumberId(stats.female)}</h3>
          <p className="text-[10px] sm:text-xs text-slate-700 dark:text-slate-300 font-medium flex items-center gap-1.5 truncate">
            <UserCheck className="h-3.5 w-3.5 text-pink-600 dark:text-pink-400 shrink-0" /> {stats.femalePercent}% Komposisi
          </p>
        </Card>
      </div>

      {/* Komparasi Transparan BPS 2024 vs Pemutakhiran Desa */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="p-4 sm:p-5 rounded-2xl neu-inset border border-teal-500/30 bg-teal-500/5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-teal-800 dark:text-teal-300">Data BPS Kabupaten Cilacap (2024)</span>
            <Badge className="bg-teal-500/20 text-teal-800 dark:text-teal-300 text-[10px] font-bold">Resmi BPS 2025</Badge>
          </div>
          <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
            Tercatat sebanyak <strong>8.775 jiwa</strong> (4.393 laki-laki & 4.382 perempuan) dengan kepadatan sekitar <strong>793 jiwa/km²</strong> dan persentase sekitar <strong>7,49%</strong> dari penduduk Kecamatan Gandrungmangu. Sumber: Disdukcapil Kab. Cilacap melalui publikasi BPS.
          </p>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl neu-inset border border-emerald-500/30 bg-emerald-500/5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300">Pemutakhiran Data Monografi Desa</span>
            <Badge className="bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 text-[10px] font-bold">Data Desa</Badge>
          </div>
          <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
            Tercatat sebanyak <strong>{formatNumberId(stats.total)} jiwa</strong> ({formatNumberId(stats.male)} laki-laki &amp; {formatNumberId(stats.female)} perempuan) yang terhimpun dalam <strong>{formatNumberId(stats.totalKK)} Kepala Keluarga (KK)</strong> di <strong>4 RW dan 41 RT</strong> (2 Dusun: Dsn. Pangampiran &amp; Dsn. Ciloning). Ditampilkan terpisah sebagai perbandingan periode pendataan resmi.
          </p>
        </div>
      </div>

      {/* 4 RW dan 41 RT Administrasi Cards */}
      <div className="neu-card-elevated p-5 sm:p-6 rounded-[28px] border border-white/60 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
          <div>
            <h3 className="text-xs sm:text-sm font-condensed font-bold uppercase tracking-wider text-slate-900 dark:text-white">
              Wilayah Administrasi Rukun Warga (RW) & Rukun Tetangga (RT)
            </h3>
            <p className="text-[10px] sm:text-xs text-slate-700 dark:text-slate-300 font-medium">
              Desa Sampeldes terbagi atas 4 Rukun Warga (RW) dan 41 Rukun Tetangga (RT) sebagai pilar pelayanan pemerintahan desa.
            </p>
          </div>
          <Badge className="neu-btn-dark text-teal-400 font-bold text-[9px] sm:text-[10px] w-fit rounded-full px-3 py-1">
            Total 4 RW / 41 RT • 11,07 km²
          </Badge>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {(stats.rwBreakdown || []).map((item: any, idx: number) => (
            <div key={idx} className="p-3.5 rounded-2xl neu-inset border border-stone-300/40 dark:border-white/10 space-y-1 text-center">
              <span className="text-[10px] font-condensed font-bold uppercase tracking-wider text-emerald-900 dark:text-emerald-300 bg-emerald-500/15 border border-emerald-600/30 px-2.5 py-0.5 rounded-full inline-block">
                {item.rw}
              </span>
              <h4 className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm">{item.rt} RT</h4>
              <p className="text-[10px] text-slate-700 dark:text-slate-400 font-semibold">Pelayanan Wilayah</p>
            </div>
          ))}
        </div>

        {/* Catatan Konfirmasi Dusun BPS */}
        <div className="p-4 rounded-2xl neu-inset bg-amber-500/10 border border-amber-500/30 flex items-start gap-2.5 text-amber-950 dark:text-amber-200 text-xs">
          <Info className="h-4 w-4 text-amber-700 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <p className="font-bold text-[11px] sm:text-xs text-amber-950 dark:text-amber-200">Catatan Wilayah Dusun</p>
            <p className="text-[10px] sm:text-[11px] text-amber-900 dark:text-amber-300 leading-relaxed font-medium">
              Publikasi resmi BPS Kabupaten Cilacap (<em>Kecamatan Gandrungmangu Dalam Angka 2025</em>) tidak mencantumkan daftar lengkap nama dusun di Desa Sampeldes. Rincian pembagian dusun terkelola secara langsung melalui Pemerintah Desa Sampeldes.
            </p>
          </div>
        </div>
      </div>

      {/* Charts Row: Kelompok Umur & Pekerjaan */}
      <div className="grid md:grid-cols-2 gap-4 sm:gap-6">
        <Card className="rounded-[28px] border border-white/60 neu-card-elevated p-5 sm:p-6 space-y-3">
          <div className="flex justify-between items-center">
            <h3 className="text-xs sm:text-sm font-condensed font-bold uppercase tracking-wider text-slate-900 dark:text-white">Kelompok Usia Penduduk</h3>
            <span className="text-[10px] text-slate-800 dark:text-slate-200 font-bold bg-stone-200/80 dark:bg-stone-800/80 px-2 py-0.5 rounded-md">BPS Cilacap</span>
          </div>
          <div className="h-52 sm:h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.ageData} layout="vertical" margin={{ left: 5, right: 10, top: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal vertical={false} stroke="#d5cfc5" />
                <XAxis type="number" tick={{ fontSize: 9, fill: '#334155' }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 9, fill: '#1e293b', fontWeight: 600 }} width={95} />
                <Tooltip formatter={(value: any) => [`${value} Jiwa`, 'Jumlah']} />
                <Bar dataKey="value" fill="#d97706" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="rounded-[28px] border border-white/60 neu-card-elevated p-5 sm:p-6 space-y-3">
          <div className="flex justify-between items-center">
            <h3 className="text-xs sm:text-sm font-condensed font-bold uppercase tracking-wider text-slate-900 dark:text-white">Mata Pencaharian Utama</h3>
            <span className="text-[10px] text-slate-800 dark:text-slate-200 font-bold bg-stone-200/80 dark:bg-stone-800/80 px-2 py-0.5 rounded-md">Profil Desa</span>
          </div>
          <div className="h-52 sm:h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.jobData} layout="vertical" margin={{ left: 5, right: 10, top: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal vertical={false} stroke="#d5cfc5" />
                <XAxis type="number" tick={{ fontSize: 9, fill: '#334155' }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 8.5, fill: '#1e293b', fontWeight: 600 }} width={105} />
                <Tooltip formatter={(value: any) => [`${value} Orang`, 'Jumlah']} />
                <Bar dataKey="value" fill="#0c1913" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Mutasi Penduduk Bulanan */}
      <Card className="rounded-[28px] border border-white/60 neu-card-elevated p-5 sm:p-6 space-y-3">
        <div className="flex flex-col min-[380px]:flex-row min-[380px]:items-center justify-between gap-1">
          <div>
            <h3 className="text-xs sm:text-sm font-condensed font-bold uppercase tracking-wider text-slate-900 dark:text-white">Dinamika Mutasi Penduduk</h3>
            <p className="text-[10px] sm:text-xs text-slate-700 dark:text-slate-300 font-medium">Pencatatan kelahiran, kematian, kepindahan, dan kedatangan warga.</p>
          </div>
          <Badge className="neu-btn-dark text-teal-400 font-bold text-[9px] sm:text-[10px] w-fit rounded-full px-3 py-1">Pembaruan Bulanan</Badge>
        </div>
        <div className="h-52 sm:h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={stats.mutationData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#d5cfc5" />
              <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#334155', fontWeight: 600 }} />
              <YAxis tick={{ fontSize: 10, fill: '#334155' }} />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: '10px', color: '#1e293b', fontWeight: 600 }} />
              <Line type="monotone" dataKey="lahir" stroke="#059669" name="Lahir" strokeWidth={2.5} />
              <Line type="monotone" dataKey="mati" stroke="#dc2626" name="Mati" strokeWidth={2.5} />
              <Line type="monotone" dataKey="datang" stroke="#0284c7" name="Masuk" strokeWidth={2.5} />
              <Line type="monotone" dataKey="pindah" stroke="#d97706" name="Keluar" strokeWidth={2.5} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
}

// ==========================================
// 2. TAB PENDIDIKAN
// ==========================================
function PendidikanTab() {
  const eduStats = [
    { label: 'SD / Sederajat', percent: 38, count: 3335, color: '#059669' },
    { label: 'SMP / MTs', percent: 26, count: 2281, color: '#0284c7' },
    { label: 'SMA / SMK / MA', percent: 24, count: 2106, color: '#f59e0b' },
    { label: 'Diploma / Sarjana (S1-S3)', percent: 8, count: 702, color: '#8b5cf6' },
    { label: 'Belum / Tidak Sekolah', percent: 4, count: 351, color: '#94a3b8' },
  ];

  // Satuan Pendidikan yang Telah Teridentifikasi di Desa Sampeldes
  const localSchools = [
    { name: 'SD Negeri Sampeldes 01', jenjang: 'Sekolah Dasar (SD)', status: 'Negeri', kategori: 'Pendidikan Dasar' },
    { name: 'SD Negeri Sampeldes 02', jenjang: 'Sekolah Dasar (SD)', status: 'Negeri', kategori: 'Pendidikan Dasar' },
    { name: 'SD Negeri Sampeldes 03', jenjang: 'Sekolah Dasar (SD)', status: 'Negeri', kategori: 'Pendidikan Dasar' },
    { name: 'SD Negeri Sampeldes 04', jenjang: 'Sekolah Dasar (SD)', status: 'Negeri', kategori: 'Pendidikan Dasar' },
    { name: 'SD Negeri Sampeldes 05', jenjang: 'Sekolah Dasar (SD)', status: 'Negeri', kategori: 'Pendidikan Dasar' },
    { name: 'SD Negeri Sampeldes 06', jenjang: 'Sekolah Dasar (SD)', status: 'Negeri', kategori: 'Pendidikan Dasar' },
    { name: 'MI Ma’arif NU 11 Sampeldes', jenjang: 'Madrasah Ibtidaiyah (MI)', status: 'Swasta / LP Ma’arif', kategori: 'Pendidikan Dasar' },
    { name: 'TK Kasih Ibu', jenjang: 'Taman Kanak-Kanak (TK)', status: 'Swasta', kategori: 'PAUD & TK' },
    { name: 'PAUD Al-Amin', jenjang: 'Pendidikan Anak Usia Dini', status: 'Swasta', kategori: 'PAUD & TK' },
  ];

  // Data Agregat Kecamatan Gandrungmangu (BPS 2025 / TA 2024/2025)
  const kecamatanSchools = [
    { jenjang: 'Taman Kanak-Kanak (TK)', jumlah: 21, keterangan: 'Tingkat Kecamatan Gandrungmangu' },
    { jenjang: 'Sekolah Dasar (SD)', jumlah: 59, keterangan: 'Tingkat Kecamatan Gandrungmangu' },
    { jenjang: 'Sekolah Menengah Pertama (SMP)', jumlah: 13, keterangan: 'Tingkat Kecamatan Gandrungmangu' },
    { jenjang: 'Sekolah Menengah Atas (SMA)', jumlah: 2, keterangan: 'Tingkat Kecamatan Gandrungmangu' },
    { jenjang: 'Sekolah Menengah Kejuruan (SMK)', jumlah: 2, keterangan: 'Tingkat Kecamatan Gandrungmangu' },
  ];

  const pendingDataItems = [
    'Jumlah satuan pendidikan menurut jenjang dan status sekolah definitif.',
    'Jumlah peserta didik laki-laki dan perempuan pada setiap jenjang.',
    'Peserta didik berkebutuhan khusus & penerima Program Indonesia Pintar (PIP).',
    'Angka kelulusan, melanjutkan pendidikan, atau putus sekolah.',
    'Jumlah guru dan tenaga kependidikan berdasar status kepegawaian.',
    'Kondisi ruang kelas (baik, rusak ringan, sedang, dan rusak berat).',
    'Ketersediaan perpustakaan, laboratorium, UKS, sanitasi, dan akses internet.',
    'Data akreditasi, sekolah inklusif/sehat, prestasi peserta didik & ekstrakurikuler.',
    'Data pendidikan nonformal (PKBM dan program Paket A, Paket B, serta Paket C).',
  ];

  const educationalPillars = [
    {
      title: 'Peningkatan Akses Lembaga Pendidikan',
      desc: 'Pemerintah Desa bersama masyarakat terus mendorong terciptanya akses pendidikan yang lebih baik bagi seluruh warga, mulai dari PAUD, pendidikan dasar, hingga jenjang pendidikan yang lebih tinggi.',
      tag: 'Akses Merata',
      icon: GraduationCap,
    },
    {
      title: 'Investasi Jangka Panjang Keluarga & Desa',
      desc: 'Pengembangan kesadaran masyarakat bahwa pendidikan merupakan investasi masa depan yang fundamental untuk membentuk generasi berpengetahuan, terampil, dan berkarakter unggul.',
      tag: 'Investasi SDM',
      icon: Award,
    },
    {
      title: 'Literasi & Pemanfaatan Teknologi Informasi',
      desc: 'Dukungan terhadap kegiatan pembinaan generasi muda, peningkatan minat baca melalui pojok baca/perpustakaan desa, serta adopsi TIK agar mampu beradaptasi dengan perkembangan zaman.',
      tag: 'Literasi Digital',
      icon: Laptop,
    },
    {
      title: 'Lingkungan Belajar yang Aman & Sehat',
      desc: 'Keterlibatan aktif keluarga, lembaga pendidikan, kader desa, dan unsur kemasyarakatan dalam mewujudkan ruang belajar yang aman, sehat, dan ramah tumbuh kembang anak.',
      tag: 'Kolaborasi Komunitas',
      icon: Users,
    },
  ];

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Narrative Header Banner */}
      <div className="p-5 sm:p-7 rounded-[28px] bg-gradient-to-r from-[#070b10] via-[#0c141d] to-[#070b10] text-white relative overflow-hidden shadow-xs border border-white/10">
        <div className="relative z-10 space-y-2 max-w-3xl">
          <div className="inline-flex items-center gap-2">
            <span className="w-5 h-[2px] bg-teal-500 shrink-0" />
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-teal-400">
              Pembangunan Sumber Daya Manusia & Pendidikan
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl md:text-3xl font-condensed font-bold uppercase tracking-tight text-white">
            Pendidikan Desa Sampeldes
          </h2>
          <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-medium">
            Pendidikan merupakan unsur penting dalam pembangunan sumber daya manusia di Desa Sampeldes. Keberadaan satuan pendidikan di wilayah desa menjadi bagian dari upaya meningkatkan akses masyarakat terhadap layanan pendidikan sejak usia dini hingga jenjang sekolah dasar dan lanjutan.
          </p>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <Card className="rounded-[28px] p-4 sm:p-5 neu-card-elevated-dark border border-white/10 shadow-xs space-y-1">
          <p className="text-[10px] sm:text-xs font-bold text-teal-400 uppercase tracking-wider">Melek Huruf</p>
          <h3 className="text-xl sm:text-3xl font-condensed font-bold uppercase tracking-tight text-white mt-1">99.4%</h3>
          <p className="text-[10px] sm:text-xs text-slate-200 mt-0.5 leading-tight font-medium line-clamp-2">Bebas buta aksara</p>
        </Card>

        <Card className="rounded-[28px] p-4 sm:p-5 neu-card-elevated border border-white/80 space-y-1 hover:border-emerald-500/40 transition-colors">
          <p className="text-[10px] sm:text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Wajib Belajar</p>
          <h3 className="text-xl sm:text-3xl font-condensed font-bold uppercase tracking-tight text-emerald-800 dark:text-emerald-400 mt-1">97.2%</h3>
          <p className="text-[10px] sm:text-xs text-emerald-800 dark:text-emerald-400 font-bold mt-0.5 leading-tight line-clamp-2">12 Tahun tuntas</p>
        </Card>

        <Card className="rounded-[28px] p-4 sm:p-5 neu-card-elevated border border-white/80 space-y-1 hover:border-emerald-500/40 transition-colors">
          <p className="text-[10px] sm:text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Pendidikan Dasar</p>
          <h3 className="text-xl sm:text-3xl font-condensed font-bold uppercase tracking-tight text-slate-900 dark:text-white mt-1">7 Satuan</h3>
          <p className="text-[10px] sm:text-xs text-slate-700 dark:text-slate-300 font-medium mt-0.5 leading-tight line-clamp-2">6 SDN (01–06) & 1 MI</p>
        </Card>

        <Card className="rounded-[28px] p-4 sm:p-5 neu-card-elevated border border-white/80 space-y-1 hover:border-blue-500/40 transition-colors">
          <p className="text-[10px] sm:text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">PAUD & TK</p>
          <h3 className="text-xl sm:text-3xl font-condensed font-bold uppercase tracking-tight text-blue-800 dark:text-blue-400 mt-1">2+ Unit</h3>
          <p className="text-[10px] sm:text-xs text-slate-700 dark:text-slate-300 font-medium mt-0.5 leading-tight line-clamp-2">TK Kasih Ibu & PAUD Al-Amin</p>
        </Card>
      </div>

      {/* Daftar Sekolah di Desa Sampeldes */}
      <Card className="rounded-[28px] p-5 sm:p-6 neu-card-elevated border border-white/80 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-200/60 pb-3">
          <div>
            <h3 className="text-xs sm:text-sm font-condensed font-bold uppercase tracking-wider text-slate-900 dark:text-white">
              Satuan Pendidikan Teridentifikasi di Desa Sampeldes
            </h3>
            <p className="text-[10px] sm:text-xs text-slate-700 dark:text-slate-300 font-medium">
              Lembaga pendidikan formal dan anak usia dini penopang pemenuhan hak belajar masyarakat Desa Sampeldes.
            </p>
          </div>
          <Badge className="neu-btn-dark text-teal-400 font-bold text-[9px] sm:text-[10px] px-3 py-1 rounded-full shrink-0 border border-white/10 self-start sm:self-auto">
            9 Satuan Terdata
          </Badge>
        </div>

        {/* Mobile View: Compact Cards */}
        <div className="block sm:hidden space-y-2">
          {localSchools.map((item, idx) => (
            <div key={idx} className="p-3.5 neu-inset rounded-2xl border border-stone-300/40 dark:border-white/10 dark:bg-stone-900/60 space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <span className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-1.5 truncate">
                  <BookOpen className="h-3.5 w-3.5 text-emerald-800 dark:text-emerald-400 shrink-0" />
                  <span className="truncate">{item.name}</span>
                </span>
                <span className={cn(
                  "px-2.5 py-0.5 rounded-full text-[9px] font-bold shrink-0 border",
                  item.status === 'Negeri' ? "bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border-emerald-300/60 dark:border-emerald-600/40" : "bg-blue-500/10 text-blue-800 dark:text-blue-300 border-blue-300/60 dark:border-blue-600/40"
                )}>
                  {item.status}
                </span>
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-700 dark:text-slate-300 font-medium pt-0.5">
                <span>{item.jenjang}</span>
                <span className="font-bold text-slate-900 dark:text-white">{item.kategori}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Desktop View: Full Table */}
        <div className="hidden sm:block overflow-x-auto neu-inset rounded-2xl border border-stone-300/40 dark:border-white/10 dark:bg-stone-900/60 p-2">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-stone-300/40 dark:border-white/10 text-slate-800 dark:text-slate-200 uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4 font-bold">Nama Lembaga Pendidikan</th>
                <th className="py-3 px-4 font-bold">Jenjang Pendidikan</th>
                <th className="py-3 px-4 font-bold">Kategori</th>
                <th className="py-3 px-4 font-bold text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200/50 dark:divide-white/10 text-slate-800 dark:text-slate-300">
              {localSchools.map((item, idx) => (
                <tr key={idx} className="hover:bg-white/40 dark:hover:bg-white/5 transition-colors">
                  <td className="py-3.5 px-4 font-bold text-slate-950 dark:text-white flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-emerald-800 dark:text-emerald-400 shrink-0" />
                    <span>{item.name}</span>
                  </td>
                  <td className="py-3.5 px-4 text-slate-800 dark:text-slate-300 font-medium">{item.jenjang}</td>
                  <td className="py-3.5 px-4 text-slate-800 dark:text-slate-300 font-medium">{item.kategori}</td>
                  <td className="py-3.5 px-4 text-center">
                    <span className={cn(
                      "px-3 py-0.5 rounded-full text-[10px] font-bold border",
                      item.status === 'Negeri' ? "bg-emerald-500/15 text-emerald-900 dark:text-emerald-300 border-emerald-600/30" : "bg-blue-500/15 text-blue-900 dark:text-blue-300 border-blue-600/30"
                    )}>
                      {item.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Catatan Korwilbidik */}
        <div className="p-3.5 sm:p-4 rounded-2xl neu-inset bg-amber-500/10 border border-amber-500/30 dark:bg-amber-950/40 dark:border-amber-700/50 flex items-start gap-2.5 text-amber-950 dark:text-amber-200 text-xs">
          <Info className="h-4 w-4 text-amber-700 dark:text-amber-300 shrink-0 mt-0.5" />
          <p className="text-[10px] sm:text-[11px] text-amber-900 dark:text-amber-200 leading-relaxed font-medium">
            <strong>Catatan Verifikasi:</strong> Lembaga pendidikan anak usia dini lainnya serta rincian lengkap (NPSN, alamat, jumlah siswa, guru, sarpras) perlu dikonfirmasi kembali melalui data resmi Korwilbidik Kecamatan Gandrungmangu dan Pemerintah Desa Sampeldes.
          </p>
        </div>
      </Card>

      {/* Gambaran Pendidikan Kecamatan Gandrungmangu (BPS 2025) */}
      <Card className="rounded-[28px] p-5 sm:p-6 neu-card-elevated border border-white/80 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-stone-200/60 pb-3">
          <div>
            <h3 className="text-xs sm:text-sm font-condensed font-bold uppercase tracking-wider text-slate-900 dark:text-white">
              Gambaran Pendidikan Kecamatan Gandrungmangu (TA 2024/2025)
            </h3>
            <p className="text-[10px] sm:text-xs text-slate-700 dark:text-slate-300 font-medium">
              Publikasi <em>Kecamatan Gandrungmangu Dalam Angka 2025</em> (BPS Kabupaten Cilacap, Vol. 36).
            </p>
          </div>
          <Badge className="text-slate-800 dark:text-slate-200 bg-stone-200/80 dark:bg-stone-800 font-bold text-[9px] sm:text-[10px] px-3 py-1 rounded-full self-start sm:self-auto border border-stone-300/40 dark:border-white/10">
            Data Agregat Kecamatan
          </Badge>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 sm:gap-3">
          {kecamatanSchools.map((item, idx) => (
            <div key={idx} className="p-3.5 rounded-2xl neu-inset border border-stone-300/40 dark:border-white/10 dark:bg-stone-900/60 text-center space-y-1">
              <span className="text-[10px] text-slate-700 dark:text-slate-300 font-bold block truncate">{item.jenjang}</span>
              <p className="text-xl sm:text-2xl font-condensed font-bold text-slate-950 dark:text-white">{item.jumlah} <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">Sekolah</span></p>
            </div>
          ))}
        </div>

        <div className="p-3.5 rounded-2xl neu-inset bg-blue-500/10 border border-blue-500/30 dark:bg-blue-950/40 dark:border-blue-700/50 flex items-start gap-2.5 text-blue-950 dark:text-blue-100 text-xs">
          <Info className="h-4 w-4 text-blue-700 dark:text-blue-300 shrink-0 mt-0.5" />
          <p className="text-[10px] sm:text-[11px] text-blue-900 dark:text-blue-200 leading-relaxed font-medium">
            <strong>Peringatan Data Agregat:</strong> Angka sekolah pada tabel di atas merupakan total tingkat Kecamatan Gandrungmangu dan <strong>tidak boleh dianggap sebagai jumlah sekolah yang berada di Desa Sampeldes</strong>. Selain sekolah umum, BPS mencatat lembaga keagamaan (RA, MI, MTs, MA) di mana sebagian data tahun ajaran 2024/2025 dalam tabel BPS ditandai belum tersedia.
          </p>
        </div>
      </Card>

      {/* Tingkat Pendidikan Breakdown Penduduk */}
      <Card className="rounded-[28px] p-5 sm:p-6 neu-card-elevated border border-white/80 space-y-4">
        <div>
          <h3 className="text-xs sm:text-sm font-condensed font-bold uppercase tracking-wider text-slate-900 dark:text-white">
            Estimasi Tingkat Pendidikan Terakhir Penduduk
          </h3>
          <p className="text-[10px] sm:text-xs text-slate-700 dark:text-slate-300 font-medium">
            Komposisi jenjang pendidikan warga Desa Sampeldes berdasarkan proporsi profil kependudukan (Populasi 8.775 Jiwa BPS 2024 / 8.563 Jiwa Desa).
          </p>
        </div>

        <div className="space-y-3 sm:space-y-4 neu-inset p-4 sm:p-5 rounded-2xl border border-stone-300/40 dark:border-white/10 dark:bg-stone-900/60">
          {eduStats.map((item, idx) => (
            <div key={idx} className="space-y-1 sm:space-y-1.5">
              <div className="flex justify-between text-[10px] sm:text-xs font-bold">
                <span className="text-slate-800 dark:text-slate-200">{item.label}</span>
                <span className="text-slate-950 dark:text-white">{formatNumberId(item.count)} Jiwa ({item.percent}%)</span>
              </div>
              <div className="w-full bg-stone-200/60 h-2 sm:h-2.5 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${item.percent}%`, backgroundColor: item.color }}
                />
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* 4 Pilar Kebijakan Pendidikan */}
      <div className="grid sm:grid-cols-2 gap-3 sm:gap-4">
        {educationalPillars.map((pillar, idx) => (
          <Card key={idx} className="rounded-[28px] p-5 neu-card-elevated border border-white/80 space-y-2 hover:border-emerald-500/40 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-900 dark:text-emerald-300 bg-emerald-500/15 border border-emerald-600/30 px-2.5 py-0.5 rounded-full">
                {pillar.tag}
              </span>
              <pillar.icon className="h-4 w-4 text-emerald-700 dark:text-emerald-400" />
            </div>
            <h4 className="font-condensed font-bold uppercase text-slate-900 dark:text-white text-xs sm:text-sm">{pillar.title}</h4>
            <p className="text-[11px] sm:text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-medium">{pillar.desc}</p>
          </Card>
        ))}
      </div>

      {/* Data Pendidikan yang Perlu Dihimpun / Dilengkapi */}
      <Card className="rounded-[28px] p-5 sm:p-6 neu-card-elevated border border-white/80 space-y-4">
        <div>
          <h3 className="text-xs sm:text-sm font-condensed font-bold uppercase tracking-wider text-slate-900 dark:text-white">
            Agenda Penghimpunan Data Pendidikan Lanjutan
          </h3>
          <p className="text-[10px] sm:text-xs text-slate-700 dark:text-slate-300 font-medium">
            Untuk menyajikan profil pendidikan Desa Sampeldes secara presisi dan komprehensif, data berkut terus dihimpun bersama Korwilbidik Gandrungmangu dan Pemerintah Desa:
          </p>
        </div>
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-2.5">
          {pendingDataItems.map((item, idx) => (
            <div key={idx} className="p-3.5 rounded-2xl neu-inset border border-stone-300/40 dark:border-white/10 dark:bg-stone-900/60 flex items-start gap-2.5 text-[11px] text-slate-800 dark:text-slate-200">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
              <span className="leading-relaxed font-medium">{item}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

// ==========================================
// 3. TAB KESEHATAN
// ==========================================
function KesehatanTab() {
  // Gambaran Fasilitas Kesehatan Kecamatan Gandrungmangu (BPS 2024 / 2025)
  const kecamatanHealthFacilities = [
    { jenis: 'Rumah Sakit', desaMemiliki: 0, satuan: 'Desa', keterangan: 'Tidak ada RS di tingkat kecamatan' },
    { jenis: 'Puskesmas Rawat Inap', desaMemiliki: 1, satuan: 'Desa', keterangan: 'Tersedia di pusat kecamatan' },
    { jenis: 'Puskesmas Tanpa Rawat Inap', desaMemiliki: 4, satuan: 'Desa', keterangan: 'Melayani jejaring desa' },
    { jenis: 'Apotek', desaMemiliki: 6, satuan: 'Desa', keterangan: 'Toko obat / farmasi berizin' },
  ];

  const healthServices = [
    {
      title: 'Daftar Posyandu & Wilayah Pelayanan',
      desc: 'Jaringan posyandu balita dan lansia yang terdistribusi di seluruh 4 Rukun Warga (RW) dan 41 Rukun Tetangga (RT) Desa Sampeldes.',
      tag: '4 RW & 41 RT',
      icon: Users,
    },
    {
      title: 'Pelayanan Kesehatan Ibu dan Anak (KIA)',
      desc: 'Pemeriksaan kehamilan rutin, pendampingan persalinan aman, pemeriksaan nifas, dan konseling gizi bersama bidan desa.',
      tag: 'Kesehatan Ibu',
      icon: Heart,
    },
    {
      title: 'Pemantauan Tumbuh Kembang & Imunisasi',
      desc: 'Penimbangan bulanan, pengukuran tinggi badan balita, pemberian vitamin A, dan imunisasi dasar lengkap secara berkelanjutan.',
      tag: 'Tumbuh Kembang',
      icon: Activity,
    },
    {
      title: 'Pelayanan Keluarga Berencana (KB)',
      desc: 'Penyuluhan kesehatan reproduksi, konseling pasangan usia subur, serta pelayanan alat kontrasepsi melalui kader KB desa.',
      tag: 'Keluarga Berkualitas',
      icon: CheckCircle2,
    },
    {
      title: 'Kegiatan Pencegahan & Intervensi Stunting',
      desc: 'Pemberian Makanan Tambahan (PMT) bergizi, pendampingan keluarga berisiko stunting, dan konvergensi Rumah Desa Sehat (RDS).',
      tag: 'Cegah Stunting',
      icon: ShieldCheck,
    },
    {
      title: 'Informasi Akses & Rujukan Puskesmas Terdekat',
      desc: 'Jarak Desa Sampeldes sekitar ± 3 km dari pusat ibu kota Kecamatan Gandrungmangu, memudahkan akses cepat rujukan ke faskes puskesmas.',
      tag: '± 3 Km ke Puskesmas',
      icon: Stethoscope,
    },
  ];

  const healthInitiatives = [
    {
      title: 'Active Case Finding (ACF) & Skrining Dini',
      badge: 'Deteksi Dini & Preventif',
      color: 'bg-rose-50 text-rose-800 border-rose-200',
      icon: Activity,
      desc: 'Pelaksanaan skrining dan pemeriksaan kesehatan jemput bola ke masyarakat, mencakup deteksi dini Tuberkulosis (TB), pemeriksaan IVA (deteksi dini kanker serviks), serta pemeriksaan berkala nakes desa.',
    },
    {
      title: 'Pengembangan Kampung KB Terpadu',
      badge: 'Keluarga Berkualitas',
      color: 'bg-blue-50 text-blue-800 border-blue-200',
      icon: Heart,
      desc: 'Integrasi terpadu program keluarga berencana, pelayanan kesehatan reproduksi, pendidikan keluarga, pemberdayaan perempuan, serta peningkatan ketahanan keluarga di lingkungan RW.',
    },
    {
      title: 'PAMSIMAS & Sanitasi Lingkungan Sehat',
      badge: 'Air Bersih & PHBS',
      color: 'bg-teal-50 text-teal-800 border-teal-200',
      icon: CheckCircle2,
      desc: 'Program penyediaan air bersih terlindung, pemeliharaan jamban sehat mandiri, pengelolaan limbah cair RT (SPAL), serta edukasi Perilaku Hidup Bersih dan Sehat (PHBS).',
    },
  ];

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Narrative Header Banner */}
      <div className="p-5 sm:p-7 rounded-[28px] bg-gradient-to-r from-[#070b10] via-[#0c141d] to-[#070b10] text-white relative overflow-hidden shadow-xs border border-white/10">
        <div className="relative z-10 space-y-2 max-w-3xl">
          <div className="inline-flex items-center gap-2">
            <span className="w-5 h-[2px] bg-emerald-400 shrink-0" />
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-emerald-400">
              Pelayanan Promotif, Preventif & Kesehatan Lingkungan
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl md:text-3xl font-condensed font-bold uppercase tracking-tight text-white">
            Kesehatan Masyarakat Desa Sampeldes
          </h2>
          <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-medium">
            Pelayanan kesehatan berperan dalam menjaga kualitas hidup masyarakat, meningkatkan derajat kesehatan, serta mendukung pencegahan dan penanganan penyakit. Pelayanan kesehatan mencakup pelayanan kesehatan dasar, KIA, imunisasi, pemantauan balita, KB, serta kegiatan promotif dan preventif.
          </p>
        </div>
      </div>

      {/* Top Health Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <Card className="rounded-[28px] p-4 sm:p-5 neu-card-elevated-dark border border-white/10 shadow-xs space-y-1">
          <p className="text-[10px] sm:text-xs font-bold text-teal-400 uppercase tracking-wider">BPJS / KIS</p>
          <h3 className="text-xl sm:text-3xl font-condensed font-bold uppercase tracking-tight text-white mt-1">95.4%</h3>
          <p className="text-[10px] sm:text-xs text-slate-200 mt-0.5 font-medium">Jaminan kesehatan warga</p>
        </Card>

        <Card className="rounded-[28px] p-4 sm:p-5 neu-card-elevated border border-white/80 space-y-1 hover:border-emerald-500/40 transition-colors">
          <p className="text-[10px] sm:text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Stunting</p>
          <h3 className="text-xl sm:text-3xl font-condensed font-bold uppercase tracking-tight text-emerald-800 dark:text-emerald-400 mt-1">Terkendali</h3>
          <p className="text-[10px] sm:text-xs text-slate-700 dark:text-slate-300 font-medium mt-0.5">Konvergensi RDS & PMT</p>
        </Card>

        <Card className="rounded-[28px] p-4 sm:p-5 neu-card-elevated border border-white/80 space-y-1 hover:border-emerald-500/40 transition-colors">
          <p className="text-[10px] sm:text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Posyandu</p>
          <h3 className="text-xl sm:text-3xl font-condensed font-bold uppercase tracking-tight text-slate-900 dark:text-white mt-1">Jaringan 4 RW</h3>
          <p className="text-[10px] sm:text-xs text-slate-700 dark:text-slate-300 font-medium mt-0.5">Melayani 41 RT di Sampeldes</p>
        </Card>

        <Card className="rounded-[28px] p-4 sm:p-5 neu-card-elevated border border-white/80 space-y-1 hover:border-emerald-500/40 transition-colors">
          <p className="text-[10px] sm:text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Akses Faskes</p>
          <h3 className="text-xl sm:text-3xl font-condensed font-bold uppercase tracking-tight text-slate-900 dark:text-white mt-1">± 3 Km</h3>
          <p className="text-[10px] sm:text-xs text-slate-700 dark:text-slate-300 font-medium mt-0.5">Ke Puskesmas Gandrungmangu</p>
        </Card>
      </div>

      {/* Gambaran Fasilitas Kesehatan Kecamatan Gandrungmangu (BPS 2024) */}
      <Card className="rounded-[28px] p-5 sm:p-6 neu-card-elevated border border-white/80 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-stone-200/60 pb-3">
          <div>
            <h3 className="text-xs sm:text-sm font-condensed font-bold uppercase tracking-wider text-slate-900 dark:text-white">
              Gambaran Fasilitas Kesehatan Kecamatan Gandrungmangu (Tahun 2024)
            </h3>
            <p className="text-[10px] sm:text-xs text-slate-700 dark:text-slate-300 font-medium">
              Publikasi BPS Kabupaten Cilacap (<em>Kecamatan Gandrungmangu Dalam Angka 2025</em>, Tabel 4.2.1).
            </p>
          </div>
          <Badge className="text-slate-800 dark:text-slate-200 bg-stone-200/80 dark:bg-stone-800 font-bold text-[9px] sm:text-[10px] px-3 py-1 rounded-full self-start sm:self-auto border border-stone-300/40 dark:border-white/10">
            Data Agregat Kecamatan
          </Badge>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
          {kecamatanHealthFacilities.map((item, idx) => (
            <div key={idx} className="p-3.5 rounded-2xl neu-inset border border-stone-300/40 dark:border-white/10 dark:bg-stone-900/60 text-center space-y-1">
              <span className="text-[10px] text-slate-700 dark:text-slate-300 font-bold block truncate">{item.jenis}</span>
              <p className="text-xl sm:text-2xl font-condensed font-bold text-slate-950 dark:text-white">{item.desaMemiliki} <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">Desa</span></p>
              <p className="text-[9px] text-slate-600 dark:text-slate-400 font-semibold">{item.keterangan}</p>
            </div>
          ))}
        </div>

        <div className="p-3.5 rounded-2xl neu-inset bg-blue-500/10 border border-blue-500/30 dark:bg-blue-950/40 dark:border-blue-700/50 flex items-start gap-2.5 text-blue-950 dark:text-blue-100 text-xs">
          <Info className="h-4 w-4 text-blue-700 dark:text-blue-300 shrink-0 mt-0.5" />
          <p className="text-[10px] sm:text-[11px] text-blue-900 dark:text-blue-200 leading-relaxed font-medium">
            <strong>Catatan Keterangan BPS:</strong> Angka di atas merupakan jumlah desa di tingkat kecamatan yang memiliki fasilitas sesuai kategori pada tabel BPS, <strong>bukan jumlah fasilitas kesehatan yang berada di Desa Sampeldes</strong>.
          </p>
        </div>
      </Card>

      {/* Sarana & Layanan Kesehatan Desa Sampeldes */}
      <Card className="rounded-[28px] p-5 sm:p-6 neu-card-elevated border border-white/80 space-y-4">
        <div>
          <h3 className="text-xs sm:text-sm font-condensed font-bold uppercase tracking-wider text-slate-900 dark:text-white">
            Sarana dan Layanan Kesehatan Masyarakat Desa Sampeldes
          </h3>
          <p className="text-[10px] sm:text-xs text-slate-700 dark:text-slate-300 font-medium">
            Cakupan layanan kesehatan berbasis komunitas yang diselenggarakan secara berkelanjutan di wilayah desa:
          </p>
        </div>

        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
          {healthServices.map((srv, idx) => (
            <div key={idx} className="p-4 rounded-2xl neu-inset border border-stone-300/40 dark:border-white/10 dark:bg-stone-900/60 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-900 dark:text-emerald-300 bg-emerald-500/15 border border-emerald-600/30 px-2.5 py-0.5 rounded-full">
                  {srv.tag}
                </span>
                <srv.icon className="h-4 w-4 text-emerald-700 dark:text-emerald-400" />
              </div>
              <h4 className="font-condensed font-bold uppercase text-slate-900 dark:text-white text-xs sm:text-sm">{srv.title}</h4>
              <p className="text-[11px] text-slate-700 dark:text-slate-300 leading-relaxed font-medium">{srv.desc}</p>
            </div>
          ))}
        </div>

        {/* Catatan Verifikasi Pemdes & Instansi Kesehatan */}
        <div className="p-3.5 sm:p-4 rounded-2xl neu-inset bg-amber-500/10 border border-amber-500/30 dark:bg-amber-950/40 dark:border-amber-700/50 flex items-start gap-2.5 text-amber-950 dark:text-amber-200 text-xs">
          <Info className="h-4 w-4 text-amber-700 dark:text-amber-300 shrink-0 mt-0.5" />
          <p className="text-[10px] sm:text-[11px] text-amber-900 dark:text-amber-200 leading-relaxed font-medium">
            <strong>Catatan Verifikasi:</strong> Informasi detail mengenai nama dan titik lokasi posyandu, praktik mandiri bidan, praktik dokter, apotek, poskesdes, serta jadwal operasional layanan kesehatan khusus Desa Sampeldes terus dimutakhirkan melalui koordinasi Pemerintah Desa Sampeldes dan instansi kesehatan terkait.
          </p>
        </div>
      </Card>

      {/* 3 Program Inovasi Kesehatan Unggulan */}
      <div className="space-y-3">
        <h3 className="text-xs sm:text-sm font-condensed font-bold uppercase tracking-wider text-slate-900 dark:text-white">
          Inisiatif Strategis & Pencegahan Kesehatan Komunitas
        </h3>
        <div className="grid md:grid-cols-3 gap-3 sm:gap-4">
          {healthInitiatives.map((item, idx) => (
            <Card key={idx} className="rounded-[28px] p-5 neu-card-elevated border border-white/80 space-y-2.5 hover:border-emerald-500/40 transition-colors">
              <div className="flex items-center justify-between">
                <span className={cn("text-[9px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border", item.color)}>
                  {item.badge}
                </span>
                <item.icon className="h-4 w-4 text-emerald-700 dark:text-emerald-400" />
              </div>
              <h4 className="font-condensed font-bold uppercase text-slate-900 dark:text-white text-xs sm:text-sm">{item.title}</h4>
              <p className="text-[11px] sm:text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-medium">{item.desc}</p>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 4. TAB SOSIAL
// ==========================================
function SosialTab() {
  const bansosList = [
    { program: 'Program Keluarga Harapan (PKH)', kpm: '480 KPM', desc: 'Bantuan bersyarat bidang kesehatan & pendidikan', budget: 'Kemensos RI' },
    { program: 'Bantuan Pangan Non Tunai (BPNT)', kpm: '640 KPM', desc: 'Penyaluran sembako pangan bergizi', budget: 'Kemensos RI' },
    { program: 'Bantuan Langsung Tunai (BLT Dana Desa)', kpm: '70 KPM', desc: 'Keluarga miskin ekstrem dan lansia tunggal', budget: 'APBDes Sampeldes' },
    { program: 'Penerima Bantuan Iuran JKN (PBI-JK)', kpm: '3.850 Jiwa', desc: 'Iuran jaminan kesehatan BPJS gratis', budget: 'Pemerintah Pusat' },
  ];

  const socialPillars = [
    {
      title: 'Modal Sosial & Gotong Royong',
      desc: 'Kehidupan sosial tumbuh dari kebersamaan dan kepedulian yang mengakar kuat. Menjadi modal sosial penting dalam mendukung pemerintahan, kebersihan lingkungan, dan ketertiban desa.',
      tag: 'Kearifan Lokal',
      icon: HandHeart,
    },
    {
      title: 'Partisipasi Lembaga & Tokoh Masyarakat',
      desc: 'Sinergi aktif Pemerintah Desa, BPD, LKD, tokoh agama, tokoh masyarakat, pemuda (Karang Taruna), perempuan (PKK), serta kelompok warga dalam menjaga keharmonisan.',
      tag: 'Partisipatif',
      icon: Users,
    },
    {
      title: 'Pemberdayaan Inklusif & Kelompok Rentan',
      desc: 'Menciptakan masyarakat yang peduli terhadap kelompok yang membutuhkan perhatian (lansia, disabilitas, dhuafa), peningkatan kapasitas warga, serta penguatan peran perempuan.',
      tag: 'Inklusif',
      icon: Heart,
    },
    {
      title: 'Keamanan Lingkungan (Satkamling 38 RT)',
      desc: 'Ronda malam terpadu di seluruh Pos Ronda/Satkamling aktif untuk menjaga ketenteraman, ketertiban umum, dan kesiapsiagaan sosial warga di 6 RW dan 38 RT Desa Sampeldes.',
      tag: 'Keamanan 100%',
      icon: ShieldCheck,
    },
  ];

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Narrative Header Banner */}
      <div className="p-5 sm:p-7 rounded-[28px] bg-gradient-to-r from-[#070b10] via-[#0c141d] to-[#070b10] text-white relative overflow-hidden shadow-xs border border-white/10">
        <div className="relative z-10 space-y-2 max-w-3xl">
          <div className="inline-flex items-center gap-2">
            <span className="w-5 h-[2px] bg-blue-400 shrink-0" />
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-blue-400">
              Kebersamaan, Gotong Royong & Ketahanan Sosial
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl md:text-3xl font-condensed font-bold uppercase tracking-tight text-white">
            Sosial dan Kemasyarakatan
          </h2>
          <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-medium">
            Kehidupan sosial Desa Sampeldes tumbuh dari semangat kebersamaan, kepedulian, dan gotong royong yang menjadi modal sosial utama desa. Pembangunan sosial diarahkan mewujudkan masyarakat yang inklusif, harmonis, serta tangguh menghadapi berbagai dinamika sosial.
          </p>
        </div>
      </div>

      {/* Overview Cards: Responsive Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <Card className="rounded-[28px] p-4 sm:p-5 neu-card-elevated-dark border border-white/10 shadow-xs space-y-1">
          <p className="text-[10px] sm:text-xs font-bold text-teal-400 uppercase tracking-wider">Penerima Bantuan</p>
          <h3 className="text-xl sm:text-3xl font-condensed font-bold uppercase tracking-tight text-white mt-1">1.190</h3>
          <p className="text-[10px] sm:text-xs text-slate-200 mt-0.5 leading-tight font-medium">KPM Terdata di DTKS Kemensos</p>
        </Card>

        <Card className="rounded-[28px] p-4 sm:p-5 neu-card-elevated border border-white/80 space-y-1 hover:border-emerald-500/40 transition-colors">
          <p className="text-[10px] sm:text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Lembaga Kemasyarakatan</p>
          <h3 className="text-xl sm:text-3xl font-condensed font-bold uppercase tracking-tight text-slate-900 dark:text-white mt-1">6 LKD</h3>
          <p className="text-[10px] sm:text-xs text-slate-700 dark:text-slate-300 font-medium mt-0.5 leading-tight">PKK, Karang Taruna, BPD, RT/RW</p>
        </Card>

        <Card className="rounded-[28px] p-4 sm:p-5 neu-card-elevated border border-white/80 space-y-1 hover:border-emerald-500/40 transition-colors">
          <p className="text-[10px] sm:text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Keamanan Satkamling</p>
          <h3 className="text-xl sm:text-3xl font-condensed font-bold uppercase tracking-tight text-emerald-800 dark:text-emerald-400 mt-1">100%</h3>
          <p className="text-[10px] sm:text-xs text-slate-700 dark:text-slate-300 font-medium mt-0.5 leading-tight">Aktif di seluruh 38 RT</p>
        </Card>
      </div>

      {/* 4 Pilar Sosial Kemasyarakatan */}
      <div className="grid sm:grid-cols-2 gap-3 sm:gap-4">
        {socialPillars.map((item, idx) => (
          <Card key={idx} className="rounded-[28px] p-5 neu-card-elevated border border-white/80 space-y-2 hover:border-blue-400/80 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-bold uppercase tracking-wider text-blue-900 dark:text-blue-300 bg-blue-500/15 border border-blue-600/30 px-2.5 py-0.5 rounded-full">
                {item.tag}
              </span>
              <item.icon className="h-4 w-4 text-blue-700 dark:text-blue-400" />
            </div>
            <h4 className="font-condensed font-bold uppercase text-slate-900 dark:text-white text-xs sm:text-sm">{item.title}</h4>
            <p className="text-[11px] sm:text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-medium">{item.desc}</p>
          </Card>
        ))}
      </div>

      {/* Tabel Bantuan Sosial */}
      <Card className="rounded-[28px] p-5 sm:p-6 neu-card-elevated border border-white/80 space-y-4">
        <div>
          <h3 className="text-xs sm:text-sm font-condensed font-bold uppercase tracking-wider text-slate-900 dark:text-white">Penyaluran Program Jaring Pengaman Sosial</h3>
          <p className="text-[10px] sm:text-xs text-slate-700 dark:text-slate-300 font-medium">Program bansos resmi terverifikasi DTKS Kemensos di Sampeldes.</p>
        </div>

        {/* Mobile View: Compact Cards (Zero Horizontal Scroll) */}
        <div className="block sm:hidden space-y-2">
          {bansosList.map((item, idx) => (
            <div key={idx} className="p-3.5 neu-inset rounded-2xl border border-stone-300/40 dark:border-white/10 dark:bg-stone-900/60 space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <span className="font-bold text-xs text-slate-900 dark:text-white truncate">{item.program}</span>
                <span className="font-bold text-emerald-800 dark:text-emerald-400 text-xs shrink-0">{item.kpm}</span>
              </div>
              <p className="text-[11px] text-slate-700 dark:text-slate-300 font-medium leading-snug">{item.desc}</p>
              <div className="pt-1 flex items-center justify-between text-[10px]">
                <span className="text-slate-700 dark:text-slate-300 font-semibold">Sumber Anggaran:</span>
                <span className="bg-emerald-500/15 text-emerald-900 dark:text-emerald-300 border border-emerald-600/30 px-2.5 py-0.5 rounded-full font-bold">{item.budget}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Desktop View: Full Table */}
        <div className="hidden sm:block overflow-x-auto neu-inset rounded-2xl border border-stone-300/40 dark:border-white/10 dark:bg-stone-900/60 p-2">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-stone-300/40 dark:border-white/10 text-slate-800 dark:text-slate-200 uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4 font-bold">Nama Program</th>
                <th className="py-3 px-4 font-bold">Deskripsi Manfaat</th>
                <th className="py-3 px-4 font-bold text-center">Penerima</th>
                <th className="py-3 px-4 font-bold text-right">Sumber Anggaran</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200/50 dark:divide-white/10 text-slate-800 dark:text-slate-300">
              {bansosList.map((item, idx) => (
                <tr key={idx} className="hover:bg-white/40 dark:hover:bg-white/5 transition-colors">
                  <td className="py-3.5 px-4 font-bold text-slate-950 dark:text-white text-xs">
                    {item.program}
                  </td>
                  <td className="py-3.5 px-4 text-slate-800 dark:text-slate-300 font-medium">{item.desc}</td>
                  <td className="py-3.5 px-4 text-center font-bold text-emerald-800 dark:text-emerald-400">{item.kpm}</td>
                  <td className="py-3.5 px-4 text-right">
                    <span className="bg-emerald-500/15 text-emerald-900 dark:text-emerald-300 border border-emerald-600/30 px-2.5 py-0.5 rounded-full text-[10px] font-bold">{item.budget}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

// ==========================================
// 5. TAB EKONOMI
// ==========================================
function EkonomiTab() {
  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Narrative Header Banner */}
      <div className="p-5 sm:p-7 rounded-[28px] bg-gradient-to-r from-[#070b10] via-[#0c141d] to-[#070b10] text-white relative overflow-hidden shadow-xs border border-white/10">
        <div className="relative z-10 space-y-2 max-w-3xl">
          <div className="inline-flex items-center gap-2">
            <span className="w-5 h-[2px] bg-teal-500 shrink-0" />
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-teal-400">
              Pertanian, Peternakan, Perkebunan, UMKM & BUMDes
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl md:text-3xl font-condensed font-bold uppercase tracking-tight text-white">
            Perekonomian Desa Sampeldes
          </h2>
          <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-medium">
            Perekonomian desa bertumpu kuat pada aktivitas masyarakat pedesaan di sektor pertanian pangan, peternakan, perkebunan kelapa, usaha mikro warga, serta kelembagaan ekonomi <strong>BUMDes Mitra Sari Nusantara</strong> yang mendukung kemandirian dan ketahanan pangan desa.
          </p>
        </div>
      </div>

      {/* Top Economic Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <Card className="rounded-[28px] p-4 sm:p-5 neu-card-elevated-dark border border-white/10 shadow-xs space-y-1">
          <p className="text-[10px] sm:text-xs font-bold text-teal-400 uppercase tracking-wider">Pertanian</p>
          <h3 className="text-xl sm:text-3xl font-condensed font-bold uppercase tracking-tight text-white mt-1">65%</h3>
          <p className="text-[10px] sm:text-xs text-slate-200 mt-0.5 font-medium">Sektor utama penopang</p>
        </Card>

        <Card className="rounded-[28px] p-4 sm:p-5 neu-card-elevated border border-white/80 space-y-1 hover:border-emerald-500/40 transition-colors">
          <p className="text-[10px] sm:text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Padi Tahunan</p>
          <h3 className="text-xl sm:text-3xl font-condensed font-bold uppercase tracking-tight text-slate-900 dark:text-white mt-1">1.680 Ton</h3>
          <p className="text-[10px] sm:text-xs text-emerald-800 dark:text-emerald-400 font-bold mt-0.5">520+ Ha sawah produktif</p>
        </Card>

        <Card className="rounded-[28px] p-4 sm:p-5 neu-card-elevated border border-white/80 space-y-1 hover:border-emerald-500/40 transition-colors">
          <p className="text-[10px] sm:text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">UMKM Terdata</p>
          <h3 className="text-xl sm:text-3xl font-condensed font-bold uppercase tracking-tight text-slate-900 dark:text-white mt-1">160+</h3>
          <p className="text-[10px] sm:text-xs text-slate-700 dark:text-slate-300 font-medium mt-0.5">Usaha mikro & toko warga</p>
        </Card>

        <Card className="rounded-[28px] p-4 sm:p-5 neu-card-elevated border border-white/80 space-y-1 hover:border-emerald-500/40 transition-colors">
          <p className="text-[10px] sm:text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">BUMDes</p>
          <h3 className="text-xl sm:text-3xl font-condensed font-bold uppercase tracking-tight text-emerald-800 dark:text-emerald-400 mt-1">Mitra Sari Nusantara</h3>
          <p className="text-[10px] sm:text-xs text-slate-700 dark:text-slate-300 font-medium mt-0.5">Pertanian & Peternakan</p>
        </Card>
      </div>

      {/* Program Unggulan BUMDes Mitra Sari Nusantara */}
      <Card className="rounded-[28px] p-5 sm:p-7 neu-card-elevated border border-white/80 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-200/60 pb-3">
          <div>
            <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-emerald-900 dark:text-emerald-300 bg-emerald-500/15 border border-emerald-600/30 px-3 py-1 rounded-full">
              Kelembagaan Ekonomi Desa Resmi
            </span>
            <h3 className="text-base sm:text-xl font-condensed font-bold uppercase text-slate-900 dark:text-white mt-2">
              BUMDes Mitra Sari Nusantara — Motor Kemandirian Ekonomi & Ketahanan Pangan
            </h3>
          </div>
          <Badge className="neu-btn-dark text-teal-400 font-bold text-[10px] px-3 py-1 rounded-full self-start sm:self-auto border border-white/10">
            Monitoring Ketahanan Pangan 2026
          </Badge>
        </div>

        <div className="grid md:grid-cols-2 gap-4 text-xs text-slate-700 dark:text-slate-300">
          <div className="p-4 rounded-2xl neu-inset border border-stone-300/40 dark:border-white/10 dark:bg-stone-900/60 space-y-2">
            <h4 className="font-condensed font-bold uppercase text-slate-900 dark:text-white text-xs sm:text-sm flex items-center gap-2">
              <Sprout className="h-4 w-4 text-emerald-700 dark:text-emerald-400" /> Unit Usaha Pertanian & Peternakan
            </h4>
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
              Pada tahun 2026, <strong>BUMDes Mitra Sari Nusantara</strong> menjadi bagian dari kegiatan monitoring ketahanan pangan desa melalui unit usaha produktif <strong>pertanian & peternakan</strong>. Unit ini dirancang memasok kebutuhan protein warga lokal, membuka lapangan kerja baru, serta menyumbang Pendapatan Asli Desa (PADes).
            </p>
          </div>

          <div className="p-4 rounded-2xl neu-inset border border-stone-300/40 dark:border-white/10 dark:bg-stone-900/60 space-y-2">
            <h4 className="font-condensed font-bold uppercase text-slate-900 dark:text-white text-xs sm:text-sm flex items-center gap-2">
              <Store className="h-4 w-4 text-emerald-700 dark:text-emerald-400" /> Pemberdayaan Usaha Mikro & Digitalisasi
            </h4>
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
              Pengembangan kapasitas pelaku usaha produktif masyarakat melalui pelatihan keterampilan, pendampingan pengelolaan usaha, standarisasi kemasan, perluasan pemasaran produk lokal, serta adopsi platform digital dan akses permodalan KUR perbankan.
            </p>
          </div>
        </div>
      </Card>

      {/* Komoditas & Peternakan */}
      <div className="grid md:grid-cols-2 gap-3 sm:gap-6">
        <Card className="rounded-[28px] p-5 sm:p-6 neu-card-elevated border border-white/80 space-y-4">
          <h3 className="text-xs sm:text-sm font-condensed font-bold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-1.5 sm:gap-2">
            <Sprout className="h-4 w-4 text-emerald-700 dark:text-emerald-400 shrink-0" />
            Komoditas Pertanian, Perkebunan & Pangan
          </h3>
          <div className="space-y-2.5 sm:space-y-3">
            {[
              { name: 'Padi Sawah (IR-64, Inpari, Ciherang)', yield: '1.680 Ton / thn', area: '520 Ha' },
              { name: 'Kelapa & Industri Gula Merah/Kelapa', yield: '340 Ton / thn', area: '190 Ha' },
              { name: 'Jagung Hibrida & Palawija', yield: '230 Ton / thn', area: '70 Ha' },
              { name: 'Singkong & Umbi-umbian', yield: '195 Ton / thn', area: '50 Ha' },
              { name: 'Sayuran & Hortikultura', yield: '110 Ton / thn', area: '35 Ha' },
            ].map((item, idx) => (
              <div key={idx} className="flex justify-between items-center p-3.5 rounded-2xl neu-inset border border-stone-300/40 dark:border-white/10 dark:bg-stone-900/60 text-[10px] sm:text-xs">
                <div>
                  <p className="font-bold text-slate-900 dark:text-white">{item.name}</p>
                  <p className="text-[9px] text-slate-600 dark:text-slate-400 font-semibold">Estimasi: {item.area}</p>
                </div>
                <span className="font-bold text-emerald-900 dark:text-emerald-300 bg-emerald-500/15 border border-emerald-600/30 px-2.5 py-0.5 rounded-full shrink-0">{item.yield}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="rounded-[28px] p-5 sm:p-6 neu-card-elevated border border-white/80 space-y-4">
          <h3 className="text-xs sm:text-sm font-condensed font-bold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-1.5 sm:gap-2">
            <Store className="h-4 w-4 text-emerald-700 dark:text-emerald-400 shrink-0" />
            Populasi Peternakan Warga & BUMDes
          </h3>
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-2">
              <div className="p-3.5 rounded-2xl neu-inset border border-stone-300/40 dark:border-white/10 dark:bg-stone-900/60 text-center">
                <p className="text-[8px] min-[380px]:text-[9px] sm:text-[10px] font-bold text-slate-700 dark:text-slate-300 uppercase">Sapi</p>
                <p className="text-base min-[380px]:text-lg sm:text-xl font-condensed font-bold text-slate-950 dark:text-white mt-0.5 sm:mt-1">260</p>
                <p className="text-[8px] min-[380px]:text-[9px] sm:text-[10px] text-slate-600 dark:text-slate-400 font-bold">Ekor</p>
              </div>
              <div className="p-3.5 rounded-2xl neu-inset border border-stone-300/40 dark:border-white/10 dark:bg-stone-900/60 text-center">
                <p className="text-[8px] min-[380px]:text-[9px] sm:text-[10px] font-bold text-slate-700 dark:text-slate-300 uppercase">Kambing</p>
                <p className="text-base min-[380px]:text-lg sm:text-xl font-condensed font-bold text-slate-950 dark:text-white mt-0.5 sm:mt-1">940</p>
                <p className="text-[8px] min-[380px]:text-[9px] sm:text-[10px] text-slate-600 dark:text-slate-400 font-bold">Ekor</p>
              </div>
              <div className="p-3.5 rounded-2xl neu-inset border border-stone-300/40 dark:border-white/10 dark:bg-stone-900/60 text-center">
                <p className="text-[8px] min-[380px]:text-[9px] sm:text-[10px] font-bold text-slate-700 dark:text-slate-300 uppercase">Unggas</p>
                <p className="text-base min-[380px]:text-lg sm:text-xl font-condensed font-bold text-slate-950 dark:text-white mt-0.5 sm:mt-1">14K+</p>
                <p className="text-[8px] min-[380px]:text-[9px] sm:text-[10px] text-slate-600 dark:text-slate-400 font-bold">Ekor</p>
              </div>
            </div>

            <div className="p-4 rounded-2xl neu-inset border border-emerald-500/30 bg-emerald-500/10 dark:bg-emerald-950/40 dark:border-emerald-700/50 space-y-1.5">
              <h4 className="font-condensed font-bold uppercase tracking-wider text-emerald-950 dark:text-emerald-200 text-xs sm:text-sm">Peluang Nilai Tambah Ekonomi Desa</h4>
              <p className="text-[11px] sm:text-xs text-emerald-900 dark:text-emerald-300 leading-relaxed font-medium">
                Dengan pengembangan pertanian, perkebunan kelapa, peternakan terintegrasi ayam petelur BUMDes Mitra Sari Nusantara, dan ekosistem usaha mikro, Desa Sampeldes memiliki fondasi kokoh membuka lapangan kerja baru dan memajukan kesejahteraan warga secara berkelanjutan.
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Catatan Statistik Pertanian BPS */}
      <div className="p-3.5 sm:p-4 rounded-2xl neu-inset bg-amber-500/10 border border-amber-500/30 flex items-start gap-2.5 text-amber-950 text-xs">
        <Info className="h-4 w-4 text-amber-700 shrink-0 mt-0.5" />
        <p className="text-[10px] sm:text-[11px] text-amber-900 leading-relaxed font-medium">
          <strong>Catatan Rujukan BPS:</strong> Publikasi <em>Kecamatan Gandrungmangu Dalam Angka 2025</em> memuat statistik pertanian dan perekonomian pada tingkat kecamatan. Angka agregat kecamatan tidak dapat langsung digunakan sebagai angka produksi atau potensi ekonomi Desa Sampeldes secara spesifik. Luas lahan pertanian, komoditas utama, hasil panen, dan kelompok tani di atas mengacu pada estimasi luasan produktif lokal dan konfirmasi Pemdes Sampeldes.
        </p>
      </div>
    </div>
  );
}

// ==========================================
// 6. TAB PEMBANGUNAN DESA
// ==========================================
function PembangunanTab() {
  const tenDirections = [
    { no: 1, title: 'Kualitas SDM', desc: 'Peningkatan kualitas sumber daya manusia melalui pendidikan, pelatihan dan pemberdayaan masyarakat.' },
    { no: 2, title: 'Layanan Kesehatan', desc: 'Peningkatan pelayanan kesehatan serta penguatan upaya promotif dan preventif.' },
    { no: 3, title: 'Penguatan Ekonomi', desc: 'Penguatan ekonomi masyarakat melalui pertanian, peternakan, UMKM dan kelembagaan ekonomi desa (BUMDes Mitra Sari Nusantara).' },
    { no: 4, title: 'Infrastruktur Dasar', desc: 'Peningkatan infrastruktur dasar untuk mendukung mobilitas dan aktivitas masyarakat.' },
    { no: 5, title: 'Ketahanan Pangan', desc: 'Penguatan ketahanan pangan desa melalui pemanfaatan potensi pertanian dan usaha produktif masyarakat.' },
    { no: 6, title: 'Kualitas Lingkungan', desc: 'Peningkatan kualitas lingkungan hidup, termasuk air bersih, sanitasi dan kebersihan lingkungan.' },
    { no: 7, title: 'Partisipasi Warga', desc: 'Penguatan partisipasi masyarakat dalam perencanaan, pelaksanaan dan pengawasan pembangunan.' },
    { no: 8, title: 'Transparansi Pemdes', desc: 'Peningkatan transparansi dan akuntabilitas pemerintahan desa melalui keterbukaan informasi publik.' },
    { no: 9, title: 'Teknologi Informasi', desc: 'Pemanfaatan teknologi informasi untuk meningkatkan kualitas pelayanan publik dan tata kelola pemerintahan.' },
    { no: 10, title: 'Potensi Berkelanjutan', desc: 'Pengembangan potensi lokal secara berkelanjutan untuk mendukung terwujudnya Desa Sampeldes yang maju, mandiri dan sejahtera.' },
  ];

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Narrative Header Banner */}
      <div className="p-5 sm:p-7 rounded-[28px] bg-gradient-to-r from-[#070b10] via-[#0c141d] to-[#070b10] text-white relative overflow-hidden shadow-xs border border-white/10">
        <div className="relative z-10 space-y-2 max-w-3xl">
          <div className="inline-flex items-center gap-2">
            <span className="w-5 h-[2px] bg-teal-500 shrink-0" />
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-teal-400">
              Partisipatif, Transparan, Berkelanjutan & Tepat Kebutuhan
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl md:text-3xl font-condensed font-bold uppercase tracking-tight text-white">
            Pembangunan & Akses Wilayah Desa Sampeldes
          </h2>
          <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-medium">
            Pembangunan desa dilaksanakan dengan mengedepankan prinsip partisipatif, transparan, dan berkelanjutan melalui Musdes/Musrenbangdes. Pembangunan mengintegrasikan infrastruktur fisik, pelayanan dasar, ketahanan pangan, dan pengembangan SDM menuju Desa Mandiri.
          </p>
        </div>
      </div>

      {/* Overview Indikator Akses & Pembangunan */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <Card className="rounded-[28px] p-4 sm:p-5 neu-card-elevated-dark border border-white/10 shadow-xs space-y-1">
          <p className="text-[10px] sm:text-xs font-bold text-teal-400 uppercase tracking-wider">Akses Kecamatan</p>
          <h3 className="text-xl sm:text-3xl font-condensed font-bold uppercase tracking-tight text-white mt-1">± 3 Km</h3>
          <p className="text-[10px] sm:text-xs text-slate-200 mt-0.5 font-medium">Ke pusat Gandrungmangu</p>
        </Card>

        <Card className="rounded-[28px] p-4 sm:p-5 neu-card-elevated border border-white/80 space-y-1 hover:border-emerald-500/40 transition-colors">
          <p className="text-[10px] sm:text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Akses Kabupaten</p>
          <h3 className="text-xl sm:text-3xl font-condensed font-bold uppercase tracking-tight text-slate-900 dark:text-white mt-1">45 Km</h3>
          <p className="text-[10px] sm:text-xs text-emerald-800 dark:text-emerald-400 font-bold mt-0.5">Ke ibu kota Kab. Cilacap</p>
        </Card>

        <Card className="rounded-[28px] p-4 sm:p-5 neu-card-elevated border border-white/80 space-y-1 hover:border-emerald-500/40 transition-colors">
          <p className="text-[10px] sm:text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Transportasi Darat</p>
          <h3 className="text-xl sm:text-3xl font-condensed font-bold uppercase tracking-tight text-slate-900 dark:text-white mt-1">100%</h3>
          <p className="text-[10px] sm:text-xs text-slate-700 dark:text-slate-300 font-medium mt-0.5">14 desa terhubung (BPS 2024)</p>
        </Card>

        <Card className="rounded-[28px] p-4 sm:p-5 neu-card-elevated border border-white/80 space-y-1 hover:border-emerald-500/40 transition-colors">
          <p className="text-[10px] sm:text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Penerangan Jalan</p>
          <h3 className="text-xl sm:text-3xl font-condensed font-bold uppercase tracking-tight text-slate-900 dark:text-white mt-1">360 Titik</h3>
          <p className="text-[10px] sm:text-xs text-slate-700 dark:text-slate-300 font-medium mt-0.5">PJU di 4 RW & 41 RT</p>
        </Card>
      </div>

      {/* Catatan BPS Aksesibilitas & Transportasi */}
      <div className="p-3.5 sm:p-4 rounded-2xl neu-inset bg-blue-500/10 border border-blue-500/30 dark:bg-blue-950/40 dark:border-blue-700/50 flex items-start gap-2.5 text-blue-950 dark:text-blue-100 text-xs">
        <Info className="h-4 w-4 text-blue-700 dark:text-blue-300 shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <p className="font-bold text-[11px] sm:text-xs text-blue-950 dark:text-blue-100">Infrastruktur, Transportasi & Aksesibilitas Wilayah (BPS 2024)</p>
          <p className="text-[10px] sm:text-[11px] text-blue-900 dark:text-blue-200 leading-relaxed font-medium">
            Berdasarkan publikasi BPS Kabupaten Cilacap (<em>Kecamatan Gandrungmangu Dalam Angka 2025</em>), Desa Sampeldes berjarak sekitar ± 3 km dari ibu kota Kecamatan Gandrungmangu dan ± 45 km dari ibu kota Kabupaten Cilacap. Seluruh 14 desa di Kecamatan Gandrungmangu tercatat memiliki sarana transportasi darat. Informasi rinci tentang kondisi jalan desa, jembatan, saluran irigasi, penerangan lingkungan, jaringan internet, dan sarana air bersih terus dilengkapi melalui inventarisasi Pemerintah Desa Sampeldes.
          </p>
        </div>
      </div>

      {/* 10 Arah Pembangunan Desa Sampeldes */}
      <Card className="rounded-[28px] p-5 sm:p-7 neu-card-elevated border border-white/80 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-stone-200/60 pb-3">
          <div>
            <h3 className="text-sm sm:text-base font-condensed font-bold uppercase tracking-wider text-slate-900 dark:text-white">
              10 Arah Kebijakan Pembangunan Desa Sampeldes
            </h3>
            <p className="text-[10px] sm:text-xs text-slate-700 dark:text-slate-300 font-medium">
              Pilar komprehensif mewujudkan Desa Sampeldes yang maju, mandiri, berkarakter, dan sejahtera.
            </p>
          </div>
          <Badge className="neu-btn-dark text-teal-400 font-bold text-[10px] px-3 py-1 rounded-full self-start sm:self-auto border border-white/10">
            Roadmap RPJMDes
          </Badge>
        </div>

        <div className="grid sm:grid-cols-2 gap-3 pt-1">
          {tenDirections.map((dir) => (
            <div key={dir.no} className="p-3.5 sm:p-4 rounded-2xl neu-inset border border-stone-300/40 dark:border-white/10 dark:bg-stone-900/60 space-y-1 hover:border-emerald-500/40 transition-colors">
              <div className="flex items-center gap-2">
                <span className="h-5 w-5 rounded-full bg-[#070b10] text-teal-400 font-condensed font-bold text-[10px] flex items-center justify-center shrink-0">
                  {dir.no}
                </span>
                <h4 className="font-condensed font-bold uppercase text-slate-900 dark:text-white text-xs sm:text-sm">
                  {dir.title}
                </h4>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-700 dark:text-slate-300 leading-relaxed pl-7 font-medium">
                {dir.desc}
              </p>
            </div>
          ))}
        </div>
      </Card>

      {/* Program Pembangunan Prioritas & Fokus Ruas Jalan */}
      <Card className="rounded-[28px] p-5 sm:p-6 neu-card-elevated border border-white/80 space-y-4">
        <div>
          <h3 className="text-xs sm:text-sm font-condensed font-bold uppercase tracking-wider text-slate-900 dark:text-white">
            Capaian Infrastruktur & Fokus Ruas Jalan Strategis
          </h3>
          <p className="text-[10px] sm:text-xs text-slate-700 dark:text-slate-300 font-medium">
            Pemeliharaan jalan, jembatan, drainase, dan fasilitas umum penunjang aktivitas harian warga Desa Sampeldes:
          </p>
        </div>
        <div className="grid md:grid-cols-2 gap-3 sm:gap-4">
          {[
            {
              title: 'Perhatian Ruas Gandrungmangu – Ciloning',
              desc: 'Jalur utama penghubung antar-wilayah desa dan pusat kecamatan yang memerlukan pemeliharaan dan pengawasan kualitas aspal/drainase.',
              status: 'Prioritas Wilayah',
              tag: 'Ruas Strategis'
            },
            {
              title: 'Akses SMP Negeri 3 Gandrungmangu',
              desc: 'Jalur akses penting penunjang kelancaran pendidikan peserta didik dan tenaga pengajar agar aman dilalui setiap hari.',
              status: 'Akses Pendidikan',
              tag: 'Fasilitas Sekolah'
            },
            {
              title: 'Ruas Jalan Sampeldes – Karanggedang',
              desc: 'Konektivitas poros utara desa penunjang arus mobilitas komoditas pertanian dan aktivitas perekonomian warga antar-desa.',
              status: 'Konektivitas Desa',
              tag: 'Arteri Antar-Desa'
            },
            {
              title: 'Peningkatan Jalan Lingkungan & Usaha Tani',
              desc: 'Pembangunan rabat beton dan pemeliharaan jalan lingkungan menghubungkan poros permukiman dan sentra pertanian 4 RW & 41 RT Desa Sampeldes.',
              status: 'Selesai 100%',
              tag: 'Infrastruktur Jalan'
            },
            {
              title: 'Jaringan Air Bersih PAMSIMAS & Drainase',
              desc: 'Penyediaan dan pemeliharaan sarana air bersih warga serta saluran drainase lingkungan untuk mencegah genangan air saat musim hujan.',
              status: 'Aktif Beroperasi',
              tag: 'Sanitasi & Air'
            },
            {
              title: 'Normalisasi Saluran Irigasi Pertanian',
              desc: 'Perbaikan pintu air dan pengurasan sedimen irigasi tersier penopang ketersediaan air sawah dan ketahanan pangan warga.',
              status: 'Fasilitas Tani',
              tag: 'Ketahanan Pangan'
            }
          ].map((item, idx) => (
            <div key={idx} className="p-4 rounded-2xl neu-inset border border-stone-300/40 dark:border-white/10 dark:bg-stone-900/60 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-emerald-900 dark:text-emerald-300 bg-emerald-500/15 border border-emerald-600/30 px-2.5 py-0.5 rounded-full">
                  {item.tag}
                </span>
                <span className="text-[9px] sm:text-[10px] font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" /> {item.status}
                </span>
              </div>
              <h4 className="font-condensed font-bold uppercase text-slate-900 dark:text-white text-xs sm:text-sm">{item.title}</h4>
              <p className="text-[11px] sm:text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-medium">{item.desc}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

// ==========================================
// 7. TAB SDGS DESA (18 GOL PEMBANGUNAN)
// ==========================================
function SDGsTab() {
  const sdgsGoals = [
    { no: 1, title: 'Desa Tanpa Kemiskinan', score: 84.5, color: '#e5243b', status: 'Sangat Baik' },
    { no: 2, title: 'Desa Tanpa Kelaparan', score: 88.0, color: '#dda63a', status: 'Sangat Baik' },
    { no: 3, title: 'Desa Sehat dan Sejahtera', score: 91.2, color: '#4c9f38', status: 'Unggul' },
    { no: 4, title: 'Pendidikan Desa Berkualitas', score: 86.8, color: '#c5192d', status: 'Sangat Baik' },
    { no: 5, title: 'Keterlibatan Perempuan Desa', score: 78.5, color: '#ff3a21', status: 'Baik' },
    { no: 6, title: 'Desa Layak Air Bersih & Sanitasi', score: 92.0, color: '#26bde2', status: 'Unggul' },
    { no: 7, title: 'Desa Berenergi Bersih & Terbarukan', score: 74.0, color: '#fcc30b', status: 'Baik' },
    { no: 8, title: 'Pertumbuhan Ekonomi Desa Merata', score: 76.5, color: '#a21942', status: 'Baik' },
    { no: 9, title: 'Infrastruktur & Inovasi Desa', score: 85.0, color: '#fd6925', status: 'Sangat Baik' },
    { no: 10, title: 'Desa Tanpa Kesenjangan', score: 79.0, color: '#dd1367', status: 'Baik' },
    { no: 11, title: 'Kawasan Permukiman Aman & Nyaman', score: 88.4, color: '#fd9d24', status: 'Sangat Baik' },
    { no: 12, title: 'Konsumsi & Produksi Sadar Lingkungan', score: 70.2, color: '#bf8b2e', status: 'Baik' },
    { no: 13, title: 'Desa Tanggap Perubahan Iklim', score: 72.5, color: '#3f7e44', status: 'Baik' },
    { no: 14, title: 'Desa Peduli Lingkungan Laut/Perairan', score: 68.0, color: '#0a97d9', status: 'Cukup' },
    { no: 15, title: 'Desa Peduli Lingkungan Darat', score: 82.0, color: '#56c02b', status: 'Sangat Baik' },
    { no: 16, title: 'Desa Damai Berkeadilan', score: 94.0, color: '#00689d', status: 'Unggul' },
    { no: 17, title: 'Kemitraan untuk Pembangunan Desa', score: 80.5, color: '#19486a', status: 'Sangat Baik' },
    { no: 18, title: 'Kelembagaan Desa Dinamis & Budaya Adaptif', score: 85.2, color: '#00457c', status: 'Sangat Baik' },
  ];

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Banner SDGs */}
      <div className="p-5 sm:p-7 rounded-[28px] bg-gradient-to-r from-[#070b10] via-[#0c141d] to-[#070b10] text-white relative overflow-hidden shadow-xs border border-white/10">
        <div className="relative z-10 max-w-2xl space-y-2 sm:space-y-3">
          <div className="inline-flex items-center gap-2">
            <span className="w-5 h-[2px] bg-teal-500 shrink-0" />
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-teal-400">
              18 Tujuan Pembangunan Berkelanjutan (SDGs Desa)
            </span>
          </div>
          <h2 className="text-lg sm:text-2xl md:text-3xl font-condensed font-bold uppercase tracking-tight text-white">
            Skor SDGs Desa: 74.20
          </h2>
          <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-medium">
            Pencapaian 18 tujuan pembangunan berkelanjutan desa untuk mewujudkan Desa Sampeldes yang mandiri, sejahtera, dan berdaya saing global.
          </p>
        </div>
      </div>

      {/* 18 Goals Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {sdgsGoals.map((g) => (
          <div
            key={g.no}
            className="p-4 sm:p-5 rounded-2xl neu-card-elevated border border-white/80 hover:border-emerald-500/40 transition-all flex flex-col justify-between min-h-[140px] space-y-3 relative overflow-hidden"
          >
            <div className="flex items-center justify-between">
              <span
                className="h-6 w-6 sm:h-7 sm:w-7 rounded-lg text-white font-condensed font-bold text-xs flex items-center justify-center shrink-0 shadow-xs"
                style={{ backgroundColor: g.color }}
              >
                {g.no}
              </span>
              <span className="text-[8px] min-[380px]:text-[9px] sm:text-[10px] font-bold text-slate-800 dark:text-slate-200 bg-stone-300/70 dark:bg-stone-800 px-2.5 py-0.5 rounded-full truncate max-w-[85px] sm:max-w-none text-center">
                {g.status}
              </span>
            </div>

            <h4 className="font-condensed font-bold uppercase tracking-tight text-slate-900 dark:text-white text-xs sm:text-sm leading-snug line-clamp-2">
              {g.title}
            </h4>

            <div className="space-y-1.5 pt-1">
              <div className="flex justify-between text-[9px] sm:text-xs font-bold">
                <span className="text-slate-700 dark:text-slate-300 text-[8px] sm:text-[10px] uppercase tracking-wider font-bold">Capaian</span>
                <span className="text-slate-950 dark:text-white font-condensed font-bold">{g.score}%</span>
              </div>
              <div className="w-full bg-stone-200/60 h-2 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${g.score}%`, backgroundColor: g.color }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ==========================================
// 8. TAB INDEKS DESA (STATUS: DESA MANDIRI)
// ==========================================
interface DimensiMeta {
  id: string;
  no: number;
  name: string;
  fullName: string;
  icon: any;
  scoreAvg: number;
  status: string;
  badgeClass: string;
  starIcon: string;
  desc: string;
  totalIndicators: number;
  color: string;
}

interface IndikatorRecord {
  dimensiId: string;
  dimensiNo: number;
  dimensiName: string;
  no: number;
  indicator: string;
  achievement: string;
  score: number;
}

function IndeksTab() {
  const { toast } = useToast();
  const [activeSubView, setActiveSubView] = useState<'dashboard' | 'indikator' | 'strategis'>('dashboard');
  const [selectedDimensiFilter, setSelectedDimensiFilter] = useState<string>('all');
  const [selectedScoreFilter, setSelectedScoreFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // 7 Dimensi Indeks Desa
  const dimensions: DimensiMeta[] = [
    {
      id: '1',
      no: 1,
      name: 'Pendidikan',
      fullName: 'Dimensi Pendidikan',
      icon: GraduationCap,
      scoreAvg: 5.00,
      status: 'Sangat Tinggi',
      badgeClass: 'bg-emerald-500/10 text-emerald-700 border-emerald-300',
      starIcon: '⭐',
      desc: 'Akses & APM semua jenjang >80–100%, pelatihan kerja dan perpustakaan desa aktif.',
      totalIndicators: 13,
      color: '#059669',
    },
    {
      id: '2',
      no: 2,
      name: 'Kesehatan & Sanitasi',
      fullName: 'Dimensi Kesehatan & Sanitasi Lingkungan',
      icon: Activity,
      scoreAvg: 4.40,
      status: 'Tinggi',
      badgeClass: 'bg-teal-500/10 text-teal-700 border-teal-300',
      starIcon: '🟢',
      desc: 'Layanan nakes & Posyandu rutin, sanitasi dan jamban individu sehat 100%.',
      totalIndicators: 30,
      color: '#0d9488',
    },
    {
      id: '3',
      no: 3,
      name: 'Sosial Budaya',
      fullName: 'Dimensi Sosial, Budaya, & Keamanan',
      icon: HandHeart,
      scoreAvg: 4.27,
      status: 'Tinggi',
      badgeClass: 'bg-blue-500/10 text-blue-700 border-blue-300',
      starIcon: '🟢',
      desc: 'Kerukunan, musdes, dan gotong royong berjalan baik; fasilitas publik & olahraga butuh revitalisasi.',
      totalIndicators: 15,
      color: '#2563eb',
    },
    {
      id: '4',
      no: 4,
      name: 'Ekonomi Desa',
      fullName: 'Dimensi Penguatan Ekonomi Desa',
      icon: TrendingUp,
      scoreAvg: 3.33,
      status: 'Berkembang',
      badgeClass: 'bg-amber-500/10 text-amber-800 border-amber-300',
      starIcon: '🟡',
      desc: 'BUMDes aktif berbadan hukum; perlu akselerasi perizinan merek dagang, pasar, dan akses KUR/perbankan.',
      totalIndicators: 30,
      color: '#d97706',
    },
    {
      id: '5',
      no: 5,
      name: 'Lingkungan & Bencana',
      fullName: 'Dimensi Lingkungan Hidup & Kebencanaan',
      icon: Sprout,
      scoreAvg: 3.62,
      status: 'Berkembang',
      badgeClass: 'bg-yellow-500/10 text-yellow-800 border-yellow-300',
      starIcon: '🟡',
      desc: 'Pengolahan sampah mandiri berjalan; perlu regulasi Perdes pelestarian dan perbaikan akses mitigasi.',
      totalIndicators: 13,
      color: '#ca8a04',
    },
    {
      id: '6',
      no: 6,
      name: 'Infrastruktur',
      fullName: 'Dimensi Aksesibilitas & Sarana Transportasi',
      icon: Building2,
      scoreAvg: 4.40,
      status: 'Tinggi',
      badgeClass: 'bg-teal-500/10 text-teal-700 border-teal-300',
      starIcon: '🟢',
      desc: 'Jalan aspal/beton, internet 4G/5G merata; pengoptimalan daya listrik lampu penerangan jalan.',
      totalIndicators: 10,
      color: '#0d9488',
    },
    {
      id: '7',
      no: 7,
      name: 'Tata Kelola & Aset',
      fullName: 'Dimensi Tata Kelola Pemerintahan & Aset Desa',
      icon: Scale,
      scoreAvg: 4.69,
      status: 'Sangat Tinggi',
      badgeClass: 'bg-emerald-500/10 text-emerald-700 border-emerald-300',
      starIcon: '⭐',
      desc: 'Akuntabilitas musdes prima, PADes meningkat, dan tata kelola aset desa produktif.',
      totalIndicators: 16,
      color: '#059669',
    },
  ];

  // 127 Rincian Indikator Lengkap
  const allIndicators: IndikatorRecord[] = [
    // 1. DIMENSI PENDIDIKAN (13 Indikator)
    { dimensiId: '1', dimensiNo: 1, dimensiName: 'Pendidikan', no: 1, indicator: 'Keberadaan PAUD/TK/Sederajat', achievement: 'Tersedia ≥ 5 unit', score: 5 },
    { dimensiId: '1', dimensiNo: 1, dimensiName: 'Pendidikan', no: 2, indicator: 'Akses Menuju PAUD/TK/Sederajat', achievement: 'Sangat Mudah', score: 5 },
    { dimensiId: '1', dimensiNo: 1, dimensiName: 'Pendidikan', no: 3, indicator: 'APM PAUD/TK (3–6 Tahun)', achievement: '>80% – 100%', score: 5 },
    { dimensiId: '1', dimensiNo: 1, dimensiName: 'Pendidikan', no: 4, indicator: 'Akses Menuju SD/MI/Sederajat', achievement: 'Sangat Mudah', score: 5 },
    { dimensiId: '1', dimensiNo: 1, dimensiName: 'Pendidikan', no: 5, indicator: 'APM SD/MI (7–12 Tahun)', achievement: '>80% – 100%', score: 5 },
    { dimensiId: '1', dimensiNo: 1, dimensiName: 'Pendidikan', no: 6, indicator: 'Akses Menuju SMP/MTs/Sederajat', achievement: 'Sangat Mudah', score: 5 },
    { dimensiId: '1', dimensiNo: 1, dimensiName: 'Pendidikan', no: 7, indicator: 'APM SMP/MTs (13–15 Tahun)', achievement: '>80% – 100%', score: 5 },
    { dimensiId: '1', dimensiNo: 1, dimensiName: 'Pendidikan', no: 8, indicator: 'Akses Menuju SMA/SMK/MA/Sederajat', achievement: 'Sangat Mudah', score: 5 },
    { dimensiId: '1', dimensiNo: 1, dimensiName: 'Pendidikan', no: 9, indicator: 'APM SMA/SMK (16–18 Tahun)', achievement: '>80% – 100%', score: 5 },
    { dimensiId: '1', dimensiNo: 1, dimensiName: 'Pendidikan', no: 10, indicator: 'Pusat Keterampilan / Pelatihan Non-Formal', achievement: 'Tersedia', score: 5 },
    { dimensiId: '1', dimensiNo: 1, dimensiName: 'Pendidikan', no: 11, indicator: 'Penyerapan Angkatan Kerja di Pelatihan', achievement: 'Melibatkan ≥ 50% angkatan kerja belum bekerja', score: 5 },
    { dimensiId: '1', dimensiNo: 1, dimensiName: 'Pendidikan', no: 12, indicator: 'Taman Bacaan / Perpustakaan Desa', achievement: 'Tersedia', score: 5 },
    { dimensiId: '1', dimensiNo: 1, dimensiName: 'Pendidikan', no: 13, indicator: 'Operasional Perpustakaan Desa', achievement: 'Buka 6–7 hari seminggu', score: 5 },

    // 2. DIMENSI KESEHATAN & SANITASI (30 Indikator)
    { dimensiId: '2', dimensiNo: 2, dimensiName: 'Kesehatan & Sanitasi', no: 1, indicator: 'Akses Menuju Sarana Kesehatan', achievement: 'Sangat Mudah', score: 5 },
    { dimensiId: '2', dimensiNo: 2, dimensiName: 'Kesehatan & Sanitasi', no: 2, indicator: 'Ketersediaan Pustu / Poskesdes / Polindes', achievement: 'Tersedia Poskesdes/Polindes', score: 5 },
    { dimensiId: '2', dimensiNo: 2, dimensiName: 'Kesehatan & Sanitasi', no: 3, indicator: 'Akses Menuju Pustu/Poskesdes', achievement: 'Sangat Mudah', score: 5 },
    { dimensiId: '2', dimensiNo: 2, dimensiName: 'Kesehatan & Sanitasi', no: 4, indicator: 'Ketersediaan Fasilitas Posyandu', achievement: 'Tersedia', score: 5 },
    { dimensiId: '2', dimensiNo: 2, dimensiName: 'Kesehatan & Sanitasi', no: 5, indicator: 'Aktivitas Rutin Posyandu', achievement: 'Aktif ≥ 8 kali per tahun', score: 5 },
    { dimensiId: '2', dimensiNo: 2, dimensiName: 'Kesehatan & Sanitasi', no: 6, indicator: 'Akses Menuju Posyandu', achievement: 'Sangat Mudah', score: 5 },
    { dimensiId: '2', dimensiNo: 2, dimensiName: 'Kesehatan & Sanitasi', no: 7, indicator: 'Ketersediaan Tenaga Dokter', achievement: 'Tersedia di desa', score: 5 },
    { dimensiId: '2', dimensiNo: 2, dimensiName: 'Kesehatan & Sanitasi', no: 8, indicator: 'Jam Praktik / Operasional Dokter', achievement: '> 1 kali seminggu', score: 3 },
    { dimensiId: '2', dimensiNo: 2, dimensiName: 'Kesehatan & Sanitasi', no: 9, indicator: 'Sumber Layanan Dokter', achievement: 'Yayasan / Swasta / Mandiri', score: 3 },
    { dimensiId: '2', dimensiNo: 2, dimensiName: 'Kesehatan & Sanitasi', no: 10, indicator: 'Transportasi Penunjang ke Dokter', achievement: 'Tersedia', score: 5 },
    { dimensiId: '2', dimensiNo: 2, dimensiName: 'Kesehatan & Sanitasi', no: 11, indicator: 'Ketersediaan Tenaga Bidan', achievement: 'Tersedia di desa', score: 5 },
    { dimensiId: '2', dimensiNo: 2, dimensiName: 'Kesehatan & Sanitasi', no: 12, indicator: 'Jam Operasional Bidan', achievement: '> 1 kali seminggu', score: 3 },
    { dimensiId: '2', dimensiNo: 2, dimensiName: 'Kesehatan & Sanitasi', no: 13, indicator: 'Sumber Layanan Bidan', achievement: 'Pemerintah (Puskesmas/Poskesdes)', score: 5 },
    { dimensiId: '2', dimensiNo: 2, dimensiName: 'Kesehatan & Sanitasi', no: 14, indicator: 'Transportasi Penunjang ke Bidan', achievement: 'Tersedia', score: 5 },
    { dimensiId: '2', dimensiNo: 2, dimensiName: 'Kesehatan & Sanitasi', no: 15, indicator: 'Ketersediaan Tenaga Kesehatan (Nakes) Lain', achievement: 'Tersedia', score: 5 },
    { dimensiId: '2', dimensiNo: 2, dimensiName: 'Kesehatan & Sanitasi', no: 16, indicator: 'Operasional Nakes Lain', achievement: 'Tidak terjadwal tetap', score: 1 },
    { dimensiId: '2', dimensiNo: 2, dimensiName: 'Kesehatan & Sanitasi', no: 17, indicator: 'Sumber Layanan Nakes Lain', achievement: 'Pemerintah', score: 5 },
    { dimensiId: '2', dimensiNo: 2, dimensiName: 'Kesehatan & Sanitasi', no: 18, indicator: 'Transportasi Penunjang ke Nakes', achievement: 'Tersedia', score: 5 },
    { dimensiId: '2', dimensiNo: 2, dimensiName: 'Kesehatan & Sanitasi', no: 19, indicator: 'Cakupan Kepesertaan BPJS Kesehatan', achievement: '>60% – 80% penduduk', score: 4 },
    { dimensiId: '2', dimensiNo: 2, dimensiName: 'Kesehatan & Sanitasi', no: 20, indicator: 'Edukasi & Sosialisasi JKN/BPJS', achievement: 'Terlaksana aktif', score: 5 },
    { dimensiId: '2', dimensiNo: 2, dimensiName: 'Kesehatan & Sanitasi', no: 21, indicator: 'Kontinuitas Pasokan Air Minum', achievement: 'Tersedia setiap hari', score: 5 },
    { dimensiId: '2', dimensiNo: 2, dimensiName: 'Kesehatan & Sanitasi', no: 22, indicator: 'Ketercakupan Air Bersih Warga', achievement: '100% warga terlayani', score: 5 },
    { dimensiId: '2', dimensiNo: 2, dimensiName: 'Kesehatan & Sanitasi', no: 23, indicator: 'Kemudahan Akses Air Minum', achievement: 'Sedang (kombinasi PDAM & sumur gali terlindung)', score: 3 },
    { dimensiId: '2', dimensiNo: 2, dimensiName: 'Kesehatan & Sanitasi', no: 24, indicator: 'Kualitas Fisik Air Minum', achievement: 'Layak (tidak berbau, berwarna, dan berasa)', score: 5 },
    { dimensiId: '2', dimensiNo: 2, dimensiName: 'Kesehatan & Sanitasi', no: 25, indicator: 'Kondisi Rumah Tidak Layak Huni (RTLH)', achievement: 'Rendah (0% – 20%)', score: 5 },
    { dimensiId: '2', dimensiNo: 2, dimensiName: 'Kesehatan & Sanitasi', no: 26, indicator: 'Kepemilikan Jamban Sehat Mandiri', achievement: 'Sebagian besar keluarga (≥ 50%)', score: 5 },
    { dimensiId: '2', dimensiNo: 2, dimensiName: 'Kesehatan & Sanitasi', no: 27, indicator: 'Kondisi Keberfungsian Jamban', achievement: 'Berfungsi baik', score: 5 },
    { dimensiId: '2', dimensiNo: 2, dimensiName: 'Kesehatan & Sanitasi', no: 28, indicator: 'Tangki Septik (Septic Tank)', achievement: 'Menggunakan tangki perorangan/individu', score: 5 },
    { dimensiId: '2', dimensiNo: 2, dimensiName: 'Kesehatan & Sanitasi', no: 29, indicator: 'Keberfungsian Tangki Septik', achievement: 'Berfungsi baik', score: 5 },
    { dimensiId: '2', dimensiNo: 2, dimensiName: 'Kesehatan & Sanitasi', no: 30, indicator: 'Pengelolaan Limbah Cair RT (SPAL)', achievement: 'Tersedia saluran / sumur resapan khusus', score: 5 },

    // 3. DIMENSI SOSIAL, BUDAYA, & KEAMANAN (15 Indikator)
    { dimensiId: '3', dimensiNo: 3, dimensiName: 'Sosial Budaya', no: 1, indicator: 'Pelestarian Tradisi & Kearifan Lokal', achievement: 'Ada, aktif menjadi identitas desa', score: 5 },
    { dimensiId: '3', dimensiNo: 3, dimensiName: 'Sosial Budaya', no: 2, indicator: 'Keragaman Tradisi yang Dipertahankan', achievement: '> 3 ragam seni/budaya/kearifan', score: 5 },
    { dimensiId: '3', dimensiNo: 3, dimensiName: 'Sosial Budaya', no: 3, indicator: 'Budaya Gotong Royong', achievement: 'Berjalan aktif', score: 5 },
    { dimensiId: '3', dimensiNo: 3, dimensiName: 'Sosial Budaya', no: 4, indicator: 'Frekuensi Kerja Bakti / Gotong Royong', achievement: '1–2 kali per bulan', score: 3 },
    { dimensiId: '3', dimensiNo: 3, dimensiName: 'Sosial Budaya', no: 5, indicator: 'Partisipasi Warga dalam Gotong Royong', achievement: 'Tinggi (≥ 50% warga hadir)', score: 5 },
    { dimensiId: '3', dimensiNo: 3, dimensiName: 'Sosial Budaya', no: 6, indicator: 'Kegiatan Olahraga Masyarakat', achievement: '2–3 kali per bulan', score: 3 },
    { dimensiId: '3', dimensiNo: 3, dimensiName: 'Sosial Budaya', no: 7, indicator: 'Mediasi dan Penyelesaian Konflik', achievement: 'Diselesaikan secara musyawarah mufakat / damai', score: 5 },
    { dimensiId: '3', dimensiNo: 3, dimensiName: 'Sosial Budaya', no: 8, indicator: 'Peran Penengah: Babinsa/Bhabinkamtibmas', achievement: 'Aktif', score: 5 },
    { dimensiId: '3', dimensiNo: 3, dimensiName: 'Sosial Budaya', no: 9, indicator: 'Peran Penengah: Pemerintah Desa', achievement: 'Aktif', score: 5 },
    { dimensiId: '3', dimensiNo: 3, dimensiName: 'Sosial Budaya', no: 10, indicator: 'Peran Penengah: Tokoh Masyarakat', achievement: 'Aktif', score: 5 },
    { dimensiId: '3', dimensiNo: 3, dimensiName: 'Sosial Budaya', no: 11, indicator: 'Peran Penengah: Tokoh Agama', achievement: 'Aktif', score: 5 },
    { dimensiId: '3', dimensiNo: 3, dimensiName: 'Sosial Budaya', no: 12, indicator: 'Keberadaan Satkamling / Pos Ronda', achievement: 'Tersedia', score: 5 },
    { dimensiId: '3', dimensiNo: 3, dimensiName: 'Sosial Budaya', no: 13, indicator: 'Intensitas Ronda Satkamling', achievement: 'Rutin > 3 kali per minggu', score: 5 },
    { dimensiId: '3', dimensiNo: 3, dimensiName: 'Sosial Budaya', no: 14, indicator: 'Kondisi Prasarana Olahraga Desa', achievement: 'Rusak parah (prioritas pemugaran)', score: 2 },
    { dimensiId: '3', dimensiNo: 3, dimensiName: 'Sosial Budaya', no: 15, indicator: 'Kondisi Ruang Terbuka Hijau / Publik', achievement: 'Rusak parah (prioritas pemugaran)', score: 2 },

    // 4. DIMENSI PENGUATAN EKONOMI DESA (30 Indikator)
    { dimensiId: '4', dimensiNo: 4, dimensiName: 'Ekonomi Desa', no: 1, indicator: 'Diversifikasi Sektor Perekonomian', achievement: '> 2 sektor usaha riil', score: 5 },
    { dimensiId: '4', dimensiNo: 4, dimensiName: 'Ekonomi Desa', no: 2, indicator: 'Geliat Produksi Barang & Jasa', achievement: 'Aktif menghasilkan produk lokal', score: 5 },
    { dimensiId: '4', dimensiNo: 4, dimensiName: 'Ekonomi Desa', no: 3, indicator: 'Komoditas / Produk Unggulan Desa', achievement: 'Tersedia produk unggulan', score: 5 },
    { dimensiId: '4', dimensiNo: 4, dimensiName: 'Ekonomi Desa', no: 4, indicator: 'Jangkauan Pasar Produk Desa', achievement: 'Lokal (masih di lingkup desa)', score: 1 },
    { dimensiId: '4', dimensiNo: 4, dimensiName: 'Ekonomi Desa', no: 5, indicator: 'Perlindungan Merek / HKI Produk Unggulan', achievement: 'Belum memiliki izin edar/merek paten', score: 1 },
    { dimensiId: '4', dimensiNo: 4, dimensiName: 'Ekonomi Desa', no: 6, indicator: 'Nilai Ekonomi Kearifan Tradisi', achievement: 'Berhasil membuka peluang nafkah masyarakat', score: 5 },
    { dimensiId: '4', dimensiNo: 4, dimensiName: 'Ekonomi Desa', no: 7, indicator: 'Kerjasama Antar Desa (BKAD)', achievement: 'Sudah terlaksana', score: 5 },
    { dimensiId: '4', dimensiNo: 4, dimensiName: 'Ekonomi Desa', no: 8, indicator: 'Kemitraan Usaha dengan Pihak Ketiga', achievement: 'Belum ada kemitraan terjalin', score: 1 },
    { dimensiId: '4', dimensiNo: 4, dimensiName: 'Ekonomi Desa', no: 9, indicator: 'Keberadaan Bangunan Pasar Tradisional', achievement: 'Belum ada pasar desa fisik', score: 1 },
    { dimensiId: '4', dimensiNo: 4, dimensiName: 'Ekonomi Desa', no: 10, indicator: 'Aksesibilitas Menuju Pasar Terdekat', achievement: 'Akses sedang', score: 3 },
    { dimensiId: '4', dimensiNo: 4, dimensiName: 'Ekonomi Desa', no: 11, indicator: 'Toko Kelontong / Kios Perdagangan', achievement: 'Tersedia merata', score: 5 },
    { dimensiId: '4', dimensiNo: 4, dimensiName: 'Ekonomi Desa', no: 12, indicator: 'Akses ke Pusat Pertokoan', achievement: 'Sangat Mudah', score: 5 },
    { dimensiId: '4', dimensiNo: 4, dimensiName: 'Ekonomi Desa', no: 13, indicator: 'Rumah Makan / Warung Makan', achievement: 'Tersedia merata', score: 5 },
    { dimensiId: '4', dimensiNo: 4, dimensiName: 'Ekonomi Desa', no: 14, indicator: 'Akses ke Warung Makan', achievement: 'Sangat Mudah', score: 5 },
    { dimensiId: '4', dimensiNo: 4, dimensiName: 'Ekonomi Desa', no: 15, indicator: 'Fasilitas Penginapan / Homestay', achievement: 'Belum tersedia di desa', score: 1 },
    { dimensiId: '4', dimensiNo: 4, dimensiName: 'Ekonomi Desa', no: 16, indicator: 'Akses ke Tempat Penginapan Luar Desa', achievement: 'Sangat Mudah', score: 5 },
    { dimensiId: '4', dimensiNo: 4, dimensiName: 'Ekonomi Desa', no: 17, indicator: 'Jasa Pengiriman Barang & Logistik', achievement: 'Tersedia agen pos/ekspedisi', score: 5 },
    { dimensiId: '4', dimensiNo: 4, dimensiName: 'Ekonomi Desa', no: 18, indicator: 'Akses Menuju Agen Logistik', achievement: 'Sangat Mudah', score: 5 },
    { dimensiId: '4', dimensiNo: 4, dimensiName: 'Ekonomi Desa', no: 19, indicator: 'Badan Usaha Milik Desa (BUM Desa)', achievement: 'Beroperasi aktif', score: 5 },
    { dimensiId: '4', dimensiNo: 4, dimensiName: 'Ekonomi Desa', no: 20, indicator: 'Legalitas Hukum BUM Desa', achievement: 'Terdaftar Berbadan Hukum Kemenkumham', score: 5 },
    { dimensiId: '4', dimensiNo: 4, dimensiName: 'Ekonomi Desa', no: 21, indicator: 'Jam Kerja Operasional BUM Desa', achievement: 'Buka > 5 hari seminggu', score: 5 },
    { dimensiId: '4', dimensiNo: 4, dimensiName: 'Ekonomi Desa', no: 22, indicator: 'Lembaga Keuangan Non-BUMDes', achievement: 'Tersedia lembaga simpan pinjam/ekonomi', score: 5 },
    { dimensiId: '4', dimensiNo: 4, dimensiName: 'Ekonomi Desa', no: 23, indicator: 'Koperasi Unit Desa (KUD)', achievement: 'Tidak tersedia', score: 1 },
    { dimensiId: '4', dimensiNo: 4, dimensiName: 'Ekonomi Desa', no: 24, indicator: 'Ekosistem UMKM Warga', achievement: 'Tumbuh aktif', score: 5 },
    { dimensiId: '4', dimensiNo: 4, dimensiName: 'Ekonomi Desa', no: 25, indicator: 'Fasilitas Kantor Bank Resmi', achievement: 'Belum memiliki kantor kas/cabang pembantu', score: 1 },
    { dimensiId: '4', dimensiNo: 4, dimensiName: 'Ekonomi Desa', no: 26, indicator: 'Layanan Transaksi Perbankan', achievement: 'Belum tersedia di desa', score: 1 },
    { dimensiId: '4', dimensiNo: 4, dimensiName: 'Ekonomi Desa', no: 27, indicator: 'Fasilitas Kredit Usaha Rakyat (KUR)', achievement: 'Belum tersedia agen resmi KUR di desa', score: 1 },
    { dimensiId: '4', dimensiNo: 4, dimensiName: 'Ekonomi Desa', no: 28, indicator: 'Penyaluran Kredit KKP-E', achievement: 'Belum terfasilitasi', score: 1 },
    { dimensiId: '4', dimensiNo: 4, dimensiName: 'Ekonomi Desa', no: 29, indicator: 'Penyaluran Kredit Usaha Kecil (KUK)', achievement: 'Belum terfasilitasi', score: 1 },
    { dimensiId: '4', dimensiNo: 4, dimensiName: 'Ekonomi Desa', no: 30, indicator: 'Saluran Pembiayaan Alternatif', achievement: 'Lembaga informal/belum tersertifikasi', score: 1 },

    // 5. DIMENSI LINGKUNGAN HIDUP & KEBENCANAAN (13 Indikator)
    { dimensiId: '5', dimensiNo: 5, dimensiName: 'Lingkungan & Bencana', no: 1, indicator: 'Konservasi & Daya Tarik Wisata Alam', achievement: 'Belum dikembangkan secara terstruktur', score: 1 },
    { dimensiId: '5', dimensiNo: 5, dimensiName: 'Lingkungan & Bencana', no: 2, indicator: 'Payung Regulasi (Perdes) Lingkungan', achievement: 'Belum disahkan', score: 1 },
    { dimensiId: '5', dimensiNo: 5, dimensiName: 'Lingkungan & Bencana', no: 3, indicator: 'Gerakan Hijau Berbasis Adat/Kearifan', achievement: 'Belum ada kegiatan spesifik', score: 1 },
    { dimensiId: '5', dimensiNo: 5, dimensiName: 'Lingkungan & Bencana', no: 4, indicator: 'Energi Baru Terbarukan (EBT / Surya / Biogas)', achievement: 'Belum dimanfaatkan', score: 1 },
    { dimensiId: '5', dimensiNo: 5, dimensiName: 'Lingkungan & Bencana', no: 5, indicator: 'Tempat Penampungan Sampah (TPS)', achievement: 'Tersedia sarana TPS terpadu', score: 5 },
    { dimensiId: '5', dimensiNo: 5, dimensiName: 'Lingkungan & Bencana', no: 6, indicator: 'Pemilahan & Pengolahan Sampah', achievement: 'Berjalan di tingkat desa', score: 5 },
    { dimensiId: '5', dimensiNo: 5, dimensiName: 'Lingkungan & Bencana', no: 7, indicator: 'Nilai Ekonomi Pengolahan Sampah', achievement: 'Sampah diolah menjadi produk bernilai', score: 5 },
    { dimensiId: '5', dimensiNo: 5, dimensiName: 'Lingkungan & Bencana', no: 8, indicator: 'Rekam Jejak Pencemaran Tanah/Air', achievement: '0 kasus (Bebas pencemaran)', score: 5 },
    { dimensiId: '5', dimensiNo: 5, dimensiName: 'Lingkungan & Bencana', no: 9, indicator: 'Dokumen & Sistem Peta Rawan Bencana', achievement: 'Data, indeks, dan peta risiko lengkap', score: 5 },
    { dimensiId: '5', dimensiNo: 5, dimensiName: 'Lingkungan & Bencana', no: 10, indicator: 'Rambu Evakuasi & Sarana Mitigasi', achievement: 'Tersedia jalur evakuasi & peringatan dini', score: 5 },
    { dimensiId: '5', dimensiNo: 5, dimensiName: 'Lingkungan & Bencana', no: 11, indicator: 'Jalur Akses Menuju Jalur/Posko Evakuasi', achievement: 'Sangat Sulit diakses', score: 1 },
    { dimensiId: '5', dimensiNo: 5, dimensiName: 'Lingkungan & Bencana', no: 12, indicator: 'Kebijakan & Alokasi Anggaran Kebencanaan', achievement: 'Termuat dalam APBDes & teralisasi', score: 5 },
    { dimensiId: '5', dimensiNo: 5, dimensiName: 'Lingkungan & Bencana', no: 13, indicator: 'Pos Komando Siaga & Perlengkapan Bencana', achievement: 'Posko siap siaga dan alat keselamatan lengkap', score: 5 },

    // 6. DIMENSI AKSESIBILITAS & SARANA TRANSPORTASI (10 Indikator)
    { dimensiId: '6', dimensiNo: 6, dimensiName: 'Infrastruktur', no: 1, indicator: 'Material Permukaan Jalan Utama', achievement: 'Aspal / Beton semen cor', score: 5 },
    { dimensiId: '6', dimensiNo: 6, dimensiName: 'Infrastruktur', no: 2, indicator: 'Kondisi Permukaan Jalan', achievement: 'Rusak sedang (lancar dilalui motor & mobil)', score: 4 },
    { dimensiId: '6', dimensiNo: 6, dimensiName: 'Infrastruktur', no: 3, indicator: 'Fasilitas Tiang PJU Jalan Utama', achievement: 'Terpasang merata', score: 5 },
    { dimensiId: '6', dimensiNo: 6, dimensiName: 'Infrastruktur', no: 4, indicator: 'Suplai Tenaga Listrik untuk PJU', achievement: 'Belum teraliri arus listrik secara optimal', score: 1 },
    { dimensiId: '6', dimensiNo: 6, dimensiName: 'Infrastruktur', no: 5, indicator: 'Ketersediaan Angkutan Umum Perdesaan', achievement: 'Tersedia angkutan desa/trayek', score: 5 },
    { dimensiId: '6', dimensiNo: 6, dimensiName: 'Infrastruktur', no: 6, indicator: 'Jadwal Trayek Angkutan Umum', achievement: 'Aktif 4–6 hari per minggu', score: 4 },
    { dimensiId: '6', dimensiNo: 6, dimensiName: 'Infrastruktur', no: 7, indicator: 'Sambungan Jaringan Listrik Rumah', achievement: 'Menjangkau mayoritas rumah tangga (>50%)', score: 5 },
    { dimensiId: '6', dimensiNo: 6, dimensiName: 'Infrastruktur', no: 8, indicator: 'Keandalan Aliran Daya Listrik PLN', achievement: 'Nyala penuh 24 jam (>12 jam sehari)', score: 5 },
    { dimensiId: '6', dimensiNo: 6, dimensiName: 'Infrastruktur', no: 9, indicator: 'Kualitas Sinyal Telekomunikasi', achievement: 'Sinyal seluler sangat kuat', score: 5 },
    { dimensiId: '6', dimensiNo: 6, dimensiName: 'Infrastruktur', no: 10, indicator: 'Infrastruktur Jaringan Internet Data', achievement: 'Mendukung kecepatan tinggi 4G & 5G', score: 5 },

    // 7. DIMENSI TATA KELOLA PEMERINTAHAN & ASET DESA (16 Indikator)
    { dimensiId: '7', dimensiNo: 7, dimensiName: 'Tata Kelola & Aset', no: 1, indicator: 'Jam Operasional Kantor Pelayanan Desa', achievement: 'Terbuka di hari & jam kerja resmi', score: 3 },
    { dimensiId: '7', dimensiNo: 7, dimensiName: 'Tata Kelola & Aset', no: 2, indicator: 'Transparansi Pelayanan & Anggaran', achievement: 'Dipublikasikan secara terbuka kepada warga', score: 5 },
    { dimensiId: '7', dimensiNo: 7, dimensiName: 'Tata Kelola & Aset', no: 3, indicator: 'Kecepatan Layanan Surat Administrasi', achievement: 'Sangat responsif & tertib', score: 5 },
    { dimensiId: '7', dimensiNo: 7, dimensiName: 'Tata Kelola & Aset', no: 4, indicator: 'Meja Pengaduan / Aspirasi Warga', achievement: 'Tersedia kanal pengaduan langsung & digital', score: 5 },
    { dimensiId: '7', dimensiNo: 7, dimensiName: 'Tata Kelola & Aset', no: 5, indicator: 'Berbagai Layanan Sipil Lainnya', achievement: 'Terpenuhi secara maksimal', score: 5 },
    { dimensiId: '7', dimensiNo: 7, dimensiName: 'Tata Kelola & Aset', no: 6, indicator: 'Intensitas Forum Musdes', achievement: 'Terlaksana ≥ 10 kali dalam setahun', score: 5 },
    { dimensiId: '7', dimensiNo: 7, dimensiName: 'Tata Kelola & Aset', no: 7, indicator: 'Keterwakilan Komponen Masyarakat di Musdes', achievement: 'Representatif (RT/RW, BPD, tokoh perempuan, pemuda)', score: 5 },
    { dimensiId: '7', dimensiNo: 7, dimensiName: 'Tata Kelola & Aset', no: 8, indicator: 'Kemampuan Menghasilkan PADes', achievement: 'Memiliki penerimaan asli desa', score: 5 },
    { dimensiId: '7', dimensiNo: 7, dimensiName: 'Tata Kelola & Aset', no: 9, indicator: 'Tren Pertumbuhan Nilai PADes', achievement: 'Mengalami kenaikan berkelanjutan (>1%)', score: 5 },
    { dimensiId: '7', dimensiNo: 7, dimensiName: 'Tata Kelola & Aset', no: 10, indicator: 'Alokasi Penyertaan Modal BUMDes', achievement: 'Dialokasikan secara bertahap lewat Dana Desa', score: 5 },
    { dimensiId: '7', dimensiNo: 7, dimensiName: 'Tata Kelola & Aset', no: 11, indicator: 'Pemanfaatan Tanah Kas Desa (TKD)', achievement: 'Sangat produktif untuk kemaslahatan warga', score: 5 },
    { dimensiId: '7', dimensiNo: 7, dimensiName: 'Tata Kelola & Aset', no: 12, indicator: 'Pemanfaatan Gedung / Balai Desa', achievement: 'Produktif & multifungsi', score: 5 },
    { dimensiId: '7', dimensiNo: 7, dimensiName: 'Tata Kelola & Aset', no: 13, indicator: 'Aset Pasar Desa', achievement: 'Tidak memiliki bangunan pasar milik desa', score: 1 },
    { dimensiId: '7', dimensiNo: 7, dimensiName: 'Tata Kelola & Aset', no: 14, indicator: 'Optimalisasi Aset Desa Lainnya', achievement: 'Dikelola secara produktif', score: 5 },
    { dimensiId: '7', dimensiNo: 7, dimensiName: 'Tata Kelola & Aset', no: 15, indicator: 'Persentase Produktivitas Seluruh Aset', achievement: 'Tinggi (>60% – 80% aset menghasilkan)', score: 4 },
    { dimensiId: '7', dimensiNo: 7, dimensiName: 'Tata Kelola & Aset', no: 16, indicator: 'Ketertiban Buku Inventarisasi Aset', achievement: 'Terdaftar dan terdata secara digital/buku aset', score: 5 },
  ];

  // 5 Langkah Strategis Mempertahankan Status Mandiri
  const strategicSteps = [
    {
      no: 1,
      title: 'Revitalisasi Fasilitas Umum & Ruang Terbuka',
      desc: 'Mengalokasikan pos pemeliharaan sarana olahraga dan ruang publik yang saat ini rusak parah agar indeks kenyamanan sosial semakin kuat.',
      target: 'Pemugaran Lapangan & RTH Desa',
      icon: Trees,
      dimensi: 'Sosial Budaya',
      urgency: 'Prioritas Tinggi',
    },
    {
      no: 2,
      title: 'Komersialisasi & Legalitas Produk Lokal',
      desc: 'Mendorong sertifikasi halal, PIRT, dan pendaftaran HKI/merek dagang untuk produk unggulan desa agar dapat menembus pasar luar daerah atau marketplace.',
      target: 'Sertifikasi Halal, PIRT, & Pendaftaran HKI',
      icon: Award,
      dimensi: 'Ekonomi Desa',
      urgency: 'Akselerasi Pasar',
    },
    {
      no: 3,
      title: 'Pemberdayaan Akses Keuangan Desa',
      desc: 'Memfasilitasi agen laku pandai (BRILink/Mandiri Agen) atau gerai perbankan mikro agar warga dan UMKM mudah mengakses pinjaman modal resmi (KUR).',
      target: 'Integrasi Agen Perbankan & Penyaluran KUR',
      icon: Coins,
      dimensi: 'Ekonomi Desa',
      urgency: 'Inklusi Keuangan',
    },
    {
      no: 4,
      title: 'Penerbitan Perdes Konservasi Lingkungan',
      desc: 'Menyusun regulasi desa perlindungan mata air/lingkungan serta merintis Pembangkit Listrik Tenaga Surya (PLTS) hemat energi untuk lampu PJU.',
      target: 'Perdes Kelestarian & Rintisan EBT/PLTS',
      icon: Sun,
      dimensi: 'Lingkungan Hidup',
      urgency: 'Energi Bersih',
    },
    {
      no: 5,
      title: 'Perbaikan Akses Jalur Evakuasi Bencana',
      desc: 'Memperbaiki akses jalan menuju titik kumpul evakuasi agar mitigasi bencana responsif dan aman bagi seluruh warga.',
      target: 'Pelebaran & Pengerasan Jalur Evakuasi',
      icon: ShieldCheck,
      dimensi: 'Mitigasi Bencana',
      urgency: 'Keselamatan Warga',
    },
  ];

  // Filtered Indicators
  const filteredIndicators = useMemo(() => {
    return allIndicators.filter((item) => {
      const matchDimensi = selectedDimensiFilter === 'all' || item.dimensiId === selectedDimensiFilter;
      const matchScore = selectedScoreFilter === 'all' || item.score.toString() === selectedScoreFilter;
      const matchSearch =
        searchQuery.trim() === '' ||
        item.indicator.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.achievement.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.dimensiName.toLowerCase().includes(searchQuery.toLowerCase());
      return matchDimensi && matchScore && matchSearch;
    });
  }, [allIndicators, selectedDimensiFilter, selectedScoreFilter, searchQuery]);

  // Statistik Skor
  const scoreStats = useMemo(() => {
    const s5 = allIndicators.filter((i) => i.score === 5).length;
    const s4 = allIndicators.filter((i) => i.score === 4).length;
    const s3 = allIndicators.filter((i) => i.score === 3).length;
    const s2 = allIndicators.filter((i) => i.score === 2).length;
    const s1 = allIndicators.filter((i) => i.score === 1).length;
    return { s5, s4, s3, s2, s1, total: allIndicators.length };
  }, [allIndicators]);

  // Chart Data untuk 7 Dimensi
  const chartDimensiData = useMemo(() => {
    return dimensions.map((d) => ({
      name: d.name,
      skor: d.scoreAvg,
      target: 5.0,
      status: d.status,
    }));
  }, [dimensions]);

  // Unduh Excel
  const handleExportExcel = () => {
    try {
      const wb = XLSX.utils.book_new();

      // Sheet 1: 7 Dimensi
      const wsDimensi = XLSX.utils.json_to_sheet(
        dimensions.map((d) => ({
          'No Dimensi': d.no,
          'Nama Dimensi': d.fullName,
          'Skor Rata-rata': d.scoreAvg,
          'Status Capaian': d.status,
          'Jumlah Indikator': d.totalIndicators,
          'Keterangan Singkat': d.desc,
        }))
      );
      XLSX.utils.book_append_sheet(wb, wsDimensi, '7 Dimensi Mandiri');

      // Sheet 2: 127 Indikator
      const wsIndikator = XLSX.utils.json_to_sheet(
        allIndicators.map((item, idx) => ({
          'No Urut': idx + 1,
          'Dimensi': item.dimensiName,
          'No Indikator Dimensi': item.no,
          'Nama Indikator': item.indicator,
          'Capaian Lapangan': item.achievement,
          'Skor': item.score,
        }))
      );
      XLSX.utils.book_append_sheet(wb, wsIndikator, '127 Indikator Lengkap');

      XLSX.writeFile(wb, 'Indeks_Desa_Mandiri_Sampeldes_2025.xlsx');
      toast({
        title: 'Ekspor Excel Berhasil',
        description: 'Data Indeks Desa Mandiri telah disimpan dalam file Excel.',
      });
    } catch {
      toast({
        title: 'Gagal Ekspor',
        description: 'Terjadi kesalahan saat mengekspor data Excel.',
        variant: 'destructive',
      });
    }
  };

  // Unduh PDF
  const handleExportPDF = () => {
    try {
      const doc = new jsPDF();
      doc.setFontSize(16);
      doc.text('Laporan Evaluasi Indeks Desa (ID) — Status: DESA MANDIRI', 14, 20);
      doc.setFontSize(10);
      doc.text('Desa: Sampeldes | Kode: 3301102013 | Kec. Gandrungmangu, Kab. Cilacap, Jawa Tengah', 14, 27);
      doc.text('Status Indeks Desa: DESA MANDIRI (Meningkat dari status penetapan sebelumnya: Maju)', 14, 33);

      // Tabel 7 Dimensi
      autoTable(doc, {
        startY: 40,
        head: [['No', 'Dimensi', 'Skor Rata-rata', 'Status Capaian', 'Keterangan']],
        body: dimensions.map((d) => [
          d.no.toString(),
          d.name,
          d.scoreAvg.toFixed(2),
          d.status,
          d.desc,
        ]),
        headStyles: { fillColor: [8, 20, 38] },
      });

      doc.save('Laporan_Indeks_Desa_Mandiri_Sampeldes.pdf');
      toast({
        title: 'Ekspor PDF Berhasil',
        description: 'Dokumen PDF Indeks Desa Mandiri sedang diunduh.',
      });
    } catch {
      toast({
        title: 'Gagal Ekspor',
        description: 'Terjadi kesalahan saat menyusun dokumen PDF.',
        variant: 'destructive',
      });
    }
  };

  const getScoreBadge = (score: number) => {
    switch (score) {
      case 5:
        return <Badge className="bg-emerald-500 text-white font-bold text-[10px] px-2.5 py-0.5 rounded-full shadow-xs">Skor 5 • Sangat Baik</Badge>;
      case 4:
        return <Badge className="bg-teal-600 text-white font-bold text-[10px] px-2.5 py-0.5 rounded-full shadow-xs">Skor 4 • Baik</Badge>;
      case 3:
        return <Badge className="bg-amber-500 text-white font-bold text-[10px] px-2.5 py-0.5 rounded-full shadow-xs">Skor 3 • Sedang</Badge>;
      case 2:
        return <Badge className="bg-orange-500 text-white font-bold text-[10px] px-2.5 py-0.5 rounded-full shadow-xs">Skor 2 • Rendah</Badge>;
      case 1:
        return <Badge className="bg-rose-500 text-white font-bold text-[10px] px-2.5 py-0.5 rounded-full shadow-xs">Skor 1 • Prioritas</Badge>;
      default:
        return <Badge className="bg-slate-500 text-white font-bold text-[10px] px-2.5 py-0.5 rounded-full">Skor {score}</Badge>;
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* HEADER BANNER: STATUS DESA MANDIRI */}
      <div className="rounded-[28px] p-5 sm:p-8 bg-gradient-to-br from-[#070b10] via-[#0c141d] to-[#070b10] text-white shadow-md relative overflow-hidden border border-white/10">
        <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
          <Award className="w-56 h-56 text-teal-400" />
        </div>

        <div className="relative z-10 space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-[10px] sm:text-xs font-bold uppercase tracking-widest">
              <Award className="h-3.5 w-3.5 text-emerald-400" />
              Penetapan 2025–2026 • Target Mandiri 2027
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/10 text-slate-200 text-[10px] sm:text-xs font-semibold">
              <MapPin className="h-3.5 w-3.5 text-teal-400" />
              Kode Desa: 3301102013 • Gandrungmangu, Cilacap
            </span>
          </div>

          <div className="grid lg:grid-cols-12 gap-6 items-center">
            <div className="lg:col-span-8 space-y-2.5">
              <div className="inline-flex items-center gap-2">
                <span className="w-6 h-[2px] bg-teal-500 shrink-0" />
                <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-teal-400">
                  Status Perkembangan &amp; Kemajuan Desa
                </span>
              </div>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-condensed font-bold uppercase tracking-tight text-white leading-tight">
                Status Perkembangan: <span className="text-teal-400 underline decoration-teal-500/50 underline-offset-8">Desa Maju</span> Menuju Mandiri
              </h2>
              <p className="text-xs sm:text-sm text-slate-200 leading-relaxed max-w-2xl font-medium">
                Berdasarkan penetapan status resmi tahun berjalan (2025–2026), Desa Sampeldes berada pada kategori <strong>Desa Maju</strong>. Bersama seluruh elemen warga di <strong>4 RW dan 41 RT</strong>, Pemerintah Desa berkomitmen mengakselerasi pembangunan terintegrasi dengan target pemantapan status menuju kategori <strong>Desa Mandiri pada tahun 2027</strong>.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-2.5 pt-2">
                <Button
                  onClick={handleExportPDF}
                  size="sm"
                  className="bg-teal-500 hover:bg-teal-600 text-slate-950 font-bold text-xs rounded-full h-10 px-5 shadow-sm"
                >
                  <FileDown className="h-4 w-4 mr-2" />
                  Unduh Laporan (PDF)
                </Button>
                <Button
                  onClick={handleExportExcel}
                  size="sm"
                  className="bg-white hover:bg-slate-100 text-slate-900 dark:bg-stone-800 dark:hover:bg-stone-700 dark:text-white border border-slate-200 dark:border-white/10 font-bold text-xs rounded-full h-10 px-5 shadow-xs transition-colors"
                >
                  <Download className="h-4 w-4 mr-2 text-emerald-600 shrink-0" />
                  <span className="text-slate-900 dark:text-white font-bold">Unduh Data (XLSX)</span>
                </Button>
              </div>
            </div>

            {/* Status Highlight Card */}
            <div className="lg:col-span-4 bg-white/5 backdrop-blur-md rounded-[28px] p-5 border border-white/15 text-center space-y-3">
              <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-teal-500/20 text-teal-400 text-[10px] font-black uppercase tracking-wider">
                <Sparkles className="h-3 w-3" /> Status Indeks Desa
              </div>
              <div className="text-3xl sm:text-4xl font-condensed font-bold text-teal-300 uppercase tracking-wider drop-shadow-sm">
                DESA MAJU
              </div>
              <p className="text-[11px] text-emerald-300 font-semibold">
                Periode 2025–2026 • Target Menuju <strong>Mandiri (2027)</strong>
              </p>

              <div className="pt-3 border-t border-white/10 grid grid-cols-2 gap-2 text-center">
                <div className="p-2.5 rounded-2xl bg-white/5">
                  <p className="text-[9px] uppercase font-bold text-slate-200">Total Indikator</p>
                  <p className="text-xl font-condensed font-bold text-teal-400">127</p>
                </div>
                <div className="p-2.5 rounded-2xl bg-white/5">
                  <p className="text-[9px] uppercase font-bold text-slate-200">Cakupan Dimensi</p>
                  <p className="text-xl font-condensed font-bold text-teal-400">7 Dimensi</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SUB-NAVIGASI VIEW: 3 TAB VIEW */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5 sm:gap-2 p-1.5 neu-inset rounded-2xl sm:rounded-full border border-stone-300/40 w-full">
        <button
          onClick={() => setActiveSubView('dashboard')}
          className={cn(
            "w-full py-2.5 px-4 rounded-xl sm:rounded-full text-[11px] sm:text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2",
            activeSubView === 'dashboard'
              ? "neu-btn-dark text-teal-400 shadow-sm border border-white/10"
              : "text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white hover:bg-white/40 dark:hover:bg-white/5 font-bold"
          )}
        >
          <BarChart3 className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0 text-teal-400" />
          <span>Dashboard 7 Dimensi</span>
        </button>

        <button
          onClick={() => setActiveSubView('indikator')}
          className={cn(
            "w-full py-2.5 px-4 rounded-xl sm:rounded-full text-[11px] sm:text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2",
            activeSubView === 'indikator'
              ? "neu-btn-dark text-teal-400 shadow-sm border border-white/10"
              : "text-slate-700 hover:text-slate-950 hover:bg-white/40 font-bold"
          )}
        >
          <Layers className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0 text-teal-400" />
          <span>127 Indikator Lapangan</span>
        </button>

        <button
          onClick={() => setActiveSubView('strategis')}
          className={cn(
            "w-full py-2.5 px-4 rounded-xl sm:rounded-full text-[11px] sm:text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2",
            activeSubView === 'strategis'
              ? "neu-btn-dark text-teal-400 shadow-sm border border-white/10"
              : "text-slate-700 hover:text-slate-950 hover:bg-white/40 font-bold"
          )}
        >
          <Target className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0 text-teal-400" />
          <span>5 Langkah Strategis</span>
        </button>
      </div>

      {/* ========================================= */}
      {/* 1. VIEW: DASHBOARD 7 DIMENSI              */}
      {/* ========================================= */}
      {activeSubView === 'dashboard' && (
        <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-300">
          {/* Ringkasan Skor Indikator Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 sm:gap-3">
            <Card className="rounded-2xl p-3.5 sm:p-4 neu-card-elevated border border-emerald-500/30 space-y-1">
              <p className="text-[9px] font-bold text-emerald-800 dark:text-emerald-400 uppercase tracking-wider">Skor 5 (Sangat Baik)</p>
              <h4 className="text-xl sm:text-2xl font-condensed font-bold text-emerald-800 dark:text-emerald-400">
                {scoreStats.s5} <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Indikator</span>
              </h4>
              <p className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300">
                {((scoreStats.s5 / scoreStats.total) * 100).toFixed(1)}% Maksimal
              </p>
            </Card>

            <Card className="rounded-2xl p-3.5 sm:p-4 neu-card-elevated border border-teal-500/30 space-y-1">
              <p className="text-[9px] font-bold text-teal-800 dark:text-teal-400 uppercase tracking-wider">Skor 4 (Baik)</p>
              <h4 className="text-xl sm:text-2xl font-condensed font-bold text-teal-800 dark:text-teal-400">
                {scoreStats.s4} <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Indikator</span>
              </h4>
              <p className="text-[10px] font-bold text-teal-700 dark:text-teal-300">
                {((scoreStats.s4 / scoreStats.total) * 100).toFixed(1)}% Memadai
              </p>
            </Card>

            <Card className="rounded-2xl p-3.5 sm:p-4 neu-card-elevated border border-amber-500/30 space-y-1">
              <p className="text-[9px] font-bold text-amber-800 dark:text-amber-400 uppercase tracking-wider">Skor 3 (Sedang)</p>
              <h4 className="text-xl sm:text-2xl font-condensed font-bold text-amber-800 dark:text-amber-400">
                {scoreStats.s3} <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Indikator</span>
              </h4>
              <p className="text-[10px] font-bold text-amber-700 dark:text-amber-300">
                {((scoreStats.s3 / scoreStats.total) * 100).toFixed(1)}% Menengah
              </p>
            </Card>

            <Card className="rounded-2xl p-3.5 sm:p-4 neu-card-elevated border border-orange-500/30 space-y-1">
              <p className="text-[9px] font-bold text-orange-800 dark:text-orange-400 uppercase tracking-wider">Skor 2 (Rendah)</p>
              <h4 className="text-xl sm:text-2xl font-condensed font-bold text-orange-800 dark:text-orange-400">
                {scoreStats.s2} <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Indikator</span>
              </h4>
              <p className="text-[10px] font-bold text-orange-700 dark:text-orange-300">
                {((scoreStats.s2 / scoreStats.total) * 100).toFixed(1)}% Terbatas
              </p>
            </Card>

            <Card className="rounded-2xl p-3.5 sm:p-4 neu-card-elevated border border-rose-500/30 space-y-1 col-span-2 sm:col-span-1">
              <p className="text-[9px] font-bold text-rose-800 dark:text-rose-400 uppercase tracking-wider">Skor 1 (Prioritas)</p>
              <h4 className="text-xl sm:text-2xl font-condensed font-bold text-rose-800 dark:text-rose-400">
                {scoreStats.s1} <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Indikator</span>
              </h4>
              <p className="text-[10px] font-bold text-rose-700 dark:text-rose-300">
                {((scoreStats.s1 / scoreStats.total) * 100).toFixed(1)}% Benahi
              </p>
            </Card>
          </div>

          {/* Grafik Bar Capaian 7 Dimensi */}
          <Card className="rounded-[28px] p-5 sm:p-6 neu-card-elevated border border-white/80 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-200/60 pb-3">
              <div>
                <h3 className="text-sm sm:text-base font-condensed font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                  Grafik Capaian Kinerja 7 Dimensi Indeks Desa
                </h3>
                <p className="text-[10px] sm:text-xs text-slate-700 dark:text-slate-300 font-medium">
                  Perbandingan skor perolehan aktual dengan target maksimal (5.00) menuju status Desa Mandiri.
                </p>
              </div>
              <Badge className="neu-btn-dark text-teal-400 text-[10px] font-bold px-3 py-1 rounded-full self-start sm:self-auto border border-white/10">
                Skala Maksimal: 5.00
              </Badge>
            </div>

            <div className="h-[280px] sm:h-[320px] w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartDimensiData} margin={{ top: 10, right: 10, left: -15, bottom: 25 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} stroke="#d5cfc5" />
                  <XAxis
                    dataKey="name"
                    interval={0}
                    angle={-15}
                    textAnchor="end"
                    tick={{ fontSize: 10, fontWeight: 700, fill: '#1e293b' }}
                  />
                  <YAxis domain={[0, 5]} ticks={[0, 1, 2, 3, 4, 5]} tick={{ fontSize: 10, fontWeight: 700, fill: '#1e293b' }} />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const d = payload[0].payload;
                        return (
                          <div className="bg-[#070b10] text-white p-3 rounded-xl border border-white/10 shadow-xl text-xs space-y-1">
                            <p className="font-bold text-teal-400">{d.name}</p>
                            <p className="text-slate-200">Skor: <strong className="text-white">{d.skor.toFixed(2)}</strong> / 5.00</p>
                            <p className="text-[10px] text-emerald-400 font-semibold">{d.status}</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="skor" fill="#0d9488" radius={[8, 8, 0, 0]} barSize={34}>
                    {chartDimensiData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={
                          entry.skor >= 4.5
                            ? '#059669'
                            : entry.skor >= 4.0
                              ? '#0d9488'
                              : entry.skor >= 3.5
                                ? '#ca8a04'
                                : '#d97706'
                        }
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Kartu Rincian 7 Dimensi */}
          <div className="space-y-3">
            <h3 className="text-sm font-condensed font-bold uppercase tracking-wider text-slate-800 dark:text-white">
              Rincian Capaian Kinerja 7 Dimensi
            </h3>
            <div className="grid md:grid-cols-2 gap-4">
              {dimensions.map((dim) => (
                <Card
                  key={dim.id}
                  className="rounded-[1.4rem] p-4 sm:p-5 neu-card-elevated border border-white/60 hover:shadow-md transition-all space-y-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div
                        className="h-10 w-10 rounded-xl flex items-center justify-center font-bold text-white shrink-0 shadow-xs"
                        style={{ backgroundColor: dim.color }}
                      >
                        <dim.icon className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <span className="text-[9px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                          Dimensi {dim.no} • {dim.totalIndicators} Indikator
                        </span>
                        <h4 className="text-sm sm:text-base font-condensed font-bold text-slate-900 dark:text-white leading-tight">
                          {dim.fullName}
                        </h4>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-xl sm:text-2xl font-condensed font-bold text-slate-900 dark:text-white">
                        {dim.scoreAvg.toFixed(2)}
                      </div>
                      <Badge className={cn('text-[9px] font-bold px-2 py-0.5 rounded-full border', dim.badgeClass)}>
                        {dim.starIcon} {dim.status}
                      </Badge>
                    </div>
                  </div>

                  {/* Progress Bar ke 5.0 */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] font-bold text-slate-700 dark:text-slate-300">
                      <span>Progres Nilai</span>
                      <span className="text-slate-900 dark:text-white font-bold">{((dim.scoreAvg / 5) * 100).toFixed(0)}%</span>
                    </div>
                    <div className="w-full bg-slate-200/80 h-2 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${(dim.scoreAvg / 5) * 100}%`, backgroundColor: dim.color }}
                      />
                    </div>
                  </div>

                  <p className="text-xs text-slate-700 dark:text-slate-300 font-medium leading-relaxed pt-1 border-t border-stone-200/60 dark:border-white/10">
                    {dim.desc}
                  </p>
                </Card>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================= */}
      {/* 2. VIEW: 127 INDIKATOR LAPANGAN LENGKAP   */}
      {/* ========================================= */}
      {activeSubView === 'indikator' && (
        <div className="space-y-4 sm:space-y-6 animate-in fade-in duration-300">
          {/* Filter & Search Bar */}
          <Card className="rounded-[28px] p-5 neu-card-elevated border border-white/80 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
              {/* Search Bar */}
              <div className="sm:col-span-6 relative">
                <Search className="h-4 w-4 absolute left-3.5 top-3.5 text-slate-600 dark:text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari indikator (contoh: Posyandu, BUMDes, Air Minum, Jalan)..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-2xl neu-inset border border-stone-300/40 dark:border-white/10 dark:bg-stone-900/60 text-xs font-medium text-slate-900 dark:text-white placeholder:text-slate-500 dark:placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              {/* Filter Dimensi */}
              <div className="sm:col-span-3">
                <Select value={selectedDimensiFilter} onValueChange={setSelectedDimensiFilter}>
                  <SelectTrigger className="w-full h-10 rounded-2xl neu-inset border border-stone-300/40 dark:border-white/10 dark:bg-stone-900/60 text-xs font-bold text-slate-800 dark:text-slate-200">
                    <SelectValue placeholder="Semua Dimensi" />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-[#081d27] dark:text-slate-100 rounded-2xl shadow-xl border border-stone-300/60 dark:border-white/10">
                    <SelectItem value="all">Semua Dimensi (127)</SelectItem>
                    {dimensions.map((d) => (
                      <SelectItem key={d.id} value={d.id}>
                        {d.no}. {d.name} ({d.totalIndicators})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Filter Skor */}
              <div className="sm:col-span-3">
                <Select value={selectedScoreFilter} onValueChange={setSelectedScoreFilter}>
                  <SelectTrigger className="w-full h-10 rounded-2xl neu-inset border border-stone-300/40 dark:border-white/10 dark:bg-stone-900/60 text-xs font-bold text-slate-800 dark:text-slate-200">
                    <SelectValue placeholder="Semua Skor" />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-[#081d27] rounded-2xl shadow-xl border border-stone-300/60">
                    <SelectItem value="all">Semua Skor</SelectItem>
                    <SelectItem value="5">Skor 5 (Sangat Baik)</SelectItem>
                    <SelectItem value="4">Skor 4 (Baik)</SelectItem>
                    <SelectItem value="3">Skor 3 (Sedang)</SelectItem>
                    <SelectItem value="2">Skor 2 (Rendah)</SelectItem>
                    <SelectItem value="1">Skor 1 (Prioritas)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Quick Status Count */}
            <div className="flex flex-wrap items-center justify-between text-xs text-slate-700 dark:text-slate-300 font-medium pt-1 border-t border-stone-200/60 dark:border-white/10">
              <p>
                Menampilkan <strong>{filteredIndicators.length}</strong> dari <strong>127</strong> Indikator Evaluasi
              </p>
              {(selectedDimensiFilter !== 'all' || selectedScoreFilter !== 'all' || searchQuery !== '') && (
                <button
                  onClick={() => {
                    setSelectedDimensiFilter('all');
                    setSelectedScoreFilter('all');
                    setSearchQuery('');
                  }}
                  className="text-emerald-800 dark:text-emerald-400 hover:underline font-bold text-[11px]"
                >
                  Reset Filter
                </button>
              )}
            </div>
          </Card>

          {/* Table / Card Container */}
          <Card className="rounded-[28px] neu-card-elevated border border-white/80 overflow-hidden p-2 sm:p-3">
            {/* Mobile View: Compact Cards (Zero Horizontal Scroll) */}
            <div className="block sm:hidden divide-y divide-stone-200/50 dark:divide-white/10">
              {filteredIndicators.length === 0 ? (
                <div className="py-8 text-center text-slate-600 font-semibold text-xs px-4">
                  Tidak ada indikator yang sesuai dengan kriteria pencarian atau filter.
                </div>
              ) : (
                filteredIndicators.map((item, idx) => (
                  <div key={`${item.dimensiId}-${item.no}`} className="p-3.5 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-emerald-900 dark:text-emerald-300 text-[10px] uppercase tracking-wider bg-emerald-500/15 px-2.5 py-0.5 rounded-full border border-emerald-400/60 truncate">
                        {item.dimensiName}
                      </span>
                      <div className="shrink-0">
                        {getScoreBadge(item.score)}
                      </div>
                    </div>
                    <p className="font-bold text-slate-900 dark:text-white text-xs leading-snug">
                      <span className="text-slate-600 dark:text-slate-400 font-bold mr-1">#{idx + 1}</span>
                      {item.indicator}
                    </p>
                    <div className="text-[11px] text-slate-700 dark:text-slate-300 font-medium flex items-center gap-1.5 pt-0.5">
                      <span className="text-slate-700 dark:text-slate-300 font-bold text-[10px]">Capaian:</span>
                      <span className="font-medium neu-inset border border-stone-300/40 dark:border-white/10 dark:bg-stone-900/60 px-2.5 py-0.5 rounded-lg text-[10px] text-slate-900 dark:text-slate-200 break-words">
                        {item.achievement}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Desktop View: Full Table */}
            <div className="hidden sm:block overflow-x-auto neu-inset rounded-2xl border border-stone-300/40 dark:border-white/10 dark:bg-stone-900/60 p-1">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-stone-300/40 dark:border-white/10 text-slate-800 dark:text-slate-200 font-bold uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-3.5 font-bold w-12 text-center">No</th>
                    <th className="py-3 px-3.5 font-bold w-36">Dimensi</th>
                    <th className="py-3 px-3.5 font-bold">Nama Indikator Evaluasi</th>
                    <th className="py-3 px-3.5 font-bold">Capaian Lapangan</th>
                    <th className="py-3 px-3.5 font-bold w-32 text-center">Skor Capaian</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-200/50 dark:divide-white/10 text-slate-800 dark:text-slate-300">
                  {filteredIndicators.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-slate-600 dark:text-slate-400 font-semibold">
                        Tidak ada indikator yang sesuai dengan kriteria pencarian atau filter.
                      </td>
                    </tr>
                  ) : (
                    filteredIndicators.map((item, idx) => (
                      <tr key={`${item.dimensiId}-${item.no}`} className="hover:bg-white/40 dark:hover:bg-white/5 transition-colors">
                        <td className="py-3 px-3.5 text-center font-bold text-slate-600 dark:text-slate-400 text-[11px]">
                          {idx + 1}
                        </td>
                        <td className="py-3 px-3.5">
                          <span className="font-bold text-emerald-900 dark:text-emerald-400 text-[11px]">
                            {item.dimensiName}
                          </span>
                        </td>
                        <td className="py-3 px-3.5 font-bold text-slate-900 dark:text-white">
                          {item.indicator}
                        </td>
                        <td className="py-3 px-3.5 text-slate-800 dark:text-slate-300 font-medium">
                          <span className="inline-block neu-inset border border-stone-300/40 dark:border-white/10 dark:bg-stone-900/60 px-2 py-0.5 rounded-md font-medium text-[11px] text-slate-900 dark:text-slate-200">
                            {item.achievement}
                          </span>
                        </td>
                        <td className="py-3 px-3.5 text-center">
                          {getScoreBadge(item.score)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* ========================================= */}
      {/* 3. VIEW: 5 LANGKAH STRATEGIS              */}
      {/* ========================================= */}
      {activeSubView === 'strategis' && (
        <div className="space-y-4 sm:space-y-6 animate-in fade-in duration-300">
          <div className="p-5 rounded-[28px] neu-inset bg-emerald-500/5 dark:bg-emerald-950/20 border border-emerald-500/20 text-emerald-950 dark:text-emerald-100 space-y-1">
            <h3 className="text-sm sm:text-base font-condensed font-bold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
              <Target className="h-5 w-5 text-emerald-700 dark:text-emerald-400" />
              5 Langkah Strategis Mempertahankan & Memperkuat Status &ldquo;Desa Mandiri&rdquo;
            </h3>
            <p className="text-xs text-emerald-900 dark:text-emerald-300 leading-relaxed font-medium">
              Fokus intervensi kebijakan Pemerintah Desa Sampeldes untuk menguatkan indikator bernilai berkembang dan memantapkan kemandirian desa berkelanjutan.
            </p>
          </div>

          <div className="grid gap-4">
            {strategicSteps.map((step) => (
              <Card
                key={step.no}
                className="rounded-[28px] p-5 sm:p-6 neu-card-elevated border border-white/80 hover:shadow-md transition-all space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-200/60 pb-3">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-2xl bg-emerald-500/10 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 flex items-center justify-center font-bold shrink-0 border border-emerald-300/40 dark:border-emerald-700/50">
                      <step.icon className="h-5 w-5 text-emerald-700 dark:text-emerald-400" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-900 dark:text-emerald-300">
                          Langkah {step.no} • Dimensi {step.dimensi}
                        </span>
                      </div>
                      <h4 className="text-sm sm:text-base font-condensed font-bold text-slate-900 dark:text-white uppercase">
                        {step.title}
                      </h4>
                    </div>
                  </div>
                  <Badge className="neu-btn-dark text-teal-400 font-bold text-[10px] px-3 py-1 rounded-full self-start sm:self-auto border border-white/10">
                    {step.urgency}
                  </Badge>
                </div>

                <div className="grid sm:grid-cols-12 gap-3 text-xs">
                  <div className="sm:col-span-8 text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                    {step.desc}
                  </div>
                  <div className="sm:col-span-4 p-3.5 rounded-2xl neu-inset border border-stone-300/40 dark:border-white/10 dark:bg-stone-900/60 space-y-0.5">
                    <p className="text-[9px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Target Utama</p>
                    <p className="font-bold text-slate-900 dark:text-white text-xs">{step.target}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
