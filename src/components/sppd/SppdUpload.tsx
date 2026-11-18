"use client"

import { useState, useEffect, useCallback } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2, Plane, Calendar as CalendarIcon, RefreshCw, ChevronRight, Save, Hash, Sparkles, Clock, MapPin, Users, FileText } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useFirestore, useUser, useCollection, useMemoFirebase, useDoc } from "@/firebase"
import { collection, doc } from "firebase/firestore"
import { addDocumentNonBlocking, updateDocumentNonBlocking } from "@/firebase/non-blocking-updates"
import { format, addDays, parseISO } from "date-fns"
import { cn } from "@/lib/utils"
import { ScrollArea } from "@/components/ui/scroll-area"
import { GOOGLE_CONFIG } from "@/lib/google-config"
import { callAppsScript } from "@/app/agenda/actions"
import { getNextSequenceNumber, saveToBukuAgenda } from "@/lib/naskah-dinas-utils"

const formSchema = z.object({
  category: z.string().min(1, "Pilih kategori"),
  officialName: z.string().min(1, "Pilih atau isi nama personel"),
  stNumber: z.string().min(3, "Nomor Surat Tugas wajib diisi"),
  sppdNumber: z.string().min(3, "Nomor SPPD wajib diisi"),
  destination: z.string().min(3, "Tujuan minimal 3 karakter"),
  totalExpense: z.string().min(1, "Total biaya harus diisi"),
  startDate: z.string().min(1, "Pilih tanggal mulai"),
  endDate: z.string().min(1, "Pilih tanggal selesai"),
  description: z.string().optional(),
  companions: z.string().optional(),
})

interface AgendaItem {
  id: string
  summary: string
  location: string
  description?: string
  start: { dateTime: string };
}

interface CompanionEntry {
  category: string
  name: string
}

interface SppdUploadProps {
  onSuccess?: () => void
  initialData?: any
}

