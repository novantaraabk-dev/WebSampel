'use client';

import React, { useState, useMemo, useRef } from 'react';
import {
  Search,
  Plus,
  Download,
  Upload,
  FileSpreadsheet,
  Edit2,
  Trash2,
  Loader2,
  RefreshCw,
  Tag,
  CheckCircle2,
  AlertCircle,
  FileDown,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  writeBatch,
  getDocs,
  query,
  where,
  serverTimestamp,
} from 'firebase/firestore';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
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
import { KlasifikasiSuratItem } from '@/lib/types';
import {
  SEED_KLASIFIKASI_SURAT,
  DAFTAR_KLASIFIKASI_POKOK,
} from '@/lib/klasifikasi-surat-data';
import { cn } from '@/lib/utils';

export function KodeKlasifikasiTab() {
  const firestore = useFirestore();
  const { toast } = useToast();

  const [searchQuery, setSearchQuery] = useState('');
  // Default kosong agar irit kuota: tabel hanya diisi jika filter klasifikasi dipilih
  const [filterPokok, setFilterPokok] = useState<string>('');
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [isDeletingAll, setIsDeletingAll] = useState(false);

  // Status jika user telah membersihkan/menghapus semua data
  const [isCleared, setIsCleared] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('klasifikasi_surat_cleared') === 'true';
    }
    return false;
  });

  // Firestore query: IRIT KUOTA FIRESTORE
  // Hanya query jika filterPokok dipilih. Jika belum dipilih, query bernilai null (0 READ).
  const klasifikasiQuery = useMemoFirebase(() => {
    if (!firestore || !filterPokok) return null;
    return query(
      collection(firestore, 'klasifikasi_surat'),
      where('klasifikasiPokok', '==', filterPokok)
    );
  }, [firestore, filterPokok]);

  const { data: firestoreData, isLoading } = useCollection<KlasifikasiSuratItem>(klasifikasiQuery);

  // Jika belum memilih filterPokok, kosongkan list!
  // Jika difilter, ambil dari firestoreData atau fallback seed per kategori tersebut
  const klasifikasiList: KlasifikasiSuratItem[] = useMemo(() => {
    if (!filterPokok) {
      return [];
    }
    if (firestoreData && firestoreData.length > 0) {
      return firestoreData;
    }
    if (isCleared) {
      return [];
    }
    return SEED_KLASIFIKASI_SURAT.filter((item) => item.klasifikasiPokok === filterPokok);
  }, [filterPokok, firestoreData, isCleared]);

  // Filtered List berdasarkan pencarian teks dalam kategori yang sedang aktif
  const filteredList = useMemo(() => {
    if (!filterPokok) return [];

    if (!searchQuery.trim()) return klasifikasiList;
    const q = searchQuery.toLowerCase();
    return klasifikasiList.filter((item) => {
      return (
        (item.kode || '').toLowerCase().includes(q) ||
        (item.klasifikasiPokok || '').toLowerCase().includes(q) ||
        (item.uraian || '').toLowerCase().includes(q) ||
        (item.keterangan || '').toLowerCase().includes(q)
      );
    });
  }, [filterPokok, klasifikasiList, searchQuery]);

  // Modal Tambah / Edit
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<KlasifikasiSuratItem | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState({
    klasifikasiPokok: '',
    kode: '',
    uraian: '',
    keterangan: '',
  });

  const handleOpenAdd = () => {
    setEditingItem(null);
    setFormData({
      klasifikasiPokok: filterPokok || DAFTAR_KLASIFIKASI_POKOK[0],
      kode: '',
      uraian: '',
      keterangan: '',
    });
    setIsFormModalOpen(true);
  };

  const handleOpenEdit = (item: KlasifikasiSuratItem) => {
    setEditingItem(item);
    setFormData({
      klasifikasiPokok: item.klasifikasiPokok || '',
      kode: item.kode || '',
      uraian: item.uraian || '',
      keterangan: item.keterangan || '',
    });
    setIsFormModalOpen(true);
  };

  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firestore) return;

    if (!formData.kode.trim() || !formData.uraian.trim()) {
      toast({
        title: 'Form Belum Lengkap',
        description: 'Kode dan Uraian klasifikasi wajib diisi.',
        variant: 'destructive',
      });
      return;
    }

    setIsSaving(true);
    try {
      const id = editingItem ? editingItem.id : `klas_${formData.kode.trim().replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}`;
      const docRef = doc(firestore, 'klasifikasi_surat', id);

      const payload: KlasifikasiSuratItem = {
        id,
        klasifikasiPokok: formData.klasifikasiPokok.trim() || '000 UMUM',
        kode: formData.kode.trim(),
        uraian: formData.uraian.trim(),
        keterangan: formData.keterangan.trim(),
        updatedAt: new Date().toISOString(),
      };

      await setDoc(docRef, payload, { merge: true });
      setIsCleared(false);
      if (typeof window !== 'undefined') {
        localStorage.removeItem('klasifikasi_surat_cleared');
      }

      toast({
        title: editingItem ? 'Berhasil Diperbarui' : 'Berhasil Ditambahkan',
        description: `Kode klasifikasi ${payload.kode} telah disimpan.`,
      });

      setIsFormModalOpen(false);
    } catch (err: any) {
      console.error(err);
      toast({
        title: 'Gagal Menyimpan',
        description: err?.message || 'Terjadi kesalahan saat menyimpan ke database.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteItem = async (id: string, kode: string) => {
    if (!firestore) return;
    if (!confirm(`Hapus kode klasifikasi "${kode}" dari database?`)) return;

    try {
      await deleteDoc(doc(firestore, 'klasifikasi_surat', id));
      toast({
        title: 'Berhasil Dihapus',
        description: `Kode klasifikasi ${kode} telah dihapus.`,
      });
    } catch (err: any) {
      toast({
        title: 'Gagal Menghapus',
        description: err?.message,
        variant: 'destructive',
      });
    }
  };

  // Hapus Seluruh Data Klasifikasi
  const handleDeleteAll = async () => {
    if (!firestore) return;
    setIsDeletingAll(true);
    try {
      const colRef = collection(firestore, 'klasifikasi_surat');
      const snap = await getDocs(colRef);
      if (!snap.empty) {
        const docs = snap.docs;
        for (let i = 0; i < docs.length; i += 400) {
          const batch = writeBatch(firestore);
          const chunk = docs.slice(i, i + 400);
          chunk.forEach((d) => batch.delete(d.ref));
          await batch.commit();
        }
      }
      setIsCleared(true);
      if (typeof window !== 'undefined') {
        localStorage.setItem('klasifikasi_surat_cleared', 'true');
      }
      toast({
        title: 'Berhasil Menghapus Semua Data',
        description: 'Seluruh data kode klasifikasi surat telah berhasil dihapus.',
      });
      setIsAlertOpen(false);
    } catch (err: any) {
      console.error(err);
      toast({
        title: 'Gagal Menghapus Semua Data',
        description: err?.message || 'Terjadi kesalahan sistem saat menghapus data.',
        variant: 'destructive',
      });
    } finally {
      setIsDeletingAll(false);
    }
  };

  // Unduh Template Excel
  const handleDownloadTemplate = () => {
    try {
      const templateData = [
        {
          klasifikasi_pokok: '100 PEMERINTAHAN',
          kode: '140',
          uraian: 'Pemerintahan Desa / Kelurahan',
          keterangan: 'Penyelenggaraan tata praja dan birokrasi desa',
        },
        {
          klasifikasi_pokok: '400 KESEJAHTERAAN RAKYAT',
          kode: '440',
          uraian: 'Kesejahteraan Sosial',
          keterangan: 'Bansos dan intervensi kemiskinan',
        },
        {
          klasifikasi_pokok: '900 KEUANGAN',
          kode: '910',
          uraian: 'APBDes',
          keterangan: 'Anggaran pendapatan dan belanja desa',
        },
      ];

      const ws = XLSX.utils.json_to_sheet(templateData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Template_Klasifikasi');
      XLSX.writeFile(wb, 'Template_Kode_Klasifikasi_Surat.xlsx');

      toast({
        title: 'Template Diunduh',
        description: 'Template Excel untuk kode klasifikasi berhasil diunduh.',
      });
    } catch (err: any) {
      toast({
        title: 'Gagal Mengunduh Template',
        description: err?.message,
        variant: 'destructive',
      });
    }
  };

  // Ekspor Excel
  const handleExportExcel = () => {
    if (filteredList.length === 0) {
      toast({
        title: 'Tidak Ada Data untuk Diekspor',
        description: 'Silakan pilih Klasifikasi Pokok terlebih dahulu untuk mengekspor data.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const exportRows = filteredList.map((item, idx) => ({
        No: idx + 1,
        'KLASIFIKASI POKOK': item.klasifikasiPokok,
        KODE: item.kode,
        URAIAN: item.uraian,
        KETERANGAN: item.keterangan || '-',
      }));

      const ws = XLSX.utils.json_to_sheet(exportRows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Kode_Klasifikasi');
      XLSX.writeFile(wb, `Data_Kode_Klasifikasi_Surat_${new Date().toISOString().split('T')[0]}.xlsx`);

      toast({
        title: 'Ekspor Berhasil',
        description: `Berhasil mengekspor ${exportRows.length} data kode klasifikasi ke Excel.`,
      });
    } catch (err: any) {
      toast({
        title: 'Gagal Mengekspor',
        description: err?.message,
        variant: 'destructive',
      });
    }
  };

  // Impor File Excel
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importPreviewData, setImportPreviewData] = useState<KlasifikasiSuratItem[]>([]);
  const [isImporting, setIsImporting] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsName = wb.SheetNames[0];
        const ws = wb.Sheets[wsName];
        const rawJson: any[] = XLSX.utils.sheet_to_json(ws);

        if (!rawJson || rawJson.length === 0) {
          toast({
            title: 'File Kosong',
            description: 'Tidak ada baris data dalam lembar kerja Excel tersebut.',
            variant: 'destructive',
          });
          return;
        }

        const parsed: KlasifikasiSuratItem[] = rawJson.map((row, idx) => {
          const normalized: Record<string, any> = {};
          Object.keys(row).forEach((k) => {
            const cleanKey = k.trim().toLowerCase().replace(/[\s\-\/\.]+/g, '_');
            normalized[cleanKey] = row[k];
          });

          const kode = String(normalized.kode || normalized.code || '').trim();
          const klasifikasiPokok = String(
            normalized.klasifikasi_pokok ||
            normalized.klasifikasi ||
            normalized.pokok ||
            '000 UMUM'
          ).trim();
          const uraian = String(normalized.uraian || normalized.nama || normalized.deskripsi || '').trim();
          const keterangan = String(normalized.keterangan || normalized.ket || '').trim();

          return {
            id: `klas_${kode || Date.now()}_${idx}`,
            klasifikasiPokok: klasifikasiPokok || '000 UMUM',
            kode: kode || `KODE-${idx + 1}`,
            uraian: uraian || '-',
            keterangan: keterangan || '',
            updatedAt: new Date().toISOString(),
          };
        });

        setImportPreviewData(parsed);
        setIsImportModalOpen(true);
      } catch (err: any) {
        console.error(err);
        toast({
          title: 'Gagal Membaca File Excel',
          description: err?.message,
          variant: 'destructive',
        });
      } finally {
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleCommitImport = async () => {
    if (!firestore || importPreviewData.length === 0) return;

    setIsImporting(true);
    try {
      const batch = writeBatch(firestore);
      importPreviewData.forEach((item) => {
        const docRef = doc(firestore, 'klasifikasi_surat', item.id);
        batch.set(docRef, item, { merge: true });
      });

      await batch.commit();
      setIsCleared(false);
      if (typeof window !== 'undefined') {
        localStorage.removeItem('klasifikasi_surat_cleared');
      }

      toast({
        title: 'Impor Berhasil',
        description: `Berhasil menyimpan ${importPreviewData.length} data kode klasifikasi.`,
      });

      setIsImportModalOpen(false);
      setImportPreviewData([]);
    } catch (err: any) {
      console.error(err);
      toast({
        title: 'Gagal Mengimpor Data',
        description: err?.message,
        variant: 'destructive',
      });
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="neu-card-elevated rounded-[28px] p-4 sm:p-6 border border-white/60 space-y-5 w-full max-w-full overflow-hidden">
      {/* Header Bar */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 border-b border-stone-200 dark:border-white/10 pb-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-base sm:text-lg font-condensed font-bold uppercase text-slate-900 dark:text-white flex items-center gap-2">
              <Tag className="h-5 w-5 text-emerald-600" />
              Kode Klasifikasi Surat Resmi
            </h3>
            <Badge className="neu-btn-dark text-teal-400 text-[10px] font-bold font-mono px-2 py-0.5">
              {filterPokok ? `${filteredList.length} Kode (${filterPokok})` : 'Pilih Klasifikasi Pokok'}
            </Badge>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
            Standar kode klasifikasi naskah dinas dan tata kearsipan persuratan desa sesuai pedoman perundangan.
          </p>
        </div>

        {/* Action Toolbar */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <Button
            onClick={() => setIsAlertOpen(true)}
            variant="outline"
            size="sm"
            className="neu-card-elevated border border-rose-300 dark:border-rose-900/50 rounded-xl text-xs font-bold gap-1.5 text-rose-700 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 h-9 px-3"
          >
            <Trash2 className="h-3.5 w-3.5 text-rose-600" />
            <span>Hapus Semua Data</span>
          </Button>

          <Button
            onClick={handleDownloadTemplate}
            variant="outline"
            size="sm"
            className="neu-card-elevated border border-stone-300 dark:border-white/10 rounded-xl text-xs font-bold gap-1.5 text-slate-700 dark:text-slate-200 h-9 px-3"
          >
            <Download className="h-3.5 w-3.5 text-emerald-600" />
            <span className="hidden sm:inline">Unduh Template</span>
          </Button>

          <Button
            onClick={handleExportExcel}
            variant="outline"
            size="sm"
            className="neu-card-elevated border border-stone-300 dark:border-white/10 rounded-xl text-xs font-bold gap-1.5 text-slate-700 dark:text-slate-200 h-9 px-3"
          >
            <FileDown className="h-3.5 w-3.5 text-blue-600" />
            <span>Ekspor Excel</span>
          </Button>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".xlsx, .xls, .csv"
            className="hidden"
          />

          <Button
            onClick={() => fileInputRef.current?.click()}
            variant="outline"
            size="sm"
            className="neu-card-elevated border border-stone-300 dark:border-white/10 rounded-xl text-xs font-bold gap-1.5 text-slate-700 dark:text-slate-200 h-9 px-3"
          >
            <Upload className="h-3.5 w-3.5 text-amber-600" />
            <span>Impor Excel</span>
          </Button>

          <Button
            onClick={handleOpenAdd}
            size="sm"
            className="neu-btn-dark text-teal-400 font-bold text-xs rounded-xl h-9 px-4 gap-1.5 border border-white/10 shadow-sm"
          >
            <Plus className="h-3.5 w-3.5 text-teal-400" />
            <span>Tambah Kode</span>
          </Button>
        </div>
      </div>

      {/* Filter & Pencarian Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 rounded-2xl neu-inset bg-stone-200/40 dark:bg-stone-800/40 border border-stone-300/40 w-full max-w-full">
        <div className="flex flex-1 flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[200px] sm:min-w-[260px]">
            <Search className="h-4 w-4 absolute left-3 top-2.5 text-slate-500" />
            <Input
              type="text"
              placeholder={filterPokok ? `Cari kode atau uraian dalam ${filterPokok}...` : "Pilih klasifikasi terlebih dahulu..."}
              value={searchQuery}
              disabled={!filterPokok}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-3 h-9 rounded-xl neu-card-elevated border border-stone-300/60 dark:border-white/10 text-xs font-medium disabled:opacity-60 w-full"
            />
          </div>

          <div className="w-full sm:w-[260px] shrink-0">
            <Select
              value={filterPokok || 'none'}
              onValueChange={(val) => {
                if (val === 'none') {
                  setFilterPokok('');
                } else {
                  setFilterPokok(val);
                }
              }}
            >
              <SelectTrigger className="w-full h-9 rounded-xl neu-card-elevated border border-stone-300/60 dark:border-white/10 text-xs font-bold truncate">
                <SelectValue placeholder="— Pilih Klasifikasi Pokok —" />
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-[#081d27] dark:bg-stone-900 rounded-xl shadow-xl border">
                <SelectItem value="none" className="text-slate-500 italic">
                  — Kosongkan / Belum Dipilih —
                </SelectItem>
                {DAFTAR_KLASIFIKASI_POKOK.map((pokok) => (
                  <SelectItem key={pokok} value={pokok} className="font-medium text-xs">
                    {pokok}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {(searchQuery || filterPokok) && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setSearchQuery('');
                setFilterPokok('');
              }}
              className="h-9 px-3 rounded-xl neu-card-elevated border border-stone-300 dark:border-white/10 text-xs font-bold gap-1 text-slate-700 dark:text-slate-300 hover:text-slate-900 shrink-0"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Reset Filter</span>
            </Button>
          )}
        </div>
      </div>

      {/* Tabel Rincian Kode Klasifikasi */}
      <div className="overflow-x-auto rounded-2xl border border-stone-200 dark:border-white/10 neu-inset w-full">
        <table className="w-full text-left text-xs text-slate-800 dark:text-slate-200">
          <thead className="bg-stone-200/60 dark:bg-stone-800/60 text-slate-900 dark:text-white uppercase font-condensed font-bold tracking-wider text-[11px] border-b border-stone-300 dark:border-white/10">
            <tr>
              <th className="py-3 px-3.5 text-center w-12">No</th>
              <th className="py-3 px-3.5">Klasifikasi Pokok</th>
              <th className="py-3 px-3.5 text-center">Kode</th>
              <th className="py-3 px-3.5">Uraian</th>
              <th className="py-3 px-3.5">Keterangan</th>
              <th className="py-3 px-3.5 text-center w-24">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-200 dark:divide-white/10">
            {!filterPokok ? (
              <tr>
                <td colSpan={6} className="py-14 text-center">
                  <div className="flex flex-col items-center justify-center gap-3 max-w-md mx-auto text-slate-500 dark:text-slate-400">
                    <div className="h-12 w-12 rounded-2xl bg-amber-500/15 dark:bg-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-400 border border-amber-500/30 shadow-sm">
                      <Tag className="h-6 w-6" />
                    </div>
                    <div className="space-y-1 text-center">
                      <p className="font-condensed font-bold text-sm uppercase text-slate-900 dark:text-white tracking-wide">
                        Pilih Klasifikasi Pokok Terlebih Dahulu
                      </p>
                      <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                        Isian tabel dikosongkan untuk menghemat kuota Firestore. Silakan pilih salah satu Klasifikasi Pokok pada menu dropdown di atas (contoh: <span className="font-semibold text-slate-800 dark:text-slate-200">000 UMUM</span>, <span className="font-semibold text-slate-800 dark:text-slate-200">100 PEMERINTAHAN</span>, dll) untuk memuat rincian kode.
                      </p>
                    </div>
                  </div>
                </td>
              </tr>
            ) : isLoading ? (
              <tr>
                <td colSpan={6} className="py-10 text-center text-slate-500">
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin text-emerald-600" />
                    <span>Memuat data klasifikasi {filterPokok}...</span>
                  </div>
                </td>
              </tr>
            ) : filteredList.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-10 text-center text-slate-500 italic">
                  Belum ada data kode klasifikasi yang terdaftar untuk {filterPokok}.
                </td>
              </tr>
            ) : (
              filteredList.map((item, idx) => (
                <tr key={item.id || idx} className="hover:bg-white/40 dark:hover:bg-white/5 transition-colors">
                  <td className="py-2.5 px-3.5 text-center font-bold text-slate-500 text-[11px]">
                    {idx + 1}
                  </td>
                  <td className="py-2.5 px-3.5">
                    <Badge variant="outline" className="font-bold text-[10px] px-2 py-0.5 border-emerald-500/30 text-emerald-800 dark:text-emerald-300 bg-emerald-500/10">
                      {item.klasifikasiPokok}
                    </Badge>
                  </td>
                  <td className="py-2.5 px-3.5 text-center">
                    <span className="font-mono font-black text-xs text-slate-900 dark:text-white bg-stone-200/50 dark:bg-stone-800/60 px-2 py-0.5 rounded border border-stone-300/40">
                      {item.kode}
                    </span>
                  </td>
                  <td className="py-2.5 px-3.5 font-bold text-slate-900 dark:text-white">
                    {item.uraian}
                  </td>
                  <td className="py-2.5 px-3.5 text-slate-600 dark:text-slate-400 text-[11px] leading-relaxed">
                    {item.keterangan || '-'}
                  </td>
                  <td className="py-2.5 px-3.5 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleOpenEdit(item)}
                        className="h-7 w-7 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-500/10"
                        title="Edit Klasifikasi"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeleteItem(item.id, item.kode)}
                        className="h-7 w-7 p-0 text-red-600 hover:text-red-700 hover:bg-red-500/10"
                        title="Hapus Klasifikasi"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Form Tambah / Edit */}
      <Dialog open={isFormModalOpen} onOpenChange={setIsFormModalOpen}>
        <DialogContent className="max-w-md bg-white dark:bg-[#081d27] dark:bg-stone-900 rounded-[28px] border border-stone-300 dark:border-white/10 shadow-2xl p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-condensed font-bold uppercase text-slate-900 dark:text-white flex items-center gap-2">
              <Tag className="h-5 w-5 text-emerald-600" />
              <span>{editingItem ? 'Edit Kode Klasifikasi' : 'Tambah Kode Klasifikasi'}</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-600 dark:text-slate-400">
              Isi data klasifikasi pokok, kode surat resmi, uraian, dan keterangan pedoman persuratan.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveItem} className="space-y-4 my-2 text-xs">
            <div className="space-y-1.5">
              <Label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                Klasifikasi Pokok <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.klasifikasiPokok}
                onValueChange={(val) => setFormData({ ...formData, klasifikasiPokok: val })}
              >
                <SelectTrigger className="h-9 rounded-xl neu-card-elevated border border-stone-300/60 dark:border-white/10 text-xs font-bold">
                  <SelectValue placeholder="Pilih Klasifikasi Pokok" />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-[#081d27] dark:bg-stone-900 rounded-xl shadow-xl border">
                  {DAFTAR_KLASIFIKASI_POKOK.map((pokok) => (
                    <SelectItem key={pokok} value={pokok} className="text-xs font-medium">
                      {pokok}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                Kode Surat <span className="text-red-500">*</span>
              </Label>
              <Input
                type="text"
                placeholder="misal: 140 atau 005 atau 910"
                value={formData.kode}
                onChange={(e) => setFormData({ ...formData, kode: e.target.value })}
                className="h-9 rounded-xl neu-card-elevated border border-stone-300/60 dark:border-white/10 text-xs font-mono font-bold"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                Uraian / Judul Klasifikasi <span className="text-red-500">*</span>
              </Label>
              <Input
                type="text"
                placeholder="misal: Pemerintahan Desa / Kelurahan"
                value={formData.uraian}
                onChange={(e) => setFormData({ ...formData, uraian: e.target.value })}
                className="h-9 rounded-xl neu-card-elevated border border-stone-300/60 dark:border-white/10 text-xs font-medium"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                Keterangan / Ruang Lingkup
              </Label>
              <Input
                type="text"
                placeholder="misal: Pengelolaan administrasi regulasi desa dan pamong"
                value={formData.keterangan}
                onChange={(e) => setFormData({ ...formData, keterangan: e.target.value })}
                className="h-9 rounded-xl neu-card-elevated border border-stone-300/60 dark:border-white/10 text-xs font-medium"
              />
            </div>

            <DialogFooter className="pt-2 gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                disabled={isSaving}
                onClick={() => setIsFormModalOpen(false)}
                className="neu-card-elevated rounded-xl text-xs h-9"
              >
                Batal
              </Button>
              <Button
                type="submit"
                disabled={isSaving}
                className="neu-btn-dark text-teal-400 font-bold text-xs rounded-xl h-9 px-5 gap-1.5"
              >
                {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                <span>Simpan Klasifikasi</span>
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal Preview Impor Excel */}
      <Dialog open={isImportModalOpen} onOpenChange={setIsImportModalOpen}>
        <DialogContent className="max-w-2xl bg-white dark:bg-[#081d27] dark:bg-stone-900 rounded-[28px] border border-stone-300 dark:border-white/10 shadow-2xl p-6">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg font-condensed font-bold uppercase text-slate-900 dark:text-white flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5 text-emerald-600" />
              <span>Verifikasi Berkas Impor Kode Klasifikasi</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-600 dark:text-slate-400">
              Periksa ringkasan baris kode klasifikasi sebelum ditulis ke database Firestore.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 my-2 text-xs">
            <p className="font-bold text-slate-900 dark:text-white">
              Total Baris Terbaca: <span className="font-mono text-emerald-700">{importPreviewData.length} baris</span>
            </p>

            <div className="max-h-60 overflow-y-auto rounded-xl border border-stone-300 dark:border-white/10 neu-inset p-2">
              <table className="w-full text-left text-xs">
                <thead className="bg-stone-200/50 dark:bg-stone-800/50 text-[10px] uppercase font-bold">
                  <tr>
                    <th className="p-1.5">No</th>
                    <th className="p-1.5">Klasifikasi Pokok</th>
                    <th className="p-1.5">Kode</th>
                    <th className="p-1.5">Uraian</th>
                    <th className="p-1.5">Keterangan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-200 dark:divide-white/10">
                  {importPreviewData.slice(0, 15).map((row, idx) => (
                    <tr key={idx}>
                      <td className="p-1.5 font-bold text-slate-500">{idx + 1}</td>
                      <td className="p-1.5">{row.klasifikasiPokok}</td>
                      <td className="p-1.5 font-mono font-bold">{row.kode}</td>
                      <td className="p-1.5 font-medium">{row.uraian}</td>
                      <td className="p-1.5 text-slate-500">{row.keterangan || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {importPreviewData.length > 15 && (
                <p className="text-[11px] text-center text-slate-500 mt-2 italic">
                  ... dan {importPreviewData.length - 15} baris lainnya.
                </p>
              )}
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              disabled={isImporting}
              onClick={() => setIsImportModalOpen(false)}
              className="neu-card-elevated rounded-xl text-xs h-9"
            >
              Batal
            </Button>
            <Button
              type="button"
              disabled={isImporting}
              onClick={handleCommitImport}
              className="neu-btn-dark text-teal-400 font-bold text-xs rounded-xl h-9 px-5 gap-2"
            >
              {isImporting ? <Loader2 className="h-4 w-4 animate-spin text-teal-400" /> : <Upload className="h-4 w-4 text-teal-400" />}
              <span>Simpan ke Database ({importPreviewData.length} Data)</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Notif Konfirmasi Hapus Semua Data */}
      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent className="neu-card-elevated rounded-2xl border border-stone-300 dark:border-white/10 max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base font-condensed font-bold uppercase text-slate-900 dark:text-white flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-rose-600" />
              Konfirmasi Hapus Semua Data
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed pt-1">
              Apakah Anda yakin akan menghapus semua data? Tindakan ini akan menghapus seluruh data kode klasifikasi yang tersimpan di database.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-0 mt-4">
            <AlertDialogCancel
              disabled={isDeletingAll}
              className="neu-card-elevated rounded-xl text-xs h-9 font-bold text-slate-700 dark:text-slate-300"
            >
              Tidak
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleDeleteAll();
              }}
              disabled={isDeletingAll}
              className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl h-9 px-4 gap-2 border-0 shadow-md"
            >
              {isDeletingAll ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-white" />
                  <span>Menghapus...</span>
                </>
              ) : (
                <>
                  <Trash2 className="h-3.5 w-3.5 text-white" />
                  <span>Ya, Hapus Semua Data</span>
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
