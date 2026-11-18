'use client';

import React, { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  QrCode,
  X,
  Sliders,
  ShieldCheck,
  CheckCircle2,
  FileText,
  ExternalLink,
  Save,
  RefreshCw,
  Sparkles,
  Info,
  Check,
  Layers,
  Image as ImageIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import type { VillageIdentityInfo } from '@/lib/village-identity';
import {
  generateQrCodeDataUri,
  buildQrVerificationPayload,
  type OpenSidQrSignatureSettings,
  type QrLogoMode,
  type QrContentMode,
  type QrSignMode,
} from '@/lib/opensid-qr-signature';

interface OpenSidGlobalQrModalProps {
  isOpen: boolean;
  onClose: () => void;
  globalQrSettings: OpenSidQrSignatureSettings;
  setGlobalQrSettings: React.Dispatch<React.SetStateAction<OpenSidQrSignatureSettings>>;
  onSave: (settings: OpenSidQrSignatureSettings) => void;
  onApplyToAll: () => Promise<void>;
  isApplyingToAll: boolean;
  villageLogoUrl: string;
  identity: VillageIdentityInfo;
  totalSurat: number;
}

export function OpenSidGlobalQrModal({
  isOpen,
  onClose,
  globalQrSettings,
  setGlobalQrSettings,
  onSave,
  onApplyToAll,
  isApplyingToAll,
  villageLogoUrl,
  identity,
  totalSurat,
}: OpenSidGlobalQrModalProps) {
  const router = useRouter();

  const updateQr = (patch: Partial<OpenSidQrSignatureSettings>) => {
    setGlobalQrSettings((prev) => ({
      ...prev,
      ...patch,
    }));
  };

  // Payload simulasi untuk Live Preview
  const samplePayload = useMemo(() => {
    return buildQrVerificationPayload(globalQrSettings, {
      submissionId: 'sample-doc-preview',
      nomorSurat: '400.12.2.2/002/X/2026',
      judulSurat: 'Surat Keterangan Usaha',
      tanggalSurat: new Date().toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }),
      namaPemohon: 'AHMAD FAUZI SETIAWAN',
      nikPemohon: '3301101708940002',
      jabatanPenandatangan: `Kepala ${identity.sebutanDesa} ${identity.namaDesa}`,
      namaPenandatangan: identity.namaKepalaDesa,
      signerCode: 'kades',
      identity,
    });
  }, [globalQrSettings, identity]);

  const sampleQrDataUri = useMemo(() => {
    return generateQrCodeDataUri(samplePayload, globalQrSettings, villageLogoUrl);
  }, [samplePayload, globalQrSettings, villageLogoUrl]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 sm:p-5 backdrop-blur-xs">
      <div className="flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl border border-slate-200">
        {/* Header Modal */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50/80 px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 shadow-2xs">
              <QrCode className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900">
                  Pengaturan Penandatanganan QR Code Surat (Standar OpenSID)
                </h3>
                <Badge variant="outline" className="border-emerald-300 bg-emerald-50 text-emerald-800 text-[10px] font-semibold">
                  Global
                </Badge>
              </div>
              <p className="text-xs text-slate-500">
                Kelola aturan QR Code, integrasi TTE / BSrE, dan logo desa yang berlaku untuk seluruh layanan surat.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body Modal: 2 Kolom (Kiri: Pengaturan, Kanan: Live Preview) */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            {/* Kolom Kiri: Form Pengaturan */}
            <div className="space-y-6 lg:col-span-7">
              {/* KARTU 1: SUMBER LOGO DESA DARI /admin/settings */}
              <div className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-4 shadow-2xs space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <ImageIcon className="h-4 w-4 text-emerald-700" />
                    <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-950">
                      Logo QR: Logo Resmi Desa Sampeldes
                    </h4>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      router.push('/admin/settings');
                    }}
                    className="gap-1 text-[11px] h-7 px-2.5 border-emerald-300 bg-white text-emerald-800 hover:bg-emerald-50"
                  >
                    <ExternalLink className="h-3 w-3" />
                    Buka /admin/settings
                  </Button>
                </div>

                <div className="flex items-center gap-3.5 rounded-lg border border-emerald-200 bg-white p-3 shadow-2xs">
                  {villageLogoUrl ? (
                    <div className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-lg border border-emerald-200 bg-slate-50 p-1">
                      <img
                        src={villageLogoUrl}
                        alt="Logo Desa"
                        className="max-h-full max-w-full object-contain"
                      />
                    </div>
                  ) : (
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg border border-dashed border-amber-300 bg-amber-50 text-amber-800 font-bold text-xs text-center p-1">
                      Belum Diunggah
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="text-xs font-bold text-slate-800">
                        {villageLogoUrl ? 'Logo Desa Aktif Terdeteksi' : 'Logo Desa Belum Diunggah'}
                      </p>
                      {villageLogoUrl ? (
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                      ) : (
                        <Info className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 line-clamp-2 mt-0.5">
                      {villageLogoUrl
                        ? 'Gambar ini diambil dari /admin/settings - Logo Desa dan otomatis disematkan di tengah QR Code surat.'
                        : 'Belum ada file gambar logo pada /admin/settings. QR Code akan menggunakan simbol perisai pemerintah.'}
                    </p>
                  </div>
                </div>

                {/* Pilihan Sisipkan Logo Tengah */}
                <div className="pt-1">
                  <label className="mb-1 block text-xs font-bold text-slate-700">
                    Pilihan Logo di Tengah QR Code (<code>changeqr</code> di OpenSID)
                  </label>
                  <select
                    value={globalQrSettings.logoMode || 'logo_desa'}
                    onChange={(e) => updateQr({ logoMode: e.target.value as QrLogoMode })}
                    className="h-9 w-full rounded-md border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-800 shadow-2xs focus:border-emerald-500 focus:outline-hidden"
                  >
                    <option value="logo_desa">Otomatis (Logo Resmi Pemerintah Desa dari /admin/settings)</option>
                    <option value="garuda">Lambang Burung Garuda Pancasila</option>
                    <option value="bsre">Badge TTE / BSrE BSSN</option>
                    <option value="custom">Kustom (URL Gambar Luar)</option>
                    <option value="none">Tanpa Logo (QR Code Polos)</option>
                  </select>
                </div>

                {globalQrSettings.logoMode === 'custom' && (
                  <div>
                    <label className="mb-1 block text-xs font-bold text-slate-700">
                      URL Gambar Logo Kustom
                    </label>
                    <Input
                      value={globalQrSettings.customLogoUrl || ''}
                      onChange={(e) => updateQr({ customLogoUrl: e.target.value })}
                      placeholder="https://example.com/logo.png"
                      className="text-xs"
                    />
                  </div>
                )}
              </div>

              {/* KARTU 2: ATURAN AKTIVASI & PENANDATANGANAN */}
              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs space-y-4">
                <h4 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-800 border-b border-slate-100 pb-2.5">
                  <ShieldCheck className="h-4 w-4 text-emerald-600" />
                  1. Kebijakan & Aktivasi Penandatanganan
                </h4>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {/* Status Fitur QR */}
                  <div>
                    <label className="mb-1.5 block text-xs font-bold text-slate-700">
                      Penandatanganan QR Code (<code>qr_code</code>)
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => updateQr({ enabled: true })}
                        className={`flex items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold transition ${
                          globalQrSettings.enabled
                            ? 'border-emerald-500 bg-emerald-50 text-emerald-800 ring-2 ring-emerald-500/20'
                            : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                        Aktif
                      </button>
                      <button
                        type="button"
                        onClick={() => updateQr({ enabled: false })}
                        className={`flex items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold transition ${
                          !globalQrSettings.enabled
                            ? 'border-rose-500 bg-rose-50 text-rose-800 ring-2 ring-rose-500/20'
                            : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <X className="h-4 w-4 text-rose-600" />
                        Nonaktif
                      </button>
                    </div>
                  </div>

                  {/* Mode Default Saat Cetak Surat */}
                  <div>
                    <label className="mb-1.5 block text-xs font-bold text-slate-700">
                      Metode Default saat Cetak Dokumen
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => updateQr({ defaultSignMode: 'manual' as QrSignMode })}
                        className={`flex items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold transition ${
                          globalQrSettings.defaultSignMode === 'manual'
                            ? 'border-blue-500 bg-blue-50 text-blue-800 ring-2 ring-blue-500/20'
                            : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <FileText className="h-4 w-4 text-blue-600" />
                        Manual (Basah)
                      </button>
                      <button
                        type="button"
                        onClick={() => updateQr({ defaultSignMode: 'qr' as QrSignMode })}
                        className={`flex items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold transition ${
                          globalQrSettings.defaultSignMode === 'qr'
                            ? 'border-emerald-500 bg-emerald-50 text-emerald-800 ring-2 ring-emerald-500/20'
                            : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <QrCode className="h-4 w-4 text-emerald-600" />
                        QR Code
                      </button>
                    </div>
                  </div>
                </div>

                {/* Opsi TTE & Lampiran */}
                <div className="space-y-2.5 pt-1 border-t border-slate-100">
                  <label className="flex items-start gap-2.5 cursor-pointer rounded-lg border border-slate-200 p-2.5 hover:bg-slate-50 transition">
                    <input
                      type="checkbox"
                      checked={Boolean(globalQrSettings.tteEnabled)}
                      onChange={(e) =>
                        updateQr({
                          tteEnabled: e.target.checked,
                          showFooterTte: e.target.checked ? true : globalQrSettings.showFooterTte,
                        })
                      }
                      className="mt-0.5 h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    <div>
                      <p className="text-xs font-bold text-slate-800">
                        Aktifkan Mode TTE / BSrE BSSN (<code>qr_code_tte</code> & <code>visual_tte</code>)
                      </p>
                      <p className="text-[11px] text-slate-500">
                        Mengaktifkan status sertifikasi tanda tangan elektronik resmi sesuai standar OpenSID.
                      </p>
                    </div>
                  </label>

                  <label className="flex items-start gap-2.5 cursor-pointer rounded-lg border border-slate-200 p-2.5 hover:bg-slate-50 transition">
                    <input
                      type="checkbox"
                      checked={Boolean(globalQrSettings.applyToLampiran)}
                      onChange={(e) => updateQr({ applyToLampiran: e.target.checked })}
                      className="mt-0.5 h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    <div>
                      <p className="text-xs font-bold text-slate-800">
                        Sertakan QR Code pada Lampiran Dokumen (F-1.01..N-4)
                      </p>
                      <p className="text-[11px] text-slate-500">
                        Menempelkan tanda tangan QR resmi pada kolom penandatanganan di lembar lampiran resmi.
                      </p>
                    </div>
                  </label>

                  <label className="flex items-start gap-2.5 cursor-pointer rounded-lg border border-slate-200 p-2.5 hover:bg-slate-50 transition">
                    <input
                      type="checkbox"
                      checked={Boolean(globalQrSettings.showFooterTte)}
                      onChange={(e) => updateQr({ showFooterTte: e.target.checked })}
                      className="mt-0.5 h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    <div>
                      <p className="text-xs font-bold text-slate-800">
                        Tampilkan Footer TTE / Klausul UU ITE Pasal 5 Ayat 1
                      </p>
                      <p className="text-[11px] text-slate-500">
                        Menambahkan catatan keabsahan hukum dokumen elektronik di bagian paling bawah halaman surat.
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              {/* KARTU 3: SPESIFIKASI VISUAL & UKURAN */}
              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs space-y-4">
                <h4 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-800 border-b border-slate-100 pb-2.5">
                  <Sliders className="h-4 w-4 text-emerald-600" />
                  2. Spesifikasi Ukuran, Warna & Keterangan
                </h4>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs font-bold text-slate-700">
                      Ukuran QR Code (<code>sizeqr</code>)
                    </label>
                    <select
                      value={globalQrSettings.sizePx || 90}
                      onChange={(e) => updateQr({ sizePx: Number(e.target.value) || 90 })}
                      className="h-9 w-full rounded-md border border-slate-300 bg-white px-2.5 text-xs font-semibold text-slate-800 shadow-2xs"
                    >
                      <option value={70}>70px x 70px (Kecil)</option>
                      <option value={80}>80px x 80px</option>
                      <option value={90}>90px x 90px (Standar Rekomendasi)</option>
                      <option value={100}>100px x 100px</option>
                      <option value={115}>115px x 115px</option>
                      <option value={130}>130px x 130px (Besar)</option>
                    </select>
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-bold text-slate-700">
                      Warna QR (<code>foreqr</code>)
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={globalQrSettings.foreColor || '#000000'}
                        onChange={(e) => updateQr({ foreColor: e.target.value })}
                        className="h-9 w-10 cursor-pointer rounded border border-slate-300 bg-white p-0.5"
                      />
                      <Input
                        value={globalQrSettings.foreColor || '#000000'}
                        onChange={(e) => updateQr({ foreColor: e.target.value })}
                        className="h-9 font-mono text-xs uppercase"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2 pt-1 border-t border-slate-100">
                  <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={Boolean(globalQrSettings.showCaptionBelowQr)}
                      onChange={(e) => updateQr({ showCaptionBelowQr: e.target.checked })}
                      className="h-4 w-4 rounded border-slate-300 text-emerald-600"
                    />
                    Tampilkan Teks Keterangan di Bawah QR Code
                  </label>
                  {globalQrSettings.showCaptionBelowQr && (
                    <Input
                      value={globalQrSettings.captionText || ''}
                      onChange={(e) => updateQr({ captionText: e.target.value })}
                      placeholder="Contoh: Ditandatangani secara elektronik"
                      className="h-8 text-xs"
                    />
                  )}
                </div>
              </div>

              {/* KARTU 4: FORMAT PAYLOAD ISI QR */}
              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs space-y-3">
                <h4 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-800 border-b border-slate-100 pb-2.5">
                  <FileText className="h-4 w-4 text-emerald-600" />
                  3. Format Isi QR Code (<code>isiqr</code>)
                </h4>

                <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                  {[
                    {
                      id: 'url_verifikasi',
                      title: 'URL Verifikasi',
                      desc: 'Membuka portal resmi verifikasi surat (Rekomendasi OpenSID)',
                    },
                    {
                      id: 'ringkasan_dokumen',
                      title: 'Ringkasan Dokumen',
                      desc: 'Teks ringkasan nomor, pemohon & legalitas surat',
                    },
                    {
                      id: 'custom',
                      title: 'Template Kustom',
                      desc: 'Format teks bebas menggunakan variabel tag',
                    },
                  ].map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => updateQr({ contentMode: opt.id as QrContentMode })}
                      className={`rounded-lg border p-2.5 text-left transition ${
                        globalQrSettings.contentMode === opt.id
                          ? 'border-emerald-500 bg-emerald-50/70 text-emerald-950 ring-1 ring-emerald-500'
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <p className="text-xs font-bold">{opt.title}</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">{opt.desc}</p>
                    </button>
                  ))}
                </div>

                {globalQrSettings.contentMode === 'custom' && (
                  <div className="pt-2">
                    <label className="mb-1 block text-xs font-bold text-slate-700">
                      Format Teks Kustom (Maksimal 300 karakter)
                    </label>
                    <Textarea
                      rows={3}
                      value={globalQrSettings.customContentTemplate || ''}
                      onChange={(e) => updateQr({ customContentTemplate: e.target.value })}
                      className="font-mono text-xs"
                      maxLength={300}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Kolom Kanan: LIVE INTERACTIVE PREVIEW */}
            <div className="lg:col-span-5">
              <div className="sticky top-2 rounded-xl border border-slate-200 bg-slate-50/70 p-4 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-emerald-600" />
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                      Pratinjau Hasil QR Code (Live)
                    </h4>
                  </div>
                  <Badge variant="outline" className="text-[10px] bg-white border-slate-200">
                    {globalQrSettings.sizePx}px • {globalQrSettings.logoMode}
                  </Badge>
                </div>

                {/* Box Tampilan Simulasi QR */}
                <div className="flex flex-col items-center justify-center rounded-xl border border-slate-200 bg-white p-6 shadow-xs text-center">
                  <div className="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Simulasi Penandatanganan
                  </div>
                  <p className="text-xs font-bold text-slate-800">
                    Kepala {identity.sebutanDesa} {identity.namaDesa}
                  </p>

                  {/* QR Image Preview */}
                  <div className="my-3 p-3 rounded-lg border border-slate-100 bg-slate-50 shadow-inner inline-block">
                    <img
                      src={sampleQrDataUri}
                      alt="Pratinjau QR Code"
                      style={{
                        width: `${Math.min(130, Math.max(70, globalQrSettings.sizePx || 90))}px`,
                        height: `${Math.min(130, Math.max(70, globalQrSettings.sizePx || 90))}px`,
                      }}
                      className="mx-auto block"
                    />
                    {globalQrSettings.showCaptionBelowQr && globalQrSettings.captionText && (
                      <p className="mt-1.5 text-[10px] font-semibold text-slate-600">
                        {globalQrSettings.captionText}
                      </p>
                    )}
                  </div>

                  <p className="text-xs font-bold text-slate-900 uppercase tracking-tight underline">
                    {identity.namaKepalaDesa}
                  </p>
                  <p className="text-[11px] text-slate-500 font-mono">
                    NIP: {identity.nipKepalaDesa || '-'}
                  </p>
                </div>

                {/* Info Payload */}
                <div className="rounded-lg border border-slate-200 bg-white p-3 space-y-1.5 text-xs">
                  <p className="font-bold text-slate-700 text-[11px] flex items-center gap-1.5">
                    <Info className="h-3.5 w-3.5 text-blue-600" />
                    Payload Pemindaian Kamera HP:
                  </p>
                  <div className="rounded bg-slate-100 p-2 font-mono text-[10px] text-slate-700 break-all leading-relaxed">
                    {samplePayload}
                  </div>
                </div>

                {/* Info Standar OpenSID */}
                <div className="rounded-lg border border-blue-200 bg-blue-50/60 p-3 text-xs text-blue-900 space-y-1">
                  <p className="font-bold text-[11px]">Sesuai Standar OpenSID:</p>
                  <ul className="list-disc pl-4 text-[10px] space-y-0.5 text-blue-800">
                    <li>QR Code dihasilkan dengan standar ISO/IEC 18004 Error Correction M.</li>
                    <li>Logo Desa di tengah QR diambil dari <code className="font-semibold text-blue-950">/admin/settings - Logo Desa</code>.</li>
                    <li>Dapat diterapkan serentak ke seluruh ({totalSurat}) jenis format surat.</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Modal: Tombol Aksi */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 bg-slate-50 px-5 py-3.5">
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            Batal
          </Button>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onSave(globalQrSettings)}
              className="gap-1.5 border-slate-300 text-slate-700 bg-white hover:bg-slate-100"
            >
              <Save className="h-4 w-4" />
              Simpan Pengaturan Global
            </Button>

            <Button
              type="button"
              size="sm"
              disabled={isApplyingToAll}
              onClick={onApplyToAll}
              className="gap-1.5 bg-emerald-600 text-white hover:bg-emerald-700 shadow-xs"
            >
              {isApplyingToAll ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Menerapkan...
                </>
              ) : (
                <>
                  <Layers className="h-4 w-4" />
                  Terapkan ke Seluruh ({totalSurat}) Surat Master
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

