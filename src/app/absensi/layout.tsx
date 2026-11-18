"use client"

import { ReactNode, useEffect, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import { useUser, useAuth, useFirestore, useMemoFirebase, useCollection } from "@/firebase"
import { signOut } from "firebase/auth"
import { query, collection, where, limit } from "firebase/firestore"
import {
  UserCheck,
  Settings,
  LogOut,
  ShieldCheck,
  Menu,
  X,
  Home,
  Clock,
  ArrowRightLeft,
  ArrowLeft
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

const absensiNavItems = [
  {
    href: "/absensi/dashboard",
    label: "Presensi Mandiri",
    icon: UserCheck,
    activeColor: "bg-[#059669]",
    activeTextColor: "text-emerald-900",
  },
  {
    href: "/absensi/settings",
    label: "Profil & Akun",
    icon: Settings,
    activeColor: "bg-[#475569]",
    activeTextColor: "text-slate-900",
  },
]

function AbsensiSidebarInner({
  handleLogout,
  personelName,
  personelRole,
  userEmail,
}: {
  handleLogout: () => void
  personelName?: string
  personelRole?: string
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
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-500/15 border border-emerald-500/20 text-emerald-400 shrink-0 shadow-xs">
                  <UserCheck className="h-5 w-5" />
                </div>
                <div className="flex flex-col overflow-hidden">
                  <span className="font-condensed font-extrabold text-sm leading-tight tracking-tight text-white uppercase">
                    Portal Presensi
                  </span>
                  <span className="text-[9px] text-emerald-400 uppercase tracking-widest font-bold">
                    Aparatur Sampeldes
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
          </div>
        ) : (
          <div className="flex flex-col items-center py-1 gap-2">
            <div className="h-9 w-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs shadow-xs border border-emerald-500/30">
              <UserCheck className="h-4 w-4" />
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
          {absensiNavItems.map((item) => {
            const currentPath = pathname ? pathname.replace(/\/$/, "") : ""
            const itemPath = item.href.replace(/\/$/, "")
            const isActive = currentPath === itemPath || (itemPath !== "/absensi" && currentPath.startsWith(itemPath + "/"))

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

      <SidebarFooter className="p-3 pb-8 sm:pb-4 border-t border-white/10 bg-[#0e1620]">
        {!isCollapsed ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2 p-2 rounded-2xl bg-white/5 border border-white/10">
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                <div className="h-9 w-9 rounded-full bg-emerald-600 text-white font-extrabold flex items-center justify-center text-xs shrink-0 shadow-xs">
                  {personelName?.substring(0, 2).toUpperCase() || "PG"}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-condensed font-extrabold uppercase text-white truncate">
                    {personelName || userEmail?.split("@")[0] || "PENGGUNA"}
                  </p>
                  <p className="text-[10px] text-emerald-400 font-bold uppercase truncate">
                    {personelRole || "PERANGKAT DESA"}
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
              className="w-full h-9 rounded-xl text-rose-300 bg-rose-500/10 hover:text-white hover:bg-rose-600 border border-rose-500/20 text-xs font-condensed font-bold uppercase justify-center gap-2 transition-all cursor-pointer shadow-xs active:scale-95"
            >
              <LogOut className="h-4 w-4 shrink-0 text-rose-400" />
              <span>Keluar Sesi (Logout)</span>
            </Button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-emerald-600 text-white font-extrabold flex items-center justify-center text-[11px] shadow-xs" title={personelName || "Personel"}>
              {personelName?.substring(0, 2).toUpperCase() || "PG"}
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

export default function AbsensiLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const auth = useAuth()
  const db = useFirestore()
  const { user, isUserLoading } = useUser()

  const isLoginPage = pathname?.includes("/absensi/login")

  const profileQuery = useMemoFirebase(() => {
    if (!db || !user) return null
    return query(collection(db, "personel"), where("uid", "==", user.uid), limit(1))
  }, [db, user])
  const { data: profileDocs } = useCollection(profileQuery)
  const personelData = profileDocs && profileDocs.length > 0 ? profileDocs[0] : null

  useEffect(() => {
    if (isLoginPage) return
    if (isUserLoading) return

    if (!user) {
      router.replace("/absensi/login/")
      return
    }

    const email = user.email?.toLowerCase() || ""
    if (
      email === "admin@sampeldes.id" ||
      email === "adminsampeldes@sampeldes.id" ||
      user.uid === "sYuWEkzcvbUr1mYltcTqzxXEIr53" ||
      personelData?.role === "admin" ||
      personelData?.role === "admin_absensi" ||
      personelData?.username === "adminsampeldes" ||
      personelData?.username === "admin"
    ) {
      router.replace("/absensi-admin/dashboard/")
    }
  }, [user, isUserLoading, isLoginPage, router, personelData])

  const handleLogout = async () => {
    try {
      if (typeof window !== "undefined") {
        localStorage.removeItem("absensi_device_session")
        localStorage.removeItem("absensi_saved_username")
        localStorage.removeItem("absensi_saved_name")
        localStorage.removeItem("absensi_saved_email")
      }
      if (auth) {
        await signOut(auth)
      }
      router.replace("/absensi/login/?logout=true")
    } catch {
      router.replace("/absensi/login/?logout=true")
    }
  }

  if (isLoginPage) {
    return <main className="w-full min-h-screen bg-[#F8FAFC] dark:bg-[#060b11] neu-canvas font-sans">{children}</main>
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full overflow-hidden bg-[#F8FAFC] dark:bg-[#060b11] neu-canvas font-sans transition-colors duration-300">
        <AbsensiSidebarInner
          handleLogout={handleLogout}
          personelName={personelData?.nama}
          personelRole={personelData?.jabatan}
          userEmail={user?.email}
        />

        <SidebarInset className="flex-1 flex flex-col min-w-0 bg-[#F8FAFC] dark:bg-[#060b11] neu-canvas transition-colors duration-300">
          {/* Header Mobile */}
          <header className="sticky top-0 z-40 flex h-13 shrink-0 items-center justify-between border-b border-white/10 bg-[#0e1620] px-3.5 sm:px-4 md:hidden text-white shadow-xs">
            <div className="flex items-center gap-2 min-w-0">
              <SidebarTrigger className="h-8 w-8 rounded-xl bg-[#0284c7] hover:bg-[#0369a1] text-white shadow-md active:scale-95 transition-all shrink-0" />
              <div className="flex flex-col min-w-0">
                <span className="font-condensed font-extrabold text-xs sm:text-sm text-white uppercase tracking-wider leading-none truncate">
                  Presensi Mandiri
                </span>
                <span className="text-[8px] sm:text-[9px] text-emerald-400 font-bold uppercase tracking-widest truncate mt-0.5">
                  Desa Sampeldes
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <NightModeSwitch size="sm" />
              <Link href="/login">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7.5 px-2.5 text-[10px] font-condensed font-extrabold uppercase text-slate-200 bg-white/10 border-white/20 hover:bg-white/20 hover:text-white gap-1 rounded-full shadow-xs cursor-pointer active:scale-95 transition-all shrink-0"
                  title="Kembali ke Portal Login"
                >
                  <ArrowLeft className="h-3 w-3 text-emerald-400" />
                  <span>Kembali</span>
                </Button>
              </Link>
            </div>
          </header>

          {/* Main Content Area */}
          <main className="flex-1 w-full max-w-screen-xl mx-auto p-4 sm:p-6 md:p-8 overflow-y-auto bg-[#F8FAFC] dark:bg-[#060b11] neu-canvas transition-colors duration-300">
            <div className="pb-16 md:pb-8">
              {children}
            </div>
          </main>
        </SidebarInset>
      </div>
      <Toaster />
    </SidebarProvider>
  )
}
