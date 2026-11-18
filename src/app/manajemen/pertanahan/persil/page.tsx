'use client';

import React, { useState, useEffect, useMemo } from 'react';
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
  DataPersil,
  JenisPemilik,
  JenisTanah,
  KategoriTanah,
  StatusSertifikat,
} from '@/types/pertanahan';
import {
  Landmark,
  Plus,
  Search,
  Filter,
  Download,
  Printer,
  FileSpreadsheet,
  MapPin,
  Eye,
  Edit,
  Trash2,
  Layers,
  ArrowUpRight,
  Compass,
  CheckCircle2,
  RefreshCw,
  FileText,
  UserCheck,
  Building,
} from 'lucide-react';
import Link from 'next/link';
import * as XLSX from 'xlsx';
import { searchResidentsQuotaSafe } from '@/lib/residents';

// Daftar opsi kelas tanah standar OpenSID & Desa
const KELAS_TANAH_OPTIONS = [
  { value: 'D.I', label: 'D.I (Darat / Pekarangan Kelas 1)', jenis: 'darat' },
  { value: 'D.II', label: 'D.II (Darat / Pekarangan Kelas 2)', jenis: 'darat' },
  { value: 'D.III', label: 'D.III (Darat / Pekarangan Kelas 3)', jenis: 'darat' },
  { value: 'D.IV', label: 'D.IV (Darat / Pekarangan Kelas 4)', jenis: 'darat' },
  { value: 'S.I', label: 'S.I (Sawah Irigasi Teknis Kelas 1)', jenis: 'sawah' },
  { value: 'S.II', label: 'S.II (Sawah Irigasi Teknis Kelas 2)', jenis: 'sawah' },
  { value: 'S.III', label: 'S.III (Sawah Tadah Hujan Kelas 3)', jenis: 'sawah' },
  { value: 'S.IV', label: 'S.IV (Sawah Rawa / Lainnya)', jenis: 'sawah' },
  { value: 'T.I', label: 'T.I (Tegalan / Kebun Kelas 1)', jenis: 'tegalan' },
  { value: 'T.II', label: 'T.II (Tegalan / Kebun Kelas 2)', jenis: 'tegalan' },
];

