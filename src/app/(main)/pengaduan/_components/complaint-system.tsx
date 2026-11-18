'use client';

import { useState, useMemo, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { summarizeComplaintFeedback } from '@/lib/gemini-client';
import { Complaint, CitizenProfile } from '@/lib/types';
import {
  Loader2,
  Send,
  Lightbulb,
  MessageSquare,
  Tag,
  Calendar,
  CornerDownRight,
  User,
  MapPin,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { useCollection, useFirebase, useMemoFirebase } from '@/firebase';
import { addDoc, collection, serverTimestamp, query, orderBy, limit, where } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { getCitizenProfile } from '@/lib/citizens';

export function ComplaintSystem() {
  const [newComplaintText, setNewComplaintText] = useState('');
  const [reporterName, setReporterName] = useState('');
  const [reporterAddress, setReporterAddress] = useState('');
  const [profile, setProfile] = useState<CitizenProfile | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { firestore, user } = useFirebase();

  const isAdmin = !!user;

  useEffect(() => {
    if (user && firestore) {
      getCitizenProfile(firestore, user.uid).then(setProfile);
    }
  }, [user, firestore]);

  const complaintsQuery = useMemoFirebase(() => {
    if (!firestore || !user || user.isAnonymous) return null;
    const baseQuery = collection(firestore, 'complaints');

    if (!isAdmin) {
      return query(
        baseQuery,
        where('submitterAuthUid', '==', (user as any).uid),
        limit(100)
      );
    }

    return query(baseQuery, orderBy('submissionDate', 'desc'), limit(100));
  }, [firestore, user, isAdmin]);

  const { data: rawComplaints, isLoading: isLoadingComplaints } = useCollection<Complaint>(complaintsQuery, { realtime: true });

  const complaints = useMemo(() => {
    if (!rawComplaints) return null;
    if (isAdmin) return rawComplaints;

    return [...rawComplaints].sort((a, b) => {
      const dateA = a.submissionDate?.toMillis?.() || 0;
      const dateB = b.submissionDate?.toMillis?.() || 0;
      return dateB - dateA;
    });
  }, [rawComplaints, isAdmin]);

  const handleSubmit = async () => {
    if (!reporterName.trim() || !reporterAddress.trim() || !newComplaintText.trim()) {
      toast({
        title: 'Data Belum Lengkap',
        description: 'Silakan isi Nama, Alamat, dan isi Pengaduan Anda.',
        variant: 'destructive',
      });
      return;
    }

    if (!firestore) {
      toast({
        title: 'Gagal Mengirim',
        description: 'Koneksi ke database gagal. Coba lagi nanti.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      let summary = newComplaintText.trim().slice(0, 120);
      let sentiment: 'positive' | 'neutral' | 'negative' = 'neutral';
      let keywords: string[] = ['Pengaduan', 'Aspirasi', 'Warga'];

      try {
        const aiResult = await summarizeComplaintFeedback({
          complaintText: newComplaintText.trim(),
        });
        if (aiResult?.summary) summary = aiResult.summary;
        if (aiResult?.sentiment) sentiment = aiResult.sentiment;
        if (Array.isArray(aiResult?.keywords) && aiResult.keywords.length > 0) {
          keywords = aiResult.keywords;
        }
      } catch (aiErr) {
        console.warn('AI summarization skipped/failed:', aiErr);
      }

      const complaintData = {
        description: newComplaintText.trim(),
        summaryLLM: summary,
        sentiment: sentiment,
        keywords: keywords,
        submitterAuthUid: user ? user.uid : null,
        reporterName: reporterName.trim().toUpperCase(),
        reporterAddress: reporterAddress.trim(),
        phoneNumber: profile?.phoneNumber || '',
        email: profile?.email || '',
        status: 'New',
        submissionDate: serverTimestamp(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      await addDoc(collection(firestore, 'complaints'), complaintData);

      setNewComplaintText('');
      setReporterName('');
      setReporterAddress('');

      toast({
        title: 'Pengaduan Terkirim',
        description: 'Terima kasih atas masukan Anda. Kami akan segera meninjau laporan ini.',
      });
    } catch (error) {
      console.error('Gagal menyimpan pengaduan:', error);
      toast({
        title: 'Gagal Mengirim',
        description: 'Terjadi kesalahan saat memproses aduan. Silakan periksa koneksi dan coba lagi.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
      {/* FORM CARD */}
      <div className="lg:col-span-1">
        <div className="neu-card-elevated rounded-[28px] sm:rounded-[36px] overflow-hidden border border-white/60">
          <div className="bg-[#0f172a] text-white p-5 sm:p-7 space-y-2 border-b border-white/10">
            <div className="inline-flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400">Form Laporan Warga</span>
            </div>
            <h3 className="text-lg sm:text-xl font-condensed font-black uppercase tracking-tight text-white">Buat Pengaduan</h3>
            <p className="text-slate-300 text-xs leading-relaxed">
              Sampaikan keluhan, aspirasi, atau saran Anda secara langsung kepada Pemerintah Desa Sampeldes.
            </p>
          </div>
          <div className="p-5 sm:p-7 space-y-4">
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-stone-500">Nama Pengadu</label>
                <input
                  placeholder="Nama Lengkap Anda"
                  value={reporterName}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setReporterName(e.target.value)}
                  disabled={isSubmitting}
                  className="w-full h-11 px-4 rounded-2xl neu-inset text-xs sm:text-sm text-slate-900 placeholder:text-stone-400 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-700/50"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-stone-500">Alamat</label>
                <input
                  placeholder="Dusun / RT / RW"
                  value={reporterAddress}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setReporterAddress(e.target.value)}
                  disabled={isSubmitting}
                  className="w-full h-11 px-4 rounded-2xl neu-inset text-xs sm:text-sm text-slate-900 placeholder:text-stone-400 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-700/50"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-stone-500">Isi Pengaduan</label>
                <textarea
                  placeholder="Tuliskan keluhan atau saran Anda secara detail di sini..."
                  className="w-full p-4 rounded-2xl neu-inset text-xs sm:text-sm text-slate-900 placeholder:text-stone-400 font-medium min-h-[120px] focus:outline-none focus:ring-2 focus:ring-emerald-700/50 resize-y"
                  value={newComplaintText}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNewComplaintText(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="w-full neu-btn-dark font-bold h-12 rounded-full transition-all text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center gap-2 hover:opacity-95"
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin text-emerald-400" />
              ) : (
                <Send className="h-4 w-4 text-emerald-400" />
              )}
              <span>Kirim Pengaduan</span>
            </button>
          </div>
        </div>
      </div>

      {/* HISTORY CARD */}
      <div className="lg:col-span-2">
        <div className="neu-card-elevated rounded-[28px] sm:rounded-[36px] overflow-hidden border border-white/60">
          <div className="p-5 sm:p-7 border-b border-stone-300/80 space-y-1">
            <h3 className="text-base sm:text-xl font-condensed font-black uppercase tracking-tight text-slate-900">
              {isAdmin ? 'Seluruh Pengaduan Warga' : 'Riwayat Pengaduan Saya'}
            </h3>
            <p className="text-stone-600 text-xs sm:text-sm font-medium">
              Daftar laporan yang telah dikirimkan dan status tanggapannya dari aparat desa.
            </p>
          </div>

          <div className="p-4 sm:p-7">
            {isLoadingComplaints || !user ? (
              <div className="space-y-3">
                <Skeleton className="h-16 w-full rounded-2xl bg-stone-300/60" />
                <Skeleton className="h-16 w-full rounded-2xl bg-stone-300/60" />
                <Skeleton className="h-16 w-full rounded-2xl bg-stone-300/60" />
              </div>
            ) : complaints?.length === 0 ? (
              <div className="text-center py-12 sm:py-16 neu-inset rounded-2xl p-6">
                <MessageSquare className="h-8 w-8 text-stone-400 mx-auto mb-2" />
                <p className="text-stone-500 font-bold uppercase text-[10px] sm:text-xs tracking-wider">Belum ada pengaduan yang tercatat.</p>
              </div>
            ) : (
              <Accordion
                type="single"
                collapsible
                className="w-full space-y-3"
              >
                {complaints?.map((complaint) => (
                  <AccordionItem
                    value={complaint.id}
                    key={complaint.id}
                    className="neu-card-elevated rounded-2xl px-4 sm:px-6 transition-all hover:-translate-y-0.5 border border-white/60 overflow-hidden"
                  >
                    <AccordionTrigger className="py-3.5 sm:py-4 hover:no-underline">
                      <div className="flex flex-col gap-1 text-left w-full pr-2">
                        <div className="flex justify-between items-start gap-2">
                          <p className="text-xs sm:text-sm font-bold text-slate-800 line-clamp-1 uppercase tracking-tight">
                            {complaint.description}
                          </p>
                        </div>
                        <div className="flex items-center gap-1.5 text-[9px] sm:text-[10px] font-semibold text-stone-500 uppercase tracking-wider">
                          <Calendar className="h-3 w-3 text-emerald-700 shrink-0" />
                          <span>{complaint.submissionDate?.toDate().toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="space-y-4 sm:space-y-5 pt-1 pb-5">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                        <div className="space-y-1.5">
                          <p className="font-bold uppercase tracking-wider text-[9px] sm:text-[10px] text-stone-500 flex items-center gap-1.5">
                            <User className="w-3 h-3 text-emerald-700" />
                            Identitas Pengadu
                          </p>
                          <div className="neu-inset p-3.5 rounded-xl text-slate-700 text-xs sm:text-sm font-semibold space-y-1">
                            <p className="uppercase text-slate-900">{complaint.reporterName || 'Anonim'}</p>
                            <p className="text-[11px] sm:text-xs text-stone-500 flex items-center gap-1.5"><MapPin className="h-3 w-3 shrink-0" /> {complaint.reporterAddress || '-'}</p>
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <p className="font-bold uppercase tracking-wider text-[9px] sm:text-[10px] text-stone-500 flex items-center gap-1.5">
                            <MessageSquare className="w-3 h-3 text-emerald-700" />
                            Detail Laporan
                          </p>
                          <div className="neu-inset p-3.5 rounded-xl text-slate-800 text-xs sm:text-sm font-medium leading-relaxed italic">
                            &quot;{complaint.description}&quot;
                          </div>
                        </div>
                      </div>

                      {complaint.summaryLLM && (
                        <div className="neu-inset p-4 sm:p-5 rounded-2xl space-y-2.5">
                          <h4 className="font-bold uppercase tracking-wider text-[9px] sm:text-[10px] text-emerald-800 flex items-center gap-1.5">
                            <Lightbulb className="w-3.5 h-3.5" />
                            Analisis AI Desa
                          </h4>
                          <div className="space-y-2 text-xs sm:text-sm">
                            <div className="space-y-0.5">
                              <p className="font-bold text-slate-900 uppercase text-[9px] sm:text-[10px]">Ringkasan Masalah:</p>
                              <p className="text-stone-700 leading-relaxed font-medium italic">
                                &quot;{complaint.summaryLLM}&quot;
                              </p>
                            </div>
                            {complaint.keywords && complaint.keywords.length > 0 && (
                              <div className="space-y-1">
                                <p className="font-bold text-slate-900 uppercase text-[9px] sm:text-[10px]">Topik Terdeteksi:</p>
                                <div className="flex flex-wrap gap-1.5">
                                  {complaint.keywords.map((kw, i) => (
                                    <span
                                      key={i}
                                      className="neu-pill font-bold text-emerald-800 uppercase text-[8px] sm:text-[9px] px-2.5 py-0.5"
                                    >
                                      <Tag className="inline-block mr-1 h-2 w-2" />
                                      {kw}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {complaint.adminResponse && (
                        <div className="neu-btn-dark p-4 sm:p-5 rounded-2xl space-y-2 shadow-md">
                          <h4 className="font-bold uppercase tracking-wider text-[9px] sm:text-[10px] text-emerald-400 flex items-center gap-1.5">
                            <CornerDownRight className="w-3.5 h-3.5" />
                            Tanggapan Pemerintah Desa
                          </h4>
                          <p className="text-xs sm:text-sm font-medium leading-relaxed italic text-emerald-100">
                            &quot;{complaint.adminResponse}&quot;
                          </p>
                        </div>
                      )}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
