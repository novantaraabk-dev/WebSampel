'use client';

import React, { useState, useRef, useMemo } from 'react';
import { PageHeader } from '@/components/page-header';
import {
  FileSpreadsheet,
  Download,
  Upload,
  Search,
  RefreshCw,
  Eye,
  Trash2,
  Sparkles,
  Layers,
  ShieldCheck,
  CheckCircle2,
  TrendingDown,
  Coins,
  BarChart3,
  Users,
  Check,
  Zap,
  Home,
  Droplets,
  AlertCircle,
  Loader2,
  FileDown,
  Info,
  HelpCircle,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import {
  collection,
  doc,
  query,
  where,
  limit,
  getDocs,
  deleteDoc,
  setDoc,
  writeBatch,
  serverTimestamp,
} from 'firebase/firestore';
import { useFirestore, useMemoFirebase, useDoc, useCollection } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
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
  StatistikSosialConfig,
  DtsenItem,
  DesilStatistikItem,
} from '@/lib/types';
import {
  DTSEN_EXCEL_COLUMNS,
  SEED_STATISTIK_SOSIAL,
  SEED_DTSEN_SAMPLE_LIST,
} from '@/lib/statistik-sosial-data';
import { cn } from '@/lib/utils';

const DTSEN_CATEGORIZED_COLUMNS = [
  {
    category: '1. Identitas & Lokasi Administratif (7 Kolom)',
    columns: [
      { key: 'nomor_kartu_keluarga', label: 'Nomor Kartu Keluarga (16 digit)', contoh: '3324081203000001' },
      { key: 'nama_anggota_keluarga', label: 'Nama Lengkap Kepala / Anggota Keluarga', contoh: 'SUTRISNO' },
      { key: 'provinsi', label: 'Nama Provinsi', contoh: 'Jawa Tengah' },
      { key: 'kabupaten_kota', label: 'Nama Kabupaten / Kota', contoh: 'Kendal' },
      { key: 'kecamatan', label: 'Nama Kecamatan', contoh: 'Sayung' },
      { key: 'kelurahan_desa', label: 'Nama Desa / Kelurahan', contoh: 'Sampeldes' },
      { key: 'alamat', label: 'Alamat Lengkap / Dusun / RT / RW', contoh: 'Dusun Sampeldes RT 02 RW 01' },
    ],
  },
  {
    category: '2. Klasifikasi & Kelistrikan (4 Kolom)',
    columns: [
      { key: 'desil_nasional', label: 'Desil Kesejahteraan (Angka 1, 2, 3, atau 4)', contoh: '1' },
      { key: 'id_pelanggan_pln', label: 'Nomor Meteran / ID Pelanggan PLN', contoh: '521098765432' },
      { key: 'sumber_penerangan_utama', label: 'Sumber Penerangan Rumah', contoh: 'Listrik PLN' },
      { key: 'daya_terpasang', label: 'Daya Listrik Terpasang', contoh: '450 VA' },
    ],
  },
  {
    category: '3. Kondisi Bangunan Tempat Tinggal (6 Kolom)',
    columns: [
      { key: 'status_kepemilikan_rumah', label: 'Status Kepemilikan Rumah', contoh: 'Milik Sendiri / Sewa / Numpang' },
      { key: 'luas_lantai', label: 'Luas Lantai Rumah (m²)', contoh: '42' },
      { key: 'jenis_lantai_terluas', label: 'Jenis Bahan Lantai Terluas', contoh: 'Semen / Plester' },
      { key: 'jenis_dinding_terluas', label: 'Jenis Bahan Dinding Terluas', contoh: 'Tembok Tanpa Plester' },
      { key: 'jenis_atap_terluas', label: 'Jenis Bahan Atap Terluas', contoh: 'Genteng Tanah' },
      { key: 'bahan_bakar_utama_memasak', label: 'Bahan Bakar Utama Memasak', contoh: 'Gas LPG 3 Kg' },
    ],
  },
  {
    category: '4. Fasilitas Sanitasi & Air Bersih (4 Kolom)',
    columns: [
      { key: 'sumber_air_minum_utama', label: 'Sumber Air Minum Utama', contoh: 'Sumur Terlindung' },
      { key: 'fasilitas_bab', label: 'Fasilitas Buang Air Besar (BAB)', contoh: 'Jamban Sendiri' },
      { key: 'jenis_kloset', label: 'Jenis Kloset Jamban', contoh: 'Leher Angsa' },
      { key: 'pembuangan_akhir_tinja', label: 'Tempat Pembuangan Akhir Tinja', contoh: 'Tangki Septik' },
    ],
  },
  {
    category: '5. Kepemilikan Aset Bergerak & Elektronik (16 Kolom)',
    columns: [
      { key: 'kepemilikan_aset', label: 'Status Kepemilikan Aset', contoh: 'Ada / Tidak' },
      { key: 'aset_bergerak_tabung_gas', label: 'Tabung Gas LPG 3 Kg', contoh: 'Ya (1 tabung)' },
      { key: 'aset_bergerak_lemari_es', label: 'Lemari Es / Kulkas', contoh: 'Ya / Tidak' },
      { key: 'aset_bergerak_ac', label: 'Pendingin Ruangan (AC)', contoh: 'Tidak' },
      { key: 'aset_bergerak_pemanas_air', label: 'Pemanas Air (Water Heater)', contoh: 'Tidak' },
      { key: 'aset_bergerak_telepon_rumah', label: 'Telepon Kabel Rumah', contoh: 'Tidak' },
      { key: 'aset_bergerak_tv_datar', label: 'Televisi Layar Datar', contoh: 'Ya (24 inch)' },
      { key: 'aset_bergerak_emas_perhiasan', label: 'Emas / Perhiasan Tabungan', contoh: 'Tidak' },
      { key: 'aset_bergerak_komputer_laptop_tablet', label: 'Komputer / Laptop / Tablet', contoh: 'Tidak' },
      { key: 'aset_bergerak_sepeda_motor', label: 'Sepeda Motor', contoh: 'Ya (1 unit 2011)' },
      { key: 'aset_bergerak_sepeda', label: 'Sepeda Kayuh', contoh: 'Ya (1 unit)' },
      { key: 'aset_bergerak_mobil', label: 'Mobil Pribadi', contoh: 'Tidak' },
      { key: 'aset_bergerak_perahu', label: 'Perahu Non-Mesin', contoh: 'Tidak' },
      { key: 'aset_bergerak_kapal_perahu_motor', label: 'Perahu / Kapal Bermotor', contoh: 'Tidak' },
      { key: 'aset_bergerak_smartphone', label: 'Smartphone / HP Android', contoh: 'Ya (1 unit)' },
      { key: 'aset_tidak_bergerak_lahan_lainnya', label: 'Tanah / Lahan Lainnya', contoh: 'Tidak' },
    ],
  },
  {
    category: '6. Peternakan & Kode Wilayah (6 Kolom)',
    columns: [
      { key: 'jumlah_ternak_sapi', label: 'Jumlah Sapi (ekor)', contoh: '0' },
      { key: 'jumlah_ternak_kerbau', label: 'Jumlah Kerbau (ekor)', contoh: '0' },
      { key: 'jumlah_ternak_kuda', label: 'Jumlah Kuda (ekor)', contoh: '0' },
      { key: 'jumlah_ternak_babi', label: 'Jumlah Babi (ekor)', contoh: '0' },
      { key: 'jumlah_ternak_kambing_domba', label: 'Jumlah Kambing / Domba (ekor)', contoh: '2' },
      { key: 'kode_kelurahan_desa', label: 'Kode Kemendagri Desa Sampeldes', contoh: '3324080004' },
    ],
  },
];