export default function DataPersilPage() {
  const db = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();

  const [persilList, setPersilList] = useState<DataPersil[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [filterJenisTanah, setFilterJenisTanah] = useState('ALL');
  const [filterKelasTanah, setFilterKelasTanah] = useState('ALL');
  const [filterKategori, setFilterKategori] = useState('ALL');
  const [filterDusun, setFilterDusun] = useState('ALL');

  // Dialog State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<DataPersil | null>(null);
  const [detailItem, setDetailItem] = useState<DataPersil | null>(null);
  const [deleteItem, setDeleteItem] = useState<DataPersil | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Resident Lookup for autocomplete
  const [residentSearch, setResidentSearch] = useState('');
  const [residentSuggestions, setResidentSuggestions] = useState<any[]>([]);
  const [searchingResident, setSearchingResident] = useState(false);

  // Form State
  const initialFormData: Omit<DataPersil, 'id' | 'createdAt' | 'updatedAt'> = {
    nomorPersil: '',
    nomorUrutBidang: '',
    nomorCDesa: '',
    cDesaId: '',
    jenisPemilik: 'penduduk',
    pemilikNik: '',
    pemilikNama: '',
    pemilikAlamat: '',
    kategoriTanah: 'milik_adat',
    kelasTanah: 'D.I',
    jenisTanah: 'darat',
    peruntukanTanah: 'Pekarangan / Bangunan',
    luasM2: 0,
    dusun: 'Dusun Krajan',
    rw: '01',
    rt: '01',
    namaBlok: '',
    batasUtara: '',
    batasTimur: '',
    batasSelatan: '',
    batasBarat: '',
    nopPbb: '',
    statusSertifikat: 'letter_c',
    nomorSertifikat: '',
    latitude: -7.942,
    longitude: 112.721,
    polygonGeoJson: '',
    keterangan: '',
  };

  const [formData, setFormData] = useState(initialFormData);

  // Load Persil data
  const fetchPersil = async () => {
    if (!db) return;
    setLoading(true);
    try {
      const q = query(collection(db, 'data_persil'), orderBy('nomorPersil', 'asc'));
      const snap = await getDocs(q);
      const list: DataPersil[] = [];
      snap.forEach((d) => {
        list.push({ id: d.id, ...(d.data() as any) });
      });
      setPersilList(list);
    } catch (err: any) {
      console.error('Error fetching persil:', err);
      toast({
        title: 'Gagal Memuat Data',
        description: err.message || 'Terjadi kesalahan saat memuat master persil',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPersil();
  }, [db]);

  // Autocomplete resident by NIK or Name (Quota-Safe Search: maksimal 5 dokumen dengan cache, BUKAN limit 300!)
  useEffect(() => {
    if (!db || residentSearch.trim().length < 3 || formData.jenisPemilik !== 'penduduk') {
      setResidentSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      setSearchingResident(true);
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
      } finally {
        setSearchingResident(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [residentSearch, db, formData.jenisPemilik]);

  // Open Form for Add
  const handleOpenAdd = () => {
    setEditingItem(null);
    setFormData(initialFormData);
    setResidentSearch('');
    setResidentSuggestions([]);
    setIsFormOpen(true);
  };

  // Open Form for Edit
  const handleOpenEdit = (item: DataPersil) => {
    setEditingItem(item);
    setFormData({
      nomorPersil: item.nomorPersil || '',
      nomorUrutBidang: item.nomorUrutBidang || '',
      nomorCDesa: item.nomorCDesa || '',
      cDesaId: item.cDesaId || '',
      jenisPemilik: item.jenisPemilik || 'penduduk',
      pemilikNik: item.pemilikNik || '',
      pemilikNama: item.pemilikNama || '',
      pemilikAlamat: item.pemilikAlamat || '',
      kategoriTanah: item.kategoriTanah || 'milik_adat',
      kelasTanah: item.kelasTanah || 'D.I',
      jenisTanah: item.jenisTanah || 'darat',
      peruntukanTanah: item.peruntukanTanah || 'Pekarangan / Bangunan',
      luasM2: item.luasM2 || 0,
      dusun: item.dusun || 'Dusun Krajan',
      rw: item.rw || '01',
      rt: item.rt || '01',
      namaBlok: item.namaBlok || '',
      batasUtara: item.batasUtara || '',
      batasTimur: item.batasTimur || '',
      batasSelatan: item.batasSelatan || '',
      batasBarat: item.batasBarat || '',
      nopPbb: item.nopPbb || '',
      statusSertifikat: item.statusSertifikat || 'letter_c',
      nomorSertifikat: item.nomorSertifikat || '',
      latitude: item.latitude || -7.942,
      longitude: item.longitude || 112.721,
      polygonGeoJson: item.polygonGeoJson || '',
      keterangan: item.keterangan || '',
    });
    setResidentSearch(item.pemilikNama || '');
    setResidentSuggestions([]);
    setIsFormOpen(true);
  };

  // Submit Form Add/Edit
  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db) return;

    if (!formData.nomorPersil.trim()) {
      toast({ title: 'Validasi Gagal', description: 'Nomor Persil wajib diisi', variant: 'destructive' });
      return;
    }
    if (!formData.pemilikNama.trim()) {
      toast({ title: 'Validasi Gagal', description: 'Nama pemilik tanah wajib diisi', variant: 'destructive' });
      return;
    }
    if (formData.luasM2 <= 0) {
      toast({ title: 'Validasi Gagal', description: 'Luas tanah harus lebih besar dari 0 m²', variant: 'destructive' });
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        ...formData,
        luasM2: Number(formData.luasM2),
        latitude: Number(formData.latitude) || null,
        longitude: Number(formData.longitude) || null,
        updatedAt: serverTimestamp(),
        updatedBy: user?.email || 'admin',
      };

      if (editingItem) {
        await updateDoc(doc(db, 'data_persil', editingItem.id), payload);
        toast({ title: 'Berhasil', description: 'Data persil berhasil diperbarui' });
      } else {
        await addDoc(collection(db, 'data_persil'), {
          ...payload,
          createdAt: serverTimestamp(),
          createdBy: user?.email || 'admin',
        });
        toast({ title: 'Berhasil', description: 'Bidang persil baru berhasil ditambahkan' });
      }

      setIsFormOpen(false);
      fetchPersil();
    } catch (err: any) {
      console.error('Error saving persil:', err);
      toast({
        title: 'Gagal Menyimpan',
        description: err.message || 'Terjadi kesalahan sistem saat menyimpan persil',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Delete Persil
  const handleConfirmDelete = async () => {
    if (!db || !deleteItem) return;
    try {
      await deleteDoc(doc(db, 'data_persil', deleteItem.id));
      toast({ title: 'Berhasil', description: 'Bidang persil telah dihapus' });
      setDeleteItem(null);
      fetchPersil();
    } catch (err: any) {
      toast({ title: 'Gagal Menghapus', description: err.message, variant: 'destructive' });
    }
  };

  // Export to Excel
  const handleExportExcel = () => {
    if (persilList.length === 0) {
      toast({ title: 'Data Kosong', description: 'Tidak ada data untuk diekspor' });
      return;
    }

    const rows = filteredList.map((p, idx) => ({
      No: idx + 1,
      'Nomor Persil': p.nomorPersil,
      NUB: p.nomorUrutBidang || '-',
      'No. C-Desa': p.nomorCDesa ? `C. ${p.nomorCDesa}` : '-',
      'Nama Pemilik': p.pemilikNama,
      'NIK Pemilik': p.pemilikNik || '-',
      'Tipe Pemilik': p.jenisPemilik === 'penduduk' ? 'Warga Sampeldes' : 'Luar Desa / Instansi',
      'Kelas Tanah': p.kelasTanah,
      'Jenis Tanah': p.jenisTanah.toUpperCase(),
      'Kategori Hak': p.kategoriTanah.toUpperCase().replace('_', ' '),
      'Luas (m²)': p.luasM2,
      'Luas (Ha)': (p.luasM2 / 10000).toFixed(4),
      Dusun: p.dusun,
      'RT/RW': `${p.rt}/${p.rw}`,
      Blok: p.namaBlok || '-',
      'Batas Utara': p.batasUtara || '-',
      'Batas Timur': p.batasTimur || '-',
      'Batas Selatan': p.batasSelatan || '-',
      'Batas Barat': p.batasBarat || '-',
      'NOP PBB': p.nopPbb || '-',
      'Status Sertifikat': p.statusSertifikat.toUpperCase().replace('_', ' '),
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Data Persil Desa Sampeldes');
    XLSX.writeFile(wb, `Data_Persil_Desa_Sampeldes_${new Date().toISOString().slice(0, 10)}.xlsx`);

    toast({ title: 'Ekspor Berhasil', description: 'File Excel Data Persil berhasil diunduh' });
  };

  // Filtered List
  const filteredList = useMemo(() => {
    return persilList.filter((item) => {
      // Query Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchPersil = item.nomorPersil?.toLowerCase().includes(q);
        const matchC = item.nomorCDesa?.toLowerCase().includes(q);
        const matchNama = item.pemilikNama?.toLowerCase().includes(q);
        const matchNik = item.pemilikNik?.toLowerCase().includes(q);
        const matchDusun = item.dusun?.toLowerCase().includes(q);
        if (!matchPersil && !matchC && !matchNama && !matchNik && !matchDusun) {
          return false;
        }
      }

      // Filter Jenis Tanah
      if (filterJenisTanah !== 'ALL' && item.jenisTanah !== filterJenisTanah) {
        return false;
      }

      // Filter Kelas Tanah
      if (filterKelasTanah !== 'ALL' && item.kelasTanah !== filterKelasTanah) {
        return false;
      }

      // Filter Kategori
      if (filterKategori !== 'ALL' && item.kategoriTanah !== filterKategori) {
        return false;
      }

      // Filter Dusun
      if (filterDusun !== 'ALL' && item.dusun !== filterDusun) {
        return false;
      }

      return true;
    });
  }, [persilList, searchQuery, filterJenisTanah, filterKelasTanah, filterKategori, filterDusun]);

  // Aggregate stats
  const stats = useMemo(() => {
    const totalPersil = persilList.length;
    const totalLuasM2 = persilList.reduce((acc, curr) => acc + (Number(curr.luasM2) || 0), 0);
    const persilDarat = persilList.filter((p) => p.jenisTanah === 'darat').length;
    const persilSawah = persilList.filter((p) => p.jenisTanah === 'sawah').length;
    const luasHa = (totalLuasM2 / 10000).toFixed(2);
    return { totalPersil, totalLuasM2, persilDarat, persilSawah, luasHa };
  }, [persilList]);

  // Unique dusuns
  const uniqueDusuns = useMemo(() => {
    const setD = new Set<string>();
    persilList.forEach((p) => {
      if (p.dusun) setD.add(p.dusun);
    });
    return Array.from(setD);
  }, [persilList]);

  return (
    <div className="space-y-6 pb-12">
      {/* Header section with Neumorphic polish */}
      <div className="neu-convex p-6 md:p-8 rounded-[28px] border border-white/60 dark:border-white/10 shadow-[10px_10px_24px_rgba(165,155,140,0.35),-10px_-10px_24px_rgba(255,255,255,0.95)]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 rounded-full text-xs font-condensed font-extrabold tracking-wider uppercase bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
                Administrasi Agraria Desa
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-condensed font-extrabold tracking-wider uppercase bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                Standar OpenSID
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-800 dark:text-slate-100 font-condensed tracking-tight">
              DATA PERSIL (BIDANG TANAH DESA)
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 max-w-2xl">
              Pencatatan resmi nomor persil, kelas tanah (Darat/Sawah), luas sempadan, subjek kepemilikan, relasi Buku C-Desa, dan titik geospasial tanah Desa Sampeldes.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              onClick={handleExportExcel}
              variant="outline"
              className="neu-convex bg-[#ECE8E1] hover:bg-[#e2ded6] dark:bg-[#0e1620] dark:hover:bg-[#162232] border-white/60 font-condensed font-bold text-xs uppercase tracking-wider gap-1.5 shadow-sm"
            >
              <Download className="h-4 w-4 text-emerald-600" />
              Ekspor Excel
            </Button>
            <Button
              onClick={() => window.print()}
              variant="outline"
              className="neu-convex bg-[#ECE8E1] hover:bg-[#e2ded6] dark:bg-[#0e1620] dark:hover:bg-[#162232] border-white/60 font-condensed font-bold text-xs uppercase tracking-wider gap-1.5 shadow-sm"
            >
              <Printer className="h-4 w-4 text-slate-700 dark:text-slate-300" />
              Cetak
            </Button>
            <Link href="/manajemen/pertanahan/peta">
              <Button
                variant="outline"
                className="neu-convex bg-[#ECE8E1] hover:bg-[#e2ded6] dark:bg-[#0e1620] dark:hover:bg-[#162232] border-white/60 font-condensed font-bold text-xs uppercase tracking-wider gap-1.5 text-sky-700 dark:text-sky-400"
              >
                <Compass className="h-4 w-4" />
                Peta GIS
              </Button>
            </Link>
            <Button
              onClick={handleOpenAdd}
              className="bg-amber-600 hover:bg-amber-700 text-white font-condensed font-extrabold text-xs uppercase tracking-wider gap-1.5 shadow-md active:scale-95 transition-all"
            >
              <Plus className="h-4 w-4" />
              Tambah Persil
            </Button>
          </div>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-300/60 dark:border-white/10">
          <div className="neu-inset p-4 rounded-2xl bg-white/40 dark:bg-black/20">
            <div className="flex items-center justify-between text-xs font-condensed font-bold text-slate-500 uppercase tracking-wider">
              <span>Total Bidang Persil</span>
              <Landmark className="h-4 w-4 text-amber-600" />
            </div>
            <div className="mt-2 text-2xl font-black font-condensed text-slate-800 dark:text-slate-100">
              {stats.totalPersil} <span className="text-xs font-normal text-slate-500">Bidang</span>
            </div>
          </div>

          <div className="neu-inset p-4 rounded-2xl bg-white/40 dark:bg-black/20">
            <div className="flex items-center justify-between text-xs font-condensed font-bold text-slate-500 uppercase tracking-wider">
              <span>Luas Terdaftar</span>
              <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
            </div>
            <div className="mt-2 text-2xl font-black font-condensed text-emerald-700 dark:text-emerald-400">
              {stats.luasHa} <span className="text-xs font-normal text-slate-500">Ha ({stats.totalLuasM2.toLocaleString('id-ID')} m²)</span>
            </div>
          </div>

          <div className="neu-inset p-4 rounded-2xl bg-white/40 dark:bg-black/20">
            <div className="flex items-center justify-between text-xs font-condensed font-bold text-slate-500 uppercase tracking-wider">
              <span>Persil Tanah Darat</span>
              <Layers className="h-4 w-4 text-amber-500" />
            </div>
            <div className="mt-2 text-2xl font-black font-condensed text-amber-700 dark:text-amber-400">
              {stats.persilDarat} <span className="text-xs font-normal text-slate-500">Bidang (D.I - D.IV)</span>
            </div>
          </div>

          <div className="neu-inset p-4 rounded-2xl bg-white/40 dark:bg-black/20">
            <div className="flex items-center justify-between text-xs font-condensed font-bold text-slate-500 uppercase tracking-wider">
              <span>Persil Tanah Sawah</span>
              <MapPin className="h-4 w-4 text-teal-600" />
            </div>
            <div className="mt-2 text-2xl font-black font-condensed text-teal-700 dark:text-teal-400">
              {stats.persilSawah} <span className="text-xs font-normal text-slate-500">Bidang (S.I - S.IV)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="neu-convex p-5 rounded-2xl border border-white/60 dark:border-white/10 flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Cari Nomor Persil, Nama Pemilik, NIK, No. C-Desa, Dusun..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 neu-inset bg-white/50 dark:bg-black/20 border-white/50 text-sm font-medium rounded-xl h-10"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Filter Jenis */}
          <Select value={filterJenisTanah} onValueChange={setFilterJenisTanah}>
            <SelectTrigger className="w-[140px] h-10 neu-inset bg-white/50 dark:bg-black/20 border-white/50 text-xs font-condensed font-bold uppercase rounded-xl">
              <SelectValue placeholder="Jenis Tanah" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Semua Jenis</SelectItem>
              <SelectItem value="darat">Darat / Kering</SelectItem>
              <SelectItem value="sawah">Sawah / Basah</SelectItem>
              <SelectItem value="tegalan">Tegalan / Kebun</SelectItem>
            </SelectContent>
          </Select>

          {/* Filter Kelas */}
          <Select value={filterKelasTanah} onValueChange={setFilterKelasTanah}>
            <SelectTrigger className="w-[130px] h-10 neu-inset bg-white/50 dark:bg-black/20 border-white/50 text-xs font-condensed font-bold uppercase rounded-xl">
              <SelectValue placeholder="Kelas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Semua Kelas</SelectItem>
              {KELAS_TANAH_OPTIONS.map((k) => (
                <SelectItem key={k.value} value={k.value}>
                  Kelas {k.value}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Filter Kategori Hak */}
          <Select value={filterKategori} onValueChange={setFilterKategori}>
            <SelectTrigger className="w-[140px] h-10 neu-inset bg-white/50 dark:bg-black/20 border-white/50 text-xs font-condensed font-bold uppercase rounded-xl">
              <SelectValue placeholder="Kategori Hak" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Semua Hak</SelectItem>
              <SelectItem value="milik_adat">Milik Adat / C</SelectItem>
              <SelectItem value="tkd_bengkok">TKD / Bengkok</SelectItem>
              <SelectItem value="shm">Sertifikat SHM</SelectItem>
              <SelectItem value="hgb">HGB / Pakai</SelectItem>
              <SelectItem value="wakaf">Wakaf</SelectItem>
              <SelectItem value="tanah_negara">Tanah Negara</SelectItem>
            </SelectContent>
          </Select>

          {/* Reset button */}
          {(searchQuery || filterJenisTanah !== 'ALL' || filterKelasTanah !== 'ALL' || filterKategori !== 'ALL') && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearchQuery('');
                setFilterJenisTanah('ALL');
                setFilterKelasTanah('ALL');
                setFilterKategori('ALL');
                setFilterDusun('ALL');
              }}
              className="text-xs font-condensed font-bold uppercase text-slate-500 hover:text-red-600 h-10 px-3"
            >
              Reset
            </Button>
          )}

          <Button
            variant="ghost"
            size="icon"
            onClick={fetchPersil}
            className="h-10 w-10 neu-inset rounded-xl text-slate-600 dark:text-slate-300"
            title="Refresh Data"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Table Section */}
      <div className="neu-convex rounded-[24px] overflow-hidden border border-white/60 dark:border-white/10 shadow-[8px_8px_20px_rgba(165,155,140,0.3),-8px_-8px_20px_rgba(255,255,255,0.9)]">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-100/80 dark:bg-black/30 border-b border-slate-200 dark:border-white/10">
              <TableRow className="hover:bg-transparent">
                <TableHead className="font-condensed font-extrabold text-xs text-slate-700 dark:text-slate-300 uppercase tracking-wider w-[120px]">
                  No. Persil
                </TableHead>
                <TableHead className="font-condensed font-extrabold text-xs text-slate-700 dark:text-slate-300 uppercase tracking-wider w-[110px]">
                  No. C-Desa
                </TableHead>
                <TableHead className="font-condensed font-extrabold text-xs text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Pemilik Terdaftar
                </TableHead>
                <TableHead className="font-condensed font-extrabold text-xs text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Kelas / Jenis
                </TableHead>
                <TableHead className="font-condensed font-extrabold text-xs text-slate-700 dark:text-slate-300 uppercase tracking-wider text-right">
                  Luas (m²)
                </TableHead>
                <TableHead className="font-condensed font-extrabold text-xs text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Lokasi / Blok
                </TableHead>
                <TableHead className="font-condensed font-extrabold text-xs text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Status Hak
                </TableHead>
                <TableHead className="font-condensed font-extrabold text-xs text-slate-700 dark:text-slate-300 uppercase tracking-wider text-center w-[130px]">
                  Aksi
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12 text-slate-500 font-condensed">
                    <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-amber-600" />
                    Memuat Master Data Persil...
                  </TableCell>
                </TableRow>
              ) : filteredList.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12 text-slate-500">
                    <div className="max-w-xs mx-auto space-y-2">
                      <Landmark className="h-10 w-10 text-slate-400 mx-auto" />
                      <p className="font-condensed font-bold text-slate-700 dark:text-slate-300">
                        Belum Ada Data Bidang Persil
                      </p>
                      <p className="text-xs text-slate-500">
                        Klik tombol Tambah Persil untuk mencatatkan nomor persil baru ke buku register desa.
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredList.map((item) => (
                  <TableRow
                    key={item.id}
                    className="border-b border-slate-200/60 dark:border-white/5 hover:bg-white/40 dark:hover:bg-white/5 transition-colors"
                  >
                    <TableCell className="font-condensed font-extrabold text-slate-800 dark:text-slate-100">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm">Persil {item.nomorPersil}</span>
                        {item.nomorUrutBidang && (
                          <Badge variant="outline" className="text-[10px] py-0 px-1 font-mono">
                            NUB {item.nomorUrutBidang}
                          </Badge>
                        )}
                      </div>
                    </TableCell>

                    <TableCell>
                      {item.nomorCDesa ? (
                        <Link
                          href={`/manajemen/pertanahan/cdesa?nomorC=${item.nomorCDesa}`}
                          className="font-mono font-bold text-xs text-amber-700 dark:text-amber-400 hover:underline flex items-center gap-1"
                        >
                          C. {item.nomorCDesa}
                          <ArrowUpRight className="h-3 w-3" />
                        </Link>
                      ) : (
                        <span className="text-xs text-slate-400 italic">Belum terhubung</span>
                      )}
                    </TableCell>

                    <TableCell>
                      <div className="space-y-0.5">
                        <div className="font-bold text-sm text-slate-800 dark:text-slate-200">
                          {item.pemilikNama}
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-slate-500">
                          {item.pemilikNik && <span className="font-mono">{item.pemilikNik}</span>}
                          <Badge
                            variant="secondary"
                            className={`text-[9px] py-0 px-1 font-condensed uppercase ${
                              item.jenisPemilik === 'penduduk'
                                ? 'bg-teal-500/10 text-teal-700 border-teal-500/20'
                                : 'bg-slate-500/10 text-slate-700'
                            }`}
                          >
                            {item.jenisPemilik === 'penduduk' ? 'Warga Sampeldes' : 'Luar Desa / Umum'}
                          </Badge>
                        </div>
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <Badge
                          className={`font-condensed font-bold text-xs px-2 py-0.5 ${
                            item.jenisTanah === 'darat'
                              ? 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-900/40 dark:text-amber-300'
                              : item.jenisTanah === 'sawah'
                              ? 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-900/40 dark:text-emerald-300'
                              : 'bg-orange-100 text-orange-800'
                          }`}
                        >
                          Kelas {item.kelasTanah}
                        </Badge>
                        <span className="text-xs text-slate-500 capitalize">{item.jenisTanah}</span>
                      </div>
                    </TableCell>

                    <TableCell className="text-right font-mono font-bold text-slate-800 dark:text-slate-100">
                      <div>{Number(item.luasM2).toLocaleString('id-ID')} m²</div>
                      <div className="text-[10px] text-slate-400 font-normal">
                        {(Number(item.luasM2) / 10000).toFixed(4)} Ha
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="text-xs text-slate-700 dark:text-slate-300">
                        {item.dusun} RT {item.rt} / RW {item.rw}
                      </div>
                      {item.namaBlok && (
                        <div className="text-[11px] text-slate-400 italic">Blok: {item.namaBlok}</div>
                      )}
                    </TableCell>

                    <TableCell>
                      <Badge
                        variant="outline"
                        className="text-[10px] font-condensed uppercase tracking-wider font-bold"
                      >
                        {item.kategoriTanah === 'milik_adat'
                          ? 'Milik Adat'
                          : item.kategoriTanah === 'tkd_bengkok'
                          ? 'TKD Bengkok'
                          : item.kategoriTanah.toUpperCase()}
                      </Badge>
                    </TableCell>

                    <TableCell>
                      <div className="flex items-center justify-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDetailItem(item)}
                          className="h-8 w-8 text-sky-600 hover:text-sky-700 hover:bg-sky-50 dark:hover:bg-sky-950"
                          title="Lihat Detail & Warkah"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenEdit(item)}
                          className="h-8 w-8 text-amber-600 hover:text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-950"
                          title="Edit Persil"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteItem(item)}
                          className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                          title="Hapus Persil"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Footer info */}
        <div className="p-4 bg-slate-50/60 dark:bg-black/20 border-t border-slate-200/60 dark:border-white/10 flex items-center justify-between text-xs text-slate-500 font-condensed">
          <div>
            Menampilkan <span className="font-bold text-slate-800 dark:text-slate-200">{filteredList.length}</span> dari{' '}
            <span className="font-bold">{persilList.length}</span> bidang tanah
          </div>
          <div>Buku Administrasi Pertanahan Desa Sampeldes</div>
        </div>
      </div>

      {/* DIALOG FORM: Tambah / Edit Persil */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-black font-condensed tracking-tight">
              {editingItem ? 'EDIT BIDANG PERSIL' : 'CATAT BIDANG PERSIL BARU'}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Masukkan identifikasi fisik tanah, subjek kepemilikan, kelas tanah, serta 4 batas sempadan persil sesuai Buku Letter C / Warkah desa.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmitForm} className="space-y-6 pt-2">
            <Tabs defaultValue="pokok" className="w-full">
              <TabsList className="grid grid-cols-4 w-full">
                <TabsTrigger value="pokok" className="text-xs font-condensed font-bold">1. Data Fisik</TabsTrigger>
                <TabsTrigger value="pemilik" className="text-xs font-condensed font-bold">2. Subjek Pemilik</TabsTrigger>
                <TabsTrigger value="batas" className="text-xs font-condensed font-bold">3. Batas Sempadan</TabsTrigger>
                <TabsTrigger value="legalitas" className="text-xs font-condensed font-bold">4. Pajak & Peta</TabsTrigger>
              </TabsList>

              {/* TAB 1: Data Fisik */}
              <TabsContent value="pokok" className="space-y-4 pt-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold">Nomor Persil *</Label>
                    <Input
                      placeholder="Contoh: 12, 12a, 45"
                      value={formData.nomorPersil}
                      onChange={(e) => setFormData({ ...formData, nomorPersil: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold">Nomor Urut Bidang (NUB)</Label>
                    <Input
                      placeholder="Contoh: 01, 02"
                      value={formData.nomorUrutBidang}
                      onChange={(e) => setFormData({ ...formData, nomorUrutBidang: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold">Nomor Kohir C-Desa</Label>
                    <Input
                      placeholder="Contoh: 152"
                      value={formData.nomorCDesa}
                      onChange={(e) => setFormData({ ...formData, nomorCDesa: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold">Jenis Tanah *</Label>
                    <Select
                      value={formData.jenisTanah}
                      onValueChange={(val: JenisTanah) => {
                        const defaultKelas = val === 'darat' ? 'D.I' : val === 'sawah' ? 'S.I' : 'T.I';
                        setFormData({ ...formData, jenisTanah: val, kelasTanah: defaultKelas });
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="darat">Tanah Darat / Kering (D)</SelectItem>
                        <SelectItem value="sawah">Tanah Basah / Sawah (S)</SelectItem>
                        <SelectItem value="tegalan">Tegalan / Kebun (T)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold">Kelas Tanah *</Label>
                    <Select
                      value={formData.kelasTanah}
                      onValueChange={(val) => setFormData({ ...formData, kelasTanah: val })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {KELAS_TANAH_OPTIONS.filter((k) => k.jenis === formData.jenisTanah).map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold">Luas Bidang (m²) *</Label>
                    <Input
                      type="number"
                      min={1}
                      placeholder="Contoh: 1250"
                      value={formData.luasM2 || ''}
                      onChange={(e) => setFormData({ ...formData, luasM2: Number(e.target.value) })}
                      required
                    />
                    {formData.luasM2 > 0 && (
                      <span className="text-[11px] text-slate-500 font-mono">
                        ≈ {(formData.luasM2 / 10000).toFixed(4)} Hektar
                      </span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold">Kategori Hak Atas Tanah</Label>
                    <Select
                      value={formData.kategoriTanah}
                      onValueChange={(val: KategoriTanah) => setFormData({ ...formData, kategoriTanah: val })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="milik_adat">Tanah Milik Adat (Letter C / Girik / Petok D)</SelectItem>
                        <SelectItem value="tkd_bengkok">Tanah Kas Desa (TKD) / Bengkok</SelectItem>
                        <SelectItem value="shm">Sertifikat Hak Milik (SHM)</SelectItem>
                        <SelectItem value="hgb">Hak Guna Bangunan (HGB) / Pakai</SelectItem>
                        <SelectItem value="wakaf">Tanah Wakaf</SelectItem>
                        <SelectItem value="tanah_negara">Tanah Negara</SelectItem>
                        <SelectItem value="fasilitas_umum">Fasilitas Umum / Makam / Jalan</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold">Peruntukan / Penggunaan Fisik</Label>
                    <Input
                      placeholder="Contoh: Pekarangan Rumah, Sawah Irigasi, Tegalan Jagung"
                      value={formData.peruntukanTanah}
                      onChange={(e) => setFormData({ ...formData, peruntukanTanah: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold">Dusun</Label>
                    <Input
                      value={formData.dusun}
                      onChange={(e) => setFormData({ ...formData, dusun: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold">RW</Label>
                    <Input
                      value={formData.rw}
                      onChange={(e) => setFormData({ ...formData, rw: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold">RT</Label>
                    <Input
                      value={formData.rt}
                      onChange={(e) => setFormData({ ...formData, rt: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold">Nama Blok / Lokasi</Label>
                    <Input
                      placeholder="Cth: Blok Timur"
                      value={formData.namaBlok}
                      onChange={(e) => setFormData({ ...formData, namaBlok: e.target.value })}
                    />
                  </div>
                </div>
              </TabsContent>

              {/* TAB 2: Subjek Pemilik */}
              <TabsContent value="pemilik" className="space-y-4 pt-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold">Kategori Subjek Pemilik</Label>
                  <Select
                    value={formData.jenisPemilik}
                    onValueChange={(val: JenisPemilik) => setFormData({ ...formData, jenisPemilik: val })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="penduduk">Warga Penduduk Desa Sampeldes (Integrasi NIK)</SelectItem>
                      <SelectItem value="luar_desa">Warga Luar Desa / Ahli Waris Non-Warga</SelectItem>
                      <SelectItem value="pemerintah">Pemerintah Desa Sampeldes (Aset Desa)</SelectItem>
                      <SelectItem value="fasilitas_umum">Badan Hukum / Yayasan / Tempat Ibadah</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {formData.jenisPemilik === 'penduduk' && (
                  <div className="p-3 bg-teal-50 dark:bg-teal-950/30 rounded-xl border border-teal-200 dark:border-teal-800 space-y-2">
                    <Label className="text-xs font-bold text-teal-800 dark:text-teal-300">
                      Cari dari Database Kependudukan Sampeldes:
                    </Label>
                    <div className="relative">
                      <Input
                        placeholder="Ketik NIK atau Nama warga..."
                        value={residentSearch}
                        onChange={(e) => setResidentSearch(e.target.value)}
                        className="bg-white dark:bg-black/40"
                      />
                      {searchingResident && (
                        <div className="absolute right-3 top-2.5 text-xs text-slate-400">Mencari...</div>
                      )}
                    </div>
                    {residentSuggestions.length > 0 && (
                      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-lg shadow-lg overflow-hidden divide-y divide-slate-100 dark:divide-white/5">
                        {residentSuggestions.map((r, i) => (
                          <div
                            key={i}
                            onClick={() => {
                              setFormData({
                                ...formData,
                                pemilikNik: r.nik || '',
                                pemilikNama: r.name || '',
                                pemilikAlamat: r.address || `${r.dusun || ''} RT ${r.rt || ''}/RW ${r.rw || ''}`,
                              });
                              setResidentSearch(r.name || '');
                              setResidentSuggestions([]);
                            }}
                            className="p-2 text-xs hover:bg-teal-50 dark:hover:bg-teal-950 cursor-pointer flex justify-between items-center"
                          >
                            <div>
                              <div className="font-bold">{r.name}</div>
                              <div className="text-slate-500 font-mono text-[11px]">{r.nik}</div>
                            </div>
                            <span className="text-[10px] text-teal-600 font-bold uppercase">Pilih</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold">Nama Pemilik Sesuai Warkah *</Label>
                    <Input
                      placeholder="Nama lengkap pemilik terdaftar"
                      value={formData.pemilikNama}
                      onChange={(e) => setFormData({ ...formData, pemilikNama: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold">NIK Pemilik (Jika ada)</Label>
                    <Input
                      placeholder="16 digit NIK"
                      value={formData.pemilikNik}
                      onChange={(e) => setFormData({ ...formData, pemilikNik: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold">Alamat Lengkap Pemilik</Label>
                  <Textarea
                    placeholder="Alamat tempat tinggal pemilik"
                    value={formData.pemilikAlamat}
                    onChange={(e) => setFormData({ ...formData, pemilikAlamat: e.target.value })}
                    rows={2}
                  />
                </div>
              </TabsContent>

              {/* TAB 3: Batas Sempadan */}
              <TabsContent value="batas" className="space-y-4 pt-4">
                <div className="p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-xl text-xs text-amber-800 dark:text-amber-300">
                  Masukkan batas-batas tanah sekeliling bidang persil (Batas Utara, Timur, Selatan, Barat) sesuai dengan pengukuran fisik atau Buku Letter C.
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-blue-500" />
                      Batas Utara
                    </Label>
                    <Input
                      placeholder="Contoh: Berbatasan dengan Jalan Desa / Tanah Bpk. Sugeng"
                      value={formData.batasUtara}
                      onChange={(e) => setFormData({ ...formData, batasUtara: e.target.value })}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-emerald-500" />
                      Batas Timur
                    </Label>
                    <Input
                      placeholder="Contoh: Berbatasan dengan Saluran Irigasi / Bpk. Rohman"
                      value={formData.batasTimur}
                      onChange={(e) => setFormData({ ...formData, batasTimur: e.target.value })}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-amber-500" />
                      Batas Selatan
                    </Label>
                    <Input
                      placeholder="Contoh: Berbatasan dengan Gang Makam / Ibu Siti Aminah"
                      value={formData.batasSelatan}
                      onChange={(e) => setFormData({ ...formData, batasSelatan: e.target.value })}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-red-500" />
                      Batas Barat
                    </Label>
                    <Input
                      placeholder="Contoh: Berbatasan dengan Tanah Kas Desa / Bpk. Yanto"
                      value={formData.batasBarat}
                      onChange={(e) => setFormData({ ...formData, batasBarat: e.target.value })}
                    />
                  </div>
                </div>
              </TabsContent>

              {/* TAB 4: Pajak & Peta */}
              <TabsContent value="legalitas" className="space-y-4 pt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold">Status Bukti Kepemilikan</Label>
                    <Select
                      value={formData.statusSertifikat}
                      onValueChange={(val: StatusSertifikat) => setFormData({ ...formData, statusSertifikat: val })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="letter_c">Buku Letter C Desa</SelectItem>
                        <SelectItem value="petok_d">Petok D / Girik</SelectItem>
                        <SelectItem value="shm">Sertifikat Hak Milik (SHM - BPN)</SelectItem>
                        <SelectItem value="hgb">Sertifikat HGB</SelectItem>
                        <SelectItem value="hpl">Hak Pakai (HPL)</SelectItem>
                        <SelectItem value="belum_bersertifikat">Belum Bersertifikat</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold">Nomor Sertifikat / Warkah</Label>
                    <Input
                      placeholder="Nomor SHM / No Akta PPAT"
                      value={formData.nomorSertifikat}
                      onChange={(e) => setFormData({ ...formData, nomorSertifikat: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold">Nomor Objek Pajak (NOP PBB-P2)</Label>
                  <Input
                    placeholder="Contoh: 35.07.xxx.xxx.xxx-xxxx.0"
                    value={formData.nopPbb}
                    onChange={(e) => setFormData({ ...formData, nopPbb: e.target.value })}
                  />
                  <span className="text-[11px] text-slate-500">
                    Dihubungkan dengan sistem penagihan PBB-P2 Desa Sampeldes.
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold">Titik Koordinat Latitude (Lintang)</Label>
                    <Input
                      type="number"
                      step="any"
                      placeholder="-7.942..."
                      value={formData.latitude || ''}
                      onChange={(e) => setFormData({ ...formData, latitude: Number(e.target.value) })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold">Titik Koordinat Longitude (Bujur)</Label>
                    <Input
                      type="number"
                      step="any"
                      placeholder="112.721..."
                      value={formData.longitude || ''}
                      onChange={(e) => setFormData({ ...formData, longitude: Number(e.target.value) })}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold">Catatan / Keterangan Persil</Label>
                  <Textarea
                    placeholder="Keterangan tambahan seputar riwayat tanah atau riwayat pemecahan..."
                    value={formData.keterangan}
                    onChange={(e) => setFormData({ ...formData, keterangan: e.target.value })}
                    rows={2}
                  />
                </div>
              </TabsContent>
            </Tabs>

            <DialogFooter className="pt-4 border-t border-slate-200 dark:border-white/10">
              <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)}>
                Batal
              </Button>
              <Button type="submit" disabled={submitting} className="bg-amber-600 hover:bg-amber-700 text-white font-condensed font-bold uppercase">
                {submitting ? 'Menyimpan...' : editingItem ? 'Simpan Perubahan' : 'Tambahkan Persil'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* DIALOG DETAIL PERSIL */}
      <Dialog open={!!detailItem} onOpenChange={(open) => !open && setDetailItem(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {detailItem && (
            <div>
              <DialogHeader>
                <div className="flex items-center justify-between">
                  <Badge className="bg-amber-600 text-white font-condensed font-extrabold uppercase">
                    Persil No. {detailItem.nomorPersil}
                  </Badge>
                  {detailItem.nomorCDesa && (
                    <Badge variant="outline" className="font-mono">
                      Buku C. {detailItem.nomorCDesa}
                    </Badge>
                  )}
                </div>
                <DialogTitle className="text-xl font-black font-condensed tracking-tight mt-2">
                  WARKAH BIDANG TANAH PERSIL {detailItem.nomorPersil}
                </DialogTitle>
                <DialogDescription className="text-xs">
                  Rincian dokumen administrasi pertanahan Desa Sampeldes.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 pt-4 text-xs">
                {/* Objek info */}
                <div className="p-4 rounded-xl bg-slate-100 dark:bg-black/30 space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-slate-500">Pemilik Terdaftar:</span>
                      <div className="font-bold text-sm text-slate-800 dark:text-slate-200">
                        {detailItem.pemilikNama}
                      </div>
                      {detailItem.pemilikNik && (
                        <div className="font-mono text-slate-500">{detailItem.pemilikNik}</div>
                      )}
                    </div>
                    <div>
                      <span className="text-slate-500">Kelas / Jenis:</span>
                      <div className="font-bold text-sm text-slate-800 dark:text-slate-200">
                        Kelas {detailItem.kelasTanah} ({detailItem.jenisTanah.toUpperCase()})
                      </div>
                      <div className="text-slate-500">{detailItem.peruntukanTanah || '-'}</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200 dark:border-white/10">
                    <div>
                      <span className="text-slate-500">Luas Tanah:</span>
                      <div className="font-bold font-mono text-emerald-700 dark:text-emerald-400 text-sm">
                        {Number(detailItem.luasM2).toLocaleString('id-ID')} m²{' '}
                        <span className="font-normal text-slate-500 text-xs">
                          ({(Number(detailItem.luasM2) / 10000).toFixed(4)} Ha)
                        </span>
                      </div>
                    </div>
                    <div>
                      <span className="text-slate-500">Lokasi / Dusun:</span>
                      <div className="font-bold text-slate-800 dark:text-slate-200">
                        {detailItem.dusun} RT {detailItem.rt}/RW {detailItem.rw}
                      </div>
                      {detailItem.namaBlok && <div>Blok: {detailItem.namaBlok}</div>}
                    </div>
                  </div>
                </div>

                {/* 4 Batas Sempadan */}
                <div>
                  <h4 className="font-condensed font-extrabold uppercase text-slate-700 dark:text-slate-300 mb-2">
                    Batas-Batas Sempadan Tanah
                  </h4>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-2.5 rounded-lg border border-slate-200 dark:border-white/10">
                      <span className="font-bold text-blue-600 block mb-0.5">Utara:</span>
                      <span className="text-slate-700 dark:text-slate-300">{detailItem.batasUtara || '-'}</span>
                    </div>
                    <div className="p-2.5 rounded-lg border border-slate-200 dark:border-white/10">
                      <span className="font-bold text-emerald-600 block mb-0.5">Timur:</span>
                      <span className="text-slate-700 dark:text-slate-300">{detailItem.batasTimur || '-'}</span>
                    </div>
                    <div className="p-2.5 rounded-lg border border-slate-200 dark:border-white/10">
                      <span className="font-bold text-amber-600 block mb-0.5">Selatan:</span>
                      <span className="text-slate-700 dark:text-slate-300">{detailItem.batasSelatan || '-'}</span>
                    </div>
                    <div className="p-2.5 rounded-lg border border-slate-200 dark:border-white/10">
                      <span className="font-bold text-red-600 block mb-0.5">Barat:</span>
                      <span className="text-slate-700 dark:text-slate-300">{detailItem.batasBarat || '-'}</span>
                    </div>
                  </div>
                </div>

                {/* Legalitas & Pajak */}
                <div className="p-3 rounded-lg border border-slate-200 dark:border-white/10 space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Status Sertifikat:</span>
                    <span className="font-bold uppercase">{detailItem.statusSertifikat.replace('_', ' ')}</span>
                  </div>
                  {detailItem.nomorSertifikat && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">Nomor Sertifikat:</span>
                      <span className="font-mono font-bold">{detailItem.nomorSertifikat}</span>
                    </div>
                  )}
                  {detailItem.nopPbb && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">NOP PBB-P2:</span>
                      <span className="font-mono font-bold text-emerald-600">{detailItem.nopPbb}</span>
                    </div>
                  )}
                  {detailItem.latitude && detailItem.longitude && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">Koordinat GIS:</span>
                      <span className="font-mono text-slate-700 dark:text-slate-300">
                        {detailItem.latitude}, {detailItem.longitude}
                      </span>
                    </div>
                  )}
                </div>

                {detailItem.keterangan && (
                  <div className="text-slate-500 italic">
                    Catatan: {detailItem.keterangan}
                  </div>
                )}
              </div>

              <DialogFooter className="pt-4 border-t border-slate-200 dark:border-white/10">
                <Link href={`/manajemen/pertanahan/peta?lat=${detailItem.latitude}&lng=${detailItem.longitude}`}>
                  <Button variant="outline" size="sm" className="gap-1 font-condensed uppercase font-bold text-xs">
                    <MapPin className="h-3.5 w-3.5 text-sky-600" />
                    Buka di Peta
                  </Button>
                </Link>
                {detailItem.nomorCDesa && (
                  <Link href={`/manajemen/pertanahan/cdesa?nomorC=${detailItem.nomorCDesa}`}>
                    <Button variant="outline" size="sm" className="gap-1 font-condensed uppercase font-bold text-xs text-amber-700">
                      <FileText className="h-3.5 w-3.5" />
                      Buku C. {detailItem.nomorCDesa}
                    </Button>
                  </Link>
                )}
                <Button size="sm" onClick={() => setDetailItem(null)}>
                  Tutup
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* CONFIRM DELETE DIALOG */}
      <AlertDialog open={!!deleteItem} onOpenChange={(open) => !open && setDeleteItem(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-condensed font-extrabold text-red-600">
              Hapus Data Persil?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs">
              Apakah Anda yakin ingin menghapus Persil <strong>{deleteItem?.nomorPersil}</strong> atas nama{' '}
              <strong>{deleteItem?.pemilikNama}</strong>? Data yang dihapus tidak dapat dipulihkan kembali.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} className="bg-red-600 hover:bg-red-700 text-white">
              Hapus Permanen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
