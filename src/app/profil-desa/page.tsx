'use client';

import React, { useState, useMemo, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Logo } from '@/components/logo';
import { Header } from '@/components/landing/Header';
import { Footer } from '@/components/landing/Footer';
import { BackgroundPattern } from '@/components/landing/BackgroundPattern';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  ArrowLeft,
  User,
  Users,
  History,
  Map as MapIcon,
  Milestone,
  Zap,
  Image as ImageIcon,
  PlayCircle,
  MapPin,
  ChevronRight,
  ChevronDown,
  ShieldCheck,
  Landmark,
  UserCircle2,
  Calendar,
  Compass,
  ArrowRight,
  CheckCircle2,
  TrendingUp,
  Activity,
  Heart,
  GraduationCap,
  Stethoscope,
  Sprout,
  Store,
  Target,
  ShieldAlert,
  HeartHandshake,
  Sparkles,
  Trees,
  Laptop,
  Check,
  Building2,
  Scale,
  BookOpen,
  FileText,
  AlertCircle,
  Info,
  School,
  Play,
  Table as TableIcon,
  LayoutGrid,
  Maximize2,
  X,
  Search,
  AlertTriangle,
  Loader2
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useCollection, useFirestore, useMemoFirebase, useDoc } from '@/firebase';
import { collection, query, orderBy, doc } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { VillageMap } from '@/components/village-map';
import { JalanKabupatenItem, JalanDesaItem } from '@/lib/types';
import { RawanBencanaPublicTab } from './_components/rawan-bencana-public-tab';

type Official = {
  id: string;
  name: string;
  position: string;
  imageUrl?: string;
  category: 'perangkat' | 'bpd' | 'rtrw' | 'linmas' | 'posyandu';
};

function ProfilDesaContent() {
  const searchParams = useSearchParams();
  const tabParam = searchParams?.get('tab');
  const [activeTab, setActiveTab] = useState(tabParam || 'sambutan');
  const firestore = useFirestore();

  useEffect(() => {
    if (tabParam) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  // Data for Kenali Kami (Tab 2)
  const officialsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'officials'), orderBy('name', 'asc'));
  }, [firestore]);

  const { data: officials, isLoading: isLoadingOfficials } = useCollection<Official>(officialsQuery);

  // Get news data for Dokumentasi Kegiatan (Tab 7 - Galeri)
  const newsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'news'), orderBy('updatedAt', 'desc'));
  }, [firestore]);

  const { data: newsData, isLoading: isLoadingNews } = useCollection<any>(newsQuery);

  // Get village profile data for video URL and editorial content
  const profileRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, 'villageProfile', 'default');
  }, [firestore]);

  const { data: profileData } = useDoc<any>(profileRef);

  // Data for Jalan Kabupaten (Tab 7)
  const jalanKabQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'jalanKabupaten'), orderBy('noRuas', 'asc'));
  }, [firestore]);
  const { data: jalanKabList, isLoading: isLoadingJalanKab } = useCollection<JalanKabupatenItem>(jalanKabQuery);

  // Data for Jalan Desa (Tab 8)
  const jalanDesaQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'jalanDesa'), orderBy('no', 'asc'));
  }, [firestore]);
  const { data: jalanDesaList, isLoading: isLoadingJalanDesa } = useCollection<JalanDesaItem>(jalanDesaQuery);

  const getYoutubeEmbedUrl = (url: string | undefined) => {
    if (!url) return null;
    const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|v\/|shorts\/))([\w-]{11})/);
    const videoId = match ? match[1] : url;
    return `https://www.youtube.com/embed/${videoId}`;
  };

  const youtubeEmbedUrl = getYoutubeEmbedUrl(profileData?.youtubeVideoUrl);

  const processedOfficials = useMemo(() => {
    if (!officials) return { perangkat: [], bpd: [], rtrwGroups: [], linmas: [], posyandu: [] };

    const getPerangkatRank = (pos: string) => {
      const p = pos.toLowerCase();
      if (p.includes('staf') || p.includes('staff')) return 5;
      if (p.includes('kepala desa') || p.includes('kades')) return 1;
      if (p.includes('sekretaris') || p.includes('sekdes')) return 2;
      if (p.includes('kasi') || p.includes('kaur')) return 3;
      if (p.includes('kadus') || p.includes('kepala dusun')) return 4;
      return 6;
    };

    const perangkat = officials
      .filter(o => o.category === 'perangkat')
      .sort((a, b) => getPerangkatRank(a.position) - getPerangkatRank(b.position));

    const bpd = officials
      .filter(o => o.category === 'bpd')
      .sort((a, b) => {
        if (a.position.toLowerCase().includes('ketua') && !b.position.toLowerCase().includes('ketua')) return -1;
        if (!a.position.toLowerCase().includes('ketua') && b.position.toLowerCase().includes('ketua')) return 1;
        return a.name.localeCompare(b.name);
      });

    const rtrwRaw = officials.filter(o => o.category === 'rtrw');
    const rwGroups: Record<string, Official[]> = {};

    rtrwRaw.forEach(item => {
      const rwMatch = item.position.match(/RW\s?(\d+)/i);
      const rwNum = rwMatch ? rwMatch[1].padStart(2, '0') : '99';
      if (!rwGroups[rwNum]) rwGroups[rwNum] = [];
      rwGroups[rwNum].push(item);
    });

    const sortedRwKeys = Object.keys(rwGroups).sort();
    const rtrwGroups = sortedRwKeys.map(key => {
      return {
        rwLabel: `Wilayah RW ${key}`,
        members: rwGroups[key].sort((a, b) => {
          if (a.position.toLowerCase().includes('ketua rw') && !b.position.toLowerCase().includes('ketua rw')) return -1;
          if (!a.position.toLowerCase().includes('ketua rw') && b.position.toLowerCase().includes('ketua rw')) return 1;
          const rtA = a.position.match(/RT\s?(\d+)/i)?.[1] || '0';
          const rtB = b.position.match(/RT\s?(\d+)/i)?.[1] || '0';
          return parseInt(rtA) - parseInt(rtB);
        })
      };
    });

    const linmas = officials
      .filter(o => o.category === 'linmas')
      .sort((a, b) => {
        const getLinmasRank = (pos: string) => {
          const p = pos.toLowerCase();
          if (p.includes('danton') || p.includes('komandan pleton') || p.includes('kepala')) return 1;
          if (p.includes('danru') || p.includes('komandan regu') || p.includes('wakil')) return 2;
          return 3;
        };
        const rankDiff = getLinmasRank(a.position) - getLinmasRank(b.position);
        if (rankDiff !== 0) return rankDiff;
        return a.name.localeCompare(b.name);
      });

    const posyandu = officials
      .filter(o => o.category === 'posyandu')
      .sort((a, b) => {
        const getPosyanduRank = (pos: string) => {
          const p = pos.toLowerCase();
          if (p.includes('ketua') || p.includes('koordinator')) return 1;
          if (p.includes('sekretaris')) return 2;
          if (p.includes('bendahara')) return 3;
          return 4;
        };
        const rankDiff = getPosyanduRank(a.position) - getPosyanduRank(b.position);
        if (rankDiff !== 0) return rankDiff;
        return a.name.localeCompare(b.name);
      });

    return { perangkat, bpd, rtrwGroups, linmas, posyandu };
  }, [officials]);

  const tabs = [
    { id: 'sambutan', label: 'Profil & Sambutan', icon: User },
    { id: 'kenali', label: 'Kenali Kami', icon: Users },
    { id: 'sejarah', label: 'Sejarah Desa', icon: History },
    { id: 'peta', label: 'Peta & Batas', icon: MapIcon },
    { id: 'wilayah', label: 'Data Wilayah', icon: Milestone },
    { id: 'potensi', label: 'Potensi Unggulan', icon: Zap },
    { id: 'jalan-kabupaten', label: 'Jalan Kabupaten', icon: Milestone },
    { id: 'jalan-desa', label: 'Jalan Desa', icon: MapPin },
    { id: 'rawan-bencana', label: 'RAWAN BENCANA & EVAKUASI', icon: AlertTriangle },
    { id: 'galeri', label: 'Galeri Media', icon: ImageIcon },
  ];

  const activeTabObj = tabs.find(t => t.id === activeTab) || tabs[0];

  return (
    <div className="relative flex flex-col min-h-screen bg-[#F8FAFC] dark:bg-[#060b11] text-slate-900 dark:text-slate-100 font-sans overflow-x-hidden w-full">
      <BackgroundPattern />
      <Header />

      <main className="relative flex-1 pt-24 sm:pt-28 pb-16 sm:pb-24">
        <div className="container mx-auto px-2.5 sm:px-4 py-4 sm:py-6 md:py-8 max-w-7xl">
          <div className="grid lg:grid-cols-12 gap-5 lg:gap-8 items-start">

            {/* SIDEBAR NAVIGATION (Desktop) / TOP CONTROLS (Mobile) */}
            <aside className="lg:col-span-3 lg:sticky lg:top-28 z-40">
              {/* Desktop Navigation List */}
              <div className="hidden lg:flex neu-card-elevated rounded-[28px] p-3 border border-white/60 flex-col gap-1.5">
                <div className="px-3.5 py-2 text-[10px] font-bold uppercase tracking-wider text-stone-500 border-b border-stone-300/70 mb-1">
                  Menu Profil Desa
                </div>
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setActiveTab(tab.id);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className={cn(
                      "flex items-center gap-3.5 px-4 py-3 rounded-xl transition-all duration-300 whitespace-nowrap w-full group text-left",
                      activeTab === tab.id
                        ? "neu-btn-dark text-emerald-400 shadow-sm font-bold"
                        : "neu-convex text-stone-700 hover:text-emerald-800 font-medium"
                    )}
                  >
                    <tab.icon className={cn("h-4 w-4 transition-transform group-hover:scale-110 shrink-0", activeTab === tab.id ? "text-emerald-400" : "text-stone-400")} />
                    <span className="font-condensed font-bold uppercase text-xs tracking-wider">{tab.label}</span>
                  </button>
                ))}
              </div>

              {/* Mobile Navigation */}
              <div className="block lg:hidden w-full mb-4 space-y-2.5">
                {/* Quick Dropdown Selector for instant switching */}
                <div className="flex items-center gap-2">
                  <Select
                    value={activeTab}
                    onValueChange={(val) => {
                      setActiveTab(val);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                  >
                    <SelectTrigger className="w-full h-11 neu-card-elevated border border-white/60 rounded-2xl font-condensed font-bold uppercase tracking-wider text-xs shadow-xs">
                      <div className="flex items-center gap-2 truncate">
                        <activeTabObj.icon className="h-4 w-4 text-emerald-800 shrink-0" />
                        <span className="truncate">{activeTabObj.label}</span>
                      </div>
                    </SelectTrigger>
                    <SelectContent className="neu-card-elevated rounded-2xl shadow-xl border-white/60 max-h-72">
                      {tabs.map((tab) => (
                        <SelectItem key={tab.id} value={tab.id} className="font-condensed font-bold uppercase text-xs py-2.5">
                          <div className="flex items-center gap-2">
                            <tab.icon className="h-4 w-4 text-emerald-800 shrink-0" />
                            <span>{tab.label}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Wrapped Chip Pills */}
                <div className="flex flex-wrap items-center gap-1.5 w-full pt-0.5">
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
                          "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-condensed font-bold uppercase tracking-wider transition-all",
                          isCurrent
                            ? "neu-btn-dark text-emerald-400 font-bold shadow-xs"
                            : "neu-convex text-stone-700 hover:text-emerald-800"
                        )}
                      >
                        <tab.icon className={cn("h-3 w-3 shrink-0", isCurrent ? "text-emerald-400" : "text-stone-400")} />
                        <span>{tab.label}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Active Tab Subtitle Info Banner */}
                <div className="flex items-center gap-2 px-3.5 py-1.5 neu-pill text-emerald-800 text-[10px] sm:text-[11px]">
                  <activeTabObj.icon className="h-3 w-3 text-emerald-800 shrink-0" />
                  <p className="truncate font-semibold">
                    <span className="font-condensed font-black uppercase text-slate-900">{activeTabObj.label}</span>
                    <span className="text-emerald-800 ml-1.5">• Desa Sampeldes</span>
                  </p>
                </div>
              </div>

              {/* Quick Summary Card (Desktop Only) */}
              <div className="hidden lg:block neu-card-elevated p-5 rounded-[28px] border border-white/60 space-y-3 mt-6">
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-800 uppercase tracking-wider">
                  <MapPin className="h-4 w-4" />
                  <span>Ringkasan Singkat</span>
                </div>
                <div className="space-y-1.5 sm:space-y-2 text-xs text-stone-600 divide-y divide-stone-300/60">
                  <div className="flex justify-between py-1">
                    <span className="text-stone-500">Luas Wilayah:</span>
                    <span className="font-bold text-slate-800">11,07 km² (9,28%)</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-stone-500">Penduduk 2024 (BPS):</span>
                    <span className="font-bold text-slate-800">8.775 Jiwa (7,49%)</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-stone-500">Pemutakhiran Desa:</span>
                    <span className="font-bold text-slate-800">8.563 Jiwa (2.523 KK)</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-stone-500">Kepadatan:</span>
                    <span className="font-bold text-slate-800">793 jiwa/km²</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-stone-500">Rasio Gender:</span>
                    <span className="font-bold text-slate-800">100,25</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-stone-500">RW / RT:</span>
                    <span className="font-bold text-slate-800">4 RW / 41 RT</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-stone-500">Ke Ibu Kota Kec.:</span>
                    <span className="font-bold text-slate-800">3 km</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-stone-500">Ke Ibu Kota Kab.:</span>
                    <span className="font-bold text-slate-800">45 km</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-stone-500">Status Perkembangan:</span>
                    <span className="font-bold text-emerald-800">Maju (Target Mandiri 2027)</span>
                  </div>
                </div>
              </div>

              <div className="hidden lg:block mt-6 p-6 neu-card-elevated rounded-[28px] border border-white/60 relative overflow-hidden">
                <div className="relative z-10 space-y-3">
                  <div className="inline-flex items-center gap-2 text-xs font-semibold tracking-wider text-emerald-800 uppercase">
                    <span className="w-2 h-2 rounded-full bg-emerald-600 shrink-0" />
                    <span>Akses Cepat</span>
                  </div>
                  <h4 className="text-lg font-condensed font-black uppercase tracking-tight leading-snug text-slate-900">
                    Butuh bantuan administrasi?
                  </h4>
                  <p className="text-xs text-stone-600 leading-relaxed">
                    Layanan pengajuan surat dan dokumen kependudukan kini dapat diakses secara daring 24 jam.
                  </p>
                  <Link href="/layanan-surat/">
                    <Button className="neu-btn-dark font-bold uppercase tracking-wider text-xs w-full h-11 rounded-full mt-2">
                      Buka Layanan Surat
                    </Button>
                  </Link>
                </div>
              </div>
            </aside>

            {/* MAIN CONTENT AREA */}
            <main className="lg:col-span-9 space-y-6 sm:space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 w-full min-w-0">
              {activeTab === 'sambutan' && <SambutanTab profileData={profileData} />}
              {activeTab === 'kenali' && <KenaliTab data={processedOfficials} isLoading={isLoadingOfficials} profileData={profileData} />}
              {activeTab === 'sejarah' && <SejarahTab profileData={profileData} />}
              {activeTab === 'peta' && <PetaTab profileData={profileData} />}
              {activeTab === 'wilayah' && <WilayahTab profileData={profileData} />}
              {activeTab === 'potensi' && <PotensiTab profileData={profileData} />}
              {activeTab === 'jalan-kabupaten' && <JalanKabupatenTab data={jalanKabList || []} isLoading={isLoadingJalanKab} />}
              {activeTab === 'jalan-desa' && <JalanDesaTab data={jalanDesaList || []} isLoading={isLoadingJalanDesa} />}
              {activeTab === 'rawan-bencana' && <RawanBencanaPublicTab />}
              {activeTab === 'galeri' && <GaleriTab youtubeEmbedUrl={youtubeEmbedUrl} newsData={newsData} isLoadingNews={isLoadingNews} />}
            </main>
          </div>
        </div>
      </main>

      {/* FOOTER */}
      <Footer />
    </div>
  );
}

// --- TAB COMPONENTS ---

