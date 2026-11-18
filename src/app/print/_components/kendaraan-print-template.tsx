'use client';

import { LetterSubmission } from '@/lib/types';
import { PrintLayout, DataRow, formatTTL, toProperCase, formatDateIndo } from './print-layout';

export function KendaraanPrintTemplate({ submission }: { submission: LetterSubmission }) {
  const { formData } = submission;

  const pages = [
    // ========================================================
    // LEMBAR I: SURAT KETERANGAN KEPEMILIKAN KENDARAAN DESA
    // ========================================================
    {
      showKop: true,
      title: 'SURAT KETERANGAN KEPEMILIKAN KENDARAAN BERMOTOR',
      subtitle: `Nomor : ${submission.documentNumber}`,
      content: (
        <div className="space-y-3 text-justify text-[11pt] leading-normal">
          <p className="mt-1 leading-relaxed">
            Yang bertanda tangan di bawah ini Kepala Desa Sampeldes, Kecamatan Gandrungmangu, Kabupaten Cilacap, menerangkan dengan sebenarnya bahwa:
          </p>

          <table className="border-collapse w-full">
            <tbody>
              <DataRow compact="tight" label="Nama Lengkap" value={formData.name} />
              <DataRow compact="tight" label="NIK" value={formData.nik} />
              <DataRow compact="tight" label="Tempat / Tgl Lahir" value={formatTTL(formData.birthPlace, formData.birthDate)} />
              <DataRow compact="tight" label="Pekerjaan" value={formData.job} />
              <DataRow compact="tight" label="Alamat Tempat Tinggal" value={formData.address} />
            </tbody>
          </table>

          <p className="mt-2.5 leading-relaxed">
            Adalah benar pemilik sah dan menguasai secara fisik 1 (satu) unit kendaraan bermotor dengan spesifikasi sebagai berikut:
          </p>

          <div className="border border-slate-900 p-2.5 rounded bg-slate-50">
            <table className="border-collapse w-full text-[10.5pt]">
              <tbody>
                <DataRow compact="tight" label="Jenis Kendaraan" value={formData.vehicleType || formData.jenisKendaraan || 'Sepeda Motor (Roda 2)'} />
                <DataRow compact="tight" label="Merk / Type" value={formData.vehicleBrand || formData.merk || 'Honda / Yamaha / Suzuki'} />
                <DataRow compact="tight" label="Tahun Pembuatan" value={formData.vehicleYear || formData.tahun || '2020'} />
                <DataRow compact="tight" label="Nomor Polisi (Plat)" value={formData.plateNumber || formData.noPolisi || '-'} />
                <DataRow compact="tight" label="Nomor Rangka (NIK)" value={formData.chassisNumber || formData.noRangka || '-'} />
                <DataRow compact="tight" label="Nomor Mesin" value={formData.engineNumber || formData.noMesin || '-'} />
                <DataRow compact="tight" label="Warna Kendaraan" value={formData.vehicleColor || formData.warna || '-'} />
                <DataRow compact="tight" label="Atas Nama (Buku Pemilik)" value={formData.vehicleOwner || formData.atasNama || toProperCase(formData.name)} />
              </tbody>
            </table>
          </div>

          <p className="mt-2.5 leading-relaxed">
            Berdasarkan pemeriksaan fisik dan keterangan saksi-saksi, kendaraan tersebut adalah benar-benar milik yang bersangkutan dan bukan merupakan barang curian atau terkait tindak pidana.
          </p>

          <p className="mt-2 leading-relaxed">
            Surat keterangan ini dibuat untuk keperluan: <strong>{formData.purpose || 'Persyaratan Laporan Kehilangan STNK/BPKB di Kepolisian / Administrasi Pembiayaan / Balik Nama'}</strong>.
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
    // LEMBAR II: LAMPIRAN SURAT PERNYATAAN PENGUASAAN FISIK
    // ========================================================
    {
      showKop: false,
      title: 'SURAT PERNYATAAN PENGUASAAN FISIK KENDARAAN BERMOTOR',
      subtitle: 'LAMPIRAN KETERANGAN KEPEMILIKAN KENDARAAN BERMOTOR',
      content: (
        <div className="space-y-3 text-justify text-[11pt] leading-normal">
          <p className="leading-relaxed">
            Yang bertanda tangan di bawah ini saya pemilik kendaraan:
          </p>

          <table className="border-collapse w-full">
            <tbody>
              <DataRow compact="tight" label="Nama Lengkap" value={formData.name} />
              <DataRow compact="tight" label="NIK" value={formData.nik} />
              <DataRow compact="tight" label="Alamat Tempat Tinggal" value={formData.address} />
            </tbody>
          </table>

          <p className="mt-2.5 leading-relaxed">
            Menyatakan dengan sesungguhnya bahwa kendaraan bermotor dengan Nomor Polisi <strong>{formData.plateNumber || formData.noPolisi || '........................'}</strong>, Nomor Rangka <strong>{formData.chassisNumber || formData.noRangka || '........................'}</strong>, dan Nomor Mesin <strong>{formData.engineNumber || formData.noMesin || '........................'}</strong> adalah benar-benar dalam penguasaan fisik saya secara sah, didapat dari hasil jual beli / pembelian yang sah, dan tidak sedang dalam sengketa dengan pihak leasing, perbankan, maupun perseorangan.
          </p>

          <p className="mt-2.5 leading-relaxed text-[10.5pt]">
            Pernyataan ini saya buat dengan jujur dan bertindak untuk diri sendiri. Apabila di kemudian hari terbukti pernyataan saya ini tidak benar, saya bersedia bertanggung jawab penuh di hadapan hukum dan membebaskan Pemerintah Desa Sampeldes dari segala tuntutan hukum.
          </p>

          <div className="mt-6 grid grid-cols-2 text-center text-[10.5pt]">
            <div>
              <p className="font-semibold mb-2">Saksi Lingkungan / RT:</p>
              <div className="h-14" />
              <p className="font-bold underline">{toProperCase(formData.witnessName || '...........................................')}</p>
              <p className="text-xs text-slate-600">Ketua RT / Saksi</p>
            </div>
            <div>
              <p>Sampeldes, {formatDateIndo(formData.letterDate || new Date().toISOString())}</p>
              <p className="mb-2">Yang Membuat Pernyataan,</p>
              <div className="h-2" />
              <span className="text-[8.5pt] border border-dashed border-slate-400 px-2 py-0.5 text-slate-500 font-mono">
                Meterai Rp 10.000
              </span>
              <div className="h-2" />
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

