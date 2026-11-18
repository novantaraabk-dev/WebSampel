'use client';

import { LetterSubmission } from '@/lib/types';
import { PrintLayout, DataRow, formatTTL } from './print-layout';
import { useVillageIdentity } from '@/lib/village-identity';

export function SkckPrintTemplate({ submission }: { submission: LetterSubmission }) {
  const { formData } = submission;
  const { identity } = useVillageIdentity();

  const additionalFooter = (
    <div className="space-y-3">
      <div className="text-center">
        <p className="font-bold underline uppercase text-sm">Mengetahui :</p>
      </div>
      <div className="flex justify-between text-center items-start text-sm">
        <div className="w-1/3 px-1">
          <p className="font-bold">CAMAT</p>
          <p className="text-xs">{identity.namaKecamatan}</p>
          <div className="h-14"></div>
          {identity.namaCamat ? (
            <p className="font-bold underline uppercase text-xs">{identity.namaCamat}</p>
          ) : (
            <div className="border-b-2 border-black w-[80%] mx-auto"></div>
          )}
          {identity.nipCamat && identity.nipCamat !== '-' && (
            <p className="text-[9pt]">NIP. {identity.nipCamat}</p>
          )}
        </div>
        <div className="w-1/3 px-1">
          <p className="font-bold">{identity.jabatanDanramil || 'DANRAMIL'}</p>
          <p className="text-xs">{identity.namaKecamatan}</p>
          <div className="h-14"></div>
          {identity.namaDanramil ? (
            <p className="font-bold underline uppercase text-xs">{identity.namaDanramil}</p>
          ) : (
            <div className="border-b-2 border-black w-[80%] mx-auto"></div>
          )}
          {identity.nrpDanramil && identity.nrpDanramil !== '-' && (
            <p className="text-[9pt]">NRP. {identity.nrpDanramil}</p>
          )}
        </div>
        <div className="w-1/3 px-1">
          <p className="font-bold">KAPOLSEK</p>
          <p className="text-xs">{identity.namaKecamatan}</p>
          <div className="h-14"></div>
          {identity.namaKapolsek ? (
            <p className="font-bold underline uppercase text-xs">{identity.namaKapolsek}</p>
          ) : (
            <div className="border-b-2 border-black w-[80%] mx-auto"></div>
          )}
          {identity.nrpKapolsek && identity.nrpKapolsek !== '-' && (
            <p className="text-[9pt]">NRP. {identity.nrpKapolsek}</p>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <PrintLayout
      submission={submission}
      requesterLabel="Tanda Tangan Pemegang"
      additionalFooter={additionalFooter}
      compact="tight"
    >
      <p className="mt-2.5 text-justify leading-normal">
        Yang bertanda tangan di bawah ini Kepala {identity.sebutanDesa} {identity.namaDesa}, {identity.sebutanKecamatan}{' '}
        {identity.namaKecamatan}, {identity.sebutanKabupaten} {identity.namaKabupaten}, menerangkan dengan sebenar-benarnya bahwa:
      </p>

      <table className="mt-2 border-collapse w-full">
        <tbody>
          <DataRow compact="tight" label="Nama Lengkap" value={formData.name} />
          <DataRow compact="tight" label="NIK" value={formData.nik} />
          <DataRow compact="tight" label="Jenis Kelamin" value={formData.gender} />
          <DataRow compact="tight" label="Tempat/Tgl Lahir" value={formatTTL(formData.birthPlace, formData.birthDate)} />
          <DataRow compact="tight" label="Kewarganegaraan" value={formData.nationality} />
          <DataRow compact="tight" label="Agama" value={formData.religion} />
          <DataRow compact="tight" label="Pekerjaan" value={formData.job} />
          <DataRow compact="tight" label="Alamat" value={formData.address} />
        </tbody>
      </table>

      <p className="mt-2.5 text-justify leading-normal">
        Berdasarkan data kependudukan dan catatan yang ada di kantor kami, nama tersebut di atas adalah benar-benar warga kami yang berdomisili di alamat tersebut. Sepanjang pengetahuan kami, yang bersangkutan berkelakuan baik, tidak pernah tersangkut perkara pidana maupun perdata, dan tidak sedang dalam pengawasan pihak berwajib.
      </p>
      <p className="mt-2 text-justify leading-normal">
        Surat keterangan ini dibuat sebagai pengantar untuk keperluan: <strong>{formData.purpose}</strong>.
      </p>
      <p className="mt-2 text-justify leading-normal">
        Demikian surat keterangan ini dibuat dengan sebenarnya untuk dipergunakan sebagaimana mestinya.
      </p>
    </PrintLayout>
  );
}

