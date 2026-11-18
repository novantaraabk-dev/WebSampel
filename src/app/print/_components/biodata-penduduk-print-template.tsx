'use client';

import { useState, useEffect, useRef } from 'react';
import { LetterSubmission, KopSuratInfo } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Printer, ArrowLeft, FileSpreadsheet, FileText } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useFirestore } from '@/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { DataRow, formatTTL, toProperCase, formatDateIndo, formatGender } from './print-layout';
import { cn } from '@/lib/utils';
import { useVillageIdentity, syncPrintElementWithVillageIdentity } from '@/lib/village-identity';

const fallbackKopInfo: KopSuratInfo = {
  letterheadImageUrl: "https://placehold.co/1200x240/f0f0f0/333333?text=Kop+Surat+Belum+Diatur"
};

function applyDynamicPrintStyle(mode: 'all' | 'pengantar' | 'lampiran') {
  if (typeof document === 'undefined') return;
  let styleEl = document.getElementById('dynamic-f101-print-style') as HTMLStyleElement | null;
  if (!styleEl) {
    styleEl = document.createElement('style');
    styleEl.id = 'dynamic-f101-print-style';
    document.head.appendChild(styleEl);
  }
  if (mode === 'pengantar') {
    styleEl.textContent = `
      @media print {
        @page {
          size: A4 portrait !important;
          margin: 6mm 10mm !important;
        }
      }
    `;
  } else if (mode === 'lampiran') {
    styleEl.textContent = `
      @media print {
        @page {
          size: A4 landscape !important;
          margin: 3mm 4mm !important;
        }
      }
    `;
  } else {
    styleEl.textContent = `
      @media print {
        @page {
          size: auto !important;
          margin: 4mm 6mm !important;
        }
      }
    `;
  }
}

