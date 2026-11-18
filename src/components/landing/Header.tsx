'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Menu,
  ChevronDown,
  Search,
  User,
  Globe2,
  Lock,
  Phone,
  FileText,
  ChevronRight
} from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { NightModeSwitch } from '@/components/ui/NightModeSwitch';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import Image from 'next/image';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { VillageLogoInfo } from '@/lib/types';
import { doc } from 'firebase/firestore';
import { cn } from '@/lib/utils';

const primaryNavItems = [
  { href: '/', label: 'HOME', isHome: true },
  { href: '/pelayanan-desa/', label: 'PELAYANAN' },
  { href: '/profil-desa/', label: 'PROFIL' },
  { href: '/statistik/', label: 'STATISTIK' },
  { href: '/tata-kelola-desa/', label: 'TATA KELOLA DESA' },
  { href: '/BeritaDesa/', label: 'BERITA' },
];

const statistikSubLinks = [
  { href: '/statistik?tab=kependudukan', label: 'Kependudukan' },
  { href: '/statistik?tab=pendidikan', label: 'Pendidikan' },
  { href: '/statistik?tab=kesehatan', label: 'Kesehatan' },
  { href: '/statistik?tab=sosial', label: 'Sosial' },
  { href: '/statistik?tab=ekonomi', label: 'Ekonomi' },
  { href: '/statistik?tab=pembangunan', label: 'Pembangunan Desa' },
  { href: '/statistik?tab=sdgs', label: 'SDGs Desa' },
  { href: '/statistik?tab=indeks', label: 'Indeks Desa' },
];

const moreLinks = [
  { href: '/pelayanan-desa?tab=agenda-desa', label: 'Agenda Kegiatan Desa' },
  { href: '/nomor-penting/', label: 'Kontak & Nomor Penting' },
  { href: '/desa-anti-korupsi/', label: 'Desa Anti Korupsi' },
  { href: '/pemilu-pilkada/', label: 'Data Pemilu & Pilkada' },
  { href: '/#pbb-section', label: 'PBB-P2' },
  { href: '/layanan-surat/', label: 'Layanan Surat Mandiri' },
  { href: '/potensi-desa/', label: 'Potensi & Wisata Desa' },
  { href: '/umkm-dan-industri-kreatif/', label: 'UMKM & Produk Warga' },
  { href: '/pengumuman/', label: 'Pengumuman Resmi' },
  { href: '/pengaduan/', label: 'Pengaduan Warga' },
];

