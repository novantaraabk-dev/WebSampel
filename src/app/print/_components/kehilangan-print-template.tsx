'use client';

import { LetterSubmission } from '@/lib/types';
import { PrintLayout, DataRow, formatTTL } from './print-layout';

export function KehilanganPrintTemplate({ submission }: { submission: LetterSubmission }) {
  const { formData } = submission;

  return (
    <PrintLayout
      submission={submission}
      fontSize="12pt"
      inlineSignatures={true}
    >
      <p className="mt-3 text-justify leading-normal">
        Yang bertanda tangan di bawah ini Kepala Desa Sampeldes, Kecamatan
        Gandrungmangu, Kabupaten Cilacap, menerangkan bahwa:
      </p>

      {/* DATA PELAPOR */}
      <table className="mt-2 border-collapse w-full">
        <tbody>
          <DataRow compact="tight" label="Nama Lengkap" value={formData.name} />
          <DataRow compact="tight" label="NIK" value={formData.nik} />
          <DataRow compact="tight" label="Jenis Kelamin" value={formData.gender} />
          <DataRow compact="tight" label="Tempat / Tgl Lahir" value={formatTTL(formData.birthPlace, formData.birthDate)} />
          <DataRow compact="tight" label="Pekerjaan" value={formData.job} />
          <DataRow compact="tight" label="Alamat" value={formData.address} />
        </tbody>
      </table>

      <p className="mt-3 text-justify leading-normal">
        Orang tersebut di atas telah melaporkan kepada kami bahwa telah kehilangan barang/surat berharga sebagai berikut:
      </p>

      {/* TABEL BARANG HILANG */}
      <div className="mt-2 p-3.5 rounded-lg border border-slate-900 bg-slate-50/50">
        <table className="w-full border-collapse text-[11pt]">
          <tbody>
            <DataRow compact="tight" label="Barang / Surat Hilang" value={formData.lostItems || formData.rincian_barang || formData.form_rincian_barang || formData.barang_hilang || '-'} />
            <DataRow compact="tight" label="Perkiraan Waktu Hilang" value={formData.lostDate || formData.waktu_hilang || formData.form_waktu_hilang || '-'} />
            <DataRow compact="tight" label="Perkiraan Tempat Hilang" value={formData.lostLocation || formData.tempat_hilang || formData.form_tempat_hilang || '-'} />
          </tbody>
        </table>
      </div>

      <p className="mt-3 text-justify leading-relaxed">
        {formData.chronology || formData.kronologi || formData.form_kronologi || formData.keterangan || formData.form_keterangan || 'Barang/dokumen tersebut di atas benar telah hilang/tercecer dan telah diupayakan pencarian namun hingga saat ini belum ditemukan.'}
      </p>

      <p className="mt-2 text-justify leading-relaxed">
        Surat keterangan pengantar ini diberikan kepada yang bersangkutan untuk keperluan : <strong>{formData.purpose || formData.keperluan || formData.form_keperluan || '-'}</strong>.
      </p>

      <p className="mt-2.5 text-justify leading-relaxed">
        Demikian surat pengantar ini dibuat dengan sebenarnya untuk dapat dipergunakan sebagaimana mestinya oleh pihak yang berwenang.
      </p>
    </PrintLayout>
  );
}

