'use client';
import { LetterSubmission } from '@/lib/types';
import { PrintLayout, DataRow, formatTTL } from './print-layout';

export function WaliPrintTemplate({ submission }: { submission: LetterSubmission }) {
  const { formData } = submission;
  const wali = (formData.wali as any) || {};
  const anak = (formData.anak as any) || {};

  const namaWali = wali.name || formData.nama_wali || formData.form_nama_wali || submission.requesterName || '-';
  const nikWali = wali.nik || formData.nik_wali || formData.form_nik_wali || submission.nik || '-';
  const ttlWali = formatTTL(wali.birthPlace || formData.tempat_lahir_wali, wali.birthDate || formData.tanggal_lahir_wali);
  const jenisKelaminWali = wali.gender || formData.jenis_kelamin_wali || 'Perempuan';
  const agamaWali = wali.religion || formData.agama_wali || 'Islam';
  const pekerjaanWali = wali.job || formData.pekerjaan_wali || 'Mengurus Rumah Tangga';
  const alamatWali = wali.address || formData.alamat_wali || '-';

  const namaAnak = anak.name || formData.nama_anak || formData.form_nama_anak || '-';
  const ttlAnak = formatTTL(anak.birthPlace || formData.tempat_lahir_anak, anak.birthDate || formData.tanggal_lahir_anak);
  const noKkAnak = anak.noKk || formData.no_kk_anak || formData.form_no_kk_anak || formData.noKk || '-';
  const nikAnak = anak.nik || formData.nik_anak || formData.form_nik_anak || '-';
  const ayahAnak = anak.fatherName || formData.nama_ayah_kandung || formData.form_nama_ayah_kandung || '-';
  const ibuAnak = anak.motherName || formData.nama_ibu_kandung || formData.form_nama_ibu_kandung || '-';
  const jenisKelaminAnak = anak.gender || formData.jenis_kelamin_anak || 'Perempuan';
  const agamaAnak = anak.religion || formData.agama_anak || 'Islam';
  const pekerjaanAnak = anak.job || formData.pekerjaan_anak || 'Pelajar';
  const sekolahAnak = anak.schoolName || formData.nama_sekolah || formData.form_nama_sekolah || '-';
  const kelasAnak = anak.grade || formData.kelas_anak || formData.form_kelas_anak || '-';
  const alamatAnak = anak.address || formData.alamat_anak || alamatWali;

  const purpose =
    formData.purpose ||
    formData.keperluan ||
    formData.form_keperluan ||
    (submission as any).purpose ||
    'Pengambilan/Pencairan Bantuan Program Indonesia Pintar (PIP)';

  return (
    <PrintLayout submission={submission}>
      <p className="mt-3 text-justify leading-normal">
        Yang bertandatangan di bawah ini Kepala Desa Sampeldes, Kecamatan
        Gandrungmangu, Kabupaten Cilacap menerangkan bahwa :
      </p>

      {/* Bagian I: Data Wali (Kepala Keluarga) */}
      <table className="mt-2 border-collapse w-full">
        <tbody>
          <DataRow compact="tight" label="Nama Kepala Keluarga" value={namaWali} />
          <DataRow compact="tight" label="Tempat Tanggal Lahir" value={ttlWali} />
          <DataRow compact="tight" label="NIK" value={nikWali} />
          <DataRow compact="tight" label="Jenis Kelamin" value={jenisKelaminWali} />
          <DataRow compact="tight" label="Agama" value={agamaWali} />
          <DataRow compact="tight" label="Pekerjaan Utama" value={pekerjaanWali} />
          <DataRow compact="tight" label="Alamat" value={alamatWali} />
        </tbody>
      </table>

      {/* Kalimat Penghubung */}
      <p className="mt-3 text-justify leading-normal">
        Berdasarkan data dan keterangan dari Ketua RT dan RW di wilayah tempat tinggalnya, serta
        sepengetahuan kami bahwa yang orang tersebut di atas adalah <strong>WALI</strong> dari :
      </p>

      {/* Bagian II: Data Siswa / Anak yang Diwakili */}
      <table className="mt-2 border-collapse w-full">
        <tbody>
          <DataRow compact="tight" label="Nama Siswa/Anak" value={namaAnak} />
          <DataRow compact="tight" label="Tempat Tanggal Lahir" value={ttlAnak} />
          <DataRow compact="tight" label="No. KK" value={noKkAnak} />
          <DataRow compact="tight" label="NIK" value={nikAnak} />
          <DataRow compact="tight" label="Nama Ayah Kandung" value={ayahAnak} />
          <DataRow compact="tight" label="Nama Ibu Kandung" value={ibuAnak} />
          <DataRow compact="tight" label="Jenis Kelamin" value={jenisKelaminAnak} />
          <DataRow compact="tight" label="Agama" value={agamaAnak} />
          <DataRow compact="tight" label="Pekerjaan Utama" value={pekerjaanAnak} />
          <DataRow compact="tight" label="Nama Sekolah" value={sekolahAnak} />
          <DataRow compact="tight" label="Kelas" value={kelasAnak} />
          <DataRow compact="tight" label="Alamat" value={alamatAnak} />
        </tbody>
      </table>

      {/* Kalimat Penutup */}
      <p className="mt-3 text-justify leading-normal">
        Demikian Surat Keterangan ini kami buat dengan sebenarnya dan akan di pergunakan untuk :{' '}
        <strong>{purpose}</strong>. Mohon kepada yang berkepentingan mengetahui dan menjadi maklum,
        Terima Kasih.
      </p>
    </PrintLayout>
  );
}

