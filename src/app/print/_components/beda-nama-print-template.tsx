'use client';

import { LetterSubmission } from '@/lib/types';
import { PrintLayout, DataRow, formatTTL, toProperCase, formatDateIndo, formatGender } from './print-layout';

export function BedaNamaPrintTemplate({ submission }: { submission: LetterSubmission }) {
  const { formData } = submission;

  const pages = [
    // ========================================================
    // LEMBAR I: SURAT KETERANGAN PERBEDAAN IDENTITAS DARI DESA
    // ========================================================
    {
      showKop: true,
      title: 'SURAT KETERANGAN BEDA IDENTITAS',
      subtitle: `Nomor : ${submission.documentNumber}`,
      content: (
        <div className="space-y-2.5 text-justify text-[11pt] leading-normal">
          <p className="mt-1 leading-relaxed">
            Yang bertanda tangan di bawah ini Kepala Desa Sampeldes, Kecamatan
            Gandrungmangu, Kabupaten Cilacap, menerangkan dengan sebenarnya bahwa:
          </p>

          <table className="border-collapse w-full">
            <tbody>
              <DataRow compact="tight" label="Nama Lengkap" value={formData.name} />
              <DataRow compact="tight" label="NIK" value={formData.nik} />
              <DataRow compact="tight" label="Jenis Kelamin" value={formatGender(formData.gender)} />
              <DataRow compact="tight" label="Tempat / Tgl Lahir" value={formatTTL(formData.birthPlace, formData.birthDate)} />
              <DataRow compact="tight" label="Pekerjaan" value={formData.job || 'Wiraswasta'} />
              <DataRow compact="tight" label="Alamat Tempat Tinggal" value={`${formData.address}, RT ${formData.rt || '00'}/RW ${formData.rw || '00'}, Desa Sampeldes`} />
            </tbody>
          </table>

          <p className="mt-2 text-justify leading-relaxed">
            Berdasarkan pemeriksaan berkas autentik dan keterangan yang bersangkutan, orang tersebut di atas memiliki perbedaan penulisan identitas antara dokumen:
          </p>

          {/* Tabel Pembanding Dokumen */}
          <div className="my-2 rounded border border-slate-900 overflow-hidden">
            <table className="w-full border-collapse text-[10.5pt]">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-900">
                  <th className="py-1 px-3 text-left w-1/2 border-r border-slate-900 font-bold uppercase text-[9.5pt]">
                    1. TERTULIS PADA: {formData.doc1Name || 'KARTU TANDA PENDUDUK (KTP)'}
                  </th>
                  <th className="py-1 px-3 text-left w-1/2 font-bold uppercase text-[9.5pt]">
                    2. TERTULIS PADA: {formData.doc2Name || 'IJAZAH / BUKU NIKAH / KK'}
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="p-2.5 border-r border-slate-900 align-top">
                    <p className="font-semibold text-slate-900 text-[11pt]">{formData.doc1Data || formData.name}</p>
                    {formData.doc1Number && (
                      <p className="text-[9pt] text-slate-600 mt-0.5 font-mono">No. Dokumen: {formData.doc1Number}</p>
                    )}
                  </td>
                  <td className="p-2.5 align-top">
                    <p className="font-semibold text-slate-900 text-[11pt]">{formData.doc2Data || formData.targetName || '-'}</p>
                    {formData.doc2Number && (
                      <p className="text-[9pt] text-slate-600 mt-0.5 font-mono">No. Dokumen: {formData.doc2Number}</p>
                    )}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <p className="mt-2 leading-relaxed">
            {formData.differenceDesc || 'Dengan ini kami tegaskan bahwa identitas/nama yang tertulis pada kedua dokumen tersebut di atas adalah benar-benar SATU ORANG YANG SAMA, yaitu warga penduduk Desa Sampeldes.'}
          </p>

          <p className="mt-1 leading-relaxed">
            Surat keterangan ini diterbitkan dan diberikan kepada yang bersangkutan untuk keperluan: <strong>{formData.purpose || 'Penyesuaian dan Sinkronisasi Dokumen Kependudukan'}</strong>.
          </p>

          <p className="mt-1 leading-relaxed">
            Demikian surat keterangan ini dibuat dengan sebenarnya dan penuh rasa tanggung jawab agar dapat dipergunakan sebagaimana mestinya.
          </p>
        </div>
      ),
      pageNumber: 1,
      totalPages: 2,
      showSignatures: true,
      inlineSignatures: true,
    },

    // ========================================================
    // LEMBAR II: LAMPIRAN SPTJM PERBEDAAN IDENTITAS BERMETERAI
    // ========================================================
    {
      showKop: false,
      title: 'SURAT PERNYATAAN TANGGUNG JAWAB MUTLAK (SPTJM)',
      subtitle: 'KEBENARAN PERBEDAAN IDENTITAS DOKUMEN KEPENDUDUKAN',
      content: (
        <div className="space-y-3 text-justify text-[10.5pt] leading-normal">
          <p className="leading-relaxed">
            Yang bertanda tangan di bawah ini :
          </p>

          <table className="border-collapse w-full">
            <tbody>
              <DataRow compact="tight" label="Nama Lengkap" value={formData.name} />
              <DataRow compact="tight" label="NIK" value={formData.nik} />
              <DataRow compact="tight" label="Tempat / Tgl Lahir" value={formatTTL(formData.birthPlace, formData.birthDate)} />
              <DataRow compact="tight" label="Pekerjaan" value={formData.job || 'Wiraswasta'} />
              <DataRow compact="tight" label="Alamat Tempat Tinggal" value={`${formData.address}, Desa Sampeldes, Kec. Gandrungmangu, Kab. Cilacap`} />
            </tbody>
          </table>

          <p className="mt-2 leading-relaxed">
            Dengan ini menyatakan dengan sesungguhnya di hadapan saksi-saksi bahwa:
          </p>

          <ol className="list-decimal pl-5 space-y-1 text-[10pt] leading-relaxed">
            <li>
              Nama/identitas yang tertulis pada <strong>{formData.doc1Name || 'Dokumen I'}</strong> ({formData.doc1Data || formData.name}) dan identitas yang tertulis pada <strong>{formData.doc2Name || 'Dokumen II'}</strong> ({formData.doc2Data || '-'}) adalah benar-benar <strong>SATU ORANG YANG SAMA</strong> yaitu diri saya pribadi.
            </li>
            <li>
              Perbedaan tersebut terjadi karena kekeliruan penulisan pada saat penerbitan dokumen terdahulu dan bukan karena adanya unsur pemalsuan identitas atau rekayasa data.
            </li>
            <li>
              Pernyataan ini dibuat sebagai dasar pemutakhiran data kependudukan dan saya bertanggung jawab mutlak atas segala akibat hukum yang timbul dari surat pernyataan ini.
            </li>
          </ol>

          <p className="mt-1 leading-relaxed text-[10pt]">
            Demikian Surat Pernyataan Tanggung Jawab Mutlak (SPTJM) ini saya buat dengan sadar di atas kertas bermeterai cukup tanpa ada paksaan dari pihak manapun.
          </p>

          {/* Area Tanda Tangan Saksi & Pemohon Bermeterai */}
          <div className="pt-4 grid grid-cols-3 text-center text-[9.5pt]">
            <div className="space-y-14">
              <p>Saksi I,</p>
              <div>
                <p className="font-bold underline uppercase">{formData.witness1Name || '...............................'}</p>
                <p className="text-[8pt] text-slate-500 font-mono">NIK: {formData.witness1Nik || '-'}</p>
              </div>
            </div>

            <div className="space-y-14">
              <p>Saksi II,</p>
              <div>
                <p className="font-bold underline uppercase">{formData.witness2Name || '...............................'}</p>
                <p className="text-[8pt] text-slate-500 font-mono">NIK: {formData.witness2Nik || '-'}</p>
              </div>
            </div>

            <div className="space-y-4">
              <p>Sampeldes, {formatDateIndo(formData.letterDate || new Date().toISOString())}</p>
              <div className="border border-dashed border-slate-400 py-3 px-2 w-28 mx-auto text-[7.5pt] text-slate-400 uppercase">
                Meterai<br />Rp 10.000
              </div>
              <p className="font-bold underline uppercase">{formData.name}</p>
            </div>
          </div>

          <div className="mt-3 text-center text-[9.5pt]">
            <p>Mengetahui,</p>
            <p className="font-semibold">Kepala Desa Sampeldes</p>
            <div className="h-10" />
            <p className="font-bold underline">TUKIMAN</p>
            <p className="text-[8pt] text-slate-500"></p>
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

