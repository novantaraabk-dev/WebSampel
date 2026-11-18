'use client';

import { LetterSubmission } from '@/lib/types';
import { PrintLayout, DataRow, formatTTL, toProperCase, formatDateIndo, formatGender } from './print-layout';

export function PenghasilanMandiriPrintTemplate({
  submission,
  role = 'ayah',
}: {
  submission: LetterSubmission;
  role?: 'ayah' | 'ibu';
}) {
  const { formData } = submission;
  const isFather = role === 'ayah' || submission.letterType?.toLowerCase().includes('ayah');
  const roleTitle = isFather ? 'Ayah' : 'Ibu';

  const pages = [
    // ========================================================
    // LEMBAR I: SURAT KETERANGAN PENGHASILAN AYAH / IBU
    // ========================================================
    {
      showKop: true,
      title: `SURAT KETERANGAN PENGHASILAN ${roleTitle.toUpperCase()}`,
      subtitle: `Nomor : ${submission.documentNumber}`,
      content: (
        <div className="space-y-3 text-justify text-[11pt] leading-normal">
          <p className="mt-1 leading-relaxed">
            Yang bertanda tangan di bawah ini Kepala Desa Sampeldes, Kecamatan Gandrungmangu, Kabupaten Cilacap, menerangkan bahwa:
          </p>

          <table className="border-collapse w-full">
            <tbody>
              <DataRow compact="tight" label={`Nama Lengkap (${roleTitle})`} value={formData.parentName || formData.name} />
              <DataRow compact="tight" label="NIK" value={formData.parentNik || formData.nik} />
              <DataRow compact="tight" label="Jenis Kelamin" value={isFather ? 'Laki-laki' : 'Perempuan'} />
              <DataRow compact="tight" label="Tempat / Tgl Lahir" value={formatTTL(formData.parentBirthPlace || formData.birthPlace, formData.parentBirthDate || formData.birthDate)} />
              <DataRow compact="tight" label="Pekerjaan / Mata Pencaharian" value={formData.parentJob || formData.job || (isFather ? 'Buruh Tani / Wiraswasta' : 'Ibu Rumah Tangga')} />
              <DataRow compact="tight" label="Alamat Tempat Tinggal" value={formData.address} />
            </tbody>
          </table>

          <p className="mt-2 leading-relaxed">
            Adalah benar orang tua kandung / wali dari:
          </p>

          <table className="border-collapse w-full">
            <tbody>
              <DataRow compact="tight" label="Nama Anak / Siswa" value={formData.childName || formData.name} />
              <DataRow compact="tight" label="NIK Anak" value={formData.childNik || '-'} />
              <DataRow compact="tight" label="Tempat / Tgl Lahir" value={formatTTL(formData.childBirthPlace, formData.childBirthDate)} />
              <DataRow compact="tight" label="Sekolah / Universitas" value={formData.schoolName || formData.purpose || 'Perguruan Tinggi'} />
            </tbody>
          </table>

          <p className="mt-2.5 leading-relaxed">
            Berdasarkan keterangan yang bersangkutan dan data ekonomi keluarga di Desa Sampeldes, orang tua yang bersangkutan saat ini memiliki rata-rata penghasilan kotor per bulan sebesar:
          </p>

          <div className="my-2 p-2.5 border-2 border-slate-900 bg-slate-50 text-center rounded">
            <span className="text-xs font-bold text-slate-600 block uppercase">Rata-Rata Penghasilan Bersih Per Bulan:</span>
            <span className="text-lg font-black text-slate-900">
              {formData.income || formData.parentIncome || 'Rp 1.500.000,- (Satu Juta Lima Ratus Ribu Rupiah)'}
            </span>
          </div>

          <p className="mt-2 leading-relaxed">
            Surat keterangan ini dibuat sebagai kelengkapan administrasi: <strong>{formData.purpose || 'Persyaratan Pendaftaran Beasiswa / KIP-Kuliah / Administrasi Pendidikan Anak'}</strong>.
          </p>

          <p className="mt-2 leading-relaxed">
            Demikian surat keterangan ini dibuat dengan sebenarnya untuk dipergunakan sebagaimana mestinya.
          </p>
        </div>
      ),
      pageNumber: 1,
      totalPages: 2,
      showSignatures: true,
      inlineSignatures: true,
    },

    // ========================================================
    // LEMBAR II: LAMPIRAN RINCIAN BEBAN TANGGUNGAN KELUARGA
    // ========================================================
    {
      showKop: false,
      title: 'DAFTAR BEBAN TANGGUNGAN KELUARGA & RINCIAN PENGELUARAN',
      subtitle: `LAMPIRAN SURAT KETERANGAN PENGHASILAN ${roleTitle.toUpperCase()}`,
      content: (
        <div className="space-y-3 text-justify text-[11pt] leading-normal">
          <p className="leading-relaxed">
            Yang bertanda tangan di bawah ini menerangkan susunan tanggungan keluarga yang dibiayai dari penghasilan tersebut di atas:
          </p>

          <table className="border-collapse w-full">
            <tbody>
              <DataRow compact="tight" label="Nama Kepala Keluarga" value={formData.kkHead || formData.parentName || formData.name} />
              <DataRow compact="tight" label="Nomor Kartu Keluarga" value={formData.kkNumber || '-'} />
              <DataRow compact="tight" label="Alamat Tempat Tinggal" value={formData.address} />
              <DataRow compact="tight" label="Jumlah Tanggungan Anak" value={`${formData.dependentsCount || '2'} Orang`} />
            </tbody>
          </table>

          {/* Tabel Rincian Tanggungan */}
          <div className="mt-2">
            <p className="font-semibold text-slate-900 text-[10pt] mb-1">Daftar Tanggungan yang Belum Mandiri:</p>
            <table className="w-full border-collapse border border-black text-[10pt]">
              <thead>
                <tr className="bg-slate-100">
                  <th className="border border-black px-2 py-1 text-center w-8">No</th>
                  <th className="border border-black px-2 py-1 text-left">Nama Anggota Keluarga</th>
                  <th className="border border-black px-2 py-1 text-left w-24">Hubungan</th>
                  <th className="border border-black px-2 py-1 text-left w-20">Umur</th>
                  <th className="border border-black px-2 py-1 text-left">Keterangan / Pendidikan</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-black px-2 py-1 text-center">1</td>
                  <td className="border border-black px-2 py-1">{toProperCase(formData.childName || formData.name)}</td>
                  <td className="border border-black px-2 py-1">Anak Kandung</td>
                  <td className="border border-black px-2 py-1">{formData.childAge || '18 Th'}</td>
                  <td className="border border-black px-2 py-1">{formData.schoolName || 'Mahasiswa / Pelajar'}</td>
                </tr>
                <tr>
                  <td className="border border-black px-2 py-1 text-center">2</td>
                  <td className="border border-black px-2 py-1">{toProperCase(formData.dependent2Name || 'Anggota Tanggungan')}</td>
                  <td className="border border-black px-2 py-1">Anak Kandung</td>
                  <td className="border border-black px-2 py-1">{formData.dependent2Age || '14 Th'}</td>
                  <td className="border border-black px-2 py-1">Pelajar SMP / SMA</td>
                </tr>
              </tbody>
            </table>
          </div>

          <p className="mt-3 leading-relaxed text-[10.5pt]">
            Demikian daftar rincian tanggungan ini saya buat dengan jujur dan sebenarnya untuk melengkapi berkas verifikasi bantuan biaya pendidikan.
          </p>

          <div className="mt-5 grid grid-cols-2 text-center text-[10.5pt]">
            <div>
              <p>Mengetahui,</p>
              <p className="font-semibold mb-2">Kepala Desa Sampeldes</p>
              <div className="h-16" />
              <p className="font-bold underline">TUKIMAN</p>
              <p className="text-xs text-slate-600"></p>
            </div>
            <div>
              <p>Sampeldes, {formatDateIndo(formData.letterDate || new Date().toISOString())}</p>
              <p className="mb-2">Yang Menyatakan,</p>
              <div className="h-16" />
              <p className="font-bold underline">{toProperCase(formData.parentName || formData.name)}</p>
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

