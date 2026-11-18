'use client';

import { LetterSubmission } from '@/lib/types';
import { PrintLayout, DataRow, formatTTL, formatDateIndo } from './print-layout';

export function SuratJalanPrintTemplate({ submission }: { submission: LetterSubmission }) {
  const { formData } = submission;

  const nama = (formData.name || submission.requesterName || '-').toUpperCase();
  const ttl = formatTTL(formData.birthPlace, formData.birthDate);
  const statusKawin = formData.maritalStatus || formData.statusPerkawinan || formData.status_kawin || 'Belum Kawin';
  const kerja = formData.job || formData.pekerjaan || '-';
  const agama = formData.religion || formData.agama || 'Islam';
  const tglBerangkat = formData.departureDate ? formatDateIndo(formData.departureDate) : (formData.tanggalBerangkat || '-');
  const alamatTujuan = formData.destinationAddress || formData.alamatYangDituju || formData.destinationCity || '-';
  const keperluan = formData.purpose || formData.keperluan || 'Bekerja';

  const pages = [
    {
      showKop: true,
      title: 'SURAT KETERANGAN JALAN/BERPERGIAN',
      subtitle: `Nomor : ${submission.documentNumber}`,
      content: (
        <div className="space-y-3 text-justify text-[11pt] leading-relaxed">
          <p className="mt-1 leading-normal">
            Yang bertanda tangan dibawah ini, Kami Kepala Desa Sampeldes, Kecamatan Gandrungmangu, Kabupaten Cilacap, menerangkan dengan sebenarnya bahwa :
          </p>

          <table className="border-collapse w-full">
            <tbody>
              <DataRow compact="tight" label="Nama" value={<strong>{nama}</strong>} />
              <DataRow compact="tight" label="Jenis Kelamin" value={formData.gender || '-'} />
              <DataRow compact="tight" label="Tempat Tgl Lahir" value={ttl} />
              <DataRow compact="tight" label="Status Perkawinan" value={statusKawin} />
              <DataRow compact="tight" label="Pekerjaan" value={kerja} />
              <DataRow compact="tight" label="Agama" value={agama} />
              <DataRow compact="tight" label="Alamat" value={formData.address} />
              <DataRow compact="tight" label="Tanggal Berangkat" value={tglBerangkat} />
              <DataRow compact="tight" label="Alamat Yang Dituju" value={alamatTujuan} />
              <DataRow compact="tight" label="Keperluan" value={keperluan} />
            </tbody>
          </table>

          <p className="mt-4 leading-relaxed">
            Demikian Surat Keterangan ini dibuat dengan sebenarnya dan agar dapat dipergunakan sebagaimana mestinya.
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

