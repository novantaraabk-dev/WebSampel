'use client';

import { LetterSubmission } from '@/lib/types';
import { PrintLayout, DataRow, formatTTL, toProperCase, formatDateIndo, formatGender } from './print-layout';

export function KkPermohonanPrintTemplate({
  submission,
  type = 'baru',
}: {
  submission: LetterSubmission;
  type?: 'baru' | 'perubahan';
}) {
  const { formData } = submission;
  const isNew = type === 'baru' || submission.letterType?.toLowerCase().includes('baru');
  const formCode = isNew ? 'F-1.15' : 'F-1.16';
  const titleText = isNew ? 'PERMOHONAN KARTU KELUARGA (KK) BARU' : 'PERMOHONAN PERUBAHAN KARTU KELUARGA';

  const members = formData.familyMembers && formData.familyMembers.length > 0 ? formData.familyMembers : [
    {
      name: formData.name,
      nik: formData.nik,
      gender: formData.gender,
      birthPlace: formData.birthPlace,
      birthDate: formData.birthDate,
      religion: formData.religion || 'Islam',
      job: formData.job,
      shdk: 'KEPALA KELUARGA',
    },
    ...(formData.spouseName ? [{
      name: formData.spouseName,
      nik: formData.spouseNik || '-',
      gender: formData.gender?.toLowerCase() === 'laki-laki' ? 'Perempuan' : 'Laki-laki',
      birthPlace: formData.spouseBirthPlace || '-',
      birthDate: formData.spouseBirthDate || '-',
      religion: formData.religion || 'Islam',
      job: formData.spouseJob || 'Ibu Rumah Tangga',
      shdk: 'ISTRI',
    }] : [])
  ];

  const pages = [
    // ========================================================
    // LEMBAR I: SURAT PENGANTAR PERMOHONAN KK DARI DESA
    // ========================================================
    {
      showKop: true,
      title: `SURAT PENGANTAR ${titleText}`,
      subtitle: `Nomor : ${submission.documentNumber}`,
      content: (
        <div className="space-y-3 text-justify text-[11pt] leading-normal">
          <div className="mb-2 text-right text-[11pt]">
            <p>Kepada Yth.</p>
            <p className="font-semibold">Kepala Dinas Kependudukan dan Pencatatan Sipil Kab. Cilacap</p>
            <p>melalui Camat Gandrungmangu</p>
            <p>di - <span className="underline">Tempat</span></p>
          </div>

          <p className="leading-relaxed">
            Yang bertanda tangan di bawah ini Kepala Desa Sampeldes, Kecamatan Gandrungmangu, Kabupaten Cilacap, dengan ini menerangkan dan mengajukan permohonan penerbitan Kartu Keluarga untuk:
          </p>

          <table className="border-collapse w-full">
            <tbody>
              <DataRow compact="tight" label="Nama Pemohon" value={formData.name} />
              <DataRow compact="tight" label="NIK" value={formData.nik} />
              <DataRow compact="tight" label="Nomor KK Semula (Lama)" value={formData.kkNumber || '-'} />
              <DataRow compact="tight" label="Alamat Tempat Tinggal" value={formData.address} />
              <DataRow compact="tight" label="RT / RW" value={`${formData.rt || '00'} / ${formData.rw || '00'}`} />
              <DataRow compact="tight" label="Jumlah Anggota Keluarga" value={`${members.length} Orang`} />
              <DataRow compact="tight" label="Alasan Permohonan" value={formData.reason || (isNew ? 'Membentuk Keluarga Baru (Pernikahan) / Pemisahan KK' : 'Perubahan Susunan Anggota Keluarga / Perbaikan Elemen Data')} />
            </tbody>
          </table>

          <p className="mt-2.5 leading-relaxed">
            Bersama surat pengantar ini kami lampirkan berkas persyaratan pendukung berupa Formulir {formCode}, Buku Nikah / Kutipan Akta Perkawinan, Ijazah, dan dokumen pendukung lainnya sesuai ketentuan yang berlaku.
          </p>

          <p className="mt-2 leading-relaxed">
            Demikian surat pengantar ini dibuat dengan sebenarnya agar dapat diproses sebagaimana mestinya.
          </p>
        </div>
      ),
      pageNumber: 1,
      totalPages: 2,
      showSignatures: true,
      inlineSignatures: true,
    },

    // ========================================================
    // LEMBAR II: LAMPIRAN FORMULIR F-1.15 / F-1.16 DUKCAPIL
    // ========================================================
    {
      showKop: false,
      title: `FORMULIR PERMOHONAN KARTU KELUARGA (${formCode})`,
      subtitle: 'DINAS KEPENDUDUKAN DAN PENCATATAN SIPIL KABUPATEN CILACAP',
      content: (
        <div className="space-y-2.5 text-justify text-[10pt] leading-normal">
          <div className="flex justify-between items-center border-b pb-1 text-[8.5pt] font-mono">
            <span>PROVINSI: JAWA TENGAH (33) | KABUPATEN: CILACAP (01) | KECAMATAN: GANDRUNGMANGU (10) | DESA: SAMPELDES (2010)</span>
            <span className="font-bold border border-black px-2 py-0.5">{formCode}</span>
          </div>

          <table className="border-collapse w-full text-[9.5pt]">
            <tbody>
              <DataRow compact="tight" label="Nama Pemohon" value={formData.name} />
              <DataRow compact="tight" label="NIK Pemohon" value={formData.nik} />
              <DataRow compact="tight" label="Nomor KK Semula" value={formData.kkNumber || '-'} />
              <DataRow compact="tight" label="Alamat Pemohon" value={`${formData.address}, RT ${formData.rt || '00'}/RW ${formData.rw || '00'}`} />
            </tbody>
          </table>

          <p className="font-bold text-slate-900 text-[9.5pt] mt-1">DAFTAR SUSUNAN ANGGOTA KELUARGA YANG DIAJUKAN :</p>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-black text-[9pt]">
              <thead>
                <tr className="bg-slate-100">
                  <th className="border border-black px-1.5 py-1 text-center w-6">No</th>
                  <th className="border border-black px-1.5 py-1 text-left w-36">Nama Lengkap</th>
                  <th className="border border-black px-1.5 py-1 text-left w-32">NIK</th>
                  <th className="border border-black px-1.5 py-1 text-left w-12">JK</th>
                  <th className="border border-black px-1.5 py-1 text-left">Tempat, Tgl Lahir</th>
                  <th className="border border-black px-1.5 py-1 text-left w-16">Agama</th>
                  <th className="border border-black px-1.5 py-1 text-left w-24">SHDK</th>
                </tr>
              </thead>
              <tbody>
                {members.map((m: any, idx: number) => (
                  <tr key={idx}>
                    <td className="border border-black px-1.5 py-1 text-center">{idx + 1}</td>
                    <td className="border border-black px-1.5 py-1 font-semibold">{toProperCase(m.name)}</td>
                    <td className="border border-black px-1.5 py-1 font-mono text-[8.5pt]">{m.nik}</td>
                    <td className="border border-black px-1.5 py-1">{m.gender?.toLowerCase() === 'laki-laki' || m.gender === 'L' ? 'L' : 'P'}</td>
                    <td className="border border-black px-1.5 py-1">{formatTTL(m.birthPlace, m.birthDate)}</td>
                    <td className="border border-black px-1.5 py-1">{m.religion || 'Islam'}</td>
                    <td className="border border-black px-1.5 py-1 font-semibold">{m.shdk || (idx === 0 ? 'KEPALA KELUARGA' : 'ANGGOTA')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="text-[9pt] italic mt-1">
            Data keluarga di atas diisi berdasarkan dokumen kependudukan yang sah dan menjadi dasar pencetakan blangko Kartu Keluarga oleh Pejabat Disdukcapil.
          </p>

          <div className="mt-4 grid grid-cols-3 text-center text-[9.5pt]">
            <div>
              <p>Mengetahui,</p>
              <p className="font-semibold mb-2">Camat Gandrungmangu</p>
              <div className="h-14" />
              <p className="font-bold underline">( ....................................... )</p>
              <p className="text-xs text-slate-600">NIP. ....................................</p>
            </div>
            <div>
              <p>Mengetahui,</p>
              <p className="font-semibold mb-2">Kepala Desa Sampeldes</p>
              <div className="h-14" />
              <p className="font-bold underline">TUKIMAN</p>
            </div>
            <div>
              <p>Sampeldes, {formatDateIndo(formData.letterDate || new Date().toISOString())}</p>
              <p className="mb-2">Pemohon / Kepala Keluarga,</p>
              <div className="h-14" />
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

  return <PrintLayout submission={submission} fontSize="11pt" pages={pages} />;
}

