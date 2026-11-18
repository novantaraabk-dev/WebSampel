
"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button, buttonVariants } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  ArrowLeft,
  PieChart as PieChartIcon,
  Download,
  Search,
  Wallet,
  Upload,
  Trash2,
  AlertCircle,
  Loader2,
  Calendar
} from "lucide-react"
import Link from "next/link"
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  Pie,
  PieChart
} from "recharts"
import { cn } from "@/lib/utils"
import { useState, useMemo, useRef, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { BIDANG_NAMES } from "@/lib/apbdes-data"
import * as XLSX from "xlsx"
import { useToast } from "@/hooks/use-toast"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase"
import { invalidateCollectionCache } from "@/firebase/firestore/use-collection"
import { collection, query, where, getDocs, doc, writeBatch } from "firebase/firestore"

export type ApbdesType = "APBDes" | "APBDes Perubahan"

export default function ApbdesPage() {
  const { user } = useUser()
  const db = useFirestore()
  const [search, setSearch] = useState("")
  const [selectedType, setSelectedType] = useState<ApbdesType>("APBDes")
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString())
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  // Firestore Fetching filtered by YEAR (sorting by kode dilakukan di client agar tidak butuh composite index)
  const apbQuery = useMemoFirebase(() => {
    if (!db || !user) return null
    return query(
      collection(db, "apbdes"),
      where("tahun", "==", selectedYear)
    )
  }, [db, user, selectedYear])

  const { data: apbDataRaw, isLoading, error: apbError, refresh } = useCollection<any>(apbQuery)

  // Filter berdasarkan Tipe APBDes (Default ke APBDes jika tipe belum tersimpan pada data lama) & urutkan berdasarkan kode
  const apbData = useMemo(() => {
    return (apbDataRaw || [])
      .filter((item: any) => {
        const itemTipe = item.tipe || "APBDes";
        return itemTipe === selectedType;
      })
      .sort((a: any, b: any) =>
        String(a.kode || "").localeCompare(String(b.kode || ""), undefined, { numeric: true })
      );
  }, [apbDataRaw, selectedType])

  const stats = useMemo(() => {
    const data = apbData || []
    const revenueBySource: Record<string, number> = {}
    const expenseByBidang: Record<number, number> = {}
    let total = 0

    data.forEach((item: any) => {
      revenueBySource[item.sumber] = (revenueBySource[item.sumber] || 0) + item.nominal
      expenseByBidang[item.bidang] = (expenseByBidang[item.bidang] || 0) + item.nominal
      total += item.nominal
    })

    const revenueChart = Object.entries(revenueBySource).map(([name, value]) => ({
      name,
      value,
      color: name === "DD" ? "#00a884" : name === "ADD" ? "#070b10" : "#10b981"
    }))

    const expenseChart = Object.entries(expenseByBidang).map(([bidang, amount]) => ({
      category: BIDANG_NAMES[Number(bidang)] || `Bidang ${bidang}`,
      amount
    }))

    return { total, revenueChart, expenseChart }
  }, [apbData])

  const filteredData = (apbData || []).filter(item =>
    item.uraian.toLowerCase().includes(search.toLowerCase()) ||
    item.kode.includes(search)
  )

  const formatIDR = (val: number) => `Rp ${new Intl.NumberFormat('id-ID').format(val)}`

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !db) return;

    setIsProcessing(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const bstr = event.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const jsonData: any[] = XLSX.utils.sheet_to_json(ws, { header: 1 });

        // Skip header row
        const importedRows = jsonData.slice(1).map((row: any) => {
          const [kode, uraian, volumeStr, nominal, sumber] = row;

          let volume = "-";
          let satuan = "-";
          if (typeof volumeStr === 'string') {
            const parts = volumeStr.match(/(\d+)\s*(.*)/);
            if (parts) {
              volume = parts[1];
              satuan = parts[2].trim();
            } else {
              volume = volumeStr;
            }
          } else if (typeof volumeStr === 'number') {
            volume = String(volumeStr);
            satuan = 'buah';
          }

          const parseNominal = (val: any): number => {
            if (typeof val === "number") return Number.isFinite(val) ? val : 0;
            if (typeof val === "string") {
              const cleaned = val.replace(/[^\d,-]/g, "").replace(/\./g, "").replace(",", ".");
              const num = Number(cleaned);
              return Number.isFinite(num) ? num : 0;
            }
            return 0;
          };

          return {
            tahun: selectedYear,
            tipe: selectedType,
            kode: String(kode || "").trim(),
            uraian: String(uraian || "").trim(),
            volume: volume,
            satuan: satuan,
            nominal: parseNominal(nominal),
            sumber: String(sumber || "").trim(),
            bidang: parseInt(String(kode || "0").split('.')[0], 10) || 0,
          };
        }).filter(item => item.kode && item.uraian && item.nominal > 0);

        if (importedRows.length === 0) {
          throw new Error("Tidak ada data valid yang ditemukan.");
        }

        const colRef = collection(db, "apbdes");
        const CHUNK_SIZE = 450;
        for (let i = 0; i < importedRows.length; i += CHUNK_SIZE) {
          const batch = writeBatch(db);
          const chunk = importedRows.slice(i, i + CHUNK_SIZE);
          chunk.forEach(row => {
            const newDocRef = doc(colRef);
            batch.set(newDocRef, row);
          });
          await batch.commit();
        }

        invalidateCollectionCache("apbdes");
        refresh();

        toast({ title: "Impor Berhasil", description: `${importedRows.length} data ${selectedType} TA ${selectedYear} berhasil diunggah.` });
      } catch (error: any) {
        console.error("Import error:", error);
        toast({ variant: "destructive", title: "Impor Gagal", description: error.message || "Format file tidak sesuai." });
      } finally {
        setIsProcessing(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleExport = () => {
    if (!apbData || apbData.length === 0) return;
    const exportData = filteredData.map(item => ({
      'Kode Rekening': item.kode,
      'Nama Kegiatan': item.uraian,
      'Bidang': BIDANG_NAMES[item.bidang],
      'Volume': `${item.volume} ${item.satuan}`,
      'Nominal': item.nominal,
      'Sumber Anggaran': item.sumber,
      'Jenis': item.tipe || selectedType,
    }));
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    const sheetName = selectedType === "APBDes Perubahan" ? `APBDes_P_${selectedYear}` : `APBDes_${selectedYear}`;
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
    const fileNameType = selectedType === "APBDes Perubahan" ? "APBDes_Perubahan" : "APBDes";
    XLSX.writeFile(wb, `Laporan_${fileNameType}_sampeldes_${selectedYear}.xlsx`);
    toast({ title: "Ekspor Berhasil", description: `Laporan ${selectedType} TA ${selectedYear} telah diunduh.` });
  };

  const handleDeleteAll = async () => {
    if (!db) return;
    setIsProcessing(true);
    try {
      const q = query(collection(db, "apbdes"), where("tahun", "==", selectedYear));
      const snapshot = await getDocs(q);
      const docsToDelete = snapshot.docs.filter((docSnap) => {
        const d = docSnap.data();
        const docTipe = d.tipe || "APBDes";
        return docTipe === selectedType;
      });
      const CHUNK_SIZE = 450;
      for (let i = 0; i < docsToDelete.length; i += CHUNK_SIZE) {
        const batch = writeBatch(db);
        docsToDelete.slice(i, i + CHUNK_SIZE).forEach((docSnap) => {
          batch.delete(docSnap.ref);
        });
        await batch.commit();
      }
      invalidateCollectionCache("apbdes");
      refresh();
      toast({ variant: "destructive", title: "Data Dihapus", description: `Seluruh data ${selectedType} TA ${selectedYear} berhasil dihapus.` });
    } catch (e) {
      toast({ variant: "destructive", title: "Gagal", description: "Terjadi kesalahan akses." });
    } finally {
      setIsProcessing(false);
      setShowDeleteConfirm(false);
    }
  };

  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  if (!mounted) return null;

  return (
    <div className="flex flex-col gap-6 p-4 md:p-8 font-sans max-w-7xl mx-auto">
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <Button size="icon" asChild className="rounded-2xl h-11 w-11 bg-white dark:bg-[#081d27] shadow-sm border border-white/70 text-slate-800 hover:bg-[#e4e0d9] transition-all">
            <Link href="/manajemen/dashboard">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-condensed font-extrabold text-slate-900 uppercase tracking-tight">Informasi APBDes</h1>
            <p className="text-xs text-stone-600 uppercase tracking-wider font-bold">Database Anggaran Terpusat (Multi-Tahun)</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start sm:self-center">
          {/* Pilihan 1. APBDes / 2. APBDes Perubahan Sebelum Tahun */}
          <div className="flex items-center gap-2 mr-1">
            <Wallet className="h-4 w-4 text-emerald-800" />
            <Select value={selectedType} onValueChange={(val: ApbdesType) => setSelectedType(val)}>
              <SelectTrigger className="h-11 min-w-[170px] rounded-2xl font-bold bg-white dark:bg-[#081d27] shadow-inner border border-stone-300/50 text-slate-900">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-[#081d27] shadow-2xl border border-white/80 rounded-2xl">
                <SelectItem value="APBDes" className="font-bold text-xs">1. APBDes</SelectItem>
                <SelectItem value="APBDes Perubahan" className="font-bold text-xs">2. APBDes Perubahan</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Pilihan Tahun */}
          <div className="flex items-center gap-2 mr-2">
            <Calendar className="h-4 w-4 text-emerald-800" />
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger className="h-11 w-[110px] rounded-2xl font-bold bg-white dark:bg-[#081d27] shadow-inner border border-stone-300/50 text-slate-900">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-[#081d27] shadow-2xl border border-white/80 rounded-2xl">
                {["2024", "2025", "2026", "2027", "2028", "2029", "2030"].map(y => (
                  <SelectItem key={y} value={y} className="font-bold text-xs">{y}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <input type="file" ref={fileInputRef} onChange={handleImport} className="hidden" accept=".xlsx, .xls, .csv" />
          <Button className="h-11 px-4 rounded-2xl gap-2 font-condensed font-bold text-xs uppercase bg-white dark:bg-[#081d27] text-stone-700 shadow-sm border border-white/70 hover:bg-[#e4e0d9]" onClick={() => fileInputRef.current?.click()} disabled={isProcessing}>
            {isProcessing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5 text-emerald-800" />}
            Impor {selectedType} {selectedYear}
          </Button>
          <Button className="h-11 px-4 rounded-2xl gap-2 font-condensed font-bold text-xs uppercase bg-white dark:bg-[#081d27] text-stone-700 shadow-sm border border-white/70 hover:bg-[#e4e0d9]" onClick={handleExport}>
            <Download className="h-3.5 w-3.5 text-emerald-800" />
            Ekspor {selectedType} {selectedYear}
          </Button>
          <Button className="h-11 px-4 rounded-2xl gap-2 font-condensed font-bold text-xs uppercase bg-white dark:bg-[#081d27] text-rose-600 shadow-sm border border-white/70 hover:bg-rose-50" onClick={() => setShowDeleteConfirm(true)} disabled={isProcessing}>
            <Trash2 className="h-3.5 w-3.5" />
            Hapus {selectedType} {selectedYear}
          </Button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 border border-white/10 shadow-lg bg-[#0e1620] text-white rounded-[2.5rem] overflow-hidden p-6 sm:p-7 flex flex-col justify-between">
          <div>
            <p className="text-[10px] font-condensed font-black uppercase tracking-widest text-amber-200/70">Total Anggaran {selectedType} TA {selectedYear}</p>
            <h2 className="text-2xl sm:text-3xl font-condensed font-extrabold mt-1 text-amber-300 tracking-tight">{formatIDR(stats.total)}</h2>
            <div className="flex items-center gap-2 mt-3">
              <Badge className="bg-emerald-600 text-white font-bold border-none text-[9px] uppercase tracking-wider">AKTIF</Badge>
              <span className="text-[10px] text-white/60 uppercase font-semibold">Sinkronisasi Cloud</span>
            </div>
          </div>
          <div className="mt-8 space-y-3.5">
            {stats.revenueChart.length > 0 ? stats.revenueChart.map((s: any, i: number) => (
              <div key={i} className="space-y-1">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="flex items-center gap-2 uppercase tracking-tight text-white/70">{s.name}</span>
                  <span className="text-white">{formatIDR(s.value)}</span>
                </div>
                <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-400" style={{ width: `${stats.total > 0 ? (s.value / stats.total) * 100 : 0}%` }}></div>
                </div>
              </div>
            )) : (
              <p className="text-xs italic text-white/40">Belum ada data anggaran di tahun ini.</p>
            )}
          </div>
        </div>

        <Card className="md:col-span-2 rounded-[2.5rem] bg-white dark:bg-[#081d27] shadow-lg border border-white/70 overflow-hidden">
          <CardHeader className="p-6 flex flex-row items-center justify-between bg-white dark:bg-[#081d27] border-b border-stone-300/40">
            <div>
              <CardTitle className="text-base font-condensed font-extrabold uppercase tracking-tight text-slate-900">Komposisi Sumber Dana {selectedType} {selectedYear}</CardTitle>
              <CardDescription className="text-xs text-stone-600 font-medium">Penyebaran anggaran berdasarkan sumber pembiayaan</CardDescription>
            </div>
            <PieChartIcon className="h-5 w-5 text-emerald-800" />
          </CardHeader>
          <CardContent className="p-0 h-[250px] w-full">
            {stats.revenueChart.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats.revenueChart}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {stats.revenueChart.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => formatIDR(value)}
                    contentStyle={{ borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 10px 40px -10px rgb(0 0 0 / 0.3)', backgroundColor: '#081d27', color: '#ffffff', fontWeight: 'bold' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-stone-500 font-bold uppercase">Data Kosong</div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1 rounded-[2.5rem] bg-white dark:bg-[#081d27] shadow-lg border border-white/70 overflow-hidden">
          <CardHeader className="p-6 bg-white dark:bg-[#081d27] border-b border-stone-300/40">
            <CardTitle className="text-base font-condensed font-extrabold uppercase text-slate-900">Belanja per Bidang ({selectedType} {selectedYear})</CardTitle>
            <CardDescription className="text-xs text-stone-600 font-medium">Alokasi dana untuk pembangunan & pemberdayaan</CardDescription>
          </CardHeader>
          <CardContent className="p-4 h-[350px] w-full">
            {stats.expenseChart.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.expenseChart} layout="vertical" margin={{ left: 10, right: 30, top: 10, bottom: 10 }}>
                  <XAxis type="number" hide />
                  <YAxis
                    dataKey="category"
                    type="category"
                    axisLine={false}
                    tickLine={false}
                    width={140}
                    style={{ fontSize: '9px', fontWeight: 'bold', textTransform: 'uppercase', fill: '#44403c' }}
                  />
                  <Tooltip
                    formatter={(value: number) => formatIDR(value)}
                    cursor={{ fill: 'rgba(0,0,0,0.02)' }}
                    contentStyle={{ borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 10px 40px -10px rgb(0 0 0 / 0.3)', backgroundColor: '#081d27', color: '#ffffff', fontWeight: 'bold' }}
                  />
                  <Bar dataKey="amount" fill="#047857" radius={[0, 8, 8, 0]} barSize={14} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-stone-500 font-bold uppercase">Data Kosong</div>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2 rounded-[2.5rem] bg-white dark:bg-[#081d27] shadow-lg border border-white/70 overflow-hidden">
          <CardHeader className="p-6 bg-white dark:bg-[#081d27] border-b border-stone-300/40">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <CardTitle className="text-base font-condensed font-extrabold uppercase text-slate-900">Rincian Kegiatan ({selectedType} {selectedYear})</CardTitle>
                <CardDescription className="text-xs text-stone-600 font-medium">Detail alokasi penggunaan anggaran desa</CardDescription>
              </div>
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-500" />
                <Input
                  placeholder="Cari uraian..."
                  className="pl-10 h-11 w-full sm:w-[240px] bg-white dark:bg-[#081d27] shadow-inner border border-stone-300/50 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-600"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[400px] w-full">
              <Table>
                <TableHeader className="bg-white dark:bg-[#081d27] sticky top-0 z-10 border-b border-stone-300/40">
                  <TableRow className="border-stone-300/40">
                    <TableHead className="text-[10px] font-black uppercase px-6 h-12 text-stone-500">Kode</TableHead>
                    <TableHead className="text-[10px] font-black uppercase h-12 text-stone-500">Uraian</TableHead>
                    <TableHead className="text-[10px] font-black uppercase text-right h-12 text-stone-500">Nominal</TableHead>
                    <TableHead className="text-[10px] font-black uppercase text-center px-6 h-12 text-stone-500">Sumber</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-stone-300/30">
                  {isLoading ? (
                    <TableRow><TableCell colSpan={4} className="h-40 text-center"><Loader2 className="h-8 w-8 animate-spin mx-auto text-emerald-800/40" /></TableCell></TableRow>
                  ) : apbError ? (
                    <TableRow>
                      <TableCell colSpan={4} className="h-40 text-center">
                        <div className="flex flex-col items-center gap-2 text-rose-600">
                          <AlertCircle className="h-10 w-10 opacity-70" />
                          <p className="text-sm font-bold uppercase tracking-widest">Gagal Memuat Data APBDes</p>
                          <p className="text-[11px] font-medium text-stone-600 max-w-md">{apbError.message}</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : filteredData.length > 0 ? filteredData.map((item: any, i: number) => (
                    <TableRow key={i} className="hover:bg-white/40 transition-colors">
                      <TableCell className="font-mono text-[10px] text-stone-500 px-6">{item.kode}</TableCell>
                      <TableCell className="py-4">
                        <p className="text-xs font-bold leading-tight text-slate-900">{item.uraian}</p>
                        <p className="text-[9px] text-stone-500 mt-0.5 font-bold uppercase">Volume: {item.volume} {item.satuan}</p>
                      </TableCell>
                      <TableCell className="text-right font-black text-xs text-emerald-800">{formatIDR(item.nominal)}</TableCell>
                      <TableCell className="text-center px-6">
                        <Badge variant="outline" className={cn(
                          "text-[9px] font-black px-2 py-0.5 border shadow-xs",
                          item.sumber === 'DD' ? "border-emerald-600/30 text-emerald-800 bg-white dark:bg-[#081d27]" :
                            item.sumber === 'ADD' ? "border-amber-600/30 text-amber-800 bg-white dark:bg-[#081d27]" : "border-sky-600/30 text-sky-800 bg-white dark:bg-[#081d27]"
                        )}>
                          {item.sumber}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  )) : (
                    <TableRow>
                      <TableCell colSpan={4} className="h-40 text-center">
                        <div className="flex flex-col items-center gap-2 text-stone-400">
                          <AlertCircle className="h-10 w-10 opacity-30 text-emerald-800" />
                          <p className="text-sm font-bold uppercase tracking-widest text-slate-700">Tidak ada data {selectedType} {selectedYear}</p>
                          <p className="text-[10px] uppercase font-bold text-stone-500">Silakan impor file Excel untuk mengisi database {selectedType} TA {selectedYear}.</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent className="rounded-[2.5rem] p-8 bg-white dark:bg-[#081d27] shadow-2xl border border-white/80 text-slate-900">
          <AlertDialogHeader className="items-center text-center">
            <div className="h-20 w-20 rounded-full bg-white dark:bg-[#081d27] shadow-inner border border-stone-300/40 flex items-center justify-center mb-4">
              <Trash2 className="h-10 w-10 text-rose-600" />
            </div>
            <AlertDialogTitle className="text-xl font-black uppercase text-rose-600">Hapus Data {selectedType} TA {selectedYear}?</AlertDialogTitle>
            <AlertDialogDescription className="text-xs font-bold uppercase text-stone-600 leading-relaxed">
              Tindakan ini akan menghapus permanen rincian {selectedType} Tahun {selectedYear} dari Firestore. Data lain tetap aman.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-3 pt-6">
            <AlertDialogCancel className="h-12 rounded-2xl font-bold uppercase w-full bg-white dark:bg-[#081d27] text-stone-700 shadow-sm border border-white/70 hover:bg-[#e4e0d9]">Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteAll} className="h-12 rounded-2xl font-black uppercase bg-rose-600 hover:bg-rose-700 text-white shadow-sm w-full">Ya, Hapus {selectedType} {selectedYear}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
