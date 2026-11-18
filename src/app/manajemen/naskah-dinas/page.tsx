"use client"

import { useState } from "react"
import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase"
import { collection, query, orderBy, doc } from "firebase/firestore"
import { deleteDocumentNonBlocking } from "@/firebase/non-blocking-updates"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { 
  FileText, 
  Plus, 
  Search, 
  Filter, 
  Loader2, 
  Trash2, 
  Printer, 
  MoreVertical,
  Download,
  Copy,
  ChevronRight
} from "lucide-react"
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"
import { format } from "date-fns"
import { id as localeID } from "date-fns/locale"
import { NASKAH_CONFIG } from "@/lib/naskah-dinas-utils"
import { cn } from "@/lib/utils"

export default function NaskahDinasPage() {
  const { user } = useUser()
  const db = useFirestore()
  const { toast } = useToast()
  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState<string>("all")

  const naskahQuery = useMemoFirebase(() => {
    if (!db || !user) return null
    return query(collection(db, "naskah_dinas"), orderBy("createdAt", "desc"))
  }, [db, user])

  const { data: naskahList, isLoading } = useCollection(naskahQuery)

  const filtered = (naskahList || []).filter(item => {
    const matchesSearch = item.title?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         item.nomorSurat?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = filterType === "all" || item.type === filterType
    return matchesSearch && matchesType
  })

  const handleDelete = (id: string) => {
    if (confirm("Apakah Anda yakin ingin menghapus naskah ini dari arsip?")) {
      deleteDocumentNonBlocking(doc(db, "naskah_dinas", id))
      toast({ title: "Terhapus", description: "Dokumen telah dihapus dari arsip." })
    }
  }

  return (
    <div className="flex flex-col gap-6 p-4 md:p-8 max-w-7xl mx-auto font-sans">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button size="icon" className="h-11 w-11 rounded-2xl bg-white dark:bg-[#081d27] shadow-sm border border-white/70 text-slate-800 hover:bg-[#e4e0d9] transition-all" asChild>
            <Link href="/manajemen/dashboard">
              <ChevronRight className="h-5 w-5 rotate-180 text-slate-800" />
            </Link>
          </Button>
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white dark:bg-[#081d27] shadow-inner border border-stone-300/40 text-emerald-800 text-[10px] font-extrabold uppercase tracking-wider mb-1">
              <FileText className="h-3.5 w-3.5 text-emerald-800" />
              Dokumen Resmi
            </div>
            <h1 className="text-2xl sm:text-3xl font-condensed font-extrabold uppercase tracking-tight text-slate-900">
              Naskah Dinas
            </h1>
            <p className="text-xs text-stone-600 font-bold uppercase tracking-wider">
              Manajemen & Arsip Dokumen Resmi Tata Praja Desa
            </p>
          </div>
        </div>
        <Button asChild className="h-12 px-6 rounded-2xl bg-emerald-800 hover:bg-emerald-900 text-white font-black uppercase text-xs tracking-wider shadow-sm active:scale-95 transition-all gap-2">
          <Link href="/manajemen/naskah-dinas/editor/">
            <Plus className="h-4 w-4" /> Buat Naskah Baru
          </Link>
        </Button>
      </header>

      <section className="grid gap-4 md:grid-cols-4 items-end">
        <div className="md:col-span-2 space-y-1.5">
          <label className="text-[10px] font-black uppercase text-stone-700 tracking-wider ml-1">Pencarian</label>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-500" />
            <Input 
              placeholder="Cari judul atau nomor surat..." 
              className="pl-11 h-12 rounded-2xl bg-white dark:bg-[#081d27] shadow-inner border border-stone-300/50 font-bold text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-600 px-4"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <label className="text-[10px] font-black uppercase text-stone-700 tracking-wider ml-1">Filter Jenis</label>
          <select 
            className="w-full h-12 rounded-2xl bg-white dark:bg-[#081d27] shadow-inner border border-stone-300/50 px-4 text-xs font-bold appearance-none text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-600"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          >
            <option value="all">Semua Jenis Naskah</option>
            {Object.entries(NASKAH_CONFIG).map(([k, v]) => (
              <option key={k} value={k}>{v.label}</option>
            ))}
          </select>
        </div>
      </section>

      <Card className="rounded-[2.5rem] bg-white dark:bg-[#081d27] shadow-lg border border-white/70 overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead className="bg-white dark:bg-[#081d27] border-b border-stone-300/40">
                <tr>
                  <th className="px-6 py-4 text-left text-[10px] font-black uppercase text-stone-500">Judul & Nomor</th>
                  <th className="px-6 py-4 text-left text-[10px] font-black uppercase text-stone-500">Jenis</th>
                  <th className="px-6 py-4 text-left text-[10px] font-black uppercase text-stone-500">Tanggal</th>
                  <th className="px-6 py-4 text-left text-[10px] font-black uppercase text-stone-500">Status</th>
                  <th className="px-6 py-4 text-right text-[10px] font-black uppercase text-stone-500">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-300/30">
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="py-20 text-center">
                      <Loader2 className="h-8 w-8 animate-spin mx-auto text-emerald-800/40" />
                    </td>
                  </tr>
                ) : filtered.map((item) => (
                  <tr key={item.id} className="hover:bg-white/40 transition-colors group">
                    <td className="px-6 py-5">
                      <p className="font-bold text-slate-900 text-sm line-clamp-1">{item.title}</p>
                      <p className="text-[10px] font-mono text-stone-500 mt-0.5">{item.nomorSurat}</p>
                    </td>
                    <td className="px-6 py-5">
                      <Badge variant="outline" className="text-[9px] font-black border-stone-300/60 bg-white dark:bg-[#081d27] shadow-inner text-slate-800 uppercase">
                        {NASKAH_CONFIG[item.type as keyof typeof NASKAH_CONFIG]?.label || item.type}
                      </Badge>
                    </td>
                    <td className="px-6 py-5">
                      <p className="text-xs font-bold text-stone-600">
                        {format(new Date(item.createdAt), "d MMM yyyy", { locale: localeID })}
                      </p>
                    </td>
                    <td className="px-6 py-5">
                      <Badge className={cn(
                        "text-[9px] font-black uppercase shadow-none",
                        item.status === 'FINAL' ? "bg-emerald-800 text-white" : "bg-amber-600 text-white"
                      )}>
                        {item.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button asChild size="icon" className="h-8 w-8 rounded-xl bg-white dark:bg-[#081d27] shadow-xs border border-white/70 hover:bg-[#e4e0d9] text-slate-800">
                          <Link href={`/manajemen/naskah-dinas/editor/?id=${item.id}`}>
                            <ChevronRight className="h-4 w-4" />
                          </Link>
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button size="icon" className="h-8 w-8 rounded-xl bg-white dark:bg-[#081d27] shadow-xs border border-white/70 hover:bg-[#e4e0d9] text-slate-800">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48 rounded-2xl bg-white dark:bg-[#081d27] shadow-2xl border border-white/80 font-bold p-1">
                            <DropdownMenuItem className="gap-2 cursor-pointer rounded-xl hover:bg-white/60" asChild>
                               <Link href={`/manajemen/naskah-dinas/editor/?id=${item.id}`}>
                                 <FileText className="h-4 w-4 text-emerald-800" /> Buka Editor
                               </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem className="gap-2 cursor-pointer text-rose-600 rounded-xl hover:bg-rose-50" onClick={() => handleDelete(item.id)}>
                              <Trash2 className="h-4 w-4" /> Hapus Arsip
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </td>
                  </tr>
                ))}
                {!isLoading && filtered.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-20 text-center text-stone-500 font-bold italic text-sm">
                      Belum ada arsip naskah dinas ditemukan.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}