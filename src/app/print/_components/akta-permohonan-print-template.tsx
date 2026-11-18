'use client';

import { LetterSubmission } from '@/lib/types';
import { PrintLayout, DataRow, formatTTL, toProperCase, formatDateIndo, formatGender } from './print-layout';

export function AktaPermohonanPrintTemplate({
  submission,
  variant = 'permohonan',
}: {
  submission: LetterSubmission;
  variant?: 'permohonan' | 'sptjm' | 'duplikat';
}) {
  const { formData } = submission;
  const isDuplikat = variant === 'duplikat' || submission.letterType?.toLowerCase().includes('duplikat');
  const isSptjm = variant === 'sptjm' || submission.letterType?.toLowerCase().includes('sptjm') || submission.letterType?.toLowerCase().includes('pernyataan belum');

  const titleText = isDuplikat
    ? 'PERMOHONAN DUPLIKAT KUTIPAN AKTA KELAHIRAN'
    : isSptjm
    ? 'SURAT KETERANGAN BELUM MEMILIKI AKTA KELAHIRAN'
    : 'SURAT PENGANTAR PERMOHONAN AKTA KELAHIRAN';

  const pages = [
    // ========================================================
    // LEMBAR I: SURAT PENGANTAR DESA
    // ========================================================
    {
      showKop: true,
      title: titleText,
      subtitle: `Nomor : ${submission.documentNumber}`,
      content: (
        <div className="space-y-3 text-justify text-[11pt] leading-normal">
          <div className="mb-2 text-right text-[11pt]">
            <p>Kepada Yth.</p>
            <p className="font-semibold">Kepala Dinas Kependudukan dan Pencatatan Sipil Kab. Cilacap</p>
            <p>di - <span className="underline">Tempat</span></p>
          </div>

          <p className="leading-relaxed">
            Yang bertanda tangan di bawah ini Kepala Desa Sampeldes, Kecamatan Gandrungmangu, Kabupaten Cilacap, menerangkan dengan sebenarnya bahwa:
          </p>

          <table className="border-collapse w-full">
            <tbody>
              <DataRow compact="tight" label="Nama Lengkap Anak" value={formData.childName || formData.name} />
              <DataRow compact="tight" label="Jenis Kelamin" value={formatGender(formData.childGender || formData.gender)} />
              <DataRow compact="tight" label="Tempat / Tgl Lahir" value={formatTTL(formData.childBirthPlace || formData.birthPlace, formData.childBirthDate || formData.birthDate)} />
              <DataRow compact="tight" label="Anak ke-" value={formData.birthOrder || formData.childOrder || '1 (Satu)'} />
              <DataRow compact="tight" label="Nama Ayah Kandung" value={formData.fatherName} />
              <DataRow compact="tight" label="NIK Ayah Kandung" value={formData.fatherNik || '-'} />
              <DataRow compact="tight" label="Nama Ibu Kandung" value={formData.motherName} />
              <DataRow compact="tight" label="NIK Ibu Kandung" value={formData.motherNik || '-'} />
              <DataRow compact="tight" label="Nomor Kartu Keluarga" value={formData.kkNumber || '-'} />
              <DataRow compact="tight" label="Alamat Tempat Tinggal" value={formData.address} />
            </tbody>
          </table>

          <p className="mt-2 leading-relaxed">
            {isDuplikat ? (
              `Orang tersebut di atas benar-benar telah memiliki Akta Kelahiran sebelumnya, namun kutipan asli akta tersebut telah ${formData.reason || 'hilang / rusak / terbakar'}, sehingga memohon rekomendasi penerbitan Duplikat Kutipan Akta Kelahiran.`
            ) : isSptjm ? (
              'Orang tersebut di atas hingga saat ini benar-benar BELUM PERNAH memiliki Kutipan Akta Kelahiran dari Kantor Catatan Sipil manapun, dikarenakan kelahiran terdahulu tidak dilaporkan / belum memiliki surat keterangan lahir dari bidan/penolong kelahiran.'
            ) : (
              'Mengajukan permohonan penerbitan Kutipan Akta Kelahiran baru ke Dinas Kependudukan dan Pencatatan Sipil Kabupaten Cilacap sesuai peristiwa kelahiran yang terjadi.'
            )}
          </p>

          <p className="mt-2 leading-relaxed">
            Demikian surat pengantar ini dibuat dengan sebenarnya agar dapat dipergunakan sebagaimana mestinya.
          </p>
        </div>
      ),
      pageNumber: 1,
      totalPages: 2,
      showSignatures: true,
      inlineSignatures: true,
    },

    // ========================================================
    // LEMBAR II: LAMPIRAN FORMULIR F-2.01 / SPTJM (F-2.03) DUKCAPIL
    // ========================================================
    {
      showKop: false,
      title: isSptjm
        ? 'SURAT PERNYATAAN TANGGUNG JAWAB MUTLAK (SPTJM) KEBENARAN KELAHIRAN'
        : isDuplikat
        ? 'SURAT PERNYATAAN KEHILANGAN / KERUSAKAN KUTIPAN AKTA KELAHIRAN'
        : 'FORMULIR PELAPORAN PENCATATAN SIPIL KELAHIRAN (F-2.01)',
      subtitle: isSptjm ? 'FORMULIR F-2.03 DITJEN KEPENDUDUKAN DAN PENCATATAN SIPIL' : 'LAMPIRAN RESMI DISDUKCAPIL KABUPATEN CILACAP',
      content: (
        <div className="space-y-3 text-justify text-[10.5pt] leading-normal">
          <p className="leading-relaxed">
            Yang bertanda tangan di bawah ini orang tua / pemohon:
          </p>

          <table className="border-collapse w-full">
            <tbody>
              <DataRow compact="tight" label="Nama Lengkap Pemohon" value={formData.fatherName || formData.name} />
              <DataRow compact="tight" label="NIK" value={formData.fatherNik || formData.nik} />
              <DataRow compact="tight" label="Pekerjaan" value={formData.job || 'Wiraswasta'} />
              <DataRow compact="tight" label="Alamat" value={formData.address} />
            </tbody>
          </table>

          <p className="mt-2 leading-relaxed">
            Menyatakan dengan sesungguhnya dan penuh rasa tanggung jawab bahwa data kelahiran atas anak kami:
          </p>

          <div className="border border-slate-900 p-2.5 rounded bg-slate-50 space-y-1">
            <p><strong>Nama Anak:</strong> {toProperCase(formData.childName || formData.name)}</p>
            <p><strong>Tempat, Tgl Lahir:</strong> {formatTTL(formData.childBirthPlace || formData.birthPlace, formData.childBirthDate || formData.birthDate)}</p>
            <p><strong>Jenis Kelamin:</strong> {formatGender(formData.childGender || formData.gender)}</p>
            <p><strong>Nama Ibu Kandung:</strong> {toProperCase(formData.motherName || '-')}</p>
            <p><strong>Nama Ayah Kandung:</strong> {toProperCase(formData.fatherName || '-')}</p>
          </div>

          <p className="mt-2 text-[10pt] leading-relaxed">
            Adalah benar-benar anak kandung kami dan data yang kami berikan adalah data yang sebenarnya. Apabila di kemudian hari terbukti pernyataan kami ini tidak benar, kami bersedia dituntut di muka pengadilan sesuai ketentuan hukum yang berlaku.
          </p>

          <div className="mt-4 grid grid-cols-2 text-center text-[10pt]">
            <div>
              <p className="font-semibold mb-2">Saksi I / Kerabat:</p>
              <div className="h-14" />
              <p className="font-bold underline">{toProperCase(formData.witness1Name || '...........................................')}</p>
              <p className="text-xs text-slate-600">NIK: {formData.witness1Nik || '...........................................'}</p>
            </div>
            <div>
              <p>Sampeldes, {formatDateIndo(formData.letterDate || new Date().toISOString())}</p>
              <p className="mb-2">Yang Membuat Pernyataan,</p>
              <div className="h-2" />
              <span className="text-[8.5pt] border border-dashed border-slate-400 px-2 py-0.5 text-slate-500 font-mono">
                Meterai Rp 10.000
              </span>
              <div className="h-2" />
              <p className="font-bold underline">{toProperCase(formData.fatherName || formData.name)}</p>
            </div>
          </div>
        </div>
      ),
      pageNumber: 2,
      totalPages: 2,
      showSignatures: false,
    },
  ];

  return <PrintLayout submission={submission} fontSize="11pt" pages={pages} />;
}

