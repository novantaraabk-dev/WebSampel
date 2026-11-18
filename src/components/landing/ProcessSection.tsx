'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
  FileEdit,
  ClipboardCheck,
  Stamp,
  DownloadCloud,
} from 'lucide-react';

const STEPS_DATA = [
  {
    number: '01',
    icon: FileEdit,
    title: 'Isi Formulir Online',
    description: 'Pilih jenis surat yang dibutuhkan dan lengkapi formulir permohonan dari ponsel Anda.',
  },
  {
    number: '02',
    icon: ClipboardCheck,
    title: 'Verifikasi Berkas',
    description: 'Pamong memeriksa kesesuaian data identitas NIK dan biodata kependudukan warga.',
  },
  {
    number: '03',
    icon: Stamp,
    title: 'Pengesahan & TTE',
    description: 'Penandatanganan resmi oleh Kepala Desa dengan validasi tanda tangan elektronik.',
  },
  {
    number: '04',
    icon: DownloadCloud,
    title: 'Unduh / Ambil Surat',
    description: 'Surat resmi langsung terbit, dapat diunduh versi digital atau dicetak di balai desa.',
  },
];

export function ProcessSection() {
  return (
    <section className="relative w-full py-12 sm:py-20 lg:py-28 overflow-hidden select-none">
      <div className="relative mx-auto max-w-7xl px-3 sm:px-6 lg:px-8">
        {/* HEADER SECTION (SESUAI GAMBAR REFERENSI SECTION 6) */}
        <div className="text-center max-w-2xl mx-auto mb-8 sm:mb-20 px-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-50 dark:bg-teal-950/40 border border-teal-200/60 dark:border-teal-700/30 text-teal-700 dark:text-teal-300 text-[9px] sm:text-[11px] font-bold tracking-[0.2em] uppercase mb-3 sm:mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-teal-500" />
            <span>ALUR PELAYANAN CEPAT</span>
          </div>

          <h2 className="text-xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight">
            Alur Praktis Pengajuan{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-600 to-emerald-500 dark:from-teal-400 dark:to-emerald-400">
              Layanan Surat Mandiri
            </span>
          </h2>
          <p className="mt-2.5 sm:mt-4 text-slate-600 dark:text-slate-300 text-[11px] sm:text-base leading-relaxed">
            Hanya butuh 4 langkah mudah tanpa perlu antre berjam-jam untuk mengurus dokumen administrasi desa.
          </p>
        </div>

        {/* 4 STEPS WITH CONNECTING LINE (SATU BARIS DI SEMUA UKURAN LAYAR) */}
        <div className="relative grid grid-cols-4 gap-1.5 sm:gap-6">
          {/* Garis Penghubung Horizontal */}
          <div className="absolute top-[22px] sm:top-[40px] lg:top-[48px] left-[12.5%] right-[12.5%] h-[2px] bg-gradient-to-r from-teal-200 via-teal-400/60 to-teal-200 dark:from-white/10 dark:via-teal-500/40 dark:to-white/10 z-0" />

          {STEPS_DATA.map((step, idx) => {
            const IconComp = step.icon;
            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.12 }}
                className="relative z-10 flex flex-col items-center text-center group"
              >
                {/* Circular Icon with Step Badge */}
                <div className="relative mb-2 sm:mb-6">
                  <div className="h-11 w-11 sm:h-20 sm:w-20 lg:h-24 lg:w-24 rounded-full bg-white dark:bg-[#0a1b24] border-2 border-teal-500/30 dark:border-teal-400/30 flex items-center justify-center shadow-md sm:shadow-lg group-hover:border-teal-500 group-hover:scale-105 transition-all duration-300">
                    <div className="h-8 w-8 sm:h-14 sm:w-14 lg:h-16 lg:w-16 rounded-full bg-gradient-to-br from-teal-500 to-emerald-600 text-white flex items-center justify-center shadow-md">
                      <IconComp className="h-4 w-4 sm:h-6 sm:w-6 lg:h-7 lg:w-7" />
                    </div>
                  </div>
                  <span className="absolute -top-1 -right-1.5 sm:-top-1 sm:-right-1 h-4 w-4 sm:h-7 sm:w-7 rounded-full bg-[#081d27] text-white text-[7px] sm:text-[11px] font-mono font-bold flex items-center justify-center border border-white sm:border-2 dark:border-[#0a1b24]">
                    {step.number}
                  </span>
                </div>

                {/* Step Title & Description */}
                <h3 className="text-[9.5px] min-[400px]:text-[10.5px] sm:text-base lg:text-lg font-bold leading-tight text-slate-900 dark:text-white sm:mb-2 group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors px-0.5">
                  {step.title}
                </h3>
                <p className="hidden sm:block text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed max-w-xs">
                  {step.description}
                </p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default ProcessSection;
