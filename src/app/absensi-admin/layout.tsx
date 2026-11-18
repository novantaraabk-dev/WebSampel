"use client"

import { ReactNode, useState, useEffect, useCallback } from "react"
import { usePathname, useRouter } from "next/navigation"
import { useUser, useAuth, useFirestore, useMemoFirebase, useDoc } from "@/firebase"
import { doc } from "firebase/firestore"
import { signOut } from "firebase/auth"
import {
  ShieldCheck,
  MonitorPlay,
  UserPlus,
  Settings,
  LogOut,
  LayoutDashboard,
  Loader2,
  Printer,
  ArrowRightLeft,
  Globe,
  Menu,
  X,
  UserCheck
} from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
  useSidebar
} from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { CurvedSidebarItem } from "@/components/layout/CurvedSidebarItem"
import { Toaster } from "@/components/ui/toaster"
import { NightModeSwitch } from "@/components/ui/NightModeSwitch"

const absensiAdminNavItems = [
  {
    href: "/absensi-admin/dashboard",
    label: "Monitoring",
    icon: MonitorPlay,
    activeColor: "bg-[#0284c7]",
    activeTextColor: "text-sky-900",
  },
  {
    href: "/absensi-admin/input",
    label: "Input Absensi",
    icon: UserPlus,
    activeColor: "bg-[#f59e0b]",
    activeTextColor: "text-amber-900",
  },
  {
    href: "/absensi-admin/report",
    label: "Cetak Dokumen",
    icon: Printer,
    activeColor: "bg-[#6366f1]",
    activeTextColor: "text-indigo-900",
  },
  {
    href: "/absensi-admin/settings",
    label: "Pengaturan",
    icon: Settings,
    activeColor: "bg-[#475569]",
    activeTextColor: "text-slate-900",
  },
]

