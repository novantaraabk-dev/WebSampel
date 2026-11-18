'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { ArrowRight, ExternalLink } from 'lucide-react';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { ServiceCardsSettingsInfo } from '@/lib/types';
import { DEFAULT_SERVICE_CARDS } from '@/lib/default-service-cards';

export function ServicesSection() {
  const firestore = useFirestore();

  const serviceCardsRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, 'villageProfile', 'serviceCards');
  }, [firestore]);

  const { data: remoteData } = useDoc<ServiceCardsSettingsInfo>(serviceCardsRef, {
    suppressGlobalError: true,
  });

  const cards = React.useMemo(() => {
    if (remoteData?.cards && Array.isArray(remoteData.cards) && remoteData.cards.length > 0) {
      return DEFAULT_SERVICE_CARDS.map((def) => {
        const found = remoteData.cards?.find((c) => c.id === def.id);
        if (!found) return def;
        return {
          ...def,
          ...found,
          imageUrl: found.imageUrl || def.imageUrl,
        };
      });
    }
    return DEFAULT_SERVICE_CARDS;
  }, [remoteData]);

  return (
    <section
      id="layanan-desa"
      className="relative w-full py-12 sm:py-20 lg:py-24 bg-transparent overflow-hidden select-none"
    >
      {/* Background Subtle Accent Glows */}
      <div className="absolute top-10 left-1/4 w-96 h-96 bg-teal-500/5 dark:bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-1/4 w-96 h-96 bg-emerald-500/5 dark:bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative mx-auto max-w-7xl px-3 sm:px-6 lg:px-8">
        {/* HEADER SECTION (SESUAI KONSEP GAMBAR 2) */}
        <div className="text-center max-w-3xl mx-auto mb-7 sm:mb-16 px-1">
          <p className="text-[9px] sm:text-xs font-bold uppercase tracking-[0.24em] sm:tracking-[0.28em] text-teal-700 dark:text-teal-400 mb-1.5 sm:mb-2.5">
            ANJUNGAN DIGITAL WARGA
          </p>

          <h2 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold uppercase tracking-tight text-slate-900 dark:text-white font-condensed">
            LAYANAN MANDIRI
          </h2>

          <p className="mt-1.5 sm:mt-2 text-[9.5px] sm:text-sm font-semibold tracking-[0.12em] sm:tracking-[0.16em] uppercase text-teal-800/80 dark:text-teal-300">
            ADMINISTRASI DESA CEPAT &amp; BEBAS PUNGUTAN
          </p>

          <p className="mt-2.5 sm:mt-3.5 text-[11px] sm:text-sm text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Inovasi pelayanan desa terintegrasi untuk mempermudah seluruh kebutuhan administrasi, transparansi data, dan layanan warga tanpa birokrasi berbelit.
          </p>
        </div>

        {/* 8 FEATURE CARDS GRID (MOBILE 3 KOLOM KOMPAK, DESKTOP 4 KOLOM) */}
        <div className="grid grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-5 lg:gap-6 mb-8 sm:mb-14">
          {cards.map((card, idx) => (
            <motion.div
              key={card.id || idx}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.45, delay: (idx % 4) * 0.08 }}
              whileHover={{ y: -6, transition: { duration: 0.25 } }}
              className="group relative bg-[#fcfbf9]/90 dark:bg-[#081822]/90 backdrop-blur-md rounded-xl sm:rounded-[1.6rem] border border-teal-900/15 dark:border-teal-500/25 p-1.5 sm:p-4 shadow-sm hover:shadow-2xl hover:shadow-teal-900/15 dark:hover:shadow-teal-500/10 hover:border-teal-500/60 dark:hover:border-teal-400/50 transition-all duration-300 flex flex-col justify-between overflow-hidden"
            >
              {/* 1. BEGROUND SILUET ALAM & HUTAN PINUS TEMATIK PADA SETIAP KARTU */}
              <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-xl sm:rounded-[1.6rem] z-0">
                <img
                  src="https://images.unsplash.com/photo-1511497584788-876760111969?q=80&w=800&auto=format&fit=crop"
                  alt=""
                  className="w-full h-full object-cover object-bottom opacity-25 dark:opacity-35 mix-blend-multiply dark:mix-blend-luminosity contrast-150 brightness-95 pointer-events-none group-hover:scale-108 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#fcfbf9]/90 via-[#fcfbf9]/40 to-white/70 dark:from-[#081822]/95 dark:via-[#081822]/50 dark:to-[#081822]/70 pointer-events-none" />
                <div className="absolute inset-0 bg-gradient-to-br from-teal-500/5 via-transparent to-emerald-500/5 dark:from-teal-400/10 dark:to-transparent pointer-events-none" />
              </div>

              <Link href={card.href} className="relative z-10 block flex-1 flex flex-col justify-between">
                <div>
                  {/* Thumbnail Image Container with Themed Floating Badge */}
                  <div className="relative aspect-square sm:aspect-[16/10] w-full overflow-hidden rounded-lg sm:rounded-[1.2rem] bg-stone-200 dark:bg-stone-800 border border-teal-900/10 dark:border-teal-500/20 shadow-inner">
                    <Image
                      src={card.imageUrl || '/images/layanan/card_surat_mandiri.jpg'}
                      alt={card.title}
                      fill
                      sizes="(max-width: 640px) 33vw, (max-width: 1024px) 33vw, 25vw"
                      className="object-cover group-hover:scale-106 transition-transform duration-500 ease-out"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/20" />

                    {/* Top-Left Floating Pill Badge (e.g. PELAYANAN 24/7, SOP RESMI, etc.) */}
                    {card.badge && (
                      <div className="hidden sm:block absolute top-2.5 left-2.5 px-2.5 py-1 rounded-md bg-[#071720]/85 backdrop-blur-md text-[9.5px] font-black uppercase tracking-wider text-teal-300 border border-teal-400/30 shadow-xs">
                        {card.badge}
                      </div>
                    )}
                  </div>

                  {/* Text Content (Centered, elegant typographic hierarchy) */}
                  <div className="pt-1.5 sm:pt-4 pb-0.5 sm:pb-2 px-0.5 sm:px-1 text-center flex flex-col items-center">
                    <div className="hidden sm:block w-5 h-0.5 bg-gradient-to-r from-teal-500 to-emerald-400 rounded-full group-hover:w-10 transition-all duration-300 mb-2" />

                    {/* Category Label */}
                    <p className="hidden sm:block text-[10px] font-bold uppercase tracking-[0.2em] text-teal-700 dark:text-teal-400 mb-1">
                      {card.category || 'LAYANAN WARGA'}
                    </p>

                    {/* Card Title */}
                    <h3 className="text-[10px] min-[400px]:text-[11px] sm:text-base font-extrabold uppercase tracking-tight leading-tight text-slate-900 dark:text-white group-hover:text-teal-600 dark:group-hover:text-teal-300 transition-colors sm:mb-1.5 font-condensed line-clamp-2 min-h-[2.5em] sm:min-h-0 flex items-center justify-center">
                      {card.title}
                    </h3>

                    {/* Subtitle / Description */}
                    <p className="hidden sm:block text-xs text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
                      {card.subtitle}
                    </p>
                  </div>
                </div>

                {/* Circular Action Button (Centered at bottom) */}
                <div className="hidden sm:block mt-3 pt-1 text-center">
                  <div
                    aria-label={`Buka ${card.title}`}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-r from-teal-600 to-emerald-600 group-hover:from-teal-500 group-hover:to-emerald-500 text-white shadow-md shadow-teal-700/25 group-hover:scale-110 transition-all duration-300 cursor-pointer"
                  >
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* VIEW ALL SERVICES PILL BUTTON */}
        <div className="text-center">
          <Link
            href="/pelayanan-desa/"
            className="inline-flex items-center gap-2 sm:gap-2.5 px-5 sm:px-7 py-2.5 sm:py-3 rounded-full bg-slate-900 hover:bg-teal-900 dark:bg-white/10 dark:hover:bg-teal-600 text-white font-bold text-[10px] sm:text-xs tracking-wider sm:tracking-widest uppercase shadow-md transition-all duration-300 hover:scale-105"
          >
            <span>Buka Semua Layanan &amp; SOP Desa</span>
            <ExternalLink className="h-3.5 w-3.5 text-teal-400 group-hover:text-white" />
          </Link>
        </div>
      </div>
    </section>
  );
}

export default ServicesSection;