export default function ManajemenDtsenPage() {
  const firestore = useFirestore();
  const { toast } = useToast();

  // Active Main Tab
  const [activeTab, setActiveTab] = useState<'kpm' | 'rekap-desil' | 'rekap-tren'>('kpm');

  // Dokumen Konfigurasi Statistik Sosial dari Firestore
  const configDocRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, 'statisticsSocial', 'default');
  }, [firestore]);

  const { data: configData } = useDoc<StatistikSosialConfig>(configDocRef);

  // Fallback Data Konfigurasi Desil & Tren
  const config: StatistikSosialConfig = useMemo(() => {
    if (configData && configData.desilList && configData.desilList.length > 0) {
      return configData;
    }
    return SEED_STATISTIK_SOSIAL;
  }, [configData]);

  // Fetch sample untuk agregasi rekapan
  const dtsenAggQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'dtsenList'), limit(150));
  }, [firestore]);

  const { data: dtsenListFirestore } = useCollection<DtsenItem>(dtsenAggQuery);

  const dtsenAggregateList: DtsenItem[] = useMemo(() => {
    if (dtsenListFirestore && dtsenListFirestore.length > 0) return dtsenListFirestore;
    return SEED_DTSEN_SAMPLE_LIST;
  }, [dtsenListFirestore]);

  // Agregasi Hasil Rekapan 43 Variabel dari Data yang Terdata
  const dtsenRecapAnalytics = useMemo(() => {
    const list = dtsenAggregateList;
    const total = list.length || 1;

    // 1. Daya Listrik
    const dayaMap: Record<string, number> = {
      '450 VA': 0,
      '900 VA': 0,
      '1300 VA+': 0,
      'Non-PLN': 0,
    };
    list.forEach((item) => {
      const d = (item.daya_terpasang || '').toUpperCase();
      if (d.includes('450')) dayaMap['450 VA']++;
      else if (d.includes('900')) dayaMap['900 VA']++;
      else if (d.includes('1300') || d.includes('2200')) dayaMap['1300 VA+']++;
      else dayaMap['Non-PLN']++;
    });

    // 2. Status Kepemilikan Rumah
    const rumahMap: Record<string, number> = {
      'Milik Sendiri': 0,
      Menumpang: 0,
      'Sewa / Kontrak': 0,
      Lainnya: 0,
    };
    list.forEach((item) => {
      const s = (item.status_kepemilikan_rumah || '').toLowerCase();
      if (s.includes('sendiri')) rumahMap['Milik Sendiri']++;
      else if (s.includes('numpang')) rumahMap['Menumpang']++;
      else if (s.includes('sewa') || s.includes('kontrak')) rumahMap['Sewa / Kontrak']++;
      else rumahMap['Lainnya']++;
    });

    // 3. Sanitasi BAB
    const babMap: Record<string, number> = {
      'Jamban Sendiri': 0,
      'Jamban Bersama': 0,
      'Jamban Umum': 0,
      'Belum Memiliki': 0,
    };
    list.forEach((item) => {
      const f = (item.fasilitas_bab || '').toLowerCase();
      if (f.includes('sendiri')) babMap['Jamban Sendiri']++;
      else if (f.includes('bersama')) babMap['Jamban Bersama']++;
      else if (f.includes('umum')) babMap['Jamban Umum']++;
      else babMap['Belum Memiliki']++;
    });

    // 4. Sumber Air Minum
    const airMap: Record<string, number> = {
      'Sumur Terlindung': 0,
      'Sumur Gali / Bor': 0,
      'PDAM / Ledeng': 0,
      'Mata Air / Lainnya': 0,
    };
    list.forEach((item) => {
      const a = (item.sumber_air_minum_utama || '').toLowerCase();
      if (a.includes('lindung')) airMap['Sumur Terlindung']++;
      else if (a.includes('bor') || a.includes('gali') || a.includes('pompa')) airMap['Sumur Gali / Bor']++;
      else if (a.includes('pdam') || a.includes('ledeng')) airMap['PDAM / Ledeng']++;
      else airMap['Mata Air / Lainnya']++;
    });

    // 5. Kepemilikan Aset Produktif
    let motorCount = 0;
    let gasCount = 0;
    let kulkasCount = 0;
    let hpCount = 0;
    let ternakCount = 0;
    list.forEach((item) => {
      const m = (item.aset_bergerak_sepeda_motor || '').toLowerCase();
      if (m.includes('ya') || m.includes('unit') || m.includes('1') || m.includes('ada')) motorCount++;

      const g = (item.aset_bergerak_tabung_gas || '').toLowerCase();
      if (g.includes('ya') || g.includes('tabung') || g.includes('1') || g.includes('ada')) gasCount++;

      const k = (item.aset_bergerak_lemari_es || '').toLowerCase();
      if (k.includes('ya') || k.includes('ada')) kulkasCount++;

      const h = (item.aset_bergerak_smartphone || '').toLowerCase();
      if (h.includes('ya') || h.includes('ada')) hpCount++;

      const sapi = Number(item.jumlah_ternak_sapi) || 0;
      const kambing = Number(item.jumlah_ternak_kambing_domba) || 0;
      if (sapi > 0 || kambing > 0) ternakCount++;
    });

    return {
      totalSample: list.length,
      dayaList: Object.entries(dayaMap).map(([k, v]) => ({
        label: k,
        jumlah: v,
        persen: Number(((v / total) * 100).toFixed(1)),
      })),
      rumahList: Object.entries(rumahMap).map(([k, v]) => ({
        label: k,
        jumlah: v,
        persen: Number(((v / total) * 100).toFixed(1)),
      })),
      sanitasiList: Object.entries(babMap).map(([k, v]) => ({
        label: k,
        jumlah: v,
        persen: Number(((v / total) * 100).toFixed(1)),
      })),
      airList: Object.entries(airMap).map(([k, v]) => ({
        label: k,
        jumlah: v,
        persen: Number(((v / total) * 100).toFixed(1)),
      })),
      asetList: [
        { label: 'Tabung Gas LPG 3 Kg', jumlah: gasCount, persen: Number(((gasCount / total) * 100).toFixed(1)) },
        { label: 'Sepeda Motor', jumlah: motorCount, persen: Number(((motorCount / total) * 100).toFixed(1)) },
        { label: 'Smartphone / HP', jumlah: hpCount, persen: Number(((hpCount / total) * 100).toFixed(1)) },
        { label: 'Lemari Es (Kulkas)', jumlah: kulkasCount, persen: Number(((kulkasCount / total) * 100).toFixed(1)) },
        { label: 'Hewan Ternak (Sapi / Kambing)', jumlah: ternakCount, persen: Number(((ternakCount / total) * 100).toFixed(1)) },
      ],
    };
  }, [dtsenAggregateList]);

  // State Pencarian Tabel Hemat Kuota
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDesil, setFilterDesil] = useState<string>('all');
  const [searchResults, setSearchResults] = useState<DtsenItem[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [isSearchingDtsen, setIsSearchingDtsen] = useState(false);
  const [isSampleMode, setIsSampleMode] = useState(false);
  const [searchStats, setSearchStats] = useState<{ reads: number; isCached: boolean; note?: string } | null>(null);
  const searchCacheRef = useRef<Map<string, DtsenItem[]>>(new Map());

  // State Detail Modal 43 Variabel
  const [selectedDetailItem, setSelectedDetailItem] = useState<DtsenItem | null>(null);

  // State Impor File Excel & Panduan Kolom
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isColumnGuideOpen, setIsColumnGuideOpen] = useState(false);
  const [columnSearchQuery, setColumnSearchQuery] = useState('');
  const [importPreviewData, setImportPreviewData] = useState<DtsenItem[]>([]);
  const [importStats, setImportStats] = useState({ total: 0, desil1: 0, desil2: 0, desil3: 0, desil4: 0 });
  const [isImporting, setIsImporting] = useState(false);

  // Format angka ribuan
  const formatNum = (num: number | undefined) => {
    return new Intl.NumberFormat('id-ID').format(num || 0);
  };

  const formatRupiah = (val: number | undefined) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(val || 0);
  };

  // 1. Eksekusi Pencarian Hemat Kuota
  const handleSearchDtsen = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!firestore) return;

    const trimmedQuery = searchQuery.trim();
    const cacheKey = `${trimmedQuery}_${filterDesil}`;

    // Cek cache lokal browser
    if (searchCacheRef.current.has(cacheKey)) {
      const cached = searchCacheRef.current.get(cacheKey) || [];
      setSearchResults(cached);
      setHasSearched(true);
      setIsSampleMode(false);
      setSearchStats({ reads: 0, isCached: true, note: 'Memuat dari memori cache lokal' });
      toast({
        title: 'Hasil Ditemukan (Cache)',
        description: `Menampilkan ${cached.length} data KPM dari memori browser (0 kuota Firestore).`,
      });
      return;
    }

    setIsSearchingDtsen(true);
    try {
      const dtsenCol = collection(firestore, 'dtsenList');
      let docsData: DtsenItem[] = [];
      let readsCount = 0;

      const isDigitsOnly = /^\d+$/.test(trimmedQuery);
      if (isDigitsOnly && trimmedQuery.length >= 3) {
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
        description: `Ditemukan ${docsData.length} data KPM (${readsCount} kuota Firestore terbaca).`,
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

  // Muat Sampel Demo (0 Kuota)
  const handleLoadSamplePreview = () => {
    setSearchResults(SEED_DTSEN_SAMPLE_LIST);
    setHasSearched(true);
    setIsSampleMode(true);
    setSearchStats({ reads: 0, isCached: true, note: 'Sampel data offline (0 kuota)' });
    toast({
      title: 'Sampel Demo Aktif',
      description: 'Menampilkan data contoh offline untuk verifikasi tabel tanpa kuota database.',
    });
  };

  // Muat 20 Data Awal Database
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

  // Reset pencarian
  const handleResetSearch = () => {
    setSearchResults([]);
    setHasSearched(false);
    setIsSampleMode(false);
    setSearchQuery('');
    setFilterDesil('all');
    setSearchStats(null);
  };

  // Hapus KPM dari Firestore
  const handleDeleteDtsen = async (id?: string) => {
    if (!firestore || !id) return;
    if (!confirm('Apakah Anda yakin ingin menghapus data KPM ini dari database?')) return;

    try {
      await deleteDoc(doc(firestore, 'dtsenList', id));
      setSearchResults(prev => prev.filter(item => item.id !== id));
      searchCacheRef.current.clear();
      toast({
        title: 'Berhasil Dihapus',
        description: 'Data KPM berhasil dihapus dari database.',
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

  // Download Template Excel
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
      XLSX.utils.book_append_sheet(wb, ws, 'Template_DTSEN');
      XLSX.writeFile(wb, 'Template_DTSEN_Desa_Sampeldes_43Kolom.xlsx');

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

  // Ekspor Data KPM / Rekapan ke Excel
  const handleExportExcel = () => {
    try {
      const dataToExport = searchResults.length > 0 ? searchResults : dtsenAggregateList;
      const ws = XLSX.utils.json_to_sheet(dataToExport);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Data_KPM_DTSEN');
      XLSX.writeFile(wb, `Data_KPM_DTSEN_Desa_Sampeldes_${new Date().toISOString().split('T')[0]}.xlsx`);

      toast({
        title: 'Data Berhasil Diekspor',
        description: `Berhasil mengekspor ${dataToExport.length} data KPM ke format Excel.`,
      });
    } catch (err: any) {
      toast({
        title: 'Gagal Ekspor',
        description: err?.message || 'Terjadi kesalahan saat mengekspor.',
        variant: 'destructive',
      });
    }
  };

  // Upload Excel Handler
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

        let d1 = 0, d2 = 0, d3 = 0, d4 = 0;
        const parsedRows: DtsenItem[] = rawJson.map((row, idx) => {
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
          description: err?.message || 'Pastikan file spreadsheet Excel (.xlsx / .xls) valid.',
          variant: 'destructive',
        });
      } finally {
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.readAsBinaryString(file);
  };

  // Simpan data impor ke Firestore
  const handleCommitImport = async () => {
    if (!firestore || importPreviewData.length === 0) return;

    setIsImporting(true);
    try {
      const chunkSize = 400;
      for (let i = 0; i < importPreviewData.length; i += chunkSize) {
        const chunk = importPreviewData.slice(i, i + chunkSize);
        const batch = writeBatch(firestore);

        chunk.forEach((item, chunkIdx) => {
          const docId = item.id || `dtsen_${item.nomor_kartu_keluarga || Date.now()}_${chunkIdx}`;
          const itemDocRef = doc(firestore, 'dtsenList', docId);

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

      // Update Desil Stats in config
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
        ...config,
        totalKpmDtsen: importStats.total,
        desilList: updatedDesilList,
      };

      await setDoc(doc(firestore, 'statisticsSocial', 'default'), {
        ...newConfig,
        updatedAt: serverTimestamp(),
      }, { merge: true });

      setIsImportModalOpen(false);
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="DATA TERPADU SOSIAL EKONOMI NASIONAL (DTSEN)"
        description="Manajemen data penerima manfaat dan rekapitulasi 43 variabel kemiskinan berbasis survei DTSEN Kemensos / Regsosek di Desa Sampeldes."
      />

      {/* KPI METRIC CARDS REKAPITULASI */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        <Card className="rounded-2xl p-4 neu-card-elevated border border-white/60 space-y-1.5 border-t-4 border-t-emerald-600 transition-all hover:translate-y-[-2px]">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span className="font-bold uppercase tracking-wider text-[10px]">Total Terdata</span>
            <div className="w-7 h-7 rounded-xl bg-emerald-500/10 flex items-center justify-center">
              <Users className="h-4 w-4 text-emerald-600" />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-mono font-black text-slate-900 dark:text-white">
            {formatNum(config.totalKpmDtsen || dtsenRecapAnalytics.totalSample)}
          </p>
          <span className="text-[10px] text-emerald-600 font-bold block truncate">KPM Terverifikasi</span>
        </Card>

        {config.desilList.map((item) => {
          const borderTopClass =
            item.desil === 1
              ? 'border-t-rose-600'
              : item.desil === 2
                ? 'border-t-orange-500'
                : item.desil === 3
                  ? 'border-t-amber-500'
                  : 'border-t-sky-500';

          return (
            <Card
              key={item.desil}
              className={cn(
                'rounded-2xl p-4 neu-card-elevated border border-white/60 space-y-1.5 border-t-4 transition-all hover:translate-y-[-2px]',
                borderTopClass
              )}
            >
              <div className="flex items-center justify-between text-slate-500 text-xs">
                <span className="font-bold uppercase tracking-wider text-[10px]">Desil {item.desil}</span>
                <span
                  className="w-2.5 h-2.5 rounded-full ring-2 ring-white/50"
                  style={{ backgroundColor: item.warna || '#f59e0b' }}
                />
              </div>
              <p className="text-xl sm:text-2xl font-mono font-black text-slate-900 dark:text-white">
                {formatNum(item.jumlahKpm)}
              </p>
              <span className="text-[10px] text-slate-600 dark:text-slate-400 font-bold block truncate">
                {item.persen}% • {item.kategori}
              </span>
            </Card>
          );
        })}
      </div>

      {/* TAB NAVIGATION */}
      <div className="flex flex-wrap items-center gap-2 border-b border-stone-300 dark:border-white/10 pb-3">
        <Button
          onClick={() => setActiveTab('kpm')}
          variant={activeTab === 'kpm' ? 'default' : 'outline'}
          className={cn(
            'rounded-xl text-xs font-bold gap-2 h-10 px-4 transition-all',
            activeTab === 'kpm'
              ? 'neu-btn-dark text-teal-400 hover:bg-slate-900 shadow-md border border-white/10'
              : 'neu-card-elevated text-slate-700 dark:text-slate-300 hover:text-slate-900'
          )}
        >
          <Users className="h-4 w-4" />
          <span>Daftar KPM Terdata (Tabel 43 Variabel)</span>
        </Button>

        <Button
          onClick={() => setActiveTab('rekap-desil')}
          variant={activeTab === 'rekap-desil' ? 'default' : 'outline'}
          className={cn(
            'rounded-xl text-xs font-bold gap-2 h-10 px-4 transition-all',
            activeTab === 'rekap-desil'
              ? 'neu-btn-dark text-teal-400 hover:bg-slate-900 shadow-md border border-white/10'
              : 'neu-card-elevated text-slate-700 dark:text-slate-300 hover:text-slate-900'
          )}
        >
          <BarChart3 className="h-4 w-4" />
          <span>Hasil Rekapitulasi Desil &amp; Fasilitas</span>
        </Button>

        <Button
          onClick={() => setActiveTab('rekap-tren')}
          variant={activeTab === 'rekap-tren' ? 'default' : 'outline'}
          className={cn(
            'rounded-xl text-xs font-bold gap-2 h-10 px-4 transition-all',
            activeTab === 'rekap-tren'
              ? 'neu-btn-dark text-teal-400 hover:bg-slate-900 shadow-md border border-white/10'
              : 'neu-card-elevated text-slate-700 dark:text-slate-300 hover:text-slate-900'
          )}
        >
          <TrendingDown className="h-4 w-4" />
          <span>Hasil Rekapitulasi Tren &amp; Bansos</span>
        </Button>
      </div>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* TAB 1: DAFTAR KELUARGA PENERIMA MANFAAT TERDATA (43 KOLOM)   */}
      {/* ───────────────────────────────────────────────────────────── */}
      {activeTab === 'kpm' && (
        <div className="neu-card-elevated rounded-[28px] p-5 sm:p-6 border border-white/60 space-y-5">
          {/* Action & Header Bar */}
          <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 border-b border-stone-200 dark:border-white/10 pb-4">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-base sm:text-lg font-condensed font-bold uppercase text-slate-900 dark:text-white flex items-center gap-2">
                  <FileSpreadsheet className="h-5 w-5 text-emerald-600" />
                  Daftar KPM Terdata (43 Variabel Kemiskinan)
                </h3>
                <Badge className="bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border-emerald-500/30 text-[10px] font-bold">
                  Mode Hemat Kuota
                </Badge>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                Data survei DTSEN Kemensos / Regsosek di Desa Sampeldes. Cari data keluarga, unduh format template, atau unggah berkas Excel.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                onClick={() => setIsColumnGuideOpen(true)}
                variant="outline"
                size="sm"
                className="neu-card-elevated border border-stone-300 dark:border-white/10 rounded-xl text-xs font-bold gap-1.5 text-slate-700 dark:text-slate-200 h-9 px-3"
              >
                <Info className="h-3.5 w-3.5 text-blue-600" />
                <span>Panduan 43 Kolom</span>
              </Button>

              <Button
                onClick={handleDownloadTemplate}
                variant="outline"
                size="sm"
                className="neu-card-elevated border border-stone-300 dark:border-white/10 rounded-xl text-xs font-bold gap-1.5 text-slate-700 dark:text-slate-200 h-9 px-3"
              >
                <Download className="h-3.5 w-3.5 text-emerald-600" />
                <span>Unduh Template</span>
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
                size="sm"
                className="neu-btn-dark text-teal-400 font-bold text-xs rounded-xl h-9 px-4 gap-1.5 border border-white/10 shadow-sm"
              >
                <Upload className="h-3.5 w-3.5 text-teal-400" />
                <span>Unggah File Excel</span>
              </Button>
            </div>
          </div>

          {/* Search & Filter Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 rounded-2xl neu-inset bg-stone-200/40 dark:bg-stone-800/40 border border-stone-300/40">
            <form onSubmit={handleSearchDtsen} className="flex flex-1 flex-wrap items-center gap-2">
              <div className="relative flex-1 min-w-[200px] sm:min-w-[260px]">
                <Search className="h-4 w-4 absolute left-3 top-2.5 text-slate-500" />
                <Input
                  type="text"
                  placeholder="Cari No. KK, Nama Anggota Keluarga, atau Alamat..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 pr-3 h-9 rounded-xl neu-card-elevated border border-stone-300/60 dark:border-white/10 text-xs font-medium"
                />
              </div>

              <Select value={filterDesil} onValueChange={setFilterDesil}>
                <SelectTrigger className="w-[140px] sm:w-[150px] h-9 rounded-xl neu-card-elevated border border-stone-300/60 dark:border-white/10 text-xs font-bold">
                  <SelectValue placeholder="Semua Desil" />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-[#081d27] dark:bg-stone-900 rounded-xl shadow-xl border">
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
                className="neu-btn-dark text-teal-400 font-bold text-xs rounded-xl h-9 px-4 gap-1.5 border border-white/10 shrink-0"
              >
                {isSearchingDtsen ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-teal-400" />
                ) : (
                  <Search className="h-3.5 w-3.5 text-teal-400" />
                )}
                <span>Cari Data</span>
              </Button>

              {hasSearched && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleResetSearch}
                  className="h-9 px-3 rounded-xl neu-card-elevated border border-stone-300 dark:border-white/10 text-xs font-bold gap-1 text-slate-700 dark:text-slate-300 hover:text-slate-900 shrink-0"
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
                  Data KPM dipanggil saat Anda melakukan pencarian untuk menjaga performa dan menghemat kuota Firestore. Anda juga dapat langsung memuat 20 data awal atau menguji coba dengan sampel demo.
                </p>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-2.5 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleLoadRecentDocs}
                  disabled={isSearchingDtsen}
                  className="neu-btn-dark text-teal-400 border border-white/10 rounded-xl text-xs font-bold gap-2 h-9 px-4 shadow-sm"
                >
                  {isSearchingDtsen ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Layers className="h-3.5 w-3.5 text-teal-400" />
                  )}
                  <span>Muat 20 Data Awal Database</span>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleLoadSamplePreview}
                  className="neu-card-elevated border border-stone-300 dark:border-white/10 rounded-xl text-xs font-bold gap-2 text-slate-800 dark:text-slate-200 h-9 px-4"
                >
                  <Sparkles className="h-3.5 w-3.5 text-amber-600" />
                  <span>Lihat Sampel Demo (0 Kuota)</span>
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Stats Bar */}
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
                      {searchStats.isCached ? '⚡ 0 Kuota (Cache Lokal)' : `🔥 Pembacaan Firestore: ${searchStats.reads} Dokumen`}
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

              {/* Data Table */}
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
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* TAB 2: HASIL REKAPITULASI DESIL & FASILITAS (43 VARIABEL)     */}
      {/* ───────────────────────────────────────────────────────────── */}
      {activeTab === 'rekap-desil' && (
        <div className="space-y-6">
          {/* Tabel Rekap 1: Klasifikasi Desil Kesejahteraan */}
          <div className="neu-card-elevated rounded-[28px] p-5 sm:p-6 border border-white/60 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-200 dark:border-white/10 pb-3">
              <div>
                <h3 className="text-base font-condensed font-bold uppercase text-slate-900 dark:text-white flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-emerald-600" />
                  Tabel Rekapitulasi Desil Kesejahteraan DTSEN (Desil 1 s/d 4)
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Ringkasan kelompok desil kemiskinan nasional serta fokus intervensi bantuan sosial.
                </p>
              </div>
              <Badge className="neu-btn-dark text-teal-400 font-bold text-xs px-3 py-1 rounded-full self-start sm:self-auto">
                Total: {formatNum(config.desilList.reduce((acc, curr) => acc + (curr.jumlahKpm || 0), 0))} KPM
              </Badge>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-stone-200 dark:border-white/10 neu-inset">
              <table className="w-full text-left text-xs text-slate-800 dark:text-slate-200">
                <thead className="bg-stone-200/60 dark:bg-stone-800/60 text-slate-900 dark:text-white uppercase font-condensed font-bold tracking-wider text-[11px] border-b border-stone-300 dark:border-white/10">
                  <tr>
                    <th className="py-3 px-3.5 text-center">Kelompok Desil</th>
                    <th className="py-3 px-3.5">Kategori Kesejahteraan</th>
                    <th className="py-3 px-3.5 text-center">Jumlah KPM</th>
                    <th className="py-3 px-3.5 text-center">Persentase (%)</th>
                    <th className="py-3 px-3.5">Sasaran Intervensi Bansos</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-200 dark:divide-white/10">
                  {config.desilList.map((item) => (
                    <tr key={item.desil} className="hover:bg-white/40 dark:hover:bg-white/5 transition-colors">
                      <td className="py-3 px-3.5 text-center">
                        <Badge
                          className="font-bold text-[11px] px-2.5 py-0.5 rounded-full border"
                          style={{
                            backgroundColor: `${item.warna}20`,
                            color: item.warna,
                            borderColor: `${item.warna}40`,
                          }}
                        >
                          Desil {item.desil}
                        </Badge>
                      </td>
                      <td className="py-3 px-3.5 font-bold text-slate-900 dark:text-white">
                        {item.kategori}
                      </td>
                      <td className="py-3 px-3.5 text-center font-mono font-bold text-slate-900 dark:text-white">
                        {formatNum(item.jumlahKpm)} KPM
                      </td>
                      <td className="py-3 px-3.5 text-center font-mono font-bold">
                        {item.persen}%
                      </td>
                      <td className="py-3 px-3.5 text-slate-600 dark:text-slate-300 text-[11px] leading-relaxed">
                        {item.keterangan || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Grid 2 Tabel: Rekap Daya Listrik & Status Kepemilikan Rumah */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Tabel Daya Listrik */}
            <div className="neu-card-elevated rounded-[28px] p-5 border border-white/60 space-y-3">
              <div className="flex items-center gap-2 border-b border-stone-200 dark:border-white/10 pb-2.5">
                <Zap className="h-4 w-4 text-amber-500" />
                <h4 className="font-condensed font-bold text-sm uppercase text-slate-900 dark:text-white">
                  Rekapitulasi Daya Listrik Terpasang
                </h4>
              </div>
              <div className="overflow-x-auto rounded-xl border border-stone-200 dark:border-white/10 neu-inset">
                <table className="w-full text-left text-xs">
                  <thead className="bg-stone-200/50 dark:bg-stone-800/50 text-[10px] uppercase font-bold text-slate-700 dark:text-slate-300">
                    <tr>
                      <th className="py-2.5 px-3">Daya Listrik</th>
                      <th className="py-2.5 px-3 text-center">Jumlah KPM</th>
                      <th className="py-2.5 px-3 text-center">Persentase</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-200 dark:divide-white/10">
                    {dtsenRecapAnalytics.dayaList.map((row) => (
                      <tr key={row.label}>
                        <td className="py-2 px-3 font-semibold text-slate-800 dark:text-slate-200">{row.label}</td>
                        <td className="py-2 px-3 text-center font-mono font-bold">{formatNum(row.jumlah)}</td>
                        <td className="py-2 px-3 text-center font-mono font-bold text-amber-600">{row.persen}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Tabel Status Kepemilikan Rumah */}
            <div className="neu-card-elevated rounded-[28px] p-5 border border-white/60 space-y-3">
              <div className="flex items-center gap-2 border-b border-stone-200 dark:border-white/10 pb-2.5">
                <Home className="h-4 w-4 text-emerald-600" />
                <h4 className="font-condensed font-bold text-sm uppercase text-slate-900 dark:text-white">
                  Rekapitulasi Status Kepemilikan Rumah
                </h4>
              </div>
              <div className="overflow-x-auto rounded-xl border border-stone-200 dark:border-white/10 neu-inset">
                <table className="w-full text-left text-xs">
                  <thead className="bg-stone-200/50 dark:bg-stone-800/50 text-[10px] uppercase font-bold text-slate-700 dark:text-slate-300">
                    <tr>
                      <th className="py-2.5 px-3">Status Rumah</th>
                      <th className="py-2.5 px-3 text-center">Jumlah KPM</th>
                      <th className="py-2.5 px-3 text-center">Persentase</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-200 dark:divide-white/10">
                    {dtsenRecapAnalytics.rumahList.map((row) => (
                      <tr key={row.label}>
                        <td className="py-2 px-3 font-semibold text-slate-800 dark:text-slate-200">{row.label}</td>
                        <td className="py-2 px-3 text-center font-mono font-bold">{formatNum(row.jumlah)}</td>
                        <td className="py-2 px-3 text-center font-mono font-bold text-emerald-600">{row.persen}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Grid 2 Tabel: Sanitasi & Air Minum */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Tabel Sanitasi BAB */}
            <div className="neu-card-elevated rounded-[28px] p-5 border border-white/60 space-y-3">
              <div className="flex items-center gap-2 border-b border-stone-200 dark:border-white/10 pb-2.5">
                <Droplets className="h-4 w-4 text-blue-500" />
                <h4 className="font-condensed font-bold text-sm uppercase text-slate-900 dark:text-white">
                  Rekapitulasi Fasilitas Sanitasi BAB
                </h4>
              </div>
              <div className="overflow-x-auto rounded-xl border border-stone-200 dark:border-white/10 neu-inset">
                <table className="w-full text-left text-xs">
                  <thead className="bg-stone-200/50 dark:bg-stone-800/50 text-[10px] uppercase font-bold text-slate-700 dark:text-slate-300">
                    <tr>
                      <th className="py-2.5 px-3">Fasilitas Jamban</th>
                      <th className="py-2.5 px-3 text-center">Jumlah KPM</th>
                      <th className="py-2.5 px-3 text-center">Persentase</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-200 dark:divide-white/10">
                    {dtsenRecapAnalytics.sanitasiList.map((row) => (
                      <tr key={row.label}>
                        <td className="py-2 px-3 font-semibold text-slate-800 dark:text-slate-200">{row.label}</td>
                        <td className="py-2 px-3 text-center font-mono font-bold">{formatNum(row.jumlah)}</td>
                        <td className="py-2 px-3 text-center font-mono font-bold text-blue-600">{row.persen}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Tabel Sumber Air Minum */}
            <div className="neu-card-elevated rounded-[28px] p-5 border border-white/60 space-y-3">
              <div className="flex items-center gap-2 border-b border-stone-200 dark:border-white/10 pb-2.5">
                <Droplets className="h-4 w-4 text-sky-600" />
                <h4 className="font-condensed font-bold text-sm uppercase text-slate-900 dark:text-white">
                  Rekapitulasi Sumber Air Minum Utama
                </h4>
              </div>
              <div className="overflow-x-auto rounded-xl border border-stone-200 dark:border-white/10 neu-inset">
                <table className="w-full text-left text-xs">
                  <thead className="bg-stone-200/50 dark:bg-stone-800/50 text-[10px] uppercase font-bold text-slate-700 dark:text-slate-300">
                    <tr>
                      <th className="py-2.5 px-3">Sumber Air</th>
                      <th className="py-2.5 px-3 text-center">Jumlah KPM</th>
                      <th className="py-2.5 px-3 text-center">Persentase</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-200 dark:divide-white/10">
                    {dtsenRecapAnalytics.airList.map((row) => (
                      <tr key={row.label}>
                        <td className="py-2 px-3 font-semibold text-slate-800 dark:text-slate-200">{row.label}</td>
                        <td className="py-2 px-3 text-center font-mono font-bold">{formatNum(row.jumlah)}</td>
                        <td className="py-2 px-3 text-center font-mono font-bold text-sky-600">{row.persen}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Tabel Rekapitulasi Kepemilikan Aset Produktif & Ternak */}
          <div className="neu-card-elevated rounded-[28px] p-5 sm:p-6 border border-white/60 space-y-4">
            <h4 className="font-condensed font-bold text-base uppercase text-slate-900 dark:text-white">
              Rekapitulasi Kepemilikan Aset Bergerak &amp; Ternak Keluarga
            </h4>
            <div className="overflow-x-auto rounded-2xl border border-stone-200 dark:border-white/10 neu-inset">
              <table className="w-full text-left text-xs text-slate-800 dark:text-slate-200">
                <thead className="bg-stone-200/60 dark:bg-stone-800/60 text-slate-900 dark:text-white uppercase font-condensed font-bold tracking-wider text-[11px] border-b border-stone-300 dark:border-white/10">
                  <tr>
                    <th className="py-3 px-3.5">Jenis Aset Rumah Tangga</th>
                    <th className="py-3 px-3.5 text-center">Keluarga yang Memiliki</th>
                    <th className="py-3 px-3.5 text-center">Persentase Terhadap Total</th>
                    <th className="py-3 px-3.5">Status Indikator Kesejahteraan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-200 dark:divide-white/10">
                  {dtsenRecapAnalytics.asetList.map((item, idx) => (
                    <tr key={idx} className="hover:bg-white/40 dark:hover:bg-white/5 transition-colors">
                      <td className="py-3 px-3.5 font-bold text-slate-900 dark:text-white">
                        {item.label}
                      </td>
                      <td className="py-3 px-3.5 text-center font-mono font-bold text-emerald-800 dark:text-emerald-400">
                        {formatNum(item.jumlah)} KPM
                      </td>
                      <td className="py-3 px-3.5 text-center font-mono font-bold">
                        {item.persen}%
                      </td>
                      <td className="py-3 px-3.5 text-slate-600 dark:text-slate-300 text-[11px]">
                        {item.persen > 50 ? 'Umum dimiliki warga' : 'Aset terbatas / prioritas bantuan pemberdayaan'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* TAB 3: HASIL REKAPITULASI TREN & PENYALURAN BANSOS            */}
      {/* ───────────────────────────────────────────────────────────── */}
      {activeTab === 'rekap-tren' && (
        <div className="space-y-6">
          {/* Tabel Rekapitulasi Tren Kemiskinan Tahunan */}
          <div className="neu-card-elevated rounded-[28px] p-5 sm:p-6 border border-white/60 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-200 dark:border-white/10 pb-3">
              <div>
                <h3 className="text-base font-condensed font-bold uppercase text-slate-900 dark:text-white flex items-center gap-2">
                  <TrendingDown className="h-5 w-5 text-emerald-600" />
                  Tabel Rekapitulasi Tren Penurunan Kemiskinan Tahunan Desa Sampeldes
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Perkembangan capaian penanggulangan kemiskinan dan alokasi penerima BLT Dana Desa dari tahun ke tahun.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-stone-200 dark:border-white/10 neu-inset">
              <table className="w-full text-left text-xs text-slate-800 dark:text-slate-200">
                <thead className="bg-stone-200/60 dark:bg-stone-800/60 text-slate-900 dark:text-white uppercase font-condensed font-bold tracking-wider text-[11px] border-b border-stone-300 dark:border-white/10">
                  <tr>
                    <th className="py-3 px-3.5 text-center">Tahun</th>
                    <th className="py-3 px-3.5">Jumlah Warga Miskin</th>
                    <th className="py-3 px-3.5 text-center">Persentase</th>
                    <th className="py-3 px-3.5 text-center">Penerima BLT-DD</th>
                    <th className="py-3 px-3.5">Keterangan / Kebijakan Strategis</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-200 dark:divide-white/10">
                  {(config.trenList || []).map((row, idx) => (
                    <tr key={idx} className="hover:bg-white/40 dark:hover:bg-white/5 transition-colors">
                      <td className="py-3 px-3.5 text-center font-bold font-mono text-slate-900 dark:text-white">
                        {row.tahun}
                      </td>
                      <td className="py-3 px-3.5 font-bold text-emerald-800 dark:text-emerald-400 font-mono">
                        {formatNum(row.jumlahWargaMiskin)} Jiwa
                      </td>
                      <td className="py-3 px-3.5 text-center font-bold font-mono">
                        {row.persentase}%
                      </td>
                      <td className="py-3 px-3.5 text-center font-bold font-mono">
                        {row.kpmBlt} KPM
                      </td>
                      <td className="py-3 px-3.5 text-slate-600 dark:text-slate-300 text-[11px]">
                        {row.keterangan || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Tabel Rekapitulasi Program Bantuan Sosial (Bansos) */}
          <div className="neu-card-elevated rounded-[28px] p-5 sm:p-6 border border-white/60 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-200 dark:border-white/10 pb-3">
              <div>
                <h3 className="text-base font-condensed font-bold uppercase text-slate-900 dark:text-white flex items-center gap-2">
                  <Coins className="h-5 w-5 text-amber-500" />
                  Tabel Rekapitulasi Penyaluran Bantuan Sosial Resmi
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Data penyaluran jaring pengaman sosial bersumber dari Kemensos, APBD, dan APBDes Desa Sampeldes.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-stone-200 dark:border-white/10 neu-inset">
              <table className="w-full text-left text-xs text-slate-800 dark:text-slate-200">
                <thead className="bg-stone-200/60 dark:bg-stone-800/60 text-slate-900 dark:text-white uppercase font-condensed font-bold tracking-wider text-[11px] border-b border-stone-300 dark:border-white/10">
                  <tr>
                    <th className="py-3 px-3.5">Nama Program Bansos</th>
                    <th className="py-3 px-3.5">Sumber Anggaran</th>
                    <th className="py-3 px-3.5 text-center">Jumlah Penerima</th>
                    <th className="py-3 px-3.5">Pagu Anggaran</th>
                    <th className="py-3 px-3.5 text-center">Periode</th>
                    <th className="py-3 px-3.5 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-200 dark:divide-white/10">
                  {(config.bansosList || []).map((prog, idx) => (
                    <tr key={prog.id || idx} className="hover:bg-white/40 dark:hover:bg-white/5 transition-colors">
                      <td className="py-3 px-3.5 font-bold text-slate-900 dark:text-white">
                        {prog.namaProgram}
                      </td>
                      <td className="py-3 px-3.5">
                        <Badge variant="outline" className="text-[10px] font-bold font-mono px-2 py-0.5">
                          {prog.sumberDana}
                        </Badge>
                      </td>
                      <td className="py-3 px-3.5 text-center font-mono font-bold text-slate-900 dark:text-white">
                        {formatNum(prog.jumlahKpm)} {prog.satuan}
                      </td>
                      <td className="py-3 px-3.5 font-mono font-bold text-emerald-800 dark:text-emerald-400">
                        {prog.paguAnggaran ? formatRupiah(prog.paguAnggaran) : '-'}
                      </td>
                      <td className="py-3 px-3.5 text-center font-mono text-[11px]">
                        {prog.periode}
                      </td>
                      <td className="py-3 px-3.5 text-center">
                        <Badge className="bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border-emerald-500/30 text-[10px] font-bold">
                          {prog.statusPenyaluran}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* MODAL 1: PREVIEW IMPOR EXCEL SEBELUM TULIS KE FIRESTORE       */}
      {/* ───────────────────────────────────────────────────────────── */}
      <Dialog open={isImportModalOpen} onOpenChange={setIsImportModalOpen}>
        <DialogContent className="max-w-2xl bg-white dark:bg-[#081d27] dark:bg-stone-900 rounded-[28px] border border-stone-300 dark:border-white/10 shadow-2xl p-6">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg font-condensed font-bold uppercase text-slate-900 dark:text-white flex items-center gap-2">
              <Check className="h-5 w-5 text-emerald-600" />
              <span>Verifikasi Berkas Impor DTSEN</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-600 dark:text-slate-400">
              Periksa ringkasan baris data keluarga sebelum disimpan ke database Firestore.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 my-2">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center">
              <div className="p-3 rounded-2xl neu-inset">
                <span className="text-[10px] uppercase font-bold text-slate-500 block">Total KPM</span>
                <span className="text-lg font-mono font-bold text-slate-900 dark:text-white">{importStats.total}</span>
              </div>
              <div className="p-3 rounded-2xl neu-inset bg-red-500/10">
                <span className="text-[10px] uppercase font-bold text-red-600 block">Desil 1</span>
                <span className="text-lg font-mono font-bold text-red-700">{importStats.desil1}</span>
              </div>
              <div className="p-3 rounded-2xl neu-inset bg-orange-500/10">
                <span className="text-[10px] uppercase font-bold text-orange-600 block">Desil 2</span>
                <span className="text-lg font-mono font-bold text-orange-700">{importStats.desil2}</span>
              </div>
              <div className="p-3 rounded-2xl neu-inset bg-yellow-500/10">
                <span className="text-[10px] uppercase font-bold text-yellow-600 block">Desil 3 &amp; 4</span>
                <span className="text-lg font-mono font-bold text-yellow-700">{importStats.desil3 + importStats.desil4}</span>
              </div>
            </div>

            <div className="max-h-56 overflow-y-auto rounded-xl border border-stone-300 dark:border-white/10 neu-inset p-2">
              <table className="w-full text-left text-xs">
                <thead className="bg-stone-200/50 dark:bg-stone-800/50 text-[10px] uppercase font-bold">
                  <tr>
                    <th className="p-1.5">No</th>
                    <th className="p-1.5">No. KK</th>
                    <th className="p-1.5">Nama Anggota</th>
                    <th className="p-1.5 text-center">Desil</th>
                    <th className="p-1.5">Alamat</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-200 dark:divide-white/10">
                  {importPreviewData.slice(0, 10).map((row, idx) => (
                    <tr key={idx}>
                      <td className="p-1.5 font-bold text-slate-500">{idx + 1}</td>
                      <td className="p-1.5 font-mono">{row.nomor_kartu_keluarga}</td>
                      <td className="p-1.5 font-bold">{row.nama_anggota_keluarga}</td>
                      <td className="p-1.5 text-center">
                        <Badge className="text-[9px] px-1.5 py-0.5">Desil {row.desil_nasional}</Badge>
                      </td>
                      <td className="p-1.5 text-slate-600 dark:text-slate-400">{row.alamat}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {importPreviewData.length > 10 && (
                <p className="text-[11px] text-center text-slate-500 mt-2 italic">
                  ... dan {importPreviewData.length - 10} baris data keluarga lainnya.
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
              <span>Simpan ke Database ({importPreviewData.length} KPM)</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* MODAL 2: RINCIAN LENGKAP 43 VARIABEL DTSEN                     */}
      {/* ───────────────────────────────────────────────────────────── */}
      <Dialog open={!!selectedDetailItem} onOpenChange={(open) => !open && setSelectedDetailItem(null)}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto bg-white dark:bg-[#081d27] dark:bg-stone-900 rounded-[28px] border border-stone-300 dark:border-white/10 shadow-2xl p-6">
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
                  1. Identitas &amp; Lokasi Administratif
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
                  2. Kelistrikan &amp; Kondisi Bangunan Rumah
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
                  3. Air Bersih &amp; Sanitasi
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
                  4. Kepemilikan Aset Bergerak &amp; Elektronik
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
              className="neu-btn-dark text-teal-400 font-bold text-xs rounded-xl h-9"
            >
              Tutup
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* MODAL 3: PANDUAN FORMAT 43 VARIABEL DTSEN                      */}
      {/* ───────────────────────────────────────────────────────────── */}
      <Dialog open={isColumnGuideOpen} onOpenChange={setIsColumnGuideOpen}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto bg-white dark:bg-[#081d27] dark:bg-stone-900 rounded-[28px] border border-stone-300 dark:border-white/10 shadow-2xl p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-condensed font-bold uppercase text-slate-900 dark:text-white flex items-center justify-between">
              <span className="flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5 text-emerald-600" />
                Panduan Format 43 Kolom Excel DTSEN
              </span>
              <Badge className="bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border-emerald-500/30 text-xs font-bold font-mono">
                43 Kolom Standar
              </Badge>
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-600 dark:text-slate-400">
              Header kolom pada file Excel (.xlsx / .xls) wajib sesuai dengan kunci variabel di bawah ini agar data dapat terbaca otomatis oleh sistem.
            </DialogDescription>
          </DialogHeader>

          {/* Quick Filter */}
          <div className="relative my-2">
            <Search className="h-4 w-4 absolute left-3 top-2.5 text-slate-500" />
            <Input
              type="text"
              placeholder="Cari nama kolom atau variabel..."
              value={columnSearchQuery}
              onChange={(e) => setColumnSearchQuery(e.target.value)}
              className="pl-9 pr-3 h-9 rounded-xl neu-card-elevated border border-stone-300/60 dark:border-white/10 text-xs font-medium"
            />
          </div>

          <div className="space-y-4 my-2 text-xs">
            {DTSEN_CATEGORIZED_COLUMNS.map((group, groupIdx) => {
              const filteredCols = group.columns.filter((c) => {
                if (!columnSearchQuery) return true;
                const q = columnSearchQuery.toLowerCase();
                return c.key.toLowerCase().includes(q) || c.label.toLowerCase().includes(q);
              });

              if (filteredCols.length === 0) return null;

              return (
                <div key={groupIdx} className="p-4 rounded-2xl neu-card-elevated border border-white/60 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-emerald-800 dark:text-emerald-400 uppercase tracking-wider text-[11px]">
                      {group.category}
                    </span>
                    <Badge variant="outline" className="text-[10px] font-mono">
                      {filteredCols.length} Kolom
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {filteredCols.map((col) => (
                      <div
                        key={col.key}
                        className="p-2.5 rounded-xl neu-inset bg-stone-100/60 dark:bg-stone-800/40 border border-stone-200/60 dark:border-white/5 space-y-1"
                      >
                        <div className="flex items-center justify-between gap-1">
                          <code className="font-mono text-[11px] font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                            {col.key}
                          </code>
                        </div>
                        <p className="text-[11px] text-slate-700 dark:text-slate-300 font-medium">
                          {col.label}
                        </p>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 italic">
                          Contoh: <span className="font-mono">{col.contoh}</span>
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          <DialogFooter className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleDownloadTemplate}
              className="neu-card-elevated border border-stone-300 dark:border-white/10 rounded-xl text-xs font-bold gap-2 text-slate-800 dark:text-slate-200 h-9 px-4 w-full sm:w-auto"
            >
              <Download className="h-4 w-4 text-emerald-600" />
              <span>Unduh Template (43 Kolom)</span>
            </Button>

            <Button
              onClick={() => setIsColumnGuideOpen(false)}
              className="neu-btn-dark text-teal-400 font-bold text-xs rounded-xl h-9 px-6 w-full sm:w-auto"
            >
              Tutup Panduan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
