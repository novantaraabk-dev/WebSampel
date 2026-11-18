'use client';

import React from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Announcement } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Calendar, User, Megaphone, Milestone, Home } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { Header } from '@/components/landing/Header';
import { Footer } from '@/components/landing/Footer';
import { BackgroundPattern } from '@/components/landing/BackgroundPattern';

export function AnnouncementDetailClient() {
  const params = useParams();
  const searchParams = useSearchParams();
  const rawId = params?.id as string;
  const queryId = searchParams?.get('id');

  let id = '';
  if (queryId) {
    id = decodeURIComponent(queryId).trim();
  } else if (rawId && rawId !== 'preview') {
    id = decodeURIComponent(rawId).trim();
  } else if (typeof window !== 'undefined') {
    const pathParts = window.location.pathname.split('/').filter(Boolean);
    const lastPart = pathParts[pathParts.length - 1];
    if (lastPart && lastPart !== 'pengumuman' && lastPart !== 'detail' && lastPart !== 'preview') {
      id = decodeURIComponent(lastPart).trim();
    }
  }

  const router = useRouter();
  const firestore = useFirestore();

  const announcementRef = useMemoFirebase(() => {
    if (!firestore || !id) return null;
    return doc(firestore, 'announcements', id);
  }, [firestore, id]);

  const { data: announcement, isLoading } = useDoc<Announcement>(announcementRef);

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
        <div className="container mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8 max-w-4xl">
          {isLoading ? (
            <div className="neu-card-elevated rounded-[32px] p-8 space-y-6">
              <Skeleton className="h-8 w-36 rounded-full bg-stone-300/60" />
              <Skeleton className="h-[250px] sm:h-[400px] w-full rounded-2xl bg-stone-300/60" />
              <div className="space-y-3">
                <Skeleton className="h-8 sm:h-10 w-3/4 rounded-xl bg-stone-300/60" />
                <Skeleton className="h-24 sm:h-36 w-full rounded-2xl bg-stone-300/60" />
              </div>
            </div>
          ) : !announcement ? (
            <div className="neu-card-elevated rounded-[32px] p-8 sm:p-12 text-center max-w-md mx-auto space-y-4">
              <div className="w-16 h-16 rounded-full neu-inset flex items-center justify-center mx-auto text-stone-500">
                <Megaphone className="h-7 w-7 text-emerald-700" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 uppercase">Pengumuman Tidak Ditemukan</h2>
              <p className="text-xs font-medium text-stone-600">Maaf, informasi yang Anda cari mungkin telah dihapus atau dipindahkan.</p>
              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <button
                  onClick={() => router.push('/pengumuman')}
                  className="neu-btn px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider text-stone-700"
                >
                  <ArrowLeft className="inline-block mr-1.5 h-3.5 w-3.5" /> Kembali
                </button>
                <Link href="/">
                  <button className="neu-btn-dark px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider">
                    <Home className="inline-block mr-1.5 h-3.5 w-3.5" /> Beranda
                  </button>
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* BACK BUTTON */}
              <div className="flex items-center justify-between">
                <button
                  onClick={() => router.push('/pengumuman')}
                  className="neu-btn inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-stone-700 hover:text-emerald-800 transition-colors"
                >
                  <ArrowLeft className="h-3.5 w-3.5 text-emerald-700" />
                  <span>Kembali ke Pengumuman</span>
                </button>
                <span className="neu-pill text-[10px] uppercase tracking-wider font-extrabold text-stone-600">
                  Warta Resmi
                </span>
              </div>

              {/* ARTICLE CARD */}
              <article className="neu-card-elevated rounded-[28px] sm:rounded-[36px] p-5 sm:p-8 md:p-10 border border-white/60 space-y-6">
                {/* IMAGE AREA */}
                {announcement.imageUrl && (
                  <div className="neu-inset p-2.5 sm:p-3 rounded-[24px] overflow-hidden">
                    <img
                      src={announcement.imageUrl}
                      alt={announcement.title}
                      className="w-full h-auto block max-h-[300px] sm:max-h-[500px] md:max-h-[650px] object-contain mx-auto rounded-[18px]"
                    />
                  </div>
                )}

                {/* CONTENT AREA */}
                <div className="space-y-5">
                  <div className="space-y-3">
                    <div className="inline-flex items-center gap-2 neu-pill text-[11px] font-bold tracking-wider text-emerald-800 uppercase px-4 py-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-600" />
                      <span>Informasi Resmi Pemerintah Desa</span>
                    </div>
                    <h1 className="text-2xl min-[380px]:text-3xl sm:text-4xl md:text-5xl font-condensed font-black text-slate-900 leading-tight uppercase tracking-tight">
                      {announcement.title}
                    </h1>
                  </div>

                  {/* METADATA ROW */}
                  <div className="flex flex-wrap items-center gap-3 pt-1 pb-3">
                    <div className="neu-inset px-4 py-2 rounded-2xl flex items-center gap-2.5">
                      <Calendar className="h-4 w-4 text-emerald-700 shrink-0" />
                      <div>
                        <p className="text-[9px] font-bold text-stone-500 uppercase tracking-wider leading-none mb-0.5">Tanggal Terbit</p>
                        <p className="text-xs font-bold text-slate-800">{formatDate(announcement.publishDate)}</p>
                      </div>
                    </div>

                    <div className="neu-inset px-4 py-2 rounded-2xl flex items-center gap-2.5">
                      <User className="h-4 w-4 text-emerald-700 shrink-0" />
                      <div>
                        <p className="text-[9px] font-bold text-stone-500 uppercase tracking-wider leading-none mb-0.5">Diterbitkan Oleh</p>
                        <p className="text-xs font-bold text-slate-800">{announcement.authorName || 'Pemerintah Desa Sampeldes'}</p>
                      </div>
                    </div>
                  </div>

                  {/* BODY TEXT */}
                  <div className="neu-inset p-5 sm:p-7 rounded-[24px]">
                    <p className="text-sm sm:text-base md:text-lg leading-relaxed text-stone-800 whitespace-pre-wrap font-sans">
                      {announcement.content}
                    </p>
                  </div>

                  {/* FOOTER CALLOUT */}
                  <div className="pt-6 border-t border-stone-300/80 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full neu-btn-circle flex items-center justify-center text-emerald-800 shrink-0">
                        <Milestone className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-[9px] font-bold text-stone-500 uppercase tracking-wider">Sekretariat Desa Sampeldes</p>
                        <p className="text-xs sm:text-sm font-bold text-slate-800 tracking-tight">Kecamatan Gandrungmangu, Cilacap</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 w-full sm:w-auto">
                      <button
                        onClick={() => router.push('/pengumuman')}
                        className="neu-btn flex-1 sm:flex-none text-slate-800 font-bold px-5 py-2.5 rounded-full hover:text-emerald-800 transition-all uppercase tracking-wider text-xs"
                      >
                        Daftar Lainnya
                      </button>
                      <Link href="/" className="flex-1 sm:flex-none">
                        <button className="neu-btn-dark w-full px-5 py-2.5 rounded-full transition-all uppercase tracking-wider text-xs font-bold">
                          Beranda
                        </button>
                      </Link>
                    </div>
                  </div>
                </div>
              </article>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
