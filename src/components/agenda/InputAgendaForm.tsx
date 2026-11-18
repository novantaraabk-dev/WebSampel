"use client"

import { useState, useRef, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { FileUp, Loader2, Sparkles, Save, UserCheck, KeyRound, CheckCircle2, AlertCircle, FileText, Hash } from "lucide-react"
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"
import { useToast } from "@/hooks/use-toast"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { GOOGLE_CONFIG } from "@/lib/google-config"
import { callAppsScript } from "@/app/agenda/actions"
import { format } from "date-fns"
import { useUser, useDoc, useFirestore, useMemoFirebase, useCollection } from "@/firebase"
import { collection, doc, setDoc } from "firebase/firestore"
import { ScrollArea } from "@/components/ui/scroll-area"
import { scanInvitationDocument } from "@/lib/gemini-client"

const formSchema = z.object({
  eventType: z.enum(["Internal", "Eksternal"]).default("Internal"),
  letterNumber: z.string().optional(),
  eventDate: z.string().min(1, "Tanggal harus diisi."),
  eventTime: z.string().min(1, "Waktu harus diisi."),
  eventLocation: z.string().min(3, "Tempat minimal 3 karakter."),
  eventTitle: z.string().min(5, "Acara minimal 5 karakter."),
  disposition: z.string().min(1, "Disposisi harus dipilih."),
  eventNotes: z.string().optional(),
})

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
}

interface InputAgendaFormProps {
  onSuccess?: (eventDate: string) => void;
}

