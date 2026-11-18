'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ShieldCheck,
  HeartHandshake,
  Sprout,
  Laptop,
  ArrowRight,
  CheckCircle2,
  Quote,
  MapPin,
  Users,
  ChevronRight,
  Award,
} from 'lucide-react';
import { useFirestore, useDoc, useMemoFirebase, useCollection } from '@/firebase';
import { doc, collection, query, orderBy } from 'firebase/firestore';
import { Official } from '@/lib/types';

export function SambutanSection() {
  const firestore = useFirestore();

  // Ambil data profil desa resmi (sama persis dengan /profil-desa - Tab Sambutan)
  const profileRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, 'villageProfile', 'default');
  }, [firestore]);

  const { data: profileData } = useDoc<any>(profileRef);

  // Ambil data perangkat untuk backup foto Kades jika profileData belum diisi
  const officialsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'officials'), orderBy('name', 'asc'));
  }, [firestore]);

  const { data: officials } = useCollection<Official>(officialsQuery);

  const kadesOfficial = officials?.find((o) => {
    const pos = (o.position || '').toLowerCase();
    return pos.includes('kepala desa') || pos.includes('kades');
  });

  // Variabel profil & sambutan dari /profil-desa
  const kadesName = profileData?.kadesName || kadesOfficial?.name || 'TUKIMAN';
  const kadesTitle = profileData?.kadesTitle || kadesOfficial?.position || 'Kepala Desa Sampeldes';
  const kadesSlogan =
    profileData?.kadesSlogan || 'Tumbuh dalam Kebersamaan, Berkarya untuk Kemajuan Desa.';
  const kadesPhoto =
    profileData?.kadesPhotoUrl ||
    kadesOfficial?.imageUrl ||
    'https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=800&auto=format&fit=crop';

  const description =
    profileData?.description ||
    'Desa Sampeldes merupakan salah satu desa di wilayah Kecamatan Gandrungmangu, Kabupaten Cilacap, Provinsi Jawa Tengah. Desa ini memiliki wilayah yang cukup luas dengan masyarakat yang berperan aktif dalam penyelenggaraan pemerintahan, pembangunan, kegiatan sosial kemasyarakatan, dan pengembangan perekonomian lokal.';

  // 3 Karakteristik & Pilar Utama Desa (diambil dari 6 pilar di /profil-desa)
  const coreValues = [
    {
      icon: HeartHandshake,
      title: 'Harmoni & Gotong Royong',
      description:
        'Masyarakat memelihara semangat kebersamaan, musyawarah mufakat, kekeluargaan, serta gotong royong dalam setiap denyut pembangunan desa.',
      color: 'text-emerald-600 dark:text-emerald-400',
      bgColor: 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200/70 dark:border-emerald-700/30',
    },
    {
      icon: Sprout,
      title: 'Pertanian & Ketahanan Pangan',
      description:
        'Ketersediaan lahan sawah produktif dan kekayaan agraris menjadi penopang utama ketahanan pangan serta kemandirian keluarga warga desa.',
      color: 'text-teal-600 dark:text-teal-400',
      bgColor: 'bg-teal-50 dark:bg-teal-950/40 border-teal-200/70 dark:border-teal-700/30',
    },
    {
      icon: Laptop,
      title: 'Transformasi Digital & Pelayanan Cepat',
      description:
        'Penyelenggaraan tata kelola desa berbasis teknologi informasi untuk pelayanan publik yang transparan, mudah, akuntabel, dan cepat.',
      color: 'text-cyan-600 dark:text-cyan-400',
      bgColor: 'bg-cyan-50 dark:bg-cyan-950/40 border-cyan-200/70 dark:border-cyan-700/30',
    },
  ];

  return (
    <section id="jelajahi-desa" className="relative w-full py-12 sm:py-20 lg:py-28 overflow-hidden select-none">
      {/* Background Micro Glow */}
      <div className="absolute top-1/2 left-0 w-96 h-96 bg-teal-500/5 dark:bg-teal-500/10 rounded-full blur-3xl pointer-events-none -translate-y-1/2" />
      <div className="absolute bottom-1/4 right-0 w-96 h-96 bg-emerald-500/5 dark:bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-12 lg:gap-16 items-center">
          {/* SISI KIRI: PROFIL RESMI, SAMBUTAN & PILAR KARAKTERISTIK */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-7 flex flex-col items-start"
          >
            {/* Sub-badge Section Tag */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-teal-50 dark:bg-teal-950/40 border border-teal-200/60 dark:border-teal-700/30 text-teal-700 dark:text-teal-300 text-[9px] sm:text-[11px] font-bold tracking-[0.2em] uppercase mb-3 sm:mb-4">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse" />
              <span>PROFIL &amp; SAMBUTAN RESMI DESA</span>
            </div>

            {/* Dual-Tone Main Heading */}
            <h2 className="text-[22px] sm:text-4xl lg:text-[42px] font-extrabold text-slate-900 dark:text-white leading-[1.18] tracking-tight mb-3 sm:mb-4 font-condensed uppercase">
              Gambaran Umum &amp; Sambutan{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-600 to-emerald-500 dark:from-teal-400 dark:to-emerald-400">
                Desa Sampeldes
              </span>
            </h2>

            {/* Kades Slogan / Kutipan Inspiratif */}
            <div className="w-full relative p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-teal-50/80 to-emerald-50/60 dark:from-teal-950/30 dark:to-emerald-950/20 border border-teal-200/80 dark:border-teal-800/40 mb-6 shadow-xs">
              <Quote className="h-6 w-6 text-teal-600/30 dark:text-teal-400/30 absolute top-3 right-3" />
              <p className="text-xs sm:text-sm md:text-base leading-relaxed text-teal-950 dark:text-teal-100 font-bold italic pr-6">
                &ldquo;{kadesSlogan}&rdquo;
              </p>
              <div className="flex items-center gap-2 mt-2 pt-2 border-t border-teal-200/50 dark:border-teal-800/30">
                <span className="text-[11px] font-extrabold uppercase text-slate-800 dark:text-slate-200">
                  {kadesName}
                </span>
                <span className="text-slate-400 text-xs">•</span>
                <span className="text-[10px] font-bold uppercase text-teal-700 dark:text-teal-400">
                  {kadesTitle}
                </span>
              </div>
            </div>

            {/* Paragraph Description dari /profil-desa */}
            <p className="text-slate-600 dark:text-slate-300 text-xs sm:text-sm leading-relaxed mb-6 whitespace-pre-line line-clamp-3">
              {description}
            </p>

            {/* Pill Tags Statistik Wilayah Resmi */}
            <div className="flex flex-wrap gap-2 mb-8">
              {[
                { label: 'Luas 11,07 km²', icon: MapPin },
                { label: '8.775 Jiwa (BPS 2024)', icon: Users },
                { label: '4 RW & 41 RT', icon: Award },
                { label: 'Gandrungmangu, Cilacap', icon: CheckCircle2 },
              ].map((tag, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-full bg-stone-100 dark:bg-white/5 border border-stone-200/80 dark:border-white/10 text-[9px] sm:text-[10.5px] font-bold uppercase tracking-wide sm:tracking-wider text-slate-700 dark:text-slate-300"
                >
                  <tag.icon className="h-3 w-3 text-teal-600 dark:text-teal-400" />
                  <span>{tag.label}</span>
                </span>
              ))}
            </div>

            {/* 3 Pilar Karakteristik & Arah Pembangunan Desa */}
            <div className="space-y-4 w-full mb-8">
              {coreValues.map((feat, idx) => {
                const IconComponent = feat.icon;
                return (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 15 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: idx * 0.1 }}
                    className="flex items-start gap-3.5 group"
                  >
                    <div
                      className={`h-10 w-10 sm:h-11 sm:w-11 rounded-2xl ${feat.bgColor} border ${feat.color} flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform duration-300`}
                    >
                      <IconComponent className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white mb-0.5">
                        {feat.title}
                      </h4>
                      <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                        {feat.description}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* CTA Button Link Langsung ke /profil-desa Tab Sambutan */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <Link
                href="/profil-desa?tab=sambutan"
                className="group inline-flex items-center gap-2 sm:gap-3 px-4 sm:px-7 py-2.5 sm:py-3 rounded-full bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-bold text-[10px] sm:text-xs tracking-wider uppercase shadow-lg shadow-teal-700/20 hover:shadow-teal-600/30 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
              >
                <span><span className="hidden sm:inline">Buka </span>Profil &amp; Sambutan<span className="hidden sm:inline"> Lengkap</span></span>
                <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center group-hover:translate-x-1 transition-transform">
                  <ArrowRight className="h-3 w-3 text-white" />
                </div>
              </Link>

              <Link
                href="/profil-desa?tab=sejarah"
                className="inline-flex items-center gap-1.5 px-3.5 sm:px-4 py-2.5 sm:py-3 rounded-full bg-stone-100 hover:bg-stone-200 dark:bg-white/10 dark:hover:bg-white/15 text-slate-700 dark:text-slate-200 font-bold text-[10px] sm:text-xs tracking-wider uppercase transition-colors"
              >
                <span>Sejarah Desa</span>
                <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
              </Link>
            </div>
          </motion.div>

          {/* SISI KANAN: FOTO RESMI KEPALA DESA */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-5 relative"
          >
            <div className="relative mx-auto max-w-[240px] min-[400px]:max-w-[270px] sm:max-w-md">
              {/* Foto Resmi Kepala Desa (Portrait 3:4) */}
              <div className="relative aspect-[3/4] w-full rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl border-[3px] sm:border-4 border-white dark:border-[#0a1822] bg-stone-200 dark:bg-stone-800">
                <img
                  src={kadesPhoto}
                  alt={kadesName}
                  className="w-full h-full object-cover object-top hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/20 to-transparent" />

                {/* Badge Atas Kepala Desa */}
                <div className="absolute top-3 left-3 sm:top-4 sm:left-4">
                  <span className="inline-flex items-center gap-1.5 text-[8px] sm:text-[9.5px] font-black tracking-widest uppercase bg-amber-500/95 text-slate-950 px-2 sm:px-2.5 py-1 rounded-md shadow-md">
                    KEPALA DESA SAMPELDES
                  </span>
                </div>

                {/* Plakat Bawah Identitas Kepala Desa */}
                <div className="absolute bottom-3 left-3 right-3 sm:bottom-4 sm:left-4 sm:right-4 text-white">
                  <h3 className="text-base sm:text-xl font-condensed font-black uppercase tracking-tight text-white drop-shadow">
                    {kadesName}
                  </h3>
                  <p className="text-[11px] font-bold text-teal-300 uppercase tracking-wider drop-shadow mt-0.5">
                    {kadesTitle}
                  </p>
                  <p className="text-[10px] text-slate-300 italic line-clamp-1 mt-1">
                    &ldquo;{kadesSlogan}&rdquo;
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

export default SambutanSection;
