'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  CheckCircle2,
  Users,
  FileCheck2,
  Landmark,
  ShieldCheck,
  TrendingUp,
  ArrowRight,
} from 'lucide-react';

export function StatisticsSection() {
  const commitments = [
    {
      title: 'Transparansi APBDes Realtime',
      desc: 'Publikasi terbuka rincian pendapatan, belanja desa, dan serapan anggaran pembangunan.',
    },
    {
      title: 'Pelayanan Cepat Bebas Pungli',
      desc: 'Standar operasional pelayanan bersih tanpa biaya tidak resmi untuk semua warga.',
    },
    {
      title: 'Pengembangan Saanen & Pangan',
      desc: 'Alokasi dana desa difokuskan pada ketahanan pangan, pertanian modern, dan peternakan.',
    },
    {
      title: 'Musyawarah Warga Inklusif',
      desc: 'Setiap perwakilan dusun, RT/RW, dan pemuda dilibatkan langsung dalam perencanaan desa.',
    },
  ];

  const metrics = [
    {
      icon: Users,
      value: '8.775',
      label: 'Jiwa Penduduk BPS',
      sublabel: '8.563 Jiwa Desa • 4 RW & 41 RT',
    },
    {
      icon: FileCheck2,
      value: '100%',
      label: 'Surat Terintegrasi',
      sublabel: 'Pengajuan Mandiri Digital',
    },
    {
      icon: Landmark,
      value: 'Rp 2,1 M',
      label: 'APBDes Terbuka',
      sublabel: 'Transparansi Realisasi 2026',
    },
    {
      icon: ShieldCheck,
      value: '99.4%',
      label: 'Realisasi Program',
      sublabel: 'Indeks Pembangunan Desa',
    },
  ];

  return (
    <section id="statistik-desa" className="relative w-full py-12 sm:py-20 lg:py-28 overflow-hidden select-none">
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-12 lg:gap-14 items-center">
          {/* SISI KIRI: DESKRIPSI & CHECKLIST (SESUAI GAMBAR REFERENSI SECTION 4) */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="lg:col-span-6 flex flex-col items-start"
          >
            {/* Tag Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-50 dark:bg-teal-950/40 border border-teal-200/60 dark:border-teal-700/30 text-teal-700 dark:text-teal-300 text-[11px] font-bold tracking-[0.2em] uppercase mb-4">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-500" />
              <span>TRANSPARANSI & TATA KELOLA</span>
            </div>

            {/* Main Title Dual Tone */}
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white leading-[1.2] tracking-tight mb-5">
              Pemerintahan Terbuka, Membangun{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-600 to-emerald-500 dark:from-teal-400 dark:to-emerald-400">
                Lebih dari Sekadar Fisik
              </span>
            </h2>

            <p className="text-slate-600 dark:text-slate-300 text-sm sm:text-base leading-relaxed mb-8">
              Pemerintah Desa Sampeldes memegang teguh prinsip keterbukaan informasi publik dan akuntabilitas anggaran demi mewujudkan kemandirian ekonomi, kesejahteraan sosial, serta pelayanan birokrasi yang memuliakan warga.
            </p>

            {/* 4 Checklist Items */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 w-full mb-8">
              {commitments.map((item, idx) => (
                <div key={idx} className="flex items-start gap-3">
                  <div className="mt-1 h-5 w-5 rounded-full bg-teal-100 dark:bg-teal-900/50 text-teal-700 dark:text-teal-400 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                      {item.title}
                    </h4>
                    <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-normal">
                      {item.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Link to Transparency & APBDes Page */}
            <Link
              href="/tata-kelola-desa/"
              className="inline-flex items-center gap-2 sm:gap-2.5 text-[10px] sm:text-xs font-bold text-teal-700 dark:text-teal-400 hover:text-emerald-600 transition-colors uppercase tracking-wider sm:tracking-widest group"
            >
              <span>Lihat Detail APBDes & Tata Kelola Desa</span>
              <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1.5 transition-transform" />
            </Link>
          </motion.div>

          {/* SISI KANAN: DARK NAVY CONTAINER DENGAN BEGROUND FOTO & 4 METRIK BERSINAR (SESUAI GAMBAR REFERENSI SECTION 4) */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="lg:col-span-6 relative"
          >
            <div className="relative rounded-3xl sm:rounded-[32px] bg-[#071720] text-white p-4 sm:p-10 shadow-2xl overflow-hidden border border-teal-500/30">
              {/* BEGROUND SILUET ALAM & HUTAN PINUS SINEMATIK (SESUAI TEMA KARTU REFERENSI) */}
              <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
                <Image
                  src="https://images.unsplash.com/photo-1511497584788-876760111969?q=80&w=2400&auto=format&fit=crop"
                  alt="Siluet Hutan Pinus Sampeldes"
                  fill
                  sizes="(max-width: 1024px) 100vw, 600px"
                  className="object-cover object-center opacity-45 contrast-125 brightness-90 pointer-events-none"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#051118]/95 via-[#071720]/65 to-[#071720]/80 pointer-events-none" />
                <div className="absolute inset-0 bg-gradient-to-r from-teal-950/40 via-transparent to-emerald-950/30 pointer-events-none" />
              </div>

              {/* Header Box di dalam Container Gelap */}
              <div className="relative z-10 flex items-center justify-between border-b border-white/15 pb-3.5 sm:pb-6 mb-4 sm:mb-8">
                <div>
                  <span className="text-[9px] sm:text-[10px] font-mono tracking-widest text-teal-400 uppercase">
                    DATA STATISTIK DESA
                  </span>
                  <h3 className="text-sm sm:text-xl font-extrabold text-white mt-0.5 sm:mt-1">
                    Indikator Capaian Sampeldes
                  </h3>
                </div>
                <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-teal-500/20 border border-teal-400/40 text-teal-300 flex items-center justify-center shrink-0">
                  <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5" />
                </div>
              </div>

              {/* 4 Glowing Metric Tiles (2x2 Grid) */}
              <div className="relative z-10 grid grid-cols-2 gap-2.5 sm:gap-6">
                {metrics.map((metric, idx) => {
                  const IconComp = metric.icon;
                  return (
                    <motion.div
                      key={idx}
                      whileHover={{ scale: 1.03 }}
                      transition={{ duration: 0.2 }}
                      className="bg-[#061822]/60 hover:bg-[#082230]/80 rounded-xl sm:rounded-2xl p-3 sm:p-5 border border-teal-500/25 hover:border-teal-400/50 backdrop-blur-md transition-all shadow-sm group min-w-0"
                    >
                      <div className="flex items-center gap-2 mb-1.5 sm:mb-2">
                        <div className="h-6 w-6 sm:h-7 sm:w-7 rounded-lg bg-teal-500/20 text-teal-400 border border-teal-400/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                          <IconComp className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                        </div>
                      </div>
                      <div className="text-lg sm:text-3xl font-extrabold text-white font-mono tracking-tight truncate">
                        {metric.value}
                      </div>
                      <p className="text-[9.5px] sm:text-xs font-bold text-teal-300 mt-0.5 sm:mt-1 uppercase tracking-wide truncate">
                        {metric.label}
                      </p>
                      <p className="text-[8.5px] sm:text-[10px] text-white/50 mt-0.5 line-clamp-1">
                        {metric.sublabel}
                      </p>
                    </motion.div>
                  );
                })}
              </div>

              {/* Footer Note di dalam Container Gelap */}
              <div className="relative z-10 mt-4 sm:mt-8 pt-3.5 sm:pt-5 border-t border-white/10 flex flex-col min-[400px]:flex-row min-[400px]:items-center justify-between gap-1.5 text-[9.5px] sm:text-[11px] text-white/60">
                <span>Sumber: SIAK &amp; Portal Data IDM Desa 2026</span>
                <Link
                  href="/statistik/"
                  className="text-teal-400 hover:text-teal-300 font-bold uppercase tracking-wider underline underline-offset-4"
                >
                  Buka Statistik Lengkap
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

export default StatisticsSection;
