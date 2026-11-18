'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send,
  CheckCircle2,
  MessageSquareWarning,
  MessageSquare,
  ShieldCheck,
  ExternalLink,
  Loader2,
  Phone,
  User,
  Sparkles,
} from 'lucide-react';
import { useFirestore } from '@/firebase';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

export function CtaSection() {
  const [complaintText, setComplaintText] = useState('');
  const [reporterName, setReporterName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submittedDocId, setSubmittedDocId] = useState<string | null>(null);

  const { toast } = useToast();
  const firestore = useFirestore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!complaintText.trim()) {
      toast({
        title: 'Pengaduan Masih Kosong',
        description: 'Silakan tuliskan isi aspirasi atau pengaduan Anda.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      if (firestore) {
        const finalName = isAnonymous
          ? 'Warga (Anonim)'
          : reporterName.trim() || 'Warga Sampeldes';

        const docRef = await addDoc(collection(firestore, 'complaints'), {
          description: complaintText.trim(),
          reporterName: finalName,
          reporterAddress: 'Desa Sampeldes',
          phoneNumber: phoneNumber.trim() || '',
          submissionDate: serverTimestamp(),
          summaryLLM: complaintText.trim().slice(0, 120),
          sentiment: 'neutral',
          keywords: ['Aspirasi Landing Page', 'Warga Sampeldes'],
        });

        setSubmittedDocId(docRef.id);
      }

      setSubmitted(true);
      toast({
        title: 'Pengaduan Berhasil Terkirim',
        description: 'Laporan Anda telah tercatat di Portal Pengaduan Resmi Desa.',
      });
    } catch (error: any) {
      console.error('Error submitting complaint:', error);
      toast({
        title: 'Gagal Mengirim',
        description: error.message || 'Terjadi kesalahan jaringan saat mengirim pengaduan.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setSubmitted(false);
    setComplaintText('');
    setReporterName('');
    setPhoneNumber('');
    setIsAnonymous(false);
  };

  return (
    <section id="pengaduan-warga" className="relative w-full py-14 lg:py-20 overflow-hidden select-none">
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* CURVED FLOATING DARK BANNER (SESUAI GAMBAR REFERENSI & /pengaduan) */}
        <div className="relative rounded-[32px] sm:rounded-[40px] bg-[#071720] text-white p-6 sm:p-10 lg:p-14 shadow-2xl overflow-hidden border border-white/10">
          {/* Beground Foto Artistik dengan Gradient Gelap Sinematik */}
          <div className="absolute inset-0 z-0">
            <Image
              src="https://images.unsplash.com/photo-1511497584788-876760111969?q=80&w=1600&auto=format&fit=crop"
              alt="Desa Sampeldes Gotong Royong"
              fill
              className="object-cover object-center opacity-15 brightness-50 mix-blend-overlay pointer-events-none"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#071720]/98 via-[#071720]/92 to-[#040d12] pointer-events-none" />
          </div>

          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            {/* Teks Kiri: Pengaduan Warga & Layanan Aspirasi */}
            <div className="lg:col-span-6 space-y-4">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-teal-500/20 border border-teal-400/30 text-teal-300 text-[10px] sm:text-[11px] font-bold tracking-[0.2em] uppercase">
                <MessageSquareWarning className="h-3.5 w-3.5 text-teal-400" />
                <span>LAYANAN ASPIRASI &amp; PENGADUAN WARGA</span>
              </div>

              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white leading-tight font-condensed uppercase tracking-tight">
                SALURKAN ASPIRASI ANDA &amp;{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-emerald-300">
                  PANTAU KEMAJUAN DESA
                </span>
              </h2>

              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-xl">
                Sampaikan kritik, saran pembangunan, perbaikan infrastruktur, atau masukan pelayanan publik Anda secara transparan. Setiap pengaduan langsung diterima dan ditindaklanjuti oleh Pamong Desa Sampeldes.
              </p>

              {/* 3 Keunggulan Layanan Pengaduan */}
              <div className="pt-2 grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-[11px] text-slate-300">
                <div className="flex items-center gap-2 bg-white/5 px-3 py-2 rounded-xl border border-white/5">
                  <ShieldCheck className="h-4 w-4 text-teal-400 shrink-0" />
                  <span>Privasi Terlindungi</span>
                </div>
                <div className="flex items-center gap-2 bg-white/5 px-3 py-2 rounded-xl border border-white/5">
                  <Sparkles className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span>Respon Cepat Pamong</span>
                </div>
                <div className="flex items-center gap-2 bg-white/5 px-3 py-2 rounded-xl border border-white/5">
                  <MessageSquare className="h-4 w-4 text-teal-300 shrink-0" />
                  <span>Pantau di Portal</span>
                </div>
              </div>
            </div>

            {/* Form Kanan: Terintegrasi dengan Sistem /pengaduan */}
            <div className="lg:col-span-6">
              <AnimatePresence mode="wait">
                {submitted ? (
                  <motion.div
                    key="success-box"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="p-6 rounded-2xl bg-teal-950/60 border border-teal-400/40 text-white space-y-4 backdrop-blur-md"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-teal-500/20 text-teal-300 flex items-center justify-center shrink-0">
                        <CheckCircle2 className="h-6 w-6 text-teal-400" />
                      </div>
                      <div>
                        <h4 className="text-sm sm:text-base font-bold text-white">
                          Pengaduan Berhasil Dikirim!
                        </h4>
                        <p className="text-xs text-teal-200/80">
                          Laporan Anda telah tersimpan ke sistem portal pengaduan resmi desa.
                        </p>
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-black/30 border border-white/10 text-xs text-slate-300 space-y-1">
                      <p className="font-semibold text-white">Isi Aspirasi:</p>
                      <p className="line-clamp-2 italic text-slate-400">"{complaintText}"</p>
                    </div>

                    <div className="flex flex-wrap gap-2 pt-1">
                      <Link
                        href="/pengaduan/"
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs uppercase tracking-wider transition-colors"
                      >
                        <span>Lihat di Halaman Pengaduan</span>
                        <ExternalLink className="h-3.5 w-3.5" />
                      </Link>
                      <button
                        type="button"
                        onClick={handleReset}
                        className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-colors cursor-pointer"
                      >
                        Kirim Aspirasi Lain
                      </button>
                    </div>
                  </motion.div>
                ) : (
                  <motion.form
                    key="form-box"
                    onSubmit={handleSubmit}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="p-5 sm:p-6 rounded-2xl bg-white/10 border border-white/15 backdrop-blur-md space-y-3.5"
                  >
                    {/* Header Ringkas Form */}
                    <div className="flex items-center justify-between pb-1 border-b border-white/10">
                      <span className="text-xs font-bold uppercase tracking-wider text-teal-300 flex items-center gap-1.5">
                        <Send className="h-3.5 w-3.5" />
                        Formulir Aspirasi &amp; Pengaduan
                      </span>
                      <label className="flex items-center gap-1.5 text-[11px] text-slate-300 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={isAnonymous}
                          onChange={(e) => setIsAnonymous(e.target.checked)}
                          className="rounded border-white/30 text-teal-500 focus:ring-0 cursor-pointer"
                        />
                        <span>Kirim Anonim</span>
                      </label>
                    </div>

                    {/* Baris Nama & No. WhatsApp */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div className="relative">
                        <input
                          type="text"
                          value={reporterName}
                          onChange={(e) => setReporterName(e.target.value)}
                          disabled={isAnonymous}
                          placeholder={isAnonymous ? 'Anonim (Dirahasiakan)' : 'Nama Lengkap / Inisial'}
                          className="w-full h-9 bg-black/30 px-3 text-xs text-white placeholder-white/40 rounded-xl border border-white/15 focus:border-teal-400 focus:outline-hidden disabled:opacity-50"
                        />
                      </div>
                      <div className="relative">
                        <input
                          type="text"
                          value={phoneNumber}
                          onChange={(e) => setPhoneNumber(e.target.value)}
                          placeholder="No. WhatsApp (opsional update)"
                          className="w-full h-9 bg-black/30 px-3 text-xs text-white placeholder-white/40 rounded-xl border border-white/15 focus:border-teal-400 focus:outline-hidden"
                        />
                      </div>
                    </div>

                    {/* Input Teks Pengaduan / Aspirasi */}
                    <div>
                      <textarea
                        value={complaintText}
                        onChange={(e) => setComplaintText(e.target.value)}
                        placeholder="Tulis aspirasi, laporan jalan/irigasi, atau masukan Anda untuk kemajuan Desa Sampeldes..."
                        rows={3}
                        required
                        className="w-full bg-black/30 p-3 text-xs sm:text-sm text-white placeholder-white/40 rounded-xl border border-white/15 focus:border-teal-400 focus:outline-hidden resize-none"
                      />
                    </div>

                    {/* Baris Tombol Kirim & Link ke /pengaduan */}
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 pt-1">
                      <Link
                        href="/pengaduan/"
                        className="text-[11px] text-teal-300 hover:text-white flex items-center gap-1 transition-colors self-start sm:self-center"
                      >
                        <span>Buka Portal Pengaduan Lengkap</span>
                        <ExternalLink className="h-3 w-3" />
                      </Link>

                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-400 hover:to-emerald-500 text-slate-950 font-black text-xs uppercase tracking-wider shrink-0 transition-all shadow-md hover:scale-105 active:scale-95 cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60"
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            <span>Mengirim...</span>
                          </>
                        ) : (
                          <>
                            <span>Kirim Pengaduan</span>
                            <Send className="h-3 w-3" />
                          </>
                        )}
                      </button>
                    </div>

                    <p className="text-[10px] text-white/50 text-center sm:text-left pt-0.5">
                      * Privasi dan nomor kontak warga dijamin kerahasiaannya sesuai ketentuan undang-undang perlindungan data.
                    </p>
                  </motion.form>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default CtaSection;
