'use client';

import { LetterSubmission } from '@/lib/types';
import { PrintLayout, DataRow, formatTTL, formatDateIndo, formatGender } from './print-layout';

export function BelumMenikahPrintTemplate({ submission }: { submission: LetterSubmission }) {
  const { formData } = submission;

  const pages = [
    // ========================================================
    // LEMBAR I: SURAT KETERANGAN BELUM MENIKAH DARI DESA
    // ========================================================
    {
      showKop: true,
      title: 'SURAT KETERANGAN BELUM MENIKAH',
      subtitle: `Nomor : ${submission.documentNumber}`,
      content: (
        <div className="space-y-3 text-justify text-[11pt] leading-normal">
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
              <DataRow compact="tight" label="Kewarganegaraan / Agama" value={`${formData.nationality || 'WNI'} / ${formData.religion || 'Islam'}`} />
              <DataRow compact="tight" label="Pekerjaan" value={formData.job || 'Belum / Tidak Bekerja'} />
              <DataRow compact="tight" label="Alamat Tempat Tinggal" value={`${formData.address}, RT ${formData.rt || '00'} / RW ${formData.rw || '00'}, Desa Sampeldes`} />
            </tbody>
          </table>

          <p className="mt-2 text-justify leading-relaxed">
            Berdasarkan data administrasi kependudukan dan catatan registrasi yang ada pada Kantor Desa Sampeldes, serta sepengetahuan para tetangga sekitar, orang tersebut di atas benar-benar berstatus <strong>BELUM PERNAH MENIKAH (JEJAKA / PERAWAN)</strong>.
          </p>

          <p className="mt-1 text-justify leading-relaxed">
            Surat keterangan ini diberikan kepada yang bersangkutan untuk keperluan: <strong>{formData.purpose || 'Persyaratan Administrasi Pendaftaran Pernikahan / Lamaran Pekerjaan'}</strong>.
          </p>

          <p className="mt-1 text-justify leading-relaxed">
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
    // LEMBAR II: LAMPIRAN SURAT PERNYATAAN BELUM PERNAH MENIKAH BERMETERAI
    // ========================================================
    {
      showKop: false,
      title: 'SURAT PERNYATAAN BELUM PERNAH MENIKAH',
      subtitle: 'LAMPIRAN PERSYARATAN ADMINISTRASI RESMI',
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
              <DataRow compact="tight" label="Agama / Pekerjaan" value={`${formData.religion || 'Islam'} / ${formData.job || '-'}`} />
              <DataRow compact="tight" label="Alamat Tempat Tinggal" value={`${formData.address}, Desa Sampeldes, Kec. Gandrungmangu, Kab. Cilacap`} />
            </tbody>
          </table>

          <p className="mt-2 leading-relaxed">
            Dengan ini menyatakan dengan sesungguhnya dan bersumpah di hadapan saksi-saksi bahwa:
          </p>

          <ol className="list-decimal pl-5 space-y-1 text-[10pt] leading-relaxed">
            <li>
              Hingga saat surat pernyataan ini saya tandatangani, saya <strong>BENAR-BENAR BELUM PERNAH MELANGSUNGKAN PERNIKAHAN / PERKAWINAN</strong> baik secara hukum agama, hukum adat, maupun hukum negara dengan siapapun.
            </li>
            <li>
              Saya tidak sedang terikat hubungan pernikahan atau status perkawinan yang sah dengan pihak manapun.
            </li>
            <li>
              Surat pernyataan ini saya buat dengan kesadaran penuh tanpa ada paksaan dari pihak manapun untuk dipergunakan sebagai kelengkapan berkas resmi.
            </li>
            <li>
              Apabila di kemudian hari ternyata pernyataan ini terbukti tidak benar atau palsu, maka saya bersedia dituntut di muka pengadilan dan diproses sesuai ketentuan hukum pidana yang berlaku (Pasal 242 KUHP).
            </li>
          </ol>

          <p className="mt-1 leading-relaxed text-[10pt]">
            Demikian surat pernyataan ini saya buat dengan sebenar-benarnya di atas kertas bermeterai cukup untuk dipergunakan sebagaimana mestinya.
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

