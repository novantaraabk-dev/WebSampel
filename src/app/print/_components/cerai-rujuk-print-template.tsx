'use client';

import { LetterSubmission } from '@/lib/types';
import { PrintLayout, DataRow, formatTTL, toProperCase, formatDateIndo } from './print-layout';

export function CeraiRujukPrintTemplate({ submission }: { submission: LetterSubmission }) {
  const { formData } = submission;
  const isRujuk = submission.letterType?.toLowerCase().includes('rujuk');
  const actionTitle = isRujuk ? 'PENDAFTARAN RUJUK' : 'PERMOHONAN / GUGATAN CERAI';

  const pages = [
    // ========================================================
    // LEMBAR I: SURAT PENGANTAR DESA KE PENGADILAN AGAMA
    // ========================================================
    {
      showKop: true,
      title: `SURAT PENGANTAR ${actionTitle}`,
      subtitle: `Nomor : ${submission.documentNumber}`,
      content: (
        <div className="space-y-3 text-justify text-[11pt] leading-normal">
          <div className="mb-2 text-right text-[11pt]">
            <p>Kepada Yth.</p>
            <p className="font-semibold">Ketua Pengadilan Agama Cilacap</p>
            <p>di - <span className="underline">Tempat</span></p>
          </div>

          <p className="leading-relaxed">
            Yang bertanda tangan di bawah ini Kepala Desa Sampeldes, Kecamatan Gandrungmangu, Kabupaten Cilacap, menerangkan dengan sebenarnya bahwa:
          </p>

          <table className="border-collapse w-full">
            <tbody>
              <DataRow compact="tight" label="Nama Lengkap" value={formData.name} />
              <DataRow compact="tight" label="NIK" value={formData.nik} />
              <DataRow compact="tight" label="Tempat / Tgl Lahir" value={formatTTL(formData.birthPlace, formData.birthDate)} />
              <DataRow compact="tight" label="Agama / Pekerjaan" value={`${formData.religion || 'Islam'} / ${formData.job || '-'}`} />
              <DataRow compact="tight" label="Alamat Tempat Tinggal" value={formData.address} />
            </tbody>
          </table>

          <p className="mt-2 leading-relaxed">
            Adalah benar-benar penduduk Desa Sampeldes yang terikat perkawinan sah dengan:
          </p>

          <table className="border-collapse w-full">
            <tbody>
              <DataRow compact="tight" label="Nama Pasangan (Suami/Istri)" value={formData.spouseName} />
              <DataRow compact="tight" label="NIK Pasangan" value={formData.spouseNik || '-'} />
              <DataRow compact="tight" label="Alamat Pasangan" value={formData.spouseAddress || '-'} />
              <DataRow compact="tight" label="Nomor / Tanggal Buku Nikah" value={formData.marriageBookNumber || formData.docNumber || '-'} />
            </tbody>
          </table>

          <p className="mt-2.5 leading-relaxed">
            Berdasarkan pemeriksaan dan upaya mediasi yang telah dilakukan oleh pihak Pemerintah Desa dan keluarga, yang bersangkutan bermaksud mengajukan perkara {actionTitle} ke Pengadilan Agama dikarenakan perselisihan rumah tangga yang tidak dapat didamaikan kembali.
          </p>

          <p className="mt-2 leading-relaxed">
            Demikian surat pengantar ini dibuat dengan sebenarnya agar dapat dipergunakan sebagai kelengkapan pendaftaran perkara di Pengadilan Agama Cilacap.
          </p>
        </div>
      ),
      pageNumber: 1,
      totalPages: 2,
      showSignatures: true,
      inlineSignatures: true,
    },

    // ========================================================
    // LEMBAR II: LAMPIRAN SURAT PERNYATAAN DUDUK PERKARA
    // ========================================================
    {
      showKop: false,
      title: 'SURAT PERNYATAAN DUDUK PERKARA RUMAH TANGGA',
      subtitle: 'LAMPIRAN PERMOHONAN CERAI / RUJUK',
      content: (
        <div className="space-y-3 text-justify text-[11pt] leading-normal">
          <p className="leading-relaxed">
            Yang bertanda tangan di bawah ini saya pemohon:
          </p>

          <table className="border-collapse w-full">
            <tbody>
              <DataRow compact="tight" label="Nama Lengkap" value={formData.name} />
              <DataRow compact="tight" label="NIK" value={formData.nik} />
              <DataRow compact="tight" label="Alamat Tempat Tinggal" value={formData.address} />
            </tbody>
          </table>

          <p className="mt-2 leading-relaxed">
            Menyatakan dengan sesungguhnya bahwa alasan pengajuan permohonan / gugatan perceraian terhadap pasangan saya adalah sebagai berikut:
          </p>

          <div className="border border-slate-900 p-2.5 rounded bg-slate-50 font-medium text-slate-900 leading-relaxed text-[10.5pt]">
            {formData.divorceReason || formData.reason || '1. Antara pemohon dan termohon terus menerus terjadi perselisihan dan pertengkaran dan tidak ada harapan akan hidup rukun lagi dalam rumah tangga.\n2. Telah pisah tempat tinggal dan tidak saling menjalankan kewajiban lahir dan batin.'}
          </div>

          <p className="mt-2.5 leading-relaxed text-[10.5pt]">
            Upaya musyawarah dan mediasi oleh pihak keluarga serta tokoh masyarakat telah dilakukan namun tidak membuahkan hasil. Surat pernyataan ini saya buat dengan sebenarnya untuk melengkapi berkas pendaftaran di Pengadilan Agama.
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
              <p className="mb-2">Pemohon / Penggugat,</p>
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

