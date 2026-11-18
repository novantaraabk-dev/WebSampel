'use client';

import React from 'react';
import { Header } from '@/components/landing/Header';
import { Footer } from '@/components/landing/Footer';
import { BackgroundPattern } from '@/components/landing/BackgroundPattern';
import { MessageSquareWarning } from 'lucide-react';
import { ComplaintSystem } from '@/app/(main)/pengaduan/_components/complaint-system';

export default function PengaduanPage() {
  return (
    <div className="relative flex min-h-screen flex-col bg-[#F8FAFC] dark:bg-[#060b11] text-slate-900 dark:text-slate-100 overflow-x-hidden font-sans">
      <BackgroundPattern />
      <Header />

      <main className="relative flex-1 pt-24 sm:pt-28 pb-16 sm:pb-20">
        {/* PAGE HERO */}
        <section className="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8 pt-4 sm:pt-8 pb-6 sm:pb-10">
          <div className="text-center max-w-3xl mx-auto space-y-3 sm:space-y-4">
            <div className="inline-flex items-center gap-2 neu-pill px-4 py-1.5 text-[10px] sm:text-xs font-bold uppercase tracking-widest text-teal-700 dark:text-teal-400">
              <span className="w-2 h-2 rounded-full bg-teal-600 dark:bg-teal-400" />
              <span>Layanan Aspirasi & Pengaduan Warga</span>
            </div>

            <h1 className="text-3xl min-[380px]:text-4xl sm:text-5xl md:text-6xl font-condensed font-black text-slate-900 dark:text-white uppercase tracking-tight">
              Pengaduan <span className="text-teal-600 dark:text-teal-400">Warga</span>
            </h1>

            <p className="text-xs sm:text-base text-slate-600 dark:text-slate-300 max-w-xl mx-auto leading-relaxed">
              Sampaikan aspirasi, keluhan, dan masukan Anda secara langsung untuk transparansi dan kemajuan Desa Sampeldes.
            </p>
          </div>
        </section>

        {/* CONTENT */}
        <section className="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8">
          <ComplaintSystem />
        </section>
      </main>

      <Footer />
    </div>
  );
}
