'use client';

import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { ManajemenSidebar } from '@/components/layout/ManajemenSidebar';
import { BottomNav } from '@/components/layout/BottomNav';
import { Toaster } from '@/components/ui/toaster';
import { Button } from '@/components/ui/button';
import { Settings, Loader2, ArrowRightLeft } from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useFirebase, useFirestore } from '@/firebase';
import { doc, getDoc } from 'firebase/firestore';

function ManagementGuard({ children }: { children: React.ReactNode }) {
  const { auth, user, isUserLoading } = useFirebase();
  const db = useFirestore();
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    const activeUser = user || auth?.currentUser;

    if (isUserLoading && !activeUser) {
      const timer = setTimeout(() => {
        const currentUser = user || auth?.currentUser;
        if (!currentUser) {
          if (typeof window !== 'undefined') {
            localStorage.removeItem('isAdmin');
            localStorage.removeItem('adminEmail');
            localStorage.removeItem('lastWorkspace');
          }
          setAuthorized(false);
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
      setAuthorized(false);
      router.replace('/login');
      return;
    }

    const checkManagementAccess = async () => {
      const email = activeUser.email?.toLowerCase() || '';

      // 1. ISOLASI: Blokir akun Admin Absensi & Perangkat Absensi dari Manajemen Desa
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
                setAuthorized(false);
                router.replace('/absensi/dashboard');
                return;
              }
              if (
                pData.role === 'admin_absensi' ||
                pData.username === 'adminsampeldes' ||
                pData.username === 'admin'
              ) {
                setAuthorized(false);
                router.replace('/absensi-admin/dashboard');
                return;
              }
            }
          } catch (err) {
            console.error('Error verifying personel in management:', err);
          }
        }

        if (email.startsWith('adminsampeldes') || email.startsWith('admin@')) {
          setAuthorized(false);
          router.replace('/absensi-admin/dashboard');
          return;
        }

        setAuthorized(false);
        router.replace('/absensi/dashboard');
        return;
      }

      // 2. Hanya akun Admin Web / Manajemen Desa resmi yang boleh masuk
      const isOfficialStaff =
        email === 'sampeldes@gmail.id' ||
        email === 'desasampeldes@gmail.com' ||
        email === 'pemdessampeldes@gmail.com' ||
        email === 'pemdes.sampeldes@gmail.com' ||
        email === 'novantaraabk@gmail.com' ||
        (email.includes('sampeldes') && !email.endsWith('@sampeldes.id'));

      if (isOfficialStaff) {
        setAuthorized(true);
      } else {
        setAuthorized(false);
        router.replace('/login');
      }
    };

    checkManagementAccess();
  }, [user, auth, isUserLoading, router, db]);

  if (isUserLoading || !authorized) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-[#F8FAFC] dark:bg-[#060b11] neu-canvas font-sans">
        <div className="flex flex-col items-center p-8 rounded-2xl bg-white/90 dark:bg-[#081d27]/90 shadow-xl border border-slate-200/80 dark:border-white/10 backdrop-blur-md">
          <div className="h-12 w-12 rounded-2xl bg-slate-100 dark:bg-white/5 flex items-center justify-center mb-4 text-[#060b11]">
            <Loader2 className="h-6 w-6 animate-spin text-teal-600" />
          </div>
          <p className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-widest font-condensed">
            Memverifikasi Akses Manajemen Desa...
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

export default function ManajemenLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-[#F8FAFC] dark:bg-[#060b11] neu-canvas">
        <div className="flex flex-col items-center p-8 rounded-2xl bg-white/90 dark:bg-[#081d27]/90 shadow-xl border border-slate-200/80 dark:border-white/10">
          <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
        </div>
      </div>
    );
  }

  return (
    <ManagementGuard>
      <SidebarProvider>
        <div className="flex min-h-screen w-full overflow-hidden bg-[#F8FAFC] dark:bg-[#060b11] neu-canvas font-sans transition-colors duration-300">
          <ManajemenSidebar />
          <SidebarInset className="flex-1 flex flex-col min-w-0 bg-[#F8FAFC] dark:bg-[#060b11] neu-canvas transition-colors duration-300">
            {/* Header Mobile */}
            <header className="sticky top-0 z-40 flex h-14 shrink-0 items-center justify-between border-b border-white/10 bg-[#081d27] px-4 md:hidden text-white shadow-xs">
              <div className="flex items-center gap-2">
                <SidebarTrigger className="h-9 w-9 rounded-xl bg-teal-600 hover:bg-teal-500 text-white shadow-md active:scale-95 transition-all" />
                <span className="font-condensed font-extrabold text-sm text-white uppercase tracking-wider">Manajemen Desa</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Link href="/admin/surat">
                  <Button variant="outline" size="sm" className="h-8 px-2.5 text-[10px] font-condensed font-extrabold uppercase text-slate-300 bg-white/5 border-white/10 hover:bg-white/10 hover:text-white gap-1 rounded-full">
                    <ArrowRightLeft className="h-3.5 w-3.5 text-teal-400" />
                    <span className="hidden min-[380px]:inline">Web Admin</span>
                  </Button>
                </Link>
                <Button variant="ghost" size="icon" asChild className="rounded-full h-8 w-8 text-slate-400 hover:text-white hover:bg-white/10">
                  <Link href="/manajemen/settings">
                    <Settings className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </header>

            {/* Main Content Area */}
            <main className="flex-1 w-full max-w-screen-2xl mx-auto p-0 overflow-y-auto bg-[#F8FAFC] dark:bg-[#060b11] neu-canvas transition-colors duration-300">
              <div className="pb-24 md:pb-8">
                {children}
              </div>
            </main>
          </SidebarInset>
        </div>
        <BottomNav />
        <Toaster />
      </SidebarProvider>
    </ManagementGuard>
  );
}
