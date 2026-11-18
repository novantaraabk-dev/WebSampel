'use client';

import { LetterSubmission } from '@/lib/types';
import { PrintLayout, DataRow, formatTTL, toProperCase, formatDateIndo } from './print-layout';

export function SppdPrintTemplate({ submission }: { submission: LetterSubmission }) {
  const { formData } = submission;

  const pages = [
    // ========================================================
    // LEMBAR I: SURAT PERINTAH TUGAS (SPT) PERJALANAN DINAS
    // ========================================================
    {
      showKop: true,
      title: 'SURAT PERINTAH TUGAS (SPT)',
      subtitle: `Nomor : ${submission.documentNumber}`,
      content: (
        <div className="space-y-3 text-justify text-[11pt] leading-normal">
          <p className="mt-1 leading-relaxed">
            Kepala Desa Sampeldes, Kecamatan Gandrungmangu, Kabupaten Cilacap, dengan ini memerintahkan kepada:
          </p>

          <table className="border-collapse w-full">
            <tbody>
              <DataRow compact="tight" label="Nama Pejabat / Pegawai" value={formData.officerName || formData.name} />
              <DataRow compact="tight" label="NIPD / NIK" value={formData.officerNip || formData.nik} />
              <DataRow compact="tight" label="Jabatan / Kedudukan" value={formData.officerPosition || formData.job || 'Perangkat Desa / Staf'} />
              <DataRow compact="tight" label="Instansi Unit Kerja" value="Pemerintah Desa Sampeldes" />
            </tbody>
          </table>

          <div className="my-2 border border-slate-900 p-2.5 rounded bg-slate-50 space-y-1 text-[10.5pt]">
            <p className="font-bold text-slate-900 uppercase text-[10pt] border-b pb-0.5">UNTUK MELAKSANAKAN TUGAS DINAS :</p>
            <table className="border-collapse w-full mt-1">
              <tbody>
                <DataRow compact="tight" label="Maksud Perjalanan Dinas" value={formData.dutyPurpose || formData.purpose || 'Menghadiri Rapat Koordinasi / Pelatihan / Urusan Kedinasan'} />
                <DataRow compact="tight" label="Tempat Berangkat" value="Kantor Desa Sampeldes" />
                <DataRow compact="tight" label="Tempat Tujuan Dinas" value={formData.destination || 'Kantor Kecamatan Gandrungmangu / OPD Kab. Cilacap'} />
                <DataRow compact="tight" label="Alat Angkutan" value={formData.transportation || 'Kendaraan Operasional / Pribadi'} />
                <DataRow compact="tight" label="Lamanya Perjalanan" value={`${formData.durationDays || '1'} Hari`} />
                <DataRow compact="tight" label="Tanggal Berangkat" value={formData.departureDate ? formatDateIndo(formData.departureDate) : formatDateIndo(new Date().toISOString())} />
                <DataRow compact="tight" label="Tanggal Kembali" value={formData.returnDate ? formatDateIndo(formData.returnDate) : formatDateIndo(new Date().toISOString())} />
                <DataRow compact="tight" label="Pembebanan Anggaran" value={formData.budgetSource || 'APBDes Sampeldes Tahun Anggaran Berjalan'} />
              </tbody>
            </table>
          </div>

          <p className="mt-2.5 leading-relaxed text-[10.5pt]">
            Demikian Surat Perintah Tugas ini dibuat untuk dilaksanakan dengan penuh rasa tanggung jawab, dan setelah selesai melaksanakan tugas agar melaporkan hasilnya secara tertulis kepada Kepala Desa.
          </p>
        </div>
      ),
      pageNumber: 1,
      totalPages: 2,
      showSignatures: true,
      inlineSignatures: true,
    },

    // ========================================================
    // LEMBAR II: LEMBAR VISUM PERJALANAN DINAS SPPD
    // ========================================================
    {
      showKop: false,
      title: 'LEMBAR VISUM PERJALANAN DINAS (SPPD)',
      subtitle: `LAMPIRAN SURAT PERINTAH TUGAS NOMOR : ${submission.documentNumber}`,
      content: (
        <div className="space-y-2 text-[9.5pt] leading-tight">
          <p className="text-[9pt] italic mb-1">
            Lembar catatan stempel dan paraf pejabat instansi yang dikunjungi / tempat tujuan perjalanan dinas:
          </p>

          <table className="w-full border-collapse border border-black text-[9pt]">
            <tbody>
              {/* Kolom I */}
              <tr>
                <td className="border border-black p-2 w-1/2 align-top">
                  <p className="font-bold">I. Berangkat dari: Desa Sampeldes</p>
                  <p>Pada Tanggal: {formData.departureDate ? formatDateIndo(formData.departureDate) : formatDateIndo(new Date().toISOString())}</p>
                  <p>Ke: {formData.destination || 'Tujuan Dinas'}</p>
                  <div className="mt-3 text-center">
                    <p className="font-semibold">Kepala Desa Sampeldes</p>
                    <div className="h-10" />
                    <p className="font-bold underline">TUKIMAN</p>
                  </div>
                </td>
                <td className="border border-black p-2 w-1/2 align-top">
                  <p className="font-bold">II. Tiba di: {formData.destination || 'Tempat Tujuan'}</p>
                  <p>Pada Tanggal: .......................................</p>
                  <p>Kepala Instansi / Pejabat Tujuan:</p>
                  <div className="h-10 text-center text-slate-400 pt-2">(Stempel & Tanda Tangan)</div>
                  <p className="text-center font-bold underline">...................................................</p>
                </td>
              </tr>

              {/* Kolom II */}
              <tr>
                <td className="border border-black p-2 w-1/2 align-top">
                  <p className="font-bold">III. Berangkat dari: {formData.destination || 'Tempat Tujuan'}</p>
                  <p>Pada Tanggal: .......................................</p>
                  <p>Ke: Desa Sampeldes</p>
                  <div className="h-10 text-center text-slate-400 pt-2">(Stempel & Tanda Tangan)</div>
                  <p className="text-center font-bold underline">...................................................</p>
                </td>
                <td className="border border-black p-2 w-1/2 align-top">
                  <p className="font-bold">IV. Tiba kembali di: Desa Sampeldes</p>
                  <p>Pada Tanggal: {formData.returnDate ? formatDateIndo(formData.returnDate) : formatDateIndo(new Date().toISOString())}</p>
                  <div className="mt-3 text-center">
                    <p className="font-semibold">Kepala Desa Sampeldes</p>
                    <div className="h-10" />
                    <p className="font-bold underline">TUKIMAN</p>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>

          <div className="mt-3 p-2 border border-black text-[9pt]">
            <p className="font-bold">V. CATATAN / PENGESAHAN PEJABAT PENGELOLA KEUANGAN DESA (PPKD):</p>
            <p className="mt-0.5">
              Telah diperiksa bahwa perjalanan dinas tersebut benar-benar dilaksanakan atas perintah pejabat yang berwenang dan semata-mata untuk kepentingan dinas pemerintahan desa.
            </p>
          </div>

          <div className="mt-4 grid grid-cols-2 text-center text-[10pt]">
            <div>
              <p>Pejabat Pelaksana Teknis,</p>
              <div className="h-12" />
              <p className="font-bold underline">{toProperCase(formData.officerName || formData.name)}</p>
            </div>
            <div>
              <p>Kepala Desa Sampeldes,</p>
              <div className="h-12" />
              <p className="font-bold underline">TUKIMAN</p>
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

