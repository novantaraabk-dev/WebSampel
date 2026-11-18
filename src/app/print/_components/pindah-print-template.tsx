'use client';

import { LetterSubmission } from '@/lib/types';
import { PrintLayout, DataRow, toProperCase } from './print-layout';

export function PindahPrintTemplate({ submission }: { submission: LetterSubmission }) {
  const { formData } = submission;

  const pages = [
    // ========================================================
    // LEMBAR I: SURAT PENGANTAR PINDAH DESA
    // ========================================================
    {
      showKop: true,
      title: submission.letterType.toUpperCase(),
      subtitle: `Nomor : ${submission.documentNumber}`,
      content: (
        <>
          <p className="mt-3 text-justify leading-normal">
            Yang bertanda tangan di bawah ini Kepala Desa Sampeldes, Kecamatan
            Gandrungmangu, Kabupaten Cilacap, menerangkan bahwa:
          </p>

          <table className="mt-2 border-collapse w-full">
            <tbody>
              <DataRow compact="tight" label="Nama Lengkap" value={formData.name} />
              <DataRow compact="tight" label="NIK" value={formData.nik} />
              <DataRow compact="tight" label="Nomor KK" value={formData.kkNumber} />
              <DataRow compact="tight" label="Nama Kepala Keluarga" value={formData.kkHead} />
              <DataRow
                compact="tight"
                label="Alamat Asal"
                value={`Desa Sampeldes, RT ${formData.currentAddressRt} / RW ${formData.currentAddressRw}, Kecamatan Gandrungmangu, Kabupaten Cilacap, Provinsi Jawa Tengah`}
              />
            </tbody>
          </table>

          <p className="mt-2.5 text-justify leading-normal">
            Bermaksud untuk pindah domisili/alamat ke:
          </p>

          <table className="mt-2 border-collapse w-full">
            <tbody>
              <DataRow
                compact="tight"
                label="Alamat Tujuan"
                value={`Desa ${formData.destinationAddress}, RT ${formData.destinationAddressRt} / RW ${formData.destinationAddressRw}, Kecamatan ${formData.destinationKecamatan}, Kabupaten ${formData.destinationKabupaten}, Provinsi ${formData.destinationProvinsi}`}
              />
              <DataRow compact="tight" label="Jumlah Keluarga" value={`${formData.familyCount} orang`} />
            </tbody>
          </table>

          {formData.familyMembers && formData.familyMembers.length > 0 && (
            <div className="mt-3">
              <p className="mb-1.5 font-semibold leading-normal">Adapun anggota keluarga yang ikut pindah adalah sebagai berikut:</p>
              <table className="w-full border-collapse border border-black text-[11pt]">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-black px-2 py-1 text-center w-10">No</th>
                    <th className="border border-black px-2 py-1 text-left w-[32%]">NIK</th>
                    <th className="border border-black px-2 py-1 text-left">Nama Lengkap</th>
                    <th className="border border-black px-2 py-1 text-left w-[20%]">SHDK</th>
                  </tr>
                </thead>
                <tbody>
                  {formData.familyMembers.map((member: any, index: number) => (
                    <tr key={index}>
                      <td className="border border-black px-2 py-1 text-center">{index + 1}</td>
                      <td className="border border-black px-2 py-1">{member.nik}</td>
                      <td className="border border-black px-2 py-1">{toProperCase(member.name)}</td>
                      <td className="border border-black px-2 py-1">{member.relationship ? member.relationship.toUpperCase() : '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <p className="mt-3 text-justify leading-normal">
            Surat pengantar ini dibuat sebagai kelengkapan administrasi untuk proses pindah domisili yang bersangkutan.
          </p>
          <p className="mt-2 text-justify leading-normal">
            Demikian surat pengantar ini dibuat untuk dapat dipergunakan sebagaimana mestinya.
          </p>
        </>
      ),
      showSignatures: true,
      inlineSignatures: true,
      pageNumber: 1,
      totalPages: 2
    },

    // ========================================================
    // LEMBAR II: LAMPIRAN FORMULIR F-1.03 (PERMOHONAN PINDAH WNI DUKCAPIL)
    // ========================================================
    {
      showKop: false,
      title: 'FORMULIR PENDAFTARAN PERPINDAHAN PENDUDUK (F-1.03)',
      subtitle: 'SURAT KETERANGAN PINDAH WARGA NEGARA INDONESIA (SKPWNI)',
      content: (
        <div className="space-y-3 text-[10.5pt] leading-snug">
          <div className="flex justify-between items-center border-b pb-1 text-[9pt] font-mono">
            <span>DAERAH ASAL: KABUPATEN CILACAP (33.01)</span>
            <span className="font-bold border border-black px-2 py-0.5">FORMULIR F-1.03</span>
          </div>

          <table className="border-collapse w-full border border-black text-[9.5pt]">
            <tbody>
              <tr className="bg-slate-100 font-bold"><td colSpan={4} className="p-1 border border-black uppercase">I. DATA DAERAH ASAL</td></tr>
              <tr>
                <td className="p-1 border border-black w-[25%] font-medium">Nomor Kartu Keluarga</td>
                <td className="p-1 border border-black w-[35%] font-bold">{formData.kkNumber}</td>
                <td className="p-1 border border-black w-[20%] font-medium">Nama Kepala Keluarga</td>
                <td className="p-1 border border-black w-[20%]">{toProperCase(formData.kkHead)}</td>
              </tr>
              <tr>
                <td className="p-1 border border-black font-medium">NIK Pemohon</td>
                <td className="p-1 border border-black font-bold">{formData.nik}</td>
                <td className="p-1 border border-black font-medium">Nama Pemohon</td>
                <td className="p-1 border border-black">{toProperCase(formData.name)}</td>
              </tr>
              <tr>
                <td className="p-1 border border-black font-medium">Alamat Asal</td>
                <td colSpan={3} className="p-1 border border-black">
                  Desa Sampeldes, RT {formData.currentAddressRt} / RW {formData.currentAddressRw}, Kec. Gandrungmangu,, Kab. Cilacap, Jawa Tengah (Kode Pos: 53254)
                </td>
              </tr>

              <tr className="bg-slate-100 font-bold"><td colSpan={4} className="p-1 border border-black uppercase">II. DATA DAERAH TUJUAN PINDAH</td></tr>
              <tr>
                <td className="p-1 border border-black font-medium">Alamat Tujuan</td>
                <td colSpan={3} className="p-1 border border-black font-semibold">
                  Desa/Kel: {formData.destinationAddress}, RT {formData.destinationAddressRt} / RW {formData.destinationAddressRw}, Kec: {formData.destinationKecamatan}, Kab/Kota: {formData.destinationKabupaten}, Provinsi: {formData.destinationProvinsi}
                </td>
              </tr>
              <tr>
                <td className="p-1 border border-black font-medium">Alasan Pindah</td>
                <td className="p-1 border border-black">{formData.reason || 'Pekerjaan / Keluarga / Perumahan'}</td>
                <td className="p-1 border border-black font-medium">Klasifikasi Pindah</td>
                <td className="p-1 border border-black">Antar Kab/Kota / Provinsi</td>
              </tr>
              <tr>
                <td className="p-1 border border-black font-medium">Jumlah Anggota Pindah</td>
                <td colSpan={3} className="p-1 border border-black font-bold">{formData.familyCount || '1'} Orang</td>
              </tr>

              <tr className="bg-slate-100 font-bold"><td colSpan={4} className="p-1 border border-black uppercase">III. DAFTAR ANGGOTA KELUARGA YANG PINDAH</td></tr>
              <tr>
                <td colSpan={4} className="p-0 border border-black">
                  <table className="w-full border-collapse text-[9pt]">
                    <thead>
                      <tr className="bg-slate-50 border-b border-black">
                        <th className="p-1 border-r border-black w-8 text-center">No</th>
                        <th className="p-1 border-r border-black text-left w-36">NIK</th>
                        <th className="p-1 border-r border-black text-left">Nama Lengkap</th>
                        <th className="p-1 text-left w-28">SHDK</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-black">
                        <td className="p-1 border-r border-black text-center">1</td>
                        <td className="p-1 border-r border-black font-mono">{formData.nik}</td>
                        <td className="p-1 border-r border-black font-semibold">{toProperCase(formData.name)}</td>
                        <td className="p-1">PEMOHON</td>
                      </tr>
                      {formData.familyMembers && formData.familyMembers.map((m: any, i: number) => (
                        <tr key={i} className="border-b border-black">
                          <td className="p-1 border-r border-black text-center">{i + 2}</td>
                          <td className="p-1 border-r border-black font-mono">{m.nik}</td>
                          <td className="p-1 border-r border-black">{toProperCase(m.name)}</td>
                          <td className="p-1">{m.relationship ? m.relationship.toUpperCase() : '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </td>
              </tr>
            </tbody>
          </table>

          <p className="text-justify text-[9pt] leading-normal pt-1">
            Demikian formulir pendaftaran perpindahan penduduk F-1.03 ini diisi dengan sadar dan sebenarnya untuk proses penerbitan Surat Keterangan Pindah WNI (SKPWNI) pada Disdukcapil Kabupaten Cilacap.
          </p>

          <div className="pt-6 grid grid-cols-2 text-center text-sm">
            <div className="space-y-16">
              <p>Mengetahui,<br />Kepala Desa Sampeldes</p>
              <p className="font-bold underline uppercase">TUKIMAN</p>
            </div>
            <div className="space-y-16">
              <p>Pemohon,</p>
              <p className="font-bold underline uppercase">{formData.name}</p>
            </div>
          </div>
        </div>
      ),
      showSignatures: false,
      pageNumber: 2,
      totalPages: 2
    }
  ];

  return (
    <PrintLayout
      submission={submission}
      pages={pages}
      fontSize="12pt"
    />
  );
}

