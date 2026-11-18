'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { useMemoFirebase, useCollection, useFirestore } from '@/firebase';
import { collection, query, orderBy, limit } from 'firebase/firestore';
import { ArrowRight, Megaphone, Calendar } from 'lucide-react';
import { Announcement } from '@/lib/types';
import { formatDisplayDate } from './landing-utils';

export type AnnouncementDisplay = {
  id: string;
  title: string;
  content: string;
  authorName: string;
  publishDate: any;
  imageUrl?: string;
  tag?: string;
};

// Data Pengumuman Bawaan Bertema Maklumat Desa Sampeldes
const DEFAULT_ANNOUNCEMENTS: AnnouncementDisplay[] = [
  {
    id: 'musrenbang',
    title: 'Musyawarah Perencanaan Desa (Musrenbangdes RKPDes)',
    content: 'Pemerintah Desa Sampeldes mengundang seluruh unsur BPD, RT/RW, dan tokoh masyarakat untuk menetapkan prioritas pembangunan tahun anggaran berjalan bertempat di Pendopo Balai Desa.',
    authorName: 'Sekretariat Desa Sampeldes',
    publishDate: new Date(),
    imageUrl: 'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?q=80&w=1200&auto=format&fit=crop',
    tag: 'MAKLUMAT UTAMA',
  },
  {
    id: 'blt-dana-desa',
    title: 'Penyaluran Bantuan Langsung Tunai (BLT-DD) Tahap I',
    content: 'Pemberitahuan kepada keluarga penerima manfaat (KPM) mengenai jadwal pencairan bantuan tunai bertempat di Pendopo Balai Desa Sampeldes.',
    authorName: 'Kaur Keuangan Desa',
    publishDate: new Date(Date.now() - 86400000 * 2),
    imageUrl: 'https://images.unsplash.com/photo-1541872703-74c5e44368f9?q=80&w=800&auto=format&fit=crop',
    tag: 'BANTUAN SOSIAL',
  },
  {
    id: 'sppt-pbb',
    title: 'Sosialisasi Jatuh Tempo & Pelunasan Pajak PBB-P2',
    content: 'Pemberitahuan batas akhir pelunasan PBB-P2 desa. Layanan jemput bola pembayaran dibuka setiap akhir pekan di pos dusun.',
    authorName: 'Kasi Pemerintahan',
    publishDate: new Date(Date.now() - 86400000 * 4),
    imageUrl: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?q=80&w=800&auto=format&fit=crop',
    tag: 'PERPAJAKAN DESA',
  },
  {
    id: 'posyandu-balita',
    title: 'Layanan Terpadu Posyandu Balita & Skrining Lansia',
    content: 'Agenda rutin penimbangan, imunisasi lengkap, serta skrining kesehatan gratis bagi balita dan lansia se-Desa Sampeldes.',
    authorName: 'Kader Kesehatan Desa',
    publishDate: new Date(Date.now() - 86400000 * 6),
    imageUrl: 'https://images.unsplash.com/photo-1576765608535-5f04d1e3f289?q=80&w=800&auto=format&fit=crop',
    tag: 'KESEHATAN MASYARAKAT',
  },
];

