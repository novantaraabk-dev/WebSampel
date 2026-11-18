'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
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
import {
  Plus,
  ArrowLeft,
  FileText,
  Link2,
  X,
  Loader2,
  Baby,
  LogIn,
  UserPlus,
  Users,
  Copy,
  Check,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { Family, Resident } from '@/lib/types';
import { useFirestore } from '@/firebase';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { PageHeader } from '@/components/page-header';
import { TambahAnggotaDialog } from './tambah-anggota-dialog';

interface DaftarAnggotaKeluargaProps {
  family: Family;
  members: Resident[];
  onBackToFamilyList: () => void;
  onOpenSalinanKk: () => void;
  onReload: () => void;
}

export function DaftarAnggotaKeluarga({
  family,
  members,
  onBackToFamilyList,
  onOpenSalinanKk,
  onReload,
}: DaftarAnggotaKeluargaProps) {
  const db = useFirestore();
  const { toast } = useToast();

  const [tambahMode, setTambahMode] = useState<'lahir' | 'masuk' | 'exist' | null>(null);
  const [isTambahOpen, setIsTambahOpen] = useState(false);

  // Edit SHDK Dialog State
  const [shdkTargetResident, setShdkTargetResident] = useState<Resident | null>(null);
  const [selectedShdk, setSelectedShdk] = useState('');
  const [isUpdatingShdk, setIsUpdatingShdk] = useState(false);

  // Delete from KK Confirmation State
  const [deleteTargetResident, setDeleteTargetResident] = useState<Resident | null>(null);
  const [isRemoving, setIsRemoving] = useState(false);

  const [copiedKk, setCopiedKk] = useState(false);

  const handleCopyKk = () => {
    navigator.clipboard.writeText(family.noKk);
    setCopiedKk(true);
    toast({ title: 'Disalin ke Clipboard', description: `Nomor KK ${family.noKk} berhasil disalin.` });
    setTimeout(() => setCopiedKk(false), 2000);
  };

  const openTambah = (mode: 'lahir' | 'masuk' | 'exist') => {
    setTambahMode(mode);
    setIsTambahOpen(true);
  };

  const handleUpdateShdk = async () => {
    if (!db || !shdkTargetResident || !selectedShdk) return;
    setIsUpdatingShdk(true);
    try {
      await updateDoc(doc(db, 'residents', shdkTargetResident.nik), {
        relationshipToHeadOfFamily: selectedShdk,
        updatedAt: serverTimestamp(),
      });

      // Jika diubah menjadi KEPALA KELUARGA, update kepala keluarga di dokumen families
      if (selectedShdk === 'KEPALA KELUARGA') {
        await updateDoc(doc(db, 'families', family.noKk), {
          kepalaKeluarga: shdkTargetResident.fullName,
          nikKepala: shdkTargetResident.nik,
          genderKepala: shdkTargetResident.gender,
          updatedAt: serverTimestamp(),
        });
      }

      toast({
        title: 'Hubungan Keluarga Diperbarui',
        description: `Status ${shdkTargetResident.fullName} diubah menjadi ${selectedShdk}.`,
      });

      setShdkTargetResident(null);
      onReload();
    } catch (e: any) {
      console.error(e);
      toast({ variant: 'destructive', title: 'Gagal Mengubah SHDK', description: e.message });
    } finally {
      setIsUpdatingShdk(false);
    }
  };

  const handleRemoveFromKk = async () => {
    if (!db || !deleteTargetResident) return;
    setIsRemoving(true);
    try {
      // Lepaskan noKk dari penduduk ini
      await updateDoc(doc(db, 'residents', deleteTargetResident.nik), {
        noKk: '',
        relationshipToHeadOfFamily: '',
        updatedAt: serverTimestamp(),
      });

      toast({
        title: 'Anggota Dikeluarkan dari KK',
        description: `${deleteTargetResident.fullName} telah dilepaskan dari nomor KK ${family.noKk}.`,
      });

      setDeleteTargetResident(null);
      onReload();
    } catch (e: any) {
      console.error(e);
      toast({ variant: 'destructive', title: 'Gagal Mengeluarkan Anggota', description: e.message });
    } finally {
      setIsRemoving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Terpadu Sistem */}
      <PageHeader
        title="Daftar Anggota Keluarga"
        description={`Pengelolaan komposisi anggota keluarga untuk Kartu Keluarga No. ${family.noKk} dengan Kepala Keluarga ${family.kepalaKeluarga}.`}
      >
        <div className="flex flex-wrap items-center gap-2">
          <Button
            onClick={onOpenSalinanKk}
            className="h-10 px-4 rounded-xl text-xs font-black bg-[#d4e157] text-slate-950 hover:bg-[#c2cf38] uppercase tracking-wider border border-black/10 shadow-xs transition-all active:scale-95 gap-1.5"
          >
            <FileText className="w-4 h-4 text-slate-950" />
            <span>Salinan Blangko KK</span>
          </Button>

          <Button
            onClick={onBackToFamilyList}
            variant="outline"
            className="h-10 px-3.5 rounded-xl text-xs font-bold border-stone-300 text-slate-700 hover:text-slate-950 dark:border-white/20 dark:text-slate-200 gap-1.5"
          >
            <ArrowLeft className="w-4 h-4 text-slate-600" />
            <span>Kembali Ke Master KK</span>
          </Button>
        </div>
      </PageHeader>

      {/* 2. Panel Rincian Keluarga */}
      <div className="neu-dashboard-card rounded-[24px] p-5 sm:p-6 border border-white/80 dark:border-white/10 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-stone-200/70 dark:border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-teal-50 dark:bg-teal-950/50 text-teal-700 dark:text-teal-300 border border-teal-200/50">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-condensed font-extrabold uppercase text-slate-900 dark:text-white tracking-tight">
                Rincian Kartu Keluarga
              </h2>
              <p className="text-[11px] text-slate-400">Informasi kepala keluarga dan alamat domisili terdaftar</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200">
              {family.statusKk || 'KK Aktif'}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          <div className="p-3.5 rounded-2xl bg-white/60 dark:bg-slate-900/60 border border-stone-200/70 dark:border-white/5 space-y-1">
            <span className="text-slate-400 font-medium text-[11px] uppercase tracking-wider">Nomor KK</span>
            <div className="flex items-center justify-between">
              <span className="font-mono font-bold text-sm text-teal-800 dark:text-teal-300">{family.noKk}</span>
              <button
                onClick={handleCopyKk}
                className="p-1 rounded-md hover:bg-stone-100 text-slate-500 hover:text-slate-800"
                title="Salin No. KK"
              >
                {copiedKk ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-white/60 dark:bg-slate-900/60 border border-stone-200/70 dark:border-white/5 space-y-1">
            <span className="text-slate-400 font-medium text-[11px] uppercase tracking-wider">Kepala Keluarga</span>
            <div className="font-bold text-sm text-slate-900 dark:text-slate-100 uppercase truncate">
              {family.kepalaKeluarga}
            </div>
            <p className="font-mono text-[11px] text-slate-500">NIK: {family.nikKepala || '-'}</p>
          </div>

          <div className="p-3.5 rounded-2xl bg-white/60 dark:bg-slate-900/60 border border-stone-200/70 dark:border-white/5 space-y-1">
            <span className="text-slate-400 font-medium text-[11px] uppercase tracking-wider">Alamat / Dusun</span>
            <div className="font-semibold text-slate-800 dark:text-slate-200 uppercase truncate">
              {family.alamat || `Dusun ${family.dusun || 'SAMPELDES'}`}
            </div>
            <p className="font-mono text-[11px] text-slate-500">RT {family.rt || '001'} / RW {family.rw || '001'}</p>
          </div>

          <div className="p-3.5 rounded-2xl bg-white/60 dark:bg-slate-900/60 border border-stone-200/70 dark:border-white/5 space-y-1">
            <span className="text-slate-400 font-medium text-[11px] uppercase tracking-wider">Total Anggota</span>
            <div className="text-base font-extrabold text-slate-900 dark:text-white font-condensed">
              {members.length} Orang Terdaftar
            </div>
            <p className="text-[11px] text-slate-500">Program Bantuan: {family.programBantuan || '-'}</p>
          </div>
        </div>
      </div>

      {/* 3. Toolbar Aksi Tambah Anggota */}
      <div className="neu-dashboard-card rounded-[22px] p-3.5 sm:p-4 border border-white/80 dark:border-white/10 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="h-10 px-4 rounded-xl text-xs font-black bg-[#d4e157] text-slate-950 hover:bg-[#c2cf38] uppercase tracking-wider border border-black/10 shadow-xs gap-1.5 transition-all active:scale-95">
                <Plus className="w-4 h-4" />
                <span>Tambah Anggota Baru</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-60 text-xs rounded-xl p-1.5">
              <DropdownMenuItem onClick={() => openTambah('lahir')} className="cursor-pointer gap-2.5 py-2.5 rounded-lg">
                <div className="p-1 rounded-md bg-emerald-50 text-emerald-600">
                  <Baby className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-bold">Kelahiran Baru</p>
                  <p className="text-[10px] text-slate-400">Tambah bayi baru lahir ke dalam KK</p>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => openTambah('masuk')} className="cursor-pointer gap-2.5 py-2.5 rounded-lg">
                <div className="p-1 rounded-md bg-blue-50 text-blue-600">
                  <LogIn className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-bold">Warga Pindah Masuk</p>
                  <p className="text-[10px] text-slate-400">Pindahan dari luar desa/daerah</p>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => openTambah('exist')} className="cursor-pointer gap-2.5 py-2.5 rounded-lg">
                <div className="p-1 rounded-md bg-purple-50 text-purple-600">
                  <UserPlus className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-bold">Dari Penduduk Terdaftar</p>
                  <p className="text-[10px] text-slate-400">Pilih dari database warga Sampeldes</p>
                </div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            onClick={onReload}
            variant="outline"
            className="h-10 px-3.5 rounded-xl text-xs font-bold border-stone-300 text-slate-700 hover:text-slate-950 dark:border-white/20 dark:text-slate-200 gap-1.5"
            title="Muat ulang anggota keluarga dari database"
          >
            <RotateCcw className="w-4 h-4 text-teal-600" />
            <span>Muat Ulang</span>
          </Button>
        </div>

        <div className="text-xs text-slate-500 font-medium">
          Menampilkan <span className="font-bold text-slate-800 dark:text-slate-200">{members.length}</span> anggota keluarga
        </div>
      </div>

      {/* 4. Tabel Daftar Anggota Keluarga */}
      <div className="neu-dashboard-card rounded-[24px] border border-white/80 dark:border-white/10 overflow-hidden shadow-xs">
        <div className="p-4 sm:p-5 border-b border-stone-200/70 dark:border-white/10 flex items-center justify-between">
          <h2 className="text-sm sm:text-base font-condensed font-extrabold uppercase text-slate-900 dark:text-white tracking-tight">
            Daftar Susunan Anggota Keluarga ({members.length} Jiwa)
          </h2>
          <span className="text-[11px] text-slate-400 font-medium">Urutan resmi sesuai standar Dukcapil</span>
        </div>

        <div className="overflow-x-auto">
          <Table className="text-xs">
            <TableHeader className="bg-stone-100/90 dark:bg-slate-800/90 text-slate-700 dark:text-slate-200">
              <TableRow className="border-b border-stone-200 dark:border-slate-700">
                <TableHead className="w-12 text-center py-3.5 font-condensed font-bold uppercase tracking-wider">NO</TableHead>
                <TableHead className="w-24 text-center font-condensed font-bold uppercase tracking-wider">AKSI</TableHead>
                <TableHead className="w-36 font-condensed font-bold uppercase tracking-wider">NIK</TableHead>
                <TableHead className="font-condensed font-bold uppercase tracking-wider">NAMA LENGKAP</TableHead>
                <TableHead className="font-condensed font-bold uppercase tracking-wider">JENIS KELAMIN</TableHead>
                <TableHead className="font-condensed font-bold uppercase tracking-wider">TEMPAT / TGL LAHIR</TableHead>
                <TableHead className="font-condensed font-bold uppercase tracking-wider">HUBUNGAN (SHDK)</TableHead>
                <TableHead className="font-condensed font-bold uppercase tracking-wider">AGAMA</TableHead>
                <TableHead className="font-condensed font-bold uppercase tracking-wider">PENDIDIKAN</TableHead>
                <TableHead className="font-condensed font-bold uppercase tracking-wider">PEKERJAAN</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-16 text-slate-500">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Users className="w-8 h-8 text-slate-300" />
                      <p className="text-xs font-semibold">Belum ada anggota keluarga dalam KK ini</p>
                      <p className="text-[11px] text-slate-400">Klik tombol <span className="font-bold text-teal-600">+ Tambah Anggota Baru</span> di atas.</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                members.map((m, idx) => {
                  const shdk = (m.relationshipToHeadOfFamily || '').toUpperCase().trim();
                  const isKepala = shdk === 'KEPALA KELUARGA';
                  const isIstri = shdk === 'ISTRI' || shdk === 'SUAMI';
                  const isAnak = shdk === 'ANAK';

                  return (
                    <TableRow 
                      key={m.nik || idx} 
                      className={`hover:bg-amber-50/40 dark:hover:bg-slate-800/40 border-b border-stone-200/60 dark:border-slate-800/60 transition-colors ${
                        isKepala ? 'bg-teal-50/40 dark:bg-teal-950/20' : ''
                      }`}
                    >
                      <TableCell className="text-center font-mono font-medium text-slate-500 py-3">
                        {idx + 1}
                      </TableCell>

                      {/* Tombol Aksi Anggota */}
                      <TableCell className="py-3">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Ubah SHDK Button */}
                          <Button
                            size="icon"
                            variant="ghost"
                            title="Ubah Hubungan Keluarga (SHDK)"
                            onClick={() => {
                              setShdkTargetResident(m);
                              setSelectedShdk(m.relationshipToHeadOfFamily || 'ANAK');
                            }}
                            className="h-8 w-8 rounded-xl bg-slate-800 hover:bg-slate-900 text-white shadow-xs transition-transform active:scale-95"
                          >
                            <Link2 className="h-3.5 w-3.5" />
                          </Button>

                          {/* Hapus dari KK Button */}
                          <Button
                            size="icon"
                            variant="ghost"
                            title="Keluarkan dari Kartu Keluarga"
                            onClick={() => setDeleteTargetResident(m)}
                            className="h-8 w-8 rounded-xl bg-rose-600 hover:bg-rose-700 text-white shadow-xs transition-transform active:scale-95"
                          >
                            <X className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>

                      {/* NIK */}
                      <TableCell className="font-mono font-bold text-teal-800 dark:text-teal-400 py-3">
                        {m.nik}
                      </TableCell>

                      {/* Nama Lengkap */}
                      <TableCell className="font-bold uppercase text-slate-900 dark:text-slate-100 py-3">
                        {m.fullName}
                      </TableCell>

                      {/* Jenis Kelamin */}
                      <TableCell className="uppercase py-3">
                        {m.gender || '-'}
                      </TableCell>

                      {/* Tempat / Tanggal Lahir */}
                      <TableCell className="uppercase py-3 text-slate-700 dark:text-slate-300">
                        {m.placeOfBirth ? `${m.placeOfBirth}, ` : ''}{m.dateOfBirth || '-'}
                      </TableCell>

                      {/* SHDK Pill Badge */}
                      <TableCell className="py-3">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-black tracking-wide uppercase ${
                          isKepala
                            ? 'bg-[#d4e157] text-slate-950 border border-black/10 shadow-xs'
                            : isIstri
                            ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200'
                            : isAnak
                            ? 'bg-sky-100 text-sky-800 dark:bg-sky-950/60 dark:text-sky-300 border border-sky-200'
                            : 'bg-stone-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-stone-200'
                        }`}>
                          {m.relationshipToHeadOfFamily || '-'}
                        </span>
                      </TableCell>

                      {/* Agama, Pendidikan, Pekerjaan */}
                      <TableCell className="uppercase py-3">{m.religion || '-'}</TableCell>
                      <TableCell className="uppercase py-3 max-w-[120px] truncate">{m.educationLevel || '-'}</TableCell>
                      <TableCell className="uppercase py-3 max-w-[120px] truncate">{m.occupation || '-'}</TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Dialog Tambah Anggota */}
      {tambahMode && (
        <TambahAnggotaDialog
          isOpen={isTambahOpen}
          onClose={() => {
            setIsTambahOpen(false);
            setTambahMode(null);
          }}
          family={family}
          mode={tambahMode}
          onSuccess={onReload}
        />
      )}

      {/* Dialog Ubah Hubungan (SHDK) */}
      <Dialog open={!!shdkTargetResident} onOpenChange={(open) => !open && setShdkTargetResident(null)}>
        <DialogContent className="max-w-md rounded-[24px] border border-stone-200/90 dark:border-white/10 shadow-2xl p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-condensed font-extrabold uppercase tracking-tight text-slate-900 dark:text-white">
              Ubah Hubungan Keluarga (SHDK)
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2 text-xs">
            <div className="p-3.5 rounded-2xl bg-stone-50 dark:bg-slate-900 border border-stone-200/70 dark:border-white/5">
              <p className="text-[11px] text-slate-400 font-medium uppercase">Anggota yang Dipilih:</p>
              <p className="font-bold text-sm text-slate-900 dark:text-slate-100 uppercase mt-0.5">{shdkTargetResident?.fullName}</p>
              <p className="font-mono text-slate-500 mt-0.5">NIK: {shdkTargetResident?.nik}</p>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Pilih Hubungan Dalam Keluarga (SHDK Dukcapil)
              </Label>
              <Select value={selectedShdk} onValueChange={setSelectedShdk}>
                <SelectTrigger className="h-10 rounded-xl text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="text-xs rounded-xl">
                  <SelectItem value="KEPALA KELUARGA">KEPALA KELUARGA</SelectItem>
                  <SelectItem value="ISTRI">ISTRI</SelectItem>
                  <SelectItem value="SUAMI">SUAMI</SelectItem>
                  <SelectItem value="ANAK">ANAK</SelectItem>
                  <SelectItem value="MENANTU">MENANTU</SelectItem>
                  <SelectItem value="CUCU">CUCU</SelectItem>
                  <SelectItem value="ORANG TUA">ORANG TUA</SelectItem>
                  <SelectItem value="MERTUA">MERTUA</SelectItem>
                  <SelectItem value="FAMILI LAIN">FAMILI LAIN</SelectItem>
                  <SelectItem value="PEMBANTU">PEMBANTU</SelectItem>
                  <SelectItem value="LAINNYA">LAINNYA</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" size="sm" onClick={() => setShdkTargetResident(null)} className="rounded-xl">
              Batal
            </Button>
            <Button 
              size="sm" 
              onClick={handleUpdateShdk} 
              disabled={isUpdatingShdk} 
              className="h-9 px-4 rounded-xl text-xs font-black bg-[#d4e157] text-slate-950 hover:bg-[#c2cf38] uppercase tracking-wider border border-black/10 shadow-xs"
            >
              {isUpdatingShdk && <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />}
              Simpan SHDK
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Alert Dialog Keluarkan dari KK */}
      <AlertDialog open={!!deleteTargetResident} onOpenChange={(open) => !open && setDeleteTargetResident(null)}>
        <AlertDialogContent className="rounded-[24px] border border-stone-200/90 dark:border-white/10 shadow-2xl p-6">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg font-condensed font-extrabold uppercase text-rose-600">
              Keluarkan Anggota dari Kartu Keluarga?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs space-y-2 text-slate-600 dark:text-slate-300">
              <p>
                Apakah Anda yakin ingin mengeluarkan <span className="font-bold text-slate-900 dark:text-slate-100">{deleteTargetResident?.fullName}</span> (NIK: {deleteTargetResident?.nik}) dari Nomor KK <span className="font-mono font-bold text-slate-900 dark:text-slate-100">{family.noKk}</span>?
              </p>
              <p className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-900/40">
                Data penduduk ini tidak akan dihapus dari sistem desa, melainkan hanya dilepaskan dari ikatan Kartu Keluarga ini.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-0">
            <AlertDialogCancel disabled={isRemoving} className="rounded-xl text-xs font-semibold">Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemoveFromKk}
              disabled={isRemoving}
              className="rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-xs"
            >
              {isRemoving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Ya, Keluarkan
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
