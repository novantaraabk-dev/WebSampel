'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronDown,
  PhoneCall,
  MessageCircle,
  HelpCircle,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import { doc } from 'firebase/firestore';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { VillageProfileInfo } from '@/lib/types';

const FAQ_ITEMS = [
  {
    q: 'Apa saja persyaratan untuk membuat surat pengantar secara online?',
    a: 'Cukup menyiapkan foto KTP elektronik, Kartu Keluarga (KK), dan mengisi data permohonan melalui menu Surat Mandiri. Berkas akan langsung masuk ke sistem verifikasi pamong desa.',
  },
  {
    q: 'Berapa lama waktu proses penerbitan surat mandiri digital?',
    a: 'Surat diproses dalam waktu 15 hingga 30 menit pada jam kerja dinas (Senin – Jumat, 08.00 – 15.30 WIB). Notifikasi status akan dikirimkan langsung dan surat dapat diunduh dalam format PDF.',
  },
  {
    q: 'Bagaimana cara mengecek status ketetapan dan pembayaran PBB-P2?',
    a: 'Warga cukup memasukkan Nomor Objek Pajak (NOP) atau nama wajib pajak pada menu Cek PBB untuk melihat rincian tagihan, tahun ketetapan, dan status lunas.',
  },
  {
    q: 'Ke mana warga dapat menyampaikan pengaduan atau aspirasi desa?',
    a: 'Warga dapat menggunakan menu Pengaduan Online di website ini atau menghubungi Hotline WhatsApp resmi Balai Desa untuk pelaporan infrastruktur dan pelayanan.',
  },
  {
    q: 'Apakah ada biaya dalam pembuatan surat dan administrasi desa?',
    a: 'Tidak ada biaya sama sekali. Seluruh pelayanan administrasi persuratan di Balai Desa Sampeldes adalah 100% GRATIS dan bebas pungutan liar.',
  },
];

export function PbbSearchSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const firestore = useFirestore();

  // Ambil Gambar Pendamping dari /admin/settings (villageProfile/default -> imageUrl)
  const profileRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, 'villageProfile', 'default');
  }, [firestore]);

  const { data: profileData } = useDoc<VillageProfileInfo>(profileRef);

  const accompanyingImageUrl =
    profileData?.imageUrl ||
    'https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=1000&auto=format&fit=crop';

  const toggleAccordion = (idx: number) => {
    setOpenIndex(openIndex === idx ? null : idx);
  };

  return (
    <section id="pbb-section" className="relative w-full py-20 lg:py-28 overflow-hidden select-none">
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-14 items-center">
          {/* SISI KIRI: FOTO BALAI DESA + FLOATING HOTLINE CARD (SESUAI GAMBAR REFERENSI SECTION 10) */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="lg:col-span-5 relative"
          >
            <div className="relative rounded-3xl overflow-hidden shadow-2xl border-4 border-white dark:border-[#0a1b24] h-[380px] sm:h-[450px]">
              <Image
                src={accompanyingImageUrl}
                alt="Kantor Balai Desa Sampeldes"
                fill
                sizes="(max-width: 768px) 100vw, 500px"
                className="object-cover object-center"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

              <div className="absolute top-4 left-4">
                <span className="bg-white/90 dark:bg-black/80 backdrop-blur-md text-slate-900 dark:text-white text-[10px] font-extrabold tracking-widest uppercase px-3 py-1.5 rounded-full shadow-sm">
                  KANTOR BALAI DESA
                </span>
              </div>

              {/* Floating Green Hotline Card di Bawah Foto (Sesuai Referensi) */}
              <div className="absolute bottom-4 left-4 right-4 bg-gradient-to-r from-emerald-600 to-teal-700 text-white rounded-2xl p-4 sm:p-5 shadow-xl backdrop-blur-md border border-white/20">
                <div className="flex items-center gap-3.5">
                  <div className="h-11 w-11 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                    <MessageCircle className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold tracking-wider text-teal-100 uppercase">
                      HOTLINE WHATSAPP WARGA
                    </p>
                    <a
                      href="https://wa.me/6287705245801"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-base sm:text-lg font-mono font-black text-white hover:underline leading-tight block"
                    >
                      0877-0524-5801
                    </a>
                  </div>
                </div>
                <div className="mt-2.5 pt-2 border-t border-white/20 flex items-center gap-2 text-[10px] text-teal-100">
                  <Clock className="h-3 w-3" />
                  <span>Senin – Jumat • 08.00 – 15.30 WIB</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* SISI KANAN: ACCORDION FAQ (SESUAI GAMBAR REFERENSI SECTION 10) */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="lg:col-span-7"
          >
            {/* Tag Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-50 dark:bg-teal-950/40 border border-teal-200/60 dark:border-teal-700/30 text-teal-700 dark:text-teal-300 text-[11px] font-bold tracking-[0.2em] uppercase mb-4">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-500" />
              <span>PUSAT BANTUAN & TANYA JAWAB</span>
            </div>

            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight mb-4">
              Pertanyaan yang Sering{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-600 to-emerald-500 dark:from-teal-400 dark:to-emerald-400">
                Diajukan Warga (FAQ)
              </span>
            </h2>
            <p className="text-slate-600 dark:text-slate-300 text-sm sm:text-base leading-relaxed mb-8">
              Temukan jawaban cepat seputar tata cara pengurusan berkas, persyaratan surat, dan transparansi administrasi desa.
            </p>

            {/* Accordion List */}
            <div className="space-y-3.5">
              {FAQ_ITEMS.map((faq, idx) => {
                const isOpen = openIndex === idx;
                return (
                  <div
                    key={idx}
                    className="rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#0a1b24] overflow-hidden transition-all duration-300 shadow-[0_4px_16px_rgba(0,0,0,0.02)]"
                  >
                    <button
                      type="button"
                      onClick={() => toggleAccordion(idx)}
                      className="w-full px-6 py-4.5 text-left flex items-center justify-between gap-4 cursor-pointer"
                    >
                      <span className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                        {faq.q}
                      </span>
                      <div
                        className={`h-7 w-7 rounded-full flex items-center justify-center shrink-0 transition-transform duration-300 ${isOpen
                          ? 'bg-teal-500 text-white rotate-180'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                          }`}
                      >
                        <ChevronDown className="h-4 w-4" />
                      </div>
                    </button>

                    <AnimatePresence initial={false}>
                      {isOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3 }}
                        >
                          <div className="px-6 pb-5 pt-1 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed border-t border-slate-100 dark:border-white/5">
                            {faq.a}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

export default PbbSearchSection;
