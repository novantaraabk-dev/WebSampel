'use client';

import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarInset,
  useSidebar,
} from '@/components/ui/sidebar';

import { Logo } from '@/components/logo';
import {
  FileCheck,
  Megaphone,
  LogOut,
  Settings,
  Loader2,
  MessageSquare,
  Users,
  FilePlus,
  Files,
  Newspaper,
  PlusCircle,
  List,
  Building2,
  Menu,
  X,
  ArrowRightLeft,
  FileStack,
  FileSpreadsheet,
  BookOpen,
  BarChart3,
  ShieldCheck,
  Landmark,
  Store,
  Globe,
  HardHat,
  AlertTriangle,
  Vote,
  Hash,
} from 'lucide-react';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useFirebase, useFirestore } from '@/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { CurvedSidebarItem } from '@/components/layout/CurvedSidebarItem';
import { NightModeSwitch } from '@/components/ui/NightModeSwitch';
import { cn, getPublicSiteUrl } from '@/lib/utils';

interface AdminNavItem {
  href: string;
  label: string;
  icon: any;
  activeColor: string;
  activeTextColor: string;
  subItems?: { href: string; label: string; icon?: any }[];
}

const adminNavItems: AdminNavItem[] = [
  {
    href: '/admin/surat',
    icon: Files,
    label: 'Manajemen Surat',
    activeColor: 'bg-[#0284c7]',
    activeTextColor: 'text-sky-900',
    subItems: [
      { href: '/admin/surat', label: 'Kelola Surat', icon: FileCheck },
      { href: '/admin/surat/input', label: 'Pengajuan Baru', icon: FilePlus },
      { href: '/admin/surat/master', label: 'Pengaturan Surat (Master)', icon: Settings },
      { href: '/admin/surat/lampiran', label: 'Lampiran Surat', icon: FileSpreadsheet },
      { href: '/admin/surat/capil', label: 'Formulir Capil', icon: FileStack },
    ],
  },
  {
    href: '/admin/berita',
    icon: Newspaper,
    label: 'Berita Desa',
    activeColor: 'bg-[#ea384c]',
    activeTextColor: 'text-rose-900',
    subItems: [
      { href: '/admin/berita/buat', label: 'Buat Berita', icon: PlusCircle },
      { href: '/admin/berita', label: 'Rincian Berita', icon: List },
      { href: '/BeritaDesa', label: 'Data & Informasi', icon: Globe },
    ],
  },
  {
    href: '/admin/pelayanan',
    icon: Globe,
    label: 'Data & Informasi Web',
    activeColor: 'bg-[#059669]',
    activeTextColor: 'text-emerald-900',
    subItems: [
      { href: '/admin/pelayanan', label: 'Data Pelayanan', icon: BookOpen },
      { href: '/admin/profil-desa', label: 'Profil Desa', icon: Landmark },
      { href: '/admin/pemerintahan', label: 'Pemerintahan Desa', icon: Building2 },
      { href: '/admin/tata-kelola-desa', label: 'Tata Kelola Desa', icon: BarChart3 },
      { href: '/admin/desa-anti-korupsi', label: 'Desa Anti Korupsi', icon: ShieldCheck },
      { href: '/admin/potensi-desa', label: 'Potensi Desa', icon: Landmark },
      { href: '/admin/umkm-industri', label: 'UMKM & Industri Kreatif', icon: Store },
      { href: '/admin/pemilu-pilkada', label: 'Data Pemilu & Pilkada', icon: Vote },
      { href: '/admin/statistik', label: 'Statistik Desa', icon: BarChart3 },
    ],
  },
  {
    href: '/admin/pengaduan',
    icon: MessageSquare,
    label: 'Pengaduan',
    activeColor: 'bg-[#ea580c]',
    activeTextColor: 'text-orange-900',
    subItems: [
      { href: '/admin/pengaduan', label: 'Jawab Pengaduan', icon: MessageSquare },
      { href: '/admin/pengumuman', label: 'Kelola Pengumuman', icon: Megaphone },
    ],
  },
  {
    href: '/admin/penduduk',
    icon: Settings,
    label: 'Sistem',
    activeColor: 'bg-[#475569]',
    activeTextColor: 'text-slate-900',
    subItems: [
      { href: '/admin/penduduk', label: 'Data Penduduk', icon: Users },
      { href: '/admin/settings?tab=register-surat', label: 'Register Nomor Surat', icon: Hash },
      { href: '/admin/settings', label: 'Pengaturan Sistem', icon: Settings },
    ],
  },
];

