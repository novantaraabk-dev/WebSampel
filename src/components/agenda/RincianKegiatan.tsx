"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  RefreshCw,
  Loader2,
  Calendar as CalendarIcon,
  Send,
  BookUser,
  AlertCircle,
  Edit3,
  CheckCircle2,
  Clock,
  MapPin,
  FileText,
  ExternalLink,
  Eye,
  Save,
  X,
  FileDown,
  UserCheck,
  CalendarDays,
  Trash2
} from "lucide-react"
import { format, parseISO } from "date-fns"
import { id as localeID } from "date-fns/locale"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { GOOGLE_CONFIG } from "@/lib/google-config"
import { callAppsScript } from "@/app/agenda/actions"
import { useUser, useDoc, useFirestore, useMemoFirebase } from "@/firebase"
import { doc, collection, query, where, getDocs, writeBatch } from "firebase/firestore"
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

interface CalendarEvent {
  id: string;
  summary: string;
  location?: string;
  htmlLink?: string;
  start: { dateTime?: string; date?: string };
  end: { dateTime?: string; date?: string };
  description?: string;
}

interface RincianKegiatanProps {
  externalDate?: string;
  refreshTrigger?: number;
}

export function RincianKegiatan({ externalDate, refreshTrigger = 0 }: RincianKegiatanProps) {
  const [searchDate, setSearchDate] = useState<string>(externalDate || format(new Date(), "yyyy-MM-dd"))
  const [searchEvents, setSearchEvents] = useState<CalendarEvent[]>([])
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null)
  const [isSearching, setIsSearching] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [effectiveCalendarId, setEffectiveCalendarId] = useState<string>("primary")
  const { toast } = useToast()

  const { user } = useUser()
  const db = useFirestore()

  // Ambil Google Calendar ID dari village settings global (atau user settings)
  const villageSettingsRef = useMemoFirebase(() => db ? doc(db, "settings", "village") : null, [db])
  const { data: villageSettings } = useDoc(villageSettingsRef)

  const userDocRef = useMemoFirebase(() => (db && user) ? doc(db, "users", user.uid) : null, [db, user])
  const { data: userData } = useDoc(userDocRef)

  const calendarId = useMemo(() => {
    return villageSettings?.googleCalendarId || userData?.googleCalendarId || GOOGLE_CONFIG.calendarId;
  }, [villageSettings, userData])

  const appsScriptUrl = useMemo(() => {
    return (villageSettings?.appsScriptUrl || userData?.appsScriptUrl || '').trim() || GOOGLE_CONFIG.appsScriptUrl;
  }, [villageSettings, userData])

  // Form Edit States
  const [editTitle, setEditTitle] = useState("")
  const [editLocation, setEditLocation] = useState("")
  const [editDate, setEditDate] = useState(format(new Date(), "yyyy-MM-dd"))
  const [editStartTime, setEditStartTime] = useState("09:00")
  const [editEndTime, setEditEndTime] = useState("10:00")
  const [editLetterNumber, setEditLetterNumber] = useState("")
  const [editEventType, setEditEventType] = useState<"Internal" | "Eksternal">("Internal")
  const [editDisposition, setEditDisposition] = useState("")
  const [editNotes, setEditNotes] = useState("")
  const [editNotulensi, setEditNotulensi] = useState("")
  const [attachmentUrl, setAttachmentUrl] = useState<string | null>(null)

  // Ekstraksi data detail dari teks deskripsi Google Calendar
  const parseEventDetails = useCallback((event: CalendarEvent) => {
    const desc = event.description || "";

    // Extract Nomor Surat
    const letterMatch = desc.match(/NOMOR SURAT:\s*([^\n\r]+)/i);
    const letterNumber = letterMatch ? letterMatch[1].trim() : "";

    // Extract Jenis
    const typeMatch = desc.match(/JENIS:\s*(Internal|Eksternal)/i);
    const eventType = (typeMatch ? typeMatch[1] : (desc.includes("JENIS: Eksternal") ? "Eksternal" : "Internal")) as "Internal" | "Eksternal";

    // Extract Disposisi
    const dispMatch = desc.match(/DISPOSISI:\s*([^\n\r]+)/i);
    const disposition = dispMatch ? dispMatch[1].trim() : "";

    // Extract Attachment Link (Drive URL)
    const linkMatch = desc.match(/(?:Link Undangan|Lampiran|Berkas):\s*(https?:\/\/[^\s\n\r]+)/i) ||
      desc.match(/(https:\/\/drive\.google\.com\/[^\s\n\r]+)/i);
    const attUrl = linkMatch ? linkMatch[1].trim() : null;

    // Extract Notulensi
    const notulensiParts = desc.split(/--- NOTULENSI ---/i);
    const notulensi = notulensiParts.length > 1 ? notulensiParts[1].trim() : "";

    // Extract Catatan
    let notes = "";
    const notesMatch = desc.match(/CATATAN:\s*([^\n\r]+)/i);
    if (notesMatch) {
      notes = notesMatch[1].trim();
    }

    // Waktu
    let startDate = searchDate;
    let startTime = "09:00";
    let endTime = "10:00";

    if (event.start?.dateTime) {
      try {
        const parsedStart = parseISO(event.start.dateTime);
        startDate = format(parsedStart, "yyyy-MM-dd");
        startTime = format(parsedStart, "HH:mm");
      } catch { }
    } else if (event.start?.date) {
      startDate = event.start.date;
    }

    if (event.end?.dateTime) {
      try {
        const parsedEnd = parseISO(event.end.dateTime);
        endTime = format(parsedEnd, "HH:mm");
      } catch { }
    }

    return {
      letterNumber,
      eventType,
      disposition,
      attachmentUrl: attUrl,
      notulensi,
      notes,
      startDate,
      startTime,
      endTime
    };
  }, [searchDate]);

  // Fetch agenda data dari Google Calendar
  const fetchAgendaData = useCallback(async (date: string) => {
    setIsSearching(true)
    setErrorMsg(null)

    try {
      let usedCalId = calendarId;
      let res = await callAppsScript({
        action: 'getCalendar',
        calendarId: calendarId,
        date: date
      }, appsScriptUrl);

      // Otomatis fallback ke 'primary' jika calendarId kustom gagal
      if ((!res || !res.success) && calendarId !== "primary") {
        console.warn(`Gagal membaca kalender "${calendarId}", mencoba kalender utama ("primary")...`);
        const retryRes = await callAppsScript({
          action: 'getCalendar',
          calendarId: 'primary',
          date: date
        }, appsScriptUrl);
        if (retryRes && retryRes.success) {
          res = retryRes;
          usedCalId = 'primary';
        }
      }

      if (res && res.success) {
        setEffectiveCalendarId(usedCalId);
        const items: CalendarEvent[] = res.items || [];
        setSearchEvents(items);

        // Jika event yang sedang dipilih ada di dalam daftar baru, sinkronkan kembali
        if (selectedEvent) {
          const fresh = items.find(e => e.id === selectedEvent.id);
          if (fresh) {
            setSelectedEvent(fresh);
            const parsed = parseEventDetails(fresh);
            setEditTitle(fresh.summary || "");
            setEditLocation(fresh.location || "");
            setEditDate(parsed.startDate);
            setEditStartTime(parsed.startTime);
            setEditEndTime(parsed.endTime);
            setEditLetterNumber(parsed.letterNumber);
            setEditEventType(parsed.eventType);
            setEditDisposition(parsed.disposition);
            setEditNotes(parsed.notes);
            setEditNotulensi(parsed.notulensi);
            setAttachmentUrl(parsed.attachmentUrl);
          }
        }
      } else {
        setErrorMsg(res?.error || "Gagal memproses data kalender dari Google.");
      }
    } catch (err: any) {
      console.error("Fetch Agenda Error:", err);
      setErrorMsg("Koneksi ke kalender gagal. Periksa konfigurasi Apps Script.");
    } finally {
      setIsSearching(false);
    }
  }, [calendarId, appsScriptUrl, parseEventDetails, selectedEvent]);

  useEffect(() => {
    if (externalDate) {
      setSearchDate(externalDate);
    }
  }, [externalDate]);

  // Initial load & refresh when date, calendarId, or refreshTrigger changes
  useEffect(() => {
    fetchAgendaData(searchDate);
  }, [searchDate, calendarId, refreshTrigger]); // eslint-disable-line react-hooks/exhaustive-deps

  // Handle pilih salah satu event dari daftar
  const handleSelectEvent = (event: CalendarEvent) => {
    setSelectedEvent(event);
    setIsEditing(false);
    const parsed = parseEventDetails(event);
    setEditTitle(event.summary || "");
    setEditLocation(event.location || "");
    setEditDate(parsed.startDate);
    setEditStartTime(parsed.startTime);
    setEditEndTime(parsed.endTime);
    setEditLetterNumber(parsed.letterNumber);
    setEditEventType(parsed.eventType);
    setEditDisposition(parsed.disposition);
    setEditNotes(parsed.notes);
    setEditNotulensi(parsed.notulensi);
    setAttachmentUrl(parsed.attachmentUrl);
  };

  const getEventType = (desc?: string) => {
    if (desc?.includes("JENIS: Eksternal")) return "Eksternal";
    if (desc?.includes("JENIS: Internal")) return "Internal";
    return "Umum";
  };

  // Simpan hasil Edit Agenda & Notulensi ke Google Calendar
  const handleSaveEvent = async () => {
    if (!selectedEvent) return;

    if (!editTitle.trim()) {
      toast({
        variant: "destructive",
        title: "Judul Acara Kosong",
        description: "Silakan masukkan nama acara/agenda kegiatan."
      });
      return;
    }

    setIsSaving(true);
    try {
      // Susun waktu ISO
      const startIso = new Date(`${editDate}T${editStartTime}:00`).toISOString();
      const endIso = new Date(`${editDate}T${editEndTime}:00`).toISOString();

      // Susun deskripsi lengkap kalender
      const letterPrefix = editLetterNumber.trim() ? `NOMOR SURAT: ${editLetterNumber.trim()}\n` : '';
      const dispPrefix = editDisposition.trim() ? `DISPOSISI: ${editDisposition.trim()}\n` : '';
      const notesPrefix = `CATATAN: ${editNotes.trim() || '-'}\n`;
      const attachSection = attachmentUrl ? `\n📎 BERKAS UNDANGAN / LAMPIRAN RESMI:\n${attachmentUrl}\n` : '';
      const notulensiPart = editNotulensi.trim() ? `\n\n--- NOTULENSI ---\n${editNotulensi.trim()}` : '';

      const fullDescription = `${letterPrefix}JENIS: ${editEventType}\n${dispPrefix}${notesPrefix}${attachSection}${notulensiPart}`.trim();

      // Panggil updateEvent di Apps Script
      const targetCalId = effectiveCalendarId || calendarId;
      const updatePayload = {
        action: 'updateEvent',
        calendarId: targetCalId,
        eventId: selectedEvent.id,
        title: editTitle.trim(),
        location: editLocation.trim(),
        start: startIso,
        end: endIso,
        description: fullDescription
      };

      let result = await callAppsScript(updatePayload, appsScriptUrl);

      if ((!result || !result.success) && targetCalId !== "primary" && !result?.error?.includes("Aksi tidak dikenal")) {
        const retryUpdate = await callAppsScript({ ...updatePayload, calendarId: "primary" }, appsScriptUrl);
        if (retryUpdate && retryUpdate.success) {
          result = retryUpdate;
        }
      }

      // Fallback kompatibilitas jika Apps Script yang sedang terpasang belum memiliki action updateEvent
      if (!result || (!result.success && result.error && result.error.includes("Aksi tidak dikenal"))) {
        result = await callAppsScript({
          action: 'updateEventDescription',
          calendarId: calendarId,
          eventId: selectedEvent.id,
          newContent: editNotulensi.trim() || fullDescription
        }, appsScriptUrl);
      }

      if (!result || !result.success) {
        throw new Error(result?.error || "Gagal memperbarui agenda di Google Calendar.");
      }

      // Sinkronkan ke buku_agenda Firestore jika ada nomor surat terkait
      if (db && editLetterNumber.trim()) {
        try {
          const q = query(collection(db, "buku_agenda"), where("nomor", "==", editLetterNumber.trim()));
          const snap = await getDocs(q);
          if (!snap.empty) {
            const batch = writeBatch(db);
            snap.docs.forEach(d => {
              batch.update(d.ref, {
                perihal: editTitle.trim(),
                tanggal: editDate,
                keterangan: `Lokasi: ${editLocation.trim()} | Petugas: ${editDisposition.trim()}${attachmentUrl ? ` | Berkas: ${attachmentUrl}` : ''}`,
                updatedAt: new Date().toISOString()
              });
            });
            await batch.commit();
          }
        } catch (dbErr) {
          console.warn("Sinkronisasi buku_agenda Firestore:", dbErr);
        }
      }

      toast({
        title: "Perubahan Tersimpan!",
        description: "Agenda berhasil diperbarui dan tersinkronisasi otomatis ke Google Calendar."
      });

      setIsEditing(false);
      // Refresh agenda pada tanggal aktif
      await fetchAgendaData(searchDate);

    } catch (e: any) {
      console.error("Save event error:", e);
      toast({
        variant: "destructive",
        title: "Gagal Menyimpan ke Kalender",
        description: e.message || "Terjadi kesalahan saat menyinkronkan ke Google."
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Hapus Agenda dari Google Calendar & Firestore
  const handleDeleteEvent = async () => {
    if (!selectedEvent) return;

    setIsDeleting(true);
    try {
      // Panggil action deleteEvent ke Google Apps Script
      const targetCalId = effectiveCalendarId || calendarId;
      let result = await callAppsScript({
        action: "deleteEvent",
        calendarId: targetCalId,
        eventId: selectedEvent.id
      }, appsScriptUrl);

      // Fallback ke 'primary' jika calendarId kustom tidak menemukan event
      if ((!result || !result.success) && targetCalId !== "primary") {
        const retryResult = await callAppsScript({
          action: "deleteEvent",
          calendarId: "primary",
          eventId: selectedEvent.id
        }, appsScriptUrl);
        if (retryResult && retryResult.success) {
          result = retryResult;
        }
      }

      const isNotFoundOnCalendar = Boolean(result?.error && /not found/i.test(result.error));

      if (!result || (!result.success && !isNotFoundOnCalendar)) {
        if (result?.error && result.error.includes("Aksi tidak dikenal")) {
          throw new Error(
            "Fitur hapus belum aktif di Google Apps Script Anda. Silakan deploy ulang Apps Script menggunakan kode terbaru dari docs/master-google-apps-script.gs."
          );
        }
        throw new Error(result?.error || "Gagal menghapus agenda dari Google Calendar.");
      }

      // Bersihkan data terkait di Firestore jika ada nomor surat yang bersesuaian
      if (db && editLetterNumber.trim()) {
        try {
          // 1. Bersihkan di buku_agenda
          const qAgenda = query(collection(db, "buku_agenda"), where("nomor", "==", editLetterNumber.trim()));
          const snapAgenda = await getDocs(qAgenda);
          if (!snapAgenda.empty) {
            const batch = writeBatch(db);
            snapAgenda.docs.forEach(d => batch.delete(d.ref));
            await batch.commit();
          }

          // 2. Bersihkan di suratDesa jika bersumber dari agenda
          const qSurat = query(
            collection(db, "suratDesa"),
            where("nomorSurat", "==", editLetterNumber.trim()),
            where("source", "==", "agenda")
          );
          const snapSurat = await getDocs(qSurat);
          if (!snapSurat.empty) {
            const batchSurat = writeBatch(db);
            snapSurat.docs.forEach(d => batchSurat.delete(d.ref));
            await batchSurat.commit();
          }
        } catch (dbErr) {
          console.warn("Pembersihan data Firestore:", dbErr);
        }
      }

      toast({
        title: "Agenda Berhasil Dihapus!",
        description: `Agenda "${selectedEvent.summary}" telah dihapus secara permanen dari Google Calendar.`
      });

      setShowDeleteConfirm(false);
      setSelectedEvent(null);
      setIsEditing(false);

      // Refresh daftar agenda pada tanggal tersebut
      await fetchAgendaData(searchDate);

    } catch (e: any) {
      console.error("Delete event error:", e);
      toast({
        variant: "destructive",
        title: "Gagal Menghapus Agenda",
        description: e.message || "Terjadi kesalahan saat menghapus agenda dari Google Calendar."
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start font-sans">
      {/* Kolom Kiri: Pemilih Tanggal & Daftar Agenda */}
      <div className="lg:col-span-5 space-y-4">
        {/* Card Pemilih Tanggal */}
        <div className="bg-white dark:bg-[#081d27] border border-slate-200/80 dark:border-white/10 shadow-sm rounded-3xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-condensed font-black uppercase text-stone-500 tracking-wider">
              Pilih Tanggal Agenda
            </span>
            <button
              onClick={() => setSearchDate(format(new Date(), "yyyy-MM-dd"))}
              className="text-[10px] font-condensed font-black uppercase text-emerald-800 hover:text-emerald-900 px-2 py-0.5 rounded-lg bg-white dark:bg-white/5 border border-slate-200/80 dark:border-white/10 shadow-xs active:scale-95 transition-all"
            >
              Hari Ini
            </button>
          </div>
          <div className="flex gap-2">
            <input
              type="date"
              value={searchDate}
              onChange={(e) => setSearchDate(e.target.value)}
              className="flex-1 h-11 rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 shadow-xs font-bold text-slate-800 text-sm px-4 focus:outline-none focus:ring-1 focus:ring-emerald-600"
            />
            <button
              onClick={() => fetchAgendaData(searchDate)}
              disabled={isSearching}
              className="h-11 w-11 rounded-xl bg-white dark:bg-[#081d27] border border-slate-200/80 dark:border-white/10 shadow-xs text-slate-800 hover:text-emerald-700 active:scale-95 shrink-0 flex items-center justify-center transition-all disabled:opacity-50"
              title="Muat Ulang Kalender"
            >
              <RefreshCw className={cn("h-4 w-4", isSearching && "animate-spin text-emerald-700")} />
            </button>
          </div>
        </div>

        {errorMsg && (
          <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-start gap-3 text-rose-800 animate-in fade-in">
            <AlertCircle className="h-5 w-5 shrink-0 mt-0.5 text-rose-600" />
            <p className="text-xs font-semibold leading-relaxed">{errorMsg}</p>
          </div>
        )}

        {/* Daftar Agenda Pada Tanggal Terpilih */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between px-1">
            <span className="text-[10px] font-condensed font-black uppercase text-stone-500 tracking-widest">
              Daftar Acara ({searchEvents.length})
            </span>
            <span className="text-[10px] text-stone-500 font-bold">
              {format(parseISO(searchDate), "EEEE, dd MMMM yyyy", { locale: localeID })}
            </span>
          </div>

          {isSearching ? (
            <div className="text-center py-12 rounded-3xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 shadow-xs">
              <Loader2 className="h-7 w-7 animate-spin text-emerald-700 mx-auto mb-2" />
              <p className="text-xs font-black font-condensed uppercase tracking-wider text-stone-500">Memuat Kalender Google...</p>
            </div>
          ) : searchEvents.length > 0 ? (
            searchEvents.map((event) => {
              const type = getEventType(event.description);
              const isSelected = selectedEvent?.id === event.id;
              const hasAttachment = (event.description || "").includes("drive.google.com");

              let timeDisplay = "--:--";
              if (event.start?.dateTime) {
                try {
                  timeDisplay = format(parseISO(event.start.dateTime), "HH:mm");
                } catch { }
              }

              return (
                <button
                  key={event.id}
                  onClick={() => handleSelectEvent(event)}
                  className={cn(
                    "w-full text-left p-4 rounded-2xl transition-all flex flex-col gap-1.5 relative overflow-hidden",
                    isSelected
                      ? "bg-[#0e1620] text-white shadow-[inset_2px_2px_6px_rgba(0,0,0,0.5)] border border-white/10"
                      : "bg-white dark:bg-[#081d27] border border-slate-200/80 dark:border-white/10 shadow-xs hover:scale-[1.01] active:scale-[0.99] text-slate-900"
                  )}
                >
                  <div className="flex items-center justify-between w-full">
                    <span
                      className={cn(
                        "text-[9px] font-condensed font-black uppercase tracking-widest px-2 py-0.5 rounded-md",
                        isSelected
                          ? "bg-amber-300 text-slate-950 font-black"
                          : type === "Internal"
                            ? "bg-emerald-600/10 text-emerald-800 border border-emerald-600/20"
                            : "bg-sky-600/10 text-sky-800 border border-sky-600/20"
                      )}
                    >
                      AGENDA {type}
                    </span>

                    <div className="flex items-center gap-2">
                      {hasAttachment && (
                        <span
                          className={cn(
                            "text-[9px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1",
                            isSelected ? "bg-white/20 text-amber-300" : "bg-emerald-600/10 text-emerald-800 border border-emerald-600/20"
                          )}
                          title="Ada Berkas Undangan Terlampir"
                        >
                          <FileText className="h-3 w-3" /> Berkas
                        </span>
                      )}
                      <span className={cn("text-xs font-mono font-bold flex items-center gap-1", isSelected ? "text-white/80" : "text-stone-500")}>
                        <Clock className="h-3 w-3" /> {timeDisplay} WIB
                      </span>
                    </div>
                  </div>

                  <p className={cn("font-condensed font-extrabold text-sm leading-snug line-clamp-2", isSelected ? "text-white" : "text-slate-900")}>
                    {event.summary}
                  </p>

                  <p className={cn("text-[11px] font-medium flex items-center gap-1 truncate", isSelected ? "text-white/60" : "text-stone-500")}>
                    <MapPin className="h-3 w-3 shrink-0" /> {event.location || "Balai Desa Sampeldes"}
                  </p>
                </button>
              )
            })
          ) : !errorMsg ? (
            <div className="text-center py-14 rounded-3xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 shadow-xs p-6 space-y-2">
              <CalendarIcon className="h-8 w-8 text-stone-400 mx-auto" />
              <p className="text-xs font-black text-stone-600 uppercase font-condensed tracking-wider">Tidak Ada Agenda Kegiatan</p>
              <p className="text-[11px] text-stone-400">Pilih tanggal lain atau buat jadwal baru melalui tab &quot;Input Jadwal Baru&quot;.</p>
            </div>
          ) : null}
        </div>
      </div>

      {/* Kolom Kanan: Rincian & Form Edit Agenda */}
      <div className="lg:col-span-7">
        <div className="bg-white dark:bg-[#081d27] border border-slate-200/80 dark:border-white/10 shadow-sm rounded-3xl overflow-hidden lg:sticky lg:top-8">
          <div className="p-5 border-b border-stone-300/40 flex flex-row items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 shadow-xs flex items-center justify-center text-emerald-800 shrink-0">
                {isEditing ? <Edit3 className="h-5 w-5" /> : <BookUser className="h-5 w-5" />}
              </div>
              <div>
                <h3 className="text-base font-condensed font-extrabold uppercase tracking-tight text-slate-900">
                  {isEditing ? "Edit Agenda Kegiatan" : "Rincian & Notulensi Agenda"}
                </h3>
                <p className="text-xs text-stone-500 font-bold uppercase tracking-wider">
                  {isEditing ? "Perubahan langsung tersimpan ke Google Calendar" : "Pilih acara untuk melihat detail atau mengedit"}
                </p>
              </div>
            </div>

            {selectedEvent && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  disabled={isDeleting || isSaving}
                  className="h-9 px-3 rounded-xl text-xs font-condensed font-black uppercase bg-rose-500/10 text-rose-700 hover:bg-rose-500 hover:text-white border border-rose-500/30 shadow-xs active:scale-95 transition-all flex items-center gap-1"
                  title="Hapus Agenda dari Google Calendar"
                >
                  {isDeleting ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="h-3.5 w-3.5" />
                  )}
                  <span>Hapus</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsEditing(!isEditing)}
                  disabled={isDeleting || isSaving}
                  className="h-9 px-3.5 rounded-xl text-xs font-condensed font-black uppercase bg-white dark:bg-white/5 border border-slate-200/80 dark:border-white/10 shadow-xs hover:border-teal-500/50 text-slate-800 hover:text-emerald-700 active:scale-95 transition-all flex items-center gap-1.5"
                >
                  {isEditing ? (
                    <>
                      <Eye className="h-3.5 w-3.5 text-stone-600" /> Tinjau
                    </>
                  ) : (
                    <>
                      <Edit3 className="h-3.5 w-3.5 text-emerald-700" /> Edit Agenda
                    </>
                  )}
                </button>
              </div>
            )}
          </div>

          <div className="p-6">
            {selectedEvent ? (
              <div className="space-y-5 animate-in fade-in">
                {/* Banner Lampiran Berkas Undangan (Jika Ada) */}
                {attachmentUrl && (
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-emerald-700 text-white flex items-center justify-center shrink-0 shadow-sm">
                        <FileText className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-condensed font-bold uppercase text-slate-900">Berkas Undangan Terlampir</h4>
                          <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-600/10 text-emerald-800 border border-emerald-600/20">
                            Google Drive
                          </span>
                        </div>
                        <p className="text-[11px] text-stone-500 font-medium mt-0.5">Surat undangan resmi tersimpan di Google Kalender & Drive desa.</p>
                      </div>
                    </div>
                    <a
                      href={attachmentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="h-9 px-4 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-condensed font-black text-xs uppercase shadow-sm shrink-0 inline-flex items-center justify-center gap-1.5 active:scale-95 transition-all"
                    >
                      <ExternalLink className="h-3.5 w-3.5" /> Buka Berkas
                    </a>
                  </div>
                )}

                {/* MODE EDIT AGENDA */}
                {isEditing ? (
                  <div className="space-y-4 pt-1">
                    {/* Judul Kegiatan */}
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-condensed font-black uppercase text-stone-500 tracking-wider">Judul Acara / Kegiatan</Label>
                      <input
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        placeholder="Contoh: Rapat Koordinasi Penyaluran BLT-DD"
                        className="w-full h-11 rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 shadow-xs px-4 text-xs font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-600"
                      />
                    </div>

                    {/* Jenis Agenda & Nomor Surat */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      <div className="space-y-1.5">
                        <Label className="text-[10px] font-condensed font-black uppercase text-stone-500 tracking-wider">Jenis Agenda</Label>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => setEditEventType("Internal")}
                            className={cn(
                              "h-10 rounded-xl font-condensed font-black text-xs uppercase transition-all flex items-center justify-center",
                              editEventType === "Internal"
                                ? "bg-emerald-700 text-white shadow-sm"
                                : "bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 shadow-xs text-stone-600"
                            )}
                          >
                            Internal
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditEventType("Eksternal")}
                            className={cn(
                              "h-10 rounded-xl font-condensed font-black text-xs uppercase transition-all flex items-center justify-center",
                              editEventType === "Eksternal"
                                ? "bg-sky-700 text-white shadow-sm"
                                : "bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 shadow-xs text-stone-600"
                            )}
                          >
                            Eksternal
                          </button>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-[10px] font-condensed font-black uppercase text-stone-500 tracking-wider">Nomor Surat Undangan</Label>
                        <input
                          value={editLetterNumber}
                          onChange={(e) => setEditLetterNumber(e.target.value)}
                          placeholder="005/123/2026"
                          className="w-full h-10 rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 shadow-xs px-4 text-xs font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-600"
                        />
                      </div>
                    </div>

                    {/* Tanggal & Waktu Pelaksanaan */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                      <div className="space-y-1.5">
                        <Label className="text-[10px] font-condensed font-black uppercase text-stone-500 tracking-wider">Tanggal Acara</Label>
                        <input
                          type="date"
                          value={editDate}
                          onChange={(e) => setEditDate(e.target.value)}
                          className="w-full h-10 rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 shadow-xs px-3 text-xs font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-600"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-[10px] font-condensed font-black uppercase text-stone-500 tracking-wider">Waktu Mulai</Label>
                        <input
                          type="time"
                          value={editStartTime}
                          onChange={(e) => setEditStartTime(e.target.value)}
                          className="w-full h-10 rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 shadow-xs px-3 text-xs font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-600"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-[10px] font-condensed font-black uppercase text-stone-500 tracking-wider">Waktu Selesai</Label>
                        <input
                          type="time"
                          value={editEndTime}
                          onChange={(e) => setEditEndTime(e.target.value)}
                          className="w-full h-10 rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 shadow-xs px-3 text-xs font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-600"
                        />
                      </div>
                    </div>

                    {/* Lokasi & Disposisi */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      <div className="space-y-1.5">
                        <Label className="text-[10px] font-condensed font-black uppercase text-stone-500 tracking-wider">Lokasi / Tempat Acara</Label>
                        <input
                          value={editLocation}
                          onChange={(e) => setEditLocation(e.target.value)}
                          placeholder="Balai Desa Sampeldes"
                          className="w-full h-10 rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 shadow-xs px-4 text-xs font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-600"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-[10px] font-condensed font-black uppercase text-stone-500 tracking-wider">Disposisi Petugas</Label>
                        <input
                          value={editDisposition}
                          onChange={(e) => setEditDisposition(e.target.value)}
                          placeholder="Kepala Desa / Sekretaris Desa / Kasi"
                          className="w-full h-10 rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 shadow-xs px-4 text-xs font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-600"
                        />
                      </div>
                    </div>

                    {/* Catatan / Keterangan */}
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-condensed font-black uppercase text-stone-500 tracking-wider">Catatan / Arahan Khusus</Label>
                      <input
                        value={editNotes}
                        onChange={(e) => setEditNotes(e.target.value)}
                        placeholder="Contoh: Membawa SPJ dan Laporan Realisasi"
                        className="w-full h-10 rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 shadow-xs px-4 text-xs font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-600"
                      />
                    </div>

                    {/* Notulensi Rapat */}
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-condensed font-black uppercase text-stone-500 tracking-wider">
                        Notulensi Hasil Kegiatan / Rapat
                      </Label>
                      <textarea
                        value={editNotulensi}
                        onChange={(e) => setEditNotulensi(e.target.value)}
                        placeholder="Catat hasil rapat, kesepakatan, daftar hadir, atau tindak lanjut kegiatan di sini..."
                        className="w-full min-h-[140px] rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 shadow-xs p-4 text-xs font-bold text-slate-900 leading-relaxed focus:outline-none focus:ring-1 focus:ring-emerald-600"
                      />
                    </div>

                    {/* Tombol Aksi Simpan & Hapus */}
                    <div className="flex flex-wrap items-center gap-3 pt-2">
                      <button
                        type="button"
                        onClick={handleSaveEvent}
                        disabled={isSaving || isDeleting}
                        className="flex-1 min-w-[200px] h-12 rounded-xl font-condensed font-black uppercase tracking-wide bg-emerald-700 hover:bg-emerald-800 text-white shadow-sm flex items-center justify-center gap-2 active:scale-95 transition-all disabled:opacity-50"
                      >
                        {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                        {isSaving ? "Menyimpan ke Kalender..." : "Simpan Perubahan ke Kalender"}
                      </button>

                      <button
                        type="button"
                        onClick={() => setShowDeleteConfirm(true)}
                        disabled={isSaving || isDeleting}
                        className="h-12 px-5 rounded-xl font-condensed font-black uppercase text-xs bg-rose-600 hover:bg-rose-700 text-white shadow-sm flex items-center gap-1.5 shrink-0 active:scale-95 transition-all disabled:opacity-50"
                      >
                        {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                        <span>Hapus Agenda</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setIsEditing(false)}
                        disabled={isSaving || isDeleting}
                        className="h-12 px-5 rounded-xl font-condensed font-black uppercase text-xs bg-white dark:bg-white/5 border border-slate-200/80 dark:border-white/10 shadow-xs hover:border-teal-500/50 text-stone-700 active:scale-95 transition-all"
                      >
                        <X className="h-4 w-4 mr-1 inline" /> Batal
                      </button>
                    </div>
                  </div>
                ) : (
                  /* MODE TINJAU / PREVIEW */
                  <div className="space-y-4 pt-1">
                    <div className="p-5 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 shadow-xs space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="text-[10px] font-condensed font-black uppercase text-stone-400 tracking-wider">Judul Kegiatan</span>
                          <h3 className="font-condensed font-extrabold text-base sm:text-lg text-slate-900 leading-snug mt-0.5">
                            {selectedEvent.summary}
                          </h3>
                        </div>
                        <span
                          className={cn(
                            "text-[10px] font-condensed font-black uppercase px-2.5 py-1 rounded-md shrink-0",
                            getEventType(selectedEvent.description) === "Internal"
                              ? "bg-emerald-600/10 text-emerald-800 border border-emerald-600/20"
                              : "bg-sky-600/10 text-sky-800 border border-sky-600/20"
                          )}
                        >
                          AGENDA {getEventType(selectedEvent.description)}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-stone-300/40 text-xs">
                        <div className="flex items-center gap-2 text-slate-800">
                          <CalendarDays className="h-4 w-4 text-emerald-700 shrink-0" />
                          <span className="font-bold">
                            {editDate ? format(parseISO(editDate), "EEEE, dd MMMM yyyy", { locale: localeID }) : searchDate}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-800">
                          <Clock className="h-4 w-4 text-emerald-700 shrink-0" />
                          <span className="font-bold">{editStartTime} - {editEndTime} WIB</span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-800">
                          <MapPin className="h-4 w-4 text-emerald-700 shrink-0" />
                          <span className="font-bold truncate">{selectedEvent.location || "Balai Desa Sampeldes"}</span>
                        </div>
                        {editLetterNumber && (
                          <div className="flex items-center gap-2 text-slate-800">
                            <FileText className="h-4 w-4 text-emerald-700 shrink-0" />
                            <span className="font-bold">No: {editLetterNumber}</span>
                          </div>
                        )}
                        {editDisposition && (
                          <div className="flex items-center gap-2 text-slate-800 sm:col-span-2">
                            <UserCheck className="h-4 w-4 text-emerald-700 shrink-0" />
                            <span className="font-bold">Disposisi: {editDisposition}</span>
                          </div>
                        )}
                      </div>

                      {editNotes && (
                        <div className="pt-3 border-t border-stone-300/40">
                          <span className="text-[10px] font-condensed font-black uppercase text-stone-400 tracking-wider block mb-0.5">Catatan</span>
                          <p className="text-xs text-slate-800 font-medium">{editNotes}</p>
                        </div>
                      )}
                    </div>

                    {/* Area Notulensi Cepat */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="notulensi" className="text-[10px] font-condensed font-black uppercase text-stone-500 tracking-wider">
                          Notulensi / Catatan Rapat (Tersimpan ke Kalender)
                        </Label>
                        <button
                          type="button"
                          onClick={() => setIsEditing(true)}
                          className="text-[10px] font-condensed font-black uppercase text-emerald-800 hover:text-emerald-900 px-2 py-0.5 rounded-lg bg-white dark:bg-white/5 border border-slate-200/80 dark:border-white/10 shadow-xs active:scale-95 transition-all flex items-center gap-1"
                        >
                          <Edit3 className="h-3 w-3" /> Edit Lengkap
                        </button>
                      </div>
                      <textarea
                        id="notulensi"
                        value={editNotulensi}
                        onChange={(e) => setEditNotulensi(e.target.value)}
                        placeholder="Tulis hasil rapat atau catatan penting di sini..."
                        className="w-full min-h-[160px] rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 shadow-xs p-4 text-xs font-bold text-slate-900 leading-relaxed focus:outline-none focus:ring-1 focus:ring-emerald-600"
                      />
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-3 pt-1">
                      <button
                        type="button"
                        onClick={handleSaveEvent}
                        disabled={isSaving}
                        className="w-full sm:flex-1 h-12 rounded-xl font-condensed font-black uppercase tracking-wide bg-emerald-700 hover:bg-emerald-800 text-white shadow-sm flex items-center justify-center gap-2 active:scale-95 transition-all disabled:opacity-50"
                      >
                        {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                        {isSaving ? "Menyimpan ke Kalender..." : "Simpan Notulensi ke Kalender"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsEditing(true)}
                        className="w-full sm:w-auto h-12 px-6 rounded-xl font-condensed font-black uppercase text-xs bg-white dark:bg-white/5 border border-slate-200/80 dark:border-white/10 shadow-xs hover:border-teal-500/50 text-slate-800 hover:text-emerald-700 active:scale-95 transition-all flex items-center justify-center gap-1.5"
                      >
                        <Edit3 className="h-3.5 w-3.5 text-stone-600" /> Edit Seluruh Agenda
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-24 space-y-3">
                <div className="h-14 w-14 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 shadow-xs text-stone-400 flex items-center justify-center mx-auto">
                  <CalendarDays className="h-7 w-7" />
                </div>
                <div>
                  <h4 className="text-sm font-condensed font-black uppercase text-slate-800">Pilih Agenda dari Daftar</h4>
                  <p className="text-xs text-stone-400 max-w-xs mx-auto mt-1">
                    Klik salah satu acara di sebelah kiri untuk melihat detail, mengunduh lampiran, mengedit jadwal, atau mengisi notulensi rapat.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Dialog Konfirmasi Hapus Agenda */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent className="rounded-[2.5rem] max-w-md bg-white dark:bg-[#081d27] shadow-2xl border border-white/80 p-6 sm:p-8 text-slate-900">
          <AlertDialogHeader>
            <div className="h-12 w-12 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 shadow-xs text-rose-600 flex items-center justify-center mb-2">
              <Trash2 className="h-6 w-6" />
            </div>
            <AlertDialogTitle className="font-condensed font-black text-xl uppercase tracking-tight text-slate-900">
              Hapus Agenda Kegiatan?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-stone-600 font-medium leading-relaxed">
              Agenda <strong>&quot;{selectedEvent?.summary}&quot;</strong> akan dihapus secara permanen dari <strong>Google Calendar</strong> dan daftar agenda desa. Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-3 mt-4 pt-3 border-t border-stone-300/40">
            <AlertDialogCancel
              disabled={isDeleting}
              className="rounded-xl font-condensed font-black uppercase text-xs bg-white dark:bg-white/5 border border-slate-200/80 dark:border-white/10 shadow-xs hover:border-teal-500/50 text-stone-700"
            >
              Batal
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleDeleteEvent();
              }}
              disabled={isDeleting}
              className="rounded-xl font-condensed font-black uppercase text-xs bg-rose-600 hover:bg-rose-700 text-white gap-1.5 shadow-sm"
            >
              {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
              <span>{isDeleting ? "Menghapus dari Kalender..." : "Ya, Hapus Sekarang"}</span>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
