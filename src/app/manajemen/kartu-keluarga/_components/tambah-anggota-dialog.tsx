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
  updateDoc,
  serverTimestamp,
  getDocs,
  query,
  limit,
} from 'firebase/firestore';
import { Resident, Family } from '@/lib/types';
import { searchResidentsQuotaSafe } from '@/lib/residents';
import { Loader2, UserPlus, Baby, LogIn, Search, CheckCircle2 } from 'lucide-react';

interface TambahAnggotaDialogProps {
  isOpen: boolean;
  onClose: () => void;
  family: Family | null;
  mode: 'lahir' | 'masuk' | 'exist';
  onSuccess: () => void;
}

export function TambahAnggotaDialog({
  isOpen,
  onClose,
  family,
  mode,
  onSuccess,
}: TambahAnggotaDialogProps) {
  const db = useFirestore();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  // Form State untuk Mode Lahir / Masuk
  const [nik, setNik] = useState('');
  const [fullName, setFullName] = useState('');
  const [gender, setGender] = useState('Laki-laki');
  const [placeOfBirth, setPlaceOfBirth] = useState('Cilacap');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [religion, setReligion] = useState('Islam');
  const [educationLevel, setEducationLevel] = useState('Tidak / Belum Sekolah');
  const [occupation, setOccupation] = useState('Belum / Tidak Bekerja');
  const [bloodType, setBloodType] = useState('-');
  const [maritalStatus, setMaritalStatus] = useState('Belum Kawin');
  const [relationship, setRelationship] = useState('ANAK');
  const [fatherName, setFatherName] = useState('');
  const [motherName, setMotherName] = useState('');
  const [birthCertNumber, setBirthCertNumber] = useState('');

  // Form State untuk Mode Exist (Dari Penduduk Sudah Ada)
  const [allResidents, setAllResidents] = useState<Resident[]>([]);
  const [searchResidentTerm, setSearchResidentTerm] = useState('');
  const [selectedResident, setSelectedResident] = useState<Resident | null>(null);
  const [isLoadingResidents, setIsLoadingResidents] = useState(false);

  // Initialize defaults when family changes
  useEffect(() => {
    if (family) {
      if (mode === 'lahir') {
        setRelationship('ANAK');
        setEducationLevel('Tidak / Belum Sekolah');
        setOccupation('Belum / Tidak Bekerja');
        setMaritalStatus('Belum Kawin');
        setFatherName(family.kepalaKeluarga || '');
        const today = new Date().toISOString().split('T')[0];
        setDateOfBirth(today);
      } else if (mode === 'masuk') {
        setRelationship('FAMILI LAIN');
      }
    }
  }, [family, mode, isOpen]);

  // Pencarian penduduk hemat kuota hanya saat user mengetik >= 3 karakter (BUKAN tarik 50 dokumen otomatis saat modal dibuka!)
  useEffect(() => {
    if (mode !== 'exist' || !isOpen || !db) return;
    if (searchResidentTerm.trim().length < 3) {
      setAllResidents([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoadingResidents(true);
      try {
        const list = await searchResidentsQuotaSafe(db, searchResidentTerm, 10);
        const filtered = list.filter(r => r.noKk !== family?.noKk);
        setAllResidents(filtered);
      } catch (err) {
        console.error('Error searching residents:', err);
      } finally {
        setIsLoadingResidents(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [mode, isOpen, db, family?.noKk, searchResidentTerm]);

  const resetForm = () => {
    setNik('');
    setFullName('');
    setGender('Laki-laki');
    setPlaceOfBirth('Cilacap');
    setDateOfBirth('');
    setReligion('Islam');
    setEducationLevel('Tidak / Belum Sekolah');
    setOccupation('Belum / Tidak Bekerja');
    setBloodType('-');
    setMaritalStatus('Belum Kawin');
    setRelationship('ANAK');
    setFatherName('');
    setMotherName('');
    setBirthCertNumber('');
    setSelectedResident(null);
    setSearchResidentTerm('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db || !family) return;

    setLoading(true);
    try {
      if (mode === 'exist') {
        if (!selectedResident) {
          toast({
            variant: 'destructive',
            title: 'Pilih Penduduk',
            description: 'Silakan pilih penduduk yang akan dimasukkan ke KK ini.',
          });
          setLoading(false);
          return;
        }

        // Update resident's noKk and relationship
        const resDocRef = doc(db, 'residents', selectedResident.nik);
        await updateDoc(resDocRef, {
          noKk: family.noKk,
          relationshipToHeadOfFamily: relationship,
          address: family.alamat,
          dusun: family.dusun,
          rt: family.rt,
          rw: family.rw,
          updatedAt: serverTimestamp(),
        });

        toast({
          title: 'Berhasil Memasukkan Anggota',
          description: `${selectedResident.fullName} berhasil dimasukkan ke KK No. ${family.noKk}.`,
        });
      } else {
        // Mode Lahir atau Masuk
        const cleanNik = nik.trim();
        if (!cleanNik || cleanNik.length !== 16) {
          toast({
            variant: 'destructive',
            title: 'NIK Tidak Valid',
            description: 'NIK harus tepat 16 digit.',
          });
          setLoading(false);
          return;
        }

        if (!fullName.trim()) {
          toast({
            variant: 'destructive',
            title: 'Nama Lengkap Wajib',
            description: 'Silakan isi nama lengkap anggota keluarga.',
          });
          setLoading(false);
          return;
        }

        const newResidentData: Partial<Resident> = {
          nik: cleanNik,
          noKk: family.noKk,
          fullName: fullName.trim().toUpperCase(),
          gender,
          placeOfBirth: placeOfBirth.trim().toUpperCase(),
          dateOfBirth,
          religion,
          educationLevel,
          occupation: occupation.trim().toUpperCase(),
          bloodType,
          maritalStatus,
          relationshipToHeadOfFamily: relationship,
          address: family.alamat,
          dusun: family.dusun,
          rt: family.rt,
          rw: family.rw,
          kelurahan: 'SAMPELDES',
          fatherName: fatherName.trim().toUpperCase(),
          motherName: motherName.trim().toUpperCase(),
          hasBirthCertificate: birthCertNumber ? 'ADA' : 'TIDAK',
          birthCertificateNumber: birthCertNumber,
          nationality: 'WNI',
          statusDasar: 'HIDUP',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        };

        const resDocRef = doc(db, 'residents', cleanNik);
        await setDoc(resDocRef, newResidentData, { merge: true });

        toast({
          title: mode === 'lahir' ? 'Kelahiran Berhasil Dicatat' : 'Anggota Masuk Berhasil Ditambahkan',
          description: `${fullName} telah terdaftar dalam KK No. ${family.noKk}.`,
        });
      }

      handleClose();
      onSuccess();
    } catch (error: any) {
      console.error('Error adding family member:', error);
      toast({
        variant: 'destructive',
        title: 'Gagal Menambahkan Anggota',
        description: error.message || 'Terjadi kesalahan sistem.',
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredResidents = allResidents.filter(r => {
    const q = searchResidentTerm.toLowerCase();
    return (
      (r.fullName || '').toLowerCase().includes(q) ||
      (r.nik || '').includes(q) ||
      (r.noKk || '').includes(q)
    );
  }).slice(0, 15);

  const getTitle = () => {
    switch (mode) {
      case 'lahir':
        return 'Tambah Anggota Keluarga Lahir';
      case 'masuk':
        return 'Tambah Anggota Keluarga Masuk (Pindah Datang)';
      case 'exist':
        return 'Masukkan Dari Penduduk Yang Sudah Ada';
      default:
        return 'Tambah Anggota Keluarga';
    }
  };

  const getIcon = () => {
    switch (mode) {
      case 'lahir':
        return <Baby className="w-5 h-5 text-emerald-600" />;
      case 'masuk':
        return <LogIn className="w-5 h-5 text-blue-600" />;
      case 'exist':
        return <UserPlus className="w-5 h-5 text-purple-600" />;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto rounded-[24px] border border-stone-200/90 dark:border-white/10 shadow-2xl p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base sm:text-lg font-condensed font-extrabold uppercase text-slate-900 dark:text-white">
            <div className="p-1.5 rounded-xl bg-teal-50 dark:bg-teal-950/50 text-teal-700 dark:text-teal-300">
              {getIcon()}
            </div>
            <span>{getTitle()}</span>
          </DialogTitle>
          <div className="text-xs text-muted-foreground pt-1">
            Nomor KK: <span className="font-mono font-bold text-teal-700 dark:text-teal-400">{family?.noKk}</span> | Kepala Keluarga: <span className="font-bold text-slate-900 dark:text-slate-100">{family?.kepalaKeluarga}</span>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {mode === 'exist' ? (
            /* Mode 3: Dari Penduduk Sudah Ada */
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Cari Penduduk Berdasarkan NIK / Nama</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <Input
                    className="pl-9"
                    placeholder="Ketik NIK atau nama penduduk..."
                    value={searchResidentTerm}
                    onChange={(e) => setSearchResidentTerm(e.target.value)}
                  />
                </div>
              </div>

              {isLoadingResidents ? (
                <div className="py-8 flex justify-center items-center gap-2 text-sm text-slate-500">
                  <Loader2 className="h-5 w-5 animate-spin text-teal-600" />
                  Memuat data penduduk...
                </div>
              ) : (
                <div className="max-h-56 overflow-y-auto border rounded-lg divide-y bg-slate-50/50 dark:bg-slate-900/50">
                  {filteredResidents.length === 0 ? (
                    <div className="py-6 text-center text-xs text-slate-500">
                      {searchResidentTerm ? 'Penduduk tidak ditemukan.' : 'Ketik pada pencarian untuk mencari warga.'}
                    </div>
                  ) : (
                    filteredResidents.map(r => (
                      <div
                        key={r.nik}
                        onClick={() => setSelectedResident(r)}
                        className={`p-3 text-xs flex items-center justify-between cursor-pointer transition-colors ${selectedResident?.nik === r.nik
                            ? 'bg-emerald-50 dark:bg-emerald-950/40 border-l-4 border-l-emerald-500'
                            : 'hover:bg-slate-100 dark:hover:bg-slate-800'
                          }`}
                      >
                        <div>
                          <p className="font-bold text-slate-900 dark:text-slate-100">{r.fullName}</p>
                          <p className="font-mono text-slate-500">NIK: {r.nik} | KK Lama: {r.noKk || '-'}</p>
                          <p className="text-[11px] text-slate-400">{r.gender} • {r.dateOfBirth} • {r.address || r.dusun || 'Desa Sampeldes'}</p>
                        </div>
                        {selectedResident?.nik === r.nik && (
                          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}

              {selectedResident && (
                <div className="p-3 bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-lg text-xs space-y-1">
                  <p className="font-semibold text-emerald-900 dark:text-emerald-300">Warga Terpilih:</p>
                  <p className="text-slate-700 dark:text-slate-200"><span className="font-bold">{selectedResident.fullName}</span> (NIK: {selectedResident.nik})</p>
                </div>
              )}

              <div className="space-y-2">
                <Label>Hubungan Dalam Keluarga (SHDK) di KK Ini</Label>
                <Select value={relationship} onValueChange={setRelationship}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ISTRI">ISTRI</SelectItem>
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
          ) : (
            /* Mode 1 (Lahir) & Mode 2 (Masuk) */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs">NIK *</Label>
                <Input
                  maxLength={16}
                  placeholder="16 Digit NIK"
                  value={nik}
                  onChange={(e) => setNik(e.target.value.replace(/\D/g, ''))}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Nama Lengkap *</Label>
                <Input
                  placeholder="Nama Lengkap Sesuai Dokumen"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Jenis Kelamin</Label>
                <Select value={gender} onValueChange={setGender}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Laki-laki">Laki-laki</SelectItem>
                    <SelectItem value="Perempuan">Perempuan</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Hubungan Keluarga (SHDK)</Label>
                <Select value={relationship} onValueChange={setRelationship}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ANAK">ANAK</SelectItem>
                    <SelectItem value="ISTRI">ISTRI</SelectItem>
                    <SelectItem value="KEPALA KELUARGA">KEPALA KELUARGA</SelectItem>
                    <SelectItem value="MENANTU">MENANTU</SelectItem>
                    <SelectItem value="CUCU">CUCU</SelectItem>
                    <SelectItem value="ORANG TUA">ORANG TUA</SelectItem>
                    <SelectItem value="MERTUA">MERTUA</SelectItem>
                    <SelectItem value="FAMILI LAIN">FAMILI LAIN</SelectItem>
                    <SelectItem value="LAINNYA">LAINNYA</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Tempat Lahir</Label>
                <Input
                  value={placeOfBirth}
                  onChange={(e) => setPlaceOfBirth(e.target.value)}
                  placeholder="Kota / Kabupaten Lahir"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Tanggal Lahir (DD-MM-YYYY / Kalender)</Label>
                <Input
                  type="date"
                  value={dateOfBirth}
                  onChange={(e) => setDateOfBirth(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Agama</Label>
                <Select value={religion} onValueChange={setReligion}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Islam">Islam</SelectItem>
                    <SelectItem value="Kristen">Kristen</SelectItem>
                    <SelectItem value="Katolik">Katolik</SelectItem>
                    <SelectItem value="Hindu">Hindu</SelectItem>
                    <SelectItem value="Buddha">Buddha</SelectItem>
                    <SelectItem value="Konghucu">Konghucu</SelectItem>
                    <SelectItem value="Kepercayaan">Kepercayaan</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Pendidikan</Label>
                <Select value={educationLevel} onValueChange={setEducationLevel}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Tidak / Belum Sekolah">Tidak / Belum Sekolah</SelectItem>
                    <SelectItem value="Belum Tamat SD/Sederajat">Belum Tamat SD/Sederajat</SelectItem>
                    <SelectItem value="Tamat SD / Sederajat">Tamat SD / Sederajat</SelectItem>
                    <SelectItem value="SLTP / Sederajat">SLTP / Sederajat</SelectItem>
                    <SelectItem value="SLTA / Sederajat">SLTA / Sederajat</SelectItem>
                    <SelectItem value="Diploma I / II">Diploma I / II</SelectItem>
                    <SelectItem value="Akademi / Diploma III / S. Muda">Akademi / Diploma III</SelectItem>
                    <SelectItem value="Diploma IV / Strata I">Diploma IV / Strata I</SelectItem>
                    <SelectItem value="Strata II">Strata II</SelectItem>
                    <SelectItem value="Strata III">Strata III</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Jenis Pekerjaan</Label>
                <Input
                  value={occupation}
                  onChange={(e) => setOccupation(e.target.value)}
                  placeholder="Contoh: Belum / Tidak Bekerja, Petani, Wiraswasta"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Golongan Darah</Label>
                <Select value={bloodType} onValueChange={setBloodType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="-">Tidak Tahu (-)</SelectItem>
                    <SelectItem value="A">A</SelectItem>
                    <SelectItem value="B">B</SelectItem>
                    <SelectItem value="AB">AB</SelectItem>
                    <SelectItem value="O">O</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Status Perkawinan</Label>
                <Select value={maritalStatus} onValueChange={setMaritalStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Belum Kawin">Belum Kawin</SelectItem>
                    <SelectItem value="Kawin">Kawin</SelectItem>
                    <SelectItem value="Cerai Hidup">Cerai Hidup</SelectItem>
                    <SelectItem value="Cerai Mati">Cerai Mati</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Nomor Akta Kelahiran (Bila Ada)</Label>
                <Input
                  value={birthCertNumber}
                  onChange={(e) => setBirthCertNumber(e.target.value)}
                  placeholder="Nomor Akta Lahir"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Nama Ayah</Label>
                <Input
                  value={fatherName}
                  onChange={(e) => setFatherName(e.target.value)}
                  placeholder="Nama Ayah Kandung"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Nama Ibu</Label>
                <Input
                  value={motherName}
                  onChange={(e) => setMotherName(e.target.value)}
                  placeholder="Nama Ibu Kandung"
                />
              </div>
            </div>
          )}

          <DialogFooter className="pt-4 border-t border-stone-200/70 dark:border-white/10 gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={handleClose} disabled={loading} className="rounded-xl text-xs font-semibold">
              Batal
            </Button>
            <Button
              type="submit"
              disabled={loading || (mode === 'exist' && !selectedResident)}
              className="h-10 px-5 rounded-xl text-xs font-black bg-[#d4e157] text-slate-950 hover:bg-[#c2cf38] uppercase tracking-wider border border-black/10 shadow-xs"
            >
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Simpan Anggota
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
