'use client';

import React from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { Logo } from '@/components/logo';
import { Header } from '@/components/landing/Header';
import { Footer } from '@/components/landing/Footer';
import { BackgroundPattern } from '@/components/landing/BackgroundPattern';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Share2, Play } from 'lucide-react';
import { useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { News } from '@/lib/types';
import { getVideoEmbedUrl, getVideoPlatform } from '@/lib/video-utils';
import { Skeleton } from '@/components/ui/skeleton';
import { NewsImageGrid } from '@/components/news-image-grid';

export function BeritaDetailClient() {
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
    if (lastPart && lastPart !== 'BeritaDesa' && lastPart !== 'detail' && lastPart !== 'preview') {
      id = decodeURIComponent(lastPart).trim();
    }
  }

  const router = useRouter();
  const firestore = useFirestore();

  const newsRef = useMemoFirebase(() => {
    if (!firestore || !id) return null;
    return doc(firestore, 'news', id);
  }, [firestore, id]);

  const { data: news, isLoading } = useDoc<News>(newsRef);

  const hasPhotos = Boolean(
    (news?.imageUrls && news.imageUrls.length > 0) || Boolean(news?.imageUrl)
  );
  const hasVideo = Boolean(news?.videoUrl && news.videoUrl.trim().length > 0);
  const isVideoNews = news?.mediaType === 'video' || hasVideo;
  const videoEmbedUrl = getVideoEmbedUrl(news?.videoUrl || undefined);
  const videoPlatform = getVideoPlatform(news?.videoUrl || undefined);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#060b11] flex items-center justify-center p-6">
        <div className="rounded-2xl p-8 max-w-3xl w-full space-y-6 bg-white/90 dark:bg-[#081d27]/90 border border-slate-200/80 dark:border-white/10 shadow-lg">
          <Skeleton className="h-8 w-1/3 rounded-full bg-slate-200 dark:bg-white/10" />
          <Skeleton className="h-16 w-full rounded-2xl bg-slate-200 dark:bg-white/10" />
          <Skeleton className="h-72 w-full rounded-3xl bg-slate-200 dark:bg-white/10" />
          <Skeleton className="h-32 w-full rounded-2xl bg-slate-200 dark:bg-white/10" />
        </div>
      </div>
    );
  }

  if (!news) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#060b11] flex items-center justify-center p-6">
        <div className="rounded-2xl p-10 text-center max-w-md w-full space-y-4 bg-white/90 dark:bg-[#081d27]/90 border border-slate-200/80 dark:border-white/10 shadow-lg">
          <div className="w-16 h-16 mx-auto rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-500 font-bold text-xl">
            !
          </div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-white">Berita Tidak Ditemukan</h2>
          <p className="text-xs font-medium text-slate-600 dark:text-slate-400">Artikel yang Anda cari mungkin telah dipindahkan atau dihapus.</p>
          <Button
            onClick={() => router.push('/BeritaDesa')}
            className="bg-teal-600 hover:bg-teal-500 text-white px-6 py-2.5 text-xs font-bold uppercase tracking-wider rounded-xl shadow-sm"
          >
            Kembali ke Kabar Desa
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex flex-col min-h-screen bg-[#F8FAFC] dark:bg-[#060b11] text-slate-900 dark:text-slate-100 overflow-x-hidden font-sans">
      <BackgroundPattern />
      <Header />

      <main className="relative flex-1 pt-24 sm:pt-28 pb-16 sm:pb-24">
        <div className="container mx-auto px-3 sm:px-6 lg:px-8 max-w-4xl py-4 sm:py-8">

          {/* Navigation Back */}
          <div className="mb-6 flex items-center justify-between">
            <button
              onClick={() => router.push('/BeritaDesa')}
              className="neu-btn inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-stone-700 hover:text-emerald-800 transition-colors"
            >
              <ArrowLeft className="h-4 w-4 text-emerald-700" />
              <span>Kembali ke Kabar Desa</span>
            </button>
            <span className="neu-pill text-[10px] uppercase tracking-wider font-extrabold text-stone-600">
              Arsip Digital
            </span>
          </div>

          <article className="neu-card-elevated rounded-[28px] sm:rounded-[36px] p-5 sm:p-8 md:p-12 border border-white/60">

            {/* HEADER BERITA */}
            <div className="text-center space-y-4 mb-8 sm:mb-10">
              <div className="inline-flex items-center gap-2 neu-pill text-[11px] font-bold tracking-wider text-emerald-800 uppercase px-4 py-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-600" />
                <span>Kabar & Warta Desa Sampeldes</span>
              </div>

              <h1 className="text-2xl sm:text-4xl md:text-5xl font-black text-slate-900 leading-tight sm:leading-[1.1] tracking-tight uppercase break-words font-condensed">
                {news.title}
              </h1>

              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <div className="neu-inset px-4 py-1.5 rounded-full inline-flex items-center gap-2 text-xs font-bold">
                  <span className="text-slate-800">{news.author || 'Pemerintah Desa'}</span>
                  <span className="text-stone-400">•</span>
                  <span className="text-emerald-800 font-extrabold">Tim Redaksi</span>
                </div>
                <div className="neu-inset px-3 py-1.5 rounded-full text-stone-600 text-[11px] font-semibold tracking-wider">
                  {news.date}
                </div>
              </div>

              {news.subtitle && (
                <div className="neu-inset rounded-2xl p-4 sm:p-5 max-w-2xl mx-auto">
                  <p className="text-sm sm:text-base text-stone-700 italic leading-relaxed">
                    "{news.subtitle}"
                  </p>
                </div>
              )}
            </div>

            {/* MEDIA BERITA: FOTO DAN/ATAU VIDEO */}
            {/* 1. DOKUMENTASI FOTO (JIKA ADA FOTO) */}
            {hasPhotos && (
              <figure className="mb-8 sm:mb-10 space-y-3">
                <div className="neu-inset p-2 sm:p-3 rounded-[24px] sm:rounded-[32px] overflow-hidden">
                  <div className="rounded-[18px] sm:rounded-[24px] overflow-hidden">
                    <NewsImageGrid
                      imageUrls={news.imageUrls}
                      imageUrl={news.imageUrl}
                      title={news.title}
                      interactive={true}
                    />
                  </div>
                </div>
                <figcaption className="text-center text-[11px] text-stone-500 font-bold uppercase tracking-wider px-4">
                  Dokumentasi Resmi Pemerintah Desa Sampeldes
                </figcaption>
              </figure>
            )}

            {/* 2. DOKUMENTASI VIDEO (JIKA ADA LINK VIDEO) */}
            {hasVideo && (
              <div className="mb-8 sm:mb-10 space-y-3">
                <div className="flex items-center gap-2 mb-2">
                  <span className="p-1 rounded-lg bg-emerald-100 text-emerald-800">
                    <Play className="h-4 w-4 fill-emerald-800" />
                  </span>
                  <span className="text-xs sm:text-sm font-condensed font-extrabold uppercase tracking-wider text-slate-800">
                    Video Dokumentasi Kegiatan
                  </span>
                  {videoPlatform && (
                    <span className="neu-pill ml-auto text-[10px] font-bold uppercase tracking-wider text-stone-600 px-3 py-0.5">
                      {videoPlatform === 'youtube' ? 'YouTube' : videoPlatform === 'tiktok' ? 'TikTok' : videoPlatform === 'instagram' ? 'Instagram' : 'Video'}
                    </span>
                  )}
                </div>

                <div className="neu-inset p-2.5 sm:p-3 rounded-[24px] overflow-hidden bg-[#070b10]">
                  {videoEmbedUrl ? (
                    <div className="relative overflow-hidden rounded-[18px] bg-black">
                      <iframe
                        src={videoEmbedUrl}
                        title={news.title}
                        className="aspect-[16/9] w-full min-h-[190px] sm:min-h-[360px] md:min-h-[420px] border-none"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    </div>
                  ) : (
                    <div className="flex h-full min-h-[200px] sm:min-h-[300px] items-center justify-center bg-[#070b10] text-white rounded-[18px]">
                      <div className="text-center p-4">
                        <Play className="mx-auto h-8 w-8 sm:h-10 sm:w-10 text-emerald-400" />
                        <p className="mt-3 text-sm sm:text-base font-semibold">Tautan video belum valid atau tidak dikenali.</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 3. ISI NARASI BERITA (SELALU TAMPIL) */}
            {news.content && (
              <div className="prose prose-slate max-w-none">
                <div className="space-y-5 sm:space-y-6 text-slate-800">
                  {news.content
                    .split(/\n\s*\n+/)
                    .map((paragraph, index) => (
                      <p
                        key={`${news.id}-${index}`}
                        className="text-sm sm:text-base md:text-lg leading-relaxed text-left sm:text-justify whitespace-pre-wrap font-sans break-words text-stone-800"
                      >
                        {index === 0 && (
                          <span className="neu-pill text-xs font-black text-emerald-800 uppercase mr-2.5 px-2.5 py-1">
                            Sampeldes —
                          </span>
                        )}
                        {paragraph.trim()}
                      </p>
                    ))}
                </div>
              </div>
            )}

            {/* FOOTER ARTIKEL */}
            <footer className="mt-10 sm:mt-14 pt-6 border-t border-stone-300/80 flex flex-wrap gap-4 items-center justify-between">
              <button
                onClick={() => {
                  if (navigator.share) {
                    navigator.share({ title: news.title, url: window.location.href });
                  } else {
                    navigator.clipboard.writeText(window.location.href);
                    alert('Tautan berita berhasil disalin!');
                  }
                }}
                className="neu-btn px-5 py-2.5 rounded-full inline-flex items-center gap-2 font-bold text-xs uppercase tracking-wider text-slate-800 hover:text-emerald-800 transition-colors"
              >
                <Share2 className="h-4 w-4 text-emerald-700" />
                <span>Bagikan Berita</span>
              </button>
              <div className="neu-pill px-4 py-1.5 text-xs font-bold text-stone-600 uppercase tracking-widest">
                Redaksi Sampeldes Digital
              </div>
            </footer>

          </article>
        </div>
      </main>

      {/* FOOTER */}
      <Footer />
    </div>
  );
}
