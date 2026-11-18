'use client';

import { LetterSubmission } from '@/lib/types';
import { PrintLayout, DataRow, formatTTL, toProperCase, formatDateIndo, formatGender } from './print-layout';

export function KtpProsesPrintTemplate({ submission }: { submission: LetterSubmission }) {
  const { formData } = submission;

  const pages = [
    // ========================================================
    // LEMBAR I: SURAT KETERANGAN KTP DALAM PROSES (PENGANTAR DESA)
    // ========================================================
    {
      showKop: true,
      title: 'SURAT KETERANGAN KTP DALAM PROSES',
      subtitle: `Nomor : ${submission.documentNumber}`,
      content: (
        <div className="space-y-3 text-justify text-[11pt] leading-normal">
          <p className="mt-1 leading-relaxed">
            Yang bertanda tangan di bawah ini Kepala Desa Sampeldes, Kecamatan Gandrungmangu, Kabupaten Cilacap, menerangkan dengan sebenarnya bahwa warga tersebut di bawah ini telah melakukan perekaman Kartu Tanda Penduduk Elektronik (KTP-el) dan saat ini fisik KTP-el masih dalam proses pencetakan oleh Dinas Kependudukan dan Pencatatan Sipil:
          </p>

          <table className="border-collapse w-full text-[11pt]">
            <tbody>
              <DataRow compact="tight" label="1. Nama Lengkap" value={formData.name} />
              <DataRow compact="tight" label="2. NIK" value={formData.nik} />
              <DataRow compact="tight" label="3. Nomor Kartu Keluarga" value={formData.kkNumber || '-'} />
              <DataRow compact="tight" label="4. Tempat / Tgl Lahir" value={formatTTL(formData.birthPlace, formData.birthDate)} />
              <DataRow compact="tight" label="5. Jenis Kelamin" value={formatGender(formData.gender)} />
              <DataRow compact="tight" label="6. Golongan Darah" value={formData.bloodType || '-'} />
              <DataRow compact="tight" label="7. Agama" value={formData.religion || 'Islam'} />
              <DataRow compact="tight" label="8. Status Perkawinan" value={formData.maritalStatus || 'Kawin'} />
              <DataRow compact="tight" label="9. Pekerjaan" value={formData.job || 'Wiraswasta'} />
              <DataRow compact="tight" label="10. Alamat Tempat Tinggal" value={`${formData.address}, RT ${formData.rt || '001'} / RW ${formData.rw || '001'}, Desa Sampeldes`} />
            </tbody>
          </table>

          <p className="mt-2 text-[11pt]">
            Demikian surat keterangan kependudukan sementara ini dibuat dengan sebenarnya untuk dapat dipergunakan sebagaimana mestinya.
          </p>
        </div>
      ),
      pageNumber: 1,
      totalPages: 2,
      showSignatures: true,
      inlineSignatures: true,
    },

    // ========================================================
    // LEMBAR II: LAMPIRAN FORMULIR PERMOHONAN KTP (F-1.21 OPENSID)
    // ========================================================
    {
      showKop: false,
      title: 'FORMULIR PERMOHONAN KARTU TANDA PENDUDUK (KTP) WARGA NEGARA INDONESIA',
      subtitle: 'Lampiran Resmi Disdukcapil Kabupaten Cilacap — Kode F-1.21',
      content: (
        <div className="space-y-2.5 text-justify text-[9.5pt] leading-tight">
          <div className="flex justify-between items-center border-b pb-1 text-[8.5pt] font-mono">
            <span>PROVINSI: JAWA TENGAH (33) | KABUPATEN: CILACAP (01) | KECAMATAN: GANDRUNGMANGU (10) | DESA: SAMPELDES (2010)</span>
            <span className="font-bold border border-black px-2 py-0.5">F-1.21</span>
          </div>

          <div className="border border-black p-2 text-[8pt]">
            <strong>Perhatian :</strong><br />
            1. Harap diisi dengan huruf cetak dan menggunakan tinta hitam.<br />
            2. Untuk kolom pilihan, harap memberi tanda silang (X) pada kotak pilihan.<br />
            3. Setelah formulir ini diisi dan ditandatangani, harap diserahkan kembali ke Kantor Desa/Kelurahan.
          </div>

          <table className="w-full border-collapse border border-black text-[9pt]">
            <tbody>
              <tr>
                <td className="border border-black p-1.5 w-[28%] font-bold">PERMOHONAN KTP</td>
                <td className="border border-black p-1.5 font-semibold">
                  [ X ] A. Baru &nbsp;&nbsp;&nbsp;&nbsp;&nbsp; [ &nbsp; ] B. Perpanjangan &nbsp;&nbsp;&nbsp;&nbsp;&nbsp; [ &nbsp; ] C. Penggantian
                </td>
              </tr>
              <tr>
                <td className="border border-black p-1.5 font-bold">1. Nama Lengkap</td>
                <td className="border border-black p-1.5 font-bold uppercase">{formData.name}</td>
              </tr>
              <tr>
                <td className="border border-black p-1.5 font-bold">2. Nomor Kartu Keluarga</td>
                <td className="border border-black p-1.5 font-mono font-bold tracking-widest">{formData.kkNumber || '-'}</td>
              </tr>
              <tr>
                <td className="border border-black p-1.5 font-bold">3. NIK</td>
                <td className="border border-black p-1.5 font-mono font-bold tracking-widest">{formData.nik}</td>
              </tr>
              <tr>
                <td className="border border-black p-1.5 font-bold">4. Alamat Tempat Tinggal</td>
                <td className="border border-black p-1.5">{formData.address}, Desa Sampeldes, Kec. Gandrungmangu, Kab. Cilacap</td>
              </tr>
              <tr>
                <td className="border border-black p-1.5 font-bold">5. RT / RW / Kode Pos</td>
                <td className="border border-black p-1.5">RT {formData.rt || '001'} / RW {formData.rw || '001'} — Kode Pos: 53254</td>
              </tr>
            </tbody>
          </table>

          <table className="w-full border-collapse border border-black text-[8.5pt] text-center">
            <thead>
              <tr className="bg-slate-100 font-bold">
                <th className="border border-black p-1.5 w-[18%]">Pas Photo (2x3)</th>
                <th className="border border-black p-1.5 w-[18%]">Cap Jempol</th>
                <th className="border border-black p-1.5 w-[32%]">Specimen Tanda Tangan</th>
                <th className="border border-black p-1.5 w-[32%]">Pemohon</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-black h-24 align-middle text-slate-500">Foto 2x3 cm</td>
                <td className="border border-black h-24 align-middle text-slate-500">Cap Jempol</td>
                <td className="border border-black h-24 align-bottom pb-1.5 text-slate-500">Ket : Cap Jempol / Tanda Tangan</td>
                <td className="border border-black h-24 align-bottom pb-1.5">
                  Sampeldes, {formatDateIndo(formData.letterDate || new Date().toISOString())}<br /><br /><br />
                  <strong className="underline uppercase">( {formData.name} )</strong>
                </td>
              </tr>
            </tbody>
          </table>

          <div className="pt-4 grid grid-cols-2 text-center text-[9.5pt]">
            <div>
              <p>Mengetahui,</p>
              <p className="font-semibold">Camat Gandrungmangu</p>
              <div className="h-14" />
              <p className="font-bold underline">( ........................................... )</p>
              <p className="text-xs text-slate-600">NIP. .......................................</p>
            </div>
            <div>
              <p>Mengetahui,</p>
              <p className="font-semibold">Kepala Desa Sampeldes</p>
              <div className="h-14" />
              <p className="font-bold underline uppercase">TUKIMAN</p>
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

