'use client';

import { LetterSubmission } from '@/lib/types';
import { PrintLayout, DataRow, formatTTL, toProperCase, formatDateIndo } from './print-layout';

export function DuplikatNikahPrintTemplate({ submission }: { submission: LetterSubmission }) {
  const { formData } = submission;

  const pages = [
    // ========================================================
    // LEMBAR I: SURAT PENGANTAR REKOMENDASI KE KUA
    // ========================================================
    {
      showKop: true,
      title: 'SURAT PENGANTAR PERMOHONAN DUPLIKAT BUKU NIKAH',
      subtitle: `Nomor : ${submission.documentNumber}`,
      content: (
        <div className="space-y-3 text-justify text-[11pt] leading-normal">
          <div className="mb-2 text-right text-[11pt]">
            <p>Kepada Yth.</p>
            <p className="font-semibold">Kepala Kantor Urusan Agama (KUA) Kec. Gandrungmangu</p>
            <p>di - <span className="underline">Tempat</span></p>
          </div>

          <p className="leading-relaxed">
            Yang bertanda tangan di bawah ini Kepala Desa Sampeldes, Kecamatan Gandrungmangu, Kabupaten Cilacap, menerangkan dengan sebenarnya bahwa:
          </p>

          <table className="border-collapse w-full">
            <tbody>
              <DataRow compact="tight" label="Nama Suami" value={formData.husbandName || formData.name} />
              <DataRow compact="tight" label="NIK Suami" value={formData.husbandNik || formData.nik} />
              <DataRow compact="tight" label="Nama Istri" value={formData.wifeName || formData.spouseName} />
              <DataRow compact="tight" label="NIK Istri" value={formData.wifeNik || formData.spouseNik || '-'} />
              <DataRow compact="tight" label="Alamat Tempat Tinggal" value={formData.address} />
              <DataRow compact="tight" label="Tanggal Pernikahan Terdahulu" value={formData.weddingDate ? formatDateIndo(formData.weddingDate) : (formData.marriageDate || '-')} />
              <DataRow compact="tight" label="KUA Tempat Menikah" value={formData.kuaName || 'KUA Kecamatan Gandrungmangu'} />
              <DataRow compact="tight" label="Nomor Akta Nikah / Seri Buku" value={formData.marriageBookNumber || formData.docNumber || '-'} />
            </tbody>
          </table>

          <p className="mt-2.5 leading-relaxed">
            Pasangan suami-istri tersebut di atas benar-benar penduduk Desa Sampeldes yang telah menikah sah. Berdasarkan laporan yang bersangkutan, Buku Nikah asli milik yang bersangkutan saat ini dalam keadaan <strong>{formData.reason || 'Hilang / Rusak / Terbakar'}</strong>, sehingga mengajukan permohonan penerbitan Duplikat Buku Nikah.
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
    // LEMBAR II: LAMPIRAN SURAT PERNYATAAN BERMETERAI
    // ========================================================
    {
      showKop: false,
      title: 'SURAT PERNYATAAN KEHILANGAN / KERUSAKAN BUKU NIKAH',
      subtitle: 'LAMPIRAN PERMOHONAN DUPLIKAT BUKU NIKAH KUA',
      content: (
        <div className="space-y-3 text-justify text-[11pt] leading-normal">
          <p className="leading-relaxed">
            Yang bertanda tangan di bawah ini saya pemohon:
          </p>

          <table className="border-collapse w-full">
            <tbody>
              <DataRow compact="tight" label="Nama Lengkap" value={formData.name} />
              <DataRow compact="tight" label="NIK" value={formData.nik} />
              <DataRow compact="tight" label="Pekerjaan" value={formData.job} />
              <DataRow compact="tight" label="Alamat" value={formData.address} />
            </tbody>
          </table>

          <p className="mt-2 leading-relaxed">
            Dengan ini menyatakan dengan sebenarnya bahwa Buku Nikah pernikahan saya dengan <strong>{toProperCase(formData.spouseName || formData.wifeName || formData.husbandName || 'Pasangan')}</strong> telah:
          </p>

          <div className="border border-slate-900 p-2.5 rounded bg-slate-50 font-medium text-slate-900">
            {formData.lostDescription || formData.reason || 'Hilang / tidak dapat ditemukan kembali di tempat penyimpanan dan telah dilaporkan ke pihak berwajib (Polsek Gandrungmangu). Buku nikah tersebut benar-benar tidak sedang dijadikan jaminan hutang / agunan pada pihak manapun.'}
          </div>

          <p className="mt-2.5 leading-relaxed text-[10.5pt]">
            Surat pernyataan ini saya buat dengan sadar dan penuh rasa tanggung jawab. Apabila di kemudian hari ternyata keterangan saya ini tidak benar atau ditemukan adanya pemalsuan, saya bersedia dituntut sesuai dengan hukum pidana yang berlaku.
          </p>

          <div className="mt-6 grid grid-cols-2 text-center text-[10.5pt]">
            <div>
              <p>Mengetahui,</p>
              <p className="font-semibold mb-2">Kepala Desa Sampeldes</p>
              <div className="h-14" />
              <p className="font-bold underline">TUKIMAN</p>
              <p className="text-xs text-slate-600"></p>
            </div>
            <div>
              <p>Sampeldes, {formatDateIndo(formData.letterDate || new Date().toISOString())}</p>
              <p className="mb-2">Yang Membuat Pernyataan,</p>
              <div className="h-2" />
              <span className="text-[8.5pt] border border-dashed border-slate-400 px-2 py-0.5 text-slate-500 font-mono">
                Meterai Rp 10.000
              </span>
              <div className="h-2" />
              <p className="font-bold underline">{toProperCase(formData.name)}</p>
            </div>
          </div>
        </div>
      ),
      pageNumber: 2,
      totalPages: 2,
      showSignatures: false,
    },
  ];

  return <PrintLayout submission={submission} fontSize="12pt" pages={pages} />;
}