export function AnnouncementSection() {
  const firestore = useFirestore();

  const announcementsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'announcements'), orderBy('publishDate', 'desc'), limit(6));
  }, [firestore]);

  const { data: remoteAnnouncements } = useCollection<Announcement>(announcementsQuery, {
    suppressGlobalError: true,
  });

  // Gabungkan data Firestore dengan data cadangan
  const items: AnnouncementDisplay[] = useMemo(() => {
    if (remoteAnnouncements && remoteAnnouncements.length > 0) {
      const list: AnnouncementDisplay[] = remoteAnnouncements.map((item, idx) => ({
        ...item,
        imageUrl: item.imageUrl || DEFAULT_ANNOUNCEMENTS[idx % DEFAULT_ANNOUNCEMENTS.length].imageUrl,
        tag: idx === 0 ? 'MAKLUMAT UTAMA' : 'AGENDA RESMI',
      }));
      DEFAULT_ANNOUNCEMENTS.forEach((def) => {
        if (list.length < 4 && !list.some((c) => c.id === def.id)) {
          list.push(def);
        }
      });
      return list;
    }
    return DEFAULT_ANNOUNCEMENTS;
  }, [remoteAnnouncements]);

  const featured = items[0] || DEFAULT_ANNOUNCEMENTS[0];
  const sideItems = items.slice(1, 4);

  return (
    <section
      id="pengumuman-desa"
      className="relative mx-auto max-w-7xl px-3.5 sm:px-6 lg:px-8 pt-20 sm:pt-20 lg:pt-24 xl:pt-28 pb-14 sm:pb-6 lg:pb-6 h-[100dvh] max-h-[100dvh] flex flex-col justify-between overflow-hidden snap-section select-none"
    >
      {/* ─── 1. SECTION HEADER RESMI & ELEGAN (COMPACT) ─── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="text-center max-w-3xl mx-auto space-y-0.5 mb-1 sm:mb-2 shrink-0 pt-1 sm:pt-0"
      >
        <span className="text-[9px] sm:text-[10px] font-sans font-semibold uppercase tracking-[0.25em] text-slate-500">
          AGENDA &amp; MAKLUMAT RESMI
        </span>
        <h2 className="font-display font-light text-xl xs:text-2xl sm:text-3xl uppercase tracking-[0.12em] text-slate-900 leading-tight">
          PENGUMUMAN DESA
        </h2>
        <p className="font-display font-light text-[11px] sm:text-xs uppercase tracking-[0.08em] text-slate-500">
          Edaran &amp; Maklumat Pemerintah Desa Sampeldes
        </p>
        <div className="w-10 h-[1px] bg-slate-300 mx-auto mt-0.5" />
      </motion.div>

      {/* ─── 2. TAMPILAN KHUSUS MOBILE: HERO CARD + GRID 3 KARTU PER BARIS (RAPI & TANPA GESER KANAN) ─── */}
      <div className="lg:hidden flex-1 flex flex-col justify-between py-1 max-w-md mx-auto w-full gap-1.5 overflow-hidden">
        {/* Hero Featured Card Mobile */}
        <div className="relative rounded-[20px] overflow-hidden neu-card-elevated flex flex-col justify-end p-3 min-h-[145px] xs:min-h-[160px] group shrink-0">
          <Image
            src={featured.imageUrl || DEFAULT_ANNOUNCEMENTS[0].imageUrl || ''}
            alt={featured.title}
            fill
            sizes="400px"
            className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
            priority
            unoptimized
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-slate-950/60 to-slate-950/20 pointer-events-none" />

          <div className="relative z-10 text-white space-y-1">
            <div className="flex items-center gap-1.5">
              <span className="neu-pill px-2 py-0.5 rounded-full text-[7.5px] font-sans font-bold uppercase tracking-[0.2em] text-teal-400">
                {featured.tag || 'MAKLUMAT UTAMA'}
              </span>
              <span className="text-[8.5px] font-sans text-slate-300">
                {formatDisplayDate(featured.publishDate)}
              </span>
            </div>

            <h3 className="font-display font-light text-xs xs:text-sm text-white leading-snug line-clamp-2">
              {featured.title}
            </h3>

            <div className="pt-0.5">
              <Link
                href={`/pengumuman/detail?id=${featured.id}`}
                className="neu-btn-gold inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-sans font-bold tracking-wide transition-all active:scale-95 shadow-sm"
              >
                <span>Baca Maklumat</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        </div>

        {/* Maklumat Lainnya - Grid 3 Kartu Per Baris */}
        <div className="space-y-1 shrink-0">
          <div className="flex items-center justify-between px-0.5">
            <span className="text-[8.5px] font-sans font-bold uppercase tracking-wider text-slate-700">
              MAKLUMAT LAINNYA
            </span>
            <span className="text-[7.5px] font-sans font-medium text-emerald-800">
              Edaran Desa
            </span>
          </div>
          <div className="grid grid-cols-3 gap-1.5 w-full">
            {sideItems.map((item, idx) => (
              <div
                key={`mob-ann-${item.id || idx}`}
                className="neu-flat p-1.5 rounded-[15px] h-[98px] xs:h-[105px] flex flex-col justify-between text-center select-none active:scale-95 transition-all group"
              >
                <Link href={`/pengumuman/detail?id=${item.id}`} className="flex flex-col justify-between h-full">
                  <div className="relative w-full h-[46px] xs:h-[50px] rounded-[10px] overflow-hidden bg-slate-200 neu-inset p-0.5 shrink-0">
                    <div className="relative w-full h-full rounded-[8px] overflow-hidden">
                      <Image
                        src={item.imageUrl || DEFAULT_ANNOUNCEMENTS[(idx + 1) % DEFAULT_ANNOUNCEMENTS.length].imageUrl || ''}
                        alt={item.title}
                        fill
                        sizes="120px"
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                        unoptimized
                      />
                    </div>
                  </div>
                  <div className="pt-0.5 px-0.5 flex-1 flex flex-col justify-between">
                    <span className="text-[6px] font-sans text-slate-500 font-medium block truncate">
                      {formatDisplayDate(item.publishDate)}
                    </span>
                    <h4 className="text-[7.5px] xs:text-[8px] font-display font-medium text-slate-900 group-hover:text-emerald-800 transition-colors line-clamp-2 leading-tight">
                      {item.title}
                    </h4>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        </div>

        {/* Tombol Lihat Semua Pengumuman Khusus Mobile */}
        <div className="text-center pt-0.5 shrink-0">
          <Link
            href="/pengumuman/"
            className="neu-btn w-full inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-full text-[9.5px] font-sans font-bold uppercase tracking-[0.16em] text-slate-900 active:scale-95 shadow-sm"
          >
            <span>LIHAT SEMUA PENGUMUMAN RESMI</span>
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </div>

      {/* ─── TAMPILAN DESKTOP: 1 HERO BANNER (KIRI) + 3 KARTU SAMPING (KANAN) ─── */}
      <div className="hidden lg:grid grid-cols-12 gap-5 xl:gap-6 items-stretch w-full max-w-6xl mx-auto shrink-0">

        {/* ─── SISI KIRI: HERO FEATURED CARD DENGAN NEUMORPHIC ELEVATED FRAME ─── */}
        <motion.div
          initial={{ opacity: 0, x: -16 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="lg:col-span-7 relative rounded-[28px] sm:rounded-[32px] overflow-hidden neu-card-elevated flex flex-col justify-end p-5 lg:p-7 h-[355px] xl:h-[375px] group"
        >
          {/* Background Image Penuh */}
          <Image
            src={featured.imageUrl || DEFAULT_ANNOUNCEMENTS[0].imageUrl || ''}
            alt={featured.title}
            fill
            sizes="60vw"
            className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
            priority
            unoptimized
          />

          {/* Gradient Overlay Gelap Mewah */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-slate-950/55 to-slate-950/15 pointer-events-none" />

          {/* Konten Hero Maklumat */}
          <div className="relative z-10 text-white space-y-2">
            {/* Tag / Category */}
            <div className="flex items-center gap-2">
              <span className="neu-pill px-2.5 py-0.5 rounded-full text-[9px] sm:text-[9.5px] font-sans font-bold uppercase tracking-[0.22em] text-teal-400">
                {featured.tag || 'MAKLUMAT UTAMA'}
              </span>
              <span className="text-white/40">&bull;</span>
              <span className="text-[9.5px] sm:text-[10px] font-sans font-medium text-slate-300">
                {formatDisplayDate(featured.publishDate)}
              </span>
            </div>

            {/* Headline Judul Besar */}
            <h3 className="font-display font-light text-xl sm:text-2xl text-white leading-snug line-clamp-2">
              {featured.title}
            </h3>

            {/* Paragraf Ringkasan */}
            <p className="text-xs text-slate-200/90 font-sans font-normal leading-relaxed line-clamp-2 max-w-xl">
              {featured.content}
            </p>

            {/* Tombol Aksi Warna Emas Neumorphic */}
            <div className="pt-2">
              <Link
                href={`/pengumuman/detail?id=${featured.id}`}
                className="neu-btn-gold inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-sans font-bold tracking-wide transition-all cursor-pointer group/btn"
              >
                <span>Baca Maklumat Lengkap</span>
                <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover/btn:translate-x-1" />
              </Link>
            </div>
          </div>
        </motion.div>

        {/* ─── SISI KANAN: 3 KARTU SAMPING HORIZONTAL DENGAN NEUMORPHISM ─── */}
        <motion.div
          initial={{ opacity: 0, x: 16 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="lg:col-span-5 flex flex-col justify-between gap-3 h-[355px] xl:h-[375px]"
        >
          {sideItems.map((item, idx) => (
            <Link
              key={item.id || idx}
              href={`/pengumuman/detail?id=${item.id}`}
              className="group relative flex items-center gap-3 p-3 rounded-2xl neu-convex hover:scale-[1.01] transition-all duration-300 cursor-pointer flex-1"
            >
              {/* Thumbnail Gambar Samping (Kiri Kartu) */}
              <div className="neu-flat p-0.5 rounded-xl shrink-0">
                <div className="relative w-20 sm:w-24 h-full min-h-[70px] rounded-lg overflow-hidden bg-stone-100">
                  <Image
                    src={item.imageUrl || DEFAULT_ANNOUNCEMENTS[(idx + 1) % DEFAULT_ANNOUNCEMENTS.length].imageUrl || ''}
                    alt={item.title}
                    fill
                    sizes="120px"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    unoptimized
                  />
                </div>
              </div>

              {/* Teks Rincian Kartu (Kanan Kartu) */}
              <div className="flex-1 min-w-0 flex flex-col justify-center py-0.5">
                {/* Meta Tanggal / Penulis */}
                <div className="flex items-center gap-1.5 text-[9px] font-sans font-medium text-slate-500 uppercase tracking-wider line-clamp-1">
                  <span>{formatDisplayDate(item.publishDate)}</span>
                  <span>&bull;</span>
                  <span className="truncate">{item.authorName || 'Pemerintah Desa'}</span>
                </div>

                {/* Judul Pengumuman */}
                <h4 className="font-display font-medium text-xs sm:text-[13px] text-slate-900 group-hover:text-emerald-700 transition-colors line-clamp-2 leading-snug mt-0.5">
                  {item.title}
                </h4>

                {/* Link Teks di Bawah */}
                <div className="inline-flex items-center gap-1 text-[10.5px] font-sans font-bold text-emerald-700 group-hover:text-emerald-800 tracking-wide mt-1 transition-colors">
                  <span>Baca Maklumat</span>
                  <ArrowRight className="w-2.5 h-2.5 transition-transform group-hover:translate-x-1" />
                </div>
              </div>
            </Link>
          ))}
        </motion.div>
      </div>

      {/* ─── 3. LINK LIHAT SEMUA PENGUMUMAN RESMI DI BAWAH (DESKTOP) ─── */}
      <div className="hidden lg:block text-center pt-2.5 sm:pt-3 shrink-0">
        <Link
          href="/pengumuman/"
          className="neu-btn inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-[10.5px] sm:text-xs font-sans font-bold uppercase tracking-[0.2em] text-slate-900 transition-all group"
        >
          <span>LIHAT SEMUA PENGUMUMAN RESMI</span>
          <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>
    </section>
  );
}
