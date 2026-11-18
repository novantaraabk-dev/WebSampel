'use client';

import React, { useState, useMemo, useRef } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc, collection, setDoc, deleteDoc, writeBatch, query, orderBy, limit, serverTimestamp, getDocs, where } from 'firebase/firestore';
import * as XLSX from 'xlsx';
import {
  StatistikSosialConfig,
  DtsenItem,
  DesilStatistikItem,
  TrenKemiskinanItem,
  BansosProgramItem,
  VillageStatisticsData,
  StatistikPendidikanData,
  StatistikKesehatanData,
  StatistikEkonomiData,
  StatistikPembangunanData,
  StatistikSdgsData,
  StatistikIndeksData,
} from '@/lib/types';
import {
  DTSEN_EXCEL_COLUMNS,
  SEED_STATISTIK_SOSIAL,
  SEED_DTSEN_SAMPLE_LIST
} from '@/lib/statistik-sosial-data';
import { DEFAULT_VILLAGE_STATISTICS } from '@/lib/statistik-default-data';
import { saveStatisticsWithHistory } from './_components/save-statistics-helper';
import { AdminKependudukanEditor } from './_components/admin-kependudukan-editor';
import { AdminPendidikanEditor } from './_components/admin-pendidikan-editor';
import { AdminKesehatanEditor } from './_components/admin-kesehatan-editor';
import { AdminEkonomiEditor } from './_components/admin-ekonomi-editor';
import { AdminPembangunanEditor } from './_components/admin-pembangunan-editor';
import { AdminSdgsEditor } from './_components/admin-sdgs-editor';
import { AdminIndeksEditor } from './_components/admin-indeks-editor';
import { AdminStatisticsHistoryTab } from './_components/admin-statistics-history-tab';
import {
  BarChart3,
  FileSpreadsheet,
  Upload,
  Download,
  Trash2,
  Plus,
  Save,
  Loader2,
  Sparkles,
  ExternalLink,
  Search,
  Eye,
  HandHeart,
  TrendingDown,
  Users,
  Coins,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  RefreshCw,
  Home,
  Zap,
  Droplets,
  Layers,
  ArrowRight,
  Filter,
  GraduationCap,
  Activity,
  TrendingUp,
  Building2,
  Target,
  Award,
  History,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function AdminStatistikPage() {
  const { toast } = useToast();
  const firestore = useFirestore();

  // Primary active tab
  const [activeMainTab, setActiveMainTab] = useState<'sosial' | 'kependudukan' | 'pendidikan' | 'kesehatan' | 'ekonomi' | 'pembangunan' | 'sdgs' | 'indeks' | 'histori'>('sosial');

  // Sub tab inside Sosial
  const [activeSosialSubTab, setActiveSosialSubTab] = useState<'impor' | 'desil' | 'bansos'>('impor');

  // Loading states
  const [isSaving, setIsSaving] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);

  // Firestore Ref: Statistik Agregat Terpadu (villageProfile/statistics)
  const statsDocRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, 'villageProfile', 'statistics');
  }, [firestore]);

  const { data: statsData, isLoading: isLoadingStats } = useDoc<VillageStatisticsData>(statsDocRef);

  // Firestore Ref: Statistik Sosial Config
  const configDocRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, 'statisticsSocial', 'default');
  }, [firestore]);

  const { data: configData, isLoading: isLoadingConfig } = useDoc<StatistikSosialConfig>(configDocRef);

  // Local state for editing Config
  const [configForm, setConfigForm] = useState<StatistikSosialConfig>(SEED_STATISTIK_SOSIAL);

  // Sync config form with firestore data
  React.useEffect(() => {
    if (configData && configData.desilList) {
      setConfigForm(configData);
    } else {
      setConfigForm(SEED_STATISTIK_SOSIAL);
    }
  }, [configData]);

  // Save Handlers for All Tabs with Automatic Change History Recording
  const handleSaveKependudukan = async (data: Partial<VillageStatisticsData>, summary: string) => {
    if (!firestore) return;
    setIsSaving(true);
    try {
      await saveStatisticsWithHistory({
        firestore,
        tab: 'Kependudukan',
        action: 'Pembaruan Data Kependudukan & Wilayah',
        summary,
        partialData: data,
      });
      toast({
        title: 'Berhasil Disimpan!',
        description: 'Data statistik kependudukan dan indikator wilayah berhasil diperbarui.',
      });
    } catch (err: any) {
      toast({ title: 'Gagal Menyimpan', description: err?.message, variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSavePendidikan = async (data: Partial<StatistikPendidikanData>, summary: string) => {
    if (!firestore) return;
    setIsSaving(true);
    try {
      await saveStatisticsWithHistory({
        firestore,
        tab: 'Pendidikan',
        action: 'Pembaruan Data Pendidikan',
        summary,
        partialData: { pendidikan: data },
      });
      toast({
        title: 'Berhasil Disimpan!',
        description: 'Data statistik pendidikan desa berhasil diperbarui.',
      });
    } catch (err: any) {
      toast({ title: 'Gagal Menyimpan', description: err?.message, variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveKesehatan = async (data: Partial<StatistikKesehatanData>, summary: string) => {
    if (!firestore) return;
    setIsSaving(true);
    try {
      await saveStatisticsWithHistory({
        firestore,
        tab: 'Kesehatan',
        action: 'Pembaruan Data Kesehatan & Sanitasi',
        summary,
        partialData: { kesehatan: data },
      });
      toast({
        title: 'Berhasil Disimpan!',
        description: 'Data statistik kesehatan desa berhasil diperbarui.',
      });
    } catch (err: any) {
      toast({ title: 'Gagal Menyimpan', description: err?.message, variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveEkonomi = async (data: Partial<StatistikEkonomiData>, summary: string) => {
    if (!firestore) return;
    setIsSaving(true);
    try {
      await saveStatisticsWithHistory({
        firestore,
        tab: 'Ekonomi',
        action: 'Pembaruan Data Ekonomi & Pertanian',
        summary,
        partialData: { ekonomi: data },
      });
      toast({
        title: 'Berhasil Disimpan!',
        description: 'Data statistik ekonomi & potensi desa berhasil diperbarui.',
      });
    } catch (err: any) {
      toast({ title: 'Gagal Menyimpan', description: err?.message, variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSavePembangunan = async (data: Partial<StatistikPembangunanData>, summary: string) => {
    if (!firestore) return;
    setIsSaving(true);
    try {
      await saveStatisticsWithHistory({
        firestore,
        tab: 'Pembangunan',
        action: 'Pembaruan Data Pembangunan & Infrastruktur',
        summary,
        partialData: { pembangunan: data },
      });
      toast({
        title: 'Berhasil Disimpan!',
        description: 'Data statistik pembangunan desa berhasil diperbarui.',
      });
    } catch (err: any) {
      toast({ title: 'Gagal Menyimpan', description: err?.message, variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveSdgs = async (data: Partial<StatistikSdgsData>, summary: string) => {
    if (!firestore) return;
    setIsSaving(true);
    try {
      await saveStatisticsWithHistory({
        firestore,
        tab: 'SDGs Desa',
        action: 'Pembaruan Skor & Gol SDGs Desa',
        summary,
        partialData: { sdgs: data },
      });
      toast({
        title: 'Berhasil Disimpan!',
        description: 'Data capaian 18 tujuan SDGs Desa berhasil diperbarui.',
      });
    } catch (err: any) {
      toast({ title: 'Gagal Menyimpan', description: err?.message, variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveIndeks = async (data: Partial<StatistikIndeksData>, summary: string) => {
    if (!firestore) return;
    setIsSaving(true);
    try {
      await saveStatisticsWithHistory({
        firestore,
        tab: 'Indeks Desa',
        action: 'Pembaruan Status & Dimensi IDM',
        summary,
        partialData: { indeks: data },
      });
      toast({
        title: 'Berhasil Disimpan!',
        description: 'Data Indeks Desa Membangun (IDM) berhasil diperbarui.',
      });
    } catch (err: any) {
      toast({ title: 'Gagal Menyimpan', description: err?.message, variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDesil, setFilterDesil] = useState<string>('all');
  const [selectedDetailItem, setSelectedDetailItem] = useState<DtsenItem | null>(null);

  // On-demand search results & quota state
  const [searchResults, setSearchResults] = useState<DtsenItem[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [isSearchingDtsen, setIsSearchingDtsen] = useState(false);
  const [isSampleMode, setIsSampleMode] = useState(false);
  const [searchStats, setSearchStats] = useState<{ reads: number; isCached: boolean; note?: string } | null>(null);

  // In-memory search cache to eliminate repeat Firestore reads (0 quota cost on repeated queries)
  const searchCacheRef = useRef<Map<string, DtsenItem[]>>(new Map());

  // Handle on-demand quota-saving search
  const handleSearchDtsen = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!firestore) return;

    const trimmedQuery = searchQuery.trim();
    if (!trimmedQuery && filterDesil === 'all') {
      toast({
        title: 'Formulir Pencarian Kosong',
        description: 'Ketik No. KK, Nama, atau pilih kelompok Desil untuk mencari data tanpa memboroskan kuota.',
      });
      return;
    }

    const cacheKey = `${trimmedQuery.toLowerCase()}__${filterDesil}`;
    if (searchCacheRef.current.has(cacheKey)) {
      const cached = searchCacheRef.current.get(cacheKey) || [];
      setSearchResults(cached);
      setHasSearched(true);
      setIsSampleMode(false);
      setSearchStats({ reads: 0, isCached: true, note: 'Memuat dari memori cache lokal browser' });
      toast({
        title: 'Hasil Ditemukan (Cache)',
        description: `Menampilkan ${cached.length} data KPM dari cache (0 kuota Firestore).`,
      });
      return;
    }

    setIsSearchingDtsen(true);
    try {
      const dtsenCol = collection(firestore, 'dtsenList');
      let docsData: DtsenItem[] = [];
      let readsCount = 0;

      // Strategi 1: Jika pencarian berupa angka (No KK)
      const isDigitsOnly = /^\d+$/.test(trimmedQuery);
      if (isDigitsOnly && trimmedQuery.length >= 3) {
        // Range query prefix No KK
        const q = query(
          dtsenCol,
          where('nomor_kartu_keluarga', '>=', trimmedQuery),
          where('nomor_kartu_keluarga', '<=', trimmedQuery + '\uf8ff'),
          limit(30)
        );
        const snapshot = await getDocs(q);
        readsCount = snapshot.docs.length;
        docsData = snapshot.docs.map(docSnap => ({
          ...docSnap.data() as DtsenItem,
          id: docSnap.id,
        }));
        if (filterDesil !== 'all') {
          docsData = docsData.filter(d => String(d.desil_nasional) === filterDesil);
        }
      } else if (filterDesil !== 'all' && !trimmedQuery) {
        // Strategi 2: Filter berdasarkan kelompok Desil saja
        const q = query(
          dtsenCol,
          where('desil_nasional', '==', Number(filterDesil)),
          limit(30)
        );
        const snapshot = await getDocs(q);
        readsCount = snapshot.docs.length;
        docsData = snapshot.docs.map(docSnap => ({
          ...docSnap.data() as DtsenItem,
          id: docSnap.id,
        }));
      } else {
        // Strategi 3: Pencarian teks nama/alamat dengan limit terkontrol (max 35 dokumen)
        const q = filterDesil !== 'all'
          ? query(dtsenCol, where('desil_nasional', '==', Number(filterDesil)), limit(35))
          : query(dtsenCol, limit(35));
        const snapshot = await getDocs(q);
        readsCount = snapshot.docs.length;
        const allFetched = snapshot.docs.map(docSnap => ({
          ...docSnap.data() as DtsenItem,
          id: docSnap.id,
        }));
        if (trimmedQuery) {
          const lower = trimmedQuery.toLowerCase();
          docsData = allFetched.filter(item => 
            (item.nama_anggota_keluarga || '').toLowerCase().includes(lower) ||
            (item.nomor_kartu_keluarga || '').includes(lower) ||
            (item.alamat || '').toLowerCase().includes(lower)
          );
        } else {
          docsData = allFetched;
        }
      }

      searchCacheRef.current.set(cacheKey, docsData);
      setSearchResults(docsData);
      setHasSearched(true);
      setIsSampleMode(false);
      setSearchStats({ reads: readsCount, isCached: false });

      toast({
        title: 'Pencarian Selesai',
        description: `Ditemukan ${docsData.length} data KPM (${readsCount} kuota dokumen Firestore terbaca).`,
      });
    } catch (err: any) {
      console.error('Error searching DTSEN:', err);
      toast({
        title: 'Gagal Mencari Data',
        description: err?.message || 'Terjadi kesalahan saat mencari di Firestore.',
        variant: 'destructive',
      });
    } finally {
      setIsSearchingDtsen(false);
    }
  };

  // Muat Sampel Demo (0 Kuota Firestore)
  const handleLoadSamplePreview = () => {
    setSearchResults(SEED_DTSEN_SAMPLE_LIST);
    setHasSearched(true);
    setIsSampleMode(true);
    setSearchStats({ reads: 0, isCached: true, note: 'Sampel data offline (0 kuota)' });
    toast({
      title: 'Sampel Demo Aktif',
      description: 'Menampilkan data contoh offline untuk verifikasi tampilan tanpa memakai kuota database.',
    });
  };

  // Muat 20 Data Terbaru dari Database
  const handleLoadRecentDocs = async () => {
    if (!firestore) return;
    setIsSearchingDtsen(true);
    try {
      const q = query(collection(firestore, 'dtsenList'), limit(20));
      const snapshot = await getDocs(q);
      const docsData = snapshot.docs.map(docSnap => ({
        ...docSnap.data() as DtsenItem,
        id: docSnap.id,
      }));
      setSearchResults(docsData);
      setHasSearched(true);
      setIsSampleMode(false);
      setSearchStats({ reads: snapshot.docs.length, isCached: false, note: 'Memuat 20 data awal dari database' });
      toast({
        title: 'Data Berhasil Dimuat',
        description: `Menampilkan ${docsData.length} data KPM (${snapshot.docs.length} kuota dibaca).`,
      });
    } catch (err: any) {
      console.error('Error loading recent DTSEN:', err);
      toast({
        title: 'Gagal Memuat Data',
        description: err?.message || 'Terjadi kesalahan saat memuat data dari database.',
        variant: 'destructive',
      });
    } finally {
      setIsSearchingDtsen(false);
    }
  };

  // Reset pencarian ke mode idle (mengosongkan tampilan untuk irit kuota)
  const handleResetSearch = () => {
    setSearchResults([]);
    setHasSearched(false);
    setIsSampleMode(false);
    setSearchQuery('');
    setFilterDesil('all');
    setSearchStats(null);
  };

  // Hapus data KPM dari Firestore dan dari local searchResults
  const handleDeleteDtsen = async (id?: string) => {
    if (!firestore || !id) return;
    if (!confirm('Apakah Anda yakin ingin menghapus data KPM ini dari database desa?')) return;

    try {
      await deleteDoc(doc(firestore, 'dtsenList', id));
      setSearchResults(prev => prev.filter(item => item.id !== id));
      searchCacheRef.current.clear();
      toast({
        title: 'Berhasil Dihapus',
        description: 'Data KPM berhasil dihapus dari database Firestore.',
      });
    } catch (err: any) {
      console.error('Error deleting DTSEN:', err);
      toast({
        title: 'Gagal Menghapus',
        description: err?.message || 'Gagal menghapus data dari Firestore.',
        variant: 'destructive',
      });
    }
  };

  // File input ref for Excel
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Excel Import Preview Modal State
  const [importPreviewData, setImportPreviewData] = useState<DtsenItem[]>([]);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importStats, setImportStats] = useState<{
    total: number;
    desil1: number;
    desil2: number;
    desil3: number;
    desil4: number;
  }>({ total: 0, desil1: 0, desil2: 0, desil3: 0, desil4: 0 });

  // Handle Excel File Selected
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
            description: 'Tidak ada baris data yang ditemukan pada lembar kerja Excel tersebut.',
            variant: 'destructive',
          });
          return;
        }

        // Parse and normalize row keys
        let d1 = 0, d2 = 0, d3 = 0, d4 = 0;
        const parsedRows: DtsenItem[] = rawJson.map((row, idx) => {
          // Normalize object keys to lowercase with underscores
          const normalized: Record<string, any> = {};
          Object.keys(row).forEach((k) => {
            const cleanKey = k.trim().toLowerCase().replace(/[\s\-\/\.]+/g, '_');
            normalized[cleanKey] = row[k];
          });

          const desilNum = Number(normalized.desil_nasional) || 1;
          if (desilNum === 1) d1++;
          else if (desilNum === 2) d2++;
          else if (desilNum === 3) d3++;
          else if (desilNum === 4) d4++;

          // Construct item without setting any undefined properties
          const item: Record<string, any> = {
            id: normalized.id || (normalized.nomor_kartu_keluarga ? `dtsen_${normalized.nomor_kartu_keluarga}_${idx}` : `dtsen_${Date.now()}_${idx}`),
            nomor_kartu_keluarga: String(normalized.nomor_kartu_keluarga || normalized.no_kk || ''),
            provinsi: String(normalized.provinsi || 'Jawa Tengah'),
            kabupaten_kota: String(normalized.kabupaten_kota || normalized.kabupaten || 'Kendal'),
            kecamatan: String(normalized.kecamatan || 'Sayung'),
            kelurahan_desa: String(normalized.kelurahan_desa || normalized.desa || 'Sampeldes'),
            alamat: String(normalized.alamat || 'Desa Sampeldes'),
            nama_anggota_keluarga: String(normalized.nama_anggota_keluarga || normalized.nama_kpm || normalized.nama || ''),
            desil_nasional: (desilNum >= 1 && desilNum <= 4 ? desilNum : 1) as 1 | 2 | 3 | 4,
          };

          // String fields: assign only if defined and trimmed is not empty
          const stringFields = [
            'id_pelanggan_pln', 'status_kepemilikan_rumah', 'jenis_lantai_terluas',
            'jenis_dinding_terluas', 'jenis_atap_terluas', 'sumber_air_minum_utama',
            'sumber_penerangan_utama', 'daya_terpasang', 'bahan_bakar_utama_memasak',
            'fasilitas_bab', 'jenis_kloset', 'pembuangan_akhir_tinja', 'kepemilikan_aset',
            'aset_bergerak_tabung_gas', 'aset_bergerak_lemari_es', 'aset_bergerak_ac',
            'aset_bergerak_pemanas_air', 'aset_bergerak_telepon_rumah', 'aset_bergerak_tv_datar',
            'aset_bergerak_emas_perhiasan', 'aset_bergerak_komputer_laptop_tablet',
            'aset_bergerak_sepeda_motor', 'aset_bergerak_sepeda', 'aset_bergerak_mobil',
            'aset_bergerak_perahu', 'aset_bergerak_kapal_perahu_motor', 'aset_bergerak_smartphone',
            'aset_tidak_bergerak_lahan_lainnya', 'kode_kelurahan_desa'
          ];
          stringFields.forEach((field) => {
            if (normalized[field] !== undefined && normalized[field] !== null && String(normalized[field]).trim() !== '') {
              item[field] = String(normalized[field]).trim();
            }
          });

          // Number fields: assign only if defined and valid number
          const numberFields = [
            'luas_lantai', 'jumlah_ternak_sapi', 'jumlah_ternak_kerbau',
            'jumlah_ternak_kuda', 'jumlah_ternak_babi', 'jumlah_ternak_kambing_domba'
          ];
          numberFields.forEach((field) => {
            if (normalized[field] !== undefined && normalized[field] !== null && normalized[field] !== '') {
              const n = Number(normalized[field]);
              if (!isNaN(n)) item[field] = n;
            }
          });

          return item as DtsenItem;
        });

        setImportPreviewData(parsedRows);
        setImportStats({
          total: parsedRows.length,
          desil1: d1,
          desil2: d2,
          desil3: d3,
          desil4: d4,
        });
        setIsImportModalOpen(true);
      } catch (err: any) {
        console.error('Error reading excel:', err);
        toast({
          title: 'Gagal Membaca File Excel',
          description: err?.message || 'Pastikan format file adalah spreadsheet Excel (.xlsx / .xls) yang valid.',
          variant: 'destructive',
        });
      } finally {
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.readAsBinaryString(file);
  };

  // Commit Imported Data to Firestore
  const handleCommitImport = async () => {
    if (!firestore || importPreviewData.length === 0) return;

    setIsImporting(true);
    try {
      // Chunk batches (Firestore batch limit is 500)
      const chunkSize = 400;
      for (let i = 0; i < importPreviewData.length; i += chunkSize) {
        const chunk = importPreviewData.slice(i, i + chunkSize);
        const batch = writeBatch(firestore);

        chunk.forEach((item, chunkIdx) => {
          const docId = item.id || `dtsen_${item.nomor_kartu_keluarga || Date.now()}_${chunkIdx}`;
          const itemDocRef = doc(firestore, 'dtsenList', docId);

          // Deep sanitize: ensure strictly NO key with value undefined is passed to Firestore WriteBatch
          const sanitizedDoc: Record<string, any> = {
            id: docId,
            updatedAt: serverTimestamp(),
          };

          Object.entries(item).forEach(([k, v]) => {
            if (v !== undefined) {
              sanitizedDoc[k] = v;
            }
          });

          batch.set(itemDocRef, sanitizedDoc, { merge: true });
        });

        await batch.commit();
      }

      // Auto update Desil Stats in config if desired
      const updatedDesilList: DesilStatistikItem[] = [
        {
          desil: 1,
          label: 'Desil 1 (Sangat Miskin / Ekstrem)',
          kategori: 'Sangat Miskin / Ekstrem',
          jumlahKpm: importStats.desil1,
          persen: Number(((importStats.desil1 / (importStats.total || 1)) * 100).toFixed(1)),
          keterangan: 'Keluarga sasaran prioritas BLT-DD, bansos reguler PKH, dan intervensi kemiskinan ekstrem.',
          warna: '#e11d48',
        },
        {
          desil: 2,
          label: 'Desil 2 (Miskin)',
          kategori: 'Miskin',
          jumlahKpm: importStats.desil2,
          persen: Number(((importStats.desil2 / (importStats.total || 1)) * 100).toFixed(1)),
          keterangan: 'Keluarga penerima bantuan BPNT sembako pangan dan jaminan kesehatan KIS gratis.',
          warna: '#ea580c',
        },
        {
          desil: 3,
          label: 'Desil 3 (Hampir Miskin)',
          kategori: 'Hampir Miskin',
          jumlahKpm: importStats.desil3,
          persen: Number(((importStats.desil3 / (importStats.total || 1)) * 100).toFixed(1)),
          keterangan: 'Keluarga rentan fluktuasi ekonomi dengan prioritas bantuan modal dan padat karya tunai.',
          warna: '#eab308',
        },
        {
          desil: 4,
          label: 'Desil 4 (Rentan Miskin)',
          kategori: 'Rentan Miskin',
          jumlahKpm: importStats.desil4,
          persen: Number(((importStats.desil4 / (importStats.total || 1)) * 100).toFixed(1)),
          keterangan: 'Keluarga dengan kerentanan sosial saat krisis, penerima subsidi dan jaring pengaman.',
          warna: '#0284c7',
        },
      ];

      const newConfig: StatistikSosialConfig = {
        ...configForm,
        totalKpmDtsen: importStats.total,
        desilList: updatedDesilList,
      };

      await setDoc(doc(firestore, 'statisticsSocial', 'default'), {
        ...newConfig,
        updatedAt: serverTimestamp(),
      }, { merge: true });

      // Catat juga ke histori statistik terpadu
      await saveStatisticsWithHistory({
        firestore,
        tab: 'Sosial & DTSEN',
        action: 'Impor Excel Data Warga DTSEN (43 Kolom)',
        summary: `Berhasil mengimpor ${importStats.total} data keluarga KPM DTSEN (Desil 1: ${importStats.desil1}, Desil 2: ${importStats.desil2}, Desil 3: ${importStats.desil3}, Desil 4: ${importStats.desil4})`,
        partialData: {
          socialConfig: newConfig,
        },
      });

      setConfigForm(newConfig);
      setIsImportModalOpen(false);

      // Invalidate cache & display newly imported data on-demand without additional Firestore reads
      searchCacheRef.current.clear();
      setSearchResults(importPreviewData.slice(0, 30));
      setHasSearched(true);
      setIsSampleMode(false);
      setSearchStats({
        reads: 0,
        isCached: true,
        note: `Menampilkan 30 data pertama dari ${importPreviewData.length} KPM yang baru saja diimpor`,
      });

      toast({
        title: 'Impor Berhasil!',
        description: `Berhasil menyimpan ${importPreviewData.length} data keluarga DTSEN dan memperbarui rekapitulasi desil.`,
      });
    } catch (err: any) {
      console.error('Error saving imported data:', err);
      toast({
        title: 'Gagal Menyimpan Data Impor',
        description: err?.message || 'Terjadi kesalahan saat menulis data ke Firestore.',
        variant: 'destructive',
      });
    } finally {
      setIsImporting(false);
    }
  };

  // Download Excel Template
  const handleDownloadTemplate = () => {
    try {
      const sampleRow: Record<string, any> = {};
      DTSEN_EXCEL_COLUMNS.forEach((col) => {
        if (col === 'nomor_kartu_keluarga') sampleRow[col] = '3324081203000001';
        else if (col === 'provinsi') sampleRow[col] = 'Jawa Tengah';
        else if (col === 'kabupaten_kota') sampleRow[col] = 'Kendal';
        else if (col === 'kecamatan') sampleRow[col] = 'Sayung';
        else if (col === 'kelurahan_desa') sampleRow[col] = 'Sampeldes';
        else if (col === 'alamat') sampleRow[col] = 'Dusun Sampeldes RT 02 RW 01';
        else if (col === 'nama_anggota_keluarga') sampleRow[col] = 'SUTRISNO';
        else if (col === 'desil_nasional') sampleRow[col] = 1;
        else if (col === 'id_pelanggan_pln') sampleRow[col] = '521098765432';
        else if (col === 'status_kepemilikan_rumah') sampleRow[col] = 'Milik Sendiri';
        else if (col === 'jenis_lantai_terluas') sampleRow[col] = 'Semen / Plester';
        else if (col === 'luas_lantai') sampleRow[col] = 42;
        else if (col === 'jenis_dinding_terluas') sampleRow[col] = 'Tembok Tanpa Plester';
        else if (col === 'jenis_atap_terluas') sampleRow[col] = 'Genteng Tanah';
        else if (col === 'sumber_air_minum_utama') sampleRow[col] = 'Sumur Terlindung';
        else if (col === 'sumber_penerangan_utama') sampleRow[col] = 'Listrik PLN';
        else if (col === 'daya_terpasang') sampleRow[col] = '450 VA';
        else if (col === 'bahan_bakar_utama_memasak') sampleRow[col] = 'Gas LPG 3 Kg';
        else if (col === 'fasilitas_bab') sampleRow[col] = 'Jamban Sendiri';
        else if (col === 'jenis_kloset') sampleRow[col] = 'Leher Angsa';
        else if (col === 'pembuangan_akhir_tinja') sampleRow[col] = 'Tangki Septik';
        else if (col === 'kepemilikan_aset') sampleRow[col] = 'Ada';
        else if (col === 'aset_bergerak_tabung_gas') sampleRow[col] = 'Ya (1 tabung)';
        else if (col === 'aset_bergerak_lemari_es') sampleRow[col] = 'Tidak';
        else if (col === 'aset_bergerak_ac') sampleRow[col] = 'Tidak';
        else if (col === 'aset_bergerak_pemanas_air') sampleRow[col] = 'Tidak';
        else if (col === 'aset_bergerak_telepon_rumah') sampleRow[col] = 'Tidak';
        else if (col === 'aset_bergerak_tv_datar') sampleRow[col] = 'Ya (24 inch)';
        else if (col === 'aset_bergerak_emas_perhiasan') sampleRow[col] = 'Tidak';
        else if (col === 'aset_bergerak_komputer_laptop_tablet') sampleRow[col] = 'Tidak';
        else if (col === 'aset_bergerak_sepeda_motor') sampleRow[col] = 'Ya (1 unit 2011)';
        else if (col === 'aset_bergerak_sepeda') sampleRow[col] = 'Ya (1 unit)';
        else if (col === 'aset_bergerak_mobil') sampleRow[col] = 'Tidak';
        else if (col === 'aset_bergerak_perahu') sampleRow[col] = 'Tidak';
        else if (col === 'aset_bergerak_kapal_perahu_motor') sampleRow[col] = 'Tidak';
        else if (col === 'aset_bergerak_smartphone') sampleRow[col] = 'Ya (1 unit)';
        else if (col === 'aset_tidak_bergerak_lahan_lainnya') sampleRow[col] = 'Tidak';
        else if (col === 'jumlah_ternak_sapi') sampleRow[col] = 0;
        else if (col === 'jumlah_ternak_kerbau') sampleRow[col] = 0;
        else if (col === 'jumlah_ternak_kuda') sampleRow[col] = 0;
        else if (col === 'jumlah_ternak_babi') sampleRow[col] = 0;
        else if (col === 'jumlah_ternak_kambing_domba') sampleRow[col] = 2;
        else if (col === 'kode_kelurahan_desa') sampleRow[col] = '3324080004';
      });

      const ws = XLSX.utils.json_to_sheet([sampleRow]);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Data_DTSEN');
      XLSX.writeFile(wb, 'Template_DTSEN_Desa_Sampeldes.xlsx');

      toast({
        title: 'Template Diunduh',
        description: 'Template Excel DTSEN dengan 43 kolom berhasil diunduh.',
      });
    } catch (err: any) {
      console.error(err);
      toast({
        title: 'Gagal Mengunduh Template',
        description: err?.message,
        variant: 'destructive',
      });
    }
  };

  // Seed Sample Data to Firestore
  const handleSeedData = async () => {
    if (!firestore) return;
    setIsSeeding(true);
    try {
      // 1. Simpan Seluruh Modul Statistik Default BPS & Pemdes
      await saveStatisticsWithHistory({
        firestore,
        tab: 'Inisialisasi Data Default',
        action: 'Muat Data Lengkap Statistik BPS & Pemdes',
        summary: 'Inisialisasi data lengkap seluruh 8 modul statistik desa Sampeldes beserta DTSEN & Bansos',
        partialData: {
          ...DEFAULT_VILLAGE_STATISTICS,
          socialConfig: SEED_STATISTIK_SOSIAL,
        },
      });

      // 2. Simpan Config Sosial
      await setDoc(doc(firestore, 'statisticsSocial', 'default'), {
        ...SEED_STATISTIK_SOSIAL,
        updatedAt: serverTimestamp(),
      });

      // 3. Simpan Sampel DTSEN
      const batch = writeBatch(firestore);
      SEED_DTSEN_SAMPLE_LIST.forEach((item, idx) => {
        const docId = item.id || `dtsen_${item.nomor_kartu_keluarga || Date.now()}_${idx}`;
        const itemDoc = doc(firestore, 'dtsenList', docId);
        batch.set(itemDoc, {
          ...item,
          id: docId,
          updatedAt: serverTimestamp(),
        });
      });
      await batch.commit();

      setConfigForm(SEED_STATISTIK_SOSIAL);
      toast({
        title: 'Inisialisasi Berhasil!',
        description: 'Data default seluruh 8 modul statistik desa (Kependudukan, Pendidikan, Kesehatan, Sosial, Ekonomi, Pembangunan, SDGs, Indeks) telah dimuat ke database.',
      });
    } catch (err: any) {
      console.error(err);
      toast({
        title: 'Gagal Inisialisasi',
        description: err?.message || 'Terjadi kesalahan saat memuat data contoh.',
        variant: 'destructive',
      });
    } finally {
      setIsSeeding(false);
    }
  };

  // Save Config to Firestore
  const handleSaveConfig = async () => {
    if (!firestore) return;
    setIsSaving(true);
    try {
      await saveStatisticsWithHistory({
        firestore,
        tab: 'Sosial & DTSEN',
        action: activeSosialSubTab === 'desil' ? 'Pembaruan Rekapitulasi Desil & Tren' : 'Pembaruan Program Penyaluran Bansos',
        summary: `Menyimpan konfigurasi ${activeSosialSubTab === 'desil' ? 'Desil 1-4 dan tren kemiskinan' : `${configForm.bansosList?.length || 0} program bansos`}`,
        partialData: {
          socialConfig: configForm,
        },
      });

      await setDoc(doc(firestore, 'statisticsSocial', 'default'), {
        ...configForm,
        updatedAt: serverTimestamp(),
      }, { merge: true });

      toast({
        title: 'Berhasil Disimpan!',
        description: 'Perubahan konfigurasi statistik sosial berhasil diperbarui di server.',
      });
    } catch (err: any) {
      toast({
        title: 'Gagal Menyimpan',
        description: err?.message,
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 pb-20 max-w-7xl mx-auto">
      {/* Top Banner & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 sm:p-6 neu-card-elevated rounded-[28px] border border-white/60">
        <div>
          <div className="inline-flex items-center gap-2 mb-1.5">
            <span className="w-4 h-1 rounded-full bg-emerald-600" />
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-400">
              Data & Informasi Web • Kelola Statistik
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-condensed font-bold uppercase tracking-tight text-slate-900 dark:text-white">
            Pengaturan & Manajemen Statistik Desa Sampeldes
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
            Atur data kemiskinan (DTSEN 43 kolom), klasifikasi desil kesejahteraan, tren kemiskinan, serta penyaluran bantuan sosial desa.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            onClick={handleSeedData}
            disabled={isSeeding}
            variant="outline"
            className="neu-card-elevated border border-stone-300 dark:border-white/10 rounded-xl h-10 text-xs font-bold gap-2 text-slate-800 dark:text-slate-200"
          >
            {isSeeding ? <Loader2 className="h-4 w-4 animate-spin text-emerald-600" /> : <Sparkles className="h-4 w-4 text-amber-500" />}
            <span>Muat Data BPS & DTSEN Default</span>
          </Button>

          <Link href="/statistik?tab=sosial" target="_blank">
            <Button className="neu-btn-dark text-[#d4e157] font-bold text-xs rounded-xl h-10 gap-2 border border-white/10 shadow-sm">
              <Eye className="h-4 w-4" />
              <span>Lihat Tampilan Publik</span>
              <ExternalLink className="h-3 w-3 opacity-70" />
            </Button>
          </Link>
        </div>
      </div>

      {/* Main Tabs Navigation (All Sections of /statistik) */}
      <div className="flex overflow-x-auto gap-2 p-1.5 neu-inset rounded-2xl border border-stone-300/40 dark:border-white/10 bg-black/5 dark:bg-white/5 scrollbar-none">
        {[
          { id: 'sosial', label: 'Sosial & DTSEN', icon: HandHeart, isPrimary: true },
          { id: 'kependudukan', label: 'Kependudukan', icon: Users },
          { id: 'pendidikan', label: 'Pendidikan', icon: GraduationCap },
          { id: 'kesehatan', label: 'Kesehatan', icon: Activity },
          { id: 'ekonomi', label: 'Ekonomi & Potensi', icon: TrendingUp },
          { id: 'pembangunan', label: 'Pembangunan', icon: Building2 },
          { id: 'sdgs', label: 'SDGs Desa', icon: Target },
          { id: 'indeks', label: 'Indeks Desa', icon: Award },
          { id: 'histori', label: 'Riwayat & Histori', icon: History },
        ].map((tab) => {
          const isActive = activeMainTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveMainTab(tab.id as any)}
              className={cn(
                'flex items-center gap-2 px-4 py-2.5 rounded-xl font-condensed font-bold uppercase text-xs tracking-wider transition-all whitespace-nowrap',
                isActive
                  ? 'neu-btn-dark text-[#d4e157] shadow-sm'
                  : 'text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white hover:bg-white/40'
              )}
            >
              <tab.icon className={cn('h-4 w-4', isActive ? 'text-[#d4e157]' : 'text-slate-600 dark:text-slate-400')} />
              <span>{tab.label}</span>
              {tab.isPrimary && (
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse ml-0.5" />
              )}
            </button>
          );
        })}
      </div>

      {/* ========================================================================= */}
      {/* 1. TAB SOSIAL (FOKUS UTAMA USER: DTSEN 43 KOLOM, DESIL, TREN, BANSOS)     */}
      {/* ========================================================================= */}
      {activeMainTab === 'sosial' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* Sub Navigation Bar for Sosial */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-200 dark:border-white/10 pb-4">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setActiveSosialSubTab('impor')}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all',
                  activeSosialSubTab === 'impor'
                    ? 'neu-btn-dark text-[#d4e157] shadow-sm'
                    : 'neu-card-elevated text-slate-800 dark:text-slate-200 border border-white/60'
                )}
              >
                <FileSpreadsheet className="h-4 w-4" />
                <span>1. Impor Excel DTSEN & Data Warga (43 Kolom)</span>
              </button>

              <button
                onClick={() => setActiveSosialSubTab('desil')}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all',
                  activeSosialSubTab === 'desil'
                    ? 'neu-btn-dark text-[#d4e157] shadow-sm'
                    : 'neu-card-elevated text-slate-800 dark:text-slate-200 border border-white/60'
                )}
              >
                <TrendingDown className="h-4 w-4" />
                <span>2. Rekap Desil 1-4 & Tren Kemiskinan</span>
              </button>

              <button
                onClick={() => setActiveSosialSubTab('bansos')}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all',
                  activeSosialSubTab === 'bansos'
                    ? 'neu-btn-dark text-[#d4e157] shadow-sm'
                    : 'neu-card-elevated text-slate-800 dark:text-slate-200 border border-white/60'
                )}
              >
                <Coins className="h-4 w-4" />
                <span>3. Penyaluran Bantuan Sosial (Bansos)</span>
              </button>
            </div>

            {(activeSosialSubTab === 'desil' || activeSosialSubTab === 'bansos') && (
              <Button
                onClick={handleSaveConfig}
                disabled={isSaving}
                className="neu-btn-dark text-[#d4e157] font-bold text-xs rounded-xl h-10 px-5 gap-2 border border-white/10"
              >
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin text-[#d4e157]" /> : <Save className="h-4 w-4 text-[#d4e157]" />}
                <span>Simpan Perubahan</span>
              </Button>
            )}
          </div>

          {/* ------------------------------------------------------------- */}
          {/* SUB-TAB 1: IMPOR EXCEL & TABEL DATA DTSEN (43 KOLOM)          */}
          {/* ------------------------------------------------------------- */}
          {activeSosialSubTab === 'impor' && (
            <div className="space-y-6">
              {/* Importer Control Box */}
              <div className="p-5 sm:p-6 rounded-[28px] neu-card-elevated border border-white/60 space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-stone-200 dark:border-white/10 pb-4">
                  <div>
                    <h3 className="text-base sm:text-lg font-condensed font-bold uppercase text-slate-900 dark:text-white flex items-center gap-2">
                      <FileSpreadsheet className="h-5 w-5 text-emerald-600" />
                      Impor Berkas Excel DTSEN (43 Variabel Kemiskinan)
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                      Unggah file Excel hasil survei DTSEN Kemensos / Registrasi Sosial Ekonomi (Regsosek) untuk memperbarui data penerima manfaat.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2.5">
                    <Button
                      onClick={handleDownloadTemplate}
                      variant="outline"
                      className="neu-card-elevated border border-stone-300 dark:border-white/10 rounded-xl text-xs font-bold gap-2 text-slate-800 dark:text-slate-200 h-10"
                    >
                      <Download className="h-4 w-4 text-emerald-600" />
                      <span>Unduh Template Excel (43 Kolom)</span>
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
                      className="neu-btn-dark text-[#d4e157] font-bold text-xs rounded-xl h-10 px-4 gap-2 border border-white/10 shadow-sm"
                    >
                      <Upload className="h-4 w-4 text-[#d4e157]" />
                      <span>Unggah File Excel</span>
                    </Button>
                  </div>
                </div>

                {/* Info 43 Kolom Checklist */}
                <div className="p-4 rounded-2xl neu-inset bg-emerald-500/5 dark:bg-emerald-950/20 border border-emerald-500/20 text-xs text-emerald-950 dark:text-emerald-200">
                  <div className="flex items-center gap-2 font-bold mb-1">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span>Format 43 Kolom DTSEN yang Didukung:</span>
                  </div>
                  <p className="text-[11px] text-emerald-900 dark:text-emerald-300 leading-relaxed font-mono overflow-x-auto whitespace-pre-wrap">
                    {DTSEN_EXCEL_COLUMNS.join(', ')}
                  </p>
                </div>
              </div>

              {/* Data Table DTSEN List (Arsitektur Hemat Kuota Firestore) */}
              <div className="neu-card-elevated rounded-[28px] p-5 sm:p-6 border border-white/60 space-y-4">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-stone-200 dark:border-white/10 pb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-condensed font-bold uppercase text-slate-900 dark:text-white">
                        Daftar Keluarga Penerima Manfaat Terdata
                      </h3>
                      <Badge className="bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border-emerald-500/30 text-[10px] font-bold">
                        Mode Hemat Kuota
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                      Data dipanggil secara efisien hanya saat Anda melakukan pencarian.
                    </p>
                  </div>

                  {/* Form Pencarian Hemat Kuota */}
                  <form onSubmit={handleSearchDtsen} className="flex flex-wrap items-center gap-2">
                    <div className="relative min-w-[200px] sm:min-w-[260px]">
                      <Search className="h-4 w-4 absolute left-3 top-2.5 text-slate-500" />
                      <Input
                        type="text"
                        placeholder="Cari No. KK / Nama / Alamat..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9 pr-3 h-9 rounded-xl neu-inset border border-stone-300/40 text-xs font-medium"
                      />
                    </div>

                    <Select value={filterDesil} onValueChange={setFilterDesil}>
                      <SelectTrigger className="w-[140px] h-9 rounded-xl neu-inset border border-stone-300/40 text-xs font-bold">
                        <SelectValue placeholder="Semua Desil" />
                      </SelectTrigger>
                      <SelectContent className="bg-[#ECE8E1] dark:bg-stone-900 rounded-xl shadow-xl border">
                        <SelectItem value="all">Semua Desil</SelectItem>
                        <SelectItem value="1">Desil 1 (Ekstrem)</SelectItem>
                        <SelectItem value="2">Desil 2 (Miskin)</SelectItem>
                        <SelectItem value="3">Desil 3 (Hampir)</SelectItem>
                        <SelectItem value="4">Desil 4 (Rentan)</SelectItem>
                      </SelectContent>
                    </Select>

                    <Button
                      type="submit"
                      disabled={isSearchingDtsen}
                      className="neu-btn-dark text-[#d4e157] font-bold text-xs rounded-xl h-9 px-4 gap-1.5 border border-white/10"
                    >
                      {isSearchingDtsen ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin text-[#d4e157]" />
                      ) : (
                        <Search className="h-3.5 w-3.5 text-[#d4e157]" />
                      )}
                      <span>Cari Data</span>
                    </Button>

                    {hasSearched && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleResetSearch}
                        className="h-9 px-3 rounded-xl neu-card-elevated border border-stone-300 dark:border-white/10 text-xs font-bold gap-1 text-slate-700 dark:text-slate-300 hover:text-slate-900"
                      >
                        <RefreshCw className="h-3.5 w-3.5" />
                        <span>Reset</span>
                      </Button>
                    )}
                  </form>
                </div>

                {!hasSearched ? (
                  <div className="p-8 sm:p-10 rounded-2xl neu-inset border border-stone-200 dark:border-white/10 text-center space-y-4">
                    <div className="w-14 h-14 rounded-2xl mx-auto neu-card-elevated flex items-center justify-center border border-emerald-500/30 bg-emerald-500/10">
                      <ShieldCheck className="h-7 w-7 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div className="max-w-md mx-auto space-y-1">
                      <h4 className="font-condensed font-bold text-base uppercase text-slate-900 dark:text-white">
                        Mode Hemat Kuota Database Aktif
                      </h4>
                      <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                        Untuk menjaga kuota pembacaan Firestore tetap hemat dan cepat, data keluarga DTSEN hanya dipanggil saat Anda melakukan pencarian. Silakan masukkan No. KK, Nama, atau pilih kelompok Desil pada kotak pencarian di atas, lalu klik tombol &ldquo;Cari Data&rdquo;.
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center justify-center gap-2.5 pt-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleLoadSamplePreview}
                        className="neu-card-elevated border border-stone-300 dark:border-white/10 rounded-xl text-xs font-bold gap-2 text-slate-800 dark:text-slate-200 h-9 px-4"
                      >
                        <Sparkles className="h-3.5 w-3.5 text-yellow-600" />
                        <span>Lihat Sampel Demo (0 Kuota)</span>
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleLoadRecentDocs}
                        disabled={isSearchingDtsen}
                        className="neu-card-elevated border border-stone-300 dark:border-white/10 rounded-xl text-xs font-bold gap-2 text-slate-800 dark:text-slate-200 h-9 px-4"
                      >
                        {isSearchingDtsen ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Layers className="h-3.5 w-3.5 text-emerald-600" />
                        )}
                        <span>Muat 20 Data Awal Database (20 Kuota)</span>
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {/* Status Kuota Info Bar */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-stone-200/50 dark:bg-stone-800/50 p-2.5 px-4 rounded-xl border border-stone-300/40 dark:border-white/10 text-xs">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-slate-900 dark:text-white">
                          Ditemukan: {searchResults.length} KPM
                        </span>
                        {searchStats && (
                          <Badge
                            className={cn(
                              'text-[10px] font-bold px-2 py-0.5 rounded-full border',
                              searchStats.isCached
                                ? 'bg-blue-500/15 text-blue-700 border-blue-500/30'
                                : 'bg-emerald-500/15 text-emerald-700 border-emerald-500/30'
                            )}
                          >
                            {searchStats.isCached ? '⚡ 0 Pembacaan (Cache Lokal)' : `🔥 Pembacaan Firestore: ${searchStats.reads} Dokumen`}
                          </Badge>
                        )}
                        {isSampleMode && (
                          <Badge className="bg-yellow-500/15 text-yellow-800 border-yellow-500/30 text-[10px] font-bold">
                            Mode Sampel Demo
                          </Badge>
                        )}
                      </div>
                      {searchStats?.note && (
                        <span className="text-[11px] text-slate-500 italic">
                          {searchStats.note}
                        </span>
                      )}
                    </div>

                    {/* Table */}
                    <div className="overflow-x-auto rounded-2xl border border-stone-200 dark:border-white/10 neu-inset">
                      <table className="w-full text-left text-xs text-slate-800 dark:text-slate-200">
                        <thead className="bg-stone-200/60 dark:bg-stone-800/60 text-slate-900 dark:text-white uppercase font-condensed font-bold tracking-wider text-[11px] border-b border-stone-300 dark:border-white/10">
                          <tr>
                            <th className="py-3 px-3 text-center">No</th>
                            <th className="py-3 px-3">No. KK</th>
                            <th className="py-3 px-3">Nama Anggota</th>
                            <th className="py-3 px-3">Alamat / Dusun</th>
                            <th className="py-3 px-3 text-center">Desil</th>
                            <th className="py-3 px-3">Daya Listrik</th>
                            <th className="py-3 px-3">Status Rumah</th>
                            <th className="py-3 px-3 text-center">Aksi</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-200 dark:divide-white/10">
                          {searchResults.length === 0 ? (
                            <tr>
                              <td colSpan={8} className="py-8 text-center text-slate-500">
                                Tidak ada data keluarga DTSEN yang sesuai dengan pencarian &ldquo;{searchQuery}&rdquo;.
                              </td>
                            </tr>
                          ) : (
                            searchResults.map((item, idx) => (
                              <tr key={item.id || idx} className="hover:bg-white/40 dark:hover:bg-white/5 transition-colors">
                                <td className="py-2.5 px-3 text-center font-bold text-slate-600 dark:text-slate-400">
                                  {idx + 1}
                                </td>
                                <td className="py-2.5 px-3 font-mono font-medium text-slate-900 dark:text-white">
                                  {item.nomor_kartu_keluarga || '-'}
                                </td>
                                <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-white">
                                  {item.nama_anggota_keluarga}
                                </td>
                                <td className="py-2.5 px-3 text-slate-700 dark:text-slate-300">
                                  {item.alamat || '-'}
                                </td>
                                <td className="py-2.5 px-3 text-center">
                                  <Badge
                                    className={cn(
                                      'font-bold text-[10px] px-2 py-0.5 rounded-full border',
                                      item.desil_nasional === 1 && 'bg-red-500/15 text-red-700 border-red-500/30',
                                      item.desil_nasional === 2 && 'bg-orange-500/15 text-orange-700 border-orange-500/30',
                                      item.desil_nasional === 3 && 'bg-yellow-500/15 text-yellow-700 border-yellow-500/30',
                                      item.desil_nasional === 4 && 'bg-blue-500/15 text-blue-700 border-blue-500/30'
                                    )}
                                  >
                                    Desil {item.desil_nasional}
                                  </Badge>
                                </td>
                                <td className="py-2.5 px-3">
                                  <span className="font-medium text-slate-800 dark:text-slate-200">
                                    {item.daya_terpasang || '450 VA'}
                                  </span>
                                </td>
                                <td className="py-2.5 px-3">
                                  <span className="text-[11px] text-slate-700 dark:text-slate-300">
                                    {item.status_kepemilikan_rumah || '-'}
                                  </span>
                                </td>
                                <td className="py-2.5 px-3 text-center">
                                  <div className="flex items-center justify-center gap-1.5">
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => setSelectedDetailItem(item)}
                                      className="h-7 px-2 text-[11px] text-emerald-700 hover:text-emerald-800 hover:bg-emerald-500/10"
                                    >
                                      <Eye className="h-3.5 w-3.5 mr-1" />
                                      <span>Rincian</span>
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => handleDeleteDtsen(item.id)}
                                      className="h-7 w-7 p-0 text-red-600 hover:text-red-700 hover:bg-red-500/10"
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
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ------------------------------------------------------------- */}
          {/* SUB-TAB 2: REKAP DESIL 1-4 & TREN KEMISKINAN DESA             */}
          {/* ------------------------------------------------------------- */}
          {activeSosialSubTab === 'desil' && (
            <div className="space-y-6">
              {/* Desil 1-4 Overview Editors */}
              <div className="neu-card-elevated rounded-[28px] p-5 sm:p-6 border border-white/60 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-condensed font-bold uppercase text-slate-900 dark:text-white flex items-center gap-2">
                      <TrendingDown className="h-5 w-5 text-red-500" />
                      Klasifikasi Desil Kesejahteraan DTSEN (Desil 1 s/d 4)
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      Kelola jumlah Keluarga Penerima Manfaat (KPM) berdasarkan kelompok desil kemiskinan nasional.
                    </p>
                  </div>
                  <Badge className="neu-btn-dark text-[#d4e157] font-bold text-xs px-3 py-1 rounded-full">
                    Total: {configForm.desilList.reduce((acc, curr) => acc + (curr.jumlahKpm || 0), 0)} KPM
                  </Badge>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  {configForm.desilList.map((item, index) => (
                    <Card
                      key={item.desil}
                      className="rounded-2xl p-4 neu-card-elevated border border-white/80 space-y-3"
                    >
                      <div className="flex items-center justify-between border-b border-stone-200 dark:border-white/10 pb-2">
                        <div className="flex items-center gap-2">
                          <span
                            className="w-3.5 h-3.5 rounded-full shrink-0"
                            style={{ backgroundColor: item.warna || '#f97316' }}
                          />
                          <h4 className="font-condensed font-bold text-sm uppercase text-slate-900 dark:text-white">
                            Desil {item.desil} • {item.kategori}
                          </h4>
                        </div>
                        <Badge
                          className="font-bold text-[10px] px-2 py-0.5 rounded-full"
                          style={{
                            backgroundColor: `${item.warna}20`,
                            color: item.warna,
                            borderColor: `${item.warna}40`,
                          }}
                        >
                          {item.persen}% dari total
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div className="space-y-1">
                          <Label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                            Jumlah KPM
                          </Label>
                          <Input
                            type="number"
                            value={item.jumlahKpm}
                            onChange={(e) => {
                              const val = Number(e.target.value) || 0;
                              const updated = [...configForm.desilList];
                              updated[index] = { ...updated[index], jumlahKpm: val };
                              setConfigForm({ ...configForm, desilList: updated });
                            }}
                            className="h-9 neu-inset rounded-xl border border-stone-300/40 text-xs font-bold"
                          />
                        </div>

                        <div className="space-y-1">
                          <Label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                            Persentase (%)
                          </Label>
                          <Input
                            type="number"
                            step="0.1"
                            value={item.persen}
                            onChange={(e) => {
                              const val = Number(e.target.value) || 0;
                              const updated = [...configForm.desilList];
                              updated[index] = { ...updated[index], persen: val };
                              setConfigForm({ ...configForm, desilList: updated });
                            }}
                            className="h-9 neu-inset rounded-xl border border-stone-300/40 text-xs font-bold"
                          />
                        </div>
                      </div>

                      <div className="space-y-1 text-xs">
                        <Label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                          Keterangan / Sasaran Intervensi
                        </Label>
                        <Textarea
                          rows={2}
                          value={item.keterangan}
                          onChange={(e) => {
                            const updated = [...configForm.desilList];
                            updated[index] = { ...updated[index], keterangan: e.target.value };
                            setConfigForm({ ...configForm, desilList: updated });
                          }}
                          className="neu-inset rounded-xl border border-stone-300/40 text-xs"
                        />
                      </div>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Tren Penurunan Kemiskinan Editor */}
              <div className="neu-card-elevated rounded-[28px] p-5 sm:p-6 border border-white/60 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-200 dark:border-white/10 pb-3">
                  <div>
                    <h3 className="text-base font-condensed font-bold uppercase text-slate-900 dark:text-white flex items-center gap-2">
                      <TrendingDown className="h-5 w-5 text-emerald-600" />
                      Tren Penurunan Kemiskinan Desa (Tahun ke Tahun)
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      Grafik dan tabel progres penurunan kemiskinan sebagai indikator keberhasilan pembangunan Kepala Desa.
                    </p>
                  </div>

                  <Button
                    size="sm"
                    onClick={() => {
                      const lastYear = configForm.trenList[configForm.trenList.length - 1]?.tahun || 2025;
                      const newItem: TrenKemiskinanItem = {
                        tahun: lastYear + 1,
                        jumlahWargaMiskin: 100,
                        persentase: 7.0,
                        kpmBlt: 50,
                        keterangan: 'Target percepatan pengentasan kemiskinan desa',
                      };
                      setConfigForm({
                        ...configForm,
                        trenList: [...configForm.trenList, newItem],
                      });
                    }}
                    className="neu-card-elevated border border-stone-300 dark:border-white/10 rounded-xl text-xs font-bold gap-1 text-slate-800 dark:text-slate-200 h-9"
                  >
                    <Plus className="h-3.5 w-3.5 text-emerald-600" />
                    <span>Tambah Tahun</span>
                  </Button>
                </div>

                <div className="space-y-3">
                  {configForm.trenList.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-2xl neu-inset border border-stone-200 dark:border-white/10 grid grid-cols-1 md:grid-cols-12 gap-3 items-center"
                    >
                      <div className="md:col-span-2">
                        <Label className="text-[10px] uppercase font-bold text-slate-600 dark:text-slate-400">Tahun</Label>
                        <Input
                          type="number"
                          value={item.tahun}
                          onChange={(e) => {
                            const val = Number(e.target.value) || 2025;
                            const updated = [...configForm.trenList];
                            updated[idx] = { ...updated[idx], tahun: val };
                            setConfigForm({ ...configForm, trenList: updated });
                          }}
                          className="h-8 neu-card-elevated rounded-lg font-bold text-xs"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <Label className="text-[10px] uppercase font-bold text-slate-600 dark:text-slate-400">Jml Warga Miskin</Label>
                        <Input
                          type="number"
                          value={item.jumlahWargaMiskin}
                          onChange={(e) => {
                            const val = Number(e.target.value) || 0;
                            const updated = [...configForm.trenList];
                            updated[idx] = { ...updated[idx], jumlahWargaMiskin: val };
                            setConfigForm({ ...configForm, trenList: updated });
                          }}
                          className="h-8 neu-card-elevated rounded-lg font-bold text-xs"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <Label className="text-[10px] uppercase font-bold text-slate-600 dark:text-slate-400">Persentase (%)</Label>
                        <Input
                          type="number"
                          step="0.1"
                          value={item.persentase}
                          onChange={(e) => {
                            const val = Number(e.target.value) || 0;
                            const updated = [...configForm.trenList];
                            updated[idx] = { ...updated[idx], persentase: val };
                            setConfigForm({ ...configForm, trenList: updated });
                          }}
                          className="h-8 neu-card-elevated rounded-lg font-bold text-xs"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <Label className="text-[10px] uppercase font-bold text-slate-600 dark:text-slate-400">KPM BLT-DD</Label>
                        <Input
                          type="number"
                          value={item.kpmBlt}
                          onChange={(e) => {
                            const val = Number(e.target.value) || 0;
                            const updated = [...configForm.trenList];
                            updated[idx] = { ...updated[idx], kpmBlt: val };
                            setConfigForm({ ...configForm, trenList: updated });
                          }}
                          className="h-8 neu-card-elevated rounded-lg font-bold text-xs"
                        />
                      </div>

                      <div className="md:col-span-3">
                        <Label className="text-[10px] uppercase font-bold text-slate-600 dark:text-slate-400">Keterangan / Capaian</Label>
                        <Input
                          type="text"
                          value={item.keterangan || ''}
                          onChange={(e) => {
                            const updated = [...configForm.trenList];
                            updated[idx] = { ...updated[idx], keterangan: e.target.value };
                            setConfigForm({ ...configForm, trenList: updated });
                          }}
                          className="h-8 neu-card-elevated rounded-lg text-xs"
                        />
                      </div>

                      <div className="md:col-span-1 flex justify-end">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            const updated = configForm.trenList.filter((_, i) => i !== idx);
                            setConfigForm({ ...configForm, trenList: updated });
                          }}
                          className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-500/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ------------------------------------------------------------- */}
          {/* SUB-TAB 3: PENYALURAN BANTUAN SOSIAL (BANSOS)                  */}
          {/* ------------------------------------------------------------- */}
          {activeSosialSubTab === 'bansos' && (
            <div className="space-y-6">
              <div className="neu-card-elevated rounded-[28px] p-5 sm:p-6 border border-white/60 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-200 dark:border-white/10 pb-3">
                  <div>
                    <h3 className="text-base font-condensed font-bold uppercase text-slate-900 dark:text-white flex items-center gap-2">
                      <Coins className="h-5 w-5 text-amber-500" />
                      Statistik Penyaluran Bantuan Sosial (Per Jenis Program)
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      Kelola jumlah KPM, pagu anggaran, serta integrasi dengan Realisasi APBDes (BLT-DD, PKH, BPNT, CBP Bulog, PBI-JKN).
                    </p>
                  </div>

                  <Button
                    size="sm"
                    onClick={() => {
                      const newProg: BansosProgramItem = {
                        id: `bansos_${Date.now()}`,
                        kode: `bansos-${configForm.bansosList.length + 1}`,
                        namaProgram: 'Bantuan Sosial Baru',
                        sumberDana: 'Kemensos / APBD / APBDes',
                        jumlahKpm: 50,
                        satuan: 'KPM',
                        paguAnggaran: 0,
                        statusPenyaluran: 'Aktif Tersalurkan',
                        periode: '2025',
                        keterangan: 'Keterangan program bansos',
                      };
                      setConfigForm({
                        ...configForm,
                        bansosList: [...configForm.bansosList, newProg],
                      });
                    }}
                    className="neu-card-elevated border border-stone-300 dark:border-white/10 rounded-xl text-xs font-bold gap-1 text-slate-800 dark:text-slate-200 h-9"
                  >
                    <Plus className="h-3.5 w-3.5 text-emerald-600" />
                    <span>Tambah Program Bansos</span>
                  </Button>
                </div>

                {/* Bansos Cards Editor */}
                <div className="space-y-4">
                  {configForm.bansosList.map((prog, idx) => (
                    <Card
                      key={prog.id || idx}
                      className="rounded-2xl p-4 sm:p-5 neu-card-elevated border border-white/80 space-y-3"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-200 dark:border-white/10 pb-2">
                        <div className="flex items-center gap-2">
                          <Badge className="neu-btn-dark text-[#d4e157] font-bold text-[10px] px-2.5 py-0.5 rounded-full">
                            Program {idx + 1}
                          </Badge>
                          <h4 className="font-condensed font-bold text-sm sm:text-base uppercase text-slate-900 dark:text-white">
                            {prog.namaProgram}
                          </h4>
                        </div>

                        {prog.kode === 'blt-dd' && (
                          <Badge className="bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border-emerald-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                            <CheckCircle2 className="h-3 w-3" />
                            <span>Terhubung ke Realisasi APBDes</span>
                          </Badge>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 text-xs">
                        <div className="sm:col-span-5 space-y-1">
                          <Label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                            Nama Program Lengkap
                          </Label>
                          <Input
                            type="text"
                            value={prog.namaProgram}
                            onChange={(e) => {
                              const updated = [...configForm.bansosList];
                              updated[idx] = { ...updated[idx], namaProgram: e.target.value };
                              setConfigForm({ ...configForm, bansosList: updated });
                            }}
                            className="h-9 neu-inset rounded-xl border border-stone-300/40 text-xs font-bold"
                          />
                        </div>

                        <div className="sm:col-span-3 space-y-1">
                          <Label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                            Kode Program
                          </Label>
                          <Input
                            type="text"
                            value={prog.kode}
                            onChange={(e) => {
                              const updated = [...configForm.bansosList];
                              updated[idx] = { ...updated[idx], kode: e.target.value };
                              setConfigForm({ ...configForm, bansosList: updated });
                            }}
                            className="h-9 neu-inset rounded-xl border border-stone-300/40 text-xs font-bold"
                          />
                        </div>

                        <div className="sm:col-span-4 space-y-1">
                          <Label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                            Sumber Anggaran
                          </Label>
                          <Input
                            type="text"
                            value={prog.sumberDana}
                            onChange={(e) => {
                              const updated = [...configForm.bansosList];
                              updated[idx] = { ...updated[idx], sumberDana: e.target.value };
                              setConfigForm({ ...configForm, bansosList: updated });
                            }}
                            className="h-9 neu-inset rounded-xl border border-stone-300/40 text-xs"
                          />
                        </div>

                        <div className="sm:col-span-3 space-y-1">
                          <Label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                            Jumlah Penerima
                          </Label>
                          <Input
                            type="number"
                            value={prog.jumlahKpm}
                            onChange={(e) => {
                              const val = Number(e.target.value) || 0;
                              const updated = [...configForm.bansosList];
                              updated[idx] = { ...updated[idx], jumlahKpm: val };
                              setConfigForm({ ...configForm, bansosList: updated });
                            }}
                            className="h-9 neu-inset rounded-xl border border-stone-300/40 text-xs font-bold"
                          />
                        </div>

                        <div className="sm:col-span-3 space-y-1">
                          <Label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                            Satuan Penerima
                          </Label>
                          <Input
                            type="text"
                            placeholder="KPM / Jiwa / Penerima"
                            value={prog.satuan}
                            onChange={(e) => {
                              const updated = [...configForm.bansosList];
                              updated[idx] = { ...updated[idx], satuan: e.target.value };
                              setConfigForm({ ...configForm, bansosList: updated });
                            }}
                            className="h-9 neu-inset rounded-xl border border-stone-300/40 text-xs font-medium"
                          />
                        </div>

                        <div className="sm:col-span-3 space-y-1">
                          <Label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                            Pagu Anggaran Desa (Rp)
                          </Label>
                          <Input
                            type="number"
                            value={prog.paguAnggaran || 0}
                            onChange={(e) => {
                              const val = Number(e.target.value) || 0;
                              const updated = [...configForm.bansosList];
                              updated[idx] = { ...updated[idx], paguAnggaran: val };
                              setConfigForm({ ...configForm, bansosList: updated });
                            }}
                            className="h-9 neu-inset rounded-xl border border-stone-300/40 text-xs font-bold"
                          />
                        </div>

                        <div className="sm:col-span-3 space-y-1">
                          <Label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                            Status Penyaluran
                          </Label>
                          <Input
                            type="text"
                            value={prog.statusPenyaluran}
                            onChange={(e) => {
                              const updated = [...configForm.bansosList];
                              updated[idx] = { ...updated[idx], statusPenyaluran: e.target.value };
                              setConfigForm({ ...configForm, bansosList: updated });
                            }}
                            className="h-9 neu-inset rounded-xl border border-stone-300/40 text-xs"
                          />
                        </div>

                        <div className="sm:col-span-11 space-y-1">
                          <Label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                            Deskripsi / Kriteria Sasaran Penerima
                          </Label>
                          <Input
                            type="text"
                            value={prog.keterangan || ''}
                            onChange={(e) => {
                              const updated = [...configForm.bansosList];
                              updated[idx] = { ...updated[idx], keterangan: e.target.value };
                              setConfigForm({ ...configForm, bansosList: updated });
                            }}
                            className="h-9 neu-inset rounded-xl border border-stone-300/40 text-xs"
                          />
                        </div>

                        <div className="sm:col-span-1 flex items-end justify-center pb-0.5">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              const updated = configForm.bansosList.filter((_, i) => i !== idx);
                              setConfigForm({ ...configForm, bansosList: updated });
                            }}
                            className="h-9 w-9 p-0 text-red-600 hover:text-red-700 hover:bg-red-500/10"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. SECTION LAINNYA DI /statistik (KEPENDUDUKAN, PENDIDIKAN, DLL & HISTORI)*/}
      {/* ========================================================================= */}
      {activeMainTab === 'kependudukan' && (
        <AdminKependudukanEditor
          initialData={statsData ?? undefined}
          onSave={handleSaveKependudukan}
          isSaving={isSaving}
        />
      )}

      {activeMainTab === 'pendidikan' && (
        <AdminPendidikanEditor
          initialData={statsData?.pendidikan}
          onSave={handleSavePendidikan}
          isSaving={isSaving}
        />
      )}

      {activeMainTab === 'kesehatan' && (
        <AdminKesehatanEditor
          initialData={statsData?.kesehatan}
          onSave={handleSaveKesehatan}
          isSaving={isSaving}
        />
      )}

      {activeMainTab === 'ekonomi' && (
        <AdminEkonomiEditor
          initialData={statsData?.ekonomi}
          onSave={handleSaveEkonomi}
          isSaving={isSaving}
        />
      )}

      {activeMainTab === 'pembangunan' && (
        <AdminPembangunanEditor
          initialData={statsData?.pembangunan}
          onSave={handleSavePembangunan}
          isSaving={isSaving}
        />
      )}

      {activeMainTab === 'sdgs' && (
        <AdminSdgsEditor
          initialData={statsData?.sdgs}
          onSave={handleSaveSdgs}
          isSaving={isSaving}
        />
      )}

      {activeMainTab === 'indeks' && (
        <AdminIndeksEditor
          initialData={statsData?.indeks}
          onSave={handleSaveIndeks}
          isSaving={isSaving}
        />
      )}

      {activeMainTab === 'histori' && (
        <AdminStatisticsHistoryTab />
      )}

      {/* ========================================================================= */}
      {/* DIALOG: PREVIEW & KONFIRMASI IMPOR EXCEL DTSEN                             */}
      {/* ========================================================================= */}
      <Dialog open={isImportModalOpen} onOpenChange={setIsImportModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-[#ECE8E1] dark:bg-stone-900 rounded-[28px] border border-stone-300 dark:border-white/10 shadow-2xl p-6">
          <DialogHeader>
            <DialogTitle className="text-xl font-condensed font-bold uppercase text-slate-900 dark:text-white flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5 text-emerald-600" />
              Konfirmasi Impor Data Excel DTSEN
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-600 dark:text-slate-400">
              Sistem telah mendeteksi <strong>{importStats.total}</strong> baris data keluarga penerima manfaat. Periksa ringkasan sebelum menyimpan.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 my-2">
            {/* Quick Summary Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Card className="p-3 neu-card-elevated rounded-xl border border-red-500/30 text-center">
                <span className="text-[10px] uppercase font-bold text-red-600">Desil 1 (Ekstrem)</span>
                <h4 className="text-xl font-condensed font-bold text-slate-900 dark:text-white">{importStats.desil1}</h4>
              </Card>
              <Card className="p-3 neu-card-elevated rounded-xl border border-orange-500/30 text-center">
                <span className="text-[10px] uppercase font-bold text-orange-600">Desil 2 (Miskin)</span>
                <h4 className="text-xl font-condensed font-bold text-slate-900 dark:text-white">{importStats.desil2}</h4>
              </Card>
              <Card className="p-3 neu-card-elevated rounded-xl border border-yellow-500/30 text-center">
                <span className="text-[10px] uppercase font-bold text-yellow-600">Desil 3 (Hampir)</span>
                <h4 className="text-xl font-condensed font-bold text-slate-900 dark:text-white">{importStats.desil3}</h4>
              </Card>
              <Card className="p-3 neu-card-elevated rounded-xl border border-blue-500/30 text-center">
                <span className="text-[10px] uppercase font-bold text-blue-600">Desil 4 (Rentan)</span>
                <h4 className="text-xl font-condensed font-bold text-slate-900 dark:text-white">{importStats.desil4}</h4>
              </Card>
            </div>

            {/* Preview Sample Table (First 5 Rows) */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                Pratinjau 5 Baris Pertama:
              </span>
              <div className="overflow-x-auto rounded-xl border border-stone-200 dark:border-white/10 neu-inset">
                <table className="w-full text-left text-xs">
                  <thead className="bg-stone-200 dark:bg-stone-800 text-[10px] uppercase font-bold">
                    <tr>
                      <th className="py-2 px-2.5">No</th>
                      <th className="py-2 px-2.5">No KK</th>
                      <th className="py-2 px-2.5">Nama</th>
                      <th className="py-2 px-2.5">Alamat</th>
                      <th className="py-2 px-2.5">Desil</th>
                      <th className="py-2 px-2.5">Daya</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-200 dark:divide-white/10">
                    {importPreviewData.slice(0, 5).map((row, i) => (
                      <tr key={i}>
                        <td className="py-2 px-2.5 text-center font-bold">{i + 1}</td>
                        <td className="py-2 px-2.5 font-mono">{row.nomor_kartu_keluarga}</td>
                        <td className="py-2 px-2.5 font-bold">{row.nama_anggota_keluarga}</td>
                        <td className="py-2 px-2.5">{row.alamat}</td>
                        <td className="py-2 px-2.5">
                          <Badge className="font-bold text-[9px] px-1.5 py-0">Desil {row.desil_nasional}</Badge>
                        </td>
                        <td className="py-2 px-2.5">{row.daya_terpasang || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setIsImportModalOpen(false)}
              className="rounded-xl text-xs font-bold"
            >
              Batal
            </Button>
            <Button
              onClick={handleCommitImport}
              disabled={isImporting}
              className="neu-btn-dark text-[#d4e157] font-bold text-xs rounded-xl h-10 px-5 gap-2 border border-white/10"
            >
              {isImporting ? <Loader2 className="h-4 w-4 animate-spin text-[#d4e157]" /> : <CheckCircle2 className="h-4 w-4 text-[#d4e157]" />}
              <span>Simpan & Perbarui Rekapitulasi Desil</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ========================================================================= */}
      {/* DIALOG: RINCIAN LENGKAP 43 VARIABEL DTSEN UNTUK SATU KELUARGA            */}
      {/* ========================================================================= */}
      <Dialog open={!!selectedDetailItem} onOpenChange={(open) => !open && setSelectedDetailItem(null)}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto bg-[#ECE8E1] dark:bg-stone-900 rounded-[28px] border border-stone-300 dark:border-white/10 shadow-2xl p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-condensed font-bold uppercase text-slate-900 dark:text-white flex items-center justify-between">
              <span>Rincian 43 Variabel DTSEN: {selectedDetailItem?.nama_anggota_keluarga}</span>
              {selectedDetailItem && (
                <Badge
                  className={cn(
                    'font-bold text-xs px-2.5 py-0.5 rounded-full border',
                    selectedDetailItem.desil_nasional === 1 && 'bg-red-500/15 text-red-700 border-red-500/30',
                    selectedDetailItem.desil_nasional === 2 && 'bg-orange-500/15 text-orange-700 border-orange-500/30',
                    selectedDetailItem.desil_nasional === 3 && 'bg-yellow-500/15 text-yellow-700 border-yellow-500/30',
                    selectedDetailItem.desil_nasional === 4 && 'bg-blue-500/15 text-blue-700 border-blue-500/30'
                  )}
                >
                  Desil {selectedDetailItem.desil_nasional}
                </Badge>
              )}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-600 dark:text-slate-400">
              No. Kartu Keluarga: <span className="font-mono font-bold text-slate-900 dark:text-white">{selectedDetailItem?.nomor_kartu_keluarga}</span>
            </DialogDescription>
          </DialogHeader>

          {selectedDetailItem && (
            <div className="space-y-4 my-2 text-xs">
              {/* Grup 1: Identitas & Lokasi */}
              <div className="p-4 rounded-2xl neu-card-elevated border border-white/60 space-y-2">
                <span className="font-bold text-emerald-800 dark:text-emerald-400 uppercase tracking-wider text-[11px]">
                  1. Identitas & Lokasi Administratif
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-slate-700 dark:text-slate-300">
                  <div><strong>Provinsi:</strong> {selectedDetailItem.provinsi}</div>
                  <div><strong>Kabupaten:</strong> {selectedDetailItem.kabupaten_kota}</div>
                  <div><strong>Kecamatan:</strong> {selectedDetailItem.kecamatan}</div>
                  <div><strong>Desa:</strong> {selectedDetailItem.kelurahan_desa}</div>
                  <div><strong>Kode Desa:</strong> {selectedDetailItem.kode_kelurahan_desa || '-'}</div>
                  <div><strong>Alamat:</strong> {selectedDetailItem.alamat}</div>
                </div>
              </div>

              {/* Grup 2: Kelistrikan & Rumah */}
              <div className="p-4 rounded-2xl neu-card-elevated border border-white/60 space-y-2">
                <span className="font-bold text-emerald-800 dark:text-emerald-400 uppercase tracking-wider text-[11px]">
                  2. Kelistrikan & Kondisi Bangunan Rumah
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-slate-700 dark:text-slate-300">
                  <div><strong>ID PLN:</strong> {selectedDetailItem.id_pelanggan_pln || '-'}</div>
                  <div><strong>Penerangan:</strong> {selectedDetailItem.sumber_penerangan_utama || '-'}</div>
                  <div><strong>Daya:</strong> {selectedDetailItem.daya_terpasang || '-'}</div>
                  <div><strong>Status Rumah:</strong> {selectedDetailItem.status_kepemilikan_rumah || '-'}</div>
                  <div><strong>Luas Lantai:</strong> {selectedDetailItem.luas_lantai ? `${selectedDetailItem.luas_lantai} m²` : '-'}</div>
                  <div><strong>Jenis Lantai:</strong> {selectedDetailItem.jenis_lantai_terluas || '-'}</div>
                  <div><strong>Jenis Dinding:</strong> {selectedDetailItem.jenis_dinding_terluas || '-'}</div>
                  <div><strong>Jenis Atap:</strong> {selectedDetailItem.jenis_atap_terluas || '-'}</div>
                  <div><strong>Bahan Masak:</strong> {selectedDetailItem.bahan_bakar_utama_memasak || '-'}</div>
                </div>
              </div>

              {/* Grup 3: Air Bersih & Sanitasi */}
              <div className="p-4 rounded-2xl neu-card-elevated border border-white/60 space-y-2">
                <span className="font-bold text-emerald-800 dark:text-emerald-400 uppercase tracking-wider text-[11px]">
                  3. Air Bersih & Sanitasi
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-slate-700 dark:text-slate-300">
                  <div><strong>Sumber Air:</strong> {selectedDetailItem.sumber_air_minum_utama || '-'}</div>
                  <div><strong>Fasilitas BAB:</strong> {selectedDetailItem.fasilitas_bab || '-'}</div>
                  <div><strong>Jenis Kloset:</strong> {selectedDetailItem.jenis_kloset || '-'}</div>
                  <div><strong>Pembuangan Tinja:</strong> {selectedDetailItem.pembuangan_akhir_tinja || '-'}</div>
                  <div><strong>Kepemilikan Aset:</strong> {selectedDetailItem.kepemilikan_aset || '-'}</div>
                </div>
              </div>

              {/* Grup 4: Aset Bergerak & Elektronik */}
              <div className="p-4 rounded-2xl neu-card-elevated border border-white/60 space-y-2">
                <span className="font-bold text-emerald-800 dark:text-emerald-400 uppercase tracking-wider text-[11px]">
                  4. Kepemilikan Aset Bergerak & Elektronik
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-slate-700 dark:text-slate-300">
                  <div><strong>Tabung Gas:</strong> {selectedDetailItem.aset_bergerak_tabung_gas || '-'}</div>
                  <div><strong>Lemari Es:</strong> {selectedDetailItem.aset_bergerak_lemari_es || '-'}</div>
                  <div><strong>AC:</strong> {selectedDetailItem.aset_bergerak_ac || '-'}</div>
                  <div><strong>Pemanas Air:</strong> {selectedDetailItem.aset_bergerak_pemanas_air || '-'}</div>
                  <div><strong>Telepon Rumah:</strong> {selectedDetailItem.aset_bergerak_telepon_rumah || '-'}</div>
                  <div><strong>TV Datar:</strong> {selectedDetailItem.aset_bergerak_tv_datar || '-'}</div>
                  <div><strong>Emas/Perhiasan:</strong> {selectedDetailItem.aset_bergerak_emas_perhiasan || '-'}</div>
                  <div><strong>Komputer/Laptop:</strong> {selectedDetailItem.aset_bergerak_komputer_laptop_tablet || '-'}</div>
                  <div><strong>Sepeda Motor:</strong> {selectedDetailItem.aset_bergerak_sepeda_motor || '-'}</div>
                  <div><strong>Sepeda:</strong> {selectedDetailItem.aset_bergerak_sepeda || '-'}</div>
                  <div><strong>Mobil:</strong> {selectedDetailItem.aset_bergerak_mobil || '-'}</div>
                  <div><strong>Perahu/Kapal:</strong> {selectedDetailItem.aset_bergerak_kapal_perahu_motor || selectedDetailItem.aset_bergerak_perahu || '-'}</div>
                  <div><strong>Smartphone:</strong> {selectedDetailItem.aset_bergerak_smartphone || '-'}</div>
                  <div><strong>Lahan Lainnya:</strong> {selectedDetailItem.aset_tidak_bergerak_lahan_lainnya || '-'}</div>
                </div>
              </div>

              {/* Grup 5: Ternak */}
              <div className="p-4 rounded-2xl neu-card-elevated border border-white/60 space-y-2">
                <span className="font-bold text-emerald-800 dark:text-emerald-400 uppercase tracking-wider text-[11px]">
                  5. Kepemilikan Hewan Ternak
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-slate-700 dark:text-slate-300 font-medium">
                  <div><strong>Sapi:</strong> {selectedDetailItem.jumlah_ternak_sapi ?? 0} ekor</div>
                  <div><strong>Kerbau:</strong> {selectedDetailItem.jumlah_ternak_kerbau ?? 0} ekor</div>
                  <div><strong>Kuda:</strong> {selectedDetailItem.jumlah_ternak_kuda ?? 0} ekor</div>
                  <div><strong>Babi:</strong> {selectedDetailItem.jumlah_ternak_babi ?? 0} ekor</div>
                  <div><strong>Kambing/Domba:</strong> {selectedDetailItem.jumlah_ternak_kambing_domba ?? 0} ekor</div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              onClick={() => setSelectedDetailItem(null)}
              className="neu-btn-dark text-[#d4e157] font-bold text-xs rounded-xl h-9"
            >
              Tutup
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
