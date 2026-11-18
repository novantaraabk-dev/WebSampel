'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { MessageSquareWarning, ArrowRight, ShieldCheck, Clock, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function ComplaintSection() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.5 }}
        className="relative overflow-hidden rounded-[2.5rem] neu-card-elevated"
      >
        {/* Subtle decorative glow */}
        <div className="absolute top-0 right-0 h-64 w-64 translate-x-16 -translate-y-16 rounded-full bg-emerald-100/50 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 h-48 w-48 -translate-x-12 translate-y-12 rounded-full bg-amber-100/40 blur-3xl pointer-events-none" />

        <div className="relative grid items-center gap-8 p-8 lg:grid-cols-[1fr_auto] lg:gap-12 lg:p-12">
          {/* Content */}
          <div className="space-y-6">
            <div className="neu-pill inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-[0.25em] text-emerald-800">
              <MessageSquareWarning className="h-4 w-4 text-emerald-600" />
              <span>Pengaduan &amp; Aspirasi Warga</span>
            </div>

            <div className="space-y-3">
              <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl font-sans">
                Sampaikan Aspirasi Anda
              </h2>
              <p className="max-w-2xl text-base leading-7 text-slate-600 font-sans">
                Punya keluhan, saran, atau masukan untuk kemajuan Desa Sampeldes?
                Sampaikan langsung secara online dan kami akan menindaklanjuti setiap laporan yang masuk secara transparan.
              </p>
            </div>

            {/* Feature badges */}
            <div className="flex flex-wrap gap-3">
              <div className="neu-pill flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold text-slate-800">
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
                <span>Aman &amp; Terjamin</span>
              </div>
              <div className="neu-pill flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold text-slate-800">
                <Clock className="h-4 w-4 text-teal-600" />
                <span>Ditindaklanjuti Cepat</span>
              </div>
              <div className="neu-pill flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold text-slate-800">
                <Sparkles className="h-4 w-4 text-amber-500" />
                <span>Analisis AI Otomatis</span>
              </div>
            </div>
          </div>

          {/* CTA */}
          <motion.div
            whileHover={{ scale: 1.04 }}
            className="flex flex-col items-start gap-4 lg:items-center"
          >
            <div className="neu-convex flex h-20 w-20 items-center justify-center rounded-2xl text-emerald-700 transition-transform group-hover:rotate-6">
              <MessageSquareWarning className="h-9 w-9" />
            </div>
            <Link href="/pengaduan/" aria-label="Buat pengaduan warga">
              <Button className="neu-btn-primary h-12 rounded-full px-8 font-bold text-xs uppercase tracking-wider transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer">
                <span>Buat Pengaduan</span>
                <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </motion.div>
    </section>
  );
}
