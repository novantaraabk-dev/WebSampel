'use client';

import { useState, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  MoreHorizontal,
  Search,
  UserPlus,
  Edit,
  Trash2,
  Users,
  FileUp,
  Loader2,
  AlertCircle,
  ShieldAlert,
  Database,
  BarChart3,
  FileSpreadsheet,
  FileText,
  Download,
  Layers,
  SlidersHorizontal,
  ChevronDown,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Resident } from '@/lib/types';
import { useFirestore } from '@/firebase';
import {
  collection,
  query,
  deleteDoc,
  doc,
  getDocs,
  where,
  limit,
  getCountFromServer,
  getDoc,
  writeBatch
} from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { ResidentForm } from './resident-form';
import { ImportResidentDialog } from './import-resident-dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { seedResidents, recalculateStatistics, getResidentByNik, getResidentsByKk, searchResidentsQuotaSafe, updateStatisticsCountOnly, invalidateResidentCache } from '@/lib/residents';

export function ResidentList() {
  console.log('ResidentList render');
  const [searchTerm, setSearchTerm] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [editingResident, setEditingResident] = useState<Resident | null>(null);
  const [isDeletingAll, setIsDeletingAll] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);
  const [isRecalculating, setIsRecalculating] = useState(false);
  const [isExportingExcel, setIsExportingExcel] = useState(false);
  const [isExportingPDF, setIsExportingPDF] = useState(false);

  const [residents, setResidents] = useState<Resident[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [totalCount, setTotalCount] = useState<number | null>(null);

  const firestore = useFirestore();
  const { toast } = useToast();

  const handleDownloadExcel = async () => {
    if (!firestore) return;
    setIsExportingExcel(true);
    try {
      let dataToExport = residents;
      if (dataToExport.length === 0) {
        const snap = await getDocs(query(collection(firestore, 'residents'), limit(5000)));
        dataToExport = snap.docs.map(d => ({ id: d.id, ...d.data() } as Resident));
      }

      if (dataToExport.length === 0) {
        toast({ title: "Data Kosong", description: "Tidak ada data penduduk untuk diunduh." });
        return;
      }

      const excelData = dataToExport.map((r, index) => ({
        'No': index + 1,
        'NIK': r.nik || '',
        'No. KK': r.noKk || '',
        'Nama Lengkap': r.fullName || '',
        'Jenis Kelamin': r.gender || '',
        'Tempat Lahir': r.placeOfBirth || '',
        'Tanggal Lahir': r.dateOfBirth || '',
        'Agama': r.religion || '',
        'Status Perkawinan': r.maritalStatus || '',
        'Pendidikan': r.educationLevel || '',
        'Pekerjaan': r.occupation || '',
        'Hubungan Keluarga': r.relationshipToHeadOfFamily || '',
        'Golongan Darah': r.bloodType || '',
        'Alamat': r.address || '',
        'RT': r.rt || '',
        'RW': r.rw || '',
        'Kelurahan/Desa': r.kelurahan || 'Sampeldes',
        'Nama Ayah': r.fatherName || '',
        'Nama Ibu': r.motherName || '',
      }));

      const worksheet = XLSX.utils.json_to_sheet(excelData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Data Penduduk');

      const fileName = `Data_Penduduk_Desa_Sampeldes_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(workbook, fileName);

      toast({
        title: "Excel Berhasil Diunduh",
        description: `${dataToExport.length} data penduduk telah diekspor ke file Excel.`,
      });
    } catch (error: any) {
      console.error("Error exporting Excel:", error);
      toast({ variant: "destructive", title: "Gagal Ekspor Excel", description: error.message });
    } finally {
      setIsExportingExcel(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!firestore) return;
    setIsExportingPDF(true);
    try {
      let dataToExport = residents;
      if (dataToExport.length === 0) {
        const snap = await getDocs(query(collection(firestore, 'residents'), limit(5000)));
        dataToExport = snap.docs.map(d => ({ id: d.id, ...d.data() } as Resident));
      }

      if (dataToExport.length === 0) {
        toast({ title: "Data Kosong", description: "Tidak ada data penduduk untuk diunduh." });
        return;
      }

      const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text('PEMERINTAH KABUPATEN CILACAP', 148, 14, { align: 'center' });
      pdf.setFontSize(12);
      pdf.text('KECAMATAN GANDRUNGMANGU - DESA SAMPELDES', 148, 20, { align: 'center' });
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.text('LAPORAN DATA KEPENDUDUKAN DESA SAMPELDES', 148, 26, { align: 'center' });
      pdf.setLineWidth(0.5);
      pdf.line(14, 29, 283, 29);

      const tableColumn = [
        'No', 'NIK', 'No. KK', 'Nama Lengkap', 'JK', 'Tgl Lahir', 'Agama', 'SHDK', 'Pekerjaan', 'RT/RW'
      ];

      const tableRows = dataToExport.map((r, index) => [
        index + 1,
        r.nik || '-',
        r.noKk || '-',
        r.fullName || '-',
        r.gender || '-',
        r.dateOfBirth || '-',
        r.religion || '-',
        r.relationshipToHeadOfFamily || '-',
        r.occupation || '-',
        `RT ${r.rt || '-'}/RW ${r.rw || '-'}`
      ]);

      autoTable(pdf, {
        head: [tableColumn],
        body: tableRows,
        startY: 33,
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: [2, 132, 199], textColor: [255, 255, 255], fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [248, 250, 252] },
      });

      const fileName = `Data_Penduduk_Desa_Sampeldes_${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(fileName);

      toast({
        title: "PDF Berhasil Diunduh",
        description: `${dataToExport.length} data penduduk telah diekspor ke file PDF.`,
      });
    } catch (error: any) {
      console.error("Error exporting PDF:", error);
      toast({ variant: "destructive", title: "Gagal Ekspor PDF", description: error.message });
    } finally {
      setIsExportingPDF(false);
    }
  };

  const fetchTotalCount = async () => {
    if (!firestore) return;
    try {
      const coll = collection(firestore, 'residents');
      const snapshot = await getCountFromServer(coll);
      setTotalCount(snapshot.data().count);
    } catch (error) {
      console.error("Error fetching count:", error);
    }
  };

  useEffect(() => { if (firestore) fetchTotalCount(); }, []);

  const handleLoadRecent = async () => {
    if (!firestore) return;
    setIsSearching(true);
    setHasSearched(true);
    try {
      const q = query(collection(firestore, 'residents'), limit(15));
      const snap = await getDocs(q);
      const docsData = snap.docs.map(d => ({ id: d.id, ...d.data() } as Resident));
      setResidents(docsData);
      toast({
        title: "Data Berhasil Dimuat",
        description: `Menampilkan ${docsData.length} data awal penduduk dari database.`,
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Gagal Memuat Data",
        description: error.message,
      });
    } finally {
      setIsSearching(false);
    }
  };

  const handleResetSearch = () => {
    setSearchTerm('');
    setResidents([]);
    setHasSearched(false);
  };

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!firestore) return;

    const term = searchTerm.trim();
    if (!term) return;

    setIsSearching(true);
    setHasSearched(true);

    try {
      const cleanDigits = term.replace(/\D/g, '');
      const resultsMap = new Map<string, Resident>();

      // 1. SKEMA HEMAT KUOTA: Cek bertahap (Sequential Smart Lookup), BUKAN 5 query paralel!
      if (cleanDigits.length === 16) {
        // Coba cek NIK langsung (0 Read jika di cache, 1 Read jika di Firestore)
        const directRes = await getResidentByNik(firestore, cleanDigits);
        if (directRes) {
          resultsMap.set(directRes.id || directRes.nik, directRes);
        }
        // Cek juga apakah 16 digit ini adalah Nomor KK (menggunakan cache KK)
        const kkMembers = await getResidentsByKk(firestore, cleanDigits);
        kkMembers.forEach((m) => resultsMap.set(m.id || m.nik, m));

        if (resultsMap.size > 0) {
          setResidents(Array.from(resultsMap.values()));
          setIsSearching(false);
          return;
        }
      }

      // 2. Pencarian hemat kuota dengan cache in-memory & limit ketat (maks 25 dokumen)
      const safeResults = await searchResidentsQuotaSafe(firestore, term, 25);
      safeResults.forEach((r) => resultsMap.set(r.id || r.nik, r));

      const results = Array.from(resultsMap.values());
      setResidents(results);

      if (results.length === 0) {
        toast({
          title: "Tidak Ditemukan",
          description: `Data "${term}" tidak ada di database.`,
        });
      }
    } catch (error: any) {
      console.error("Search error:", error);
      toast({
        variant: "destructive",
        title: "Gagal Mencari",
        description: "Terjadi kesalahan kuota atau jaringan."
      });
    } finally {
      setIsSearching(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!firestore) return;
    try {
      await deleteDoc(doc(firestore, 'residents', id));
      setResidents(residents.filter(r => r.id !== id));
      if (totalCount !== null) setTotalCount(totalCount - 1);

      // Update demographic cache
      invalidateResidentCache(id);
      await updateStatisticsCountOnly(firestore);

      toast({ title: "Data Dihapus", description: "Data warga telah dihapus." });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Gagal Menghapus", description: error.message });
    }
  };

  const handleDeleteAll = async () => {
    if (!firestore) return;
    setIsDeletingAll(true);

    try {
      const residentsCol = collection(firestore, 'residents');
      const snapshot = await getDocs(residentsCol);

      if (snapshot.empty) {
        toast({ title: "Database Kosong", description: "Tidak ada data yang bisa dihapus." });
        setIsDeletingAll(false);
        return;
      }

      let count = 0;
      const chunks = [];
      const allDocs = snapshot.docs;
      for (let i = 0; i < allDocs.length; i += 500) chunks.push(allDocs.slice(i, i + 500));

      for (const chunk of chunks) {
        const batch = writeBatch(firestore);
        chunk.forEach((d) => {
          batch.delete(d.ref);
          count++;
        });
        await batch.commit();
      }

      // Update demographic cache
      invalidateResidentCache();
      await updateStatisticsCountOnly(firestore);

      setResidents([]);
      setTotalCount(0);
      toast({ title: "Berhasil", description: `${count} data penduduk telah dihapus permanen.` });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Gagal Menghapus Semua", description: error.message });
    } finally {
      setIsDeletingAll(false);
    }
  };

  const handleSeedData = async () => {
    if (!firestore) return;
    setIsSeeding(true);
    try {
      await seedResidents(firestore);
      invalidateResidentCache();
      await updateStatisticsCountOnly(firestore);
      await fetchTotalCount();
      toast({
        title: "Data Testing Berhasil",
        description: "Beberapa data contoh telah ditambahkan ke database.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Gagal Menambah Data",
        description: error.message,
      });
    } finally {
      setIsSeeding(false);
    }
  };

  const handleRecalculate = async () => {
    if (!firestore) return;
    setIsRecalculating(true);
    try {
      invalidateResidentCache();
      await updateStatisticsCountOnly(firestore);
      await fetchTotalCount();
      toast({
        title: "Statistik Diperbarui",
        description: "Statistik kependudukan berhasil dihitung ulang dan disimpan.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Gagal Memperbarui Statistik",
        description: error.message,
      });
    } finally {
      setIsRecalculating(false);
    }
  };

  const handleEdit = (resident: Resident) => {
    setEditingResident(resident);
    setIsFormOpen(true);
  };

  const handleAdd = () => {
    setEditingResident(null);
    setIsFormOpen(true);
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* 3 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <Card className="bg-white border border-stone-200/90 rounded-2xl shadow-xs overflow-hidden p-4">
          <div className="flex items-center justify-between text-slate-500 mb-1.5">
            <span className="font-condensed font-bold uppercase text-[11px] tracking-wider text-slate-600">Total Warga Terdaftar</span>
            <div className="p-1.5 rounded-lg bg-[#070b10] text-[#d4e157]">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-condensed font-extrabold text-slate-950 tracking-tight">
            {totalCount === null ? <Skeleton className="h-8 w-24" /> : totalCount.toLocaleString('id-ID')}
          </div>
          <p className="text-[10px] text-slate-400 font-medium mt-0.5">Dokumen kependudukan aktif di database desa</p>
        </Card>

        <Card className="bg-white border border-stone-200/90 rounded-2xl shadow-xs overflow-hidden p-4">
          <div className="flex items-center justify-between text-slate-500 mb-1.5">
            <span className="font-condensed font-bold uppercase text-[11px] tracking-wider text-slate-600">Mode Akses Hemat Kuota</span>
            <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
              <Search className="h-4 w-4" />
            </div>
          </div>
          <div className="text-base sm:text-lg font-condensed font-extrabold text-emerald-800 tracking-tight">
            NIK 16 Digit &amp; Nama Depan
          </div>
          <p className="text-[10px] text-slate-400 font-medium mt-0.5">Pencarian terindeks cepat tanpa membebani server</p>
        </Card>

        <Card className="bg-white border border-stone-200/90 rounded-2xl shadow-xs overflow-hidden p-4">
          <div className="flex items-center justify-between text-slate-500 mb-1.5">
            <span className="font-condensed font-bold uppercase text-[11px] tracking-wider text-slate-600">Layanan Berkas &amp; Cetak</span>
            <div className="p-1.5 rounded-lg bg-sky-50 text-sky-600">
              <FileSpreadsheet className="h-4 w-4" />
            </div>
          </div>
          <div className="text-base sm:text-lg font-condensed font-extrabold text-sky-800 tracking-tight">
            Excel &amp; PDF Resmi
          </div>
          <p className="text-[10px] text-slate-400 font-medium mt-0.5">Dukungan cetak data keluarga dan impor batch</p>
        </Card>
      </div>

      {/* Search & Actions Card */}
      <div className="bg-white border border-stone-200/90 rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
        {/* Search Bar */}
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-2 sm:gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Ketik NIK, Nomor KK (16 digit), atau Nama Warga..."
              className="pl-10 h-10 rounded-xl text-xs sm:text-sm border-stone-300 bg-stone-50/50 focus:bg-white"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              disabled={isSearching}
            />
          </div>
          <Button
            type="submit"
            className="h-10 px-6 rounded-xl text-xs font-black bg-[#d4e157] text-slate-950 hover:bg-[#c2cf38] uppercase tracking-wider border border-black/10 transition-all shrink-0"
            disabled={isSearching}
          >
            {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4 mr-1.5" />}
            Cari Warga
          </Button>
          {hasSearched && (
            <Button
              type="button"
              variant="outline"
              onClick={handleResetSearch}
              className="h-10 px-4 rounded-xl text-xs font-bold border-stone-300 text-slate-700 hover:text-slate-950 gap-1.5 shrink-0"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Reset</span>
            </Button>
          )}
        </form>

        {/* Action Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-stone-100">
          {/* Left Actions: Everyday actions */}
          <div className="flex flex-wrap items-center gap-2">
            <Button
              size="sm"
              onClick={handleAdd}
              className="h-9 px-3.5 rounded-xl text-xs font-black bg-[#d4e157] text-slate-950 hover:bg-[#c2cf38] uppercase tracking-wider border border-black/10 shadow-xs"
            >
              <UserPlus className="mr-1.5 h-3.5 w-3.5" />
              Tambah Warga
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsImportOpen(true)}
              className="h-9 text-xs rounded-xl px-3 font-bold border-stone-300 text-slate-700 hover:text-slate-950"
            >
              <FileUp className="mr-1.5 h-3.5 w-3.5 text-blue-600" />
              Impor Excel
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadExcel}
              disabled={isExportingExcel}
              className="h-9 text-xs rounded-xl px-3 border-emerald-600/60 text-emerald-800 hover:bg-emerald-50 font-bold"
            >
              {isExportingExcel ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <FileSpreadsheet className="mr-1.5 h-3.5 w-3.5 text-emerald-600" />}
              Unduh Excel
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadPDF}
              disabled={isExportingPDF}
              className="h-9 text-xs rounded-xl px-3 border-rose-600/60 text-rose-800 hover:bg-rose-50 font-bold"
            >
              {isExportingPDF ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <FileText className="mr-1.5 h-3.5 w-3.5 text-rose-600" />}
              Unduh PDF
            </Button>
          </div>

          {/* Right Actions: Quick load & Admin options */}
          <div className="flex items-center gap-2">
            {!hasSearched && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleLoadRecent}
                disabled={isSearching}
                className="h-9 text-xs rounded-xl px-3 font-bold border-sky-300 text-sky-800 hover:bg-sky-50"
              >
                {isSearching ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Layers className="mr-1.5 h-3.5 w-3.5 text-sky-600" />}
                Muat 15 Data Awal
              </Button>
            )}

            {/* Dropdown Menu for Database Maintenance */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-9 px-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-stone-100 gap-1"
                >
                  <SlidersHorizontal className="h-3.5 w-3.5 text-slate-500" />
                  <span className="hidden sm:inline">Alat Database</span>
                  <ChevronDown className="h-3 w-3 opacity-60" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 rounded-xl p-1.5 shadow-xl bg-white border border-stone-200">
                <DropdownMenuItem onClick={handleRecalculate} disabled={isRecalculating} className="text-xs font-medium cursor-pointer py-2">
                  <BarChart3 className="mr-2 h-4 w-4 text-emerald-600" />
                  Update &amp; Hitung Ulang Statistik
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleSeedData} disabled={isSeeding} className="text-xs font-medium cursor-pointer py-2">
                  <Database className="mr-2 h-4 w-4 text-amber-600" />
                  Muat Data Testing Dummy
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <div className="flex items-center gap-2 px-2 py-2 text-xs font-bold text-red-600 hover:bg-red-50 rounded-lg cursor-pointer transition-colors">
                      <Trash2 className="h-4 w-4" />
                      <span>Hapus Semua Data</span>
                    </div>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="w-[92vw] max-w-md rounded-2xl border-red-200 p-4 sm:p-6">
                    <AlertDialogHeader>
                      <AlertDialogTitle className="flex items-center gap-2 text-red-600 text-sm sm:text-base font-bold">
                        <ShieldAlert className="h-5 w-5 shrink-0" />
                        PERINGATAN KERAS!
                      </AlertDialogTitle>
                      <AlertDialogDescription asChild>
                        <div className="space-y-3 text-xs sm:text-sm">
                          <p className="font-bold text-red-900">
                            Tindakan ini akan menghapus SELURUH ({totalCount ?? 0}) data penduduk dari server secara permanen.
                          </p>
                          <p>Pastikan Anda sudah memiliki cadangan data (backup) sebelum melanjutkan. Tindakan ini tidak dapat dibatalkan.</p>
                        </div>
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="flex-row gap-2 mt-4">
                      <AlertDialogCancel className="flex-1 mt-0 text-xs sm:text-sm">Batal</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDeleteAll} className="flex-1 bg-red-600 text-white hover:bg-red-700 text-xs sm:text-sm">
                        Ya, Hapus Semua
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>


      <div className="rounded-[1.6rem] border border-stone-200/90 bg-white overflow-hidden shadow-xs">
        {/* Mobile Card List View (block sm:hidden) - Full screen width, zero horizontal scrolling */}
        <div className="block sm:hidden divide-y divide-slate-100">
          {isSearching ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="p-3.5 space-y-2">
                <Skeleton className="h-4 w-3/4 rounded" />
                <Skeleton className="h-3 w-1/2 rounded" />
                <Skeleton className="h-14 w-full rounded-xl" />
              </div>
            ))
          ) : residents.length > 0 ? (
            residents.map((resident) => (
              <div key={resident.id} className="p-3.5 space-y-2.5 bg-white">
                {/* Header Kartu: Nama & Hubungan */}
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-0.5 flex-1 min-w-0">
                    <p className="font-black text-xs uppercase text-slate-800 leading-snug break-words">
                      {resident.fullName}
                    </p>
                    <div className="flex flex-wrap items-center gap-1.5 text-[9px] text-slate-500 font-bold uppercase">
                      <span>{resident.gender === 'L' || resident.gender === 'LAKI-LAKI' ? 'Laki-laki' : resident.gender === 'P' || resident.gender === 'PEREMPUAN' ? 'Perempuan' : resident.gender || '-'}</span>
                      {resident.dateOfBirth && (
                        <>
                          <span className="text-slate-300">•</span>
                          <span>{resident.dateOfBirth}</span>
                        </>
                      )}
                    </div>
                  </div>
                  {resident.relationshipToHeadOfFamily && (
                    <span className="text-[9px] font-black uppercase px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md shrink-0">
                      {resident.relationshipToHeadOfFamily}
                    </span>
                  )}
                </div>

                {/* Identitas Kependudukan (NIK & No. KK) */}
                <div className="grid grid-cols-2 gap-2 p-2 bg-slate-50/80 rounded-xl text-[10px]">
                  <div>
                    <span className="text-[8px] font-black uppercase tracking-wider text-slate-400 block">NIK</span>
                    <span className="font-mono font-bold text-slate-700 tracking-tight">{resident.nik}</span>
                  </div>
                  <div>
                    <span className="text-[8px] font-black uppercase tracking-wider text-slate-400 block">NO. KK</span>
                    <span className="font-mono font-bold text-slate-700 tracking-tight">{resident.noKk || '-'}</span>
                  </div>
                </div>

                {/* Alamat & Informasi Tambahan */}
                <div className="text-[10px] text-slate-600 space-y-1">
                  <p className="leading-tight">
                    <span className="font-bold text-slate-400">Alamat: </span>
                    {`${resident.address || ''}, RT ${resident.rt || '-'} RW ${resident.rw || '-'}, ${resident.kelurahan || 'Sampeldes'}`}
                  </p>
                  {(resident.religion || resident.occupation) && (
                    <p className="text-[9px] text-slate-400 font-medium">
                      {resident.religion ? <>Agama: <span className="text-slate-600 font-bold">{resident.religion}</span></> : null}
                      {resident.religion && resident.occupation ? ' • ' : null}
                      {resident.occupation ? <>Pekerjaan: <span className="text-slate-600 font-bold">{resident.occupation}</span></> : null}
                    </p>
                  )}
                </div>

                {/* Baris Tombol Aksi Sentuh */}
                <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(resident)}
                    className="h-8 text-[11px] font-bold rounded-lg flex-1 text-emerald-700 hover:text-emerald-800 border-emerald-200 hover:bg-emerald-50 gap-1.5"
                  >
                    <Edit className="h-3.5 w-3.5" />
                    <span>Edit Data</span>
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 px-2.5 text-[11px] font-bold rounded-lg text-red-500 hover:text-red-600 hover:bg-red-50 gap-1">
                        <Trash2 className="h-3.5 w-3.5" />
                        <span>Hapus</span>
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="w-[92vw] max-w-md rounded-2xl p-4 sm:p-6">
                      <AlertDialogHeader>
                        <AlertDialogTitle className="text-sm sm:text-base font-bold">Hapus Data Penduduk?</AlertDialogTitle>
                        <AlertDialogDescription className="text-xs sm:text-sm">
                          Data <strong>{resident.fullName}</strong> (NIK: {resident.nik}) akan dihapus permanen dari database.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter className="flex-row gap-2 mt-4">
                        <AlertDialogCancel className="flex-1 mt-0 text-xs sm:text-sm">Batal</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDelete(resident.id)} className="flex-1 bg-red-600 hover:bg-red-700 text-white text-xs sm:text-sm">
                          Hapus
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            ))
          ) : (
            <div className="p-8 text-center text-slate-400 text-xs italic">
              {hasSearched ? "Data tidak ditemukan." : "Gunakan pencarian di atas untuk menampilkan data penduduk."}
            </div>
          )}
        </div>

        {/* Desktop Table View (hidden sm:block) */}
        <div className="hidden sm:block overflow-x-auto">
          <Table>
            <TableHeader className="bg-stone-50 border-b border-stone-200">
              <TableRow>
                <TableHead className="font-condensed font-bold uppercase text-slate-700 text-xs tracking-wider">NIK</TableHead>
                <TableHead className="font-condensed font-bold uppercase text-slate-700 text-xs tracking-wider">KK</TableHead>
                <TableHead className="font-condensed font-bold uppercase text-slate-700 text-xs tracking-wider">Nama Lengkap</TableHead>
                <TableHead className="font-condensed font-bold uppercase text-slate-700 text-xs tracking-wider">Tgl Lahir</TableHead>
                <TableHead className="font-condensed font-bold uppercase text-slate-700 text-xs tracking-wider">JK</TableHead>
                <TableHead className="font-condensed font-bold uppercase text-slate-700 text-xs tracking-wider">Agama</TableHead>
                <TableHead className="font-condensed font-bold uppercase text-slate-700 text-xs tracking-wider">SHDK</TableHead>
                <TableHead className="font-condensed font-bold uppercase text-slate-700 text-xs tracking-wider">Alamat</TableHead>
                <TableHead className="text-right font-condensed font-bold uppercase text-slate-700 text-xs tracking-wider">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isSearching ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <TableRow key={i}><TableCell colSpan={9}><Skeleton className="h-12 w-full" /></TableCell></TableRow>
                ))
              ) : residents.length > 0 ? (
                residents.map((resident) => (
                  <TableRow key={resident.id} className="hover:bg-muted/30">
                    <TableCell className="font-mono text-[10px]">{resident.nik}</TableCell>
                    <TableCell className="font-mono text-[10px]">{resident.noKk}</TableCell>
                    <TableCell className="font-medium uppercase text-[10px]">{resident.fullName}</TableCell>
                    <TableCell className="text-[10px] whitespace-nowrap">{resident.dateOfBirth}</TableCell>
                    <TableCell className="text-[10px]">{resident.gender || '-'}</TableCell>
                    <TableCell className="text-[10px]">{resident.religion || '-'}</TableCell>
                    <TableCell className="text-[10px] font-semibold">{resident.relationshipToHeadOfFamily || '-'}</TableCell>
                    <TableCell className="text-[10px] min-w-[300px]">
                      <p className="leading-tight truncate">
                        {`${resident.address}, RT ${resident.rt} RW ${resident.rw}, ${resident.kelurahan}, Kec. Gandrungmangu, Kab. Cilacap`}
                      </p>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEdit(resident)}><Edit className="mr-2 h-4 w-4" /> Edit</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <div className="flex w-full items-center px-2 py-1.5 text-sm text-red-600 hover:bg-red-50 cursor-default">
                                <Trash2 className="mr-2 h-4 w-4" /> Hapus
                              </div>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Hapus Data?</AlertDialogTitle>
                                <AlertDialogDescription>Data {resident.fullName} akan dihapus permanen.</AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Batal</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDelete(resident.id)} className="bg-red-600 text-white">Ya, Hapus</AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={9} className="py-12 text-center">
                    <div className="flex flex-col items-center justify-center gap-2.5 max-w-sm mx-auto">
                      <div className="w-12 h-12 rounded-2xl bg-stone-100 flex items-center justify-center text-slate-500">
                        <Users className="h-6 w-6 text-slate-400" />
                      </div>
                      <div className="space-y-1">
                        <h4 className="font-condensed font-bold text-sm uppercase text-slate-800">
                          {hasSearched ? "Data Warga Tidak Ditemukan" : "Siap Mencari Data Kependudukan"}
                        </h4>
                        <p className="text-xs text-slate-500 leading-relaxed">
                          {hasSearched
                            ? `Tidak ada warga yang cocok dengan kata kunci "${searchTerm}". Coba periksa NIK atau ejaan nama.`
                            : "Ketik NIK 16 digit atau Nama Warga di kotak pencarian di atas, atau klik tombol di bawah untuk menampilkan 15 data awal."}
                        </p>
                      </div>
                      {!hasSearched && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleLoadRecent}
                          disabled={isSearching}
                          className="mt-1 rounded-xl text-xs font-bold border-stone-300 text-sky-800 hover:bg-sky-50 gap-1.5"
                        >
                          <Layers className="h-3.5 w-3.5 text-sky-600" />
                          <span>Muat 15 Data Awal</span>
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <ResidentForm open={isFormOpen} onOpenChange={setIsFormOpen} resident={editingResident} />
      <ImportResidentDialog open={isImportOpen} onOpenChange={setIsImportOpen} />
    </div>
  );
}
