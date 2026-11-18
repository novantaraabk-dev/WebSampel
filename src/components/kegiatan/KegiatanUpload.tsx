
"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { ImagePlus, Loader2, FileText, Upload, Calendar as CalendarIcon, RefreshCw, Printer, FileCheck, Sparkles, BookOpen, AlertCircle, ChevronRight, CheckCircle, Save, Clock, ListOrdered, Paperclip, X, FileUp, Sparkle, HelpCircle, CheckCircle2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { ScrollArea } from "@/components/ui/scroll-area"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { useFirestore, useUser, useDoc, useMemoFirebase, useCollection } from "@/firebase"
import { collection, doc, addDoc, updateDoc } from "firebase/firestore"
import { invalidateCollectionCache } from "@/firebase/firestore/use-collection"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { GOOGLE_CONFIG } from "@/lib/google-config"
import { generateNotulenPDF, generateBASTPDF, generateDokumentasiPDF, generateRAPDF } from "@/lib/pdf-utils"
import { callAppsScript } from "@/app/agenda/actions"
import { generateNotulen } from "@/ai/flows/generate-notulen-flow"
import { ImageUploader } from "@/components/ui/image-uploader"

const formSchema = z.object({
  title: z.string().min(5, "Judul minimal 5 karakter"),
  description: z.string().min(1, "Isi notulen tidak boleh kosong"),
  activityType: z.enum(["Internal", "Eksternal"]).default("Internal"),
  category: z.string().default("Internal"),
  location: z.string().min(3, "Lokasi minimal 3 karakter"),
  date: z.string().min(1, "Pilih tanggal"),
  time: z.string().optional(),
  officialName: z.string().optional(),
}).refine((data) => {
  if (data.activityType === "Internal" && (!data.officialName || data.officialName === "")) {
    return false;
  }
  return true;
}, {
  message: "Pilih pelaksana kegiatan untuk kegiatan internal",
  path: ["officialName"],
})

interface AgendaItem {
  id: string
  summary: string
  location: string
  description?: string
  start: { dateTime: string };
}

