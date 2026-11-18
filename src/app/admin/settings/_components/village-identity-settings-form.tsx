'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
  Loader2,
  Save,
  Landmark,
  UserCheck,
  Shield,
  MapPin,
  RotateCcw,
  Building2,
} from 'lucide-react';
import { setDoc, serverTimestamp } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DEFAULT_VILLAGE_IDENTITY,
  setCachedVillageIdentity,
  useVillageIdentity,
  type VillageIdentityInfo,
} from '@/lib/village-identity';

export function VillageIdentitySettingsForm() {
  const { identity, isLoading, docRef } = useVillageIdentity();
  const [formState, setFormState] = useState<VillageIdentityInfo>(DEFAULT_VILLAGE_IDENTITY);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (identity) {
      setFormState(identity);
    }
  }, [identity]);

  const handleChange = (field: keyof VillageIdentityInfo, value: string) => {
    setFormState((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleResetDefault = () => {
    setFormState(DEFAULT_VILLAGE_IDENTITY);
    toast({
      title: 'Direset ke Default',
      description: 'Klik "Simpan Identitas Desa" untuk menerapkan nilai bawaan ke sistem.',
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!docRef) return;
    setIsSaving(true);
    try {
      const payload = {
        ...formState,
        updatedAt: serverTimestamp(),
      };
      await setDoc(docRef, payload, { merge: true });
      setCachedVillageIdentity(formState);
      toast({
        title: 'Identitas Desa Berhasil Disimpan',
        description:
          'Seluruh tampilan umum website, surat pengantar, dan lampiran surat telah disinkronkan dengan identitas terbaru.',
      });
    } catch (error: any) {
      console.error('Error saving village identity:', error);
      toast({
        title: 'Gagal Menyimpan Identitas Desa',
        description: error?.message || 'Terjadi kesalahan saat menyimpan ke Firestore.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <Card className="border border-stone-200/90 rounded-[1.6rem] overflow-hidden shadow-xs bg-white">
        <CardHeader className="p-5 border-b border-stone-200 bg-stone-50">
          <Skeleton className="h-6 w-64" />
          <Skeleton className="h-4 w-96 mt-1" />
        </CardHeader>
        <CardContent className="p-5 space-y-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border border-stone-200/90 rounded-[1.6rem] overflow-hidden shadow-xs bg-white">
      <CardHeader className="p-4 sm:p-6 border-b border-stone-200 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Landmark className="h-5 w-5 text-[#d4e157]" />
              <CardTitle className="text-base sm:text-lg font-condensed font-extrabold uppercase tracking-tight text-white">
                Identitas Desa, Pemerintahan &amp; Pejabat Wilayah (Master Konfigurasi)
              </CardTitle>
            </div>
            <CardDescription className="text-[11px] sm:text-xs text-slate-300">
              Pusat konfigurasi Nama Desa, Alamat, Kepala Desa, Sekretaris Desa, Kecamatan, Camat, Danramil, Kapolsek, Kabupaten &amp; Provinsi. Perubahan di sini otomatis memperbarui tampilan umum website, hasil cetak surat pengantar, dan seluruh lampiran surat.
            </CardDescription>
          </div>
          <Badge className="bg-[#d4e157] text-slate-950 hover:bg-[#d4e157] font-black text-[10px] uppercase tracking-wider px-3 py-1">
            Sinkron Otomatis ke Web &amp; Cetak Surat
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="p-4 sm:p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 1. IDENTITAS PEMERINTAHAN DESA */}
          <div className="rounded-2xl border border-stone-200 p-4 sm:p-5 bg-stone-50/50 space-y-4">
            <div className="flex items-center gap-2 border-b border-stone-200 pb-2.5">
              <Building2 className="h-4 w-4 text-emerald-700" />
              <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider text-slate-800">
                1. Identitas &amp; Kontak Resmi Pemerintah Desa
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700">Nama Desa *</Label>
                <Input
                  value={formState.namaDesa}
                  onChange={(e) => handleChange('namaDesa', e.target.value)}
                  placeholder="Sampeldes"
                  required
                  className="bg-white font-semibold"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700">Sebutan Wilayah Desa</Label>
                <Input
                  value={formState.sebutanDesa}
                  onChange={(e) => handleChange('sebutanDesa', e.target.value)}
                  placeholder="Desa / Kelurahan"
                  className="bg-white"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700">Kode Wilayah Desa (Kemendagri)</Label>
                <Input
                  value={formState.kodeDesa}
                  onChange={(e) => handleChange('kodeDesa', e.target.value)}
                  placeholder="33.01.10.2011"
                  className="bg-white font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700">Kode Urut Desa (Format Nomor Surat)</Label>
                <Input
                  value={formState.kodeSuratDesa}
                  onChange={(e) => handleChange('kodeSuratDesa', e.target.value)}
                  placeholder="11"
                  className="bg-white font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700">Kode Pos</Label>
                <Input
                  value={formState.kodePos}
                  onChange={(e) => handleChange('kodePos', e.target.value)}
                  placeholder="53254"
                  className="bg-white font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700">Telepon Kantor Desa</Label>
                <Input
                  value={formState.teleponDesa}
                  onChange={(e) => handleChange('teleponDesa', e.target.value)}
                  placeholder="0857-4714-6302"
                  className="bg-white"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700">No. WhatsApp Siaga Desa (Format 628...)</Label>
                <Input
                  value={formState.whatsappSiaga}
                  onChange={(e) => handleChange('whatsappSiaga', e.target.value)}
                  placeholder="6285227011212"
                  className="bg-white font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700">Email Resmi Desa</Label>
                <Input
                  value={formState.emailDesa}
                  onChange={(e) => handleChange('emailDesa', e.target.value)}
                  placeholder="pemdesasampeldes@gmail.com"
                  className="bg-white"
                />
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <Label className="text-xs font-bold text-slate-700">Alamat Singkat Balai Desa (Tampil di Beranda)</Label>
                <Input
                  value={formState.alamatSingkatDesa}
                  onChange={(e) => handleChange('alamatSingkatDesa', e.target.value)}
                  placeholder="Jl. Raya Sampeldes No. 219"
                  className="bg-white"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700">Website Resmi Desa</Label>
                <Input
                  value={formState.websiteDesa}
                  onChange={(e) => handleChange('websiteDesa', e.target.value)}
                  placeholder="https://sampeldes.desa.id"
                  className="bg-white"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700">Jam Pelayanan Kantor</Label>
                <Input
                  value={formState.jamLayanan}
                  onChange={(e) => handleChange('jamLayanan', e.target.value)}
                  placeholder="Senin - Jumat, 08.00 - 16.00 WIB"
                  className="bg-white"
                />
              </div>

              <div className="space-y-1.5 sm:col-span-2 lg:col-span-4">
                <Label className="text-xs font-bold text-slate-700">Alamat Lengkap Kantor Desa (Digunakan pada Kop, Surat &amp; Footer Website) *</Label>
                <Textarea
                  rows={2}
                  value={formState.alamatDesa}
                  onChange={(e) => handleChange('alamatDesa', e.target.value)}
                  placeholder="Jl. Raya Sampeldes Nomor 219, Alurbulu, Desa Sampeldes, Kecamatan Gandrungmangu, Kabupaten Cilacap, Jawa Tengah 53254"
                  required
                  className="bg-white"
                />
              </div>
            </div>
          </div>

          {/* 2. PEJABAT PEMERINTAH DESA (PENANDATANGAN SURAT) */}
          <div className="rounded-2xl border border-stone-200 p-4 sm:p-5 bg-stone-50/50 space-y-4">
            <div className="flex items-center gap-2 border-b border-stone-200 pb-2.5">
              <UserCheck className="h-4 w-4 text-emerald-700" />
              <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider text-slate-800">
                2. Pejabat Pemerintah Desa (Kepala Desa &amp; Sekretaris Desa)
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
              <div className="space-y-1.5 sm:col-span-2">
                <Label className="text-xs font-bold text-slate-700">Nama Lengkap Kepala Desa *</Label>
                <Input
                  value={formState.namaKepalaDesa}
                  onChange={(e) => handleChange('namaKepalaDesa', e.target.value)}
                  placeholder="TUKIMAN"
                  required
                  className="bg-white font-bold"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700">NIP / NIAP Kepala Desa</Label>
                <Input
                  value={formState.nipKepalaDesa}
                  onChange={(e) => handleChange('nipKepalaDesa', e.target.value)}
                  placeholder="-"
                  className="bg-white font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700">Periode Masa Bakti Kades</Label>
                <Input
                  value={formState.periodeKepalaDesa}
                  onChange={(e) => handleChange('periodeKepalaDesa', e.target.value)}
                  placeholder="Periode 2020-2026"
                  className="bg-white"
                />
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <Label className="text-xs font-bold text-slate-700">Nama Lengkap Sekretaris Desa (a.n. Kepala Desa) *</Label>
                <Input
                  value={formState.namaSekretarisDesa}
                  onChange={(e) => handleChange('namaSekretarisDesa', e.target.value)}
                  placeholder="PRIYO SUMARNO"
                  required
                  className="bg-white font-bold"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700">NIP / NIAP Sekretaris Desa</Label>
                <Input
                  value={formState.nipSekretarisDesa}
                  onChange={(e) => handleChange('nipSekretarisDesa', e.target.value)}
                  placeholder="-"
                  className="bg-white font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700">Pangkat / Golongan Sekdes</Label>
                <Input
                  value={formState.pangkatSekretarisDesa}
                  onChange={(e) => handleChange('pangkatSekretarisDesa', e.target.value)}
                  placeholder="-"
                  className="bg-white"
                />
              </div>
            </div>
          </div>

          {/* 3. KECAMATAN & FORKOPIMCAM (CAMAT, DANRAMIL, KAPOLSEK, KUA) */}
          <div className="rounded-2xl border border-stone-200 p-4 sm:p-5 bg-stone-50/50 space-y-4">
            <div className="flex items-center gap-2 border-b border-stone-200 pb-2.5">
              <Shield className="h-4 w-4 text-emerald-700" />
              <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider text-slate-800">
                3. Identitas Kecamatan &amp; Pejabat Forkopimcam (Camat, Danramil, Kapolsek, KUA)
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700">Nama Kecamatan *</Label>
                <Input
                  value={formState.namaKecamatan}
                  onChange={(e) => handleChange('namaKecamatan', e.target.value)}
                  placeholder="Gandrungmangu"
                  required
                  className="bg-white font-semibold"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700">Kode Wilayah Kecamatan</Label>
                <Input
                  value={formState.kodeKecamatan}
                  onChange={(e) => handleChange('kodeKecamatan', e.target.value)}
                  placeholder="33.01.10"
                  className="bg-white font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700">Nama Camat</Label>
                <Input
                  value={formState.namaCamat}
                  onChange={(e) => handleChange('namaCamat', e.target.value)}
                  placeholder="FATHURROHMAN, S.STP., M.Si."
                  className="bg-white font-semibold"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700">NIP Camat</Label>
                <Input
                  value={formState.nipCamat}
                  onChange={(e) => handleChange('nipCamat', e.target.value)}
                  placeholder="19780410 199803 1 004"
                  className="bg-white font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700">Jabatan / Koramil</Label>
                <Input
                  value={formState.jabatanDanramil}
                  onChange={(e) => handleChange('jabatanDanramil', e.target.value)}
                  placeholder="DANRAMIL 10 / GANDRUNGMANGU"
                  className="bg-white"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700">Nama Danramil</Label>
                <Input
                  value={formState.namaDanramil}
                  onChange={(e) => handleChange('namaDanramil', e.target.value)}
                  placeholder="Nama Pejabat Danramil (Opsional)"
                  className="bg-white"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700">NRP / Pangkat Danramil</Label>
                <Input
                  value={formState.nrpDanramil}
                  onChange={(e) => handleChange('nrpDanramil', e.target.value)}
                  placeholder="-"
                  className="bg-white font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700">Nama KUA Kecamatan</Label>
                <Input
                  value={formState.namaKua}
                  onChange={(e) => handleChange('namaKua', e.target.value)}
                  placeholder="KUA Kecamatan Gandrungmangu"
                  className="bg-white"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700">Jabatan / Polsek</Label>
                <Input
                  value={formState.jabatanKapolsek}
                  onChange={(e) => handleChange('jabatanKapolsek', e.target.value)}
                  placeholder="KAPOLSEK GANDRUNGMANGU"
                  className="bg-white"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700">Nama Kapolsek</Label>
                <Input
                  value={formState.namaKapolsek}
                  onChange={(e) => handleChange('namaKapolsek', e.target.value)}
                  placeholder="Nama Pejabat Kapolsek (Opsional)"
                  className="bg-white"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700">NRP / Pangkat Kapolsek</Label>
                <Input
                  value={formState.nrpKapolsek}
                  onChange={(e) => handleChange('nrpKapolsek', e.target.value)}
                  placeholder="-"
                  className="bg-white font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700">Nama Kepala KUA</Label>
                <Input
                  value={formState.namaKepalaKua}
                  onChange={(e) => handleChange('namaKepalaKua', e.target.value)}
                  placeholder="-"
                  className="bg-white"
                />
              </div>
            </div>
          </div>

          {/* 4. KABUPATEN / KOTA & PROVINSI */}
          <div className="rounded-2xl border border-stone-200 p-4 sm:p-5 bg-stone-50/50 space-y-4">
            <div className="flex items-center gap-2 border-b border-stone-200 pb-2.5">
              <MapPin className="h-4 w-4 text-emerald-700" />
              <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider text-slate-800">
                4. Identitas Kabupaten / Kota, Disdukcapil &amp; Provinsi
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700">Nama Kabupaten / Kota *</Label>
                <Input
                  value={formState.namaKabupaten}
                  onChange={(e) => handleChange('namaKabupaten', e.target.value)}
                  placeholder="Cilacap"
                  required
                  className="bg-white font-semibold"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700">Kode Kabupaten / Kota</Label>
                <Input
                  value={formState.kodeKabupaten}
                  onChange={(e) => handleChange('kodeKabupaten', e.target.value)}
                  placeholder="33.01"
                  className="bg-white font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700">Nama Provinsi *</Label>
                <Input
                  value={formState.namaProvinsi}
                  onChange={(e) => handleChange('namaProvinsi', e.target.value)}
                  placeholder="Jawa Tengah"
                  required
                  className="bg-white font-semibold"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700">Kode Provinsi</Label>
                <Input
                  value={formState.kodeProvinsi}
                  onChange={(e) => handleChange('kodeProvinsi', e.target.value)}
                  placeholder="33"
                  className="bg-white font-mono"
                />
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <Label className="text-xs font-bold text-slate-700">Nama Kepala Dinas Dukcapil Kabupaten (Untuk Lampiran F-1.01)</Label>
                <Input
                  value={formState.namaKadisDukcapil}
                  onChange={(e) => handleChange('namaKadisDukcapil', e.target.value)}
                  placeholder="Opsional (Kosongkan jika menggunakan titik-titik)"
                  className="bg-white"
                />
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <Label className="text-xs font-bold text-slate-700">NIP Kepala Dinas Dukcapil Kabupaten</Label>
                <Input
                  value={formState.nipKadisDukcapil}
                  onChange={(e) => handleChange('nipKadisDukcapil', e.target.value)}
                  placeholder="Opsional"
                  className="bg-white font-mono"
                />
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleResetDefault}
              disabled={isSaving}
              className="rounded-xl text-xs font-bold h-10 px-4 gap-2"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Reset ke Default</span>
            </Button>

            <Button
              type="submit"
              disabled={isSaving}
              className="rounded-xl text-xs font-bold h-10 px-6 bg-slate-900 hover:bg-slate-800 text-white gap-2 shadow-md"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Menyimpan Pengaturan Identitas...</span>
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 text-[#d4e157]" />
                  <span>Simpan Identitas Desa &amp; Pejabat Wilayah</span>
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

