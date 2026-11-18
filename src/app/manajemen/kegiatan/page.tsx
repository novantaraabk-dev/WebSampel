
"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Search,
  Filter,
  Plus,
  ChevronLeft,
  Loader2,
  AlertTriangle,
  FileText,
  ImageIcon,
  ExternalLink,
  MapPin,
  Calendar,
  Clock,
  User,
  BookOpen,
  Share2,
  Trash2,
  FileCheck,
  FolderOpen,
  Edit,
  Printer,
  ListOrdered
} from "lucide-react"
import Link from "next/link"
import { KegiatanCard } from "@/components/kegiatan/KegiatanCard"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog"
import { KegiatanUpload } from "@/components/kegiatan/KegiatanUpload"
import { useCollection, useUser, useFirestore, useMemoFirebase, useDoc } from "@/firebase"
import { invalidateCollectionCache } from "@/firebase/firestore/use-collection"
import { collection, doc, deleteDoc } from "firebase/firestore"
import { useToast } from "@/hooks/use-toast"
import { ScrollArea } from "@/components/ui/scroll-area"
import Image from "next/image"
import { Badge } from "@/components/ui/badge"
import { generateNotulenPDF, generateBASTPDF, generateRAPDF, generateDokumentasiPDF } from "@/lib/pdf-utils"

