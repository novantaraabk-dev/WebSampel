'use client';
import { LetterSubmission } from '@/lib/types';
import { PrintLayout, DataRow, formatTTL, formatFullDate } from './print-layout';

export function PemakamanPrintTemplate({ submission }: { submission: LetterSubmission }) {
  const { formData } = submission;

  const deathDateStr = formData.hari_dan_tanggal_kematian || formatFullDate(formData.deathDate);
  const burialDateStr = formData.hari_dan_tanggal_pemakaman || formatFullDate(formData.burialDate || formData.deathDate);

  return (
    <PrintLayout submission={submission} hideRequesterSignature={true}>
      <p className="mt-2 text-justify leading-normal">
        Yang bertanda tangan di bawah ini Kepala Desa Sampeldes, menerangkan bahwa :
      </p>

      <table className="mt-2 border-collapse w-full">
        <tbody>
          <DataRow compact="tight" label="Nama" value={formData.name} />
          <DataRow compact="tight" label="Tempat Tanggal Lahir" value={formatTTL(formData.birthPlace, formData.birthDate)} />
          <DataRow compact="tight" label="Jenis Kelamin" value={formData.gender} />
          <DataRow compact="tight" label="Alamat" value={formData.address} />
          <DataRow compact="tight" label="Agama" value={formData.religion || 'Islam'} />
          <DataRow compact="tight" label="Pekerjaan" value={formData.job || 'Pensiunan'} />
          <DataRow compact="tight" label="Nomor KK" value={formData.noKk || formData.no_kk || '-'} />
          <DataRow compact="tight" label="Nomor NIK" value={formData.nik} />
        </tbody>
      </table>

      <p className="mt-3 text-justify leading-normal font-bold">
        Bahwa orang tersebut di atas adalah benar telah Meninggal Dunia :
      </p>

      <table className="mt-2 border-collapse w-full">
        <tbody>
          <DataRow compact="tight" label="Hari & Tanggal" value={deathDateStr} />
          <DataRow compact="tight" label="Waktu Meninggal" value={formData.deathTime || '09.00 WIB'} />
          <DataRow compact="tight" label="Dimakamkan pada" value={burialDateStr} />
          <DataRow compact="tight" label="Waktu Pemakaman" value={formData.burialTime || formData.jam_pemakaman || '13.00 WIB'} />
          <DataRow compact="tight" label="Tempat" value={formData.burialLocation || formData.tempat_pemakaman || 'Pemakaman Islam Desa Sampeldes'} />
        </tbody>
      </table>

      <p className="mt-4 text-justify leading-normal">
        Demikian Surat Keterangan ini diterbitkan agar digunakan sebagaimana mestinya.
      </p>
    </PrintLayout>
  );
}

