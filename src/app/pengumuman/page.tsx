'use client';

import React from 'react';
import Link from 'next/link';
import { Header } from '@/components/landing/Header';
import { Footer } from '@/components/landing/Footer';
import { BackgroundPattern } from '@/components/landing/BackgroundPattern';
import { Button } from '@/components/ui/button';
import { ArrowRight, Calendar, Megaphone, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, limit } from 'firebase/firestore';
import { Announcement } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';

export default function PengumumanPage() {
  const firestore = useFirestore();
  const announcementsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'announcements'), orderBy('publishDate', 'desc'), limit(50));
  }, [firestore]);

  const { data: announcements, isLoading, error } = useCollection<Announcement>(announcementsQuery);

  const formatDate = (date: any) => {
    if (!date) return '-';
    return date.toDate().toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="relative flex min-h-screen flex-col bg-[#F8FAFC] dark:bg-[#060b11] text-slate-900 dark:text-slate-100 overflow-x-hidden font-sans">
      <BackgroundPattern />
      <Header />

      <main className="relative flex-1 pt-24 sm:pt-28 pb-16 sm:pb-20">
        {/* HERO / PAGE HEADER */}
        <section className="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8 pt-4 sm:pt-8 pb-6 sm:pb-10">
          <div className="text-center max-w-3xl mx-auto space-y-3 sm:space-y-4">
            <div className="inline-flex items-center justify-center gap-2.5 neu-pill px-4 py-1.5 text-xs font-bold tracking-wider text-teal-700 dark:text-teal-400 uppercase">
              <span className="w-2 h-2 rounded-full bg-teal-600 dark:bg-teal-400" />
              <Megaphone className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400" />
              <span>Papan Informasi & Agenda Resmi</span>
            </div>

            <h1 className="text-3xl min-[380px]:text-4xl sm:text-5xl md:text-6xl font-condensed font-black text-slate-900 dark:text-white uppercase tracking-tight leading-[0.95]">
              Pengumuman <span className="text-teal-600 dark:text-teal-400">Desa</span>
            </h1>

            <p className="text-xs sm:text-base text-slate-600 dark:text-slate-300 font-medium max-w-xl mx-auto leading-relaxed">
              Informasi, agenda, surat edaran, dan pengumuman penting dari administrasi Pemerintah Desa Sampeldes.
            </p>
          </div>
        </section>

        {/* CONTENT GRID */}
        <section className="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8">
          {error && (
            <div className="neu-card-elevated p-5 sm:p-6 rounded-[24px] flex items-center gap-3 text-red-700 max-w-xl mx-auto">
              <AlertCircle className="h-5 w-5 shrink-0 text-red-600" />
              <p className="text-xs sm:text-sm font-semibold">Gagal memuat pengumuman. Silakan coba beberapa saat lagi.</p>
            </div>
          )}

          {isLoading && (
            <div className="grid gap-5 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              <div className="neu-card-elevated p-4 rounded-[28px] h-[340px] space-y-4">
                <Skeleton className="h-44 w-full rounded-2xl bg-stone-300/60" />
                <Skeleton className="h-6 w-3/4 rounded-full bg-stone-300/60" />
                <Skeleton className="h-10 w-full rounded-xl bg-stone-300/60" />
              </div>
              <div className="neu-card-elevated p-4 rounded-[28px] h-[340px] space-y-4">
                <Skeleton className="h-44 w-full rounded-2xl bg-stone-300/60" />
                <Skeleton className="h-6 w-3/4 rounded-full bg-stone-300/60" />
                <Skeleton className="h-10 w-full rounded-xl bg-stone-300/60" />
              </div>
              <div className="neu-card-elevated p-4 rounded-[28px] h-[340px] space-y-4">
                <Skeleton className="h-44 w-full rounded-2xl bg-stone-300/60" />
                <Skeleton className="h-6 w-3/4 rounded-full bg-stone-300/60" />
                <Skeleton className="h-10 w-full rounded-xl bg-stone-300/60" />
              </div>
            </div>
          )}

          {!isLoading && announcements && announcements.length === 0 && (
            <div className="py-14 sm:py-20 text-center neu-card-elevated rounded-[32px] p-8 max-w-xl mx-auto space-y-3">
              <div className="w-14 h-14 rounded-full neu-inset text-stone-500 flex items-center justify-center mx-auto mb-2">
                <Megaphone className="h-6 w-6 text-emerald-700" />
              </div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900">Belum Ada Pengumuman</h3>
              <p className="text-xs text-stone-600 mt-1">Saat ini belum ada pengumuman baru yang diterbitkan.</p>
            </div>
          )}

          {!isLoading && announcements && announcements.length > 0 && (
            <div className="grid gap-5 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {announcements.map((announcement) => (
                <Link key={announcement.id} href={`/pengumuman/detail?id=${announcement.id}`} className="flex group">
                  <div className="neu-card-elevated rounded-[28px] p-3.5 flex flex-col w-full justify-between hover:-translate-y-1.5 transition-all duration-300 border border-white/60">
                    <div className="space-y-3">
                      {/* IMAGE THUMBNAIL */}
                      <div className="relative aspect-[16/9] sm:aspect-video w-full overflow-hidden rounded-[20px] neu-inset p-1.5 shrink-0">
                        <div className="relative w-full h-full rounded-[14px] overflow-hidden bg-stone-200">
                          {announcement.imageUrl ? (
                            <img
                              src={announcement.imageUrl}
                              alt={announcement.title}
                              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                              loading="lazy"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-stone-800">
                              <Megaphone className="h-10 w-10 text-emerald-400" />
                            </div>
                          )}
                          <div className="absolute top-2.5 left-2.5">
                            <span className="neu-pill text-emerald-900 font-extrabold uppercase text-[9px] tracking-wider px-3 py-1">
                              Info Resmi
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* CARD HEADER */}
                      <div className="px-2 pt-1 space-y-1.5">
                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-stone-500 uppercase tracking-wider">
                          <Calendar className="h-3 w-3 text-emerald-700 shrink-0" />
                          <span>{formatDate(announcement.publishDate)}</span>
                        </div>
                        <h3 className="text-sm sm:text-base md:text-lg font-condensed font-black uppercase tracking-tight text-slate-900 leading-snug group-hover:text-emerald-800 transition-colors line-clamp-2">
                          {announcement.title}
                        </h3>
                      </div>

                      {/* CARD CONTENT */}
                      <div className="px-2">
                        <p className="text-stone-600 text-xs leading-relaxed line-clamp-2">
                          {announcement.content}
                        </p>
                      </div>
                    </div>

                    <div className="px-2 pt-4 pb-1">
                      <div className="pt-3 border-t border-stone-300/70 flex items-center justify-between text-slate-900 group-hover:text-emerald-800 font-bold uppercase text-xs tracking-wider transition-colors">
                        <span>Baca Selengkapnya</span>
                        <div className="w-8 h-8 rounded-full neu-btn-circle flex items-center justify-center group-hover:text-emerald-800 transition-all">
                          <ArrowRight className="h-3.5 w-3.5" />
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
}
