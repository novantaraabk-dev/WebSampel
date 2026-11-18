'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc, setDoc, serverTimestamp, writeBatch } from 'firebase/firestore';
import {
  PemiluPilkadaConfig,
  TpsWilayahItem,
  RekapitulasiSuaraItem,
  PenyelenggaraItem,
  DemografiGenerasiItem,
  DemografiDisabilitasItem
} from '@/lib/types';
import {
  ALL_SEED_ELECTION_DATA,
  SEED_PEMILU_2024,
  SEED_PILKADA_2024,
  SEED_PILKADES_2025,
  PENYELENGGARA_PPS_SAMPELDES
} from '@/lib/pemilu-pilkada-data';
import {
  Vote,
  Users,
  MapPin,
  BarChart3,
  Award,
  HeartHandshake,
  ArrowLeft,
  Eye,
  ExternalLink,
  Plus,
  Trash2,
  Edit,
  Save,
  Loader2,
  Sparkles,
  Calendar,
  Layers,
  Phone,
  CheckCircle2,
  Table as TableIcon,
  Landmark
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function AdminPemiluPilkadaPage() {
  const { toast } = useToast();
  const firestore = useFirestore();

  // State Pilihan Kategori & Tahun
  const [activeTab, setActiveTab] = useState<'pemilu' | 'pilkada' | 'pilkades'>('pemilu');
  const [selectedYear, setSelectedYear] = useState<number>(2024);
  const [isSeeding, setIsSeeding] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Firestore Document Ref
  const docId = `${activeTab}_${selectedYear}`;
  const docRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, 'pemiluPilkada', docId);
  }, [firestore, docId]);

  const { data: firestoreData, isLoading } = useDoc<PemiluPilkadaConfig>(docRef);

  // Fallback ke seed data jika belum ada di database
  const defaultSeed = useMemo(() => {
    if (ALL_SEED_ELECTION_DATA[docId]) return ALL_SEED_ELECTION_DATA[docId];
    if (activeTab === 'pemilu') return { ...SEED_PEMILU_2024, tahun: selectedYear };
    if (activeTab === 'pilkada') return { ...SEED_PILKADA_2024, tahun: selectedYear };
    return { ...SEED_PILKADES_2025, tahun: selectedYear };
  }, [docId, activeTab, selectedYear]);

  // Form Data State
  const [formData, setFormData] = useState<PemiluPilkadaConfig>(defaultSeed);

  // Sinkronkan data saat Firestore load atau kategori/tahun berubah
  useEffect(() => {
    if (firestoreData && firestoreData.totalDpt) {
      // Auto-migrasi jika masih ada data dummy komisioner (misal Ahmad Fauzi / Slamet Riyadi)
      const hasOldDummy = firestoreData.penyelenggaraList?.some(
        p => p.nama?.includes('Ahmad Fauzi') || p.nama?.includes('Slamet Riyadi') || p.nama?.includes('Siti Nurhayati')
      );
      // Auto-migrasi jika data Pilkada di Firestore masih data dummy lama (DPT 6048 atau kandidat Bambang)
      const isOldPilkadaDummy = activeTab === 'pilkada' && (
        firestoreData.totalDpt === 6048 ||
        firestoreData.rekapitulasiList?.some(r => r.namaKandidat?.includes('Bambang') || r.namaKandidat?.includes('Sudirman')) ||
        !firestoreData.pilkadaBupatiDesaList ||
        firestoreData.pilkadaBupatiDesaList.length === 0
      );

      if (isOldPilkadaDummy) {
        setFormData(defaultSeed);
      } else if (hasOldDummy && (activeTab === 'pemilu' || activeTab === 'pilkada')) {
        const migrated = { ...firestoreData, penyelenggaraList: PENYELENGGARA_PPS_SAMPELDES };
        setFormData(migrated);
      } else {
        setFormData(firestoreData);
      }
    } else {
      setFormData(defaultSeed);
    }
  }, [firestoreData, defaultSeed, activeTab]);

  // Modal States
  const [isTpsModalOpen, setIsTpsModalOpen] = useState(false);
  const [editingTpsIndex, setEditingTpsIndex] = useState<number | null>(null);
  const [tpsInput, setTpsInput] = useState<TpsWilayahItem>({
    id: '',
    nomorTps: '',
    namaTempat: '',
    cakupanWilayah: '',
    dptLaki: 0,
    dptPerempuan: 0,
    totalDpt: 0
  });

  const [isRekapModalOpen, setIsRekapModalOpen] = useState(false);
  const [editingRekapIndex, setEditingRekapIndex] = useState<number | null>(null);
  const [rekapInput, setRekapInput] = useState<RekapitulasiSuaraItem>({
    id: '',
    nomorUrut: 1,
    namaKandidat: '',
    namaWakil: '',
    keterangan: '',
    perolehanSuara: 0,
    persentase: 0,
    isPemenang: false
  });

  const [isPenyelenggaraModalOpen, setIsPenyelenggaraModalOpen] = useState(false);
  const [editingPenyelenggaraIndex, setEditingPenyelenggaraIndex] = useState<number | null>(null);
  const [penyelenggaraInput, setPenyelenggaraInput] = useState<PenyelenggaraItem>({
    id: '',
    nama: '',
    desa: 'SAMPELDES',
    jenisKelamin: 'L',
    agama: 'ISLAM',
    jabatan: '',
    kategori: 'pps',
    kontak: ''
  });

  // Handler Inisialisasi Data Default Desa Sampeldes
  const handleSeedAll = async () => {
    if (!firestore) return;
    try {
      setIsSeeding(true);
      const batch = writeBatch(firestore);

      batch.set(doc(firestore, 'pemiluPilkada', 'pemilu_2024'), {
        ...SEED_PEMILU_2024,
        updatedAt: serverTimestamp()
      });
      batch.set(doc(firestore, 'pemiluPilkada', 'pilkada_2024'), {
        ...SEED_PILKADA_2024,
        updatedAt: serverTimestamp()
      });
      batch.set(doc(firestore, 'pemiluPilkada', 'pilkades_2025'), {
        ...SEED_PILKADES_2025,
        updatedAt: serverTimestamp()
      });

      await batch.commit();
      toast({
        title: 'Berhasil Inisialisasi Data',
        description: 'Data default Pemilu 2024, Pilkada 2024, dan Pilkades Sampeldes berhasil disimpan ke database.'
      });
    } catch (err: any) {
      console.error(err);
      toast({
        title: 'Gagal Inisialisasi',
        description: err.message || 'Terjadi kesalahan sistem.',
        variant: 'destructive'
      });
    } finally {
      setIsSeeding(false);
    }
  };

  // Handler Simpan Keseluruhan Dokumen
  const handleSaveDoc = async (newData?: PemiluPilkadaConfig) => {
    if (!firestore) return;
    const dataToSave = newData || formData;
    try {
      setIsSaving(true);
      await setDoc(doc(firestore, 'pemiluPilkada', docId), {
        ...dataToSave,
        tahun: selectedYear,
        kategori: activeTab,
        updatedAt: serverTimestamp()
      }, { merge: true });

      toast({
        title: 'Data Berhasil Disimpan',
        description: `Konfigurasi ${activeTab.toUpperCase()} tahun ${selectedYear} telah tersimpan.`
      });
    } catch (err: any) {
      console.error(err);
      toast({
        title: 'Gagal Menyimpan',
        description: err.message || 'Terjadi kesalahan saat menyimpan.',
        variant: 'destructive'
      });
    } finally {
      setIsSaving(false);
    }
  };

  // ─── CRUD TPS ───
  const openAddTps = () => {
    setEditingTpsIndex(null);
    const nextNum = (formData.tpsList?.length || 0) + 1;
    const formattedNum = nextNum < 10 ? `TPS 00${nextNum}` : `TPS 0${nextNum}`;
    setTpsInput({
      id: `tps-${Date.now()}`,
      nomorTps: formattedNum,
      namaTempat: '',
      cakupanWilayah: '',
      dptLaki: 0,
      dptPerempuan: 0,
      totalDpt: 0
    });
    setIsTpsModalOpen(true);
  };

  const openEditTps = (index: number) => {
    setEditingTpsIndex(index);
    setTpsInput({ ...formData.tpsList[index] });
    setIsTpsModalOpen(true);
  };

  const handleSaveTpsModal = (e: React.FormEvent) => {
    e.preventDefault();
    const updated = [...(formData.tpsList || [])];
    const itemToSave = {
      ...tpsInput,
      totalDpt: (Number(tpsInput.dptLaki) || 0) + (Number(tpsInput.dptPerempuan) || 0)
    };

    if (editingTpsIndex !== null) {
      updated[editingTpsIndex] = itemToSave;
    } else {
      updated.push(itemToSave);
    }

    const newForm = {
      ...formData,
      tpsList: updated,
      jumlahTps: updated.length,
      totalDpt: updated.reduce((acc, c) => acc + (c.totalDpt || 0), 0),
      dptLaki: updated.reduce((acc, c) => acc + (c.dptLaki || 0), 0),
      dptPerempuan: updated.reduce((acc, c) => acc + (c.dptPerempuan || 0), 0)
    };

    setFormData(newForm);
    setIsTpsModalOpen(false);
    handleSaveDoc(newForm);
  };

  const handleDeleteTps = (index: number) => {
    if (!confirm('Yakin ingin menghapus TPS ini?')) return;
    const updated = formData.tpsList.filter((_, i) => i !== index);
    const newForm = {
      ...formData,
      tpsList: updated,
      jumlahTps: updated.length,
      totalDpt: updated.reduce((acc, c) => acc + (c.totalDpt || 0), 0),
      dptLaki: updated.reduce((acc, c) => acc + (c.dptLaki || 0), 0),
      dptPerempuan: updated.reduce((acc, c) => acc + (c.dptPerempuan || 0), 0)
    };
    setFormData(newForm);
    handleSaveDoc(newForm);
  };

  // ─── CRUD REKAPITULASI SUARA ───
  const openAddRekap = () => {
    setEditingRekapIndex(null);
    setRekapInput({
      id: `rekap-${Date.now()}`,
      nomorUrut: (formData.rekapitulasiList?.length || 0) + 1,
      namaKandidat: '',
      namaWakil: '',
      keterangan: '',
      perolehanSuara: 0,
      persentase: 0,
      isPemenang: false
    });
    setIsRekapModalOpen(true);
  };

  const openEditRekap = (index: number) => {
    setEditingRekapIndex(index);
    setRekapInput({ ...formData.rekapitulasiList[index] });
    setIsRekapModalOpen(true);
  };

  const handleSaveRekapModal = (e: React.FormEvent) => {
    e.preventDefault();
    const updated = [...(formData.rekapitulasiList || [])];
    if (editingRekapIndex !== null) {
      updated[editingRekapIndex] = rekapInput;
    } else {
      updated.push(rekapInput);
    }
    const newForm = { ...formData, rekapitulasiList: updated };
    setFormData(newForm);
    setIsRekapModalOpen(false);
    handleSaveDoc(newForm);
  };

  const handleDeleteRekap = (index: number) => {
    if (!confirm('Yakin ingin menghapus data perolehan suara ini?')) return;
    const updated = formData.rekapitulasiList.filter((_, i) => i !== index);
    const newForm = { ...formData, rekapitulasiList: updated };
    setFormData(newForm);
    handleSaveDoc(newForm);
  };

  // ─── CRUD PENYELENGGARA ───
  const openAddPenyelenggara = () => {
    setEditingPenyelenggaraIndex(null);
    setPenyelenggaraInput({
      id: `penyelenggara-${Date.now()}`,
      nama: '',
      desa: 'SAMPELDES',
      jenisKelamin: 'L',
      agama: 'ISLAM',
      jabatan: '',
      kategori: activeTab === 'pilkades' ? 'panitia' : 'pps',
      kontak: ''
    });
    setIsPenyelenggaraModalOpen(true);
  };

  const handleLoadOfficialPps = async () => {
    const newForm = { ...formData, penyelenggaraList: PENYELENGGARA_PPS_SAMPELDES };
    setFormData(newForm);
    await handleSaveDoc(newForm);
    toast({
      title: 'Susunan PPS Resmi Berhasil Dimuat',
      description: '6 personel PPS dan Sekretariat Desa Sampeldes telah diperbarui dan disimpan.'
    });
  };

  const openEditPenyelenggara = (index: number) => {
    setEditingPenyelenggaraIndex(index);
    setPenyelenggaraInput({ ...formData.penyelenggaraList[index] });
    setIsPenyelenggaraModalOpen(true);
  };

  const handleSavePenyelenggaraModal = (e: React.FormEvent) => {
    e.preventDefault();
    const updated = [...(formData.penyelenggaraList || [])];
    if (editingPenyelenggaraIndex !== null) {
      updated[editingPenyelenggaraIndex] = penyelenggaraInput;
    } else {
      updated.push(penyelenggaraInput);
    }
    const newForm = { ...formData, penyelenggaraList: updated };
    setFormData(newForm);
    setIsPenyelenggaraModalOpen(false);
    handleSaveDoc(newForm);
  };

  const handleDeletePenyelenggara = (index: number) => {
    if (!confirm('Yakin ingin menghapus personel ini?')) return;
    const updated = formData.penyelenggaraList.filter((_, i) => i !== index);
    const newForm = { ...formData, penyelenggaraList: updated };
    setFormData(newForm);
    handleSaveDoc(newForm);
  };

  return (
    <div className="w-full max-w-full space-y-6 min-w-0 pb-16">
      {/* ─── HEADER HALAMAN ADMIN ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-white/10 pb-5">
        <div className="space-y-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <Link href="/admin/pelayanan">
              <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-xs text-slate-600 hover:text-slate-900">
                <ArrowLeft className="h-3.5 w-3.5" />
                Kembali
              </Button>
            </Link>
            <span className="text-slate-300">/</span>
            <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider bg-emerald-50 px-2 py-0.5 rounded">
              Data &amp; Informasi Web
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Vote className="h-7 w-7 text-emerald-700" />
            <span>Manajemen Data Pemilu &amp; Pilkada</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Kelola data Daftar Pemilih Tetap (DPT), sebaran TPS, visualisasi demografi, rekapitulasi suara, dan penyelenggara desa.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleSeedAll}
            disabled={isSeeding}
            className="h-9 gap-1.5 text-xs font-bold border-amber-300 text-amber-800 bg-amber-50 hover:bg-amber-100"
          >
            {isSeeding ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5 text-amber-600" />}
            <span>Inisialisasi Data Default</span>
          </Button>

          <a href="/pemilu-pilkada" target="_blank" rel="noopener noreferrer">
            <Button variant="outline" size="sm" className="h-9 gap-1.5 text-xs font-bold border-slate-300 text-slate-700 hover:bg-slate-50 shadow-xs">
              <Eye className="h-3.5 w-3.5" />
              <span>Lihat Halaman Publik</span>
              <ExternalLink className="h-3 w-3 text-slate-400 ml-0.5" />
            </Button>
          </a>
        </div>
      </div>

      {/* ─── KONTROL TAB & TAHUN ─── */}
      <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-white/10 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Tab Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            onClick={() => { setActiveTab('pemilu'); setSelectedYear(2024); }}
            className={cn(
              'h-10 px-4 rounded-xl text-xs font-bold uppercase tracking-wider transition-all gap-1.5',
              activeTab === 'pemilu'
                ? 'bg-emerald-700 text-white shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
            )}
          >
            <Vote className="h-4 w-4" />
            <span>1. Pemilu</span>
          </Button>
          <Button
            type="button"
            onClick={() => { setActiveTab('pilkada'); setSelectedYear(2024); }}
            className={cn(
              'h-10 px-4 rounded-xl text-xs font-bold uppercase tracking-wider transition-all gap-1.5',
              activeTab === 'pilkada'
                ? 'bg-emerald-700 text-white shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
            )}
          >
            <Landmark className="h-4 w-4" />
            <span>2. Pilkada</span>
          </Button>
          <Button
            type="button"
            onClick={() => { setActiveTab('pilkades'); setSelectedYear(2025); }}
            className={cn(
              'h-10 px-4 rounded-xl text-xs font-bold uppercase tracking-wider transition-all gap-1.5',
              activeTab === 'pilkades'
                ? 'bg-emerald-700 text-white shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
            )}
          >
            <Users className="h-4 w-4" />
            <span>3. Pilkades</span>
          </Button>
        </div>

        {/* Year Selector */}
        <div className="flex items-center gap-3">
          <Label className="text-xs font-bold text-slate-600 dark:text-slate-300 shrink-0 flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5 text-emerald-700" />
            <span>Pilih Tahun:</span>
          </Label>
          <Select value={String(selectedYear)} onValueChange={val => setSelectedYear(Number(val))}>
            <SelectTrigger className="w-36 h-10 bg-slate-50 dark:bg-slate-800 border-slate-300 dark:border-white/10 rounded-xl text-xs font-bold">
              <SelectValue placeholder="Pilih Tahun" />
            </SelectTrigger>
            <SelectContent>
              {[2025, 2024, 2019, 2018].map(y => (
                <SelectItem key={y} value={String(y)} className="text-xs font-bold">
                  Tahun {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* ─── FORM 1: INFORMASI UMUM & STATISTIK PEMILIH ─── */}
      <Card className="rounded-2xl border-slate-200 dark:border-white/10 shadow-sm">
        <CardHeader className="p-5 sm:p-6 pb-2 border-b border-slate-100 dark:border-white/5 flex flex-row items-center justify-between">
          <CardTitle className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-emerald-700" />
            <span>Informasi Kegiatan &amp; Ringkasan Statistik Pemilih ({activeTab.toUpperCase()} {selectedYear})</span>
          </CardTitle>
          <Button
            type="button"
            onClick={() => handleSaveDoc()}
            disabled={isSaving}
            className="bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl h-9 px-4 gap-1.5 text-xs font-bold"
          >
            {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
            <span>Simpan Perubahan</span>
          </Button>
        </CardHeader>
        <CardContent className="p-5 sm:p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700 dark:text-slate-200">Nama Kegiatan / Agenda</Label>
              <Input
                value={formData.namaKegiatan || ''}
                onChange={e => setFormData({ ...formData, namaKegiatan: e.target.value })}
                placeholder="Contoh: Pemilihan Umum (Pemilu) Presiden & Legislatif 2024"
                className="rounded-xl text-xs h-10"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700 dark:text-slate-200">Tanggal Pelaksanaan</Label>
              <Input
                value={formData.tanggalPelaksanaan || ''}
                onChange={e => setFormData({ ...formData, tanggalPelaksanaan: e.target.value })}
                placeholder="Contoh: 14 Februari 2024"
                className="rounded-xl text-xs h-10"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-slate-700 dark:text-slate-200">Deskripsi / Catatan Resmi</Label>
            <Textarea
              rows={2}
              value={formData.deskripsi || ''}
              onChange={e => setFormData({ ...formData, deskripsi: e.target.value })}
              placeholder="Deskripsi ringkas mengenai penyelenggaraan..."
              className="rounded-xl text-xs"
            />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 pt-2">
            <div className="space-y-1.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10">
              <Label className="text-[11px] font-bold text-slate-600 dark:text-slate-300">Total DPT (Jiwa)</Label>
              <Input
                type="number"
                value={formData.totalDpt || 0}
                onChange={e => setFormData({ ...formData, totalDpt: Number(e.target.value) })}
                className="font-mono font-bold text-xs h-9 bg-white dark:bg-slate-900"
              />
            </div>
            <div className="space-y-1.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10">
              <Label className="text-[11px] font-bold text-sky-800">DPT Laki-laki</Label>
              <Input
                type="number"
                value={formData.dptLaki || 0}
                onChange={e => setFormData({ ...formData, dptLaki: Number(e.target.value) })}
                className="font-mono font-bold text-xs h-9 bg-white dark:bg-slate-900"
              />
            </div>
            <div className="space-y-1.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10">
              <Label className="text-[11px] font-bold text-rose-800">DPT Perempuan</Label>
              <Input
                type="number"
                value={formData.dptPerempuan || 0}
                onChange={e => setFormData({ ...formData, dptPerempuan: Number(e.target.value) })}
                className="font-mono font-bold text-xs h-9 bg-white dark:bg-slate-900"
              />
            </div>
            <div className="space-y-1.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10">
              <Label className="text-[11px] font-bold text-amber-800">Jumlah Lokasi TPS</Label>
              <Input
                type="number"
                value={formData.jumlahTps || 0}
                onChange={e => setFormData({ ...formData, jumlahTps: Number(e.target.value) })}
                className="font-mono font-bold text-xs h-9 bg-white dark:bg-slate-900"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
            <div className="space-y-1.5 p-3 rounded-xl bg-emerald-50/60 border border-emerald-200">
              <Label className="text-[11px] font-bold text-emerald-900">Partisipasi Pemilih (%)</Label>
              <Input
                type="number"
                step="0.1"
                value={formData.tingkatPartisipasi || 0}
                onChange={e => setFormData({ ...formData, tingkatPartisipasi: Number(e.target.value) })}
                className="font-mono font-bold text-xs h-9 bg-white"
              />
            </div>
            <div className="space-y-1.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10">
              <Label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">Total Suara Masuk</Label>
              <Input
                type="number"
                value={formData.totalSuaraMasuk || 0}
                onChange={e => setFormData({ ...formData, totalSuaraMasuk: Number(e.target.value) })}
                className="font-mono font-bold text-xs h-9 bg-white dark:bg-slate-900"
              />
            </div>
            <div className="space-y-1.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10">
              <Label className="text-[11px] font-bold text-emerald-800">Suara Sah</Label>
              <Input
                type="number"
                value={formData.totalSuaraSah || 0}
                onChange={e => setFormData({ ...formData, totalSuaraSah: Number(e.target.value) })}
                className="font-mono font-bold text-xs h-9 bg-white dark:bg-slate-900"
              />
            </div>
            <div className="space-y-1.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10">
              <Label className="text-[11px] font-bold text-rose-800">Suara Tidak Sah</Label>
              <Input
                type="number"
                value={formData.totalSuaraTidakSah || 0}
                onChange={e => setFormData({ ...formData, totalSuaraTidakSah: Number(e.target.value) })}
                className="font-mono font-bold text-xs h-9 bg-white dark:bg-slate-900"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ─── FORM 2: DEMOGRAFI PEMILIH (GENERASI & DISABILITAS) ─── */}
      <Card className="rounded-2xl border-slate-200 dark:border-white/10 shadow-sm">
        <CardHeader className="p-5 sm:p-6 pb-2 border-b border-slate-100 dark:border-white/5">
          <CardTitle className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Users className="h-4 w-4 text-emerald-700" />
            <span>Demografi Pemilih (Klasifikasi Generasi &amp; Pemilih Disabilitas)</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-5 sm:p-6 space-y-6">
          {/* Sub 1: Generasi Usia */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              A. Klasifikasi Usia / Generasi Pemilih:
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {(formData.demografiGenerasi || []).map((gen, idx) => (
                <div key={idx} className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: gen.color || '#059669' }} />
                    <span className="font-bold text-xs text-slate-900 dark:text-white">{gen.nama}</span>
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono">{gen.rentangUsia}</div>
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <div>
                      <Label className="text-[10px] text-slate-500">Jumlah Jiwa</Label>
                      <Input
                        type="number"
                        value={gen.jumlah || 0}
                        onChange={e => {
                          const updated = [...formData.demografiGenerasi];
                          updated[idx] = { ...updated[idx], jumlah: Number(e.target.value) };
                          setFormData({ ...formData, demografiGenerasi: updated });
                        }}
                        className="font-mono text-xs h-8 bg-white dark:bg-slate-900"
                      />
                    </div>
                    <div>
                      <Label className="text-[10px] text-slate-500">Persen (%)</Label>
                      <Input
                        type="number"
                        step="0.1"
                        value={gen.persen || 0}
                        onChange={e => {
                          const updated = [...formData.demografiGenerasi];
                          updated[idx] = { ...updated[idx], persen: Number(e.target.value) };
                          setFormData({ ...formData, demografiGenerasi: updated });
                        }}
                        className="font-mono text-xs h-8 bg-white dark:bg-slate-900"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Sub 2: Pemilih Disabilitas */}
          <div className="space-y-3 pt-3 border-t border-slate-200 dark:border-white/10">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              B. Pemilih Disabilitas &amp; Kebutuhan Khusus:
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {(formData.demografiDisabilitas || []).map((dis, idx) => (
                <div key={idx} className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: dis.color || '#0284c7' }} />
                    <span className="font-bold text-xs text-slate-900 dark:text-white line-clamp-1">{dis.jenis}</span>
                  </div>
                  <div>
                    <Label className="text-[10px] text-slate-500">Jumlah Pemilih</Label>
                    <Input
                      type="number"
                      value={dis.jumlah || 0}
                      onChange={e => {
                        const updated = [...formData.demografiDisabilitas];
                        updated[idx] = { ...updated[idx], jumlah: Number(e.target.value) };
                        setFormData({ ...formData, demografiDisabilitas: updated });
                      }}
                      className="font-mono text-xs h-8 bg-white dark:bg-slate-900 mt-1"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ─── FORM 3: KELOLA SEBARAN TPS & WILAYAH CAKUPAN ─── */}
      <Card className="rounded-2xl border-slate-200 dark:border-white/10 shadow-sm">
        <CardHeader className="p-5 sm:p-6 pb-2 border-b border-slate-100 dark:border-white/5 flex flex-row items-center justify-between">
          <CardTitle className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <MapPin className="h-4 w-4 text-emerald-700" />
            <span>Tabel Sebaran TPS ({formData.tpsList?.length || 0} Titik Terdaftar)</span>
          </CardTitle>
          <Button
            type="button"
            onClick={openAddTps}
            className="bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl h-9 px-3 gap-1.5 text-xs font-bold"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Tambah TPS</span>
          </Button>
        </CardHeader>
        <CardContent className="p-5 sm:p-6">
          <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-white/10">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-100 dark:bg-slate-800 font-bold uppercase text-[11px] text-slate-700 dark:text-slate-300">
                <tr>
                  <th className="py-2.5 px-3 text-center w-24">Nomor TPS</th>
                  <th className="py-2.5 px-3">Nama Tempat TPS</th>
                  <th className="py-2.5 px-3">Cakupan Wilayah (Dusun / RT / RW)</th>
                  <th className="py-2.5 px-3 text-right">DPT (L)</th>
                  <th className="py-2.5 px-3 text-right">DPT (P)</th>
                  <th className="py-2.5 px-3 text-right">Total DPT</th>
                  <th className="py-2.5 px-3 text-center w-24">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-white/5">
                {(formData.tpsList || []).map((tps, idx) => (
                  <tr key={tps.id || idx} className="hover:bg-slate-50 dark:hover:bg-white/5">
                    <td className="py-2 px-3 text-center font-mono font-bold text-emerald-800">{tps.nomorTps}</td>
                    <td className="py-2 px-3 font-semibold text-slate-900 dark:text-white">{tps.namaTempat}</td>
                    <td className="py-2 px-3 text-slate-600 dark:text-slate-300">{tps.cakupanWilayah}</td>
                    <td className="py-2 px-3 text-right font-mono text-sky-800">{tps.dptLaki}</td>
                    <td className="py-2 px-3 text-right font-mono text-rose-800">{tps.dptPerempuan}</td>
                    <td className="py-2 px-3 text-right font-mono font-black text-slate-900 dark:text-white">{tps.totalDpt}</td>
                    <td className="py-2 px-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditTps(idx)}
                          className="h-7 w-7 text-slate-600 hover:text-emerald-700"
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteTps(idx)}
                          className="h-7 w-7 text-rose-600 hover:text-rose-800"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* ─── FORM 4: REKAPITULASI SUARA TINGKAT DESA ─── */}
      <Card className="rounded-2xl border-slate-200 dark:border-white/10 shadow-sm">
        <CardHeader className="p-5 sm:p-6 pb-2 border-b border-slate-100 dark:border-white/5 flex flex-row items-center justify-between">
          <CardTitle className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Award className="h-4 w-4 text-emerald-700" />
            <span>Rekapitulasi &amp; Arsip Hasil Suara Tingkat Desa</span>
          </CardTitle>
          <Button
            type="button"
            onClick={openAddRekap}
            className="bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl h-9 px-3 gap-1.5 text-xs font-bold"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Tambah Paslon / Kandidat</span>
          </Button>
        </CardHeader>
        <CardContent className="p-5 sm:p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
            {(formData.rekapitulasiList || []).map((rekap, idx) => (
              <div
                key={rekap.id || idx}
                className={cn(
                  'p-4 rounded-xl border relative space-y-2',
                  rekap.isPemenang ? 'bg-amber-50/60 border-amber-300' : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-white/10'
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="w-7 h-7 rounded-lg bg-slate-900 text-white flex items-center justify-center font-mono font-black text-xs">
                    0{rekap.nomorUrut}
                  </span>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" onClick={() => openEditRekap(idx)} className="h-7 w-7 text-slate-600">
                      <Edit className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDeleteRekap(idx)} className="h-7 w-7 text-rose-600">
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>

                <div>
                  <h4 className="font-bold text-xs text-slate-900 dark:text-white">{rekap.namaKandidat}</h4>
                  {rekap.namaWakil && <p className="text-[11px] text-slate-600 dark:text-slate-300">Wakil: {rekap.namaWakil}</p>}
                </div>

                <div className="pt-2 border-t border-slate-200 dark:border-white/10 flex justify-between items-baseline text-xs font-mono">
                  <span className="font-bold text-slate-900 dark:text-white">{rekap.perolehanSuara} Suara</span>
                  <span className="font-bold text-emerald-800">{rekap.persentase}%</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ─── FORM 5: PENYELENGGARA TINGKAT DESA ─── */}
      <Card className="rounded-2xl border-slate-200 dark:border-white/10 shadow-sm">
        <CardHeader className="p-5 sm:p-6 pb-2 border-b border-slate-100 dark:border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <CardTitle className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <HeartHandshake className="h-4 w-4 text-emerald-700" />
            <span>Penyelenggara Tingkat Desa {activeTab === 'pilkades' ? '(Panitia Pilkades)' : '(PPS & Sekretariat PPS)'}</span>
          </CardTitle>
          <div className="flex items-center gap-2 flex-wrap">
            {(activeTab === 'pemilu' || activeTab === 'pilkada') && (
              <Button
                type="button"
                variant="outline"
                onClick={handleLoadOfficialPps}
                className="border-emerald-600 text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-xl h-9 px-3 gap-1.5 text-xs font-bold"
              >
                <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
                <span>Muat PPS Resmi (6 Orang)</span>
              </Button>
            )}
            <Button
              type="button"
              onClick={openAddPenyelenggara}
              className="bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl h-9 px-3 gap-1.5 text-xs font-bold"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Tambah Personel</span>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-5 sm:p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
            {(formData.penyelenggaraList || []).map((person, idx) => (
              <div key={person.id || idx} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 space-y-2">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <Badge variant="outline" className="text-[10px] font-bold uppercase font-mono px-2 py-0.5 bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950/50 dark:text-emerald-300">
                      {person.kategori === 'pps' ? 'KOMISIONER PPS' : person.kategori === 'sekretariat' ? 'SEKRETARIAT PPS' : 'PANITIA PILKADES'}
                    </Badge>
                    {(person.jenisKelamin || person.agama) && (
                      <Badge variant="secondary" className="text-[9px] font-mono px-1.5 py-0.5">
                        {person.jenisKelamin || '-'}{person.agama ? ` • ${person.agama}` : ''}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" onClick={() => openEditPenyelenggara(idx)} className="h-7 w-7 text-slate-600">
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDeletePenyelenggara(idx)} className="h-7 w-7 text-rose-600">
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                <div>
                  <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">{person.nama}</h4>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5 leading-snug">{person.jabatan}</p>
                </div>
                <div className="pt-2 border-t border-slate-200 dark:border-white/10 flex items-center justify-between text-[10px] text-slate-500">
                  <span>Desa: <strong className="text-slate-700 dark:text-slate-200">{person.desa || 'SAMPELDES'}</strong></span>
                  {person.kontak && (
                    <a
                      href={`https://wa.me/${person.kontak.replace(/[^0-9]/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-emerald-700 dark:text-emerald-400 font-bold hover:underline flex items-center gap-1 font-mono"
                    >
                      <Phone className="h-3 w-3" />
                      <span>{person.kontak}</span>
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ─── MODAL ADD/EDIT TPS ─── */}
      <Dialog open={isTpsModalOpen} onOpenChange={setIsTpsModalOpen}>
        <DialogContent className="max-w-md rounded-2xl p-5 sm:p-6">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900">
              {editingTpsIndex !== null ? 'Edit Data TPS' : 'Tambah Titik TPS Baru'}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Lengkapi nomor TPS, lokasi penempatan, dan cakupan wilayah DPT.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveTpsModal} className="space-y-3.5 pt-2">
            <div className="space-y-1">
              <Label className="text-xs font-bold text-slate-700">Nomor TPS</Label>
              <Input
                required
                placeholder="Contoh: TPS 001"
                value={tpsInput.nomorTps}
                onChange={e => setTpsInput({ ...tpsInput, nomorTps: e.target.value })}
                className="rounded-xl text-xs h-9"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-bold text-slate-700">Lokasi / Nama Tempat TPS</Label>
              <Input
                required
                placeholder="Contoh: Balai Dusun Sitinggil"
                value={tpsInput.namaTempat}
                onChange={e => setTpsInput({ ...tpsInput, namaTempat: e.target.value })}
                className="rounded-xl text-xs h-9"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-bold text-slate-700">Cakupan Wilayah (Dusun / RT / RW)</Label>
              <Input
                required
                placeholder="Contoh: Dusun Sitinggil (RT 01, 02 / RW 01)"
                value={tpsInput.cakupanWilayah}
                onChange={e => setTpsInput({ ...tpsInput, cakupanWilayah: e.target.value })}
                className="rounded-xl text-xs h-9"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-bold text-sky-800">Jumlah DPT (L)</Label>
                <Input
                  type="number"
                  required
                  value={tpsInput.dptLaki}
                  onChange={e => setTpsInput({ ...tpsInput, dptLaki: Number(e.target.value) })}
                  className="rounded-xl text-xs h-9 font-mono"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-bold text-rose-800">Jumlah DPT (P)</Label>
                <Input
                  type="number"
                  required
                  value={tpsInput.dptPerempuan}
                  onChange={e => setTpsInput({ ...tpsInput, dptPerempuan: Number(e.target.value) })}
                  className="rounded-xl text-xs h-9 font-mono"
                />
              </div>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-100 flex justify-between items-center text-xs font-bold">
              <span className="text-slate-600">Total DPT Otomatis:</span>
              <span className="font-mono text-emerald-900 text-sm">
                {(Number(tpsInput.dptLaki) || 0) + (Number(tpsInput.dptPerempuan) || 0)} Jiwa
              </span>
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="ghost" onClick={() => setIsTpsModalOpen(false)} className="rounded-xl h-9 text-xs">
                Batal
              </Button>
              <Button type="submit" className="bg-emerald-700 text-white rounded-xl h-9 text-xs font-bold">
                Simpan TPS
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ─── MODAL ADD/EDIT REKAPITULASI SUARA ─── */}
      <Dialog open={isRekapModalOpen} onOpenChange={setIsRekapModalOpen}>
        <DialogContent className="max-w-md rounded-2xl p-5 sm:p-6">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900">
              {editingRekapIndex !== null ? 'Edit Paslon / Hasil Suara' : 'Tambah Paslon / Kontestan'}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Lengkapi nama kandidat, perolehan suara sah, dan persentase.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveRekapModal} className="space-y-3.5 pt-2">
            <div className="grid grid-cols-4 gap-3">
              <div className="space-y-1 col-span-1">
                <Label className="text-xs font-bold text-slate-700">No. Urut</Label>
                <Input
                  type="number"
                  required
                  value={rekapInput.nomorUrut}
                  onChange={e => setRekapInput({ ...rekapInput, nomorUrut: Number(e.target.value) })}
                  className="rounded-xl text-xs h-9 font-mono"
                />
              </div>
              <div className="space-y-1 col-span-3">
                <Label className="text-xs font-bold text-slate-700">Nama Kandidat / Paslon</Label>
                <Input
                  required
                  placeholder="Nama calon..."
                  value={rekapInput.namaKandidat}
                  onChange={e => setRekapInput({ ...rekapInput, namaKandidat: e.target.value })}
                  className="rounded-xl text-xs h-9"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-bold text-slate-700">Nama Wakil (Opsional)</Label>
              <Input
                placeholder="Nama wakil jika ada..."
                value={rekapInput.namaWakil || ''}
                onChange={e => setRekapInput({ ...rekapInput, namaWakil: e.target.value })}
                className="rounded-xl text-xs h-9"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-bold text-slate-700">Keterangan / Koalisi / Visi</Label>
              <Input
                placeholder="Contoh: Koalisi Indonesia Maju"
                value={rekapInput.keterangan || ''}
                onChange={e => setRekapInput({ ...rekapInput, keterangan: e.target.value })}
                className="rounded-xl text-xs h-9"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-700">Perolehan Suara</Label>
                <Input
                  type="number"
                  required
                  value={rekapInput.perolehanSuara}
                  onChange={e => setRekapInput({ ...rekapInput, perolehanSuara: Number(e.target.value) })}
                  className="rounded-xl text-xs h-9 font-mono"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-700">Persentase (%)</Label>
                <Input
                  type="number"
                  step="0.1"
                  required
                  value={rekapInput.persentase}
                  onChange={e => setRekapInput({ ...rekapInput, persentase: Number(e.target.value) })}
                  className="rounded-xl text-xs h-9 font-mono"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="isPemenangCheck"
                checked={rekapInput.isPemenang || false}
                onChange={e => setRekapInput({ ...rekapInput, isPemenang: e.target.checked })}
                className="rounded border-slate-300 text-emerald-700 focus:ring-emerald-700"
              />
              <Label htmlFor="isPemenangCheck" className="text-xs font-bold text-slate-800 cursor-pointer">
                Tandai sebagai Perolehan Suara Terbanyak (Pemenang)
              </Label>
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="ghost" onClick={() => setIsRekapModalOpen(false)} className="rounded-xl h-9 text-xs">
                Batal
              </Button>
              <Button type="submit" className="bg-emerald-700 text-white rounded-xl h-9 text-xs font-bold">
                Simpan
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ─── MODAL ADD/EDIT PENYELENGGARA ─── */}
      <Dialog open={isPenyelenggaraModalOpen} onOpenChange={setIsPenyelenggaraModalOpen}>
        <DialogContent className="max-w-md rounded-2xl p-5 sm:p-6">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900">
              {editingPenyelenggaraIndex !== null ? 'Edit Personel Penyelenggara' : 'Tambah Personel Penyelenggara'}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Kelola daftar nama komisioner PPS, sekretariat, atau panitia pemilihan.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSavePenyelenggaraModal} className="space-y-3.5 pt-2">
            <div className="space-y-1">
              <Label className="text-xs font-bold text-slate-700">Nama Lengkap</Label>
              <Input
                required
                placeholder="Contoh: Ahmad Fauzi, S.Pd."
                value={penyelenggaraInput.nama}
                onChange={e => setPenyelenggaraInput({ ...penyelenggaraInput, nama: e.target.value })}
                className="rounded-xl text-xs h-9"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-bold text-slate-700">Jabatan / Divisi</Label>
              <Input
                required
                placeholder="Contoh: Ketua PPS / Divisi Teknis"
                value={penyelenggaraInput.jabatan}
                onChange={e => setPenyelenggaraInput({ ...penyelenggaraInput, jabatan: e.target.value })}
                className="rounded-xl text-xs h-9"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-bold text-slate-700">Kategori Personel</Label>
              <Select
                value={penyelenggaraInput.kategori}
                onValueChange={(val: any) => setPenyelenggaraInput({ ...penyelenggaraInput, kategori: val })}
              >
                <SelectTrigger className="rounded-xl text-xs h-9">
                  <SelectValue placeholder="Pilih Kategori" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pps" className="text-xs font-bold">Komisioner PPS</SelectItem>
                  <SelectItem value="sekretariat" className="text-xs font-bold">Sekretariat PPS</SelectItem>
                  <SelectItem value="panitia" className="text-xs font-bold">Panitia Pilkades</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-3 gap-2.5">
              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-700">Desa</Label>
                <Input
                  placeholder="SAMPELDES"
                  value={penyelenggaraInput.desa || ''}
                  onChange={e => setPenyelenggaraInput({ ...penyelenggaraInput, desa: e.target.value })}
                  className="rounded-xl text-xs h-9 uppercase"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-700">Gender</Label>
                <Select
                  value={penyelenggaraInput.jenisKelamin || 'L'}
                  onValueChange={(val: any) => setPenyelenggaraInput({ ...penyelenggaraInput, jenisKelamin: val })}
                >
                  <SelectTrigger className="rounded-xl text-xs h-9">
                    <SelectValue placeholder="L/P" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="L" className="text-xs font-bold">Laki-laki (L)</SelectItem>
                    <SelectItem value="P" className="text-xs font-bold">Perempuan (P)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-700">Agama</Label>
                <Input
                  placeholder="ISLAM"
                  value={penyelenggaraInput.agama || ''}
                  onChange={e => setPenyelenggaraInput({ ...penyelenggaraInput, agama: e.target.value })}
                  className="rounded-xl text-xs h-9 uppercase"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-bold text-slate-700">Kontak / No. WhatsApp (Opsional)</Label>
              <Input
                placeholder="Contoh: 0812-3456-7890"
                value={penyelenggaraInput.kontak || ''}
                onChange={e => setPenyelenggaraInput({ ...penyelenggaraInput, kontak: e.target.value })}
                className="rounded-xl text-xs h-9"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="ghost" onClick={() => setIsPenyelenggaraModalOpen(false)} className="rounded-xl h-9 text-xs">
                Batal
              </Button>
              <Button type="submit" className="bg-emerald-700 text-white rounded-xl h-9 text-xs font-bold">
                Simpan
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
