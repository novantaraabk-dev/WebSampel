'use client';

import { LetterSubmission } from '@/lib/types';
import { PrintLayout, DataRow, formatTTL, formatDateIndo } from './print-layout';

export function SuratKuasaPrintTemplate({ submission }: { submission: LetterSubmission }) {
  const { formData } = submission;

  const grantorName = (formData.grantorName || formData.name || 'SANTOSO').toUpperCase();
  const grantorTtl = formatTTL(formData.grantorBirthPlace || formData.birthPlace, formData.grantorBirthDate || formData.birthDate);
  const grantorNik = formData.grantorNik || formData.nik || '-';
  const grantorPosition = formData.grantorPosition || formData.jabatan || 'Kepala Desa';
  const grantorAddress = formData.grantorAddress || formData.address || '-';

  const tujuanKuasa = formData.powerScope || formData.purpose || 'Pengambilan uang secara tunai di Bank Jatim / Bank Jateng';

  const grantee1Name = (formData.grantee1Name || formData.proxyName || formData.authorizedPerson || 'IMAM').toUpperCase();
  const grantee1Ttl = formatTTL(formData.grantee1BirthPlace || formData.proxyBirthPlace, formData.grantee1BirthDate || formData.proxyBirthDate);
  const grantee1Position = formData.grantee1Position || formData.proxyPosition || 'Sekretaris Desa';
  const grantee1Address = formData.grantee1Address || formData.proxyAddress || '-';

  const grantee2Name = formData.grantee2Name ? String(formData.grantee2Name).toUpperCase() : '';
  const grantee2Ttl = formatTTL(formData.grantee2BirthPlace, formData.grantee2BirthDate);
  const grantee2Position = formData.grantee2Position || 'Bendahara Desa';
  const grantee2Address = formData.grantee2Address || '-';

  let labelJabatanPenerima = formData.granteePositionLabel;
  if (!labelJabatanPenerima) {
    if (grantee2Name) {
      labelJabatanPenerima = `${grantee1Position} dan ${grantee2Position}`;
    } else {
      labelJabatanPenerima = grantee1Position;
    }
  }

  const pages = [
    {
      showKop: true,
      title: 'SURAT KUASA',
      subtitle: '',
      content: (
        <div className="space-y-3 text-justify text-[11pt] leading-normal font-serif">
          <p className="leading-relaxed">
            Yang bertandatangan dibawah ini :
          </p>

          <table className="border-collapse w-full">
            <tbody>
              <DataRow compact="tight" label="Nama" value={<strong>{grantorName}</strong>} />
              <DataRow compact="tight" label="Tempat / Tanggal lahir" value={grantorTtl} />
              <DataRow compact="tight" label="NIK" value={grantorNik} />
              <DataRow compact="tight" label="Jabatan" value={grantorPosition} />
              <DataRow compact="tight" label="Alamat" value={grantorAddress} />
            </tbody>
          </table>

          <p className="mt-3 leading-relaxed">
            Dengan surat ini , Saya sebagai <strong>Pemberi Kuasa</strong> Memberikan kuasa penuh kepada <strong>{labelJabatanPenerima}</strong> ( <strong>Penerima Kuasa</strong> ) Untuk melakukan {tujuanKuasa} kepada :
          </p>

          <table className="border-collapse w-full">
            <tbody>
              <DataRow compact="tight" label="Nama" value={<strong>{grantee1Name}</strong>} />
              <DataRow compact="tight" label="Tempat Tanggal Lahir" value={grantee1Ttl} />
              <DataRow compact="tight" label="Jabatan" value={grantee1Position} />
              <DataRow compact="tight" label="Alamat" value={grantee1Address} />
            </tbody>
          </table>

          {grantee2Name && (
            <>
              <p className="font-bold my-1">Dan</p>
              <table className="border-collapse w-full">
                <tbody>
                  <DataRow compact="tight" label="Nama" value={<strong>{grantee2Name}</strong>} />
                  <DataRow compact="tight" label="Tempat Tanggal Lahir" value={grantee2Ttl} />
                  <DataRow compact="tight" label="Jabatan" value={grantee2Position} />
                  <DataRow compact="tight" label="Alamat" value={grantee2Address} />
                </tbody>
              </table>
            </>
          )}

          <p className="mt-4 leading-relaxed">
            Demikian surat kuasa ini saya buat dengan kesadaran penuh dan tanpa ada paksaan dari pihak manapun dan semoga dapat dipergunakan sebagaimana mestinya.
          </p>

          <div className="mt-6 grid grid-cols-2 text-center text-[11pt]">
            <div>
              <p className="font-bold underline">Penerima Kuasa</p>
              <div className="h-16 flex items-end justify-around">
                <span className="font-bold underline uppercase">{grantee1Name}</span>
                {grantee2Name && (
                  <span className="font-bold underline uppercase">{grantee2Name}</span>
                )}
              </div>
            </div>
            <div>
              <p>Sampeldes, {formatDateIndo(formData.letterDate || new Date().toISOString())}</p>
              <p className="font-bold underline">Pemberi Kuasa</p>
              <p className="text-sm">{grantorPosition}</p>
              <div className="h-14 flex items-center justify-center text-[8pt] text-slate-400 italic">
                Materai Rp. 10.000
              </div>
              <p className="font-bold underline uppercase">{grantorName}</p>
            </div>
          </div>
        </div>
      ),
      pageNumber: 1,
      totalPages: 1,
      showSignatures: false,
    },
  ];

  return <PrintLayout submission={submission} pages={pages} />;
}

