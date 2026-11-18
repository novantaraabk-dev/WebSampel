'use client';

import React, { useState } from 'react';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, where, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Hash,
  Plus,
  Search,
  Loader2,
  Trash2,
  ArrowUpRight,
  ArrowDownLeft,
  FileText,
  Scale,
  Map,
  Save,
  Tag,
  Building2,
  FileCheck2,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { KodeKlasifikasiTab } from './kode-klasifikasi-tab';
import { KodeDinasTab } from './kode-dinas-tab';
import { PengaturanPermohonanSuratTab } from './pengaturan-permohonan-surat-tab';

export const REGISTER_SURAT_TABS = [
  { id: 'surat_keluar', label: 'Agenda Surat Keluar', icon: ArrowUpRight, color: 'text-blue-500' },
  { id: 'surat_masuk', label: 'Agenda Surat Masuk', icon: ArrowDownLeft, color: 'text-emerald-500' },
  { id: 'perdes', label: 'Nomor Perdes', icon: Scale, color: 'text-amber-500' },
  { id: 'perkades', label: 'Nomor Perkades', icon: Scale, color: 'text-orange-500' },
  { id: 'sk', label: 'Nomor SK', icon: FileText, color: 'text-purple-500' },
  { id: 'sppd', label: 'Nomor SPPD', icon: Map, color: 'text-teal-500' },
  { id: 'kode_klasifikasi', label: 'KODE KLASIFIKASI', icon: Tag, color: 'text-emerald-600', isNew: true },
  { id: 'kode_dinas', label: 'Kode Dinas', icon: Building2, color: 'text-blue-600', isNew: true },
  { id: 'permohonan_surat', label: 'Permohonan Surat', icon: FileCheck2, color: 'text-rose-600', isNew: true },
];

interface RegisterNomorSuratTabProps {
  defaultCategory?: string;
}

