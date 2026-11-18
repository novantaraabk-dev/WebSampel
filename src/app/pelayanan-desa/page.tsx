'use client';

import React, { useEffect, useMemo, useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Header } from '@/components/landing/Header';
import { Footer } from '@/components/landing/Footer';
import { BackgroundPattern } from '@/components/landing/BackgroundPattern';
import { Button } from '@/components/ui/button';
import { AgendaDesaPublicView } from '@/components/agenda/AgendaDesaPublicView';
import {
  FileText,
  Download,
  Eye,
  Star,
  ShieldCheck,
  CheckCircle2,
  BarChart,
  LibraryBig,
  Info,
  ChevronRight,
  ChevronDown,
  ExternalLink,
  Sparkles,
  ArrowRight,
  Calendar
} from 'lucide-react';
import { useCollection, useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, doc, query, where, orderBy } from 'firebase/firestore';
import { PelayananDoc } from '@/lib/types';
import {
  PELAYANAN_CONTENT_DOC,
  PELAYANAN_TAB_META,
  PelayananContent,
  getPelayananColor,
  getPelayananIcon,
  isExternalLink,
  mergePelayananContent,
  renderRichText,
} from '@/lib/pelayanan-content';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

/** Link yang otomatis membuka tab baru untuk alamat eksternal. */
function SmartLink({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) {
  if (isExternalLink(href)) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
        {children}
      </a>
    );
  }
  return (
    <Link href={href || '#'} className={className}>
      {children}
    </Link>
  );
}

export default function PelayananDesaPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#F8FAFC] dark:bg-[#060b11]" />}>
      <PelayananDesaContent />
    </Suspense>
  );
}

