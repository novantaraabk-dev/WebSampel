"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { ChevronDown } from "lucide-react"

export interface CurvedSidebarItemProps {
  href: string
  label: string
  icon: React.ElementType
  activeColor: string // e.g. "bg-[#f59e0b]", "bg-[#ea384c]", "bg-[#a855f7]", "bg-[#10b981]"
  activeTextColor?: string // e.g. "text-amber-600", "text-rose-600"
  isActive: boolean
  isCollapsed: boolean
  onClick?: () => void
  subItems?: { href: string; label: string; icon?: React.ElementType }[]
  isOpen?: boolean
  onToggleSub?: () => void
}

export function CurvedSidebarItem({
  href,
  label,
  icon: Icon,
  activeColor,
  activeTextColor = "text-slate-900",
  isActive,
  isCollapsed,
  onClick,
  subItems,
  isOpen,
  onToggleSub,
}: CurvedSidebarItemProps) {
  const pathname = usePathname()

  // 1. TAMPILAN KETIKA SIDEBAR COLLAPSED (SLIM ICON BAR, 76px)
  if (isCollapsed) {
    if (isActive) {
      return (
        <div className="relative w-full flex flex-col items-center my-1 group">
          {/* Main Parent Button */}
          <div className="relative h-12 w-full flex items-center justify-center">
            <Tooltip delayDuration={150}>
              <TooltipTrigger asChild>
                <Link
                  href={href}
                  onClick={onClick}
                  className="relative h-12 w-full flex items-center justify-center z-20 group/parent"
                >
                  {/* Tab Lengkung Pop-Out Menjorok ke Kanan (#0e1620) */}
                  <div className="absolute right-0 top-0 translate-x-full w-[18px] h-12 pointer-events-none z-10">
                    <svg
                      className="w-[18px] h-12 block"
                      viewBox="0 0 18 48"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M0,0 C0,10 18,8 18,24 C18,40 0,38 0,48 L0,48 Z"
                        fill="#0e1620"
                      />
                    </svg>
                  </div>

                  {/* Lingkaran Ikon Berwarna yang Pop-Out */}
                  <div
                    className={cn(
                      "h-10 w-10 rounded-full flex items-center justify-center text-white shadow-md z-20 transition-transform duration-200 translate-x-2.5",
                      activeColor
                    )}
                  >
                    <Icon className="h-5 w-5 text-white" />
                  </div>
                </Link>
              </TooltipTrigger>
              <TooltipContent
                side="right"
                sideOffset={18}
                className="font-condensed font-extrabold uppercase text-xs z-50 shadow-xl bg-slate-900 text-white border-white/10"
              >
                {label}
              </TooltipContent>
            </Tooltip>
          </div>

          {/* Tombol Sub-Menu yang Ditata Rapi Pada Mode Slim / Collapsed */}
          {subItems && subItems.length > 0 && (
            <div className="w-full flex flex-col items-center gap-1.5 py-1.5 my-1 px-1.5 bg-black/30 rounded-2xl border border-white/5 relative z-10">
              {subItems.map((sub) => {
                const isSubExact = pathname === sub.href
                const isSubDeep = pathname.startsWith(sub.href + "/")
                const hasMoreSpecificMatch = subItems.some(
                  (other) =>
                    other.href !== sub.href &&
                    other.href.length > sub.href.length &&
                    (pathname === other.href || pathname.startsWith(other.href + "/"))
                )
                const isSubActive = isSubExact || (isSubDeep && !hasMoreSpecificMatch)
                const SubIcon = sub.icon

                return (
                  <Tooltip key={sub.href} delayDuration={80}>
                    <TooltipTrigger asChild>
                      <Link
                        href={sub.href}
                        onClick={onClick}
                        className={cn(
                          "relative z-10 w-[34px] h-[34px] rounded-xl flex items-center justify-center transition-all duration-200 active:scale-95 group/sub",
                          isSubActive
                            ? "bg-white text-slate-950 font-black shadow-lg ring-2 ring-sky-500/40 scale-105"
                            : "text-slate-400 hover:text-white hover:bg-white/15 bg-white/5 border border-white/5"
                        )}
                      >
                        {SubIcon ? (
                          <SubIcon
                            className={cn(
                              "h-4 w-4 transition-transform group-hover/sub:scale-110",
                              isSubActive
                                ? "text-sky-600 stroke-[2.5]"
                                : "text-slate-400 group-hover/sub:text-white"
                            )}
                          />
                        ) : (
                          <span
                            className={cn(
                              "h-2 w-2 rounded-full",
                              isSubActive
                                ? "bg-sky-600 ring-2 ring-sky-400/40"
                                : "bg-slate-500 group-hover/sub:bg-white"
                            )}
                          />
                        )}

                        {/* Indikator status aktif di pojok tombol */}
                        {isSubActive && (
                          <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-sky-500 ring-1.5 ring-white" />
                        )}
                      </Link>
                    </TooltipTrigger>
                    <TooltipContent
                      side="right"
                      sideOffset={14}
                      className="font-condensed font-extrabold uppercase text-xs z-50 shadow-2xl bg-[#0e1620] text-white border border-white/15 px-3 py-1.5 rounded-xl flex items-center gap-2"
                    >
                      <span
                        className={cn(
                          "h-1.5 w-1.5 rounded-full",
                          isSubActive ? "bg-sky-400 animate-pulse" : "bg-slate-500"
                        )}
                      />
                      <span>{sub.label}</span>
                      {isSubActive && (
                        <span className="text-[10px] text-sky-400 font-bold ml-1 tracking-wider">
                          [AKTIF]
                        </span>
                      )}
                    </TooltipContent>
                  </Tooltip>
                )
              })}
            </div>
          )}
        </div>
      )
    }

    return (
      <div className="relative h-12 w-full flex items-center justify-center my-1 group">
        <Tooltip delayDuration={150}>
          <TooltipTrigger asChild>
            <Link
              href={href}
              onClick={onClick}
              className="relative h-12 w-full flex items-center justify-center text-slate-400 hover:text-white transition-colors group/item"
            >
              <div className="h-10 w-10 rounded-full flex items-center justify-center group-hover/item:bg-white/10 transition-colors">
                <Icon className="h-5 w-5 text-slate-400 group-hover/item:text-white" />
              </div>
            </Link>
          </TooltipTrigger>
          <TooltipContent
            side="right"
            sideOffset={14}
            className="font-condensed font-extrabold uppercase text-xs z-50 shadow-xl bg-slate-900 text-white border-white/10"
          >
            {label}
          </TooltipContent>
        </Tooltip>

        {/* Hover Flyout untuk menu yang memiliki subItems saat tidak aktif di mode slim */}
        {subItems && subItems.length > 0 && (
          <div className="absolute left-full top-0 ml-2 hidden group-hover:flex flex-col min-w-[190px] bg-[#0e1620] border border-white/15 rounded-xl shadow-2xl py-2 px-1 z-50 animate-in fade-in-0 zoom-in-95 pointer-events-auto">
            <div className="px-3 py-1 text-[11px] font-condensed font-extrabold uppercase tracking-wider text-slate-400 border-b border-white/10 mb-1 flex items-center justify-between">
              <span>{label}</span>
              <Icon className="h-3.5 w-3.5 text-slate-400" />
            </div>
            <div className="flex flex-col gap-0.5">
              {subItems.map((sub) => {
                const SubIcon = sub.icon
                return (
                  <Link
                    key={sub.href}
                    href={sub.href}
                    onClick={onClick}
                    className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-condensed font-bold uppercase transition-colors text-slate-300 hover:text-white hover:bg-white/10"
                  >
                    {SubIcon ? (
                      <SubIcon className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                    ) : (
                      <span className="h-1.5 w-1.5 rounded-full bg-slate-400 shrink-0" />
                    )}
                    <span className="truncate">{sub.label}</span>
                  </Link>
                )
              })}
            </div>
          </div>
        )}
      </div>
    )
  }

  // 2. TAMPILAN KETIKA SIDEBAR EXPANDED (LEBAR)
  if (isActive) {
    return (
      <div className="relative my-0.5 w-full">
        {/* Lengkungan Cekung Atas (Inverted Curve Top) - Posisi presisi di tepi kanan kanvas */}
        <div className="absolute -top-5 -right-[1px] w-5 h-5 pointer-events-none z-20">
          <svg
            className="w-5 h-5 block"
            viewBox="0 0 20 20"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M0,20 C11.0457,20 20,11.0457 20,0 L20,20 Z"
              className="fill-[#F8FAFC] dark:fill-[#060b11] transition-colors duration-300"
            />
          </svg>
        </div>

        {/* Lengkungan Cekung Bawah (Inverted Curve Bottom) - Posisi presisi di tepi kanan kanvas */}
        <div className="absolute -bottom-5 -right-[1px] w-5 h-5 pointer-events-none z-20">
          <svg
            className="w-5 h-5 block"
            viewBox="0 0 20 20"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M0,0 C11.0457,0 20,8.9543 20,20 L20,0 Z"
              className="fill-[#F8FAFC] dark:fill-[#060b11] transition-colors duration-300"
            />
          </svg>
        </div>

        {/* Baris Menu Aktif Menyatu Penuh dengan Canvas (#F8FAFC / #060b11) */}
        <Link
          href={href}
          onClick={(e) => {
            if (subItems && onToggleSub) {
              onToggleSub()
            }
            onClick?.()
          }}
          className="relative flex items-center gap-3 pl-3 pr-2 h-12 w-[calc(100%+4px)] bg-[#F8FAFC] dark:bg-[#060b11] rounded-l-full rounded-r-none z-10 transition-colors duration-300 group"
        >
          {/* Lingkaran Ikon Berwarna */}
          <div
            className={cn(
              "h-9 w-9 rounded-full flex items-center justify-center text-white shadow-md shrink-0 transition-transform group-hover:scale-105",
              activeColor
            )}
          >
            <Icon className="h-4.5 w-4.5 text-white" />
          </div>

          <span
            className={cn(
              "font-condensed font-extrabold text-xs sm:text-[13px] uppercase tracking-wider truncate dark:text-white",
              activeTextColor
            )}
          >
            {label}
          </span>

          {subItems && (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                onToggleSub?.()
              }}
              className="ml-auto p-1 text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white transition-colors"
            >
              <ChevronDown
                className={cn(
                  "h-4 w-4 transition-transform duration-200",
                  isOpen && "rotate-180"
                )}
              />
            </button>
          )}
        </Link>

        {/* Sub Menu Dropdown jika ada */}
        {subItems && isOpen && (
          <div className="flex flex-col gap-1.5 pl-6 pr-3 pt-1 pb-3 bg-[#F8FAFC] dark:bg-[#060b11] w-[calc(100%+4px)] rounded-bl-[20px] transition-colors duration-300">
            <div className="border-l-2 border-slate-300/80 dark:border-white/10 pl-3 flex flex-col gap-1">
              {subItems.map((sub) => {
                const isExact = pathname === sub.href
                const isDeep =
                  pathname.startsWith(sub.href + "/") &&
                  !subItems.some(
                    (other) =>
                      other.href !== sub.href &&
                      other.href.length > sub.href.length &&
                      (pathname === other.href || pathname.startsWith(other.href + "/"))
                  )
                const isChildActive = isExact || isDeep

                return (
                  <Link
                    key={sub.href}
                    href={sub.href}
                    onClick={onClick}
                    className={cn(
                      "text-[11px] font-condensed uppercase tracking-wider py-1.5 px-3 rounded-xl transition-all flex items-center justify-between group/sub",
                      isChildActive
                        ? "text-slate-950 dark:text-white font-black bg-white dark:bg-[#121c28] shadow-sm border border-slate-200/90 dark:border-white/10"
                        : "text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 font-bold"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className={cn(
                          "w-2 h-2 rounded-full transition-all shrink-0",
                          isChildActive
                            ? "bg-[#0284c7] scale-110 shadow-xs"
                            : "bg-slate-400/80 dark:bg-slate-500 group-hover/sub:bg-slate-700 dark:group-hover/sub:bg-slate-300"
                        )}
                      />
                      <span>{sub.label}</span>
                    </div>
                    {isChildActive && (
                      <span className="w-1.5 h-1.5 rounded-full bg-[#0284c7]" />
                    )}
                  </Link>
                )
              })}
            </div>
          </div>
        )}
      </div>
    )
  }

  // Normal / Inactive Item Expanded (pada background Dark Blue)
  return (
    <div className="relative my-0.5">
      <Link
        href={href}
        onClick={(e) => {
          if (subItems && onToggleSub) {
            onToggleSub()
          }
          onClick?.()
        }}
        className="relative flex items-center gap-3 px-3 mr-3 h-12 rounded-2xl text-slate-300 hover:text-white hover:bg-white/10 transition-all font-condensed font-bold text-xs sm:text-[13px] uppercase tracking-wider group"
      >
        <div className="h-9 w-9 rounded-full flex items-center justify-center text-slate-400 group-hover:text-white group-hover:bg-white/10 transition-colors shrink-0">
          <Icon className="h-4.5 w-4.5" />
        </div>
        <span className="truncate">{label}</span>

        {subItems && (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              onToggleSub?.()
            }}
            className="ml-auto p-1 text-slate-400 group-hover:text-white transition-colors"
          >
            <ChevronDown
              className={cn(
                "h-4 w-4 transition-transform duration-200",
                isOpen && "rotate-180"
              )}
            />
          </button>
        )}
      </Link>

      {/* Sub Menu Dropdown jika ada pada status inactive */}
      {subItems && isOpen && (
        <div className="flex flex-col gap-1.5 pl-6 pr-3 pt-1 pb-2 mr-3">
          <div className="border-l-2 border-white/15 pl-3 flex flex-col gap-1">
            {subItems.map((sub) => {
              const isExact = pathname === sub.href
              const isDeep =
                pathname.startsWith(sub.href + "/") &&
                !subItems.some(
                  (other) =>
                    other.href !== sub.href &&
                    other.href.length > sub.href.length &&
                    (pathname === other.href || pathname.startsWith(other.href + "/"))
                )
              const isChildActive = isExact || isDeep

              return (
                <Link
                  key={sub.href}
                  href={sub.href}
                  onClick={onClick}
                  className={cn(
                    "text-[11px] font-condensed uppercase tracking-wider py-1.5 px-3 rounded-xl transition-all flex items-center justify-between group/sub",
                    isChildActive
                      ? "text-white font-black bg-white/20 shadow-xs border border-white/30"
                      : "text-slate-300 hover:text-white hover:bg-white/10 font-bold"
                  )}
                >
                  <div className="flex items-center gap-2">
                    <div
                      className={cn(
                        "w-2 h-2 rounded-full transition-all shrink-0",
                        isChildActive
                          ? "bg-sky-400 scale-110 shadow-xs"
                          : "bg-slate-500 group-hover/sub:bg-slate-300"
                      )}
                    />
                    <span>{sub.label}</span>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
