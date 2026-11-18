'use client';

import Link from 'next/link';
import { Header } from '@/components/landing/Header';
import { Footer } from '@/components/landing/Footer';
import { BackgroundPattern } from '@/components/landing/BackgroundPattern';
import { Badge } from '@/components/ui/badge';
import { FileText } from 'lucide-react';
import { LetterService } from '@/app/(main)/layanan-surat/_components/letter-service';
import { TrackTicket } from '@/app/(main)/layanan-surat/_components/track-ticket';

export default function LayananSuratPage() {
  return (
    <div className="relative flex flex-col min-h-screen bg-[#F8FAFC] dark:bg-[#060b11] text-slate-900 dark:text-slate-100 overflow-x-hidden pt-24 sm:pt-28 font-sans transition-colors duration-300">
      <BackgroundPattern />
      <Header />

      <main className="relative flex-1 container mx-auto px-3 sm:px-4 py-6 sm:py-10 md:py-12 max-w-7xl">
        {/* PAGE HEADER */}
        <div className="mb-8 sm:mb-12 space-y-3">
          <div className="inline-flex items-center gap-2 neu-pill px-4 py-1.5 text-[10px] sm:text-xs font-bold uppercase tracking-widest text-teal-700 dark:text-teal-400">
            <span className="w-2 h-2 rounded-full bg-teal-600 dark:bg-teal-400" />
            <span>Administrasi Digital Desa</span>
          </div>
          <div className="flex items-center gap-4 sm:gap-5">
            <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl neu-card-elevated flex items-center justify-center text-teal-600 dark:text-teal-400 shrink-0 border border-slate-200/80 dark:border-white/10">
              <FileText className="h-6 w-6 sm:h-8 sm:w-8" />
            </div>
            <div>
              <h1 className="text-2xl min-[380px]:text-3xl md:text-5xl font-condensed font-black uppercase tracking-tight text-slate-900 dark:text-white">
                Layanan <span className="text-teal-600 dark:text-teal-400">Surat Mandiri</span>
              </h1>
              <p className="text-xs sm:text-base text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                Ajukan berbagai jenis surat keterangan resmi desa secara mandiri dan lacak statusnya secara online.
              </p>
            </div>
          </div>
        </div>

        {/* CONTENT */}
        <div className="space-y-8 sm:space-y-10">
          <TrackTicket />
          <LetterService />
        </div>
      </main>

      {/* OFFICIAL PORTAL FOOTER */}
      <Footer />
    </div>
  );
}
