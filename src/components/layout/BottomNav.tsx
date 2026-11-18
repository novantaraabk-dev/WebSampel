"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, FileUp, Map, User } from "lucide-react"
import { cn } from "@/lib/utils"
import * as React from "react"

export function BottomNav() {
  const pathname = usePathname()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  const isManajemen = mounted && pathname.startsWith('/manajemen');

  const navItems = [
    { label: "Beranda", icon: LayoutDashboard, href: isManajemen ? "/manajemen/dashboard" : "/dashboard" },
    { label: "Dokumentasi", icon: FileUp, href: isManajemen ? "/manajemen/kegiatan" : "/kegiatan" },
    { label: "SPPD", icon: Map, href: isManajemen ? "/manajemen/sppd" : "/sppd" },
    { label: "Data Desa", icon: User, href: isManajemen ? "/manajemen/profile" : "/profile" },
  ]

  if (!mounted) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/15 bg-gradient-to-t from-[#060a0f] via-[#091018] to-[#0e1723]/95 backdrop-blur-xl px-4 pb-safe-area-inset-bottom md:hidden shadow-[0_-8px_32px_rgba(0,0,0,0.5)] font-sans">
      <div className="flex justify-around py-2">
        {navItems.map((item) => {
          const itemPath = item.href.replace(/\/$/, "")
          const currentPath = pathname.replace(/\/$/, "")
          const isActive = currentPath === itemPath || (itemPath !== "/manajemen/dashboard" && itemPath !== "/dashboard" && currentPath.startsWith(itemPath))
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-1 px-3.5 py-1.5 rounded-2xl transition-all active:scale-95 relative",
                isActive 
                  ? "bg-white/10 text-teal-400 border border-teal-500/30 shadow-[inset_1px_1px_2px_rgba(255,255,255,0.15),2px_2px_6px_rgba(0,0,0,0.4)]" 
                  : "text-white/50 hover:text-white/80"
              )}
            >
              <item.icon className={cn("h-4.5 w-4.5 transition-transform", isActive && "stroke-[2.5px] scale-105 text-teal-400")} />
              <span className={cn("text-[9px] uppercase tracking-wider font-extrabold font-condensed", isActive ? "text-teal-400" : "text-white/50")}>
                {item.label}
              </span>
              {isActive && (
                <div className="absolute -top-1 w-1.5 h-1.5 rounded-full bg-teal-400 shadow-[0_0_8px_#10b981]" />
              )}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}