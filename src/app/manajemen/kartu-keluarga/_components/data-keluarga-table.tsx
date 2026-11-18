'use client';

import React, { useState, useMemo, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Plus,
  Printer,
  Download,
  RotateCcw,
  Search,
  List,
  Edit,
  Trash2,
  ChevronDown,
  User,
  ChevronLeft,
  ChevronRight,
  Zap,
  CloudDownload,
  Users,
  ShieldCheck,
  MapPin,
  FileSpreadsheet,
  FileText,
  BadgeAlert,
  Sparkles,
} from 'lucide-react';
import { Family } from '@/lib/types';
import * as XLSX from 'xlsx';
import { useToast } from '@/hooks/use-toast';
import { PageHeader } from '@/components/page-header';
import { TambahKkDialog } from './tambah-kk-dialog';
import { TambahAnggotaDialog } from './tambah-anggota-dialog';

interface DataKeluargaTableProps {
  families: Family[];
  loading: boolean;
  isCached?: boolean;
  onSelectFamily: (family: Family, view: 'members' | 'salinan') => void;
  onReload: () => void;
  onForceSyncServer?: () => void;
}

export function DataKeluargaTable({
  families,
  loading,
  isCached,
  onSelectFamily,
  onReload,
  onForceSyncServer,
}: DataKeluargaTableProps) {
  const { toast } = useToast();

  // Filter States
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [genderFilter, setGenderFilter] = useState('ALL');
  const [dusunFilter, setDusunFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // Pagination States
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  // Selected Checkboxes
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Dialog States
  const [isTambahKkOpen, setIsTambahKkOpen] = useState(false);
  const [editingFamily, setEditingFamily] = useState<Family | null>(null);

  const [tambahAnggotaTarget, setTambahAnggotaTarget] = useState<{
    family: Family;
    mode: 'lahir' | 'masuk' | 'exist';
  } | null>(null);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, genderFilter, dusunFilter, searchTerm, pageSize]);

  // Filter dusun list
  const dusunList = useMemo(() => {
    const set = new Set<string>();
    families.forEach(f => {
      if (f.dusun) set.add(f.dusun.toUpperCase());
    });
    return Array.from(set).sort();
  }, [families]);

  // Summary Metrics
  const metrics = useMemo(() => {
    const totalKK = families.length;
    const activeKK = families.filter(f => (f.statusKk || 'KK Aktif') === 'KK Aktif').length;
    const emptyKK = families.filter(f => f.statusKk === 'KK Kosong').length;
    const totalDusun = dusunList.length;

    return { totalKK, activeKK, emptyKK, totalDusun };
  }, [families, dusunList]);

  // Filtered families
  const filteredFamilies = useMemo(() => {
    return families.filter(f => {
      // Status KK
      if (statusFilter !== 'ALL') {
        if ((f.statusKk || 'KK Aktif') !== statusFilter) return false;
      }
      // Gender Kepala
      if (genderFilter !== 'ALL') {
        const g = (f.genderKepala || '').toLowerCase();
        if (genderFilter === 'L' && !g.startsWith('l')) return false;
        if (genderFilter === 'P' && !g.startsWith('p') && !g.startsWith('w')) return false;
      }
      // Dusun
      if (dusunFilter !== 'ALL') {
        if ((f.dusun || '').toUpperCase() !== dusunFilter) return false;
      }
      // Search
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchKk = (f.noKk || '').includes(q);
        const matchName = (f.kepalaKeluarga || '').toLowerCase().includes(q);
        const matchNik = (f.nikKepala || '').includes(q);
        if (!matchKk && !matchName && !matchNik) return false;
      }
      return true;
    });
  }, [families, statusFilter, genderFilter, dusunFilter, searchTerm]);

  // Paginated items
  const totalItems = filteredFamilies.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const paginatedFamilies = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredFamilies.slice(start, start + pageSize);
  }, [filteredFamilies, currentPage, pageSize]);

  // Reset filters
  const handleResetFilters = () => {
    setStatusFilter('ALL');
    setGenderFilter('ALL');
    setDusunFilter('ALL');
    setSearchTerm('');
    setSelectedIds([]);
    setCurrentPage(1);
  };

  // Toggle selection
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(paginatedFamilies.map(f => f.noKk));
    } else {
      setSelectedIds([]);
    }
  };

  const handleToggleRow = (noKk: string) => {
    setSelectedIds(prev =>
      prev.includes(noKk) ? prev.filter(id => id !== noKk) : [...prev, noKk]
    );
  };

  // Export to Excel
  const handleExportExcel = () => {
    if (filteredFamilies.length === 0) {
      toast({ title: 'Data Kosong', description: 'Tidak ada data keluarga untuk diekspor.' });
      return;
    }

    const dataToExport = filteredFamilies.map((f, i) => ({
      No: i + 1,
      'Nomor KK': f.noKk,
      'Kepala Keluarga': f.kepalaKeluarga,
      'NIK Kepala': f.nikKepala,
      'Jumlah Anggota': f.jumlahAnggota,
      'Jenis Kelamin': f.genderKepala,
      Alamat: f.alamat,
      Dusun: f.dusun,
      RW: f.rw,
      RT: f.rt,
      'Status KK': f.statusKk || 'KK Aktif',
      'Tanggal Terdaftar': f.tanggalTerdaftar || '-',
    }));

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Data Keluarga');
    XLSX.writeFile(wb, `Data_Keluarga_Desa_Sampeldes_${new Date().toISOString().split('T')[0]}.xlsx`);

    toast({ title: 'Berhasil Diekspor', description: `${filteredFamilies.length} data keluarga diekspor ke Excel.` });
  };

  // Cetak Rekap Table
  const handlePrintTable = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Halaman Terintegrasi Sistem */}
      <PageHeader
        title="Manajemen Kartu Keluarga"
        description="Pusat tata kelola data Kartu Keluarga (KK), daftar anggota keluarga, pencetakan salinan blangko resmi Dukcapil, serta sinkronisasi kependudukan Desa Sampeldes."
      >
        <div className="flex flex-wrap items-center gap-2">
          {isCached && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300/80 dark:border-emerald-800 shadow-xs">
              <Zap className="w-3.5 h-3.5 text-emerald-600 fill-emerald-600" />
              <span>Cache Aktif (Hemat Kuota)</span>
            </div>
          )}

          {onForceSyncServer && (
            <Button
              onClick={onForceSyncServer}
              variant="outline"
              size="sm"
              className="h-9 px-3 rounded-xl text-xs font-bold border-stone-300 text-slate-700 hover:text-slate-950 dark:border-white/20 dark:text-slate-200 gap-1.5"
              title="Sinkronkan data terbaru langsung dari server Firestore"
            >
              <CloudDownload className="w-3.5 h-3.5 text-sky-600" />
              <span className="hidden sm:inline">Sinkron Server</span>
            </Button>
          )}
        </div>
      </PageHeader>

      {/* 2. KPI / Stat Summary Cards */}
      <div className="no-print grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="neu-dashboard-card rounded-[22px] p-4 sm:p-5 hover:scale-[1.01] transition-all duration-300 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="font-condensed font-bold uppercase text-[11px] tracking-wider text-slate-600 dark:text-slate-400">
              Total Kartu Keluarga
            </span>
            <div className="p-2 rounded-xl bg-teal-50 dark:bg-teal-950/50 text-teal-700 dark:text-teal-300 border border-teal-200/50">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-condensed font-extrabold text-slate-900 dark:text-white tracking-tight">
              {metrics.totalKK.toLocaleString('id-ID')}
            </div>
            <p className="text-[10px] text-slate-400 font-medium mt-0.5">Kepala keluarga terdata di sistem</p>
          </div>
        </div>

        <div className="neu-dashboard-card rounded-[22px] p-4 sm:p-5 hover:scale-[1.01] transition-all duration-300 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="font-condensed font-bold uppercase text-[11px] tracking-wider text-slate-600 dark:text-slate-400">
              Status KK Aktif
            </span>
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200/50">
              <ShieldCheck className="h-4 w-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-condensed font-extrabold text-emerald-700 dark:text-emerald-400 tracking-tight">
              {metrics.activeKK.toLocaleString('id-ID')}
            </div>
            <p className="text-[10px] text-slate-400 font-medium mt-0.5">Keluarga berstatus aktif &amp; sah</p>
          </div>
        </div>

        <div className="neu-dashboard-card rounded-[22px] p-4 sm:p-5 hover:scale-[1.01] transition-all duration-300 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="font-condensed font-bold uppercase text-[11px] tracking-wider text-slate-600 dark:text-slate-400">
              Wilayah Terlayani
            </span>
            <div className="p-2 rounded-xl bg-sky-50 dark:bg-sky-950/50 text-sky-700 dark:text-sky-300 border border-sky-200/50">
              <MapPin className="h-4 w-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-condensed font-extrabold text-sky-800 dark:text-sky-300 tracking-tight">
              {metrics.totalDusun} Dusun
            </div>
            <p className="text-[10px] text-slate-400 font-medium mt-0.5">Cakupan seluruh RT/RW Sampeldes</p>
          </div>
        </div>

        <div className="neu-dashboard-card rounded-[22px] p-4 sm:p-5 hover:scale-[1.01] transition-all duration-300 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="font-condensed font-bold uppercase text-[11px] tracking-wider text-slate-600 dark:text-slate-400">
              Layanan Blangko KK
            </span>
            <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-200/50">
              <FileText className="h-4 w-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-condensed font-extrabold text-amber-700 dark:text-amber-400 tracking-tight">
              Dukcapil A4
            </div>
            <p className="text-[10px] text-slate-400 font-medium mt-0.5">Cetak &amp; PDF Salinan Resmi</p>
          </div>
        </div>
      </div>

      {/* 3. Toolbar Aksi & Filter Pencarian */}
      <div className="no-print neu-dashboard-card rounded-[24px] p-4 sm:p-5 border border-white/80 dark:border-white/10 shadow-xs space-y-4">
        {/* Tombol Operasional Utama */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <Button
              onClick={() => {
                setEditingFamily(null);
                setIsTambahKkOpen(true);
              }}
              className="h-10 px-4 rounded-xl text-xs font-black bg-[#d4e157] text-slate-950 hover:bg-[#c2cf38] uppercase tracking-wider border border-black/10 shadow-xs transition-all active:scale-95"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              Tambah KK Baru
            </Button>

            <Button
              onClick={handlePrintTable}
              variant="outline"
              className="h-10 px-3.5 rounded-xl text-xs font-bold border-stone-300 text-slate-700 hover:text-slate-950 dark:border-white/20 dark:text-slate-200 gap-1.5"
            >
              <Printer className="w-4 h-4 text-purple-600" />
              <span>Cetak Tabel</span>
            </Button>

            <Button
              onClick={handleExportExcel}
              variant="outline"
              className="h-10 px-3.5 rounded-xl text-xs font-bold border-emerald-600/50 text-emerald-800 hover:bg-emerald-50 dark:text-emerald-400 dark:border-emerald-800 gap-1.5"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>Unduh Excel</span>
            </Button>

            {selectedIds.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="destructive"
                    className="h-10 px-3.5 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-xs gap-1.5"
                  >
                    <span>{selectedIds.length} Terpilih</span>
                    <ChevronDown className="w-3.5 h-3.5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-52 rounded-xl text-xs p-1.5">
                  <DropdownMenuItem
                    onClick={() => {
                      toast({
                        title: 'Aksi Massal',
                        description: `${selectedIds.length} data KK telah dipilih.`,
                      });
                    }}
                    className="cursor-pointer text-rose-600 gap-2 py-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Hapus Data Terpilih</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button
              onClick={handleResetFilters}
              variant="ghost"
              size="sm"
              className="h-10 px-3 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-stone-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800 gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Filter</span>
            </Button>
          </div>
        </div>

        {/* Filter Bar & Search Input */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5 pt-3 border-t border-stone-200/60 dark:border-white/10">
          {/* Status KK */}
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-10 rounded-xl text-xs border-stone-300/80 bg-white/80 dark:bg-slate-900/80">
              <SelectValue placeholder="Pilih Status KK" />
            </SelectTrigger>
            <SelectContent className="text-xs rounded-xl">
              <SelectItem value="ALL">Semua Status KK</SelectItem>
              <SelectItem value="KK Aktif">KK Aktif</SelectItem>
              <SelectItem value="KK Hilang/Pindah/Mati">KK Hilang/Pindah/Mati</SelectItem>
              <SelectItem value="KK Kosong">KK Kosong</SelectItem>
              <SelectItem value="No. KK Sementara">No. KK Sementara</SelectItem>
            </SelectContent>
          </Select>

          {/* Jenis Kelamin Kepala */}
          <Select value={genderFilter} onValueChange={setGenderFilter}>
            <SelectTrigger className="h-10 rounded-xl text-xs border-stone-300/80 bg-white/80 dark:bg-slate-900/80">
              <SelectValue placeholder="Pilih Jenis Kelamin" />
            </SelectTrigger>
            <SelectContent className="text-xs rounded-xl">
              <SelectItem value="ALL">Semua Jenis Kelamin</SelectItem>
              <SelectItem value="L">Kepala Laki-laki</SelectItem>
              <SelectItem value="P">Kepala Perempuan</SelectItem>
            </SelectContent>
          </Select>

          {/* Dusun */}
          <Select value={dusunFilter} onValueChange={setDusunFilter}>
            <SelectTrigger className="h-10 rounded-xl text-xs border-stone-300/80 bg-white/80 dark:bg-slate-900/80">
              <SelectValue placeholder="Pilih Dusun" />
            </SelectTrigger>
            <SelectContent className="text-xs rounded-xl">
              <SelectItem value="ALL">Semua Dusun</SelectItem>
              {dusunList.map(d => (
                <SelectItem key={d} value={d}>DUSUN {d}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Pencarian Pintar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cari No. KK, Nama, NIK..."
              className="pl-9 h-10 rounded-xl text-xs border-stone-300/80 bg-white/80 dark:bg-slate-900/80 focus:bg-white"
            />
          </div>
        </div>
      </div>

      {/* 4. Tabel Master Data Keluarga */}
      <div className="neu-dashboard-card rounded-[24px] border border-white/80 dark:border-white/10 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <Table className="text-xs">
            <TableHeader className="bg-stone-100/90 dark:bg-slate-800/90 text-slate-700 dark:text-slate-200">
              <TableRow className="border-b border-stone-200 dark:border-slate-700">
                <TableHead className="w-10 text-center py-3.5">
                  <Checkbox
                    checked={
                      paginatedFamilies.length > 0 &&
                      paginatedFamilies.every(f => selectedIds.includes(f.noKk))
                    }
                    onCheckedChange={handleSelectAll}
                  />
                </TableHead>
                <TableHead className="w-12 text-center font-condensed font-bold uppercase tracking-wider">NO</TableHead>
                <TableHead className="w-32 text-center font-condensed font-bold uppercase tracking-wider">AKSI</TableHead>
                <TableHead className="w-12 text-center font-condensed font-bold uppercase tracking-wider">FOTO</TableHead>
                <TableHead className="font-condensed font-bold uppercase tracking-wider">NOMOR KK</TableHead>
                <TableHead className="font-condensed font-bold uppercase tracking-wider">KEPALA KELUARGA</TableHead>
                <TableHead className="font-condensed font-bold uppercase tracking-wider">NIK KEPALA</TableHead>
                <TableHead className="text-center font-condensed font-bold uppercase tracking-wider">ANGGOTA</TableHead>
                <TableHead className="font-condensed font-bold uppercase tracking-wider">STATUS KK</TableHead>
                <TableHead className="font-condensed font-bold uppercase tracking-wider">ALAMAT / DUSUN</TableHead>
                <TableHead className="text-center font-condensed font-bold uppercase tracking-wider">RW</TableHead>
                <TableHead className="text-center font-condensed font-bold uppercase tracking-wider">RT</TableHead>
                <TableHead className="font-condensed font-bold uppercase tracking-wider">TERDAFTAR</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={13} className="text-center py-16 text-slate-500">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="w-7 h-7 border-3 border-teal-600 border-t-transparent rounded-full animate-spin" />
                      <p className="text-xs font-semibold">Memuat data Kartu Keluarga...</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : paginatedFamilies.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={13} className="text-center py-16 text-slate-500">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Users className="w-8 h-8 text-slate-300" />
                      <p className="text-xs font-semibold">Data keluarga tidak ditemukan</p>
                      <p className="text-[11px] text-slate-400">Silakan tambahkan KK baru atau bersihkan kata kunci pencarian Anda.</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedFamilies.map((f, idx) => {
                  const globalIndex = (currentPage - 1) * pageSize + idx + 1;
                  const isChecked = selectedIds.includes(f.noKk);
                  const isPria = (f.genderKepala || '').toLowerCase().startsWith('l');

                  return (
                    <TableRow
                      key={f.noKk || idx}
                      className={`hover:bg-amber-50/40 dark:hover:bg-slate-800/40 border-b border-stone-200/60 dark:border-slate-800/60 transition-colors ${
                        isChecked ? 'bg-teal-50/60 dark:bg-teal-950/20' : ''
                      }`}
                    >
                      {/* Checkbox */}
                      <TableCell className="text-center py-2.5">
                        <Checkbox
                          checked={isChecked}
                          onCheckedChange={() => handleToggleRow(f.noKk)}
                        />
                      </TableCell>

                      {/* No */}
                      <TableCell className="text-center font-mono font-medium text-slate-500">
                        {globalIndex}
                      </TableCell>

                      {/* Aksi Baris */}
                      <TableCell>
                        <div className="flex items-center justify-center gap-1.5">
                          {/* 1. Tombol List: Buka Anggota Keluarga */}
                          <Button
                            size="icon"
                            variant="ghost"
                            title="Rincian & Daftar Anggota Keluarga"
                            onClick={() => onSelectFamily(f, 'members')}
                            className="h-8 w-8 rounded-xl bg-purple-600 hover:bg-purple-700 text-white shadow-xs transition-transform active:scale-95"
                          >
                            <List className="h-4 w-4" />
                          </Button>

                          {/* 2. Tombol Dropdown Tambah Anggota */}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                size="icon"
                                variant="ghost"
                                title="Tambah Anggota Keluarga"
                                className="h-8 w-8 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-transform active:scale-95"
                              >
                                <Plus className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start" className="w-56 text-xs rounded-xl p-1.5">
                              <DropdownMenuItem
                                onClick={() => setTambahAnggotaTarget({ family: f, mode: 'lahir' })}
                                className="cursor-pointer gap-2 py-2 rounded-lg"
                              >
                                <Plus className="w-3.5 h-3.5 text-emerald-600" />
                                <span>Anggota Keluarga Lahir</span>
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => setTambahAnggotaTarget({ family: f, mode: 'masuk' })}
                                className="cursor-pointer gap-2 py-2 rounded-lg"
                              >
                                <Plus className="w-3.5 h-3.5 text-blue-600" />
                                <span>Anggota Keluarga Masuk</span>
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => setTambahAnggotaTarget({ family: f, mode: 'exist' })}
                                className="cursor-pointer gap-2 py-2 rounded-lg"
                              >
                                <Plus className="w-3.5 h-3.5 text-purple-600" />
                                <span>Dari Penduduk Sudah Ada</span>
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>

                          {/* 3. Tombol Salinan KK Langsung */}
                          <Button
                            size="icon"
                            variant="ghost"
                            title="Pratinjau & Cetak Salinan KK"
                            onClick={() => onSelectFamily(f, 'salinan')}
                            className="h-8 w-8 rounded-xl bg-sky-600 hover:bg-sky-700 text-white shadow-xs transition-transform active:scale-95"
                          >
                            <FileText className="h-4 w-4" />
                          </Button>

                          {/* 4. Tombol Edit KK */}
                          <Button
                            size="icon"
                            variant="ghost"
                            title="Ubah Data Kepala & Alamat KK"
                            onClick={() => {
                              setEditingFamily(f);
                              setIsTambahKkOpen(true);
                            }}
                            className="h-8 w-8 rounded-xl bg-amber-600 hover:bg-amber-700 text-white shadow-xs transition-transform active:scale-95"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>

                      {/* Foto Avatar Kepala Keluarga */}
                      <TableCell className="text-center py-2.5">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center mx-auto text-xs font-bold border ${
                          isPria 
                            ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/50 dark:border-blue-900' 
                            : 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/50 dark:border-rose-900'
                        }`}>
                          <User className="w-4 h-4" />
                        </div>
                      </TableCell>

                      {/* Nomor KK (Link) */}
                      <TableCell className="py-2.5">
                        <button
                          onClick={() => onSelectFamily(f, 'salinan')}
                          className="font-mono font-bold text-teal-700 dark:text-teal-400 hover:underline cursor-pointer flex items-center gap-1.5"
                          title="Klik untuk membuka Salinan Kartu Keluarga"
                        >
                          <span>{f.noKk}</span>
                        </button>
                      </TableCell>

                      {/* Kepala Keluarga */}
                      <TableCell className="font-bold uppercase text-slate-900 dark:text-slate-100 py-2.5">
                        {f.kepalaKeluarga}
                      </TableCell>

                      {/* NIK Kepala */}
                      <TableCell className="font-mono text-slate-600 dark:text-slate-300 py-2.5">
                        {f.nikKepala || '-'}
                      </TableCell>

                      {/* Jumlah Anggota */}
                      <TableCell className="text-center py-2.5">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-black bg-stone-200/70 text-slate-800 dark:bg-slate-800 dark:text-slate-200">
                          {f.jumlahAnggota}
                        </span>
                      </TableCell>

                      {/* Status KK */}
                      <TableCell className="py-2.5">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold ${
                          f.statusKk === 'KK Kosong'
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200'
                            : f.statusKk === 'KK Hilang/Pindah/Mati'
                            ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200'
                            : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200'
                        }`}>
                          {f.statusKk || 'KK Aktif'}
                        </span>
                      </TableCell>

                      {/* Alamat & Dusun */}
                      <TableCell className="uppercase text-slate-700 dark:text-slate-300 max-w-xs truncate py-2.5">
                        {f.alamat ? `${f.alamat}` : `Dusun ${f.dusun || 'SAMPELDES'}`}
                      </TableCell>

                      {/* RW & RT */}
                      <TableCell className="text-center font-mono py-2.5">{f.rw || '-'}</TableCell>
                      <TableCell className="text-center font-mono py-2.5">{f.rt || '-'}</TableCell>

                      {/* Tanggal Terdaftar */}
                      <TableCell className="text-slate-500 text-[11px] py-2.5 whitespace-nowrap">
                        {f.tanggalTerdaftar || '-'}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* 5. Navigasi Paginasi Terpadu */}
        <div className="no-print flex flex-col sm:flex-row items-center justify-between gap-3 p-4 border-t border-stone-200/70 dark:border-white/10 bg-stone-50/50 dark:bg-slate-900/50 text-xs text-slate-600 dark:text-slate-400">
          <div className="flex items-center gap-2">
            <span>Baris per halaman:</span>
            <Select value={String(pageSize)} onValueChange={(val) => setPageSize(Number(val))}>
              <SelectTrigger className="h-8 w-20 rounded-xl text-xs bg-white dark:bg-slate-800 border-stone-300">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="text-xs rounded-xl">
                <SelectItem value="25">25</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
              </SelectContent>
            </Select>
            <span className="hidden sm:inline font-medium">
              | Menampilkan {totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1} - {Math.min(currentPage * pageSize, totalItems)} dari {totalItems} Kartu Keluarga
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="sm:hidden text-[11px] mr-2">
              Hal {currentPage} / {totalPages}
            </span>

            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 rounded-xl border-stone-300 hover:bg-stone-100"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              title="Halaman Sebelumnya"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <span className="hidden sm:inline-block px-3 font-semibold text-slate-800 dark:text-slate-200">
              Halaman {currentPage} dari {totalPages}
            </span>

            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 rounded-xl border-stone-300 hover:bg-stone-100"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              title="Halaman Berikutnya"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Dialog Tambah / Edit KK */}
      <TambahKkDialog
        isOpen={isTambahKkOpen}
        onClose={() => {
          setIsTambahKkOpen(false);
          setEditingFamily(null);
        }}
        existingFamily={editingFamily}
        onSuccess={onReload}
      />

      {/* Dialog Tambah Anggota (Lahir, Masuk, Exist) */}
      {tambahAnggotaTarget && (
        <TambahAnggotaDialog
          isOpen={!!tambahAnggotaTarget}
          onClose={() => setTambahAnggotaTarget(null)}
          family={tambahAnggotaTarget.family}
          mode={tambahAnggotaTarget.mode}
          onSuccess={onReload}
        />
      )}
    </div>
  );
}