export default function KegiatanPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [isUploadOpen, setIsUploadOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [selectedForDelete, setSelectedForDelete] = useState<any>(null)
  const [selectedActivity, setSelectedActivity] = useState<any>(null)
  const [editingActivity, setEditingActivity] = useState<any>(null)
  const [isGeneratingDoc, setIsGeneratingDoc] = useState<string | null>(null)

  const { user, isUserLoading: isAuthLoading } = useUser()
  const db = useFirestore()
  const { toast } = useToast()

  // GLOBAL CONFIG: Use shared village settings for logo in PDFs
  const villageSettingsRef = useMemoFirebase(() => {
    if (!db) return null
    return doc(db, "settings", "village")
  }, [db])
  const { data: villageSettings } = useDoc(villageSettingsRef)

  // GLOBAL COLLECTION: Use village-wide kegiatan collection
  const kegiatanQuery = useMemoFirebase(() => {
    if (!db || !user) return null
    return collection(db, "kegiatans")
  }, [db, user])

  const { data: kegiatans, isLoading, refresh } = useCollection(kegiatanQuery)

  const handlePrintDok = async (type: 'notulen' | 'bast' | 'ra' | 'kegiatan' | 'atk' | 'konsumsi') => {
    if (!selectedActivity) return
    setIsGeneratingDoc(type)
    try {
      let blob: Blob | null = null
      const logo = villageSettings?.logoBase64

      if (type === 'notulen') {
        blob = await generateNotulenPDF(selectedActivity, logo)
      } else if (type === 'bast') {
        blob = await generateBASTPDF(selectedActivity, logo)
      } else if (type === 'ra') {
        blob = await generateRAPDF(selectedActivity, logo)
      } else if (type === 'kegiatan') {
        const urls = (selectedActivity.cloudinaryUrls?.kegiatan && selectedActivity.cloudinaryUrls.kegiatan.length > 0)
          ? selectedActivity.cloudinaryUrls.kegiatan
          : (selectedActivity.imageUrls || [])
        if (urls.length === 0) {
          toast({ variant: "destructive", title: "Foto Tidak Ditemukan", description: "Tidak ada foto kegiatan yang tersimpan." })
          return
        }
        blob = await generateDokumentasiPDF(selectedActivity, "DOKUMENTASI KEGIATAN", urls, logo)
      } else if (type === 'atk') {
        const urls = selectedActivity.cloudinaryUrls?.atk || []
        if (urls.length === 0) {
          toast({ variant: "destructive", title: "Foto Tidak Ditemukan", description: "Tidak ada foto ATK yang tersimpan." })
          return
        }
        blob = await generateDokumentasiPDF(selectedActivity, "DOKUMENTASI ATK", urls, logo)
      } else if (type === 'konsumsi') {
        const urls = selectedActivity.cloudinaryUrls?.konsumsi || []
        if (urls.length === 0) {
          toast({ variant: "destructive", title: "Foto Tidak Ditemukan", description: "Tidak ada foto konsumsi yang tersimpan." })
          return
        }
        blob = await generateDokumentasiPDF(selectedActivity, "DOKUMENTASI KONSUMSI", urls, logo)
      }

      if (blob) {
        const url = URL.createObjectURL(blob)
        window.open(url, "_blank")
      }
    } catch (err) {
      console.error("Gagal generate PDF dari rincian:", err)
      toast({ variant: "destructive", title: "Gagal Cetak PDF", description: "Terjadi kesalahan sistem saat membuat file PDF." })
    } finally {
      setIsGeneratingDoc(null)
    }
  }

  const filtered = (kegiatans || []).filter(k => {
    const title = k.title || ""
    const desc = k.description || ""
    const s = searchTerm.toLowerCase()
    return title.toLowerCase().includes(s) || desc.toLowerCase().includes(s)
  }).sort((a, b) => new Date(b.uploadDate || 0).getTime() - new Date(a.uploadDate || 0).getTime())

  const handleDelete = async () => {
    if (!user || !selectedForDelete || !db) return
    try {
      const docRef = doc(db, "kegiatans", selectedForDelete.id)
      await deleteDoc(docRef)
      invalidateCollectionCache("kegiatans")
      refresh()
      toast({ title: "Terhapus", description: "Dokumentasi kegiatan telah dihapus dari database desa." })
      setSelectedForDelete(null)
      setSelectedActivity(null)
    } catch (err: any) {
      toast({ variant: "destructive", title: "Gagal Menghapus", description: err.message || "Terjadi kesalahan akses." })
    }
  }

  const handleOpenEdit = (activity: any) => {
    setEditingActivity(activity)
    setIsEditOpen(true)
    setSelectedActivity(null) // Close detail dialog
  }

  if (isAuthLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 p-4 md:p-8 overflow-x-hidden font-sans">
      <header className="flex items-center gap-3.5">
        <Button variant="ghost" size="icon" asChild className="rounded-xl h-10 w-10 text-slate-700 hover:bg-stone-200/60">
          <Link href="/manajemen/dashboard">
            <ChevronLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-xl sm:text-2xl font-condensed font-extrabold text-slate-900 uppercase tracking-tight leading-none">Dokumentasi Kegiatan Desa</h1>
          <p className="text-xs text-slate-500 font-medium mt-1">Laporan & Dokumentasi Terpadu Pemerintahan Desa</p>
        </div>
      </header>

      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input placeholder="Cari laporan kegiatan..." className="pl-9 h-11 rounded-xl bg-white border border-stone-200 shadow-xs text-xs font-semibold" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
          <Button variant="outline" size="icon" className="h-11 w-11 rounded-xl bg-white border border-stone-200 shadow-xs"><Filter className="h-4 w-4 text-slate-700" /></Button>
        </div>

        <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
          <DialogTrigger asChild>
            <Button className="w-full h-12 gap-2 text-xs sm:text-sm font-condensed font-extrabold uppercase tracking-wider shadow-sm bg-teal-600 hover:bg-teal-500 text-white rounded-xl cursor-pointer">
              <Plus className="h-5 w-5" /> Buat Laporan Kegiatan Baru
            </Button>
          </DialogTrigger>
          <DialogContent className="w-[95vw] sm:max-w-2xl md:max-w-3xl max-h-[92vh] overflow-y-auto p-6 sm:p-8 rounded-[2.5rem] bg-white dark:bg-[#081d27] shadow-2xl border border-white/80 text-slate-900">
            <DialogHeader className="pb-3 border-b border-stone-300/40">
              <DialogTitle className="text-xl sm:text-2xl font-condensed font-black text-slate-900 uppercase tracking-tight">Input Dokumentasi</DialogTitle>
              <DialogDescription className="text-xs font-bold uppercase tracking-wider text-stone-500">Dokumentasikan kegiatan pembangunan atau sosial desa.</DialogDescription>
            </DialogHeader>
            {isUploadOpen && (
              <KegiatanUpload
                onSuccess={() => {
                  refresh()
                  setIsUploadOpen(false)
                }}
              />
            )}
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary/40" />
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Sinkronisasi...</p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.length > 0 ? (
            filtered.map((item) => (
              <KegiatanCard
                key={item.id}
                kegiatan={{
                  id: item.id,
                  title: item.title || "Tanpa Judul",
                  description: item.description || "Tidak ada deskripsi",
                  date: item.date || item.uploadDate || "-",
                  location: item.location || "Balai Desa",
                  category: item.category || "Internal",
                  imageUrl: (item.imageUrls && item.imageUrls.length > 0) ? item.imageUrls[0] : `https://picsum.photos/seed/${item.id}/600/400`
                }}
                onDelete={(e) => { e.stopPropagation(); setSelectedForDelete(item); }}
                onClick={() => setSelectedActivity(item)}
              />
            ))
          ) : (
            <div className="col-span-full py-20 text-center border-2 border-dashed rounded-[2.5rem] bg-muted/5 border-muted/50">
              <p className="font-black text-muted-foreground uppercase text-sm">Belum Ada Dokumentasi</p>
            </div>
          )}
        </div>
      )}

      {/* Detail Dialog */}
      <Dialog open={!!selectedActivity} onOpenChange={(open) => !open && setSelectedActivity(null)}>
        <DialogContent className="w-[95vw] sm:max-w-[600px] max-h-[90vh] overflow-y-auto p-0 rounded-[2.5rem] shadow-2xl border-none">
          {selectedActivity && (
            <div className="space-y-0 relative">
              <DialogHeader className="p-0">
                <DialogTitle className="sr-only">{selectedActivity.title}</DialogTitle>
                <DialogDescription className="sr-only">Detail dokumentasi kegiatan desa.</DialogDescription>
              </DialogHeader>

              <div className="relative aspect-video w-full">
                <Image
                  src={(selectedActivity.imageUrls && selectedActivity.imageUrls.length > 0) ? selectedActivity.imageUrls[0] : `https://picsum.photos/seed/${selectedActivity.id}/600/400`}
                  alt="Cover" fill className="object-cover" unoptimized
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <div className="absolute bottom-6 left-6 right-6">
                  <Badge className="mb-2 bg-primary/90 border-none text-[10px] font-black uppercase tracking-widest">{selectedActivity.category}</Badge>
                  <h2 className="text-2xl font-black text-white uppercase tracking-tight leading-tight">{selectedActivity.title}</h2>
                </div>
              </div>

              <div className="p-6 space-y-6">
                {/* METADATA KEGIATAN */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <div className="flex flex-col p-3 bg-muted/30 rounded-2xl">
                    <div className="flex items-center gap-1.5 text-primary mb-1">
                      <Calendar className="h-3.5 w-3.5" />
                      <span className="text-[9px] font-black uppercase tracking-wider text-muted-foreground">Tanggal</span>
                    </div>
                    <span className="text-xs font-bold text-slate-800">{selectedActivity.date || "-"}</span>
                  </div>

                  <div className="flex flex-col p-3 bg-muted/30 rounded-2xl">
                    <div className="flex items-center gap-1.5 text-primary mb-1">
                      <Clock className="h-3.5 w-3.5" />
                      <span className="text-[9px] font-black uppercase tracking-wider text-muted-foreground">Waktu</span>
                    </div>
                    <span className="text-xs font-bold text-slate-800">{selectedActivity.time ? `${selectedActivity.time} WIB` : "Sesuai Jadwal"}</span>
                  </div>

                  <div className="flex flex-col p-3 bg-muted/30 rounded-2xl col-span-2">
                    <div className="flex items-center gap-1.5 text-primary mb-1">
                      <MapPin className="h-3.5 w-3.5" />
                      <span className="text-[9px] font-black uppercase tracking-wider text-muted-foreground">Tempat / Lokasi</span>
                    </div>
                    <span className="text-xs font-bold text-slate-800 truncate">{selectedActivity.location || "Balai Desa Sampeldes"}</span>
                  </div>

                  {selectedActivity.officialName && (
                    <div className="flex flex-col p-3 bg-muted/30 rounded-2xl col-span-2 sm:col-span-4">
                      <div className="flex items-center gap-1.5 text-primary mb-1">
                        <User className="h-3.5 w-3.5" />
                        <span className="text-[9px] font-black uppercase tracking-wider text-muted-foreground">Pelaksana Kegiatan</span>
                      </div>
                      <span className="text-xs font-bold text-slate-800">{selectedActivity.officialName}</span>
                    </div>
                  )}
                </div>

                {/* NOTULEN / LAPORAN NARATIF */}
                <div className="space-y-2">
                  <h4 className="text-[10px] font-black uppercase text-muted-foreground tracking-widest flex items-center gap-1.5">
                    <FileText className="h-3.5 w-3.5 text-primary" /> Narasi & Notulen Resmi
                  </h4>
                  <div className="p-4 bg-white border border-slate-200/80 rounded-2xl shadow-xs text-xs leading-relaxed text-slate-700 font-medium whitespace-pre-wrap max-h-48 overflow-y-auto">
                    {selectedActivity.description || "Tidak ada narasi notulen."}
                  </div>
                </div>

                {/* DOKUMEN & CETAK BERKAS PDF */}
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between pb-1 border-b border-slate-100">
                    <h4 className="text-[10px] font-black uppercase text-slate-700 tracking-wider flex items-center gap-2">
                      <Printer className="h-3.5 w-3.5 text-primary" /> Dokumen & Berkas Kegiatan
                    </h4>
                    <span className="text-[9px] font-bold text-muted-foreground uppercase">Cetak PDF / Buka Arsip</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {/* Tombol Cetak Notulen PDF */}
                    <div className="flex items-center gap-1.5">
                      <Button
                        variant="outline"
                        className="flex-1 h-11 rounded-xl justify-between border-primary/20 hover:bg-primary/5 text-slate-800 shadow-xs"
                        onClick={() => handlePrintDok('notulen')}
                        disabled={isGeneratingDoc === 'notulen'}
                      >
                        <span className="text-[10px] font-black uppercase flex items-center gap-2">
                          {isGeneratingDoc === 'notulen' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Printer className="h-3.5 w-3.5 text-red-500" />}
                          Notulen PDF
                        </span>
                        <span className="text-[9px] font-bold text-primary">Cetak</span>
                      </Button>
                      {selectedActivity.driveUrls?.notulen && (
                        <Button variant="ghost" size="icon" className="h-11 w-11 rounded-xl border border-slate-200 hover:bg-slate-50 shrink-0" asChild title="Buka di Drive">
                          <a href={selectedActivity.driveUrls.notulen} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-3.5 w-3.5 text-slate-500" />
                          </a>
                        </Button>
                      )}
                    </div>

                    {/* Tombol Cetak Dok. Foto Kegiatan */}
                    {(() => {
                      const fotoKegiatan = (selectedActivity.cloudinaryUrls?.kegiatan && selectedActivity.cloudinaryUrls.kegiatan.length > 0)
                        ? selectedActivity.cloudinaryUrls.kegiatan
                        : (selectedActivity.imageUrls || []);
                      return (
                        <div className="flex items-center gap-1.5">
                          <Button
                            variant="outline"
                            className="flex-1 h-11 rounded-xl justify-between border-primary/20 hover:bg-primary/5 text-slate-800 shadow-xs"
                            onClick={() => handlePrintDok('kegiatan')}
                            disabled={fotoKegiatan.length === 0 || isGeneratingDoc === 'kegiatan'}
                          >
                            <span className="text-[10px] font-black uppercase flex items-center gap-2">
                              {isGeneratingDoc === 'kegiatan' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Printer className="h-3.5 w-3.5 text-blue-500" />}
                              Dok. Foto Lapangan
                            </span>
                            <span className="text-[9px] font-bold text-muted-foreground">({fotoKegiatan.length})</span>
                          </Button>
                          {selectedActivity.driveUrls?.dokKegiatan && (
                            <Button variant="ghost" size="icon" className="h-11 w-11 rounded-xl border border-slate-200 hover:bg-slate-50 shrink-0" asChild title="Buka di Drive">
                              <a href={selectedActivity.driveUrls.dokKegiatan} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="h-3.5 w-3.5 text-slate-500" />
                              </a>
                            </Button>
                          )}
                        </div>
                      );
                    })()}

                    {/* Tombol Cetak Dok. ATK */}
                    {(() => {
                      const fotoAtk = selectedActivity.cloudinaryUrls?.atk || [];
                      if (fotoAtk.length === 0 && !selectedActivity.driveUrls?.dokAtk) return null;
                      return (
                        <div className="flex items-center gap-1.5">
                          <Button
                            variant="outline"
                            className="flex-1 h-11 rounded-xl justify-between border-primary/20 hover:bg-primary/5 text-slate-800 shadow-xs"
                            onClick={() => handlePrintDok('atk')}
                            disabled={fotoAtk.length === 0 || isGeneratingDoc === 'atk'}
                          >
                            <span className="text-[10px] font-black uppercase flex items-center gap-2">
                              {isGeneratingDoc === 'atk' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Printer className="h-3.5 w-3.5 text-amber-500" />}
                              Dok. Foto ATK
                            </span>
                            <span className="text-[9px] font-bold text-muted-foreground">({fotoAtk.length})</span>
                          </Button>
                          {selectedActivity.driveUrls?.dokAtk && (
                            <Button variant="ghost" size="icon" className="h-11 w-11 rounded-xl border border-slate-200 hover:bg-slate-50 shrink-0" asChild title="Buka di Drive">
                              <a href={selectedActivity.driveUrls.dokAtk} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="h-3.5 w-3.5 text-slate-500" />
                              </a>
                            </Button>
                          )}
                        </div>
                      );
                    })()}

                    {/* Tombol Cetak Dok. Konsumsi */}
                    {(() => {
                      const fotoKonsumsi = selectedActivity.cloudinaryUrls?.konsumsi || [];
                      if (fotoKonsumsi.length === 0 && !selectedActivity.driveUrls?.dokKonsumsi) return null;
                      return (
                        <div className="flex items-center gap-1.5">
                          <Button
                            variant="outline"
                            className="flex-1 h-11 rounded-xl justify-between border-primary/20 hover:bg-primary/5 text-slate-800 shadow-xs"
                            onClick={() => handlePrintDok('konsumsi')}
                            disabled={fotoKonsumsi.length === 0 || isGeneratingDoc === 'konsumsi'}
                          >
                            <span className="text-[10px] font-black uppercase flex items-center gap-2">
                              {isGeneratingDoc === 'konsumsi' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Printer className="h-3.5 w-3.5 text-purple-500" />}
                              Dok. Foto Konsumsi
                            </span>
                            <span className="text-[9px] font-bold text-muted-foreground">({fotoKonsumsi.length})</span>
                          </Button>
                          {selectedActivity.driveUrls?.dokKonsumsi && (
                            <Button variant="ghost" size="icon" className="h-11 w-11 rounded-xl border border-slate-200 hover:bg-slate-50 shrink-0" asChild title="Buka di Drive">
                              <a href={selectedActivity.driveUrls.dokKonsumsi} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="h-3.5 w-3.5 text-slate-500" />
                              </a>
                            </Button>
                          )}
                        </div>
                      );
                    })()}

                    {/* Tombol Cetak BAST PDF (Untuk Internal) */}
                    {(selectedActivity.activityType === "Internal" || selectedActivity.category === "Internal" || selectedActivity.driveUrls?.bast) && (
                      <div className="flex items-center gap-1.5">
                        <Button
                          variant="outline"
                          className="flex-1 h-11 rounded-xl justify-between border-primary/20 hover:bg-primary/5 text-slate-800 shadow-xs"
                          onClick={() => handlePrintDok('bast')}
                          disabled={isGeneratingDoc === 'bast'}
                        >
                          <span className="text-[10px] font-black uppercase flex items-center gap-2">
                            {isGeneratingDoc === 'bast' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileCheck className="h-3.5 w-3.5 text-emerald-500" />}
                            BAST PDF
                          </span>
                          <span className="text-[9px] font-bold text-primary">Cetak</span>
                        </Button>
                        {selectedActivity.driveUrls?.bast && (
                          <Button variant="ghost" size="icon" className="h-11 w-11 rounded-xl border border-slate-200 hover:bg-slate-50 shrink-0" asChild title="Buka di Drive">
                            <a href={selectedActivity.driveUrls.bast} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="h-3.5 w-3.5 text-slate-500" />
                            </a>
                          </Button>
                        )}
                      </div>
                    )}

                    {/* Tombol Cetak Rundown Acara (Untuk Internal) */}
                    {(selectedActivity.activityType === "Internal" || selectedActivity.category === "Internal") && (
                      <div className="flex items-center gap-1.5">
                        <Button
                          variant="outline"
                          className="flex-1 h-11 rounded-xl justify-between border-primary/20 hover:bg-primary/5 text-slate-800 shadow-xs"
                          onClick={() => handlePrintDok('ra')}
                          disabled={isGeneratingDoc === 'ra'}
                        >
                          <span className="text-[10px] font-black uppercase flex items-center gap-2">
                            {isGeneratingDoc === 'ra' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ListOrdered className="h-3.5 w-3.5 text-indigo-500" />}
                            Rundown Acara (RA)
                          </span>
                          <span className="text-[9px] font-bold text-primary">Cetak</span>
                        </Button>
                      </div>
                    )}

                    {/* Undangan */}
                    {selectedActivity.driveUrls?.undangan && (
                      <Button variant="outline" className="h-11 rounded-xl justify-between border-primary/20 hover:bg-primary/5" asChild>
                        <a href={selectedActivity.driveUrls.undangan} target="_blank" rel="noopener noreferrer">
                          <span className="text-[10px] font-black uppercase flex items-center gap-2">
                            <BookOpen className="h-3.5 w-3.5 text-sky-500" /> File Undangan
                          </span>
                          <ExternalLink className="h-3.5 w-3.5 text-slate-400" />
                        </a>
                      </Button>
                    )}
                  </div>

                  {/* Buka Folder Drive */}
                  {selectedActivity.driveFolderId && (
                    <Button variant="secondary" className="w-full h-11 rounded-xl gap-2 font-black uppercase text-[10px] mt-2 shadow-xs" asChild>
                      <a href={`https://drive.google.com/drive/folders/${selectedActivity.driveFolderId}`} target="_blank" rel="noopener noreferrer">
                        <FolderOpen className="h-4 w-4 text-primary" /> Buka Arsip Lengkap di Google Drive
                      </a>
                    </Button>
                  )}
                </div>

                {/* GALERI FOTO TERSIMPAN */}
                {(() => {
                  const fotoKegiatan = (selectedActivity.cloudinaryUrls?.kegiatan && selectedActivity.cloudinaryUrls.kegiatan.length > 0)
                    ? selectedActivity.cloudinaryUrls.kegiatan
                    : (selectedActivity.imageUrls || []);
                  const fotoAtk = selectedActivity.cloudinaryUrls?.atk || [];
                  const fotoKonsumsi = selectedActivity.cloudinaryUrls?.konsumsi || [];
                  const totalFoto = fotoKegiatan.length + fotoAtk.length + fotoKonsumsi.length;

                  if (totalFoto === 0) return null;

                  return (
                    <div className="space-y-4 pt-2 border-t border-slate-100">
                      <div className="flex items-center justify-between">
                        <h4 className="text-[10px] font-black uppercase text-slate-700 tracking-wider flex items-center gap-2">
                          <ImageIcon className="h-3.5 w-3.5 text-primary" /> Galeri Foto Tersimpan ({totalFoto})
                        </h4>
                        <span className="text-[9px] text-muted-foreground font-medium">Klik foto untuk melihat ukuran penuh</span>
                      </div>

                      {/* Foto Lapangan Kegiatan */}
                      {fotoKegiatan.length > 0 && (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-[9px] font-bold uppercase bg-blue-50 text-blue-700 border-blue-200">
                              Foto Lapangan ({fotoKegiatan.length})
                            </Badge>
                          </div>
                          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                            {fotoKegiatan.map((url: string, idx: number) => (
                              <a
                                key={`keg-${idx}`}
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="relative aspect-video rounded-xl overflow-hidden border border-slate-200 hover:ring-2 hover:ring-primary/50 transition-all group bg-slate-100"
                              >
                                <Image src={url} alt={`Foto Lapangan ${idx + 1}`} fill className="object-cover group-hover:scale-105 transition-transform" unoptimized />
                              </a>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Foto ATK */}
                      {fotoAtk.length > 0 && (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-[9px] font-bold uppercase bg-amber-50 text-amber-700 border-amber-200">
                              Foto ATK / Belanja ({fotoAtk.length})
                            </Badge>
                          </div>
                          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                            {fotoAtk.map((url: string, idx: number) => (
                              <a
                                key={`atk-${idx}`}
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="relative aspect-video rounded-xl overflow-hidden border border-slate-200 hover:ring-2 hover:ring-primary/50 transition-all group bg-slate-100"
                              >
                                <Image src={url} alt={`Foto ATK ${idx + 1}`} fill className="object-cover group-hover:scale-105 transition-transform" unoptimized />
                              </a>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Foto Konsumsi */}
                      {fotoKonsumsi.length > 0 && (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-[9px] font-bold uppercase bg-purple-50 text-purple-700 border-purple-200">
                              Foto Konsumsi / Makan ({fotoKonsumsi.length})
                            </Badge>
                          </div>
                          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                            {fotoKonsumsi.map((url: string, idx: number) => (
                              <a
                                key={`kon-${idx}`}
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="relative aspect-video rounded-xl overflow-hidden border border-slate-200 hover:ring-2 hover:ring-primary/50 transition-all group bg-slate-100"
                              >
                                <Image src={url} alt={`Foto Konsumsi ${idx + 1}`} fill className="object-cover group-hover:scale-105 transition-transform" unoptimized />
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* AKSI EDIT & HAPUS */}
                <div className="pt-4 border-t flex flex-col sm:flex-row gap-3">
                  <Button variant="outline" className="flex-1 h-12 rounded-xl font-black uppercase gap-2 border-primary/20 text-primary hover:bg-primary/5 shadow-xs" onClick={() => handleOpenEdit(selectedActivity)}>
                    <Edit className="h-4 w-4" /> Edit Laporan
                  </Button>
                  <Button variant="destructive" className="flex-1 h-12 rounded-xl font-black uppercase gap-2 shadow-xs" onClick={() => setSelectedForDelete(selectedActivity)}>
                    <Trash2 className="h-4 w-4" /> Hapus
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="w-[95vw] sm:max-w-2xl md:max-w-3xl max-h-[92vh] overflow-y-auto p-6 sm:p-8 rounded-[2.5rem] bg-white dark:bg-[#081d27] shadow-2xl border border-white/80 text-slate-900">
          <DialogHeader className="pb-3 border-b border-stone-300/40">
            <DialogTitle className="text-xl sm:text-2xl font-condensed font-black text-slate-900 uppercase tracking-tight">Sunting Dokumentasi</DialogTitle>
            <DialogDescription className="text-xs font-bold uppercase tracking-wider text-stone-500">Perbarui data atau tambah dokumen susulan.</DialogDescription>
          </DialogHeader>
          {editingActivity && (
            <KegiatanUpload
              key={editingActivity.id}
              initialData={editingActivity}
              onSuccess={() => {
                refresh()
                setIsEditOpen(false)
                setEditingActivity(null)
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!selectedForDelete} onOpenChange={(open) => !open && setSelectedForDelete(null)}>
        <DialogContent className="w-[90vw] sm:max-w-[400px] rounded-[2.5rem] p-8 border-none shadow-2xl">
          <DialogHeader className="items-center text-center space-y-4">
            <div className="h-20 w-20 rounded-full bg-destructive/10 flex items-center justify-center">
              <AlertTriangle className="h-10 w-10 text-destructive" />
            </div>
            <div>
              <DialogTitle className="text-xl font-black text-destructive uppercase">Hapus Dokumentasi?</DialogTitle>
              <DialogDescription className="text-xs font-bold uppercase mt-1 leading-relaxed">Tindakan ini permanen.</DialogDescription>
            </div>
          </DialogHeader>
          <DialogFooter className="flex flex-col sm:flex-row gap-3 pt-6">
            <Button variant="ghost" onClick={() => setSelectedForDelete(null)} className="w-full sm:flex-1 h-12 rounded-2xl font-bold uppercase">Batal</Button>
            <Button variant="destructive" onClick={handleDelete} className="w-full sm:flex-1 h-12 rounded-2xl font-black uppercase">Ya, Hapus</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
