"use client"

import { useState, useMemo } from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Progress } from "@/components/ui/progress"
import { useToast } from "@/hooks/use-toast"
import {
  ArrowLeft,
  BarChart3,
  PieChart as PieChartIcon,
  Download,
  Calendar,
  Loader2,
  Trophy,
  AlertTriangle,
  Building2,
  CheckCircle2,
  FileSpreadsheet,
  Wallet,
  Landmark,
  TrendingUp,
  UserCheck,
} from "lucide-react"
import Link from "next/link"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts"
import * as XLSX from "xlsx"
import { useUser, useFirestore } from "@/firebase"
import { DhkpRecord, Kolektor, TransaksiPbb, getOfficialDusun } from "@/types/pbb"

import { usePbbContext } from "@/context/PbbContext"

export default function PbbMonitoringPage() {
  const { user } = useUser()
  const db = useFirestore()
  const { toast } = useToast()

  const {
    selectedYear,
    setSelectedYear,
    dhkpList,
    kolektorList,
    transaksiList,
    loadingDhkp,
  } = usePbbContext()

  const [activeTab, setActiveTab] = useState<string>("dashboard")
  const [filterRtTunggakan, setFilterRtTunggakan] = useState("all")
  const [filterPenarikTunggakan, setFilterPenarikTunggakan] = useState("all")

  const formatIDR = (val: number) =>
    `Rp ${new Intl.NumberFormat("id-ID").format(val)}`

  // Dashboard Stats & Visual Data
  const stats = useMemo(() => {
    const data = dhkpList || []
    const totalTarget = data.reduce((acc, curr) => acc + (curr.ketetapanNominal || 0), 0)
    const lunasList = data.filter((d) => d.statusBayar === "Lunas")
    const totalRealisasi = lunasList.reduce((acc, curr) => acc + (curr.ketetapanNominal || 0), 0)
    const totalTunggakan = totalTarget - totalRealisasi
    const persentase = totalTarget > 0 ? (totalRealisasi / totalTarget) * 100 : 0

    // Realization by Dusun chart data
    const dusunMap: Record<string, { target: number; realisasi: number }> = {}
    data.forEach((d) => {
      const officialD = getOfficialDusun(
        d.dusun,
        d.rw,
        d.rt,
        `${d.alamatWp || ""} ${d.alamatOp || ""}`
      )
      if (!dusunMap[officialD]) dusunMap[officialD] = { target: 0, realisasi: 0 }
      dusunMap[officialD].target += d.ketetapanNominal || 0
      if (d.statusBayar === "Lunas") {
        dusunMap[officialD].realisasi += d.ketetapanNominal || 0
      }
    })

    const dusunChart = Object.entries(dusunMap).map(([name, val]) => ({
      name,
      Target: val.target,
      Realisasi: val.realisasi,
    }))

    // Realization pie chart
    const pieChart = [
      { name: "Realisasi Lunas", value: totalRealisasi, color: "#10b981" },
      { name: "Sisa Tunggakan", value: totalTunggakan, color: "#e11d48" },
    ]

    // Leaderboard collector performance ranking
    const collectors = kolektorList || []
    const leaderboard = collectors.map((kol) => {
      const assigned = data.filter((d) => d.penarikId === kol.id)
      const target = assigned.reduce((a, c) => a + (c.ketetapanNominal || 0), 0)
      const real = assigned
        .filter((d) => d.statusBayar === "Lunas")
        .reduce((a, c) => a + (c.ketetapanNominal || 0), 0)
      const pct = target > 0 ? Math.round((real / target) * 100) : 0
      return { ...kol, target, real, pct, nopCount: assigned.length }
    }).sort((a, b) => b.pct - a.pct)

    return {
      totalTarget,
      totalRealisasi,
      totalTunggakan,
      persentase: Math.round(persentase),
      dusunChart,
      pieChart,
      leaderboard,
    }
  }, [dhkpList, kolektorList])

  // Progres Bendahara (Monitoring Flow Uang Setoran PBB Desa)
  const bendaharaStats = useMemo(() => {
    const txList = transaksiList || []

    // 1. Total Uang Sudah Disetorkan ke Bank / Bapenda
    const diBankList = txList.filter(
      (t) => t.statusVerifikasi === "Disetorkan ke Bank/Bapenda"
    )
    const totalDiBank = diBankList.reduce((a, c) => a + (c.totalBayar || 0), 0)

    // 2. Total Uang Masih Dipegang Bendahara / Desa
    const diDesaList = txList.filter(
      (t) => t.statusVerifikasi === "Disetorkan ke Desa"
    )
    const totalDiDesa = diDesaList.reduce((a, c) => a + (c.totalBayar || 0), 0)

    // 3. Total Uang Masih Dipegang Kolektor / Penarik
    const diKolektorList = txList.filter(
      (t) => !t.statusVerifikasi || t.statusVerifikasi === "Diterima Kolektor"
    )
    const totalDiKolektor = diKolektorList.reduce(
      (a, c) => a + (c.totalBayar || 0),
      0
    )

    const totalUangTerkumpul = totalDiBank + totalDiDesa + totalDiKolektor
    const pctBank = totalUangTerkumpul > 0 ? Math.round((totalDiBank / totalUangTerkumpul) * 100) : 0
    const pctDesa = totalUangTerkumpul > 0 ? Math.round((totalDiDesa / totalUangTerkumpul) * 100) : 0
    const pctKolektor = totalUangTerkumpul > 0 ? Math.round((totalDiKolektor / totalUangTerkumpul) * 100) : 0

    const bendaharaPieChart = [
      { name: "Sudah di Bank/Bapenda", value: totalDiBank, color: "#10b981" },
      { name: "Pegang Bendahara/Desa", value: totalDiDesa, color: "#3b82f6" },
      { name: "Pegang Penarik/Kolektor", value: totalDiKolektor, color: "#f59e0b" },
    ]

    return {
      totalDiBank,
      totalDiDesa,
      totalDiKolektor,
      totalUangTerkumpul,
      pctBank,
      pctDesa,
      pctKolektor,
      bendaharaPieChart,
    }
  }, [transaksiList])

  // Diagram Progres Realisasi per Penarik (Kolektor)
  const penarikChartData = useMemo(() => {
    const collectors = kolektorList || []
    const dhkp = dhkpList || []

    return collectors.map((kol) => {
      const assigned = dhkp.filter((d) => d.penarikId === kol.id)
      const target = assigned.reduce((a, c) => a + (c.ketetapanNominal || 0), 0)
      const realisasi = assigned
        .filter((d) => d.statusBayar === "Lunas")
        .reduce((a, c) => a + (c.ketetapanNominal || 0), 0)
      const pct = target > 0 ? Math.round((realisasi / target) * 100) : 0

      return {
        name: kol.nama,
        Target: target,
        Realisasi: realisasi,
        pct,
        nopCount: assigned.length,
      }
    })
  }, [kolektorList, dhkpList])

  // Filtered Unpaid List (Tunggakan)
  const tunggakanList = useMemo(() => {
    return (dhkpList || []).filter((d) => {
      const isUnpaid = d.statusBayar !== "Lunas"
      const matchRt = filterRtTunggakan === "all" || d.rt === filterRtTunggakan
      const matchPenarik =
        filterPenarikTunggakan === "all"
          ? true
          : filterPenarikTunggakan === "unassigned"
          ? !d.penarikId
          : d.penarikId === filterPenarikTunggakan
      return isUnpaid && matchRt && matchPenarik
    })
  }, [dhkpList, filterRtTunggakan, filterPenarikTunggakan])

  // EXPORT TUNGGAKAN TO EXCEL (Door-to-door sheet)
  const handleExportTunggakan = () => {
    if (tunggakanList.length === 0) return
    const exportData = tunggakanList.map((item, idx) => ({
      No: idx + 1,
      NOP: item.nop,
      "Nama Wajib Pajak": item.namaWp,
      "Alamat WP": item.alamatWp,
      "Alamat OP": item.alamatOp,
      RT: item.rt,
      RW: item.rw,
      Dusun: getOfficialDusun(item.dusun, item.rw, item.rt, `${item.alamatWp || ""} ${item.alamatOp || ""}`),
      "Tagihan PBB (Rp)": item.ketetapanNominal,
      "Petugas Penarik": item.penarikNama || "-",
    }))

    const ws = XLSX.utils.json_to_sheet(exportData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, `Tunggakan_RT_${filterRtTunggakan}`)
    XLSX.writeFile(
      wb,
      `Lembar_Penagihan_PBB_DoorToDoor_RT_${filterRtTunggakan}_${selectedYear}.xlsx`
    )

    toast({
      title: "Ekspor Lembar Penagihan Berhasil",
      description: `Daftar tunggakan PBB untuk RT ${filterRtTunggakan} diunduh.`,
    })
  }

  return (
    <div className="flex flex-col gap-8 p-4 md:p-8 font-sans bg-white dark:bg-[#081d27] min-h-screen">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-6 rounded-[2.5rem] bg-white dark:bg-[#081d27] shadow-md border border-white/70">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            asChild
            className="rounded-2xl h-11 w-11 bg-white dark:bg-[#081d27] text-slate-800 shadow-sm border border-white/70 hover:bg-[#e4e0d9] active:scale-95 transition-all"
          >
            <Link href="/manajemen/dashboard">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-slate-900 uppercase tracking-tight flex items-center gap-2.5">
              <BarChart3 className="h-7 w-7 text-emerald-800" />
              Monitoring & Laporan PBB-P2
            </h1>
            <p className="text-xs text-slate-600 uppercase tracking-wider font-bold">
              Analytics Real-time: Diagram Progres Penarik, Progres Bendahara & Penagihan Field
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-center">
          <Calendar className="h-4 w-4 text-slate-600" />
          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger className="h-11 w-[120px] rounded-2xl font-bold bg-white dark:bg-[#081d27] shadow-inner border border-stone-300/50 text-xs text-slate-900 focus:ring-1 focus:ring-emerald-600">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-white dark:bg-[#081d27] border-white/80 rounded-2xl shadow-lg">
              {["2024", "2025", "2026", "2027", "2028"].map((y) => (
                <SelectItem key={y} value={y} className="font-bold text-xs">
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </header>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-6">
        <TabsList className="grid grid-cols-1 sm:grid-cols-3 h-auto p-2 rounded-2xl bg-white dark:bg-[#081d27] shadow-inner border border-stone-300/40 gap-2 text-slate-700">
          <TabsTrigger
            value="dashboard"
            className="rounded-xl font-bold text-xs uppercase tracking-wider gap-2 py-3 data-[state=active]:bg-white dark:bg-[#081d27] data-[state=active]:text-slate-900 data-[state=active]:shadow-sm data-[state=active]:border data-[state=active]:border-white/80 transition-all"
          >
            <PieChartIcon className="h-4 w-4 text-emerald-700" />
            Dashboard Realisasi Visual
          </TabsTrigger>
          <TabsTrigger
            value="tunggakan"
            className="rounded-xl font-bold text-xs uppercase tracking-wider gap-2 py-3 data-[state=active]:bg-white dark:bg-[#081d27] data-[state=active]:text-slate-900 data-[state=active]:shadow-sm data-[state=active]:border data-[state=active]:border-white/80 transition-all"
          >
            <AlertTriangle className="h-4 w-4 text-rose-600" />
            Daftar Tunggakan (Door-to-Door)
          </TabsTrigger>
          <TabsTrigger
            value="bank"
            className="rounded-xl font-bold text-xs uppercase tracking-wider gap-2 py-3 data-[state=active]:bg-white dark:bg-[#081d27] data-[state=active]:text-slate-900 data-[state=active]:shadow-sm data-[state=active]:border data-[state=active]:border-white/80 transition-all"
          >
            <Building2 className="h-4 w-4 text-blue-700" />
            Laporan Setoran ke Bank/Bapenda
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: DASHBOARD REALISASI VISUAL */}
        <TabsContent value="dashboard" className="space-y-8">
          {/* Section 1: Main Realization Indicator Card */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="rounded-[2.5rem] bg-[#0e1620] text-white p-8 overflow-hidden relative shadow-lg border border-white/10 flex flex-col justify-between">
              <div>
                <div className="text-xs font-black uppercase tracking-widest text-amber-300">
                  Persentase Realisasi PBB Desa TA {selectedYear}
                </div>
                <div className="text-5xl font-black mt-2 text-white">{stats.persentase}%</div>
                <div className="mt-4">
                  <Progress value={stats.persentase} className="h-3 rounded-full bg-white/20" />
                </div>
              </div>
              <div className="mt-6 pt-4 border-t border-white/10 flex justify-between text-xs font-bold">
                <div>
                  <p className="opacity-70 text-[10px] uppercase text-slate-400">Target Desa</p>
                  <p className="text-amber-200">{formatIDR(stats.totalTarget)}</p>
                </div>
                <div className="text-right">
                  <p className="opacity-70 text-[10px] uppercase text-slate-400">Terealisasi</p>
                  <p className="text-emerald-400">{formatIDR(stats.totalRealisasi)}</p>
                </div>
              </div>
            </Card>

            {/* Recharts Pie Chart */}
            <Card className="rounded-[2.5rem] bg-white dark:bg-[#081d27] shadow-lg border border-white/80 p-7 md:col-span-2 overflow-hidden flex flex-col justify-between">
              <div>
                <CardTitle className="text-base font-extrabold uppercase text-slate-900">
                  Komposisi Realisasi vs Sisa Tunggakan
                </CardTitle>
                <CardDescription className="text-xs font-medium text-slate-600">
                  Visualisasi perbandingan dana PBB yang sudah masuk vs belum lunas
                </CardDescription>
              </div>

              <div className="h-[180px] w-full flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={stats.pieChart}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={75}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {stats.pieChart.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(val: number) => formatIDR(val)} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="flex justify-center gap-6 text-xs font-bold pt-3 border-t border-stone-300/50">
                <div className="flex items-center gap-2 text-emerald-800">
                  <div className="h-3.5 w-3.5 rounded-full bg-emerald-600 shadow-xs"></div>
                  <span>Realisasi Lunas: {formatIDR(stats.totalRealisasi)}</span>
                </div>
                <div className="flex items-center gap-2 text-rose-700">
                  <div className="h-3.5 w-3.5 rounded-full bg-rose-600 shadow-xs"></div>
                  <span>Tunggakan: {formatIDR(stats.totalTunggakan)}</span>
                </div>
              </div>
            </Card>
          </div>

          {/* SECTION 2: PROGRES BENDAHARA DESA (MONITORING KAS & ALUR SETORAN) */}
          <Card className="rounded-[2.5rem] bg-white dark:bg-[#081d27] shadow-lg border border-white/80 overflow-hidden p-7 sm:p-8 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-stone-300/50 pb-5 gap-3">
              <div>
                <CardTitle className="text-lg font-extrabold uppercase text-slate-900 flex items-center gap-2.5">
                  <Building2 className="h-5 w-5 text-emerald-800" />
                  Progres Bendahara Desa (Monitoring Kas & Alur Setoran)
                </CardTitle>
                <CardDescription className="text-xs font-medium text-slate-600">
                  Rincian keberadaan uang setoran PBB: Uang Pegang Bendahara/Desa vs Uang Sudah Disetor ke Bank
                </CardDescription>
              </div>
              <Badge className="bg-emerald-800 text-white font-extrabold text-xs px-4 py-1.5 self-start sm:self-center rounded-xl shadow-xs">
                Total Terkumpul: {formatIDR(bendaharaStats.totalUangTerkumpul)}
              </Badge>
            </div>

            {/* KPI Cards Grid for Bendahara Progress */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Card 1: Total Uang Masih Dipegang Bendahara / Desa */}
              <div className="p-6 rounded-[2rem] bg-white dark:bg-[#081d27] shadow-inner border border-stone-300/40 space-y-3 relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-600">
                    Uang Dipegang Bendahara / Desa
                  </span>
                  <Wallet className="h-6 w-6 text-blue-700" />
                </div>
                <div className="text-2xl sm:text-3xl font-black text-slate-900">
                  {formatIDR(bendaharaStats.totalDiDesa)}
                </div>
                <div className="flex items-center justify-between text-xs font-bold pt-2 border-t border-stone-300/40">
                  <span className="text-slate-600">Status: Disetorkan ke Desa</span>
                  <Badge variant="outline" className="bg-white dark:bg-[#081d27] text-blue-800 border-white/80 shadow-xs font-bold">
                    {bendaharaStats.pctDesa}%
                  </Badge>
                </div>
              </div>

              {/* Card 2: Total Uang Sudah Disetorkan ke Bank / Bapenda */}
              <div className="p-6 rounded-[2rem] bg-white dark:bg-[#081d27] shadow-inner border border-stone-300/40 space-y-3 relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-600">
                    Uang Sudah Disetorkan ke Bank
                  </span>
                  <Landmark className="h-6 w-6 text-emerald-700" />
                </div>
                <div className="text-2xl sm:text-3xl font-black text-slate-900">
                  {formatIDR(bendaharaStats.totalDiBank)}
                </div>
                <div className="flex items-center justify-between text-xs font-bold pt-2 border-t border-stone-300/40">
                  <span className="text-slate-600">Status: Disetor Bank/Bapenda</span>
                  <Badge variant="outline" className="bg-white dark:bg-[#081d27] text-emerald-800 border-white/80 shadow-xs font-bold">
                    {bendaharaStats.pctBank}%
                  </Badge>
                </div>
              </div>

              {/* Card 3: Total Uang Masih Dipegang Penarik / Kolektor */}
              <div className="p-6 rounded-[2rem] bg-white dark:bg-[#081d27] shadow-inner border border-stone-300/40 space-y-3 relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-600">
                    Uang Masih di Penarik (Kolektor)
                  </span>
                  <UserCheck className="h-6 w-6 text-amber-600" />
                </div>
                <div className="text-2xl sm:text-3xl font-black text-slate-900">
                  {formatIDR(bendaharaStats.totalDiKolektor)}
                </div>
                <div className="flex items-center justify-between text-xs font-bold pt-2 border-t border-stone-300/40">
                  <span className="text-slate-600">Status: Diterima Kolektor</span>
                  <Badge variant="outline" className="bg-white dark:bg-[#081d27] text-amber-800 border-white/80 shadow-xs font-bold">
                    {bendaharaStats.pctKolektor}%
                  </Badge>
                </div>
              </div>
            </div>

            {/* Flow Visual Breakdown */}
            <div className="p-5 rounded-3xl bg-white dark:bg-[#081d27] shadow-inner border border-stone-300/40 space-y-3">
              <div className="flex justify-between items-center text-xs font-extrabold uppercase text-slate-800">
                <span>Alur Proporsi Kas PBB Desa</span>
                <span className="text-emerald-800">{bendaharaStats.pctBank}% Sudah di Bank</span>
              </div>
              <div className="h-4 w-full rounded-full bg-stone-300/60 overflow-hidden flex shadow-inner">
                <div
                  style={{ width: `${bendaharaStats.pctBank}%` }}
                  className="bg-emerald-600 h-full transition-all"
                  title={`Bank: ${formatIDR(bendaharaStats.totalDiBank)}`}
                />
                <div
                  style={{ width: `${bendaharaStats.pctDesa}%` }}
                  className="bg-blue-600 h-full transition-all"
                  title={`Desa: ${formatIDR(bendaharaStats.totalDiDesa)}`}
                />
                <div
                  style={{ width: `${bendaharaStats.pctKolektor}%` }}
                  className="bg-amber-500 h-full transition-all"
                  title={`Kolektor: ${formatIDR(bendaharaStats.totalDiKolektor)}`}
                />
              </div>
              <div className="flex flex-wrap gap-5 text-xs font-bold text-slate-700 justify-center pt-1">
                <span className="flex items-center gap-1.5">
                  <div className="h-3 w-3 rounded-full bg-emerald-600" /> Disetor Bank ({bendaharaStats.pctBank}%)
                </span>
                <span className="flex items-center gap-1.5">
                  <div className="h-3 w-3 rounded-full bg-blue-600" /> Pegang Bendahara ({bendaharaStats.pctDesa}%)
                </span>
                <span className="flex items-center gap-1.5">
                  <div className="h-3 w-3 rounded-full bg-amber-500" /> Pegang Kolektor ({bendaharaStats.pctKolektor}%)
                </span>
              </div>
            </div>
          </Card>

          {/* SECTION 3: DIAGRAM PROGRES REALISASI PER PENARIK PBB (BAR CHART & RANKING) */}
          <Card className="rounded-[2.5rem] bg-white dark:bg-[#081d27] shadow-lg border border-white/80 overflow-hidden p-7 sm:p-8 space-y-6">
            <div className="border-b border-stone-300/50 pb-5">
              <CardTitle className="text-lg font-extrabold uppercase text-slate-900 flex items-center gap-2.5">
                <TrendingUp className="h-5 w-5 text-emerald-800" />
                Diagram Progres Realisasi per Penarik PBB (Kolektor)
              </CardTitle>
              <CardDescription className="text-xs font-medium text-slate-600">
                Grafik perbandingan beban ketetapan PBB vs realisasi setoran per Petugas Penarik (Kolektor)
              </CardDescription>
            </div>

            {/* Recharts Bar Chart: Target vs Realisasi per Kolektor */}
            <div className="h-[280px] w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={penarikChartData} margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
                  <XAxis dataKey="name" tick={{ fontSize: 11, fontWeight: "bold" }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip formatter={(val: number) => formatIDR(val)} />
                  <Legend wrapperStyle={{ fontSize: "12px", fontWeight: "bold" }} />
                  <Bar dataKey="Target" fill="#78716c" radius={[8, 8, 0, 0]} name="Target (Beban Rp)" />
                  <Bar dataKey="Realisasi" fill="#047857" radius={[8, 8, 0, 0]} name="Realisasi Setor (Rp)" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Leaderboard Ranking Cards */}
            <div className="space-y-4 pt-4 border-t border-stone-300/50">
              <div className="flex items-center gap-2 text-sm font-extrabold uppercase text-slate-900">
                <Trophy className="h-4 w-4 text-amber-500" />
                Leaderboard Kinerja Penarik PBB (Perolehan Setoran)
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {stats.leaderboard.map((kol, idx) => (
                  <div
                    key={kol.id}
                    className="flex items-center justify-between p-4 rounded-2xl gap-3 bg-white dark:bg-[#081d27] shadow-inner border border-stone-300/40"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-xl bg-white dark:bg-[#081d27] text-amber-800 font-extrabold text-xs flex items-center justify-center shadow-xs border border-white/80">
                        #{idx + 1}
                      </div>
                      <div>
                        <h4 className="font-extrabold text-xs text-slate-900">{kol.nama}</h4>
                        <p className="text-[10px] text-slate-500 font-semibold">
                          {kol.nopCount} NOP Assigned
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="font-extrabold text-xs text-emerald-800 block">
                        {formatIDR(kol.real)}
                      </span>
                      <span className="text-[10px] text-slate-500 font-semibold block">
                        dari target {formatIDR(kol.target)}
                      </span>
                      <Badge className="bg-emerald-800 text-white font-extrabold text-[10px] px-2.5 py-0.5 mt-1 rounded-lg">
                        {kol.pct}% Realisasi
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* TAB 2: DAFTAR TUNGGAKAN (DOOR TO DOOR SHEET) */}
        <TabsContent value="tunggakan" className="space-y-6">
          <Card className="rounded-[2.5rem] bg-white dark:bg-[#081d27] shadow-lg border border-white/80 overflow-hidden">
            <CardHeader className="p-6 sm:p-7 border-b border-stone-300/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <CardTitle className="text-lg font-extrabold uppercase text-rose-700 flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-rose-600" />
                  Daftar Wajib Pajak Tunggakan (Belum Bayar)
                </CardTitle>
                <CardDescription className="text-xs font-medium text-slate-600">
                  Unduh lembar kerja penagihan door-to-door per RT untuk penagihan langsung ke lapangan
                </CardDescription>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                {/* Filter Penarik */}
                <Select
                  value={filterPenarikTunggakan}
                  onValueChange={setFilterPenarikTunggakan}
                >
                  <SelectTrigger className="h-11 w-[180px] rounded-2xl font-bold bg-white dark:bg-[#081d27] shadow-inner border border-stone-300/50 text-xs text-slate-900 focus:ring-1 focus:ring-emerald-600">
                    <SelectValue placeholder="Pilih Penarik" />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-[#081d27] border-white/80 rounded-2xl shadow-lg">
                    <SelectItem value="all">Semua Penarik</SelectItem>
                    <SelectItem value="unassigned">Belum Ditugaskan</SelectItem>
                    {(kolektorList || []).map((kol) => (
                      <SelectItem key={kol.id} value={kol.id!} className="font-bold">
                        {kol.nama}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Filter RT */}
                <Select value={filterRtTunggakan} onValueChange={setFilterRtTunggakan}>
                  <SelectTrigger className="h-11 w-[130px] rounded-2xl font-bold bg-white dark:bg-[#081d27] shadow-inner border border-stone-300/50 text-xs text-slate-900 focus:ring-1 focus:ring-emerald-600">
                    <SelectValue placeholder="Pilih RT" />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-[#081d27] border-white/80 rounded-2xl shadow-lg">
                    <SelectItem value="all">Semua RT</SelectItem>
                    <SelectItem value="001">RT 001</SelectItem>
                    <SelectItem value="002">RT 002</SelectItem>
                    <SelectItem value="003">RT 003</SelectItem>
                    <SelectItem value="004">RT 004</SelectItem>
                    <SelectItem value="005">RT 005</SelectItem>
                    <SelectItem value="006">RT 006</SelectItem>
                    <SelectItem value="007">RT 007</SelectItem>
                  </SelectContent>
                </Select>

                <Button
                  onClick={handleExportTunggakan}
                  className="h-11 px-5 rounded-2xl font-bold text-xs gap-2 bg-emerald-800 hover:bg-emerald-900 text-white shadow-sm border border-white/40 active:scale-95 transition-all"
                >
                  <Download className="h-4 w-4" /> Ekspor Excel Penagihan
                </Button>
              </div>
            </CardHeader>

            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-stone-300/30">
                  <TableRow>
                    <TableHead className="font-extrabold text-xs uppercase px-6 text-slate-800">NOP (18 Digit)</TableHead>
                    <TableHead className="font-extrabold text-xs uppercase text-slate-800">Nama Wajib Pajak</TableHead>
                    <TableHead className="font-extrabold text-xs uppercase text-slate-800">Wilayah / OP</TableHead>
                    <TableHead className="font-extrabold text-xs uppercase text-right text-slate-800">Tagihan PBB</TableHead>
                    <TableHead className="font-extrabold text-xs uppercase text-center px-6 text-slate-800">Petugas Penarik</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loadingDhkp ? (
                    <TableRow>
                      <TableCell colSpan={5} className="h-36 text-center">
                        <Loader2 className="h-8 w-8 animate-spin mx-auto text-emerald-800" />
                      </TableCell>
                    </TableRow>
                  ) : tunggakanList.length > 0 ? (
                    tunggakanList.map((item) => (
                      <TableRow key={item.id} className="hover:bg-stone-200/40 border-b border-stone-300/40">
                        <TableCell className="font-mono text-xs font-bold px-6 text-slate-900">{item.nop}</TableCell>
                        <TableCell className="font-extrabold text-xs text-slate-900">{item.namaWp}</TableCell>
                        <TableCell className="text-xs text-slate-600">
                          {item.alamatOp} (RT {item.rt} / RW {item.rw} - {getOfficialDusun(item.dusun, item.rw, item.rt, `${item.alamatWp || ""} ${item.alamatOp || ""}`)})
                        </TableCell>
                        <TableCell className="text-right font-black text-xs text-rose-600">
                          {formatIDR(item.ketetapanNominal)}
                        </TableCell>
                        <TableCell className="text-center px-6">
                          <Badge variant="outline" className="bg-white dark:bg-[#081d27] text-slate-700 font-bold text-[10px] border-white/80 shadow-xs">
                            {item.penarikNama || "Belum Ditugaskan"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="h-36 text-center text-slate-500 text-xs font-bold">
                        Tidak ada data tunggakan untuk filter RT yang dipilih.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 3: LAPORAN SETORAN KE BANK / BAPENDA */}
        <TabsContent value="bank" className="space-y-6">
          <Card className="rounded-[2.5rem] bg-white dark:bg-[#081d27] shadow-lg border border-white/80 overflow-hidden">
            <CardHeader className="p-6 sm:p-7 border-b border-stone-300/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <CardTitle className="text-lg font-extrabold uppercase text-emerald-800 flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-emerald-800" />
                  Laporan Setoran Resmi ke Bank Jateng / Bapenda
                </CardTitle>
                <CardDescription className="text-xs font-medium text-slate-600">
                  Rekapitulasi berkas transaksi setoran yang telah disahkan dan disetorkan ke bank
                </CardDescription>
              </div>

              <Badge className="bg-emerald-800 text-white font-extrabold text-xs px-4 py-1.5 rounded-xl shadow-xs">
                Total Disetor Bank: {formatIDR(bendaharaStats.totalDiBank)}
              </Badge>
            </CardHeader>

            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-stone-300/30">
                  <TableRow>
                    <TableHead className="font-extrabold text-xs uppercase px-6 text-slate-800">Tanggal Setor</TableHead>
                    <TableHead className="font-extrabold text-xs uppercase text-slate-800">NOP & WP</TableHead>
                    <TableHead className="font-extrabold text-xs uppercase text-slate-800">Pemungut (Kolektor)</TableHead>
                    <TableHead className="font-extrabold text-xs uppercase text-right text-slate-800">Nominal Setor</TableHead>
                    <TableHead className="font-extrabold text-xs uppercase text-center px-6 text-slate-800">Status Validasi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(transaksiList || []).filter(
                    (t) => t.statusVerifikasi === "Disetorkan ke Bank/Bapenda"
                  ).length > 0 ? (
                    (transaksiList || [])
                      .filter((t) => t.statusVerifikasi === "Disetorkan ke Bank/Bapenda")
                      .map((tx) => (
                        <TableRow key={tx.id} className="hover:bg-stone-200/40 border-b border-stone-300/40">
                          <TableCell className="font-mono text-xs font-bold px-6 text-slate-900">{tx.tanggalBayar}</TableCell>
                          <TableCell>
                            <p className="font-extrabold text-xs text-slate-900">{tx.namaWp}</p>
                            <p className="font-mono text-[10px] text-slate-500">{tx.nop}</p>
                          </TableCell>
                          <TableCell className="text-xs font-bold text-slate-800">
                            {tx.penarikNama || "Kolektor Desa"}
                          </TableCell>
                          <TableCell className="text-right font-black text-xs text-emerald-800">
                            {formatIDR(tx.totalBayar)}
                          </TableCell>
                          <TableCell className="text-center px-6">
                            <Badge className="bg-white dark:bg-[#081d27] text-emerald-800 border-white/80 shadow-xs font-extrabold text-[10px]">
                              Valid / Sah (Bank Jateng)
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="h-36 text-center text-slate-500 font-bold text-xs">
                        Belum ada laporan transaksi setoran yang divalidasi ke Bank Jateng/Bapenda.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
