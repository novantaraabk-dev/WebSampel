"use client"

import { useState, useMemo } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calendar, FilePlus, Globe, AlertCircle, RefreshCw } from "lucide-react"
import { RincianKegiatan } from "@/components/agenda/RincianKegiatan"
import { InputAgendaForm } from "@/components/agenda/InputAgendaForm"
import { Button } from "@/components/ui/button"
import { useUser, useDoc, useFirestore, useMemoFirebase } from "@/firebase"
import { doc } from "firebase/firestore"
import { GOOGLE_CONFIG } from "@/lib/google-config"

export default function AgendaPage() {
  const [activeTab, setActiveTab] = useState<string>("rincian")
  const [selectedDate, setSelectedDate] = useState<string | undefined>(undefined)
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0)

  const { user } = useUser()
  const db = useFirestore()

  const villageSettingsRef = useMemoFirebase(() => (db ? doc(db, "settings", "village") : null), [db])
  const { data: villageSettings } = useDoc(villageSettingsRef)

  const userDocRef = useMemoFirebase(() => (db && user ? doc(db, "users", user.uid) : null), [db, user])
  const { data: userData } = useDoc(userDocRef)

  const calendarId = useMemo(() => {
    const raw = (villageSettings?.googleCalendarId || userData?.googleCalendarId || GOOGLE_CONFIG.calendarId || "").trim()
    return raw
  }, [villageSettings, userData])

  const embedSrc = useMemo(() => {
    if (calendarId && calendarId.includes("@")) {
      return `https://calendar.google.com/calendar/embed?src=${encodeURIComponent(calendarId)}&ctz=Asia%2FJakarta`
    }
    return null
  }, [calendarId])

  const handleAgendaCreated = (eventDate: string) => {
    setSelectedDate(eventDate)
    setRefreshTrigger((prev) => prev + 1)
    setActiveTab("rincian")
  }

  return (
    <div className="flex flex-col gap-6 p-4 md:p-8 max-w-6xl mx-auto font-sans">
      <header className="flex items-center gap-4">
        <div className="h-12 w-12 rounded-2xl bg-white dark:bg-[#081d27] shadow-inner border border-stone-300/40 text-emerald-800 flex items-center justify-center shrink-0">
          <Calendar className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-condensed font-extrabold text-slate-900 uppercase tracking-tight">
            Agenda Kegiatan Desa
          </h1>
          <p className="text-xs text-stone-500 font-bold uppercase tracking-wider">
            Manajemen Kalender & Penjadwalan Acara Pemerintahan Desa
          </p>
        </div>
      </header>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 h-14 bg-white dark:bg-[#081d27] p-1.5 rounded-2xl shadow-inner border border-stone-300/40 text-stone-600">
          <TabsTrigger
            value="rincian"
            className="gap-2 text-[10px] sm:text-xs font-condensed font-black uppercase rounded-xl h-full data-[state=active]:bg-white dark:bg-[#081d27] data-[state=active]:text-slate-900 data-[state=active]:shadow-sm data-[state=active]:border data-[state=active]:border-white/80 text-stone-600 hover:text-slate-900 transition-all"
          >
            <Calendar className="h-4 w-4 text-emerald-700" />
            Rincian Agenda
          </TabsTrigger>
          <TabsTrigger
            value="input"
            className="gap-2 text-[10px] sm:text-xs font-condensed font-black uppercase rounded-xl h-full data-[state=active]:bg-white dark:bg-[#081d27] data-[state=active]:text-slate-900 data-[state=active]:shadow-sm data-[state=active]:border data-[state=active]:border-white/80 text-stone-600 hover:text-slate-900 transition-all"
          >
            <FilePlus className="h-4 w-4 text-stone-700" />
            Input Jadwal Baru
          </TabsTrigger>
          <TabsTrigger
            value="visual"
            className="gap-2 text-[10px] sm:text-xs font-condensed font-black uppercase rounded-xl h-full data-[state=active]:bg-white dark:bg-[#081d27] data-[state=active]:text-slate-900 data-[state=active]:shadow-sm data-[state=active]:border data-[state=active]:border-white/80 text-stone-600 hover:text-slate-900 transition-all"
          >
            <Globe className="h-4 w-4 text-sky-700" />
            Tampilan Kalender
          </TabsTrigger>
        </TabsList>

        <TabsContent value="rincian" className="mt-6">
          <RincianKegiatan externalDate={selectedDate} refreshTrigger={refreshTrigger} />
        </TabsContent>

        <TabsContent value="input" className="mt-6">
          <InputAgendaForm onSuccess={handleAgendaCreated} />
        </TabsContent>

        <TabsContent value="visual" className="mt-6">
          <div className="bg-white dark:bg-[#081d27] shadow-md border border-white/60 rounded-3xl overflow-hidden p-3 sm:p-4 space-y-3">
            <div className="flex items-center justify-between px-1">
              <p className="text-[11px] font-bold text-stone-600">
                Kalender Aktif: <span className="text-slate-900">{calendarId || "primary"}</span>
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 rounded-xl text-[11px] font-bold gap-1.5"
                onClick={() => setRefreshTrigger((prev) => prev + 1)}
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Muat Ulang Kalender
              </Button>
            </div>
            {embedSrc ? (
              <div className="aspect-[4/3] md:aspect-video w-full rounded-2xl overflow-hidden shadow-inner border border-stone-300/40">
                <iframe
                  key={`${embedSrc}-${refreshTrigger}`}
                  src={embedSrc}
                  style={{ border: 0 }}
                  width="100%"
                  height="100%"
                  frameBorder="0"
                  scrolling="no"
                  className="w-full h-full"
                ></iframe>
              </div>
            ) : (
              <div className="p-8 rounded-2xl border border-dashed border-stone-300 text-center space-y-2">
                <AlertCircle className="h-8 w-8 text-amber-600 mx-auto" />
                <p className="text-xs font-bold text-slate-800">
                  ID Google Calendar (email kalender) belum diatur di Pengaturan.
                </p>
                <p className="text-[11px] text-stone-500">
                  Saat ini agenda tersimpan ke kalender utama (<code>primary</code>) akun Google Apps Script. Untuk menampilkan embed kalender di sini, isi <strong>Google Calendar ID</strong> (alamat email Gmail/Calendar yang bersifat publik atau dibagikan) di menu <strong>Pengaturan Sistem</strong>.
                </p>
              </div>
            )}
          </div>
          <p className="text-[10px] text-center text-stone-500 mt-4 font-bold uppercase tracking-widest font-condensed">
            * Sinkronisasi langsung dengan Google Calendar resmi Desa Sampeldes.
          </p>
        </TabsContent>
      </Tabs>
    </div>
  )
}
