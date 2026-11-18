'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useFirestore } from '@/firebase';
import {
  collection,
  doc,
  setDoc,
  serverTimestamp,
  getDocs,
  query,
  limit,
} from 'firebase/firestore';
import { Resident, Family } from '@/lib/types';
import { searchResidentsQuotaSafe } from '@/lib/residents';
import { Loader2, PlusCircle, Search } from 'lucide-react';

interface TambahKkDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  existingFamily?: Family | null; // Jika mode Edit
}

export function TambahKkDialog({
  isOpen,
  onClose,
  onSuccess,
  existingFamily,
}: TambahKkDialogProps) {
  const db = useFirestore();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const [noKk, setNoKk] = useState('');
  const [kepalaKeluarga, setKepalaKeluarga] = useState('');
  const [nikKepala, setNikKepala] = useState('');
  const [genderKepala, setGenderKepala] = useState('Laki-laki');
  const [alamat, setAlamat] = useState('');
  const [dusun, setDusun] = useState('SAMPELDES');
  const [rt, setRt] = useState('001');
  const [rw, setRw] = useState('001');
  const [statusKk, setStatusKk] = useState<'KK Aktif' | 'KK Hilang/Pindah/Mati' | 'KK Kosong' | 'No. KK Sementara'>('KK Aktif');
  const [tagIdCard, setTagIdCard] = useState('');
  const [programBantuan, setProgramBantuan] = useState('-');

  // Mode pemilihan kepala keluarga
  const [kadesMode, setKadesMode] = useState<'select' | 'manual'>('manual');
  const [residents, setResidents] = useState<Resident[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (existingFamily) {
      setNoKk(existingFamily.noKk || '');
      setKepalaKeluarga(existingFamily.kepalaKeluarga || '');
      setNikKepala(existingFamily.nikKepala || '');
      setGenderKepala(existingFamily.genderKepala || 'Laki-laki');
      setAlamat(existingFamily.alamat || '');
      setDusun(existingFamily.dusun || 'SAMPELDES');
      setRt(existingFamily.rt || '001');
      setRw(existingFamily.rw || '001');
      setStatusKk(existingFamily.statusKk || 'KK Aktif');
      setTagIdCard(existingFamily.tagIdCard || '');
      setProgramBantuan(existingFamily.programBantuan || '-');
      setKadesMode('manual');
    } else {
      setNoKk('');
      setKepalaKeluarga('');
      setNikKepala('');
      setGenderKepala('Laki-laki');
      setAlamat('DUSUN SAMPELDES');
      setDusun('SAMPELDES');
      setRt('001');
      setRw('001');
      setStatusKk('KK Aktif');
      setTagIdCard('');
      setProgramBantuan('-');
      setKadesMode('manual');
    }
  }, [existingFamily, isOpen]);

  // Cari penduduk secara on-demand saat diketik >= 3 huruf/angka (Hemat Kuota, BUKAN tarik 50 dokumen saat dibuka!)
  useEffect(() => {
    if (!isOpen || kadesMode !== 'select' || !db) return;
    if (searchQuery.trim().length < 3) {
      setResidents([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const res = await searchResidentsQuotaSafe(db, searchQuery, 10);
        setResidents(res);
      } catch (e) {
        console.error(e);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [isOpen, kadesMode, db, searchQuery]);

  const handleSelectResident = (r: Resident) => {
    setKepalaKeluarga(r.fullName || '');
    setNikKepala(r.nik || '');
    setGenderKepala(r.gender || 'Laki-laki');
    if (r.address) setAlamat(r.address);
    if (r.rt) setRt(r.rt);
    if (r.rw) setRw(r.rw);
    if (r.dusun) setDusun(r.dusun);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db) return;

    const cleanKk = noKk.trim();
    if (!cleanKk || cleanKk.length !== 16) {
      toast({
        variant: 'destructive',
        title: 'Nomor KK Tidak Valid',
        description: 'Nomor Kartu Keluarga harus 16 digit angka.',
      });
      return;
    }

    if (!kepalaKeluarga.trim()) {
      toast({
        variant: 'destructive',
        title: 'Kepala Keluarga Wajib Diisi',
        description: 'Silakan isi nama Kepala Keluarga.',
      });
      return;
    }

    setLoading(true);
    try {
      const familyPayload = {
        noKk: cleanKk,
        kepalaKeluarga: kepalaKeluarga.trim().toUpperCase(),
        nikKepala: nikKepala.trim(),
        genderKepala,
        alamat: alamat.trim().toUpperCase(),
        dusun: dusun.trim().toUpperCase(),
        rt: rt.trim().padStart(3, '0'),
        rw: rw.trim().padStart(3, '0'),
        statusKk,
        tagIdCard: tagIdCard.trim(),
        programBantuan: programBantuan.trim(),
        tanggalTerdaftar: existingFamily?.tanggalTerdaftar || new Date().toISOString().split('T')[0],
        updatedAt: serverTimestamp(),
      };

      // 1. Simpan ke koleksi families
      await setDoc(doc(db, 'families', cleanKk), familyPayload, { merge: true });

      // 2. Jika ada NIK kepala keluarga, sinkronkan atau buat dokumen resident
      if (nikKepala.trim().length === 16) {
        const cleanNik = nikKepala.trim();
        await setDoc(
          doc(db, 'residents', cleanNik),
          {
            nik: cleanNik,
            noKk: cleanKk,
            fullName: kepalaKeluarga.trim().toUpperCase(),
            gender: genderKepala,
            address: alamat.trim().toUpperCase(),
            dusun: dusun.trim().toUpperCase(),
            rt: rt.trim().padStart(3, '0'),
            rw: rw.trim().padStart(3, '0'),
            kelurahan: 'SAMPELDES',
            relationshipToHeadOfFamily: 'KEPALA KELUARGA',
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        );
      }

      toast({
        title: existingFamily ? 'Data KK Diperbarui' : 'KK Baru Berhasil Dibuat',
        description: `Kartu Keluarga No. ${cleanKk} telah tersimpan.`,
      });

      onClose();
      onSuccess();
    } catch (error: any) {
      console.error('Error saving family:', error);
      toast({
        variant: 'destructive',
        title: 'Gagal Menyimpan Data KK',
        description: error.message || 'Terjadi kesalahan sistem.',
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredResidents = residents.filter(r =>
    (r.fullName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (r.nik || '').includes(searchQuery)
  ).slice(0, 10);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-[24px] border border-stone-200/90 dark:border-white/10 shadow-2xl p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base sm:text-lg font-condensed font-extrabold uppercase text-slate-900 dark:text-white">
            <div className="p-1.5 rounded-xl bg-teal-50 dark:bg-teal-950/50 text-teal-700 dark:text-teal-300">
              <PlusCircle className="w-5 h-5 text-teal-600" />
            </div>
            <span>{existingFamily ? 'Ubah Data Kartu Keluarga' : 'Tambah Kartu Keluarga Baru'}</span>
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5 sm:col-span-2">
              <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Nomor Kartu Keluarga (16 Digit) *</Label>
              <Input
                maxLength={16}
                placeholder="Contoh: 3301091601057663"
                value={noKk}
                onChange={(e) => setNoKk(e.target.value.replace(/\D/g, ''))}
                className="h-10 rounded-xl text-xs border-stone-300/80 font-mono"
                required
              />
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs">Kepala Keluarga *</Label>
                <div className="text-[11px] text-muted-foreground flex gap-2">
                  <button
                    type="button"
                    onClick={() => setKadesMode('manual')}
                    className={`underline cursor-pointer ${kadesMode === 'manual' ? 'font-bold text-teal-600' : ''}`}
                  >
                    Input Manual
                  </button>
                  <span>•</span>
                  <button
                    type="button"
                    onClick={() => setKadesMode('select')}
                    className={`underline cursor-pointer ${kadesMode === 'select' ? 'font-bold text-teal-600' : ''}`}
                  >
                    Pilih Dari Penduduk
                  </button>
                </div>
              </div>

              {kadesMode === 'select' ? (
                <div className="space-y-2 border p-3 rounded-lg bg-slate-50 dark:bg-slate-900">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
                    <Input
                      className="pl-8 text-xs h-8"
                      placeholder="Ketik NIK atau nama untuk mencari..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <div className="max-h-36 overflow-y-auto divide-y text-xs">
                    {filteredResidents.map(r => (
                      <div
                        key={r.nik}
                        onClick={() => handleSelectResident(r)}
                        className={`p-1.5 cursor-pointer rounded hover:bg-slate-200 dark:hover:bg-slate-800 ${
                          nikKepala === r.nik ? 'bg-teal-50 dark:bg-teal-950/40 font-bold text-teal-700' : ''
                        }`}
                      >
                        {r.fullName} ({r.nik})
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              <Input
                placeholder="Nama Lengkap Kepala Keluarga"
                value={kepalaKeluarga}
                onChange={(e) => setKepalaKeluarga(e.target.value)}
                className="h-10 rounded-xl text-xs border-stone-300/80"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">NIK Kepala Keluarga</Label>
              <Input
                maxLength={16}
                placeholder="16 Digit NIK Kepala Keluarga"
                value={nikKepala}
                onChange={(e) => setNikKepala(e.target.value.replace(/\D/g, ''))}
                className="h-10 rounded-xl text-xs border-stone-300/80 font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Jenis Kelamin Kepala</Label>
              <Select value={genderKepala} onValueChange={setGenderKepala}>
                <SelectTrigger className="h-10 rounded-xl text-xs border-stone-300/80">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="text-xs rounded-xl">
                  <SelectItem value="Laki-laki">Laki-laki</SelectItem>
                  <SelectItem value="Perempuan">Perempuan</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Alamat Domisili</Label>
              <Input
                placeholder="Contoh: DUSUN SAMPELDES RT 006 / RW 006"
                value={alamat}
                onChange={(e) => setAlamat(e.target.value)}
                className="h-10 rounded-xl text-xs border-stone-300/80"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Dusun</Label>
              <Input
                placeholder="SAMPELDES"
                value={dusun}
                onChange={(e) => setDusun(e.target.value)}
                className="h-10 rounded-xl text-xs border-stone-300/80 uppercase"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">RT</Label>
                <Input
                  maxLength={3}
                  placeholder="001"
                  value={rt}
                  onChange={(e) => setRt(e.target.value)}
                  className="h-10 rounded-xl text-xs border-stone-300/80 font-mono"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">RW</Label>
                <Input
                  maxLength={3}
                  placeholder="001"
                  value={rw}
                  onChange={(e) => setRw(e.target.value)}
                  className="h-10 rounded-xl text-xs border-stone-300/80 font-mono"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Status Kartu Keluarga</Label>
              <Select value={statusKk} onValueChange={(val: any) => setStatusKk(val)}>
                <SelectTrigger className="h-10 rounded-xl text-xs border-stone-300/80">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="text-xs rounded-xl">
                  <SelectItem value="KK Aktif">KK Aktif</SelectItem>
                  <SelectItem value="KK Hilang/Pindah/Mati">KK Hilang/Pindah/Mati</SelectItem>
                  <SelectItem value="KK Kosong">KK Kosong</SelectItem>
                  <SelectItem value="No. KK Sementara">No. KK Sementara</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Program Bantuan (Opsional)</Label>
              <Input
                placeholder="Contoh: PKH, BPNT, BLT-DD, atau -"
                value={programBantuan}
                onChange={(e) => setProgramBantuan(e.target.value)}
                className="h-10 rounded-xl text-xs border-stone-300/80"
              />
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Tag ID Card / RFID (Bila Ada)</Label>
              <Input
                placeholder="Nomor kartu fisik jika menggunakan RFID"
                value={tagIdCard}
                onChange={(e) => setTagIdCard(e.target.value)}
                className="h-10 rounded-xl text-xs border-stone-300/80"
              />
            </div>
          </div>

          <DialogFooter className="pt-4 border-t border-stone-200/70 dark:border-white/10 gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading} className="rounded-xl text-xs font-semibold">
              Batal
            </Button>
            <Button 
              type="submit" 
              disabled={loading} 
              className="h-10 px-5 rounded-xl text-xs font-black bg-[#d4e157] text-slate-950 hover:bg-[#c2cf38] uppercase tracking-wider border border-black/10 shadow-xs"
            >
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {existingFamily ? 'Simpan Perubahan' : 'Buat KK Baru'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
