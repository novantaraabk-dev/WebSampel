'use client';

import { LetterSubmission } from '@/lib/types';
import { PrintLayout, DataRow, formatTTL } from './print-layout';

export function KepemilikanTanahPrintTemplate({ submission }: { submission: LetterSubmission }) {
  const { formData } = submission;

  const pages = [
    {
      showKop: true,
      title: 'SURAT KETERANGAN KEPEMILIKAN TANAH',
      subtitle: `Nomor : ${submission.documentNumber}`,
      content: (
        <div className="space-y-2 text-justify text-[11pt] leading-snug">
          <p className="mt-1 leading-normal">
            Pemerintah Desa Sampeldes, Kecamatan Gandrungmangu, Kabupaten Cilacap, dengan ini menerangkan dengan sebenarnya bahwa:
          </p>

          <table className="border-collapse w-full">
            <tbody>
              <DataRow compact="tight" label="Nama Lengkap" value={formData.name} />
              <DataRow compact="tight" label="NIK" value={formData.nik} />
              <DataRow compact="tight" label="Tempat / Tgl Lahir" value={formatTTL(formData.birthPlace, formData.birthDate)} />
              <DataRow compact="tight" label="Jenis Kelamin / Agama" value={`${formData.gender || '-'} / ${formData.religion || 'Islam'}`} />
              <DataRow compact="tight" label="Pekerjaan" value={formData.job || '-'} />
              <DataRow compact="tight" label="Alamat Tempat Tinggal" value={formData.address} />
            </tbody>
          </table>

          <p className="mt-2.5 leading-normal">
            Berdasarkan Buku Register Catatan Tanah (Letter C) Desa Sampeldes, orang tersebut di atas benar-benar memiliki / menguasai sebidang tanah dengan rincian data sebagai berikut:
          </p>

          <table className="border-collapse w-full">
            <tbody>
              <DataRow compact="tight" label="Nomor Buku C / Kohir" value={formData.letterCNumber} />
              <DataRow compact="tight" label="Nomor Persil / Kelas" value={`${formData.persilNumber} / Kelas ${formData.landClass || 'D.I'}`} />
              <DataRow compact="tight" label="Atas Nama Terdaftar" value={formData.registeredOwner || formData.name} />
              <DataRow compact="tight" label="Luas Bidang Tanah" value={formData.landArea} />
              <DataRow compact="tight" label="Letak / Lokasi Tanah" value={`${formData.landLocation}, Desa Sampeldes, Kec. Gandrungmangu, Kab. Cilacap`} />
              <DataRow compact="tight" label="Peruntukan / Penggunaan" value={formData.landUsage || 'Pekarangan & Rumah Tinggal'} />
              <tr>
                <td colSpan={3} className="pt-2 font-bold text-slate-900 uppercase text-[10pt] border-b pb-0.5">
                  DENGAN BATAS-BATAS BIDANG TANAH :
                </td>
              </tr>
              <DataRow compact="tight" label="Sebelah UTARA" value={formData.northBorder} />
              <DataRow compact="tight" label="Sebelah TIMUR" value={formData.eastBorder} />
              <DataRow compact="tight" label="Sebelah SELATAN" value={formData.southBorder} />
              <DataRow compact="tight" label="Sebelah BARAT" value={formData.westBorder} />
            </tbody>
          </table>

          <p className="mt-2 leading-relaxed">
            Riwayat perolehan tanah tersebut adalah {formData.acquisitionHistory || 'diperoleh secara sah dan dikuasai sampai saat ini'}. Sampai surat keterangan ini diterbitkan, tanah tersebut tidak dalam keadaan sengketa hak, tidak sedang dijadikan agunan/jaminan pada pihak manapun, serta bebas dari sitaan peradilan.
          </p>

          <p className="mt-2 leading-relaxed">
            Surat keterangan ini diterbitkan atas permohonan yang bersangkutan guna keperluan: <strong>{formData.purpose || 'Persyaratan Pendaftaran Tanah / Sertifikat Hak Milik'}</strong>.
          </p>

          <p className="mt-2 leading-relaxed">
            Demikian surat keterangan kepemilikan tanah ini dibuat dengan sebenarnya agar dapat dipergunakan sebagaimana mestinya oleh pihak yang berkepentingan.
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

