'use client';

import React, { useMemo, useState, useRef } from 'react';
import { useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Resident } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line
} from 'recharts';
import {
  Users, Home, UserCheck, UserPlus,
  Download, FileDown, Filter, Calendar,
  MapPin, Loader2, BarChart3, PieChart as PieChartIcon
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const COLORS = ['#081d27', '#00a884', '#10b981', '#0d9488', '#0284c7', '#f43f5e'];

const formatNumberId = (num: number | string | undefined | null): string => {
  if (num === null || num === undefined) return '0';
  const parts = num.toString().split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return parts.join(',');
};

export function StatisticsDashboard() {
  const [filterDusun, setFilterDusun] = useState('Semua Wilayah');
  const [filterTahun, setFilterTahun] = useState('2024');
  const firestore = useFirestore();
  const { toast } = useToast();
  const reportRef = useRef<HTMLDivElement>(null);

  // Ambil data statistik agregat dari dokumen tunggal (1 read, hemat kuota Firestore)
  const statsRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, 'villageProfile', 'statistics');
  }, [firestore]);

  const { data: statsDoc, isLoading } = useDoc<any>(statsRef);

  // LOGIKA AGREGASI DATA
  const stats = useMemo(() => {
    if (!statsDoc) return null;

    let targetStats = statsDoc;
    if (filterDusun !== 'Semua Wilayah') {
      targetStats = statsDoc.dusunData?.[filterDusun] || {
        total: 0,
        totalKK: 0,
        malePercent: 0,
        femalePercent: 0,
        ageData: [
          { name: 'Anak (0-14)', value: 0 },
          { name: 'Produktif (15-64)', value: 0 },
          { name: 'Lansia (65+)', value: 0 },
        ],
        eduData: [
          { name: 'SD', value: 0 },
          { name: 'SMP', value: 0 },
          { name: 'SMA', value: 0 },
          { name: 'Diploma/Sarjana', value: 0 },
          { name: 'Lainnya', value: 0 },
        ],
        jobData: [
          { name: 'Petani', value: 0 },
          { name: 'Buruh', value: 0 },
          { name: 'Swasta', value: 0 },
          { name: 'Pelajar', value: 0 },
          { name: 'PNS/TNI', value: 0 },
          { name: 'Lainnya', value: 0 },
        ],
        rwData: [],
        rtData: [],
      };
    }

    return {
      total: targetStats.total || 0,
      totalKK: targetStats.totalKK || 0,
      malePercent: targetStats.malePercent || 0,
      femalePercent: targetStats.femalePercent || 0,
      ageData: targetStats.ageData || [
        { name: 'Anak (0-14)', value: 0 },
        { name: 'Produktif (15-64)', value: 0 },
        { name: 'Lansia (65+)', value: 0 },
      ],
      eduData: targetStats.eduData || [
        { name: 'SD', value: 0 },
        { name: 'SMP', value: 0 },
        { name: 'SMA', value: 0 },
        { name: 'Diploma/Sarjana', value: 0 },
        { name: 'Lainnya', value: 0 },
      ],
      jobData: targetStats.jobData || [
        { name: 'Petani', value: 0 },
        { name: 'Buruh', value: 0 },
        { name: 'Swasta', value: 0 },
        { name: 'Pelajar', value: 0 },
        { name: 'PNS/TNI', value: 0 },
        { name: 'Lainnya', value: 0 },
      ],
      rwData: targetStats.rwData || [],
      rtData: targetStats.rtData || [],
      // Mock mutation data for preview
      mutationData: statsDoc.mutationData || [
        { month: 'Jan', lahir: 12, mati: 5, datang: 8, pindah: 4 },
        { month: 'Feb', lahir: 15, mati: 3, datang: 10, pindah: 6 },
        { month: 'Mar', lahir: 10, mati: 7, datang: 12, pindah: 2 },
        { month: 'Apr', lahir: 18, mati: 4, datang: 6, pindah: 8 },
        { month: 'Mei', lahir: 14, mati: 2, datang: 15, pindah: 5 },
      ]
    };
  }, [statsDoc, filterDusun]);

  const handleDownloadExcel = () => {
    if (!stats) return;
    const ws = XLSX.utils.json_to_sheet(stats.rwData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Statistik");
    XLSX.writeFile(wb, `Statistik_Sampeldes_${filterDusun}.xlsx`);
    toast({ title: "Berhasil Unduh", description: "Data statistik telah disimpan dalam format Excel." });
  };

  const handleDownloadPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text('Grafik & Statistik Kependudukan Desa Sampeldes', 14, 22);
    doc.setFontSize(11);
    doc.text(`Wilayah: ${filterDusun} | Tahun: ${filterTahun}`, 14, 30);

    autoTable(doc, {
      startY: 40,
      head: [['Kategori', 'Jumlah']],
      body: [
        ['Total Penduduk', stats?.total.toString() || '0'],
        ['Total KK', stats?.totalKK.toString() || '0'],
        ['Persentase Laki-Laki', `${stats?.malePercent}%`],
        ['Persentase Perempuan', `${stats?.femalePercent}%`],
      ],
    });

    doc.save(`Statistik_Desa_${filterDusun}.pdf`);
    toast({ title: "Berhasil Cetak", description: "Dokumen PDF sedang diunduh." });
  };

  if (isLoading) {
    return (
      <div className="space-y-12">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-[2rem]" />)}
        </div>
        <div className="grid lg:grid-cols-2 gap-10">
          <Skeleton className="h-[400px] rounded-[3rem]" />
          <Skeleton className="h-[400px] rounded-[3rem]" />
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center bg-white rounded-[3rem] border border-slate-100 shadow-sm max-w-2xl mx-auto space-y-6 my-12">
        <BarChart3 className="h-16 w-16 text-emerald-600 animate-pulse" />
        <h2 className="text-2xl font-black uppercase tracking-tight text-slate-800">Statistik Belum Tersedia</h2>
        <p className="text-slate-700 leading-relaxed font-medium">
          Data grafik dan statistik demografi belum dibuat atau sedang diperbarui oleh administrator.
          Silakan hubungi admin atau perbarui database kependudukan di Dashboard Admin untuk memicu kalkulasi awal.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-10" ref={reportRef}>
      {/* HEADER & FILTERS */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 neu-card-elevated p-8 rounded-[32px] border border-white/60">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-emerald-800 font-black text-[10px] uppercase tracking-[0.3em]">
            <BarChart3 className="h-3 w-3" />
            Data Transparansi Publik
          </div>
          <h1 className="text-3xl md:text-5xl font-black text-slate-900 uppercase tracking-tighter leading-tight font-display italic">
            Statistik <span className="text-emerald-700 not-italic">Kependudukan</span>
          </h1>
          <p className="text-sm text-slate-700 font-medium">Visualisasi data demografi desa secara real-time.</p>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <div className="space-y-1.5">
            <label className="text-[9px] font-black uppercase text-slate-700 ml-1">Filter Wilayah</label>
            <Select value={filterDusun} onValueChange={setFilterDusun}>
              <SelectTrigger className="w-[180px] h-12 rounded-xl neu-inset border border-white/60 text-slate-800 font-bold">
                <MapPin className="h-4 w-4 mr-2 text-emerald-700" />
                <SelectValue placeholder="Pilih Dusun" />
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-[#081d27] rounded-xl shadow-xl border border-slate-200 dark:border-white/10">
                <SelectItem value="Semua Wilayah">Seluruh Desa</SelectItem>
                <SelectItem value="Dusun Pangampiran">Dusun Pangampiran</SelectItem>
                <SelectItem value="Dusun Ciloning">Dusun Ciloning</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <label className="text-[9px] font-black uppercase text-slate-700 ml-1">Periode</label>
            <Select value={filterTahun} onValueChange={setFilterTahun}>
              <SelectTrigger className="w-[120px] h-12 rounded-xl neu-inset border border-white/60 text-slate-800 font-bold">
                <Calendar className="h-4 w-4 mr-2 text-emerald-700" />
                <SelectValue placeholder="Tahun" />
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-[#081d27] rounded-xl shadow-xl border border-slate-200 dark:border-white/10">
                <SelectItem value="2024">2024</SelectItem>
                <SelectItem value="2023">2023</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button onClick={handleDownloadPDF} variant="ghost" className="neu-btn h-12 px-6 rounded-xl text-slate-900 font-bold">
            <FileDown className="h-4 w-4 mr-2 text-red-600" />
            Cetak PDF
          </Button>
        </div>
      </div>

      {/* SUMMARY CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Total Penduduk', value: formatNumberId(stats?.total), icon: Users, color: 'text-emerald-700', bg: 'bg-emerald-500/10' },
          { label: 'Total Keluarga (KK)', value: formatNumberId(stats?.totalKK), icon: Home, color: 'text-teal-700', bg: 'bg-teal-500/10' },
          { label: 'Laki-Laki (%)', value: `${stats?.malePercent}%`, icon: UserCheck, color: 'text-teal-700 dark:text-teal-300', bg: 'bg-teal-500/10 border border-teal-500/20' },
          { label: 'Perempuan (%)', value: `${stats?.femalePercent}%`, icon: UserPlus, color: 'text-rose-600', bg: 'bg-rose-500/10' },
        ].map((card, i) => (
          <Card key={i} className="rounded-[28px] border border-white/60 neu-card-elevated overflow-hidden group hover:scale-[1.02] transition-all duration-300">
            <CardContent className="p-7 flex flex-col items-center text-center space-y-4">
              <div className={cn("p-4 rounded-3xl neu-inset transition-transform group-hover:scale-110", card.color)}>
                <card.icon className="h-7 w-7" />
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-700 uppercase tracking-widest">{card.label}</p>
                <h3 className="text-3xl font-black text-slate-900 mt-1">{card.value}</h3>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* CHARTS DEMOGRAFI */}
      <div className="grid lg:grid-cols-2 gap-8">
        <Card className="rounded-[32px] border border-white/60 neu-card-elevated overflow-hidden">
          <CardHeader className="p-8 pb-0">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-teal-500/10 text-teal-600 dark:text-teal-400 rounded-2xl"><PieChartIcon className="h-6 w-6" /></div>
              <div>
                <CardTitle className="text-xl font-black uppercase italic tracking-tight leading-none">Kelompok Umur</CardTitle>
                <CardDescription className="text-xs font-bold uppercase text-slate-700 mt-2 tracking-widest">Distribusi Rentang Usia</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-8 h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats?.ageData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={8}
                  dataKey="value"
                >
                  {stats?.ageData.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="rounded-[32px] border border-white/60 neu-card-elevated overflow-hidden">
          <CardHeader className="p-8 pb-0">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-teal-500/10 text-teal-600 dark:text-teal-400 rounded-2xl"><FileDown className="h-6 w-6" /></div>
              <div>
                <CardTitle className="text-xl font-black uppercase italic tracking-tight leading-none">Tingkat Pendidikan</CardTitle>
                <CardDescription className="text-xs font-bold uppercase text-slate-700 mt-2 tracking-widest">Jenjang Pendidikan Terakhir</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-8 h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats?.eduData} margin={{ top: 20 }}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" opacity={0.2} stroke="#cbd5e1" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 800, fill: '#1e293b' }} />
                <YAxis hide />
                <Tooltip cursor={{ fill: 'transparent' }} />
                <Bar dataKey="value" fill="#0c1913" radius={[8, 8, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* CHART PEKERJAAN - HORIZONTAL */}
      <Card className="rounded-[32px] border border-white/60 neu-card-elevated overflow-hidden">
        <CardHeader className="p-8">
          <CardTitle className="text-xl font-black uppercase italic">Top Jenis Pekerjaan</CardTitle>
          <CardDescription className="text-xs font-bold uppercase text-slate-700 tracking-widest">Dominasi Sektor Ekonomi</CardDescription>
        </CardHeader>
        <CardContent className="p-8 h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart layout="vertical" data={stats?.jobData} margin={{ left: 40, right: 40 }}>
              <XAxis type="number" hide />
              <YAxis
                type="category"
                dataKey="name"
                width={100}
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fontWeight: 900, fill: '#1e293b' }}
              />
              <Tooltip />
              <Bar dataKey="value" fill="#d97706" radius={[0, 10, 10, 0]} barSize={24} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* SEBARAN & MUTASI */}
      <div className="grid lg:grid-cols-2 gap-8">
        <Card className="rounded-[32px] border border-white/60 neu-card-elevated overflow-hidden">
          <CardHeader className="p-8">
            <CardTitle className="text-xl font-black uppercase italic">Kepadatan Per Wilayah (RW)</CardTitle>
          </CardHeader>
          <CardContent className="p-8 h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats?.rwData}>
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 800, fill: '#1e293b' }} />
                <YAxis hide />
                <Tooltip />
                <Bar dataKey="value" fill="#059669" radius={[12, 12, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="rounded-[32px] border border-white/60 neu-card-elevated overflow-hidden">
          <CardHeader className="p-8">
            <CardTitle className="text-xl font-black uppercase italic">Mutasi & Dinamika Penduduk</CardTitle>
            <CardDescription className="text-[10px] font-bold uppercase tracking-widest text-slate-700">Data Kumulatif 5 Bulan Terakhir</CardDescription>
          </CardHeader>
          <CardContent className="p-8 h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={stats?.mutationData}>
                <CartesianGrid vertical={false} opacity={0.2} stroke="#cbd5e1" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 800, fill: '#1e293b' }} />
                <YAxis hide />
                <Tooltip />
                <Legend verticalAlign="top" height={36} />
                <Line type="monotone" dataKey="lahir" stroke="#059669" strokeWidth={3.5} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="mati" stroke="#dc2626" strokeWidth={3.5} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="datang" stroke="#0284c7" strokeWidth={3.5} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="pindah" stroke="#d97706" strokeWidth={3.5} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* FOOTER STATS */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-6 p-8 md:p-10 rounded-3xl bg-gradient-to-br from-[#081d27] via-[#0b2836] to-[#041117] border border-teal-500/20 text-white shadow-xl">
        <div className="space-y-1 text-center md:text-left">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-teal-400">Akurasi &amp; Integritas</p>
          <p className="text-sm font-medium text-slate-200 italic leading-relaxed">
            Sumber Data: Sistem Informasi Desa (SID) Sampeldes Digital. <br className="hidden sm:block" />
            Data diperbarui secara otomatis berdasarkan pendaftaran penduduk terbaru.
          </p>
        </div>
        <Button onClick={handleDownloadExcel} className="bg-teal-600 hover:bg-teal-500 text-white h-12 px-8 rounded-full font-black uppercase tracking-widest transition-all shadow-md">
          <Download className="h-4 w-4 mr-2" />
          Unduh Data (.XLSX)
        </Button>
      </div>
    </div>
  );
}
