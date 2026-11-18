'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Calendar,
  Clock,
  Eye,
  Play,
  Bookmark,
  ArrowRight,
  TrendingUp,
  Sparkles,
} from 'lucide-react';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, limit } from 'firebase/firestore';
import { News } from '@/lib/types';

// Data Berita Kurasi Berkualitas Tinggi (Fallback & Default Display)
const FALLBACK_TOP_STORIES = [
  {
    category: 'PERTANIAN',
    title: 'Pelatihan Budidaya Saanen & Standarisasi Susu Kambing Perah',
    date: '19 Okt 2026',
    image: 'https://images.unsplash.com/photo-1524024973431-2ad916746881?q=80&w=400&auto=format&fit=crop',
    link: '/BeritaDesa/',
  },
  {
    category: 'PELAYANAN',
    title: 'Sosialisasi Pembuatan Surat Mandiri Online Dari Rumah',
    date: '18 Okt 2026',
    image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=400&auto=format&fit=crop',
    link: '/BeritaDesa/',
  },
  {
    category: 'KESEHATAN',
    title: 'Jadwal Posyandu Integrasi Balita & Lansia Dusun Sampeldes',
    date: '16 Okt 2026',
    image: 'https://images.unsplash.com/photo-1576765608535-5f04d1e3f289?q=80&w=400&auto=format&fit=crop',
    link: '/BeritaDesa/',
  },
  {
    category: 'EKONOMI',
    title: 'Bazar UMKM Warga & Pameran Olahan Gula Kelapa Murni',
    date: '14 Okt 2026',
    image: 'https://images.unsplash.com/photo-1590736969955-71cc94801759?q=80&w=400&auto=format&fit=crop',
    link: '/BeritaDesa/',
  },
];

const FALLBACK_HEADLINE = {
  category: 'PEMBANGUNAN DESA',
  title: 'Peningkatan Mutu Jalan Usaha Tani Dusun Sampeldes Tuntas 100%',
  excerpt:
    'Pemerintah Desa Sampeldes sukses merealisasikan pengaspalan jalan poros pertanian sepanjang 1,2 km guna memperlancar mobilitas hasil panen padi warga, mempercepat distribusi pupuk, dan menghubungkan sentra lumbung pangan ke jalur utama kecamatan.',
  date: '21 Okt 2026',
  author: 'Redaksi Desa Sampeldes',
  image: 'https://images.unsplash.com/photo-1577495508048-b635879837f1?q=80&w=1200&auto=format&fit=crop',
  link: '/BeritaDesa/',
};

const FALLBACK_JUST_IN = [
  {
    title: 'Jadwal Penyaluran Bantuan Cadangan Pangan Beras di Balai Desa',
    time: '25 menit lalu',
    views: '142',
    link: '/BeritaDesa/',
  },
  {
    title: 'Penarikan Pajak PBB-P2 Dusun II Capai Target 95% Bulan Ini',
    time: '1 jam lalu',
    views: '98',
    link: '/BeritaDesa/',
  },
  {
    title: 'Kerja Bakti Bersih Saluran Irigasi Tersier Jelang Musim Tanam',
    time: '3 jam lalu',
    views: '165',
    link: '/BeritaDesa/',
  },
  {
    title: 'Pendaftaran Pelatihan Keterampilan Menjahit & Tata Boga Warga',
    time: '5 jam lalu',
    views: '210',
    link: '/BeritaDesa/',
  },
];

