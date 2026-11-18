'use client';

import { LetterSubmission } from '@/lib/types';
import { PrintLayout, DataRow, formatTTL } from './print-layout';

export function DomisiliUsahaPrintTemplate({ submission }: { submission: LetterSubmission }) {
  const { formData } = submission;

  const pages = [
    {
      showKop: true,
      title: 'SURAT KETERANGAN DOMISILI USAHA',
      subtitle: `Nomor : ${submission.documentNumber}`,
      content: (
        <div className="space-y-2 text-justify text-[11pt] leading-snug">
          <p className="mt-1 leading-normal">
            Pemerintah Desa Sampeldes, Kecamatan Gandrungmangu, Kabupaten Cilacap, dengan ini menerangkan dengan sebenarnya bahwa:
          </p>

          <table className="border-collapse w-full">
            <tbody>
              <DataRow compact="tight" label="Nama Penanggung Jawab" value={formData.name} />
              <DataRow compact="tight" label="NIK" value={formData.nik} />
              <DataRow compact="tight" label="Tempat / Tgl Lahir" value={formatTTL(formData.birthPlace, formData.birthDate)} />
              <DataRow compact="tight" label="Jenis Kelamin / Agama" value={`${formData.gender || '-'} / ${formData.religion || 'Islam'}`} />
              <DataRow compact="tight" label="Pekerjaan" value={formData.job || '-'} />
              <DataRow compact="tight" label="Alamat Tinggal" value={formData.address} />
            </tbody>
          </table>

          <p className="mt-2 leading-normal">
            Adalah benar Penanggung Jawab / Pemilik usaha yang berdomisili dan menjalankan kegiatan usaha di wilayah Desa Sampeldes dengan data usaha sebagai berikut:
          </p>

          <table className="border-collapse w-full">
            <tbody>
              <DataRow compact="tight" label="Nama Usaha / Perusahaan" value={<strong>{formData.businessName}</strong>} />
              <DataRow compact="tight" label="Bidang / Jenis Usaha" value={formData.businessType} />
              <DataRow compact="tight" label="Nomor NIB / Izin" value={formData.nibNumber || '-'} />
              <DataRow compact="tight" label="Alamat Lokasi Usaha" value={formData.businessAddress} />
              <DataRow compact="tight" label="Tahun Berdiri" value={formData.establishmentYear || '-'} />
              <DataRow compact="tight" label="Jumlah Tenaga Kerja" value={formData.employeeCount || '-'} />
              <DataRow compact="tight" label="Status Bangunan Usaha" value={formData.buildingStatus || 'Milik Sendiri'} />
            </tbody>
          </table>

          <p className="mt-2.5 leading-relaxed">
            Sepanjang pengamatan dan catatan Pemerintah Desa Sampeldes, usaha tersebut di atas benar-benar ada, aktif beroperasi, tidak bertentangan dengan ketertiban umum atau norma susila, serta tidak sedang tersangkut permasalahan hukum.
          </p>

          <p className="mt-2 leading-relaxed">
            Surat keterangan domisili usaha ini diberikan atas permintaan yang bersangkutan untuk keperluan: <strong>{formData.purpose || 'Persyaratan Administrasi Legalitas Usaha & Perbankan'}</strong>, dan berlaku selama 6 (enam) bulan terhitung sejak tanggal diterbitkan.
          </p>

          <p className="mt-2 leading-relaxed">
            Demikian surat keterangan ini dibuat dengan sebenarnya agar dapat dipergunakan sebagaimana mestinya.
          </p>
        </div>
      ),
      signatures: {
        signerTitle: 'Kepala Desa Sampeldes',
        signerName: 'H. MUKHLISIN',
      },
    },
  ];

  return <PrintLayout submission={submission} pages={pages} />;
}

