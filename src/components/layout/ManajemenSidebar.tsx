"use client";

import * as React from "react"
import {
  LayoutDashboard,
  FileUp,
  Map,
  User,
  Settings,
  LogOut,
  CircleDollarSign,
  Files,
  Calendar,
  Archive,
  FileText,
  Hash,
  HeartPulse,
  FileSpreadsheet,
  ArrowRightLeft,
  Globe,
  ShieldCheck,
  Menu,
  X,
  FolderKanban,
  Briefcase,
  Camera,
  Printer,
  Database,
  Users,
  CreditCard,
  Activity,
  UserCheck,
  Sliders,
  FileStack,
  Contact,
  Landmark,
  BookOpen,
  MapPin,
} from "lucide-react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useAuth, useUser, useDoc, useFirestore, useMemoFirebase } from "@/firebase"
import { doc } from "firebase/firestore"
import Image from "next/image"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  useSidebar
} from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { CurvedSidebarItem } from "@/components/layout/CurvedSidebarItem"
import { NightModeSwitch } from "@/components/ui/NightModeSwitch"
import { cn, getPublicSiteUrl } from "@/lib/utils"

interface ManajemenNavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  activeColor: string;
  activeTextColor: string;
  subItems?: { href: string; label: string; icon?: React.ElementType }[];
}

const manajemenNavItems: ManajemenNavItem[] = [
  {
    href: "/manajemen/dashboard",
    label: "Dashboard Utama",
    icon: LayoutDashboard,
    activeColor: "bg-[#059669]",
    activeTextColor: "text-emerald-900",
  },
  {
    href: "/manajemen/apbdes",
    label: "Informasi APBDes",
    icon: CircleDollarSign,
    activeColor: "bg-[#f59e0b]",
    activeTextColor: "text-amber-900",
  },
  {
    href: "/manajemen/agenda",
    label: "Agenda Kegiatan",
    icon: Calendar,
    activeColor: "bg-[#0284c7]",
    activeTextColor: "text-sky-900",
  },
  {
    href: "/manajemen/arsip-dokumen",
    label: "MANAJEMEN DOKUMEN",
    icon: FolderKanban,
    activeColor: "bg-[#6366f1]",
    activeTextColor: "text-indigo-900",
    subItems: [
      { href: "/manajemen/arsip-dokumen", label: "Arsip Digital", icon: Archive },
      { href: "/manajemen/arsip-nomor-surat", label: "Register Nomor Surat", icon: Hash },
      { href: "/manajemen/naskah-dinas", label: "Naskah Dinas", icon: FileText },
      { href: "/manajemen/sppd", label: "Manajemen SPPD", icon: Briefcase },
      { href: "/manajemen/kegiatan", label: "Dokumentasi Kegiatan", icon: Camera },
      { href: "/manajemen/dokumen-penunjang", label: "Cetak Dokumen", icon: Printer },
      { href: "/manajemen/dokumen-fisik", label: "Inventaris Dokumen Fisik", icon: FileStack },
    ],
  },
  {
    href: "/manajemen/pbb-p2/master-data",
    label: "Master Data PBB-P2",
    icon: FileSpreadsheet,
    activeColor: "bg-[#16a34a]",
    activeTextColor: "text-green-900",
    subItems: [
      { href: "/manajemen/pbb-p2/master-data", label: "Data PBB", icon: Database },
      { href: "/manajemen/pbb-p2/penarik", label: "Penarik PBB", icon: Users },
      { href: "/manajemen/pbb-p2/pembayaran", label: "Pembayaran PBB", icon: CreditCard },
      { href: "/manajemen/pbb-p2/monitoring", label: "Monitoring", icon: Activity },
    ],
  },
  {
    href: "/manajemen/penduduk",
    label: "KEPENDUDUKAN",
    icon: Users,
    activeColor: "bg-[#0d9488]",
    activeTextColor: "text-teal-900",
    subItems: [
      { href: "/manajemen/penduduk", label: "Data Penduduk", icon: Users },
      { href: "/manajemen/kartu-keluarga", label: "Kartu Keluarga", icon: Contact },
      { href: "/manajemen/dtsen", label: "DATA DTSEN", icon: FileSpreadsheet },
    ],
  },
  {
    href: "/manajemen/pertanahan/persil",
    label: "PERTANAHAN",
    icon: Map,
    activeColor: "bg-[#b45309]",
    activeTextColor: "text-amber-900",
    subItems: [
      { href: "/manajemen/pertanahan/persil", label: "Data Persil", icon: Landmark },
      { href: "/manajemen/pertanahan/cdesa", label: "Buku C-Desa", icon: BookOpen },
      { href: "/manajemen/pertanahan/peta", label: "Peta Persil GIS", icon: MapPin },
    ],
  },
  {
    href: "/manajemen/profile",
    label: "SETING",
    icon: Settings,
    activeColor: "bg-[#475569]",
    activeTextColor: "text-slate-900",
    subItems: [
      { href: "/manajemen/profile", label: "Profil Perangkat", icon: UserCheck },
      { href: "/manajemen/data-kesehatan", label: "Kesehatan Warga", icon: HeartPulse },
      { href: "/manajemen/settings", label: "Pengaturan Desa", icon: Sliders },
    ],
  },
]

