'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { doc } from 'firebase/firestore';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { VillageLogoInfo } from '@/lib/types';
import {
  MapPin,
  Phone,
  Mail,
  Clock,
  ArrowUp,
  Shield,
  Heart,
} from 'lucide-react';

export function Footer() {
  const firestore = useFirestore();
  const logoRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, 'villageLogo', 'default');
  }, [firestore]);

  const { data: logoData, isLoading: isLogoLoading } = useDoc<VillageLogoInfo>(logoRef, {
    suppressGlobalError: true,
  });

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="relative w-full bg-[#081d27] text-white pt-16 pb-10 overflow-hidden select-none border-t border-white/10">
      {/* Background Silhouette Landscape */}
      <div
        className="absolute inset-0 pointer-events-none select-none overflow-hidden z-0"
        aria-hidden="true"
      >
        <img
          src="/images/footer-silhouette.jpg"
          alt="Siluet Desa Sampeldes"
          className="w-full h-full object-cover object-bottom opacity-35 mix-blend-luminosity scale-105"
        />
        {/* Dark gradient overlay for text contrast & seamless blend with #081d27 theme */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#081d27] via-[#081d27]/75 to-[#081d27]/90" />
        <div className="absolute inset-0 bg-[#081d27]/40" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* 4-COLUMN FOOTER GRID (SESUAI GAMBAR REFERENSI SECTION 13) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 lg:gap-12 pb-14 border-b border-white/10">
          {/* Kolom 1: Identitas & Logo Desa (4 Kolom) */}
          <div className="lg:col-span-4">
            <div className="flex items-center gap-3.5 mb-5">
              {isLogoLoading ? (
                <div className="h-11 w-11 rounded-2xl bg-white/10 animate-pulse shrink-0" />
              ) : logoData?.logoImageUrl ? (
                <div className="relative flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 border border-white/20 p-1.5 shrink-0 overflow-hidden shadow-sm">
                  <Image
                    src={logoData.logoImageUrl}
                    alt="Logo Desa Sampeldes"
                    width={44}
                    height={44}
                    className="h-full w-full object-contain"
                  />
                </div>
              ) : (
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-teal-500/20 border border-teal-400/40 text-teal-400 shrink-0">
                  <span className="font-extrabold text-xl">K</span>
                </div>
              )}
              <div>
                <h3 className="text-base font-extrabold tracking-[0.16em] text-white uppercase">
                  DESA SAMPELDES
                </h3>
                <p className="text-[10px] tracking-[0.22em] text-teal-400 uppercase font-semibold">
                  GANDRUNGMANGU • CILACAP
                </p>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mb-6">
              Portal resmi pelayanan publik dan transparansi tata kelola Desa Sampeldes. Mewujudkan pelayanan prima, agrowisata unggulan Saanen, dan kesejahteraan masyarakat mandiri.
            </p>

            <div className="flex items-center gap-2 text-xs text-teal-300 bg-white/5 border border-white/10 rounded-xl px-3.5 py-2 w-fit">
              <Clock className="h-4 w-4" />
              <span>Senin – Jumat: 08.00 – 15.30 WIB</span>
            </div>
          </div>

          {/* Kolom 2: Navigasi Cepat (2 Kolom) */}
          <div className="lg:col-span-2">
            <h4 className="text-xs font-bold tracking-widest text-teal-400 uppercase mb-5">
              NAVIGASI CEPAT
            </h4>
            <ul className="space-y-3 text-xs sm:text-sm text-slate-300">
              <li>
                <Link href="/" className="hover:text-teal-400 transition-colors">
                  Beranda
                </Link>
              </li>
              <li>
                <Link href="/profil-desa/" className="hover:text-teal-400 transition-colors">
                  Profil Desa
                </Link>
              </li>
              <li>
                <Link href="/pelayanan-desa/" className="hover:text-teal-400 transition-colors">
                  Layanan Publik
                </Link>
              </li>
              <li>
                <Link href="/potensi-desa/" className="hover:text-teal-400 transition-colors">
                  Potensi Desa
                </Link>
              </li>
              <li>
                <Link href="/BeritaDesa/" className="hover:text-teal-400 transition-colors">
                  Kabar & Warta
                </Link>
              </li>
            </ul>
          </div>

          {/* Kolom 3: Layanan Warga (3 Kolom) */}
          <div className="lg:col-span-3">
            <h4 className="text-xs font-bold tracking-widest text-teal-400 uppercase mb-5">
              LAYANAN MANDIRI
            </h4>
            <ul className="space-y-3 text-xs sm:text-sm text-slate-300">
              <li>
                <Link href="/layanan-surat/" className="hover:text-teal-400 transition-colors">
                  Pengajuan Surat Mandiri
                </Link>
              </li>
              <li>
                <Link href="/#pbb-section" className="hover:text-teal-400 transition-colors">
                  Cek Pajak PBB-P2 Online
                </Link>
              </li>
              <li>
                <Link href="/statistik/" className="hover:text-teal-400 transition-colors">
                  Data Kependudukan & Bansos
                </Link>
              </li>
              <li>
                <Link href="/tata-kelola-desa/" className="hover:text-teal-400 transition-colors">
                  Transparansi APBDes
                </Link>
              </li>
              <li>
                <Link href="/pengaduan/" className="hover:text-teal-400 transition-colors">
                  Saluran Pengaduan Warga
                </Link>
              </li>
            </ul>
          </div>

          {/* Kolom 4: Kontak & Kantor Balai Desa (3 Kolom) */}
          <div className="lg:col-span-3">
            <h4 className="text-xs font-bold tracking-widest text-teal-400 uppercase mb-5">
              KANTOR BALAI DESA
            </h4>
            <ul className="space-y-3.5 text-xs sm:text-sm text-slate-300">
              <li className="flex items-start gap-3">
                <MapPin className="h-4 w-4 text-teal-400 shrink-0 mt-0.5" />
                <span>
                  Jl. Raya Sampeldes, Kec. Gandrungmangu, Kab. Cilacap, Jawa Tengah 53254
                </span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-teal-400 shrink-0" />
                <span>0877-0524-5801</span>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-teal-400 shrink-0" />
                <span>desa.sampeldes@cilacapkab.go.id</span>
              </li>
            </ul>
          </div>
        </div>

        {/* BOTTOM BAR WITH BACK TO TOP BUTTON */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <p>© 2026 Pemerintah Desa Sampeldes. Hak Cipta Dilindungi Undang-Undang.</p>

          <div className="flex items-center gap-5">
            <Link href="/login" className="hover:text-white transition-colors">
              Portal Pamong
            </Link>
            <span>•</span>
            <button
              onClick={scrollToTop}
              className="group inline-flex items-center gap-2 text-teal-400 hover:text-white transition-colors cursor-pointer"
            >
              <span>Kembali Ke Atas</span>
              <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-teal-500 group-hover:text-white transition-colors">
                <ArrowUp className="h-3 w-3" />
              </div>
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
