'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useUser } from '@/firebase';
import {
  collection,
  getDocs,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  serverTimestamp,
  where,
  limit,
} from 'firebase/firestore';
import {
  CDesa,
  DataPersil,
  MutasiCDesa,
  SebabMutasi,
} from '@/types/pertanahan';
import {
  BookOpen,
  Plus,
  Search,
  Download,
  Printer,
  FileSpreadsheet,
  Layers,
  ArrowRightLeft,
  ArrowUpRight,
  Eye,
  Edit,
  Trash2,
  RefreshCw,
  FileText,
  UserCheck,
  Building,
  CheckCircle2,
  History,
  FileCheck,
  Scale,
} from 'lucide-react';
import Link from 'next/link';
import * as XLSX from 'xlsx';
import { searchResidentsQuotaSafe } from '@/lib/residents';

function CDesaContent() {
  const db = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const paramNomorC = searchParams.get('nomorC');

  // Main data lists
  const [cDesaList, setCDesaList] = useState<CDesa[]>([]);
  const [mutasiList, setMutasiList] = useState<MutasiCDesa[]>([]);
  const [persilList, setPersilList] = useState<DataPersil[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState(paramNomorC || '');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [activeTab, setActiveTab] = useState<'buku_c' | 'mutasi'>('buku_c');

  // Dialog states
  const [isCDesaFormOpen, setIsCDesaFormOpen] = useState(false);
  const [editingCDesa, setEditingCDesa] = useState<CDesa | null>(null);
  const [deleteCDesa, setDeleteCDesa] = useState<CDesa | null>(null);

  const [isMutasiFormOpen, setIsMutasiFormOpen] = useState(false);
  const [detailCDesa, setDetailCDesa] = useState<CDesa | null>(null);
  const [printKutipanItem, setPrintKutipanItem] = useState<{ cdesa: CDesa; persil: DataPersil[]; mutasi: MutasiCDesa[] } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form State: Buku C-Desa
  interface CDesaFormState {
    nomorC: string;
    jenisPemilik: 'penduduk' | 'luar_desa' | 'alm_waris';
    nik: string;
    namaPemilik: string;
    alamat: string;
    namaWaris: string;
    totalLuasDaratM2: number;
    totalLuasSawahM2: number;
    totalLuasTotalM2: number;
    jumlahPersil: number;
    status: 'aktif' | 'mutasi_penuh';
    catatan: string;
  }

  const initialCDesaForm: CDesaFormState = {
    nomorC: '',
    jenisPemilik: 'penduduk',
    nik: '',
    namaPemilik: '',
    alamat: '',
    namaWaris: '',
    totalLuasDaratM2: 0,
    totalLuasSawahM2: 0,
    totalLuasTotalM2: 0,
    jumlahPersil: 0,
    status: 'aktif',
    catatan: '',
  };
  const [cDesaForm, setCDesaForm] = useState<CDesaFormState>(initialCDesaForm);

  // Form State: Mutasi
  interface MutasiFormState {
    cDesaId: string;
    nomorCAsal: string;
    namaPemilikAsal: string;
    persilId: string;
    nomorPersil: string;
    kelasTanah: string;
    luasAwalM2: number;
    tanggalMutasi: string;
    sebabMutasi: SebabMutasi;
    luasDimutasiM2: number;
    sisaLuasM2: number;
    jenisPenerima: 'penduduk' | 'luar_desa';
    cDesaTujuanNomor: string;
    namaPenerima: string;
    nikPenerima: string;
    alamatPenerima: string;
    nomorAkta: string;
    tanggalAkta: string;
    pejabatPembuatAkta: string;
    keterangan: string;
  }

  const initialMutasiForm: MutasiFormState = {
    cDesaId: '',
    nomorCAsal: '',
    namaPemilikAsal: '',
    persilId: '',
    nomorPersil: '',
    kelasTanah: '',
    luasAwalM2: 0,
    tanggalMutasi: new Date().toISOString().slice(0, 10),
    sebabMutasi: 'jual_beli',
    luasDimutasiM2: 0,
    sisaLuasM2: 0,
    jenisPenerima: 'penduduk',
    cDesaTujuanNomor: '',
    namaPenerima: '',
    nikPenerima: '',
    alamatPenerima: '',
    nomorAkta: '',
    tanggalAkta: new Date().toISOString().slice(0, 10),
    pejabatPembuatAkta: 'PPATS / Camat',
    keterangan: '',
  };
  const [mutasiForm, setMutasiForm] = useState<MutasiFormState>(initialMutasiForm);

  // Resident search autocomplete for C-Desa form
  const [residentSearch, setResidentSearch] = useState('');
  const [residentSuggestions, setResidentSuggestions] = useState<any[]>([]);

  // Resident search autocomplete for Mutasi form
  const [mutasiPenerimaSearch, setMutasiPenerimaSearch] = useState('');
  const [mutasiPenerimaSuggestions, setMutasiPenerimaSuggestions] = useState<any[]>([]);

  // Fetch all data
  const fetchData = async () => {
    if (!db) return;
    setLoading(true);
    try {
      // 1. Fetch C-Desa
      const snapC = await getDocs(query(collection(db, 'cdesa'), orderBy('nomorC', 'asc')));
      const listC: CDesa[] = [];
      snapC.forEach((d) => listC.push({ id: d.id, ...(d.data() as any) }));
      setCDesaList(listC);

      // 2. Fetch Mutasi
      const snapM = await getDocs(query(collection(db, 'mutasi_cdesa'), orderBy('tanggalMutasi', 'desc')));
      const listM: MutasiCDesa[] = [];
      snapM.forEach((d) => listM.push({ id: d.id, ...(d.data() as any) }));
      setMutasiList(listM);

      // 3. Fetch Persil for relations
      const snapP = await getDocs(collection(db, 'data_persil'));
      const listP: DataPersil[] = [];
      snapP.forEach((d) => listP.push({ id: d.id, ...(d.data() as any) }));
      setPersilList(listP);
    } catch (err: any) {
      console.error('Error fetching C-Desa data:', err);
      toast({
        title: 'Gagal Memuat Data',
        description: err.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [db]);

  // Autocomplete for C-Desa Owner (Quota-Safe Search: maksimal 5 dokumen dengan cache, BUKAN limit 300!)
  useEffect(() => {
    if (!db || residentSearch.trim().length < 3 || cDesaForm.jenisPemilik !== 'penduduk') {
      setResidentSuggestions([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const res = await searchResidentsQuotaSafe(db, residentSearch, 5);
        setResidentSuggestions(
          res.map((r: any) => ({
            ...r,
            name: r.fullName || r.name || '',
          }))
        );
      } catch (e) {
        console.error(e);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [residentSearch, db, cDesaForm.jenisPemilik]);

  // Autocomplete for Mutasi Penerima (Quota-Safe Search: maksimal 5 dokumen dengan cache, BUKAN limit 300!)
  useEffect(() => {
    if (!db || mutasiPenerimaSearch.trim().length < 3 || mutasiForm.jenisPenerima !== 'penduduk') {
      setMutasiPenerimaSuggestions([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const res = await searchResidentsQuotaSafe(db, mutasiPenerimaSearch, 5);
        setMutasiPenerimaSuggestions(
          res.map((r: any) => ({
            ...r,
            name: r.fullName || r.name || '',
          }))
        );
      } catch (e) {
        console.error(e);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [mutasiPenerimaSearch, db, mutasiForm.jenisPenerima]);

  // Open Add C-Desa
  const handleOpenAddCDesa = () => {
    setEditingCDesa(null);
    setCDesaForm(initialCDesaForm);
    setResidentSearch('');
    setIsCDesaFormOpen(true);
  };

  // Open Edit C-Desa
  const handleOpenEditCDesa = (item: CDesa) => {
    setEditingCDesa(item);
    setCDesaForm({
      nomorC: item.nomorC || '',
      jenisPemilik: item.jenisPemilik || 'penduduk',
      nik: item.nik || '',
      namaPemilik: item.namaPemilik || '',
      alamat: item.alamat || '',
      namaWaris: item.namaWaris || '',
      totalLuasDaratM2: item.totalLuasDaratM2 || 0,
      totalLuasSawahM2: item.totalLuasSawahM2 || 0,
      totalLuasTotalM2: item.totalLuasTotalM2 || 0,
      jumlahPersil: item.jumlahPersil || 0,
      status: item.status || 'aktif',
      catatan: item.catatan || '',
    });
    setResidentSearch(item.namaPemilik || '');
    setIsCDesaFormOpen(true);
  };

  // Submit C-Desa Form
  const handleSubmitCDesa = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db) return;

    if (!cDesaForm.nomorC.trim()) {
      toast({ title: 'Validasi Gagal', description: 'Nomor Kohir C-Desa wajib diisi', variant: 'destructive' });
      return;
    }
    if (!cDesaForm.namaPemilik.trim()) {
      toast({ title: 'Validasi Gagal', description: 'Nama pemilik wajib diisi', variant: 'destructive' });
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        ...cDesaForm,
        totalLuasDaratM2: Number(cDesaForm.totalLuasDaratM2) || 0,
        totalLuasSawahM2: Number(cDesaForm.totalLuasSawahM2) || 0,
        totalLuasTotalM2:
          (Number(cDesaForm.totalLuasDaratM2) || 0) + (Number(cDesaForm.totalLuasSawahM2) || 0),
        jumlahPersil: Number(cDesaForm.jumlahPersil) || 0,
        updatedAt: serverTimestamp(),
      };

      if (editingCDesa) {
        await updateDoc(doc(db, 'cdesa', editingCDesa.id), payload);
        toast({ title: 'Berhasil', description: 'Buku C-Desa berhasil diperbarui' });
      } else {
        await addDoc(collection(db, 'cdesa'), {
          ...payload,
          createdAt: serverTimestamp(),
          createdBy: user?.email || 'admin',
        });
        toast({ title: 'Berhasil', description: 'Nomor Kohir C-Desa baru berhasil dicatatkan' });
      }

      setIsCDesaFormOpen(false);
      fetchData();
    } catch (err: any) {
      toast({ title: 'Gagal Menyimpan', description: err.message, variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  // Delete C-Desa
  const handleConfirmDeleteCDesa = async () => {
    if (!db || !deleteCDesa) return;
    try {
      await deleteDoc(doc(db, 'cdesa', deleteCDesa.id));
      toast({ title: 'Berhasil', description: `Buku C.${deleteCDesa.nomorC} telah dihapus` });
      setDeleteCDesa(null);
      fetchData();
    } catch (err: any) {
      toast({ title: 'Gagal Menghapus', description: err.message, variant: 'destructive' });
    }
  };

  // Open Mutasi Form for a specific C-Desa
  const handleOpenMutasi = (cItem?: CDesa) => {
    if (cItem) {
      // Cari persil milik C-Desa ini
      const relatedPersil = persilList.filter((p) => p.nomorCDesa === cItem.nomorC);
      const firstPersil = relatedPersil[0];

      setMutasiForm({
        ...initialMutasiForm,
        cDesaId: cItem.id,
        nomorCAsal: cItem.nomorC,
        namaPemilikAsal: cItem.namaPemilik,
        persilId: firstPersil?.id || '',
        nomorPersil: firstPersil?.nomorPersil || '',
        kelasTanah: firstPersil?.kelasTanah || 'D.I',
        luasAwalM2: firstPersil?.luasM2 || 0,
        sisaLuasM2: firstPersil?.luasM2 || 0,
      });
    } else {
      setMutasiForm(initialMutasiForm);
    }
    setMutasiPenerimaSearch('');
    setIsMutasiFormOpen(true);
  };

  // Select persil in mutasi form to auto-fill initial area
  const handleSelectPersilInMutasi = (persilId: string) => {
    const sel = persilList.find((p) => p.id === persilId);
    if (sel) {
      const dimutasi = Number(mutasiForm.luasDimutasiM2) || 0;
      const sisa = Math.max(0, sel.luasM2 - dimutasi);
      setMutasiForm({
        ...mutasiForm,
        persilId: sel.id,
        nomorPersil: sel.nomorPersil,
        kelasTanah: sel.kelasTanah,
        luasAwalM2: sel.luasM2,
        sisaLuasM2: sisa,
      });
    }
  };

  // Change luas dimutasi
  const handleLuasDimutasiChange = (val: number) => {
    const sisa = Math.max(0, mutasiForm.luasAwalM2 - val);
    setMutasiForm({
      ...mutasiForm,
      luasDimutasiM2: val,
      sisaLuasM2: sisa,
    });
  };

  // Submit Mutasi Form
  const handleSubmitMutasi = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db) return;

    if (!mutasiForm.nomorCAsal) {
      toast({ title: 'Validasi Gagal', description: 'Pilih nomor C-Desa asal', variant: 'destructive' });
      return;
    }
    if (!mutasiForm.nomorPersil) {
      toast({ title: 'Validasi Gagal', description: 'Pilih nomor persil yang dimutasi', variant: 'destructive' });
      return;
    }
    if (mutasiForm.luasDimutasiM2 <= 0) {
      toast({ title: 'Validasi Gagal', description: 'Luas yang dimutasi harus lebih dari 0 m²', variant: 'destructive' });
      return;
    }
    if (!mutasiForm.namaPenerima.trim()) {
      toast({ title: 'Validasi Gagal', description: 'Nama pihak penerima hak wajib diisi', variant: 'destructive' });
      return;
    }

    setSubmitting(true);
    try {
      // 1. Simpan catatan mutasi
      await addDoc(collection(db, 'mutasi_cdesa'), {
        ...mutasiForm,
        luasDimutasiM2: Number(mutasiForm.luasDimutasiM2),
        sisaLuasM2: Number(mutasiForm.sisaLuasM2),
        createdAt: serverTimestamp(),
        createdBy: user?.email || 'admin',
      });

      // 2. Perbarui luas bidang persil asal
      if (mutasiForm.persilId) {
        await updateDoc(doc(db, 'data_persil', mutasiForm.persilId), {
          luasM2: mutasiForm.sisaLuasM2,
          keterangan: `Dimutasi ${mutasiForm.luasDimutasiM2} m² ke ${mutasiForm.namaPenerima} (${mutasiForm.sebabMutasi}) tgl ${mutasiForm.tanggalMutasi}. Sisa ${mutasiForm.sisaLuasM2} m².`,
          updatedAt: serverTimestamp(),
        });
      }

      // 3. Perbarui rekapitulasi C-Desa asal jika terdaftar
      const originC = cDesaList.find((c) => c.nomorC === mutasiForm.nomorCAsal);
      if (originC) {
        const isDarat = mutasiForm.kelasTanah.startsWith('D') || mutasiForm.kelasTanah.startsWith('T');
        const newDarat = isDarat
          ? Math.max(0, originC.totalLuasDaratM2 - mutasiForm.luasDimutasiM2)
          : originC.totalLuasDaratM2;
        const newSawah = !isDarat
          ? Math.max(0, originC.totalLuasSawahM2 - mutasiForm.luasDimutasiM2)
          : originC.totalLuasSawahM2;
        const newTotal = newDarat + newSawah;

        await updateDoc(doc(db, 'cdesa', originC.id), {
          totalLuasDaratM2: newDarat,
          totalLuasSawahM2: newSawah,
          totalLuasTotalM2: newTotal,
          status: newTotal === 0 ? 'mutasi_penuh' : 'aktif',
          updatedAt: serverTimestamp(),
        });
      }

      toast({
        title: 'Mutasi Berhasil Dicatatkan',
        description: `Peralihan hak atas tanah seluas ${mutasiForm.luasDimutasiM2} m² telah dibukukan`,
      });

      setIsMutasiFormOpen(false);
      fetchData();
    } catch (err: any) {
      console.error(err);
      toast({ title: 'Gagal Memproses Mutasi', description: err.message, variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  // Export C-Desa Excel
  const handleExportCDesaExcel = () => {
    if (cDesaList.length === 0) {
      toast({ title: 'Data Kosong', description: 'Tidak ada data C-Desa untuk diekspor' });
      return;
    }

    const rows = filteredCDesaList.map((c, idx) => ({
      No: idx + 1,
      'Nomor Kohir': `C. ${c.nomorC}`,
      'Nama Pemilik': c.namaPemilik,
      'NIK Pemilik': c.nik || '-',
      'Tipe Pemilik': c.jenisPemilik === 'penduduk' ? 'Warga Sampeldes' : 'Luar Desa / Waris',
      'Ahli Waris': c.namaWaris || '-',
      Alamat: c.alamat,
      'Luas Darat (m²)': c.totalLuasDaratM2,
      'Luas Sawah (m²)': c.totalLuasSawahM2,
      'Total Luas (m²)': c.totalLuasTotalM2,
      'Total Luas (Ha)': (c.totalLuasTotalM2 / 10000).toFixed(4),
      'Jumlah Persil': c.jumlahPersil,
      Status: c.status === 'aktif' ? 'Aktif' : 'Mutasi Penuh',
      Catatan: c.catatan || '-',
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Buku C Desa Sampeldes');
    XLSX.writeFile(wb, `Buku_C_Desa_Sampeldes_${new Date().toISOString().slice(0, 10)}.xlsx`);
    toast({ title: 'Ekspor Berhasil', description: 'File Excel Buku C-Desa telah diunduh' });
  };

  // Open Kutipan Cetak Preview
  const handleOpenPrintKutipan = (c: CDesa) => {
    const relatedPersil = persilList.filter((p) => p.nomorCDesa === c.nomorC);
    const relatedMutasi = mutasiList.filter((m) => m.nomorCAsal === c.nomorC);
    setPrintKutipanItem({ cdesa: c, persil: relatedPersil, mutasi: relatedMutasi });
  };

  // Filtered C-Desa
  const filteredCDesaList = useMemo(() => {
    return cDesaList.filter((item) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchC = item.nomorC?.toLowerCase().includes(q);
        const matchNama = item.namaPemilik?.toLowerCase().includes(q);
        const matchNik = item.nik?.toLowerCase().includes(q);
        const matchAlamat = item.alamat?.toLowerCase().includes(q);
        if (!matchC && !matchNama && !matchNik && !matchAlamat) return false;
      }

      if (filterStatus !== 'ALL' && item.status !== filterStatus) {
        return false;
      }

      return true;
    });
  }, [cDesaList, searchQuery, filterStatus]);

  // Overall Stats
  const stats = useMemo(() => {
    const totalKohir = cDesaList.length;
    const totalLuasTotal = cDesaList.reduce((acc, curr) => acc + (Number(curr.totalLuasTotalM2) || 0), 0);
    const totalDarat = cDesaList.reduce((acc, curr) => acc + (Number(curr.totalLuasDaratM2) || 0), 0);
    const totalSawah = cDesaList.reduce((acc, curr) => acc + (Number(curr.totalLuasSawahM2) || 0), 0);
    const totalMutasi = mutasiList.length;
    return {
      totalKohir,
      totalLuasTotal,
      totalDarat,
      totalSawah,
      totalMutasi,
      luasHa: (totalLuasTotal / 10000).toFixed(2),
    };
  }, [cDesaList, mutasiList]);

  return (
    <div className="space-y-6 pb-12">
      {/* Header section with Neumorphic polish */}
      <div className="neu-convex p-6 md:p-8 rounded-[28px] border border-white/60 dark:border-white/10 shadow-[10px_10px_24px_rgba(165,155,140,0.35),-10px_-10px_24px_rgba(255,255,255,0.95)]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 rounded-full text-xs font-condensed font-extrabold tracking-wider uppercase bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
                Buku Register Tanah Adat Desa
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-condensed font-extrabold tracking-wider uppercase bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                Letter C / Kohir
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-800 dark:text-slate-100 font-condensed tracking-tight">
              BUKU C-DESA & REGISTER MUTASI
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 max-w-2xl">
              Pengelolaan Buku Letter C (Kohir), pencatatan subjek wajib pajak, rincian bidang persil, riwayat mutasi jual beli, hibah, warisan, dan penerbitan Kutipan C-Desa.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              onClick={handleExportCDesaExcel}
              variant="outline"
              className="neu-convex bg-[#ECE8E1] hover:bg-[#e2ded6] dark:bg-[#0e1620] dark:hover:bg-[#162232] border-white/60 font-condensed font-bold text-xs uppercase tracking-wider gap-1.5 shadow-sm"
            >
              <Download className="h-4 w-4 text-emerald-600" />
              Ekspor Buku C
            </Button>
            <Button
              onClick={() => handleOpenMutasi()}
              variant="outline"
              className="neu-convex bg-[#ECE8E1] hover:bg-[#e2ded6] dark:bg-[#0e1620] dark:hover:bg-[#162232] border-white/60 font-condensed font-bold text-xs uppercase tracking-wider gap-1.5 text-orange-700 dark:text-orange-400"
            >
              <ArrowRightLeft className="h-4 w-4" />
              Catat Mutasi
            </Button>
            <Button
              onClick={handleOpenAddCDesa}
              className="bg-amber-600 hover:bg-amber-700 text-white font-condensed font-extrabold text-xs uppercase tracking-wider gap-1.5 shadow-md active:scale-95 transition-all"
            >
              <Plus className="h-4 w-4" />
              Tambah Nomor C
            </Button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-300/60 dark:border-white/10">
          <div className="neu-inset p-4 rounded-2xl bg-white/40 dark:bg-black/20">
            <div className="flex items-center justify-between text-xs font-condensed font-bold text-slate-500 uppercase tracking-wider">
              <span>Buku C (Kohir)</span>
              <BookOpen className="h-4 w-4 text-amber-600" />
            </div>
            <div className="mt-2 text-2xl font-black font-condensed text-slate-800 dark:text-slate-100">
              {stats.totalKohir} <span className="text-xs font-normal text-slate-500">Nomor</span>
            </div>
          </div>

          <div className="neu-inset p-4 rounded-2xl bg-white/40 dark:bg-black/20">
            <div className="flex items-center justify-between text-xs font-condensed font-bold text-slate-500 uppercase tracking-wider">
              <span>Total Luas Terdaftar</span>
              <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
            </div>
            <div className="mt-2 text-2xl font-black font-condensed text-emerald-700 dark:text-emerald-400">
              {stats.luasHa} <span className="text-xs font-normal text-slate-500">Ha ({stats.totalLuasTotal.toLocaleString('id-ID')} m²)</span>
            </div>
          </div>

          <div className="neu-inset p-4 rounded-2xl bg-white/40 dark:bg-black/20">
            <div className="flex items-center justify-between text-xs font-condensed font-bold text-slate-500 uppercase tracking-wider">
              <span>Luas Darat vs Sawah</span>
              <Layers className="h-4 w-4 text-sky-600" />
            </div>
            <div className="mt-2 text-xs font-mono font-bold text-slate-700 dark:text-slate-300">
              <div>Darat: {stats.totalDarat.toLocaleString('id-ID')} m²</div>
              <div>Sawah: {stats.totalSawah.toLocaleString('id-ID')} m²</div>
            </div>
          </div>

          <div className="neu-inset p-4 rounded-2xl bg-white/40 dark:bg-black/20">
            <div className="flex items-center justify-between text-xs font-condensed font-bold text-slate-500 uppercase tracking-wider">
              <span>Riwayat Mutasi</span>
              <History className="h-4 w-4 text-orange-600" />
            </div>
            <div className="mt-2 text-2xl font-black font-condensed text-orange-700 dark:text-orange-400">
              {stats.totalMutasi} <span className="text-xs font-normal text-slate-500">Peristiwa</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Tabs: Buku C-Desa vs Register Mutasi */}
      <Tabs value={activeTab} onValueChange={(v: any) => setActiveTab(v)} className="w-full">
        <div className="flex items-center justify-between mb-4">
          <TabsList className="bg-slate-200/70 dark:bg-black/40 p-1 rounded-2xl h-11">
            <TabsTrigger
              value="buku_c"
              className="text-xs font-condensed font-extrabold uppercase tracking-wider px-4 rounded-xl data-[state=active]:bg-amber-600 data-[state=active]:text-white"
            >
              1. Register Buku C-Desa ({filteredCDesaList.length})
            </TabsTrigger>
            <TabsTrigger
              value="mutasi"
              className="text-xs font-condensed font-extrabold uppercase tracking-wider px-4 rounded-xl data-[state=active]:bg-orange-600 data-[state=active]:text-white"
            >
              2. Buku Mutasi Tanah ({mutasiList.length})
            </TabsTrigger>
          </TabsList>
        </div>

        {/* TAB 1: REGISTER BUKU C-DESA */}
        <TabsContent value="buku_c" className="space-y-4">
          {/* Search bar */}
          <div className="neu-convex p-4 rounded-2xl border border-white/60 dark:border-white/10 flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Cari Nomor Kohir C (contoh: 152), Nama Pemilik, NIK, Alamat..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 neu-inset bg-white/50 dark:bg-black/20 border-white/50 text-sm font-medium rounded-xl h-10"
              />
            </div>

            <div className="flex items-center gap-2">
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-[140px] h-10 neu-inset bg-white/50 dark:bg-black/20 border-white/50 text-xs font-condensed font-bold uppercase rounded-xl">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Semua Status</SelectItem>
                  <SelectItem value="aktif">Masih Aktif</SelectItem>
                  <SelectItem value="mutasi_penuh">Mutasi Penuh / Habis</SelectItem>
                </SelectContent>
              </Select>

              {searchQuery && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSearchQuery('')}
                  className="text-xs font-condensed font-bold uppercase text-slate-500 h-10"
                >
                  Reset
                </Button>
              )}

              <Button
                variant="ghost"
                size="icon"
                onClick={fetchData}
                className="h-10 w-10 neu-inset rounded-xl text-slate-600 dark:text-slate-300"
                title="Refresh"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Table Buku C */}
          <div className="neu-convex rounded-[24px] overflow-hidden border border-white/60 dark:border-white/10 shadow-[8px_8px_20px_rgba(165,155,140,0.3),-8px_-8px_20px_rgba(255,255,255,0.9)]">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-slate-100/80 dark:bg-black/30 border-b border-slate-200 dark:border-white/10">
                  <TableRow>
                    <TableHead className="font-condensed font-extrabold text-xs text-slate-700 dark:text-slate-300 uppercase tracking-wider w-[120px]">
                      Nomor Kohir
                    </TableHead>
                    <TableHead className="font-condensed font-extrabold text-xs text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      Nama Wajib Pajak / Pemilik
                    </TableHead>
                    <TableHead className="font-condensed font-extrabold text-xs text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      Alamat / Domisili
                    </TableHead>
                    <TableHead className="font-condensed font-extrabold text-xs text-slate-700 dark:text-slate-300 uppercase tracking-wider text-right">
                      Luas Darat (m²)
                    </TableHead>
                    <TableHead className="font-condensed font-extrabold text-xs text-slate-700 dark:text-slate-300 uppercase tracking-wider text-right">
                      Luas Sawah (m²)
                    </TableHead>
                    <TableHead className="font-condensed font-extrabold text-xs text-slate-700 dark:text-slate-300 uppercase tracking-wider text-right">
                      Total Luas (m²)
                    </TableHead>
                    <TableHead className="font-condensed font-extrabold text-xs text-slate-700 dark:text-slate-300 uppercase tracking-wider text-center">
                      Status
                    </TableHead>
                    <TableHead className="font-condensed font-extrabold text-xs text-slate-700 dark:text-slate-300 uppercase tracking-wider text-center w-[160px]">
                      Aksi
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-12 text-slate-500 font-condensed">
                        <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-amber-600" />
                        Memuat Buku Register C-Desa...
                      </TableCell>
                    </TableRow>
                  ) : filteredCDesaList.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-12 text-slate-500">
                        <div className="max-w-xs mx-auto space-y-2">
                          <BookOpen className="h-10 w-10 text-slate-400 mx-auto" />
                          <p className="font-condensed font-bold text-slate-700 dark:text-slate-300">
                            Belum Ada Data Buku C-Desa
                          </p>
                          <p className="text-xs text-slate-500">
                            Tambahkan nomor Kohir C-Desa baru untuk mendata kepemilikan tanah adat warga.
                          </p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredCDesaList.map((item) => {
                      const relatedPersilCount = persilList.filter((p) => p.nomorCDesa === item.nomorC).length;
                      return (
                        <TableRow
                          key={item.id}
                          className="border-b border-slate-200/60 dark:border-white/5 hover:bg-white/40 dark:hover:bg-white/5 transition-colors"
                        >
                          <TableCell className="font-mono font-extrabold text-amber-700 dark:text-amber-400 text-sm">
                            C. {item.nomorC}
                          </TableCell>

                          <TableCell>
                            <div className="space-y-0.5">
                              <div className="font-bold text-sm text-slate-800 dark:text-slate-200">
                                {item.namaPemilik}
                              </div>
                              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                                {item.nik && <span className="font-mono">{item.nik}</span>}
                                {item.namaWaris && (
                                  <span className="italic text-slate-400">
                                    (Waris: {item.namaWaris})
                                  </span>
                                )}
                              </div>
                            </div>
                          </TableCell>

                          <TableCell className="text-xs text-slate-600 dark:text-slate-400 max-w-[200px] truncate">
                            {item.alamat || '-'}
                          </TableCell>

                          <TableCell className="text-right font-mono text-xs text-slate-700 dark:text-slate-300">
                            {Number(item.totalLuasDaratM2 || 0).toLocaleString('id-ID')} m²
                          </TableCell>

                          <TableCell className="text-right font-mono text-xs text-slate-700 dark:text-slate-300">
                            {Number(item.totalLuasSawahM2 || 0).toLocaleString('id-ID')} m²
                          </TableCell>

                          <TableCell className="text-right font-mono font-bold text-xs text-emerald-700 dark:text-emerald-400">
                            <div>{Number(item.totalLuasTotalM2 || 0).toLocaleString('id-ID')} m²</div>
                            <div className="text-[10px] text-slate-400 font-normal">
                              {(Number(item.totalLuasTotalM2 || 0) / 10000).toFixed(4)} Ha
                            </div>
                          </TableCell>

                          <TableCell className="text-center">
                            <Badge
                              className={`text-[10px] font-condensed uppercase tracking-wider ${
                                item.status === 'aktif'
                                  ? 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-900/40 dark:text-emerald-300'
                                  : 'bg-slate-200 text-slate-700 border-slate-300'
                              }`}
                            >
                              {item.status === 'aktif' ? 'Aktif' : 'Mutasi Habis'}
                            </Badge>
                          </TableCell>

                          <TableCell>
                            <div className="flex items-center justify-center gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setDetailCDesa(item)}
                                className="h-8 w-8 text-sky-600 hover:text-sky-700 hover:bg-sky-50 dark:hover:bg-sky-950"
                                title="Buka Detail Buku C & Daftar Persil"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleOpenPrintKutipan(item)}
                                className="h-8 w-8 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950"
                                title="Cetak Kutipan Buku C"
                              >
                                <Printer className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleOpenMutasi(item)}
                                className="h-8 w-8 text-orange-600 hover:text-orange-700 hover:bg-orange-50 dark:hover:bg-orange-950"
                                title="Catat Mutasi Tanah untuk Kohir ini"
                              >
                                <ArrowRightLeft className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleOpenEditCDesa(item)}
                                className="h-8 w-8 text-amber-600 hover:text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-950"
                                title="Edit Buku C"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setDeleteCDesa(item)}
                                className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                                title="Hapus Kohir"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </TabsContent>

        {/* TAB 2: REGISTER MUTASI TANAH */}
        <TabsContent value="mutasi" className="space-y-4">
          <div className="neu-convex p-4 rounded-2xl border border-white/60 dark:border-white/10 flex items-center justify-between">
            <div>
              <h3 className="font-condensed font-extrabold text-base text-slate-800 dark:text-slate-100 uppercase">
                Buku Catatan Mutasi Peralihan Hak Tanah
              </h3>
              <p className="text-xs text-slate-500">
                Pencatatan resmi peristiwa jual beli, hibah, pembagian warisan, atau peralihan kepemilikan tanah adat.
              </p>
            </div>

            <Button
              onClick={() => handleOpenMutasi()}
              className="bg-orange-600 hover:bg-orange-700 text-white font-condensed font-extrabold text-xs uppercase tracking-wider gap-1.5 shadow-md"
            >
              <Plus className="h-4 w-4" />
              Catat Mutasi Baru
            </Button>
          </div>

          <div className="neu-convex rounded-[24px] overflow-hidden border border-white/60 dark:border-white/10 shadow-[8px_8px_20px_rgba(165,155,140,0.3),-8px_-8px_20px_rgba(255,255,255,0.9)]">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-slate-100/80 dark:bg-black/30 border-b border-slate-200 dark:border-white/10">
                  <TableRow>
                    <TableHead className="font-condensed font-extrabold text-xs text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      Tanggal
                    </TableHead>
                    <TableHead className="font-condensed font-extrabold text-xs text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      Peralihan Hak (Asal &rarr; Penerima)
                    </TableHead>
                    <TableHead className="font-condensed font-extrabold text-xs text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      Persil & Kelas
                    </TableHead>
                    <TableHead className="font-condensed font-extrabold text-xs text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      Sebab Perubahan
                    </TableHead>
                    <TableHead className="font-condensed font-extrabold text-xs text-slate-700 dark:text-slate-300 uppercase tracking-wider text-right">
                      Luas Mutasi (m²)
                    </TableHead>
                    <TableHead className="font-condensed font-extrabold text-xs text-slate-700 dark:text-slate-300 uppercase tracking-wider text-right">
                      Sisa Luas (m²)
                    </TableHead>
                    <TableHead className="font-condensed font-extrabold text-xs text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      Dasar Akta / Legalitas
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mutasiList.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-12 text-slate-500 font-condensed">
                        Belum ada riwayat mutasi tanah yang dicatat di sistem.
                      </TableCell>
                    </TableRow>
                  ) : (
                    mutasiList.map((m) => (
                      <TableRow
                        key={m.id}
                        className="border-b border-slate-200/60 dark:border-white/5 hover:bg-white/40 dark:hover:bg-white/5"
                      >
                        <TableCell className="font-mono text-xs text-slate-600 dark:text-slate-400 whitespace-nowrap">
                          {m.tanggalMutasi}
                        </TableCell>

                        <TableCell>
                          <div className="text-xs space-y-0.5">
                            <div className="text-slate-700 dark:text-slate-300">
                              <span className="font-mono font-bold text-amber-700">C.{m.nomorCAsal}</span>{' '}
                              ({m.namaPemilikAsal})
                            </div>
                            <div className="text-emerald-700 dark:text-emerald-400 font-bold">
                              &rarr; {m.namaPenerima}{' '}
                              {m.cDesaTujuanNomor && (
                                <span className="font-mono text-xs">(C.{m.cDesaTujuanNomor})</span>
                              )}
                            </div>
                          </div>
                        </TableCell>

                        <TableCell>
                          <Badge variant="outline" className="font-mono text-xs">
                            Persil {m.nomorPersil} (Kelas {m.kelasTanah})
                          </Badge>
                        </TableCell>

                        <TableCell>
                          <Badge
                            className={`text-[10px] font-condensed uppercase tracking-wider ${
                              m.sebabMutasi === 'jual_beli'
                                ? 'bg-blue-100 text-blue-800 border-blue-300'
                                : m.sebabMutasi === 'waris'
                                ? 'bg-amber-100 text-amber-800 border-amber-300'
                                : m.sebabMutasi === 'hibah'
                                ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                                : 'bg-purple-100 text-purple-800'
                            }`}
                          >
                            {m.sebabMutasi.replace('_', ' ')}
                          </Badge>
                        </TableCell>

                        <TableCell className="text-right font-mono font-bold text-xs text-red-600 dark:text-red-400">
                          - {Number(m.luasDimutasiM2).toLocaleString('id-ID')} m²
                        </TableCell>

                        <TableCell className="text-right font-mono font-bold text-xs text-slate-700 dark:text-slate-300">
                          {Number(m.sisaLuasM2).toLocaleString('id-ID')} m²
                        </TableCell>

                        <TableCell>
                          <div className="text-xs text-slate-600 dark:text-slate-400">
                            <div className="font-semibold">{m.nomorAkta || '-'}</div>
                            <div className="text-[10px] text-slate-500">{m.pejabatPembuatAkta}</div>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* DIALOG FORM: Tambah / Edit C-Desa */}
      <Dialog open={isCDesaFormOpen} onOpenChange={setIsCDesaFormOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-black font-condensed tracking-tight">
              {editingCDesa ? 'EDIT BUKU C-DESA (KOHIR)' : 'CATAT NOMOR KOHIR C-DESA BARU'}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Pencatatan data induk kepemilikan tanah adat di Buku Register C-Desa Sampeldes.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmitCDesa} className="space-y-4 pt-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold">Nomor Kohir C-Desa *</Label>
                <Input
                  placeholder="Contoh: 001, 152, 280"
                  value={cDesaForm.nomorC}
                  onChange={(e) => setCDesaForm({ ...cDesaForm, nomorC: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold">Status Subjek Pemilik</Label>
                <Select
                  value={cDesaForm.jenisPemilik}
                  onValueChange={(val: any) => setCDesaForm({ ...cDesaForm, jenisPemilik: val })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="penduduk">Warga Penduduk Desa Sampeldes</SelectItem>
                    <SelectItem value="luar_desa">Warga Luar Desa</SelectItem>
                    <SelectItem value="alm_waris">Atas Nama Almarhum (Ahli Waris)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {cDesaForm.jenisPemilik === 'penduduk' && (
              <div className="p-3 bg-teal-50 dark:bg-teal-950/30 rounded-xl border border-teal-200 dark:border-teal-800 space-y-2">
                <Label className="text-xs font-bold text-teal-800 dark:text-teal-300">
                  Cari dari Database Kependudukan Desa Sampeldes:
                </Label>
                <Input
                  placeholder="Ketik NIK atau Nama warga..."
                  value={residentSearch}
                  onChange={(e) => setResidentSearch(e.target.value)}
                  className="bg-white dark:bg-black/40"
                />
                {residentSuggestions.length > 0 && (
                  <div className="bg-white dark:bg-slate-900 border rounded-lg shadow-lg overflow-hidden divide-y text-xs">
                    {residentSuggestions.map((r, i) => (
                      <div
                        key={i}
                        onClick={() => {
                          setCDesaForm({
                            ...cDesaForm,
                            nik: r.nik || '',
                            namaPemilik: r.name || '',
                            alamat: r.address || `${r.dusun || ''} RT ${r.rt || ''}/RW ${r.rw || ''}`,
                          });
                          setResidentSearch(r.name || '');
                          setResidentSuggestions([]);
                        }}
                        className="p-2 hover:bg-teal-50 dark:hover:bg-teal-950 cursor-pointer flex justify-between"
                      >
                        <div>
                          <div className="font-bold">{r.name}</div>
                          <div className="text-slate-500 font-mono text-[11px]">{r.nik}</div>
                        </div>
                        <span className="text-teal-600 font-bold uppercase text-[10px]">Pilih</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold">Nama Pemilik Terdaftar di Buku C *</Label>
                <Input
                  placeholder="Nama pemilik sah / wajib pajak"
                  value={cDesaForm.namaPemilik}
                  onChange={(e) => setCDesaForm({ ...cDesaForm, namaPemilik: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold">NIK Pemilik (Jika ada)</Label>
                <Input
                  placeholder="16 digit NIK"
                  value={cDesaForm.nik}
                  onChange={(e) => setCDesaForm({ ...cDesaForm, nik: e.target.value })}
                />
              </div>
            </div>

            {cDesaForm.jenisPemilik === 'alm_waris' && (
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-amber-700">Nama Ahli Waris Pengurus</Label>
                <Input
                  placeholder="Nama ahli waris yang mengurus saat ini"
                  value={cDesaForm.namaWaris}
                  onChange={(e) => setCDesaForm({ ...cDesaForm, namaWaris: e.target.value })}
                />
              </div>
            )}

            <div className="space-y-1.5">
              <Label className="text-xs font-bold">Alamat Tempat Tinggal</Label>
              <Input
                placeholder="Alamat domisili pemilik"
                value={cDesaForm.alamat}
                onChange={(e) => setCDesaForm({ ...cDesaForm, alamat: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold">Total Luas Tanah Darat (m²)</Label>
                <Input
                  type="number"
                  min={0}
                  value={cDesaForm.totalLuasDaratM2 || 0}
                  onChange={(e) => setCDesaForm({ ...cDesaForm, totalLuasDaratM2: Number(e.target.value) })}
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold">Total Luas Tanah Sawah (m²)</Label>
                <Input
                  type="number"
                  min={0}
                  value={cDesaForm.totalLuasSawahM2 || 0}
                  onChange={(e) => setCDesaForm({ ...cDesaForm, totalLuasSawahM2: Number(e.target.value) })}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold">Catatan / Keterangan Khusus</Label>
              <Textarea
                placeholder="Keterangan tambahan warkah tanah..."
                value={cDesaForm.catatan}
                onChange={(e) => setCDesaForm({ ...cDesaForm, catatan: e.target.value })}
                rows={2}
              />
            </div>

            <DialogFooter className="pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => setIsCDesaFormOpen(false)}>
                Batal
              </Button>
              <Button type="submit" disabled={submitting} className="bg-amber-600 hover:bg-amber-700 text-white font-condensed font-bold uppercase">
                {submitting ? 'Menyimpan...' : 'Simpan Buku C'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* DIALOG FORM: Catat Mutasi Tanah */}
      <Dialog open={isMutasiFormOpen} onOpenChange={setIsMutasiFormOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-black font-condensed tracking-tight">
              PENCATATAN MUTASI PERALIHAN HAK TANAH
            </DialogTitle>
            <DialogDescription className="text-xs">
              Catat peralihan hak atas tanah adat (Jual Beli, Hibah, Waris, Pemecahan) untuk memperbarui Buku C-Desa.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmitMutasi} className="space-y-4 pt-2">
            <div className="p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-xl space-y-2">
              <h4 className="font-condensed font-extrabold uppercase text-xs text-amber-800 dark:text-amber-300">
                1. Identifikasi Tanah & C-Desa Asal (Pihak Pertama)
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold">Nomor C-Desa Asal *</Label>
                  <Select
                    value={mutasiForm.nomorCAsal}
                    onValueChange={(val) => {
                      const selC = cDesaList.find((c) => c.nomorC === val);
                      const relatedP = persilList.filter((p) => p.nomorCDesa === val);
                      const firstP = relatedP[0];
                      setMutasiForm({
                        ...mutasiForm,
                        nomorCAsal: val,
                        namaPemilikAsal: selC?.namaPemilik || '',
                        persilId: firstP?.id || '',
                        nomorPersil: firstP?.nomorPersil || '',
                        kelasTanah: firstP?.kelasTanah || 'D.I',
                        luasAwalM2: firstP?.luasM2 || 0,
                        sisaLuasM2: firstP?.luasM2 || 0,
                      });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih Nomor Kohir C" />
                    </SelectTrigger>
                    <SelectContent>
                      {cDesaList.map((c) => (
                        <SelectItem key={c.id} value={c.nomorC}>
                          C. {c.nomorC} - {c.namaPemilik}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold">Pemilik Terdaftar di Buku C</Label>
                  <Input value={mutasiForm.namaPemilikAsal} readOnly className="bg-slate-100 dark:bg-black/40 font-bold" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold">Bidang Persil Terkait *</Label>
                  <Select
                    value={mutasiForm.persilId}
                    onValueChange={handleSelectPersilInMutasi}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih Persil" />
                    </SelectTrigger>
                    <SelectContent>
                      {persilList
                        .filter((p) => !mutasiForm.nomorCAsal || p.nomorCDesa === mutasiForm.nomorCAsal)
                        .map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            Persil {p.nomorPersil} (Kelas {p.kelasTanah} - {p.luasM2} m²)
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold">Luas Awal Bidang (m²)</Label>
                  <Input value={mutasiForm.luasAwalM2} readOnly className="bg-slate-100 dark:bg-black/40 font-mono" />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold">Kelas Tanah</Label>
                  <Input value={mutasiForm.kelasTanah} readOnly className="bg-slate-100 dark:bg-black/40 font-mono" />
                </div>
              </div>
            </div>

            {/* Mutasi details */}
            <div className="p-3 bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 rounded-xl space-y-2">
              <h4 className="font-condensed font-extrabold uppercase text-xs text-orange-800 dark:text-orange-300">
                2. Perhitungan Luas Peralihan & Sebab Mutasi
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold">Sebab Perubahan Hak *</Label>
                  <Select
                    value={mutasiForm.sebabMutasi}
                    onValueChange={(val: SebabMutasi) => setMutasiForm({ ...mutasiForm, sebabMutasi: val })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="jual_beli">Jual Beli</SelectItem>
                      <SelectItem value="waris">Pembagian Waris</SelectItem>
                      <SelectItem value="hibah">Hibah</SelectItem>
                      <SelectItem value="tukar_menukar">Tukar Menukar</SelectItem>
                      <SelectItem value="pemecahan">Pemecahan / Pemisahan Bidang</SelectItem>
                      <SelectItem value="wakaf">Wakaf</SelectItem>
                      <SelectItem value="lelang">Lelang</SelectItem>
                      <SelectItem value="penetapan_pengadilan">Penetapan Pengadilan</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold">Luas yang Dialihkan (m²) *</Label>
                  <Input
                    type="number"
                    min={1}
                    max={mutasiForm.luasAwalM2 || undefined}
                    placeholder="Luas mutasi..."
                    value={mutasiForm.luasDimutasiM2 || ''}
                    onChange={(e) => handleLuasDimutasiChange(Number(e.target.value))}
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold">Sisa Luas Pemilik Asal (m²)</Label>
                  <Input
                    value={mutasiForm.sisaLuasM2}
                    readOnly
                    className="bg-slate-100 dark:bg-black/40 font-mono font-bold text-emerald-700"
                  />
                </div>
              </div>
            </div>

            {/* Pihak Penerima */}
            <div className="p-3 bg-teal-50 dark:bg-teal-950/20 border border-teal-200 dark:border-teal-800 rounded-xl space-y-2">
              <h4 className="font-condensed font-extrabold uppercase text-xs text-teal-800 dark:text-teal-300">
                3. Pihak Penerima Hak (Pihak Kedua / Pemilik Baru)
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold">Kategori Penerima</Label>
                  <Select
                    value={mutasiForm.jenisPenerima}
                    onValueChange={(val: any) => setMutasiForm({ ...mutasiForm, jenisPenerima: val })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="penduduk">Warga Penduduk Desa Sampeldes</SelectItem>
                      <SelectItem value="luar_desa">Warga Luar Desa / Pembeli Luar</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold">Nomor C-Desa Baru / Tujuan (Jika Ada)</Label>
                  <Input
                    placeholder="Nomor C tujuan (Opsional)"
                    value={mutasiForm.cDesaTujuanNomor}
                    onChange={(e) => setMutasiForm({ ...mutasiForm, cDesaTujuanNomor: e.target.value })}
                  />
                </div>
              </div>

              {mutasiForm.jenisPenerima === 'penduduk' && (
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-teal-800">Cari Penerima dari Data Penduduk:</Label>
                  <Input
                    placeholder="Ketik NIK atau nama warga penerima..."
                    value={mutasiPenerimaSearch}
                    onChange={(e) => setMutasiPenerimaSearch(e.target.value)}
                    className="bg-white dark:bg-black/40"
                  />
                  {mutasiPenerimaSuggestions.length > 0 && (
                    <div className="bg-white dark:bg-slate-900 border rounded-lg shadow-lg overflow-hidden divide-y text-xs">
                      {mutasiPenerimaSuggestions.map((r, i) => (
                        <div
                          key={i}
                          onClick={() => {
                            setMutasiForm({
                              ...mutasiForm,
                              nikPenerima: r.nik || '',
                              namaPenerima: r.name || '',
                              alamatPenerima: r.address || `${r.dusun || ''} RT ${r.rt || ''}/RW ${r.rw || ''}`,
                            });
                            setMutasiPenerimaSearch(r.name || '');
                            setMutasiPenerimaSuggestions([]);
                          }}
                          className="p-2 hover:bg-teal-50 dark:hover:bg-teal-950 cursor-pointer flex justify-between"
                        >
                          <div>
                            <div className="font-bold">{r.name}</div>
                            <div className="text-slate-500 font-mono text-[11px]">{r.nik}</div>
                          </div>
                          <span className="text-teal-600 font-bold uppercase text-[10px]">Pilih</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold">Nama Lengkap Penerima *</Label>
                  <Input
                    placeholder="Nama pembeli / penerima hibah/waris"
                    value={mutasiForm.namaPenerima}
                    onChange={(e) => setMutasiForm({ ...mutasiForm, namaPenerima: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold">NIK Penerima</Label>
                  <Input
                    placeholder="16 digit NIK"
                    value={mutasiForm.nikPenerima}
                    onChange={(e) => setMutasiForm({ ...mutasiForm, nikPenerima: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold">Alamat Penerima</Label>
                <Input
                  placeholder="Alamat domisili penerima"
                  value={mutasiForm.alamatPenerima}
                  onChange={(e) => setMutasiForm({ ...mutasiForm, alamatPenerima: e.target.value })}
                />
              </div>
            </div>

            {/* Legalitas Dasar Surat */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold">Nomor Akta / Surat Dasar *</Label>
                <Input
                  placeholder="Nomor AJB / Surat Waris"
                  value={mutasiForm.nomorAkta}
                  onChange={(e) => setMutasiForm({ ...mutasiForm, nomorAkta: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold">Tanggal Akta *</Label>
                <Input
                  type="date"
                  value={mutasiForm.tanggalAkta}
                  onChange={(e) => setMutasiForm({ ...mutasiForm, tanggalAkta: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold">Pejabat Pembuat Akta</Label>
                <Input
                  placeholder="PPATS / Camat / Notaris"
                  value={mutasiForm.pejabatPembuatAkta}
                  onChange={(e) => setMutasiForm({ ...mutasiForm, pejabatPembuatAkta: e.target.value })}
                />
              </div>
            </div>

            <DialogFooter className="pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => setIsMutasiFormOpen(false)}>
                Batal
              </Button>
              <Button type="submit" disabled={submitting} className="bg-orange-600 hover:bg-orange-700 text-white font-condensed font-bold uppercase">
                {submitting ? 'Memproses...' : 'Bukukan Mutasi Tanah'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* MODAL DETAIL BUKU C */}
      <Dialog open={!!detailCDesa} onOpenChange={(open) => !open && setDetailCDesa(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          {detailCDesa && (
            <div>
              <DialogHeader>
                <div className="flex items-center justify-between">
                  <Badge className="bg-amber-600 text-white font-mono text-xs">
                    KOHIR NO. {detailCDesa.nomorC}
                  </Badge>
                  <Badge variant="outline" className="font-condensed uppercase font-bold text-xs">
                    {detailCDesa.status === 'aktif' ? 'Status: Aktif' : 'Status: Mutasi Habis'}
                  </Badge>
                </div>
                <DialogTitle className="text-xl font-black font-condensed tracking-tight mt-2">
                  RINCIAN BUKU LETTER C DESA - KOHIR NO. {detailCDesa.nomorC}
                </DialogTitle>
                <DialogDescription className="text-xs">
                  Atas Nama: <strong className="text-slate-800 dark:text-slate-200">{detailCDesa.namaPemilik}</strong>{' '}
                  ({detailCDesa.alamat || 'Desa Sampeldes'})
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 pt-4 text-xs">
                {/* Rangkuman */}
                <div className="grid grid-cols-3 gap-2 p-3 bg-slate-100 dark:bg-black/30 rounded-xl">
                  <div>
                    <span className="text-slate-500">Tanah Darat:</span>
                    <div className="font-bold font-mono text-sm">
                      {Number(detailCDesa.totalLuasDaratM2 || 0).toLocaleString('id-ID')} m²
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-500">Tanah Sawah:</span>
                    <div className="font-bold font-mono text-sm">
                      {Number(detailCDesa.totalLuasSawahM2 || 0).toLocaleString('id-ID')} m²
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-500">Total Luas:</span>
                    <div className="font-bold font-mono text-emerald-700 text-sm">
                      {Number(detailCDesa.totalLuasTotalM2 || 0).toLocaleString('id-ID')} m²
                    </div>
                  </div>
                </div>

                {/* Daftar Persil di bawah Kohir ini */}
                <div>
                  <h4 className="font-condensed font-extrabold uppercase text-slate-800 dark:text-slate-200 mb-2">
                    Daftar Bidang Persil Terdaftar
                  </h4>
                  {persilList.filter((p) => p.nomorCDesa === detailCDesa.nomorC).length === 0 ? (
                    <div className="p-4 rounded-lg border text-center text-slate-400">
                      Belum ada bidang persil yang terhubung dengan nomor C ini.
                    </div>
                  ) : (
                    <div className="border rounded-xl overflow-hidden">
                      <Table>
                        <TableHeader className="bg-slate-50 dark:bg-black/20">
                          <TableRow>
                            <TableHead className="text-xs font-bold">No. Persil</TableHead>
                            <TableHead className="text-xs font-bold">Kelas</TableHead>
                            <TableHead className="text-xs font-bold text-right">Luas (m²)</TableHead>
                            <TableHead className="text-xs font-bold">Lokasi</TableHead>
                            <TableHead className="text-xs font-bold text-center">Aksi</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {persilList
                            .filter((p) => p.nomorCDesa === detailCDesa.nomorC)
                            .map((p) => (
                              <TableRow key={p.id}>
                                <TableCell className="font-bold">Persil {p.nomorPersil}</TableCell>
                                <TableCell>
                                  <Badge variant="outline">{p.kelasTanah}</Badge>
                                </TableCell>
                                <TableCell className="text-right font-mono font-bold">
                                  {p.luasM2} m²
                                </TableCell>
                                <TableCell>
                                  {p.dusun} RT {p.rt}/RW {p.rw}
                                </TableCell>
                                <TableCell className="text-center">
                                  <Link href={`/manajemen/pertanahan/persil?search=${p.nomorPersil}`}>
                                    <Button variant="ghost" size="sm" className="h-7 text-xs gap-1">
                                      <Eye className="h-3 w-3" />
                                      Buka
                                    </Button>
                                  </Link>
                                </TableCell>
                              </TableRow>
                            ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </div>

                {/* Riwayat Mutasi Kohir Ini */}
                <div>
                  <h4 className="font-condensed font-extrabold uppercase text-slate-800 dark:text-slate-200 mb-2">
                    Riwayat Mutasi / Peralihan Hak Kohir No. {detailCDesa.nomorC}
                  </h4>
                  {mutasiList.filter((m) => m.nomorCAsal === detailCDesa.nomorC).length === 0 ? (
                    <div className="p-4 rounded-lg border text-center text-slate-400">
                      Belum ada transaksi mutasi untuk nomor C ini.
                    </div>
                  ) : (
                    <div className="border rounded-xl overflow-hidden">
                      <Table>
                        <TableHeader className="bg-slate-50 dark:bg-black/20">
                          <TableRow>
                            <TableHead className="text-xs font-bold">Tanggal</TableHead>
                            <TableHead className="text-xs font-bold">Penerima</TableHead>
                            <TableHead className="text-xs font-bold">Persil</TableHead>
                            <TableHead className="text-xs font-bold text-right">Luas Dimutasi</TableHead>
                            <TableHead className="text-xs font-bold">Dasar Akta</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {mutasiList
                            .filter((m) => m.nomorCAsal === detailCDesa.nomorC)
                            .map((m) => (
                              <TableRow key={m.id}>
                                <TableCell className="font-mono">{m.tanggalMutasi}</TableCell>
                                <TableCell className="font-bold text-emerald-700">{m.namaPenerima}</TableCell>
                                <TableCell>Persil {m.nomorPersil}</TableCell>
                                <TableCell className="text-right font-mono font-bold text-red-600">
                                  - {m.luasDimutasiM2} m²
                                </TableCell>
                                <TableCell>{m.nomorAkta}</TableCell>
                              </TableRow>
                            ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </div>
              </div>

              <DialogFooter className="pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => handleOpenPrintKutipan(detailCDesa)}
                  className="gap-1.5 text-xs font-condensed font-bold uppercase text-emerald-700"
                >
                  <Printer className="h-4 w-4" />
                  Cetak Kutipan Letter C
                </Button>
                <Button size="sm" onClick={() => setDetailCDesa(null)}>
                  Tutup
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* DIALOG CETAK KUTIPAN RESMI LETTER C */}
      <Dialog open={!!printKutipanItem} onOpenChange={(open) => !open && setPrintKutipanItem(null)}>
        <DialogContent className="max-w-4xl max-h-[92vh] overflow-y-auto">
          {printKutipanItem && (
            <div>
              <div className="flex items-center justify-between pb-3 border-b print:hidden">
                <DialogTitle className="text-base font-bold">
                  Preview Dokumen Resmi: Kutipan Buku C-Desa
                </DialogTitle>
                <Button
                  size="sm"
                  onClick={() => window.print()}
                  className="gap-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-condensed font-bold uppercase text-xs"
                >
                  <Printer className="h-4 w-4" />
                  Cetak Lembar Dokumen
                </Button>
              </div>

              {/* Printable Template */}
              <div className="p-6 md:p-8 bg-white text-slate-900 font-serif space-y-6 text-xs leading-relaxed">
                {/* Kop Surat Desa Sampeldes */}
                <div className="text-center border-b-2 border-black pb-3 space-y-0.5">
                  <h3 className="text-sm font-bold tracking-widest uppercase">
                    PEMERINTAH KABUPATEN PASURUAN
                  </h3>
                  <h3 className="text-sm font-bold tracking-widest uppercase">
                    KECAMATAN GEMPOL
                  </h3>
                  <h2 className="text-lg font-black tracking-wider uppercase">
                    KANTOR KEPALA DESA SAMPELDES
                  </h2>
                  <p className="text-[11px] font-sans text-slate-600">
                    Jl. Raya Sampeldes No. 01, Kecamatan Gandrungmangu, Kabupaten Cilacap, Jawa Tengah 53254
                  </p>
                </div>

                {/* Judul Dokumen */}
                <div className="text-center space-y-1">
                  <h3 className="text-base font-bold tracking-wider uppercase underline font-sans">
                    KUTIPAN BUKU LETTER C DESA
                  </h3>
                  <p className="font-mono text-xs">Nomor Register Kohir: C. {printKutipanItem.cdesa.nomorC}</p>
                </div>

                {/* Keterangan */}
                <p className="text-justify font-sans">
                  Yang bertanda tangan di bawah ini Kepala Desa Sampeldes, Kecamatan Gandrungmangu, Kabupaten Cilacap, menerangkan dengan sebenarnya berdasarkan catatan dalam <strong>Buku Register Letter C Desa Sampeldes</strong>:
                </p>

                {/* Data Wajib Pajak */}
                <div className="p-3 bg-slate-50 border border-slate-300 rounded font-sans space-y-1">
                  <div className="grid grid-cols-4">
                    <span className="font-semibold">Nama Pemilik Terdaftar</span>
                    <span className="col-span-3 font-bold">: {printKutipanItem.cdesa.namaPemilik}</span>
                  </div>
                  {printKutipanItem.cdesa.nik && (
                    <div className="grid grid-cols-4">
                      <span className="font-semibold">NIK</span>
                      <span className="col-span-3 font-mono">: {printKutipanItem.cdesa.nik}</span>
                    </div>
                  )}
                  <div className="grid grid-cols-4">
                    <span className="font-semibold">Alamat / Tempat Tinggal</span>
                    <span className="col-span-3">: {printKutipanItem.cdesa.alamat || 'Desa Sampeldes'}</span>
                  </div>
                  {printKutipanItem.cdesa.namaWaris && (
                    <div className="grid grid-cols-4">
                      <span className="font-semibold">Nama Ahli Waris</span>
                      <span className="col-span-3">: {printKutipanItem.cdesa.namaWaris}</span>
                    </div>
                  )}
                </div>

                {/* Tabel Rincian Persil Tanah */}
                <div className="space-y-1 font-sans">
                  <p className="font-bold text-xs uppercase">A. Rincian Objek Bidang Tanah (Persil):</p>
                  <table className="w-full border-collapse border border-slate-400 text-[11px]">
                    <thead>
                      <tr className="bg-slate-100">
                        <th className="border border-slate-400 p-1.5 text-center">No</th>
                        <th className="border border-slate-400 p-1.5 text-center">No. Persil</th>
                        <th className="border border-slate-400 p-1.5 text-center">Kelas</th>
                        <th className="border border-slate-400 p-1.5 text-right">Luas (m²)</th>
                        <th className="border border-slate-400 p-1.5 text-left">Letak / Blok</th>
                        <th className="border border-slate-400 p-1.5 text-left">Batas-Batas Sempadan</th>
                      </tr>
                    </thead>
                    <tbody>
                      {printKutipanItem.persil.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="p-2 text-center text-slate-500 italic">
                            Tidak ada persil tercatat langsung. Total luas tercatat: {printKutipanItem.cdesa.totalLuasTotalM2} m².
                          </td>
                        </tr>
                      ) : (
                        printKutipanItem.persil.map((p, i) => (
                          <tr key={p.id}>
                            <td className="border border-slate-400 p-1.5 text-center">{i + 1}</td>
                            <td className="border border-slate-400 p-1.5 text-center font-bold">Persil {p.nomorPersil}</td>
                            <td className="border border-slate-400 p-1.5 text-center font-bold">{p.kelasTanah}</td>
                            <td className="border border-slate-400 p-1.5 text-right font-mono font-bold">{p.luasM2} m²</td>
                            <td className="border border-slate-400 p-1.5">{p.dusun} RT {p.rt}/RW {p.rw}</td>
                            <td className="border border-slate-400 p-1.5 text-[10px]">
                              U: {p.batasUtara || '-'} | T: {p.batasTimur || '-'} | S: {p.batasSelatan || '-'} | B: {p.batasBarat || '-'}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Tabel Riwayat Mutasi */}
                <div className="space-y-1 font-sans">
                  <p className="font-bold text-xs uppercase">B. Catatan Mutasi / Peralihan Hak:</p>
                  <table className="w-full border-collapse border border-slate-400 text-[11px]">
                    <thead>
                      <tr className="bg-slate-100">
                        <th className="border border-slate-400 p-1.5 text-center">Tgl Mutasi</th>
                        <th className="border border-slate-400 p-1.5 text-left">Sebab Perubahan</th>
                        <th className="border border-slate-400 p-1.5 text-left">Dialihkan Kepada</th>
                        <th className="border border-slate-400 p-1.5 text-right">Luas Dimutasi</th>
                        <th className="border border-slate-400 p-1.5 text-left">Dasar Bukti / Akta</th>
                      </tr>
                    </thead>
                    <tbody>
                      {printKutipanItem.mutasi.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="p-2 text-center text-slate-500 italic">
                            Belum pernah terjadi mutasi hak atas tanah pada nomor C ini.
                          </td>
                        </tr>
                      ) : (
                        printKutipanItem.mutasi.map((m) => (
                          <tr key={m.id}>
                            <td className="border border-slate-400 p-1.5 text-center font-mono">{m.tanggalMutasi}</td>
                            <td className="border border-slate-400 p-1.5 uppercase font-semibold">{m.sebabMutasi.replace('_', ' ')}</td>
                            <td className="border border-slate-400 p-1.5 font-bold">{m.namaPenerima}</td>
                            <td className="border border-slate-400 p-1.5 text-right font-mono text-red-600 font-bold">- {m.luasDimutasiM2} m²</td>
                            <td className="border border-slate-400 p-1.5 text-[10px]">{m.nomorAkta} ({m.pejabatPembuatAkta})</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Penutup & Tanda Tangan */}
                <div className="pt-4 font-sans flex justify-between items-end">
                  <div className="text-[11px] text-slate-500">
                    Dicetak otomatis melalui Sistem Manajemen Pertanahan Desa Sampeldes pada:{' '}
                    {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </div>

                  <div className="text-center w-64 space-y-12">
                    <div>
                      <p>Sampeldes, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                      <p className="font-bold">KEPALA DESA SAMPELDES</p>
                    </div>
                    <div>
                      <p className="font-bold underline uppercase tracking-wider">Hj. SITI SUHARTIK</p>
                      <p className="text-[11px] text-slate-500">Kepala Desa</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* CONFIRM DELETE DIALOG */}
      <AlertDialog open={!!deleteCDesa} onOpenChange={(open) => !open && setDeleteCDesa(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-condensed font-extrabold text-red-600">
              Hapus Buku C-Desa?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs">
              Apakah Anda yakin ingin menghapus nomor Kohir <strong>C. {deleteCDesa?.nomorC}</strong> atas nama{' '}
              <strong>{deleteCDesa?.namaPemilik}</strong>?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDeleteCDesa} className="bg-red-600 hover:bg-red-700 text-white">
              Hapus Permanen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default function CDesaPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center font-condensed">Memuat Halaman Buku C-Desa...</div>}>
      <CDesaContent />
    </Suspense>
  );
}
