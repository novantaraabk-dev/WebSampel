'use client';

import { LetterSubmission } from '@/lib/types';
import { PrintLayout, DataRow, formatTTL, toProperCase, formatDateIndo, formatGender } from './print-layout';

export function LahirMatiPrintTemplate({ submission }: { submission: LetterSubmission }) {
  const { formData } = submission;

  const pages = [
    // ========================================================
    // LEMBAR I: SURAT KETERANGAN LAHIR MATI DESA
    // ========================================================
    {
      showKop: true,
      title: 'SURAT KETERANGAN LAHIR MATI',
      subtitle: `Nomor : ${submission.documentNumber}`,
      content: (
        <div className="space-y-3 text-justify text-[11pt] leading-normal">
          <p className="mt-1 leading-relaxed">
            Yang bertanda tangan di bawah ini Kepala Desa Sampeldes, Kecamatan Gandrungmangu, Kabupaten Cilacap, menerangkan dengan sebenarnya bahwa pada:
          </p>

          <table className="border-collapse w-full">
            <tbody>
              <DataRow compact="tight" label="Hari / Tanggal Kejadian" value={formData.deathDate ? formatDateIndo(formData.deathDate) : (formData.eventDate || '-')} />
              <DataRow compact="tight" label="Pukul (Waktu)" value={formData.deathTime ? `${formData.deathTime} WIB` : '-'} />
              <DataRow compact="tight" label="Tempat Kejadian" value={formData.place || formData.birthPlace || 'Puskesmas / Rumah Sakit / Rumah'} />
              <DataRow compact="tight" label="Lama Dalam Kandungan" value={`${formData.gestationAge || formData.pregnancyAge || '32'} Minggu`} />
              <DataRow compact="tight" label="Jenis Kelamin Bayi" value={formatGender(formData.gender || formData.babyGender)} />
              <DataRow compact="tight" label="Sebab Kematian" value={formData.cause || 'Asfiksia / Kematian dalam kandungan (Intrauterine Fetal Death)'} />
            </tbody>
          </table>

          <p className="mt-2 leading-relaxed">
            Telah lahir mati seorang bayi dari pasangan suami-istri penduduk Desa Sampeldes:
          </p>

          <div className="border border-slate-900 p-2.5 rounded bg-slate-50 space-y-1 text-[10.5pt]">
            <p><strong>Nama Ibu Kandung:</strong> {toProperCase(formData.motherName || formData.name)} (NIK: {formData.motherNik || formData.nik})</p>
            <p><strong>Nama Ayah Kandung:</strong> {toProperCase(formData.fatherName || formData.spouseName || '-')} (NIK: {formData.fatherNik || formData.spouseNik || '-'})</p>
            <p><strong>Alamat Tempat Tinggal:</strong> {formData.address}</p>
          </div>

          <p className="mt-2.5 leading-relaxed">
            Surat keterangan ini dibuat berdasarkan laporan dari pihak keluarga dan keterangan tenaga medis / penolong persalinan untuk keperluan pencatatan kependudukan dan pemakaman.
          </p>

          <p className="mt-2 leading-relaxed">
            Demikian surat keterangan lahir mati ini dibuat untuk dipergunakan sebagaimana mestinya.
          </p>
        </div>
      ),
      pageNumber: 1,
      totalPages: 2,
      showSignatures: true,
      inlineSignatures: true,
    },

    // ========================================================
    // LEMBAR II: LAMPIRAN FORMULIR F-2.01 LAHIR MATI DUKCAPIL
    // ========================================================
    {
      showKop: false,
      title: 'FORMULIR PELAPORAN LAHIR MATI (F-2.01)',
      subtitle: 'DINAS KEPENDUDUKAN DAN PENCATATAN SIPIL KABUPATEN CILACAP',
      content: (
        <div className="space-y-3 text-justify text-[10.5pt] leading-normal">
          <div className="flex justify-between items-center border-b pb-1 text-[9pt] font-mono">
            <span>KODE WILAYAH: 33.01.11.2005</span>
            <span className="font-bold border border-black px-2 py-0.5">LAMPIRAN F-2.01 LAHIR MATI</span>
          </div>

          <p className="font-bold text-slate-900 text-[10pt]">I. DATA IBU :</p>
          <table className="border-collapse w-full">
            <tbody>
              <DataRow compact="tight" label="Nama Lengkap Ibu" value={formData.motherName || formData.name} />
              <DataRow compact="tight" label="NIK Ibu" value={formData.motherNik || formData.nik} />
              <DataRow compact="tight" label="Tempat / Tgl Lahir" value={formatTTL(formData.motherBirthPlace, formData.motherBirthDate)} />
              <DataRow compact="tight" label="Pekerjaan" value={formData.motherJob || 'Ibu Rumah Tangga'} />
              <DataRow compact="tight" label="Alamat" value={formData.address} />
            </tbody>
          </table>

          <p className="font-bold text-slate-900 text-[10pt] mt-2">II. DATA BAYI LAHIR MATI :</p>
          <table className="border-collapse w-full">
            <tbody>
              <DataRow compact="tight" label="Jenis Kelamin" value={formatGender(formData.gender || formData.babyGender)} />
              <DataRow compact="tight" label="Tanggal Peristiwa" value={formData.deathDate ? formatDateIndo(formData.deathDate) : (formData.eventDate || '-')} />
              <DataRow compact="tight" label="Lama Kandungan" value={`${formData.gestationAge || '32'} Minggu`} />
              <DataRow compact="tight" label="Tempat Lahir Mati" value={formData.place || 'Puskesmas / Rumah Sakit'} />
              <DataRow compact="tight" label="Penolong Kelahiran" value={formData.helper || 'Dokter / Bidan'} />
            </tbody>
          </table>

          <div className="mt-5 grid grid-cols-2 text-center text-[10pt]">
            <div>
              <p>Mengetahui,</p>
              <p className="font-semibold mb-2">Kepala Desa Sampeldes</p>
              <div className="h-14" />
              <p className="font-bold underline">TUKIMAN</p>
              <p className="text-xs text-slate-600"></p>
            </div>
            <div>
              <p>Sampeldes, {formatDateIndo(formData.letterDate || new Date().toISOString())}</p>
              <p className="mb-2">Pelapor (Orang Tua / Keluarga),</p>
              <div className="h-14" />
              <p className="font-bold underline">{toProperCase(formData.name)}</p>
            </div>
          </div>
        </div>
      ),
      pageNumber: 2,
      totalPages: 2,
      showSignatures: false,
    },
  ];

  return <PrintLayout submission={submission} fontSize="12pt" pages={pages} />;
}

