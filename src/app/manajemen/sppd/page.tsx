"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Loader2, Plane, Printer, Map, PieChart } from "lucide-react"
import Link from "next/link"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { SppdUpload } from "@/components/sppd/SppdUpload"
import { SppdCetakForm } from "@/components/sppd/SppdCetakForm"
import { SppdRekap } from "@/components/sppd/SppdRekap"
import { useUser } from "@/firebase"

export default function SppdPage() {
  const { user, isUserLoading } = useUser()
  const [activeTab, setActiveTab] = useState("pengajuan")

  if (isUserLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#F8FAFC] dark:bg-[#060b11]">
        <div className="h-12 w-12 rounded-2xl bg-[#070b10] flex items-center justify-center shadow-sm">
          <Loader2 className="h-6 w-6 animate-spin text-teal-400" />
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center h-[80vh] gap-4 p-4 text-center font-sans">
        <h2 className="text-xl font-bold font-condensed uppercase text-slate-900">Akses Dibatasi</h2>
        <p className="text-slate-500 text-xs">Silakan login untuk mengelola Manajemen SPPD Desa.</p>
        <Button asChild className="rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-condensed font-extrabold uppercase">
          <Link href="/login">Login Sekarang</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 p-4 md:p-8 max-w-4xl mx-auto font-sans">
      <header className="flex items-center gap-3.5">
        <Button variant="ghost" size="icon" asChild className="rounded-xl h-10 w-10 text-slate-700 hover:bg-stone-200/60">
          <Link href="/manajemen/dashboard">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-condensed font-extrabold text-slate-900 uppercase tracking-tight">
            Manajemen SPPD Desa
          </h1>
          <p className="text-xs text-slate-500 font-medium">Sistem Pengelolaan Biaya Perjalanan Dinas & Cetak Berkas Resmi</p>
        </div>
      </header>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-3 w-full h-13 mb-6 bg-white dark:bg-[#081d27] p-1.5 rounded-2xl shadow-inner border border-stone-300/40 gap-2">
          <TabsTrigger
            value="pengajuan"
            className="rounded-xl gap-2 text-[10px] sm:text-xs font-condensed font-extrabold uppercase text-stone-600 data-[state=active]:bg-white dark:bg-[#081d27] data-[state=active]:text-slate-900 data-[state=active]:shadow-sm data-[state=active]:border data-[state=active]:border-white/80 transition-all cursor-pointer"
          >
            <Map className="h-4 w-4 text-emerald-700" />
            Pengajuan
          </TabsTrigger>
          <TabsTrigger
            value="cetak"
            className="rounded-xl gap-2 text-[10px] sm:text-xs font-condensed font-extrabold uppercase text-stone-600 data-[state=active]:bg-white dark:bg-[#081d27] data-[state=active]:text-slate-900 data-[state=active]:shadow-sm data-[state=active]:border data-[state=active]:border-white/80 transition-all cursor-pointer"
          >
            <Printer className="h-4 w-4 text-sky-700" />
            Cetak Dokumen
          </TabsTrigger>
          <TabsTrigger
            value="rekap"
            className="rounded-xl gap-2 text-[10px] sm:text-xs font-condensed font-extrabold uppercase text-stone-600 data-[state=active]:bg-white dark:bg-[#081d27] data-[state=active]:text-slate-900 data-[state=active]:shadow-sm data-[state=active]:border data-[state=active]:border-white/80 transition-all cursor-pointer"
          >
            <PieChart className="h-4 w-4 text-amber-700" />
            Rekapitulasi
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pengajuan" className="mt-0 space-y-6">
          <div className="bg-white dark:bg-[#081d27] shadow-md border border-white/60 rounded-3xl p-6 sm:p-8">
            <div className="mb-6 flex items-center gap-3.5 pb-4 border-b border-stone-300/40">
              <div className="w-10 h-10 rounded-2xl bg-white dark:bg-[#081d27] shadow-inner border border-stone-300/40 flex items-center justify-center text-emerald-700 shrink-0">
                <Plane className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-condensed font-black text-base sm:text-lg text-slate-900 uppercase tracking-tight leading-tight">Formulir Pengajuan SPPD</h3>
                <p className="text-[10px] sm:text-xs text-stone-500 font-bold uppercase tracking-wider">Input rincian biaya dan tujuan perjalanan dinas</p>
              </div>
            </div>
            <SppdUpload onSuccess={() => setActiveTab("rekap")} />
          </div>
        </TabsContent>

        <TabsContent value="cetak" className="mt-0">
          <div className="bg-white dark:bg-[#081d27] shadow-md border border-white/60 rounded-3xl p-6 sm:p-8">
             <div className="mb-6 flex items-center gap-3.5 pb-4 border-b border-stone-300/40">
              <div className="w-10 h-10 rounded-2xl bg-white dark:bg-[#081d27] shadow-inner border border-stone-300/40 flex items-center justify-center text-sky-700 shrink-0">
                <Printer className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-condensed font-black text-base sm:text-lg text-slate-900 uppercase tracking-tight leading-tight">Cetak Dokumen Resmi</h3>
                <p className="text-[10px] sm:text-xs text-stone-500 font-bold uppercase tracking-wider">Cetak Surat Perintah Tugas & Rincian SPPD Format PDF</p>
              </div>
            </div>
            <SppdCetakForm />
          </div>
        </TabsContent>

        <TabsContent value="rekap" className="mt-0">
          <div className="space-y-6">
            <div className="flex items-center gap-2.5 px-1">
              <div className="w-8 h-8 rounded-xl bg-white dark:bg-[#081d27] shadow-inner border border-stone-300/40 flex items-center justify-center text-amber-700">
                <PieChart className="h-4 w-4" />
              </div>
              <h3 className="font-condensed font-black uppercase text-slate-900 text-base tracking-tight">Rekapitulasi Histori SPPD</h3>
            </div>
            <SppdRekap />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