function AdminMobileHeader() {
  const { toggleSidebar, openMobile } = useSidebar();
  const [publicWebUrl, setPublicWebUrl] = useState<string>(
    'https://' + (process.env.NEXT_PUBLIC_SITE_DOMAIN || 'sampeldes.gandrungmangu.id') + '/'
  );

  useEffect(() => {
    setPublicWebUrl(getPublicSiteUrl('/'));
  }, []);

  return (
    <header className="md:hidden sticky top-0 z-40 w-full h-14 sm:h-16 bg-[#0e1620] flex items-center justify-between px-3.5 sm:px-6 shadow-sm border-b border-white/10 text-white">
      <Logo />
      <div className="flex items-center gap-2">
        <Link href="/manajemen/dashboard" title="Menuju Portal Manajemen">
          <Button
            variant="outline"
            size="sm"
            className="h-8 px-2.5 text-[10px] font-condensed font-extrabold uppercase tracking-wider text-slate-200 bg-white/5 gap-1 rounded-full border-white/10 hover:bg-white/10 hover:text-white"
          >
            <ArrowRightLeft className="h-3.5 w-3.5 text-emerald-400" />
            <span className="hidden min-[360px]:inline">Manajemen</span>
          </Button>
        </Link>
        <a href={publicWebUrl} title="Menuju Web Publik">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-2 text-[10px] font-condensed font-extrabold uppercase text-slate-400 hover:text-white rounded-full hover:bg-white/5"
          >
            <Globe className="h-3.5 w-3.5" />
          </Button>
        </a>
        {/* Tombol Toggle Biru */}
        <button
          type="button"
          onClick={toggleSidebar}
          className="h-9 w-9 rounded-xl bg-[#0284c7] hover:bg-[#0369a1] text-white flex items-center justify-center shadow-md active:scale-95 transition-all"
          aria-label="Toggle menu navigasi"
        >
          {openMobile ? <X className="h-5 w-5 stroke-[2.5]" /> : <Menu className="h-5 w-5 stroke-[2.5]" />}
        </button>
      </div>
    </header>
  );
}

