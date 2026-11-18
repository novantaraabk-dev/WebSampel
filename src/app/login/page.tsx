'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Logo } from '@/components/logo';
import { useToast } from '@/hooks/use-toast';
import {
  Loader2,
  Lock,
  Mail,
  ShieldCheck,
  Eye,
  EyeOff,
  ArrowLeft,
  Globe,
  Landmark,
  CheckCircle2,
  ArrowRight,
  LogOut,
  Building2,
  Sparkles,
  Clock,
  UserCheck,
  ShieldAlert,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth, useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc } from 'firebase/firestore';
import { cn, getPublicSiteUrl } from '@/lib/utils';

type WorkspaceType = 'website' | 'manajemen';

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const auth = useAuth();
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();

  const [publicWebUrl, setPublicWebUrl] = useState<string>(
    'https://' + (process.env.NEXT_PUBLIC_SITE_DOMAIN || 'sampeldes.gandrungmangu.id') + '/'
  );

  useEffect(() => {
    setPublicWebUrl(getPublicSiteUrl('/'));
  }, []);

  const [isLoading, setIsLoading] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [workspace, setWorkspace] = useState<WorkspaceType>('website');
  const [isAlreadyLoggedIn, setIsAlreadyLoggedIn] = useState(false);
  const [loggedInEmail, setLoggedInEmail] = useState('');
  const [isAbsensiModalOpen, setIsAbsensiModalOpen] = useState(false);
  const [isAdminAuthModalOpen, setIsAdminAuthModalOpen] = useState(false);

  const openAdminModal = (target: WorkspaceType) => {
    if (isAlreadyLoggedIn) {
      handleDirectNavigation(target);
    } else {
      setWorkspace(target);
      setIsAdminAuthModalOpen(true);
    }
  };

  // Periksa apakah admin sudah memiliki sesi aktif, jika ya otomatis masuk ke /admin atau /manajemen
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const adminStatus = localStorage.getItem('isAdmin') === 'true';
    const storedEmail = (localStorage.getItem('adminEmail') || '').toLowerCase();
    const activeEmail = (user?.email || auth?.currentUser?.email || storedEmail || '').toLowerCase();

    // ISOLASI: Hapus jika sesi sebelumnya adalah akun absensi (@sampeldes.id)
    if (
      activeEmail.endsWith('@sampeldes.id') ||
      activeEmail === 'adminsampeldes@sampeldes.id' ||
      activeEmail === 'admin@sampeldes.id'
    ) {
      localStorage.removeItem('isAdmin');
      localStorage.removeItem('adminEmail');
      localStorage.removeItem('lastWorkspace');
      setIsAlreadyLoggedIn(false);
      setIsRedirecting(false);
      setLoggedInEmail('');
      return;
    }

    const isOfficialAdmin =
      activeEmail === 'sampeldes@gmail.id' ||
      activeEmail === 'desasampeldes@gmail.com' ||
      activeEmail === 'pemdessampeldes@gmail.com' ||
      activeEmail === 'pemdes.sampeldes@gmail.com' ||
      activeEmail === 'novantaraabk@gmail.com' ||
      (activeEmail.includes('sampeldes') && !activeEmail.endsWith('@sampeldes.id'));

    if ((adminStatus && isOfficialAdmin) || (isOfficialAdmin && (user || auth?.currentUser))) {
      setIsAlreadyLoggedIn(true);
      setLoggedInEmail(activeEmail);
      setIsRedirecting(false);
      // PENTING: Jangan lakukan auto-redirect agar tampilan /login selalu tampil terlebih dahulu
    } else {
      setIsAlreadyLoggedIn(false);
      setIsRedirecting(false);
      setLoggedInEmail('');
    }
  }, [user, auth]);

  // Ambil Gambar Pendamping dari /admin/settings (villageProfile/default -> imageUrl)
  const profileRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, 'villageProfile', 'default');
  }, [firestore]);

  const { data: profileData } = useDoc<{ imageUrl?: string }>(profileRef);
  const accompanyingImageUrl =
    profileData?.imageUrl || 'https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=2000';

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();

    if (!cleanEmail || !cleanPassword) {
      toast({
        title: 'Input Belum Lengkap',
        description: 'Silakan masukkan email dan kata sandi yang terdaftar di autentifikator.',
        variant: 'destructive',
      });
      return;
    }

    // 0. ISOLASI AKSES: Cegah akun Admin Absensi & Perangkat Absensi login di Portal Admin Web / Manajemen
    if (
      cleanEmail === 'adminsampeldes' ||
      cleanEmail === 'adminsampeldes@sampeldes.id' ||
      cleanEmail === 'admin' ||
      cleanEmail === 'admin@sampeldes.id'
    ) {
      toast({
        title: 'Akses Ditolak di Portal Ini',
        description:
          'Akun Administrator Absensi berdiri sendiri khusus untuk presensi. Silakan gunakan Portal Admin Absensi (/absensi-admin/login).',
        variant: 'destructive',
      });
      return;
    }

    if (cleanEmail.endsWith('@sampeldes.id')) {
      toast({
        title: 'Akses Ditolak di Portal Ini',
        description:
          'Akun Perangkat Desa tidak memiliki izin ke Pengaturan Web dan Manajemen Desa. Silakan login melalui Portal Presensi Mandiri (/absensi/login).',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    try {
      if (!auth) {
        throw new Error('Layanan autentikasi Firebase belum siap. Silakan muat ulang halaman.');
      }

      const userCredential = await signInWithEmailAndPassword(auth, cleanEmail, cleanPassword);
      const authedEmail = userCredential.user.email?.toLowerCase() || '';

      if (
        authedEmail.endsWith('@sampeldes.id') ||
        authedEmail === 'adminsampeldes@sampeldes.id'
      ) {
        await auth.signOut();
        throw new Error(
          'Akun Presensi Desa / Admin Absensi tidak diperkenankan mengakses Pengaturan Web & Manajemen. Silakan login pada portal yang sesuai.'
        );
      }

      if (typeof window !== 'undefined') {
        localStorage.setItem('isAdmin', 'true');
        localStorage.setItem('adminEmail', authedEmail);
        localStorage.setItem('lastWorkspace', workspace);
      }

      setIsRedirecting(true);

      toast({
        title: 'Login Berhasil',
        description:
          workspace === 'website'
            ? 'Membuka Panel Pengaturan Website Desa...'
            : 'Membuka Sistem Manajemen Operasional Desa...',
      });

      const destination = workspace === 'website' ? '/admin/surat' : '/manajemen/dashboard';
      router.replace(destination);
    } catch (error: any) {
      console.error('Firebase Login Error:', error);

      let errorMessage = 'Email atau kata sandi salah. Silakan periksa akun di autentifikator.';

      if (
        error.code === 'auth/invalid-credential' ||
        error.code === 'auth/wrong-password' ||
        error.code === 'auth/user-not-found'
      ) {
        errorMessage = 'Email atau kata sandi tidak cocok dengan akun terdaftar di autentifikator.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Format email yang Anda masukkan tidak valid.';
      } else if (error.code === 'auth/user-disabled') {
        errorMessage = 'Akun ini telah dinonaktifkan di Firebase Console.';
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Terlalu banyak percobaan gagal. Akses diblokir sementara demi keamanan.';
      } else if (error.code === 'auth/network-request-failed') {
        errorMessage = 'Gagal terhubung ke server autentikasi. Periksa koneksi internet Anda.';
      } else if (error.message) {
        errorMessage = error.message;
      }

      toast({
        title: 'Akses Ditolak',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDirectNavigation = (target: WorkspaceType) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('lastWorkspace', target);
    }
    setIsRedirecting(true);
    const destination = target === 'website' ? '/admin/surat' : '/manajemen/dashboard';
    router.replace(destination);
  };

  const handleLogoutSession = async () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('isAdmin');
      localStorage.removeItem('adminEmail');
      localStorage.removeItem('lastWorkspace');
    }
    if (auth) {
      await auth.signOut();
    }
    setIsAlreadyLoggedIn(false);
    setIsRedirecting(false);
    setLoggedInEmail('');
    toast({
      title: 'Sesi Diakhiri',
      description: 'Anda telah keluar. Silakan masukkan akun untuk login kembali.',
    });
  };

  return (
    <div className="w-full min-h-screen lg:h-screen lg:grid lg:grid-cols-12 bg-[#F8FAFC] dark:bg-[#060b11] font-sans overflow-x-hidden relative">
      {/* Background Gambar & Ambient Glow Khusus Layar Mobile */}
      <div className="lg:hidden absolute inset-0 pointer-events-none overflow-hidden z-0">
        <Image
          src={accompanyingImageUrl}
          alt="Desa Sampeldes"
          fill
          priority
          sizes="100vw"
          className="object-cover object-center opacity-15 dark:opacity-10 filter blur-[4px] scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#F8FAFC]/94 via-[#F8FAFC]/85 to-[#F8FAFC] dark:from-[#060b11]/95 dark:via-[#060b11]/90 dark:to-[#060b11]" />
        {/* Soft Glowing Ambient Orbs */}
        <div className="absolute -top-16 -left-16 w-64 h-64 rounded-full bg-emerald-500/20 dark:bg-emerald-500/10 blur-3xl pointer-events-none" />
        <div className="absolute top-1/3 -right-20 w-72 h-72 rounded-full bg-teal-500/20 dark:bg-teal-500/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 left-1/4 w-64 h-64 rounded-full bg-emerald-600/15 dark:bg-emerald-600/10 blur-3xl pointer-events-none" />
      </div>

      {/* Kolom Kiri: Form Login & Pilihan Ruang Kerja */}
      <div className="relative z-10 lg:col-span-6 xl:col-span-6 flex flex-col justify-between p-4 sm:p-6 lg:p-6 xl:p-8 min-h-screen lg:min-h-0 lg:h-full lg:overflow-y-auto">
        {/* Topbar */}
        <div className="shrink-0 mb-3 sm:mb-4">
          <div className="flex items-center justify-between gap-2 px-3 py-2 sm:p-0 rounded-2xl bg-white/70 sm:bg-transparent dark:bg-white/5 sm:dark:bg-transparent backdrop-blur-md sm:backdrop-blur-none border border-white/60 sm:border-transparent dark:border-white/10 sm:dark:border-transparent shadow-xs sm:shadow-none">
            <Logo />
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              {/* Tombol Absensi di Topbar (Tampil di tablet/desktop saja agar header mobile bersih) */}
              <button
                type="button"
                onClick={() => setIsAbsensiModalOpen(true)}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] sm:text-[11px] font-sans font-bold uppercase tracking-wider text-teal-700 dark:text-teal-300 bg-teal-500/10 hover:bg-teal-500/20 border border-teal-500/20 transition-all cursor-pointer active:scale-95 shadow-xs"
              >
                <Clock className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-teal-600 dark:text-teal-400" />
                <span>Absensi</span>
              </button>
              <a
                href={publicWebUrl}
                className="neu-btn inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full text-[9.5px] sm:text-[11px] font-sans font-bold uppercase tracking-wider text-slate-700 hover:text-slate-900 transition-all cursor-pointer shrink-0"
              >
                <ArrowLeft className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                <span>Web Publik</span>
              </a>
            </div>
          </div>
        </div>

        {/* =========================================================================
            1. TAMPILAN DESKTOP & TABLET (hidden lg:block)
           ========================================================================= */}
        <div className="hidden lg:block mx-auto w-full max-w-[450px] my-auto py-2 sm:py-4">
          <div className="neu-card-elevated rounded-[28px] sm:rounded-[36px] p-5 sm:p-7 xl:p-8">
            {/* Header Form */}
            <div className="mb-4 space-y-1">
              <span className="neu-pill px-3 py-0.5 rounded-full text-[9px] sm:text-[9.5px] font-sans font-bold uppercase tracking-widest text-emerald-800 inline-block">
                Autentikasi Aparatur Desa
              </span>
              <h1 className="text-xl sm:text-2xl font-display font-light uppercase tracking-tight text-slate-900 leading-tight">
                Portal Masuk Admin
              </h1>
              <p className="text-[11px] sm:text-xs text-slate-600 font-sans font-normal leading-relaxed">
                Pilih ruang kerja yang ingin Anda kelola setelah masuk.
              </p>
            </div>

            {/* Jika sesi login sudah aktif atau sedang mengarahkan */}
            {isAlreadyLoggedIn ? (
              <div className="space-y-4 animate-in fade-in duration-300">
                <div className="neu-inset p-3.5 rounded-2xl flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="neu-convex h-9 w-9 rounded-xl text-emerald-800 flex items-center justify-center font-bold text-xs uppercase shadow-xs">
                      {isRedirecting ? (
                        <Loader2 className="h-4 w-4 animate-spin text-teal-600" />
                      ) : (
                        <UserCheck className="h-4 w-4 text-emerald-600" />
                      )}
                    </div>
                    <div>
                      <p className="text-xs font-sans font-bold text-slate-900 truncate max-w-[180px]">
                        {loggedInEmail || 'Administrator Aktif'}
                      </p>
                      <p className="text-[10px] text-emerald-700 font-sans font-medium">
                        {isRedirecting ? 'Membuka ruang kerja...' : 'Sesi login aktif terdeteksi'}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleLogoutSession}
                    className="neu-btn h-8 px-2.5 text-[11px] text-red-600 hover:text-red-700 rounded-xl gap-1 cursor-pointer"
                  >
                    <LogOut className="h-3 w-3" />
                    Keluar
                  </Button>
                </div>

                <div className="space-y-2">
                  <Label className="text-[10.5px] font-sans font-bold uppercase tracking-wider text-slate-600">
                    PILIH RUANG KERJA TUJUAN:
                  </Label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      disabled={isRedirecting}
                      onClick={() => handleDirectNavigation('website')}
                      className="neu-convex text-left p-3.5 rounded-2xl hover:-translate-y-0.5 transition-all group flex flex-col justify-between h-32 cursor-pointer disabled:opacity-60"
                    >
                      <div className="flex items-center justify-between w-full">
                        <div className="neu-pill h-8 w-8 rounded-xl text-slate-900 flex items-center justify-center shadow-xs">
                          <Globe className="h-4 w-4 text-emerald-700" />
                        </div>
                        <ArrowRight className="h-3.5 w-3.5 text-slate-400 group-hover:text-emerald-700 group-hover:translate-x-0.5 transition-all" />
                      </div>
                      <div>
                        <h3 className="font-sans font-extrabold text-xs sm:text-[13px] text-slate-900 uppercase tracking-tight">
                          Pengaturan Web
                        </h3>
                        <p className="text-[9.5px] text-slate-600 font-sans leading-tight mt-0.5">
                          CMS Berita, Surat &amp; Profil
                        </p>
                      </div>
                    </button>

                    <button
                      type="button"
                      disabled={isRedirecting}
                      onClick={() => handleDirectNavigation('manajemen')}
                      className="neu-convex text-left p-3.5 rounded-2xl hover:-translate-y-0.5 transition-all group flex flex-col justify-between h-32 cursor-pointer disabled:opacity-60"
                    >
                      <div className="flex items-center justify-between w-full">
                        <div className="neu-pill h-8 w-8 rounded-xl text-emerald-800 flex items-center justify-center shadow-xs">
                          <Landmark className="h-4 w-4 text-emerald-700" />
                        </div>
                        <ArrowRight className="h-3.5 w-3.5 text-slate-400 group-hover:text-emerald-700 group-hover:translate-x-0.5 transition-all" />
                      </div>
                      <div>
                        <h3 className="font-sans font-extrabold text-xs sm:text-[13px] text-slate-900 uppercase tracking-tight">
                          Manajemen Desa
                        </h3>
                        <p className="text-[9.5px] text-slate-600 font-sans leading-tight mt-0.5">
                          Agenda, SPPD, Notulen AI &amp; Arsip
                        </p>
                      </div>
                    </button>
                  </div>
                </div>

                <div className="pt-2 text-center">
                  <button
                    type="button"
                    onClick={() => {
                      setIsAlreadyLoggedIn(false);
                    }}
                    className="text-[11px] font-sans font-bold text-slate-500 hover:text-emerald-700 underline decoration-slate-300 transition-colors cursor-pointer"
                  >
                    Gunakan Akun Lain / Buka Form Login
                  </button>
                </div>
              </div>
            ) : (
              /* Form Login dengan Akun Autentifikator */
              <form onSubmit={handleEmailLogin} className="space-y-3.5">
                {/* Pilihan Ruang Kerja Terpadu */}
                <div className="space-y-1">
                  <Label className="text-[10px] sm:text-[10.5px] font-sans font-bold uppercase tracking-wider text-slate-700 flex items-center justify-between">
                    <span>PILIH RUANG KERJA :</span>
                    <span className="neu-pill px-2 py-0.5 rounded-full text-[9px] text-emerald-800 font-bold uppercase">
                      {workspace === 'website' ? 'Pengaturan Website' : 'Sistem Manajemen'}
                    </span>
                  </Label>
                  <div className="grid grid-cols-2 gap-2.5 pt-1">
                    {/* Kartu 1: Pengaturan Website */}
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={() => setWorkspace('website')}
                      onKeyDown={(e) => e.key === 'Enter' && setWorkspace('website')}
                      className={cn(
                        'cursor-pointer relative p-3 rounded-2xl transition-all flex flex-col justify-between text-left select-none',
                        workspace === 'website'
                          ? 'neu-convex border-2 border-emerald-600/40 shadow-sm'
                          : 'neu-inset opacity-85 hover:opacity-100'
                      )}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <div
                          className={cn(
                            'h-7 w-7 rounded-lg flex items-center justify-center',
                            workspace === 'website'
                              ? 'neu-pill text-emerald-800 font-bold'
                              : 'text-slate-500'
                          )}
                        >
                          <Globe className="h-3.5 w-3.5" />
                        </div>
                        {workspace === 'website' && (
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 fill-emerald-600/20" />
                        )}
                      </div>
                      <div>
                        <span className="text-[11px] sm:text-xs font-sans font-extrabold uppercase tracking-tight block text-slate-900">
                          Pengaturan Web
                        </span>
                        <span className="text-[8.5px] sm:text-[9px] text-slate-500 font-sans block leading-tight mt-0.5">
                          CMS &amp; Web Publik
                        </span>
                      </div>
                    </div>

                    {/* Kartu 2: Manajemen Desa */}
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={() => setWorkspace('manajemen')}
                      onKeyDown={(e) => e.key === 'Enter' && setWorkspace('manajemen')}
                      className={cn(
                        'cursor-pointer relative p-3 rounded-2xl transition-all flex flex-col justify-between text-left select-none',
                        workspace === 'manajemen'
                          ? 'neu-convex border-2 border-emerald-600/40 shadow-sm'
                          : 'neu-inset opacity-85 hover:opacity-100'
                      )}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <div
                          className={cn(
                            'h-7 w-7 rounded-lg flex items-center justify-center',
                            workspace === 'manajemen'
                              ? 'neu-pill text-emerald-800 font-bold'
                              : 'text-slate-500'
                          )}
                        >
                          <Landmark className="h-3.5 w-3.5" />
                        </div>
                        {workspace === 'manajemen' && (
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 fill-emerald-600/20" />
                        )}
                      </div>
                      <div>
                        <span className="text-[11px] sm:text-xs font-sans font-extrabold uppercase tracking-tight block text-slate-900">
                          Manajemen Desa
                        </span>
                        <span className="text-[8.5px] sm:text-[9px] text-slate-500 font-sans block leading-tight mt-0.5">
                          Operasional &amp; SPPD
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Input Email Autentifikator */}
                <div className="space-y-1 pt-1">
                  <Label
                    htmlFor="email"
                    className="font-sans font-bold text-[10.5px] sm:text-[11px] uppercase tracking-wider text-slate-700 flex items-center gap-1.5"
                  >
                    <Mail className="h-3.5 w-3.5 text-emerald-700" />
                    Email Akun Autentifikator
                  </Label>
                  <div className="neu-inset rounded-2xl p-1">
                    <Input
                      id="email"
                      type="email"
                      placeholder="Masukkan email terdaftar..."
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      disabled={isLoading}
                      autoComplete="email"
                      className="h-10 border-0 bg-transparent focus-visible:ring-0 shadow-none font-medium text-xs sm:text-sm text-slate-900 placeholder:text-slate-400"
                    />
                  </div>
                </div>

                {/* Input Kata Sandi */}
                <div className="space-y-1">
                  <Label
                    htmlFor="password"
                    className="font-sans font-bold text-[10.5px] sm:text-[11px] uppercase tracking-wider text-slate-700 flex items-center gap-1.5"
                  >
                    <Lock className="h-3.5 w-3.5 text-emerald-700" />
                    Kata Sandi
                  </Label>
                  <div className="neu-inset rounded-2xl p-1 relative flex items-center">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Masukkan kata sandi..."
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={isLoading}
                      autoComplete="current-password"
                      className="h-10 pr-10 border-0 bg-transparent focus-visible:ring-0 shadow-none font-medium text-xs sm:text-sm text-slate-900 placeholder:text-slate-400"
                    />
                    <button
                      type="button"
                      tabIndex={-1}
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                      className="absolute right-3 h-8 w-8 flex items-center justify-center text-slate-400 hover:text-slate-700 focus:outline-none transition-colors cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {/* Tombol Submit Neumorphic Primary Dark */}
                <Button
                  type="submit"
                  className="neu-btn-dark w-full h-11 sm:h-12 rounded-2xl font-sans font-bold text-white uppercase tracking-wider text-xs sm:text-[12.5px] transition-all mt-3 cursor-pointer"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin text-emerald-400" />
                      Memverifikasi...
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5">
                      <ShieldCheck className="h-4 w-4 text-emerald-400" />
                      Masuk ke {workspace === 'website' ? 'Pengaturan Website' : 'Manajemen Desa'}
                    </span>
                  )}
                </Button>
              </form>
            )}

            {/* SEKSI PORTAL ABSENSI DENGAN TOMBOL ABSENSI KARYAWAN & ADMIN ABSENSI */}
            <div className="mt-4 pt-3.5 border-t border-stone-300/60 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Clock className="h-3 w-3 text-emerald-700" />
                  <span className="text-[10px] sm:text-[10.5px] font-sans font-bold uppercase tracking-wider text-slate-800">
                    Portal Absensi Aparatur
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAbsensiModalOpen(true)}
                  className="text-[9.5px] sm:text-[10px] text-emerald-700 hover:text-emerald-900 font-sans font-bold uppercase hover:underline cursor-pointer"
                >
                  Lihat Detail &rarr;
                </button>
              </div>

              {/* DUA TOMBOL NEUMORPHIC: Absensi Karyawan & Admin Absensi */}
              <div className="grid grid-cols-2 gap-2.5">
                {/* Tombol 1: Absensi Karyawan */}
                <Link
                  href="/absensi/login"
                  className="neu-convex group relative p-3 rounded-2xl hover:-translate-y-0.5 transition-all flex flex-col justify-between text-left"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="h-7 w-7 rounded-xl bg-emerald-700 text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
                      <UserCheck className="h-3.5 w-3.5" />
                    </div>
                    <ArrowRight className="h-3 w-3 text-emerald-700 group-hover:translate-x-0.5 transition-all" />
                  </div>
                  <div>
                    <span className="text-[11px] sm:text-xs font-sans font-bold uppercase tracking-tight block text-slate-900 group-hover:text-emerald-900">
                      Absensi Karyawan
                    </span>
                    <span className="text-[8.5px] sm:text-[9px] text-slate-500 font-sans block leading-tight mt-0.5">
                      Presensi GPS &amp; Selfie
                    </span>
                  </div>
                </Link>

                {/* Tombol 2: Admin Absensi */}
                <Link
                  href="/absensi-admin/login"
                  className="neu-convex group relative p-3 rounded-2xl hover:-translate-y-0.5 transition-all flex flex-col justify-between text-left"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="h-7 w-7 rounded-xl bg-slate-800 text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
                      <ShieldAlert className="h-3.5 w-3.5 text-amber-400" />
                    </div>
                    <ArrowRight className="h-3 w-3 text-slate-700 group-hover:translate-x-0.5 transition-all" />
                  </div>
                  <div>
                    <span className="text-[11px] sm:text-xs font-sans font-bold uppercase tracking-tight block text-slate-900">
                      Admin Absensi
                    </span>
                    <span className="text-[8.5px] sm:text-[9px] text-slate-500 font-sans block leading-tight mt-0.5">
                      Monitoring &amp; Rekap
                    </span>
                  </div>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* =========================================================================
            2. TAMPILAN KHUSUS MOBILE (block lg:hidden)
            - Background ambient visual halus
            - Kartu Hero Absensi Karyawan yang elegan & nyaman
            - Tiga tombol ringkas pas satu baris di bawah
           ========================================================================= */}
        <div className="block lg:hidden mx-auto w-full max-w-[430px] my-auto py-2 relative z-10">
          <div className="space-y-3.5">
            {/* Header Mobile Ringkas */}
            <div className="text-center space-y-1">
              <span className="neu-pill px-3 py-0.5 rounded-full text-[9px] font-sans font-extrabold uppercase tracking-widest text-emerald-800 dark:text-emerald-300 inline-block bg-white/70 dark:bg-white/5 backdrop-blur-md border border-emerald-500/20">
                Portal Aparatur Desa
              </span>
              <h1 className="text-xl sm:text-2xl font-display font-light uppercase tracking-tight text-slate-900 dark:text-white leading-tight">
                Presensi &amp; Administrasi
              </h1>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-sans">
                Pemerintah Desa Sampeldes • Kec. Gandrungmangu
              </p>
            </div>

            {/* Sesi Admin Terdeteksi di Mobile (jika aktif) */}
            {isAlreadyLoggedIn && (
              <div className="neu-inset p-3 rounded-2xl flex items-center justify-between animate-in fade-in text-left bg-white/70 dark:bg-[#0c1822]/70 backdrop-blur-md border border-emerald-500/20 shadow-xs">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="neu-convex h-8 w-8 rounded-xl text-emerald-800 flex items-center justify-center font-bold text-xs uppercase shadow-xs shrink-0 bg-emerald-50">
                    <UserCheck className="h-4 w-4 text-emerald-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-sans font-bold text-slate-900 dark:text-white truncate max-w-[170px]">
                      {loggedInEmail || 'Admin Aktif'}
                    </p>
                    <p className="text-[9.5px] text-emerald-700 dark:text-emerald-400 font-sans font-medium">
                      Sesi Admin Terdeteksi
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLogoutSession}
                  className="neu-btn h-7 px-2.5 text-[10px] text-red-600 hover:text-red-700 rounded-xl gap-1 cursor-pointer shrink-0"
                >
                  <LogOut className="h-3 w-3" />
                  Keluar
                </Button>
              </div>
            )}

            {/* TOMBOL UTAMA BESAR DI CENTER: ABSENSI KARYAWAN */}
            <div className="neu-card-elevated rounded-[30px] p-6 sm:p-7 text-center border-2 border-emerald-600/35 bg-gradient-to-b from-white/95 via-emerald-50/40 to-teal-50/30 dark:from-[#0c1822]/95 dark:via-[#0c1822]/80 dark:to-[#08131c]/90 shadow-xl backdrop-blur-xl relative overflow-hidden group">
              {/* Radial Ambient Glow di dalam kartu */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-20 bg-emerald-500/15 rounded-full blur-2xl pointer-events-none" />

              <div className="relative z-10 flex flex-col items-center">
                {/* Emblem Ikon Besar */}
                <div className="relative mb-3.5">
                  <div className="h-20 w-20 rounded-3xl bg-gradient-to-tr from-emerald-700 via-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-lg shadow-emerald-700/25 group-hover:scale-105 transition-all duration-300">
                    <UserCheck className="h-10 w-10 text-white drop-shadow-sm" />
                  </div>
                  <span className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-emerald-500 border-2 border-white dark:border-[#0c1822] flex items-center justify-center text-xs text-white font-bold shadow-md">
                    ✓
                  </span>
                </div>

                <span className="neu-pill text-[9.5px] font-sans font-extrabold px-3 py-1 rounded-full text-emerald-800 dark:text-emerald-300 uppercase tracking-widest mb-2 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-500/25">
                  Presensi Harian Aparatur
                </span>

                <h2 className="text-2xl font-sans font-extrabold uppercase tracking-tight text-slate-900 dark:text-white group-hover:text-emerald-800 dark:group-hover:text-emerald-400 transition-colors">
                  Absensi Karyawan
                </h2>
                <p className="text-xs text-slate-600 dark:text-slate-300 font-sans mt-1 max-w-[280px] leading-relaxed">
                  Presensi Masuk &amp; Pulang Mandiri dengan Verifikasi Titik GPS Radius &amp; Foto Kamera
                </p>

                {/* Tombol Call-to-Action Besar */}
                <Link
                  href="/absensi/login"
                  className="mt-5 w-full h-12 rounded-2xl bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-700 hover:from-emerald-900 hover:to-teal-800 active:scale-[0.98] text-white font-sans font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/20 transition-all cursor-pointer"
                >
                  <span>Buka Presensi Mandiri</span>
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>

            {/* SEPARATOR PEMBATAS */}
            <div className="relative py-0.5">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-300/60 dark:border-white/10" />
              </div>
              <div className="relative flex justify-center text-[9px] uppercase">
                <span className="bg-[#EEF2F6] dark:bg-[#0c1822] px-3 py-0.5 rounded-full text-slate-500 dark:text-slate-400 font-sans font-bold tracking-wider border border-slate-200/60 dark:border-white/10 shadow-2xs">
                  Akses Administrator &amp; Kelola Desa
                </span>
              </div>
            </div>

            {/* TIGA TOMBOL KECIL-KECIL SATU BARIS DI BAWAH (PAS TANPA TERPOTONG) */}
            <div className="grid grid-cols-3 gap-2">
              {/* 1. Admin Web */}
              <button
                type="button"
                onClick={() => openAdminModal('website')}
                className="neu-convex p-2.5 rounded-2xl hover:-translate-y-0.5 active:scale-95 transition-all flex flex-col items-center justify-center text-center group cursor-pointer bg-white/80 dark:bg-[#0c1822]/80 backdrop-blur-md border border-white/80 dark:border-white/10 shadow-xs"
              >
                <div className="h-8 w-8 rounded-xl bg-teal-500/15 text-teal-800 dark:text-teal-300 flex items-center justify-center mb-1 group-hover:scale-105 transition-transform">
                  <Globe className="h-4 w-4 text-teal-700 dark:text-teal-400" />
                </div>
                <span className="text-[10.5px] font-sans font-extrabold uppercase tracking-tight text-slate-900 dark:text-white truncate w-full">
                  Admin Web
                </span>
                <span className="text-[8px] text-slate-500 dark:text-slate-400 font-sans leading-tight mt-0.5 truncate w-full">
                  CMS Berita
                </span>
              </button>

              {/* 2. Manajemen Desa */}
              <button
                type="button"
                onClick={() => openAdminModal('manajemen')}
                className="neu-convex p-2.5 rounded-2xl hover:-translate-y-0.5 active:scale-95 transition-all flex flex-col items-center justify-center text-center group cursor-pointer bg-white/80 dark:bg-[#0c1822]/80 backdrop-blur-md border border-white/80 dark:border-white/10 shadow-xs"
              >
                <div className="h-8 w-8 rounded-xl bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 flex items-center justify-center mb-1 group-hover:scale-105 transition-transform">
                  <Landmark className="h-4 w-4 text-emerald-700 dark:text-emerald-400" />
                </div>
                <span className="text-[10.5px] font-sans font-extrabold uppercase tracking-tight text-slate-900 dark:text-white truncate w-full">
                  Manajemen
                </span>
                <span className="text-[8px] text-slate-500 dark:text-slate-400 font-sans leading-tight mt-0.5 truncate w-full">
                  Operasional
                </span>
              </button>

              {/* 3. Admin Absensi */}
              <Link
                href="/absensi-admin/login"
                className="neu-convex p-2.5 rounded-2xl hover:-translate-y-0.5 active:scale-95 transition-all flex flex-col items-center justify-center text-center group cursor-pointer bg-white/80 dark:bg-[#0c1822]/80 backdrop-blur-md border border-white/80 dark:border-white/10 shadow-xs"
              >
                <div className="h-8 w-8 rounded-xl bg-slate-800 text-white flex items-center justify-center mb-1 group-hover:scale-105 transition-transform">
                  <ShieldAlert className="h-4 w-4 text-amber-400" />
                </div>
                <span className="text-[10.5px] font-sans font-extrabold uppercase tracking-tight text-slate-900 dark:text-white truncate w-full">
                  Admin Absen
                </span>
                <span className="text-[8px] text-slate-500 dark:text-slate-400 font-sans leading-tight mt-0.5 truncate w-full">
                  Monitoring
                </span>
              </Link>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center pt-2 shrink-0">
          <p className="text-[9.5px] sm:text-[10px] font-sans font-semibold uppercase tracking-widest text-slate-500">
            Pemerintah Desa Sampeldes • Terintegrasi Cloud &amp; Google Drive
          </p>
        </div>
      </div>

      {/* DIALOG POPUP: PORTAL ABSENSI APARATUR (PILIHAN KARYAWAN & ADMIN) */}
      <Dialog open={isAbsensiModalOpen} onOpenChange={setIsAbsensiModalOpen}>
        <DialogContent className="max-w-md p-6 rounded-2xl bg-white dark:bg-[#081d27] border border-slate-200/80 dark:border-white/10 shadow-2xl">
          <DialogHeader className="space-y-1.5 pb-2">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[9px] font-sans font-bold uppercase tracking-widest text-teal-800 dark:text-teal-200 bg-teal-500/15 border border-teal-500/30">
                Layanan Presensi Desa
              </span>
            </div>
            <DialogTitle className="text-xl sm:text-2xl font-display font-light uppercase tracking-tight text-slate-900 dark:text-white">
              Pilih Portal Absensi
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-600 dark:text-slate-400 font-sans">
              Silakan pilih portal absensi aparatur desa sesuai hak akses dan kebutuhan Anda:
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 pt-2">
            {/* Pilihan 1: Absensi Karyawan */}
            <Link
              href="/absensi/login"
              onClick={() => setIsAbsensiModalOpen(false)}
              className="neu-convex flex items-start gap-3.5 p-4 rounded-2xl hover:-translate-y-0.5 transition-all group cursor-pointer"
            >
              <div className="h-11 w-11 rounded-xl bg-emerald-700 text-white flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform">
                <UserCheck className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="font-sans font-bold text-sm text-slate-900 uppercase tracking-tight">
                    Absensi Karyawan
                  </h4>
                  <span className="neu-pill text-[9px] font-sans font-bold px-2 py-0.5 rounded-full text-emerald-800 uppercase">
                    Mandiri GPS
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 font-sans leading-relaxed mt-1">
                  Masuk untuk absensi harian perangkat/staf desa menggunakan verifikasi titik radius GPS dan foto kamera secara mandiri.
                </p>
                <div className="mt-2 flex items-center gap-1 text-[11px] font-sans font-bold text-emerald-800 group-hover:translate-x-0.5 transition-transform">
                  <span>Buka Absensi Karyawan</span>
                  <ArrowRight className="h-3 w-3" />
                </div>
              </div>
            </Link>

            {/* Pilihan 2: Admin Absensi */}
            <Link
              href="/absensi-admin/login"
              onClick={() => setIsAbsensiModalOpen(false)}
              className="neu-convex flex items-start gap-3.5 p-4 rounded-2xl hover:-translate-y-0.5 transition-all group cursor-pointer"
            >
              <div className="h-11 w-11 rounded-xl bg-slate-800 text-white flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform">
                <ShieldAlert className="h-5 w-5 text-amber-400" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="font-sans font-bold text-sm text-slate-900 uppercase tracking-tight">
                    Admin Absensi
                  </h4>
                  <span className="neu-pill text-[9px] font-sans font-bold px-2 py-0.5 rounded-full text-slate-700 uppercase">
                    Monitoring
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 font-sans leading-relaxed mt-1">
                  Dashboard monitoring kehadiran harian, input izin/sakit/dinas luar manual, verifikasi status, dan rekap laporan PDF bulanan.
                </p>
                <div className="mt-2 flex items-center gap-1 text-[11px] font-sans font-bold text-slate-800 group-hover:translate-x-0.5 transition-transform">
                  <span>Buka Admin Absensi</span>
                  <ArrowRight className="h-3 w-3" />
                </div>
              </div>
            </Link>
          </div>
        </DialogContent>
      </Dialog>

      {/* DIALOG POPUP: LOGIN ADMIN KHUSUS MOBILE */}
      <Dialog open={isAdminAuthModalOpen} onOpenChange={setIsAdminAuthModalOpen}>
        <DialogContent className="max-w-[420px] p-5 sm:p-6 rounded-[28px] bg-white dark:bg-[#081d27] border border-slate-200/80 dark:border-white/10 shadow-2xl">
          <DialogHeader className="space-y-1 pb-1 text-left">
            <div className="flex items-center gap-2">
              <span className="neu-pill px-2.5 py-0.5 rounded-full text-[9px] font-sans font-bold uppercase tracking-widest text-emerald-800">
                Autentikasi Administrator
              </span>
            </div>
            <DialogTitle className="text-xl font-display font-light uppercase tracking-tight text-slate-900 dark:text-white">
              Masuk Admin Desa
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-600 dark:text-slate-400 font-sans">
              Pilih ruang kerja dan masukkan email serta kata sandi akun resmi desa.
            </DialogDescription>
          </DialogHeader>

          {/* Sesi aktif terdeteksi atau Form Email Password */}
          {isAlreadyLoggedIn ? (
            <div className="space-y-3 pt-2">
              <div className="neu-inset p-3.5 rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="neu-convex h-9 w-9 rounded-xl text-emerald-800 flex items-center justify-center font-bold text-xs uppercase shadow-xs">
                    {isRedirecting ? (
                      <Loader2 className="h-4 w-4 animate-spin text-teal-600" />
                    ) : (
                      <UserCheck className="h-4 w-4 text-emerald-600" />
                    )}
                  </div>
                  <div>
                    <p className="text-xs font-sans font-bold text-slate-900 truncate max-w-[170px]">
                      {loggedInEmail || 'Administrator'}
                    </p>
                    <p className="text-[10px] text-emerald-700 font-sans font-medium">
                      Sesi aktif terdeteksi
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLogoutSession}
                  className="neu-btn h-8 px-2.5 text-[11px] text-red-600 hover:text-red-700 rounded-xl gap-1 cursor-pointer"
                >
                  <LogOut className="h-3 w-3" />
                  Keluar
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <Button
                  type="button"
                  onClick={() => {
                    setIsAdminAuthModalOpen(false);
                    handleDirectNavigation('website');
                  }}
                  className="neu-btn-dark h-11 rounded-xl text-xs font-bold text-white uppercase cursor-pointer"
                >
                  Pengaturan Web
                </Button>
                <Button
                  type="button"
                  onClick={() => {
                    setIsAdminAuthModalOpen(false);
                    handleDirectNavigation('manajemen');
                  }}
                  className="neu-btn-dark h-11 rounded-xl text-xs font-bold text-white uppercase cursor-pointer"
                >
                  Manajemen Desa
                </Button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleEmailLogin} className="space-y-3 pt-2 text-left">
              {/* Tab Switcher Ruang Kerja */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setWorkspace('website')}
                  className={cn(
                    'p-2.5 rounded-xl text-left transition-all flex items-center gap-2 cursor-pointer',
                    workspace === 'website'
                      ? 'neu-convex border-2 border-emerald-600/40 text-emerald-900 font-bold'
                      : 'neu-inset opacity-75 text-slate-600'
                  )}
                >
                  <Globe className="h-4 w-4 text-teal-700 shrink-0" />
                  <div className="min-w-0">
                    <span className="text-[11px] font-sans font-bold uppercase block truncate">Web CMS</span>
                    <span className="text-[8px] text-slate-500 block truncate">Pengaturan Website</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setWorkspace('manajemen')}
                  className={cn(
                    'p-2.5 rounded-xl text-left transition-all flex items-center gap-2 cursor-pointer',
                    workspace === 'manajemen'
                      ? 'neu-convex border-2 border-emerald-600/40 text-emerald-900 font-bold'
                      : 'neu-inset opacity-75 text-slate-600'
                  )}
                >
                  <Landmark className="h-4 w-4 text-emerald-700 shrink-0" />
                  <div className="min-w-0">
                    <span className="text-[11px] font-sans font-bold uppercase block truncate">Manajemen</span>
                    <span className="text-[8px] text-slate-500 block truncate">Operasional &amp; SPPD</span>
                  </div>
                </button>
              </div>

              {/* Email */}
              <div className="space-y-1">
                <Label htmlFor="mobile-email" className="font-sans font-bold text-[10.5px] uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5 text-emerald-700" />
                  Email Akun Admin
                </Label>
                <div className="neu-inset rounded-2xl p-1">
                  <Input
                    id="mobile-email"
                    type="email"
                    placeholder="Masukkan email terdaftar..."
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={isLoading}
                    autoComplete="email"
                    className="h-10 border-0 bg-transparent focus-visible:ring-0 shadow-none font-medium text-xs sm:text-sm text-slate-900 placeholder:text-slate-400"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1">
                <Label htmlFor="mobile-password" className="font-sans font-bold text-[10.5px] uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <Lock className="h-3.5 w-3.5 text-emerald-700" />
                  Kata Sandi
                </Label>
                <div className="neu-inset rounded-2xl p-1 relative flex items-center">
                  <Input
                    id="mobile-password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Masukkan kata sandi..."
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading}
                    autoComplete="current-password"
                    className="h-10 pr-10 border-0 bg-transparent focus-visible:ring-0 shadow-none font-medium text-xs sm:text-sm text-slate-900 placeholder:text-slate-400"
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                    className="absolute right-3 h-8 w-8 flex items-center justify-center text-slate-400 hover:text-slate-700 focus:outline-none transition-colors cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Submit */}
              <Button
                type="submit"
                className="neu-btn-dark w-full h-11 rounded-2xl font-sans font-bold text-white uppercase tracking-wider text-xs transition-all mt-2 cursor-pointer"
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin text-emerald-400" />
                    Memverifikasi...
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5">
                    <ShieldCheck className="h-4 w-4 text-emerald-400" />
                    Masuk ke {workspace === 'website' ? 'Pengaturan Website' : 'Manajemen Desa'}
                  </span>
                )}
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Kolom Kanan: Visual Hero / Showcase */}
      <div className="hidden lg:block lg:col-span-6 xl:col-span-6 relative bg-[#070b10] overflow-hidden">
        <Image
          src={accompanyingImageUrl}
          alt="Desa Sampeldes"
          fill
          priority
          sizes="(min-width: 1024px) 50vw, 100vw"
          className="object-cover object-center opacity-40 brightness-[0.7]"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#070b10] via-[#070b10]/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#070b10] via-transparent to-black/40" />

        <div className="absolute bottom-12 left-10 right-10 text-white space-y-4 max-w-lg">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-[10px] font-condensed font-bold uppercase tracking-widest text-teal-400">
            <Sparkles className="h-3 w-3 text-teal-400" />
            Portal Terpadu Pengaturan &amp; Manajemen Desa
          </div>
          <h2 className="text-3xl sm:text-4xl font-condensed font-bold uppercase tracking-tight leading-tight text-white">
            Satu Pintu Akses, Seluruh Layanan Desa Terpadu.
          </h2>
          <p className="text-xs sm:text-sm text-white/75 font-normal leading-relaxed">
            Kelola konten website publik secara mandiri atau jalankan manajemen administrasi, arsip Drive, notulensi AI, SPPD, dan presensi GPS aparatur desa dalam satu platform harmonis.
          </p>
          <div className="pt-2 flex items-center gap-3 text-[10px] font-condensed font-bold uppercase tracking-widest text-white/60">
            <span>Website CMS</span>
            <span>•</span>
            <span>Manajemen Operasional</span>
            <span>•</span>
            <span>Absensi GPS</span>
          </div>
        </div>
      </div>
    </div>
  );
}