export function RegisterNomorSuratTab({ defaultCategory = 'surat_keluar' }: RegisterNomorSuratTabProps) {
  const { user, isUserLoading } = useUser();
  const db = useFirestore();
  const { toast } = useToast();

  const [activeKategori, setActiveKategori] = useState(defaultCategory);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState({
    nomor: '',
    perihal: '',
    tanggal: format(new Date(), 'yyyy-MM-dd'),
  });

  const isAgendaCategory = [
    'surat_keluar',
    'surat_masuk',
    'perdes',
    'perkades',
    'sk',
    'sppd',
  ].includes(activeKategori);

  const agendaQuery = useMemoFirebase(() => {
    if (!db || !isAgendaCategory) return null;
    return query(
      collection(db, 'buku_agenda'),
      where('kategori', '==', activeKategori),
      orderBy('createdAt', 'desc')
    );
  }, [db, activeKategori, isAgendaCategory]);

  const { data: agendaList, isLoading } = useCollection(agendaQuery);

  const filtered = (agendaList || []).filter((item) =>
    (item.nomor || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.perihal || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSave = async () => {
    if (!db || !formData.nomor || !formData.perihal) {
      toast({ variant: 'destructive', title: 'Gagal', description: 'Lengkapi semua isian form.' });
      return;
    }

    setIsSaving(true);
    try {
      const id = doc(collection(db, 'buku_agenda')).id;
      await setDoc(doc(db, 'buku_agenda', id), {
        ...formData,
        id,
        kategori: activeKategori,
        userId: user?.uid || 'admin',
        createdAt: new Date().toISOString(),
      });
      toast({ title: 'Tersimpan', description: 'Data agenda resmi telah dicatat.' });
      setIsAddOpen(false);
      setFormData({ nomor: '', perihal: '', tanggal: format(new Date(), 'yyyy-MM-dd') });
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Error', description: e.message || 'Gagal menyimpan data.' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!db) return;
    if (!confirm('Hapus entri agenda ini dari buku register?')) return;
    try {
      await deleteDoc(doc(db, 'buku_agenda', id));
      toast({ title: 'Terhapus', description: 'Agenda telah dihapus.' });
    } catch (e) {
      toast({ variant: 'destructive', title: 'Gagal', description: 'Terjadi kesalahan saat menghapus.' });
    }
  };

  return (
    <div className="space-y-6 w-full max-w-full min-w-0">
      {/* Sub Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-5 sm:p-6 rounded-[28px] neu-card-elevated border border-white/60 w-full max-w-full">
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="h-12 w-12 rounded-2xl neu-inset bg-emerald-500/10 text-emerald-800 flex items-center justify-center shrink-0 border border-emerald-500/20">
            <Hash className="h-6 w-6" />
          </div>
          <div className="min-w-0">
            <h2 className="text-lg sm:text-xl md:text-2xl font-condensed font-extrabold text-slate-900 dark:text-white uppercase tracking-tight">
              Register Nomor Surat &amp; Tata Naskah Dinas
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">
              Buku agenda penomoran surat, kode klasifikasi persuratan resmi, dan kode instansi perangkat daerah.
            </p>
          </div>
        </div>

        {isAgendaCategory && (
          <Button
            onClick={() => setIsAddOpen(true)}
            className="h-10 sm:h-11 px-4 sm:px-5 rounded-xl neu-btn-dark text-teal-400 font-condensed font-extrabold uppercase text-xs shadow-md border border-white/10 active:scale-95 transition-all gap-2 self-start lg:self-auto shrink-0"
          >
            <Plus className="h-4 w-4" />
            <span>Input Agenda Manual</span>
          </Button>
        )}
      </div>

      {/* Tabs Navigation */}
      <Tabs value={activeKategori} onValueChange={setActiveKategori} className="w-full max-w-full min-w-0 space-y-5">
        <div className="w-full max-w-full overflow-hidden">
          <TabsList className="flex flex-wrap items-center h-auto bg-stone-200/50 dark:bg-stone-900/50 p-1.5 rounded-2xl gap-1.5 border border-stone-300/40 dark:border-white/10 w-full">
            {REGISTER_SURAT_TABS.map((cat) => {
              const isActive = activeKategori === cat.id;
              return (
                <TabsTrigger
                  key={cat.id}
                  value={cat.id}
                  className={cn(
                    'rounded-xl h-9 sm:h-10 px-3 sm:px-3.5 text-[11px] font-condensed font-bold uppercase gap-1.5 sm:gap-2 transition-all shrink-0',
                    'data-[state=active]:!bg-[#0e1620] data-[state=active]:!text-teal-400 data-[state=active]:shadow-lg data-[state=active]:border-white/10',
                    isActive
                      ? '!bg-[#0e1620] !text-teal-400 shadow-lg border border-white/10'
                      : 'text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-stone-300/40'
                  )}
                >
                  <cat.icon
                    className={cn(
                      'h-3.5 w-3.5 transition-colors shrink-0',
                      isActive ? '!text-teal-400' : cat.color
                    )}
                  />
                  <span className={cn('tracking-wide transition-colors whitespace-nowrap', isActive ? '!text-teal-400' : '')}>
                    {cat.label.replace('Agenda ', '')}
                  </span>
                  {cat.isNew && (
                    <span className={cn(
                      'text-[9px] font-bold px-1.5 py-0.2 rounded-full border transition-colors shrink-0',
                      isActive
                        ? 'bg-teal-500/20 text-teal-400 border-teal-500/40'
                        : 'bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border-emerald-500/30'
                    )}>
                      BARU
                    </span>
                  )}
                </TabsTrigger>
              );
            })}
          </TabsList>
        </div>

        {/* Tab Content: KODE KLASIFIKASI */}
        {activeKategori === 'kode_klasifikasi' && (
          <KodeKlasifikasiTab />
        )}

        {/* Tab Content: Kode Dinas (Paling Kanan) */}
        {activeKategori === 'kode_dinas' && (
          <KodeDinasTab />
        )}

        {/* Tab Content: Pengaturan Permohonan Surat */}
        {activeKategori === 'permohonan_surat' && (
          <PengaturanPermohonanSuratTab />
        )}

        {/* Tab Content: Buku Agenda Kategori Surat / Regulasi */}
        {isAgendaCategory && (
          <div className="neu-card-elevated rounded-[28px] p-4 sm:p-6 border border-white/60 space-y-4 w-full max-w-full overflow-hidden">
            {/* Header Kategori Aktif & Pencarian */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-200 dark:border-white/10 pb-4">
              <div className="min-w-0">
                <h3 className="text-base font-condensed font-bold uppercase text-slate-900 dark:text-white">
                  {REGISTER_SURAT_TABS.find((c) => c.id === activeKategori)?.label}
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Daftar register penomoran yang tercatat di database buku agenda desa.
                </p>
              </div>

              <div className="relative w-full sm:w-72 lg:w-80 shrink-0">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <Input
                  placeholder="Cari nomor atau perihal..."
                  className="pl-9 pr-3 h-9 rounded-xl neu-card-elevated border border-stone-300/60 dark:border-white/10 text-xs font-medium w-full"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            {/* Tabel Agenda */}
            <div className="overflow-x-auto rounded-2xl border border-stone-200 dark:border-white/10 neu-inset w-full">
              <table className="w-full text-left text-xs text-slate-800 dark:text-slate-200">
                <thead className="bg-stone-200/60 dark:bg-stone-800/60 text-slate-900 dark:text-white uppercase font-condensed font-bold tracking-wider text-[11px] border-b border-stone-300 dark:border-white/10">
                  <tr>
                    <th className="py-3 px-3.5 text-center w-12 sm:w-14 shrink-0">No</th>
                    <th className="py-3 px-3.5 whitespace-nowrap w-52 sm:w-60">Nomor Surat / Dokumen</th>
                    <th className="py-3 px-3.5 min-w-[200px]">Perihal / Kegiatan</th>
                    <th className="py-3 px-3.5 whitespace-nowrap w-28 sm:w-32">Tanggal</th>
                    <th className="py-3 px-3.5 text-center w-16 sm:w-20 shrink-0">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-200 dark:divide-white/10">
                  {isLoading ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-slate-500">
                        <div className="flex items-center justify-center gap-2">
                          <Loader2 className="h-5 w-5 animate-spin text-emerald-600" />
                          <span>Memuat data agenda...</span>
                        </div>
                      </td>
                    </tr>
                  ) : filtered.length > 0 ? (
                    filtered.map((item, idx) => (
                      <tr key={item.id} className="hover:bg-white/40 dark:hover:bg-white/5 transition-colors">
                        <td className="py-2.5 px-3.5 text-center font-bold text-slate-500 text-[11px]">
                          {idx + 1}
                        </td>
                        <td className="py-2.5 px-3.5 whitespace-nowrap">
                          <span className="font-mono font-bold text-xs text-slate-900 dark:text-white bg-stone-200/50 dark:bg-stone-800/60 px-2.5 py-1 rounded border border-stone-300/40 inline-block">
                            {item.nomor}
                          </span>
                        </td>
                        <td className="py-2.5 px-3.5 font-bold text-slate-900 dark:text-white">
                          {item.perihal}
                        </td>
                        <td className="py-2.5 px-3.5 text-slate-600 dark:text-slate-400 font-mono text-[11px] whitespace-nowrap">
                          {item.tanggal}
                        </td>
                        <td className="py-2.5 px-3.5 text-center">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 w-7 p-0 text-red-600 hover:text-red-700 hover:bg-red-500/10 mx-auto flex items-center justify-center"
                            onClick={() => handleDelete(item.id)}
                            title="Hapus Entri"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-slate-500 italic">
                        Belum ada data agenda yang tercatat di kategori ini.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </Tabs>

      {/* Modal Input Agenda Manual */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="max-w-md bg-white dark:bg-[#081d27] dark:bg-stone-900 rounded-[28px] border border-stone-300 dark:border-white/10 shadow-2xl p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-condensed font-bold uppercase text-slate-900 dark:text-white flex items-center gap-2">
              <Plus className="h-5 w-5 text-emerald-600" />
              <span>Input Agenda Baru</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-600 dark:text-slate-400 font-bold uppercase text-emerald-700">
              Kategori: {REGISTER_SURAT_TABS.find((c) => c.id === activeKategori)?.label}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 my-2 text-xs">
            <div className="space-y-1.5">
              <Label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">Tanggal Surat</Label>
              <Input
                type="date"
                value={formData.tanggal}
                onChange={(e) => setFormData((p) => ({ ...p, tanggal: e.target.value }))}
                className="h-9 rounded-xl neu-card-elevated border border-stone-300/60 dark:border-white/10 text-xs font-bold"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">Nomor Surat / Dokumen</Label>
              <Input
                placeholder="Contoh: 400 / 056 / 04 / 2026"
                value={formData.nomor}
                onChange={(e) => setFormData((p) => ({ ...p, nomor: e.target.value }))}
                className="h-9 rounded-xl neu-card-elevated border border-stone-300/60 dark:border-white/10 text-xs font-mono font-bold"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">Perihal / Nama Kegiatan</Label>
              <Input
                placeholder="Tuliskan perihal atau isi singkat surat..."
                value={formData.perihal}
                onChange={(e) => setFormData((p) => ({ ...p, perihal: e.target.value }))}
                className="h-9 rounded-xl neu-card-elevated border border-stone-300/60 dark:border-white/10 text-xs font-medium"
              />
            </div>
          </div>

          <DialogFooter className="pt-2 gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              disabled={isSaving}
              onClick={() => setIsAddOpen(false)}
              className="neu-card-elevated rounded-xl text-xs h-9"
            >
              Batal
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="neu-btn-dark text-teal-400 font-bold text-xs rounded-xl h-9 px-5 gap-1.5"
            >
              {isSaving ? <Loader2 className="animate-spin h-3.5 w-3.5" /> : <Save className="h-3.5 w-3.5" />}
              <span>Simpan ke Agenda</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
