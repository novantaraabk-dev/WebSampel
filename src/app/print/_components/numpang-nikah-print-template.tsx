'use client';

import { LetterSubmission } from '@/lib/types';
import { PrintLayout, DataRow, formatTTL, toProperCase, formatGender } from './print-layout';

export function NumpangNikahPrintTemplate({ submission }: { submission: LetterSubmission }) {
  const { formData } = submission;

  const pages = [
    // ========================================================
    // LEMBAR I: SURAT PENGANTAR REKOMENDASI NUMPANG NIKAH
    // ========================================================
    {
      showKop: true,
      title: 'SURAT PENGANTAR REKOMENDASI NIKAH (NUMPANG NIKAH)',
      subtitle: `Nomor : ${submission.documentNumber}`,
      content: (
        <div className="space-y-2.5 text-justify text-[11pt] leading-relaxed">
          <div className="mb-2 text-right text-[11pt]">
            <p>Kepada Yth.</p>
            <p className="font-semibold">Kepala KUA Kecamatan {formData.destinationKua || formData.destinationKecamatan || '........................'}</p>
            <p>di - <span className="underline">{formData.destinationCity || formData.destinationKabupaten || 'Tempat'}</span></p>
          </div>

          <p className="leading-normal">
            Yang bertanda tangan di bawah ini Kepala Desa Sampeldes, Kecamatan Gandrungmangu, Kabupaten Cilacap, Provinsi Jawa Tengah, dengan ini menerangkan bahwa:
          </p>

          <table className="border-collapse w-full">
            <tbody>
              <DataRow compact="tight" label="Nama Lengkap" value={formData.name} />
              <DataRow compact="tight" label="NIK" value={formData.nik} />
              <DataRow compact="tight" label="Jenis Kelamin" value={formData.gender} />
              <DataRow compact="tight" label="Tempat / Tgl Lahir" value={formatTTL(formData.birthPlace, formData.birthDate)} />
              <DataRow compact="tight" label="Warganegara / Agama" value={`${formData.nationality || 'Indonesia'} / ${formData.religion || 'Islam'}`} />
              <DataRow compact="tight" label="Status Perkawinan" value={formData.maritalStatus || 'Jejaka / Perawan'} />
              <DataRow compact="tight" label="Pekerjaan" value={formData.job} />
              <DataRow compact="tight" label="Alamat Tempat Tinggal" value={formData.address} />
            </tbody>
          </table>

          <p className="mt-2 leading-normal">
            Adalah benar-benar penduduk Desa Sampeldes yang bermaksud akan melangsungkan akad pernikahan di wilayah hukum Kantor Urusan Agama (KUA) yang Saudara pimpin, dengan calon mempelai:
          </p>

          <table className="border-collapse w-full">
            <tbody>
              <DataRow compact="tight" label="Nama Calon Pasangan" value={formData.spouseName} />
              <DataRow compact="tight" label="NIK Calon Pasangan" value={formData.spouseNik || '-'} />
              <DataRow compact="tight" label="Tempat / Tgl Lahir" value={formatTTL(formData.spouseBirthPlace, formData.spouseBirthDate)} />
              <DataRow compact="tight" label="Alamat Calon Pasangan" value={formData.spouseAddress || '-'} />
            </tbody>
          </table>

          <p className="mt-2 leading-relaxed">
            Sehubungan dengan hal tersebut, kami memberikan rekomendasi serta menyerahkan pengurusan administrasi pencatatan pernikahan yang bersangkutan kepada KUA Kecamatan tujuan.
          </p>

          <p className="mt-2 leading-relaxed">
            Demikian surat pengantar rekomendasi nikah ini dibuat dengan sebenarnya agar dapat dipergunakan sebagaimana mestinya.
          </p>
        </div>
      ),
      pageNumber: 1,
      totalPages: 3,
      showSignatures: true,
      inlineSignatures: true,
    },

    // ========================================================
    // LEMBAR II: LAMPIRAN MODEL N-1 (PENGANTAR NIKAH DESA ASAL)
    // ========================================================
    {
      showKop: false,
      title: 'SURAT PENGANTAR NIKAH',
      subtitle: `Nomor : ${submission.documentNumber}`,
      content: (
        <div className="space-y-2 text-justify text-[11pt] leading-relaxed">
          <div className="flex justify-between items-center border-b pb-1 text-[9pt] font-mono">
            <span>KANTOR DESA SAMPELDES</span>
            <span className="font-bold border border-black px-2 py-0.5">LAMPIRAN : MODEL N-1</span>
          </div>

          <p className="leading-normal">
            Yang bertanda tangan di bawah ini Kepala Desa Sampeldes, Kecamatan Gandrungmangu, Kabupaten Cilacap, menerangkan dengan sebenarnya bahwa:
          </p>

          <table className="border-collapse w-full">
            <tbody>
              <DataRow compact="tight" label="1. Nama Lengkap" value={formData.name} />
              <DataRow compact="tight" label="2. Nomor Induk Kependudukan (NIK)" value={formData.nik} />
              <DataRow compact="tight" label="3. Jenis Kelamin" value={formData.gender} />
              <DataRow compact="tight" label="4. Tempat dan Tanggal Lahir" value={formatTTL(formData.birthPlace, formData.birthDate)} />
              <DataRow compact="tight" label="5. Kewarganegaraan" value={formData.nationality || 'Indonesia'} />
              <DataRow compact="tight" label="6. Agama" value={formData.religion || 'Islam'} />
              <DataRow compact="tight" label="7. Pekerjaan" value={formData.job} />
              <DataRow compact="tight" label="8. Alamat Tempat Tinggal" value={formData.address} />
              <DataRow compact="tight" label="9. Status Pernikahan" value={formData.maritalStatus || 'Jejaka / Perawan'} />
            </tbody>
          </table>

          <div className="mt-2 pt-1 border-t">
            <p className="font-semibold text-slate-900 uppercase text-[10pt]">Adalah benar anak kandung dari pernikahan sah:</p>
            <table className="border-collapse w-full mt-1">
              <tbody>
                <DataRow compact="tight" label="Nama Ayah Kandung" value={formData.fatherName || '-'} />
                <DataRow compact="tight" label="NIK Ayah Kandung" value={formData.fatherNik || '-'} />
                <DataRow compact="tight" label="Nama Ibu Kandung" value={formData.motherName || '-'} />
                <DataRow compact="tight" label="NIK Ibu Kandung" value={formData.motherNik || '-'} />
              </tbody>
            </table>
          </div>

          <p className="mt-2 text-[10pt] italic">
            Demikian Surat Pengantar Nikah Model N-1 ini dibuat untuk dipergunakan sebagai kelengkapan pendaftaran kehendak nikah di KUA tujuan.
          </p>
        </div>
      ),
      pageNumber: 2,
      totalPages: 3,
      showSignatures: true,
      inlineSignatures: true,
    },

    // ========================================================
    // LEMBAR III: LAMPIRAN MODEL N-3 (PERSETUJUAN MEMPELAI)
    // ========================================================
    {
      showKop: false,
      title: 'SURAT PERSETUJUAN MEMPELAI',
      subtitle: 'LAMPIRAN PMA NO. 20 TAHUN 2019 (MODEL N-3)',
      content: (
        <div className="space-y-2.5 text-justify text-[11pt] leading-relaxed">
          <p className="leading-normal">
            Yang bertanda tangan di bawah ini:
          </p>

          <div className="border border-slate-900 p-2.5 rounded">
            <p className="font-bold text-slate-900 border-b pb-0.5 uppercase text-[10pt]">A. CALON SUAMI :</p>
            <table className="border-collapse w-full mt-1">
              <tbody>
                <DataRow compact="tight" label="Nama Lengkap" value={formData.gender?.toLowerCase() === 'laki-laki' ? formData.name : formData.spouseName} />
                <DataRow compact="tight" label="NIK" value={formData.gender?.toLowerCase() === 'laki-laki' ? formData.nik : formData.spouseNik} />
                <DataRow compact="tight" label="Tempat / Tgl Lahir" value={formData.gender?.toLowerCase() === 'laki-laki' ? formatTTL(formData.birthPlace, formData.birthDate) : formatTTL(formData.spouseBirthPlace, formData.spouseBirthDate)} />
                <DataRow compact="tight" label="Alamat" value={formData.gender?.toLowerCase() === 'laki-laki' ? formData.address : formData.spouseAddress} />
              </tbody>
            </table>
          </div>

          <div className="border border-slate-900 p-2.5 rounded">
            <p className="font-bold text-slate-900 border-b pb-0.5 uppercase text-[10pt]">B. CALON ISTRI :</p>
            <table className="border-collapse w-full mt-1">
              <tbody>
                <DataRow compact="tight" label="Nama Lengkap" value={formData.gender?.toLowerCase() === 'perempuan' ? formData.name : formData.spouseName} />
                <DataRow compact="tight" label="NIK" value={formData.gender?.toLowerCase() === 'perempuan' ? formData.nik : formData.spouseNik} />
                <DataRow compact="tight" label="Tempat / Tgl Lahir" value={formData.gender?.toLowerCase() === 'perempuan' ? formatTTL(formData.birthPlace, formData.birthDate) : formatTTL(formData.spouseBirthPlace, formData.spouseBirthDate)} />
                <DataRow compact="tight" label="Alamat" value={formData.gender?.toLowerCase() === 'perempuan' ? formData.address : formData.spouseAddress} />
              </tbody>
            </table>
          </div>

          <p className="mt-2 leading-relaxed">
            Menyatakan dengan sesungguhnya bahwa atas dasar suka rela, dengan kesadaran sendiri, tanpa paksaan dari siapapun juga, setuju untuk melangsungkan pernikahan.
          </p>

          <p className="mt-1 leading-relaxed">
            Demikian surat persetujuan ini dibuat untuk dapat dipergunakan sebagaimana mestinya.
          </p>

          <div className="mt-4 grid grid-cols-2 text-center text-[11pt]">
            <div>
              <p>Calon Suami,</p>
              <div className="h-16" />
              <p className="font-bold underline">{toProperCase(formData.gender?.toLowerCase() === 'laki-laki' ? formData.name : formData.spouseName)}</p>
            </div>
            <div>
              <p>Calon Istri,</p>
              <div className="h-16" />
              <p className="font-bold underline">{toProperCase(formData.gender?.toLowerCase() === 'perempuan' ? formData.name : formData.spouseName)}</p>
            </div>
          </div>
        </div>
      ),
      pageNumber: 3,
      totalPages: 3,
      showSignatures: false,
    },
  ];

  return <PrintLayout submission={submission} fontSize="12pt" pages={pages} />;
}

