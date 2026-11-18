'use client';

import { LetterSubmission } from '@/lib/types';
import { PrintLayout, DataRow, formatTTL, toProperCase, formatDateIndo, formatGender } from './print-layout';

export function NikahNonMuslimPrintTemplate({ submission }: { submission: LetterSubmission }) {
  const { formData } = submission;

  const pages = [
    // ========================================================
    // LEMBAR I: SURAT PENGANTAR PENCATATAN PERKAWINAN DUKCAPIL
    // ========================================================
    {
      showKop: true,
      title: 'SURAT PENGANTAR PENCATATAN PERKAWINAN (NON-MUSLIM)',
      subtitle: `Nomor : ${submission.documentNumber}`,
      content: (
        <div className="space-y-3 text-justify text-[11pt] leading-normal">
          <div className="mb-2 text-right text-[11pt]">
            <p>Kepada Yth.</p>
            <p className="font-semibold">Kepala Dinas Kependudukan dan Pencatatan Sipil Kab. Cilacap</p>
            <p>di - <span className="underline">Tempat</span></p>
          </div>

          <p className="leading-relaxed">
            Yang bertanda tangan di bawah ini Kepala Desa Sampeldes, Kecamatan Gandrungmangu, Kabupaten Cilacap, menerangkan bahwa telah terjadi perkawinan menurut tata cara agama / kepercayaan terhadap Tuhan Yang Maha Esa antara:
          </p>

          <div className="border border-slate-900 p-2.5 rounded bg-slate-50 space-y-2">
            <div>
              <p className="font-bold text-slate-900 uppercase text-[10pt] border-b pb-0.5">I. MEMPELAI PRIA :</p>
              <table className="border-collapse w-full mt-1">
                <tbody>
                  <DataRow compact="tight" label="Nama Lengkap" value={formData.groomName || formData.name} />
                  <DataRow compact="tight" label="NIK" value={formData.groomNik || formData.nik} />
                  <DataRow compact="tight" label="Tempat / Tgl Lahir" value={formatTTL(formData.groomBirthPlace, formData.groomBirthDate)} />
                  <DataRow compact="tight" label="Agama / Pekerjaan" value={`${formData.groomReligion || formData.religion || 'Kristen / Katolik'} / ${formData.groomJob || formData.job || '-'}`} />
                  <DataRow compact="tight" label="Alamat Tempat Tinggal" value={formData.groomAddress || formData.address} />
                </tbody>
              </table>
            </div>

            <div>
              <p className="font-bold text-slate-900 uppercase text-[10pt] border-b pb-0.5">II. MEMPELAI WANITA :</p>
              <table className="border-collapse w-full mt-1">
                <tbody>
                  <DataRow compact="tight" label="Nama Lengkap" value={formData.brideName || formData.spouseName} />
                  <DataRow compact="tight" label="NIK" value={formData.brideNik || formData.spouseNik || '-'} />
                  <DataRow compact="tight" label="Tempat / Tgl Lahir" value={formatTTL(formData.brideBirthPlace, formData.brideBirthDate)} />
                  <DataRow compact="tight" label="Agama / Pekerjaan" value={`${formData.brideReligion || formData.religion || 'Kristen / Katolik'} / ${formData.brideJob || '-'}`} />
                  <DataRow compact="tight" label="Alamat Tempat Tinggal" value={formData.brideAddress || '-'} />
                </tbody>
              </table>
            </div>
          </div>

          <p className="mt-2 leading-relaxed">
            Perkawinan tersebut telah dilaksanakan pada tanggal <strong>{formData.weddingDate ? formatDateIndo(formData.weddingDate) : (formData.marriageDate || '........................')}</strong> di hadapan Pemuka Agama: <strong>{formData.priestName || formData.pemukaAgama || 'Pendeta / Romo / Pemuka Penghayat'}</strong>.
          </p>

          <p className="mt-2 leading-relaxed">
            Sehubungan dengan hal tersebut, kami memberikan pengantar pencatatan perkawinan bagi kedua mempelai ke Dinas Dukcapil guna penerbitan Kutipan Akta Perkawinan.
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
    // LEMBAR II: LAMPIRAN FORMULIR F-2.12 / F-2.01 PERKAWINAN DUKCAPIL
    // ========================================================
    {
      showKop: false,
      title: 'FORMULIR PENCATATAN PERKAWINAN CAPIL (F-2.12 / F-2.01)',
      subtitle: 'DINAS KEPENDUDUKAN DAN PENCATATAN SIPIL KABUPATEN CILACAP',
      content: (
        <div className="space-y-3 text-justify text-[10.5pt] leading-normal">
          <div className="flex justify-between items-center border-b pb-1 text-[9pt] font-mono">
            <span>KODE WILAYAH: 33.01.10.2010 (DESA SAMPELDES, KEC. GANDRUNGMANGU)</span>
            <span className="font-bold border border-black px-2 py-0.5">FORMULIR F-2.12</span>
          </div>

          <table className="border-collapse w-full">
            <tbody>
              <DataRow compact="tight" label="Nomor Surat Pemberkatan Agama" value={formData.blessingLetterNumber || formData.suratGereja || '-'} />
              <DataRow compact="tight" label="Nama Pemuka Agama / Pendeta" value={formData.priestName || formData.pemukaAgama || '-'} />
              <DataRow compact="tight" label="Nama Badan Peribadatan / Gereja" value={formData.churchName || formData.tempatIbadah || '-'} />
              <DataRow compact="tight" label="Nama Saksi I Perkawinan" value={formData.witness1Name || '-'} />
              <DataRow compact="tight" label="Nama Saksi II Perkawinan" value={formData.witness2Name || '-'} />
            </tbody>
          </table>

          <p className="mt-2 text-[10pt] italic">
            Kedua mempelai memohon pencatatan perkawinan pada register akta perkawinan Dinas Kependudukan dan Pencatatan Sipil Kabupaten Cilacap sesuai dengan ketentuan Undang-Undang Nomor 24 Tahun 2013 tentang Administrasi Kependudukan.
          </p>

          <div className="mt-6 grid grid-cols-2 text-center text-[10pt]">
            <div>
              <p>Mempelai Pria,</p>
              <div className="h-14" />
              <p className="font-bold underline">{toProperCase(formData.groomName || formData.name)}</p>
            </div>
            <div>
              <p>Mempelai Wanita,</p>
              <div className="h-14" />
              <p className="font-bold underline">{toProperCase(formData.brideName || formData.spouseName || 'Mempelai Wanita')}</p>
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

