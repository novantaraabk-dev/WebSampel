'use client';

import { LetterSubmission } from '@/lib/types';
import { PrintLayout, DataRow, formatTTL, toProperCase, formatDateIndo, formatGender } from './print-layout';

export function KeteranganPendudukPrintTemplate({ submission }: { submission: LetterSubmission }) {
  const { formData } = submission;

  return (
    <PrintLayout
      submission={submission}
      fontSize="12pt"
      inlineSignatures={true}
    >
      <div className="space-y-3 text-justify text-[11pt] leading-normal">
        <p className="mt-1 leading-relaxed">
          Yang bertanda tangan di bawah ini Kepala Desa Sampeldes, Kecamatan Gandrungmangu, Kabupaten Cilacap, Provinsi Jawa Tengah, menerangkan dengan sebenarnya bahwa:
        </p>

        <table className="border-collapse w-full">
          <tbody>
            <DataRow compact="tight" label="Nama Lengkap" value={formData.name} />
            <DataRow compact="tight" label="NIK" value={formData.nik} />
            <DataRow compact="tight" label="Nomor Kartu Keluarga" value={formData.kkNumber || '-'} />
            <DataRow compact="tight" label="Jenis Kelamin" value={formatGender(formData.gender)} />
            <DataRow compact="tight" label="Tempat / Tgl Lahir" value={formatTTL(formData.birthPlace, formData.birthDate)} />
            <DataRow compact="tight" label="Warganegara / Agama" value={`${formData.nationality || 'Indonesia'} / ${formData.religion || 'Islam'}`} />
            <DataRow compact="tight" label="Status Perkawinan" value={formData.maritalStatus || 'Kawin'} />
            <DataRow compact="tight" label="Pekerjaan" value={formData.job} />
            <DataRow compact="tight" label="Alamat Tempat Tinggal" value={formData.address} />
            <DataRow compact="tight" label="Rukun Tetangga / RW" value={`RT ${formData.rt || '00'} / RW ${formData.rw || '00'}`} />
          </tbody>
        </table>

        <p className="mt-3 leading-relaxed">
          Adalah benar-benar <strong>PENDUDUK DEFINITIF</strong> yang tercatat secara sah dan aktif dalam Buku Induk Kependudukan Pemerintah Desa Sampeldes, Kecamatan Gandrungmangu, Kabupaten Cilacap, dan bertempat tinggal menetap pada alamat tersebut di atas.
        </p>

        <p className="mt-2.5 leading-relaxed">
          Surat keterangan ini diberikan kepada yang bersangkutan untuk keperluan: <strong>{formData.purpose || 'Persyaratan Kelengkapan Administrasi Resmi / Pembuktian Status Penduduk'}</strong>.
        </p>

        <p className="mt-3 leading-relaxed">
          Demikian surat keterangan penduduk ini dibuat dengan sebenarnya dan penuh tanggung jawab agar dapat dipergunakan sebagaimana mestinya.
        </p>
      </div>
    </PrintLayout>
  );
}