function AbsensiAdminSidebarInner({
  handleLogout,
  profile,
  userEmail,
}: {
  handleLogout: () => void
  profile: any
  userEmail?: string | null
}) {
  const pathname = usePathname()
  const { isMobile, setOpenMobile, state, toggleSidebar } = useSidebar()
  const isCollapsed = state === "collapsed"

  const handleNavClick = () => {
    if (isMobile) {
      setOpenMobile(false)
    }
  }

  return (
    <Sidebar
      collapsible="icon"
      className="border-r-0 bg-[#0e1620] text-white shadow-none overflow-visible font-sans z-30"
    >
      <SidebarHeader className="p-3.5 border-b border-white/10 bg-[#0e1620] text-white">
        {!isCollapsed ? (
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 shrink-0 shadow-xs">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div className="flex flex-col overflow-hidden">
                  <span className="font-condensed font-extrabold text-sm leading-tight tracking-tight text-white uppercase">
                    Admin Absensi
                  </span>
                  <span className="text-[9px] text-slate-400 uppercase tracking-widest font-bold">
                    Desa Sampeldes
                  </span>
                </div>
              </div>

              {/* Tombol Toggle Biru Kotak */}
              <button
                type="button"
                onClick={toggleSidebar}
                className="h-9 w-9 rounded-xl bg-[#0284c7] hover:bg-[#0369a1] text-white flex items-center justify-center shadow-md active:scale-95 transition-all cursor-pointer shrink-0 ml-auto"
                title="Perkecil Sidebar"
              >
                <X className="h-5 w-5 stroke-[2.5]" />
              </button>
            </div>

            {/* Quick Switch Links */}
            <div className="mt-3 pt-2.5 border-t border-white/10 flex flex-col gap-1.5">
              <Link href="/absensi/dashboard" onClick={handleNavClick}>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full h-8 px-2.5 rounded-xl text-[10px] font-condensed font-extrabold uppercase tracking-wider text-slate-200 bg-white/5 border-white/10 hover:bg-white/10 hover:text-white justify-start gap-2 shadow-xs transition-all active:scale-95"
                >
                  <UserCheck className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                  <span className="truncate">Portal Absensi Mandiri</span>
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center py-1 gap-2">
            <div className="h-9 w-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-xs shadow-xs border border-amber-500/30">
              <ShieldCheck className="h-4 w-4" />
            </div>
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
          {absensiAdminNavItems.map((item) => {
            const currentPath = pathname ? pathname.replace(/\/$/, "") : ""
            const itemPath = item.href.replace(/\/$/, "")
            const isActive = currentPath === itemPath || (itemPath !== "/absensi-admin" && currentPath.startsWith(itemPath + "/"))

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
              />
            )
          })}
        </div>
      </SidebarContent>

      <SidebarFooter className="p-3 border-t border-white/10 bg-[#0e1620]">
        {!isCollapsed ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2 p-2 rounded-2xl bg-white/5 border border-white/10">
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                <div className="h-9 w-9 rounded-full bg-amber-600 text-white font-extrabold flex items-center justify-center text-xs shrink-0 shadow-xs">
                  AB
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-condensed font-extrabold uppercase text-white truncate">
                    {profile?.nama || userEmail?.split("@")[0] || "ADMIN ABSENSI"}
                  </p>
                  <p className="text-[10px] text-slate-400 font-bold uppercase truncate">
                    {profile?.jabatan || "ADMINISTRATOR"}
                  </p>
                </div>
              </div>

              {/* Tombol ON / OFF Night Mode */}
              <NightModeSwitch size="sm" />
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="w-full h-8 rounded-xl text-rose-400 hover:text-white hover:bg-rose-500/20 text-xs font-condensed font-bold uppercase justify-start gap-2 transition-all cursor-pointer"
            >
              <LogOut className="h-4 w-4 shrink-0 text-rose-400" />
              <span>Keluar Sesi</span>
            </Button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-amber-600 text-white font-extrabold flex items-center justify-center text-[11px] shadow-xs" title={profile?.nama || "Admin"}>
              AB
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="h-8 w-8 rounded-xl flex items-center justify-center text-rose-400 hover:text-white hover:bg-rose-500/20 transition-colors"
              title="Keluar"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  )
}

export default function AdminAbsensiLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const auth = useAuth()
  const db = useFirestore()
  const { user, isUserLoading } = useUser()
  const [isAuthorized, setIsAuthorized] = useState(false)

  const isLoginPage = pathname?.includes("/absensi-admin/login")

  const personelRef = useMemoFirebase(
    () => (db && user ? doc(db, "personel", user.uid) : null),
    [db, user]
  )
  const { data: profile, isLoading: isProfileLoading } = useDoc(personelRef)

  const handleLogout = useCallback(async () => {
    try {
      await signOut(auth)
      router.replace("/absensi-admin/login/")
    } catch (error) {
      console.error("Error signing out:", error)
      router.replace("/absensi-admin/login/")
    }
  }, [auth, router])

  useEffect(() => {
    if (isLoginPage) return
    if (isUserLoading) return

    if (!user) {
      router.replace("/absensi-admin/login/")
      return
    }

    if (!isProfileLoading) {
      if (profile && profile.aktif === false) {
        handleLogout()
        return
      }

      // 1. ISOLASI: Jika akun yang login adalah perangkat desa biasa, arahkan ke portal presensi mandiri
      if (profile?.role === "perangkat") {
        router.replace("/absensi/dashboard")
        return
      }

      // 2. Verifikasi apakah akun adalah Admin Absensi resmi
      const email = user.email?.toLowerCase() || ""
      const isOfficialAbsenAdmin =
        profile?.role === "admin" ||
        profile?.role === "admin_absensi" ||
        profile?.username === "adminsampeldes" ||
        profile?.username === "admin" ||
        email === "adminsampeldes@sampeldes.id" ||
        email === "admin@sampeldes.id" ||
        email.startsWith("adminsampeldes")

      if (!isOfficialAbsenAdmin) {
        handleLogout()
        return
      }

      setIsAuthorized(true)
    }
  }, [user, profile, isUserLoading, isProfileLoading, router, isLoginPage, handleLogout])

  if (isLoginPage) {
    return <main className="w-full min-h-screen bg-[#F8FAFC] dark:bg-[#060b11] neu-canvas font-sans">{children}</main>
  }

  if (isUserLoading || isProfileLoading || !isAuthorized || !user) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[#F8FAFC] dark:bg-[#060b11] neu-canvas font-sans">
        <div className="text-center space-y-4">
          <Loader2 className="h-10 w-10 animate-spin text-amber-700/50 mx-auto" />
          <p className="text-[11px] font-black text-slate-700 uppercase tracking-widest">
            Memverifikasi Hak Akses Admin...
          </p>
        </div>
      </div>
    )
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full overflow-hidden bg-[#F8FAFC] dark:bg-[#060b11] neu-canvas font-sans transition-colors duration-300">
        <AbsensiAdminSidebarInner
          handleLogout={handleLogout}
          profile={profile}
          userEmail={user.email}
        />

        <SidebarInset className="flex-1 flex flex-col min-w-0 bg-[#F8FAFC] dark:bg-[#060b11] neu-canvas transition-colors duration-300">
          {/* Header Mobile */}
          <header className="sticky top-0 z-40 flex h-14 shrink-0 items-center justify-between border-b border-white/10 bg-[#0e1620] px-4 md:hidden text-white shadow-xs">
            <div className="flex items-center gap-2">
              <SidebarTrigger className="h-9 w-9 rounded-xl bg-[#0284c7] hover:bg-[#0369a1] text-white shadow-md active:scale-95 transition-all" />
              <div className="flex flex-col">
                <span className="font-condensed font-extrabold text-sm text-white uppercase tracking-wider leading-none">
                  Admin Absensi
                </span>
                <span className="text-[9px] text-amber-400 font-bold uppercase tracking-widest">
                  Desa Sampeldes
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <NightModeSwitch size="sm" />
              <Link href="/absensi/dashboard">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 px-2.5 text-[10px] font-condensed font-extrabold uppercase text-slate-300 bg-white/5 border-white/10 hover:bg-white/10 hover:text-white gap-1 rounded-full"
                >
                  <UserCheck className="h-3.5 w-3.5 text-emerald-400" />
                  <span className="hidden min-[380px]:inline">Presensi</span>
                </Button>
              </Link>
            </div>
          </header>

          {/* Main Content Area - Full width on PC */}
          <main className="flex-1 w-full p-3 sm:p-5 md:p-6 overflow-y-auto bg-[#F8FAFC] dark:bg-[#060b11] neu-canvas transition-colors duration-300">
            <div className="pb-16 md:pb-8 w-full">
              {children}
            </div>
          </main>
        </SidebarInset>
      </div>
      <Toaster />
    </SidebarProvider>
  )
}
