"use client"

import { useState } from "react"
import { useCollection, useUser, useFirestore, useMemoFirebase, useDoc } from "@/firebase"
import { collection, doc } from "firebase/firestore"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Printer, FileText, Loader2, ChevronRight, MapPin, Calendar, User, Search, Trash2, Edit2, AlertTriangle, RefreshCw } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { generateSuratTugasPDF, generateSPPDPDF } from "@/lib/pdf-utils"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { deleteDocumentNonBlocking } from "@/firebase/non-blocking-updates"
import { SppdUpload } from "@/components/sppd/SppdUpload"

export function SppdCetakForm() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedSppd, setSelectedSppd] = useState<any>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isGeneratingST, setIsGeneratingST] = useState(false)
  const [isGeneratingSPPD, setIsGeneratingSPPD] = useState(false)
  
  const { toast } = useToast()
  const { user } = useUser()
  const db = useFirestore()

  const userDocRef = useMemoFirebase(() => {
    if (!db || !user) return null
    return doc(db, "users", user.uid)
  }, [db, user])
  
  const { data: userData } = useDoc(userDocRef)

  const villageSettingsRef = useMemoFirebase(() => {
    if (!db) return null
    return doc(db, "settings", "village")
  }, [db])
  const { data: villageSettings } = useDoc(villageSettingsRef)

  const activeLogo = villageSettings?.logoBase64 || userData?.logoBase64

  const sppdQuery = useMemoFirebase(() => {
    if (!db || !user) return null
    return collection(db, "users", user.uid, "sppds")
  }, [db, user])

  const { data: sppds, isLoading, error } = useCollection(sppdQuery)

  const filtered = (sppds || []).filter(s => {
    const desc = (s.description || "").toLowerCase()
    const dest = (s.destination || "").toLowerCase()
    const name = (s.officialName || "").toLowerCase()
    const num = (s.stNumber || s.sppdNumber || s.documentNumber || "").toLowerCase()
    const search = searchTerm.toLowerCase()
    return desc.includes(search) || dest.includes(search) || name.includes(search) || num.includes(search)
  }).sort((a, b) => {
    const dateA = a.expenseDate ? new Date(a.expenseDate).getTime() : 0
    const dateB = b.expenseDate ? new Date(b.expenseDate).getTime() : 0
    return dateB - dateA
  })

  const handlePrintST = async (data: any) => {
    setIsGeneratingST(true)
    try {
      const values = {
        ...data,
        officialName: data.officialName || "-",
        description: data.description || "-",
        destination: data.destination || "-",
        startDate: data.startDate || "-",
        endDate: data.endDate || "-",
        letterNumber: data.stNumber || data.letterNumber || "-" // Backward compat
      }
      const pdfBlob = await generateSuratTugasPDF(values, activeLogo)
      const url = URL.createObjectURL(pdfBlob)
      window.open(url, "_blank")
      toast({ title: "Berhasil", description: "Surat tugas telah dibuat." })
    } catch (e) {
      toast({ variant: "destructive", title: "Gagal", description: "Terjadi kesalahan saat membuat PDF." })
    } finally {
      setIsGeneratingST(false)
    }
  }

  const handlePrintSPPD = async (data: any) => {
    setIsGeneratingSPPD(true)
    try {
      const values = {
        ...data,
        officialName: data.officialName || "-",
        description: data.description || "-",
        destination: data.destination || "-",
        startDate: data.startDate || "-",
        endDate: data.endDate || "-",
        totalExpense: data.amount?.toString() || "0",
        documentNumber: data.sppdNumber || data.documentNumber || "-" // Backward compat
      }
      const pdfBlob = await generateSPPDPDF(values, activeLogo)
      const url = URL.createObjectURL(pdfBlob)
      window.open(url, "_blank")
      toast({ title: "Berhasil", description: "Dokumen SPPD telah dibuat." })
    } catch (e) {
      toast({ variant: "destructive", title: "Gagal", description: "Terjadi kesalahan saat membuat PDF." })
    } finally {
      setIsGeneratingSPPD(false)
    }
  }

  const handleDelete = () => {
    if (!user || !selectedSppd || !db) return
    const docRef = doc(db, "users", user.uid, "sppds", selectedSppd.id)
    deleteDocumentNonBlocking(docRef)
    toast({ title: "Terhapus", description: "Pengajuan SPPD telah dihapus." })
    setSelectedSppd(null)
    setIsDeleting(false)
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <Loader2 className="h-10 w-10 animate-spin text-primary/30" />
        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Memuat Berkas...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="py-10 text-center space-y-4">
        <AlertTriangle className="h-10 w-10 text-destructive mx-auto" />
        <p className="text-sm font-bold text-destructive">Gagal memuat data.</p>
        <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
          <RefreshCw className="h-4 w-4 mr-2" /> Segarkan Halaman
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6 font-sans">
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-500" />
        <input 
          placeholder="Cari kegiatan atau nama personel..." 
          className="w-full pl-11 pr-4 h-12 rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 shadow-xs text-sm font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-600 placeholder:text-stone-400"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="grid gap-3.5">
        {filtered.length > 0 ? (
          filtered.map((sppd) => (
            <div 
              key={sppd.id} 
              onClick={() => {
                setSelectedSppd(sppd)
                setIsEditing(false)
                setIsDeleting(false)
              }}
              className="flex items-start gap-4 p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#081d27] border border-slate-200/80 dark:border-white/10 shadow-xs hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer group"
            >
              <div className="h-12 w-12 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 shadow-xs flex items-center justify-center shrink-0 text-emerald-700 mt-0.5">
                <FileText className="h-6 w-6" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-col gap-1 mb-2">
                  <h3 className="font-black text-sm text-slate-900 leading-tight whitespace-normal break-words group-hover:text-emerald-800 transition-colors">
                    {sppd.description || "Kegiatan Dinas"}
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    <span className="w-fit text-[9px] font-black bg-emerald-100 px-2.5 py-0.5 rounded-full text-emerald-800 border border-emerald-300 uppercase shadow-2xs">
                      ST: {sppd.stNumber || sppd.letterNumber || "Tanpa No"}
                    </span>
                    <span className="w-fit text-[9px] font-black bg-sky-100 px-2.5 py-0.5 rounded-full text-sky-800 border border-sky-300 uppercase shadow-2xs">
                      SPPD: {sppd.sppdNumber || sppd.documentNumber || "Tanpa No"}
                    </span>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-1 text-stone-600">
                  <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase">
                    <MapPin className="h-3 w-3 text-emerald-700" />
                    <span>{sppd.destination || "-"}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] font-bold">
                    <User className="h-3 w-3 text-sky-700" />
                    <span>{sppd.officialName?.split(' - ')[0] || "-"}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] font-bold">
                    <Calendar className="h-3 w-3 text-amber-700" />
                    <span>{sppd.startDate || "-"}</span>
                  </div>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-stone-400 group-hover:text-emerald-700 transition-transform group-hover:translate-x-0.5 mt-1 shrink-0" />
            </div>
          ))
        ) : (
          <div className="py-20 text-center rounded-3xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 shadow-xs p-6">
            <p className="font-bold text-xs uppercase tracking-widest text-stone-500 font-condensed">Tidak ada berkas SPPD ditemukan</p>
            <p className="text-[10px] mt-1 text-stone-400">Silakan lakukan pengajuan biaya baru melalui tab Pengajuan.</p>
          </div>
        )}
      </div>

      <Dialog open={!!selectedSppd} onOpenChange={(open) => !open && setSelectedSppd(null)}>
        <DialogContent className="w-[95vw] sm:max-w-xl max-h-[92vh] overflow-y-auto p-6 sm:p-8 rounded-[2.5rem] bg-white dark:bg-[#081d27] shadow-2xl border border-white/80 text-slate-900">
          {isEditing ? (
            <div className="space-y-4">
              <DialogHeader className="pb-3 border-b border-stone-300/40">
                <DialogTitle className="text-xl font-condensed font-black text-slate-900 uppercase tracking-tight">Edit Pengajuan SPPD</DialogTitle>
                <DialogDescription className="text-xs font-bold uppercase tracking-wider text-stone-500">Perbarui rincian perjalanan dinas Anda.</DialogDescription>
              </DialogHeader>
              <SppdUpload 
                initialData={selectedSppd} 
                onSuccess={() => {
                  setIsEditing(false)
                  setSelectedSppd(null)
                }} 
              />
            </div>
          ) : isDeleting ? (
            <div className="space-y-6 py-4">
              <DialogHeader className="items-center text-center">
                <div className="h-16 w-16 rounded-2xl bg-white dark:bg-[#081d27] shadow-inner border border-rose-300/40 flex items-center justify-center mb-2 text-rose-600">
                  <AlertTriangle className="h-8 w-8 text-rose-600" />
                </div>
                <DialogTitle className="text-lg font-condensed font-black uppercase text-slate-900">Hapus Pengajuan?</DialogTitle>
                <DialogDescription className="text-xs text-stone-600 leading-relaxed">
                  Tindakan ini tidak dapat dibatalkan. Seluruh data perjalanan untuk <strong>{selectedSppd?.description}</strong> akan dihapus.
                </DialogDescription>
              </DialogHeader>
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  type="button"
                  className="flex-1 h-12 rounded-xl font-condensed font-black uppercase text-xs tracking-wider bg-white dark:bg-white/5 border border-slate-200/80 dark:border-white/10 shadow-xs hover:border-teal-500/50 hover:bg-stone-200/50 text-slate-800 active:scale-95 transition-all cursor-pointer"
                  onClick={() => setIsDeleting(false)}
                >
                  Batal
                </button>
                <button
                  type="button"
                  className="flex-1 h-12 rounded-xl font-condensed font-black uppercase text-xs tracking-wider bg-rose-600 hover:bg-rose-700 text-white shadow-sm active:scale-95 transition-all cursor-pointer"
                  onClick={handleDelete}
                >
                  Ya, Hapus Sekarang
                </button>
              </div>
            </div>
          ) : (
            <>
              <DialogHeader className="pb-3 border-b border-stone-300/40">
                <DialogTitle className="text-xl font-condensed font-black text-slate-900 uppercase tracking-tight">Opsi Pengajuan SPPD</DialogTitle>
                <DialogDescription className="text-xs font-bold uppercase tracking-wider text-stone-500">
                  Kelola dokumen untuk kegiatan <strong>{selectedSppd?.description}</strong>.
                </DialogDescription>
              </DialogHeader>

              <div className="py-4 space-y-4">
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 shadow-xs space-y-2">
                   <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                    <User className="h-4 w-4 text-emerald-700" />
                    <span>{selectedSppd?.officialName || "-"}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-bold uppercase text-slate-800">
                    <MapPin className="h-4 w-4 text-sky-700" />
                    <span>{selectedSppd?.destination || "-"}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                    <Calendar className="h-4 w-4 text-amber-700" />
                    <span>{selectedSppd?.startDate || "-"} s/d {selectedSppd?.endDate || "-"}</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3">
                  <button 
                    type="button"
                    onClick={() => handlePrintST(selectedSppd)}
                    className="h-14 px-4 flex items-center justify-between rounded-2xl bg-white dark:bg-[#081d27] border border-slate-200/80 dark:border-white/10 shadow-xs hover:bg-stone-200/40 active:scale-[0.99] transition-all cursor-pointer disabled:opacity-50"
                    disabled={isGeneratingST}
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-xl bg-white dark:bg-[#081d27] shadow-inner border border-stone-300/40 flex items-center justify-center text-emerald-700">
                        <FileText className="h-5 w-5" />
                      </div>
                      <span className="font-condensed font-black uppercase text-xs tracking-wider text-slate-900">
                        {isGeneratingST ? "Menyiapkan PDF..." : "Cetak Surat Tugas (ST)"}
                      </span>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-800 uppercase font-condensed">PDF Resmi</span>
                  </button>

                  <button 
                    type="button"
                    onClick={() => handlePrintSPPD(selectedSppd)}
                    className="h-14 px-4 flex items-center justify-between rounded-2xl bg-[#0e1620] hover:bg-slate-900 text-amber-300 shadow-sm border border-white/10 active:scale-[0.99] transition-all cursor-pointer disabled:opacity-50"
                    disabled={isGeneratingSPPD}
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-xl bg-white/10 flex items-center justify-center text-amber-300">
                        <Printer className="h-5 w-5" />
                      </div>
                      <span className="font-condensed font-black uppercase text-xs tracking-wider text-amber-300">
                        {isGeneratingSPPD ? "Menyiapkan PDF..." : "Cetak Dokumen SPPD"}
                      </span>
                    </div>
                    <span className="text-[10px] font-bold text-amber-400 uppercase font-condensed">Format PDF</span>
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <button
                    type="button"
                    className="h-11 rounded-xl bg-white dark:bg-white/5 border border-slate-200/80 dark:border-white/10 shadow-xs hover:border-teal-500/50 hover:bg-stone-200/50 text-sky-800 font-condensed font-extrabold uppercase text-xs flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer"
                    onClick={() => setIsEditing(true)}
                  >
                    <Edit2 className="h-4 w-4" /> Edit Data
                  </button>
                  <button
                    type="button"
                    className="h-11 rounded-xl bg-white dark:bg-white/5 border border-slate-200/80 dark:border-white/10 shadow-xs hover:border-teal-500/50 hover:bg-rose-50 text-rose-700 font-condensed font-extrabold uppercase text-xs flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer"
                    onClick={() => setIsDeleting(true)}
                  >
                    <Trash2 className="h-4 w-4" /> Hapus
                  </button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