export function BiodataPendudukPrintTemplate({ submission }: { submission: LetterSubmission }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const firestore = useFirestore();
  const { identity } = useVillageIdentity();
  const containerRef = useRef<HTMLDivElement>(null);
  const [kopInfo, setKopInfo] = useState<KopSuratInfo | null>(null);
  const [printMode, setPrintMode] = useState<'all' | 'pengantar' | 'lampiran'>('all');

  useEffect(() => {
    const partParam = searchParams?.get('part');
    if (partParam === 'pengantar' || partParam === 'lampiran' || partParam === 'all') {
      setPrintMode(partParam);
      applyDynamicPrintStyle(partParam);
    } else {
      applyDynamicPrintStyle('all');
    }
  }, [searchParams]);

  useEffect(() => {
    if (containerRef.current && identity) {
      syncPrintElementWithVillageIdentity(containerRef.current, identity);
    }
  }, [identity, printMode, submission]);

  useEffect(() => {
    const fetchKopInfo = async () => {
      if (!firestore) return;
      try {
        const kopSuratRef = doc(firestore, 'kopSurat', 'default');
        const docSnap = await getDoc(kopSuratRef);
        if (docSnap.exists()) {
          setKopInfo(docSnap.data() as KopSuratInfo);
        } else {
          setKopInfo(fallbackKopInfo);
        }
      } catch {
        setKopInfo(fallbackKopInfo);
      }
    };
    fetchKopInfo();
  }, [firestore]);

  const handlePrint = (mode: 'all' | 'pengantar' | 'lampiran') => {
    setPrintMode(mode);
    applyDynamicPrintStyle(mode);
    requestAnimationFrame(() => {
      setTimeout(() => {
        window.print();
      }, 160);
    });
  };

  const { formData = {} } = submission;

  const headName = (formData.headName || formData.name || 'HERMANSAH').toUpperCase();
  const address = (formData.address || 'SAMPELDES RT 005 / RW 002 Dusun Sampeldes').toUpperCase();
  const rt = String(formData.rt || '005').padStart(3, '0');
  const rw = String(formData.rw || '002').padStart(3, '0');
  const postalCode = String(formData.postalCode || '53254').padStart(5, '0');
  const phone = String(formData.phone || formData.phoneNumber || '081234567890');
  const dusun = (formData.dusun || 'Sampeldes').toUpperCase();

  // 10 baris anggota keluarga (sesuai spesifikasi F-1.01 Permendagri & OpenSID)
  const rows = [
    {
      no: 1,
      nama: (formData.name || 'HERMANSAH').toUpperCase(),
      gd: formData.titlePrefix || '-',
      gb: formData.titleSuffix || '-',
      paspor: formData.passportNumber || '-',
      exp: formData.passportExpiry || '-',
      sponsor: formData.sponsorName || '-',
      c8: '-',
      c9: '-',
      c10: formData.gender === 'perempuan' || formData.gender === 'female' || formData.gender === '2' ? '2' : '1',
      c11: (formData.birthPlace || 'CILACAP').toUpperCase(),
      c12: formData.birthDate || '11-10-1981',
      c13: 'WNI',
      c14: '-',
      c15: formData.birthCertNumber ? '2' : '1',
      c16: formData.birthCertNumber || '-',
      c17: formData.bloodType || '-',
      c18: formData.religion || '1',
      c19: '-',
      c20: formData.maritalStatus || '2',
      c21: formData.marriageCertNumber ? '2' : '1',
      c22: formData.marriageCertNumber || '-',
      c23: formData.marriageDate || '-',
      c24: '1',
      c25: '-',
      c26: '-',
      c27: formData.shdk || '1',
      c28: '1',
      c29: '-',
      c30: formData.education || '3',
      c31: formData.job || '19',
      c32: '-',
      c33: '-',
      c34: '-',
      c35: '-',
      c36: '-',
      c37: '-',
      c38: formData.motherNik || '-',
      c39: (formData.motherName || 'SUKINI').toUpperCase(),
      c40: formData.fatherNik || '-',
      c41: (formData.fatherName || 'SANSUKARTO PAIDI').toUpperCase(),
    },
    {
      no: 2,
      nama: 'UMI SUSANTI',
      gd: '-',
      gb: '-',
      paspor: '-',
      exp: '-',
      sponsor: '-',
      c8: '-',
      c9: '-',
      c10: '2',
      c11: 'CILACAP',
      c12: '17-12-1983',
      c13: 'WNI',
      c14: '-',
      c15: '2',
      c16: '2296/D/2010',
      c17: '-',
      c18: '1',
      c19: '-',
      c20: '2',
      c21: '1',
      c22: '-',
      c23: '-',
      c24: '1',
      c25: '-',
      c26: '-',
      c27: '3',
      c28: '1',
      c29: '-',
      c30: '3',
      c31: '3',
      c32: '-',
      c33: '-',
      c34: '-',
      c35: '-',
      c36: '-',
      c37: '-',
      c38: '-',
      c39: 'SARIYEM',
      c40: '-',
      c41: 'HARTONO',
    },
    {
      no: 3,
      nama: 'ADITYA FARLAN ALDRIANSYAH',
      gd: '-',
      gb: '-',
      paspor: '-',
      exp: '-',
      sponsor: '-',
      c8: '-',
      c9: '-',
      c10: '1',
      c11: 'CILACAP',
      c12: '11-01-2014',
      c13: 'WNI',
      c14: '-',
      c15: '2',
      c16: '1556/U/2014',
      c17: '13',
      c18: '1',
      c19: '-',
      c20: '1',
      c21: '-',
      c22: '-',
      c23: '-',
      c24: '1',
      c25: '-',
      c26: '-',
      c27: '4',
      c28: '1',
      c29: '-',
      c30: '1',
      c31: '1',
      c32: '-',
      c33: '-',
      c34: '-',
      c35: '-',
      c36: '-',
      c37: '-',
      c38: '3301105712980003',
      c39: 'UMI SUSANTI',
      c40: '3301201010910022',
      c41: 'HERMANSAH',
    },
    {
      no: 4,
      nama: 'KHAILA KHANAYA ALNAFISYAH',
      gd: '-',
      gb: '-',
      paspor: '-',
      exp: '19-01-2026',
      sponsor: '-',
      c8: '-',
      c9: '-',
      c10: '2',
      c11: 'CILACAP',
      c12: '29-06-2021',
      c13: 'WNI',
      c14: '-',
      c15: '1',
      c16: '-',
      c17: '13',
      c18: '1',
      c19: '-',
      c20: '1',
      c21: '-',
      c22: '-',
      c23: '-',
      c24: '1',
      c25: '-',
      c26: '-',
      c27: '4',
      c28: '1',
      c29: '-',
      c30: '1',
      c31: '1',
      c32: '-',
      c33: '-',
      c34: '-',
      c35: '-',
      c36: '-',
      c37: '-',
      c38: '3301105712980003',
      c39: 'UMI SUSANTI',
      c40: '3301201010910022',
      c41: 'HERMANSAH',
    },
    {
      no: 5,
      nama: 'NAURA ALVAHYRA',
      gd: '-',
      gb: '-',
      paspor: '-',
      exp: '-',
      sponsor: '-',
      c8: '-',
      c9: '-',
      c10: '2',
      c11: 'CILACAP',
      c12: '13-01-2026',
      c13: 'WNI',
      c14: '-',
      c15: '1',
      c16: '-',
      c17: '-',
      c18: '1',
      c19: '-',
      c20: '1',
      c21: '-',
      c22: '-',
      c23: '-',
      c24: '1',
      c25: '-',
      c26: '-',
      c27: '4',
      c28: '1',
      c29: '-',
      c30: '1',
      c31: '1',
      c32: '-',
      c33: '-',
      c34: '-',
      c35: '-',
      c36: '-',
      c37: '-',
      c38: '-',
      c39: 'UMI SUSANTI',
      c40: '-',
      c41: 'HERMANSAH',
    },
    { no: 6, nama: '', gd: '', gb: '', paspor: '', exp: '', sponsor: '', c8: '', c9: '', c10: '', c11: '', c12: '', c13: '', c14: '', c15: '', c16: '', c17: '', c18: '', c19: '', c20: '', c21: '', c22: '', c23: '', c24: '', c25: '', c26: '', c27: '', c28: '', c29: '', c30: '', c31: '', c32: '', c33: '', c34: '', c35: '', c36: '', c37: '', c38: '', c39: '', c40: '', c41: '' },
    { no: 7, nama: '', gd: '', gb: '', paspor: '', exp: '', sponsor: '', c8: '', c9: '', c10: '', c11: '', c12: '', c13: '', c14: '', c15: '', c16: '', c17: '', c18: '', c19: '', c20: '', c21: '', c22: '', c23: '', c24: '', c25: '', c26: '', c27: '', c28: '', c29: '', c30: '', c31: '', c32: '', c33: '', c34: '', c35: '', c36: '', c37: '', c38: '', c39: '', c40: '', c41: '' },
    { no: 8, nama: '', gd: '', gb: '', paspor: '', exp: '', sponsor: '', c8: '', c9: '', c10: '', c11: '', c12: '', c13: '', c14: '', c15: '', c16: '', c17: '', c18: '', c19: '', c20: '', c21: '', c22: '', c23: '', c24: '', c25: '', c26: '', c27: '', c28: '', c29: '', c30: '', c31: '', c32: '', c33: '', c34: '', c35: '', c36: '', c37: '', c38: '', c39: '', c40: '', c41: '' },
    { no: 9, nama: '', gd: '', gb: '', paspor: '', exp: '', sponsor: '', c8: '', c9: '', c10: '', c11: '', c12: '', c13: '', c14: '', c15: '', c16: '', c17: '', c18: '', c19: '', c20: '', c21: '', c22: '', c23: '', c24: '', c25: '', c26: '', c27: '', c28: '', c29: '', c30: '', c31: '', c32: '', c33: '', c34: '', c35: '', c36: '', c37: '', c38: '', c39: '', c40: '', c41: '' },
    { no: 10, nama: '', gd: '', gb: '', paspor: '', exp: '', sponsor: '', c8: '', c9: '', c10: '', c11: '', c12: '', c13: '', c14: '', c15: '', c16: '', c17: '', c18: '', c19: '', c20: '', c21: '', c22: '', c23: '', c24: '', c25: '', c26: '', c27: '', c28: '', c29: '', c30: '', c31: '', c32: '', c33: '', c34: '', c35: '', c36: '', c37: '', c38: '', c39: '', c40: '', c41: '' },
  ];

  const activeMembers = rows.filter(r => r.nama && r.nama.trim().length > 0);
  const familyCount = activeMembers.length > 0 ? activeMembers.length : 1;
  const currentDateStr = formatDateIndo(submission.updatedAt || submission.createdAt || new Date());

  return (
    <div className="bg-slate-200 min-h-screen py-8 text-slate-900 font-sans print:bg-white print:p-0">
      {/* Top Controls / Action Bar */}
      <div className="max-w-[297mm] mx-auto mb-6 bg-white p-4 rounded-2xl shadow-lg border border-slate-200 print:hidden flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.back()}
            className="gap-2 text-xs font-semibold"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Kembali</span>
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-slate-800">
                Surat Biodata Penduduk (F-1.01)
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-100 text-sky-800 border border-sky-200">
                Standar OpenSID: Pengantar + Lampiran
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Lembar 1: Surat Pengantar Desa Sampeldes | Lembar 2 &amp; 3: Formulir Lampiran F-1.01 (Format SIAK Dukcapil)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePrint('pengantar')}
            className={cn(
              "gap-1.5 text-xs font-semibold transition-all",
              printMode === 'pengantar' ? "border-blue-600 bg-blue-50 text-blue-700 font-bold" : "text-slate-700"
            )}
          >
            <FileText className="h-3.5 w-3.5 text-blue-600" />
            <span>Cetak Pengantar Saja</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePrint('lampiran')}
            className={cn(
              "gap-1.5 text-xs font-semibold transition-all",
              printMode === 'lampiran' ? "border-emerald-600 bg-emerald-50 text-emerald-700 font-bold" : "text-slate-700"
            )}
          >
            <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-600" />
            <span>Cetak Lampiran F-1.01 Saja (2 Lembar)</span>
          </Button>

          <Button
            size="sm"
            onClick={() => handlePrint('all')}
            className="gap-2 text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white shadow-md"
          >
            <Printer className="h-4 w-4" />
            <span>Cetak Lengkap (3 Lembar)</span>
          </Button>
        </div>
      </div>

      {/* Floating Action Bar */}
      <div className="fixed bottom-6 right-6 flex items-center gap-2 bg-white/95 backdrop-blur-md px-4 py-2.5 rounded-2xl shadow-2xl border border-slate-300 z-50 print:hidden">
        <Button
          variant="outline"
          size="sm"
          onClick={() => handlePrint('pengantar')}
          className="text-xs gap-1.5"
        >
          <FileText className="h-3.5 w-3.5 text-blue-600" />
          <span>Pengantar</span>
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => handlePrint('lampiran')}
          className="text-xs gap-1.5"
        >
          <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-600" />
          <span>F-1.01 (2 Lembar)</span>
        </Button>
        <Button
          size="sm"
          onClick={() => handlePrint('all')}
          className="bg-slate-900 hover:bg-slate-800 text-white gap-2 font-bold text-xs shadow-md"
        >
          <Printer className="h-4 w-4" />
          <span>Cetak Semua</span>
        </Button>
      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
        @media print {
          body {
            background: white !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          .print-hidden,
          .print\\:hidden {
            display: none !important;
          }
          #printable-f101-doc {
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            display: block !important;
          }
          .page-pengantar {
            width: 100% !important;
            max-width: 210mm !important;
            height: auto !important;
            min-height: 0 !important;
            max-height: none !important;
            margin: 0 auto !important;
            padding: 0 !important;
            box-sizing: border-box !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
          .print-pengantar-only .page-pengantar {
            page-break-after: avoid !important;
            break-after: avoid !important;
            display: block !important;
          }
          .print-pengantar-only .f101-page,
          .print-pengantar-only .f101-page-1,
          .print-pengantar-only .f101-page-2 {
            display: none !important;
            height: 0 !important;
            overflow: hidden !important;
          }
          .print-lampiran-only .page-pengantar {
            display: none !important;
            height: 0 !important;
            overflow: hidden !important;
          }
          .print-lampiran-only .f101-page-1 {
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 1.5mm 3mm !important;
            page-break-before: avoid !important;
            break-before: avoid !important;
            page-break-after: always !important;
            break-after: page !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            box-sizing: border-box !important;
            display: block !important;
          }
          .print-lampiran-only .f101-page-2 {
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 1.5mm 3mm !important;
            page-break-before: always !important;
            break-before: page !important;
            page-break-after: avoid !important;
            break-after: avoid !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            box-sizing: border-box !important;
            display: block !important;
          }
          /* Mode Cetak Lengkap */
          .print-all .page-pengantar {
            page-break-after: always !important;
            break-after: page !important;
            display: block !important;
          }
          .print-all .f101-page-1 {
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 1.5mm 3mm !important;
            page-break-before: always !important;
            break-before: page !important;
            page-break-after: always !important;
            break-after: page !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            box-sizing: border-box !important;
            display: block !important;
          }
          .print-all .f101-page-2 {
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 1.5mm 3mm !important;
            page-break-before: always !important;
            break-before: page !important;
            page-break-after: avoid !important;
            break-after: avoid !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            box-sizing: border-box !important;
            display: block !important;
          }
        }
      `}} />

      <div
        id="printable-f101-doc"
        ref={containerRef}
        className={cn(
          "max-w-[297mm] mx-auto space-y-8 print:space-y-0 print:max-w-none text-[6.5pt] leading-tight",
          printMode === 'lampiran' && "print-lampiran-only",
          printMode === 'pengantar' && "print-pengantar-only",
          printMode === 'all' && "print-all"
        )}
      >
        {/* ========================================================
            LEMBAR 1 : SURAT PENGANTAR DESA SAMPELDES (A4 PORTRAIT)
            ======================================================== */}
        {printMode !== 'lampiran' && (
          <div
            className="page-pengantar print-page mx-auto bg-white shadow-xl print:shadow-none print:border-none rounded-xl print:rounded-none flex flex-col justify-between"
            style={{
              width: '210mm',
              minHeight: '297mm',
              boxSizing: 'border-box'
            }}
          >
            <div>
              {/* KOP SURAT */}
              <header className="pl-[2cm] pr-[1.5cm] pt-[0.3cm]">
                {kopInfo?.letterheadImageUrl && (
                  <img
                    src={kopInfo.letterheadImageUrl}
                    alt="Kop Surat Desa Sampeldes"
                    className="w-full h-auto"
                    crossOrigin="anonymous"
                  />
                )}
              </header>

              {/* ISI SURAT */}
              <main className="pl-[2cm] pr-[1.5cm] pt-[0.2cm] text-[11pt] leading-normal space-y-3">
                {/* Nomor & Tujuan */}
                <div className="flex justify-between items-start pt-1 text-[10pt]">
                  <div>
                    <table className="border-collapse text-[10pt]">
                      <tbody>
                        <tr>
                          <td className="w-16 align-top">Nomor</td>
                          <td className="w-3 align-top">:</td>
                          <td className="font-semibold">{submission.documentNumber || '-'}</td>
                        </tr>
                        <tr>
                          <td className="align-top">Sifat</td>
                          <td className="align-top">:</td>
                          <td>Penting</td>
                        </tr>
                        <tr>
                          <td className="align-top">Lampiran</td>
                          <td className="align-top">:</td>
                          <td>1 Berkas (Formulir F-1.01 SIAK)</td>
                        </tr>
                        <tr>
                          <td className="align-top">Perihal</td>
                          <td className="align-top">:</td>
                          <td className="font-bold underline">Pengantar Biodata Penduduk WNI</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <div className="text-right text-[10.5pt] leading-snug">
                    <p>Kepada Yth.</p>
                    <p className="font-bold text-slate-900">Kepala Dinas Kependudukan &amp; Pencatatan Sipil</p>
                    <p>Kabupaten Cilacap</p>
                    <p className="text-slate-700">melalui Camat Gandrungmangu</p>
                    <p>di - <span className="underline">Tempat</span></p>
                  </div>
                </div>

                {/* Judul Dokumen */}
                <div className="pt-2 text-center">
                  <h2 className="font-bold underline text-base tracking-wider leading-tight uppercase">
                    SURAT PENGANTAR BIODATA PENDUDUK
                  </h2>
                  <p className="text-xs text-slate-700 font-mono">Nomor : {submission.documentNumber || '-'}</p>
                </div>

                <p className="text-justify leading-relaxed">
                  Yang bertanda tangan di bawah ini Kepala Desa Sampeldes, Kecamatan Gandrungmangu, Kabupaten Cilacap, dengan ini menerangkan dan memberikan pengantar permohonan penerbitan / pemutakhiran Formulir Biodata Penduduk WNI (F-1.01 SIAK Dukcapil) kepada:
                </p>

                {/* Data Pemohon */}
                <table className="border-collapse w-full text-[10.5pt]">
                  <tbody>
                    <DataRow compact="tight" label="Nama Kepala Keluarga / Pemohon" value={headName} />
                    <DataRow compact="tight" label="NIK" value={formData.nik || '-'} />
                    <DataRow compact="tight" label="Nomor Kartu Keluarga (KK)" value={formData.kkNumber || '-'} />
                    <DataRow compact="tight" label="Jenis Kelamin" value={formatGender(formData.gender)} />
                    <DataRow compact="tight" label="Tempat / Tanggal Lahir" value={formatTTL(formData.birthPlace, formData.birthDate)} />
                    <DataRow compact="tight" label="Warga Negara / Agama" value={`WNI / ${formData.religion || 'Islam'}`} />
                    <DataRow compact="tight" label="Status Perkawinan" value={formData.maritalStatus || 'Kawin'} />
                    <DataRow compact="tight" label="Pekerjaan" value={formData.job || 'Wiraswasta'} />
                    <DataRow compact="tight" label="Alamat Tempat Tinggal" value={`${formData.address || 'Desa Sampeldes'}, RT ${rt} / RW ${rw}, Dusun ${dusun}`} />
                    <DataRow compact="tight" label="Jumlah Anggota Keluarga" value={`${familyCount} Jiwa`} />
                    <DataRow compact="tight" label="Keperluan / Alasan" value={formData.purpose || formData.reason || 'Permohonan Penerbitan / Pemutakhiran Biodata Penduduk WNI (Formulir F-1.01 SIAK Dukcapil Terlampir)'} />
                  </tbody>
                </table>

                <p className="text-justify leading-relaxed">
                  Orang tersebut di atas adalah benar-benar warga penduduk Desa Sampeldes, Kecamatan Gandrungmangu, Kabupaten Cilacap yang berdomisili pada alamat tersebut. Surat pengantar ini diterbitkan sebagai pengantar resmi kelengkapan berkas Formulir Biodata Keluarga WNI (F-1.01 SIAK Ditjen Dukcapil Kemendagri) untuk pengurusan administrasi kependudukan pada Dinas Kependudukan dan Pencatatan Sipil Kabupaten Cilacap.
                </p>

                <p className="text-justify leading-relaxed">
                  Demikian Surat Pengantar ini dibuat dengan sebenarnya untuk dapat dipergunakan sebagaimana mestinya.
                </p>

                {/* Blok Tanda Tangan */}
                <div className="pt-4 text-[10.5pt]">
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div className="flex flex-col justify-between h-32">
                      <div>
                        <p className="invisible">Sampeldes, {currentDateStr}</p>
                        <p className="font-medium">Pemohon / Kepala Keluarga,</p>
                      </div>
                      <div>
                        <p className="font-bold underline tracking-wider uppercase">{headName}</p>
                      </div>
                    </div>

                    <div className="flex flex-col justify-between h-32">
                      <div>
                        <p>Sampeldes, {currentDateStr}</p>
                        <p className="font-medium">Kepala Desa Sampeldes,</p>
                      </div>
                      <div>
                        <p className="font-bold underline tracking-wider uppercase">TUKIMAN</p>
                      </div>
                    </div>
                  </div>
                </div>
              </main>
            </div>

            {/* Footer Lembar 1 */}
            <footer className="px-[2cm] pb-[0.3cm] text-[8.5pt] text-slate-500 flex justify-between border-t border-slate-200 pt-1 print:border-none">
              <span>Lembar 1: Surat Pengantar Desa Sampeldes</span>
              <span>Sistem Layanan Surat Digital Desa Sampeldes</span>
            </footer>
          </div>
        )}

        {/* ========================================================
            PEMISAH HALAMAN VISUAL PADA LAYAR
            ======================================================== */}
        {printMode !== 'pengantar' && (
          <>
            <div className="print:hidden text-center py-4 my-2">
              <div className="inline-flex items-center gap-2 bg-sky-100 text-sky-800 text-xs font-bold px-4 py-1.5 rounded-full border border-sky-300 shadow-sm">
                <FileSpreadsheet className="h-4 w-4" />
                <span>LAMPIRAN FORMULIR F-1.01 DUKCAPIL (2 LEMBAR LANDSCAPE SESUAI MASTER SURAT)</span>
              </div>
            </div>

            {/* ========================================================
            LEMBAR 2 : LAMPIRAN F-1.01 (HALAMAN DEPAN)
            ======================================================== */}
            <div
              className="f101-page f101-page-1 bg-white p-6 rounded-xl shadow-lg border border-slate-300 print:border-none print:shadow-none print:p-0"
            >
              <div className="flex justify-between items-start mb-0.5">
                <span className="text-[7pt] text-slate-500 font-mono italic print:hidden">
                  LEMBAR 2 (Halaman Depan) - Formulir Biodata Keluarga F-1.01
                </span>
                <div className="ml-auto">
                  <table className="border border-black font-bold font-mono text-center">
                    <tbody>
                      <tr>
                        <td className="px-3 py-0.5 text-sm sm:text-base font-black tracking-wider">F-1.01</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="text-center -mt-3 mb-1">
                <h2 className="font-black text-[11pt] uppercase tracking-wide">FORMULIR BIODATA KELUARGA</h2>
              </div>

              {/* Peringatan Abu-abu */}
              <div className="border border-black px-1.5 py-0.5 bg-slate-200 text-[6pt] font-bold uppercase tracking-tight mb-1">
                PERHATIAN: Isilah Formulir ini dengan huruf cetak dan jelas serta mengikuti &quot;TATA CARA PENGISIAN FORMULIR&quot;
              </div>

              {/* Pilihan Salah Satu */}
              <div className="space-y-0.5 text-[6.5pt] mb-1">
                <p className="font-semibold text-[6.5pt]">Pilih salah satu:</p>
                <div className="flex items-center gap-2">
                  <span className="border border-black w-3 h-3 flex items-center justify-center font-mono font-bold text-[6.5pt] leading-none">x</span>
                  <span>Input Data Kepala Keluarga dan Anggota Keluarga WNI</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="border border-black w-3 h-3 flex items-center justify-center font-mono text-[6.5pt] leading-none">&nbsp;</span>
                  <span>Input Data Kepala Keluarga dan Anggota Keluarga Orang Asing</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="border border-black w-3 h-3 flex items-center justify-center font-mono text-[6.5pt] leading-none">&nbsp;</span>
                  <span>Input Data Kepala Keluarga dan Anggota Keluarga WNI di Luar Negeri</span>
                </div>
              </div>

              {/* Section I: DATA KEPALA KELUARGA */}
              <div className="border-t border-black pt-1 mb-1">
                <p className="font-black uppercase text-[7pt]">DATA KEPALA KELUARGA</p>
                <table className="w-full text-[6pt] border-collapse mt-0.5 leading-tight">
                  <tbody>
                    <tr>
                      <td className="w-3 text-right pr-1">1.</td>
                      <td className="w-52">Nama Kepala Keluarga / <i>Name of Head of Family</i></td>
                      <td className="w-2">:</td>
                      <td colSpan={10} className="border border-black px-1 py-0.5 font-bold uppercase">{headName}</td>
                    </tr>
                    <tr>
                      <td className="text-right pr-1 pt-0.5">2.</td>
                      <td className="pt-0.5">Alamat / <i>Address</i></td>
                      <td className="pt-0.5">:</td>
                      <td colSpan={10} className="border border-black px-1 py-0.5 font-medium">{address}</td>
                    </tr>
                    <tr>
                      <td></td>
                      <td></td>
                      <td></td>
                      <td colSpan={10} className="border border-black px-1 py-0.5 text-transparent select-none">&nbsp;</td>
                    </tr>
                    <tr>
                      <td className="text-right pr-1 pt-0.5">3.</td>
                      <td className="pt-0.5">Kode Pos / <i>Post Code</i></td>
                      <td className="pt-0.5">:</td>
                      <td className="pt-0.5 flex items-center gap-1">
                        <span className="inline-flex">
                          {postalCode.split('').slice(0, 5).map((d, i) => (
                            <span key={i} className="border border-black w-3 h-3 text-center font-mono font-bold leading-3 inline-block">{d}</span>
                          ))}
                        </span>
                        <span className="ml-3 font-semibold">4. RT</span>
                        <span className="inline-flex">
                          {rt.split('').slice(0, 3).map((d, i) => (
                            <span key={i} className="border border-black w-3 h-3 text-center font-mono font-bold leading-3 inline-block">{d}</span>
                          ))}
                        </span>
                        <span className="ml-3 font-semibold">5. RW</span>
                        <span className="inline-flex">
                          {rw.split('').slice(0, 3).map((d, i) => (
                            <span key={i} className="border border-black w-3 h-3 text-center font-mono font-bold leading-3 inline-block">{d}</span>
                          ))}
                        </span>
                        <span className="ml-3 font-semibold">6. Jumlah Anggota Keluarga</span>
                        <span className="inline-flex">
                          {['0', '5'].map((d, i) => (
                            <span key={i} className="border border-black w-3 h-3 text-center font-mono font-bold leading-3 inline-block">{d}</span>
                          ))}
                        </span>
                        <span className="ml-1">Orang</span>
                      </td>
                    </tr>
                    <tr>
                      <td className="text-right pr-1 pt-0.5">7.</td>
                      <td className="pt-0.5">Telepon / <i>Telephone Number/Handphone</i></td>
                      <td className="pt-0.5">:</td>
                      <td className="pt-0.5">
                        <span className="inline-flex">
                          {(phone + '                ').slice(0, 16).split('').map((d, i) => (
                            <span key={i} className="border border-black w-3 h-3 text-center font-mono text-[5.5pt] leading-3 inline-block">{d.trim() || '\u00A0'}</span>
                          ))}
                        </span>
                      </td>
                    </tr>
                    <tr>
                      <td className="text-right pr-1 pt-0.5">8.</td>
                      <td className="pt-0.5">Email</td>
                      <td className="pt-0.5">:</td>
                      <td className="border border-black px-1 py-0.5 text-slate-500 font-mono">{formData.email || '-'}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Section II: DATA WILAYAH */}
              <div className="border-t border-black pt-1 mb-1">
                <p className="text-[6pt] italic text-slate-700">Kode Wilayah diisi oleh Petugas Kependudukan dan Pencatatan Sipil</p>
                <p className="font-black uppercase text-[7pt]">DATA WILAYAH</p>
                <table className="w-full text-[6pt] border-collapse mt-0.5 leading-tight">
                  <tbody>
                    <tr>
                      <td className="w-3 text-right pr-1">9.</td>
                      <td className="w-52">Kode-Nama Provinsi / <i>Code-Province</i></td>
                      <td className="w-2">:</td>
                      <td className="w-10">
                        <span className="inline-flex">
                          <span className="border border-black w-3 h-3 text-center font-mono font-bold leading-3">3</span>
                          <span className="border border-black w-3 h-3 text-center font-mono font-bold leading-3">3</span>
                        </span>
                      </td>
                      <td className="border border-black px-1 py-0.5 font-semibold">Jawa Tengah</td>
                    </tr>
                    <tr>
                      <td className="text-right pr-1 pt-0.5">10.</td>
                      <td className="pt-0.5">Kode-Nama Kabupaten/Kota / <i>Code-Regency/Municipality</i></td>
                      <td className="pt-0.5">:</td>
                      <td className="pt-0.5">
                        <span className="inline-flex">
                          <span className="border border-black w-3 h-3 text-center font-mono font-bold leading-3">0</span>
                          <span className="border border-black w-3 h-3 text-center font-mono font-bold leading-3">1</span>
                        </span>
                      </td>
                      <td className="border border-black px-1 py-0.5 font-semibold">Cilacap</td>
                    </tr>
                    <tr>
                      <td className="text-right pr-1 pt-0.5">11.</td>
                      <td className="pt-0.5">Kode-Nama Kecamatan / <i>Code Sub-District</i></td>
                      <td className="pt-0.5">:</td>
                      <td className="pt-0.5">
                        <span className="inline-flex">
                          <span className="border border-black w-3 h-3 text-center font-mono font-bold leading-3">1</span>
                          <span className="border border-black w-3 h-3 text-center font-mono font-bold leading-3">0</span>
                        </span>
                      </td>
                      <td className="border border-black px-1 py-0.5 font-semibold">Gandrungmangu</td>
                    </tr>
                    <tr>
                      <td className="text-right pr-1 pt-0.5">12.</td>
                      <td className="pt-0.5">Kode-Nama Kelurahan/Desa / <i>Code-Village</i></td>
                      <td className="pt-0.5">:</td>
                      <td className="pt-0.5">
                        <span className="inline-flex">
                          <span className="border border-black w-3 h-3 text-center font-mono font-bold leading-3">2</span>
                          <span className="border border-black w-3 h-3 text-center font-mono font-bold leading-3">0</span>
                          <span className="border border-black w-3 h-3 text-center font-mono font-bold leading-3">1</span>
                          <span className="border border-black w-3 h-3 text-center font-mono font-bold leading-3">1</span>
                        </span>
                      </td>
                      <td className="border border-black px-1 py-0.5 font-semibold">Sampeldes</td>
                    </tr>
                    <tr>
                      <td className="text-right pr-1 pt-0.5">13.</td>
                      <td className="pt-0.5">Nama Dusun/Kampung / <i>Sub-Village</i></td>
                      <td className="pt-0.5">:</td>
                      <td colSpan={2} className="border border-black px-1 py-0.5 font-semibold">{dusun}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Section III: ALAMAT DI LUAR NEGERI */}
              <div className="border-t border-black pt-1 mb-1">
                <p className="font-bold text-[6.5pt]">Alamat di Luar Negeri (diisi oleh WNI di luar negeri)</p>
                <table className="w-full text-[6pt] border-collapse mt-0.5 leading-tight">
                  <tbody>
                    <tr>
                      <td className="w-3 text-right pr-1">1.</td>
                      <td className="w-52">Alamat</td>
                      <td className="w-2">:</td>
                      <td colSpan={4} className="border border-black px-1 py-0.5 text-slate-400">&nbsp;</td>
                    </tr>
                    <tr>
                      <td></td>
                      <td></td>
                      <td></td>
                      <td colSpan={4} className="border border-black px-1 py-0.5">&nbsp;</td>
                    </tr>
                    <tr>
                      <td className="text-right pr-1 pt-0.5">2.</td>
                      <td className="pt-0.5">Kota</td>
                      <td className="pt-0.5">:</td>
                      <td className="border border-black px-1 py-0.5 w-44">&nbsp;</td>
                      <td className="pl-3 font-semibold w-36">3. Provinsi / Negara Bagian :</td>
                      <td className="border border-black px-1 py-0.5">&nbsp;</td>
                    </tr>
                    <tr>
                      <td className="text-right pr-1 pt-0.5">4.</td>
                      <td className="pt-0.5">Negara</td>
                      <td className="pt-0.5">:</td>
                      <td colSpan={3} className="border border-black px-1 py-0.5">&nbsp;</td>
                    </tr>
                    <tr>
                      <td className="text-right pr-1 pt-0.5">5.</td>
                      <td className="pt-0.5">Kode Pos</td>
                      <td className="pt-0.5">:</td>
                      <td className="border border-black px-1 py-0.5">&nbsp;</td>
                      <td className="pl-3 font-semibold">6. Jumlah Anggota Keluarga :</td>
                      <td className="flex items-center gap-1 pt-0.5">
                        <span className="border border-black w-3 h-3 inline-block">&nbsp;</span>
                        <span className="border border-black w-3 h-3 inline-block">&nbsp;</span>
                        <span className="ml-1">Orang</span>
                      </td>
                    </tr>
                    <tr>
                      <td className="text-right pr-1 pt-0.5">7.</td>
                      <td className="pt-0.5">Telepon / Handphone</td>
                      <td className="pt-0.5">:</td>
                      <td colSpan={3} className="pt-0.5">
                        <span className="inline-flex">
                          {Array.from({ length: 14 }).map((_, i) => (
                            <span key={i} className="border border-black w-3 h-3 inline-block">&nbsp;</span>
                          ))}
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Section IV: DIISI OLEH PETUGAS */}
              <div className="border-t border-black pt-1 mb-1">
                <p className="text-[6pt] italic text-slate-700">Diisi oleh Petugas</p>
                <table className="w-full text-[6pt] border-collapse mt-0.5 leading-tight">
                  <tbody>
                    <tr>
                      <td className="w-52 font-semibold">Kode - Nama Negara</td>
                      <td className="w-2">:</td>
                      <td className="w-14">
                        <span className="inline-flex">
                          <span className="border border-black w-3 h-3 inline-block">&nbsp;</span>
                          <span className="border border-black w-3 h-3 inline-block">&nbsp;</span>
                          <span className="border border-black w-3 h-3 inline-block">&nbsp;</span>
                        </span>
                      </td>
                      <td className="border border-black px-1 py-0.5">&nbsp;</td>
                    </tr>
                    <tr>
                      <td className="pt-0.5 font-semibold">Kode - Nama Perwakilan RI</td>
                      <td className="pt-0.5">:</td>
                      <td className="pt-0.5">
                        <span className="inline-flex">
                          <span className="border border-black w-3 h-3 inline-block">&nbsp;</span>
                          <span className="border border-black w-3 h-3 inline-block">&nbsp;</span>
                          <span className="border border-black w-3 h-3 inline-block">&nbsp;</span>
                        </span>
                      </td>
                      <td className="border border-black px-1 py-0.5 mt-0.5">&nbsp;</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Section V: DATA ANGGOTA KELUARGA (Kolom 1 - 7) */}
              <div className="border-t border-black pt-1">
                <p className="font-black uppercase text-[7pt]">DATA ANGGOTA KELUARGA</p>
                <div className="text-[5.5pt] text-slate-800 space-y-0.2 mb-0.5">
                  <p className="font-semibold">Catatan :</p>
                  <p>- Bagi Penduduk WNI mengisi Kolom 2 s.d 6, 10 s.d 31, 38 s.d 41</p>
                  <p>- <i>For Foreigners only, please fill column 2 to 13, 15 to 41</i></p>
                  <p>- Bagi WNI di luar wilayah NKRI mengisi nomor 2 s.d 31, 38 s.d 41</p>
                </div>

                {/* Tabel Kolom 1 sampai 7 */}
                <div className="w-full">
                  <table className="w-full border-collapse border border-black text-[6pt] text-center">
                    <thead>
                      <tr className="bg-slate-200">
                        <th rowSpan={2} className="border border-black p-0.5 w-6">No</th>
                        <th rowSpan={2} className="border border-black p-0.5 w-52">Nama Lengkap<br /><i className="font-normal">Full Name</i></th>
                        <th colSpan={2} className="border border-black p-0.5">Gelar</th>
                        <th rowSpan={2} className="border border-black p-0.5 w-24">Nomor Paspor<br /><i className="font-normal">Passport Number</i></th>
                        <th rowSpan={2} className="border border-black p-0.5 w-28">Tanggal Berakhir Paspor<br /><i className="font-normal">Date of Expiry</i></th>
                        <th rowSpan={2} className="border border-black p-0.5 w-32">Nama Sponsor<br /><i className="font-normal">Sponsor Name</i></th>
                      </tr>
                      <tr className="bg-slate-200">
                        <th className="border border-black p-0.5 w-12">Depan</th>
                        <th className="border border-black p-0.5 w-12">Belakang</th>
                      </tr>
                      <tr className="bg-slate-100 text-[5.5pt] text-slate-700">
                        <th className="border border-black p-0.2">1</th>
                        <th className="border border-black p-0.2">2</th>
                        <th className="border border-black p-0.2">3</th>
                        <th className="border border-black p-0.2">4</th>
                        <th className="border border-black p-0.2">5</th>
                        <th className="border border-black p-0.2">6</th>
                        <th className="border border-black p-0.2">7</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((row, idx) => (
                        <tr key={idx} className={idx === 9 ? "border-b border-black" : "border-b border-dashed border-black/40"}>
                          <td className="border-r border-black p-0.5 font-mono">{row.no}</td>
                          <td className="border-r border-black p-0.5 text-left font-bold pl-2">{row.nama || '---------------------------------------------------'}</td>
                          <td className="border-r border-black p-0.5 font-mono">{row.gd || '-------'}</td>
                          <td className="border-r border-black p-0.5 font-mono">{row.gb || '-------'}</td>
                          <td className="border-r border-black p-0.5 font-mono">{row.paspor || '------------------'}</td>
                          <td className="border-r border-black p-0.5 font-mono">{row.exp || '------------------'}</td>
                          <td className="border-black p-0.5 font-mono">{row.sponsor || '-----------------------'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* ========================================================
            PEMISAH HALAMAN VISUAL PADA LAYAR
            ======================================================== */}
            <div className="py-2 text-center print:hidden">
              <div className="inline-flex items-center gap-3 px-5 py-2 bg-slate-800 text-white rounded-full text-xs font-mono shadow-md">
                <span>Halaman Depan F-1.01 Selesai</span>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>Lanjut ke Halaman Belakang F-1.01</span>
              </div>
            </div>

            {/* ========================================================
            LEMBAR 3 : LAMPIRAN F-1.01 (HALAMAN BELAKANG)
            ======================================================== */}
            <div
              className="f101-page f101-page-2 bg-white p-6 rounded-xl shadow-lg border border-slate-300 print:border-none print:shadow-none print:p-0"
            >
              <div className="flex justify-between items-center mb-0.5 text-[6.5pt] text-slate-500 font-mono print:hidden">
                <span className="italic">LEMBAR 3 (Halaman Belakang) - Lanjutan Tabel Anggota Keluarga F-1.01</span>
                <span className="font-bold border border-black px-2 py-0.5 text-black">Kode : F-1.01 (Lembar 2)</span>
              </div>

              {/* TABEL 1 : KOLOM 8 - 15 */}
              <div className="w-full mb-1">
                <table className="w-full border-collapse border border-black text-[6pt] text-center">
                  <thead>
                    <tr className="bg-slate-200">
                      <th className="border border-black p-0.5 w-6">No</th>
                      <th className="border border-black p-0.5 w-16">Tipe Sponsor<br /><i className="font-normal">Type of Sponsor</i></th>
                      <th className="border border-black p-0.5 w-36">Alamat Sponsor<br /><i className="font-normal">Sponsor Address</i></th>
                      <th className="border border-black p-0.5 w-16">Jenis Kelamin<br /><i className="font-normal">Sex</i></th>
                      <th className="border border-black p-0.5 w-28">Tempat Lahir<br /><i className="font-normal">Place of Birth</i></th>
                      <th className="border border-black p-0.5 w-28">Tanggal, Bulan, Tahun Lahir<br /><i className="font-normal">Date of Birth</i></th>
                      <th className="border border-black p-0.5 w-20">Kewarganegaraan<br /><i className="font-normal">Nationality</i></th>
                      <th className="border border-black p-0.5 w-20">No. SK Penetapan WNI</th>
                      <th className="border border-black p-0.5 w-16">Akta Lahir</th>
                    </tr>
                    <tr className="bg-slate-100 text-[5.5pt] text-slate-700">
                      <th className="border border-black p-0.2">&nbsp;</th>
                      <th className="border border-black p-0.2">8</th>
                      <th className="border border-black p-0.2">9</th>
                      <th className="border border-black p-0.2">10</th>
                      <th className="border border-black p-0.2">11</th>
                      <th className="border border-black p-0.2">12</th>
                      <th className="border border-black p-0.2">13</th>
                      <th className="border border-black p-0.2">14</th>
                      <th className="border border-black p-0.2">15</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r, i) => (
                      <tr key={i} className={i === 9 ? "border-b border-black" : "border-b border-dashed border-black/40"}>
                        <td className="border-r border-black p-0.5 font-mono">{r.no}</td>
                        <td className="border-r border-black p-0.5 font-mono">{r.c8 || '------'}</td>
                        <td className="border-r border-black p-0.5 font-mono">{r.c9 || '-------------------------'}</td>
                        <td className="border-r border-black p-0.5 font-mono font-bold">{r.c10 || '----'}</td>
                        <td className="border-r border-black p-0.5 font-mono">{r.c11 || '------------------'}</td>
                        <td className="border-r border-black p-0.5 font-mono">{r.c12 || '------------------'}</td>
                        <td className="border-r border-black p-0.5 font-mono">{r.c13 || '------'}</td>
                        <td className="border-r border-black p-0.5 font-mono">{r.c14 || '------'}</td>
                        <td className="border-black p-0.5 font-mono">{r.c15 || '----'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* TABEL 2 : KOLOM 16 - 23 */}
              <div className="w-full mb-1">
                <table className="w-full border-collapse border border-black text-[6pt] text-center">
                  <thead>
                    <tr className="bg-slate-200">
                      <th className="border border-black p-0.5 w-6">No</th>
                      <th className="border border-black p-0.5 w-28">Nomor Akta Kelahiran</th>
                      <th className="border border-black p-0.5 w-20">Gol. Darah<br /><i className="font-normal">Type of Blood</i></th>
                      <th className="border border-black p-0.5 w-16">Agama<br /><i className="font-normal">Religion</i></th>
                      <th className="border border-black p-0.5 w-48">Nama Organisasi Kepercayaan terhadap Tuhan YME</th>
                      <th className="border border-black p-0.5 w-20">Status Perkawinan<br /><i className="font-normal">Marital Status</i></th>
                      <th className="border border-black p-0.5 w-16">Akta Perkawinan</th>
                      <th className="border border-black p-0.5 w-28">Nomor Akta Perkawinan</th>
                      <th className="border border-black p-0.5 w-24">Tanggal Perkawinan</th>
                    </tr>
                    <tr className="bg-slate-100 text-[5.5pt] text-slate-700">
                      <th className="border border-black p-0.2">&nbsp;</th>
                      <th className="border border-black p-0.2">16</th>
                      <th className="border border-black p-0.2">17</th>
                      <th className="border border-black p-0.2">18</th>
                      <th className="border border-black p-0.2">19</th>
                      <th className="border border-black p-0.2">20</th>
                      <th className="border border-black p-0.2">21</th>
                      <th className="border border-black p-0.2">22</th>
                      <th className="border border-black p-0.2">23</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r, i) => (
                      <tr key={i} className={i === 9 ? "border-b border-black" : "border-b border-dashed border-black/40"}>
                        <td className="border-r border-black p-0.5 font-mono">{r.no}</td>
                        <td className="border-r border-black p-0.5 font-mono">{r.c16 || '------------------'}</td>
                        <td className="border-r border-black p-0.5 font-mono">{r.c17 || '------'}</td>
                        <td className="border-r border-black p-0.5 font-mono">{r.c18 || '----'}</td>
                        <td className="border-r border-black p-0.5 font-mono">{r.c19 || '---------------------------------'}</td>
                        <td className="border-r border-black p-0.5 font-mono">{r.c20 || '----'}</td>
                        <td className="border-r border-black p-0.5 font-mono">{r.c21 || '----'}</td>
                        <td className="border-r border-black p-0.5 font-mono">{r.c22 || '------------------'}</td>
                        <td className="border-black p-0.5 font-mono">{r.c23 || '------------------'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* TABEL 3 : KOLOM 24 - 33 */}
              <div className="w-full mb-1">
                <table className="w-full border-collapse border border-black text-[6pt] text-center">
                  <thead>
                    <tr className="bg-slate-200">
                      <th className="border border-black p-0.5 w-6">No</th>
                      <th className="border border-black p-0.5 w-16">Akta Cerai</th>
                      <th className="border border-black p-0.5 w-28">Nomor Akta Perceraian</th>
                      <th className="border border-black p-0.5 w-24">Tanggal Perceraian</th>
                      <th className="border border-black p-0.5 w-24">SHDK</th>
                      <th className="border border-black p-0.5 w-20">Kelainan Fisik & Mental</th>
                      <th className="border border-black p-0.5 w-20">Penyandang Cacat</th>
                      <th className="border border-black p-0.5 w-20">Pendidikan Terakhir</th>
                      <th className="border border-black p-0.5 w-20">Jenis Pekerjaan</th>
                      <th className="border border-black p-0.5 w-24">Nomor ITAS/ITAP</th>
                      <th className="border border-black p-0.5 w-24">Tempat Terbit ITAS/ITAP</th>
                    </tr>
                    <tr className="bg-slate-100 text-[5.5pt] text-slate-700">
                      <th className="border border-black p-0.2">&nbsp;</th>
                      <th className="border border-black p-0.2">24</th>
                      <th className="border border-black p-0.2">25</th>
                      <th className="border border-black p-0.2">26</th>
                      <th className="border border-black p-0.2">27</th>
                      <th className="border border-black p-0.2">28</th>
                      <th className="border border-black p-0.2">29</th>
                      <th className="border border-black p-0.2">30</th>
                      <th className="border border-black p-0.2">31</th>
                      <th className="border border-black p-0.2">32</th>
                      <th className="border border-black p-0.2">33</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r, i) => (
                      <tr key={i} className={i === 9 ? "border-b border-black" : "border-b border-dashed border-black/40"}>
                        <td className="border-r border-black p-0.5 font-mono">{r.no}</td>
                        <td className="border-r border-black p-0.5 font-mono">{r.c24 || '----'}</td>
                        <td className="border-r border-black p-0.5 font-mono">{r.c25 || '------------------'}</td>
                        <td className="border-r border-black p-0.5 font-mono">{r.c26 || '------------------'}</td>
                        <td className="border-r border-black p-0.5 font-mono font-bold">{r.c27 || '----'}</td>
                        <td className="border-r border-black p-0.5 font-mono">{r.c28 || '----'}</td>
                        <td className="border-r border-black p-0.5 font-mono">{r.c29 || '----'}</td>
                        <td className="border-r border-black p-0.5 font-mono">{r.c30 || '----'}</td>
                        <td className="border-r border-black p-0.5 font-mono">{r.c31 || '----'}</td>
                        <td className="border-r border-black p-0.5 font-mono">{r.c32 || '------------------'}</td>
                        <td className="border-black p-0.5 font-mono">{r.c33 || '------------------'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* TABEL 4 : KOLOM 34 - 41 */}
              <div className="w-full mb-1">
                <table className="w-full border-collapse border border-black text-[6pt] text-center">
                  <thead>
                    <tr className="bg-slate-200">
                      <th className="border border-black p-0.5 w-6">No</th>
                      <th className="border border-black p-0.5 w-24">Tanggal Terbit ITAS/ITAP</th>
                      <th className="border border-black p-0.5 w-24">Tanggal Akhir ITAS/ITAP</th>
                      <th className="border border-black p-0.5 w-24">Tempat Datang Pertama</th>
                      <th className="border border-black p-0.5 w-24">Tanggal Kedatangan Pertama</th>
                      <th className="border border-black p-0.5 w-32">NIK Ibu</th>
                      <th className="border border-black p-0.5 w-36">Nama Ibu</th>
                      <th className="border border-black p-0.5 w-32">NIK Ayah</th>
                      <th className="border border-black p-0.5 w-36">Nama Ayah</th>
                    </tr>
                    <tr className="bg-slate-100 text-[5.5pt] text-slate-700">
                      <th className="border border-black p-0.2">&nbsp;</th>
                      <th className="border border-black p-0.2">34</th>
                      <th className="border border-black p-0.2">35</th>
                      <th className="border border-black p-0.2">36</th>
                      <th className="border border-black p-0.2">37</th>
                      <th className="border border-black p-0.2">38</th>
                      <th className="border border-black p-0.2">39</th>
                      <th className="border border-black p-0.2">40</th>
                      <th className="border border-black p-0.2">41</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r, i) => (
                      <tr key={i} className={i === 9 ? "border-b border-black" : "border-b border-dashed border-black/40"}>
                        <td className="border-r border-black p-0.5 font-mono">{r.no}</td>
                        <td className="border-r border-black p-0.5 font-mono">{r.c34 || '------------------'}</td>
                        <td className="border-r border-black p-0.5 font-mono">{r.c35 || '------------------'}</td>
                        <td className="border-r border-black p-0.5 font-mono">{r.c36 || '------------------'}</td>
                        <td className="border-r border-black p-0.5 font-mono">{r.c37 || '------------------'}</td>
                        <td className="border-r border-black p-0.5 font-mono">{r.c38 || '--------------------'}</td>
                        <td className="border-r border-black p-0.5 font-bold text-left pl-1">{r.c39 || '--------------------------'}</td>
                        <td className="border-r border-black p-0.5 font-mono">{r.c40 || '--------------------'}</td>
                        <td className="border-black p-0.5 font-bold text-left pl-1">{r.c41 || '--------------------------'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* TANDA TANGAN LEMBAR 2 */}
              <div className="pt-1 grid grid-cols-2 text-center text-[7pt] leading-tight">
                <div>
                  <p>Mengetahui,</p>
                  <p className="font-semibold">Kepala Dinas Kependudukan dan Pencatatan Sipil</p>
                  <p className="font-semibold">Kabupaten Cilacap</p>
                  <div className="h-9"></div>
                  <div className="w-52 mx-auto border-b border-black"></div>
                  <p className="mt-0.5 font-mono text-[6.5pt]">NIP.</p>
                </div>
                <div>
                  <p className="font-semibold">Kepala Keluarga / <i>Head of Family</i></p>
                  <div className="h-10"></div>
                  <p className="font-bold uppercase tracking-wider">{headName}</p>
                </div>
              </div>

              {/* KLAUSUL PERNYATAAN */}
              <div className="mt-1 border-t border-black pt-0.5 text-[5.5pt] leading-tight">
                <p className="font-bold uppercase">PERNYATAAN</p>
                <p className="text-justify">
                  Demikian Formulir ini saya/kami isi dengan sesungguhnya. Apabila keterangan tersebut tidak sesuai dengan sebenarnya, saya bersedia dikenakan sanksi sesuai dengan ketentuan peraturan perundang-undangan yang berlaku.
                </p>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

