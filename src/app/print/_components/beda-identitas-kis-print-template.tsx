'use client';

import { LetterSubmission } from '@/lib/types';
import { PrintLayout, DataRow, formatTTL, toProperCase, formatDateIndo, formatGender } from './print-layout';

export function BedaIdentitasKisPrintTemplate({ submission }: { submission: LetterSubmission }) {
  const { formData } = submission;

  const pages = [
    // ========================================================
    // LEMBAR I: SURAT KETERANGAN BEDA IDENTITAS KIS DARI KADES
    // ========================================================
    {
      showKop: true,
      title: 'SURAT KETERANGAN BEDA IDENTITAS KIS / BPJS KESEHATAN',
      subtitle: `Nomor : ${submission.documentNumber}`,
      content: (
        <div className="space-y-3 text-justify text-[11pt] leading-normal">
          <p className="mt-1 leading-relaxed">
            Yang bertanda tangan di bawah ini Kepala Desa Sampeldes, Kecamatan Gandrungmangu, Kabupaten Cilacap, menerangkan dengan sebenarnya bahwa:
          </p>

          <table className="border-collapse w-full">
            <tbody>
              <DataRow compact="tight" label="Nama Lengkap (e-KTP)" value={formData.name} />
              <DataRow compact="tight" label="NIK" value={formData.nik} />
              <DataRow compact="tight" label="Nomor Kartu Keluarga" value={formData.kkNumber || '-'} />
              <DataRow compact="tight" label="Jenis Kelamin" value={formatGender(formData.gender)} />
              <DataRow compact="tight" label="Tempat / Tgl Lahir" value={formatTTL(formData.birthPlace, formData.birthDate)} />
              <DataRow compact="tight" label="Pekerjaan" value={formData.job} />
              <DataRow compact="tight" label="Alamat Tempat Tinggal" value={formData.address} />
            </tbody>
          </table>

          <p className="mt-2.5 leading-relaxed">
            Berdasarkan dokumen kependudukan yang sah dan pemeriksaan data kepesertaan jaminan kesehatan, terdapat perbedaan penulisan identitas antara e-KTP / KK dengan Kartu Indonesia Sehat (KIS / BPJS Kesehatan) milik yang bersangkutan, sebagai berikut:
          </p>

          {/* Tabel Perbandingan Identitas */}
          <div className="rounded border border-slate-900 overflow-hidden mt-1">
            <table className="w-full border-collapse text-[10.5pt]">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-900">
                  <th className="py-1 px-3 text-left w-1/2 border-r border-slate-900 font-bold">1. TERTULIS PADA e-KTP / KK</th>
                  <th className="py-1 px-3 text-left w-1/2 font-bold">2. TERTULIS PADA KARTU KIS / BPJS</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="p-3 border-r border-slate-900 align-top space-y-1">
                    <p><strong>Nama:</strong> {toProperCase(formData.name)}</p>
                    <p><strong>NIK:</strong> {formData.nik}</p>
                    <p><strong>TTL:</strong> {formatTTL(formData.birthPlace, formData.birthDate)}</p>
                    <p><strong>Alamat:</strong> {formData.address}</p>
                  </td>
                  <td className="p-3 align-top space-y-1">
                    <p><strong>Nama KIS:</strong> {toProperCase(formData.kisName || formData.doc2Data || formData.name)}</p>
                    <p><strong>No. KIS/BPJS:</strong> {formData.kisNumber || formData.doc2Number || '-'}</p>
                    <p><strong>TTL KIS:</strong> {formData.kisTtl || '-'}</p>
                    <p><strong>Faskes Tk. 1:</strong> {formData.kisFaskes || 'Puskesmas Gandrungmangu'}</p>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <p className="mt-2.5 leading-relaxed">
            Dengan ini kami nyatakan dan tegaskan bahwa identitas yang tercantum pada kedua dokumen tersebut di atas adalah benar-benar <strong>SATU ORANG YANG SAMA</strong>, dan perbedaan tersebut disebabkan oleh kesalahan pencatatan data administrasi terdahulu.
          </p>

          <p className="mt-2 leading-relaxed">
            Surat keterangan ini diterbitkan guna keperluan: <strong>Sinkronisasi data kepesertaan BPJS Kesehatan / Penggunaan Kartu Indonesia Sehat (KIS) di Fasilitas Kesehatan (Puskesmas / Rumah Sakit)</strong>.
          </p>

          <p className="mt-2 leading-relaxed">
            Demikian surat keterangan ini dibuat dengan sebenarnya agar dapat dipergunakan sebagaimana mestinya.
          </p>
        </div>
      ),
      pageNumber: 1,
      totalPages: 2,
      showSignatures: true,
      inlineSignatures: true,
    },

    // ========================================================
    // LEMBAR II: LAMPIRAN SPTJM SATU ORANG SAMA BPJS
    // ========================================================
    {
      showKop: false,
      title: 'SURAT PERNYATAAN TANGGUNG JAWAB MUTLAK (SPTJM)',
      subtitle: 'KEBENARAN PERBEDAAN DATA KEPESERTAAN KIS / BPJS KESEHATAN',
      content: (
        <div className="space-y-3 text-justify text-[11pt] leading-relaxed">
          <p className="leading-normal">
            Yang bertanda tangan di bawah ini saya peserta / anggota keluarga pemilik Kartu Indonesia Sehat:
          </p>

          <table className="border-collapse w-full">
            <tbody>
              <DataRow compact="tight" label="Nama Lengkap" value={formData.name} />
              <DataRow compact="tight" label="NIK" value={formData.nik} />
              <DataRow compact="tight" label="Nomor Kartu Keluarga" value={formData.kkNumber || '-'} />
              <DataRow compact="tight" label="Nomor Kartu KIS/BPJS" value={formData.kisNumber || formData.doc2Number || '-'} />
              <DataRow compact="tight" label="Alamat Tempat Tinggal" value={formData.address} />
            </tbody>
          </table>

          <p className="mt-2.5 leading-relaxed">
            Dengan ini menyatakan dengan sebenar-benarnya dan penuh rasa tanggung jawab bahwa data nama yang tertulis pada e-KTP yaitu <strong>"{toProperCase(formData.name)}"</strong> dan nama yang tertulis pada Kartu KIS/BPJS yaitu <strong>"{toProperCase(formData.kisName || formData.doc2Data || formData.name)}"</strong> adalah benar-benar orang yang satu dan sama.
          </p>

          <p className="mt-2 leading-relaxed">
            Surat Pernyataan Tanggung Jawab Mutlak (SPTJM) ini saya buat dengan sebenarnya untuk keperluan pengajuan pelayanan medis / pemutakhiran data master BPJS Kesehatan. Apabila di kemudian hari terbukti pernyataan saya ini tidak benar, saya bersedia dituntut sesuai ketentuan perundang-undangan yang berlaku.
          </p>

          <div className="mt-6 grid grid-cols-2 text-center text-[10.5pt]">
            <div>
              <p>Mengetahui,</p>
              <p className="font-semibold mb-2">Kepala Desa Sampeldes</p>
              <div className="h-16" />
              <p className="font-bold underline">TUKIMAN</p>
              <p className="text-xs text-slate-600"></p>
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

