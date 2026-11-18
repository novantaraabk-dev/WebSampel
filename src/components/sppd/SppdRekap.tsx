
"use client"

import { useCollection, useUser, useFirestore, useMemoFirebase } from "@/firebase"
import { collection } from "firebase/firestore"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, CheckCircle2, Clock, Loader2, Wallet, ChevronRight, Users, FileText, TrendingUp, AlertCircle, MapPin } from "lucide-react"
import { Button } from "@/components/ui/button"

export function SppdRekap() {
  const { user } = useUser()
  const db = useFirestore()

  const sppdQuery = useMemoFirebase(() => {
    if (!db || !user) return null
    return collection(db, "users", user.uid, "sppds")
  }, [db, user])

  const { data: sppds, isLoading, error } = useCollection(sppdQuery)

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3 bg-card rounded-3xl border border-accent/10">
        <Loader2 className="h-10 w-10 animate-spin text-accent" />
        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Sinkronisasi Data...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="py-12 text-center space-y-4 bg-card rounded-3xl border border-destructive/10">
        <AlertCircle className="h-10 w-10 text-destructive mx-auto" />
        <p className="text-xs font-bold text-destructive uppercase">Koneksi Bermasalah</p>
        <Button variant="ghost" size="sm" onClick={() => window.location.reload()}>Coba Lagi</Button>
      </div>
    )
  }

  const totalAmount = (sppds || []).reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0)
  const totalPersonel = (sppds || []).reduce((acc, curr) => {
    const companionsCount = curr.companions ? curr.companions.split("\n").filter(Boolean).length : 0
    return acc + 1 + companionsCount
  }, 0)
  const approvedCount = (sppds || []).filter(s => s.approvalStatus === "approved").length
  const pendingCount = (sppds || []).length - approvedCount

  return (
    <div className="space-y-6 pb-20 md:pb-0">
      {/* KPI Cards */}
      <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Realisasi Anggaran */}
        <div className="bg-white dark:bg-[#081d27] border border-slate-200/80 dark:border-white/10 shadow-sm rounded-3xl p-6 relative overflow-hidden">
          <div className="absolute top-2 right-2 p-6 opacity-10 pointer-events-none text-slate-800">
            <Wallet className="h-24 w-24" />
          </div>
          <div className="relative z-10">
            <span className="text-[10px] font-black uppercase tracking-widest text-stone-500">Realisasi Anggaran</span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mt-1 font-condensed">
              Rp {new Intl.NumberFormat('id-ID').format(totalAmount)}
            </h2>
            <div className="mt-4 flex items-center gap-2">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-600/10 text-emerald-800 border border-emerald-600/20 shadow-inner">
                Tahun Anggaran 2026
              </span>
            </div>
          </div>
        </div>

        {/* Total Personel & Berkas */}
        <div className="bg-white dark:bg-[#081d27] border border-slate-200/80 dark:border-white/10 shadow-sm rounded-3xl p-6">
          <div className="grid grid-cols-2 gap-4 h-full items-center">
            <div className="flex flex-col justify-center items-center text-center border-r border-stone-300/40 pr-2">
              <div className="h-11 w-11 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 shadow-xs flex items-center justify-center mb-2">
                <Users className="h-5 w-5 text-emerald-700" />
              </div>
              <p className="text-[9px] font-black text-stone-500 uppercase tracking-wider">Total Personel</p>
              <h3 className="text-2xl font-black text-slate-900 mt-0.5 font-condensed">{totalPersonel}</h3>
            </div>
            <div className="flex flex-col justify-center items-center text-center pl-2">
              <div className="h-11 w-11 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 shadow-xs flex items-center justify-center mb-2">
                <FileText className="h-5 w-5 text-stone-700" />
              </div>
              <p className="text-[9px] font-black text-stone-500 uppercase tracking-wider">Total Berkas</p>
              <h3 className="text-2xl font-black text-slate-900 mt-0.5 font-condensed">{sppds?.length || 0}</h3>
            </div>
          </div>
        </div>
      </section>

      {/* Mini Indicators */}
      <div className="grid grid-cols-3 gap-3">
        <div className="p-3.5 bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 shadow-xs rounded-2xl text-center">
          <p className="text-[8px] font-black text-emerald-700 uppercase mb-0.5 tracking-wider">Disetujui</p>
          <p className="text-xl font-black text-emerald-800 font-condensed">{approvedCount}</p>
        </div>
        <div className="p-3.5 bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 shadow-xs rounded-2xl text-center">
          <p className="text-[8px] font-black text-amber-700 uppercase mb-0.5 tracking-wider">Proses</p>
          <p className="text-xl font-black text-amber-800 font-condensed">{pendingCount}</p>
        </div>
        <div className="p-3.5 bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 shadow-xs rounded-2xl text-center">
          <p className="text-[8px] font-black text-stone-600 uppercase mb-0.5 tracking-wider">Efisiensi</p>
          <p className="text-xl font-black text-slate-900 font-condensed">92%</p>
        </div>
      </div>

      {/* History List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <h3 className="font-black text-slate-800 uppercase tracking-tight text-xs flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-emerald-700" />
            Riwayat Perjalanan Terakhir
          </h3>
        </div>
        <div className="grid gap-3">
          {sppds && sppds.length > 0 ? (
            sppds.map((sppd) => (
              <div 
                key={sppd.id} 
                className="flex items-start gap-4 p-4 rounded-2xl bg-white dark:bg-[#081d27] border border-slate-200/80 dark:border-white/10 shadow-xs hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer group"
              >
                <div className={`h-11 w-11 rounded-2xl flex items-center justify-center shrink-0 mt-0.5 shadow-inner border border-stone-300/40 ${
                  sppd.approvalStatus === "approved" ? "text-emerald-700" : "text-amber-700"
                }`}>
                  {sppd.approvalStatus === "approved" ? <CheckCircle2 className="h-5 w-5" /> : <Clock className="h-5 w-5" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h3 className="font-bold text-sm text-slate-900 leading-tight whitespace-normal break-words group-hover:text-emerald-700 transition-colors">
                      {sppd.description || "Kegiatan Dinas"}
                    </h3>
                    <span className="font-black text-xs text-emerald-800 shrink-0 mt-0.5 font-condensed">
                      Rp {new Intl.NumberFormat('id-ID').format(Number(sppd.amount) || 0)}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] font-bold text-stone-500 uppercase tracking-tight">
                    <div className="flex items-center gap-1">
                      <MapPin className="h-3 w-3 text-stone-400" />
                      <span>{sppd.destination || "-"}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3 text-stone-400" />
                      <span>{sppd.startDate || "-"}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span>{(sppd.officialName || "").split(' - ')[0] || "-"}</span>
                    </div>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-stone-400 opacity-40 group-hover:opacity-100 transition-opacity mt-2" />
              </div>
            ))
          ) : (
            <div className="py-16 text-center text-stone-500 rounded-3xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 shadow-xs">
              <p className="font-bold text-xs uppercase tracking-widest">Belum ada riwayat pengajuan</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