export function InputAgendaForm({ onSuccess }: InputAgendaFormProps) {
  const [isScanning, setIsScanning] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [invitationFile, setInvitationFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const { user } = useUser()
  const db = useFirestore()

  const personnelRef = useMemoFirebase(() => (db && user) ? collection(db, "personnel") : null, [db, user])
  const { data: dbOfficials, isLoading: isPersonnelLoading } = useCollection(personnelRef)

  const userDocRef = useMemoFirebase(() => {
    if (!db || !user) return null;
    return doc(db, "users", user.uid);
  }, [db, user]);
  const { data: userData } = useDoc(userDocRef);

  const villageSettingsRef = useMemoFirebase(() => db ? doc(db, "settings", "village") : null, [db]);
  const { data: villageSettings } = useDoc(villageSettingsRef);

  const filteredOfficials = (dbOfficials || []).filter(o =>
    o.category === "Pemerintah Desa" || o.jabatan?.includes("KAUR") || o.jabatan?.includes("KEPALA SEKSI")
  );

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      eventType: "Internal",
      letterNumber: "",
      eventDate: format(new Date(), "yyyy-MM-dd"),
      eventTime: "",
      eventLocation: "Balai Desa Sampeldes",
      eventTitle: "",
      disposition: "",
      eventNotes: "",
    },
  })

  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    setMounted(true)
  }, [])

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const allowedExts = [".pdf", ".jpg", ".jpeg", ".png", ".webp", ".doc", ".docx"]
      const ext = file.name.substring(file.name.lastIndexOf(".")).toLowerCase()
      if (!allowedExts.includes(ext)) {
        toast({
          variant: "destructive",
          title: "Format Tidak Didukung",
          description: "Harap unggah dokumen dengan format PDF, Gambar (JPG/PNG), atau Word (.docx)."
        })
        return
      }
      setInvitationFile(file)
      toast({
        title: "Dokumen Terpilih",
        description: `File "${file.name}" siap untuk dipindai oleh AI.`
      })
    }
  }

  const handleScanDocument = async () => {
    if (!invitationFile) {
      toast({
        variant: "destructive",
        title: "File Belum Dipilih",
        description: "Silakan pilih file undangan (PDF / JPG / Word) terlebih dahulu."
      })
      return
    }

    if (invitationFile.size > 15 * 1024 * 1024) {
      toast({
        variant: "destructive",
        title: "Ukuran File Terlalu Besar",
        description: "Batas ukuran berkas untuk pemindaian AI adalah 15MB. Silakan gunakan berkas PDF yang lebih ringkas atau foto dokumen."
      })
      return
    }

    setIsScanning(true)
    try {
      toast({
        title: "AI Sedang Membaca Dokumen...",
        description: `Menganalisis isi surat "${invitationFile.name}"...`
      })

      const extracted = await scanInvitationDocument(invitationFile)

      // Mengisi form otomatis berdasarkan data yang diekstrak oleh AI
      if (extracted.letterNumber) {
        form.setValue("letterNumber", extracted.letterNumber)
      }
      if (extracted.eventTitle) {
        form.setValue("eventTitle", extracted.eventTitle)
      }
      if (extracted.eventDate) {
        form.setValue("eventDate", extracted.eventDate)
      }
      if (extracted.eventTime) {
        form.setValue("eventTime", extracted.eventTime)
      }
      if (extracted.eventLocation) {
        form.setValue("eventLocation", extracted.eventLocation)
      }
      if (extracted.eventNotes) {
        form.setValue("eventNotes", extracted.eventNotes)
      }

      toast({
        title: "Pindai AI Berhasil!",
        description: "Nomor surat, acara, tanggal, waktu, tempat, dan catatan telah terisi otomatis.",
      })
    } catch (error: any) {
      console.error("Scan AI Error:", error)
      toast({
        variant: "destructive",
        title: "Gagal Memindai Dokumen",
        description: error.message || "Terjadi kesalahan saat memproses dokumen dengan AI."
      })
    } finally {
      setIsScanning(false)
    }
  }

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsSaving(true);
    try {
      const appsScriptUrl = (villageSettings?.appsScriptUrl || userData?.appsScriptUrl || '').trim() || GOOGLE_CONFIG.appsScriptUrl;
      const calendarId = (villageSettings?.googleCalendarId || userData?.googleCalendarId || GOOGLE_CONFIG.calendarId || 'primary').trim();
      const rawFolderId = villageSettings?.agendaFolderId || userData?.agendaFolderId || GOOGLE_CONFIG.parentFolderId;
      const folderId = (() => {
        if (!rawFolderId) return GOOGLE_CONFIG.parentFolderId;
        const match = rawFolderId.match(/folders\/([a-zA-Z0-9_-]{25,})/);
        if (match) return match[1];
        const idParamMatch = rawFolderId.match(/[?&]id=([a-zA-Z0-9_-]{25,})/);
        if (idParamMatch) return idParamMatch[1];
        return rawFolderId.trim();
      })();

      let fileData = null;
      if (invitationFile) {
        const base64String = await fileToBase64(invitationFile);
        const pureBase64 = base64String.includes(',') ? base64String.split(',')[1] : base64String;
        fileData = {
          name: invitationFile.name,
          type: invitationFile.type || "application/pdf",
          base64: pureBase64,
        };
      }

      const startDateTime = new Date(`${values.eventDate}T${values.eventTime.split(' ')[0] || '00:00'}`);
      // Simpan tipe agenda & nomor surat di deskripsi agar tercatat lengkap
      const letterPrefix = values.letterNumber?.trim() ? `NOMOR SURAT: ${values.letterNumber.trim()}\n` : '';
      const description = `${letterPrefix}JENIS: ${values.eventType}\nDISPOSISI: ${values.disposition}\n\nCATATAN: ${values.eventNotes || '-'}`.trim();

      let result = await callAppsScript({
        action: "createEventAndUpload",
        eventData: {
          calendarId: calendarId,
          title: values.eventTitle,
          start: startDateTime.toISOString(),
          end: new Date(startDateTime.getTime() + 60 * 60 * 1000).toISOString(),
          description: description,
          location: values.eventLocation,
        },
        fileData: fileData,
        folderId: folderId
      }, appsScriptUrl);

      let usedFallbackPrimary = false;
      // Jika gagal karena ID Kalender kustom tidak ditemukan/tidak diotorisasi, coba otomatis dengan kalender utama ('primary')
      if ((!result || !result.success) && calendarId !== "primary") {
        console.warn(`Simpan ke kalender "${calendarId}" gagal, mencoba fallback ke kalender utama ("primary")...`, result?.error);
        const retryResult = await callAppsScript({
          action: "createEventAndUpload",
          eventData: {
            calendarId: "primary",
            title: values.eventTitle,
            start: startDateTime.toISOString(),
            end: new Date(startDateTime.getTime() + 60 * 60 * 1000).toISOString(),
            description: description,
            location: values.eventLocation,
          },
          fileData: fileData,
          folderId: folderId
        }, appsScriptUrl);

        if (retryResult && retryResult.success) {
          result = retryResult;
          usedFallbackPrimary = true;
        }
      }

      if (!result || !result.success) {
        throw new Error(result?.error || result?.message || "Gagal menyimpan ke Google.");
      }

      // Otomatis simpan ke /manajemen/arsip-nomor-surat ("Surat Masuk") jika nomor surat diisi
      let savedToBukuAgenda = false;
      if (db && user && values.letterNumber?.trim()) {
        try {
          const newAgendaId = doc(collection(db, "buku_agenda")).id;
          await setDoc(doc(db, "buku_agenda", newAgendaId), {
            id: newAgendaId,
            nomor: values.letterNumber.trim(),
            perihal: values.eventTitle,
            tanggal: values.eventDate,
            kategori: "surat_masuk",
            keterangan: `Lokasi: ${values.eventLocation} | Petugas: ${values.disposition}${result.fileUrl ? ` | Berkas: ${result.fileUrl}` : ''}`,
            source: "agenda",
            userId: user.uid,
            createdAt: new Date().toISOString()
          });
          savedToBukuAgenda = true;
        } catch (arsipErr) {
          console.warn("Gagal menyimpan ke buku_agenda surat masuk:", arsipErr);
        }
      }

      // Otomatis arsipkan berkas undangan ke /manajemen/arsip-dokumen (Tab Surat Desa)
      let savedToSuratDesa = false;
      if (db && user && invitationFile) {
        try {
          const suratDesaRef = collection(db, "suratDesa");
          const newSuratId = doc(suratDesaRef).id;
          await setDoc(doc(db, "suratDesa", newSuratId), {
            id: newSuratId,
            namaDokumen: values.eventTitle,
            perihal: values.eventTitle,
            nomorSurat: values.letterNumber?.trim() || "-",
            nomorDok: values.letterNumber?.trim() || "-",
            tanggalSurat: values.eventDate,
            tipeSurat: values.eventType, // "Internal" | "Eksternal"
            asalSurat: values.eventType === "Internal" ? "Pemerintah Desa Sampeldes" : (values.eventLocation || "Pihak Luar / Instansi"),
            disposisi: values.disposition || "-",
            keterangan: `Agenda: ${values.eventTitle} | Lokasi: ${values.eventLocation} | Waktu: ${values.eventTime}${values.eventNotes ? ` | Catatan: ${values.eventNotes}` : ''}`,
            fileUrl: result.fileUrl || "",
            driveFileId: result.fileId || "",
            fileName: invitationFile.name,
            source: "agenda",
            createdBy: user.uid,
            createdAt: new Date().toISOString()
          });
          savedToSuratDesa = true;
        } catch (suratDesaErr) {
          console.warn("Gagal mengarsipkan ke suratDesa:", suratDesaErr);
        }
      }

      const fileAttachedMsg = invitationFile
        ? ` Berkas undangan otomatis diarsipkan ke Arsip Surat Desa (${values.eventType}) & Google Kalender.`
        : "";

      const isFallback = usedFallbackPrimary || Boolean(result.fallbackUsed);
      toast({
        variant: isFallback ? "destructive" : "default",
        title: isFallback ? "Tersimpan ke Kalender Utama (Fallback)" : "Agenda Berhasil Dibuat!",
        description: isFallback
          ? `Akun Apps Script belum memiliki izin tulis ke "${calendarId}", sehingga agenda dialihkan ke kalender utama (primary). Bagikan akses edit kalender "${calendarId}" ke akun pemilik Apps Script.`
          : savedToBukuAgenda
            ? `Agenda telah masuk ke Google Calendar (${calendarId}).${fileAttachedMsg} Surat Masuk No. "${values.letterNumber}" otomatis tercatat di Register Surat.`
            : `Agenda telah ditambahkan ke Google Calendar (${calendarId}).${fileAttachedMsg}`
      });
      form.reset();
      setInvitationFile(null);
      onSuccess?.(values.eventDate);

    } catch (error: any) {
      console.error("Submit Error:", error);
      toast({
        variant: "destructive",
        title: "Gagal Simpan",
        description: error.message
      });
    } finally {
      setIsSaving(false);
    }
  }

  if (!mounted) return null;

  return (
    <div className="bg-white dark:bg-[#081d27] border border-slate-200/80 dark:border-white/10 shadow-sm rounded-3xl p-6 sm:p-8">
      <div className="mb-6 border-b border-stone-300/40 pb-4">
        <h2 className="text-lg font-black text-slate-900 font-condensed uppercase tracking-tight">Formulir Input Agenda</h2>
        <p className="text-xs text-stone-500 font-bold uppercase tracking-wider mt-0.5">Isi detail acara atau pindai otomatis dari surat undangan PDF / JPG / Word.</p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {!userData?.agendaFolderId && invitationFile && (
            <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-800 text-[11px] font-bold flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 text-amber-700" />
              <span>ID Folder belum diatur di Pengaturan. File akan diunggah ke folder utama (My Drive).</span>
            </div>
          )}

          <FormField
            control={form.control}
            name="eventType"
            render={({ field }) => (
              <FormItem className="space-y-2">
                <FormLabel className="text-[10px] font-black uppercase text-stone-500 tracking-wider">Jenis Kegiatan</FormLabel>
                <FormControl>
                  <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex gap-4">
                    <FormItem className="flex items-center space-x-2 space-y-0 cursor-pointer">
                      <FormControl><RadioGroupItem value="Internal" /></FormControl>
                      <FormLabel className="font-bold text-xs text-slate-800 cursor-pointer">Internal</FormLabel>
                    </FormItem>
                    <FormItem className="flex items-center space-x-2 space-y-0 cursor-pointer">
                      <FormControl><RadioGroupItem value="Eksternal" /></FormControl>
                      <FormLabel className="font-bold text-xs text-slate-800 cursor-pointer">Eksternal</FormLabel>
                    </FormItem>
                  </RadioGroup>
                </FormControl>
              </FormItem>
            )}
          />

          {/* Input File Undangan & Tombol Pindai AI */}
          <div className="space-y-2">
            <FormLabel className="text-[10px] font-black uppercase text-stone-500 tracking-wider flex items-center justify-between">
              <span>Undangan (Opsional)</span>
              <span className="text-[10px] text-stone-400 font-normal">Mendukung PDF, JPG/PNG, Word (.docx)</span>
            </FormLabel>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                className="flex-1 justify-start gap-3 h-12 rounded-xl text-left truncate flex items-center px-4 bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 shadow-xs text-sm font-bold text-slate-800 hover:border-emerald-500/40 transition-all"
                onClick={() => fileInputRef.current?.click()}
              >
                <FileUp className="h-4 w-4 shrink-0 text-emerald-700" />
                <span className="truncate">{invitationFile ? invitationFile.name : "Pilih Dokumen Undangan (PDF / JPG / Word)..."}</span>
              </button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx,application/pdf,image/*,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                className="hidden"
              />
              <button
                type="button"
                onClick={handleScanDocument}
                disabled={isScanning || !invitationFile}
                className="h-12 px-6 rounded-xl gap-2 bg-[#0e1620] hover:bg-slate-900 text-amber-300 shadow-sm border border-white/10 font-black uppercase text-xs shrink-0 transition-all flex items-center justify-center disabled:opacity-50 active:scale-95"
              >
                {isScanning ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Memindai AI...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 text-amber-300" />
                    <span>Pindai AI</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Nomor Surat Undangan */}
          <FormField
            control={form.control}
            name="letterNumber"
            render={({ field }) => (
              <FormItem className="space-y-1.5">
                <FormLabel className="text-[10px] font-black uppercase text-stone-500 tracking-wider flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Hash className="h-3.5 w-3.5 text-stone-400" />
                    Nomor Surat Undangan (Opsional)
                  </span>
                  <span className="text-[9px] text-emerald-700 font-bold uppercase tracking-wider">
                    Otomatis Masuk Register Surat Masuk
                  </span>
                </FormLabel>
                <FormControl>
                  <input
                    placeholder="Contoh: 400.10.2.1/338/49"
                    {...field}
                    className="w-full bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 shadow-xs rounded-xl px-4 h-12 text-sm font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-600"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Acara / Perihal */}
          <FormField
            control={form.control}
            name="eventTitle"
            render={({ field }) => (
              <FormItem className="space-y-1.5">
                <FormLabel className="text-[10px] font-black uppercase text-stone-500 tracking-wider">Acara / Perihal</FormLabel>
                <FormControl>
                  <input
                    placeholder="Contoh: Sosialisasi Pelaksanaan BPJS Ketenagakerjaan"
                    {...field}
                    className="w-full bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 shadow-xs rounded-xl px-4 h-12 text-sm font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-600"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Tanggal & Waktu */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="eventDate"
              render={({ field }) => (
                <FormItem className="space-y-1.5">
                  <FormLabel className="text-[10px] font-black uppercase text-stone-500 tracking-wider">Hari / Tanggal</FormLabel>
                  <FormControl>
                    <input
                      type="date"
                      {...field}
                      className="w-full bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 shadow-xs rounded-xl px-4 h-12 text-sm font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-600"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="eventTime"
              render={({ field }) => (
                <FormItem className="space-y-1.5">
                  <FormLabel className="text-[10px] font-black uppercase text-stone-500 tracking-wider">Waktu</FormLabel>
                  <FormControl>
                    <input
                      type="time"
                      {...field}
                      className="w-full bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 shadow-xs rounded-xl px-4 h-12 text-sm font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-600"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Tempat */}
          <FormField
            control={form.control}
            name="eventLocation"
            render={({ field }) => (
              <FormItem className="space-y-1.5">
                <FormLabel className="text-[10px] font-black uppercase text-stone-500 tracking-wider">Tempat</FormLabel>
                <FormControl>
                  <input
                    placeholder="Contoh: Pendopo Kecamatan Gandrungmangu"
                    {...field}
                    className="w-full bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 shadow-xs rounded-xl px-4 h-12 text-sm font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-600"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Disposisi */}
          <FormField
            control={form.control}
            name="disposition"
            render={({ field }) => (
              <FormItem className="space-y-1.5">
                <FormLabel className="text-[10px] font-black uppercase text-stone-500 tracking-wider flex items-center gap-2">
                  <UserCheck className="h-4 w-4 text-emerald-700" /> Disposisi (Petugas)
                </FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                  <FormControl>
                    <SelectTrigger className="w-full bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 shadow-xs rounded-xl px-4 h-12 text-sm font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-600">
                      <SelectValue placeholder={isPersonnelLoading ? "Memuat data..." : "Pilih Perangkat Desa..."} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="bg-white dark:bg-[#081d27] border border-white/60 shadow-md rounded-2xl">
                    <ScrollArea className="h-[200px]">
                      {filteredOfficials.map((o: any) => (
                        <SelectItem key={`${o.name}-${o.jabatan}`} value={`${o.name} - ${o.jabatan}`} className="font-bold text-xs text-slate-800">
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

          {/* Catatan Tambahan */}
          <FormField
            control={form.control}
            name="eventNotes"
            render={({ field }) => (
              <FormItem className="space-y-1.5">
                <FormLabel className="text-[10px] font-black uppercase text-stone-500 tracking-wider">Catatan Tambahan (Opsional)</FormLabel>
                <FormControl>
                  <textarea
                    placeholder="Catatan atau instruksi tambahan acara..."
                    {...field}
                    className="w-full bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 shadow-xs rounded-xl p-4 min-h-[100px] text-sm font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-600"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 shadow-xs text-stone-600 text-[11px] leading-relaxed flex items-start gap-3">
            <KeyRound className="h-5 w-5 text-amber-700 shrink-0 mt-0.5" />
            <div>
              <p className="font-black uppercase tracking-wider text-stone-700">Solusi Gagal Simpan</p>
              <p className="mt-0.5 text-stone-500">
                Jika error &apos;Akses Ditolak&apos;, pastikan ID Kalender/Folder di Pengaturan sudah benar dan jalankan fungsi <strong>&apos;forceGrantAllPermissions&apos;</strong> di Editor Skrip.
              </p>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSaving}
            className="w-full h-14 gap-2 text-base font-black uppercase shadow-md rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white font-condensed tracking-wider flex items-center justify-center active:scale-[0.99] transition-all disabled:opacity-50"
          >
            {isSaving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
            Simpan Agenda
          </button>
        </form>
      </Form>
    </div>
  )
}