export function NewsSection() {
  const firestore = useFirestore();

  // Ambil berita terbaru dari Firestore jika tersedia
  const newsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'news'), orderBy('date', 'desc'), limit(10));
  }, [firestore]);

  const { data: newsDocs } = useCollection<News>(newsQuery, { suppressGlobalError: true });

  // Map data jika ada berita real dari Firestore
  const headline = React.useMemo(() => {
    if (newsDocs && newsDocs.length > 0) {
      const first = newsDocs[0];
      return {
        category: (first.subtitle || 'BERITA DESA').toUpperCase(),
        title: first.title,
        excerpt: first.subtitle || (first.content ? first.content.substring(0, 200) + '...' : ''),
        date: first.date || 'Terkini',
        author: first.author || 'Pemerintah Desa',
        image: first.imageUrl || FALLBACK_HEADLINE.image,
        link: `/BeritaDesa/detail?id=${first.id}`,
      };
    }
    return FALLBACK_HEADLINE;
  }, [newsDocs]);

  const topStories = React.useMemo(() => {
    if (newsDocs && newsDocs.length > 1) {
      return newsDocs.slice(1, 5).map((item, idx) => ({
        category: (item.subtitle || 'KABAR').toUpperCase(),
        title: item.title,
        date: item.date || 'Terkini',
        image: item.imageUrl || FALLBACK_TOP_STORIES[idx % FALLBACK_TOP_STORIES.length].image,
        link: `/BeritaDesa/detail?id=${item.id}`,
      }));
    }
    return FALLBACK_TOP_STORIES;
  }, [newsDocs]);

  const justInList = React.useMemo(() => {
    if (newsDocs && newsDocs.length > 5) {
      return newsDocs.slice(5, 9).map((item) => ({
        title: item.title,
        time: item.date || 'Baru saja',
        views: '100+',
        link: `/BeritaDesa/detail?id=${item.id}`,
      }));
    }
    return FALLBACK_JUST_IN;
  }, [newsDocs]);

  return (
    <section id="berita-desa" className="relative w-full py-20 lg:py-28 overflow-hidden select-none">
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* HEADER SECTION (PERSIS GAYA GAMBAR 1 DENGAN TEMA AKTIF) */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 sm:mb-14">
          <div className="max-w-xl">
            {/* Pill Tag Sesuai Gambar 1 */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-teal-50 dark:bg-teal-950/40 border border-teal-200/60 dark:border-teal-700/30 text-teal-700 dark:text-teal-300 text-[11px] font-bold tracking-[0.2em] uppercase mb-3.5">
              <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse" />
              <span>BERITA DESA TERKINI</span>
            </div>

            {/* Main Headline Dual Tone Sesuai Gambar 1 */}
            <h2 className="text-3xl sm:text-4xl lg:text-[40px] font-extrabold text-slate-900 dark:text-white tracking-tight leading-[1.18]">
              KABAR & WARTA{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-600 to-emerald-500 dark:from-teal-400 dark:to-emerald-400">
                DESA TERKINI
              </span>
            </h2>
          </div>

          <Link
            href="/BeritaDesa/"
            className="inline-flex items-center gap-2.5 px-6 py-3 rounded-full bg-[#081d27] hover:bg-[#0d2a38] text-white font-bold text-xs tracking-wider uppercase shadow-md transition-all duration-300 hover:scale-105 shrink-0 self-start md:self-auto"
          >
            <span>Semua Berita Desa</span>
            <ArrowRight className="h-3.5 w-3.5 text-teal-400" />
          </Link>
        </div>

        {/* 3-COLUMN EDITORIAL NEWS GRID (PERSIS STRUKTUR GAMBAR 2) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-8 items-start">
          {/* ═════════════════════════════════════════════════════════════════
              KOLOM 1: TOP STORIES / BERITA PILIHAN (3 KOLOM KIRI DI GAMBAR 2)
              ═════════════════════════════════════════════════════════════════ */}
          <div className="lg:col-span-3 flex flex-col space-y-6">
            {/* Header Kolom Kiri */}
            <div className="flex items-center gap-3 border-b border-slate-200 dark:border-white/10 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-wide">
                Top Stories
              </h3>
              <div className="w-8 h-[2px] bg-teal-500 rounded-full" />
            </div>

            {/* List 4 Berita Thumbnail Kiri */}
            <div className="space-y-5">
              {topStories.map((story, idx) => (
                <motion.article
                  key={idx}
                  initial={{ opacity: 0, y: 15 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: idx * 0.08 }}
                  className="group flex items-start justify-between gap-3.5 pb-4 border-b border-slate-100 dark:border-white/5 last:border-b-0 last:pb-0"
                >
                  <div className="flex-1 min-w-0">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-teal-600 dark:text-teal-400 block mb-1">
                      {story.category}
                    </span>
                    <Link
                      href={story.link}
                      className="text-xs sm:text-[13px] font-bold text-slate-900 dark:text-white group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors line-clamp-2 leading-snug"
                    >
                      {story.title}
                    </Link>
                    <div className="flex items-center gap-2 mt-2 text-[10px] text-slate-400">
                      <span>{story.date}</span>
                      <span>•</span>
                      <Bookmark className="h-3 w-3 hover:text-teal-500 cursor-pointer" />
                    </div>
                  </div>

                  {/* Thumbnail Image Kanan */}
                  <Link
                    href={story.link}
                    className="relative w-20 h-16 sm:w-22 sm:h-18 rounded-xl overflow-hidden shrink-0 shadow-sm border border-slate-100 dark:border-white/10 group-hover:scale-105 transition-transform duration-300"
                  >
                    <Image
                      src={story.image}
                      alt={story.title}
                      fill
                      sizes="100px"
                      className="object-cover object-center"
                    />
                  </Link>
                </motion.article>
              ))}
            </div>
          </div>

          {/* ═════════════════════════════════════════════════════════════════
              KOLOM 2: HEADLINE STORY / SOROTAN UTAMA (6 KOLOM TENGAH DI GAMBAR 2)
              ═════════════════════════════════════════════════════════════════ */}
          <div className="lg:col-span-6 flex flex-col">
            <motion.article
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="group bg-white dark:bg-[#0a1b24] rounded-3xl p-5 sm:p-6 border border-slate-200/80 dark:border-white/10 shadow-[0_10px_35px_rgba(0,0,0,0.04)] hover:shadow-[0_20px_45px_rgba(0,168,132,0.12)] transition-all duration-300"
            >
              {/* Foto Utama Bersudut Membulat Besar */}
              <Link
                href={headline.link}
                className="relative block h-64 sm:h-80 lg:h-96 w-full rounded-2xl overflow-hidden shadow-md"
              >
                <Image
                  src={headline.image}
                  alt={headline.title}
                  fill
                  priority
                  sizes="(max-width: 1024px) 100vw, 600px"
                  className="object-cover object-center group-hover:scale-106 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                <span className="absolute top-4 left-4 bg-teal-600/95 backdrop-blur-md text-white text-[10px] font-extrabold tracking-widest uppercase px-3 py-1 rounded-md shadow-sm">
                  SOROTAN UTAMA
                </span>
              </Link>

              {/* Konten Berita Utama */}
              <div className="pt-6">
                <span className="text-[11px] font-extrabold uppercase tracking-widest text-teal-600 dark:text-teal-400 block mb-2">
                  {headline.category}
                </span>

                <Link href={headline.link}>
                  <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white leading-snug group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors mb-3">
                    {headline.title}
                  </h3>
                </Link>

                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-5 line-clamp-3">
                  {headline.excerpt}
                </p>

                <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-white/5 text-xs">
                  <div className="flex items-center gap-2 text-slate-400 font-medium text-[11px]">
                    <Calendar className="h-3.5 w-3.5 text-teal-500" />
                    <span>{headline.date}</span>
                    <span>•</span>
                    <span>{headline.author}</span>
                  </div>

                  <Link
                    href={headline.link}
                    className="inline-flex items-center gap-1.5 font-bold text-teal-700 dark:text-teal-400 group-hover:text-emerald-600 uppercase tracking-wider text-xs"
                  >
                    <span>Baca Berita</span>
                    <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </div>
            </motion.article>
          </div>

          {/* ═════════════════════════════════════════════════════════════════
              KOLOM 3: VIDEO / SIARAN DESA + JUST IN (3 KOLOM KANAN DI GAMBAR 2)
              ═════════════════════════════════════════════════════════════════ */}
          <div className="lg:col-span-3 flex flex-col space-y-7">
            {/* Card Video / Liputan Khusus (Bagian Atas Kolom Kanan Gambar 2) */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="relative h-48 sm:h-52 w-full rounded-2xl overflow-hidden shadow-md group border border-slate-200/80 dark:border-white/10"
            >
              <Image
                src="https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=600&auto=format&fit=crop"
                alt="Siaran & Liputan Desa"
                fill
                sizes="(max-width: 768px) 100vw, 300px"
                className="object-cover object-center group-hover:scale-108 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-black/20" />

              {/* Live / Siaran Badge */}
              <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-rose-600 text-white text-[9px] font-extrabold tracking-widest uppercase px-2.5 py-0.5 rounded-full shadow-sm animate-pulse">
                <span className="w-1.5 h-1.5 rounded-full bg-white" />
                <span>SIARAN DESA</span>
              </div>

              {/* Center Play Button Overlay */}
              <Link
                href="/BeritaDesa/"
                className="absolute inset-0 flex items-center justify-center"
              >
                <div className="h-12 w-12 rounded-full bg-white/20 backdrop-blur-md border border-white/40 text-white flex items-center justify-center group-hover:scale-110 group-hover:bg-teal-500 transition-all duration-300 shadow-lg">
                  <Play className="h-5 w-5 fill-white ml-0.5" />
                </div>
              </Link>

              {/* Title di Bawah Video Card */}
              <div className="absolute bottom-3 left-3 right-3 text-white">
                <p className="text-xs font-bold leading-tight line-clamp-2 drop-shadow">
                  Dokumentasi Musyawarah & Liputan Pembangunan Desa Sampeldes
                </p>
              </div>
            </motion.div>

            {/* Just In / Kabar Kilat (Bagian Bawah Kolom Kanan Gambar 2) */}
            <div className="flex flex-col space-y-4">
              {/* Header Kabar Kilat */}
              <div className="flex items-center gap-3 border-b border-slate-200 dark:border-white/10 pb-3">
                <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-wide">
                  Kabar Kilat
                </h3>
                <div className="w-8 h-[2px] bg-teal-500 rounded-full" />
              </div>

              {/* List Kabar Kilat */}
              <div className="space-y-4">
                {justInList.map((item, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: 15 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: idx * 0.08 }}
                    className="group pb-3.5 border-b border-slate-100 dark:border-white/5 last:border-b-0 last:pb-0"
                  >
                    <Link
                      href={item.link}
                      className="text-xs sm:text-[13px] font-bold text-slate-900 dark:text-white group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors line-clamp-2 leading-snug"
                    >
                      {item.title}
                    </Link>
                    <div className="flex items-center justify-between mt-2 text-[10px] text-slate-400">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3 text-teal-500" />
                        {item.time}
                      </span>
                      <span className="flex items-center gap-1 font-mono">
                        <Eye className="h-3 w-3" />
                        {item.views}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default NewsSection;
