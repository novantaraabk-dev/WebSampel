'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
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
  FileCheck2,
  CheckCircle2,
  AlertCircle,
  FileDown,
  RotateCcw,
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
  serverTimestamp,
} from 'firebase/firestore';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
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
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import {
  PermohonanSuratItem,
  SEED_PERMOHONAN_SURAT,
} from '@/lib/permohonan-surat-data';

export function PengaturanPermohonanSuratTab() {
  const firestore = useFirestore();
  const { toast } = useToast();

  const [searchQuery, setSearchQuery] = useState('');
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [isDeletingAll, setIsDeletingAll] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);

  // Status jika user telah membersihkan/menghapus semua data
  const [isCleared, setIsCleared] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('permohonan_surat_cleared') === 'true';
    }
    return false;
  });

  // Query Firestore
  const permohonanQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'pengaturan_permohonan_surat');
  }, [firestore]);

  const { data: remoteData, isLoading } = useCollection<PermohonanSuratItem>(permohonanQuery);

  // Inisialisasi otomatis jika Firestore masih kosong atau ada template seed baru yang belum tersimpan
  const [hasSeeded, setHasSeeded] = useState(false);
  useEffect(() => {
    if (!firestore || isLoading || isCleared || hasSeeded) return;
    if (remoteData) {
      const dbIds = new Set(remoteData.map((d) => d.id));
      const missingItems = SEED_PERMOHONAN_SURAT.filter((s) => !dbIds.has(s.id));

      if (missingItems.length > 0) {
        setHasSeeded(true);
        const initMissing = async () => {
          try {
            const batch = writeBatch(firestore);
            missingItems.forEach((item) => {
              const ref = doc(firestore, 'pengaturan_permohonan_surat', item.id);
              batch.set(
                ref,
                {
                  ...item,
                  createdAt: serverTimestamp(),
                  updatedAt: serverTimestamp(),
                },
                { merge: true },
              );
            });
            await batch.commit();
          } catch (err) {
            console.warn('Gagal sync default permohonan surat:', err);
          }
        };
        initMissing();
      }
    }
  }, [firestore, isLoading, remoteData, isCleared, hasSeeded]);

  // Data yang ditampilkan (gabungan 44 template dasar dengan data remote Firestore)
  const items: PermohonanSuratItem[] = useMemo(() => {
    if (isCleared) return [];
    
    const map = new Map<string, PermohonanSuratItem>();
    // Basis awal: seluruh 44 master surat standar
    SEED_PERMOHONAN_SURAT.forEach((seed) => {
      map.set(seed.id, seed);
    });

    if (remoteData && remoteData.length > 0) {
      remoteData.forEach((dbItem) => {
        let key = dbItem.id;
        if (!map.has(key)) {
          for (const [seedId, seedItem] of map.entries()) {
            if (
              (dbItem.urlSurat && seedItem.urlSurat === dbItem.urlSurat) ||
              seedItem.jenisSurat.trim().toLowerCase() === (dbItem.jenisSurat || '').trim().toLowerCase()
            ) {
              key = seedId;
              break;
            }
          }
        }
        const existing = map.get(key);
        if (existing) {
          map.set(key, { ...existing, ...dbItem, id: key });
        } else {
          map.set(dbItem.id || `custom-${Math.random()}`, dbItem);
        }
      });
    }

    return Array.from(map.values());
  }, [remoteData, isCleared]);

  // Filter pencarian
  const filteredItems = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return items;
    return items.filter(
      (item) =>
        item.jenisSurat.toLowerCase().includes(q) ||
        item.kodeSurat.toLowerCase().includes(q) ||
        item.klasifikasi.toLowerCase().includes(q) ||
        item.uraian.toLowerCase().includes(q)
    );
  }, [items, searchQuery]);

  // Modal Tambah / Edit State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const [formJenisSurat, setFormJenisSurat] = useState('');
  const [formKlasifikasi, setFormKlasifikasi] = useState('KESEJAHTERAAN RAKYAT');
  const [formKodeSurat, setFormKodeSurat] = useState('');
  const [formUraian, setFormUraian] = useState('');

  // Dialog Konfirmasi Hapus Satuan
  const [itemToDelete, setItemToDelete] = useState<PermohonanSuratItem | null>(null);
  const [isDeletingOne, setIsDeletingOne] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Buka Modal Tambah
  const handleOpenCreate = () => {
    setModalMode('create');
    setSelectedId(null);
    setFormJenisSurat('');
    setFormKlasifikasi('KESEJAHTERAAN RAKYAT');
    setFormKodeSurat('');
    setFormUraian('');
    setIsModalOpen(true);
  };

  // Buka Modal Edit
  const handleOpenEdit = (item: PermohonanSuratItem) => {
    setModalMode('edit');
    setSelectedId(item.id);
    setFormJenisSurat(item.jenisSurat || '');
    setFormKlasifikasi(item.klasifikasi || 'KESEJAHTERAAN RAKYAT');
    setFormKodeSurat(item.kodeSurat || '');
    setFormUraian(item.uraian || '');
    setIsModalOpen(true);
  };

  // Simpan Data (Tambah / Edit)
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firestore) return;

    if (!formJenisSurat.trim() || !formKodeSurat.trim()) {
      toast({
        variant: 'destructive',
        title: 'Formulir Belum Lengkap',
        description: 'Jenis Surat dan Kode Surat wajib diisi.',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const id = modalMode === 'edit' && selectedId ? selectedId : doc(collection(firestore, 'pengaturan_permohonan_surat')).id;
      const docRef = doc(firestore, 'pengaturan_permohonan_surat', id);

      const payload: Partial<PermohonanSuratItem> = {
        id,
        jenisSurat: formJenisSurat.trim(),
        klasifikasi: formKlasifikasi.trim() || 'KESEJAHTERAAN RAKYAT',
        kodeSurat: formKodeSurat.trim(),
        uraian: formUraian.trim(),
        updatedAt: new Date().toISOString(),
      };

      if (modalMode === 'create') {
        payload.createdAt = new Date().toISOString();
      }

      await setDoc(docRef, payload, { merge: true });

      // Reset cleared state jika ada
      if (isCleared) {
        setIsCleared(false);
        localStorage.removeItem('permohonan_surat_cleared');
      }

      toast({
        title: 'Berhasil Disimpan',
        description: `Data permohonan surat "${formJenisSurat}" berhasil disimpan.`,
      });

      setIsModalOpen(false);
    } catch (err: any) {
      console.error('Save Permohonan Surat Error:', err);
      toast({
        variant: 'destructive',
        title: 'Gagal Menyimpan',
        description: err.message || 'Terjadi kesalahan sistem.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Hapus Satu Item
  const handleDeleteConfirm = async () => {
    if (!firestore || !itemToDelete) return;
    setIsDeletingOne(true);

    try {
      await deleteDoc(doc(firestore, 'pengaturan_permohonan_surat', itemToDelete.id));
      toast({
        title: 'Data Dihapus',
        description: `Permohonan surat "${itemToDelete.jenisSurat}" berhasil dihapus.`,
      });
      setItemToDelete(null);
    } catch (err: any) {
      console.error('Delete error:', err);
      toast({
        variant: 'destructive',
        title: 'Gagal Menghapus',
        description: err.message || 'Gagal menghapus data.',
      });
    } finally {
      setIsDeletingOne(false);
    }
  };

  // Hapus Semua Data
  const handleDeleteAll = async () => {
    if (!firestore) return;
    setIsDeletingAll(true);

    try {
      const snap = await getDocs(collection(firestore, 'pengaturan_permohonan_surat'));
      if (!snap.empty) {
        const batch = writeBatch(firestore);
        snap.docs.forEach((docItem) => {
          batch.delete(docItem.ref);
        });
        await batch.commit();
      }

      setIsCleared(true);
      localStorage.setItem('permohonan_surat_cleared', 'true');

      toast({
        title: 'Semua Data Dihapus',
        description: 'Seluruh data pengaturan permohonan surat telah berhasil dibersihkan.',
      });
      setIsAlertOpen(false);
    } catch (err: any) {
      console.error('Delete all error:', err);
      toast({
        variant: 'destructive',
        title: 'Gagal Menghapus Semua Data',
        description: err.message || 'Terjadi kesalahan saat menghapus data.',
      });
    } finally {
      setIsDeletingAll(false);
    }
  };

  // Reset / Muat Ulang Data Bawaan
  const handleResetToDefault = async () => {
    if (!firestore) return;
    setIsSeeding(true);

    try {
      const batch = writeBatch(firestore);
      SEED_PERMOHONAN_SURAT.forEach((item) => {
        const ref = doc(firestore, 'pengaturan_permohonan_surat', item.id);
        batch.set(ref, {
          ...item,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      });
      await batch.commit();

      setIsCleared(false);
      localStorage.removeItem('permohonan_surat_cleared');

      toast({
        title: 'Data Bawaan Dimuat',
        description: `Berhasil memuat ${SEED_PERMOHONAN_SURAT.length} data permohonan surat standar.`,
      });
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: 'Gagal Memuat Data',
        description: err.message || 'Terjadi kesalahan saat memuat data bawaan.',
      });
    } finally {
      setIsSeeding(false);
    }
  };

  // Ekspor Excel
  const handleExportExcel = () => {
    if (items.length === 0) {
      toast({
        variant: 'destructive',
        title: 'Tidak Ada Data',
        description: 'Tabel permohonan surat masih kosong.',
      });
      return;
    }

    try {
      const dataToExport = items.map((item, idx) => ({
        'NO': idx + 1,
        'JENIS SURAT': item.jenisSurat,
        'KLASIFIKASI': item.klasifikasi,
        'KODE': item.kodeSurat,
        'URAIAN': item.uraian,
      }));

      const worksheet = XLSX.utils.json_to_sheet(dataToExport);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Permohonan Surat');

      // Lebar kolom otomatis
      worksheet['!cols'] = [
        { wch: 6 },
        { wch: 35 },
        { wch: 28 },
        { wch: 18 },
        { wch: 65 },
      ];

      XLSX.writeFile(workbook, `Pengaturan_Permohonan_Surat_Desa_Sampeldes.xlsx`);

      toast({
        title: 'Ekspor Berhasil',
        description: 'Berkas Excel berhasil diunduh ke perangkat Anda.',
      });
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: 'Gagal Ekspor',
        description: err.message || 'Terjadi kesalahan saat membuat Excel.',
      });
    }
  };

  // Impor Excel
  const handleImportExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !firestore) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const rawJson: any[] = XLSX.utils.sheet_to_json(ws);

        if (!rawJson || rawJson.length === 0) {
          throw new Error('Berkas Excel kosong atau format tidak sesuai.');
        }

        const batch = writeBatch(firestore);
        let count = 0;

        rawJson.forEach((row, idx) => {
          const jenisSurat = row['JENIS SURAT'] || row['Jenis Surat'] || row['jenisSurat'] || row['NAMA SURAT'] || '';
          const klasifikasi = row['KLASIFIKASI'] || row['Klasifikasi'] || 'KESEJAHTERAAN RAKYAT';
          const kodeSurat = row['KODE'] || row['Kode'] || row['KODE SURAT'] || row['kodeSurat'] || '';
          const uraian = row['URAIAN'] || row['Uraian'] || row['Keterangan'] || '';

          if (jenisSurat && kodeSurat) {
            const newId = doc(collection(firestore, 'pengaturan_permohonan_surat')).id;
            const ref = doc(firestore, 'pengaturan_permohonan_surat', newId);
            batch.set(ref, {
              id: newId,
              jenisSurat: String(jenisSurat).trim(),
              klasifikasi: String(klasifikasi).trim(),
              kodeSurat: String(kodeSurat).trim(),
              uraian: String(uraian).trim(),
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            });
            count++;
          }
        });

        if (count === 0) {
          throw new Error('Kolom JENIS SURAT dan KODE tidak ditemukan pada Excel.');
        }

        await batch.commit();

        setIsCleared(false);
        localStorage.removeItem('permohonan_surat_cleared');

        toast({
          title: 'Impor Berhasil',
          description: `Berhasil mengimpor ${count} data permohonan surat dari Excel.`,
        });
      } catch (err: any) {
        console.error('Import Excel Error:', err);
        toast({
          variant: 'destructive',
          title: 'Gagal Impor Excel',
          description: err.message || 'Format berkas Excel tidak valid.',
        });
      } finally {
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.readAsBinaryString(file);
  };

  return (
    <div className="space-y-4 font-sans select-none w-full max-w-full min-w-0">
      {/* ─── 1. HEADER SECTION & TOOLBAR ─── */}
      <Card className="neu-card-elevated rounded-2xl border border-white/80 dark:border-white/10 p-4 sm:p-5 overflow-hidden w-full max-w-full">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full neu-pill border border-stone-300/40 dark:border-white/10">
              <FileCheck2 className="h-3.5 w-3.5 text-emerald-700 dark:text-teal-400" />
              <span className="text-[9.5px] font-condensed font-black uppercase tracking-wider text-stone-600 dark:text-stone-300">
                PENGATURAN KODE &amp; FORMAT
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-condensed font-black uppercase tracking-tight text-slate-900 dark:text-white">
              Pengaturan Permohonan Surat
            </h2>
            <p className="text-xs text-stone-500 dark:text-stone-400 font-medium">
              Kelola master jenis surat dan pemetaan kode klasifikasi resmi untuk layanan administrasi desa.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <Button
              onClick={handleOpenCreate}
              size="sm"
              className="neu-btn-dark h-9 px-3.5 rounded-xl text-xs font-bold gap-1.5 text-teal-400 hover:bg-slate-900 shadow-sm"
            >
              <Plus className="h-4 w-4" />
              <span>Tambah Jenis Surat</span>
            </Button>

            <Button
              onClick={handleExportExcel}
              variant="outline"
              size="sm"
              className="neu-btn h-9 px-3 rounded-xl text-xs font-bold gap-1.5 text-stone-700 dark:text-stone-300 hover:text-emerald-800"
              title="Ekspor ke File Excel"
            >
              <Download className="h-3.5 w-3.5 text-emerald-700" />
              <span>Ekspor Excel</span>
            </Button>

            <Button
              onClick={() => fileInputRef.current?.click()}
              variant="outline"
              size="sm"
              className="neu-btn h-9 px-3 rounded-xl text-xs font-bold gap-1.5 text-stone-700 dark:text-stone-300 hover:text-blue-700"
              title="Impor dari File Excel"
            >
              <Upload className="h-3.5 w-3.5 text-blue-600" />
              <span>Impor Excel</span>
            </Button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImportExcel}
              accept=".xlsx, .xls"
              className="hidden"
            />

            {items.length === 0 && (
              <Button
                onClick={handleResetToDefault}
                disabled={isSeeding}
                variant="outline"
                size="sm"
                className="neu-btn h-9 px-3 rounded-xl text-xs font-bold gap-1.5 text-emerald-700 hover:text-emerald-800"
              >
                <RotateCcw className={cn('h-3.5 w-3.5', isSeeding && 'animate-spin')} />
                <span>Muat Data Standar</span>
              </Button>
            )}

            {items.length > 0 && (
              <Button
                onClick={() => setIsAlertOpen(true)}
                variant="outline"
                size="sm"
                className="neu-btn h-9 px-3 rounded-xl text-xs font-bold gap-1.5 text-red-600 hover:text-red-700 hover:bg-red-50/50"
                title="Hapus Semua Data Permohonan Surat"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Hapus Semua</span>
              </Button>
            )}
          </div>
        </div>

        {/* Search Bar & Total Counter */}
        <div className="mt-4 pt-3 border-t border-stone-200/80 dark:border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-stone-400" />
            <Input
              type="text"
              placeholder="Cari jenis surat, kode, klasifikasi, atau uraian..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-9 pl-9 pr-4 rounded-xl neu-inset text-xs font-medium border-0 placeholder:text-stone-400 w-full"
            />
          </div>

          <div className="flex items-center gap-2 text-xs font-condensed font-bold uppercase tracking-wider text-stone-500 shrink-0">
            <span>Total:</span>
            <span className="px-2 py-0.5 rounded-md neu-pill text-emerald-800 dark:text-teal-400 font-black">
              {filteredItems.length} Data
            </span>
          </div>
        </div>
      </Card>

      {/* ─── 2. TABEL PERMOHONAN SURAT ─── */}
      <Card className="neu-card-elevated rounded-2xl border border-white/80 dark:border-white/10 overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-stone-200/50 dark:bg-white/5 border-b border-stone-200/60 dark:border-white/10">
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-12 text-center font-condensed font-black text-[11px] uppercase tracking-wider text-stone-700 dark:text-stone-300">
                  No
                </TableHead>
                <TableHead className="min-w-[200px] font-condensed font-black text-[11px] uppercase tracking-wider text-stone-700 dark:text-stone-300">
                  Jenis Surat
                </TableHead>
                <TableHead className="min-w-[180px] font-condensed font-black text-[11px] uppercase tracking-wider text-stone-700 dark:text-stone-300">
                  Klasifikasi
                </TableHead>
                <TableHead className="min-w-[130px] font-condensed font-black text-[11px] uppercase tracking-wider text-stone-700 dark:text-stone-300">
                  Kode Surat
                </TableHead>
                <TableHead className="min-w-[280px] font-condensed font-black text-[11px] uppercase tracking-wider text-stone-700 dark:text-stone-300">
                  Uraian
                </TableHead>
                <TableHead className="w-24 text-center font-condensed font-black text-[11px] uppercase tracking-wider text-stone-700 dark:text-stone-300">
                  Aksi
                </TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={6} className="py-3 px-4">
                      <div className="h-6 w-full rounded-md bg-stone-300/40 dark:bg-slate-800/40 animate-pulse" />
                    </TableCell>
                  </TableRow>
                ))
              ) : filteredItems.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-10 text-stone-500 text-xs italic">
                    {searchQuery
                      ? 'Tidak ada permohonan surat yang cocok dengan pencarian.'
                      : 'Belum ada data permohonan surat. Klik "Muat Data Standar" atau "Tambah Jenis Surat".'}
                  </TableCell>
                </TableRow>
              ) : (
                filteredItems.map((item, index) => {
                  const isKesejahteraan = item.klasifikasi.toUpperCase().includes('KESEJAHTERAAN');
                  const isPemerintahan = item.klasifikasi.toUpperCase().includes('PEMERINTAHAN');

                  return (
                    <TableRow
                      key={item.id}
                      className="hover:bg-stone-100/60 dark:hover:bg-white/5 border-b border-stone-200/50 dark:border-white/5 transition-colors"
                    >
                      <TableCell className="text-center font-mono text-xs text-stone-500 font-bold">
                        {index + 1}
                      </TableCell>

                      {/* JENIS SURAT */}
                      <TableCell className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white uppercase font-condensed tracking-wide">
                        {item.jenisSurat}
                      </TableCell>

                      {/* KLASIFIKASI */}
                      <TableCell>
                        <span
                          className={cn(
                            'text-[10px] font-condensed font-black uppercase tracking-wider px-2 py-0.5 rounded-md inline-block',
                            isKesejahteraan
                              ? 'bg-emerald-100/90 text-emerald-900 border border-emerald-300/60 dark:bg-emerald-950/70 dark:text-emerald-300'
                              : isPemerintahan
                              ? 'bg-blue-100/90 text-blue-900 border border-blue-300/60 dark:bg-blue-950/70 dark:text-blue-300'
                              : 'neu-inset text-stone-700 dark:text-stone-300'
                          )}
                        >
                          {item.klasifikasi}
                        </span>
                      </TableCell>

                      {/* KODE SURAT */}
                      <TableCell>
                        <span className="font-mono text-xs font-black text-slate-800 dark:text-teal-400 px-2 py-0.5 rounded-md neu-inset inline-block">
                          {item.kodeSurat}
                        </span>
                      </TableCell>

                      {/* URAIAN */}
                      <TableCell className="text-xs text-stone-600 dark:text-stone-300 leading-snug">
                        {item.uraian || '-'}
                      </TableCell>

                      {/* AKSI */}
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenEdit(item)}
                            className="neu-btn h-7 w-7 p-0 rounded-lg text-stone-700 hover:text-blue-600 transition-all"
                            title="Edit Data"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setItemToDelete(item)}
                            className="neu-btn h-7 w-7 p-0 rounded-lg text-stone-700 hover:text-red-600 transition-all"
                            title="Hapus Data"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
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
      </Card>

      {/* ─── 3. MODAL TAMBAH / EDIT ─── */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="neu-card-elevated rounded-2xl max-w-lg border border-white/80 dark:border-white/10 text-slate-900 dark:text-white font-sans p-6">
          <DialogHeader>
            <DialogTitle className="font-condensed font-black uppercase tracking-tight text-lg">
              {modalMode === 'create' ? 'Tambah Pengaturan Permohonan Surat' : 'Edit Pengaturan Permohonan Surat'}
            </DialogTitle>
            <DialogDescription className="text-xs text-stone-500">
              Sesuaikan nama jenis permohonan surat, klasifikasi pokok, kode penomoran, serta uraian keterangan.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSave} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase font-condensed">
                Jenis Surat <span className="text-red-500">*</span>
              </Label>
              <Input
                required
                placeholder="Contoh: Surat Keterangan Umum"
                value={formJenisSurat}
                onChange={(e) => setFormJenisSurat(e.target.value)}
                className="h-10 rounded-xl neu-inset text-xs font-medium border-0"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase font-condensed">
                  Klasifikasi Pokok
                </Label>
                <Input
                  placeholder="Contoh: KESEJAHTERAAN RAKYAT"
                  value={formKlasifikasi}
                  onChange={(e) => setFormKlasifikasi(e.target.value)}
                  className="h-10 rounded-xl neu-inset text-xs font-medium border-0"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase font-condensed">
                  Kode Surat <span className="text-red-500">*</span>
                </Label>
                <Input
                  required
                  placeholder="Contoh: 400.7.22.1"
                  value={formKodeSurat}
                  onChange={(e) => setFormKodeSurat(e.target.value)}
                  className="h-10 rounded-xl neu-inset text-xs font-mono font-bold border-0"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase font-condensed">
                Uraian / Keterangan
              </Label>
              <Input
                placeholder="Contoh: Surat Keterangan (keperluan administratif umum)"
                value={formUraian}
                onChange={(e) => setFormUraian(e.target.value)}
                className="h-10 rounded-xl neu-inset text-xs font-medium border-0"
              />
            </div>

            <DialogFooter className="pt-3 gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsModalOpen(false)}
                className="neu-btn rounded-xl text-xs font-bold h-9"
              >
                Batal
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="neu-btn-dark rounded-xl text-xs font-bold h-9 px-4 text-teal-400"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                    Menyimpan...
                  </>
                ) : (
                  'Simpan Perubahan'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ─── 4. DIALOG KONFIRMASI HAPUS SATUAN ─── */}
      <AlertDialog open={!!itemToDelete} onOpenChange={(open) => !open && setItemToDelete(null)}>
        <AlertDialogContent className="neu-card-elevated rounded-2xl max-w-md border border-white/80 dark:border-white/10 text-slate-900 dark:text-white font-sans p-6">
          <AlertDialogHeader>
            <div className="w-10 h-10 rounded-xl bg-red-100 text-red-600 flex items-center justify-center mb-1">
              <AlertCircle className="h-5 w-5" />
            </div>
            <AlertDialogTitle className="font-condensed font-black uppercase text-base">
              Hapus Permohonan Surat?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-stone-500 leading-relaxed">
              Apakah Anda yakin ingin menghapus permohonan surat{' '}
              <strong className="text-slate-900 dark:text-white">
                &quot;{itemToDelete?.jenisSurat}&quot;
              </strong>{' '}
              (Kode: {itemToDelete?.kodeSurat})? Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="pt-2">
            <AlertDialogCancel
              disabled={isDeletingOne}
              className="neu-btn rounded-xl text-xs font-bold h-9"
            >
              Batal
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={isDeletingOne}
              className="bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold h-9 px-4"
            >
              {isDeletingOne ? 'Menghapus...' : 'Ya, Hapus'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ─── 5. DIALOG KONFIRMASI HAPUS SEMUA DATA ─── */}
      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent className="neu-card-elevated rounded-2xl max-w-md border border-white/80 dark:border-white/10 text-slate-900 dark:text-white font-sans p-6">
          <AlertDialogHeader>
            <div className="w-10 h-10 rounded-xl bg-red-100 text-red-600 flex items-center justify-center mb-1">
              <AlertCircle className="h-5 w-5" />
            </div>
            <AlertDialogTitle className="font-condensed font-black uppercase text-base">
              Hapus Semua Data Permohonan Surat?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-stone-500 leading-relaxed">
              Apakah anda yakin akan menghapus semua data permohonan surat? Tindakan ini akan
              mengosongkan seluruh baris tabel secara permanen.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="pt-2">
            <AlertDialogCancel
              disabled={isDeletingAll}
              className="neu-btn rounded-xl text-xs font-bold h-9"
            >
              Batal
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAll}
              disabled={isDeletingAll}
              className="bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold h-9 px-4"
            >
              {isDeletingAll ? 'Membersihkan...' : 'Ya, Hapus Semua'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
