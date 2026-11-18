'use client';

import { LetterSubmission } from '@/lib/types';
import { PrintLayout, formatTTL, toProperCase, formatFullDate, formatGender } from './print-layout';

/**
 * Custom data row for the Death Certificate template.
 * Uses 3 columns to ensure multiline alignment (e.g. for address).
 */
const CustomDataRow = ({ label, value, indent = false }: { label: string; value?: any; indent?: boolean }) => {
  const colon = value !== undefined && value !== null ? ':' : '';
  let displayValue = value !== undefined && value !== null ? value : '';

  if (typeof displayValue === 'string') {
    const lowerLabel = label.toLowerCase();
    if (lowerLabel.includes('kelamin') || lowerLabel.includes('gender')) {
      displayValue = formatGender(displayValue);
    } else if (
      lowerLabel.includes('nama') ||
      lowerLabel.includes('alamat') ||
      lowerLabel.includes('tempat') ||
      lowerLabel.includes('pekerjaan')
    ) {
      displayValue = toProperCase(displayValue);
    }
  }

  return (
    <tr className="leading-tight">
      <td className={`py-[1px] align-top text-[11pt] ${indent ? 'pl-4 w-[33%]' : 'w-[30%]'}`}>{label}</td>
      <td className="w-[2%] py-[1px] align-top text-center text-[11pt]">{colon}</td>
      <td className="w-[68%] py-[1px] align-top pl-1 text-[11pt]">{displayValue}</td>
    </tr>
  );
};