export function ManajemenSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const auth = useAuth()
  const { user } = useUser()
  const db = useFirestore()
  const { setOpenMobile, isMobile, state, toggleSidebar } = useSidebar()
  const isCollapsed = state === "collapsed"
  const [mounted, setMounted] = React.useState(false)

  const villageSettingsRef = useMemoFirebase(() => {
    if (!db || !user) return null
    return doc(db, "settings", "village")
  }, [db, user])

  const { data: configData } = useDoc(villageSettingsRef)

  const [openMenus, setOpenMenus] = React.useState<Record<string, boolean>>({})
  const [publicWebUrl, setPublicWebUrl] = React.useState<string>(
    'https://' + (process.env.NEXT_PUBLIC_SITE_DOMAIN || 'sampeldes.gandrungmangu.id') + '/'
  );

  React.useEffect(() => {
    setPublicWebUrl(getPublicSiteUrl('/'));
  }, []);

  React.useEffect(() => {
    setMounted(true)
    manajemenNavItems.forEach((item) => {
      if (item.subItems?.some((sub) => pathname === sub.href || pathname.startsWith(sub.href + "/"))) {
        setOpenMenus((prev) => ({ ...prev, [item.label]: true }))
      }
    })
  }, [pathname])

  const toggleSubMenu = (label: string) => {
    setOpenMenus((prev) => ({
      ...prev,
      [label]: !prev[label],
    }))
  }

  const handleLogout = async () => {
    try {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('isAdmin')
        localStorage.removeItem('adminEmail')
        localStorage.removeItem('lastWorkspace')
      }
      if (auth) {
        await auth.signOut()
      }
      router.replace("/login")
    } catch (error) {
      console.error("Logout error:", error)
    }
  }

  const handleLinkClick = () => {
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
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10 border border-white/10 overflow-hidden shrink-0 shadow-xs">
                  {configData?.logoBase64 ? (
                    <Image
                      src={configData.logoBase64}
                      alt="Logo Desa"
                      width={38}
                      height={38}
                      className="object-contain p-1"
                      unoptimized
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-slate-900 text-amber-400">
                      <ShieldCheck className="h-5 w-5" />
                    </div>
                  )}
                </div>
                <div className="flex flex-col overflow-hidden">
                  <span className="font-condensed font-extrabold text-sm leading-tight tracking-tight text-white uppercase">
                    Manajemen Desa
                  </span>
                  <span className="text-[9px] text-slate-400 uppercase tracking-widest font-bold">
                    Operasional Pemdes
                  </span>
                </div>
              </div>

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

            {/* Quick Switch to Admin Web */}
            <div className="mt-3 pt-2.5 border-t border-white/10 flex flex-col gap-1.5">
              <Link href="/admin/surat" onClick={handleLinkClick}>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full h-8 px-2.5 rounded-xl text-[10px] font-condensed font-extrabold uppercase tracking-wider text-slate-200 bg-white/5 border-white/10 hover:bg-white/10 hover:text-white justify-start gap-2 shadow-xs transition-all active:scale-95"
                >
                  <ArrowRightLeft className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                  <span className="truncate">Ke Pengaturan Website</span>
                </Button>
              </Link>
              <a href={publicWebUrl} onClick={handleLinkClick}>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full h-7 px-2.5 rounded-xl text-[10px] font-condensed font-extrabold uppercase tracking-wider text-slate-400 hover:text-white hover:bg-white/5 justify-start gap-2 transition-all active:scale-95"
                >
                  <Globe className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">Lihat Web Publik</span>
                </Button>
              </a>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center py-1 gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#0284c7] text-white font-bold text-xs shadow-xs">
              M
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
          {manajemenNavItems.map((item) => {
            const currentPath = mounted ? pathname.replace(/\/$/, "") : ""
            const isSubActive = item.subItems?.some(
              (sub) => currentPath === sub.href.replace(/\/$/, "") || currentPath.startsWith(sub.href.replace(/\/$/, "") + '/')
            )
            const itemPath = item.href.replace(/\/$/, "")
            const isActive =
              isSubActive ||
              (!item.subItems &&
                (currentPath === itemPath || (itemPath !== "/manajemen" && currentPath.startsWith(itemPath + "/"))))

            const isOpen = openMenus[item.label] ?? false

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
                onClick={handleLinkClick}
                subItems={item.subItems}
                isOpen={isOpen}
                onToggleSub={() => toggleSubMenu(item.label)}
              />
            )
          })}
        </div>
      </SidebarContent>

      <SidebarFooter className="p-3 border-t border-white/10 bg-[#0e1620]">
        {!isCollapsed ? (
          <div className="space-y-2">
            {/* Profil Sesuai Konsep Gambar */}
            <div className="flex items-center justify-between gap-2 p-2 rounded-2xl bg-white/5 border border-white/10">
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                <div className="h-9 w-9 rounded-full bg-emerald-600 text-white font-extrabold flex items-center justify-center text-xs shrink-0 shadow-xs">
                  {user?.email?.substring(0, 2).toUpperCase() || 'DE'}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-condensed font-extrabold uppercase text-white truncate">
                    {user?.email?.split('@')[0].toUpperCase() || 'ADMIN SAMPELDES'}
                  </p>
                  <span className="text-[10px] font-sans text-slate-400 font-semibold block truncate">
                    Aparatur Desa
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
              className="h-9 w-9 rounded-full bg-emerald-600 text-white font-extrabold flex items-center justify-center text-xs shadow-xs"
              title={user?.email || "Aparatur"}
            >
              {user?.email?.substring(0, 2).toUpperCase() || 'MD'}
            </div>
            <button
              type="button"
              onClick={handleLogout}
              title="Logout"
              className="h-9 w-9 rounded-xl flex items-center justify-center text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
            >
              <LogOut className="h-4.5 w-4.5" />
            </button>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  )
}

export { ManajemenSidebar as AppSidebar };