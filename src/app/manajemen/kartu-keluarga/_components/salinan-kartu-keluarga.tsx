'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Printer, Download, ArrowLeft, FileText, CheckCircle2 } from 'lucide-react';
import { Family, Resident } from '@/lib/types';
import { generateSalinanKartuKeluargaPdf } from '@/lib/pdf-kartu-keluarga';
import { PageHeader } from '@/components/page-header';

interface SalinanKartuKeluargaProps {
  family: Family;
  members: Resident[];
  onBackToMembers: () => void;
  onBackToFamilyList: () => void;
  villageSettings?: any;
}

export function SalinanKartuKeluarga({
  family,
  members,
  onBackToMembers,
  onBackToFamilyList,
  villageSettings,
}: SalinanKartuKeluargaProps) {
  const desaName = villageSettings?.villageName || 'SAMPELDES';
  const kecamatanName = villageSettings?.subdistrict || 'GANDRUNGMANGU';
  const kabupatenName = villageSettings?.regency || 'CILACAP';
  const provinsiName = villageSettings?.province || 'JAWA TENGAH';
  const kodePos = villageSettings?.postalCode || '53254';
  const kadesName = villageSettings?.kepalaDesa || 'TUKIMAN';

  const now = new Date();
  const months = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];
  const tanggalCetak = `${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()}`;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = () => {
    generateSalinanKartuKeluargaPdf({
      noKk: family.noKk,
      kepalaKeluarga: family.kepalaKeluarga,
      alamat: family.alamat,
      dusun: family.dusun,
      rt: family.rt,
      rw: family.rw,
      desa: desaName,
      kecamatan: kecamatanName,
      kabupaten: kabupatenName,
      kodePos: kodePos,
      provinsi: provinsiName,
      members: members,
      kepalaDesaName: kadesName,
      tanggalCetak: tanggalCetak,
    });
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Terpadu Sistem (Disembunyikan saat cetak) */}
      <PageHeader
        className="no-print"
        title="Salinan Kartu Keluarga"
        description={`Pratinjau dan penerbitan berkas resmi Salinan Kartu Keluarga No. ${family.noKk} atas nama Kepala Keluarga ${family.kepalaKeluarga}.`}
      >
        <div className="flex flex-wrap items-center gap-2">
          <Button
            onClick={handlePrint}
            className="h-10 px-4 rounded-xl text-xs font-black bg-[#d4e157] text-slate-950 hover:bg-[#c2cf38] uppercase tracking-wider border border-black/10 shadow-xs transition-all active:scale-95 gap-1.5"
          >
            <Printer className="w-4 h-4 text-slate-950" />
            <span>Cetak Salinan (A4)</span>
          </Button>

          <Button
            onClick={handleDownloadPdf}
            className="h-10 px-3.5 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white shadow-xs gap-1.5"
          >
            <Download className="w-4 h-4 text-slate-200" />
            <span>Unduh PDF Resmi</span>
          </Button>
        </div>
      </PageHeader>

      {/* 2. Toolbar Navigasi Cepat (Disembunyikan saat cetak) */}
      <div className="no-print neu-dashboard-card rounded-[22px] p-3.5 sm:p-4 border border-white/80 dark:border-white/10 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Button
            onClick={onBackToMembers}
            variant="outline"
            className="h-9 px-3 rounded-xl text-xs font-bold border-stone-300 text-slate-700 hover:text-slate-950 dark:border-white/20 dark:text-slate-200 gap-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Daftar Anggota</span>
          </Button>

          <Button
            onClick={onBackToFamilyList}
            variant="outline"
            className="h-9 px-3 rounded-xl text-xs font-bold border-stone-300 text-slate-700 hover:text-slate-950 dark:border-white/20 dark:text-slate-200 gap-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Master Data KK</span>
          </Button>
        </div>

        <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-400">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Siap Cetak Landscape A4 Standar Dukcapil</span>
        </div>
      </div>

      {/* 3. Lembar Dokumen Resmi Salinan Kartu Keluarga (Siap Cetak Landscape) */}
      <div className="salinan-kk-wrapper neu-dashboard-card rounded-[24px] bg-white text-black p-6 sm:p-10 border border-white/80 dark:border-white/10 shadow-md print:border-none print:shadow-none print:p-0 print:rounded-none print:bg-white overflow-x-auto">
        <div className="min-w-[850px]">
          {/* Header Dokumen */}
          <div className="text-center mb-6">
            <h2 className="text-lg sm:text-2xl font-extrabold tracking-wide uppercase font-serif text-slate-950">
              SALINAN KARTU KELUARGA
            </h2>
            <p className="text-sm sm:text-base font-bold font-mono tracking-wider mt-1 text-slate-900">
              No. {family.noKk}
            </p>
          </div>

          {/* Informasi Wilayah 2 Kolom Grid */}
          <div className="grid grid-cols-2 gap-x-8 gap-y-1 text-xs sm:text-[13px] mb-5 font-semibold text-slate-900">
            {/* Kolom Kiri */}
            <div className="space-y-1">
              <div className="flex">
                <span className="w-36 font-bold uppercase">ALAMAT</span>
                <span className="mr-2">:</span>
                <span className="flex-1 uppercase font-normal">{family.alamat || `DUSUN ${family.dusun}`}</span>
              </div>
              <div className="flex">
                <span className="w-36 font-bold uppercase">RT/RW</span>
                <span className="mr-2">:</span>
                <span className="flex-1 font-normal">{String(family.rt || '001').padStart(3, '0')} / {String(family.rw || '001').padStart(3, '0')}</span>
              </div>
              <div className="flex">
                <span className="w-36 font-bold uppercase">DESA / KELURAHAN</span>
                <span className="mr-2">:</span>
                <span className="flex-1 uppercase font-normal">{desaName}</span>
              </div>
              <div className="flex">
                <span className="w-36 font-bold uppercase">KECAMATAN</span>
                <span className="mr-2">:</span>
                <span className="flex-1 uppercase font-normal">{kecamatanName}</span>
              </div>
            </div>

            {/* Kolom Kanan */}
            <div className="space-y-1">
              <div className="flex">
                <span className="w-36 font-bold uppercase">KABUPATEN</span>
                <span className="mr-2">:</span>
                <span className="flex-1 uppercase font-normal">{kabupatenName}</span>
              </div>
              <div className="flex">
                <span className="w-36 font-bold uppercase">KODE POS</span>
                <span className="mr-2">:</span>
                <span className="flex-1 font-normal">{kodePos}</span>
              </div>
              <div className="flex">
                <span className="w-36 font-bold uppercase">PROVINSI</span>
                <span className="mr-2">:</span>
                <span className="flex-1 uppercase font-normal">{provinsiName}</span>
              </div>
              <div className="flex">
                <span className="w-36 font-bold uppercase">JUMLAH ANGGOTA</span>
                <span className="mr-2">:</span>
                <span className="flex-1 font-normal">{members.length}</span>
              </div>
            </div>
          </div>

          {/* TABEL 1: Biodata, Pendidikan & Pekerjaan */}
          <div className="overflow-x-auto mb-4">
            <table className="w-full text-[11px] sm:text-xs border-collapse border border-slate-400 print:border-black text-slate-900">
              <thead>
                <tr className="bg-slate-100 print:bg-slate-200 text-slate-900 print:text-black font-bold text-center">
                  <th className="border border-slate-400 print:border-black p-1.5 w-8">No</th>
                  <th className="border border-slate-400 print:border-black p-1.5">Nama Lengkap</th>
                  <th className="border border-slate-400 print:border-black p-1.5 w-36">NIK</th>
                  <th className="border border-slate-400 print:border-black p-1.5 w-24">Jenis Kelamin</th>
                  <th className="border border-slate-400 print:border-black p-1.5 w-28">Tempat Lahir</th>
                  <th className="border border-slate-400 print:border-black p-1.5 w-24">Tanggal Lahir</th>
                  <th className="border border-slate-400 print:border-black p-1.5 w-20">Agama</th>
                  <th className="border border-slate-400 print:border-black p-1.5 w-32">Pendidikan</th>
                  <th className="border border-slate-400 print:border-black p-1.5 w-36">Jenis Pekerjaan</th>
                  <th className="border border-slate-400 print:border-black p-1.5 w-24">Golongan Darah</th>
                </tr>
              </thead>
              <tbody>
                {members.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="border border-slate-400 print:border-black p-3 text-center text-slate-400">
                      Tidak ada anggota keluarga yang terdaftar.
                    </td>
                  </tr>
                ) : (
                  members.map((m, idx) => (
                    <tr key={m.nik || idx} className="hover:bg-slate-50">
                      <td className="border border-slate-400 print:border-black p-1.5 text-center font-mono">{idx + 1}</td>
                      <td className="border border-slate-400 print:border-black p-1.5 font-semibold uppercase">{m.fullName || '-'}</td>
                      <td className="border border-slate-400 print:border-black p-1.5 text-center font-mono">{m.nik || '-'}</td>
                      <td className="border border-slate-400 print:border-black p-1.5 text-center uppercase">{m.gender || '-'}</td>
                      <td className="border border-slate-400 print:border-black p-1.5 uppercase">{m.placeOfBirth || '-'}</td>
                      <td className="border border-slate-400 print:border-black p-1.5 text-center font-mono">{m.dateOfBirth || '-'}</td>
                      <td className="border border-slate-400 print:border-black p-1.5 text-center uppercase">{m.religion || '-'}</td>
                      <td className="border border-slate-400 print:border-black p-1.5 uppercase">{m.educationLevel || '-'}</td>
                      <td className="border border-slate-400 print:border-black p-1.5 uppercase">{m.occupation || '-'}</td>
                      <td className="border border-slate-400 print:border-black p-1.5 text-center uppercase">{m.bloodType && m.bloodType !== '-' ? m.bloodType : '-'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* TABEL 2: Status Hukum, Hubungan & Orang Tua */}
          <div className="overflow-x-auto mb-8">
            <table className="w-full text-[11px] sm:text-xs border-collapse border border-slate-400 print:border-black text-slate-900">
              <thead>
                <tr className="bg-slate-100 print:bg-slate-200 text-slate-900 print:text-black font-bold text-center">
                  <th className="border border-slate-400 print:border-black p-1.5 w-8">No</th>
                  <th className="border border-slate-400 print:border-black p-1.5 w-28">Status Perkawinan</th>
                  <th className="border border-slate-400 print:border-black p-1.5 w-28">Tanggal Perkawinan</th>
                  <th className="border border-slate-400 print:border-black p-1.5">Status Hubungan Dalam Keluarga</th>
                  <th className="border border-slate-400 print:border-black p-1.5 w-24">Kewarganegaraan</th>
                  <th className="border border-slate-400 print:border-black p-1.5 w-24">No. Paspor</th>
                  <th className="border border-slate-400 print:border-black p-1.5 w-24">No. KITAS / KITAP</th>
                  <th className="border border-slate-400 print:border-black p-1.5 w-36">Nama Ayah</th>
                  <th className="border border-slate-400 print:border-black p-1.5 w-36">Nama Ibu</th>
                </tr>
              </thead>
              <tbody>
                {members.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="border border-slate-400 print:border-black p-3 text-center text-slate-400">
                      Tidak ada anggota keluarga yang terdaftar.
                    </td>
                  </tr>
                ) : (
                  members.map((m, idx) => (
                    <tr key={m.nik || idx} className="hover:bg-slate-50">
                      <td className="border border-slate-400 print:border-black p-1.5 text-center font-mono">{idx + 1}</td>
                      <td className="border border-slate-400 print:border-black p-1.5 text-center uppercase">{m.maritalStatus || '-'}</td>
                      <td className="border border-slate-400 print:border-black p-1.5 text-center font-mono">{m.marriageDate || '-'}</td>
                      <td className="border border-slate-400 print:border-black p-1.5 uppercase font-medium">{m.relationshipToHeadOfFamily || '-'}</td>
                      <td className="border border-slate-400 print:border-black p-1.5 text-center uppercase">{m.nationality || 'WNI'}</td>
                      <td className="border border-slate-400 print:border-black p-1.5 text-center uppercase font-mono">{m.passportNumber || '-'}</td>
                      <td className="border border-slate-400 print:border-black p-1.5 text-center uppercase font-mono">{m.kitasNumber || '-'}</td>
                      <td className="border border-slate-400 print:border-black p-1.5 uppercase">{m.fatherName || '-'}</td>
                      <td className="border border-slate-400 print:border-black p-1.5 uppercase">{m.motherName || '-'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Tanda Tangan Dokumen Sesuai Panjang Nama */}
          <div className="flex justify-between items-start text-xs sm:text-[13px] pt-4 px-8 print:px-6 text-slate-900">
            {/* Sisi Kiri: Kepala Keluarga */}
            <div className="text-center w-64 space-y-16">
              <p className="font-bold uppercase tracking-wider">KEPALA KELUARGA</p>
              <div>
                <span className="font-bold uppercase border-b border-slate-900 print:border-black tracking-wide inline-block pb-0.5">
                  {family.kepalaKeluarga || '..............................'}
                </span>
              </div>
            </div>

            {/* Sisi Kanan: Kepala Desa Sampeldes */}
            <div className="text-center w-64 space-y-16">
              <div>
                <p className="text-xs mb-0.5">{desaName}, {tanggalCetak}</p>
                <p className="font-bold uppercase tracking-wider">KEPALA DESA {desaName}</p>
              </div>
              <div>
                <span className="font-bold uppercase border-b border-slate-900 print:border-black tracking-wide inline-block pb-0.5">
                  {kadesName}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Global Print Styles khusus halaman ini */}
      <style jsx global>{`
        @media print {
          @page {
            size: landscape;
            margin: 8mm 10mm 8mm 10mm;
          }
          /* Hilangkan semua elemen web luar */
          body * {
            visibility: hidden;
          }
          .salinan-kk-wrapper, .salinan-kk-wrapper * {
            visibility: visible;
          }
          .salinan-kk-wrapper {
            position: absolute;
            left: 0;
            top: 0;
            width: 100% !important;
            padding: 0 !important;
            margin: 0 !important;
            border: none !important;
            box-shadow: none !important;
            background: #ffffff !important;
            color: #000000 !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}
