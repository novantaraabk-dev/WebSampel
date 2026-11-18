'use client';

import { LetterSubmission } from '@/lib/types';
import { PrintLayout, DataRow, formatTTL, toProperCase, formatDateIndo } from './print-layout';

export function SporadikPrintTemplate({ submission }: { submission: LetterSubmission }) {
  const { formData } = submission;

  const pages = [
    // ========================================================
    // LEMBAR I: SURAT PERNYATAAN PENGUASAAN FISIK (SPORADIK)
    // ========================================================
    {
      showKop: true,
      title: 'SURAT PERNYATAAN PENGUASAAN FISIK BIDANG TANAH (SPORADIK)',
      subtitle: `Nomor : ${submission.documentNumber}`,
      content: (
        <div className="space-y-2 text-justify text-[11pt] leading-snug">
          <p className="mt-1 leading-normal">
            Yang bertanda tangan di bawah ini :
          </p>

          <table className="border-collapse w-full">
            <tbody>
              <DataRow compact="tight" label="Nama Lengkap" value={formData.name} />
              <DataRow compact="tight" label="NIK" value={formData.nik} />
              <DataRow compact="tight" label="Tempat / Tgl Lahir" value={formatTTL(formData.birthPlace, formData.birthDate)} />
              <DataRow compact="tight" label="Agama / Pekerjaan" value={`${formData.religion || 'Islam'} / ${formData.job || 'Petani / Wiraswasta'}`} />
              <DataRow compact="tight" label="Alamat Tempat Tinggal" value={`${formData.address}, Desa Sampeldes, Kec. Gandrungmangu, Kab. Cilacap`} />
            </tbody>
          </table>

          <p className="mt-2 leading-normal">
            Dengan ini menyatakan bahwa saya dengan itikad baik telah menguasai dan mengusahakan sebidang tanah yang terletak di:
          </p>

          <table className="border-collapse w-full">
            <tbody>
              <DataRow compact="tight" label="Lokasi / Blok" value={`${formData.landLocation || 'Blok Pemukiman'}, Desa Sampeldes, Kec. Gandrungmangu, Kab. Cilacap`} />
              <DataRow compact="tight" label="Luas Bidang Tanah" value={formData.landArea ? (String(formData.landArea).includes('m') ? formData.landArea : `${formData.landArea} m²`) : '± 350 m²'} />
              <DataRow compact="tight" label="Nomor SPPT PBB (NOP)" value={formData.spptPbb || '-'} />
              <DataRow compact="tight" label="Dipergunakan Untuk" value={formData.landUsage || 'Pekarangan & Bangunan Tempat Tinggal'} />
              <tr>
                <td colSpan={3} className="pt-2 font-bold text-slate-900 uppercase text-[10pt] border-b pb-0.5">
                  DENGAN BATAS-BATAS BIDANG TANAH SEBAGAI BERIKUT :
                </td>
              </tr>
              <DataRow compact="tight" label="Sebelah UTARA" value={formData.northBorder || 'Tanah Kas Desa / Jalan'} />
              <DataRow compact="tight" label="Sebelah TIMUR" value={formData.eastBorder || 'Tanah Milik Warga'} />
              <DataRow compact="tight" label="Sebelah SELATAN" value={formData.southBorder || 'Saluran Irigasi / Jalan'} />
              <DataRow compact="tight" label="Sebelah BARAT" value={formData.westBorder || 'Tanah Milik Warga'} />
            </tbody>
          </table>

          <p className="mt-2 leading-relaxed">
            Bidang tanah tersebut di atas {formData.landHistory || 'saya kuasai dengan itikad baik secara fisik dan terus menerus, tidak dijadikan jaminan hutang, serta tidak dalam sengketa dengan pihak manapun.'}
          </p>

          <p className="mt-1 leading-relaxed">
            Surat pernyataan ini saya buat dengan sebenar-benarnya dan penuh tanggung jawab. Apabila di kemudian hari ternyata pernyataan ini tidak benar, saya bersedia dituntut di muka pengadilan sesuai ketentuan perundang-undangan (Pasal 242 KUHP).
          </p>
        </div>
      ),
      pageNumber: 1,
      totalPages: 3,
      showSignatures: true,
      inlineSignatures: true,
    },

    // ========================================================
    // LEMBAR II: KESAKSIAN PEMERIKSAAN BATAS BIDANG TANAH
    // ========================================================
    {
      showKop: false,
      title: 'BERITA ACARA KESAKSIAN BATAS BIDANG TANAH',
      subtitle: 'LAMPIRAN KESAKSIAN PERNYATAAN SPORADIK',
      content: (
        <div className="space-y-3 text-justify text-[11pt] leading-snug">
          <p className="leading-normal">
            Kami yang bertanda tangan di bawah ini para saksi perbatasan dan tetangga yang berbatasan langsung dengan bidang tanah yang bersangkutan, menerangkan dengan sebenarnya bahwa:
          </p>

          <ol className="list-decimal pl-5 space-y-1.5 text-[10.5pt]">
            <li>Benar bahwa <strong>{toProperCase(formData.name)}</strong> telah menguasai dan mengusahakan bidang tanah seluas <strong>{formData.landArea}</strong> yang terletak di <strong>{formData.landLocation || 'Desa Sampeldes'}</strong>.</li>
            <li>Batas-batas tanah sebagaimana yang dinyatakan pada lembar pernyataan tersebut di atas adalah benar dan sesuai dengan kondisi fisik riil di lapangan.</li>
            <li>Bidang tanah tersebut hingga saat ini tidak terdapat sanggahan, sengketa, maupun keberatan dari pihak manapun.</li>
          </ol>

          <table className="border-collapse w-full mt-4">
            <tbody>
              <tr><td colSpan={3} className="font-bold border-b pb-1 text-slate-900 uppercase text-[10pt]">DATA SAKSI-SAKSI PERBATASAN :</td></tr>
              <DataRow compact="tight" label="1. Nama Saksi I" value={formData.witness1Name || 'Saksi Batas Utara'} />
              <DataRow compact="tight" label="Alamat Saksi I" value={formData.witness1Address || 'Desa Sampeldes'} />
              <DataRow compact="tight" label="2. Nama Saksi II" value={formData.witness2Name || 'Saksi Batas Selatan'} />
              <DataRow compact="tight" label="Alamat Saksi II" value={formData.witness2Address || 'Desa Sampeldes'} />
            </tbody>
          </table>

          <div className="pt-8 grid grid-cols-2 text-center text-sm">
            <div className="space-y-16">
              <p>Saksi Batas I,</p>
              <p className="font-bold underline uppercase">{formData.witness1Name || 'Saksi I'}</p>
            </div>
            <div className="space-y-16">
              <p>Saksi Batas II,</p>
              <p className="font-bold underline uppercase">{formData.witness2Name || 'Saksi II'}</p>
            </div>
          </div>

          <div className="pt-6 text-center text-sm space-y-14">
            <p>Mengetahui dan Membenarkan,<br /><span className="font-semibold">Kepala Desa Sampeldes</span></p>
            <div>
              <p className="font-bold underline uppercase">TUKIMAN</p>
              <p className="text-xs text-slate-500"></p>
            </div>
          </div>
        </div>
      ),
      pageNumber: 2,
      totalPages: 3,
      showSignatures: false,
    },

    // ========================================================
    // LEMBAR III: SURAT KETERANGAN RIWAYAT TANAH DARI DESA
    // ========================================================
    {
      showKop: true,
      title: 'SURAT KETERANGAN RIWAYAT TANAH',
      subtitle: `Nomor : ${submission.documentNumber ? submission.documentNumber.replace('SP-', 'RT-') : '593/RT/BLS/2026'}`,
      content: (
        <div className="space-y-3 text-justify text-[11pt] leading-normal">
          <p className="mt-1 leading-relaxed">
            Kepala Desa Sampeldes, Kecamatan Gandrungmangu, Kabupaten Cilacap, dengan ini menerangkan riwayat penguasaan bidang tanah sebagai berikut:
          </p>

          <table className="border-collapse w-full">
            <tbody>
              <DataRow compact="tight" label="Nama Pemegang Hak / Pemohon" value={formData.name} />
              <DataRow compact="tight" label="NIK Pemohon" value={formData.nik} />
              <DataRow compact="tight" label="Letak Bidang Tanah" value={`Blok ${formData.landLocation || 'Pemukiman'}, Desa Sampeldes`} />
              <DataRow compact="tight" label="Nomor Persil / Kohir C" value={formData.letterCNumber ? `Persil No. ${formData.persilNumber || '-'} / Letter C No. ${formData.letterCNumber}` : 'Tanah Adat / Belum Bersertifikat'} />
              <DataRow compact="tight" label="Luas Bidang Tanah" value={formData.landArea ? (String(formData.landArea).includes('m') ? formData.landArea : `${formData.landArea} m²`) : '± 350 m²'} />
              <DataRow compact="tight" label="Nomor SPPT PBB (NOP)" value={formData.spptPbb || '-'} />
            </tbody>
          </table>

          <p className="font-semibold text-slate-900 uppercase text-[10pt] border-b pb-0.5 mt-2">
            CATATAN RIWAYAT PENGUASAAN TANAH :
          </p>

          <ol className="list-decimal pl-5 space-y-1 text-[10.5pt] leading-relaxed">
            <li>
              Bahwa bidang tanah tersebut semula tercatat atas nama <strong>{toProperCase(formData.originalOwner || formData.fatherName || 'Pemilik Awal / Orang Tua')}</strong>.
            </li>
            <li>
              Bahwa sejak tahun <strong>{formData.acquiredYear || '2005'}</strong>, hak penguasaan atas tanah tersebut telah beralih kepada <strong>{toProperCase(formData.name)}</strong> melalui proses <strong>{formData.landHistoryType || 'Pemberian Waris / Jual Beli / Hibah Keluarga'}</strong> secara sah menurut hukum adat dan ketentuan perundang-undangan.
            </li>
            <li>
              Bahwa selama berada dalam penguasaan pemohon, tanah tersebut tidak pernah dijadikan jaminan hutang, tidak berstatus sita jaminan, dan tidak terdapat sengketa batas dengan tetangga sekitar.
            </li>
          </ol>

          <p className="mt-1 leading-relaxed text-[10.5pt]">
            Demikian Surat Keterangan Riwayat Tanah ini dibuat dengan sebenarnya untuk kelengkapan berkas Pendaftaran Tanah Pertama Kali (Konversi / PTSL) pada Kantor Pertanahan ATR/BPN Kabupaten Cilacap.
          </p>
        </div>
      ),
      pageNumber: 3,
      totalPages: 3,
      showSignatures: true,
      inlineSignatures: true,
    },
  ];

  return (
    <PrintLayout
      submission={submission}
      pages={pages}
      fontSize="11pt"
      compact="tight"
    />
  );
}

