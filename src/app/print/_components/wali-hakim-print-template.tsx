'use client';

import { LetterSubmission } from '@/lib/types';
import { PrintLayout, DataRow, formatTTL, toProperCase, formatDateIndo } from './print-layout';

export function WaliHakimPrintTemplate({ submission }: { submission: LetterSubmission }) {
  const { formData } = submission;

  const pages = [
    // ========================================================
    // LEMBAR I: SURAT PENGANTAR REKOMENDASI WALI HAKIM
    // ========================================================
    {
      showKop: true,
      title: 'SURAT PENGANTAR PERMOHONAN WALI HAKIM',
      subtitle: `Nomor : ${submission.documentNumber}`,
      content: (
        <div className="space-y-3 text-justify text-[11pt] leading-relaxed">
          <div className="mb-2 text-right text-[11pt]">
            <p>Kepada Yth.</p>
            <p className="font-semibold">Kepala Kantor Urusan Agama (KUA) Kec. Gandrungmangu</p>
            <p>di - <span className="underline">Tempat</span></p>
          </div>

          <p className="leading-normal">
            Yang bertanda tangan di bawah ini Kepala Desa Sampeldes, Kecamatan Gandrungmangu, Kabupaten Cilacap, menerangkan bahwa:
          </p>

          <table className="border-collapse w-full">
            <tbody>
              <DataRow compact="tight" label="Nama Lengkap" value={formData.name} />
              <DataRow compact="tight" label="NIK" value={formData.nik} />
              <DataRow compact="tight" label="Jenis Kelamin" value={formData.gender || 'Perempuan'} />
              <DataRow compact="tight" label="Tempat / Tgl Lahir" value={formatTTL(formData.birthPlace, formData.birthDate)} />
              <DataRow compact="tight" label="Agama / Pekerjaan" value={`${formData.religion || 'Islam'} / ${formData.job || '-'}`} />
              <DataRow compact="tight" label="Alamat Tempat Tinggal" value={formData.address} />
            </tbody>
          </table>

          <p className="mt-2.5 leading-normal">
            Akan melangsungkan akad pernikahan dengan seorang laki-laki:
          </p>

          <table className="border-collapse w-full">
            <tbody>
              <DataRow compact="tight" label="Nama Calon Suami" value={formData.groomName || formData.spouseName} />
              <DataRow compact="tight" label="NIK Calon Suami" value={formData.groomNik || formData.spouseNik || '-'} />
              <DataRow compact="tight" label="Tempat / Tgl Lahir" value={formatTTL(formData.groomBirthPlace || formData.spouseBirthPlace, formData.groomBirthDate || formData.spouseBirthDate)} />
              <DataRow compact="tight" label="Alamat Calon Suami" value={formData.groomAddress || formData.spouseAddress || '-'} />
            </tbody>
          </table>

          <p className="mt-2 leading-relaxed">
            Berhubung calon pengantin wanita tersebut di atas tidak mempunyai wali nasab / wali nasab berhalangan menurut hukum syariat Islam dikarenakan: <strong>{formData.waliReason || 'Wali nasab telah meninggal dunia / tidak ada hubungan nasab / mafqud'}</strong>, maka kami mohon kiranya Bapak Kepala KUA berkenan menjadi <strong>WALI HAKIM</strong> dalam pernikahan yang bersangkutan.
          </p>

          <p className="mt-2 leading-relaxed">
            Demikian surat permohonan ini dibuat dengan sebenarnya agar dapat dipergunakan sebagaimana mestinya.
          </p>
        </div>
      ),
      pageNumber: 1,
      totalPages: 2,
      showSignatures: true,
      inlineSignatures: true,
    },

    // ========================================================
    // LEMBAR II: LAMPIRAN SURAT PERNYATAAN SEBAB WALI HAKIM
    // ========================================================
    {
      showKop: false,
      title: 'SURAT PERNYATAAN SEBAB WALI HAKIM',
      subtitle: 'LAMPIRAN PERMOHONAN WALI HAKIM KUA',
      content: (
        <div className="space-y-3 text-justify text-[11pt] leading-relaxed">
          <p className="leading-normal">
            Yang bertanda tangan di bawah ini saya calon mempelai wanita:
          </p>

          <table className="border-collapse w-full">
            <tbody>
              <DataRow compact="tight" label="Nama Lengkap" value={formData.name} />
              <DataRow compact="tight" label="NIK" value={formData.nik} />
              <DataRow compact="tight" label="Tempat / Tgl Lahir" value={formatTTL(formData.birthPlace, formData.birthDate)} />
              <DataRow compact="tight" label="Alamat" value={formData.address} />
            </tbody>
          </table>

          <p className="mt-2 leading-relaxed">
            Dengan ini menyatakan dengan sebenar-benarnya bahwa dalam pernikahan saya dengan <strong>{toProperCase(formData.groomName || formData.spouseName || 'Calon Suami')}</strong>, saya memohon untuk dinikahkan dengan <strong>WALI HAKIM</strong> dengan alasan:
          </p>

          <div className="border border-slate-900 p-3 rounded bg-slate-50 font-medium text-slate-900">
            {formData.waliReasonDetail || formData.waliReason || '1. Ayah kandung telah meninggal dunia dan tidak mempunyai saudara laki-laki seayah/seibu, paman dari pihak ayah, maupun ahli waris ashabah lainnya yang sah menurut syariat Islam.'}
          </div>

          <p className="mt-2 leading-relaxed">
            Surat pernyataan ini saya buat dengan sadar dan tanpa paksaan dari pihak manapun, serta disaksikan oleh para saksi kerabat. Apabila keterangan saya ini tidak benar, saya bersedia menanggung akibat hukum sesuai dengan peraturan perundang-undangan.
          </p>

          {/* Kolom Tanda Tangan */}
          <div className="mt-5 grid grid-cols-2 text-center text-[10.5pt]">
            <div>
              <p className="font-semibold mb-2">Saksi Kerabat / Keluarga:</p>
              <div className="h-16" />
              <p className="font-bold underline">{toProperCase(formData.witnessName || '...........................................')}</p>
              <p className="text-xs text-slate-600">NIK: {formData.witnessNik || '...........................................'}</p>
            </div>
            <div>
              <p>Sampeldes, {formatDateIndo(formData.letterDate || new Date().toISOString())}</p>
              <p className="mb-2">Yang Membuat Pernyataan,</p>
              <div className="h-4" />
              <span className="text-[9pt] border border-dashed border-slate-400 px-3 py-1 text-slate-500 font-mono">
                Meterai Rp 10.000
              </span>
              <div className="h-4" />
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

