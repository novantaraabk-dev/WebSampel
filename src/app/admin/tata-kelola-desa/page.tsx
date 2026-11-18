'use client';

import { useState, useRef, useMemo, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { PageHeader } from '@/components/page-header';
import { Logo } from '@/components/logo';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Upload, Plus, Trash2, Eye, Download, Search, Filter, FileText, ExternalLink, Calendar, HardHat, Landmark, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, addDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { useCollection } from '@/firebase';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import * as XLSX from 'xlsx';
import { ApbdesData, RealisasiApbdesData, ApbdesItem, ProdukHukumDesa } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { TransparansiPembangunanTab } from './_components/transparansi-pembangunan-tab';
import { AsetDesaTab } from './_components/aset-desa-tab';

const PRODUK_HUKUM_TYPES = [
  { value: 'rpjmdes', label: '1. RPJMDes', shortLabel: 'RPJMDes', desc: 'Rencana Pembangunan Jangka Menengah Desa' },
  { value: 'rkpdes', label: '2. RKPDes', shortLabel: 'RKPDes', desc: 'Rencana Kerja Pembangunan Desa' },
  { value: 'perdes', label: '3. Peraturan Desa (Perdes)', shortLabel: 'Peraturan Desa (Perdes)', desc: 'Peraturan Desa' },
  { value: 'perkades', label: '4. Perkades', shortLabel: 'Perkades', desc: 'Peraturan Kepala Desa' },
  { value: 'sk_desa', label: '5. Keputusan Kepala Desa', shortLabel: 'Keputusan Kepala Desa', desc: 'Keputusan Kepala Desa' },
  { value: 'lkpd', label: '6. LKPD', shortLabel: 'LKPD', desc: 'Laporan Keuangan Pemerintah Desa' },
  { value: 'lppd', label: '7. LPPD', shortLabel: 'LPPD', desc: 'Laporan Penyelenggaraan Pemerintahan Desa' },
];

const normalizeJenisProduk = (jenis: string) => {
  const j = (jenis || '').toLowerCase().trim();
  if (j === 'rpjmdes' || j.includes('rpjm')) return 'rpjmdes';
  if (j === 'rkpdes' || j.includes('rkp')) return 'rkpdes';
  if (j === 'perdes' || j.includes('peraturan desa')) return 'perdes';
  if (j === 'perkades' || j.includes('peraturan kepala')) return 'perkades';
  if (j === 'sk_desa' || j === 'sk' || j.includes('keputusan')) return 'sk_desa';
  if (j === 'lkpd' || j.includes('lkpd') || j.includes('lkpj')) return 'lkpd';
  if (j === 'lppd' || j.includes('lppd')) return 'lppd';
  return j;
};

const getJenisLabel = (jenis: string) => {
  const norm = normalizeJenisProduk(jenis);
  const found = PRODUK_HUKUM_TYPES.find(t => t.value === norm);
  return found ? found.label : (jenis || '').toUpperCase();
};

// Helper to robustly parse nominal values from Excel rows (numeric or string)
const parseNominal = (val: any): number => {
  if (typeof val === 'number') return val;
  if (!val) return 0;

  let str = String(val).trim();
  str = str.replace(/Rp\s*/i, '');

  const hasComma = str.includes(',');
  const hasDot = str.includes('.');

  if (hasComma && hasDot) {
    if (str.indexOf(',') < str.indexOf('.')) {
      // US style: 1,500,000.50
      str = str.replace(/,/g, '');
    } else {
      // ID style: 1.500.000,50
      str = str.replace(/\./g, '').replace(',', '.');
    }
  } else if (hasComma) {
    // Only comma. Could be 1,500,000 (US thousand) or 12,5 (ID decimal).
    const parts = str.split(',');
    if (parts.length > 1 && parts[parts.length - 1].length === 3) {
      str = str.replace(/,/g, '');
    } else {
      str = str.replace(',', '.');
    }
  } else if (hasDot) {
    // Only dot. Could be 1.500.000 (ID thousand) or 12.5 (US decimal).
    const parts = str.split('.');
    if (parts.length > 1 && parts[parts.length - 1].length === 3) {
      str = str.replace(/\./g, '');
    }
  }

  const parsed = parseFloat(str);
  return isNaN(parsed) ? 0 : parsed;
};

function AdminTataKelolaDesaContent() {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState(tabParam || 'apbdes');
  const [selectedYear, setSelectedYear] = useState<number>(2026);

  useEffect(() => {
    if (tabParam && ['apbdes', 'realisasi', 'produk', 'pembangunan', 'aset'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);
  const firestore = useFirestore();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Queries
  const apbdesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'apbdes'), orderBy('tahun', 'desc'));
  }, [firestore]);

  const realisasiQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'realisasiApbdes'), orderBy('tahun', 'desc'));
  }, [firestore]);

  const produkHukumQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'produkHukumDesa'), orderBy('tahun', 'desc'));
  }, [firestore]);

  const { data: allApbdes, isLoading: isLoadingApbdes } = useCollection<ApbdesData>(apbdesQuery);
  const { data: allRealisasi, isLoading: isLoadingRealisasi } = useCollection<RealisasiApbdesData>(realisasiQuery);
  const { data: allProdukHukum, isLoading: isLoadingProduk } = useCollection<ProdukHukumDesa>(produkHukumQuery);

  const currentApbdes = allApbdes?.find(d => Number(d.tahun) === Number(selectedYear) && Array.isArray(d.items) && d.items.length > 0)
    || allApbdes?.find(d => Number(d.tahun) === Number(selectedYear) && Array.isArray(d.items));
  const currentRealisasi = allRealisasi?.find(d => Number(d.tahun) === Number(selectedYear) && Array.isArray(d.items) && d.items.length > 0)
    || allRealisasi?.find(d => Number(d.tahun) === Number(selectedYear) && Array.isArray(d.items));
  const currentProdukHukum = allProdukHukum?.filter(p => Number(p.tahun) === Number(selectedYear)) || [];

  // Handle Excel Import untuk APBDes
  const handleApbdesImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !firestore) return;

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(worksheet) as any[];

      const items: ApbdesItem[] = rows.map(row => ({
        bidang: row['Bidang'] || row['bidang'] || '',
        kodeRekening: row['Kode Rekening'] || row['kode rekening'] || row['KodeRekening'] || row['koderekening'] || '',
        kegiatan: row['Kegiatan'] || row['kegiatan'] || '',
        volume: row['Volume'] !== undefined ? row['Volume'] : (row['volume'] !== undefined ? row['volume'] : 0),
        nominal: parseNominal(row['Nominal'] !== undefined ? row['Nominal'] : row['nominal']),
        sumberAnggaran: row['Sumber'] || row['Sumber Anggaran'] || row['sumber'] || row['sumber anggaran'] || '',
      }));

      const totalAnggaran = items.reduce((sum, item) => sum + item.nominal, 0);

      // Hapus data lama jika ada
      if (currentApbdes) {
        await deleteDoc(doc(firestore, 'apbdes', currentApbdes.id));
      }

      // Simpan data baru
      await addDoc(collection(firestore, 'apbdes'), {
        tahun: selectedYear,
        totalAnggaran,
        items,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      toast({ title: 'APBDes berhasil diimpor', description: `${items.length} item diimpor untuk tahun ${selectedYear}` });
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (error: any) {
      toast({ title: 'Gagal mengimpor APBDes', description: error.message, variant: 'destructive' });
    }
  };

  // Handle Excel Import untuk Realisasi
  const handleRealisasiImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !firestore) return;

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(worksheet) as any[];

      const items: ApbdesItem[] = rows.map(row => ({
        bidang: row['Bidang'] || row['bidang'] || '',
        kodeRekening: row['Kode Rekening'] || row['kode rekening'] || row['KodeRekening'] || row['koderekening'] || '',
        kegiatan: row['Kegiatan'] || row['kegiatan'] || '',
        volume: row['Volume'] !== undefined ? row['Volume'] : (row['volume'] !== undefined ? row['volume'] : 0),
        nominal: parseNominal(row['Nominal'] !== undefined ? row['Nominal'] : row['nominal']),
        sumberAnggaran: row['Sumber'] || row['Sumber Anggaran'] || row['sumber'] || row['sumber anggaran'] || '',
      }));

      const totalRealisasi = items.reduce((sum, item) => sum + item.nominal, 0);

      // Hapus data lama jika ada
      if (currentRealisasi) {
        await deleteDoc(doc(firestore, 'realisasiApbdes', currentRealisasi.id));
      }

      // Simpan data baru
      await addDoc(collection(firestore, 'realisasiApbdes'), {
        tahun: selectedYear,
        totalRealisasi,
        items,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      toast({ title: 'Realisasi APBDes berhasil diimpor', description: `${items.length} item diimpor untuk tahun ${selectedYear}` });
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (error: any) {
      toast({ title: 'Gagal mengimpor Realisasi', description: error.message, variant: 'destructive' });
    }
  };

  // Handle Delete APBDes
  const handleDeleteApbdes = async () => {
    if (!currentApbdes || !firestore) return;
    try {
      await deleteDoc(doc(firestore, 'apbdes', currentApbdes.id));
      toast({ title: 'APBDes dihapus' });
    } catch (error: any) {
      toast({ title: 'Gagal menghapus', description: error.message, variant: 'destructive' });
    }
  };

  // Handle Delete Realisasi
  const handleDeleteRealisasi = async () => {
    if (!currentRealisasi || !firestore) return;
    try {
      await deleteDoc(doc(firestore, 'realisasiApbdes', currentRealisasi.id));
      toast({ title: 'Realisasi dihapus' });
    } catch (error: any) {
      toast({ title: 'Gagal menghapus', description: error.message, variant: 'destructive' });
    }
  };

  // Download Template Excel untuk APBDes
  const handleDownloadApbdesTemplate = () => {
    const headers = [['Bidang', 'Kode Rekening', 'Kegiatan', 'Volume', 'Nominal', 'Sumber Anggaran']];
    const contoh = [
      ['Penyelenggaraan Pemerintahan Desa', '1.1.01', 'Penyusunan Dokumen Perencanaan Desa', 1, 5000000, 'Dana Desa'],
      ['Pembangunan Desa', '2.1.01', 'Pembangunan Jalan Desa', 1, 150000000, 'Dana Desa'],
      ['Pembinaan Kemasyarakatan Desa', '3.1.01', 'Kegiatan Kepemudaan', 1, 10000000, 'ADD'],
    ];
    const ws = XLSX.utils.aoa_to_sheet([...headers, ...contoh]);
    // Atur lebar kolom
    ws['!cols'] = [
      { wch: 40 }, { wch: 18 }, { wch: 45 }, { wch: 10 }, { wch: 18 }, { wch: 20 }
    ];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, `APBDes ${selectedYear}`);
    XLSX.writeFile(wb, `Template_APBDes_${selectedYear}.xlsx`);
    toast({ title: 'Template diunduh', description: `Template APBDes ${selectedYear} berhasil diunduh.` });
  };

  // Download Template Excel untuk Realisasi APBDes
  const handleDownloadRealisasiTemplate = () => {
    const headers = [['Bidang', 'Kode Rekening', 'Kegiatan', 'Volume', 'Nominal', 'Sumber Anggaran']];
    const contoh = [
      ['Penyelenggaraan Pemerintahan Desa', '1.1.01', 'Penyusunan Dokumen Perencanaan Desa', 1, 4800000, 'Dana Desa'],
      ['Pembangunan Desa', '2.1.01', 'Pembangunan Jalan Desa', 1, 148000000, 'Dana Desa'],
      ['Pembinaan Kemasyarakatan Desa', '3.1.01', 'Kegiatan Kepemudaan', 1, 9500000, 'ADD'],
    ];
    const ws = XLSX.utils.aoa_to_sheet([...headers, ...contoh]);
    ws['!cols'] = [
      { wch: 40 }, { wch: 18 }, { wch: 45 }, { wch: 10 }, { wch: 18 }, { wch: 20 }
    ];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, `Realisasi APBDes ${selectedYear}`);
    XLSX.writeFile(wb, `Template_Realisasi_APBDes_${selectedYear}.xlsx`);
    toast({ title: 'Template diunduh', description: `Template Realisasi APBDes ${selectedYear} berhasil diunduh.` });
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      <PageHeader
        title="Manajemen Tata Kelola Desa"
        description="Kelola data APBDes tahunan, Realisasi APBDes, dan Produk Hukum Desa Sampeldes."
      />

      {/* TABS */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4 sm:space-y-6">
        <TabsList className="bg-[#070b10] border border-white/10 p-1.5 rounded-2xl flex flex-wrap h-auto gap-1">
          <TabsTrigger value="apbdes" className="rounded-xl font-extrabold uppercase text-xs py-2.5 px-4 text-slate-400 hover:text-white data-[state=active]:bg-teal-600 data-[state=active]:text-white data-[state=active]:shadow-md transition-all">APBDes</TabsTrigger>
          <TabsTrigger value="realisasi" className="rounded-xl font-extrabold uppercase text-xs py-2.5 px-4 text-slate-400 hover:text-white data-[state=active]:bg-teal-600 data-[state=active]:text-white data-[state=active]:shadow-md transition-all">Realisasi APBDes</TabsTrigger>
          <TabsTrigger value="produk" className="rounded-xl font-extrabold uppercase text-xs py-2.5 px-4 text-slate-400 hover:text-white data-[state=active]:bg-teal-600 data-[state=active]:text-white data-[state=active]:shadow-md transition-all">Produk Hukum Desa</TabsTrigger>
          <TabsTrigger value="pembangunan" className="rounded-xl font-extrabold uppercase text-xs py-2.5 px-4 text-slate-400 hover:text-white data-[state=active]:bg-teal-600 data-[state=active]:text-white data-[state=active]:shadow-md transition-all flex items-center gap-1.5">
            <HardHat className="h-3.5 w-3.5" />
            <span>Transparansi Pembangunan</span>
          </TabsTrigger>
          <TabsTrigger value="aset" className="rounded-xl font-extrabold uppercase text-xs py-2.5 px-4 text-slate-400 hover:text-white data-[state=active]:bg-teal-600 data-[state=active]:text-white data-[state=active]:shadow-md transition-all flex items-center gap-1.5">
            <Landmark className="h-3.5 w-3.5" />
            <span>Aset Desa</span>
          </TabsTrigger>
        </TabsList>

        {/* APBDES TAB */}
        <TabsContent value="apbdes" className="space-y-4 sm:space-y-6 outline-none">
          <div className="flex flex-col sm:flex-row sm:items-end gap-3 sm:gap-4">
            <div className="space-y-1.5 flex-1 sm:flex-none">
              <Label className="font-bold text-xs sm:text-sm">Pilih Tahun</Label>
              <Select value={selectedYear.toString()} onValueChange={(v) => setSelectedYear(parseInt(v))}>
                <SelectTrigger className="w-full sm:w-48 rounded-xl border-stone-200 h-10 text-xs sm:text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(year => (
                    <SelectItem key={year} value={year.toString()}>
                      Tahun {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                onClick={() => fileInputRef.current?.click()}
                className="rounded-xl gap-1.5 font-black uppercase tracking-wider bg-teal-600 hover:bg-teal-500 text-white h-10 text-xs px-4 shadow-sm"
              >
                <Upload className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                Impor Excel
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                onChange={handleApbdesImport}
                className="hidden"
              />

              <Button
                onClick={handleDownloadApbdesTemplate}
                variant="outline"
                className="rounded-xl gap-1.5 font-bold border-emerald-600 text-emerald-700 hover:bg-emerald-50 h-9 sm:h-10 text-xs sm:text-sm px-3.5"
              >
                <Download className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                Download Format
              </Button>

              {currentApbdes && (
                <Button
                  onClick={handleDeleteApbdes}
                  variant="destructive"
                  className="rounded-xl gap-1.5 font-bold h-9 sm:h-10 text-xs sm:text-sm px-3.5"
                >
                  <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  Hapus Data
                </Button>
              )}
            </div>
          </div>

          {currentApbdes ? (
            <Card className="rounded-2xl sm:rounded-[2rem] border-none shadow-sm overflow-hidden bg-white">
              <div className="p-3.5 sm:p-6 border-b bg-slate-50/50 flex items-center justify-between">
                <h3 className="text-xs sm:text-base font-black text-slate-900 uppercase">Data APBDes Tahun {selectedYear}</h3>
                <span className="text-[10px] sm:text-xs font-bold text-slate-500 bg-slate-200/60 px-2 py-0.5 rounded-full">
                  {currentApbdes.items?.length || 0} Kegiatan
                </span>
              </div>
              <CardContent className="p-0">
                {/* Mobile Card List View (block sm:hidden) - Zero horizontal scroll */}
                <div className="block sm:hidden divide-y divide-slate-100">
                  {currentApbdes.items?.map((item, i) => (
                    <div key={i} className="p-3.5 space-y-2 bg-white">
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-[9px] font-black uppercase px-2 py-0.5 bg-emerald-50 text-emerald-800 rounded-md">
                          {item.bidang || 'Umum'}
                        </span>
                        <span className="font-mono text-[9px] text-slate-400 font-bold">
                          {item.kodeRekening}
                        </span>
                      </div>
                      <p className="font-bold text-xs uppercase text-slate-800 leading-snug break-words">
                        {item.kegiatan}
                      </p>
                      <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-50">
                        <span className="text-[10px] text-slate-400 font-medium">
                          Vol: <strong className="text-slate-700">{item.volume}</strong> • Sumber: <strong className="text-slate-700">{item.sumberAnggaran || '-'}</strong>
                        </span>
                        <span className="font-black text-primary text-xs">
                          Rp {(Number(item.nominal) || 0).toLocaleString('id-ID')}
                        </span>
                      </div>
                    </div>
                  ))}
                  {/* Total Box Mobile */}
                  <div className="p-3.5 bg-primary/5 flex items-center justify-between border-t border-primary/10">
                    <span className="text-xs font-bold text-slate-700">Total Anggaran:</span>
                    <span className="text-sm font-black text-primary">Rp {(Number(currentApbdes.totalAnggaran) || 0).toLocaleString('id-ID')}</span>
                  </div>
                </div>

                {/* Desktop Table View (hidden sm:block) */}
                <div className="hidden sm:block overflow-x-auto w-full">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-100">
                      <tr>
                        <th className="px-4 py-3 text-left font-bold">Bidang</th>
                        <th className="px-4 py-3 text-left font-bold">Kode Rekening</th>
                        <th className="px-4 py-3 text-left font-bold">Kegiatan</th>
                        <th className="px-4 py-3 text-right font-bold">Volume</th>
                        <th className="px-4 py-3 text-right font-bold">Nominal</th>
                        <th className="px-4 py-3 text-left font-bold">Sumber</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentApbdes.items?.map((item, i) => (
                        <tr key={i} className="border-b hover:bg-slate-50">
                          <td className="px-4 py-3 font-semibold">{item.bidang}</td>
                          <td className="px-4 py-3 text-slate-600 font-mono text-xs">{item.kodeRekening}</td>
                          <td className="px-4 py-3 text-slate-700">{item.kegiatan}</td>
                          <td className="px-4 py-3 text-right">{item.volume}</td>
                          <td className="px-4 py-3 text-right text-primary font-bold">Rp {(Number(item.nominal) || 0).toLocaleString('id-ID')}</td>
                          <td className="px-4 py-3 text-slate-600">{item.sumberAnggaran}</td>
                        </tr>
                      ))}
                      <tr className="bg-primary/5 font-bold">
                        <td colSpan={4} className="px-4 py-3 text-right">Total:</td>
                        <td className="px-4 py-3 text-right text-primary">Rp {(Number(currentApbdes.totalAnggaran) || 0).toLocaleString('id-ID')}</td>
                        <td></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="rounded-2xl border-2 border-dashed border-slate-300 shadow-none">
              <CardContent className="p-8 sm:p-12 text-center">
                <p className="text-slate-600 font-semibold text-xs sm:text-sm">Belum ada data APBDes untuk tahun {selectedYear}</p>
                <p className="text-slate-400 text-[11px] sm:text-xs">Klik tombol "Impor Excel" untuk menambahkan data</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* REALISASI TAB */}
        <TabsContent value="realisasi" className="space-y-4 sm:space-y-6 outline-none">
          <div className="flex flex-col sm:flex-row sm:items-end gap-3 sm:gap-4">
            <div className="space-y-1.5 flex-1 sm:flex-none">
              <Label className="font-bold text-xs sm:text-sm">Pilih Tahun</Label>
              <Select value={selectedYear.toString()} onValueChange={(v) => setSelectedYear(parseInt(v))}>
                <SelectTrigger className="w-full sm:w-48 rounded-xl border-slate-300 h-10 text-xs sm:text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(year => (
                    <SelectItem key={year} value={year.toString()}>
                      Tahun {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                onClick={() => fileInputRef.current?.click()}
                className="rounded-xl gap-1.5 font-bold bg-primary hover:bg-slate-800 h-9 sm:h-10 text-xs sm:text-sm px-3.5"
              >
                <Upload className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                Impor Excel
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                onChange={handleRealisasiImport}
                className="hidden"
              />

              <Button
                onClick={handleDownloadRealisasiTemplate}
                variant="outline"
                className="rounded-xl gap-1.5 font-bold border-teal-600 text-teal-700 hover:bg-teal-50 h-9 sm:h-10 text-xs sm:text-sm px-3.5"
              >
                <Download className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                Download Format
              </Button>

              {currentRealisasi && (
                <Button
                  onClick={handleDeleteRealisasi}
                  variant="destructive"
                  className="rounded-xl gap-1.5 font-bold h-9 sm:h-10 text-xs sm:text-sm px-3.5"
                >
                  <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  Hapus Data
                </Button>
              )}
            </div>
          </div>

          {currentRealisasi ? (
            <Card className="rounded-2xl sm:rounded-[2rem] border-none shadow-sm overflow-hidden bg-white">
              <div className="p-3.5 sm:p-6 border-b bg-slate-50/50 flex items-center justify-between">
                <h3 className="text-xs sm:text-base font-black text-slate-900 uppercase">Data Realisasi APBDes Tahun {selectedYear}</h3>
                <span className="text-[10px] sm:text-xs font-bold text-slate-500 bg-slate-200/60 px-2 py-0.5 rounded-full">
                  {currentRealisasi.items?.length || 0} Kegiatan
                </span>
              </div>
              <CardContent className="p-0">
                {/* Mobile Card List View (block sm:hidden) - Zero horizontal scroll */}
                <div className="block sm:hidden divide-y divide-slate-100">
                  {currentRealisasi.items?.map((item, i) => (
                    <div key={i} className="p-3.5 space-y-2 bg-white">
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-[9px] font-black uppercase px-2 py-0.5 bg-teal-50 text-teal-800 rounded-md">
                          {item.bidang || 'Umum'}
                        </span>
                        <span className="font-mono text-[9px] text-slate-400 font-bold">
                          {item.kodeRekening}
                        </span>
                      </div>
                      <p className="font-bold text-xs uppercase text-slate-800 leading-snug break-words">
                        {item.kegiatan}
                      </p>
                      <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-50">
                        <span className="text-[10px] text-slate-400 font-medium">
                          Vol: <strong className="text-slate-700">{item.volume}</strong> • Sumber: <strong className="text-slate-700">{item.sumberAnggaran || '-'}</strong>
                        </span>
                        <span className="font-black text-teal-700 text-xs">
                          Rp {(Number(item.nominal) || 0).toLocaleString('id-ID')}
                        </span>
                      </div>
                    </div>
                  ))}
                  {/* Total Box Mobile */}
                  <div className="p-3.5 bg-emerald-50 flex items-center justify-between border-t border-emerald-100">
                    <span className="text-xs font-bold text-emerald-950">Total Realisasi:</span>
                    <span className="text-sm font-black text-emerald-700">Rp {(Number(currentRealisasi.totalRealisasi) || 0).toLocaleString('id-ID')}</span>
                  </div>
                </div>

                {/* Desktop Table View (hidden sm:block) */}
                <div className="hidden sm:block overflow-x-auto w-full">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-100">
                      <tr>
                        <th className="px-4 py-3 text-left font-bold">Bidang</th>
                        <th className="px-4 py-3 text-left font-bold">Kode Rekening</th>
                        <th className="px-4 py-3 text-left font-bold">Kegiatan</th>
                        <th className="px-4 py-3 text-right font-bold">Volume</th>
                        <th className="px-4 py-3 text-right font-bold">Realisasi</th>
                        <th className="px-4 py-3 text-left font-bold">Sumber</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentRealisasi.items?.map((item, i) => (
                        <tr key={i} className="border-b hover:bg-slate-50">
                          <td className="px-4 py-3 font-semibold">{item.bidang}</td>
                          <td className="px-4 py-3 text-slate-600 font-mono text-xs">{item.kodeRekening}</td>
                          <td className="px-4 py-3 text-slate-700">{item.kegiatan}</td>
                          <td className="px-4 py-3 text-right">{item.volume}</td>
                          <td className="px-4 py-3 text-right text-teal-700 font-bold">Rp {(Number(item.nominal) || 0).toLocaleString('id-ID')}</td>
                          <td className="px-4 py-3 text-slate-600">{item.sumberAnggaran}</td>
                        </tr>
                      ))}
                      <tr className="bg-emerald-50 font-bold">
                        <td colSpan={4} className="px-4 py-3 text-right text-emerald-950">Total Realisasi:</td>
                        <td className="px-4 py-3 text-right text-emerald-700">Rp {(Number(currentRealisasi.totalRealisasi) || 0).toLocaleString('id-ID')}</td>
                        <td></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="rounded-2xl border-2 border-dashed border-slate-300 shadow-none">
              <CardContent className="p-8 sm:p-12 text-center">
                <p className="text-slate-600 font-semibold text-xs sm:text-sm">Belum ada data Realisasi untuk tahun {selectedYear}</p>
                <p className="text-slate-400 text-[11px] sm:text-xs">Klik tombol "Impor Excel" untuk menambahkan data</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* PRODUK HUKUM TAB */}
        <TabsContent value="produk" className="space-y-4 sm:space-y-6 outline-none">
          <AdminProdukHukumTab produkHukumList={allProdukHukum} isLoading={isLoadingProduk} firestore={firestore} />
        </TabsContent>

        {/* TRANSPARANSI PEMBANGUNAN TAB */}
        <TabsContent value="pembangunan" className="space-y-4 sm:space-y-6 outline-none">
          <TransparansiPembangunanTab selectedYear={selectedYear} />
        </TabsContent>

        {/* ASET DESA TAB */}
        <TabsContent value="aset" className="space-y-4 sm:space-y-6 outline-none">
          <AsetDesaTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Component untuk Produk Hukum Tab
function AdminProdukHukumTab({ produkHukumList, isLoading, firestore }: any) {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    jenis: 'rpjmdes',
    tahun: new Date().getFullYear(),
    nama: '',
    nomor: '',
    driveLink: '',
    filePdfUrl: '',
  });

  const [activeCategoryFilter, setActiveCategoryFilter] = useState('all');
  const [selectedYearFilter, setSelectedYearFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Tahun list: 2018 sampai tahun sekarang + 3
  const availableYears = useMemo(() => {
    const currentY = new Date().getFullYear();
    const list: number[] = [];
    for (let y = currentY + 2; y >= 2018; y--) {
      list.push(y);
    }
    return list;
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firestore) return;

    if (!formData.nama.trim() || !formData.nomor.trim()) {
      toast({ title: 'Gagal', description: 'Nama dan Nomor dokumen harus diisi', variant: 'destructive' });
      return;
    }

    try {
      const link = formData.driveLink.trim();
      const pdf = formData.filePdfUrl.trim() || link;

      await addDoc(collection(firestore, 'produkHukumDesa'), {
        jenis: formData.jenis,
        tahun: parseInt(formData.tahun.toString()),
        nama: formData.nama.trim(),
        nomor: formData.nomor.trim(),
        driveLink: link,
        filePdfUrl: pdf,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      toast({ title: 'Berhasil!', description: `Produk hukum ${formData.nama} berhasil ditambahkan.` });
      setFormData({
        jenis: 'rpjmdes',
        tahun: new Date().getFullYear(),
        nama: '',
        nomor: '',
        driveLink: '',
        filePdfUrl: '',
      });
    } catch (error: any) {
      toast({ title: 'Gagal menambahkan', description: error.message, variant: 'destructive' });
    }
  };

  const handleDelete = async (id: string, nama: string) => {
    if (!firestore) return;
    if (!confirm(`Hapus produk hukum "${nama}"?`)) return;

    try {
      await deleteDoc(doc(firestore, 'produkHukumDesa', id));
      toast({ title: 'Produk Hukum dihapus' });
    } catch (error: any) {
      toast({ title: 'Gagal menghapus', description: error.message, variant: 'destructive' });
    }
  };

  // Filter list produk hukum
  const filteredList = useMemo(() => {
    if (!produkHukumList) return [];
    return produkHukumList.filter((item: any) => {
      // Filter kategori
      if (activeCategoryFilter !== 'all') {
        if (normalizeJenisProduk(item.jenis) !== activeCategoryFilter) return false;
      }
      // Filter tahun
      if (selectedYearFilter !== 'all') {
        if (Number(item.tahun) !== Number(selectedYearFilter)) return false;
      }
      // Filter query pencarian
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = item.nama?.toLowerCase().includes(q);
        const matchNomor = item.nomor?.toLowerCase().includes(q);
        const matchJenis = item.jenis?.toLowerCase().includes(q);
        if (!matchName && !matchNomor && !matchJenis) return false;
      }
      return true;
    });
  }, [produkHukumList, activeCategoryFilter, selectedYearFilter, searchQuery]);

  return (
    <div className="grid lg:grid-cols-12 gap-5 sm:gap-8 items-start">
      {/* Form Tambah */}
      <Card className="lg:col-span-5 rounded-2xl sm:rounded-[2rem] border border-slate-200/80 shadow-sm overflow-hidden bg-white">
        <CardContent className="p-4 sm:p-6 space-y-4 sm:space-y-5">
          <div className="border-b border-slate-100 pb-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md">
              Form Input Produk Hukum
            </span>
            <h3 className="text-base sm:text-lg font-black text-slate-900 uppercase mt-1.5">
              Tambah Produk Hukum Desa
            </h3>
            <p className="text-xs text-slate-500">
              Dokumen yang ditambahkan akan tampil pada tab yang sesuai di halaman publik.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3.5 sm:space-y-4">
            <div>
              <Label className="font-bold text-xs text-slate-700">Kategori / Jenis Produk Hukum</Label>
              <Select value={formData.jenis} onValueChange={(v) => setFormData({ ...formData, jenis: v })}>
                <SelectTrigger className="rounded-xl border-slate-300 h-10 text-xs sm:text-sm font-semibold mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-72">
                  {PRODUK_HUKUM_TYPES.map(type => (
                    <SelectItem key={type.value} value={type.value} className="text-xs sm:text-sm py-2">
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-800">{type.label}</span>
                        <span className="text-[10px] text-slate-500">{type.desc}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="font-bold text-xs text-slate-700">Tahun Penetapan</Label>
                <Select value={formData.tahun.toString()} onValueChange={(v) => setFormData({ ...formData, tahun: parseInt(v) })}>
                  <SelectTrigger className="rounded-xl border-slate-300 h-10 text-xs sm:text-sm font-bold mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    {availableYears.map((year: number) => (
                      <SelectItem key={year} value={year.toString()} className="font-medium text-xs sm:text-sm">
                        Tahun {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="font-bold text-xs text-slate-700">Nomor Dokumen</Label>
                <Input
                  value={formData.nomor}
                  onChange={(e) => setFormData({ ...formData, nomor: e.target.value })}
                  placeholder="e.g. 01 Tahun 2026"
                  className="rounded-xl border-slate-300 h-10 text-xs sm:text-sm mt-1"
                  required
                />
              </div>
            </div>

            <div>
              <Label className="font-bold text-xs text-slate-700">Nama / Judul Dokumen</Label>
              <Input
                value={formData.nama}
                onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                placeholder="Contoh: Rencana Pembangunan Jangka Menengah Desa 2026-2031"
                className="rounded-xl border-slate-300 h-10 text-xs sm:text-sm mt-1"
                required
              />
            </div>

            <div>
              <Label className="font-bold text-xs text-slate-700">Link Google Drive (Opsional)</Label>
              <Input
                value={formData.driveLink}
                onChange={(e) => setFormData({ ...formData, driveLink: e.target.value })}
                placeholder="https://drive.google.com/file/d/.../view"
                className="rounded-xl border-slate-300 h-10 text-xs sm:text-sm mt-1"
                type="url"
              />
              <span className="text-[10px] text-slate-500 mt-0.5 block">
                Tautan folder atau berkas di Google Drive desa
              </span>
            </div>

            <div>
              <Label className="font-bold text-xs text-slate-700">Link Langsung File PDF (Opsional)</Label>
              <Input
                value={formData.filePdfUrl}
                onChange={(e) => setFormData({ ...formData, filePdfUrl: e.target.value })}
                placeholder="https://.../dokumen.pdf"
                className="rounded-xl border-slate-300 h-10 text-xs sm:text-sm mt-1"
                type="url"
              />
              <span className="text-[10px] text-slate-500 mt-0.5 block">
                URL langsung PDF (jika kosong, akan otomatis memakai Link Drive jika tersedia)
              </span>
            </div>

            <Button type="submit" className="w-full rounded-xl font-bold bg-emerald-700 hover:bg-emerald-800 text-white h-11 text-xs sm:text-sm shadow-sm gap-2">
              <Plus className="h-4 w-4" />
              Simpan Produk Hukum
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* List dan Filter Kategori */}
      <div className="lg:col-span-7 space-y-4">
        {/* Header List & Search */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div>
              <h3 className="text-base font-black text-slate-900 uppercase">
                Daftar Produk Hukum ({filteredList.length})
              </h3>
              <p className="text-xs text-slate-500">
                Kelola berkas hukum dan regulasi Desa Sampeldes
              </p>
            </div>

            {/* Filter Tahun */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-600 whitespace-nowrap">Tahun:</span>
              <Select value={selectedYearFilter} onValueChange={setSelectedYearFilter}>
                <SelectTrigger className="w-32 h-9 rounded-xl text-xs font-bold border-slate-300">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  <SelectItem value="all" className="text-xs font-bold">Semua Tahun</SelectItem>
                  {availableYears.map((year: number) => (
                    <SelectItem key={`filter-y-${year}`} value={year.toString()} className="text-xs">
                      Tahun {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Search Box */}
          <div className="relative">
            <Search className="h-4 w-4 absolute left-3 top-2.5 text-slate-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama dokumen, nomor, atau kategori..."
              className="pl-9 h-9 text-xs rounded-xl border-slate-300"
            />
          </div>

          {/* Sub-Tab Filter 7 Kategori Sesuai Permintaan User */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 scrollbar-none border-t border-slate-100">
            <button
              type="button"
              onClick={() => setActiveCategoryFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${activeCategoryFilter === 'all'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
            >
              Semua ({produkHukumList?.length || 0})
            </button>
            {PRODUK_HUKUM_TYPES.map(type => {
              const count = produkHukumList?.filter((p: any) => normalizeJenisProduk(p.jenis) === type.value).length || 0;
              return (
                <button
                  key={`tab-filter-${type.value}`}
                  type="button"
                  onClick={() => setActiveCategoryFilter(type.value)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${activeCategoryFilter === type.value
                      ? 'bg-emerald-700 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                >
                  <span>{type.label}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${activeCategoryFilter === type.value ? 'bg-white/25 text-white' : 'bg-slate-200 text-slate-700'
                    }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* List Card */}
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-2xl bg-slate-200" />
            ))}
          </div>
        ) : filteredList.length === 0 ? (
          <Card className="rounded-2xl border-2 border-dashed border-slate-200 shadow-none bg-slate-50/50">
            <CardContent className="p-8 sm:p-12 text-center space-y-2">
              <FileText className="h-8 w-8 text-slate-400 mx-auto" />
              <p className="text-slate-700 font-bold text-sm">Tidak ada produk hukum ditemukan</p>
              <p className="text-slate-500 text-xs max-w-sm mx-auto">
                {activeCategoryFilter !== 'all'
                  ? `Belum ada dokumen untuk kategori ${getJenisLabel(activeCategoryFilter)}.`
                  : 'Belum ada dokumen produk hukum yang diarsipkan.'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2.5">
            {filteredList.map((produk: any) => {
              const labelJenis = getJenisLabel(produk.jenis);
              return (
                <Card key={produk.id} className="rounded-xl sm:rounded-2xl border border-slate-200/90 shadow-sm bg-white overflow-hidden hover:border-emerald-300 transition-all">
                  <CardContent className="p-3.5 sm:p-4">
                    <div className="flex justify-between items-start gap-3">
                      <div className="flex-1 min-w-0 space-y-1.5">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="text-[10px] font-black bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-md">
                            {labelJenis}
                          </span>
                          <span className="text-[10px] bg-slate-100 text-slate-600 font-bold px-2 py-0.5 rounded-md">
                            Tahun {produk.tahun}
                          </span>
                        </div>
                        <h4 className="font-bold text-xs sm:text-sm text-slate-900 leading-snug break-words">
                          {produk.nama}
                        </h4>
                        <p className="text-[11px] text-slate-500">
                          Nomor: <span className="font-semibold text-slate-800">{produk.nomor}</span>
                        </p>
                      </div>

                      <div className="flex items-center gap-1 shrink-0 pt-0.5">
                        {(produk.driveLink || produk.filePdfUrl) && (
                          <a href={produk.driveLink || produk.filePdfUrl} target="_blank" rel="noopener noreferrer">
                            <Button variant="outline" size="sm" className="h-8 rounded-lg text-emerald-700 border-emerald-200 hover:bg-emerald-50 text-xs gap-1.5">
                              <Eye className="h-3.5 w-3.5" />
                              <span className="hidden sm:inline">Lihat</span>
                            </Button>
                          </a>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50"
                          onClick={() => handleDelete(produk.id, produk.nama)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default function AdminTataKelolaDesa() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen w-full items-center justify-center bg-[#F8FAFC] dark:bg-[#060b11]">
          <div className="flex flex-col items-center">
            <Loader2 className="h-10 w-10 animate-spin text-emerald-800 dark:text-teal-400 mb-4" />
            <p className="text-[10px] font-black tracking-[0.4em] text-slate-500 uppercase">
              Memuat Tata Kelola Desa...
            </p>
          </div>
        </div>
      }
    >
      <AdminTataKelolaDesaContent />
    </Suspense>
  );
}