export function SppdUpload({ onSuccess, initialData }: SppdUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [isFetchingStNumber, setIsFetchingStNumber] = useState(false)
  const [isFetchingSppdNumber, setIsFetchingSppdNumber] = useState(false)
  const [activeTab, setActiveTab] = useState(initialData ? "manual" : "agenda")
  const [isSyncing, setIsSyncing] = useState(false)
  const [agendas, setAgendas] = useState<AgendaItem[]>([])
  const [selectedCalendarDate, setSelectedCalendarDate] = useState(format(new Date(), "yyyy-MM-dd"))
  const [duration, setDuration] = useState<number>(1)
  
  const [numCompanions, setNumCompanions] = useState<number>(0)
  const [companionsList, setCompanionsList] = useState<CompanionEntry[]>([])

  const { toast } = useToast()
  const { user } = useUser()
  const db = useFirestore()
  
  const personnelRef = useMemoFirebase(() => (db && user) ? collection(db, "personnel") : null, [db, user])
  const { data: dbOfficials } = useCollection(personnelRef)

  // Baca googleCalendarId dari user settings (sama seperti RincianKegiatan & Dashboard)
  const userDocRef = useMemoFirebase(() => (db && user) ? doc(db, "users", user.uid) : null, [db, user])
  const { data: userData } = useDoc(userDocRef)
  const villageSettingsRef = useMemoFirebase(() => db ? doc(db, "settings", "village") : null, [db])
  const { data: villageSettings } = useDoc(villageSettingsRef)
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      category: initialData?.category || "",
      officialName: initialData?.officialName || "",
      stNumber: initialData?.stNumber || initialData?.letterNumber || "", // backward compat
      sppdNumber: initialData?.sppdNumber || initialData?.documentNumber || "", // backward compat
      destination: initialData?.destination || "",
      totalExpense: initialData?.amount?.toString() || "",
      startDate: initialData?.startDate || format(new Date(), "yyyy-MM-dd"),
      endDate: initialData?.endDate || format(new Date(), "yyyy-MM-dd"),
      description: initialData?.description || "",
      companions: initialData?.companions || "",
    },
  })

  useEffect(() => {
    if (initialData?.companions) {
      const lines = initialData.companions.split("\n").filter(Boolean)
      const parsed = lines.map((line: string) => {
        const parts = line.split(" - ")
        return { name: parts[0], category: parts[1] || "Pemerintah Desa" }
      })
      setCompanionsList(parsed)
      setNumCompanions(parsed.length)
    }
  }, [initialData])

  const watchStartDate = form.watch("startDate")
  const selectedCategory = form.watch("category")

  useEffect(() => {
    if (watchStartDate) {
      const start = parseISO(watchStartDate)
      const end = addDays(start, duration - 1)
      form.setValue("endDate", format(end, "yyyy-MM-dd"), { shouldValidate: true })
    }
  }, [watchStartDate, duration, form])

  const handleNumCompanionsChange = (val: string) => {
    const num = parseInt(val) || 0
    setNumCompanions(num)
    const newList = [...companionsList]
    if (num > newList.length) {
      for (let i = newList.length; i < num; i++) {
        newList.push({ category: "", name: "" })
      }
    } else {
      newList.splice(num)
    }
    setCompanionsList(newList)
  }

  const updateCompanion = (index: number, field: keyof CompanionEntry, value: string) => {
    const newList = [...companionsList]
    newList[index] = { ...newList[index], [field]: value }
    if (field === 'category') newList[index].name = "" 
    setCompanionsList(newList)
  }

  const handlePullStNumber = async () => {
    if (!db) return
    setIsFetchingStNumber(true)
    try {
      const nextNum = await getNextSequenceNumber(db, "surat_tugas_sppd")
      form.setValue("stNumber", nextNum, { shouldValidate: true })
      toast({ title: "No. Surat Tugas Ditarik", description: nextNum })
    } catch (err: any) {
      toast({ variant: "destructive", title: "Gagal Tarik Nomor" })
    } finally {
      setIsFetchingStNumber(false)
    }
  }

  const handlePullSppdNumber = async () => {
    if (!db) return
    setIsFetchingSppdNumber(true)
    try {
      const nextNum = await getNextSequenceNumber(db, "sppd")
      form.setValue("sppdNumber", nextNum, { shouldValidate: true })
      toast({ title: "No. SPPD Ditarik", description: nextNum })
    } catch (err: any) {
      toast({ variant: "destructive", title: "Gagal Tarik Nomor" })
    } finally {
      setIsFetchingSppdNumber(false)
    }
  }

  const handleSync = useCallback(async (date: string) => {
    setIsSyncing(true)
    setAgendas([])
    try {
      // Gunakan calendarId dari user settings atau village settings (sama seperti RincianKegiatan)
      const calendarId = userData?.googleCalendarId || villageSettings?.googleCalendarId || GOOGLE_CONFIG.calendarId;
      const res = await callAppsScript({
        action: 'getCalendar',
        date: date,
        calendarId: calendarId
      });
      if (res && res.success && res.items) {
        // Hanya tampilkan agenda eksternal untuk keperluan SPPD perjalanan dinas
        const externalOnly = res.items.filter((item: any) =>
          (item.description || '').includes('JENIS: Eksternal')
        );
        setAgendas(externalOnly);
      } else {
        setAgendas([]);
      }
    } catch (err: any) {
      // Silent fail: jangan crash, cukup kosongkan agenda
      setAgendas([]);
    } finally {
      setIsSyncing(false)
    }
  }, [userData, villageSettings]);

  useEffect(() => {
    // Tunggu userData (googleCalendarId) siap dulu sebelum fetch, sama seperti RincianKegiatan
    if (activeTab === 'agenda' && (userData !== undefined || villageSettings !== undefined)) {
      handleSync(selectedCalendarDate);
    }
  }, [selectedCalendarDate, handleSync, activeTab, userData, villageSettings]);

  const handleSelectAgenda = (agenda: AgendaItem) => {
    form.setValue("destination", agenda.location || "Luar Desa", { shouldValidate: true })
    form.setValue("startDate", format(new Date(agenda.start.dateTime), "yyyy-MM-dd"), { shouldValidate: true })
    form.setValue("description", agenda.summary, { shouldValidate: true })
    setActiveTab("manual")
  }

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!user || !db) return
    setIsUploading(true)
    
    const serializedCompanions = companionsList
      .filter(c => c.name && c.category)
      .map(c => `${c.name} - ${c.category}`)
      .join("\n")

    const payload = {
      ...values,
      userId: user.uid,
      amount: parseFloat(values.totalExpense) || 0,
      expenseDate: initialData?.expenseDate || new Date().toISOString(),
      approvalStatus: initialData?.approvalStatus || "pending",
      description: values.description || `Perjalanan dinas ke ${values.destination}`,
      companions: serializedCompanions,
      // Mapping for backward compatibility with cetak form
      letterNumber: values.stNumber,
      documentNumber: values.sppdNumber
    }

    try {
      if (initialData?.id) {
        const docRef = doc(db, "users", user.uid, "sppds", initialData.id)
        updateDocumentNonBlocking(docRef, payload)
      } else {
        const sppdRef = collection(db, "users", user.uid, "sppds")
        addDocumentNonBlocking(sppdRef, { ...payload, documentUrls: [] })
      }

      // SINKRON KE BUKU AGENDA (SURAT TUGAS KE SURAT KELUAR, SPPD KE SPPD)
      await saveToBukuAgenda(db, {
        kategori: "surat_keluar",
        nomor: values.stNumber,
        perihal: `Surat Tugas: ${values.description || values.destination}`,
        userId: user.uid
      });

      await saveToBukuAgenda(db, {
        kategori: "sppd",
        nomor: values.sppdNumber,
        perihal: `SPPD: ${values.description || values.destination}`,
        userId: user.uid
      });

      toast({ title: "Sukses!", description: "Pengajuan SPPD telah dicatat dalam Buku Agenda." })
      form.reset()
      onSuccess?.()
    } catch (err) {
      toast({ variant: "destructive", title: "Terjadi Kesalahan", description: "Gagal menyimpan data." })
    } finally {
      setIsUploading(false)
    }
  }

  const personnelCategories = [
    { id: "Pemerintah Desa", label: "Perangkat" },
    { id: "BPD", label: "BPD" },
    { id: "RT/RW", label: "RT/RW" },
    { id: "Kader", label: "Kader" },
    { id: "Lainnya", label: "Lainnya" }
  ]

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
              <Plane className="h-4 w-4 text-sky-700" />
              Isi Pengajuan
            </TabsTrigger>
          </TabsList>
        )}

        {/* TAB 1: AGENDA DESA */}
        <TabsContent value="agenda" className="mt-0 space-y-4">
          <div className="flex items-end gap-3 p-5 rounded-3xl bg-white dark:bg-[#081d27] border border-slate-200/80 dark:border-white/10 shadow-sm">
            <div className="flex-1 space-y-1.5">
              <label className="text-[10px] font-black uppercase text-stone-600 block ml-1">Pilih Tanggal Agenda</label>
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
            <ScrollArea className="h-[340px] w-full rounded-3xl p-3 bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 shadow-xs">
              {isSyncing ? (
                <div className="flex flex-col items-center justify-center py-16 gap-3">
                  <Loader2 className="h-8 w-8 animate-spin text-emerald-700" />
                  <p className="text-xs font-bold uppercase tracking-wider text-stone-500">Menyambungkan Kalender...</p>
                </div>
              ) : agendas.length > 0 ? (
                <div className="space-y-3 p-1">
                  {agendas.map((agenda: AgendaItem) => (
                    <button
                      key={agenda.id}
                      type="button"
                      onClick={() => handleSelectAgenda(agenda)}
                      className="w-full text-left p-4 rounded-2xl border transition-all flex items-start justify-between gap-3 group cursor-pointer bg-white dark:bg-[#081d27] border border-slate-200/80 dark:border-white/10 shadow-xs hover:scale-[1.01] active:scale-[0.99]"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full border bg-sky-100 border-sky-300 text-sky-800">
                            EKSTERNAL
                          </span>
                        </div>
                        <p className="text-sm font-black text-slate-900 leading-snug group-hover:text-emerald-800 whitespace-normal break-words">
                          {agenda.summary}
                        </p>
                        <div className="flex items-center gap-1.5 mt-2">
                          <MapPin className="h-3 w-3 text-emerald-700" />
                          <p className="text-[10px] font-bold text-stone-600 uppercase truncate">{agenda.location || "Luar Desa"}</p>
                        </div>
                      </div>
                      <ChevronRight className="h-5 w-5 text-stone-400 group-hover:text-emerald-700 shrink-0 mt-2 transition-transform group-hover:translate-x-0.5" />
                    </button>
                  ))}
                </div>
              ) : (
                <div className="py-16 text-center">
                  <CalendarIcon className="h-8 w-8 text-stone-400 mx-auto mb-2 opacity-50" />
                  <p className="text-xs font-bold uppercase tracking-wider text-stone-500">Tidak ada agenda eksternal pada tanggal ini</p>
                </div>
              )}
            </ScrollArea>
          </div>
        </TabsContent>

        {/* TAB 2: ISI PENGAJUAN MANUAL */}
        <TabsContent value="manual" className="mt-0">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

              {/* SECTION 1: DATA PERSONEL & SURAT */}
              <div className="p-6 rounded-3xl bg-white dark:bg-[#081d27] border border-slate-200/80 dark:border-white/10 shadow-sm space-y-5">
                <div className="flex items-center gap-3 pb-3 border-b border-stone-300/40">
                  <div className="w-10 h-10 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 shadow-xs flex items-center justify-center text-emerald-700 shrink-0">
                    <Users className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black uppercase text-slate-900 tracking-wider font-condensed">1. Personel & Nomor Surat</h4>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-stone-500">Pilih aparatur yang bertugas dan nomor administrasi tugas.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem className="space-y-1.5">
                        <FormLabel className="text-[10px] font-black uppercase text-stone-600 tracking-wider ml-1">Lembaga / Jabatan</FormLabel>
                        <Select onValueChange={(val) => {
                          field.onChange(val);
                          form.setValue("officialName", "");
                        }} defaultValue={field.value} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="h-12 px-4 rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 shadow-xs font-bold text-sm text-slate-900">
                              <SelectValue placeholder="Pilih Lembaga..." />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="bg-white dark:bg-[#081d27] rounded-xl shadow-xl border border-slate-200 dark:border-white/10">
                            {personnelCategories.map((cat) => (
                              <SelectItem key={cat.id} value={cat.id} className="font-bold text-xs uppercase cursor-pointer hover:bg-stone-200/50">{cat.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  {selectedCategory && (
                    <FormField
                      control={form.control}
                      name="officialName"
                      render={({ field }) => (
                        <FormItem className="space-y-1.5">
                          <FormLabel className="text-[10px] font-black uppercase text-stone-600 tracking-wider ml-1">Nama Personel</FormLabel>
                          {selectedCategory === "Lainnya" ? (
                            <FormControl>
                              <input
                                placeholder="Ketik nama personel..."
                                className="w-full h-12 px-4 rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 shadow-xs font-bold text-sm text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-600"
                                {...field}
                              />
                            </FormControl>
                          ) : (
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger className="h-12 px-4 rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 shadow-xs font-bold text-sm text-slate-900">
                                  <SelectValue placeholder="Pilih Nama..." />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent className="bg-white dark:bg-[#081d27] rounded-xl shadow-xl border border-slate-200 dark:border-white/10">
                                <ScrollArea className="h-[180px]">
                                  {(dbOfficials || []).filter(o => o.category === selectedCategory).map((o: any) => (
                                    <SelectItem key={`${o.name}-${o.jabatan}`} value={`${o.name} - ${o.jabatan}`} className="font-bold text-xs uppercase cursor-pointer hover:bg-stone-200/50">
                                      {o.name} - {o.jabatan}
                                    </SelectItem>
                                  ))}
                                </ScrollArea>
                              </SelectContent>
                            </Select>
                          )}
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </div>

                {/* Nomor Surat Tugas & SPPD */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 shadow-xs">
                  <FormField
                    control={form.control}
                    name="stNumber"
                    render={({ field }) => (
                      <FormItem className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <FormLabel className="text-[10px] font-black uppercase text-stone-700 tracking-wider">No. Surat Tugas (ST)</FormLabel>
                          <button
                            type="button"
                            onClick={handlePullStNumber}
                            disabled={isFetchingStNumber}
                            className="px-2.5 py-1 rounded-lg bg-[#0e1620] hover:bg-slate-900 text-amber-300 text-[9px] font-condensed font-black uppercase tracking-wider shadow-xs border border-white/10 flex items-center gap-1 active:scale-95 transition-all cursor-pointer"
                          >
                            {isFetchingStNumber ? <Loader2 className="h-2.5 w-2.5 animate-spin" /> : <Sparkles className="h-2.5 w-2.5" />}
                            Tarik No. ST
                          </button>
                        </div>
                        <FormControl>
                          <div className="relative">
                            <FileText className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-500" />
                            <input
                              placeholder="800.1.11.1 / XXX / 04 / 2026"
                              className="w-full h-11 pl-10 pr-3 rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 shadow-xs font-mono text-xs font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-600"
                              {...field}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="sppdNumber"
                    render={({ field }) => (
                      <FormItem className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <FormLabel className="text-[10px] font-black uppercase text-stone-700 tracking-wider">No. SPPD</FormLabel>
                          <button
                            type="button"
                            onClick={handlePullSppdNumber}
                            disabled={isFetchingSppdNumber}
                            className="px-2.5 py-1 rounded-lg bg-[#0e1620] hover:bg-slate-900 text-amber-300 text-[9px] font-condensed font-black uppercase tracking-wider shadow-xs border border-white/10 flex items-center gap-1 active:scale-95 transition-all cursor-pointer"
                          >
                            {isFetchingSppdNumber ? <Loader2 className="h-2.5 w-2.5 animate-spin" /> : <Sparkles className="h-2.5 w-2.5" />}
                            Tarik No. SPPD
                          </button>
                        </div>
                        <FormControl>
                          <div className="relative">
                            <Hash className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-500" />
                            <input
                              placeholder="000.1.2.3 / XXX / 04 / 2026"
                              className="w-full h-11 pl-10 pr-3 rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 shadow-xs font-mono text-xs font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-600"
                              {...field}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* SECTION 2: TUJUAN & PENGIKUT */}
              <div className="p-6 rounded-3xl bg-white dark:bg-[#081d27] border border-slate-200/80 dark:border-white/10 shadow-sm space-y-5">
                <div className="flex items-center gap-3 pb-3 border-b border-stone-300/40">
                  <div className="w-10 h-10 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 shadow-xs flex items-center justify-center text-sky-700 shrink-0">
                    <MapPin className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black uppercase text-slate-900 tracking-wider font-condensed">2. Tujuan & Pengikut</h4>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-stone-500">Destinasi perjalanan dan personel pendamping.</p>
                  </div>
                </div>

                <FormField
                  control={form.control}
                  name="destination"
                  render={({ field }) => (
                    <FormItem className="space-y-1.5">
                      <FormLabel className="text-[10px] font-black uppercase text-stone-600 tracking-wider ml-1">Tujuan Perjalanan Dinas</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-500" />
                          <input
                            placeholder="Contoh: Kantor Kecamatan Gandrungmangu..."
                            className="w-full h-12 pl-11 pr-4 rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 shadow-xs font-bold text-sm text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-600"
                            {...field}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Box Pengikut */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 shadow-xs space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-stone-600" />
                      <h5 className="text-[10px] font-black uppercase text-stone-700 tracking-wider">Daftar Pengikut / Pendamping</h5>
                    </div>
                    <span className="text-[9px] font-bold text-stone-500 uppercase">{numCompanions} orang</span>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase text-stone-600 block ml-1">Jumlah Pengikut</label>
                    <input
                      type="number"
                      min="0"
                      max="10"
                      value={numCompanions}
                      onChange={(e) => handleNumCompanionsChange(e.target.value)}
                      placeholder="0"
                      className="w-full h-11 px-4 rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 shadow-xs font-bold text-sm text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-600"
                    />
                  </div>

                  {companionsList.map((comp, idx) => (
                    <div key={idx} className="space-y-3 pt-3 border-t border-stone-300/40 animate-in fade-in">
                      <p className="text-[9px] font-black text-stone-500 uppercase">Pengikut #{idx + 1}</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[9px] font-bold uppercase text-stone-600">Lembaga</label>
                          <Select
                            value={comp.category}
                            onValueChange={(val) => updateCompanion(idx, 'category', val)}
                          >
                            <SelectTrigger className="h-10 text-xs rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 shadow-xs font-bold">
                              <SelectValue placeholder="Pilih..." />
                            </SelectTrigger>
                            <SelectContent className="bg-white dark:bg-[#081d27] rounded-xl shadow-xl border border-slate-200 dark:border-white/10">
                              {personnelCategories.map((cat) => (
                                <SelectItem key={cat.id} value={cat.id} className="font-bold text-xs uppercase cursor-pointer hover:bg-stone-200/50">{cat.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] font-bold uppercase text-stone-600">Nama Personel</label>
                          {comp.category === "Lainnya" ? (
                            <input
                              placeholder="Ketik nama..."
                              value={comp.name}
                              onChange={(e) => updateCompanion(idx, 'name', e.target.value)}
                              className="w-full h-10 px-3 text-xs rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 shadow-xs font-bold"
                            />
                          ) : (
                            <Select
                              disabled={!comp.category}
                              value={comp.name}
                              onValueChange={(val) => updateCompanion(idx, 'name', val)}
                            >
                              <SelectTrigger className="h-10 text-xs rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 shadow-xs font-bold">
                                <SelectValue placeholder="Pilih Nama..." />
                              </SelectTrigger>
                              <SelectContent className="bg-white dark:bg-[#081d27] rounded-xl shadow-xl border border-slate-200 dark:border-white/10">
                                <ScrollArea className="h-[150px]">
                                  {(dbOfficials || []).filter(o => o.category === comp.category).map((o: any) => (
                                    <SelectItem key={`${o.name}-${o.jabatan}`} value={`${o.name} - ${o.jabatan}`} className="font-bold text-xs uppercase cursor-pointer hover:bg-stone-200/50">
                                      {o.name}
                                    </SelectItem>
                                  ))}
                                </ScrollArea>
                              </SelectContent>
                            </Select>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* SECTION 3: WAKTU & ANGGARAN */}
              <div className="p-6 rounded-3xl bg-white dark:bg-[#081d27] border border-slate-200/80 dark:border-white/10 shadow-sm space-y-5">
                <div className="flex items-center gap-3 pb-3 border-b border-stone-300/40">
                  <div className="w-10 h-10 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 shadow-xs flex items-center justify-center text-amber-700 shrink-0">
                    <Clock className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black uppercase text-slate-900 tracking-wider font-condensed">3. Waktu & Rincian Anggaran</h4>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-stone-500">Durasi dinas serta perkiraan pembiayaan perjalanan.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="startDate"
                    render={({ field }) => (
                      <FormItem className="space-y-1.5">
                        <FormLabel className="text-[10px] font-black uppercase text-stone-600 tracking-wider ml-1">Tanggal Berangkat</FormLabel>
                        <FormControl>
                          <input
                            type="date"
                            className="w-full h-12 px-4 rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 shadow-xs font-bold text-sm text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-600"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="endDate"
                    render={({ field }) => (
                      <FormItem className="space-y-1.5">
                        <FormLabel className="text-[10px] font-black uppercase text-stone-600 tracking-wider ml-1">Tanggal Kembali</FormLabel>
                        <FormControl>
                          <input
                            type="date"
                            className="w-full h-12 px-4 rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 shadow-xs font-bold text-sm text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-600 opacity-80"
                            {...field}
                            readOnly
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Selector Durasi Hari */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-stone-600 block ml-1">Durasi Perjalanan</label>
                  <div className="flex flex-wrap gap-2.5">
                    {[1, 2, 3, 4, 5].map((d: number) => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => setDuration(d)}
                        className={cn(
                          "flex-1 h-11 text-xs font-condensed font-black uppercase rounded-xl transition-all cursor-pointer",
                          duration === d
                            ? "bg-[#0e1620] text-amber-300 shadow-[inset_2px_2px_5px_rgba(0,0,0,0.5)] border border-white/10"
                            : "bg-white dark:bg-[#081d27] text-slate-800 shadow-sm border border-white/70 hover:bg-stone-200/50"
                        )}
                      >
                        {d} Hari
                      </button>
                    ))}
                  </div>
                </div>

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem className="space-y-1.5">
                      <FormLabel className="text-[10px] font-black uppercase text-stone-600 tracking-wider ml-1">Maksud / Judul Kegiatan</FormLabel>
                      <FormControl>
                        <input
                          placeholder="Contoh: Rapat Koordinasi Evaluasi Pajak Daerah..."
                          className="w-full h-12 px-4 rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 shadow-xs font-bold text-sm text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-600"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="totalExpense"
                  render={({ field }) => (
                    <FormItem className="space-y-1.5">
                      <FormLabel className="text-[10px] font-black uppercase text-stone-600 tracking-wider ml-1">Estimasi Biaya Perjalanan (Rp)</FormLabel>
                      <FormControl>
                        <input
                          type="number"
                          placeholder="500000"
                          className="w-full h-12 px-4 rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 shadow-xs font-bold text-base text-emerald-800 focus:outline-none focus:ring-1 focus:ring-emerald-600 font-mono"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* TOMBOL SIMPAN / AJUKAN */}
              <button
                type="submit"
                disabled={isUploading}
                className="w-full h-14 rounded-2xl font-condensed font-black uppercase text-sm tracking-wider bg-emerald-700 hover:bg-emerald-800 text-white shadow-md active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>Menyimpan Pengajuan SPPD...</span>
                  </>
                ) : initialData ? (
                  <>
                    <Save className="h-5 w-5" />
                    <span>Simpan Perubahan SPPD</span>
                  </>
                ) : (
                  <>
                    <Plane className="h-5 w-5" />
                    <span>Ajukan SPPD Baru</span>
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
