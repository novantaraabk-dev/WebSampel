'use client';

import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { uploadToCloudinary } from '@/lib/upload-cloudinary';
import { generatePembangunanRedaksiAI } from '@/lib/gemini-client';
import { PembangunanDesa } from '@/lib/types';
import {
  Plus,
  Trash2,
  Edit3,
  Upload,
  Sparkles,
  Loader2,
  Image as ImageIcon,
  X,
  Search,
  Calendar,
  MapPin,
  Coins,
  Layers,
  CheckCircle2,
  Clock,
  AlertCircle,
  Eye,
  Check,
  ChevronRight,
  HardHat,
  Filter
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';

const SUMBER_DANA_OPTIONS = [
  'Dana Desa (DD)',
  'Alokasi Dana Desa (ADD)',
  'Bantuan Keuangan Provinsi Jawa Tengah',
  'Bantuan Keuangan Kabupaten Cilacap',
  'Pendapatan Asli Desa (PADes)',
  'Bagi Hasil Pajak & Retribusi (BHPR)',
  'Swadaya / Partisipasi Masyarakat',
];

const STATUS_OPTIONS = [
  { value: 'selesai', label: 'Selesai (100%)', color: 'bg-emerald-500 text-white' },
  { value: 'berjalan', label: 'Sedang Berjalan', color: 'bg-amber-500 text-white' },
  { value: 'perencanaan', label: 'Tahap Perencanaan', color: 'bg-blue-500 text-white' },
];

export function TransparansiPembangunanTab({ selectedYear }: { selectedYear: number }) {
  const firestore = useFirestore();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // States
  const [filterYear, setFilterYear] = useState<number>(selectedYear);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedDetail, setSelectedDetail] = useState<PembangunanDesa | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    judul: '',
    lokasi: '',
    volume: '',
    anggaran: '',
    sumberAnggaran: 'Dana Desa (DD)',
    tahun: selectedYear,
    status: 'selesai' as 'perencanaan' | 'berjalan' | 'selesai',
    pelaksana: 'Tim Pelaksana Kegiatan (TPK) Desa Sampeldes',
    tanggal: new Date().toISOString().split('T')[0],
    redaksi: '',
    fotoUrls: [] as string[],
  });

  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string>('');
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Firestore Query
  const pembangunanQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'transparansiPembangunan'), orderBy('tahun', 'desc'));
  }, [firestore]);

  const { data: rawPembangunanList, isLoading } = useCollection<PembangunanDesa>(pembangunanQuery);

  // Filtered List
  const filteredList = (rawPembangunanList || []).filter(item => {
    const matchYear = Number(item.tahun) === Number(filterYear);
    const q = searchQuery.toLowerCase().trim();
    if (!q) return matchYear;
    return matchYear && (
      item.judul?.toLowerCase().includes(q) ||
      item.lokasi?.toLowerCase().includes(q) ||
      item.sumberAnggaran?.toLowerCase().includes(q)
    );
  });

  // Format Currency
  const formatRupiah = (val: number | string) => {
    const num = typeof val === 'number' ? val : parseFloat(String(val).replace(/[^0-9]/g, '')) || 0;
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(num);
  };

  // Reset Form
  const resetForm = () => {
    setFormData({
      judul: '',
      lokasi: '',
      volume: '',
      anggaran: '',
      sumberAnggaran: 'Dana Desa (DD)',
      tahun: filterYear,
      status: 'selesai',
      pelaksana: 'Tim Pelaksana Kegiatan (TPK) Desa Sampeldes',
      tanggal: new Date().toISOString().split('T')[0],
      redaksi: '',
      fotoUrls: [],
    });
    setEditingId(null);
  };

  // Open Add Dialog
  const handleOpenAdd = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  // Open Edit Dialog
  const handleOpenEdit = (item: PembangunanDesa) => {
    setEditingId(item.id || null);
    setFormData({
      judul: item.judul || '',
      lokasi: item.lokasi || '',
      volume: item.volume || '',
      anggaran: String(item.anggaran || ''),
      sumberAnggaran: item.sumberAnggaran || 'Dana Desa (DD)',
      tahun: Number(item.tahun) || filterYear,
      status: item.status || 'selesai',
      pelaksana: item.pelaksana || 'Tim Pelaksana Kegiatan (TPK) Desa Sampeldes',
      tanggal: item.tanggal || new Date().toISOString().split('T')[0],
      redaksi: item.redaksi || '',
      fotoUrls: Array.isArray(item.fotoUrls) ? item.fotoUrls : (item.fotoUrl ? [item.fotoUrl] : []),
    });
    setIsDialogOpen(true);
  };

  // Multiple Photo Upload
  const handleMultiFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    const newUrls: string[] = [];
    const total = files.length;

    try {
      for (let i = 0; i < total; i++) {
        setUploadProgress(`Mengunggah foto ${i + 1} dari ${total}...`);
        const url = await uploadToCloudinary(files[i], 'transparansi_pembangunan');
        if (url) newUrls.push(url);
      }

      setFormData(prev => ({
        ...prev,
        fotoUrls: [...prev.fotoUrls, ...newUrls]
      }));

      toast({
        title: 'Foto Berhasil Diunggah',
        description: `${newUrls.length} foto dokumentasi pembangunan berhasil disimpan.`,
      });
    } catch (err: any) {
      console.error('Upload error:', err);
      toast({
        title: 'Unggah Gagal',
        description: err.message || 'Terjadi kesalahan saat mengunggah foto.',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
      setUploadProgress('');
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Remove Photo
  const handleRemovePhoto = (index: number) => {
    setFormData(prev => ({
      ...prev,
      fotoUrls: prev.fotoUrls.filter((_, i) => i !== index)
    }));
  };

  // Tanya AI / Generate Redaksi
  const handleAskAI = async () => {
    if (!formData.judul.trim()) {
      toast({
        title: 'Isi Judul Pembangunan Terlebih Dahulu',
        description: 'AI membutuhkan Judul Pembangunan untuk menyusun narasi kegiatan yang akurat.',
        variant: 'destructive',
      });
      return;
    }

    setIsGeneratingAI(true);
    try {
      const generatedText = await generatePembangunanRedaksiAI({
        judul: formData.judul,
        lokasi: formData.lokasi,
        volume: formData.volume,
        anggaran: formData.anggaran,
        sumberAnggaran: formData.sumberAnggaran,
        tahun: formData.tahun,
        pelaksana: formData.pelaksana,
        catatanTambahan: formData.redaksi,
      });

      setFormData(prev => ({
        ...prev,
        redaksi: generatedText
      }));

      toast({
        title: 'Redaksi Berhasil Disusun oleh AI',
        description: 'Teks narasi berita transparansi pembangunan berhasil dibuat. Anda dapat menyuntingnya kembali.',
      });
    } catch (err: any) {
      console.error('AI Error:', err);
      toast({
        title: 'Gagal Memproses AI',
        description: err.message || 'Terjadi kendala saat menghubungi AI. Silakan coba kembali.',
        variant: 'destructive',
      });
    } finally {
      setIsGeneratingAI(false);
    }
  };

  // Save / Submit to Firestore
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firestore) return;

    if (!formData.judul.trim()) {
      toast({ title: 'Judul Wajib Diisi', variant: 'destructive' });
      return;
    }

    setIsSubmitting(true);
    try {
      const numericAnggaran = parseFloat(String(formData.anggaran).replace(/[^0-9]/g, '')) || 0;

      const payload = {
        judul: formData.judul.trim(),
        lokasi: formData.lokasi.trim(),
        volume: formData.volume.trim(),
        anggaran: numericAnggaran,
        sumberAnggaran: formData.sumberAnggaran,
        tahun: Number(formData.tahun),
        status: formData.status,
        pelaksana: formData.pelaksana.trim(),
        tanggal: formData.tanggal,
        redaksi: formData.redaksi.trim(),
        fotoUrls: formData.fotoUrls,
        fotoUrl: formData.fotoUrls[0] || '',
        updatedAt: serverTimestamp(),
      };

      if (editingId) {
        await updateDoc(doc(firestore, 'transparansiPembangunan', editingId), payload);
        toast({ title: 'Data Berhasil Diperbarui', description: 'Kegiatan pembangunan berhasil diupdate.' });
      } else {
        await addDoc(collection(firestore, 'transparansiPembangunan'), {
          ...payload,
          createdAt: serverTimestamp(),
        });
        toast({ title: 'Data Berhasil Ditambahkan', description: 'Kegiatan pembangunan baru berhasil disimpan.' });
      }

      setIsDialogOpen(false);
      resetForm();
    } catch (err: any) {
      console.error('Save error:', err);
      toast({
        title: 'Gagal Menyimpan Data',
        description: err.message || 'Terjadi kendala saat menyimpan ke database.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete
  const handleDelete = async (id: string, judul: string) => {
    if (!firestore) return;
    if (!confirm(`Apakah Anda yakin ingin menghapus kegiatan pembangunan: "${judul}"?`)) return;

    try {
      await deleteDoc(doc(firestore, 'transparansiPembangunan', id));
      toast({ title: 'Data Berhasil Dihapus', description: `"${judul}" telah dihapus dari sistem.` });
    } catch (err: any) {
      toast({ title: 'Gagal Menghapus Data', description: err.message, variant: 'destructive' });
    }
  };

  // Calculations for KPI Cards
  const totalAnggaranTahun = filteredList.reduce((sum, item) => sum + (Number(item.anggaran) || 0), 0);
  const totalSelesai = filteredList.filter(item => item.status === 'selesai').length;

  return (
    <div className="space-y-6">
      {/* TOOLBAR ATAS: Filter & Tambah Baru */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-stone-200/80 shadow-xs">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Pilih Tahun Anggaran</span>
            <Select value={filterYear.toString()} onValueChange={v => setFilterYear(parseInt(v))}>
              <SelectTrigger className="w-36 h-9 rounded-xl font-bold text-xs bg-slate-50 border-slate-300">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 6 }, (_, i) => new Date().getFullYear() + 1 - i).map(year => (
                  <SelectItem key={year} value={year.toString()}>
                    Tahun {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1 flex-1 sm:w-64">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Pencarian Data</span>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <Input
                placeholder="Cari judul / lokasi / sumber dana..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-8 h-9 text-xs rounded-xl bg-slate-50 border-slate-300"
              />
            </div>
          </div>
        </div>

        <Button
          onClick={handleOpenAdd}
          className="rounded-xl gap-2 font-black uppercase tracking-wider bg-teal-600 hover:bg-teal-500 text-white h-10 px-4 shadow-sm self-start sm:self-end cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          <span>Tambah Kegiatan Pembangunan</span>
        </Button>
      </div>

      {/* KPI METRIC CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-200">
            <HardHat className="h-6 w-6" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase">Total Kegiatan ({filterYear})</span>
            <h4 className="text-xl font-black text-slate-900 font-condensed">{filteredList.length} Proyek</h4>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center border border-amber-200">
            <Coins className="h-6 w-6" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase">Total Alokasi Anggaran</span>
            <h4 className="text-base sm:text-lg font-black text-slate-900 font-condensed">{formatRupiah(totalAnggaranTahun)}</h4>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-sky-50 text-sky-700 flex items-center justify-center border border-sky-200">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase">Status Proyek Selesai</span>
            <h4 className="text-xl font-black text-slate-900 font-condensed">{totalSelesai} dari {filteredList.length} Selesai</h4>
          </div>
        </div>
      </div>

      {/* LIST DATA PEMBANGUNAN */}
      <Card className="rounded-2xl border-stone-200 shadow-sm overflow-hidden bg-white">
        <CardHeader className="p-4 sm:p-5 border-b bg-slate-50/60 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base font-black text-slate-900 uppercase font-condensed">
              Daftar Transparansi Pembangunan Tahun {filterYear}
            </CardTitle>
            <p className="text-xs text-slate-500 mt-0.5">
              Menampilkan {filteredList.length} kegiatan pembangunan desa beserta foto dokumentasi &amp; redaksi
            </p>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-3">
              {[1, 2, 3].map(i => (
                <Skeleton key={i} className="h-20 w-full rounded-xl bg-slate-100" />
              ))}
            </div>
          ) : filteredList.length === 0 ? (
            <div className="p-10 text-center space-y-2">
              <HardHat className="h-10 w-10 text-slate-300 mx-auto" />
              <p className="text-sm font-bold text-slate-700">Belum ada data pembangunan untuk tahun {filterYear}</p>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Klik tombol &quot;Tambah Kegiatan Pembangunan&quot; untuk menginput data, mengunggah foto, dan membuat redaksi berita dengan AI.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filteredList.map((item, idx) => {
                const photos = Array.isArray(item.fotoUrls) && item.fotoUrls.length > 0
                  ? item.fotoUrls
                  : (item.fotoUrl ? [item.fotoUrl] : []);

                return (
                  <div key={item.id || idx} className="p-4 sm:p-5 hover:bg-slate-50/70 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-start gap-4 flex-1">
                      {/* Photo Thumbnail */}
                      <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden bg-slate-100 shrink-0 border border-slate-200 flex items-center justify-center">
                        {photos[0] ? (
                          <img
                            src={photos[0]}
                            alt={item.judul}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <ImageIcon className="h-8 w-8 text-slate-300" />
                        )}
                        {photos.length > 1 && (
                          <span className="absolute bottom-1 right-1 bg-black/75 text-white text-[9.5px] font-mono px-1.5 py-0.5 rounded font-bold">
                            +{photos.length - 1} foto
                          </span>
                        )}
                      </div>

                      {/* Detail Info */}
                      <div className="space-y-1.5 min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge className="bg-emerald-600 text-white font-mono text-[10px] px-2 py-0.5 rounded-full">
                            {item.sumberAnggaran}
                          </Badge>
                          <Badge variant="outline" className="text-[10px] font-semibold border-slate-300">
                            {item.status === 'selesai' ? 'Selesai 100%' : item.status === 'berjalan' ? 'Sedang Berjalan' : 'Perencanaan'}
                          </Badge>
                          <span className="text-xs font-mono font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                            {formatRupiah(item.anggaran)}
                          </span>
                        </div>

                        <h4 className="font-condensed font-black text-base sm:text-lg text-slate-900 uppercase leading-snug line-clamp-1">
                          {item.judul}
                        </h4>

                        <div className="flex items-center gap-4 text-xs text-slate-600 flex-wrap">
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3.5 w-3.5 text-rose-500 shrink-0" />
                            <span className="truncate max-w-[200px]">{item.lokasi || '-'}</span>
                          </span>
                          <span className="flex items-center gap-1 font-mono">
                            <Layers className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                            <span>Vol: {item.volume || '-'}</span>
                          </span>
                          <span className="flex items-center gap-1 text-slate-400">
                            <Calendar className="h-3.5 w-3.5 shrink-0" />
                            <span>{item.tanggal || `${item.tahun}`}</span>
                          </span>
                        </div>

                        {item.redaksi && (
                          <p className="text-xs text-slate-500 line-clamp-2 mt-1">
                            {item.redaksi}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedDetail(item);
                          setIsDetailOpen(true);
                        }}
                        className="rounded-xl h-8 text-xs gap-1 border-slate-300 hover:bg-slate-100"
                        title="Lihat Pratinjau Berita & Galeri"
                      >
                        <Eye className="h-3.5 w-3.5 text-slate-600" />
                        <span>Pratinjau</span>
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleOpenEdit(item)}
                        className="rounded-xl h-8 text-xs gap-1 border-emerald-300 text-emerald-800 hover:bg-emerald-50"
                        title="Edit Data"
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                        <span>Edit</span>
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDelete(item.id!, item.judul)}
                        className="rounded-xl h-8 text-xs gap-1"
                        title="Hapus Data"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ─────────────────────────────────────────────────────────────
          MODAL DIALOG: INPUT / EDIT DATA PEMBANGUNAN
      ───────────────────────────────────────────────────────────── */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto rounded-3xl p-6 sm:p-8">
          <DialogHeader>
            <DialogTitle className="text-xl font-condensed font-black uppercase text-slate-900 flex items-center gap-2">
              <HardHat className="h-5 w-5 text-emerald-700" />
              {editingId ? 'Edit Data Transparansi Pembangunan' : 'Tambah Kegiatan Transparansi Pembangunan'}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Lengkapi informasi pembangunan desa, unggah dokumentasi foto (bisa lebih dari satu), dan gunakan AI untuk menyusun redaksi berita.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-5 mt-2">
            {/* Judul Pembangunan */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700 uppercase">
                Judul Pembangunan <span className="text-rose-500">*</span>
              </Label>
              <Input
                placeholder="Contoh: Pembangunan Rabat Beton Jalan Usaha Tani Dusun Pangampiran"
                value={formData.judul}
                onChange={e => setFormData({ ...formData, judul: e.target.value })}
                className="rounded-xl h-10 text-sm font-medium"
                required
              />
            </div>

            {/* Baris 1: Lokasi & Volume */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700 uppercase">
                  Lokasi Pembangunan <span className="text-rose-500">*</span>
                </Label>
                <Input
                  placeholder="Contoh: Dusun Pangampiran RT 03 / RW 01"
                  value={formData.lokasi}
                  onChange={e => setFormData({ ...formData, lokasi: e.target.value })}
                  className="rounded-xl h-10 text-sm"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700 uppercase">
                  Volume Pembangunan <span className="text-rose-500">*</span>
                </Label>
                <Input
                  placeholder="Contoh: P. 350 m x L. 2,5 m x T. 0,15 m"
                  value={formData.volume}
                  onChange={e => setFormData({ ...formData, volume: e.target.value })}
                  className="rounded-xl h-10 text-sm"
                  required
                />
              </div>
            </div>

            {/* Baris 2: Anggaran & Sumber Anggaran */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700 uppercase">
                  Besaran Anggaran (Rp) <span className="text-rose-500">*</span>
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs font-bold text-slate-400">Rp</span>
                  <Input
                    type="number"
                    placeholder="125000000"
                    value={formData.anggaran}
                    onChange={e => setFormData({ ...formData, anggaran: e.target.value })}
                    className="pl-9 rounded-xl h-10 text-sm font-mono font-bold"
                    required
                  />
                </div>
                {formData.anggaran && (
                  <span className="text-[11px] font-mono text-emerald-700 font-bold block">
                    {formatRupiah(formData.anggaran)}
                  </span>
                )}
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700 uppercase">
                  Sumber Anggaran <span className="text-rose-500">*</span>
                </Label>
                <Select
                  value={formData.sumberAnggaran}
                  onValueChange={v => setFormData({ ...formData, sumberAnggaran: v })}
                >
                  <SelectTrigger className="rounded-xl h-10 text-sm font-semibold">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SUMBER_DANA_OPTIONS.map(opt => (
                      <SelectItem key={opt} value={opt}>
                        {opt}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Baris 3: Tahun, Status, & Tanggal */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700 uppercase">Tahun Anggaran</Label>
                <Select
                  value={formData.tahun.toString()}
                  onValueChange={v => setFormData({ ...formData, tahun: parseInt(v) })}
                >
                  <SelectTrigger className="rounded-xl h-10 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 6 }, (_, i) => new Date().getFullYear() + 1 - i).map(year => (
                      <SelectItem key={year} value={year.toString()}>
                        Tahun {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700 uppercase">Status Pengerjaan</Label>
                <Select
                  value={formData.status}
                  onValueChange={(v: any) => setFormData({ ...formData, status: v })}
                >
                  <SelectTrigger className="rounded-xl h-10 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700 uppercase">Tanggal Dokumentasi</Label>
                <Input
                  type="date"
                  value={formData.tanggal}
                  onChange={e => setFormData({ ...formData, tanggal: e.target.value })}
                  className="rounded-xl h-10 text-sm"
                />
              </div>
            </div>

            {/* Baris 4: Tim Pelaksana Kegiatan (TPK) */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700 uppercase">Pelaksana Kegiatan</Label>
              <Input
                placeholder="Tim Pelaksana Kegiatan (TPK) Desa Sampeldes"
                value={formData.pelaksana}
                onChange={e => setFormData({ ...formData, pelaksana: e.target.value })}
                className="rounded-xl h-10 text-sm"
              />
            </div>

            {/* SEKSI: Upload Foto Dokumentasi (Bisa Lebih Dari Satu) */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-xs font-bold text-slate-800 uppercase flex items-center gap-1.5">
                    <ImageIcon className="h-4 w-4 text-emerald-700" />
                    <span>Foto Dokumentasi Pembangunan (Bisa Lebih Dari Satu)</span>
                  </Label>
                  <p className="text-[11px] text-slate-500">
                    Pilih satu atau beberapa file foto (JPG, PNG, WebP) dari lokasi proyek.
                  </p>
                </div>

                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={isUploading}
                  onClick={() => fileInputRef.current?.click()}
                  className="rounded-xl gap-1.5 text-xs font-bold border-emerald-600 text-emerald-800 hover:bg-emerald-50 cursor-pointer"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-emerald-600" />
                      <span>{uploadProgress || 'Mengunggah...'}</span>
                    </>
                  ) : (
                    <>
                      <Upload className="h-3.5 w-3.5" />
                      <span>Pilih Foto ({formData.fotoUrls.length})</span>
                    </>
                  )}
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleMultiFileUpload}
                  className="hidden"
                />
              </div>

              {/* Grid Preview Foto yang Sudah Diunggah */}
              {formData.fotoUrls.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-200">
                  {formData.fotoUrls.map((url, fIdx) => (
                    <div key={fIdx} className="relative group rounded-xl overflow-hidden aspect-video border border-slate-300 bg-white shadow-xs">
                      <img src={url} alt={`Foto ${fIdx + 1}`} className="w-full h-full object-cover" />
                      {fIdx === 0 && (
                        <span className="absolute top-1 left-1 bg-emerald-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow">
                          Foto Utama
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => handleRemovePhoto(fIdx)}
                        className="absolute top-1 right-1 bg-rose-600 text-white rounded-full p-1 opacity-90 hover:opacity-100 hover:scale-110 transition-all shadow-sm cursor-pointer"
                        title="Hapus foto ini"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-200 hover:border-emerald-500 rounded-2xl p-6 text-center cursor-pointer bg-slate-50/50 hover:bg-emerald-50/20 transition-colors"
                >
                  <Upload className="h-6 w-6 text-slate-400 mx-auto mb-1" />
                  <p className="text-xs font-bold text-slate-700">Klik di sini untuk mengunggah foto kegiatan</p>
                  <p className="text-[11px] text-slate-400">Dapat memilih multiple foto sekaligus</p>
                </div>
              )}
            </div>

            {/* SEKSI: Redaksi Kegiatan (Seperti Berita) + Tombol TANYA AI */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <Label className="text-xs font-bold text-slate-800 uppercase flex items-center gap-1.5">
                    <span>Redaksi Kegiatan Pembangunan (Format Berita Desa)</span>
                  </Label>
                  <p className="text-[11px] text-slate-500">
                    Narasi laporan berita transparan mengenai latar belakang, pelaksanaan, dan manfaat proyek bagi masyarakat.
                  </p>
                </div>

                {/* TOMBOL TANYA AI */}
                <Button
                  type="button"
                  size="sm"
                  disabled={isGeneratingAI}
                  onClick={handleAskAI}
                  className="rounded-xl gap-1.5 font-black text-xs uppercase tracking-wider bg-gradient-to-r from-purple-600 via-indigo-600 to-emerald-600 hover:opacity-90 text-white shadow-sm cursor-pointer self-start sm:self-auto shrink-0"
                >
                  {isGeneratingAI ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>Menyusun Berita...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-3.5 w-3.5 text-yellow-300" />
                      <span>Tanya AI / Tuliskan Berita</span>
                    </>
                  )}
                </Button>
              </div>

              <Textarea
                placeholder="Tuliskan redaksi kegiatan pembangunan atau klik tombol 'Tanya AI / Tuliskan Berita' di atas untuk otomatis dibuatkan draf berita komprehensif..."
                value={formData.redaksi}
                onChange={e => setFormData({ ...formData, redaksi: e.target.value })}
                rows={6}
                className="rounded-2xl text-xs sm:text-sm leading-relaxed p-3.5 border-slate-300 focus:border-emerald-500"
              />
            </div>

            <DialogFooter className="gap-2 pt-3 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
                className="rounded-xl text-xs font-bold"
              >
                Batal
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || isUploading}
                className="rounded-xl text-xs font-bold bg-teal-600 hover:bg-teal-500 text-white font-black uppercase tracking-wider"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
                    <span>Menyimpan...</span>
                  </>
                ) : (
                  <span>{editingId ? 'Simpan Perubahan' : 'Terbitkan Kegiatan'}</span>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ─────────────────────────────────────────────────────────────
          MODAL DETAIL / PRATINJAU KEGIATAN PEMBANGUNAN
      ───────────────────────────────────────────────────────────── */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto rounded-3xl p-6 sm:p-8">
          {selectedDetail && (
            <div className="space-y-5">
              <div>
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <Badge className="bg-emerald-600 text-white font-mono text-[10px]">
                    {selectedDetail.sumberAnggaran}
                  </Badge>
                  <Badge variant="outline" className="text-[10px] font-bold">
                    Tahun {selectedDetail.tahun}
                  </Badge>
                  <span className="text-xs font-mono font-bold text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded border border-amber-200">
                    {formatRupiah(selectedDetail.anggaran)}
                  </span>
                </div>
                <h3 className="text-xl sm:text-2xl font-condensed font-black uppercase text-slate-900 leading-tight">
                  {selectedDetail.judul}
                </h3>
                <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-1.5">
                  <MapPin className="h-3.5 w-3.5 text-rose-500 shrink-0" />
                  <span>{selectedDetail.lokasi}</span>
                  <span>&bull;</span>
                  <span>Volume: {selectedDetail.volume}</span>
                </p>
              </div>

              {/* Photo Gallery Grid */}
              {selectedDetail.fotoUrls && selectedDetail.fotoUrls.length > 0 && (
                <div className="space-y-2">
                  <span className="text-[11px] font-bold uppercase text-slate-500 tracking-wider">
                    Galeri Dokumentasi Lapangan ({selectedDetail.fotoUrls.length} Foto)
                  </span>
                  <div className="grid grid-cols-2 gap-2.5">
                    {selectedDetail.fotoUrls.map((url, pIdx) => (
                      <a
                        key={pIdx}
                        href={url}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-2xl overflow-hidden border border-slate-200 aspect-video group block"
                      >
                        <img
                          src={url}
                          alt={`${selectedDetail.judul} - ${pIdx + 1}`}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Redaksi Berita */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <span className="text-[11px] font-bold uppercase text-slate-500 tracking-wider">
                  Naskah Berita / Redaksi Kegiatan
                </span>
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                  {selectedDetail.redaksi || 'Belum ada redaksi kegiatan.'}
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <Button
                  onClick={() => setIsDetailOpen(false)}
                  className="rounded-xl font-bold text-xs"
                >
                  Tutup Pratinjau
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