export function KegiatanUpload({ onSuccess, initialData }: { onSuccess?: () => void, initialData?: any }) {
  const [isUploading, setIsUploading] = useState(false)
  const [isGeneratingAI, setIsGeneratingAI] = useState(false)
  const [isGeneratingDok, setIsGeneratingDok] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState(initialData ? "manual" : "agenda")
  const [isSyncing, setIsSyncing] = useState(false)
  const [agendas, setAgendas] = useState<AgendaItem[]>([])
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<string>(format(new Date(), "yyyy-MM-dd"))

  // Catatan manual & materi pendukung untuk Asisten AI
  const [manualNotes, setManualNotes] = useState("")
  const [aiMaterialFile, setAiMaterialFile] = useState<File | null>(null)
  const aiMaterialInputRef = useRef<HTMLInputElement>(null)

  // Cloudinary Image URLs
  const [cloudinaryUrls, setCloudinaryUrls] = useState<{
    kegiatan: string[],
    atk: string[],
    konsumsi: string[]
  }>({
    kegiatan: (initialData?.cloudinaryUrls?.kegiatan && initialData.cloudinaryUrls.kegiatan.length > 0) ? initialData.cloudinaryUrls.kegiatan : (initialData?.imageUrls || []),
    atk: initialData?.cloudinaryUrls?.atk || [],
    konsumsi: initialData?.cloudinaryUrls?.konsumsi || []
  })

  // Live active images in uploader (File objects or URL strings)
  const [activeCategoryImages, setActiveCategoryImages] = useState<{
    kegiatan: Array<File | string>,
    atk: Array<File | string>,
    konsumsi: Array<File | string>
  }>({
    kegiatan: (initialData?.cloudinaryUrls?.kegiatan && initialData.cloudinaryUrls.kegiatan.length > 0) ? initialData.cloudinaryUrls.kegiatan : (initialData?.imageUrls || []),
    atk: initialData?.cloudinaryUrls?.atk || [],
    konsumsi: initialData?.cloudinaryUrls?.konsumsi || []
  })

  const [selectedMaterials, setSelectedMaterials] = useState<File[]>([])
  const [selectedUndangan, setSelectedUndangan] = useState<File | null>(null)

  const undanganInputRef = useRef<HTMLInputElement>(null)
  const materiInputRef = useRef<HTMLInputElement>(null)

  const { toast } = useToast()
  const { user } = useUser()
  const db = useFirestore()

  const personnelRef = useMemoFirebase(() => db ? collection(db, "personnel") : null, [db])
  const { data: dbOfficials } = useCollection(personnelRef)

  // GLOBAL CONFIG: Use shared village settings
  const villageSettingsRef = useMemoFirebase(() => {
    if (!db) return null
    return doc(db, "settings", "village")
  }, [db])
  const { data: villageSettings } = useDoc(villageSettingsRef)

  const filteredOfficials = (dbOfficials || []).filter(o =>
    o.jabatan?.includes("KAUR") || o.jabatan?.includes("KEPALA SEKSI") || o.category === "Pemerintah Desa"
  );

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: initialData?.title || "",
      description: initialData?.description || "",
      activityType: initialData?.activityType || "Internal",
      category: initialData?.category || "Internal",
      location: initialData?.location || "Balai Desa Sampeldes",
      date: initialData?.date || format(new Date(), "yyyy-MM-dd"),
      time: initialData?.time || "",
      officialName: initialData?.officialName || "",
    },
  })

  const watchActivityType = form.watch("activityType");

  const handleSync = useCallback(async (date: string) => {
    setIsSyncing(true)
    setAgendas([])
    try {
      const calendarId = villageSettings?.googleCalendarId || GOOGLE_CONFIG.calendarId;
      const res = await callAppsScript({
        action: 'getCalendar',
        date: date,
        calendarId: calendarId
      });

      if (res.success && res.items) {
        setAgendas(res.items)
      } else {
        throw new Error(res.error || "Gagal mengambil data kalender")
      }
    } catch (err: any) {
      console.error("Sync Error:", err);
      toast({ variant: "destructive", title: "Gagal Sinkronisasi", description: "Tidak dapat menghubungkan kalender." })
    } finally {
      setIsSyncing(false)
    }
  }, [toast, villageSettings])

  useEffect(() => {
    if (!initialData && villageSettings) {
      handleSync(selectedCalendarDate);
    }
  }, [selectedCalendarDate, handleSync, initialData, villageSettings])

  const fileToBase64 = async (file: File): Promise<{ name: string, type: string, base64: string } | null> => {
    if (!file || file.size === 0) return null;
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.split(',')[1];
        resolve({
          name: file.name,
          type: file.type,
          base64: base64
        });
      };
      reader.onerror = error => reject(error);
    });
  }

  const blobToBase64 = (blob: Blob): Promise<string> => {
    const reader = new FileReader();
    return new Promise((resolve, reject) => {
      reader.onloadend = () => {
        const result = reader.result as string;
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  const handleSelectAgenda = (agenda: AgendaItem) => {
    const cleanTitle = agenda.summary.replace(/^Kegiatan\s*:\s*/i, "");
    form.setValue("title", cleanTitle, { shouldDirty: true, shouldValidate: true })

    if (agenda.start?.dateTime) {
      const startDate = new Date(agenda.start.dateTime);
      form.setValue("date", format(startDate, "yyyy-MM-dd"), { shouldDirty: true, shouldValidate: true })
      form.setValue("time", format(startDate, "HH:mm"), { shouldDirty: true, shouldValidate: true })
    }

    form.setValue("location", agenda.location || "Balai Desa Sampeldes", { shouldDirty: true, shouldValidate: true })

    // Otomatisasi tipe kegiatan berdasarkan agenda
    const desc = agenda.description || "";
    if (desc.includes("JENIS: Internal")) {
      form.setValue("activityType", "Internal", { shouldValidate: true });
      form.setValue("category", "Internal");
    } else if (desc.includes("JENIS: Eksternal")) {
      form.setValue("activityType", "Eksternal", { shouldValidate: true });
      form.setValue("category", "Eksternal");
    }

    setActiveTab("manual")
    toast({ title: "Agenda Terpilih", description: `Data telah terisi otomatis termasuk jam kegiatan.` })
  }

  const handlePreviewBAST = async () => {
    const values = form.getValues();
    if (!values.officialName) {
      toast({ variant: "destructive", title: "Pilih Pelaksana", description: "Silakan pilih nama pelaksana terlebih dahulu." });
      return;
    }
    try {
      const pdfBlob = await generateBASTPDF(values, villageSettings?.logoBase64);
      const url = URL.createObjectURL(pdfBlob);
      window.open(url, "_blank");
    } catch (e) {
      toast({ variant: "destructive", title: "Gagal PDF", description: "Kesalahan saat membuat BAST." });
    }
  }

  const handlePreviewRA = async () => {
    const values = form.getValues();
    try {
      const pdfBlob = await generateRAPDF(values, villageSettings?.logoBase64);
      const url = URL.createObjectURL(pdfBlob);
      window.open(url, "_blank");
    } catch (e) {
      toast({ variant: "destructive", title: "Gagal PDF", description: "Kesalahan saat membuat Rundown Acara." });
    }
  }

  const handlePreviewNotulen = async () => {
    const values = form.getValues();
    try {
      const pdfBlob = await generateNotulenPDF(values, villageSettings?.logoBase64);
      const url = URL.createObjectURL(pdfBlob);
      window.open(url, "_blank");
    } catch (e) {
      toast({ variant: "destructive", title: "Gagal PDF", description: "Kesalahan saat membuat Notulen." });
    }
  }

  const handlePreviewCategoryDok = async (category: 'kegiatan' | 'atk' | 'konsumsi') => {
    // Utamakan gambar yang saat ini aktif di uploader (File lokal atau Cloudinary URL)
    const imagesToPreview = (activeCategoryImages[category] && activeCategoryImages[category].length > 0)
      ? activeCategoryImages[category]
      : cloudinaryUrls[category];

    if (!imagesToPreview || imagesToPreview.length === 0) {
      toast({ variant: "destructive", title: "Foto Belum Diupload", description: `Silakan upload foto ${category.toUpperCase()} terlebih dahulu.` });
      return;
    }
    const values = form.getValues();
    if (!values.title) {
      toast({ variant: "destructive", title: "Judul Kosong", description: "Isi nama kegiatan terlebih dahulu." });
      return;
    }
    setIsGeneratingDok(category);
    try {
      const title = category === 'kegiatan' ? "DOKUMENTASI KEGIATAN" : category === 'atk' ? "DOKUMENTASI ATK" : "DOKUMENTASI KONSUMSI";
      const pdfBlob = await generateDokumentasiPDF(values, title, imagesToPreview, villageSettings?.logoBase64);
      const url = URL.createObjectURL(pdfBlob);
      window.open(url, "_blank");
    } catch (e) {
      console.error("Gagal cetak PDF dokumentasi:", e);
      toast({ variant: "destructive", title: "Gagal PDF", description: "Terjadi kesalahan sistem saat memproses gambar." });
    } finally {
      setIsGeneratingDok(null);
    }
  }

  const handleAskAI = async () => {
    const values = form.getValues();
    if (!values.title || values.title.trim().length < 3) {
      toast({
        variant: "destructive",
        title: "Nama Kegiatan Kosong",
        description: "Harap isi Nama Kegiatan terlebih dahulu agar AI memahami konteks notulen."
      });
      return;
    }

    setIsGeneratingAI(true);
    try {
      const response = await generateNotulen({
        title: values.title,
        location: values.location || "Balai Desa Sampeldes",
        date: values.date || format(new Date(), "yyyy-MM-dd"),
        manualNotes: manualNotes.trim() ? manualNotes.trim() : undefined,
        materialFile: aiMaterialFile || undefined,
      });

      if (response && response.notulen) {
        form.setValue("description", response.notulen, { shouldDirty: true, shouldValidate: true });
        toast({
          title: "Notulen Berhasil Disusun!",
          description: aiMaterialFile
            ? `Notulen diolah dari materi "${aiMaterialFile.name}" dan catatan lapangan Anda.`
            : "Draf narasi notulen resmi berhasil dibuat oleh Asisten AI."
        });
      } else {
        throw new Error("AI tidak memberikan respon teks.");
      }
    } catch (e: any) {
      console.error("Ask AI Error:", e);
      toast({
        variant: "destructive",
        title: "Gagal Menyusun Notulen AI",
        description: e?.message || "Layanan AI tidak dapat memproses saat ini. Silakan coba kembali."
      });
    } finally {
      setIsGeneratingAI(false);
    }
  }

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!user) return;

    if (cloudinaryUrls.kegiatan.length === 0) {
      toast({ variant: "destructive", title: "Foto Wajib", description: "Minimal upload 1 foto kegiatan ke Cloudinary." });
      return;
    }

    setIsUploading(true);

    try {
      // 1. Prepare materials & undangan (sertakan file materi AI jika ada)
      const allMaterialsToUpload = [...selectedMaterials];
      if (aiMaterialFile && !allMaterialsToUpload.some(f => f.name === aiMaterialFile.name)) {
        allMaterialsToUpload.push(aiMaterialFile);
      }
      const materialData = await Promise.all(allMaterialsToUpload.map(f => fileToBase64(f)));
      const undanganData = selectedUndangan ? await fileToBase64(selectedUndangan) : null;

      // 2. Generate PDF Files for Notulen & BAST
      const notulenBlob = await generateNotulenPDF(values, villageSettings?.logoBase64);
      const notulenBase64 = await blobToBase64(notulenBlob);

      let bastBase64 = null;
      if (values.activityType === "Internal") {
        const bastBlob = await generateBASTPDF(values, villageSettings?.logoBase64);
        bastBase64 = await blobToBase64(bastBlob);
      }

      // 3. Generate Documentation PDFs directly from active images & Cloudinary URLs
      let dokKegiatanBase64 = null;
      const imagesKegiatan = (activeCategoryImages.kegiatan.length > 0) ? activeCategoryImages.kegiatan : cloudinaryUrls.kegiatan;
      if (imagesKegiatan.length > 0) {
        const blob = await generateDokumentasiPDF(values, "DOKUMENTASI KEGIATAN", imagesKegiatan, villageSettings?.logoBase64);
        dokKegiatanBase64 = await blobToBase64(blob);
      }

      let dokAtkBase64 = null;
      const imagesAtk = (activeCategoryImages.atk.length > 0) ? activeCategoryImages.atk : cloudinaryUrls.atk;
      if (watchActivityType === "Internal" && imagesAtk.length > 0) {
        const blob = await generateDokumentasiPDF(values, "DOKUMENTASI ATK", imagesAtk, villageSettings?.logoBase64);
        dokAtkBase64 = await blobToBase64(blob);
      }

      let dokKonsumsiBase64 = null;
      const imagesKonsumsi = (activeCategoryImages.konsumsi.length > 0) ? activeCategoryImages.konsumsi : cloudinaryUrls.konsumsi;
      if (watchActivityType === "Internal" && imagesKonsumsi.length > 0) {
        const blob = await generateDokumentasiPDF(values, "DOKUMENTASI KONSUMSI", imagesKonsumsi, villageSettings?.logoBase64);
        dokKonsumsiBase64 = await blobToBase64(blob);
      }

      const targetFolderId = villageSettings?.kegiatanFolderId || GOOGLE_CONFIG.parentFolderId;

      // 4. Save Everything to Google Drive via Apps Script
      const result = await callAppsScript({
        action: 'saveToDrive',
        folderName: `${values.title} | ${values.date} ${initialData ? '(UPDATED)' : ''}`,
        parentFolderId: targetFolderId,
        files: {
          photos: [],
          materials: materialData.filter(Boolean),
          undangan: undanganData,
          notulen: { name: `Notulen_${values.title}.pdf`, type: 'application/pdf', base64: notulenBase64 },
          bast: bastBase64 ? { name: `BAST_${values.title}.pdf`, type: 'application/pdf', base64: bastBase64 } : null,
          dokKegiatan: dokKegiatanBase64 ? { name: `Dokumentasi_Kegiatan.pdf`, type: 'application/pdf', base64: dokKegiatanBase64 } : null,
          dokAtk: dokAtkBase64 ? { name: `Dokumentasi_ATK.pdf`, type: 'application/pdf', base64: dokAtkBase64 } : null,
          dokKonsumsi: dokKonsumsiBase64 ? { name: `Dokumentasi_Konsumsi.pdf`, type: 'application/pdf', base64: dokKonsumsiBase64 } : null,
        }
      });

      if (!result.success) throw new Error(result.error || "Gagal simpan ke Drive");

      // 5. Save to Firestore (Village Root Collection)
      const docData = {
        ...values,
        updatedBy: user.uid,
        uploadDate: initialData?.uploadDate || new Date().toISOString(),
        lastUpdate: new Date().toISOString(),
        driveFolderId: result.folderId,
        driveUrls: result.fileUrls || {},
        cloudinaryUrls: {
          kegiatan: cloudinaryUrls.kegiatan,
          atk: cloudinaryUrls.atk,
          konsumsi: cloudinaryUrls.konsumsi,
        },
        imageUrls: [...cloudinaryUrls.kegiatan, ...cloudinaryUrls.atk, ...cloudinaryUrls.konsumsi]
      };

      if (initialData?.id) {
        const docRef = doc(db, "kegiatans", initialData.id);
        await updateDoc(docRef, docData);
        invalidateCollectionCache("kegiatans");
        toast({ title: "Laporan Diperbarui!", description: `Data desa telah diupdate dan dokumen PDF baru telah diunggah ke Drive.` });
      } else {
        const kegiatanRef = collection(db, "kegiatans");
        await addDoc(kegiatanRef, docData);
        invalidateCollectionCache("kegiatans");
        toast({ title: "Berhasil!", description: `Laporan masuk ke database desa & Seluruh dokumen PDF diarsipkan ke Drive.` });
      }

      form.reset();
      setManualNotes("");
      setAiMaterialFile(null);
      setCloudinaryUrls({ kegiatan: [], atk: [], konsumsi: [] });
      setSelectedMaterials([]);
      setSelectedUndangan(null);
      onSuccess?.();
    } catch (err: any) {
      toast({ variant: "destructive", title: "Gagal Mengirim", description: err.message });
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <div className="space-y-6 w-full overflow-x-hidden font-sans">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        {!initialData && (
          <TabsList className="grid grid-cols-2 w-full h-13 mb-6 bg-white dark:bg-[#081d27] p-1.5 rounded-2xl shadow-inner border border-stone-300/40 gap-2">
            <TabsTrigger
              value="agenda"
              className="gap-2 text-xs font-condensed font-extrabold uppercase rounded-xl h-full transition-all text-stone-600 data-[state=active]:bg-white dark:bg-[#081d27] data-[state=active]:text-slate-900 data-[state=active]:shadow-sm data-[state=active]:border data-[state=active]:border-white/80 cursor-pointer"
            >
              <CalendarIcon className="h-4 w-4 text-emerald-700" />
              Agenda Desa
            </TabsTrigger>
            <TabsTrigger
              value="manual"
              className="gap-2 text-xs font-condensed font-extrabold uppercase rounded-xl h-full transition-all text-stone-600 data-[state=active]:bg-white dark:bg-[#081d27] data-[state=active]:text-slate-900 data-[state=active]:shadow-sm data-[state=active]:border data-[state=active]:border-white/80 cursor-pointer"
            >
              <FileText className="h-4 w-4 text-sky-700" />
              Isi Laporan
            </TabsTrigger>
          </TabsList>
        )}

        {/* TAB 1: AGENDA DESA */}
        <TabsContent value="agenda" className="mt-0 space-y-5 w-full">
          <div className="flex flex-col gap-4 w-full">
            <div className="flex items-end gap-3 p-5 rounded-3xl bg-white dark:bg-[#081d27] border border-slate-200/80 dark:border-white/10 shadow-sm">
              <div className="flex-1 space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-wider text-stone-600 block ml-1">
                  Pilih Tanggal Agenda
                </label>
                <input
                  type="date"
                  value={selectedCalendarDate}
                  onChange={(e) => setSelectedCalendarDate(e.target.value)}
                  className="w-full h-12 px-4 rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 shadow-xs font-bold text-sm text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-600"
                />
              </div>
              <button
                type="button"
                onClick={() => handleSync(selectedCalendarDate)}
                disabled={isSyncing}
                className="h-12 w-12 flex items-center justify-center rounded-xl bg-white dark:bg-white/5 border border-slate-200/80 dark:border-white/10 shadow-xs hover:border-teal-500/50 hover:bg-stone-200/40 active:scale-95 transition-all shrink-0 cursor-pointer"
                title="Sinkronkan Agenda"
              >
                <RefreshCw className={cn("h-5 w-5 text-emerald-700", isSyncing && "animate-spin")} />
              </button>
            </div>

            <div className="space-y-2 w-full">
              <ScrollArea className="h-[360px] w-full rounded-3xl p-3 bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 shadow-xs">
                {isSyncing ? (
                  <div className="flex flex-col items-center justify-center py-16 gap-3">
                    <Loader2 className="h-8 w-8 animate-spin text-emerald-700" />
                    <p className="text-xs font-bold uppercase tracking-wider text-stone-500">Menghubungkan ke Google Calendar...</p>
                  </div>
                ) : agendas.length > 0 ? (
                  <div className="space-y-3 w-full p-1">
                    {agendas.map((agenda: AgendaItem) => {
                      const isInternal = agenda.description?.includes("JENIS: Internal");
                      const isExternal = agenda.description?.includes("JENIS: Eksternal");

                      return (
                        <button
                          key={agenda.id}
                          type="button"
                          onClick={() => handleSelectAgenda(agenda)}
                          className={cn(
                            "w-full text-left p-4 rounded-2xl border transition-all flex items-start justify-between gap-3 group cursor-pointer",
                            "bg-white dark:bg-[#081d27] border border-slate-200/80 dark:border-white/10 shadow-xs hover:scale-[1.01] active:scale-[0.99]"
                          )}
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1.5">
                              <span className={cn(
                                "text-[9px] font-black uppercase px-2 py-0.5 rounded-full border shadow-2xs",
                                isInternal ? "bg-emerald-100 border-emerald-300 text-emerald-800" :
                                  isExternal ? "bg-sky-100 border-sky-300 text-sky-800" :
                                    "bg-stone-200 border-stone-300 text-stone-600"
                              )}>
                                {isInternal ? 'INTERNAL DESA' : isExternal ? 'EKSTERNAL' : 'UMUM'}
                              </span>
                            </div>
                            <p className="text-sm font-black text-slate-900 leading-snug group-hover:text-emerald-800 whitespace-normal break-words">
                              {agenda.summary}
                            </p>
                            <div className="flex items-center gap-2 mt-1.5">
                              <Clock className="h-3 w-3 text-emerald-700" />
                              <p className="text-[10px] font-mono font-bold text-stone-600">
                                {agenda.start?.dateTime ? format(new Date(agenda.start.dateTime), "HH:mm") : '--:--'} WIB
                              </p>
                            </div>
                            <p className="text-[11px] text-stone-500 mt-1 whitespace-normal break-words font-medium">
                              {agenda.location || 'Lokasi belum diatur'}
                            </p>
                          </div>
                          <ChevronRight className="h-5 w-5 text-stone-400 group-hover:text-emerald-700 shrink-0 mt-2 transition-transform group-hover:translate-x-0.5" />
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="py-16 text-center">
                    <p className="text-xs font-bold uppercase tracking-wider text-stone-500">Tidak ada agenda pada tanggal ini.</p>
                  </div>
                )}
              </ScrollArea>
            </div>
          </div>
        </TabsContent>

        {/* TAB 2: FORM ISI LAPORAN */}
        <TabsContent value="manual" className="mt-0 w-full">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pb-6">

              {/* CARD 1: INFORMASI KEGIATAN */}
              <div className="p-6 rounded-3xl bg-white dark:bg-[#081d27] border border-slate-200/80 dark:border-white/10 shadow-sm space-y-5">
                <div className="flex items-center gap-3 pb-3 border-b border-stone-300/40">
                  <div className="w-10 h-10 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 shadow-xs flex items-center justify-center text-emerald-700 shrink-0">
                    <CalendarIcon className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black uppercase text-slate-900 tracking-wider font-condensed">1. Data Pokok Kegiatan</h4>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-stone-500">Informasi waktu, tempat, dan kategori pelaksanaan kegiatan.</p>
                  </div>
                </div>

                <FormField
                  control={form.control}
                  name="activityType"
                  render={({ field }) => (
                    <FormItem className="space-y-2 p-4 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 shadow-xs">
                      <FormLabel className="text-[10px] font-black text-stone-600 uppercase tracking-wider block">
                        Jenis Kegiatan
                      </FormLabel>
                      <FormControl>
                        <RadioGroup onValueChange={field.onChange} defaultValue={field.value} value={field.value} className="flex gap-6">
                          <FormItem className="flex items-center space-x-2 space-y-0">
                            <FormControl><RadioGroupItem value="Internal" className="accent-emerald-700" /></FormControl>
                            <FormLabel className="font-bold text-xs text-slate-800 cursor-pointer">Internal Desa</FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-2 space-y-0">
                            <FormControl><RadioGroupItem value="Eksternal" className="accent-emerald-700" /></FormControl>
                            <FormLabel className="font-bold text-xs text-slate-800 cursor-pointer">Eksternal</FormLabel>
                          </FormItem>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem className="space-y-1.5">
                      <FormLabel className="text-[10px] font-black uppercase text-stone-600 tracking-wider ml-1">Nama Kegiatan</FormLabel>
                      <FormControl>
                        <input
                          placeholder="Contoh: Rapat Koordinasi Evaluasi BLT Dana Desa..."
                          className="w-full h-12 px-4 rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 shadow-xs font-bold text-sm text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-600 placeholder:text-stone-400"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="officialName"
                  render={({ field }) => (
                    <FormItem className="space-y-1.5 animate-in fade-in slide-in-from-top-1">
                      <FormLabel className="text-[10px] font-black uppercase text-stone-600 tracking-wider ml-1">Pelaksana Kegiatan</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="h-12 px-4 rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 shadow-xs font-bold text-sm text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-600">
                            <SelectValue placeholder="Pilih Pelaksana..." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-white dark:bg-[#081d27] rounded-xl shadow-xl border border-slate-200 dark:border-white/10">
                          <ScrollArea className="h-[200px]">
                            {filteredOfficials.map((o: any) => (
                              <SelectItem key={`${o.name}-${o.jabatan}`} value={`${o.name} - ${o.jabatan}`} className="font-bold text-xs uppercase cursor-pointer hover:bg-stone-200/50">
                                {o.name} - {o.jabatan}
                              </SelectItem>
                            ))}
                          </ScrollArea>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Grid Responsif Tanggal, Jam, Lokasi (Luas & Rapi) */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3.5">
                  <FormField control={form.control} name="date" render={({ field }) => (
                    <FormItem className="sm:col-span-4 space-y-1.5">
                      <FormLabel className="text-[10px] font-black uppercase text-stone-600 tracking-wider ml-1">Tanggal</FormLabel>
                      <FormControl>
                        <input
                          type="date"
                          className="w-full h-12 px-3 rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 shadow-xs font-bold text-sm text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-600"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="time" render={({ field }) => (
                    <FormItem className="sm:col-span-3 space-y-1.5">
                      <FormLabel className="text-[10px] font-black uppercase text-stone-600 tracking-wider ml-1 flex items-center gap-1">
                        <Clock className="h-3 w-3 text-emerald-700" /> Jam
                      </FormLabel>
                      <FormControl>
                        <input
                          type="time"
                          className="w-full h-12 px-3 rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 shadow-xs font-bold text-sm text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-600"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="location" render={({ field }) => (
                    <FormItem className="sm:col-span-5 space-y-1.5">
                      <FormLabel className="text-[10px] font-black uppercase text-stone-600 tracking-wider ml-1">Lokasi</FormLabel>
                      <FormControl>
                        <input
                          placeholder="Tempat kegiatan..."
                          className="w-full h-12 px-4 rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 shadow-xs font-bold text-sm text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-600 placeholder:text-stone-400"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
              </div>

              {/* CARD 2: PENYUSUNAN NOTULEN & ASISTEN AI */}
              <div className="p-6 rounded-3xl bg-white dark:bg-[#081d27] border border-slate-200/80 dark:border-white/10 shadow-sm space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-stone-300/40">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-[#0e1620] flex items-center justify-center text-amber-300 shrink-0 shadow-sm">
                      <Sparkles className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-black uppercase tracking-wider text-slate-900 font-condensed">
                        2. Penyusunan Notulen &amp; Asisten AI
                      </h4>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-stone-500">
                        AI dapat membaca materi terlampir dan catatan manual Anda untuk merangkum notulen resmi.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Sub-Card: Input Catatan Manual & Upload Materi untuk AI */}
                <div className="p-5 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 shadow-xs space-y-4">
                  {/* Box Catatan Manual (Opsional) */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-black uppercase text-stone-700 tracking-wider flex items-center gap-1.5">
                        <FileText className="h-3.5 w-3.5 text-emerald-700" />
                        Poin Catatan Lapangan / Manual
                      </label>
                      <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-white dark:bg-[#081d27] shadow-inner border border-stone-300/30 text-stone-500 uppercase tracking-wider">Opsional</span>
                    </div>
                    <textarea
                      value={manualNotes}
                      onChange={(e) => setManualNotes(e.target.value)}
                      placeholder="Masukkan ringkasan atau poin-poin catatan manual jika ada (contoh: Rapat menyetujui anggaran jalan 25 juta, pengerjaan dimulai tanggal 10 depan, arahan Kades agar warga dilibatkan)..."
                      className="w-full min-h-[85px] p-3.5 rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 shadow-xs text-xs font-medium text-slate-900 leading-relaxed focus:outline-none focus:ring-1 focus:ring-emerald-600 placeholder:text-stone-400"
                    />
                    <p className="text-[9.5px] font-bold text-stone-500 uppercase tracking-wide">
                      *Bila diisi, AI akan otomatis menyesuaikan isi notulen dengan poin-poin catatan manual ini.
                    </p>
                  </div>

                  {/* Tombol Upload Materi Dokumen (Opsional) */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-black uppercase text-stone-700 tracking-wider flex items-center gap-1.5">
                        <BookOpen className="h-3.5 w-3.5 text-emerald-700" />
                        Upload Materi Dokumen / Presentasi
                      </label>
                      <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-white dark:bg-[#081d27] shadow-inner border border-stone-300/30 text-stone-500 uppercase tracking-wider">Opsional</span>
                    </div>

                    <input
                      type="file"
                      ref={aiMaterialInputRef}
                      className="hidden"
                      accept=".pdf,.png,.jpg,.jpeg,.webp,.ppt,.pptx,.doc,.docx"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setAiMaterialFile(file);
                        }
                      }}
                    />

                    {aiMaterialFile ? (
                      <div className="flex items-center justify-between p-3.5 rounded-xl bg-white dark:bg-[#081d27] shadow-inner border border-emerald-300 transition-all">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0 text-emerald-800">
                            <CheckCircle2 className="h-4 w-4" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-slate-900 truncate">{aiMaterialFile.name}</p>
                            <p className="text-[10px] text-emerald-800 font-bold uppercase tracking-wider">
                              {(aiMaterialFile.size / 1024).toFixed(1)} KB &bull; Siap dianalisis oleh AI
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => aiMaterialInputRef.current?.click()}
                            className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-800 bg-white dark:bg-white/5 border border-slate-200/80 dark:border-white/10 shadow-xs rounded-lg active:scale-95 transition-all cursor-pointer"
                          >
                            Ganti File
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setAiMaterialFile(null);
                              if (aiMaterialInputRef.current) aiMaterialInputRef.current.value = "";
                            }}
                            className="p-1 text-stone-400 hover:text-red-600 transition-colors cursor-pointer"
                            title="Hapus file"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => aiMaterialInputRef.current?.click()}
                        className="w-full py-3.5 px-4 rounded-xl bg-white dark:bg-white/5 border border-slate-200/80 dark:border-white/10 shadow-xs hover:border-teal-500/50 hover:bg-stone-200/40 active:scale-98 transition-all flex items-center justify-center gap-2.5 group text-left cursor-pointer"
                      >
                        <FileUp className="h-4 w-4 text-emerald-700 group-hover:scale-110 transition-transform shrink-0" />
                        <div className="flex flex-col sm:flex-row sm:items-center gap-1">
                          <span className="text-xs font-black uppercase text-slate-800">Upload File Materi (PDF / JPG / PPT)</span>
                          <span className="text-[10px] text-stone-500 font-medium hidden sm:inline">- AI akan membaca teks slide &amp; dokumen</span>
                        </div>
                      </button>
                    )}
                    <p className="text-[9.5px] font-bold uppercase tracking-wider text-stone-400">
                      *Mendukung format PDF, Gambar (JPG/PNG), Slide PPT/PPTX, dan DOCX.
                    </p>
                  </div>

                  {/* Tombol Tanya AI */}
                  <button
                    type="button"
                    onClick={handleAskAI}
                    disabled={isGeneratingAI}
                    className="w-full h-12 rounded-xl bg-[#0e1620] hover:bg-slate-900 active:scale-98 text-amber-300 font-condensed font-black text-xs uppercase tracking-wider shadow-sm border border-white/10 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-60"
                  >
                    {isGeneratingAI ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin text-amber-300" />
                        <span>AI Sedang Menganalisis &amp; Menyusun Notulen...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4 text-amber-300" />
                        <span>Tanya AI (Generate Notulen Otomatis)</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Hasil Notulen Resmi (Textarea Utama) */}
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem className="space-y-2 pt-2">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <FormLabel className="text-[10px] font-black uppercase text-stone-700 tracking-wider">
                          Isi Notulen Resmi
                        </FormLabel>
                        <div className="flex gap-1.5 flex-wrap">
                          <button
                            type="button"
                            className="flex h-7 items-center gap-1.5 rounded-lg bg-white dark:bg-white/5 border border-slate-200/80 dark:border-white/10 shadow-xs px-2.5 text-[9.5px] font-black uppercase tracking-wider text-emerald-800 hover:text-emerald-950 transition-all cursor-pointer"
                            onClick={handlePreviewNotulen}
                          >
                            <Printer className="h-3 w-3 text-emerald-700" /> Cetak PDF Notulen
                          </button>
                          {watchActivityType === "Internal" && (
                            <>
                              <button
                                type="button"
                                className="flex h-7 items-center gap-1.5 rounded-lg bg-white dark:bg-white/5 border border-slate-200/80 dark:border-white/10 shadow-xs px-2.5 text-[9.5px] font-black uppercase tracking-wider text-sky-800 hover:text-sky-950 transition-all cursor-pointer"
                                onClick={handlePreviewRA}
                              >
                                <ListOrdered className="h-3 w-3 text-sky-700" /> Cetak PDF RA
                              </button>
                              <button
                                type="button"
                                className="flex h-7 items-center gap-1.5 rounded-lg bg-white dark:bg-white/5 border border-slate-200/80 dark:border-white/10 shadow-xs px-2.5 text-[9.5px] font-black uppercase tracking-wider text-amber-800 hover:text-amber-950 transition-all cursor-pointer"
                                onClick={handlePreviewBAST}
                              >
                                <FileCheck className="h-3 w-3 text-amber-700" /> Cetak PDF BAST
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                      <FormControl>
                        <textarea
                          placeholder="Hasil narasi notulen resmi kegiatan..."
                          className="w-full min-h-[140px] p-4 rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 shadow-xs text-sm font-medium text-slate-900 leading-relaxed focus:outline-none focus:ring-1 focus:ring-emerald-600 placeholder:text-stone-400"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* CARD 3: DOKUMENTASI FOTO */}
              <div className="p-6 rounded-3xl bg-white dark:bg-[#081d27] border border-slate-200/80 dark:border-white/10 shadow-sm space-y-6">
                <div className="flex items-center gap-3 pb-3 border-b border-stone-300/40">
                  <div className="w-10 h-10 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 shadow-xs flex items-center justify-center text-sky-700 shrink-0">
                    <ImagePlus className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black uppercase text-slate-900 tracking-wider font-condensed">3. Dokumentasi Foto Lapangan</h4>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-stone-500">Upload foto kegiatan untuk arsip dan penyusunan berkas PDF dokumentasi.</p>
                  </div>
                </div>

                <div className="space-y-5">
                  <div className="space-y-3 p-5 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 shadow-xs">
                    <ImageUploader
                      label={watchActivityType === "Internal" ? "Foto Utama Kegiatan (Wajib minimal 1)" : "Foto Utama Kegiatan (Wajib minimal 1)"}
                      initialUrls={cloudinaryUrls.kegiatan}
                      onUploadComplete={(urls: string[]) => setCloudinaryUrls(prev => ({ ...prev, kegiatan: urls }))}
                      onUrlsChange={(urls: string[]) => setCloudinaryUrls(prev => ({ ...prev, kegiatan: urls }))}
                      onActiveImagesChange={(images) => setActiveCategoryImages(prev => ({ ...prev, kegiatan: images }))}
                    />
                    <button
                      type="button"
                      className="w-full h-11 text-xs font-condensed font-black uppercase tracking-wider gap-2 rounded-xl bg-white dark:bg-white/5 border border-slate-200/80 dark:border-white/10 shadow-xs hover:border-teal-500/50 hover:bg-stone-200/40 active:scale-98 transition-all flex items-center justify-center cursor-pointer disabled:opacity-50"
                      onClick={() => handlePreviewCategoryDok('kegiatan')}
                      disabled={(activeCategoryImages.kegiatan.length === 0 && cloudinaryUrls.kegiatan.length === 0) || !!isGeneratingDok}
                    >
                      {isGeneratingDok === 'kegiatan' ? <Loader2 className="h-4 w-4 animate-spin text-emerald-700" /> : <Printer className="h-4 w-4 text-emerald-700" />}
                      <span>Cetak PDF Dokumentasi Kegiatan</span>
                    </button>
                  </div>

                  {watchActivityType === "Internal" && (
                    <>
                      <div className="space-y-3 p-5 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 shadow-xs">
                        <ImageUploader
                          label="Foto ATK / Belanja (Internal)"
                          initialUrls={cloudinaryUrls.atk}
                          onUploadComplete={(urls: string[]) => setCloudinaryUrls(prev => ({ ...prev, atk: urls }))}
                          onUrlsChange={(urls: string[]) => setCloudinaryUrls(prev => ({ ...prev, atk: urls }))}
                          onActiveImagesChange={(images) => setActiveCategoryImages(prev => ({ ...prev, atk: images }))}
                        />
                        <button
                          type="button"
                          className="w-full h-11 text-xs font-condensed font-black uppercase tracking-wider gap-2 rounded-xl bg-white dark:bg-white/5 border border-slate-200/80 dark:border-white/10 shadow-xs hover:border-teal-500/50 hover:bg-stone-200/40 active:scale-98 transition-all flex items-center justify-center cursor-pointer disabled:opacity-50"
                          onClick={() => handlePreviewCategoryDok('atk')}
                          disabled={(activeCategoryImages.atk.length === 0 && cloudinaryUrls.atk.length === 0) || !!isGeneratingDok}
                        >
                          {isGeneratingDok === 'atk' ? <Loader2 className="h-4 w-4 animate-spin text-sky-700" /> : <Printer className="h-4 w-4 text-sky-700" />}
                          <span>Cetak PDF Dokumentasi ATK</span>
                        </button>
                      </div>

                      <div className="space-y-3 p-5 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 shadow-xs">
                        <ImageUploader
                          label="Foto Konsumsi / Makan (Internal)"
                          initialUrls={cloudinaryUrls.konsumsi}
                          onUploadComplete={(urls: string[]) => setCloudinaryUrls(prev => ({ ...prev, konsumsi: urls }))}
                          onUrlsChange={(urls: string[]) => setCloudinaryUrls(prev => ({ ...prev, konsumsi: urls }))}
                          onActiveImagesChange={(images) => setActiveCategoryImages(prev => ({ ...prev, konsumsi: images }))}
                        />
                        <button
                          type="button"
                          className="w-full h-11 text-xs font-condensed font-black uppercase tracking-wider gap-2 rounded-xl bg-white dark:bg-white/5 border border-slate-200/80 dark:border-white/10 shadow-xs hover:border-teal-500/50 hover:bg-stone-200/40 active:scale-98 transition-all flex items-center justify-center cursor-pointer disabled:opacity-50"
                          onClick={() => handlePreviewCategoryDok('konsumsi')}
                          disabled={(activeCategoryImages.konsumsi.length === 0 && cloudinaryUrls.konsumsi.length === 0) || !!isGeneratingDok}
                        >
                          {isGeneratingDok === 'konsumsi' ? <Loader2 className="h-4 w-4 animate-spin text-amber-700" /> : <Printer className="h-4 w-4 text-amber-700" />}
                          <span>Cetak PDF Dokumentasi Konsumsi</span>
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* CARD 4: ARSIP BERKAS GOOGLE DRIVE */}
              <div className="p-6 rounded-3xl bg-white dark:bg-[#081d27] border border-slate-200/80 dark:border-white/10 shadow-sm space-y-5">
                <div className="flex items-center gap-3 pb-3 border-b border-stone-300/40">
                  <div className="w-10 h-10 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 shadow-xs flex items-center justify-center text-emerald-700 shrink-0">
                    <Upload className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black uppercase text-slate-900 tracking-wider font-condensed">4. Lampiran Arsip Drive (Opsional)</h4>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-stone-500">Dokumen pelengkap yang otomatis disimpan di folder Google Drive kegiatan desa.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div
                    onClick={() => undanganInputRef.current?.click()}
                    className={cn(
                      "p-5 rounded-2xl flex flex-col items-center justify-center gap-2 cursor-pointer transition-all text-center",
                      selectedUndangan ? "bg-emerald-50/50 shadow-inner border border-emerald-300 text-emerald-800" : "bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 shadow-xs hover:bg-stone-200/30 text-stone-700"
                    )}
                  >
                    <input type="file" ref={undanganInputRef} className="hidden" accept=".pdf" onChange={(e) => setSelectedUndangan(e.target.files?.[0] || null)} />
                    {selectedUndangan ? <CheckCircle className="h-6 w-6 text-emerald-700" /> : <FileText className="h-6 w-6 text-stone-400" />}
                    <span className="text-xs font-black uppercase tracking-wider">
                      {selectedUndangan ? selectedUndangan.name : "Upload Surat Undangan (PDF)"}
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">Arsip undangan resmi kegiatan</span>
                  </div>

                  <div
                    onClick={() => materiInputRef.current?.click()}
                    className={cn(
                      "p-5 rounded-2xl flex flex-col items-center justify-center gap-2 cursor-pointer transition-all text-center",
                      selectedMaterials.length > 0 ? "bg-emerald-50/50 shadow-inner border border-emerald-300 text-emerald-800" : "bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 shadow-xs hover:bg-stone-200/30 text-stone-700"
                    )}
                  >
                    <input type="file" ref={materiInputRef} className="hidden" accept=".pdf,.doc,.docx,.ppt,.pptx" multiple onChange={(e) => setSelectedMaterials(Array.from(e.target.files || []))} />
                    {selectedMaterials.length > 0 ? <CheckCircle className="h-6 w-6 text-emerald-700" /> : <BookOpen className="h-6 w-6 text-stone-400" />}
                    <span className="text-xs font-black uppercase tracking-wider">
                      {selectedMaterials.length > 0 ? `${selectedMaterials.length} File Materi Terpilih` : "Upload Materi Tambahan (Drive)"}
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">Arsip materi presentasi/dokumen</span>
                  </div>
                </div>
              </div>

              {/* SUBMIT BUTTON */}
              <button
                type="submit"
                disabled={isUploading}
                className="w-full h-14 text-sm font-condensed font-black uppercase tracking-wider rounded-2xl bg-emerald-700 hover:bg-emerald-800 active:scale-98 text-white shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin text-white" />
                    <span>{initialData ? 'Memperbarui Laporan...' : 'Menyimpan & Mengarsipkan ke Drive...'}</span>
                  </>
                ) : initialData ? (
                  <>
                    <Save className="h-5 w-5 text-amber-300" />
                    <span>Perbarui Laporan Kegiatan</span>
                  </>
                ) : (
                  <>
                    <Upload className="h-5 w-5 text-amber-300" />
                    <span>Simpan ke Database &amp; Arsip Desa</span>
                  </>
                )}
              </button>
            </form>
          </Form>
        </TabsContent>
      </Tabs>
    </div>
  )
}
