'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { Header } from '@/components/landing/Header';
import { Footer } from '@/components/landing/Footer';
import { BackgroundPattern } from '@/components/landing/BackgroundPattern';
import { Button } from '@/components/ui/button';
import {
  Phone,
  Shield,
  Heart,
  Building2,
  Users,
  Siren,
  Landmark,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { ImportantNumbersData, ImportantNumberContact } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';

type ProcessedContactItem = {
  id?: string;
  label: string;
  number: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  category: 'pemerintah' | 'keamanan' | 'kesehatan' | 'wilayah';
};

const defaultRawContacts: ImportantNumberContact[] = [
  { id: '1', label: 'Kepala Desa', number: '082324502378', category: 'pemerintah' },
  { id: '2', label: 'Babinsa', number: '081282148178', category: 'keamanan' },
  { id: '3', label: 'Bhabinkamtibmas', number: '085229658988', category: 'keamanan' },
  { id: '4', label: 'Bidan Desa', number: '081226370112', category: 'kesehatan' },
  { id: '5', label: 'Camat Gandrungmangu', number: '08122727683', category: 'pemerintah' },
  { id: '6', label: 'Koramil Gandrungmangu', number: '085229658988', category: 'keamanan' },
  { id: '7', label: 'Polsek Gandrungmangu', number: '083867770110', category: 'keamanan' },
  { id: '8', label: 'Puskesmas Gandrungmangu I', number: '082234577980', category: 'kesehatan' },
  { id: '9', label: 'Kadus Pangampiran', number: '082138337494', category: 'wilayah' },
  { id: '10', label: 'Kadus Ciloning', number: '085282256678', category: 'wilayah' },
];

const formatPhoneDisplay = (number: string) => {
  const clean = number.replace(/\s+/g, '');
  if (clean.length === 12) {
    return `${clean.slice(0, 4)} ${clean.slice(4, 8)} ${clean.slice(8)}`;
  }
  if (clean.length === 11) {
    return `${clean.slice(0, 4)} ${clean.slice(4, 7)} ${clean.slice(7)}`;
  }
  if (clean.length === 13) {
    return `${clean.slice(0, 4)} ${clean.slice(4, 8)} ${clean.slice(8)}`;
  }
  return number;
};

const categoryLabels: Record<string, { label: string; icon: React.ElementType; color: string; border: string }> = {
  pemerintah: { label: 'Pemerintahan', icon: Landmark, color: 'text-emerald-700 bg-emerald-50', border: 'border-emerald-200' },
  keamanan: { label: 'Keamanan & Ketertiban', icon: Shield, color: 'text-teal-700 bg-teal-50', border: 'border-teal-200' },
  kesehatan: { label: 'Kesehatan & Medis', icon: Heart, color: 'text-rose-700 bg-rose-50', border: 'border-rose-200' },
  wilayah: { label: 'Kepala Dusun (Kadus)', icon: Users, color: 'text-violet-700 bg-violet-50', border: 'border-violet-200' },
};

const categoryStyles: Record<string, { icon: React.ElementType; color: string; bgColor: string }> = {
  pemerintah: { icon: Landmark, color: 'text-emerald-600', bgColor: 'bg-emerald-50' },
  keamanan: { icon: Shield, color: 'text-teal-600', bgColor: 'bg-teal-50' },
  kesehatan: { icon: Heart, color: 'text-rose-600', bgColor: 'bg-rose-50' },
  wilayah: { icon: Users, color: 'text-violet-600', bgColor: 'bg-violet-50' },
};

export default function NomorPentingPage() {
  const firestore = useFirestore();

  const numbersRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, 'villageProfile', 'importantNumbers');
  }, [firestore]);

  const { data: numbersData, isLoading } = useDoc<ImportantNumbersData>(numbersRef);

  const contactsList: ImportantNumberContact[] = useMemo(() => {
    if (numbersData?.contacts && numbersData.contacts.length > 0) {
      return numbersData.contacts;
    }
    return defaultRawContacts;
  }, [numbersData]);

  const servicePhoneNumber = numbersData?.servicePhoneNumber || '085111318412';

  const processedContacts: ProcessedContactItem[] = useMemo(() => {
    return contactsList.map(item => {
      const style = categoryStyles[item.category] || categoryStyles.pemerintah;
      let icon = style.icon;
      if (item.label.toLowerCase().includes('polsek')) icon = Siren;
      if (item.label.toLowerCase().includes('camat')) icon = Building2;

      return {
        id: item.id,
        label: item.label,
        number: item.number,
        icon,
        color: style.color,
        bgColor: style.bgColor,
        category: item.category || 'pemerintah',
      };
    });
  }, [contactsList]);

  const groupedContacts = useMemo(() => {
    return processedContacts.reduce((acc, contact) => {
      if (!acc[contact.category]) acc[contact.category] = [];
      acc[contact.category].push(contact);
      return acc;
    }, {} as Record<string, ProcessedContactItem[]>);
  }, [processedContacts]);

  const categoryOrder = ['pemerintah', 'keamanan', 'kesehatan', 'wilayah'];

  return (
    <div className="relative flex min-h-screen flex-col bg-[#F8FAFC] dark:bg-[#060b11] text-slate-900 dark:text-slate-100 overflow-x-hidden font-sans">
      <BackgroundPattern />
      <Header />

      <main className="relative flex-1 pt-20 sm:pt-24 pb-12 sm:pb-16">
        <div className="container mx-auto px-3 sm:px-6 lg:px-8">
          {/* TITLE & DESCRIPTION HEADER */}
          <div className="text-center space-y-2 sm:space-y-3 mb-6 sm:mb-10 max-w-2xl mx-auto pt-2 sm:pt-4">
            <h1 className="text-3xl min-[380px]:text-4xl sm:text-5xl font-condensed font-bold uppercase tracking-tight text-slate-900 dark:text-white leading-[0.95]">
              Daftar Nomor <span className="text-teal-600 dark:text-teal-400">Penting</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 font-medium max-w-lg mx-auto leading-relaxed">
              Kontak darurat dan layanan cepat pemerintah desa, keamanan, serta fasilitas kesehatan di Sampeldes.
            </p>
            <div className="pt-1">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-teal-500/10 text-teal-700 dark:text-teal-300 font-bold uppercase text-[10px] tracking-wider px-3.5 py-1 border border-teal-500/20 shadow-xs">
                <Siren className="h-3 w-3 text-teal-600 dark:text-teal-400 animate-pulse" />
                <span>Layanan Siaga Cepat</span>
              </span>
            </div>
          </div>

          {/* CONTACT LIST BY CATEGORY */}
          {isLoading ? (
            <div className="space-y-6 sm:space-y-8">
              <Skeleton className="h-9 w-48 rounded-[1.4rem]" />
              <div className="grid gap-2.5 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-20 sm:h-24 rounded-[1.4rem]" />
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-6 sm:space-y-10">
              {categoryOrder.map((catKey) => {
                const catInfo = categoryLabels[catKey];
                const catContacts = groupedContacts[catKey];
                if (!catContacts || catContacts.length === 0) return null;

                return (
                  <section key={catKey} className="space-y-3 sm:space-y-4">
                    {/* Category Header */}
                    <div className="flex items-center gap-2.5 sm:gap-3">
                      <div className="p-2 sm:p-2.5 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20 shadow-xs">
                        <catInfo.icon className="h-4 w-4 sm:h-5 sm:w-5" />
                      </div>
                      <h3 className="text-base sm:text-xl font-condensed font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                        {catInfo.label}
                      </h3>
                      <div className="h-px flex-1 bg-slate-200 dark:bg-white/10" />
                    </div>

                    {/* Contact Cards */}
                    <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                      {catContacts.map((contact, i) => (
                        <div
                          key={contact.id || i}
                          className="rounded-[1.4rem] border border-slate-200/80 dark:border-white/10 shadow-sm hover:border-teal-500/50 hover:shadow-md transition-all duration-300 bg-white/95 dark:bg-[#081d27]/90 backdrop-blur-md group overflow-hidden"
                        >
                          <div className="p-0 flex items-stretch h-full">
                            {/* Icon side */}
                            <div className="flex items-center justify-center w-16 sm:w-20 shrink-0 bg-slate-50 dark:bg-white/[0.03] border-r border-slate-100 dark:border-white/10 text-teal-600 dark:text-teal-400">
                              <contact.icon className="h-6 w-6 sm:h-7 sm:w-7 transition-transform duration-300 group-hover:scale-110" />
                            </div>
                            {/* Info side */}
                            <div className="flex-1 p-3.5 sm:p-4 space-y-1 sm:space-y-1.5 min-w-0 flex flex-col justify-between">
                              <div>
                                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider truncate">
                                  {contact.label}
                                </p>
                                <p className="text-base sm:text-lg font-condensed font-bold text-slate-900 dark:text-white tracking-wider truncate">
                                  {formatPhoneDisplay(contact.number)}
                                </p>
                              </div>
                              <a
                                href={`tel:${contact.number}`}
                                className="inline-flex items-center justify-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-teal-600 hover:bg-teal-500 text-white transition-colors shadow-xs w-fit"
                              >
                                <Phone className="h-3 w-3" />
                                <span>Hubungi</span>
                              </a>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                );
              })}
            </div>
          )}

          {/* LAYANAN DESA PHONE NUMBER - BOTTOM CTA */}
          <div className="mt-8 sm:mt-12 mb-4 sm:mb-6">
            <div className="rounded-[1.4rem] border border-teal-500/20 shadow-md overflow-hidden bg-gradient-to-br from-[#081d27] via-[#0b2836] to-[#041117] text-white relative p-6 sm:p-10 md:p-12 text-center space-y-4 sm:space-y-6">
              <div className="absolute top-0 right-0 w-80 h-80 rounded-full bg-teal-500/15 blur-3xl pointer-events-none" />

              <div className="space-y-2 relative z-10">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/40 px-3.5 py-1 text-[10px] font-bold uppercase tracking-wider">
                  <Phone className="h-3 w-3 text-teal-400" />
                  <span>Pusat Informasi & Pelayanan</span>
                </span>
                <h3 className="text-2xl sm:text-4xl font-condensed font-bold uppercase tracking-tight text-white leading-[0.95]">
                  Nomor Pelayanan Desa Sampeldes
                </h3>
              </div>

              <a
                href={`tel:${servicePhoneNumber.replace(/\s+/g, '')}`}
                className="group inline-block w-full max-w-md mx-auto relative z-10"
              >
                <div className="relative bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 sm:px-8 py-3.5 sm:py-4 group-hover:bg-teal-500 group-hover:text-white group-hover:border-teal-400 transition-all duration-300 shadow-xs">
                  <p className="text-2xl sm:text-4xl md:text-5xl font-condensed font-bold tracking-wider transition-colors">
                    {formatPhoneDisplay(servicePhoneNumber)}
                  </p>
                </div>
              </a>

              <p className="text-xs sm:text-sm text-slate-300 max-w-sm mx-auto leading-relaxed relative z-10">
                Hubungi nomor di atas untuk informasi bantuan dan konsultasi administrasi Desa Sampeldes.
              </p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
