'use client';

import dynamic from 'next/dynamic';
import { Header } from '@/components/landing/Header';
import { HeroSection } from '@/components/landing/HeroSection';
import { BackgroundPattern } from '@/components/landing/BackgroundPattern';
import { SambutanSection } from '@/components/landing/SambutanSection';
import { ServicesSection } from '@/components/landing/ServicesSection';
import { StatisticsSection } from '@/components/landing/StatisticsSection';
import { UmkmSection } from '@/components/landing/UmkmSection';
import { ProcessSection } from '@/components/landing/ProcessSection';
import { CitizenHubSection } from '@/components/landing/CitizenHubSection';
import { AboutSection } from '@/components/landing/AboutSection';
import { PbbSearchSection } from '@/components/landing/PbbSearchSection';
import { NewsSection } from '@/components/landing/NewsSection';
import { CtaSection } from '@/components/landing/CtaSection';
import { Footer } from '@/components/landing/Footer';
import { PartnerLogosBanner } from '@/components/landing/PartnerLogosBanner';
import { ScrollProgressBar } from '@/components/landing/ScrollProgressBar';
import { ScrollRevealSection } from '@/components/landing/ScrollRevealSection';

export default function LandingPage() {
  return (
    <div className="relative flex min-h-screen flex-col bg-[#F8FAFC] dark:bg-[#060b11] text-slate-900 dark:text-slate-100 overflow-x-clip transition-colors duration-500 font-sans">
      {/* 0. Top Interactive Scroll Progress Indicator (Inspirasi Luxury Motion) */}
      <ScrollProgressBar />

      {/* 1. Latar Belakang & Tekstur Modern Micro-Grid & Ambient Glow */}
      <BackgroundPattern />

      {/* 2. Global Sticky Header (Otomatis Muncul Halus Saat Halaman Di-scroll) */}
      <Header />

      <main className="relative z-10 flex flex-col w-full">
        {/* 1. Hero Sambutan Utama (Dilindungi & Tetap Sesuai Kode Eksisting) */}
        <HeroSection />

        {/* 2. Profil & Harmoni Desa (Animasi Transisi Halus Masuk dari Bawah) */}
        <ScrollRevealSection showDivider yOffset={60}>
          <SambutanSection />
        </ScrollRevealSection>

        {/* 3. Layanan Unggulan Desa (4 Feature Cards Cascading) */}
        <ScrollRevealSection showDivider yOffset={60}>
          <ServicesSection />
        </ScrollRevealSection>

        {/* 4. Transparansi & Tata Kelola (Checklist Kiri + Dark Navy Metrics Kanan) */}
        <ScrollRevealSection showDivider yOffset={60}>
          <StatisticsSection />
        </ScrollRevealSection>

        {/* 5. Berita Desa Terkini (3-Kolom Editorial Top Stories + Headline + Kabar Kilat) */}
        <ScrollRevealSection showDivider yOffset={60}>
          <NewsSection />
        </ScrollRevealSection>

        {/* 6. Alur Pelayanan Cepat (4 Steps Horizontal Connected Timeline) */}
        <ScrollRevealSection showDivider yOffset={60}>
          <ProcessSection />
        </ScrollRevealSection>

        {/* 7 & 8. Pesan Kades & Stats Ribbon (Curved Dark Leadership + Ribbon Strip) */}
        <ScrollRevealSection showDivider yOffset={60}>
          <CitizenHubSection />
        </ScrollRevealSection>

        {/* 9. Pamong & Perangkat Desa (Compact Grid Realtime Perangkat Desa) */}
        <ScrollRevealSection showDivider yOffset={60}>
          <AboutSection />
        </ScrollRevealSection>

        {/* 10. Pusat Bantuan & FAQ (Foto Balai Desa + Floating Hotline Card + Accordion) */}
        <ScrollRevealSection showDivider yOffset={60}>
          <PbbSearchSection />
        </ScrollRevealSection>

        {/* 11. Sentra UMKM Warga & Katalog Produk (3D Showcase Sesuai Konsep Gambar 2) */}
        <ScrollRevealSection showDivider yOffset={60}>
          <UmkmSection />
        </ScrollRevealSection>

        {/* 12. Layanan Aspirasi & Pengaduan Warga (Terintegrasi /pengaduan) */}
        <ScrollRevealSection showDivider yOffset={60}>
          <CtaSection />
        </ScrollRevealSection>

        {/* 13. Banner Logo Mitra / Instansi (Background Selaras dengan Halaman di Atasnya) */}
        <ScrollRevealSection showDivider yOffset={30}>
          <PartnerLogosBanner />
        </ScrollRevealSection>
      </main>

      {/* 14. Footer Modern Multi-Kolom */}
      <Footer />
    </div>
  );
}
