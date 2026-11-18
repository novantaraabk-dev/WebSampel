'use client';

import { LetterSubmission } from '@/lib/types';
import { PrintLayout, DataRow, formatTTL } from './print-layout';

export function PenghasilanPrintTemplate({ submission }: { submission: LetterSubmission }) {
  const { formData } = submission;
  const hasSeparatedParents = Boolean(formData.fatherName && formData.motherName);

  return (
    <PrintLayout
      submission={submission}
      fontSize="11pt"
      inlineSignatures={true}
    >
      <p className="mt-2 text-justify leading-normal">
        Yang bertanda tangan di bawah ini Kepala Desa Sampeldes, Kecamatan
        Gandrungmangu, Kabupaten Cilacap, menerangkan dengan sebenarnya bahwa:
      </p>

      {/* DATA SISWA / MAHASISWA */}
      <table className="mt-2 border-collapse w-full">
        <tbody>
          <tr>
            <td colSpan={3} className="font-bold text-slate-900 border-b pb-1 text-[10.5pt] uppercase tracking-wide">
              I. IDENTITAS SISWA / MAHASISWA
            </td>
          </tr>
          <DataRow compact="tight" label="Nama Siswa/Mhs" value={formData.childName || formData.name} />
          <DataRow compact="tight" label="NIK" value={formData.childNik || formData.nik || '-'} />
          <DataRow compact="tight" label="Tempat / Tgl Lahir" value={formatTTL(formData.childBirthPlace || formData.birthPlace, formData.childBirthDate || formData.birthDate)} />
          <DataRow compact="tight" label="Jenis Kelamin" value={formData.childGender || formData.gender || '-'} />
          <DataRow compact="tight" label="Sekolah / Perguruan Tinggi" value={formData.schoolName || '-'} />
          {formData.childNis && formData.childNis !== '-' && (
            <DataRow compact="tight" label="NISN / NIM" value={formData.childNis} />
          )}
          {formData.childMajor && formData.childMajor !== '-' && (
            <DataRow compact="tight" label="Jurusan / Prodi" value={formData.childMajor} />
          )}
          {formData.childClass && formData.childClass !== '-' && (
            <DataRow compact="tight" label="Kelas / Semester" value={formData.childClass} />
          )}
          <DataRow compact="tight" label="Alamat" value={formData.childAddress || formData.address} />

          {/* DATA ORANG TUA */}
          {hasSeparatedParents ? (
            <>
              <tr>
                <td colSpan={3} className="pt-2.5 font-bold text-slate-900 border-b pb-1 text-[10.5pt] uppercase tracking-wide">
                  II. IDENTITAS ORANG TUA (AYAH & IBU)
                </td>
              </tr>
              <DataRow compact="tight" label="Nama Ayah" value={formData.fatherName} />
              <DataRow compact="tight" label="NIK Ayah" value={formData.fatherNik} />
              <DataRow compact="tight" label="Pekerjaan Ayah" value={formData.fatherJob} />
              <DataRow compact="tight" label="Penghasilan Ayah" value={formData.fatherIncome} />

              <DataRow compact="tight" label="Nama Ibu" value={formData.motherName} />
              <DataRow compact="tight" label="NIK Ibu" value={formData.motherNik} />
              <DataRow compact="tight" label="Pekerjaan Ibu" value={formData.motherJob} />
              <DataRow compact="tight" label="Penghasilan Ibu" value={formData.motherIncome} />
            </>
          ) : (
            <>
              <tr>
                <td colSpan={3} className="pt-2.5 font-bold text-slate-900 border-b pb-1 text-[10.5pt] uppercase tracking-wide">
                  II. IDENTITAS ORANG TUA / WALI
                </td>
              </tr>
              <DataRow compact="tight" label="Nama Orang Tua" value={formData.name} />
              <DataRow compact="tight" label="NIK Orang Tua" value={formData.nik} />
              <DataRow compact="tight" label="Pekerjaan" value={formData.job} />
              <DataRow compact="tight" label="Alamat" value={formData.address} />
              <DataRow compact="tight" label="Penghasilan / Bulan" value={formData.monthlyIncome} />
            </>
          )}

          {/* FINANSIAL & TANGGUNGAN */}
          <tr>
            <td colSpan={3} className="pt-2.5 font-bold text-slate-900 border-b pb-1 text-[10.5pt] uppercase tracking-wide">
              III. TOTAL PENGHASILAN & TANGGUNGAN
            </td>
          </tr>
          <DataRow compact="tight" label="Total Penghasilan Gabungan" value={formData.totalIncome || formData.monthlyIncome} />
          <DataRow compact="tight" label="Jumlah Tanggungan Keluarga" value={formData.dependentsCount ? `${formData.dependentsCount} Orang` : '-'} />
        </tbody>
      </table>

      <p className="mt-2.5 text-justify leading-relaxed text-[11pt]">
        Berdasarkan data kependudukan dan surat pernyataan yang bersangkutan, nama tersebut di atas adalah benar warga Desa Sampeldes dengan kondisi penghasilan orang tua rata-rata per bulan sebagaimana tercantum di atas.
      </p>

      <p className="mt-1.5 text-justify leading-relaxed text-[11pt]">
        Surat keterangan ini dibuat dan diberikan untuk keperluan : <strong>{formData.purpose}</strong>.
      </p>

      <p className="mt-2 text-justify leading-relaxed text-[11pt]">
        Demikian surat keterangan penghasilan orang tua ini dibuat dengan sebenarnya agar dapat dipergunakan sebagaimana mestinya.
      </p>
    </PrintLayout>
  );
}

