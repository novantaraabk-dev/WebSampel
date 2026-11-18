'use client';
import { LetterSubmission } from '@/lib/types';
import { PrintLayout, DataRow, formatTTL } from './print-layout';

export function MoyangPrintTemplate({ submission }: { submission: LetterSubmission }) {
  const { formData } = submission;
  
  // Ambil identitas orang yang diterangkan (pemohon/warga)
  const name = formData.fullName || formData.name || submission.requesterName || '-';
  const nik = formData.nik || submission.nik || '-';
  const gender = formData.gender || formData.sex || '-';
  const birthPlace = formData.birthPlace || formData.placeOfBirth || '-';
  const birthDate = formData.birthDate || formData.dateOfBirth || '-';
  const nationality = formData.nationality || 'WNI';
  const religion = formData.religion || '-';
  const job = formData.job || formData.pekerjaan || '-';
  const address = formData.address || formData.alamat || '-';

  // Redaksi Keterangan Moyang Sesuai Format Permintaan User
  const keteranganStatus = 
    formData.form_keterangan_status_moyang || 
    formData.keterangan_status_moyang || 
    formData.keteranganStatus || 
    'Bahwa orang tersebut di atas adalah benar-benar penduduk Desa Sampeldes';

  const keteranganTambahan = 
    formData.form_keterangan_tambahan || 
    formData.keterangan_tambahan || 
    formData.keteranganTambahan || 
    '';

  const purpose = 
    formData.form_keperluan || 
    formData.keperluan || 
    formData.purpose || 
    (submission as any).purpose || 
    '';

  const closureText = purpose 
    ? `Demikian surat keterangan ini dibuat dengan sebenar-benarnya dalam keadaan sadar dan untuk dipergunakan sebagaimana mestinya (${purpose}).`
    : `Demikian surat keterangan ini dibuat dengan sebenar-benarnya dalam keadaan sadar dan untuk dipergunakan sebagaimana mestinya.`;

  return (
    <PrintLayout submission={submission} hideRequesterSignature={true}>
      <p className="mt-2 text-justify leading-normal">
        Yang bertanda tangan di bawah ini Kepala Desa Sampeldes, Kecamatan
        Gandrungmangu, Kabupaten Cilacap, menerangkan dengan sebenarnya bahwa:
      </p>

      <table className="mt-2 border-collapse w-full">
        <tbody>
          <DataRow compact="tight" label="Nama Lengkap" value={name} />
          <DataRow compact="tight" label="NIK" value={nik} />
          <DataRow compact="tight" label="Jenis Kelamin" value={gender} />
          <DataRow compact="tight" label="Tempat/Tgl Lahir" value={formatTTL(birthPlace, birthDate)} />
          <DataRow compact="tight" label="Kewarganegaraan" value={nationality} />
          <DataRow compact="tight" label="Agama" value={religion} />
          <DataRow compact="tight" label="Pekerjaan" value={job} />
          <DataRow compact="tight" label="Alamat Domisili" value={address} />
        </tbody>
      </table>

      {/* Paragraf 1: Status Pokok Moyang / Kependudukan */}
      <p className="mt-3 text-justify leading-normal">
        {keteranganStatus}
      </p>

      {/* Paragraf 2: Keterangan Tambahan Sesuai Keperluan (Jika Ada) */}
      {keteranganTambahan && (
        <p className="mt-2 text-justify leading-normal">
          {keteranganTambahan}
        </p>
      )}

      {/* Paragraf Penutup */}
      <p className="mt-3 text-justify leading-normal">
        {closureText}
      </p>
    </PrintLayout>
  );
}

