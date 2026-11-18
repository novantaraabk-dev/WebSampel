'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  CheckCircle2,
  RefreshCw,
  ExternalLink,
  ChevronRight,
  FileText,
  AlertCircle,
  Video,
  Sparkles,
  Info,
  Building2,
} from 'lucide-react';
import { format, addDays, parseISO } from 'date-fns';
import { id as localeID } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { callAppsScript } from '@/app/agenda/actions';
import { GOOGLE_CONFIG } from '@/lib/google-config';
import { useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { doc, collection, query, where, getDocs, limit } from 'firebase/firestore';

export interface CalendarEvent {
  id: string;
  summary: string;
  location?: string;
  htmlLink?: string;
  start: { dateTime?: string; date?: string };
  end: { dateTime?: string; date?: string };
  description?: string;
}

export interface ParsedEvent {
  id: string;
  title: string;
  location: string;
  letterNumber: string;
  eventType: 'Internal' | 'Eksternal';
  disposition: string;
  attachmentUrl: string | null;
  startDate: string;
  startTime: string;
  endTime: string;
  isOnline: boolean;
}

export function parseCalendarEvent(event: CalendarEvent, fallbackDate: string): ParsedEvent {
  const desc = event.description || '';

  const letterMatch = desc.match(/NOMOR SURAT:\s*([^\n\r]+)/i);
  const letterNumber = letterMatch ? letterMatch[1].trim() : '';

  const typeMatch = desc.match(/JENIS:\s*(Internal|Eksternal)/i);
  const eventType = (
    typeMatch ? typeMatch[1] : desc.includes('JENIS: Eksternal') ? 'Eksternal' : 'Internal'
  ) as 'Internal' | 'Eksternal';

  const dispMatch = desc.match(/DISPOSISI:\s*([^\n\r]+)/i);
  const disposition = dispMatch ? dispMatch[1].trim() : 'Pemerintah Desa Sampeldes';

  const linkMatch =
    desc.match(/(?:Link Undangan|Lampiran|Berkas):\s*(https?:\/\/[^\s\n\r]+)/i) ||
    desc.match(/(https:\/\/drive\.google\.com\/[^\s\n\r]+)/i);
  const attachmentUrl = linkMatch ? linkMatch[1].trim() : null;

  let startDate = fallbackDate;
  let startTime = '08:30';
  let endTime = '10:00';

  if (event.start?.dateTime) {
    try {
      const parsedStart = parseISO(event.start.dateTime);
      startDate = format(parsedStart, 'yyyy-MM-dd');
      startTime = format(parsedStart, 'HH:mm');
    } catch { }
  } else if (event.start?.date) {
    startDate = event.start.date;
  }

  if (event.end?.dateTime) {
    try {
      const parsedEnd = parseISO(event.end.dateTime);
      endTime = format(parsedEnd, 'HH:mm');
    } catch { }
  }

  const loc = event.location || 'Kantor Balai Desa Sampeldes';
  const isOnline =
    loc.toLowerCase().includes('zoom') ||
    loc.toLowerCase().includes('meet') ||
    loc.toLowerCase().includes('http');

  return {
    id: event.id,
    title: event.summary || 'Agenda Kegiatan',
    location: loc,
    letterNumber,
    eventType,
    disposition,
    attachmentUrl,
    startDate,
    startTime,
    endTime,
    isOnline,
  };
}

interface AgendaDesaPublicViewProps {
  isLanding?: boolean;
}

export function AgendaDesaPublicView({ isLanding = false }: AgendaDesaPublicViewProps) {
  const [selectedDayOffset, setSelectedDayOffset] = useState<number>(0);
  const [eventsMap, setEventsMap] = useState<Record<string, ParsedEvent[]>>({});
  const [countsMap, setCountsMap] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  const db = useFirestore();
  const villageSettingsRef = useMemoFirebase(
    () => (db ? doc(db, 'settings', 'village') : null),
    [db]
  );
  const { data: villageSettings } = useDoc(villageSettingsRef);

  const calendarId = useMemo(() => {
    return villageSettings?.googleCalendarId || GOOGLE_CONFIG.calendarId;
  }, [villageSettings]);

  // Tab 4 Hari: H (Hari ini), H+1 (Besok), H+2 (Lusa), H+3
  const dateTabs = useMemo(() => {
    const today = new Date();
    return [0, 1, 2, 3].map((offset) => {
      const targetDate = addDays(today, offset);
      const dateKey = format(targetDate, 'yyyy-MM-dd');
      let badgeLabel = 'HARI INI (HARI H)';
      if (offset === 1) badgeLabel = 'BESOK (H+1)';
      else if (offset === 2) badgeLabel = 'LUSA (H+2)';
      else if (offset === 3) badgeLabel = 'H+3';

      const dayName = format(targetDate, 'EEEE', { locale: localeID });
      const dayDate = format(targetDate, 'd MMM', { locale: localeID });
      const fullDateStr = format(targetDate, 'EEEE, d MMMM yyyy', { locale: localeID });

      return {
        offset,
        dateKey,
        badgeLabel,
        dayName,
        dayDate,
        fullDateStr,
      };
    });
  }, []);

  const activeDateTab = dateTabs[selectedDayOffset] || dateTabs[0];

  // Fetch data dari Google Calendar & sinkronisasi Firestore
  const fetchAgendaDates = useCallback(
    async (showLoadingState = true) => {
      if (showLoadingState) setIsLoading(true);
      setIsRefreshing(true);

      const newEventsMap: Record<string, ParsedEvent[]> = {};
      const newCountsMap: Record<string, number> = {};

      try {
        const fetchPromises = dateTabs.map(async (tab) => {
          let eventsFound: ParsedEvent[] = [];

          // 1. Coba ambil dari Google Calendar
          try {
            const res = await callAppsScript({
              action: 'getCalendar',
              calendarId: calendarId,
              date: tab.dateKey,
            });

            if (res && res.success && Array.isArray(res.items)) {
              eventsFound = res.items.map((item: CalendarEvent) =>
                parseCalendarEvent(item, tab.dateKey)
              );
            }
          } catch (gErr) {
            console.warn(`GCalendar fetch error untuk ${tab.dateKey}:`, gErr);
          }

          // 2. Jika di Google Calendar masih kosong, periksa koleksi buku_agenda Firestore pada tanggal yang sama
          if (eventsFound.length === 0 && db) {
            try {
              const qAgenda = query(
                collection(db, 'buku_agenda'),
                where('tanggal', '==', tab.dateKey),
                limit(10)
              );
              const snapshot = await getDocs(qAgenda);
              if (!snapshot.empty) {
                eventsFound = snapshot.docs.map((docSnap) => {
                  const d = docSnap.data();
                  return {
                    id: docSnap.id,
                    title: d.perihal || 'Agenda Kedinasan Desa',
                    location: d.keterangan?.includes('Lokasi:')
                      ? d.keterangan.split('|')[0].replace('Lokasi:', '').trim()
                      : 'Kantor Balai Desa Sampeldes',
                    letterNumber: d.nomor || '',
                    eventType: (d.kategori === 'surat_keluar' ? 'Internal' : 'Eksternal') as
                      | 'Internal'
                      | 'Eksternal',
                    disposition: d.keterangan?.includes('Petugas:')
                      ? d.keterangan.split('Petugas:')[1]?.split('|')[0]?.trim() ||
                      'Pemerintah Desa Sampeldes'
                      : 'Pemerintah Desa Sampeldes',
                    attachmentUrl: null,
                    startDate: tab.dateKey,
                    startTime: '08:30',
                    endTime: '11:00',
                    isOnline: false,
                  };
                });
              }
            } catch (fsErr) {
              console.warn(`Firestore buku_agenda fetch error:`, fsErr);
            }
          }

          newEventsMap[tab.dateKey] = eventsFound;
          newCountsMap[tab.dateKey] = eventsFound.length;
        });

        await Promise.allSettled(fetchPromises);
        setEventsMap(newEventsMap);
        setCountsMap(newCountsMap);
      } catch (err) {
        console.warn('Gagal memuat kalender agenda:', err);
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [calendarId, dateTabs, db]
  );

  useEffect(() => {
    fetchAgendaDates(true);
  }, [fetchAgendaDates]);

  const currentEvents = eventsMap[activeDateTab.dateKey] || [];
  const totalCount = countsMap[activeDateTab.dateKey] ?? currentEvents.length;

  return (
    <div className="w-full font-sans select-none space-y-4">
      {/* ─── 1. HEADER SECTION: DISESUAIKAN PERSIS DENGAN TEMA EDITORIAL SAMPELDES ─── */}
      <div className="text-center space-y-1 max-w-3xl mx-auto mb-2 shrink-0">
        <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full neu-pill mb-0.5 border border-stone-300/40 dark:border-white/10">
          <CalendarIcon className="h-3 w-3 text-emerald-800 dark:text-[#00a884]" />
          <span className="text-[9px] sm:text-[10px] font-sans font-semibold uppercase tracking-[0.22em] text-stone-600 dark:text-stone-300">
            KALENDER RESMI KEDINASAN &amp; KEMASYARAKATAN
          </span>
        </div>

        <h2 className="font-display font-light text-xl xs:text-2xl sm:text-3xl uppercase tracking-[0.14em] text-slate-900 dark:text-white leading-tight">
          AGENDA KEGIATAN DESA
        </h2>

        <div className="w-10 h-[1.5px] bg-emerald-600/40 dark:bg-[#00a884]/40 mx-auto my-0.5" />

        <p className="font-display font-light text-[11px] sm:text-xs uppercase tracking-[0.08em] text-slate-600 dark:text-stone-300">
          Jadwal Kegiatan Kedinasan &amp; Disposisi Pejabat Desa Sampeldes
        </p>
      </div>

      {/* ─── 2. BARIS TAB TANGGAL HORIZONTAL (NEUMORPHIC WARM DESIGN) ─── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3.5">
        {dateTabs.map((tab) => {
          const isSelected = selectedDayOffset === tab.offset;
          const count = countsMap[tab.dateKey] ?? 0;

          return (
            <button
              key={tab.dateKey}
              type="button"
              onClick={() => setSelectedDayOffset(tab.offset)}
              className={cn(
                'relative p-3 sm:p-3.5 rounded-2xl text-left transition-all duration-300 flex flex-col justify-between cursor-pointer',
                isSelected
                  ? 'neu-btn-dark text-white shadow-md border border-white/15 ring-2 ring-[#00a884]/40'
                  : 'neu-card-elevated hover:neu-convex text-slate-800 dark:text-stone-200 border border-white/70 dark:border-white/10'
              )}
            >
              {/* Header Tab: Badge Status & Nama Hari */}
              <div className="flex items-center justify-between gap-1 w-full mb-1.5">
                <span
                  className={cn(
                    'text-[8.5px] font-condensed font-black uppercase tracking-wider px-2 py-0.5 rounded-md',
                    isSelected
                      ? 'bg-[#00a884] text-slate-950 font-black shadow-xs'
                      : 'neu-inset text-stone-600 dark:text-stone-300'
                  )}
                >
                  {tab.badgeLabel}
                </span>
                <span
                  className={cn(
                    'text-[10px] font-bold font-condensed uppercase tracking-wider',
                    isSelected ? 'text-stone-300' : 'text-stone-500 dark:text-stone-400'
                  )}
                >
                  {tab.dayName}
                </span>
              </div>

              {/* Tanggal & Jumlah Acara */}
              <div className="flex items-baseline justify-between w-full mt-0.5">
                <span
                  className={cn(
                    'text-xl sm:text-2xl font-black font-condensed tracking-tight',
                    isSelected ? 'text-white' : 'text-slate-900 dark:text-white'
                  )}
                >
                  {tab.dayDate}
                </span>
                <span
                  className={cn(
                    'text-[10px] sm:text-[11px] font-bold font-condensed uppercase tracking-wide',
                    isSelected ? 'text-[#00a884]' : 'text-stone-500 dark:text-stone-400'
                  )}
                >
                  {count} Acara
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* ─── 3. SUBHEADER STATUS BARIS: TANGGAL TERPILIH & TOMBOL SEGARKAN ─── */}
      <div className="flex items-center justify-between px-1 pt-1 border-b border-stone-300/40 dark:border-white/10 pb-2">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-xs" />
          <h3 className="text-xs sm:text-sm font-condensed font-bold uppercase tracking-wide text-slate-900 dark:text-white">
            Agenda {activeDateTab.fullDateStr}
          </h3>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-[11px] font-condensed font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400 hidden xs:inline">
            {totalCount} Agenda Terjadwal
          </span>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => fetchAgendaDates(false)}
            disabled={isRefreshing}
            className="neu-btn h-7 px-3 rounded-lg text-[10px] font-condensed font-black uppercase tracking-wider text-stone-700 dark:text-stone-200 hover:text-emerald-800 dark:hover:text-[#00a884] transition-all flex items-center gap-1.5"
            title="Sinkronkan Kalender"
          >
            <RefreshCw
              className={cn('h-3 w-3', isRefreshing && 'animate-spin text-emerald-600')}
            />
            <span>{isRefreshing ? 'MEMUAT...' : 'SEGARKAN'}</span>
          </Button>
        </div>
      </div>

      {/* ─── 4. KONTEN AGENDA: CARD GRID / ELEGAN EMPTY STATE SESUAI TEMA ─── */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="neu-card-elevated rounded-2xl p-4 border border-white/70 dark:border-white/10 space-y-3"
            >
              <div className="flex justify-between items-center">
                <Skeleton className="h-5 w-24 rounded-full bg-stone-300/60 dark:bg-slate-800/60" />
                <Skeleton className="h-4 w-14 rounded-full bg-stone-300/60 dark:bg-slate-800/60" />
              </div>
              <Skeleton className="h-8 w-full rounded-xl bg-stone-300/60 dark:bg-slate-800/60" />
              <Skeleton className="h-10 w-full rounded-md bg-stone-300/60 dark:bg-slate-800/60" />
            </div>
          ))}
        </div>
      ) : currentEvents.length === 0 ? (
        /* Empty State yang harmonis dengan tema desa */
        <div className="neu-card-elevated rounded-2xl p-6 sm:p-8 text-center border border-white/80 dark:border-white/10 flex flex-col items-center justify-center space-y-3">
          <div className="w-12 h-12 rounded-2xl neu-inset flex items-center justify-center text-stone-500 dark:text-stone-400">
            <CalendarIcon className="h-6 w-6 text-emerald-800 dark:text-[#00a884]" />
          </div>

          <div className="space-y-1 max-w-md">
            <h4 className="font-condensed font-black text-sm sm:text-base uppercase tracking-wider text-slate-800 dark:text-slate-100">
              Tidak Ada Agenda Khusus Terjadwal
            </h4>
            <p className="text-[11px] text-stone-500 dark:text-stone-400 leading-relaxed">
              Belum ada agenda rapat dinas atau kegiatan kewilayahan khusus pada{' '}
              <span className="font-bold text-stone-700 dark:text-stone-300">
                {activeDateTab.fullDateStr}
              </span>
              .
            </p>
          </div>

          {/* Kartu Informasi Pelayanan Kantor Desa */}
          <div className="mt-2 p-3 rounded-xl neu-inset max-w-lg w-full flex items-center gap-3 text-left border border-stone-300/30 dark:border-white/5">
            <div className="p-2 rounded-lg bg-emerald-700/10 dark:bg-[#00a884]/10 text-emerald-800 dark:text-[#00a884] shrink-0">
              <Building2 className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-[9.5px] font-condensed font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400 block">
                Pelayanan Kantor Balai Desa Sampeldes
              </span>
              <p className="text-[11px] font-medium text-slate-800 dark:text-stone-200">
                Buka operasional: Senin – Jumat pukul 08:00 – 15:30 WIB.
              </p>
            </div>
          </div>
        </div>
      ) : (
        /* Grid Kartu Agenda */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {currentEvents.map((event) => {
            const isEksternal = event.eventType === 'Eksternal';

            return (
              <div
                key={event.id}
                className="neu-card-elevated rounded-2xl p-4 sm:p-4.5 border border-white/80 dark:border-white/10 flex flex-col justify-between hover:shadow-md transition-all duration-300 group"
              >
                <div className="space-y-3">
                  {/* Jam & Tipe */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full neu-inset text-stone-700 dark:text-stone-200 text-[11px] font-bold font-condensed">
                      <Clock className="h-3 w-3 text-stone-500 dark:text-stone-400" />
                      <span>
                        {event.startTime} - {event.endTime} WIB
                      </span>
                    </div>

                    <span
                      className={cn(
                        'text-[9px] font-condensed font-black uppercase tracking-wider px-2 py-0.5 rounded-md',
                        isEksternal
                          ? 'bg-amber-100/90 text-amber-900 border border-amber-300/60 dark:bg-amber-950/70 dark:text-amber-300 dark:border-amber-700/60'
                          : 'bg-emerald-100/90 text-emerald-900 border border-emerald-300/60 dark:bg-emerald-950/70 dark:text-emerald-300 dark:border-emerald-700/60'
                      )}
                    >
                      {event.eventType}
                    </span>
                  </div>

                  {/* Disposisi */}
                  <div className="p-2 rounded-xl neu-inset border border-stone-300/30 dark:border-white/5 flex items-start gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-700 dark:text-[#00a884] shrink-0 mt-0.5" />
                    <div className="min-w-0 flex-1">
                      <span className="block text-[8.5px] font-condensed font-black uppercase tracking-widest text-emerald-800 dark:text-[#00a884]">
                        DISPOSISI:
                      </span>
                      <p className="text-[10.5px] font-bold text-slate-800 dark:text-slate-100 uppercase leading-snug line-clamp-2">
                        {event.disposition}
                      </p>
                    </div>
                  </div>

                  {/* Judul Kegiatan */}
                  <div>
                    <h4 className="font-condensed font-bold text-xs sm:text-[13.5px] uppercase tracking-wide text-slate-900 dark:text-white leading-snug line-clamp-3">
                      {event.title}
                    </h4>
                    {event.letterNumber && (
                      <span className="text-[9.5px] text-stone-500 dark:text-stone-400 font-medium block mt-1">
                        No. Surat: {event.letterNumber}
                      </span>
                    )}
                  </div>
                </div>

                {/* Lokasi */}
                <div className="pt-2.5 mt-2.5 border-t border-stone-300/40 dark:border-white/10 space-y-1.5">
                  <div className="flex items-start gap-1.5 text-stone-600 dark:text-stone-300">
                    {event.isOnline ? (
                      <Video className="h-3 w-3 text-sky-600 dark:text-sky-400 shrink-0 mt-0.5" />
                    ) : (
                      <MapPin className="h-3 w-3 text-emerald-700 dark:text-[#00a884] shrink-0 mt-0.5" />
                    )}
                    <span className="line-clamp-2 text-[10.5px] font-medium leading-tight">
                      {event.location}
                    </span>
                  </div>

                  {event.attachmentUrl && (
                    <a
                      href={event.attachmentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 dark:text-[#00a884] hover:underline pt-0.5"
                    >
                      <FileText className="h-2.5 w-2.5" />
                      <span>Buka Berkas Undangan</span>
                      <ExternalLink className="h-2 w-2" />
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

