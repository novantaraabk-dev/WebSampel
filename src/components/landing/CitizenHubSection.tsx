'use client';

import React from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import {
  Quote,
  Star,
  MapPin,
  Clock,
  ShieldCheck,
  Wheat,
  Building,
} from 'lucide-react';
import { doc, collection, query, orderBy } from 'firebase/firestore';
import { useFirestore, useDoc, useCollection, useMemoFirebase } from '@/firebase';
import { Official, VillageProfileInfo } from '@/lib/types';

export function CitizenHubSection() {
  const firestore = useFirestore();

  // Ambil data profil & Foto Kades dari /admin/settings (villageProfile/default -> kadesPhotoUrl)
  const profileRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, 'villageProfile', 'default');
  }, [firestore]);

  const { data: profileData } = useDoc<VillageProfileInfo & { kadesName?: string; kadesTitle?: string; kadesSlogan?: string }>(profileRef);

  // Ambil data perangkat untuk cadangan jika belum diatur
  const officialsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'officials'), orderBy('name', 'asc'));
  }, [firestore]);

  const { data: officials } = useCollection<Official>(officialsQuery);

  const kadesOfficial = officials?.find((o) => {
    const pos = (o.position || '').toLowerCase();
    return pos.includes('kepala desa') || pos.includes('kades');
  });

  const kadesPhoto =
    profileData?.kadesPhotoUrl ||
    kadesOfficial?.imageUrl ||
    'https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=800&auto=format&fit=crop';

  const kadesName = profileData?.kadesName || kadesOfficial?.name || 'TUKIMAN';
  const kadesTitle =
    profileData?.kadesTitle ||
    (kadesOfficial?.position ? `${kadesOfficial.position} • Kec. Gandrungmangu` : 'Kepala Desa Sampeldes • Kec. Gandrungmangu');

  const kadesQuote =
    profileData?.kadesSlogan ||
    'Desa Sampeldes adalah rumah besar bagi kita semua. Kami berkomitmen menghadirkan tata kelola pemerintahan yang bersih, pemanfaatan dana desa yang tepat sasaran, serta kemudahan akses layanan digital agar setiap warga merasakan kemajuan nyata dan keadilan sosial.';

  const quickStats = [
    {
      icon: Building,
      value: '4 RW & 41 RT',
      label: 'Wilayah Dusun Terintegrasi',
    },
    {
      icon: Wheat,
      value: '850+ Hektar',
      label: 'Lahan Pertanian',
    },
    {
      icon: Clock,
      value: '24/7 Digital',
      label: 'Layanan Pengajuan Mandiri',
    },
    {
      icon: ShieldCheck,
      value: '100% Bebas Pungli',
      label: 'Integritas Pelayanan Publik',
    },
  ];

  return (
    <section className="relative w-full py-16 lg:py-24 overflow-hidden select-none">
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* 1. CURVED DARK TESTIMONIAL/LEADERSHIP CONTAINER (SESUAI GAMBAR REFERENSI SECTION 7) */}
        <div className="relative rounded-[36px] bg-[#081d27] text-white p-8 sm:p-12 lg:p-16 shadow-2xl overflow-hidden border border-white/10 mb-16 sm:mb-20">
          {/* Subtle Background Overlay Photo */}
          <div className="absolute inset-0 z-0">
            <Image
              src="https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=1400&auto=format&fit=crop"
              alt="Desa Sampeldes"
              fill
              className="object-cover object-center opacity-10 brightness-50 mix-blend-overlay pointer-events-none"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#081d27]/98 via-[#081d27]/90 to-[#04121a] pointer-events-none" />
          </div>

          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            {/* Foto Kepala Desa (Kiri) */}
            <div className="lg:col-span-5 flex justify-center lg:justify-start">
              <div className="relative w-64 sm:w-72 h-80 sm:h-96 rounded-2xl overflow-hidden shadow-2xl border-4 border-white/20">
                <Image
                  src={kadesPhoto}
                  alt={kadesName}
                  fill
                  sizes="(max-width: 768px) 100vw, 400px"
                  className="object-cover object-top"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                <div className="absolute bottom-4 left-4 right-4">
                  <span className="text-[10px] font-bold tracking-widest text-teal-400 uppercase bg-black/50 backdrop-blur-md px-2.5 py-1 rounded">
                    KEPALA DESA
                  </span>
                </div>
              </div>
            </div>

            {/* Quote & Visi (Kanan) */}
            <div className="lg:col-span-7 flex flex-col justify-center">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/20 border border-teal-400/40 text-teal-300 text-[10px] font-bold tracking-[0.2em] uppercase mb-4 w-fit">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-400" />
                <span>KOMITMEN & VISI KEPALA DESA</span>
              </div>

              <h3 className="text-2xl sm:text-3xl font-extrabold text-white leading-tight mb-5">
                Membangun Desa Mandiri yang{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-emerald-300">
                  Transparan, Berdaya & Sejahtera
                </span>
              </h3>

              {/* Quote Body */}
              <div className="relative mb-6">
                <Quote className="h-8 w-8 text-teal-500/30 mb-2" />
                <p className="text-sm sm:text-base text-slate-200 leading-relaxed italic">
                  &ldquo;{kadesQuote}&rdquo;
                </p>
              </div>

              {/* Author Info & 5 Stars */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-5 border-t border-white/10">
                <div>
                  <h4 className="text-base font-bold text-white">
                    {kadesName}
                  </h4>
                  <p className="text-xs text-teal-300 font-medium">
                    {kadesTitle}
                  </p>
                </div>

                <div className="flex items-center gap-1 text-amber-400">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-amber-400" />
                  ))}
                  <span className="text-xs text-white/70 ml-2 font-mono">
                    Integritas Teruji
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 2. STATS RIBBON STRIP (SESUAI GAMBAR REFERENSI SECTION 8) */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6 py-4 sm:py-6 px-3.5 sm:px-8 rounded-2xl bg-white dark:bg-[#0a1b24] border border-slate-200/80 dark:border-white/10 shadow-[0_10px_30px_rgba(0,0,0,0.03)]">
          {quickStats.map((stat, idx) => {
            const IconComp = stat.icon;
            return (
              <div key={idx} className="flex items-center gap-2.5 sm:gap-4 py-1.5 sm:py-2 min-w-0">
                <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl sm:rounded-2xl bg-teal-50 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0 border border-teal-200/50 dark:border-teal-700/30 shadow-xs">
                  <IconComp className="h-5 w-5 sm:h-6 sm:w-6" />
                </div>
                <div className="min-w-0">
                  <div className="text-sm sm:text-base md:text-lg font-extrabold text-slate-900 dark:text-white leading-tight truncate">
                    {stat.value}
                  </div>
                  <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                    {stat.label}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default CitizenHubSection;
