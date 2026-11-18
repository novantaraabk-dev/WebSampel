'use client';

import { LetterSubmission } from '@/lib/types';
import { PrintLayout, formatTTL, toProperCase, formatGender } from './print-layout';

/**
 * Custom data row for the Birth Certificate template.
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

export function KelahiranPrintTemplate({ submission }: { submission: LetterSubmission }) {
  const { formData } = submission;

  const displayWeight = formData.birthWeight
    ? (String(formData.birthWeight).toLowerCase().includes('kg') ? formData.birthWeight : `${formData.birthWeight} Kg`)
    : '-';

  const displayLength = formData.birthLength
    ? (String(formData.birthLength).toLowerCase().includes('cm') ? formData.birthLength : `${formData.birthLength} Cm`)
    : '-';

  const pages = [
    // ========================================================
    // LEMBAR I: SURAT KETERANGAN KELAHIRAN DESA RESMI (TUNTAS 1 LEMBAR)
    // ========================================================
    {
      showKop: true,
      title: 'SURAT KETERANGAN KELAHIRAN',
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
                  I. DATA KELAHIRAN BAYI / ANAK
                </td>
              </tr>
              <CustomDataRow label="1. Nama Lengkap Anak" value={formData.childName} />
              <CustomDataRow label="2. Jenis Kelamin" value={formData.childGender} />
              <CustomDataRow label="3. Tempat Dilahirkan" value={formData.childBirthLocation || 'Puskesmas / Rumah Sakit / Bidan'} />
              <CustomDataRow label="4. Tempat / Tanggal Lahir" value={formatTTL(formData.childBirthPlace, formData.childBirthDate)} />
              <CustomDataRow label="5. Waktu / Pukul Lahir" value={formData.childBirthTime ? `${formData.childBirthTime} WIB` : '-'} />
              <CustomDataRow label="6. Kelahiran Ke-" value={formData.childOrder || formData.birthOrder || '1 (Satu)'} />
              <CustomDataRow label="7. Berat / Panjang Bayi" value={`${displayWeight} / ${displayLength}`} />
              <CustomDataRow label="8. Penolong Kelahiran" value={formData.birthAssistant || 'Dokter / Bidan / Tenaga Medis'} />

              <tr>
                <td colSpan={3} className="pt-1.5 pb-0.5 font-bold border-b text-slate-900 uppercase tracking-wide text-[11pt]">
                  II. DATA ORANG TUA KANDUNG
                </td>
              </tr>
              <CustomDataRow label="1. Nama Ibu Kandung" value={formData.motherName} />
              <CustomDataRow label="2. NIK Ibu" value={formData.motherNik || '-'} />
              <CustomDataRow label="3. Tempat / Tgl Lahir Ibu" value={formatTTL(formData.motherBirthPlace, formData.motherBirthDate)} />
              <CustomDataRow label="4. Pekerjaan Ibu" value={formData.motherJob || 'Ibu Rumah Tangga'} />
              <CustomDataRow label="5. Nama Ayah Kandung" value={formData.fatherName} />
              <CustomDataRow label="6. NIK Ayah" value={formData.fatherNik || '-'} />
              <CustomDataRow label="7. Tempat / Tgl Lahir Ayah" value={formatTTL(formData.fatherBirthPlace, formData.fatherBirthDate)} />
              <CustomDataRow label="8. Pekerjaan Ayah" value={formData.fatherJob || 'Wiraswasta'} />
              <CustomDataRow label="9. Alamat Tempat Tinggal" value={`${formData.childAddress || formData.address || 'Desa Sampeldes'}, RT ${formData.rt || '00'}/RW ${formData.rw || '00'}`} />
            </tbody>
          </table>

          <p className="mt-2 text-justify leading-normal text-[11pt]">
            Surat keterangan ini diterbitkan berdasarkan permohonan pelapor atas nama <strong>{toProperCase(formData.reporterName || formData.fatherName || formData.motherName)}</strong> sebagai dasar pencatatan peristiwa kelahiran dan penerbitan Kutipan Akta Kelahiran pada Dinas Kependudukan dan Pencatatan Sipil.
          </p>

          <p className="mt-1 text-justify leading-normal text-[11pt]">
            Demikian Surat Keterangan Kelahiran ini dibuat dengan sebenarnya untuk dapat dipergunakan sebagaimana mestinya.
          </p>
        </div>
      ),
      pageNumber: 1,
      totalPages: 2,
      showSignatures: true,
      inlineSignatures: true,
    },

    // ========================================================
    // LEMBAR II: LAMPIRAN FORMULIR PELAPORAN KELAHIRAN (F-2.01 DUKCAPIL)
    // ========================================================
    {
      showKop: false,
      title: 'FORMULIR PELAPORAN PENCATATAN SIPIL KELAHIRAN (F-2.01)',
      subtitle: 'DINAS KEPENDUDUKAN DAN PENCATATAN SIPIL KABUPATEN CILACAP',
      content: (
        <div className="space-y-2.5 text-[9.5pt] leading-tight">
          <div className="flex justify-between items-center border-b pb-1 text-[8.5pt] font-mono">
            <span>PROVINSI: JAWA TENGAH (33) | KABUPATEN: CILACAP (01) | KECAMATAN: GANDRUNGMANGU (10) | DESA: SAMPELDES (2010)</span>
            <span className="font-bold border border-black px-2 py-0.5">FORMULIR F-2.01</span>
          </div>

          <p className="text-justify text-[9pt] leading-normal italic">
            Formulir ini merupakan lampiran resmi Surat Keterangan Kelahiran Desa untuk pelaporan penerbitan Akta Kelahiran pada Dinas Kependudukan dan Pencatatan Sipil sesuai Permendagri No. 108/2019:
          </p>

          <table className="border-collapse w-full border border-black text-[9pt]">
            <tbody>
              <tr className="bg-slate-100 font-bold">
                <td colSpan={4} className="p-1 border border-black uppercase">I. DATA ANAK YANG DILAHIRKAN</td>
              </tr>
              <tr>
                <td className="p-1 border border-black w-[24%] font-medium">Nama Lengkap Bayi</td>
                <td className="p-1 border border-black w-[36%] font-bold">{toProperCase(formData.childName)}</td>
                <td className="p-1 border border-black w-[18%] font-medium">Jenis Kelamin</td>
                <td className="p-1 border border-black w-[22%]">{formatGender(formData.childGender)}</td>
              </tr>
              <tr>
                <td className="p-1 border border-black font-medium">Tempat Dilahirkan</td>
                <td className="p-1 border border-black">{formData.childBirthLocation || 'Puskesmas / RS / Klinik Bidan'}</td>
                <td className="p-1 border border-black font-medium">Tempat / Tgl Lahir</td>
                <td className="p-1 border border-black">{formData.childBirthPlace}, {formData.childBirthDate}</td>
              </tr>
              <tr>
                <td className="p-1 border border-black font-medium">Waktu / Pukul Lahir</td>
                <td className="p-1 border border-black">{formData.childBirthTime ? `${formData.childBirthTime} WIB` : '-'}</td>
                <td className="p-1 border border-black font-medium">Jenis Kelahiran</td>
                <td className="p-1 border border-black">{formData.birthType || 'Tunggal'}</td>
              </tr>
              <tr>
                <td className="p-1 border border-black font-medium">Kelahiran Ke-</td>
                <td className="p-1 border border-black">{formData.childOrder || '1'}</td>
                <td className="p-1 border border-black font-medium">Berat & Panjang</td>
                <td className="p-1 border border-black">{displayWeight} / {displayLength}</td>
              </tr>
              <tr>
                <td className="p-1 border border-black font-medium">Penolong Kelahiran</td>
                <td colSpan={3} className="p-1 border border-black">{formData.birthAssistant || 'Dokter / Bidan / Tenaga Medis'}</td>
              </tr>

              <tr className="bg-slate-100 font-bold">
                <td colSpan={4} className="p-1 border border-black uppercase">II. DATA IBU & AYAH KANDUNG</td>
              </tr>
              <tr>
                <td className="p-1 border border-black font-medium">Nama Ibu Kandung</td>
                <td className="p-1 border border-black font-semibold">{toProperCase(formData.motherName)}</td>
                <td className="p-1 border border-black font-medium">NIK Ibu</td>
                <td className="p-1 border border-black font-mono">{formData.motherNik || '-'}</td>
              </tr>
              <tr>
                <td className="p-1 border border-black font-medium">TTL / Pekerjaan Ibu</td>
                <td colSpan={3} className="p-1 border border-black">{formatTTL(formData.motherBirthPlace, formData.motherBirthDate)} — {formData.motherJob || 'Ibu Rumah Tangga'}</td>
              </tr>
              <tr>
                <td className="p-1 border border-black font-medium">Nama Ayah Kandung</td>
                <td className="p-1 border border-black font-semibold">{toProperCase(formData.fatherName)}</td>
                <td className="p-1 border border-black font-medium">NIK Ayah</td>
                <td className="p-1 border border-black font-mono">{formData.fatherNik || '-'}</td>
              </tr>
              <tr>
                <td className="p-1 border border-black font-medium">TTL / Pekerjaan Ayah</td>
                <td colSpan={3} className="p-1 border border-black">{formatTTL(formData.fatherBirthPlace, formData.fatherBirthDate)} — {formData.fatherJob || 'Wiraswasta'}</td>
              </tr>

              <tr className="bg-slate-100 font-bold">
                <td colSpan={4} className="p-1 border border-black uppercase">III. DATA PELAPOR & SAKSI KELAHIRAN</td>
              </tr>
              <tr>
                <td className="p-1 border border-black font-medium">Nama Pelapor</td>
                <td className="p-1 border border-black font-semibold">{toProperCase(formData.reporterName || formData.fatherName)}</td>
                <td className="p-1 border border-black font-medium">NIK Pelapor</td>
                <td className="p-1 border border-black font-mono">{formData.reporterNik || formData.fatherNik || '-'}</td>
              </tr>
              <tr>
                <td className="p-1 border border-black font-medium">Hubungan / Alamat</td>
                <td colSpan={3} className="p-1 border border-black">
                  {formData.reporterRelationship ? `${formData.reporterRelationship} — ` : ''}
                  {formData.reporterJob || 'Orang Tua Kandung'} — {formData.reporterAddress || formData.childAddress || 'Desa Sampeldes'}
                </td>
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
            Surat Pernyataan / Formulir F-2.01 ini dibuat dengan sadar dan sebenar-benarnya tanpa paksaan. Apabila di kemudian hari data kelahiran yang disampaikan terbukti tidak benar, kami bersedia dituntut sesuai hukum yang berlaku.
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
                <p className="font-bold underline uppercase">{formData.reporterName || formData.fatherName || formData.name}</p>
                <p className="text-[7.5pt] text-slate-500 font-mono">NIK: {formData.reporterNik || formData.fatherNik || formData.nik}</p>
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
      requesterNameOverride={formData.reporterName || formData.fatherName}
      pages={pages}
    />
  );
}

