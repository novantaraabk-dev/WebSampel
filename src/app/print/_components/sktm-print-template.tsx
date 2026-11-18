'use client';

import { LetterSubmission } from '@/lib/types';
import { PrintLayout, DataRow, formatTTL, formatDateIndo, formatGender, toProperCase } from './print-layout';

export function SktmPrintTemplate({ submission }: { submission: LetterSubmission }) {
  const { formData } = submission;
  const isForChild = formData.submissionType === 'child' || !!formData.childName;

  const applicantName = formData.applicantName || formData.name;
  const applicantNik = formData.applicantNik || formData.nik;
  const applicantJob = formData.applicantJob || formData.job || 'Buruh Harian Lepas / Petani';
  const applicantAddress = formData.applicantAddress || formData.address;

  const pages = [
    // ========================================================
    // LEMBAR I: SURAT KETERANGAN TIDAK MAMPU RESMI DESA
    // ========================================================
    {
      showKop: true,
      title: 'SURAT KETERANGAN TIDAK MAMPU (SKTM)',
      subtitle: `Nomor : ${submission.documentNumber}`,
      content: (
        <div className="space-y-2.5 text-justify text-[11pt] leading-normal">
          <p className="mt-1 leading-relaxed">
            Yang bertanda tangan di bawah ini Kepala Desa Sampeldes, Kecamatan
            Gandrungmangu, Kabupaten Cilacap, menerangkan dengan sebenarnya bahwa:
          </p>

          <table className="border-collapse w-full">
            <tbody>
              <DataRow compact="tight" label="Nama Lengkap" value={applicantName} />
              <DataRow compact="tight" label="NIK" value={applicantNik} />
              <DataRow compact="tight" label="Tempat / Tgl Lahir" value={formatTTL(formData.applicantBirthPlace || formData.birthPlace, formData.applicantBirthDate || formData.birthDate)} />
              <DataRow compact="tight" label="Jenis Kelamin" value={formatGender(formData.applicantGender || formData.gender)} />
              <DataRow compact="tight" label="Pekerjaan" value={applicantJob} />
              <DataRow compact="tight" label="Alamat Tempat Tinggal" value={`${applicantAddress}, RT ${formData.rt || '00'}/RW ${formData.rw || '00'}, Desa Sampeldes`} />
            </tbody>
          </table>

          {isForChild && (
            <>
              <p className="mt-2 leading-relaxed">
                Adalah benar orang tua kandung / wali dari:
              </p>

              <table className="border-collapse w-full">
                <tbody>
                  <DataRow compact="tight" label="Nama Anak / Siswa" value={formData.childName} />
                  <DataRow compact="tight" label="NIK Anak" value={formData.childNik || '-'} />
                  <DataRow compact="tight" label="Tempat / Tgl Lahir" value={formatTTL(formData.childBirthPlace, formData.childBirthDate)} />
                  <DataRow compact="tight" label="Jenis Kelamin" value={formatGender(formData.childGender)} />
                  <DataRow compact="tight" label="Pekerjaan / Status" value={formData.childJob || 'Pelajar / Mahasiswa'} />
                  <DataRow compact="tight" label="Alamat Anak" value={formData.childAddress || applicantAddress} />
                </tbody>
              </table>
            </>
          )}

          <p className="mt-2 text-justify leading-relaxed">
            Berdasarkan data kependudukan dan peninjauan riil di lapangan, keluarga yang bersangkutan benar-benar tergolong dalam <strong>KELUARGA TIDAK MAMPU / EKONOMI LEMAH (PRA-SEJAHTERA)</strong> dengan penghasilan tidak tetap dan berada di bawah standar upah minimum.
          </p>

          <p className="mt-1 leading-relaxed">
            Surat keterangan ini diterbitkan dan diberikan kepada yang bersangkutan untuk keperluan: <strong>{formData.purpose || 'Persyaratan Beasiswa Pendidikan / KIP-Kuliah / Keringanan Biaya Rumah Sakit'}</strong>.
          </p>

          <p className="mt-1 leading-relaxed">
            Demikian surat keterangan ini dibuat dengan sebenarnya dan penuh rasa tanggung jawab agar dapat dipergunakan sebagaimana mestinya oleh pihak yang berkepentingan.
          </p>
        </div>
      ),
      pageNumber: 1,
      totalPages: 2,
      showSignatures: true,
      inlineSignatures: true,
    },

    // ========================================================
    // LEMBAR II: LAMPIRAN SURAT PERNYATAAN KONDISI EKONOMI BERMETERAI
    // ========================================================
    {
      showKop: false,
      title: 'SURAT PERNYATAAN KELUARGA KURANG MAMPU',
      subtitle: 'LAMPIRAN PERSYARATAN ADMINISTRASI SOSIAL & BANTUAN',
      content: (
        <div className="space-y-3 text-justify text-[10.5pt] leading-normal">
          <p className="leading-relaxed">
            Yang bertanda tangan di bawah ini Kepala Keluarga / Pemohon:
          </p>

          <table className="border-collapse w-full">
            <tbody>
              <DataRow compact="tight" label="Nama Kepala Keluarga" value={applicantName} />
              <DataRow compact="tight" label="NIK" value={applicantNik} />
              <DataRow compact="tight" label="Nomor Kartu Keluarga" value={formData.kkNumber || '-'} />
              <DataRow compact="tight" label="Pekerjaan" value={applicantJob} />
              <DataRow compact="tight" label="Penghasilan Rata-rata/Bln" value={formData.income || '± Rp 800.000,- s.d. Rp 1.200.000,-'} />
              <DataRow compact="tight" label="Jumlah Tanggungan Keluarga" value={formData.dependents ? `${formData.dependents} Orang` : '3 (Tiga) Orang'} />
              <DataRow compact="tight" label="Alamat Tempat Tinggal" value={`${applicantAddress}, Desa Sampeldes, Kec. Gandrungmangu, Kab. Cilacap`} />
            </tbody>
          </table>

          <p className="mt-2 leading-relaxed">
            Dengan ini menyatakan dengan sesungguhnya di hadapan Pemerintah Desa Sampeldes bahwa:
          </p>

          <ol className="list-decimal pl-5 space-y-1 text-[10pt] leading-relaxed">
            <li>
              Keluarga kami benar-benar dalam keadaan ekonomi tidak mampu dan memerlukan bantuan keringanan biaya {formData.purpose || 'pendidikan / kesehatan / sosial'}.
            </li>
            <li>
              Kondisi tempat tinggal dan pendapatan yang kami laporkan adalah data riil yang sebenarnya tanpa manipulasi atau rekayasa.
            </li>
            <li>
              Pernyataan ini dibuat dengan itikad baik dan kami bertanggung jawab penuh atas kebenaran seluruh keterangan yang diberikan.
            </li>
            <li>
              Apabila di kemudian hari terbukti keterangan ini tidak benar, kami bersedia mengembalikan seluruh bantuan yang diterima dan dituntut sesuai dengan ketentuan perundang-undangan.
            </li>
          </ol>

          <p className="mt-1 leading-relaxed text-[10pt]">
            Demikian surat pernyataan ini saya buat dengan sadar dan sukarela di atas kertas bermeterai cukup untuk dipergunakan sebagaimana mestinya.
          </p>

          {/* Saksi-Saksi */}
          <div className="pt-2">
            <p className="font-semibold text-[10pt] mb-2">Saksi-Saksi:</p>
            <div className="grid grid-cols-2 gap-4 text-[9.5pt]">
              <div className="border border-slate-200 p-2.5 rounded-lg bg-slate-50/40">
                <p className="text-[8.5pt] text-slate-500 uppercase font-semibold">1. Saksi I</p>
                <div className="h-10" />
                <p className="font-bold underline uppercase">{formData.witness1Name || '( ............................................ )'}</p>
                {formData.witness1Nik && <p className="text-[8pt] text-slate-500">NIK: {formData.witness1Nik}</p>}
              </div>
              <div className="border border-slate-200 p-2.5 rounded-lg bg-slate-50/40">
                <p className="text-[8.5pt] text-slate-500 uppercase font-semibold">2. Saksi II</p>
                <div className="h-10" />
                <p className="font-bold underline uppercase">{formData.witness2Name || '( ............................................ )'}</p>
                {formData.witness2Nik && <p className="text-[8pt] text-slate-500">NIK: {formData.witness2Nik}</p>}
              </div>
            </div>
          </div>

          {/* Area Tanda Tangan */}
          <div className="pt-4 grid grid-cols-2 text-center text-[9.5pt]">
            <div className="space-y-16">
              <p>Mengetahui,</p>
              <p className="font-semibold">Kepala Desa Sampeldes</p>
              <div className="h-10" />
              <p className="font-bold underline">TUKIMAN</p>
              <p className="text-[8pt] text-slate-500"></p>
            </div>

            <div className="space-y-4">
              <p>Sampeldes, {formatDateIndo(formData.letterDate || new Date().toISOString())}</p>
              <div className="border border-dashed border-slate-400 py-3 px-2 w-28 mx-auto text-[7.5pt] text-slate-400 uppercase">
                Meterai<br />Rp 10.000
              </div>
              <p className="font-bold underline uppercase">{applicantName}</p>
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