function PelayananDesaContent() {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState(tabParam || 'visi-misi');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const firestore = useFirestore();

  // Konten halaman yang dapat diatur dari /admin/pelayanan
  const contentRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, PELAYANAN_CONTENT_DOC.collection, PELAYANAN_CONTENT_DOC.id);
  }, [firestore]);
  const { data: storedContent } = useDoc<Partial<PelayananContent>>(contentRef, {
    realtime: true,
    suppressGlobalError: true,
  });
  const content = useMemo(() => mergePelayananContent(storedContent), [storedContent]);

  const tabs = useMemo(
    () =>
      PELAYANAN_TAB_META.filter((meta) => content.tabs[meta.id]?.visible !== false).map((meta) => ({
        ...meta,
        label: content.tabs[meta.id].label,
        description: content.tabs[meta.id].description,
      })),
    [content]
  );

  // Pastikan tab aktif selalu salah satu tab yang ditampilkan, atau dari tabParam URL
  useEffect(() => {
    if (tabParam && tabs.some((t) => t.id === tabParam)) {
      setActiveTab(tabParam);
      return;
    }
    if (tabs.length && !tabs.some((t) => t.id === activeTab)) {
      setActiveTab(tabs[0].id);
    }
  }, [tabs, activeTab, tabParam]);

  const docsQuery = useMemoFirebase(() => {
    if (!firestore || !activeTab) return null;
    return query(
      collection(firestore, 'pelayananDocs'),
      where('category', '==', activeTab),
      orderBy('createdAt', 'desc')
    );
  }, [firestore, activeTab]);

  const { data: docs, isLoading } = useCollection<PelayananDoc>(docsQuery);

  const handlePreview = (fileId: string) => {
    window.open(`https://drive.google.com/file/d/${fileId}/view`, '_blank');
  };

  const handleDownload = (fileId: string) => {
    window.open(`https://drive.google.com/uc?export=download&id=${fileId}`, '_blank');
  };

  const activeTabObj = tabs.find(t => t.id === activeTab) || tabs[0];
  const g = content.general;

  if (!activeTabObj) {
    return (
      <div className="relative flex min-h-screen flex-col bg-[#F8FAFC] dark:bg-[#060b11] text-slate-900 dark:text-slate-100 overflow-x-hidden font-sans transition-colors duration-300">
        <BackgroundPattern />
        <Header />
        <main className="relative flex-1 pt-28 pb-20 text-center text-stone-500 dark:text-stone-400 text-sm">
          Informasi pelayanan belum tersedia.
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen flex-col bg-[#F8FAFC] dark:bg-[#060b11] text-slate-900 dark:text-slate-100 overflow-x-hidden font-sans transition-colors duration-300">
      <BackgroundPattern />
      <Header />

      <main className="relative flex-1 pt-24 sm:pt-28 pb-16 sm:pb-24">
        {/* MAIN INTERACTIVE SECTION */}
        <section className="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8 pt-2 sm:pt-4">
          <div className="grid lg:grid-cols-12 gap-5 lg:gap-8 items-start">

            {/* SIDEBAR NAVIGATION */}
            <aside className="lg:col-span-3 lg:sticky lg:top-28 z-30 space-y-4">
              {/* Mobile Quick Navigation */}
              <div className="block lg:hidden w-full space-y-2.5">
                {/* Dropdown Selector for instant switching */}
                <div className="relative">
                  <button
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    className="w-full flex items-center justify-between neu-card-elevated text-slate-800 dark:text-white px-4 py-3 rounded-2xl font-semibold text-xs border border-white/60 dark:border-white/10 transition-colors"
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <div className="w-7 h-7 rounded-lg neu-inset text-emerald-800 dark:text-teal-400 flex items-center justify-center shrink-0">
                        <activeTabObj.icon className="h-4 w-4" />
                      </div>
                      <span className="font-bold text-slate-900 dark:text-white uppercase font-condensed tracking-wide truncate">
                        {activeTabObj.label}
                      </span>
                    </div>
                    <ChevronDown className={cn("h-4 w-4 text-stone-500 dark:text-stone-400 transition-transform duration-200 shrink-0", isMenuOpen && "rotate-180")} />
                  </button>

                  {isMenuOpen && (
                    <>
                      <div className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-xs" onClick={() => setIsMenuOpen(false)} />
                      <div className="absolute left-0 right-0 mt-2 z-50 neu-card-elevated border border-white/60 dark:border-white/10 rounded-2xl shadow-xl overflow-hidden py-1.5 divide-y divide-stone-200/50 dark:divide-white/10 animate-in fade-in slide-in-from-top-2 duration-200 max-h-80 overflow-y-auto">
                        {tabs.map((tab) => {
                          const isCurrent = activeTab === tab.id;
                          return (
                            <button
                              key={tab.id}
                              onClick={() => {
                                setActiveTab(tab.id);
                                setIsMenuOpen(false);
                              }}
                              className={cn(
                                "w-full flex items-center justify-between px-3.5 py-2.5 text-left transition-colors",
                                isCurrent ? "bg-emerald-800/10 dark:bg-emerald-500/20 text-emerald-900 dark:text-teal-400 font-bold" : "text-stone-700 dark:text-stone-300 hover:bg-stone-200/50 dark:hover:bg-white/5"
                              )}
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <tab.icon className={cn("h-4 w-4 shrink-0", isCurrent ? "text-emerald-800 dark:text-teal-400" : tab.color)} />
                                <div className="truncate">
                                  <div className="text-xs font-condensed font-bold uppercase tracking-wider truncate">{tab.label}</div>
                                  <div className="text-[10px] text-stone-500 dark:text-stone-400 font-normal truncate">{tab.description}</div>
                                </div>
                              </div>
                              {isCurrent && <CheckCircle2 className="h-4 w-4 text-emerald-700 dark:text-teal-400 shrink-0 ml-2" />}
                            </button>
                          );
                        })}
                      </div>
                    </>
                  )}
                </div>

                {/* Wrapped Chip Pills - Zero Horizontal Scroll on Mobile */}
                <div className="flex flex-wrap items-center gap-1.5 w-full pt-0.5">
                  {tabs.map((tab) => {
                    const isCurrent = activeTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => {
                          setActiveTab(tab.id);
                        }}
                        className={cn(
                          "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-condensed font-bold uppercase tracking-wider transition-all",
                          isCurrent
                            ? "neu-btn-dark text-emerald-400 font-bold shadow-xs"
                            : "neu-convex text-stone-700 dark:text-stone-300 hover:text-emerald-800 dark:hover:text-teal-400"
                        )}
                      >
                        <tab.icon className={cn("h-3 w-3 shrink-0", isCurrent ? "text-emerald-400" : tab.color)} />
                        <span>{tab.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Desktop Navigation List */}
              <div className="hidden lg:flex neu-card-elevated rounded-[28px] p-3 border border-white/60 dark:border-white/10 flex-col gap-1.5">
                <div className="px-3.5 py-2 text-[10px] font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400 border-b border-stone-300/70 dark:border-white/10 mb-1">
                  {g.sidebarTitle}
                </div>
                {tabs.map((tab) => {
                  const isCurrent = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => {
                        setActiveTab(tab.id);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className={cn(
                        "flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all duration-200 whitespace-nowrap w-full group text-left",
                        isCurrent
                          ? "neu-btn-dark text-emerald-400 shadow-sm font-bold"
                          : "neu-convex text-stone-700 dark:text-stone-300 hover:text-emerald-800 dark:hover:text-teal-400 font-medium"
                      )}
                    >
                      <tab.icon className={cn("h-4 w-4 transition-transform group-hover:scale-110 shrink-0", isCurrent ? "text-emerald-400" : tab.color)} />
                      <div className="flex-1 min-w-0">
                        <div className="font-condensed font-bold uppercase text-xs tracking-wider truncate">{tab.label}</div>
                        <div className={cn("text-[10px] truncate leading-tight", isCurrent ? "text-stone-300" : "text-stone-500 dark:text-stone-400")}>
                          {tab.description}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Quick Complaint Banner */}
              <div className="hidden lg:block p-5 neu-card-elevated rounded-[28px] relative overflow-hidden border border-white/60 dark:border-white/10">
                <div className="relative z-10 space-y-2.5">
                  <div className="inline-flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-600 dark:bg-teal-400" />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-800 dark:text-teal-400">{g.helpEyebrow}</span>
                  </div>
                  <h4 className="text-sm sm:text-base font-condensed font-bold uppercase tracking-tight text-slate-900 dark:text-white">
                    {g.helpTitle}
                  </h4>
                  <p className="text-[11px] text-stone-600 dark:text-stone-300 leading-relaxed font-normal">
                    {g.helpDescription}
                  </p>
                  <Button
                    size="sm"
                    className="neu-btn-dark font-bold uppercase tracking-wider text-[10px] w-full h-9 rounded-full mt-2"
                    asChild
                  >
                    <SmartLink href={g.helpButtonLink}>{g.helpButtonText}</SmartLink>
                  </Button>
                </div>
              </div>
            </aside>

            {/* CONTENT AREA */}
            <main className="lg:col-span-9 space-y-6 sm:space-y-8 animate-in fade-in slide-in-from-bottom-3 duration-500">
              {/* Category Title Header on Content */}
              <div className="neu-card-elevated rounded-[28px] p-5 sm:p-7 border border-white/60 dark:border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl neu-inset text-emerald-800 dark:text-teal-400 flex items-center justify-center shrink-0">
                    <activeTabObj.icon className="h-6 w-6" />
                  </div>
                  <div>
                    <h2 className="text-xl sm:text-2xl font-condensed font-black uppercase tracking-tight text-slate-900 dark:text-white">
                      {activeTabObj.label}
                    </h2>
                    <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-300">
                      {activeTabObj.description}
                    </p>
                  </div>
                </div>
                {g.badgeText && (
                  <span className="neu-pill text-[10px] uppercase font-extrabold tracking-wider px-3.5 py-1 text-emerald-800 dark:text-teal-400">
                    {g.badgeText}
                  </span>
                )}
              </div>

              {/* TAB SPECIFIC CONTENT */}
              <CategoryContent categoryId={activeTab} docs={docs} isLoading={isLoading} content={content} />

              {/* DOCUMENT TABLE SECTION (ATTACHMENTS) */}
              {!(activeTab === 'visi-misi' || activeTab === 'maklumat' || activeTab === 'pojok-baca' || activeTab === 'agenda-desa') && (
                <div className="neu-card-elevated rounded-[28px] border border-white/60 dark:border-white/10 overflow-hidden">
                  <div className="p-4 sm:p-6 border-b border-stone-300/80 dark:border-white/10 bg-stone-100/40 dark:bg-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <h3 className="text-sm sm:text-base font-condensed font-black uppercase tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
                        <FileText className="h-4 w-4 text-emerald-800 dark:text-teal-400" />
                        {g.attachmentTitlePrefix} {activeTabObj.label}
                      </h3>
                      <p className="text-xs text-stone-500 dark:text-stone-400 font-medium">
                        {g.attachmentDescription}
                      </p>
                    </div>
                  </div>
                  <div>
                    {/* Desktop Table View */}
                    <div className="hidden md:block overflow-x-auto">
                      <Table>
                        <TableHeader className="bg-stone-200/50 dark:bg-white/5">
                          <TableRow className="border-b border-stone-200/50 dark:border-white/10">
                            <TableHead className="pl-6 h-11 font-bold uppercase text-[10px] tracking-wider text-stone-600 dark:text-stone-300">Nama Dokumen</TableHead>
                            <TableHead className="h-11 font-bold uppercase text-[10px] tracking-wider text-stone-600 dark:text-stone-300">Format</TableHead>
                            <TableHead className="text-right pr-6 h-11 font-bold uppercase text-[10px] tracking-wider text-stone-600 dark:text-stone-300">Aksi</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {isLoading ? (
                            Array.from({ length: 3 }).map((_, i) => (
                              <TableRow key={i}>
                                <TableCell colSpan={3} className="px-6 py-4">
                                  <Skeleton className="h-9 w-full rounded-xl bg-stone-300/60 dark:bg-slate-800/60" />
                                </TableCell>
                              </TableRow>
                            ))
                          ) : docs?.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={3} className="h-28 text-center text-stone-500 dark:text-stone-400 italic text-xs">
                                {g.attachmentEmptyText}
                              </TableCell>
                            </TableRow>
                          ) : (
                            docs?.map((doc) => (
                              <TableRow key={doc.id} className="hover:bg-stone-100/60 dark:hover:bg-white/5 border-b border-stone-200/50 dark:border-white/5 transition-colors group">
                                <TableCell className="pl-6 py-3.5">
                                  <div className="flex items-center gap-3">
                                    <div className="p-2 neu-inset text-red-600 rounded-xl group-hover:scale-105 transition-all">
                                      <FileText className="h-4 w-4" />
                                    </div>
                                    <span className="font-bold text-slate-800 dark:text-slate-100 uppercase text-xs sm:text-sm">{doc.title}</span>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <span className="neu-pill text-[9px] font-extrabold uppercase tracking-wider px-2.5 py-0.5">PDF</span>
                                </TableCell>
                                <TableCell className="text-right pr-6">
                                  <div className="flex justify-end gap-2">
                                    <button
                                      className="neu-btn h-8 px-4 rounded-full text-xs font-bold inline-flex items-center gap-1.5 text-stone-700 dark:text-stone-200 hover:text-emerald-800 dark:hover:text-teal-400"
                                      onClick={() => handlePreview(doc.fileId)}
                                    >
                                      <Eye className="h-3.5 w-3.5 text-emerald-700 dark:text-teal-400" />
                                      Pratinjau
                                    </button>
                                    <button
                                      className="neu-btn-dark h-8 px-4 rounded-full text-xs font-bold inline-flex items-center gap-1.5"
                                      onClick={() => handleDownload(doc.fileId)}
                                    >
                                      <Download className="h-3.5 w-3.5 text-emerald-400" />
                                      Unduh
                                    </button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </div>

                    {/* Mobile Card List View */}
                    <div className="block md:hidden p-3 space-y-3">
                      {isLoading ? (
                        Array.from({ length: 3 }).map((_, i) => (
                          <div key={i} className="p-4">
                            <Skeleton className="h-14 w-full rounded-2xl bg-stone-300/60 dark:bg-slate-800/60" />
                          </div>
                        ))
                      ) : docs?.length === 0 ? (
                        <div className="p-6 text-center text-stone-500 dark:text-stone-400 italic text-xs">
                          {g.attachmentEmptyText}
                        </div>
                      ) : (
                        docs?.map((doc) => (
                          <div key={doc.id} className="neu-card-elevated rounded-2xl p-4 space-y-3 border border-white/60 dark:border-white/10">
                            <div className="flex items-start gap-3">
                              <div className="p-2 neu-inset text-red-600 rounded-xl shrink-0 mt-0.5">
                                <FileText className="h-4 w-4" />
                              </div>
                              <div className="space-y-1 min-w-0 flex-1">
                                <span className="font-bold text-slate-900 dark:text-white uppercase text-xs block leading-snug">
                                  {doc.title}
                                </span>
                                <span className="neu-pill text-[8px] font-bold uppercase tracking-wider px-2 py-0.5 inline-block">
                                  PDF Dokumen
                                </span>
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-2 pt-1">
                              <button
                                className="neu-btn h-8 rounded-full font-bold text-xs inline-flex items-center justify-center gap-1.5 text-stone-700 dark:text-stone-200"
                                onClick={() => handlePreview(doc.fileId)}
                              >
                                <Eye className="h-3.5 w-3.5 text-emerald-700 dark:text-teal-400" />
                                Pratinjau
                              </button>
                              <button
                                className="neu-btn-dark h-8 rounded-full font-bold text-xs inline-flex items-center justify-center gap-1.5 text-white"
                                onClick={() => handleDownload(doc.fileId)}
                              >
                                <Download className="h-3.5 w-3.5 text-emerald-400" />
                                Unduh
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              )}
            </main>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

// ---------------------------------------------------------------------------
// SUB-COMPONENT: CATEGORY CONTENT
// ---------------------------------------------------------------------------

function CategoryContent({
  categoryId,
  docs,
  isLoading,
  content,
}: {
  categoryId: string;
  docs: PelayananDoc[] | null | undefined;
  isLoading: boolean;
  content: PelayananContent;
}) {
  const hasDocs = docs && docs.length > 0;

  switch (categoryId) {
    case 'visi-misi': {
      const c = content.visiMisi;
      if (hasDocs) {
        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-6">
            {docs.map((docItem) => (
              <Card key={docItem.id} className="neu-card-elevated rounded-[28px] overflow-hidden border border-white/80 dark:border-white/10 p-3.5 sm:p-5 flex flex-col justify-between">
                <div className="relative aspect-video w-full neu-inset rounded-2xl overflow-hidden mb-2.5 sm:mb-3 border border-stone-300/40 dark:border-white/10 p-2 flex items-center justify-center">
                  <img src={docItem.fileId} alt={docItem.title} className="w-full h-full object-contain" />
                </div>
                <div className="text-center pt-1">
                  <h3 className="text-xs sm:text-sm font-condensed font-bold uppercase text-slate-900 dark:text-white tracking-tight leading-tight">{docItem.title}</h3>
                </div>
              </Card>
            ))}
          </div>
        );
      }
      const misiItems = c.misiItems.filter((m) => m.trim());
      return (
        <div className="space-y-4 sm:space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            <Card className="neu-card-elevated-dark rounded-[28px] border border-white/10 overflow-hidden text-white">
              <CardHeader className="p-4 sm:p-7 pb-2 sm:pb-3">
                <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-white/10 text-teal-400 flex items-center justify-center mb-2 sm:mb-3">
                  <Star className="h-4 w-4 sm:h-5 sm:w-5" />
                </div>
                <CardTitle className="text-base sm:text-xl font-condensed font-bold uppercase tracking-tight text-white">
                  {c.visiTitle}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-7 pt-0">
                <p className="text-xs sm:text-base font-medium leading-relaxed text-slate-200">
                  &ldquo;{renderRichText(c.visiText)}&rdquo;
                </p>
              </CardContent>
            </Card>

            <Card className="neu-card-elevated rounded-[28px] border border-white/80 dark:border-white/10 overflow-hidden">
              <CardHeader className="p-4 sm:p-7 pb-2 sm:pb-3">
                <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl neu-inset text-emerald-800 dark:text-teal-400 flex items-center justify-center mb-2 sm:mb-3">
                  <ShieldCheck className="h-4 w-4 sm:h-5 sm:w-5" />
                </div>
                <CardTitle className="text-base sm:text-xl font-condensed font-bold uppercase tracking-tight text-slate-900 dark:text-white">
                  {c.motoTitle}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-7 pt-0">
                <p className="text-sm sm:text-lg font-condensed font-bold text-emerald-800 dark:text-teal-400 uppercase tracking-tight">
                  &ldquo;{c.motoText}&rdquo;
                </p>
                {c.motoSubtext && (
                  <p className="text-xs text-stone-600 dark:text-stone-300 mt-1.5 leading-normal">
                    {c.motoSubtext}
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          {misiItems.length > 0 && (
            <Card className="neu-card-elevated rounded-[28px] border border-white/80 dark:border-white/10 p-4 sm:p-7 space-y-4">
              <div className="flex items-center gap-2 border-l-4 border-emerald-700 dark:border-teal-400 pl-3">
                <h3 className="text-sm sm:text-lg font-condensed font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                  {misiItems.length} {c.misiTitle}
                </h3>
              </div>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3.5">
                {misiItems.map((misi, i) => (
                  <li key={i} className="flex items-start gap-2.5 p-3 sm:p-3.5 neu-inset rounded-2xl border border-stone-300/40 dark:border-white/10 text-xs sm:text-sm font-medium text-slate-800 dark:text-slate-200">
                    <div className="h-5 w-5 rounded-full neu-btn-dark text-teal-400 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                      {i + 1}
                    </div>
                    <span className="leading-snug pt-0.5">{renderRichText(misi)}</span>
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>
      );
    }

    case 'maklumat': {
      const c = content.maklumat;
      if (hasDocs) {
        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-6 justify-center">
            {docs.map((docItem) => (
              <Card key={docItem.id} className="neu-card-elevated rounded-[28px] overflow-hidden border border-white/80 dark:border-white/10 p-3.5 sm:p-5 max-w-xl mx-auto flex flex-col justify-between">
                <div className="relative aspect-video w-full neu-inset rounded-2xl overflow-hidden mb-2.5 sm:mb-3 border border-stone-300/40 dark:border-white/10 p-2 flex items-center justify-center">
                  <img src={docItem.fileId} alt={docItem.title} className="w-full h-full object-contain" />
                </div>
                <div className="text-center pt-1">
                  <h3 className="text-xs sm:text-sm font-condensed font-bold uppercase text-slate-900 dark:text-white tracking-tight leading-tight">{docItem.title}</h3>
                </div>
              </Card>
            ))}
          </div>
        );
      }
      return (
        <Card className="neu-card-elevated rounded-[28px] border border-white/80 dark:border-white/10 overflow-hidden">
          <CardContent className="p-5 sm:p-10 space-y-4 sm:space-y-6 text-center max-w-2xl mx-auto">
            <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl neu-inset text-emerald-800 dark:text-teal-400 flex items-center justify-center mx-auto">
              <ShieldCheck className="h-6 w-6 sm:h-8 sm:w-8" />
            </div>
            <h2 className="text-lg sm:text-3xl font-condensed font-bold uppercase tracking-tight text-slate-900 dark:text-white">
              {c.title}
            </h2>
            <div className="space-y-3 text-xs sm:text-base neu-inset p-4 sm:p-7 rounded-2xl border border-stone-300/40 dark:border-white/10 text-slate-700 dark:text-slate-200 leading-relaxed">
              {c.paragraph1 && (
                <p className="font-serif italic text-slate-900 dark:text-slate-100 text-xs sm:text-base">
                  &ldquo;{renderRichText(c.paragraph1)}&rdquo;
                </p>
              )}
              {c.paragraph2 && (
                <p className="text-[11px] sm:text-sm text-slate-600 dark:text-slate-300 font-medium">
                  &ldquo;{renderRichText(c.paragraph2)}&rdquo;
                </p>
              )}
            </div>
            <div className="pt-2">
              <p className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-slate-600 dark:text-slate-300">
                {c.signatory}
              </p>
              <p className="text-[10px] sm:text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">{c.location}</p>
            </div>
          </CardContent>
        </Card>
      );
    }

    case 'standar': {
      const c = content.standar;
      return (
        <div className="space-y-4 sm:space-y-6">
          {(c.noticeTitle || c.noticeText) && (
            <div className="neu-card-elevated rounded-[28px] border border-amber-500/30 p-4 sm:p-6 flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-3 sm:gap-5">
              <div className="p-2.5 sm:p-3 neu-inset rounded-xl text-amber-700 dark:text-amber-400 shrink-0">
                <Info className="h-5 w-5 sm:h-6 sm:w-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-xs sm:text-base font-condensed font-bold uppercase text-slate-950 dark:text-white">
                  {c.noticeTitle}
                </h3>
                <p className="text-[11px] sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                  {renderRichText(c.noticeText)}
                </p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            {c.items.map((item, i) => (
              <Card key={i} className="neu-card-elevated rounded-2xl border border-white/80 dark:border-white/10 p-4 sm:p-5 space-y-2.5 hover:border-emerald-500/50 dark:hover:border-emerald-500/40 transition-all">
                <div className="flex items-start justify-between gap-2 border-b border-stone-200/60 dark:border-white/10 pb-2">
                  <h4 className="text-xs sm:text-sm font-condensed font-bold uppercase text-slate-900 dark:text-white leading-tight">
                    {item.title}
                  </h4>
                  {item.badge && (
                    <span className="neu-pill text-[8px] font-bold uppercase tracking-wider shrink-0 px-2.5 py-0.5">
                      {item.badge}
                    </span>
                  )}
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-stone-500 dark:text-stone-400 font-bold uppercase text-[9px]">{c.durationLabel}:</span>
                  <span className="neu-inset text-emerald-800 dark:text-teal-400 px-2.5 py-1 rounded-full text-[10px] sm:text-[11px] font-bold">{item.time}</span>
                </div>
                <div className="space-y-1 text-xs">
                  <span className="text-stone-500 dark:text-stone-400 font-bold uppercase text-[9px]">{c.requirementLabel}:</span>
                  <p className="text-[10px] sm:text-[11px] text-slate-700 dark:text-slate-300 leading-snug">{renderRichText(item.req)}</p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      );
    }

    case 'jenis': {
      const c = content.jenis;
      return (
        <div className="space-y-4 sm:space-y-6">
          <div className="neu-card-elevated rounded-[28px] p-4 sm:p-6 border border-white/80 dark:border-white/10 flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left justify-between gap-3 sm:gap-4">
            <div className="space-y-1">
              <h3 className="text-xs sm:text-base font-condensed font-bold uppercase text-slate-900 dark:text-white">
                {c.headerTitle}
              </h3>
              <p className="text-[11px] sm:text-xs text-stone-600 dark:text-stone-300">
                {c.headerDescription}
              </p>
            </div>
            {c.buttonText && (
              <Button asChild size="sm" className="neu-btn-dark font-bold text-xs uppercase tracking-wider rounded-full px-5 h-9 shrink-0 text-teal-400">
                <SmartLink href={c.buttonLink}>
                  {c.buttonText} <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                </SmartLink>
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
            {c.items.map((srv, idx) => {
              const Icon = getPelayananIcon(srv.icon);
              return (
                <Card key={idx} className="neu-card-elevated rounded-2xl border border-white/80 dark:border-white/10 p-3.5 sm:p-4 space-y-2 hover:border-emerald-500/50 dark:hover:border-emerald-500/40 transition-all flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl neu-inset text-emerald-800 dark:text-teal-400 flex items-center justify-center shrink-0">
                        <Icon className="h-4 w-4" />
                      </div>
                      <h4 className="text-xs sm:text-sm font-condensed font-bold uppercase text-slate-900 dark:text-white leading-tight">
                        {srv.type}
                      </h4>
                    </div>
                    <p className="text-[10px] sm:text-[11px] text-stone-600 dark:text-stone-300 leading-snug">
                      {srv.desc}
                    </p>
                  </div>
                  <div className="pt-2 border-t border-stone-200/60 dark:border-white/10 flex items-center justify-between">
                    <span className="neu-inset text-[9px] sm:text-[10px] font-bold text-emerald-700 dark:text-emerald-400 px-2.5 py-0.5 rounded-full">{c.feeLabel}</span>
                    <SmartLink href={c.buttonLink} className="text-[10px] sm:text-[11px] font-bold text-emerald-800 dark:text-teal-400 hover:underline inline-flex items-center gap-1">
                      {c.applyLabel} <ChevronRight className="h-3 w-3" />
                    </SmartLink>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      );
    }

    case 'sop': {
      const c = content.sop;
      const cols = Math.min(Math.max(c.steps.length, 1), 4);
      return (
        <div className="space-y-4 sm:space-y-6">
          <Card className="neu-card-elevated rounded-[28px] border border-white/80 dark:border-white/10 p-4 sm:p-7 space-y-4 sm:space-y-6">
            <div className="text-center space-y-1">
              <h3 className="text-sm sm:text-xl font-condensed font-bold uppercase text-slate-900 dark:text-white">
                {c.title}
              </h3>
              <p className="text-[11px] sm:text-xs text-stone-500 dark:text-stone-400">
                {c.description}
              </p>
            </div>

            <div
              className={cn(
                "grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 relative",
                cols === 3 && "md:grid-cols-3",
                cols === 4 && "md:grid-cols-4"
              )}
            >
              {c.steps.map((step, i) => {
                const Icon = getPelayananIcon(step.icon);
                return (
                  <div key={i} className="flex flex-col items-center text-center p-3.5 sm:p-4.5 rounded-2xl neu-inset border border-stone-300/40 dark:border-white/10 space-y-2 relative z-10">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl neu-btn-dark text-teal-400 flex items-center justify-center shadow-xs">
                      <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
                    </div>
                    <h4 className="font-condensed font-bold text-xs sm:text-sm uppercase text-slate-900 dark:text-white">{i + 1}. {step.label}</h4>
                    <p className="text-[10px] sm:text-[11px] text-stone-600 dark:text-stone-300 leading-snug">{step.desc}</p>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      );
    }

    case 'ikm': {
      const c = content.ikm;
      return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          <Card className="neu-card-elevated-dark md:col-span-1 rounded-[28px] text-white p-5 sm:p-8 flex flex-col items-center justify-center text-center space-y-3 sm:space-y-4 border border-white/10">
            <div className="w-11 h-11 sm:w-13 sm:h-13 rounded-2xl bg-white/10 text-teal-400 flex items-center justify-center">
              <BarChart className="h-5 w-5 sm:h-6 sm:w-6" />
            </div>
            <div>
              <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-stone-300">{c.scoreLabel}</p>
              <h3 className="text-3xl sm:text-5xl font-condensed font-bold text-teal-400 tracking-tight mt-1">{c.score}</h3>
            </div>
            {c.gradeBadge && (
              <span className="neu-pill bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 font-bold px-3 py-1 rounded-full text-[9px] sm:text-[10px] uppercase tracking-wider">
                {c.gradeBadge}
              </span>
            )}
          </Card>

          <Card className="neu-card-elevated md:col-span-2 rounded-[28px] border border-white/80 dark:border-white/10 p-5 sm:p-7 flex flex-col justify-center space-y-3">
            <h4 className="font-condensed font-bold uppercase text-xs sm:text-sm flex items-center gap-2 text-slate-900 dark:text-white">
              <Info className="h-4 w-4 text-emerald-700 dark:text-emerald-400 shrink-0" />
              {c.reportTitle}
            </h4>
            <p className="text-[11px] sm:text-sm text-stone-700 dark:text-stone-300 leading-relaxed">
              {renderRichText(c.reportText)}
            </p>
            {c.stats.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-2 border-t border-stone-200/60 dark:border-white/10">
                {c.stats.map((stat, i) => (
                  <div
                    key={i}
                    className={cn(
                      "p-2.5 sm:p-3 rounded-2xl neu-inset border border-stone-300/40 dark:border-white/10 text-center",
                      c.stats.length % 2 === 1 && i === c.stats.length - 1 && "col-span-2 sm:col-span-1"
                    )}
                  >
                    <div className={cn("text-sm sm:text-base font-condensed font-bold", i === c.stats.length - 1 ? "text-emerald-700 dark:text-emerald-400" : "text-slate-900 dark:text-white")}>
                      {stat.value}
                    </div>
                    <div className="text-[8px] sm:text-[9px] text-stone-500 dark:text-stone-400 uppercase font-semibold">{stat.label}</div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      );
    }

    case 'survey': {
      const c = content.survey;
      return (
        <Card className="neu-card-elevated rounded-[28px] border border-emerald-500/40 p-5 sm:p-8 flex flex-col md:flex-row items-center gap-4 sm:gap-6">
          <div className="flex-1 space-y-2 text-center md:text-left">
            <span className="neu-pill inline-flex items-center gap-1.5 text-emerald-800 dark:text-emerald-400 text-[10px] sm:text-xs font-bold uppercase tracking-wider px-3 py-1">
              <Sparkles className="h-3.5 w-3.5 text-emerald-700 dark:text-emerald-400" /> {c.eyebrow}
            </span>
            <h3 className="text-base sm:text-2xl font-condensed font-bold uppercase text-slate-900 dark:text-white">
              {c.title}
            </h3>
            <p className="text-[11px] sm:text-sm text-stone-700 dark:text-stone-300 leading-relaxed">
              {renderRichText(c.description)}
            </p>
          </div>
          {c.buttonText && c.buttonLink && (
            <Button
              size="lg"
              className="neu-btn-dark w-full md:w-auto rounded-full font-bold uppercase tracking-wider px-6 h-10 shadow-xs justify-center shrink-0 text-xs text-teal-400"
              asChild
            >
              <SmartLink href={c.buttonLink}>
                {c.buttonText} <ExternalLink className="ml-2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-teal-400" />
              </SmartLink>
            </Button>
          )}
        </Card>
      );
    }

    case 'pojok-baca': {
      const c = content.pojokBaca;
      return (
        <div className="space-y-4 sm:space-y-6">
          {(c.bannerTitle || c.bannerButtonLink) && (
            <div className="neu-card-elevated-dark p-5 sm:p-7 text-white rounded-[28px] border border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-teal-400">
                  <LibraryBig className="h-3.5 w-3.5" /> Koleksi &amp; Regulasi
                </div>
                <h3 className="text-base sm:text-xl font-condensed font-bold uppercase tracking-tight text-white">
                  {c.bannerTitle}
                </h3>
                {c.bannerDescription && (
                  <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
                    {c.bannerDescription}
                  </p>
                )}
              </div>
              {c.bannerButtonText && c.bannerButtonLink && (
                <Button asChild size="sm" className="neu-btn bg-teal-500 hover:bg-teal-600 text-slate-950 font-bold uppercase tracking-wider text-xs rounded-full px-5 h-9 shrink-0">
                  <SmartLink href={c.bannerButtonLink}>
                    {c.bannerButtonText} <ExternalLink className="ml-1.5 h-3.5 w-3.5" />
                  </SmartLink>
                </Button>
              )}
            </div>
          )}

          {hasDocs ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
              {docs.map((docItem) => {
                const targetUrl = docItem.link || (docItem.fileId.startsWith('http') ? docItem.fileId : `https://drive.google.com/file/d/${docItem.fileId}/view`);
                const cardContent = (
                  <Card className="neu-card-elevated rounded-2xl overflow-hidden border border-white/80 dark:border-white/10 hover:border-emerald-500/50 dark:hover:border-teal-400/50 transition-all p-3.5 cursor-pointer group h-full flex flex-col justify-between">
                    <div className="relative aspect-[3/4] w-full neu-inset rounded-xl overflow-hidden mb-3 border border-stone-300/40 dark:border-white/10 p-1.5">
                      <img src={docItem.fileId} alt={docItem.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                    </div>
                    <div className="p-1 text-center">
                      <h3 className="text-xs sm:text-sm font-condensed font-bold uppercase text-slate-900 dark:text-white tracking-tight leading-tight line-clamp-2">{docItem.title}</h3>
                      <p className="text-xs text-emerald-800 dark:text-teal-400 font-bold mt-2 flex items-center justify-center gap-1">
                        Buka Dokumen <ChevronRight className="h-3 w-3" />
                      </p>
                    </div>
                  </Card>
                );

                return (
                  <a key={docItem.id} href={targetUrl} target="_blank" rel="noopener noreferrer" className="block h-full">
                    {cardContent}
                  </a>
                );
              })}
            </div>
          ) : (
            <div className="neu-inset p-6 sm:p-8 rounded-[28px] border border-stone-300/40 dark:border-white/15 text-center space-y-2">
              <LibraryBig className="h-8 w-8 text-stone-400 dark:text-stone-500 mx-auto" />
              <p className="text-stone-600 dark:text-stone-400 font-bold uppercase text-xs tracking-wider">{c.emptyText}</p>
            </div>
          )}
        </div>
      );
    }

    case 'agenda-desa': {
      return (
        <div className="space-y-6">
          <AgendaDesaPublicView />
        </div>
      );
    }

    default:
      return (
        <div className="neu-inset p-6 sm:p-8 rounded-[28px] border border-stone-300/40 dark:border-white/15 text-center space-y-2">
          <Info className="h-8 w-8 text-stone-400 dark:text-stone-500 mx-auto" />
          <p className="text-stone-600 dark:text-stone-400 font-bold uppercase text-xs tracking-wider">Pilih kategori di atas untuk melihat detail informasi.</p>
        </div>
      );
  }
}