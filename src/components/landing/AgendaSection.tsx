'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, Calendar, ExternalLink } from 'lucide-react';
import { AgendaDesaPublicView } from '@/components/agenda/AgendaDesaPublicView';

export function AgendaSection() {
  return (
    <section
      id="agenda-desa-section"
      className="relative mx-auto max-w-7xl px-3 sm:px-6 lg:px-8 pt-16 sm:pt-18 lg:pt-20 pb-14 sm:pb-5 lg:pb-6 h-[100dvh] max-h-[100dvh] flex flex-col justify-center snap-section overflow-hidden select-none"
    >
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="relative rounded-[24px] sm:rounded-[2.2rem] neu-card-elevated text-slate-900 dark:text-white p-3.5 sm:p-5 lg:p-6 max-h-[85vh] overflow-y-auto scrollbar-none flex flex-col justify-between border border-white/80 dark:border-white/10 shadow-lg"
      >
        <div className="w-full">
          <AgendaDesaPublicView isLanding={true} />
        </div>

        {/* Footer Baris Tautan ke /pelayanan-desa?tab=agenda-desa */}
        <div className="mt-3 pt-2.5 border-t border-stone-300/40 dark:border-white/10 flex flex-col sm:flex-row items-center justify-between gap-2 text-center sm:text-left shrink-0">
          <p className="text-[10px] sm:text-[11px] text-stone-500 dark:text-stone-400 font-medium">
            * Terintegrasi langsung dengan kalender resmi dan buku agenda surat kedinasan Desa Sampeldes.
          </p>
          <Link
            href="/pelayanan-desa?tab=agenda-desa"
            className="inline-flex items-center gap-1.5 text-[11px] sm:text-xs font-condensed font-black uppercase tracking-wider text-emerald-800 dark:text-teal-400 hover:underline"
          >
            <span>Buka Kalender Agenda di Pelayanan Desa</span>
            <ArrowRight className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
          </Link>
        </div>
      </motion.div>
    </section>
  );
}
