'use client';

import { LetterSubmission } from '@/lib/types';
import { PrintLayout, DataRow, formatTTL, formatDateIndo } from './print-layout';

export function JualBeliPrintTemplate({ submission }: { submission: LetterSubmission }) {
  const { formData } = submission;

  const pages = [
    {
      showKop: true,
      title: 'SURAT KETERANGAN JUAL BELI',
      subtitle: `Nomor : ${submission.documentNumber}`,
      content: (
        <div className="space-y-2 text-justify text-[10.5pt] leading-snug">
          <p className="mt-1 leading-normal">
            Yang bertanda tangan di bawah ini menerangkan bahwa pada hari ini, tanggal {formatDateIndo(formData.transactionDate || new Date().toISOString())}, telah terjadi transaksi jual beli antara:
          </p>

          {/* Pihak Pertama */}
          <div className="mt-1">
            <p className="font-bold text-slate-900 border-b pb-0.5 uppercase text-[10pt]">
              I. PIHAK PERTAMA (PENJUAL) :
            </p>
            <table className="border-collapse w-full mt-1">
              <tbody>
                <DataRow compact="tight" label="Nama Lengkap" value={formData.sellerName} />
                <DataRow compact="tight" label="NIK" value={formData.sellerNik} />
                <DataRow compact="tight" label="Tempat / Tgl Lahir" value={formatTTL(formData.sellerBirthPlace, formData.sellerBirthDate)} />
                <DataRow compact="tight" label="Pekerjaan" value={formData.sellerJob || '-'} />
                <DataRow compact="tight" label="Alamat Tempat Tinggal" value={formData.sellerAddress} />
              </tbody>
            </table>
            <p className="text-[10pt] italic text-slate-700 mt-0.5">
              Selanjutnya disebut sebagai <strong>PIHAK PERTAMA (PENJUAL)</strong>.
            </p>
          </div>

          {/* Pihak Kedua */}
          <div className="mt-2">
            <p className="font-bold text-slate-900 border-b pb-0.5 uppercase text-[10pt]">
              II. PIHAK KEDUA (PEMBELI) :
            </p>
            <table className="border-collapse w-full mt-1">
              <tbody>
                <DataRow compact="tight" label="Nama Lengkap" value={formData.buyerName} />
                <DataRow compact="tight" label="NIK" value={formData.buyerNik} />
                <DataRow compact="tight" label="Tempat / Tgl Lahir" value={formatTTL(formData.buyerBirthPlace, formData.buyerBirthDate)} />
                <DataRow compact="tight" label="Pekerjaan" value={formData.buyerJob || '-'} />
                <DataRow compact="tight" label="Alamat Tempat Tinggal" value={formData.buyerAddress} />
              </tbody>
            </table>
            <p className="text-[10pt] italic text-slate-700 mt-0.5">
              Selanjutnya disebut sebagai <strong>PIHAK KEDUA (PEMBELI)</strong>.
            </p>
          </div>

          {/* Objek Jual Beli */}
          <div className="mt-2">
            <p className="font-bold text-slate-900 border-b pb-0.5 uppercase text-[10pt]">
              III. OBJEK & KESEPAKATAN TRANSAKSI :
            </p>
            <table className="border-collapse w-full mt-1">
              <tbody>
                <DataRow compact="tight" label="Objek Jual Beli" value={formData.itemType} />
                <DataRow compact="tight" label="Spesifikasi / Rincian" value={formData.itemDescription} />
                <DataRow compact="tight" label="Nilai / Harga Transaksi" value={<strong>{formData.transactionPrice}</strong>} />
                <DataRow compact="tight" label="Cara Pembayaran" value={formData.paymentMethod || 'Lunas Tunai'} />
              </tbody>
            </table>
          </div>

          <p className="mt-2 leading-relaxed">
            Kedua belah pihak telah bersepakat bahwa sejak ditandatanganinya surat keterangan ini, hak milik atas barang/objek tersebut di atas sepenuhnya beralih dari <strong>PIHAK PERTAMA</strong> kepada <strong>PIHAK KEDUA</strong>. Pihak Pertama menjamin bahwa barang/objek yang dijual tersebut adalah sah miliknya dan tidak dalam sengketa atau tuntutan dari pihak manapun.
          </p>

          {/* Saksi & Penutup */}
          <div className="mt-2 bg-slate-50 p-2 rounded border border-slate-200">
            <p className="text-[10pt] font-semibold text-slate-800">
              Transaksi ini disaksikan oleh para saksi:
            </p>
            <ol className="list-decimal pl-5 text-[10pt] text-slate-700 space-y-0.5">
              <li>{formData.witness1 || 'Saksi I'} (Saksi)</li>
              <li>{formData.witness2 || 'Saksi II'} (Saksi)</li>
            </ol>
          </div>

          <div className="mt-3 pt-2 grid grid-cols-2 gap-4 text-center text-[10pt]">
            <div>
              <p>PIHAK PERTAMA (PENJUAL)</p>
              <div className="h-14 flex items-center justify-center text-[8pt] text-slate-400 italic">
                (Materai Rp 10.000)
              </div>
              <p className="font-bold underline uppercase">{formData.sellerName}</p>
            </div>
            <div>
              <p>PIHAK KEDUA (PEMBELI)</p>
              <div className="h-14"></div>
              <p className="font-bold underline uppercase">{formData.buyerName}</p>
            </div>
          </div>
        </div>
      ),
      signatures: {
        signerTitle: 'Mengetahui,\nKepala Desa Sampeldes',
        signerName: 'H. MUKHLISIN',
      },
    },
  ];

  return <PrintLayout submission={submission} pages={pages} />;
}