export function Header() {
  const pathname = usePathname();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileSheetOpen, setMobileSheetOpen] = useState(false);

  const firestore = useFirestore();
  const logoRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, 'villageLogo', 'default');
  }, [firestore]);

  const { data: logoData, isLoading: isLogoLoading } = useDoc<VillageLogoInfo>(logoRef, { suppressGlobalError: true });

  // Pada halaman depan (/), header transparan saat scrollY < 20, dan solid saat di-scroll
  const isLanding = pathname === '/' || pathname === '';
  const isSolid = !isLanding || isScrolled;

  useEffect(() => {
    const onScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className={cn(
        'fixed top-0 left-0 z-50 w-full transition-all duration-300',
        isScrolled || !isLanding
          ? 'translate-y-0 opacity-100 bg-white/90 dark:bg-[#081d27]/95 backdrop-blur-xl border-b border-slate-200/80 dark:border-white/10 shadow-[0_4px_25px_rgba(0,0,0,0.06)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.6)] pointer-events-auto'
          : '-translate-y-full opacity-0 pointer-events-none'
      )}
    >
      <div className="mx-auto flex h-16 sm:h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand / Logo (Left) */}
        <Link
          href="/"
          className="flex items-center gap-2 sm:gap-2.5 min-w-0 flex-1 sm:flex-initial mr-2 sm:mr-4 xl:mr-8 transition-all hover:scale-[1.02] active:scale-[0.98]"
          aria-label="Beranda Portal Desa Sampeldes"
        >
          {isLogoLoading ? (
            <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-xl bg-slate-200/50 dark:bg-slate-800/50 animate-pulse shrink-0" />
          ) : logoData?.logoImageUrl ? (
            <div
              className={cn(
                'relative flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-xl overflow-hidden p-1 shrink-0 transition-all',
                isScrolled || !isLanding
                  ? 'bg-teal-50/80 dark:bg-teal-900/30 border border-teal-200/60 dark:border-teal-700/40 shadow-xs'
                  : 'bg-white/10 border border-white/20 shadow-xs'
              )}
            >
              <Image
                src={logoData.logoImageUrl}
                alt="Logo Desa Sampeldes"
                width={40}
                height={40}
                className="h-full w-full object-contain"
                priority
              />
            </div>
          ) : (
            <div
              className={cn(
                'flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-xl shrink-0 transition-all',
                isScrolled || !isLanding
                  ? 'bg-teal-50 dark:bg-teal-900/40 border border-teal-200/70 dark:border-teal-700/40 text-teal-600 dark:text-teal-400'
                  : 'bg-teal-500/20 border border-teal-400/40 text-teal-300'
              )}
            >
              <Globe2 className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>
          )}
          <div className="flex flex-col text-left min-w-0">
            <span
              className={cn(
                'font-sans font-extrabold tracking-[0.12em] sm:tracking-[0.16em] xl:tracking-[0.2em] text-xs sm:text-base uppercase leading-none transition-colors truncate',
                isScrolled || !isLanding ? 'text-slate-900 dark:text-white' : 'text-white'
              )}
            >
              DESA SAMPELDES
            </span>
            <span
              className={cn(
                'text-[8px] sm:text-[9px] font-sans uppercase tracking-[0.18em] sm:tracking-[0.2em] xl:tracking-[0.25em] font-bold mt-0.5 sm:mt-1 transition-colors truncate',
                isScrolled || !isLanding ? 'text-teal-600 dark:text-teal-400' : 'text-teal-300'
              )}
            >
              GANDRUNGMANGU • CILACAP
            </span>
          </div>
        </Link>

        {/* Center Navigation Links */}
        <nav className="hidden lg:flex items-center gap-3 xl:gap-5">
          {primaryNavItems.map((item) => {
            const isActive = item.isHome ? isLanding : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'text-[10px] xl:text-[11.5px] font-bold uppercase tracking-[0.08em] xl:tracking-[0.12em] transition-all py-1.5 relative whitespace-nowrap',
                  isScrolled || !isLanding
                    ? isActive
                      ? 'text-teal-600 dark:text-teal-400 font-extrabold after:absolute after:bottom-0 after:left-0 after:w-full after:h-[2.5px] after:bg-teal-600 dark:after:bg-teal-400 after:rounded-full'
                      : 'text-slate-600 dark:text-slate-300 hover:text-teal-600 dark:hover:text-teal-400'
                    : isActive
                      ? 'text-white font-extrabold after:absolute after:bottom-0 after:left-0 after:w-full after:h-[2.5px] after:bg-teal-400 after:rounded-full drop-shadow'
                      : 'text-white/80 hover:text-teal-300'
                )}
              >
                {item.label}
              </Link>
            );
          })}

          {/* Dropdown "LAINNYA" */}
          <DropdownMenu>
            <DropdownMenuTrigger
              className={cn(
                'flex items-center gap-1 text-[10px] xl:text-[11.5px] font-bold uppercase tracking-[0.08em] xl:tracking-[0.12em] transition-colors py-1.5 outline-none whitespace-nowrap cursor-pointer',
                isScrolled || !isLanding
                  ? 'text-slate-600 dark:text-slate-300 hover:text-teal-600 dark:hover:text-teal-400'
                  : 'text-white/80 hover:text-teal-300'
              )}
            >
              <span>LAINNYA</span>
              <ChevronDown className="h-3.5 w-3.5 transition-transform duration-200" />
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className={cn(
                'mt-2 w-60 rounded-2xl p-2.5 transition-all shadow-xl z-50',
                isScrolled || !isLanding
                  ? 'bg-white/95 dark:bg-[#081d27]/95 backdrop-blur-2xl border border-slate-200/80 dark:border-white/10 text-slate-800 dark:text-white'
                  : 'border border-white/20 bg-[#081d27]/95 backdrop-blur-2xl text-white'
              )}
            >
              {moreLinks.map((link) => (
                <DropdownMenuItem
                  key={link.href}
                  asChild
                  className={cn(
                    'rounded-xl px-3.5 py-2 text-xs font-semibold transition-colors cursor-pointer',
                    isScrolled || !isLanding
                      ? 'text-slate-700 dark:text-slate-200 hover:text-teal-600 dark:hover:text-teal-300 hover:bg-teal-50 dark:hover:bg-teal-900/30 focus:bg-teal-50 dark:focus:bg-teal-900/30 focus:text-teal-600 dark:focus:text-teal-300'
                      : 'text-slate-100 hover:text-teal-300 hover:bg-white/10 focus:bg-white/10 focus:text-teal-300'
                  )}
                >
                  <Link href={link.href}>{link.label}</Link>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </nav>

        {/* Right Action Icons */}
        <div className="hidden lg:flex items-center gap-2.5 xl:gap-3.5 shrink-0 ml-4 xl:ml-8">
          <Link
            href="/#pbb-section"
            aria-label="Pencarian PBB"
            className={cn(
              'h-9 w-9 flex items-center justify-center rounded-full transition-all cursor-pointer',
              isScrolled || !isLanding
                ? 'bg-slate-100/90 dark:bg-white/10 text-slate-700 dark:text-slate-200 hover:bg-teal-50 hover:text-teal-600 dark:hover:bg-teal-900/40 dark:hover:text-teal-300 border border-slate-200/60 dark:border-white/10'
                : 'text-white/85 hover:text-teal-300 hover:bg-white/10 border border-transparent'
            )}
            title="Cek Pajak PBB-P2"
          >
            <Search className="h-4 w-4" />
          </Link>

          <Link
            href="/login/"
            aria-label="Masuk Akun / Admin"
            className={cn(
              'h-9 w-9 flex items-center justify-center rounded-full transition-all cursor-pointer',
              isScrolled || !isLanding
                ? 'bg-slate-100/90 dark:bg-white/10 text-slate-700 dark:text-slate-200 hover:bg-teal-50 hover:text-teal-600 dark:hover:bg-teal-900/40 dark:hover:text-teal-300 border border-slate-200/60 dark:border-white/10'
                : 'text-white/85 hover:text-teal-300 hover:bg-white/10 border border-transparent'
            )}
            title="Portal Admin Desa"
          >
            <User className="h-4 w-4" />
          </Link>

          {/* Tombol Switch Tampilan Night Mode */}
          <NightModeSwitch size="md" />

          <Link href="/layanan-surat/">
            <Button
              size="sm"
              className={cn(
                'h-9 rounded-full font-extrabold text-xs uppercase tracking-wider px-5 transition-all shadow-md hover:scale-105 active:scale-95 cursor-pointer',
                isScrolled || !isLanding
                  ? 'bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white shadow-teal-600/20'
                  : 'bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 font-black shadow-teal-500/30'
              )}
            >
              Surat Mandiri
            </Button>
          </Link>
        </div>

        {/* Mobile Burger Menu Button & Theme Switch */}
        <div className="flex items-center gap-1.5 sm:gap-2 lg:hidden shrink-0">
          <NightModeSwitch size="sm" />

          <Link
            href="/login/"
            className={cn(
              'h-8 w-8 sm:h-9 sm:w-9 flex items-center justify-center rounded-xl transition-all cursor-pointer shrink-0',
              isScrolled || !isLanding
                ? 'bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-200 hover:text-teal-600 border border-slate-200/60 dark:border-white/10'
                : 'text-white/90 hover:text-white bg-white/10 hover:bg-white/20'
            )}
            aria-label="Portal Pamong Desa"
          >
            <User className="h-4 w-4" />
          </Link>

          <Sheet open={mobileSheetOpen} onOpenChange={setMobileSheetOpen}>
            <SheetTrigger asChild>
              <button
                type="button"
                className={cn(
                  'h-8 w-8 sm:h-9 sm:w-9 flex items-center justify-center rounded-xl transition-all cursor-pointer shrink-0 active:scale-95',
                  isScrolled || !isLanding
                    ? 'bg-teal-600 hover:bg-teal-500 text-white shadow-sm shadow-teal-700/30'
                    : 'text-white bg-teal-600/90 hover:bg-teal-500 shadow-sm'
                )}
                aria-label="Buka menu navigasi"
              >
                <Menu className="h-4 w-4" />
              </button>
            </SheetTrigger>
            <SheetContent
              side="right"
              className="w-[310px] min-[400px]:w-[340px] max-w-[88vw] border-l border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#081d27] text-slate-800 dark:text-white p-4 min-[400px]:p-5 shadow-2xl flex flex-col justify-between overflow-y-auto"
            >
              <SheetHeader className="sr-only">
                <SheetTitle>Menu Navigasi</SheetTitle>
                <SheetDescription>Menu navigasi desa</SheetDescription>
              </SheetHeader>

              <div className="flex flex-col gap-3.5 min-[400px]:gap-4">
                {/* Header Brand */}
                <div className="flex items-center gap-2.5 sm:gap-3 pb-3.5 border-b border-slate-100 dark:border-white/10 pr-8">
                  {logoData?.logoImageUrl ? (
                    <div className="relative flex h-9 w-9 min-[400px]:h-10 min-[400px]:w-10 items-center justify-center rounded-xl overflow-hidden p-1 bg-teal-50 dark:bg-teal-900/40 border border-teal-200/60 dark:border-teal-700/40 shrink-0">
                      <Image
                        src={logoData.logoImageUrl}
                        alt="Logo Desa Sampeldes"
                        width={36}
                        height={36}
                        className="h-full w-full object-contain"
                      />
                    </div>
                  ) : (
                    <div className="flex h-9 w-9 min-[400px]:h-10 min-[400px]:w-10 items-center justify-center rounded-xl bg-teal-50 dark:bg-teal-900/40 text-teal-600 dark:text-teal-400 shrink-0 border border-teal-200/60 dark:border-teal-700/40">
                      <Globe2 className="h-4 w-4 sm:h-5 sm:w-5" />
                    </div>
                  )}
                  <div className="flex flex-col text-left">
                    <span className="font-sans font-black uppercase text-slate-900 dark:text-white tracking-[0.16em] text-xs sm:text-sm leading-none">
                      DESA SAMPELDES
                    </span>
                    <span className="text-[8px] sm:text-[9px] font-bold text-teal-600 dark:text-teal-400 tracking-[0.2em] uppercase mt-1">
                      GANDRUNGMANGU • CILACAP
                    </span>
                  </div>
                </div>

                {/* Primary Navigation */}
                <div className="space-y-1.5">
                  {primaryNavItems.map((item) => {
                    const active = item.isHome ? (pathname === '/' || pathname === '') : pathname.startsWith(item.href);
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setMobileSheetOpen(false)}
                        className={cn(
                          'px-3.5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-between transition-all duration-200',
                          active
                            ? 'bg-gradient-to-r from-teal-600 to-emerald-600 text-white shadow-md shadow-teal-600/20'
                            : 'bg-slate-50 dark:bg-white/5 text-slate-700 dark:text-slate-200 hover:text-teal-600 dark:hover:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-900/30 border border-slate-200/50 dark:border-white/5'
                        )}
                      >
                        <span>{item.label}</span>
                        {active ? (
                          <span className="w-2 h-2 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)]" />
                        ) : (
                          <ChevronRight className="h-3.5 w-3.5 opacity-40 shrink-0" />
                        )}
                      </Link>
                    );
                  })}
                </div>

                {/* Secondary Links Container */}
                <div className="rounded-2xl p-2.5 bg-slate-50 dark:bg-white/5 border border-slate-200/60 dark:border-white/10 space-y-0.5">
                  <div className="px-2.5 pt-1 pb-1">
                    <p className="text-[9px] font-extrabold uppercase tracking-widest text-teal-700 dark:text-teal-400">
                      Layanan & Informasi
                    </p>
                  </div>
                  {moreLinks.map((link) => {
                    const active = pathname.startsWith(link.href) && link.href !== '/#pbb-section';
                    return (
                      <Link
                        key={link.href}
                        href={link.href}
                        onClick={() => setMobileSheetOpen(false)}
                        className={cn(
                          'px-2.5 py-1.5 rounded-xl text-[11px] font-semibold transition-all flex items-center justify-between',
                          active
                            ? 'bg-teal-500/15 text-teal-700 dark:text-teal-300 font-bold'
                            : 'text-slate-600 dark:text-slate-300 hover:text-teal-600 dark:hover:text-teal-300 hover:bg-teal-50/50 dark:hover:bg-white/5'
                        )}
                      >
                        <span className="truncate">{link.label}</span>
                        <ChevronRight className="h-3 w-3 opacity-30 shrink-0 ml-1" />
                      </Link>
                    );
                  })}
                </div>
              </div>

              {/* Night Mode Switch di menu mobile */}
              <div className="mt-3 flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200/60 dark:border-white/10">
                <div className="flex flex-col">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                    Tampilan Malam
                  </span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">
                    Mode gelap (Night Mode)
                  </span>
                </div>
                <NightModeSwitch size="sm" />
              </div>

              {/* Bottom Actions */}
              <div className="pt-3.5 border-t border-slate-100 dark:border-white/10 flex flex-col gap-2 mt-3">
                <Link href="/layanan-surat/" onClick={() => setMobileSheetOpen(false)}>
                  <Button className="w-full h-11 min-[400px]:h-12 rounded-xl font-extrabold text-xs uppercase tracking-wider flex items-center justify-center gap-2 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white shadow-md shadow-teal-600/20 border-0 cursor-pointer">
                    <FileText className="h-4 w-4" />
                    <span>Buat Surat Mandiri</span>
                  </Button>
                </Link>
                <div className="flex gap-2">
                  <Link href="/#pbb-section" onClick={() => setMobileSheetOpen(false)} className="flex-1">
                    <Button variant="outline" className="w-full h-9 rounded-xl font-bold text-[10px] uppercase tracking-wider bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-200 hover:bg-teal-50 hover:text-teal-600 dark:hover:bg-teal-900/30 border border-slate-200/60 dark:border-white/10 cursor-pointer">
                      <Search className="h-3 w-3 mr-1 text-teal-600 dark:text-teal-400" />
                      PBB-P2
                    </Button>
                  </Link>
                  <Link href="/login/" onClick={() => setMobileSheetOpen(false)} className="flex-1">
                    <Button variant="outline" className="w-full h-9 rounded-xl font-bold text-[10px] uppercase tracking-wider bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-200 hover:bg-teal-50 hover:text-teal-600 dark:hover:bg-teal-900/30 border border-slate-200/60 dark:border-white/10 cursor-pointer">
                      <User className="h-3 w-3 mr-1 text-teal-600 dark:text-teal-400" />
                      Admin
                    </Button>
                  </Link>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
