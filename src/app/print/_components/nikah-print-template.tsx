'use client';

import { LetterSubmission } from '@/lib/types';
import { PrintLayout, formatTTL, toProperCase, formatFullDate, formatDateIndo, formatGender } from './print-layout';

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
      <td className={`py-[0.5px] align-top text-[11.5pt] ${indent ? 'pl-3 w-[33%]' : 'w-[31%]'}`}>{label}</td>
      <td className="w-[2%] py-[0.5px] align-top text-center text-[11.5pt]">{colon}</td>
      <td className="w-[67%] py-[0.5px] align-top pl-1 text-[11.5pt]">{displayValue}</td>
    </tr>
  );
};

export function NikahPrintTemplate({ submission }: { submission: LetterSubmission }) {
  const { formData } = submission;
  const isMale = formatGender(formData.gender) === 'Laki-laki';
  const groomName = isMale ? formData.name : formData.spouseName;
  const groomNik = isMale ? formData.nik : formData.spouseNik || '-';
  const groomTtl = isMale
    ? formatTTL(formData.birthPlace, formData.birthDate)
    : formatTTL(formData.spouseBirthPlace, formData.spouseBirthDate);
  const groomJob = isMale ? formData.job || 'Wiraswasta' : formData.spouseJob || 'Wiraswasta';
  const groomAddress = isMale ? formData.address : formData.spouseAddress || '-';

  const brideName = !isMale ? formData.name : formData.spouseName;
  const brideNik = !isMale ? formData.nik : formData.spouseNik || '-';
  const brideTtl = !isMale
    ? formatTTL(formData.birthPlace, formData.birthDate)
    : formatTTL(formData.spouseBirthPlace, formData.spouseBirthDate);
  const brideJob = !isMale ? formData.job || 'Wiraswasta' : formData.spouseJob || 'Wiraswasta';
  const brideAddress = !isMale ? formData.address : formData.spouseAddress || '-';

  const totalPagesCount = 6;

  const pages = [
    // ========================================================
    // LEMBAR I: SURAT PENGANTAR NIKAH DARI DESA (DENGAN KOP SURAT /admin/settings)
    // ========================================================
    {
      showKop: true,
      title: 'SURAT KETERANGAN UNTUK NIKAH',
      subtitle: `Nomor : ${submission.documentNumber}`,
      content: (
        <div className="space-y-1.5 text-justify text-[11pt] leading-snug">
          <p className="leading-normal">
            Yang bertanda tangan di bawah ini Kepala Desa Sampeldes, Kecamatan Gandrungmangu,
            Kabupaten Cilacap, menerangkan dengan sesungguhnya bahwa :
          </p>

          <table className="border-collapse w-full text-[11pt]">
            <tbody>
              <CustomDataRow label="1. Nama" value={formData.name} />
              <CustomDataRow label="2. Nomor Induk Kependudukan (NIK)" value={formData.nik} />
              <CustomDataRow label="3. Jenis Kelamin" value={formData.gender} />
              <CustomDataRow label="4. Tempat dan Tanggal Lahir" value={formatTTL(formData.birthPlace, formData.birthDate)} />
              <CustomDataRow label="5. Kewarganegaraan" value={formData.nationality || 'WNI'} />
              <CustomDataRow label="6. Agama" value={formData.religion || 'Islam'} />
              <CustomDataRow label="7. Pekerjaan" value={formData.job || 'Wiraswasta'} />
              <CustomDataRow label="8. Alamat" value={`${formData.address}, RT ${formData.rt || '001'}/RW ${formData.rw || '001'}, Desa Sampeldes`} />
              <CustomDataRow label="9. Status Perkawinan" value={formData.maritalStatus || (isMale ? 'Jejaka' : 'Perawan')} />
            </tbody>
          </table>

          <p className="pt-1 font-semibold">Adalah benar anak dari perkawinan seorang pria :</p>
          <table className="border-collapse w-full text-[11pt]">
            <tbody>
              <CustomDataRow label="Nama Lengkap dan Alias" value={formData.fatherName} indent />
              <CustomDataRow label="Nomor Induk Kependudukan (NIK)" value={formData.fatherNik || '-'} indent />
              <CustomDataRow label="Kewarganegaraan / Agama" value={`WNI / ${formData.religion || 'Islam'}`} indent />
              <CustomDataRow label="Pekerjaan" value={formData.fatherJob || 'Wiraswasta'} indent />
              <CustomDataRow label="Alamat" value={formData.fatherAddress || formData.address} indent />
            </tbody>
          </table>

          <p className="pt-1 font-semibold">dengan seorang wanita :</p>
          <table className="border-collapse w-full text-[11pt]">
            <tbody>
              <CustomDataRow label="Nama Lengkap dan Alias" value={formData.motherName} indent />
              <CustomDataRow label="Nomor Induk Kependudukan (NIK)" value={formData.motherNik || '-'} indent />
              <CustomDataRow label="Kewarganegaraan / Agama" value={`WNI / ${formData.religion || 'Islam'}`} indent />
              <CustomDataRow label="Pekerjaan" value={formData.motherJob || 'Mengurus Rumah Tangga'} indent />
              <CustomDataRow label="Alamat" value={formData.motherAddress || formData.address} indent />
            </tbody>
          </table>

          <p className="pt-1.5 leading-normal">
            Demikian surat pengantar nikah ini dibuat dengan mengingat sumpah jabatan dan untuk dipergunakan sebagaimana mestinya.
          </p>
        </div>
      ),
      pageNumber: 1,
      totalPages: totalPagesCount,
      showSignatures: true,
      inlineSignatures: true,
    },

    // ========================================================
    // LEMBAR II: LAMPIRAN MODEL N1 (PENGANTAR NIKAH KUA - Kepdirjen Bimas Islam No. 473 Tahun 2020)
    // ========================================================
    {
      showKop: false,
      title: 'PENGANTAR NIKAH',
      subtitle: `Nomor : ${submission.documentNumber}`,
      content: (
        <div className="space-y-1.5 text-justify text-[10.5pt] leading-snug">
          <div className="flex justify-between items-start -mt-2 mb-1 text-[8.5pt]">
            <table className="border-collapse text-[9.5pt] font-semibold">
              <tbody>
                <tr><td className="pr-2">KANTOR DESA/KELURAHAN</td><td className="px-1">:</td><td>SAMPELDES</td></tr>
                <tr><td className="pr-2">KECAMATAN</td><td className="px-1">:</td><td>GANDRUNGMANGU</td></tr>
                <tr><td className="pr-2">KABUPATEN/KOTA</td><td className="px-1">:</td><td>CILACAP</td></tr>
              </tbody>
            </table>
            <div className="text-right leading-tight">
              <p>LAMPIRAN V</p>
              <p>KEPDIRJEN BIMAS ISLAM NOMOR 473 TAHUN 2020</p>
              <p className="font-bold text-[10.5pt] mt-0.5">Model N1</p>
            </div>
          </div>

          <p className="leading-normal">
            Yang bertanda tangan di bawah ini menjelaskan dengan sesungguhnya bahwa :
          </p>

          <table className="border-collapse w-full text-[10.5pt]">
            <tbody>
              <CustomDataRow label="1. Nama" value={formData.name} />
              <CustomDataRow label="2. Nomor Induk Kependudukan (NIK)" value={formData.nik} />
              <CustomDataRow label="3. Jenis Kelamin" value={formData.gender} />
              <CustomDataRow label="4. Tempat dan Tanggal Lahir" value={formatTTL(formData.birthPlace, formData.birthDate)} />
              <CustomDataRow label="5. Kewarganegaraan" value={formData.nationality || 'WNI'} />
              <CustomDataRow label="6. Agama" value={formData.religion || 'Islam'} />
              <CustomDataRow label="7. Pekerjaan" value={formData.job || 'Wiraswasta'} />
              <CustomDataRow label="8. Alamat" value={`${formData.address}, RT ${formData.rt || '001'}/RW ${formData.rw || '001'}, Desa Sampeldes`} />
              <CustomDataRow
                label="9. Status Perkawinan"
                value={
                  isMale
                    ? `Laki-laki : ${formData.maritalStatus || 'Jejaka'}`
                    : `Perempuan : ${formData.maritalStatus || 'Perawan'}`
                }
              />
            </tbody>
          </table>

          <p className="pt-1">Adalah benar anak dari perkawinan seorang pria :</p>
          <table className="border-collapse w-full text-[10.5pt]">
            <tbody>
              <CustomDataRow label="Nama Lengkap dan Alias" value={formData.fatherName} indent />
              <CustomDataRow label="Nomor Induk Kependudukan (NIK)" value={formData.fatherNik || '-'} indent />
              <CustomDataRow label="Kewarganegaraan / Agama" value="WNI / Islam" indent />
              <CustomDataRow label="Pekerjaan" value={formData.fatherJob || 'Wiraswasta'} indent />
              <CustomDataRow label="Alamat" value={formData.fatherAddress || formData.address} indent />
            </tbody>
          </table>

          <p className="pt-1">dengan seorang wanita :</p>
          <table className="border-collapse w-full text-[10.5pt]">
            <tbody>
              <CustomDataRow label="Nama Lengkap dan Alias" value={formData.motherName} indent />
              <CustomDataRow label="Nomor Induk Kependudukan (NIK)" value={formData.motherNik || '-'} indent />
              <CustomDataRow label="Kewarganegaraan / Agama" value="WNI / Islam" indent />
              <CustomDataRow label="Pekerjaan" value={formData.motherJob || 'Mengurus Rumah Tangga'} indent />
              <CustomDataRow label="Alamat" value={formData.motherAddress || formData.address} indent />
            </tbody>
          </table>

          <p className="pt-1">
            Demikian, surat pengantar ini dibuat dengan mengingat sumpah jabatan dan untuk dipergunakan sebagaimana mestinya.
          </p>

          <div className="pt-3 flex justify-end text-center text-[10.5pt]">
            <div className="w-64">
              <p>Sampeldes, {formatDateIndo(formData.letterDate || new Date().toISOString())}</p>
              <p className="font-semibold">Kepala Desa Sampeldes</p>
              <div className="h-14" />
              <p className="font-bold underline uppercase">TUKIMAN</p>
            </div>
          </div>
        </div>
      ),
      pageNumber: 2,
      totalPages: totalPagesCount,
      showSignatures: false,
    },

    // ========================================================
    // LEMBAR III: LAMPIRAN MODEL N2 (PERMOHONAN KEHENDAK NIKAH KE KUA)
    // ========================================================
    {
      showKop: false,
      title: 'FORMULIR PERMOHONAN KEHENDAK NIKAH',
      subtitle: 'Lampiran VI Kepdirjen Bimas Islam Nomor 473 Tahun 2020 — Model N2',
      content: (
        <div className="space-y-2.5 text-justify text-[11pt] leading-normal">
          <div className="flex justify-between items-start text-[10.5pt]">
            <div>
              <p>Perihal : <strong>Permohonan Kehendak Nikah</strong></p>
            </div>
            <div className="text-right">
              <p>Sampeldes, {formatDateIndo(formData.letterDate || new Date().toISOString())}</p>
            </div>
          </div>

          <div className="text-[10.5pt]">
            <p>Kepada Yth.</p>
            <p className="font-semibold">Kepala KUA Kecamatan {formData.kuaLocation || 'Gandrungmangu'}</p>
            <p>di Tempat</p>
          </div>

          <p className="leading-relaxed">
            Dengan hormat, kami mengajukan permohonan kehendak nikah untuk atas nama :
          </p>

          <table className="border-collapse w-full">
            <tbody>
              <CustomDataRow label="Calon Suami" value={groomName} />
              <CustomDataRow label="Calon Istri" value={brideName} />
              <CustomDataRow label="Hari / Tanggal / Jam" value={`${formatFullDate(formData.weddingDate || formData.eventDate || new Date().toISOString())} / ${formData.weddingTime ? `${formData.weddingTime} WIB` : '09.00 WIB'}`} />
              <CustomDataRow label="Tempat Akad Nikah" value={formData.weddingLocation || formData.kuaLocation || 'KUA Kecamatan Gandrungmangu'} />
            </tbody>
          </table>

          <p className="mt-2 leading-relaxed">
            Bersama ini kami sampaikan surat-surat yang diperlukan untuk diperiksa sebagai berikut:
          </p>
          <ol className="list-decimal pl-6 space-y-0.5 text-[10pt]">
            <li>Surat Pengantar Nikah dari Desa/Kelurahan (Model N1)</li>
            <li>Persetujuan Calon Mempelai (Model N4)</li>
            <li>Fotokopi KTP dan Akta Kelahiran</li>
            <li>Fotokopi Kartu Keluarga (KK)</li>
            <li>Paspoto 2x3 = 4 lembar, 4x6 = 2 lembar berlatar belakang biru</li>
            <li>Surat Izin Orang Tua (Model N5) apabila usia calon pengantin kurang dari 21 tahun</li>
          </ol>

          <p className="mt-1 leading-relaxed">
            Demikian permohonan ini kami sampaikan, kiranya dapat diperiksa, dihadiri dan dicatat sesuai dengan ketentuan peraturan perundang-undangan.
          </p>

          <div className="pt-4 grid grid-cols-2 text-[10.5pt]">
            <div className="space-y-12">
              <div>
                <p>Diterima tanggal ................................</p>
                <p>Yang menerima,</p>
                <p className="font-semibold">Kepala KUA / Penghulu</p>
              </div>
              <p className="font-bold underline uppercase">( ........................................ )</p>
            </div>
            <div className="space-y-14 text-center">
              <div>
                <p>Wassalam,</p>
                <p className="font-semibold">Pemohon</p>
              </div>
              <p className="font-bold underline uppercase">{formData.name}</p>
            </div>
          </div>
        </div>
      ),
      pageNumber: 3,
      totalPages: totalPagesCount,
      showSignatures: false,
    },

    // ========================================================
    // LEMBAR IV: LAMPIRAN MODEL N4 (PERSETUJUAN CALON PENGANTIN)
    // ========================================================
    {
      showKop: false,
      title: 'PERSETUJUAN CALON PENGANTIN',
      subtitle: 'Lampiran VIII Kepdirjen Bimas Islam Nomor 473 Tahun 2020 — Model N4',
      content: (
        <div className="space-y-2 text-justify text-[10.5pt] leading-snug">
          <p>Yang bertanda tangan di bawah ini :</p>

          <table className="border-collapse w-full text-[10.5pt]">
            <tbody>
              <tr><td colSpan={3} className="pt-1 pb-0.5 font-bold text-slate-900 uppercase">A. CALON SUAMI :</td></tr>
              <CustomDataRow label="1. Nama Lengkap dan Alias" value={groomName} />
              <CustomDataRow label="2. Bin" value={isMale ? formData.fatherName : formData.spouseFatherName || '-'} />
              <CustomDataRow label="3. Nomor Induk Kependudukan (NIK)" value={groomNik} />
              <CustomDataRow label="4. Tempat dan Tanggal Lahir" value={groomTtl} />
              <CustomDataRow label="5. Kewarganegaraan / Agama" value={`WNI / ${formData.religion || 'Islam'}`} />
              <CustomDataRow label="6. Pekerjaan" value={groomJob} />
              <CustomDataRow label="7. Alamat" value={groomAddress} />

              <tr><td colSpan={3} className="pt-2 pb-0.5 font-bold text-slate-900 uppercase">B. CALON ISTRI :</td></tr>
              <CustomDataRow label="1. Nama Lengkap dan Alias" value={brideName} />
              <CustomDataRow label="2. Binti" value={!isMale ? formData.fatherName : formData.spouseFatherName || '-'} />
              <CustomDataRow label="3. Nomor Induk Kependudukan (NIK)" value={brideNik} />
              <CustomDataRow label="4. Tempat dan Tanggal Lahir" value={brideTtl} />
              <CustomDataRow label="5. Kewarganegaraan / Agama" value={`WNI / ${formData.religion || 'Islam'}`} />
              <CustomDataRow label="6. Pekerjaan" value={brideJob} />
              <CustomDataRow label="7. Alamat" value={brideAddress} />
            </tbody>
          </table>

          <p className="mt-2.5 text-justify leading-normal">
            Menyatakan dengan sesungguhnya bahwa atas dasar sukarela, dengan kesadaran sendiri,
            tanpa ada paksaan dari siapapun juga, setuju untuk melangsungkan pernikahan.
            Demikian surat persetujuan ini dibuat untuk digunakan seperlunya.
          </p>

          <div className="pt-5 grid grid-cols-2 text-center text-[10.5pt]">
            <div>
              <p className="invisible">Sampeldes</p>
              <p className="font-semibold">Calon Suami,</p>
              <div className="h-14"></div>
              <p className="font-bold underline uppercase">{groomName}</p>
            </div>
            <div>
              <p>Sampeldes, {formatDateIndo(formData.letterDate || new Date().toISOString())}</p>
              <p className="font-semibold">Calon Istri,</p>
              <div className="h-14"></div>
              <p className="font-bold underline uppercase">{brideName}</p>
            </div>
          </div>
        </div>
      ),
      pageNumber: 4,
      totalPages: totalPagesCount,
      showSignatures: false,
    },

    // ========================================================
    // LEMBAR V: LAMPIRAN MODEL N5 (SURAT IZIN ORANG TUA)
    // ========================================================
    {
      showKop: false,
      title: 'SURAT IZIN ORANG TUA',
      subtitle: 'Lampiran IX Kepdirjen Bimas Islam Nomor 473 Tahun 2020 — Model N5',
      content: (
        <div className="space-y-1.5 text-justify text-[10.5pt] leading-tight">
          <p>Yang bertanda tangan di bawah ini :</p>

          <table className="border-collapse w-full text-[10.5pt]">
            <tbody>
              <tr><td colSpan={3} className="pt-0.5 pb-0.5 font-bold text-slate-900">A. AYAH KANDUNG / WALI :</td></tr>
              <CustomDataRow label="1. Nama Lengkap dan Alias" value={formData.fatherName} />
              <CustomDataRow label="2. Nomor Induk Kependudukan (NIK)" value={formData.fatherNik || '-'} />
              <CustomDataRow label="3. Kewarganegaraan / Agama" value={`WNI / ${formData.religion || 'Islam'}`} />
              <CustomDataRow label="4. Pekerjaan" value={formData.fatherJob || 'Wiraswasta'} />
              <CustomDataRow label="5. Alamat" value={formData.fatherAddress || formData.address} />

              <tr><td colSpan={3} className="pt-1 pb-0.5 font-bold text-slate-900">B. IBU KANDUNG / WALI :</td></tr>
              <CustomDataRow label="1. Nama Lengkap dan Alias" value={formData.motherName} />
              <CustomDataRow label="2. Nomor Induk Kependudukan (NIK)" value={formData.motherNik || '-'} />
              <CustomDataRow label="3. Kewarganegaraan / Agama" value={`WNI / ${formData.religion || 'Islam'}`} />
              <CustomDataRow label="4. Pekerjaan" value={formData.motherJob || 'Mengurus Rumah Tangga'} />
              <CustomDataRow label="5. Alamat" value={formData.motherAddress || formData.address} />

              <tr><td colSpan={3} className="pt-1 pb-0.5 font-bold text-slate-900">C. ADALAH AYAH DAN IBU KANDUNG DARI :</td></tr>
              <CustomDataRow label="1. Nama Lengkap dan Alias" value={formData.name} />
              <CustomDataRow label="2. Nomor Induk Kependudukan (NIK)" value={formData.nik} />
              <CustomDataRow label="3. Tempat dan Tanggal Lahir" value={formatTTL(formData.birthPlace, formData.birthDate)} />
              <CustomDataRow label="4. Kewarganegaraan / Agama" value={`WNI / ${formData.religion || 'Islam'}`} />
              <CustomDataRow label="5. Pekerjaan / Alamat" value={`${formData.job || 'Wiraswasta'} — ${formData.address}`} />

              <tr><td colSpan={3} className="pt-1 pb-0.5 font-bold text-slate-900">D. MEMBERIKAN IZIN UNTUK MELAKUKAN PERNIKAHAN DENGAN :</td></tr>
              <CustomDataRow label="1. Nama Lengkap dan Alias" value={formData.spouseName} />
              <CustomDataRow label="2. Nomor Induk Kependudukan (NIK)" value={formData.spouseNik || '-'} />
              <CustomDataRow label="3. Tempat dan Tanggal Lahir" value={formatTTL(formData.spouseBirthPlace, formData.spouseBirthDate)} />
              <CustomDataRow label="4. Kewarganegaraan / Agama" value={`WNI / ${formData.religion || 'Islam'}`} />
              <CustomDataRow label="5. Pekerjaan / Alamat" value={`${formData.spouseJob || 'Wiraswasta'} — ${formData.spouseAddress || '-'}`} />
            </tbody>
          </table>

          <p className="mt-1.5 leading-normal">
            Demikian surat izin ini dibuat dengan kesadaran tanpa ada paksaan dari siapapun dan untuk digunakan seperlunya.
          </p>

          <div className="pt-4 grid grid-cols-2 text-center text-[10.5pt]">
            <div>
              <p className="invisible">Sampeldes</p>
              <p className="font-semibold">Ayah / Wali / Pengampu,</p>
              <div className="h-14"></div>
              <p className="font-bold underline uppercase">{formData.fatherName || '..................................'}</p>
            </div>
            <div>
              <p>Sampeldes, {formatDateIndo(formData.letterDate || new Date().toISOString())}</p>
              <p className="font-semibold">Ibu / Wali / Pengampu,</p>
              <div className="h-14"></div>
              <p className="font-bold underline uppercase">{formData.motherName || '..................................'}</p>
            </div>
          </div>
        </div>
      ),
      pageNumber: 5,
      totalPages: totalPagesCount,
      showSignatures: false,
    },

    // ========================================================
    // LEMBAR VI: LAMPIRAN SPS (SURAT PERNYATAAN STATUS PERKAWINAN - OpenSID sps/view_individu.php)
    // ========================================================
    {
      showKop: false,
      title: 'SURAT PERNYATAAN STATUS',
      subtitle: 'Lampiran Pernyataan Status Perkawinan Calon Mempelai (SPS)',
      content: (
        <div className="space-y-2.5 text-justify text-[11pt] leading-normal">
          <p>Yang bertanda tangan di bawah ini :</p>

          <table className="border-collapse w-full text-[11pt]">
            <tbody>
              <CustomDataRow label="1. Nama" value={formData.name} />
              <CustomDataRow label="2. NIK" value={formData.nik} />
              <CustomDataRow label="3. Tempat dan Tanggal Lahir" value={formatTTL(formData.birthPlace, formData.birthDate)} />
              <CustomDataRow label="4. Warga Negara" value={formData.nationality || 'WNI'} />
              <CustomDataRow label="5. Agama" value={formData.religion || 'Islam'} />
              <CustomDataRow label="6. Pekerjaan" value={formData.job || 'Wiraswasta'} />
              <CustomDataRow label="7. Tempat Tinggal" value={`${formData.address}, RT ${formData.rt || '001'}/RW ${formData.rw || '001'}, Desa Sampeldes`} />
            </tbody>
          </table>

          <p className="mt-2 leading-relaxed">
            Dengan ini menyatakan dengan sesungguhnya bahwa saya hingga saat ini berstatus{' '}
            <strong>{formData.maritalStatus || (isMale ? 'Jejaka (Belum Pernah Menikah)' : 'Perawan (Belum Pernah Menikah)')}</strong>{' '}
            dan tidak sedang terikat perkawinan dengan orang lain. Surat Pernyataan ini saya buat dengan sebenarnya atas risiko sendiri, apabila di kemudian hari ternyata tidak benar saya bersedia dituntut di muka pengadilan sesuai peraturan perundang-undangan yang berlaku.
          </p>

          <div className="pt-4 grid grid-cols-2 text-[10.5pt]">
            <div className="space-y-6">
              <p className="font-bold">Saksi-Saksi :</p>
              <div>
                <p>1. {formData.witness1Name || '........................................'}</p>
                <p className="text-xs text-slate-500 pl-4">( ........................................ )</p>
              </div>
              <div>
                <p>2. {formData.witness2Name || '........................................'}</p>
                <p className="text-xs text-slate-500 pl-4">( ........................................ )</p>
              </div>
            </div>
            <div className="text-center space-y-3">
              <p>Sampeldes, {formatDateIndo(formData.letterDate || new Date().toISOString())}</p>
              <p className="font-semibold">Yang Membuat Pernyataan,</p>
              <div className="border border-dashed border-slate-500 py-2 px-3 w-28 mx-auto text-[7.5pt] text-slate-500 uppercase">
                Meterai<br />Rp 10.000
              </div>
              <p className="font-bold underline uppercase">{formData.name}</p>
            </div>
          </div>

          <div className="pt-4 text-center text-[10.5pt]">
            <p>Mengetahui,</p>
            <p className="font-semibold">Kepala Desa Sampeldes</p>
            <div className="h-14" />
            <p className="font-bold underline uppercase">TUKIMAN</p>
          </div>
        </div>
      ),
      pageNumber: 6,
      totalPages: totalPagesCount,
      showSignatures: false,
    },
  ];

  return (
    <PrintLayout
      submission={submission}
      pages={pages}
      fontSize="12pt"
      compact="tight"
    />
  );
}