export function KematianPrintTemplate({ submission }: { submission: LetterSubmission }) {
  const { formData } = submission;

  const pages = [
    // ========================================================
    // LEMBAR I: SURAT KETERANGAN KEMATIAN DESA RESMI (TUNTAS 1 LEMBAR)
    // ========================================================
    {
      showKop: true,
      title: 'SURAT KETERANGAN KEMATIAN',
      subtitle: `Nomor : ${submission.documentNumber}`,
      content: (
        <div className="space-y-2 text-justify text-[11pt] leading-snug">
          <p className="mt-1 leading-normal text-[11pt]">
            Yang bertanda tangan di bawah ini Kepala Desa Sampeldes, Kecamatan
            Gandrungmangu, Kabupaten Cilacap, menerangkan dengan sebenarnya bahwa :
          </p>

          <table className="border-collapse w-full text-[11pt]">
            <tbody>
              <tr>
                <td colSpan={3} className="pt-1 pb-0.5 font-bold border-b text-slate-900 uppercase tracking-wide text-[11pt]">
                  I. DATA JENAZAH (ALMARHUM / ALMARHUMAH)
                </td>
              </tr>
              <CustomDataRow label="1. Nama Lengkap" value={formData.name} />
              <CustomDataRow label="2. NIK Jenazah" value={formData.nik} />
              <CustomDataRow label="3. Jenis Kelamin" value={formData.gender} />
              <CustomDataRow label="4. Tempat / Tanggal Lahir" value={formatTTL(formData.placeOfBirth, formData.birthDate)} />
              <CustomDataRow label="5. Umur Saat Meninggal" value={formData.age ? `${formData.age} Tahun` : '-'} />
              <CustomDataRow label="6. Agama / Kewarganegaraan" value={`${formData.religion || 'Islam'} / WNI`} />
              <CustomDataRow label="7. Pekerjaan Terakhir" value={formData.occupation || formData.job || '-'} />
              <CustomDataRow label="8. Alamat Duka" value={`${formData.address}, RT ${formData.rt || '00'} / RW ${formData.rw || '00'}, Desa Sampeldes`} />

              <tr>
                <td colSpan={3} className="pt-1.5 pb-0.5 font-bold border-b text-slate-900 uppercase tracking-wide text-[11pt]">
                  II. PERISTIWA KEMATIAN
                </td>
              </tr>
              <CustomDataRow label="1. Hari / Tanggal Kematian" value={formatFullDate(formData.deathDate)} />
              <CustomDataRow label="2. Waktu / Jam Kematian" value={formData.deathTime ? `${formData.deathTime} WIB` : '-'} />
              <CustomDataRow label="3. Tempat Meninggal" value={formData.deathLocation || 'Rumah Duka'} />
              <CustomDataRow label="4. Penyebab Kematian" value={formData.deathCause || 'Sakit Biasa / Usia Lanjut'} />
              <CustomDataRow label="5. Yang Menerangkan Kematian" value={formData.whoExplains || 'Dokter / Tenaga Medis / Pamong Desa'} />

              <tr>
                <td colSpan={3} className="pt-1.5 pb-0.5 font-bold border-b text-slate-900 uppercase tracking-wide text-[11pt]">
                  III. KETERANGAN KELUARGA & PELAPOR
                </td>
              </tr>
              <CustomDataRow label="1. Nama Orang Tua Kandung" value={`Ayah: ${toProperCase(formData.fatherName || '-')} / Ibu: ${toProperCase(formData.motherName || '-')}`} />
              <CustomDataRow label="2. Nama Pelapor Kematian" value={`${toProperCase(formData.reporterName || '-')} (NIK: ${formData.reporterNik || '-'})`} />
              <CustomDataRow label="3. Hubungan dengan Jenazah" value={formData.reporterRelation || 'Keluarga Kandung / Ahli Waris'} />
            </tbody>
          </table>

          <p className="mt-2 text-justify leading-normal text-[11pt]">
            Surat keterangan ini diterbitkan berdasarkan laporan yang sebenarnya dari pihak pelapor dan dipergunakan sebagai kelengkapan pengurusan administrasi kependudukan / pelaporan Akta Kematian pada Dinas Kependudukan dan Pencatatan Sipil.
          </p>

          <p className="mt-1 text-justify leading-normal text-[11pt]">
            Demikian Surat Keterangan Kematian ini dibuat dengan sebenarnya dan dapat dipergunakan sebagaimana mestinya.
          </p>
        </div>
      ),
      pageNumber: 1,
      totalPages: 2,
      showSignatures: true,
      inlineSignatures: true,
    },

    // ========================================================
    // LEMBAR II: LAMPIRAN FORMULIR PELAPORAN KEMATIAN (F-2.01 DUKCAPIL)
    // ========================================================
    {
      showKop: false,
      title: 'FORMULIR PELAPORAN PENCATATAN SIPIL KEMATIAN (F-2.01)',
      subtitle: 'DINAS KEPENDUDUKAN DAN PENCATATAN SIPIL KABUPATEN CILACAP',
      content: (
        <div className="space-y-2.5 text-[9.5pt] leading-tight">
          <div className="flex justify-between items-center border-b pb-1 text-[8.5pt] font-mono">
            <span>PROVINSI: JAWA TENGAH (33) | KABUPATEN: CILACAP (01) | KECAMATAN: GANDRUNGMANGU (10) | DESA: SAMPELDES (2010)</span>
            <span className="font-bold border border-black px-2 py-0.5">FORMULIR F-2.01</span>
          </div>

          <p className="text-justify text-[9pt] leading-normal italic">
            Formulir ini merupakan lampiran resmi Surat Keterangan Kematian Desa untuk pelaporan penerbitan Akta Kematian pada Dinas Kependudukan dan Pencatatan Sipil sesuai Permendagri No. 108/2019:
          </p>

          <table className="border-collapse w-full border border-black text-[9pt]">
            <tbody>
              <tr className="bg-slate-100 font-bold">
                <td colSpan={4} className="p-1 border border-black uppercase">I. DATA ALMARHUM / ALMARHUMAH</td>
              </tr>
              <tr>
                <td className="p-1 border border-black w-[24%] font-medium">Nama Jenazah</td>
                <td className="p-1 border border-black w-[36%] font-bold">{toProperCase(formData.name)}</td>
                <td className="p-1 border border-black w-[18%] font-medium">Jenis Kelamin</td>
                <td className="p-1 border border-black w-[22%]">{formatGender(formData.gender)}</td>
              </tr>
              <tr>
                <td className="p-1 border border-black font-medium">NIK Jenazah</td>
                <td className="p-1 border border-black font-mono">{formData.nik}</td>
                <td className="p-1 border border-black font-medium">Nomor Kartu Keluarga</td>
                <td className="p-1 border border-black font-mono">{formData.kkNumber || '-'}</td>
              </tr>
              <tr>
                <td className="p-1 border border-black font-medium">Tempat / Tgl Lahir</td>
                <td className="p-1 border border-black">{formatTTL(formData.placeOfBirth, formData.birthDate)}</td>
                <td className="p-1 border border-black font-medium">Umur / Agama</td>
                <td className="p-1 border border-black">{formData.age ? `${formData.age} Th` : '-'} / {formData.religion || 'Islam'}</td>
              </tr>
              <tr>
                <td className="p-1 border border-black font-medium">Alamat Jenazah</td>
                <td colSpan={3} className="p-1 border border-black">{formData.address}, Desa Sampeldes</td>
              </tr>

              <tr className="bg-slate-100 font-bold">
                <td colSpan={4} className="p-1 border border-black uppercase">II. PERISTIWA KEMATIAN</td>
              </tr>
              <tr>
                <td className="p-1 border border-black font-medium">Hari / Tgl Kematian</td>
                <td className="p-1 border border-black">{formatFullDate(formData.deathDate)}</td>
                <td className="p-1 border border-black font-medium">Pukul / Waktu</td>
                <td className="p-1 border border-black">{formData.deathTime ? `${formData.deathTime} WIB` : '-'}</td>
              </tr>
              <tr>
                <td className="p-1 border border-black font-medium">Tempat Kematian</td>
                <td className="p-1 border border-black">{formData.deathLocation || 'Rumah Duka'}</td>
                <td className="p-1 border border-black font-medium">Sebab Kematian</td>
                <td className="p-1 border border-black">{formData.deathCause || 'Sakit / Usia Lanjut'}</td>
              </tr>
              <tr>
                <td className="p-1 border border-black font-medium">Yang Menerangkan</td>
                <td colSpan={3} className="p-1 border border-black">{formData.whoExplains || 'Dokter / Tenaga Kesehatan / Kepala Desa'}</td>
              </tr>

              <tr className="bg-slate-100 font-bold">
                <td colSpan={4} className="p-1 border border-black uppercase">III. DATA ORANG TUA JENAZAH</td>
              </tr>
              <tr>
                <td className="p-1 border border-black font-medium">Nama Ayah Kandung</td>
                <td className="p-1 border border-black">{toProperCase(formData.fatherName || '-')}</td>
                <td className="p-1 border border-black font-medium">NIK Ayah</td>
                <td className="p-1 border border-black font-mono">{formData.fatherNik || '-'}</td>
              </tr>
              <tr>
                <td className="p-1 border border-black font-medium">Nama Ibu Kandung</td>
                <td className="p-1 border border-black">{toProperCase(formData.motherName || '-')}</td>
                <td className="p-1 border border-black font-medium">NIK Ibu</td>
                <td className="p-1 border border-black font-mono">{formData.motherNik || '-'}</td>
              </tr>

              <tr className="bg-slate-100 font-bold">
                <td colSpan={4} className="p-1 border border-black uppercase">IV. DATA PELAPOR & SAKSI KEMATIAN</td>
              </tr>
              <tr>
                <td className="p-1 border border-black font-medium">Nama Pelapor</td>
                <td className="p-1 border border-black font-semibold">{toProperCase(formData.reporterName)}</td>
                <td className="p-1 border border-black font-medium">NIK Pelapor</td>
                <td className="p-1 border border-black font-mono">{formData.reporterNik}</td>
              </tr>
              <tr>
                <td className="p-1 border border-black font-medium">Pekerjaan & Alamat</td>
                <td colSpan={3} className="p-1 border border-black">{formData.reporterJob || 'Wiraswasta'} — {formData.reporterAddress || formData.address}</td>
              </tr>
              <tr>
                <td className="p-1 border border-black font-medium">Saksi I</td>
                <td className="p-1 border border-black">{toProperCase(formData.witness1Name)} (NIK: {formData.witness1Nik})</td>
                <td className="p-1 border border-black font-medium">Saksi II</td>
                <td className="p-1 border border-black">{toProperCase(formData.witness2Name)} (NIK: {formData.witness2Nik})</td>
              </tr>
            </tbody>
          </table>

          <p className="text-justify text-[8.5pt] leading-tight italic pt-0.5">
            Surat Pernyataan / Formulir F-2.01 ini dibuat dengan sadar dan sebenar-benarnya tanpa paksaan. Apabila di kemudian hari data yang disampaikan terbukti tidak benar, kami bersedia dituntut sesuai hukum yang berlaku.
          </p>

          {/* Tanda Tangan 4 Kolom Sesuai Formulir F-2.01 OpenSID */}
          <div className="pt-3 grid grid-cols-4 text-center text-[8.5pt]">
            <div className="space-y-12">
              <p>Saksi I,</p>
              <div>
                <p className="font-bold underline uppercase">{formData.witness1Name || 'Saksi I'}</p>
                <p className="text-[7.5pt] text-slate-500 font-mono">NIK: {formData.witness1Nik || '-'}</p>
              </div>
            </div>
            <div className="space-y-12">
              <p>Saksi II,</p>
              <div>
                <p className="font-bold underline uppercase">{formData.witness2Name || 'Saksi II'}</p>
                <p className="text-[7.5pt] text-slate-500 font-mono">NIK: {formData.witness2Nik || '-'}</p>
              </div>
            </div>
            <div className="space-y-12">
              <p>Pelapor,</p>
              <div>
                <p className="font-bold underline uppercase">{formData.reporterName || formData.name}</p>
                <p className="text-[7.5pt] text-slate-500 font-mono">NIK: {formData.reporterNik || formData.nik}</p>
              </div>
            </div>
            <div className="space-y-12">
              <p>Kepala Desa Sampeldes,</p>
              <div>
                <p className="font-bold underline uppercase">TUKIMAN</p>
                <p className="text-[7.5pt] text-slate-500"></p>
              </div>
            </div>
          </div>
        </div>
      ),
      showSignatures: false,
      pageNumber: 2,
      totalPages: 2,
    },
  ];

  return (
    <PrintLayout
      submission={submission}
      requesterLabel="Pelapor"
      reverseSignatures={true}
      pages={pages}
    />
  );
}

