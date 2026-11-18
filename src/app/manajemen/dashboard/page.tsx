"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  FileText,
  Map,
  TrendingUp,
  Clock,
  CheckCircle2,
  ChevronRight,
  Users,
  LayoutDashboard,
  RefreshCw,
  Loader2,
  MapPin,
  Plus,
  Calendar,
  Sparkles,
  ArrowUpRight
} from "lucide-react"
import { KegiatanCard } from "@/components/kegiatan/KegiatanCard"
import { KegiatanUpload } from "@/components/kegiatan/KegiatanUpload"
import { SppdUpload } from "@/components/sppd/SppdUpload"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import Link from "next/link"
import { useUser, useCollection, useFirestore, useMemoFirebase, useDoc } from "@/firebase"
import { collection, query, orderBy, limit, doc } from "firebase/firestore"
import { GOOGLE_CONFIG } from "@/lib/google-config"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { callAppsScript } from "@/app/agenda/actions"

export default function DashboardPage() {
  const [isKegiatanOpen, setIsKegiatanOpen] = useState(false)
  const [isSppdOpen, setIsSppdOpen] = useState(false)
  const [todayAgenda, setTodayAgenda] = useState<any[]>([])
  const [isAgendaLoading, setIsAgendaLoading] = useState(false)
  const { user, isUserLoading } = useUser()
  const db = useFirestore()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // GLOBAL SETTINGS: Use shared village settings
  const villageSettingsRef = useMemoFirebase(() => {
    if (!db) return null
    return doc(db, "settings", "village")
  }, [db])
  const { data: villageSettings } = useDoc(villageSettingsRef)

  const fetchTodayAgenda = useCallback(async () => {
    setIsAgendaLoading(true);
    try {
      const calendarId = villageSettings?.googleCalendarId || GOOGLE_CONFIG.calendarId;
      const localDateStr = format(new Date(), "yyyy-MM-dd");
      const res = await callAppsScript({
        action: 'getCalendar',
        calendarId: calendarId,
        date: localDateStr
      });

      if (res && res.success && res.items) {
        setTodayAgenda(res.items);
      } else {
        setTodayAgenda([]);
      }
    } catch (err) {
      console.warn("Dashboard Agenda fetch error:", err);
      setTodayAgenda([]);
    } finally {
      setIsAgendaLoading(false);
    }
  }, [villageSettings]);

  useEffect(() => {
    if (mounted && villageSettings) {
      fetchTodayAgenda();
    }
  }, [mounted, fetchTodayAgenda, villageSettings]);

  // GLOBAL COLLECTIONS: Shared village data
  const kegiatanQuery = useMemoFirebase(() => {
    if (!db || !user) return null
    return query(
      collection(db, "kegiatans"),
      orderBy("uploadDate", "desc"),
      limit(2)
    )
  }, [db, user])

  const { data: kegiatans, isLoading: isKegiatanLoading } = useCollection(kegiatanQuery)

  const sppdQuery = useMemoFirebase(() => {
    if (!db || !user) return null
    return query(
      collection(db, "sppds"),
      orderBy("expenseDate", "desc"),
      limit(3)
    )
  }, [db, user])

  const { data: sppds } = useCollection(sppdQuery)

  if (isUserLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#F8FAFC] dark:bg-[#060b11]">
        <div className="h-12 w-12 rounded-2xl bg-[#070b10] flex items-center justify-center shadow-sm">
          <Loader2 className="h-6 w-6 animate-spin text-teal-400" />
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 p-4 md:p-8 pb-24 md:pb-8 font-sans">
      {/* Header Section */}
      <header className="neu-dashboard-card p-5 sm:p-6 rounded-[24px] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-2xl neu-inset text-emerald-800 flex items-center justify-center border border-white/60 shrink-0">
            <LayoutDashboard className="h-6 w-6 sm:h-7 sm:w-7 text-emerald-800" />
          </div>
          <div>
            <div className="inline-flex items-center gap-2 neu-pill text-emerald-800 px-3 py-0.5 text-[9px] font-condensed font-extrabold uppercase tracking-wider mb-1">
              <Sparkles className="h-3 w-3 text-emerald-700" />
              Sistem Terpadu Pemdes
            </div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-condensed font-extrabold uppercase tracking-tight text-slate-900 leading-tight">
              Dashboard Operasional Desa
            </h1>
            <p className="text-slate-600 text-xs sm:text-sm font-medium">Pusat database dokumen, kegiatan aparatur, SPPD, dan agenda Desa Sampeldes.</p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Link href="/manajemen/agenda">
            <Button variant="outline" size="sm" className="neu-btn h-10 px-4 rounded-xl text-slate-800 text-xs font-bold gap-1.5 active:scale-95 transition-all">
              <Calendar className="h-4 w-4 text-emerald-700" />
              <span>Kalender Agenda</span>
            </Button>
          </Link>
        </div>
      </header>

      {/* KPI Statistic Cards */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="neu-dashboard-card rounded-[22px] p-4 sm:p-5 hover:scale-[1.02] transition-all duration-300 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 font-condensed">Laporan</span>
            <div className="h-9 w-9 rounded-xl neu-inset text-emerald-800 flex items-center justify-center border border-white/60">
              <FileText className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-condensed tracking-tight">
              {kegiatans?.length || 0}
            </div>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">Database Dokumentasi</p>
          </div>
        </div>

        <div className="neu-dashboard-card rounded-[22px] p-4 sm:p-5 hover:scale-[1.02] transition-all duration-300 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 font-condensed">SPPD</span>
            <div className="h-9 w-9 rounded-xl neu-inset text-emerald-800 flex items-center justify-center border border-white/60">
              <Map className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-condensed tracking-tight">
              {sppds?.length || 0}
            </div>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">Histori Perjalanan</p>
          </div>
        </div>

        <div className="neu-dashboard-card rounded-[22px] p-4 sm:p-5 hover:scale-[1.02] transition-all duration-300 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 font-condensed">Anggaran</span>
            <div className="h-9 w-9 rounded-xl neu-inset text-emerald-800 flex items-center justify-center border border-white/60">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-condensed tracking-tight">
              85%
            </div>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">Realisasi APBDes 2026</p>
          </div>
        </div>

        <div className="neu-dashboard-card rounded-[22px] p-4 sm:p-5 hover:scale-[1.02] transition-all duration-300 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 font-condensed">Kehadiran</span>
            <div className="h-9 w-9 rounded-xl neu-inset text-emerald-800 flex items-center justify-center border border-white/60">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-condensed tracking-tight">
              100%
            </div>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">Staff Siaga Kantor</p>
          </div>
        </div>
      </section>

      {/* Main Grid: Agenda & Action Panels */}
      <div className="grid lg:grid-cols-3 gap-6 md:gap-8">
        <div className="lg:col-span-2 space-y-6 md:space-y-8">
          {/* Agenda Hari Ini */}
          <div className="neu-dashboard-card rounded-[24px] overflow-hidden">
            <div className="p-4 sm:p-5 bg-gradient-to-r from-[#0d1520] via-[#101b28] to-[#0a111a] text-white flex items-center justify-between border-b border-white/10 shadow-[0_2px_10px_rgba(0,0,0,0.3)]">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-xl bg-white/10 text-teal-400 flex items-center justify-center border border-white/10 shadow-[inset_1px_1px_2px_rgba(255,255,255,0.1)]">
                  <Calendar className="h-4.5 w-4.5" />
                </div>
                <div>
                  <h2 className="text-sm sm:text-base font-condensed font-extrabold uppercase tracking-tight text-white">
                    Agenda Hari Ini
                  </h2>
                  <p className="text-[10px] sm:text-[11px] text-white/60">Sinkronisasi langsung kalender desa</p>
                </div>
              </div>
              <button
                type="button"
                onClick={fetchTodayAgenda}
                title="Muat ulang agenda"
                className="h-8 w-8 rounded-xl bg-white/10 hover:bg-white/20 text-teal-400 flex items-center justify-center border border-white/15 shadow-[inset_1px_1px_2px_rgba(255,255,255,0.1),2px_2px_6px_rgba(0,0,0,0.3)] active:scale-95 transition-all"
              >
                <RefreshCw className={cn("h-4 w-4", isAgendaLoading && "animate-spin")} />
              </button>
            </div>

            <div className="divide-y divide-black/[0.04]">
              {isAgendaLoading ? (
                <div className="p-10 flex flex-col items-center justify-center gap-2">
                  <Loader2 className="h-6 w-6 animate-spin text-emerald-700" />
                  <p className="text-xs text-slate-500 font-medium">Menghubungkan ke Google Calendar...</p>
                </div>
              ) : todayAgenda.length > 0 ? (
                todayAgenda.map((agenda, i) => (
                  <div key={i} className="p-4 flex items-center gap-4 hover:bg-black/[0.02] transition-colors">
                    <div className="h-10 w-10 rounded-xl neu-inset text-emerald-800 flex items-center justify-center shrink-0 border border-white/60">
                      <Clock className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-slate-900 truncate">{agenda.summary}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <MapPin className="h-3 w-3 text-slate-400" />
                        <p className="text-[10px] text-slate-500 uppercase font-semibold">{agenda.location || "Balai Desa Sampeldes"}</p>
                      </div>
                    </div>
                    <Badge className="neu-pill-elevated bg-teal-500 text-slate-950 font-bold border-none text-[9px] uppercase tracking-wider px-2.5 py-0.5 rounded-full">
                      AKTIF
                    </Badge>
                  </div>
                ))
              ) : (
                <div className="p-8 md:p-12 text-center flex flex-col items-center gap-2">
                  <div className="h-10 w-10 rounded-full neu-inset text-slate-400 flex items-center justify-center mb-1">
                    <Calendar className="h-5 w-5" />
                  </div>
                  <p className="text-xs text-slate-500 font-medium italic">Tidak ada agenda dinas yang dijadwalkan untuk hari ini.</p>
                </div>
              )}
            </div>
          </div>

          {/* Laporan Desa Terbaru */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base sm:text-lg font-condensed font-extrabold uppercase tracking-tight text-slate-900">
                  Laporan Desa Terbaru
                </h3>
                <p className="text-[11px] text-slate-500">Histori dokumentasi aktivitas dan pembangunan desa</p>
              </div>
              <Button variant="ghost" size="sm" asChild className="neu-btn text-slate-900 font-condensed font-bold text-xs uppercase rounded-xl h-8 px-3">
                <Link href="/manajemen/kegiatan" className="flex items-center gap-1">
                  Lihat Semua <ChevronRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {isKegiatanLoading ? (
                <div className="col-span-full py-12 flex flex-col items-center justify-center gap-2 neu-dashboard-card rounded-[22px]">
                  <Loader2 className="h-6 w-6 animate-spin text-emerald-700" />
                  <p className="text-xs text-slate-500 font-medium">Memuat dokumentasi...</p>
                </div>
              ) : (kegiatans || []).length > 0 ? (
                kegiatans?.map((item) => (
                  <KegiatanCard
                    key={item.id}
                    kegiatan={{
                      ...item,
                      imageUrl: item.imageUrls?.[0] === "Tersimpan di Drive" ? "https://picsum.photos/seed/" + item.id + "/600/400" : (item.imageUrls?.[0] || `https://picsum.photos/seed/${item.id}/600/400`)
                    }}
                  />
                ))
              ) : (
                <div className="col-span-full py-12 text-center neu-inset rounded-[22px] border border-white/60">
                  <p className="text-xs text-slate-500 italic">Belum ada dokumentasi tercatat di database.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Quick Action & SPPD Tracking */}
        <div className="space-y-6 md:space-y-8">
          {/* Quick Action Card (Obsidian Neumorphic Card) */}
          <div className="neu-dashboard-card-dark text-white rounded-[24px] p-5 sm:p-6 space-y-4">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 text-teal-400 px-2.5 py-0.5 text-[9px] font-condensed font-black uppercase tracking-wider mb-2 border border-white/10">
                Aksi Cepat Pemdes
              </div>
              <h3 className="text-base sm:text-lg font-condensed font-extrabold uppercase tracking-tight text-white">
                Input Data & Pengajuan
              </h3>
              <p className="text-[11px] text-white/60">Akses langsung pencatatan dan administrasi aparatur</p>
            </div>

            <div className="space-y-3 pt-1">
              <Dialog open={isKegiatanOpen} onOpenChange={setIsKegiatanOpen}>
                <DialogTrigger asChild>
                  <Button className="w-full h-12 justify-start gap-3.5 text-xs sm:text-sm font-condensed font-extrabold uppercase tracking-wider rounded-xl bg-gradient-to-r from-teal-500 to-emerald-600 text-white shadow-lg hover:from-teal-400 hover:to-emerald-500 active:scale-95 transition-all">
                    <div className="h-7 w-7 rounded-lg bg-slate-950/20 flex items-center justify-center shrink-0">
                      <Plus className="h-4 w-4" />
                    </div>
                    <span>Input Laporan Desa</span>
                    <ArrowUpRight className="h-4 w-4 ml-auto opacity-70" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="w-[95vw] sm:max-w-2xl md:max-w-3xl max-h-[92vh] overflow-y-auto p-6 sm:p-8 rounded-[2.5rem] bg-white dark:bg-[#081d27] shadow-2xl border border-white/80 text-slate-900">
                  <DialogHeader className="pb-3 border-b border-stone-300/40">
                    <DialogTitle className="text-xl sm:text-2xl font-condensed font-black text-slate-900 uppercase tracking-tight">Input Laporan Kegiatan</DialogTitle>
                    <DialogDescription className="text-xs font-bold uppercase tracking-wider text-stone-500">Dokumentasikan kegiatan pembangunan, rapat, atau kemasyarakatan.</DialogDescription>
                  </DialogHeader>
                  <KegiatanUpload onSuccess={() => setIsKegiatanOpen(false)} />
                </DialogContent>
              </Dialog>

              <Dialog open={isSppdOpen} onOpenChange={setIsSppdOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="w-full h-12 justify-start gap-3.5 text-xs sm:text-sm font-condensed font-extrabold uppercase tracking-wider rounded-xl bg-white/5 hover:bg-white/10 text-white border border-white/15 shadow-[inset_1px_1px_2px_rgba(255,255,255,0.05),3px_3px_10px_rgba(0,0,0,0.35)] active:scale-95 transition-all">
                    <div className="h-7 w-7 rounded-lg bg-white/10 flex items-center justify-center text-teal-400 shrink-0 border border-white/10">
                      <Map className="h-4 w-4" />
                    </div>
                    <span>Pengajuan SPPD Baru</span>
                    <ArrowUpRight className="h-4 w-4 ml-auto opacity-70" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="w-[95vw] sm:max-w-2xl md:max-w-3xl max-h-[92vh] overflow-y-auto p-6 sm:p-8 rounded-[2.5rem] bg-white dark:bg-[#081d27] shadow-2xl border border-white/80 text-slate-900">
                  <DialogHeader className="pb-3 border-b border-stone-300/40">
                    <DialogTitle className="text-xl sm:text-2xl font-condensed font-black text-slate-900 uppercase tracking-tight">Pengajuan SPPD Baru</DialogTitle>
                    <DialogDescription className="text-xs font-bold uppercase tracking-wider text-stone-500">Input rincian surat perintah perjalanan dinas aparatur desa.</DialogDescription>
                  </DialogHeader>
                  <SppdUpload onSuccess={() => setIsSppdOpen(false)} />
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* SPPD Status */}
          <div className="neu-dashboard-card rounded-[24px] p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-condensed font-extrabold text-slate-900 uppercase tracking-tight text-sm sm:text-base">
                Status Pengajuan SPPD
              </h3>
              <Link href="/manajemen/sppd" className="text-[11px] font-condensed font-bold uppercase text-emerald-800 hover:text-emerald-950">
                Semua SPPD &rarr;
              </Link>
            </div>

            <div className="space-y-2.5">
              {sppds && sppds.length > 0 ? (
                sppds.map((sppd, i) => (
                  <div key={i} className="neu-inset flex items-center gap-3.5 p-3.5 rounded-2xl border border-white/60">
                    <div className={cn(
                      "h-10 w-10 rounded-xl flex items-center justify-center shrink-0 border",
                      sppd.approvalStatus === 'approved'
                        ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                        : 'bg-amber-100 text-amber-800 border-amber-300'
                    )}>
                      {sppd.approvalStatus === 'approved' ? (
                        <CheckCircle2 className="h-5 w-5" />
                      ) : (
                        <Clock className="h-5 w-5" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-slate-900 truncate">{sppd.description || "Dinas Luar Kantor"}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <MapPin className="h-2.5 w-2.5 text-slate-400" />
                        <p className="text-[9px] font-bold text-slate-500 uppercase truncate">{sppd.destination || "Tujuan Dinas"}</p>
                      </div>
                    </div>
                    <Badge variant="outline" className={cn(
                      "text-[8px] font-bold uppercase tracking-wider rounded-md",
                      sppd.approvalStatus === 'approved'
                        ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                        : 'bg-amber-100 text-amber-800 border-amber-300'
                    )}>
                      {sppd.approvalStatus === 'approved' ? 'DISETUJUI' : 'PROSES'}
                    </Badge>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center neu-inset rounded-2xl text-slate-400 border border-white/60">
                  <p className="text-[10px] font-bold uppercase">Belum ada pengajuan SPPD aktif.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