function AdminSidebarInner({
  handleLogout,
}: {
  handleLogout: () => void;
}) {
  const pathname = usePathname();
  const { isMobile, setOpenMobile, state, toggleSidebar } = useSidebar();
  const isCollapsed = state === 'collapsed';

  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({});
  const [publicWebUrl, setPublicWebUrl] = useState<string>(
    'https://' + (process.env.NEXT_PUBLIC_SITE_DOMAIN || 'sampeldes.gandrungmangu.id') + '/'
  );

  useEffect(() => {
    setPublicWebUrl(getPublicSiteUrl('/'));
  }, []);

  useEffect(() => {
    adminNavItems.forEach((item) => {
      if (item.subItems?.some((sub) => pathname === sub.href || pathname.startsWith(sub.href + '/'))) {
        setOpenMenus((prev) => ({ ...prev, [item.label]: true }));
      }
    });
  }, [pathname]);

  const toggleSubMenu = (label: string) => {
    setOpenMenus((prev) => ({
      ...prev,
      [label]: !prev[label],
    }));
  };

  const handleNavClick = () => {
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  return (
    <Sidebar
      collapsible="icon"
      className="border-r-0 bg-[#0e1620] text-white shadow-none overflow-visible font-sans z-30"
    >
      <SidebarHeader className="p-3.5 border-b border-white/10 bg-[#0e1620] text-white">
        {!isCollapsed ? (
          <div>
            <div className="flex items-center justify-between">
              <Logo />
              {/* Tombol Toggle Biru Kotak Sesuai Konsep Gambar */}
              <button
                type="button"
                onClick={toggleSidebar}
                className="h-9 w-9 rounded-xl bg-[#0284c7] hover:bg-[#0369a1] text-white flex items-center justify-center shadow-md active:scale-95 transition-all cursor-pointer shrink-0 ml-auto"
                title="Perkecil Sidebar"
              >
                <X className="h-5 w-5 stroke-[2.5]" />
              </button>
            </div>
            <div className="mt-3 pt-2.5 border-t border-white/10 flex flex-col gap-1.5">
              <Link href="/manajemen/dashboard" onClick={handleNavClick}>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full h-8 px-2.5 rounded-xl text-[10px] font-condensed font-extrabold uppercase tracking-wider text-slate-200 bg-white/5 border-white/10 hover:bg-white/10 hover:text-white justify-start gap-2 shadow-xs transition-all active:scale-95"
                >
                  <ArrowRightLeft className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                  <span className="truncate">Ke Portal Manajemen</span>
                </Button>
              </Link>
              <a href={publicWebUrl} onClick={handleNavClick}>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full h-7 px-2.5 rounded-xl text-[10px] font-condensed font-extrabold uppercase tracking-wider text-slate-400 hover:text-white hover:bg-white/5 justify-start gap-2 transition-all active:scale-95"
                >
                  <Globe className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">Kunjungi Web Publik</span>
                </Button>
              </a>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center py-1 gap-2">
            <div className="h-9 w-9 rounded-xl bg-[#0284c7] text-white flex items-center justify-center font-bold text-xs shadow-xs">
              B
            </div>
            {/* Tombol Toggle Biru Kotak Sesuai Konsep Gambar */}
            <button
              type="button"
              onClick={toggleSidebar}
              className="h-9 w-9 rounded-xl bg-[#0284c7] hover:bg-[#0369a1] text-white flex items-center justify-center shadow-md active:scale-95 transition-all cursor-pointer"
              title="Buka Sidebar"
            >
              <Menu className="h-5 w-5 stroke-[2.5]" />
            </button>
          </div>
        )}
      </SidebarHeader>

      <SidebarContent className={cn("py-3 bg-[#0e1620] overflow-y-auto overflow-x-visible scrollbar-none [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden", isCollapsed ? "px-0" : "pl-3 pr-0")}>
        <div className="flex flex-col gap-1 w-full">
          {adminNavItems.map((item) => {
            const isSubActive = item.subItems?.some(
              (sub) => pathname === sub.href || pathname.startsWith(sub.href + '/')
            );
            const isActive =
              isSubActive ||
              (!item.subItems &&
                (pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href + '/'))));

            const isOpen = openMenus[item.label] ?? false;

            return (
              <CurvedSidebarItem
                key={item.href}
                href={item.href}
                label={item.label}
                icon={item.icon}
                activeColor={item.activeColor}
                activeTextColor={item.activeTextColor}
                isActive={Boolean(isActive)}
                isCollapsed={isCollapsed}
                onClick={handleNavClick}
                subItems={item.subItems}
                isOpen={isOpen}
                onToggleSub={() => toggleSubMenu(item.label)}
              />
            );
          })}
        </div>
      </SidebarContent>

      <SidebarFooter className="p-3 border-t border-white/10 bg-[#0e1620]">
        {!isCollapsed ? (
          <div className="space-y-2">
            {/* Profil Sesuai Konsep Gambar */}
            <div className="flex items-center justify-between gap-2 p-2 rounded-2xl bg-white/5 border border-white/10">
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                <div className="h-9 w-9 rounded-full bg-[#0284c7] text-white font-extrabold flex items-center justify-center text-xs shrink-0 shadow-xs">
                  AD
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-condensed font-extrabold uppercase text-white truncate">
                    Admin Sampeldes
                  </p>
                  <span className="text-[10px] font-sans text-slate-400 font-semibold block truncate">
                    Administrator
                  </span>
                </div>
              </div>

              {/* Tombol ON / OFF Night Mode */}
              <NightModeSwitch size="sm" />
            </div>

            {/* Logout Row Sesuai Konsep Gambar */}
            <button
              type="button"
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 h-10 rounded-xl text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors font-condensed font-extrabold text-xs uppercase tracking-wider cursor-pointer"
            >
              <LogOut className="h-4 w-4 shrink-0" />
              <span>LOGOUT</span>
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 py-1">
            <div
              className="h-9 w-9 rounded-full bg-[#0284c7] text-white font-extrabold flex items-center justify-center text-xs shadow-xs"
              title="Admin Sampeldes"
            >
              AD
            </div>
            <button
              type="button"
              onClick={handleLogout}
              title="Logout"
              className="h-9 w-9 rounded-xl flex items-center justify-center text-slate-500 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
            >
              <LogOut className="h-4.5 w-4.5" />
            </button>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { auth, user, isUserLoading } = useFirebase();
  const db = useFirestore();

  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    if (isLoggingOut) return;

    const activeUser = user || auth?.currentUser;

    // Tunggu jika auth masih loading dan belum ada activeUser, sertakan timeout pengaman
    if (isUserLoading && !activeUser) {
      const timer = setTimeout(() => {
        const currentUser = user || auth?.currentUser;
        if (!currentUser) {
          if (typeof window !== 'undefined') {
            localStorage.removeItem('isAdmin');
            localStorage.removeItem('adminEmail');
            localStorage.removeItem('lastWorkspace');
          }
          setIsAdmin(false);
          router.replace('/login');
        }
      }, 2500);

      return () => clearTimeout(timer);
    }

    if (!activeUser) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('isAdmin');
        localStorage.removeItem('adminEmail');
        localStorage.removeItem('lastWorkspace');
      }
      setIsAdmin(false);
      router.replace('/login');
      return;
    }

    const checkAdminAccess = async () => {
      const email = activeUser.email?.toLowerCase() || '';

      // 1. ISOLASI: Blokir akun Admin Absensi & Perangkat Absensi dari Pengaturan Web
      if (
        email.endsWith('@sampeldes.id') ||
        email === 'adminsampeldes@sampeldes.id' ||
        email === 'admin@sampeldes.id'
      ) {
        if (db) {
          try {
            const personelSnap = await getDoc(doc(db, 'personel', activeUser.uid));
            if (personelSnap.exists()) {
              const pData = personelSnap.data();
              if (pData.role === 'perangkat') {
                setIsAdmin(false);
                router.replace('/absensi/dashboard');
                return;
              }
              if (
                pData.role === 'admin_absensi' ||
                pData.username === 'adminsampeldes' ||
                pData.username === 'admin'
              ) {
                setIsAdmin(false);
                router.replace('/absensi-admin/dashboard');
                return;
              }
            }
          } catch (err) {
            console.error('Error verifying personel role in admin layout:', err);
          }
        }

        if (email.startsWith('adminsampeldes') || email.startsWith('admin@')) {
          setIsAdmin(false);
          router.replace('/absensi-admin/dashboard');
          return;
        }

        // Akun @sampeldes.id lainnya adalah akun presensi perangkat
        setIsAdmin(false);
        router.replace('/absensi/dashboard');
        return;
      }

      // 2. Hanya akun Admin Web Resmi Desa yang berhak mengakses Pengaturan Web
      const isOfficialAdmin =
        email === 'sampeldes@gmail.id' ||
        email === 'desasampeldes@gmail.com' ||
        email === 'pemdessampeldes@gmail.com' ||
        email === 'pemdes.sampeldes@gmail.com' ||
        email === 'novantaraabk@gmail.com' ||
        (email.includes('sampeldes') && !email.endsWith('@sampeldes.id'));

      if (isOfficialAdmin) {
        setIsAdmin(true);
      } else {
        setIsAdmin(false);
        router.replace('/login');
      }
    };

    checkAdminAccess();
  }, [isLoggingOut, isUserLoading, user, auth, router, db]);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('isAdmin');
        localStorage.removeItem('adminEmail');
        localStorage.removeItem('lastWorkspace');
      }
      if (auth) {
        await auth.signOut();
      }
      router.replace('/login');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  if (isUserLoading || isAdmin === null) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[#F8FAFC] dark:bg-[#060b11] neu-canvas">
        <div className="flex flex-col items-center p-8 rounded-2xl bg-white/90 dark:bg-[#081d27]/90 shadow-xl border border-slate-200/80 dark:border-white/10 backdrop-blur-md">
          <div className="h-12 w-12 rounded-2xl bg-slate-100 dark:bg-white/5 flex items-center justify-center mb-4 text-[#060b11]">
            <Loader2 className="h-6 w-6 animate-spin text-teal-600" />
          </div>
          <p className="text-[11px] font-condensed font-extrabold tracking-[0.25em] text-slate-700 dark:text-slate-300 uppercase">
            Memverifikasi Otoritas Admin...
          </p>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider defaultOpen={true}>
      <AdminSidebarInner handleLogout={handleLogout} />

      <SidebarInset className="flex-1 flex flex-col min-w-0 max-w-full overflow-x-hidden bg-[#F8FAFC] dark:bg-[#060b11] neu-canvas transition-colors duration-300">
        <AdminMobileHeader />
        <main className="max-w-[1400px] mx-auto w-full p-3 sm:p-6 md:p-8 flex-1 overflow-x-hidden min-w-0">
          {children}
        </main>

        <footer className="bg-gradient-to-r from-[#060b11] via-[#081d27] to-[#060b11] border-t border-slate-200/80 dark:border-white/10 py-4 sm:py-5 px-4 sm:px-8 md:px-12 mt-auto text-slate-400 shadow-sm">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-2.5 sm:gap-4 text-center sm:text-left">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-2 h-2 bg-teal-400 rounded-full shrink-0 shadow-[0_0_8px_#10b981]" />
              <p className="text-[10px] sm:text-xs font-condensed font-extrabold uppercase tracking-wider text-slate-200">
                Sistem Administrasi Desa Sampeldes
              </p>
            </div>
            <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">
              © 2026 Pemerintah Desa Sampeldes • Seluruh Hak Cipta Dilindungi
            </p>
          </div>
        </footer>
      </SidebarInset>
    </SidebarProvider>
  );
}
