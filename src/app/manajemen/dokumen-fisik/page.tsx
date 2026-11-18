"use client"

import { useState } from "react"
import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase"
import { collection, query, orderBy, doc, deleteDoc } from "firebase/firestore"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  FileStack,
  Plus,
  Search,
  Loader2,
  Trash2,
  ChevronRight,
  Calendar,
  MapPin,
  DollarSign,
  Settings2,
  FileText
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"
import { cn } from "@/lib/utils"

export default function DokumenFisikDashboard() {
  const { user, isUserLoading } = useUser()
  const db = useFirestore()
  const { toast } = useToast()
  const [searchTerm, setSearchTerm] = useState("")

  const activitiesQuery = useMemoFirebase(() => {
    if (!db || !user) return null
    return query(
      collection(db, "physical_activities"),
      orderBy("createdAt", "desc")
    )
  }, [db, user])

  const { data: activities, isLoading } = useCollection(activitiesQuery)

  const filtered = (activities || []).filter(item =>
    (item.namaKegiatan || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.lokasi || "").toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.preventDefault()
    e.stopPropagation()
    if (!confirm("Hapus data kegiatan ini beserta seluruh akses otomatisasinya?")) return
    try {
      await deleteDoc(doc(db, "physical_activities", id))
      toast({ title: "Terhapus", description: "Data inventaris fisik telah dihapus." })
    } catch (e) {
      toast({ variant: "destructive", title: "Gagal", description: "Terjadi kesalahan." })
    }
  }

  if (isUserLoading) {
    return <div className="h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary/30" /></div>
  }

  return (
    <div className="min-h-screen bg-white dark:bg-[#081d27] p-4 md:p-8">
      <div className="max-w-7xl mx-auto flex flex-col gap-6">
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-[2rem] bg-white dark:bg-[#081d27] shadow-md border border-white/80">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" className="h-10 w-10 rounded-xl bg-white dark:bg-[#081d27] shadow-sm border border-white/80 hover:bg-[#e4e0d9] transition-all" asChild>
              <Link href="/manajemen/dashboard">
                <ChevronRight className="h-5 w-5 rotate-180 text-slate-800" />
              </Link>
            </Button>
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white dark:bg-[#081d27] text-emerald-800 shadow-inner border border-stone-300/50 text-[10px] font-black uppercase tracking-wider mb-1">
                <FileStack className="h-3.5 w-3.5 text-emerald-700" />
                Proyek & Pembangunan
              </div>
              <h1 className="text-2xl sm:text-3xl font-condensed font-black uppercase tracking-tight text-slate-900">
                Inventaris Dokumen Fisik
              </h1>
              <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">
                Otomatisasi Berkas Proyek & Pembangunan Desa Sampeldes
              </p>
            </div>
          </div>
          <Button asChild className="h-11 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-black uppercase text-xs tracking-wider shadow-sm border border-white/40 gap-2 active:scale-95 transition-all">
            <Link href="/manajemen/dokumen-fisik/editor/">
              <Plus className="h-4 w-4" /> Buat Proyek Baru
            </Link>
          </Button>
        </header>

        <section className="space-y-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <Input
              placeholder="Cari nama kegiatan atau lokasi..."
              className="pl-11 h-12 rounded-2xl bg-white dark:bg-[#081d27] shadow-inner border border-stone-300/50 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 text-xs font-bold text-slate-900 placeholder:text-slate-400"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {isLoading ? (
              <div className="col-span-full py-20 text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto text-emerald-800" />
                <p className="text-xs font-black text-slate-500 uppercase mt-4 tracking-wider">Memuat data proyek...</p>
              </div>
            ) : filtered.length > 0 ? (
              filtered.map((item) => (
                <Link key={item.id} href={`/manajemen/dokumen-fisik/generate/${item.id}/`}>
                  <Card className="rounded-[2rem] bg-white dark:bg-[#081d27] shadow-md hover:shadow-xl border border-white/80 overflow-hidden transition-all duration-300 group cursor-pointer active:scale-[0.98]">
                    <CardHeader className="bg-[#e4e0d9]/60 p-5 border-b border-stone-300/60">
                      <div className="flex justify-between items-start gap-2">
                        <div className="space-y-1.5 flex-1 min-w-0">
                          <span className="inline-block px-2.5 py-0.5 rounded-full bg-white dark:bg-[#081d27] text-emerald-800 shadow-inner border border-stone-300/50 text-[9px] font-black uppercase tracking-wider">
                            TA {item.tahunAnggaran}
                          </span>
                          <CardTitle className="text-base font-condensed font-black text-slate-900 uppercase line-clamp-2 leading-tight">
                            {item.namaKegiatan}
                          </CardTitle>
                        </div>
                        <div className="p-2 rounded-xl bg-white dark:bg-[#081d27] shadow-xs border border-white/80 text-slate-600 group-hover:text-emerald-800 transition-colors">
                          <Settings2 className="h-4 w-4" />
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="p-5 space-y-4">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="flex items-center gap-1.5 text-[10px] font-black text-slate-600 uppercase">
                          <MapPin className="h-3.5 w-3.5 text-emerald-700 shrink-0" />
                          <span className="truncate">{item.lokasi}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[10px] font-black text-slate-900 uppercase">
                          <DollarSign className="h-3.5 w-3.5 text-emerald-700 shrink-0" />
                          <span className="truncate">Rp {new Intl.NumberFormat('id-ID').format(item.anggaran)}</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between pt-2">
                        <div className="flex items-center gap-2 text-[10px] font-black text-slate-500">
                          <Calendar className="h-3.5 w-3.5 text-slate-600" />
                          <span>{item.tanggalKegiatan}</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-xl bg-white dark:bg-[#081d27] shadow-xs border border-white/80 hover:bg-rose-50 text-rose-600 hover:text-rose-700 transition-all"
                          onClick={(e) => handleDelete(e, item.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="flex items-center justify-between text-[10px] font-black text-slate-700 uppercase tracking-wider pt-3 border-t border-stone-300/50 group-hover:text-emerald-900 transition-all">
                        <span>Generate Dokumen</span>
                        <span className="p-1.5 rounded-lg bg-white dark:bg-[#081d27] shadow-xs border border-white/80 group-hover:bg-emerald-800 group-hover:text-white transition-all">
                          <ChevronRight className="h-3.5 w-3.5" />
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))
            ) : (
              <div className="col-span-full py-16 px-6 text-center rounded-[2.5rem] bg-white dark:bg-[#081d27] shadow-inner border border-stone-300/40">
                <FileStack className="h-12 w-12 text-stone-400 mx-auto mb-3" />
                <p className="text-xs font-black text-slate-500 uppercase tracking-widest">Belum ada proyek fisik tercatat</p>
                <Button asChild className="mt-5 h-11 px-6 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-black uppercase text-xs tracking-wider shadow-sm border border-white/40">
                  <Link href="/manajemen/dokumen-fisik/editor/"><Plus className="h-4 w-4 mr-2" /> Mulai Proyek Pertama</Link>
                </Button>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}
