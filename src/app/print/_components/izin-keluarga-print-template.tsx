'use client';

import { LetterSubmission } from '@/lib/types';
import { PrintLayout, DataRow, formatTTL } from './print-layout';

export function IzinKeluargaPrintTemplate({ submission }: { submission: LetterSubmission }) {
  const { formData } = submission;

  const grantorTTL = formatTTL(formData.grantorBirthPlace, formData.grantorBirthDate);
  const grantorWnAgama = `${formData.grantorNationality || 'Indonesia'}/${formData.grantorReligion || '-'}`;
  const granteeTTL = formatTTL(formData.granteeBirthPlace, formData.granteeBirthDate);
  const granteeWnAgama = `${formData.granteeNationality || 'Indonesia'}/${formData.granteeReligion || '-'}`;
  const granteeTargetRelation = (formData.granteeTargetRelation || formData.grantorRelation || 'keluarga').toLowerCase();
  const contractDuration = formData.contractDuration || formData.workDuration || '2 s/d 3 tahun';
  const destination = formData.destinationCountry || formData.destinationLocation || formData.destinationCompany || '-';

  const pages = [
    {
      showKop: true,
      title: 'SURAT KETERANGAN IZIN KELUARGA',
      subtitle: `Nomor : ${submission.documentNumber}`,
      content: (
        <div className="space-y-2 text-justify text-[11pt] leading-snug">
          <p className="mt-1 leading-normal">
            Yang bertandatangan dibawah ini Kepala Desa Sampeldes Kecamatan Gandrungmangu Kabupaten Cilacap dengan ini menerangkan bahwa :
          </p>

          <table className="border-collapse w-full">
            <tbody>
              <DataRow compact="tight" label="Nama" value={<strong>{formData.grantorName}</strong>} />
              <DataRow compact="tight" label="NIK" value={formData.grantorNik} />
              <DataRow compact="tight" label="Tempat/Tgl. Lahir" value={grantorTTL} />
              <DataRow compact="tight" label="Warga Negara/Agama" value={grantorWnAgama} />
              <DataRow compact="tight" label="Pekerjaan" value={formData.grantorJob || '-'} />
              <DataRow compact="tight" label="Status Perkawinan" value={formData.grantorMaritalStatus || '-'} />
              <DataRow compact="tight" label="Alamat" value={formData.grantorAddress} />
              <DataRow compact="tight" label="Hubungan Dengan CTKI" value={<strong>{formData.grantorRelation || 'SUAMI'}</strong>} />
            </tbody>
          </table>

          <p className="mt-2.5 leading-normal">
            Dengan ini memberikan beserta tanggung jawab penuh untuk bekerja keluar negeri kepada {granteeTargetRelation} :
          </p>

          <table className="border-collapse w-full">
            <tbody>
              <DataRow compact="tight" label="Nama" value={<strong>{formData.granteeName}</strong>} />
              <DataRow compact="tight" label="NIK" value={formData.granteeNik} />
              <DataRow compact="tight" label="Tempat/Tgl. Lahir" value={granteeTTL} />
              <DataRow compact="tight" label="Warga Negara/Agama" value={granteeWnAgama} />
              <DataRow compact="tight" label="Pekerjaan" value={formData.granteeJob || '-'} />
              <DataRow compact="tight" label="Status Perkawinan" value={formData.granteeMaritalStatus || '-'} />
              <DataRow compact="tight" label="Alamat terdahulu" value={formData.granteeAddress || formData.grantorAddress} />
              <DataRow compact="tight" label="Tujuan" value={<strong>{destination}</strong>} />
            </tbody>
          </table>

          <p className="mt-2.5 leading-normal">
            Untuk bekerja keluar negeri dengan masa kontrak {contractDuration}.
          </p>

          <p className="mt-1 leading-relaxed">
            Demikian surat keterangan izin keluarga ini kami buat dengan sebenarnya dalam keadaan sadar dan tanpa ada paksaan dari pihak mana pun dan dapat dipertanggungjawabkan.
          </p>

          <div className="mt-6 grid grid-cols-2 gap-4 text-center text-[10.5pt]">
            <div>
              <p className="font-bold">Yang diberi izin</p>
              <div className="h-16" />
              <p className="font-bold uppercase">{formData.granteeName}</p>
            </div>
            <div>
              <p className="font-bold">Yang mengizinkan</p>
              <div className="h-16 flex items-center justify-center text-[8pt] text-slate-400 italic">
                Materai Rp. 10.000
              </div>
              <p className="font-bold uppercase">{formData.grantorName}</p>
            </div>
          </div>
        </div>
      ),
      signatures: {
        signerTitle: 'Mengetahui,\nKepala Desa/Kelurahan',
        signerName: 'H. MUKHLISIN',
      },
    },
  ];

  return <PrintLayout submission={submission} pages={pages} />;
}