function SambutanTab({ profileData }: { profileData?: any }) {
  const imageUrl = profileData?.kadesPhotoUrl || "https://picsum.photos/seed/kades/600/800";
  const kadesName = profileData?.kadesName || "TUKIMAN";
  const kadesTitle = profileData?.kadesTitle || "Kepala Desa Sampeldes";
  const kadesSlogan = profileData?.kadesSlogan || "Tumbuh dalam Kebersamaan, Berkarya untuk Kemajuan Desa.";
  const description = profileData?.description;

  return (
    <div className="space-y-6 sm:space-y-10">
      {/* SAMBUTAN & PROFIL UTAMA */}
      <div className="grid md:grid-cols-12 gap-5 sm:gap-8 items-stretch">
        <div className="md:col-span-4 lg:col-span-4">
          <div className="neu-card-elevated rounded-[28px] overflow-hidden border border-white/60 md:sticky md:top-28">
            <div className="aspect-[4/3] sm:aspect-[3/4] relative bg-stone-200">
              <img
                src={imageUrl}
                alt={kadesTitle}
                className="w-full h-full object-cover object-top sm:object-center"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0f172a]/90 via-transparent to-transparent" />
            </div>
            <div className="p-4 sm:p-6 text-center bg-[#0f172a] text-white border-t border-white/10">
              <h3 className="text-xl sm:text-2xl font-condensed font-black uppercase tracking-tight text-white">{kadesName}</h3>
              <p className="text-[10px] sm:text-xs font-bold text-emerald-400 uppercase tracking-widest mt-1">{kadesTitle}</p>
            </div>
          </div>
        </div>
        <div className="md:col-span-8 lg:col-span-8 neu-card-elevated p-5 sm:p-8 md:p-10 rounded-[28px] border border-white/60 space-y-5 sm:space-y-6">
          <div className="space-y-2 sm:space-y-3">
            <div className="inline-flex items-center gap-2 neu-pill text-emerald-800 text-xs font-bold uppercase tracking-wider px-3.5 py-1">
              <span className="w-2 h-2 rounded-full bg-emerald-600 shrink-0" />
              <span>Profil Resmi Desa Sampeldes</span>
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-5xl font-condensed font-black uppercase tracking-tight text-slate-900 leading-tight">
              Gambaran Umum <span className="text-emerald-800">Desa Sampeldes</span>
            </h2>
            <p className="text-xs sm:text-sm font-bold text-stone-500 uppercase tracking-wider">
              Kecamatan Gandrungmangu, Kabupaten Cilacap, Provinsi Jawa Tengah
            </p>
          </div>

          <div className="prose prose-slate max-w-none space-y-4 text-stone-700 text-xs sm:text-base leading-relaxed">
            <div className="neu-inset p-4 sm:p-5 rounded-2xl">
              <p className="text-xs sm:text-base leading-relaxed text-emerald-950 font-bold italic">
                &ldquo;{kadesSlogan}&rdquo;
              </p>
            </div>
            {description ? (
              <div className="whitespace-pre-line leading-relaxed space-y-3">
                {description}
              </div>
            ) : (
              <>
                <p>
                  Desa Sampeldes merupakan salah satu desa di wilayah Kecamatan Gandrungmangu, Kabupaten Cilacap, Provinsi Jawa Tengah. Desa ini memiliki wilayah yang cukup luas dengan masyarakat yang berperan aktif dalam penyelenggaraan pemerintahan, pembangunan, kegiatan sosial kemasyarakatan, dan pengembangan perekonomian lokal.
                </p>
                <p>
                  Kehidupan masyarakat Desa Sampeldes tidak terlepas dari aktivitas perdesaan, termasuk pertanian, kegiatan perdagangan, usaha masyarakat, serta berbagai bentuk kerja sama sosial. Potensi tersebut menjadi modal penting dalam mendukung peningkatan kesejahteraan warga dan pembangunan desa secara berkelanjutan.
                </p>
                <p>
                  Pemerintah Desa Sampeldes berperan dalam menyelenggarakan pelayanan publik, melaksanakan pembangunan, membina kehidupan kemasyarakatan, serta memberdayakan masyarakat sesuai kewenangan desa. Dalam pelaksanaannya, pemerintah desa bekerja bersama lembaga desa, tokoh masyarakat, kelompok tani, pemuda, dan berbagai unsur masyarakat lainnya.
                </p>
                <p>
                  Melalui perencanaan yang partisipatif dan pengelolaan potensi wilayah secara tepat, Desa Sampeldes diharapkan terus berkembang menjadi desa yang maju, mandiri, dan mampu memberikan pelayanan yang semakin baik kepada masyarakat.
                </p>
              </>
            )}
          </div>

          <div className="pt-2 sm:pt-4 flex flex-wrap gap-2">
            {[
              "Luas Wilayah 11,07 km² (9,28%)",
              "BPS 2024: 8.775 Jiwa",
              "Pemutakhiran Desa: 8.563 Jiwa (2.523 KK)",
              "4 RW & 41 RT",
              "3 km ke Pusat Kecamatan",
              "45 km ke Ibu Kota Kabupaten",
              "Kepadatan 793 jiwa/km²",
              "Status: Desa Maju (Target Mandiri 2027)",
              "Pertanian & Ketahanan Pangan",
              "Pemberdayaan UMKM",
              "Transformasi Digital Desa"
            ].map(tag => (
              <span key={tag} className="neu-pill flex items-center gap-1.5 px-3 py-1.5 text-[10px] sm:text-xs font-bold uppercase tracking-wider text-stone-700">
                <CheckCircle2 className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-emerald-700 shrink-0" /> {tag}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* 6 PILAR KARAKTERISTIK & JATI DIRI DESA */}
      <div className="neu-card-elevated p-5 sm:p-8 md:p-10 rounded-[28px] border border-white/80 dark:border-white/10 space-y-5 sm:space-y-8">
        <div className="text-center max-w-3xl mx-auto space-y-1.5 sm:space-y-2">
          <div className="flex items-center justify-center gap-2 text-xs font-semibold tracking-wider text-emerald-800 dark:text-teal-400 uppercase">
            <span className="w-5 h-[2px] bg-emerald-600 dark:bg-teal-500 shrink-0" />
            <span>Karakteristik & Nilai Luhur</span>
            <span className="w-5 h-[2px] bg-emerald-600 dark:bg-teal-500 shrink-0" />
          </div>
          <h3 className="text-xl sm:text-3xl md:text-4xl font-condensed font-bold uppercase tracking-tight text-slate-900 dark:text-white">
            Karakteristik & Identitas <span className="text-emerald-800 dark:text-teal-400">Desa Sampeldes</span>
          </h3>
          <p className="text-stone-600 dark:text-stone-300 font-medium text-xs sm:text-sm">Nilai fundamental yang membentuk jati diri, modal sosial, dan arah pembangunan desa</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-5">
          {[
            {
              title: 'Jejak Pemekaran Wilayah',
              desc: 'Bagian dinamika perdesaan Gandrungmangu (catatan pemekaran 1990 dari Gandrungmanis bersama Layansari), guna mendekatkan tata kelola pelayanan masyarakat.',
              icon: History,
              color: 'text-emerald-800 dark:text-teal-400'
            },
            {
              title: 'Harmoni & Gotong Royong',
              desc: 'Masyarakat Desa Sampeldes memelihara semangat kebersamaan, musyawarah mufakat, kekeluargaan, serta gotong royong dalam setiap denyut pembangunan desa.',
              icon: HeartHandshake,
              color: 'text-emerald-600 dark:text-emerald-400'
            },
            {
              title: 'Pertanian & Ketahanan Pangan',
              desc: 'Ketersediaan lahan sawah produktif dan kekayaan agraris menjadi penopang utama ketahanan pangan serta kemandirian keluarga warga desa.',
              icon: Sprout,
              color: 'text-green-600 dark:text-green-400'
            },
            {
              title: 'Perekonomian & UMKM',
              desc: 'Aktivitas perdagangan, usaha mikro dan kecil, pengolahan produk lokal, serta peningkatan kapasitas dan perluasan jaringan pemasaran digital.',
              icon: Store,
              color: 'text-orange-600 dark:text-orange-400'
            },
            {
              title: 'Seni, Budaya & Kearifan Lokal',
              desc: 'Tradisi gotong royong, musyawarah, kesenian lokal, dan keteladanan leluhur yang menjunjung tinggi kebaikan dan kejujuran hidup.',
              icon: Sparkles,
              color: 'text-purple-600 dark:text-purple-400'
            },
            {
              title: 'Transformasi Digital Desa',
              desc: 'Penyelenggaraan tata kelola desa berbasis teknologi informasi untuk meningkatkan kualitas pelayanan publik yang transparan, mudah, dan cepat.',
              icon: Laptop,
              color: 'text-blue-600 dark:text-blue-400'
            },
          ].map((item, i) => (
            <Card key={i} className="neu-card-elevated rounded-2xl sm:rounded-[24px] border border-white/80 dark:border-white/10 hover:border-emerald-500/50 dark:hover:border-teal-400/50 transition-all duration-300 p-4 sm:p-6 space-y-3 group">
              <div className={cn("w-10 h-10 sm:w-12 sm:h-12 rounded-xl neu-inset flex items-center justify-center transition-transform group-hover:scale-110 shrink-0 border border-stone-300/40 dark:border-white/10", item.color)}>
                <item.icon className="h-5 w-5 sm:h-6 sm:w-6" />
              </div>
              <div className="space-y-1">
                <h4 className="text-xs sm:text-base font-condensed font-bold uppercase tracking-tight text-slate-900 dark:text-white">{item.title}</h4>
                <p className="text-[11px] sm:text-xs text-stone-600 dark:text-stone-300 leading-relaxed font-medium">{item.desc}</p>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* 20. ARAH PEMBANGUNAN DESA (7 FOKUS) */}
      <div className="neu-card-elevated p-5 sm:p-8 md:p-10 rounded-[28px] border border-white/80 dark:border-white/10 space-y-5 sm:space-y-6">
        <div className="space-y-1.5 sm:space-y-2 max-w-3xl">
          <div className="flex items-center gap-2 text-xs font-semibold tracking-wider text-emerald-800 dark:text-teal-400 uppercase">
            <span className="w-5 h-[2px] bg-emerald-600 dark:bg-teal-500 shrink-0" />
            <span>Fokus Pembangunan Masa Depan</span>
          </div>
          <h3 className="text-xl sm:text-3xl md:text-4xl font-condensed font-bold uppercase tracking-tight text-slate-900 dark:text-white">
            Arah Pembangunan <span className="text-emerald-800 dark:text-teal-400">Desa Sampeldes</span>
          </h3>
          <p className="text-stone-600 dark:text-stone-300 font-medium text-xs sm:text-sm">
            Pembangunan Desa Sampeldes diarahkan untuk mewujudkan desa yang berkembang secara berkelanjutan dengan tetap mempertahankan karakter dan nilai-nilai masyarakat melalui 7 fokus utama:
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {[
            {
              title: 'Peningkatan Kualitas Pelayanan Publik',
              desc: 'Mewujudkan pelayanan pemerintahan yang cepat, mudah, transparan, dan responsif bagi seluruh lapisan masyarakat.',
              icon: ShieldCheck
            },
            {
              title: 'Penguatan Ekonomi Masyarakat',
              desc: 'Mengembangkan pertanian, UMKM, perdagangan, jasa, dan kegiatan ekonomi berbasis potensi lokal desa.',
              icon: TrendingUp
            },
            {
              title: 'Peningkatan Kualitas Sumber Daya Manusia',
              desc: 'Mendorong pendidikan, keterampilan, kesehatan, kepemudaan, dan pemberdayaan masyarakat secara terpadu.',
              icon: GraduationCap
            },
            {
              title: 'Penguatan Ketahanan Pangan',
              desc: 'Mengembangkan potensi pertanian tanaman pangan dan usaha masyarakat untuk mendukung ketahanan pangan mandiri.',
              icon: Sprout
            },
            {
              title: 'Pengembangan Infrastruktur',
              desc: 'Meningkatkan kualitas jalan desa, jalan lingkungan, saluran irigasi, dan sarana umum penunjang aktivitas warga.',
              icon: Milestone
            },
            {
              title: 'Pelestarian Budaya Lokal',
              desc: 'Menjaga sejarah, tradisi, kesenian, gotong royong, dan kearifan lokal sebagai identitas luhur desa.',
              icon: Landmark
            },
            {
              title: 'Transformasi Digital Desa',
              desc: 'Memanfaatkan teknologi informasi untuk pelayanan, transparansi anggaran, administrasi surat, dan publikasi desa.',
              icon: Laptop
            },
          ].map((item, idx) => (
            <div key={idx} className="p-3.5 sm:p-4.5 rounded-2xl neu-inset border border-stone-300/40 dark:border-white/10 space-y-2 hover:border-emerald-500/40 transition-all">
              <div className="flex items-center gap-2 sm:gap-2.5">
                <span className="flex h-5 w-5 sm:h-6 sm:w-6 shrink-0 items-center justify-center rounded-lg neu-btn-dark text-teal-400 text-[10px] sm:text-xs font-bold">
                  {idx + 1}
                </span>
                <h4 className="font-condensed font-bold uppercase text-slate-900 dark:text-white text-xs sm:text-sm tracking-tight leading-tight">
                  {item.title}
                </h4>
              </div>
              <p className="text-[11px] sm:text-xs text-stone-600 dark:text-stone-300 leading-relaxed font-medium pl-7 sm:pl-8">
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* 19. PRINSIP TATA KELOLA PEMERINTAHAN DESA */}
      <div className="neu-card-elevated-dark p-5 sm:p-8 md:p-10 rounded-[28px] text-white border border-white/10 space-y-5 sm:space-y-8">
        <div className="max-w-3xl space-y-1.5 sm:space-y-2">
          <div className="flex items-center gap-2 text-xs font-semibold tracking-wider text-teal-400 uppercase">
            <span className="w-5 h-[2px] bg-teal-500 shrink-0" />
            <span>Penyelenggaraan Pemerintahan</span>
          </div>
          <h3 className="text-xl sm:text-3xl md:text-4xl font-condensed font-bold uppercase tracking-tight text-white">
            Prinsip Tata Kelola <span className="text-teal-400">Pemerintah Desa</span>
          </h3>
          <p className="text-slate-300 text-xs sm:text-sm leading-relaxed font-medium">
            Pemerintah Desa Sampeldes merupakan unsur penyelenggara pemerintahan desa yang memiliki tugas memberikan pelayanan kepada masyarakat, melaksanakan pembangunan, melakukan pembinaan kemasyarakatan, serta memberdayakan masyarakat dengan mengedepankan prinsip:
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {[
            { label: 'Pelayanan Masyarakat', desc: 'Pelayanan yang cepat, ramah, adil, dan mengutamakan kepentingan warga.' },
            { label: 'Transparansi', desc: 'Keterbukaan informasi publik dan akuntabilitas pengelolaan keuangan desa.' },
            { label: 'Akuntabilitas', desc: 'Setiap kebijakan dan program pembangunan dapat dipertanggungjawabkan secara terbuka.' },
            { label: 'Partisipasi Masyarakat', desc: 'Perencanaan pembangunan yang partisipatif melibatkan seluruh elemen masyarakat.' },
            { label: 'Keterbukaan Informasi', desc: 'Akses informasi pembangunan yang terbuka dan mudah dijangkau seluruh warga.' },
            { label: 'Efektivitas & Efisiensi', desc: 'Pemanfaatan sumber daya desa secara tepat sasaran, berdaya guna, dan berkelanjutan.' },
            { label: 'Pemanfaatan Teknologi', desc: 'Pengembangan pelayanan publik berbasis digital untuk efisiensi birokrasi desa.' },
          ].map((principle, i) => (
            <div key={i} className="p-4 sm:p-5 rounded-2xl bg-white/5 border border-white/10 space-y-1.5 hover:border-teal-400/50 hover:bg-white/10 transition-all">
              <div className="flex items-center gap-2 text-teal-400 font-bold text-xs uppercase tracking-wider">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-teal-400" />
                <span>{principle.label}</span>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-300 font-medium pl-6 leading-relaxed">{principle.desc}</p>
            </div>
          ))}
        </div>

        {/* 21. SAMPELDES MENUJU DESA MANDIRI DAN BERKELANJUTAN */}
        <div className="pt-6 border-t border-white/10 space-y-3">
          <h4 className="text-lg sm:text-xl font-condensed font-bold uppercase text-teal-400 tracking-tight">
            Sampeldes Menuju Desa Mandiri dan Berkelanjutan
          </h4>
          <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-medium">
            Desa Sampeldes memiliki modal yang kuat untuk terus berkembang. Letak wilayah, potensi pertanian, sumber daya manusia, aktivitas ekonomi masyarakat, serta kehidupan sosial yang tumbuh dari semangat kebersamaan menjadi bagian penting dalam perjalanan pembangunan desa. Ke depan, pembangunan Sampeldes tidak hanya berorientasi pada pembangunan fisik, tetapi juga peningkatan kualitas manusia, penguatan ekonomi masyarakat, pelestarian budaya, perlindungan lingkungan, serta peningkatan kualitas tata kelola pemerintahan berbasis digital.
          </p>
        </div>
      </div>
    </div>
  );
}

function KenaliTab({ data, isLoading, profileData }: { data: any, isLoading: boolean, profileData?: any }) {
  const [subTab, setSubTab] = useState('perangkat');

  const subCategories = [
    { id: 'perangkat', label: 'Perangkat Desa', icon: UserCircle2, count: data.perangkat?.length || 0 },
    { id: 'bpd', label: 'BPD Desa', icon: ShieldCheck, count: data.bpd?.length || 0 },
    { id: 'rtrw', label: 'RT / RW (41 RT, 4 RW)', icon: Landmark, count: data.rtrwGroups?.reduce((acc: number, g: any) => acc + (g.members?.length || 0), 0) || 0 },
    { id: 'posyandu', label: 'Kader Posyandu', icon: HeartHandshake, count: data.posyandu?.length || 0 },
    { id: 'linmas', label: 'Linmas Desa', icon: ShieldAlert, count: data.linmas?.length || 0 },
  ];

  return (
    <div className="space-y-6 sm:space-y-10">
      <div className="space-y-2 sm:space-y-3">
        <div className="flex items-center gap-2 text-xs font-semibold tracking-wider text-teal-600 dark:text-teal-400 uppercase">
          <span className="w-5 h-[2px] bg-teal-500 shrink-0" />
          <span>Aparatur & Kelembagaan</span>
        </div>
        <h2 className="text-2xl sm:text-4xl font-condensed font-bold uppercase tracking-tight text-slate-900">
          Struktur <span className="text-teal-600 dark:text-teal-400">Pemerintahan</span>
        </h2>
        <p className="text-slate-500 font-medium text-xs sm:text-sm md:text-base border-l-4 border-teal-500 pl-3 sm:pl-4 uppercase tracking-tight">
          Mengenal Pelayan Masyarakat & Lembaga Desa Sampeldes (4 RW & 41 RT)
        </p>
      </div>

      <Tabs value={subTab} onValueChange={setSubTab} className="w-full space-y-4 sm:space-y-8">
        {/* SUB-TABS NAVIGATION (WRAPPED, NO HORIZONTAL SCROLL) */}
        <div className="w-full">
          <TabsList className="neu-inset p-1.5 sm:p-2 rounded-2xl sm:rounded-full h-auto flex flex-wrap items-center justify-center border border-stone-300/40 dark:border-white/10 gap-1 sm:gap-1.5 w-full">
            {subCategories.map((cat) => (
              <TabsTrigger
                key={cat.id}
                value={cat.id}
                className="rounded-xl sm:rounded-full px-2.5 sm:px-4 md:px-5 py-1.5 sm:py-2.5 font-condensed font-bold uppercase text-[10px] sm:text-xs tracking-wider transition-all gap-1 sm:gap-1.5 flex items-center justify-center shrink-0 data-[state=active]:neu-btn-dark data-[state=active]:text-teal-400 data-[state=active]:shadow-xs"
              >
                <cat.icon className="h-3 w-3 sm:h-3.5 sm:w-3.5 shrink-0" />
                <span>{cat.label}</span>
                {!isLoading && cat.count > 0 && (
                  <span className={cn(
                    "ml-0.5 sm:ml-1 px-1.5 py-0.2 rounded-full text-[8px] sm:text-[9px] font-bold shrink-0",
                    subTab === cat.id ? "bg-teal-500/20 text-teal-400" : "neu-inset text-slate-700 dark:text-slate-300"
                  )}>
                    {cat.count}
                  </span>
                )}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        {/* TAB 1: PERANGKAT DESA */}
        <TabsContent value="perangkat" className="space-y-4 sm:space-y-8 focus-visible:outline-none animate-in fade-in-50 duration-300">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 neu-inset text-emerald-800 dark:text-teal-400 rounded-2xl flex items-center justify-center">
              <UserCircle2 className="h-5 w-5 sm:h-6 sm:w-6" />
            </div>
            <div>
              <h3 className="text-base sm:text-2xl font-condensed font-bold uppercase tracking-tight text-slate-900 dark:text-white">Perangkat Desa</h3>
              <p className="text-[11px] sm:text-xs text-stone-500 dark:text-stone-400 font-medium">Pemerintah Desa Sampeldes</p>
            </div>
          </div>
          {isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 sm:gap-4 md:gap-6">
              {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="aspect-[3/4] rounded-2xl" />)}
            </div>
          ) : data.perangkat?.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-2.5 sm:gap-4 md:gap-6">
              {data.perangkat.map((o: Official) => <OfficialCard key={o.id} official={o} />)}
            </div>
          ) : (
            <div className="p-6 sm:p-12 text-center neu-inset rounded-[28px] border border-stone-300/40 dark:border-white/10 space-y-2">
              <UserCircle2 className="h-8 w-8 sm:h-12 sm:w-12 text-stone-400 dark:text-stone-500 mx-auto mb-2 sm:mb-3" />
              <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-400 font-medium">Data Perangkat Desa dapat dikelola melalui Admin Panel.</p>
            </div>
          )}
        </TabsContent>

        {/* TAB 2: BPD DESA */}
        <TabsContent value="bpd" className="space-y-4 sm:space-y-8 focus-visible:outline-none animate-in fade-in-50 duration-300">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 neu-inset text-emerald-800 dark:text-teal-400 rounded-2xl flex items-center justify-center">
              <ShieldCheck className="h-5 w-5 sm:h-6 sm:w-6" />
            </div>
            <div>
              <h3 className="text-base sm:text-2xl font-condensed font-bold uppercase tracking-tight text-slate-900 dark:text-white">Badan Permusyawaratan Desa (BPD)</h3>
              <p className="text-[11px] sm:text-xs text-stone-500 dark:text-stone-400 font-medium">Lembaga Permusyawaratan & Pengawasan Desa</p>
            </div>
          </div>
          {isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 sm:gap-4 md:gap-6">
              {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="aspect-[3/4] rounded-2xl" />)}
            </div>
          ) : data.bpd?.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-2.5 sm:gap-4 md:gap-6">
              {data.bpd.map((o: Official) => <OfficialCard key={o.id} official={o} />)}
            </div>
          ) : (
            <div className="p-6 sm:p-12 text-center neu-inset rounded-[28px] border border-stone-300/40 dark:border-white/10 space-y-2">
              <ShieldCheck className="h-8 w-8 sm:h-12 sm:w-12 text-stone-400 dark:text-stone-500 mx-auto mb-2 sm:mb-3" />
              <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-400 font-medium">Data BPD Desa dapat dikelola melalui Admin Panel.</p>
            </div>
          )}
        </TabsContent>

        {/* TAB 3: RT / RW */}
        <TabsContent value="rtrw" className="space-y-4 sm:space-y-8 focus-visible:outline-none animate-in fade-in-50 duration-300">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 neu-inset text-emerald-800 dark:text-teal-400 rounded-2xl flex items-center justify-center">
              <Landmark className="h-5 w-5 sm:h-6 sm:w-6" />
            </div>
            <div>
              <h3 className="text-base sm:text-2xl font-condensed font-bold uppercase tracking-tight text-slate-900 dark:text-white">Lembaga Kemasyarakatan (RT / RW)</h3>
              <p className="text-[11px] sm:text-xs text-stone-500 dark:text-stone-400 font-medium">Terbagi dalam 6 Rukun Warga (RW) dan 38 Rukun Tetangga (RT)</p>
            </div>
          </div>
          {isLoading ? (
            <div className="space-y-4 sm:space-y-6">
              {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-32 sm:h-48 w-full rounded-[28px]" />)}
            </div>
          ) : data.rtrwGroups?.length > 0 ? (
            <div className="space-y-4 sm:space-y-8">
              {data.rtrwGroups.map((group: any, i: number) => (
                <div key={i} className="space-y-4 sm:space-y-5 p-4 sm:p-6 neu-card-elevated rounded-[28px] border border-white/80 dark:border-white/10">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="h-px flex-1 bg-stone-300/60 dark:bg-white/10" />
                    <span className="neu-pill text-emerald-800 dark:text-teal-400 font-condensed font-bold uppercase text-[10px] sm:text-xs tracking-wider px-4 py-1.5">
                      {group.rwLabel}
                    </span>
                    <div className="h-px flex-1 bg-stone-300/60 dark:bg-white/10" />
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5 sm:gap-4 md:gap-5">
                    {group.members.map((o: Official) => <OfficialCard key={o.id} official={o} isSmall />)}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-6 sm:p-12 text-center neu-inset rounded-[28px] border border-stone-300/40 dark:border-white/10 space-y-2">
              <Landmark className="h-8 w-8 sm:h-12 sm:w-12 text-stone-400 dark:text-stone-500 mx-auto" />
              <p className="text-xs sm:text-sm text-slate-800 dark:text-white font-bold uppercase tracking-wider">Wilayah Terdiri atas 4 RW dan 41 RT</p>
              <p className="text-xs text-stone-500 dark:text-stone-400 font-medium">Data pengurus RT & RW dapat dikelola melalui Admin Panel.</p>
            </div>
          )}
        </TabsContent>

        {/* TAB 4: KADER POSYANDU */}
        <TabsContent value="posyandu" className="space-y-4 sm:space-y-8 focus-visible:outline-none animate-in fade-in-50 duration-300">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 neu-inset text-rose-600 dark:text-rose-400 rounded-2xl flex items-center justify-center">
              <HeartHandshake className="h-5 w-5 sm:h-6 sm:w-6" />
            </div>
            <div>
              <h3 className="text-base sm:text-2xl font-condensed font-bold uppercase tracking-tight text-slate-900 dark:text-white">Kader Posyandu Desa</h3>
              <p className="text-[11px] sm:text-xs text-stone-500 dark:text-stone-400 font-medium">Kader Pelayanan Kesehatan & Posyandu Desa Sampeldes</p>
            </div>
          </div>
          {isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 sm:gap-4 md:gap-6">
              {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="aspect-[3/4] rounded-2xl" />)}
            </div>
          ) : data.posyandu?.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-2.5 sm:gap-4 md:gap-6">
              {data.posyandu.map((o: Official) => <OfficialCard key={o.id} official={o} />)}
            </div>
          ) : (
            <div className="p-6 sm:p-12 text-center neu-inset rounded-[28px] border border-stone-300/40 dark:border-white/10 space-y-2">
              <HeartHandshake className="h-8 w-8 sm:h-12 sm:w-12 text-stone-400 dark:text-stone-500 mx-auto mb-2 sm:mb-3" />
              <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-400 font-medium">Data Kader Posyandu dapat dikelola melalui Admin Panel.</p>
            </div>
          )}
        </TabsContent>

        {/* TAB 5: LINMAS DESA */}
        <TabsContent value="linmas" className="space-y-4 sm:space-y-8 focus-visible:outline-none animate-in fade-in-50 duration-300">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 neu-inset text-emerald-800 dark:text-teal-400 rounded-2xl flex items-center justify-center">
              <ShieldAlert className="h-5 w-5 sm:h-6 sm:w-6" />
            </div>
            <div>
              <h3 className="text-base sm:text-2xl font-condensed font-bold uppercase tracking-tight text-slate-900 dark:text-white">Satuan Linmas (Satlinmas)</h3>
              <p className="text-[11px] sm:text-xs text-stone-500 dark:text-stone-400 font-medium">Satuan Perlindungan Masyarakat Desa Sampeldes</p>
            </div>
          </div>
          {isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 sm:gap-4 md:gap-6">
              {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="aspect-[3/4] rounded-2xl" />)}
            </div>
          ) : data.linmas?.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-2.5 sm:gap-4 md:gap-6">
              {data.linmas.map((o: Official) => <OfficialCard key={o.id} official={o} />)}
            </div>
          ) : (
            <div className="p-6 sm:p-12 text-center neu-inset rounded-[28px] border border-stone-300/40 dark:border-white/10 space-y-2">
              <ShieldAlert className="h-8 w-8 sm:h-12 sm:w-12 text-stone-400 dark:text-stone-500 mx-auto mb-2 sm:mb-3" />
              <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-400 font-medium">Data Satuan Linmas dapat dikelola melalui Admin Panel.</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function SejarahTab({ profileData }: { profileData?: any }) {
  const historyTimeline = [
    {
      period: 'Pemekaran Wilayah 1998',
      title: 'Pemekaran Desa Wringinharjo',
      desc: 'Situs resmi Desa Wringinharjo dan catatan lokal menyebut Wringinharjo mekar dari Sampeldes pada tahun 1998 pada masa kepemimpinan Kades Paijo Notoraharjo (dekade 1990-an).',
      icon: History
    },
    {
      period: 'Kajian Asal-Usul Nama',
      title: 'Makna Kebahasaan Sampeldes',
      desc: 'Secara kebahasaan, kata "karang" dan "anyar" bermakna tempat atau kawasan baru, yang terus diperkuat melalui penelusuran filosofi bersama sesepuh dan tokoh masyarakat.',
      icon: Landmark
    },
    {
      period: 'Dokumentasi Sejarah Lokal',
      title: 'Petilasan Indrajit & Cerita Desa',
      desc: 'Dokumentasi lokal SD Negeri Sampeldes 03 (2013) mencatat Petilasan Indrajit sebagai bagian penting warisan ingatan dan cerita sejarah yang hidup di tengah masyarakat.',
      icon: Sparkles
    },
    {
      period: 'Arah Pembangunan Berkelanjutan',
      title: 'Menjaga Memori Kolektif Lintas Generasi',
      desc: 'Pendokumentasian sejarah lisan, peninggalan lokal, dan tradisi gotong royong sebagai identitas luhur menuju Desa Maju dan Mandiri.',
      icon: TrendingUp
    },
  ];

  return (
    <div className="space-y-6 sm:space-y-12 max-w-4xl mx-auto">
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-2 text-xs font-semibold tracking-wider text-teal-600 dark:text-teal-400 uppercase">
          <span className="w-5 h-[2px] bg-teal-500 shrink-0" />
          <span>Sejarah &amp; Penelusuran Desa</span>
          <span className="w-5 h-[2px] bg-teal-500 shrink-0" />
        </div>
        <h2 className="text-2xl sm:text-4xl md:text-5xl font-condensed font-bold uppercase tracking-tight text-slate-900 dark:text-white leading-none">
          {profileData?.sejarahTitle || (
            <>Sejarah <span className="text-teal-600 dark:text-teal-400">Desa Sampeldes</span></>
          )}
        </h2>
        <p className="text-slate-400 dark:text-slate-400 font-bold uppercase text-[10px] sm:text-xs tracking-wider">
          Kecamatan Gandrungmangu, Kabupaten Cilacap, Provinsi Jawa Tengah
        </p>
      </div>

      {/* Rincian Sejarah Narrative Card */}
      <Card className="neu-card-elevated rounded-[28px] border border-white/80 dark:border-white/10 p-5 sm:p-8 md:p-10 space-y-5 sm:space-y-6">
        <div className="inline-flex items-center gap-1.5 sm:gap-2 neu-pill px-3.5 py-1.5 text-[10px] sm:text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-teal-400">
          <History className="h-3.5 w-3.5 text-emerald-700 dark:text-teal-400" /> Narasi Sejarah Desa Sampeldes
        </div>
        <div className="prose prose-slate max-w-none text-slate-800 dark:text-slate-200 space-y-6 text-xs sm:text-base leading-relaxed">
          {profileData?.sejarahContent || profileData?.sejarahAsalUsul ? (
            <div className="whitespace-pre-line space-y-4">
              {profileData.sejarahContent || profileData.sejarahAsalUsul}
            </div>
          ) : (
            <>
              {/* Bagian 1: Jejak Sejarah dan Perkembangan Wilayah */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-600 dark:bg-teal-500 shrink-0" />
                  <h3 className="text-base sm:text-xl font-condensed font-bold uppercase tracking-tight text-slate-900 dark:text-white m-0">
                    Jejak Sejarah dan Perkembangan Wilayah
                  </h3>
                </div>
                <p>
                  Sejarah Desa Sampeldes merupakan bagian dari perjalanan perkembangan wilayah perdesaan di Kecamatan Gandrungmangu. Salah satu bukti perkembangan administratif yang dapat ditelusuri adalah pemekaran wilayah Desa Wringinharjo dari Desa Sampeldes.
                </p>
                <p>
                  Situs resmi Desa Wringinharjo menyebutkan bahwa Wringinharjo merupakan desa hasil pemekaran dari Sampeldes pada tahun 1998. Sumber lokal lainnya, berupa tulisan pada blog SD Negeri Sampeldes 03 yang diterbitkan pada tahun 2013, juga menyebut bahwa wilayah Wringinharjo sebelumnya merupakan bagian dari Sampeldes dan pemekaran berlangsung pada dekade 1990-an, ketika pemerintahan desa dipimpin oleh Paijo Notoraharjo.
                </p>
                <p>
                  Informasi tersebut menunjukkan bahwa Desa Sampeldes pernah memiliki cakupan wilayah yang lebih luas sebelum terbentuknya wilayah pemerintahan desa yang terpisah. Pemekaran tersebut dapat dipahami sebagai bagian dari perkembangan administrasi dan pelayanan pemerintahan kepada masyarakat.
                </p>
                <div className="p-4 sm:p-5 rounded-2xl neu-inset border border-stone-300/40 dark:border-white/10 font-medium text-slate-900 dark:text-slate-100 text-xs sm:text-sm italic">
                  Untuk penulisan sejarah yang bersifat resmi, tahun pemekaran, dasar hukum, batas wilayah sebelum dan sesudah pemekaran, serta riwayat kepala desa perlu diperkuat dengan dokumen pemerintahan desa, arsip kecamatan, dan keputusan pemerintah daerah.
                </div>
              </div>

              {/* Bagian 2: Asal-Usul Nama Sampeldes */}
              <div className="space-y-3 pt-4 border-t border-stone-200/60 dark:border-white/10">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-600 dark:bg-teal-500 shrink-0" />
                  <h3 className="text-base sm:text-xl font-condensed font-bold uppercase tracking-tight text-slate-900 dark:text-white m-0">
                    Asal-Usul Nama Sampeldes
                  </h3>
                </div>
                <p>
                  Nama Sampeldes merupakan nama yang telah melekat pada identitas wilayah dan masyarakat desa. Namun, sumber yang berhasil ditelusuri belum memberikan keterangan sejarah yang cukup kuat untuk memastikan asal-usul nama tersebut, termasuk siapa yang pertama kali menggunakannya dan kapan nama tersebut ditetapkan.
                </p>
                <p>
                  Secara kebahasaan, kata &ldquo;karang&rdquo; dan &ldquo;anyar&rdquo; dapat ditafsirkan sebagai gabungan kata yang bermakna tempat atau kawasan baru. Akan tetapi, penafsiran kebahasaan tersebut belum dapat dijadikan bukti bahwa itulah asal-usul historis nama Desa Sampeldes.
                </p>
                <p className="font-semibold text-emerald-900 dark:text-teal-400 text-xs sm:text-sm">
                  Oleh sebab itu, penelusuran filosofi nama desa perlu dilengkapi melalui wawancara dengan para sesepuh, tokoh masyarakat, mantan kepala desa, serta pemeriksaan arsip atau dokumen sejarah yang masih tersimpan.
                </p>
              </div>

              {/* Bagian 3: Petilasan Indrajit dan Sejarah Lokal */}
              <div className="space-y-3 pt-4 border-t border-stone-200/60 dark:border-white/10">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-600 dark:bg-teal-500 shrink-0" />
                  <h3 className="text-base sm:text-xl font-condensed font-bold uppercase tracking-tight text-slate-900 dark:text-white m-0">
                    Petilasan Indrajit dan Sejarah Lokal
                  </h3>
                </div>
                <p>
                  Salah satu cerita sejarah lokal yang terdokumentasi di Desa Sampeldes adalah kisah mengenai Petilasan Indrajit. Tulisan yang dipublikasikan oleh SD Negeri Sampeldes 03 pada tahun 2013 mengangkat petilasan tersebut sebagai bagian dari cerita yang dikenal di lingkungan desa.
                </p>
                <p>
                  Keberadaan cerita dan tempat yang dikaitkan dengan sejarah lokal merupakan bagian dari warisan ingatan masyarakat yang menarik untuk didokumentasikan. Informasi mengenai asal-usul petilasan, tokoh yang dikaitkan dengannya, serta peristiwa yang melatarbelakanginya perlu dikonfirmasi melalui sumber sejarah lokal dan keterangan para sesepuh.
                </p>
                <p className="font-medium text-slate-900 dark:text-slate-100">
                  Pendokumentasian sejarah lisan, nama-nama tempat, tradisi, serta peninggalan lokal dapat menjadi upaya menjaga identitas Desa Sampeldes dan memperkenalkannya kepada generasi muda.
                </p>
              </div>
            </>
          )}
        </div>

        {/* CATATAN RESMI VERIFIKASI SEJARAH */}
        <div className="pt-4 sm:pt-6 border-t border-stone-200/60 dark:border-white/10 space-y-4">
          <div className="p-4 sm:p-5 rounded-2xl neu-inset border border-amber-400/40 dark:border-amber-500/20 space-y-2 text-slate-800 dark:text-slate-200">
            <div className="flex items-center gap-2 text-amber-900 dark:text-amber-300 font-condensed font-bold uppercase text-xs sm:text-sm tracking-wide">
              <ShieldAlert className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
              <span>Catatan Verifikasi Sumber Sejarah Resmi</span>
            </div>
            <p className="text-xs sm:text-sm text-stone-700 dark:text-stone-300 leading-relaxed">
              Narasi sejarah Desa Sampeldes bersumber dari dokumen sejarah desa, arsip pemerintahan, keterangan tokoh masyarakat, atau hasil penelusuran yang telah dikonfirmasi oleh pemerintah desa. Publikasi resmi BPS <em>Kecamatan Gandrungmangu Dalam Angka 2025</em> tidak menyediakan uraian khusus mengenai asal-usul nama Sampeldes, tahun berdiri desa, tokoh pendiri, maupun filosofi nama desa. Oleh sebab itu, rincian naratif sejarah terus diverifikasi dan disempurnakan bersama Pemerintah Desa Sampeldes.
            </p>
          </div>

          <div className="p-5 sm:p-7 rounded-[28px] neu-card-elevated-dark text-white space-y-2.5 border border-white/10">
            <p className="text-[10px] sm:text-xs font-bold text-teal-400 uppercase tracking-wider">Amanat Nilai Luhur Desa</p>
            <p className="text-xs sm:text-base text-slate-200 leading-relaxed font-medium italic">
              &ldquo;Membangun desa berpijak pada sejarah kebersamaan, menghargai jasa para perintis dan tokoh desa, serta melangkah maju dengan semangat gotong royong untuk kemakmuran seluruh warga Sampeldes.&rdquo;
            </p>
            <p className="text-[11px] sm:text-sm font-bold text-teal-400 pt-2 border-t border-white/10 uppercase tracking-wider">
              Sampeldes — Tumbuh dalam Kebersamaan, Berkarya untuk Kemajuan Desa.
            </p>
          </div>
        </div>
      </Card>

      {/* TIMELINE JEJAK HISTORIS */}
      <div className="space-y-6">
        <h3 className="text-xl sm:text-3xl font-condensed font-bold text-slate-900 dark:text-white uppercase tracking-tight text-center">
          Tahapan <span className="text-emerald-800 dark:text-teal-400">Perjalanan Desa</span>
        </h3>

        <div className="relative space-y-4 sm:space-y-6">
          {/* Vertical Line */}
          <div className="absolute left-5 md:left-1/2 top-0 bottom-0 w-1 bg-stone-300/70 dark:bg-white/10 -translate-x-1/2" />

          {historyTimeline.map((event, i) => (
            <div key={i} className={cn(
              "relative flex items-center gap-4 sm:gap-10",
              i % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse"
            )}>
              {/* Timeline Dot */}
              <div className="absolute left-5 md:left-1/2 -translate-x-1/2 w-8 h-8 sm:w-10 sm:h-10 rounded-full neu-btn-dark border-2 border-white/80 dark:border-white/20 shadow-md flex items-center justify-center z-10 text-teal-400">
                <event.icon className="h-4 w-4" />
              </div>

              {/* Content Side */}
              <div className="flex-1 pl-12 sm:pl-14 md:pl-0 min-w-0">
                <Card className={cn(
                  "neu-card-elevated rounded-2xl sm:rounded-[24px] border border-white/80 dark:border-white/10 hover:border-emerald-500/50 dark:hover:border-teal-400/50 transition-all duration-300 group overflow-hidden",
                  i % 2 === 0 ? "md:mr-8" : "md:ml-8"
                )}>
                  <div className={cn("h-1.5 w-full", i % 2 === 0 ? "bg-[#070b10] dark:bg-emerald-500" : "bg-emerald-600 dark:bg-teal-500")} />
                  <CardContent className="p-4 sm:p-6 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] sm:text-xs font-condensed font-bold text-emerald-800 dark:text-teal-400 uppercase tracking-wider">{event.period}</span>
                      <Calendar className="h-4 w-4 text-stone-400" />
                    </div>
                    <h4 className="text-sm sm:text-lg font-condensed font-bold uppercase text-slate-900 dark:text-white tracking-tight">{event.title}</h4>
                    <p className="text-stone-600 dark:text-stone-300 text-xs sm:text-sm leading-relaxed font-medium">
                      {event.desc}
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Empty Side */}
              <div className="hidden md:flex flex-1" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function PetaTab({ profileData }: { profileData?: any }) {
  const batasUtara = profileData?.batasUtara || 'Kawasan Karanggedang & Penyarang (Utara / Barat Laut)';
  const batasTimur = profileData?.batasTimur || 'Desa Muktisari';
  const batasSelatan = profileData?.batasSelatan || 'Desa Cinangsi';
  const batasBarat = profileData?.batasBarat || 'Desa Wringinharjo (Pemekaran 1998)';
  const jarakKec = profileData?.jarakKecamatan || '3';
  const jarakKab = profileData?.jarakKabupaten || '45';
  const luasWilayah = profileData?.luasWilayah || '11,07';
  const latNum = profileData?.koordinatLat ? parseFloat(profileData.koordinatLat) : -7.5136184;
  const lngNum = profileData?.koordinatLng ? parseFloat(profileData.koordinatLng) : 108.8401798;
  const coordDisplay = `${latNum}°, ${lngNum}°`;

  return (
    <div className="grid lg:grid-cols-12 gap-5 sm:gap-8 lg:gap-10">
      <div className="lg:col-span-8 space-y-4 sm:space-y-6">
        <Card className="neu-card-elevated rounded-[28px] overflow-hidden border border-white/80 dark:border-white/10 h-[280px] sm:h-[450px] md:h-[550px] relative group">
          <VillageMap lat={latNum} lng={lngNum} />
          <div className="absolute top-4 left-4 pointer-events-none z-10">
            <div className="neu-btn-dark text-teal-400 font-condensed font-bold uppercase text-xs tracking-wider px-4 py-2 rounded-full border border-white/10 shadow-xs">
              Peta Geografis Desa Sampeldes
            </div>
          </div>
        </Card>

        {/* Titik Koordinat & Ringkasan Jarak */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          <div className="p-4 sm:p-5 rounded-2xl neu-card-elevated border border-white/80 dark:border-white/10 space-y-2 flex flex-col justify-between">
            <div className="space-y-0.5">
              <p className="text-[10px] sm:text-xs font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider">Titik Koordinat</p>
              <p className="text-xs sm:text-sm font-mono font-bold text-slate-800 dark:text-white break-all select-all">{coordDisplay}</p>
            </div>
            <a
              href={`https://www.google.com/maps?q=${latNum},${lngNum}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-[11px] sm:text-xs font-bold text-emerald-800 dark:text-teal-400 hover:underline transition-colors pt-2 border-t border-stone-200/60 dark:border-white/10 uppercase tracking-wider"
            >
              <span>Buka di Google Maps</span> <ArrowRight className="h-3 w-3 shrink-0" />
            </a>
          </div>
          <div className="grid grid-cols-2 sm:contents gap-2.5">
            <div className="p-4 sm:p-5 rounded-2xl neu-card-elevated border border-white/80 dark:border-white/10 space-y-1">
              <p className="text-[10px] sm:text-xs font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider">Ke Kecamatan</p>
              <p className="text-xl sm:text-3xl font-condensed font-bold text-slate-900 dark:text-white">{jarakKec} KM</p>
              <p className="text-[11px] sm:text-xs text-stone-600 dark:text-stone-400 font-medium break-words">Gandrungmangu</p>
            </div>
            <div className="p-4 sm:p-5 rounded-2xl neu-card-elevated border border-white/80 dark:border-white/10 space-y-1">
              <p className="text-[10px] sm:text-xs font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider">Ke Kabupaten</p>
              <p className="text-xl sm:text-3xl font-condensed font-bold text-slate-900 dark:text-white">{jarakKab} KM</p>
              <p className="text-[11px] sm:text-xs text-stone-600 dark:text-stone-400 font-medium break-words">Cilacap</p>
            </div>
          </div>
        </div>
      </div>

      <div className="lg:col-span-4 space-y-4 sm:space-y-6">
        {/* 5. BATAS WILAYAH DESA */}
        <Card className="neu-card-elevated-dark rounded-[28px] border border-white/10 text-white overflow-hidden">
          <CardContent className="p-5 sm:p-7 space-y-4 sm:space-y-6">
            <div className="space-y-1.5 sm:space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold tracking-wider text-teal-400 uppercase">
                <span className="w-5 h-[2px] bg-teal-500 shrink-0" />
                <span>Geografis & Batas</span>
              </div>
              <h3 className="text-xl sm:text-3xl font-condensed font-bold uppercase tracking-tight text-white">Batas Wilayah</h3>
              <p className="text-[11px] sm:text-xs text-slate-300 leading-relaxed font-medium">
                Berdasarkan keterangan wilayah dan monografi administrasi Desa Sampeldes di Kecamatan Gandrungmangu:
              </p>
            </div>

            {/* Batas Wilayah Card */}
            <div className="space-y-2">
              {[
                { dir: 'SEBELAH UTARA', label: batasUtara, icon: 'U' },
                { dir: 'SEBELAH TIMUR', label: batasTimur, icon: 'T' },
                { dir: 'SEBELAH SELATAN', label: batasSelatan, icon: 'S' },
                { dir: 'SEBELAH BARAT', label: batasBarat, icon: 'B' },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-2.5 sm:gap-3 p-3 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
                  <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center font-bold text-xs sm:text-sm shrink-0 border border-teal-500/30">
                    {item.icon}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[8px] sm:text-[9px] font-bold text-teal-400/80 uppercase tracking-wider">{item.dir}</p>
                    <p className="font-bold text-xs sm:text-sm text-white break-words leading-tight">{item.label}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-3 sm:pt-4 border-t border-white/10 space-y-2">
              <div className="flex items-center gap-2 text-teal-400 text-xs font-bold uppercase tracking-wider">
                <Compass className="h-4 w-4 shrink-0" />
                <span>Luas Wilayah Total</span>
              </div>
              <div className="p-3 sm:p-3.5 rounded-2xl bg-white/10 border border-white/15 font-mono text-[11px] sm:text-xs text-white flex justify-between items-center">
                <span>Luas: {luasWilayah} km² (~1.107 ha)</span>
                <span className="text-teal-400 font-bold">9,28% Luas Kec.</span>
              </div>
              <p className="text-[10px] sm:text-[11px] text-slate-400 italic">
                *Data bersumber dari BPS Kabupaten Cilacap (Kecamatan Gandrungmangu Dalam Angka 2025). Penetapan resmi mengacu pada peta batas administrasi desa.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* 4. KONDISI GEOGRAFIS DESA */}
        <div className="neu-card-elevated p-5 sm:p-6 rounded-[28px] border border-white/80 dark:border-white/10 space-y-2 sm:space-y-3">
          <h4 className="text-xs font-bold text-emerald-800 dark:text-teal-400 uppercase tracking-wider flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5" />
            <span>Karakter Geografis Wilayah</span>
          </h4>
          <p className="text-[11px] sm:text-xs text-stone-600 dark:text-stone-300 leading-relaxed font-medium">
            Secara umum, wilayah Desa Sampeldes memiliki karakter pedesaan dengan kawasan permukiman warga yang asri, bentangan persawahan subur, lahan pertanian tanaman pangan, perkebunan, serta berbagai denyut aktivitas ekonomi masyarakat.
          </p>
        </div>
      </div>
    </div>
  );
}

function WilayahTab({ profileData }: { profileData?: any }) {
  // 1. Data Singkat & Indikator Resmi (BPS 2024 / Pemutakhiran Desa)
  const dataSingkat = [
    { label: 'Nama Desa', val: 'Sampeldes' },
    { label: 'Kecamatan', val: 'Gandrungmangu' },
    { label: 'Kabupaten', val: 'Cilacap' },
    { label: 'Provinsi', val: 'Jawa Tengah' },
    { label: 'Luas Wilayah', val: profileData?.luasWilayah ? `${profileData.luasWilayah} km²` : '11,07 km² (± 1.107 Ha)' },
    { label: 'Persentase Luas Kecamatan', val: '9,28% dari Luas Gandrungmangu' },
    { label: 'Jarak ke Ibu Kota Kecamatan', val: profileData?.jarakKecamatan ? `${profileData.jarakKecamatan} km` : '± 3 km' },
    { label: 'Jarak ke Ibu Kota Kabupaten', val: profileData?.jarakKabupaten ? `${profileData.jarakKabupaten} km` : '± 45 km' },
    { label: 'Jumlah Wilayah Rukun Warga (RW)', val: profileData?.jumlahRw ? `${profileData.jumlahRw} RW` : '4 RW' },
    { label: 'Jumlah Wilayah Rukun Tetangga (RT)', val: profileData?.jumlahRt ? `${profileData.jumlahRt} RT` : '41 RT' },
    { label: 'Jumlah Penduduk (BPS 2024)', val: '8.775 jiwa' },
    { label: 'Penduduk Laki-laki (BPS)', val: '4.393 jiwa' },
    { label: 'Penduduk Perempuan (BPS)', val: '4.382 jiwa' },
    { label: 'Persentase Penduduk Kecamatan', val: '7,49%' },
    { label: 'Kepadatan Penduduk', val: '± 793 jiwa/km²' },
    { label: 'Rasio Jenis Kelamin', val: '100,25' },
    { label: 'Penduduk (Pemutakhiran Desa)', val: '8.563 jiwa (2.523 KK)' },
    { label: 'Komposisi Pemutakhiran Desa', val: 'Laki-laki: 4.132 jiwa • Perempuan: 4.431 jiwa' },
    { label: 'Status Indeks Desa (2025–2026)', val: 'Kategori Maju' },
    { label: 'Target Status Indeks Desa (2027)', val: 'Menuju Kategori Mandiri' },
  ];

  // 5. Pendidikan Kecamatan Gandrungmangu (BPS 2024/2025)
  const pendidikanKecamatan = [
    { jenjang: 'Taman Kanak-Kanak (TK)', jumlah: 21 },
    { jenjang: 'Sekolah Dasar (SD)', jumlah: 59 },
    { jenjang: 'Sekolah Menengah Pertama (SMP)', jumlah: 13 },
    { jenjang: 'Sekolah Menengah Atas (SMA)', jumlah: 2 },
    { jenjang: 'Sekolah Menengah Kejuruan (SMK)', jumlah: 2 },
  ];

  // Satuan Pendidikan Teridentifikasi di Desa Sampeldes (SDN 01 s/d 06)
  const sekolahSampeldes = {
    sdNegeri: [
      { nama: 'SD Negeri Sampeldes 01', status: 'Sekolah Dasar Negeri' },
      { nama: 'SD Negeri Sampeldes 02', status: 'Sekolah Dasar Negeri' },
      { nama: 'SD Negeri Sampeldes 03', status: 'Sekolah Dasar Negeri' },
      { nama: 'SD Negeri Sampeldes 04', status: 'Sekolah Dasar Negeri' },
      { nama: 'SD Negeri Sampeldes 05', status: 'Sekolah Dasar Negeri' },
      { nama: 'SD Negeri Sampeldes 06', status: 'Sekolah Dasar Negeri' },
    ],
    paudDanAgama: [
      { nama: 'Pendidikan Anak Usia Dini (PAUD) & TK', ket: 'Identifikasi awal (TK Kasih Ibu, PAUD Al-Amin, dll.)' },
      { nama: 'Raudhatul Athfal (RA) & Madrasah Ibtidaiyah (MI)', ket: 'Termasuk MI Ma’arif NU 11 Sampeldes' },
      { nama: 'Lembaga Pendidikan Keagamaan / TPQ', ket: 'Dikonfirmasi melalui Kemenag & Korwilbidik' },
    ],
  };

  // 6. Fasilitas Kesehatan Kecamatan Gandrungmangu (BPS 2024)
  const faskesKecamatan = [
    { jenis: 'Rumah sakit', jumlah: 0 },
    { jenis: 'Puskesmas rawat inap', jumlah: 1 },
    { jenis: 'Puskesmas tanpa rawat inap', jumlah: 4 },
    { jenis: 'Apotek', jumlah: 6 },
  ];

  return (
    <div className="space-y-6 sm:space-y-10">
      {/* 1. GAMBARAN UMUM DESA */}
      <div className="neu-card-elevated p-5 sm:p-8 md:p-10 rounded-[28px] border border-white/80 dark:border-white/10 space-y-5">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs font-semibold tracking-wider text-emerald-800 dark:text-teal-400 uppercase">
            <span className="w-5 h-[2px] bg-teal-500 shrink-0" />
            <span>Bagian 1 • Gambaran Umum Desa</span>
          </div>
          <h2 className="text-xl sm:text-3xl md:text-4xl font-condensed font-black uppercase tracking-tight text-slate-900 dark:text-white leading-tight">
            Profil & Gambaran Umum <span className="text-emerald-800 dark:text-teal-400">Desa Sampeldes</span>
          </h2>
          <p className="text-xs sm:text-sm font-bold text-stone-500 uppercase tracking-wider">
            Kecamatan Gandrungmangu, Kabupaten Cilacap, Provinsi Jawa Tengah
          </p>
        </div>

        <div className="prose prose-slate max-w-none text-stone-700 dark:text-stone-300 text-xs sm:text-sm leading-relaxed space-y-3">
          <p>
            Desa Sampeldes merupakan salah satu desa di wilayah Kecamatan Gandrungmangu, Kabupaten Cilacap, Provinsi Jawa Tengah. Desa ini memiliki wilayah yang cukup luas dengan masyarakat yang berperan aktif dalam penyelenggaraan pemerintahan, pembangunan, kegiatan sosial kemasyarakatan, dan pengembangan perekonomian lokal.
          </p>
          <p>
            Kehidupan masyarakat Desa Sampeldes tidak terlepas dari aktivitas perdesaan, termasuk pertanian, kegiatan perdagangan, usaha masyarakat, serta berbagai bentuk kerja sama sosial. Potensi tersebut menjadi modal penting dalam mendukung peningkatan kesejahteraan warga dan pembangunan desa secara berkelanjutan.
          </p>
          <p>
            Pemerintah Desa Sampeldes berperan dalam menyelenggarakan pelayanan publik, melaksanakan pembangunan, membina kehidupan kemasyarakatan, serta memberdayakan masyarakat sesuai kewenangan desa. Dalam pelaksanaannya, pemerintah desa bekerja bersama lembaga desa, tokoh masyarakat, kelompok tani, pemuda, dan berbagai unsur masyarakat lainnya.
          </p>
          <p>
            Melalui perencanaan yang partisipatif dan pengelolaan potensi wilayah secara tepat, Desa Sampeldes diharapkan terus berkembang menjadi desa yang maju, mandiri, dan mampu memberikan pelayanan yang semakin baik kepada masyarakat.
          </p>
        </div>

        {/* 2. DATA SINGKAT DESA GRID STATS */}
        <div className="pt-2">
          <div className="flex items-center gap-2 pb-3 text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider">
            <CheckCircle2 className="h-4 w-4 text-emerald-700 dark:text-teal-400" />
            <span>Bagian 2 • Data Singkat & Indikator Pokok</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5 sm:gap-3.5">
            <div className="p-3 sm:p-4 rounded-2xl neu-inset border border-stone-300/40 dark:border-white/10 text-center sm:text-left">
              <p className="text-[9px] sm:text-[10px] font-bold text-stone-500 uppercase tracking-wider truncate">Luas Wilayah</p>
              <p className="text-sm sm:text-xl font-condensed font-black text-slate-900 dark:text-white">11,07 <span className="text-[10px] font-normal text-stone-500">km²</span></p>
              <p className="text-[9px] text-emerald-700 dark:text-teal-400 font-bold">9,28% luas kec.</p>
            </div>
            <div className="p-3 sm:p-4 rounded-2xl neu-inset border border-stone-300/40 dark:border-white/10 text-center sm:text-left">
              <p className="text-[9px] sm:text-[10px] font-bold text-stone-500 uppercase tracking-wider truncate">Penduduk (BPS)</p>
              <p className="text-sm sm:text-xl font-condensed font-black text-slate-900 dark:text-white">8.775 <span className="text-[10px] font-normal text-stone-500">jiwa</span></p>
              <p className="text-[9px] text-emerald-700 dark:text-teal-400 font-bold">7,49% penduduk kec.</p>
            </div>
            <div className="p-3 sm:p-4 rounded-2xl neu-inset border border-stone-300/40 dark:border-white/10 text-center sm:text-left">
              <p className="text-[9px] sm:text-[10px] font-bold text-stone-500 uppercase tracking-wider truncate">Pemutakhiran Desa</p>
              <p className="text-sm sm:text-xl font-condensed font-black text-slate-900 dark:text-white">8.563 <span className="text-[10px] font-normal text-stone-500">jiwa</span></p>
              <p className="text-[9px] text-stone-500 font-medium">2.523 Kepala Keluarga</p>
            </div>
            <div className="p-3 sm:p-4 rounded-2xl neu-inset border border-stone-300/40 dark:border-white/10 text-center sm:text-left">
              <p className="text-[9px] sm:text-[10px] font-bold text-stone-500 uppercase tracking-wider truncate">Kepadatan</p>
              <p className="text-sm sm:text-xl font-condensed font-black text-slate-900 dark:text-white">793 <span className="text-[10px] font-normal text-stone-500">/km²</span></p>
              <p className="text-[9px] text-stone-500 font-medium">jiwa per km²</p>
            </div>
            <div className="p-3 sm:p-4 rounded-2xl neu-inset border border-stone-300/40 dark:border-white/10 text-center sm:text-left">
              <p className="text-[9px] sm:text-[10px] font-bold text-stone-500 uppercase tracking-wider truncate">Wilayah RT / RW</p>
              <p className="text-sm sm:text-xl font-condensed font-black text-slate-900 dark:text-white">4 RW / 41 RT</p>
              <p className="text-[9px] text-stone-500 font-medium">Rukun Warga & RT</p>
            </div>
            <div className="p-3 sm:p-4 rounded-2xl neu-inset border border-stone-300/40 dark:border-white/10 text-center sm:text-left">
              <p className="text-[9px] sm:text-[10px] font-bold text-stone-500 uppercase tracking-wider truncate">Jarak Akses</p>
              <p className="text-sm sm:text-xl font-condensed font-black text-slate-900 dark:text-white">3 km / 45 km</p>
              <p className="text-[9px] text-stone-500 font-medium">Kecamatan / Kab.</p>
            </div>
          </div>
        </div>
      </div>

      {/* 3. KONDISI GEOGRAFIS DAN KEWILAYAHAN */}
      <div className="neu-card-elevated p-5 sm:p-8 md:p-10 rounded-[28px] border border-white/80 dark:border-white/10 space-y-5">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs font-semibold tracking-wider text-emerald-800 dark:text-teal-400 uppercase">
            <span className="w-5 h-[2px] bg-teal-500 shrink-0" />
            <span>Bagian 3 • Kondisi Geografis dan Kewilayahan</span>
          </div>
          <h3 className="text-lg sm:text-2xl font-condensed font-black uppercase tracking-tight text-slate-900 dark:text-white">
            Kondisi Geografis, Batas Wilayah & Pembagian Administratif
          </h3>
          <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-300 leading-relaxed font-medium">
            Berdasarkan publikasi <em>Kecamatan Gandrungmangu Dalam Angka 2025</em>, Desa Sampeldes memiliki luas wilayah sekitar <strong>11,07 km²</strong>, atau setara dengan sekitar <strong>1.107 hektare</strong>. Luas tersebut mencakup sekitar <strong>9,28 persen</strong> dari luas Kecamatan Gandrungmangu. Jarak Desa Sampeldes ke pusat Kecamatan Gandrungmangu tercatat sekitar <strong>3 km</strong>. Posisi ini menjadi salah satu faktor yang mendukung keterhubungan wilayah desa dengan pusat pelayanan pemerintahan kecamatan.
          </p>
        </div>

        {/* Tabel Kewilayahan & Batas */}
        <div className="grid md:grid-cols-12 gap-5 items-start">
          <div className="md:col-span-7 neu-inset rounded-2xl border border-stone-300/40 dark:border-white/10 overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#070b10] text-white uppercase text-[10px] sm:text-xs font-condensed tracking-wider">
                <tr>
                  <th className="px-3 sm:px-4 py-2.5 font-bold">Indikator Kewilayahan Administratif</th>
                  <th className="px-3 sm:px-4 py-2.5 font-bold text-right">Data Resmi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200/50 dark:divide-white/5 bg-transparent">
                <tr className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                  <td className="px-3 sm:px-4 py-2.5 font-medium text-slate-800 dark:text-slate-200">Luas wilayah</td>
                  <td className="px-3 sm:px-4 py-2.5 font-black text-slate-900 dark:text-white text-right">11,07 km² (± 1.107 ha)</td>
                </tr>
                <tr className="bg-stone-500/5 hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                  <td className="px-3 sm:px-4 py-2.5 font-medium text-slate-800 dark:text-slate-200">Persentase terhadap luas kecamatan</td>
                  <td className="px-3 sm:px-4 py-2.5 font-black text-emerald-700 dark:text-teal-400 text-right">9,28%</td>
                </tr>
                <tr className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                  <td className="px-3 sm:px-4 py-2.5 font-medium text-slate-800 dark:text-slate-200">Jumlah Dusun Resmi</td>
                  <td className="px-3 sm:px-4 py-2.5 font-black text-emerald-700 dark:text-teal-400 text-right">2 Dusun (Dsn. Pangampiran & Dsn. Ciloning)</td>
                </tr>
                <tr className="bg-stone-500/5 hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                  <td className="px-3 sm:px-4 py-2.5 font-medium text-slate-800 dark:text-slate-200">Jumlah Rukun Warga (RW)</td>
                  <td className="px-3 sm:px-4 py-2.5 font-black text-slate-900 dark:text-white text-right">4 RW</td>
                </tr>
                <tr className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                  <td className="px-3 sm:px-4 py-2.5 font-medium text-slate-800 dark:text-slate-200">Jumlah Rukun Tetangga (RT)</td>
                  <td className="px-3 sm:px-4 py-2.5 font-black text-slate-900 dark:text-white text-right">41 RT</td>
                </tr>
                <tr className="bg-stone-500/5 hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                  <td className="px-3 sm:px-4 py-2.5 font-medium text-slate-800 dark:text-slate-200">Jarak ke pusat Kecamatan Gandrungmangu</td>
                  <td className="px-3 sm:px-4 py-2.5 font-black text-slate-900 dark:text-white text-right">± 3 km</td>
                </tr>
                <tr className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                  <td className="px-3 sm:px-4 py-2.5 font-medium text-slate-800 dark:text-slate-200">Jarak ke ibu kota Kabupaten Cilacap</td>
                  <td className="px-3 sm:px-4 py-2.5 font-black text-slate-900 dark:text-white text-right">± 45 km</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="md:col-span-5 space-y-3">
            <div className="p-4 rounded-2xl neu-inset border border-teal-500/30 bg-teal-500/5 space-y-2">
              <div className="flex items-center gap-2 text-slate-900 dark:text-white font-condensed font-bold uppercase text-xs">
                <MapPin className="h-4 w-4 text-emerald-700 dark:text-teal-400 shrink-0" />
                <span>Batas Wilayah Desa</span>
              </div>
              <p className="text-xs text-stone-700 dark:text-stone-300 leading-relaxed font-medium">
                Berdasarkan keterangan wilayah yang ditemukan dalam sumber lokal, Desa Sampeldes berbatasan dengan desa-desa di sekitarnya: antara lain <strong>Wringinharjo</strong> di sisi barat (desa pemekaran 1998), <strong>Cinangsi</strong> di sisi selatan, dan <strong>Muktisari</strong> di sisi timur. Sumber lokal juga menyebut kawasan <strong>Karanggedang dan Penyarang</strong> di sisi utara atau barat laut. Penetapan batas desa secara resmi mengacu pada peta batas administrasi dan dokumen pemerintah yang berlaku.
              </p>
            </div>

            <div className="p-4 rounded-2xl neu-inset border border-amber-500/30 bg-amber-500/5 space-y-1.5">
              <div className="flex items-center gap-2 text-amber-900 dark:text-amber-300 font-condensed font-bold uppercase text-xs">
                <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
                <span>Pembagian Wilayah Dusun</span>
              </div>
              <p className="text-xs text-stone-700 dark:text-stone-300 leading-relaxed font-medium">
                Wilayah Desa Sampeldes secara definitif terbagi menjadi <strong>2 Dusun</strong> resmi, yaitu <strong>Dusun Pangampiran</strong> dan <strong>Dusun Ciloning</strong>, yang membawahi 4 RW dan 41 RT. Pembagian wilayah ini menjadi basis pelayanan administrasi pemerintahan, penarikan PBB-P2, gotong royong, dan pembangunan infrastruktur desa.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 4. DATA KEPENDUDUKAN */}
      <div className="neu-card-elevated p-5 sm:p-8 md:p-10 rounded-[28px] border border-white/80 dark:border-white/10 space-y-5">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs font-semibold tracking-wider text-emerald-800 dark:text-teal-400 uppercase">
            <span className="w-5 h-[2px] bg-teal-500 shrink-0" />
            <span>Bagian 4 • Data Kependudukan</span>
          </div>
          <h3 className="text-lg sm:text-2xl font-condensed font-black uppercase tracking-tight text-slate-900 dark:text-white">
            Data & Komposisi Kependudukan Desa Sampeldes
          </h3>
          <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-300 leading-relaxed font-medium">
            Data kependudukan merupakan dasar penting dalam perencanaan pembangunan dan penyelenggaraan pelayanan publik. Informasi jumlah penduduk digunakan untuk mendukung perencanaan pendidikan, kesehatan, perlindungan sosial, pembangunan infrastruktur, dan pemberdayaan ekonomi.
          </p>
        </div>

        {/* Komparasi Dua Sumber Resmi */}
        <div className="grid md:grid-cols-2 gap-4">
          {/* Card Sumber BPS 2024 */}
          <div className="p-5 rounded-2xl neu-inset border border-stone-300/40 dark:border-white/10 space-y-3">
            <div className="flex items-center justify-between border-b border-stone-200/60 dark:border-white/10 pb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400">1. Publikasi BPS Kabupaten Cilacap</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-700 dark:text-teal-300 font-bold">Data Tahun 2024</span>
            </div>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-stone-200/40 dark:border-white/5">
                <span className="text-stone-600 dark:text-stone-400">Jumlah Penduduk:</span>
                <span className="font-black text-slate-900 dark:text-white">8.775 jiwa</span>
              </div>
              <div className="flex justify-between py-1 border-b border-stone-200/40 dark:border-white/5">
                <span className="text-stone-600 dark:text-stone-400">Penduduk Laki-laki:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">4.393 jiwa</span>
              </div>
              <div className="flex justify-between py-1 border-b border-stone-200/40 dark:border-white/5">
                <span className="text-stone-600 dark:text-stone-400">Penduduk Perempuan:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">4.382 jiwa</span>
              </div>
              <div className="flex justify-between py-1 border-b border-stone-200/40 dark:border-white/5">
                <span className="text-stone-600 dark:text-stone-400">Kepadatan Penduduk:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">± 793 jiwa per km²</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-stone-600 dark:text-stone-400">Persentase Kecamatan:</span>
                <span className="font-bold text-emerald-700 dark:text-teal-400">± 7,49 persen</span>
              </div>
            </div>
            <p className="text-[10px] text-stone-500 italic pt-1">
              Sumber: <em>Kecamatan Gandrungmangu Dalam Angka 2025</em> (Disdukcapil Kabupaten Cilacap).
            </p>
          </div>

          {/* Card Pemutakhiran Data Desa */}
          <div className="p-5 rounded-2xl neu-inset border border-stone-300/40 dark:border-white/10 space-y-3">
            <div className="flex items-center justify-between border-b border-stone-200/60 dark:border-white/10 pb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">2. Pembaruan Administrasi Desa</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-bold">Data Monografi</span>
            </div>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-stone-200/40 dark:border-white/5">
                <span className="text-stone-600 dark:text-stone-400">Jumlah Penduduk:</span>
                <span className="font-black text-slate-900 dark:text-white">8.563 jiwa</span>
              </div>
              <div className="flex justify-between py-1 border-b border-stone-200/40 dark:border-white/5">
                <span className="text-stone-600 dark:text-stone-400">Penduduk Laki-laki:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">4.132 jiwa</span>
              </div>
              <div className="flex justify-between py-1 border-b border-stone-200/40 dark:border-white/5">
                <span className="text-stone-600 dark:text-stone-400">Penduduk Perempuan:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">4.431 jiwa</span>
              </div>
              <div className="flex justify-between py-1 border-b border-stone-200/40 dark:border-white/5">
                <span className="text-stone-600 dark:text-stone-400">Kepala Keluarga (KK):</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">2.523 KK</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-stone-600 dark:text-stone-400">Cakupan Wilayah:</span>
                <span className="font-bold text-emerald-700 dark:text-teal-400">4 RW dan 41 RT</span>
              </div>
            </div>
            <p className="text-[10px] text-stone-500 italic pt-1">
              Sumber: Bahan pemutakhiran data administrasi Pemerintah Desa Sampeldes.
            </p>
          </div>
        </div>

        {/* Catatan Metodologi Transparan */}
        <div className="p-4 rounded-2xl neu-inset border border-blue-500/30 bg-blue-500/5 text-xs text-stone-700 dark:text-stone-300 space-y-1.5">
          <div className="flex items-center gap-1.5 text-blue-900 dark:text-blue-300 font-bold uppercase text-[11px]">
            <Info className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0" />
            <span>Keterangan Transparansi Dua Periode Data</span>
          </div>
          <p className="leading-relaxed">
            Perbedaan angka dapat terjadi karena perbedaan waktu pendataan, sumber administrasi, dan metode penghitungan. Oleh karena itu, angka BPS tahun 2024 (8.775 jiwa) dan angka pembaruan desa (8.563 jiwa / 2.523 KK) ditampilkan sesuai periode masing-masing, bukan dicampur dalam satu data, agar memberikan informasi yang akurat dan dapat dipertanggungjawabkan.
          </p>
        </div>
      </div>

      {/* 5. PENDIDIKAN */}
      <div className="neu-card-elevated p-5 sm:p-8 md:p-10 rounded-[28px] border border-white/80 dark:border-white/10 space-y-5">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs font-semibold tracking-wider text-emerald-800 dark:text-teal-400 uppercase">
            <span className="w-5 h-[2px] bg-teal-500 shrink-0" />
            <span>Bagian 5 • Pendidikan</span>
          </div>
          <h3 className="text-lg sm:text-2xl font-condensed font-black uppercase tracking-tight text-slate-900 dark:text-white">
            Pendidikan & Satuan Pembelajaran Desa Sampeldes
          </h3>
          <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-300 leading-relaxed font-medium">
            Pendidikan merupakan salah satu unsur utama dalam meningkatkan kualitas sumber daya manusia Desa Sampeldes. Ketersediaan layanan pendidikan, mulai dari pendidikan anak usia dini hingga pendidikan dasar dan lanjutan, menjadi bagian penting dalam mendukung perkembangan masyarakat.
          </p>
        </div>

        {/* SATUAN PENDIDIKAN DI DESA SAMPELDES */}
        <div className="p-4 sm:p-6 rounded-2xl neu-inset border border-stone-300/40 dark:border-white/10 space-y-4">
          <div className="flex items-center gap-2 text-slate-900 dark:text-white font-condensed font-bold uppercase text-xs sm:text-base">
            <School className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-700 dark:text-teal-400" />
            <span>Satuan Pendidikan di Desa Sampeldes (Teridentifikasi)</span>
          </div>
          <p className="text-xs text-stone-600 dark:text-stone-300 font-medium leading-relaxed">
            Berdasarkan penelusuran sumber daring dan data kewilayahan, terdapat sejumlah satuan pendidikan yang menggunakan nama Desa Sampeldes atau tercatat beralamat di wilayah tersebut:
          </p>

          <div className="grid sm:grid-cols-2 gap-4">
            {/* SEKOLAH DASAR NEGERI 01 - 06 */}
            <div className="neu-card-elevated p-4 sm:p-5 rounded-2xl border border-white/80 dark:border-white/10 space-y-2.5">
              <h5 className="font-condensed font-bold uppercase text-xs sm:text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-700 dark:bg-teal-500" />
                <span>Sekolah Dasar Negeri (SDN)</span>
              </h5>
              <div className="space-y-1.5 pt-1">
                {sekolahSampeldes.sdNegeri.map((item, idx) => (
                  <div key={idx} className="p-2.5 rounded-xl neu-inset border border-stone-200/50 dark:border-white/5 flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                      <BookOpen className="h-3.5 w-3.5 text-emerald-700 dark:text-teal-400 shrink-0" />
                      {item.nama}
                    </span>
                    <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-teal-500/20 text-emerald-800 dark:text-teal-400 font-semibold">{item.status}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* PAUD, TK, RA & KEAGAMAAN */}
            <div className="neu-card-elevated p-4 sm:p-5 rounded-2xl border border-white/80 dark:border-white/10 space-y-2.5">
              <h5 className="font-condensed font-bold uppercase text-xs sm:text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-teal-500" />
                <span>PAUD, TK, RA & Pendidikan Keagamaan</span>
              </h5>
              <div className="space-y-2 pt-1">
                {sekolahSampeldes.paudDanAgama.map((item, idx) => (
                  <div key={idx} className="p-3 rounded-xl neu-inset border border-stone-200/50 dark:border-white/5 text-xs space-y-1">
                    <p className="font-bold text-slate-800 dark:text-slate-100">{item.nama}</p>
                    <p className="text-[11px] text-stone-500 dark:text-stone-400">{item.ket}</p>
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-stone-500 italic pt-1">
                *Data satuan pendidikan PAUD, TK, RA, dan lembaga pendidikan keagamaan lainnya dicocokkan kembali melalui basis data Kemendikdasmen, Kementerian Agama, serta pendataan Korwilbidik Kecamatan Gandrungmangu.
              </p>
            </div>
          </div>
        </div>

        {/* ARAH PENGEMBANGAN PENDIDIKAN */}
        <div className="p-4 sm:p-5 rounded-2xl neu-inset border border-stone-300/40 dark:border-white/10 space-y-2">
          <h5 className="font-bold text-slate-900 dark:text-white uppercase text-xs flex items-center gap-1.5">
            <GraduationCap className="h-4 w-4 text-emerald-700 dark:text-teal-400" />
            <span>Arah Pengembangan Pendidikan Desa Sampeldes</span>
          </h5>
          <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed font-medium">
            Pengembangan pendidikan di Desa Sampeldes didukung melalui peningkatan mutu pembelajaran, kompetensi tenaga pendidik, perbaikan sarana-prasarana, pemenuhan fasilitas sanitasi, penguatan pendidikan karakter, serta perluasan akses pendidikan yang inklusif. Rincian data peserta didik, guru, ruang kelas, kondisi bangunan, prestasi, akreditasi, dan penerima bantuan pendidikan (PIP) terus dihimpun dari Korwilbidik Kecamatan Gandrungmangu serta masing-masing satuan pendidikan.
          </p>
        </div>
      </div>

      {/* 6. KESEHATAN DAN PELAYANAN DASAR */}
      <div className="neu-card-elevated p-5 sm:p-8 md:p-10 rounded-[28px] border border-white/80 dark:border-white/10 space-y-5">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs font-semibold tracking-wider text-emerald-800 dark:text-teal-400 uppercase">
            <span className="w-5 h-[2px] bg-teal-500 shrink-0" />
            <span>Bagian 6 • Kesehatan dan Pelayanan Dasar</span>
          </div>
          <h3 className="text-lg sm:text-2xl font-condensed font-black uppercase tracking-tight text-slate-900 dark:text-white">
            Pembangunan Kesehatan & Pelayanan Dasar Masyarakat
          </h3>
          <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-300 leading-relaxed font-medium">
            Pembangunan kesehatan merupakan bagian penting dalam meningkatkan kualitas hidup masyarakat Desa Sampeldes. Pelayanan kesehatan dasar, upaya pencegahan penyakit, pemantauan tumbuh kembang anak, dan peningkatan kesadaran masyarakat mengenai pola hidup bersih dan sehat menjadi unsur penting dalam pembangunan manusia.
          </p>
        </div>

        {/* 8 FOKUS PENGEMBANGAN KESEHATAN */}
        <div className="p-5 rounded-2xl neu-inset border border-stone-300/40 dark:border-white/10 space-y-3">
          <div className="flex items-center gap-2 text-slate-900 dark:text-white font-condensed font-bold uppercase text-xs sm:text-sm">
            <Stethoscope className="h-4 w-4 text-emerald-700 dark:text-teal-400" />
            <span>8 Arah Fokus Pelayanan Kesehatan Desa Sampeldes</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5 text-xs">
            {[
              { no: 1, title: 'Kesehatan Ibu & Anak', desc: 'Pelayanan terpadu pemeriksaan kehamilan dan pasca persalinan.' },
              { no: 2, title: 'Tumbuh Kembang Balita', desc: 'Pemantauan pertumbuhan, penimbangan, dan imunisasi berkala.' },
              { no: 3, title: 'Penanganan Gizi & Stunting', desc: 'Pencegahan dan intervensi masalah gizi serta PMT bergizi.' },
              { no: 4, title: 'Kesehatan Lanjut Usia', desc: 'Pelayanan kesehatan, skrining berkala, dan senam Posyandu lansia.' },
              { no: 5, title: 'Pola Hidup Bersih & Sehat', desc: 'Peningkatan kesadaran masyarakat mengenai sanitasi dan PHBS.' },
              { no: 6, title: 'Pencegahan Penyakit', desc: 'Pengendalian penyakit menular dan pemantauan penyakit tidak menular.' },
              { no: 7, title: 'Penguatan Posyandu', desc: 'Pemberdayaan Posyandu dan peningkatan kapasitas kader kesehatan.' },
              { no: 8, title: 'Akses Pelayanan Dasar', desc: 'Peningkatan kemudahan akses warga ke sarana kesehatan puskesmas.' },
            ].map((item) => (
              <div key={item.no} className="p-3 rounded-xl neu-card-elevated border border-white/80 dark:border-white/10 space-y-1">
                <span className="text-[10px] font-bold text-teal-600 dark:text-teal-400">Fokus #{item.no}</span>
                <p className="font-bold text-slate-900 dark:text-white">{item.title}</p>
                <p className="text-[10px] text-stone-500 dark:text-stone-400 leading-tight">{item.desc}</p>
              </div>
            ))}
          </div>
          <p className="text-[10px] text-stone-500 italic pt-1">
            *Jumlah Posyandu, kader kesehatan, peserta layanan, tenaga kesehatan, dan fasilitas kesehatan yang secara khusus berada di Desa Sampeldes dilengkapi berdasarkan data pemerintah desa dan puskesmas yang membawahi wilayah tersebut.
          </p>
        </div>
      </div>

      {/* 7 & 8. SOSIAL, KEMASYARAKATAN, PEREKONOMIAN */}
      <div className="grid md:grid-cols-12 gap-5 items-stretch">
        {/* 7. KONDISI SOSIAL DAN KEMASYARAKATAN */}
        <div className="md:col-span-6 neu-card-elevated p-5 sm:p-7 rounded-[28px] border border-white/80 dark:border-white/10 space-y-3 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold tracking-wider text-emerald-800 dark:text-teal-400 uppercase">
              <span className="w-5 h-[2px] bg-teal-500 shrink-0" />
              <span>Bagian 7 • Kondisi Sosial & Kemasyarakatan</span>
            </div>
            <h4 className="text-base sm:text-xl font-condensed font-black uppercase tracking-tight text-slate-900 dark:text-white">
              Modal Sosial, Kelembagaan & Gotong Royong
            </h4>
            <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed font-medium">
              Kehidupan sosial masyarakat Desa Sampeldes ditopang oleh hubungan kemasyarakatan, partisipasi warga, dan kerja sama dalam kegiatan pembangunan. Semangat gotong royong serta keterlibatan masyarakat merupakan modal sosial yang penting untuk mendukung pembangunan desa.
            </p>
            <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed font-medium">
              Partisipasi diwujudkan melalui musyawarah desa, kegiatan sosial, kerja bakti, kegiatan keagamaan, pembinaan generasi muda, serta keterlibatan warga dalam program pemberdayaan. Lembaga kemasyarakatan seperti <strong>RT, RW, PKK, Karang Taruna, dan kelompok keagamaan</strong> menjadi mitra aktif pemerintah desa.
            </p>
          </div>
          <div className="p-3.5 rounded-2xl neu-inset border border-stone-300/40 dark:border-white/10 text-[11px] text-stone-600 dark:text-stone-300 space-y-1">
            <p className="font-bold text-slate-900 dark:text-white uppercase text-[10px]">Pilar Kemitraan Warga:</p>
            <p className="leading-relaxed">
              Penguatan kehidupan sosial kemasyarakatan didukung pendataan lembaga aktif, kelompok kegiatan, agenda rutin, dan capaian masyarakat secara terbuka.
            </p>
          </div>
        </div>

        {/* 8. PEREKONOMIAN DAN MATA PENCAHARIAN */}
        <div className="md:col-span-6 neu-card-elevated p-5 sm:p-7 rounded-[28px] border border-white/80 dark:border-white/10 space-y-3 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold tracking-wider text-emerald-800 dark:text-teal-400 uppercase">
              <span className="w-5 h-[2px] bg-teal-500 shrink-0" />
              <span>Bagian 8 • Perekonomian & Mata Pencaharian</span>
            </div>
            <h4 className="text-base sm:text-xl font-condensed font-black uppercase tracking-tight text-slate-900 dark:text-white">
              Pertanian, UMKM & Kelembagaan Ekonomi
            </h4>
            <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed font-medium">
              Perekonomian Desa Sampeldes merupakan bagian dari kegiatan ekonomi perdesaan di Kecamatan Gandrungmangu. Aktivitas pertanian, usaha perdagangan, usaha rumah tangga, dan kegiatan produktif lainnya menjadi bagian penting dalam mendukung pendapatan serta kesejahteraan masyarakat.
            </p>
            <div className="grid grid-cols-2 gap-2 text-[10px] text-stone-700 dark:text-stone-300 pt-1">
              <span className="p-2 rounded-xl neu-inset">• Peningkatan produktivitas usaha</span>
              <span className="p-2 rounded-xl neu-inset">• Penguatan UMKM desa</span>
              <span className="p-2 rounded-xl neu-inset">• Pemasaran produk lokal</span>
              <span className="p-2 rounded-xl neu-inset">• Kapasitas kelompok tani</span>
              <span className="p-2 rounded-xl neu-inset">• Kelembagaan BUM Desa</span>
              <span className="p-2 rounded-xl neu-inset">• Pemanfaatan TI / Pemasaran Digital</span>
            </div>
          </div>
          <div className="p-3.5 rounded-2xl neu-inset border border-stone-300/40 dark:border-white/10 text-[11px] text-stone-600 dark:text-stone-300 space-y-1">
            <p className="font-bold text-slate-900 dark:text-white uppercase text-[10px]">Data BUM Desa & UMKM:</p>
            <p className="leading-relaxed">
              Penetapan komoditas unggulan, luas lahan pertanian, jumlah petani, BUM Desa, unit usaha, dan kelompok tani mengacu pada inventarisasi resmi Pemerintah Desa Sampeldes.
            </p>
          </div>
        </div>
      </div>

      {/* 9 & 10. INFRASTRUKTUR DAN TATA KELOLA PEMERINTAHAN */}
      <div className="grid md:grid-cols-12 gap-5 items-stretch">
        {/* 9. INFRASTRUKTUR DAN PEMBANGUNAN DESA */}
        <div className="md:col-span-6 neu-card-elevated p-5 sm:p-7 rounded-[28px] border border-white/80 dark:border-white/10 space-y-3 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold tracking-wider text-emerald-800 dark:text-teal-400 uppercase">
              <span className="w-5 h-[2px] bg-teal-500 shrink-0" />
              <span>Bagian 9 • Infrastruktur & Pembangunan Desa</span>
            </div>
            <h4 className="text-base sm:text-xl font-condensed font-black uppercase tracking-tight text-slate-900 dark:text-white">
              Konektivitas, Ruas Jalan & Sarana Publik
            </h4>
            <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed font-medium">
              Infrastruktur berperan penting dalam mendukung mobilitas penduduk, distribusi hasil produksi, akses pendidikan dan kesehatan, serta keterhubungan antarwilayah. Pembangunan mencakup jalan desa dan lingkungan, drainase, jembatan, sarana air bersih, sanitasi, irigasi, fasilitas umum, serta sarana pendukung sosial-ekonomi.
            </p>
            <div className="p-3 rounded-xl neu-inset text-xs space-y-1 text-stone-700 dark:text-stone-300">
              <p className="font-bold text-slate-900 dark:text-white text-[11px]">Ruas Jalan Perhatian Utama:</p>
              <p>• Ruas Gandrungmangu – Ciloning</p>
              <p>• Akses menuju SMP Negeri 3 Gandrungmangu</p>
              <p>• Ruas Sampeldes – Karanggedang</p>
            </div>
          </div>
          <p className="text-[10px] text-stone-500 italic">
            *Data ruas merupakan bahan perencanaan pembangunan yang terus dimutakhirkan sesuai kondisi lapangan dan dokumen teknis terbaru.
          </p>
        </div>

        {/* 10. PEMERINTAHAN DAN KELEMBAGAAN DESA */}
        <div className="md:col-span-6 neu-card-elevated p-5 sm:p-7 rounded-[28px] border border-white/80 dark:border-white/10 space-y-3 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold tracking-wider text-emerald-800 dark:text-teal-400 uppercase">
              <span className="w-5 h-[2px] bg-teal-500 shrink-0" />
              <span>Bagian 10 • Pemerintahan & Kelembagaan</span>
            </div>
            <h4 className="text-base sm:text-xl font-condensed font-black uppercase tracking-tight text-slate-900 dark:text-white">
              Tata Kelola Pemerintahan, BPD & Transparansi
            </h4>
            <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed font-medium">
              Pemerintah Desa Sampeldes melaksanakan fungsi penyelenggaraan pemerintahan, pelaksanaan pembangunan, pembinaan kemasyarakatan, dan pemberdayaan masyarakat. Dalam menjalankan tugasnya, pemerintah desa bekerja sama dengan Badan Permusyawaratan Desa (BPD), lembaga kemasyarakatan, unsur kewilayahan, dan masyarakat.
            </p>
            <div className="space-y-1 text-xs text-stone-700 dark:text-stone-300">
              <p>• Peningkatan kualitas pelayanan administrasi desa yang ramah & cepat</p>
              <p>• Pengelolaan keuangan desa yang transparan, efektif, dan akuntabel</p>
              <p>• Penyediaan informasi publik yang terbuka dan mudah diakses warga</p>
              <p>• Pemanfaatan sistem informasi desa digital untuk pelayanan publik</p>
            </div>
          </div>
          <div className="p-3.5 rounded-2xl neu-inset border border-stone-300/40 dark:border-white/10 text-[11px] text-stone-600 dark:text-stone-300">
            Nama kades, perangkat desa, BPD, struktur organisasi, dan visi-misi ditampilkan sesuai data resmi yang berlaku.
          </div>
        </div>
      </div>

      {/* 11 & 12. STATUS PERKEMBANGAN & POTENSI PENGEMBANGAN */}
      <div className="grid md:grid-cols-12 gap-5 items-stretch">
        {/* 11. STATUS PERKEMBANGAN DAN ARAH PEMBANGUNAN */}
        <div className="md:col-span-6 neu-card-elevated p-5 sm:p-7 rounded-[28px] border border-white/80 dark:border-white/10 space-y-3 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold tracking-wider text-emerald-800 dark:text-teal-400 uppercase">
              <span className="w-5 h-[2px] bg-teal-500 shrink-0" />
              <span>Bagian 11 • Status Perkembangan Desa</span>
            </div>
            <h4 className="text-base sm:text-xl font-condensed font-black uppercase tracking-tight text-slate-900 dark:text-white">
              Status Maju (2025–2026) Menuju Mandiri (2027)
            </h4>
            <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed font-medium">
              Dalam bahan pembahasan pemerintahan yang pernah disampaikan, Desa Sampeldes tercatat berada pada kategori <strong>Maju</strong> dalam pemutakhiran Indeks Desa tahun 2025–2026, dengan target menuju kategori <strong>Mandiri</strong> pada tahun 2027.
            </p>
            <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed font-medium">
              Peningkatan status memerlukan kerja bersama dalam memperkuat pelayanan dasar, meningkatkan kualitas sumber daya manusia, mengembangkan perekonomian lokal, memperbaiki infrastruktur, memperkuat kelembagaan, serta meningkatkan ketahanan sosial dan lingkungan hidup.
            </p>
          </div>
          <div className="p-3.5 rounded-2xl neu-inset border border-emerald-500/30 bg-emerald-500/5 text-xs text-emerald-950 dark:text-emerald-200">
            <strong>Target Strategis:</strong> Pemantapan indikator pelayanan dasar, sosial, dan ekonomi menuju penetapan definitif Desa Mandiri tahun 2027.
          </div>
        </div>

        {/* 12. POTENSI DAN ARAH PENGEMBANGAN */}
        <div className="md:col-span-6 neu-card-elevated p-5 sm:p-7 rounded-[28px] border border-white/80 dark:border-white/10 space-y-3 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold tracking-wider text-emerald-800 dark:text-teal-400 uppercase">
              <span className="w-5 h-[2px] bg-teal-500 shrink-0" />
              <span>Bagian 12 • Potensi Pengembangan Desa</span>
            </div>
            <h4 className="text-base sm:text-xl font-condensed font-black uppercase tracking-tight text-slate-900 dark:text-white">
              5 Pilar Potensi & Arah Pengembangan
            </h4>
            <div className="space-y-1.5 text-xs text-stone-700 dark:text-stone-300">
              <p><strong>1. SDM:</strong> Kualitas pendidikan, vokasi kerja, & generasi muda.</p>
              <p><strong>2. Pertanian & Ekonomi:</strong> Pemetaan lahan, komoditas, & UMKM.</p>
              <p><strong>3. Sosial & Kelembagaan:</strong> Gotong royong, PKK, RT/RW, & Karang Taruna.</p>
              <p><strong>4. Sejarah & Budaya:</strong> Pemekaran Wringinharjo, cerita sesepuh, & Petilasan Indrajit.</p>
              <p><strong>5. Digitalisasi:</strong> Layanan publik website desa & keterbukaan informasi.</p>
            </div>
          </div>
          <p className="text-[10px] text-stone-500 italic">
            *Penetapan potensi unggulan resmi desa didukung oleh data dan hasil musyawarah bersama pemerintah desa serta masyarakat.
          </p>
        </div>
      </div>

      {/* 13. KOMITMEN PEMBANGUNAN DESA */}
      <div className="neu-card-elevated-dark p-5 sm:p-8 md:p-10 rounded-[28px] border border-white/10 text-white space-y-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs font-semibold tracking-wider text-teal-400 uppercase">
            <span className="w-5 h-[2px] bg-teal-500 shrink-0" />
            <span>Bagian 13 • Komitmen Pembangunan Desa</span>
          </div>
          <h3 className="text-lg sm:text-2xl font-condensed font-black uppercase tracking-tight text-white">
            Komitmen Bersama Membangun Desa Sampeldes
          </h3>
          <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-medium">
            Pembangunan Desa Sampeldes membutuhkan kerja sama antara pemerintah desa, lembaga desa, kelompok masyarakat, pelaku usaha, dan seluruh warga. Partisipasi masyarakat merupakan unsur penting dalam memastikan pembangunan berjalan sesuai kebutuhan dan memberikan manfaat yang luas.
          </p>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-medium">
            Melalui perencanaan yang partisipatif, peningkatan kualitas pelayanan, pengembangan potensi ekonomi, pemeliharaan infrastruktur, dan penguatan keterbukaan informasi publik, Desa Sampeldes diharapkan dapat terus meningkatkan kualitas pembangunan serta kesejahteraan masyarakat. Profil ini menjadi sarana informasi resmi yang terus dimutakhirkan secara berkala agar tetap relevan, akurat, dan dapat dipertanggungjawabkan.
          </p>
        </div>
      </div>

      {/* TABEL LENGKAP REKAPITULASI DATA */}
      <div className="neu-card-elevated p-5 sm:p-8 md:p-10 rounded-[28px] border border-white/80 dark:border-white/10 space-y-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-semibold tracking-wider text-emerald-800 dark:text-teal-400 uppercase">
            <span className="w-5 h-[2px] bg-teal-500 shrink-0" />
            <span>Rekapitulasi Indikator Utama</span>
          </div>
          <h3 className="text-lg sm:text-2xl font-condensed font-black uppercase tracking-tight text-slate-900 dark:text-white">
            Tabel Lengkap Ringkasan <span className="text-emerald-800 dark:text-teal-400">Desa Sampeldes</span>
          </h3>
          <p className="text-stone-500 text-[11px] sm:text-xs font-medium">
            Rangkuman lengkap indikator geografis, kependudukan, dan administratif berdasarkan publikasi resmi BPS dan data pemutakhiran desa.
          </p>
        </div>

        <div className="neu-inset rounded-2xl border border-stone-300/40 dark:border-white/10 overflow-hidden w-full">
          <table className="w-full text-left text-[11px] sm:text-xs">
            <thead className="bg-[#070b10] text-white uppercase text-[9px] sm:text-xs font-condensed tracking-wider">
              <tr>
                <th className="px-3 sm:px-4 py-2.5 sm:py-3.5 font-bold w-1/2">Data Indikator</th>
                <th className="px-3 sm:px-4 py-2.5 sm:py-3.5 font-bold w-1/2">Keterangan / Nilai Resmi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200/50 dark:divide-white/5 bg-transparent">
              {dataSingkat.map((row, idx) => (
                <tr key={idx} className={idx % 2 === 0 ? "hover:bg-black/5 dark:hover:bg-white/5 transition-colors" : "bg-stone-500/5 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"}>
                  <td className="px-3 sm:px-4 py-2.5 sm:py-3 font-bold text-slate-900 dark:text-white break-words leading-tight">{row.label}</td>
                  <td className="px-3 sm:px-4 py-2.5 sm:py-3 text-stone-600 dark:text-stone-300 font-medium break-words leading-tight">{row.val}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function PotensiTab({ profileData }: { profileData?: any }) {
  const potentials = [
    {
      title: '1. Potensi Sumber Daya Manusia',
      desc: 'Peningkatan kualitas pendidikan, keterampilan kerja, kapasitas pelaku usaha, dan partisipasi aktif generasi muda untuk mendukung pembangunan desa yang berkelanjutan.',
      icon: Users,
      color: 'text-emerald-700 dark:text-emerald-400',
    },
    {
      title: '2. Potensi Pertanian & Ekonomi Lokal',
      desc: profileData?.potensiPertanian || 'Pemetaan lahan sawah produktif, komoditas unggulan, kelompok tani, usaha rumah tangga (UMKM), dan kegiatan perdagangan guna memacu produktivitas serta memperluas pasar.',
      icon: Sprout,
      color: 'text-green-700 dark:text-green-400',
    },
    {
      title: '3. Potensi Sosial & Kelembagaan',
      desc: 'Semangat gotong royong warga, kegiatan kemasyarakatan, Karang Taruna, PKK, RT/RW, dan lembaga desa yang menjadi kekuatan solid dalam pelaksanaan program pembangunan.',
      icon: Target,
      color: 'text-blue-600 dark:text-blue-400',
    },
    {
      title: '4. Potensi Sejarah & Budaya Lokal',
      desc: 'Pendokumentasian sejarah pemekaran wilayah Wringinharjo 1998, kearifan tutur sesepuh, situs Petilasan Indrajit, dan peninggalan lokal untuk menjaga identitas desa.',
      icon: Sparkles,
      color: 'text-amber-600 dark:text-amber-400',
    },
    {
      title: '5. Potensi Pelayanan Publik Digital',
      desc: 'Pemanfaatan website resmi desa untuk mempermudah warga mengakses informasi pemerintahan, statistik, pembangunan, produk hukum, dan layanan administrasi mandiri.',
      icon: Laptop,
      color: 'text-cyan-600 dark:text-cyan-400',
    },
    {
      title: '6. Potensi Ketahanan Pangan & BUM Desa',
      desc: 'Pengembangan terintegrasi sektor pertanian pangan, peternakan produktif, dan kelembagaan BUM Desa guna memantapkan kemandirian ekonomi desa menuju Desa Mandiri.',
      icon: Store,
      color: 'text-purple-600 dark:text-purple-400',
    },
  ];

  return (
    <div className="space-y-6 sm:space-y-12">
      <div className="text-center space-y-2 max-w-3xl mx-auto">
        <div className="flex items-center justify-center gap-2 text-xs font-semibold tracking-wider text-emerald-800 dark:text-teal-400 uppercase">
          <span className="w-5 h-[2px] bg-teal-500 shrink-0" />
          <span>Bagian 12 • Potensi dan Arah Pengembangan</span>
          <span className="w-5 h-[2px] bg-teal-500 shrink-0" />
        </div>
        <h2 className="text-2xl sm:text-4xl md:text-5xl font-condensed font-black uppercase tracking-tight text-slate-900 dark:text-white leading-none">
          Potensi <span className="text-emerald-800 dark:text-teal-400">Pengembangan Desa</span>
        </h2>
        <p className="text-stone-400 font-bold uppercase text-[10px] sm:text-xs tracking-wider">
          SDM • Pertanian & Ekonomi • Sosial Kelembagaan • Sejarah & Budaya • Layanan Digital • Ketahanan Pangan
        </p>
      </div>

      {/* 6 POTENSI UNGGULAN GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {potentials.map((item, i) => (
          <div
            key={i}
            className={cn(
              "neu-card-elevated rounded-2xl sm:rounded-[28px] border border-white/80 dark:border-white/10 hover:border-teal-400 transition-all duration-300 group flex flex-col justify-between p-5 sm:p-7",
              i === 6 ? "sm:col-span-2 lg:col-span-1" : ""
            )}
          >
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl neu-inset border border-stone-200/50 dark:border-white/5 flex items-center justify-center transition-transform group-hover:scale-110 shrink-0">
                <item.icon className={cn("h-6 w-6", item.color)} />
              </div>
              <div className="space-y-1.5">
                <h4 className="text-sm sm:text-base font-condensed font-black uppercase tracking-tight text-slate-900 dark:text-white leading-tight">
                  {item.title}
                </h4>
                <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed font-medium">
                  {item.desc}
                </p>
              </div>
            </div>
            <div className="w-8 h-1 bg-teal-500 rounded-full group-hover:w-full transition-all duration-300 mt-4" />
          </div>
        ))}
      </div>

      {/* STRATEGI PENGEMBANGAN UMKM & INFRASTRUKTUR */}
      <div className="grid md:grid-cols-12 gap-5 sm:gap-8">
        {/* 10. PEREKONOMIAN & UMKM */}
        <div className="md:col-span-7 neu-card-elevated p-5 sm:p-8 rounded-[28px] border border-white/80 dark:border-white/10 space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 neu-inset rounded-2xl text-emerald-800 dark:text-teal-400">
              <Store className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-base sm:text-xl font-condensed font-black uppercase text-slate-900 dark:text-white">Arah Pengembangan UMKM Desa</h4>
              <p className="text-[10px] sm:text-xs text-stone-500 font-bold uppercase tracking-wider">Pemberdayaan Usaha Mikro & Rumah Tangga</p>
            </div>
          </div>
          <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-300 leading-relaxed font-medium">
            Selain sektor pertanian, usaha mikro, kecil, perdagangan, jasa, serta berbagai usaha rumah tangga memiliki potensi besar untuk dikembangkan sebagai sumber pendapatan masyarakat melalui strategi:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] sm:text-xs">
            {[
              "Peningkatan kualitas produk lokal",
              "Pengemasan & standardisasi produk",
              "Pemasaran digital berbasis media sosial & web",
              "Perluasan jaringan pemasaran antarwilayah",
              "Peningkatan kapasitas & pelatihan pelaku usaha",
              "Penguatan kelembagaan ekonomi masyarakat",
              "Pengembangan produk unggulan khas desa",
              "Pemanfaatan teknologi informasi pemasaran",
            ].map((pt, idx) => (
              <div key={idx} className="flex items-center gap-2 p-2.5 rounded-xl neu-inset border border-stone-200/50 dark:border-white/5 text-slate-800 dark:text-slate-200">
                <Check className="h-3.5 w-3.5 text-emerald-700 dark:text-teal-400 shrink-0" />
                <span className="font-semibold leading-tight">{pt}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 17. INFRASTRUKTUR & PEMBANGUNAN DESA */}
        <div className="md:col-span-5 neu-card-elevated p-5 sm:p-8 rounded-[28px] border border-white/80 dark:border-white/10 space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 neu-inset rounded-2xl text-emerald-800 dark:text-teal-400">
                <Building2 className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-base sm:text-xl font-condensed font-black uppercase text-slate-900 dark:text-white">Infrastruktur & Pembangunan</h4>
                <p className="text-[10px] sm:text-xs text-stone-500 font-bold uppercase tracking-wider">Pondasi Mobilitas & Perekonomian</p>
              </div>
            </div>
            <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-300 leading-relaxed font-medium">
              Pembangunan infrastruktur merupakan salah satu bagian penting dalam mendukung aktivitas masyarakat Desa Sampeldes secara berkelanjutan:
            </p>
            <div className="space-y-2 text-[11px] sm:text-xs">
              {[
                "Pembangunan dan pemeliharaan jalan desa serta jalan lingkungan",
                "Normalisasi dan perbaikan saluran irigasi pertanian",
                "Penyediaan dan peningkatan sarana air bersih warga",
                "Fasilitas umum, fasilitas sosial, dan sarana ekonomi",
              ].map((infra, idx) => (
                <div key={idx} className="flex items-start gap-2.5 p-2.5 rounded-xl neu-inset border border-stone-200/50 dark:border-white/5 text-slate-800 dark:text-slate-200">
                  <CheckCircle2 className="h-4 w-4 text-emerald-700 dark:text-teal-400 shrink-0 mt-0.5" />
                  <span className="font-medium leading-tight">{infra}</span>
                </div>
              ))}
            </div>
          </div>
          <p className="text-[10px] sm:text-[11px] text-stone-500 italic pt-3 border-t border-stone-200/50 dark:border-white/10">
            Dilaksanakan dengan mengedepankan prinsip perencanaan partisipatif, pemerataan, keberlanjutan, dan pemanfaatan potensi lokal.
          </p>
        </div>
      </div>

      {/* 12. KEHIDUPAN SOSIAL, 13. KEAGAMAAN, 15. KESEHATAN */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
        <div className="p-5 sm:p-6 rounded-2xl sm:rounded-[24px] neu-card-elevated border border-white/80 dark:border-white/10 space-y-2.5">
          <div className="p-2 neu-inset text-emerald-800 dark:text-teal-400 w-fit rounded-xl shrink-0"><Users className="h-5 w-5" /></div>
          <h4 className="text-xs sm:text-base font-condensed font-black text-slate-900 dark:text-white uppercase tracking-tight">Sosial & Gotong Royong</h4>
          <p className="text-[11px] sm:text-xs text-stone-600 dark:text-stone-300 leading-relaxed font-medium">
            Kehidupan sosial tumbuh dari semangat kebersamaan, musyawarah desa, partisipasi aktif warga, dan gotong royong yang menjadi modal sosial utama pembangunan desa.
          </p>
        </div>

        <div className="p-5 sm:p-6 rounded-2xl sm:rounded-[24px] neu-card-elevated border border-white/80 dark:border-white/10 space-y-2.5">
          <div className="p-2 neu-inset text-orange-600 dark:text-orange-400 w-fit rounded-xl shrink-0"><Heart className="h-5 w-5" /></div>
          <h4 className="text-xs sm:text-base font-condensed font-black text-slate-900 dark:text-white uppercase tracking-tight">Kehidupan Keagamaan</h4>
          <p className="text-[11px] sm:text-xs text-stone-600 dark:text-stone-300 leading-relaxed font-medium">
            Majelis taklim, kegiatan peribadatan, peringatan hari besar keagamaan, serta solidaritas sosial memperkuat nilai kebersamaan, toleransi, dan keharmonisan antarwarga.
          </p>
        </div>

        <div className="p-5 sm:p-6 rounded-2xl sm:rounded-[24px] neu-card-elevated border border-white/80 dark:border-white/10 space-y-2.5">
          <div className="p-2 neu-inset text-emerald-700 dark:text-emerald-400 w-fit rounded-xl shrink-0"><Stethoscope className="h-5 w-5" /></div>
          <h4 className="text-xs sm:text-base font-condensed font-black text-slate-900 dark:text-white uppercase tracking-tight">Kesehatan Masyarakat</h4>
          <p className="text-[11px] sm:text-xs text-stone-600 dark:text-stone-300 leading-relaxed font-medium">
            Didukung kader kesehatan, Posyandu, program pencegahan stunting, kesehatan ibu & anak (KIA), lansia, serta sosialisasi pola hidup bersih dan sehat (PHBS).
          </p>
        </div>
      </div>
    </div>
  );
}

// --- DEFAULT DATA JALAN KABUPATEN & JALAN DESA ---
const DEFAULT_JALAN_KABUPATEN: JalanKabupatenItem[] = [
  {
    id: 'kab-1',
    noRuas: '034',
    namaRuas: 'Gandrungmangu - Sampeldes - Sampeldes',
    pangkalRuas: 'Simpang Tiga Gandrungmangu',
    ujungRuas: 'Batas Sampeldes',
    panjangRuas: 3200,
    lebarRuas: 5.5,
    kondisiBaik: 2600,
    kondisiSedang: 450,
    kondisiRusakRingan: 150,
    kondisiRusakBerat: 0,
    fotoUrl: 'https://images.unsplash.com/photo-1545459720-aac8509eb02c?q=80&w=900&auto=format&fit=crop',
    videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
  },
  {
    id: 'kab-2',
    noRuas: '089',
    namaRuas: 'Sampeldes - Gandrungmanis',
    pangkalRuas: 'Pertigaan Pasar Sampeldes',
    ujungRuas: 'Batas Gandrungmanis',
    panjangRuas: 1850,
    lebarRuas: 5.0,
    kondisiBaik: 1400,
    kondisiSedang: 300,
    kondisiRusakRingan: 150,
    kondisiRusakBerat: 0,
    fotoUrl: 'https://images.unsplash.com/photo-1517649763962-0c623266ddc0?q=80&w=900&auto=format&fit=crop'
  }
];

const DEFAULT_JALAN_DESA: JalanDesaItem[] = [
  {
    id: 'desa-1',
    no: 1,
    desa: 'Sampeldes',
    noUrut: '01',
    namaJalan: 'Jl. Mawar RT 02 / RW 01',
    panjang: 450,
    panjangMeter: 450,
    lebar: 3.0,
    lebarMeter: 3.0,
    pangkal: 'Jl. Raya Gandrungmangu',
    ujung: 'Saluran Irigasi Blok A',
    jenisPerkerasan: 'Rabat Beton',
    kondisiBaik: 400,
    kondisiSedang: 50,
    kondisiRusakRingan: 0,
    kondisiRusakBerat: 0,
    fotoUrl: 'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?q=80&w=900&auto=format&fit=crop'
  },
  {
    id: 'desa-2',
    no: 2,
    desa: 'Sampeldes',
    noUrut: '02',
    namaJalan: 'Jl. Melati RW 03',
    panjang: 680,
    panjangMeter: 680,
    lebar: 3.0,
    lebarMeter: 3.0,
    pangkal: 'Balai Pertemuan RW 03',
    ujung: 'Lahan Pertanian Barat',
    jenisPerkerasan: 'Aspal Lapen',
    kondisiBaik: 420,
    kondisiSedang: 180,
    kondisiRusakRingan: 80,
    kondisiRusakBerat: 0,
    fotoUrl: 'https://images.unsplash.com/photo-1473496169904-658ba7c44d8a?q=80&w=900&auto=format&fit=crop',
    youtubeUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
  },
  {
    id: 'desa-3',
    no: 3,
    desa: 'Sampeldes',
    noUrut: '03',
    namaJalan: 'Jl. Kamboja RT 05 / RW 04',
    panjang: 520,
    panjangMeter: 520,
    lebar: 2.5,
    lebarMeter: 2.5,
    pangkal: 'Simpang Musholla Nurul Huda',
    ujung: 'Batas Dusun Sampeldes Kidul',
    jenisPerkerasan: 'Paving Block',
    kondisiBaik: 470,
    kondisiSedang: 50,
    kondisiRusakRingan: 0,
    kondisiRusakBerat: 0,
    fotoUrl: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?q=80&w=900&auto=format&fit=crop'
  }
];

function extractYouTubeId(url?: string): string | null {
  if (!url) return null;
  const cleanUrl = url.trim();
  if (!cleanUrl) return null;

  // 1. Direct 11-char ID
  if (/^[a-zA-Z0-9_-]{11}$/.test(cleanUrl)) {
    return cleanUrl;
  }

  // 2. Standard watch URL with v parameter anywhere: ?v=ID or &v=ID
  const vParamMatch = cleanUrl.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
  if (vParamMatch && vParamMatch[1]) {
    return vParamMatch[1];
  }

  // 3. youtu.be/ID, youtube.com/shorts/ID, youtube.com/embed/ID, youtube.com/live/ID, youtube.com/v/ID
  const pathMatch = cleanUrl.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|shorts\/|live\/))([a-zA-Z0-9_-]{11})/);
  if (pathMatch && pathMatch[1]) {
    return pathMatch[1];
  }

  // 4. Fallback broad regex for any 11-char ID preceded by slash or equal sign
  const broadMatch = cleanUrl.match(/(?:[=\/])([a-zA-Z0-9_-]{11})(?:[?&#\s]|$)/);
  if (broadMatch && broadMatch[1]) {
    return broadMatch[1];
  }

  return null;
}

function getYouTubeThumbnail(url?: string): string | null {
  const id = extractYouTubeId(url);
  if (!id) return null;
  return `https://img.youtube.com/vi/${id}/hqdefault.jpg`;
}

// --- KOMPONEN TAB: JALAN KABUPATEN ---
function JalanKabupatenTab({ data, isLoading }: { data: JalanKabupatenItem[]; isLoading: boolean }) {
  const [viewMode, setViewMode] = useState<'card' | 'table'>('card');
  const [search, setSearch] = useState('');
  const [activeMedia, setActiveMedia] = useState<{ type: 'photo' | 'video'; url: string; title: string } | null>(null);

  const displayData = useMemo(() => {
    const source = (data && data.length > 0) ? data : DEFAULT_JALAN_KABUPATEN;
    if (!search.trim()) return source;
    const q = search.toLowerCase();
    return source.filter(item =>
      item.namaRuas.toLowerCase().includes(q) ||
      item.noRuas.toLowerCase().includes(q) ||
      (item.pangkalRuas && item.pangkalRuas.toLowerCase().includes(q)) ||
      (item.ujungRuas && item.ujungRuas.toLowerCase().includes(q))
    );
  }, [data, search]);

  const stats = useMemo(() => {
    const source = (data && data.length > 0) ? data : DEFAULT_JALAN_KABUPATEN;
    const totalPanjang = source.reduce((acc, curr) => acc + (Number(curr.panjangRuas) || 0), 0);
    const totalBaik = source.reduce((acc, curr) => acc + (Number(curr.kondisiBaik) || 0), 0);
    const totalSedang = source.reduce((acc, curr) => acc + (Number(curr.kondisiSedang) || 0), 0);
    const totalRusak = source.reduce((acc, curr) => acc + (Number(curr.kondisiRusakRingan) || 0) + (Number(curr.kondisiRusakBerat) || 0), 0);
    const mantapPercent = totalPanjang > 0 ? Math.round(((totalBaik + totalSedang) / totalPanjang) * 100) : 100;
    return {
      count: source.length,
      totalPanjangKm: (totalPanjang / 1000).toFixed(2),
      mantapPercent,
      totalRusakM: totalRusak
    };
  }, [data]);

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-3 border-b border-stone-200/80 dark:border-white/10">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 neu-pill text-emerald-800 dark:text-teal-400 text-xs font-bold uppercase tracking-wider px-3.5 py-1">
            <span className="w-2 h-2 rounded-full bg-emerald-600 shrink-0" />
            <span>Infrastruktur Wilayah</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-condensed font-black uppercase tracking-tight text-slate-900 dark:text-white leading-tight">
            Data Ruas <span className="text-emerald-800 dark:text-teal-400">Jalan Kabupaten</span>
          </h2>
          <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-300 font-medium">
            Inventarisasi teknis ruas jalan kabupaten yang melintasi dan menghubungkan Desa Sampeldes dengan pusat kecamatan dan daerah sekitar.
          </p>
        </div>

        {/* VIEW TOGGLE */}
        <div className="flex items-center gap-1.5 p-1.5 neu-inset rounded-full border border-stone-300/40 dark:border-white/10 self-start md:self-auto">
          <Button
            type="button"
            size="sm"
            onClick={() => setViewMode('card')}
            className={cn(
              "rounded-full text-xs font-bold uppercase tracking-wider gap-1.5 h-8 px-3.5 transition-all",
              viewMode === 'card' ? "neu-btn-dark text-white" : "bg-transparent text-stone-600 dark:text-stone-300 hover:text-slate-900 dark:hover:text-white"
            )}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>Kartu Visual</span>
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={() => setViewMode('table')}
            className={cn(
              "rounded-full text-xs font-bold uppercase tracking-wider gap-1.5 h-8 px-3.5 transition-all",
              viewMode === 'table' ? "neu-btn-dark text-white" : "bg-transparent text-stone-600 dark:text-stone-300 hover:text-slate-900 dark:hover:text-white"
            )}
          >
            <TableIcon className="w-3.5 h-3.5" />
            <span>Tabel Lengkap</span>
          </Button>
        </div>
      </div>

      {/* STATISTIK RINGKAS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="neu-card-elevated p-4 sm:p-5 rounded-2xl border border-white/80 dark:border-white/10 space-y-1">
          <p className="text-[10px] sm:text-xs font-bold text-stone-500 uppercase tracking-wider">Total Ruas Terdaftar</p>
          <p className="text-2xl sm:text-3xl font-condensed font-black text-slate-900 dark:text-white">{stats.count} <span className="text-xs font-sans font-bold text-stone-500">Ruas</span></p>
        </div>
        <div className="neu-card-elevated p-4 sm:p-5 rounded-2xl border border-white/80 dark:border-white/10 space-y-1">
          <p className="text-[10px] sm:text-xs font-bold text-stone-500 uppercase tracking-wider">Total Panjang</p>
          <p className="text-2xl sm:text-3xl font-condensed font-black text-emerald-800 dark:text-teal-400">{stats.totalPanjangKm} <span className="text-xs font-sans font-bold text-stone-500">KM</span></p>
        </div>
        <div className="neu-card-elevated p-4 sm:p-5 rounded-2xl border border-white/80 dark:border-white/10 space-y-1">
          <p className="text-[10px] sm:text-xs font-bold text-stone-500 uppercase tracking-wider">Tingkat Kemantapan</p>
          <p className="text-2xl sm:text-3xl font-condensed font-black text-emerald-600 dark:text-emerald-400">{stats.mantapPercent}% <span className="text-xs font-sans font-bold text-stone-500">Mantap</span></p>
        </div>
        <div className="neu-card-elevated p-4 sm:p-5 rounded-2xl border border-white/80 dark:border-white/10 space-y-1">
          <p className="text-[10px] sm:text-xs font-bold text-stone-500 uppercase tracking-wider">Perlu Penanganan</p>
          <p className="text-2xl sm:text-3xl font-condensed font-black text-amber-600 dark:text-amber-400">{stats.totalRusakM} <span className="text-xs font-sans font-bold text-stone-500">Meter</span></p>
        </div>
      </div>

      {/* SEARCH BAR */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cari nomor ruas, nama jalan, pangkal, atau ujung ruas..."
          className="w-full pl-10 pr-4 py-2.5 rounded-full neu-inset border border-stone-300/40 dark:border-white/10 text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-700 dark:focus:ring-teal-500 text-slate-900 dark:text-white placeholder:text-stone-400"
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 text-xs"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* CONTENT: CARD VIEW ATAU TABLE VIEW */}
      {isLoading ? (
        <div className="grid sm:grid-cols-2 gap-4">
          <Skeleton className="h-64 rounded-3xl" />
          <Skeleton className="h-64 rounded-3xl" />
        </div>
      ) : displayData.length === 0 ? (
        <div className="p-10 text-center neu-card-elevated rounded-[28px] border border-dashed border-stone-300/60 dark:border-white/20 space-y-2">
          <Milestone className="w-8 h-8 text-stone-400 mx-auto" />
          <p className="text-sm font-bold text-slate-900 dark:text-white">Tidak ada ruas jalan yang sesuai pencarian.</p>
          <p className="text-xs text-stone-500">Silakan ubah kata kunci atau hapus pencarian.</p>
        </div>
      ) : viewMode === 'card' ? (
        <div className="grid sm:grid-cols-2 gap-5">
          {displayData.map((item) => {
            const panjang = Number(item.panjangRuas) || 0;
            const baik = Number(item.kondisiBaik) || 0;
            const sedang = Number(item.kondisiSedang) || 0;
            const rRingan = Number(item.kondisiRusakRingan) || 0;
            const rBerat = Number(item.kondisiRusakBerat) || 0;
            const baikPct = panjang > 0 ? (baik / panjang) * 100 : 0;
            const sedangPct = panjang > 0 ? (sedang / panjang) * 100 : 0;
            const rRinganPct = panjang > 0 ? (rRingan / panjang) * 100 : 0;
            const rBeratPct = panjang > 0 ? (rBerat / panjang) * 100 : 0;
            const cleanFotoUrl = item.fotoUrl?.trim() || null;
            const videoLink = (item.youtubeUrl || item.videoUrl)?.trim() || null;
            const ytThumbnail = getYouTubeThumbnail(videoLink || undefined);
            const displayImage = cleanFotoUrl || ytThumbnail;
            const isVideoThumb = !cleanFotoUrl && !!ytThumbnail;

            return (
              <div
                key={item.id}
                className="neu-card-elevated rounded-[28px] border border-white/80 dark:border-white/10 overflow-hidden flex flex-col justify-between group hover:border-emerald-700/40 dark:hover:border-teal-400/40 transition-all duration-300"
              >
                {/* MEDIA PREVIEW JIKA ADA FOTO ATAU VIDEO */}
                <div className="relative aspect-[16/9] w-full bg-stone-200 overflow-hidden">
                  {displayImage ? (
                    <div className="relative w-full h-full group/media">
                      <img
                        src={displayImage}
                        alt={item.namaRuas}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 cursor-pointer"
                        onClick={() => {
                          if (isVideoThumb && videoLink) {
                            setActiveMedia({ type: 'video', url: videoLink, title: item.namaRuas });
                          } else if (cleanFotoUrl) {
                            setActiveMedia({ type: 'photo', url: cleanFotoUrl, title: item.namaRuas });
                          }
                        }}
                        onError={(e) => {
                          const target = e.currentTarget;
                          if (target.src.includes('hqdefault.jpg')) {
                            target.src = target.src.replace('hqdefault.jpg', 'mqdefault.jpg');
                          }
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />

                      {/* TOMBOL PLAY BESAR DI TENGAH BILA CUPLIKAN VIDEO YOUTUBE */}
                      {isVideoThumb && videoLink && (
                        <button
                          type="button"
                          onClick={() => setActiveMedia({ type: 'video', url: videoLink, title: item.namaRuas })}
                          className="absolute inset-0 flex items-center justify-center cursor-pointer group-hover/media:scale-110 transition-transform"
                          title="Putar Video YouTube"
                        >
                          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-rose-600/95 text-white flex items-center justify-center shadow-xl backdrop-blur-xs hover:bg-rose-600 transition-colors">
                            <Play className="w-5 h-5 sm:w-6 sm:h-6 fill-white ml-0.5" />
                          </div>
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-stone-100 to-stone-200 text-stone-400 gap-1.5">
                      <Milestone className="w-10 h-10 text-stone-300" />
                      <span className="text-[10px] uppercase font-bold tracking-wider text-stone-400">Dokumentasi Ruas Belum Diunggah</span>
                    </div>
                  )}

                  <div className="absolute top-3 left-3 bg-slate-900/85 backdrop-blur-md text-white font-mono text-[10px] font-bold px-3 py-1 rounded-full border border-white/20 shadow-xs">
                    RUAS NO. {item.noRuas}
                  </div>

                  {/* BADGE CUPLIKAN VIDEO YOUTUBE */}
                  {isVideoThumb && (
                    <div className="absolute top-3 right-3 bg-rose-600/90 backdrop-blur-md text-white text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1 shadow-xs border border-white/20">
                      <Play className="w-2.5 h-2.5 fill-white" />
                      <span>Cuplikan Video</span>
                    </div>
                  )}

                  {/* TOMBOL AKSI MEDIA (FOTO / VIDEO) */}
                  <div className="absolute bottom-3 right-3 flex items-center gap-2">
                    {cleanFotoUrl && (
                      <button
                        onClick={() => setActiveMedia({ type: 'photo', url: cleanFotoUrl, title: item.namaRuas })}
                        className="bg-white/90 hover:bg-white text-slate-900 p-2 rounded-full shadow-md backdrop-blur-md transition-transform hover:scale-110"
                        title="Perbesar Foto Ruas"
                      >
                        <Maximize2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {videoLink && (
                      <button
                        onClick={() => setActiveMedia({ type: 'video', url: videoLink, title: item.namaRuas })}
                        className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs px-3 py-1.5 rounded-full shadow-md backdrop-blur-md transition-transform hover:scale-105 flex items-center gap-1.5"
                      >
                        <Play className="w-3 h-3 fill-white" />
                        <span>Video</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* DETAIL RUAS KARTU */}
                <div className="p-5 sm:p-6 space-y-4 flex-1 flex flex-col justify-between">
                  <div className="space-y-2">
                    <h3 className="text-lg sm:text-xl font-condensed font-black uppercase text-slate-900 dark:text-white leading-snug">
                      {item.namaRuas}
                    </h3>
                    <div className="flex items-center gap-2 text-xs text-stone-600 dark:text-stone-300 font-medium">
                      <MapPin className="w-3.5 h-3.5 text-emerald-700 dark:text-teal-400 shrink-0" />
                      <span className="truncate">{item.pangkalRuas || '-'}</span>
                      <ArrowRight className="w-3 h-3 text-stone-400 shrink-0" />
                      <span className="truncate">{item.ujungRuas || '-'}</span>
                    </div>
                  </div>

                  {/* METRIK PANJANG & LEBAR */}
                  <div className="grid grid-cols-2 gap-2 p-3.5 rounded-2xl neu-inset border border-stone-300/40 dark:border-white/10 text-xs">
                    <div>
                      <p className="text-[10px] uppercase font-bold text-stone-500">Panjang Ruas</p>
                      <p className="font-condensed font-black text-slate-900 dark:text-white text-base">{item.panjangRuas.toLocaleString('id-ID')} <span className="text-xs font-normal text-stone-500">Meter</span></p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-bold text-stone-500">Lebar Ruas</p>
                      <p className="font-condensed font-black text-slate-900 dark:text-white text-base">{item.lebarRuas} <span className="text-xs font-normal text-stone-500">Meter</span></p>
                    </div>
                  </div>

                  {/* KONDISI PERKERASAN PROGRESS BAR */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider text-stone-600 dark:text-stone-300">
                      <span>Kondisi Ruas Jalan</span>
                      <span className="text-emerald-700 dark:text-teal-400">Baik: {item.kondisiBaik}m</span>
                    </div>
                    <div className="w-full h-3 rounded-full neu-inset overflow-hidden flex bg-stone-200/50 dark:bg-black/30 border border-stone-300/40 dark:border-white/5">
                      {baikPct > 0 && <div style={{ width: `${baikPct}%` }} className="bg-emerald-500 h-full" title={`Baik: ${baik}m`} />}
                      {sedangPct > 0 && <div style={{ width: `${sedangPct}%` }} className="bg-amber-400 h-full" title={`Sedang: ${sedang}m`} />}
                      {rRinganPct > 0 && <div style={{ width: `${rRinganPct}%` }} className="bg-orange-500 h-full" title={`Rusak Ringan: ${rRingan}m`} />}
                      {rBeratPct > 0 && <div style={{ width: `${rBeratPct}%` }} className="bg-rose-600 h-full" title={`Rusak Berat: ${rBerat}m`} />}
                    </div>
                    <div className="flex flex-wrap gap-2 pt-1 text-[9px] font-bold text-stone-600 dark:text-stone-400">
                      <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500" /> Baik ({item.kondisiBaik}m)</span>
                      <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400" /> Sedang ({item.kondisiSedang}m)</span>
                      {rRingan > 0 && <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-orange-500" /> Rusak Rng ({rRingan}m)</span>}
                      {rBerat > 0 && <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-rose-600" /> Rusak Brt ({rBerat}m)</span>}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* TABLE VIEW (10 KOLOM TEKNIS RESMI) */
        <div className="neu-card-elevated rounded-[28px] border border-white/80 dark:border-white/10 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs whitespace-nowrap">
              <thead className="bg-[#070b10] text-white uppercase text-[10px] font-condensed tracking-wider">
                <tr>
                  <th className="px-3 py-3.5 font-bold text-center">1. NO RUAS</th>
                  <th className="px-4 py-3.5 font-bold">2. NAMA RUAS JALAN</th>
                  <th className="px-3 py-3.5 font-bold">3. PANGKAL RUAS</th>
                  <th className="px-3 py-3.5 font-bold">4. UJUNG RUAS</th>
                  <th className="px-3 py-3.5 font-bold text-right">5. PANJANG (M)</th>
                  <th className="px-3 py-3.5 font-bold text-right">6. LEBAR (M)</th>
                  <th className="px-3 py-3.5 font-bold text-right text-emerald-400">7. BAIK (M)</th>
                  <th className="px-3 py-3.5 font-bold text-right text-amber-300">8. SEDANG (M)</th>
                  <th className="px-3 py-3.5 font-bold text-right text-orange-400">9. RUSAK RG (M)</th>
                  <th className="px-3 py-3.5 font-bold text-right text-rose-400">10. RUSAK BR (M)</th>
                  <th className="px-3 py-3.5 font-bold text-center">MEDIA</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200/50 dark:divide-white/5 bg-transparent">
                {displayData.map((row, idx) => (
                  <tr key={row.id} className={idx % 2 === 0 ? "hover:bg-black/5 dark:hover:bg-white/5 transition-colors" : "bg-stone-500/5 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"}>
                    <td className="px-3 py-3 font-mono font-bold text-center text-slate-800 dark:text-slate-200">{row.noRuas}</td>
                    <td className="px-4 py-3 font-bold text-slate-900 dark:text-white">{row.namaRuas}</td>
                    <td className="px-3 py-3 text-stone-600 dark:text-stone-300">{row.pangkalRuas || '-'}</td>
                    <td className="px-3 py-3 text-stone-600 dark:text-stone-300">{row.ujungRuas || '-'}</td>
                    <td className="px-3 py-3 font-mono font-bold text-right text-slate-900 dark:text-white">{Number(row.panjangRuas).toLocaleString('id-ID')}</td>
                    <td className="px-3 py-3 font-mono text-right text-stone-700 dark:text-stone-300">{row.lebarRuas}</td>
                    <td className="px-3 py-3 font-mono text-right text-emerald-700 dark:text-emerald-400 font-bold">{row.kondisiBaik}</td>
                    <td className="px-3 py-3 font-mono text-right text-amber-700 dark:text-amber-400">{row.kondisiSedang}</td>
                    <td className="px-3 py-3 font-mono text-right text-orange-700 dark:text-orange-400">{row.kondisiRusakRingan}</td>
                    <td className="px-3 py-3 font-mono text-right text-rose-700 dark:text-rose-400">{row.kondisiRusakBerat}</td>
                    <td className="px-3 py-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        {row.fotoUrl && (
                          <button
                            onClick={() => setActiveMedia({ type: 'photo', url: row.fotoUrl!, title: row.namaRuas })}
                            className="p-1.5 neu-inset rounded-lg text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors"
                            title="Lihat Foto"
                          >
                            <ImageIcon className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {(row.videoUrl || row.youtubeUrl) && (
                          <button
                            onClick={() => setActiveMedia({ type: 'video', url: (row.videoUrl || row.youtubeUrl)!, title: row.namaRuas })}
                            className="p-1.5 bg-rose-600 hover:bg-rose-700 rounded-lg text-white transition-colors shadow-xs"
                            title="Tonton Video"
                          >
                            <Play className="w-3.5 h-3.5 fill-white" />
                          </button>
                        )}
                        {!row.fotoUrl && !row.videoUrl && !row.youtubeUrl && (
                          <span className="text-[10px] text-stone-400 italic">-</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL DIALOG LIGHTBOX FOTO / VIDEO PLAYER */}
      {activeMedia && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-300"
          onClick={() => setActiveMedia(null)}
        >
          <div
            className="relative bg-[#0f172a] rounded-[28px] overflow-hidden max-w-3xl w-full border border-white/20 shadow-2xl space-y-0"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 px-6 border-b border-white/10 text-white">
              <h4 className="text-sm font-condensed font-bold uppercase tracking-wider truncate pr-4">
                {activeMedia.title}
              </h4>
              <button
                onClick={() => setActiveMedia(null)}
                className="p-1.5 rounded-full hover:bg-white/10 text-stone-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-black flex items-center justify-center">
              {activeMedia.type === 'photo' ? (
                <img
                  src={activeMedia.url}
                  alt={activeMedia.title}
                  className="max-h-[75vh] w-auto object-contain rounded-xl"
                />
              ) : (
                <div className="aspect-video w-full rounded-xl overflow-hidden bg-black">
                  {extractYouTubeId(activeMedia.url) ? (
                    <iframe
                      src={`https://www.youtube-nocookie.com/embed/${extractYouTubeId(activeMedia.url)}?autoplay=1`}
                      title={activeMedia.title}
                      className="w-full h-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-stone-400 text-xs">
                      Tautan video YouTube tidak valid.
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// --- KOMPONEN TAB: JALAN DESA ---
function JalanDesaTab({ data, isLoading }: { data: JalanDesaItem[]; isLoading: boolean }) {
  const [viewMode, setViewMode] = useState<'card' | 'table'>('card');
  const [search, setSearch] = useState('');
  const [activeMedia, setActiveMedia] = useState<{ type: 'photo' | 'video'; url: string; title: string } | null>(null);

  const displayData = useMemo(() => {
    const source = (data && data.length > 0) ? data : DEFAULT_JALAN_DESA;
    if (!search.trim()) return source;
    const q = search.toLowerCase();
    return source.filter(item =>
      item.namaJalan.toLowerCase().includes(q) ||
      item.noUrut.toLowerCase().includes(q) ||
      (item.pangkal && item.pangkal.toLowerCase().includes(q)) ||
      (item.ujung && item.ujung.toLowerCase().includes(q)) ||
      (item.jenisPerkerasan && item.jenisPerkerasan.toLowerCase().includes(q))
    );
  }, [data, search]);

  const stats = useMemo(() => {
    const source = (data && data.length > 0) ? data : DEFAULT_JALAN_DESA;
    const totalPanjang = source.reduce((acc, curr) => acc + (Number(curr.panjang ?? curr.panjangMeter) || 0), 0);
    const totalBaik = source.reduce((acc, curr) => acc + (Number(curr.kondisiBaik) || 0), 0);
    const totalSedang = source.reduce((acc, curr) => acc + (Number(curr.kondisiSedang) || 0), 0);
    const totalRusak = source.reduce((acc, curr) => acc + (Number(curr.kondisiRusakRingan) || 0) + (Number(curr.kondisiRusakBerat) || 0), 0);
    const mantapPercent = totalPanjang > 0 ? Math.round(((totalBaik + totalSedang) / totalPanjang) * 100) : 100;
    return {
      count: source.length,
      totalPanjangM: totalPanjang,
      mantapPercent,
      totalRusakM: totalRusak
    };
  }, [data]);

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-3 border-b border-stone-200/80 dark:border-white/10">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 neu-pill text-emerald-800 dark:text-teal-400 text-xs font-bold uppercase tracking-wider px-3.5 py-1">
            <span className="w-2 h-2 rounded-full bg-emerald-600 shrink-0" />
            <span>Konektivitas Lingkungan</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-condensed font-black uppercase tracking-tight text-slate-900 dark:text-white leading-tight">
            Data Ruas <span className="text-emerald-800 dark:text-teal-400">Jalan Desa</span>
          </h2>
          <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-300 font-medium">
            Daftar inventarisasi jalan lingkungan, jalan poros desa, serta akses usaha tani di wilayah Pemerintah Desa Sampeldes.
          </p>
        </div>

        {/* VIEW TOGGLE */}
        <div className="flex items-center gap-1.5 p-1.5 neu-inset rounded-full border border-stone-300/40 dark:border-white/10 self-start md:self-auto">
          <Button
            type="button"
            size="sm"
            onClick={() => setViewMode('card')}
            className={cn(
              "rounded-full text-xs font-bold uppercase tracking-wider gap-1.5 h-8 px-3.5 transition-all",
              viewMode === 'card' ? "neu-btn-dark text-white" : "bg-transparent text-stone-600 dark:text-stone-300 hover:text-slate-900 dark:hover:text-white"
            )}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>Kartu Visual</span>
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={() => setViewMode('table')}
            className={cn(
              "rounded-full text-xs font-bold uppercase tracking-wider gap-1.5 h-8 px-3.5 transition-all",
              viewMode === 'table' ? "neu-btn-dark text-white" : "bg-transparent text-stone-600 dark:text-stone-300 hover:text-slate-900 dark:hover:text-white"
            )}
          >
            <TableIcon className="w-3.5 h-3.5" />
            <span>Tabel Lengkap</span>
          </Button>
        </div>
      </div>

      {/* STATISTIK RINGKAS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="neu-card-elevated p-4 sm:p-5 rounded-2xl border border-white/80 dark:border-white/10 space-y-1">
          <p className="text-[10px] sm:text-xs font-bold text-stone-500 uppercase tracking-wider">Total Jalan Desa</p>
          <p className="text-2xl sm:text-3xl font-condensed font-black text-slate-900 dark:text-white">{stats.count} <span className="text-xs font-sans font-bold text-stone-500">Ruas</span></p>
        </div>
        <div className="neu-card-elevated p-4 sm:p-5 rounded-2xl border border-white/80 dark:border-white/10 space-y-1">
          <p className="text-[10px] sm:text-xs font-bold text-stone-500 uppercase tracking-wider">Total Panjang</p>
          <p className="text-2xl sm:text-3xl font-condensed font-black text-emerald-800 dark:text-teal-400">{stats.totalPanjangM.toLocaleString('id-ID')} <span className="text-xs font-sans font-bold text-stone-500">Meter</span></p>
        </div>
        <div className="neu-card-elevated p-4 sm:p-5 rounded-2xl border border-white/80 dark:border-white/10 space-y-1">
          <p className="text-[10px] sm:text-xs font-bold text-stone-500 uppercase tracking-wider">Kondisi Mantap</p>
          <p className="text-2xl sm:text-3xl font-condensed font-black text-emerald-600 dark:text-emerald-400">{stats.mantapPercent}% <span className="text-xs font-sans font-bold text-stone-500">Mantap</span></p>
        </div>
        <div className="neu-card-elevated p-4 sm:p-5 rounded-2xl border border-white/80 dark:border-white/10 space-y-1">
          <p className="text-[10px] sm:text-xs font-bold text-stone-500 uppercase tracking-wider">Perlu Peningkatan</p>
          <p className="text-2xl sm:text-3xl font-condensed font-black text-amber-600 dark:text-amber-400">{stats.totalRusakM} <span className="text-xs font-sans font-bold text-stone-500">Meter</span></p>
        </div>
      </div>

      {/* SEARCH BAR */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cari no urut, nama jalan desa, pangkal, ujung, atau jenis perkerasan..."
          className="w-full pl-10 pr-4 py-2.5 rounded-full neu-inset border border-stone-300/40 dark:border-white/10 text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-700 dark:focus:ring-teal-500 text-slate-900 dark:text-white placeholder:text-stone-400"
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 text-xs"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* CONTENT: CARD VIEW ATAU TABLE VIEW */}
      {isLoading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Skeleton className="h-64 rounded-3xl" />
          <Skeleton className="h-64 rounded-3xl" />
          <Skeleton className="h-64 rounded-3xl" />
        </div>
      ) : displayData.length === 0 ? (
        <div className="p-10 text-center neu-card-elevated rounded-[28px] border border-dashed border-stone-300/60 dark:border-white/20 space-y-2">
          <Milestone className="w-8 h-8 text-stone-400 mx-auto" />
          <p className="text-sm font-bold text-slate-900 dark:text-white">Tidak ada jalan desa yang sesuai pencarian.</p>
          <p className="text-xs text-stone-500">Silakan ubah kata kunci atau hapus pencarian.</p>
        </div>
      ) : viewMode === 'card' ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {displayData.map((item) => {
            const pjg = Number(item.panjang ?? item.panjangMeter) || 0;
            const lbr = Number(item.lebar ?? item.lebarMeter) || 0;
            const baik = Number(item.kondisiBaik) || 0;
            const sedang = Number(item.kondisiSedang) || 0;
            const rRingan = Number(item.kondisiRusakRingan) || 0;
            const rBerat = Number(item.kondisiRusakBerat) || 0;
            const baikPct = pjg > 0 ? (baik / pjg) * 100 : 0;
            const sedangPct = pjg > 0 ? (sedang / pjg) * 100 : 0;
            const rRinganPct = pjg > 0 ? (rRingan / pjg) * 100 : 0;
            const rBeratPct = pjg > 0 ? (rBerat / pjg) * 100 : 0;
            const cleanFotoUrl = item.fotoUrl?.trim() || null;
            const videoLink = (item.youtubeUrl || item.videoUrl)?.trim() || null;
            const ytThumbnail = getYouTubeThumbnail(videoLink || undefined);
            const displayImage = cleanFotoUrl || ytThumbnail;
            const isVideoThumb = !cleanFotoUrl && !!ytThumbnail;

            return (
              <div
                key={item.id}
                className="neu-card-elevated rounded-[28px] border border-white/60 overflow-hidden flex flex-col justify-between group hover:border-emerald-700/40 transition-all duration-300"
              >
                {/* MEDIA PREVIEW JIKA ADA FOTO ATAU VIDEO */}
                <div className="relative aspect-[16/9] w-full bg-stone-200 overflow-hidden">
                  {displayImage ? (
                    <div className="relative w-full h-full group/media">
                      <img
                        src={displayImage}
                        alt={item.namaJalan}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 cursor-pointer"
                        onClick={() => {
                          if (isVideoThumb && videoLink) {
                            setActiveMedia({ type: 'video', url: videoLink, title: item.namaJalan });
                          } else if (cleanFotoUrl) {
                            setActiveMedia({ type: 'photo', url: cleanFotoUrl, title: item.namaJalan });
                          }
                        }}
                        onError={(e) => {
                          const target = e.currentTarget;
                          if (target.src.includes('hqdefault.jpg')) {
                            target.src = target.src.replace('hqdefault.jpg', 'mqdefault.jpg');
                          }
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />

                      {/* TOMBOL PLAY BESAR DI TENGAH BILA CUPLIKAN VIDEO YOUTUBE */}
                      {isVideoThumb && videoLink && (
                        <button
                          type="button"
                          onClick={() => setActiveMedia({ type: 'video', url: videoLink, title: item.namaJalan })}
                          className="absolute inset-0 flex items-center justify-center cursor-pointer group-hover/media:scale-110 transition-transform"
                          title="Putar Video YouTube"
                        >
                          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-rose-600/95 text-white flex items-center justify-center shadow-xl backdrop-blur-xs hover:bg-rose-600 transition-colors">
                            <Play className="w-5 h-5 sm:w-6 sm:h-6 fill-white ml-0.5" />
                          </div>
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-stone-100 to-stone-200 text-stone-400 gap-1.5">
                      <Milestone className="w-10 h-10 text-stone-300" />
                      <span className="text-[10px] uppercase font-bold tracking-wider text-stone-400">Belum Ada Foto Ruas</span>
                    </div>
                  )}

                  <div className="absolute top-3 left-3 bg-slate-900/85 backdrop-blur-md text-white font-mono text-[10px] font-bold px-3 py-1 rounded-full border border-white/20 shadow-xs">
                    NO. {item.noUrut || item.no}
                  </div>

                  {item.jenisPerkerasan && (
                    <div className="absolute top-3 right-3 bg-emerald-800/90 backdrop-blur-md text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow-xs">
                      {item.jenisPerkerasan}
                    </div>
                  )}

                  {/* BADGE CUPLIKAN VIDEO YOUTUBE */}
                  {isVideoThumb && (
                    <div className="absolute bottom-3 left-3 bg-rose-600/90 backdrop-blur-md text-white text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1 shadow-xs border border-white/20">
                      <Play className="w-2.5 h-2.5 fill-white" />
                      <span>Cuplikan Video</span>
                    </div>
                  )}

                  {/* TOMBOL AKSI MEDIA (FOTO / VIDEO) */}
                  <div className="absolute bottom-3 right-3 flex items-center gap-2">
                    {cleanFotoUrl && (
                      <button
                        onClick={() => setActiveMedia({ type: 'photo', url: cleanFotoUrl, title: item.namaJalan })}
                        className="bg-white/90 hover:bg-white text-slate-900 p-2 rounded-full shadow-md backdrop-blur-md transition-transform hover:scale-110"
                        title="Perbesar Foto"
                      >
                        <Maximize2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {videoLink && (
                      <button
                        onClick={() => setActiveMedia({ type: 'video', url: videoLink, title: item.namaJalan })}
                        className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs px-3 py-1.5 rounded-full shadow-md backdrop-blur-md transition-transform hover:scale-105 flex items-center gap-1.5"
                      >
                        <Play className="w-3 h-3 fill-white" />
                        <span>Video</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* DETAIL RUAS KARTU */}
                <div className="p-4 sm:p-5 space-y-3.5 flex-1 flex flex-col justify-between">
                  <div className="space-y-1.5">
                    <h3 className="text-base sm:text-lg font-condensed font-black uppercase text-slate-900 dark:text-white leading-snug">
                      {item.namaJalan}
                    </h3>
                    <div className="flex items-center gap-2 text-xs text-stone-600 dark:text-stone-300 font-medium">
                      <MapPin className="w-3.5 h-3.5 text-emerald-700 dark:text-teal-400 shrink-0" />
                      <span className="truncate">{item.pangkal || '-'}</span>
                      <ArrowRight className="w-3 h-3 text-stone-400 shrink-0" />
                      <span className="truncate">{item.ujung || '-'}</span>
                    </div>
                  </div>

                  {/* METRIK PANJANG & LEBAR */}
                  <div className="grid grid-cols-2 gap-2 p-3 rounded-2xl neu-inset border border-stone-300/40 dark:border-white/10 text-xs">
                    <div>
                      <p className="text-[10px] uppercase font-bold text-stone-500">Panjang</p>
                      <p className="font-condensed font-black text-slate-900 dark:text-white text-base">{pjg} <span className="text-xs font-normal text-stone-500">M</span></p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-bold text-stone-500">Lebar</p>
                      <p className="font-condensed font-black text-slate-900 dark:text-white text-base">{lbr} <span className="text-xs font-normal text-stone-500">M</span></p>
                    </div>
                  </div>

                  {/* KONDISI PERKERASAN PROGRESS BAR */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider text-stone-600 dark:text-stone-300">
                      <span>Kondisi Fisik</span>
                      <span className="text-emerald-700 dark:text-teal-400">Baik: {item.kondisiBaik}m</span>
                    </div>
                    <div className="w-full h-2.5 rounded-full neu-inset overflow-hidden flex bg-stone-200/50 dark:bg-black/30 border border-stone-300/40 dark:border-white/5">
                      {baikPct > 0 && <div style={{ width: `${baikPct}%` }} className="bg-emerald-500 h-full" title={`Baik: ${baik}m`} />}
                      {sedangPct > 0 && <div style={{ width: `${sedangPct}%` }} className="bg-amber-400 h-full" title={`Sedang: ${sedang}m`} />}
                      {rRinganPct > 0 && <div style={{ width: `${rRinganPct}%` }} className="bg-orange-500 h-full" title={`Rusak Ringan: ${rRingan}m`} />}
                      {rBeratPct > 0 && <div style={{ width: `${rBeratPct}%` }} className="bg-rose-600 h-full" title={`Rusak Berat: ${rBerat}m`} />}
                    </div>
                    <div className="flex flex-wrap gap-2 pt-0.5 text-[9px] font-bold text-stone-600 dark:text-stone-400">
                      <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500" /> Baik ({item.kondisiBaik}m)</span>
                      <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400" /> Sedang ({item.kondisiSedang}m)</span>
                      {rRingan > 0 && <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-orange-500" /> R.Ringan ({rRingan}m)</span>}
                      {rBerat > 0 && <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-rose-600" /> R.Berat ({rBerat}m)</span>}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* TABLE VIEW (13 KOLOM TEKNIS RESMI) */
        <div className="neu-card-elevated rounded-[28px] border border-white/80 dark:border-white/10 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs whitespace-nowrap">
              <thead className="bg-[#070b10] text-white uppercase text-[10px] font-condensed tracking-wider">
                <tr>
                  <th className="px-3 py-3.5 font-bold text-center">1. NO</th>
                  <th className="px-3 py-3.5 font-bold">2. DESA</th>
                  <th className="px-3 py-3.5 font-bold text-center">3. NO URUT</th>
                  <th className="px-4 py-3.5 font-bold">4. NAMA JALAN</th>
                  <th className="px-3 py-3.5 font-bold text-right">5. PANJANG (M)</th>
                  <th className="px-3 py-3.5 font-bold text-right">6. LEBAR (M)</th>
                  <th className="px-3 py-3.5 font-bold">7. PANGKAL</th>
                  <th className="px-3 py-3.5 font-bold">8. UJUNG</th>
                  <th className="px-3 py-3.5 font-bold text-teal-400">9. JENIS PERKERASAN</th>
                  <th className="px-3 py-3.5 font-bold text-right text-emerald-400">10. BAIK (M)</th>
                  <th className="px-3 py-3.5 font-bold text-right text-amber-300">11. SEDANG (M)</th>
                  <th className="px-3 py-3.5 font-bold text-right text-orange-400">12. RUSAK RG (M)</th>
                  <th className="px-3 py-3.5 font-bold text-right text-rose-400">13. RUSAK BR (M)</th>
                  <th className="px-3 py-3.5 font-bold text-center">MEDIA</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200/50 dark:divide-white/5 bg-transparent">
                {displayData.map((row, idx) => {
                  const pjg = Number(row.panjang ?? row.panjangMeter) || 0;
                  const lbr = Number(row.lebar ?? row.lebarMeter) || 0;
                  const videoLink = row.youtubeUrl || row.videoUrl;

                  return (
                    <tr key={row.id} className={idx % 2 === 0 ? "hover:bg-black/5 dark:hover:bg-white/5 transition-colors" : "bg-stone-500/5 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"}>
                      <td className="px-3 py-3 font-mono font-bold text-center text-slate-800 dark:text-slate-200">{row.no || idx + 1}</td>
                      <td className="px-3 py-3 font-bold text-slate-800 dark:text-slate-200">{row.desa || 'Sampeldes'}</td>
                      <td className="px-3 py-3 font-mono text-center text-stone-700 dark:text-stone-300">{row.noUrut}</td>
                      <td className="px-4 py-3 font-bold text-slate-900 dark:text-white">{row.namaJalan}</td>
                      <td className="px-3 py-3 font-mono font-bold text-right text-slate-900 dark:text-white">{pjg.toLocaleString('id-ID')}</td>
                      <td className="px-3 py-3 font-mono text-right text-stone-700 dark:text-stone-300">{lbr}</td>
                      <td className="px-3 py-3 text-stone-600 dark:text-stone-300">{row.pangkal || '-'}</td>
                      <td className="px-3 py-3 text-stone-600 dark:text-stone-300">{row.ujung || '-'}</td>
                      <td className="px-3 py-3 font-bold text-emerald-800 dark:text-teal-400">{row.jenisPerkerasan || '-'}</td>
                      <td className="px-3 py-3 font-mono text-right text-emerald-700 dark:text-emerald-400 font-bold">{row.kondisiBaik}</td>
                      <td className="px-3 py-3 font-mono text-right text-amber-700 dark:text-amber-400">{row.kondisiSedang}</td>
                      <td className="px-3 py-3 font-mono text-right text-orange-700 dark:text-orange-400">{row.kondisiRusakRingan}</td>
                      <td className="px-3 py-3 font-mono text-right text-rose-700 dark:text-rose-400">{row.kondisiRusakBerat}</td>
                      <td className="px-3 py-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {row.fotoUrl && (
                            <button
                              onClick={() => setActiveMedia({ type: 'photo', url: row.fotoUrl!, title: row.namaJalan })}
                              className="p-1.5 neu-inset rounded-lg text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors"
                              title="Lihat Foto"
                            >
                              <ImageIcon className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {videoLink && (
                            <button
                              onClick={() => setActiveMedia({ type: 'video', url: videoLink, title: row.namaJalan })}
                              className="p-1.5 bg-rose-600 hover:bg-rose-700 rounded-lg text-white transition-colors shadow-xs"
                              title="Tonton Video"
                            >
                              <Play className="w-3.5 h-3.5 fill-white" />
                            </button>
                          )}
                          {!row.fotoUrl && !videoLink && (
                            <span className="text-[10px] text-stone-400 italic">-</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL DIALOG LIGHTBOX FOTO / VIDEO PLAYER */}
      {activeMedia && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-300"
          onClick={() => setActiveMedia(null)}
        >
          <div
            className="relative bg-[#0f172a] rounded-[28px] overflow-hidden max-w-3xl w-full border border-white/20 shadow-2xl space-y-0"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 px-6 border-b border-white/10 text-white">
              <h4 className="text-sm font-condensed font-bold uppercase tracking-wider truncate pr-4">
                {activeMedia.title}
              </h4>
              <button
                onClick={() => setActiveMedia(null)}
                className="p-1.5 rounded-full hover:bg-white/10 text-stone-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-black flex items-center justify-center">
              {activeMedia.type === 'photo' ? (
                <img
                  src={activeMedia.url}
                  alt={activeMedia.title}
                  className="max-h-[75vh] w-auto object-contain rounded-xl"
                />
              ) : (
                <div className="aspect-video w-full rounded-xl overflow-hidden bg-black">
                  {extractYouTubeId(activeMedia.url) ? (
                    <iframe
                      src={`https://www.youtube-nocookie.com/embed/${extractYouTubeId(activeMedia.url)}?autoplay=1`}
                      title={activeMedia.title}
                      className="w-full h-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-stone-400 text-xs">
                      Tautan video YouTube tidak valid.
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function GaleriTab({ youtubeEmbedUrl, newsData, isLoadingNews }: { youtubeEmbedUrl: string | null, newsData?: any[] | null, isLoadingNews?: boolean }) {
  const documentationPhotos = useMemo(() => {
    if (!newsData) return [];
    return newsData
      .filter(news => news.imageUrl && news.mediaType !== 'video')
      .map(news => ({
        url: news.imageUrl,
        title: news.title,
        date: news.date,
      }));
  }, [newsData]);

  return (
    <div className="space-y-6 sm:space-y-12">
      {/* Video Profile Section */}
      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-rose-50 dark:bg-rose-950/40 text-rose-600 rounded-xl neu-inset"><PlayCircle className="h-5 w-5" /></div>
          <h3 className="text-lg sm:text-2xl font-condensed font-bold uppercase tracking-tight text-slate-900 dark:text-white">Video Profil Resmi Desa</h3>
        </div>
        <div className="neu-card-elevated-dark rounded-[28px] overflow-hidden border border-white/10 aspect-video bg-[#070b10] group relative">
          {youtubeEmbedUrl ? (
            <iframe
              src={youtubeEmbedUrl}
              title="Profil Desa Sampeldes"
              className="w-full h-full opacity-90 group-hover:opacity-100 transition-opacity"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <div className="flex h-full min-h-[180px] sm:min-h-[240px] md:min-h-[320px] items-center justify-center bg-[#070b10] text-center text-slate-200">
              <div className="space-y-2 sm:space-y-3 px-4 sm:px-6">
                <div className="mx-auto flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full bg-rose-600 text-white">
                  <PlayCircle className="h-5 w-5 sm:h-6 sm:w-6" />
                </div>
                <p className="text-sm sm:text-base font-semibold">Video profil desa belum dikonfigurasi.</p>
                <p className="text-xs text-slate-400">Silakan atur tautan YouTube di Pengaturan Admin.</p>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Photo Gallery Grid */}
      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-[#070b10] text-teal-400 rounded-xl neu-inset"><ImageIcon className="h-5 w-5" /></div>
          <h3 className="text-lg sm:text-2xl font-condensed font-bold uppercase tracking-tight text-slate-900 dark:text-white">Dokumentasi Kegiatan</h3>
        </div>

        {isLoadingNews ? (
          <div className="columns-2 sm:columns-2 lg:columns-3 gap-3 sm:gap-4 space-y-3 sm:space-y-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-36 sm:h-64 rounded-2xl sm:rounded-[24px] neu-inset" />
            ))}
          </div>
        ) : documentationPhotos.length === 0 ? (
          <div className="text-center py-10 sm:py-16 px-4 sm:px-6 neu-card-elevated rounded-[28px] border border-white/80 dark:border-white/10">
            <div className="inline-flex p-3 sm:p-4 bg-slate-100 dark:bg-stone-800 rounded-full mb-3 sm:mb-4 neu-inset">
              <ImageIcon className="h-6 w-6 sm:h-8 sm:w-8 text-slate-400" />
            </div>
            <p className="text-xs sm:text-base text-slate-700 dark:text-stone-300 font-semibold">Belum ada dokumentasi kegiatan.</p>
            <p className="text-[10px] sm:text-sm text-slate-500 dark:text-stone-400">Foto dokumentasi akan muncul otomatis dari berita terkini.</p>
          </div>
        ) : (
          <div className="columns-2 sm:columns-2 lg:columns-3 gap-3 sm:gap-4 space-y-3 sm:space-y-4">
            {documentationPhotos.map((photo, i) => (
              <div key={i} className="neu-card-elevated rounded-2xl sm:rounded-[24px] overflow-hidden border border-white/80 dark:border-white/10 hover:border-teal-400 transition-all duration-300 cursor-pointer group relative bg-white dark:bg-[#121820]">
                <img
                  src={photo.url}
                  alt={photo.title}
                  className="w-full h-auto object-cover transition-transform duration-700 group-hover:scale-105"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#070b10]/90 via-transparent to-transparent opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-2.5 sm:p-4">
                  <p className="text-white text-[11px] sm:text-sm font-semibold line-clamp-2 leading-tight">{photo.title}</p>
                  {photo.date && (
                    <p className="text-teal-400 text-[9px] sm:text-xs mt-0.5 sm:mt-1">{photo.date}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="text-center py-4 sm:py-8">
          <Link href="/BeritaDesa/">
            <Button variant="outline" className="neu-btn rounded-full font-condensed font-bold uppercase tracking-wider text-xs gap-2 border-stone-300 dark:border-white/10 text-slate-800 dark:text-white hover:bg-teal-500/20 hover:border-teal-400 h-11 px-8 transition-colors">
              Lihat Seluruh Berita
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}

function OfficialCard({ official, isSmall = false }: { official: Official, isSmall?: boolean }) {
  return (
    <div className="group neu-card-elevated rounded-2xl sm:rounded-[24px] border border-white/80 dark:border-white/10 hover:border-teal-400 transition-all duration-300 overflow-hidden flex flex-col justify-between w-full">
      <div className="relative aspect-[3/4] w-full neu-inset overflow-hidden">
        {official.imageUrl ? (
          <img
            src={official.imageUrl}
            alt={official.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-slate-50 dark:bg-stone-900/50">
            <UserCircle2 className="h-8 w-8 sm:h-12 sm:w-12 text-slate-300 dark:text-stone-600" />
          </div>
        )}
      </div>
      <div className="p-3 sm:p-4 space-y-1 sm:space-y-1.5">
        <div className="w-6 h-1 bg-teal-500 rounded-full group-hover:w-full transition-all duration-300" />
        <h3 className="text-xs sm:text-sm font-condensed font-bold uppercase tracking-tight text-slate-900 dark:text-white leading-tight line-clamp-2 break-words">
          {official.name}
        </h3>
        <p className="text-[10px] sm:text-xs font-bold text-teal-700 dark:text-teal-400 uppercase tracking-wider line-clamp-2 break-words">
          {official.position}
        </p>
      </div>
    </div>
  );
}

export default function ProfilDesaPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen w-full items-center justify-center bg-[#F8FAFC] dark:bg-[#060b11]">
          <div className="flex flex-col items-center">
            <Loader2 className="h-10 w-10 animate-spin text-teal-600 dark:text-teal-400 mb-4" />
            <p className="text-[10px] font-black tracking-[0.4em] text-slate-500 uppercase">
              Memuat Profil Desa...
            </p>
          </div>
        </div>
      }
    >
      <ProfilDesaContent />
    </Suspense>
  );
}
