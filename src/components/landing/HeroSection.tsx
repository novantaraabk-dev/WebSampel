"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  ChevronUp,
  ChevronDown,
  MessageSquare,
  RotateCw,
  Search,
  User,
  Mouse,
  Menu,
  Globe2,
} from "lucide-react";
import { NightModeSwitch } from "@/components/ui/NightModeSwitch";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";
import { VillageLogoInfo, HeroSliderInfo } from "@/lib/types";

// Menu Navigasi Utama Resmi Sesuai Sistem Aplikasi Desa
const primaryNavItems = [
  { href: "/", label: "HOME", isHome: true },
  { href: "/pelayanan-desa/", label: "PELAYANAN" },
  { href: "/profil-desa/", label: "PROFIL" },
  { href: "/statistik/", label: "STATISTIK" },
  { href: "/tata-kelola-desa/", label: "TATA KELOLA DESA" },
  { href: "/BeritaDesa/", label: "BERITA" },
];

// Menu Dropdown "LAINNYA" Sesuai Sistem Aplikasi Desa
const moreLinks = [
  { href: "/pelayanan-desa?tab=agenda-desa", label: "Agenda Kegiatan Desa" },
  { href: "/nomor-penting/", label: "Kontak & Nomor Penting" },
  { href: "/desa-anti-korupsi/", label: "Desa Anti Korupsi" },
  { href: "/pemilu-pilkada/", label: "Data Pemilu & Pilkada" },
  { href: "/#pbb-section", label: "PBB-P2" },
  { href: "/layanan-surat/", label: "Layanan Surat Mandiri" },
  { href: "/potensi-desa/", label: "Potensi & Wisata Desa" },
  { href: "/umkm-dan-industri-kreatif/", label: "UMKM & Produk Warga" },
  { href: "/pengumuman/", label: "Pengumuman Resmi" },
  { href: "/pengaduan/", label: "Pengaduan Warga" },
];

const DEFAULT_HERO_SLIDES = [
  {
    id: "slide-1",
    number: "01",
    category: "PROFIL DESA",
    title: "SAMPELDES",
    subtitle: "GANDRUNGMANGU • CILACAP",
    description:
      "Mengenal sejarah, visi misi, dan harmoni alam Desa Sampeldes yang mandiri serta berbudaya.",
    bgImage:
      "https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=2070&auto=format&fit=crop",
    imageUrl:
      "https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=2070&auto=format&fit=crop",
    layout: "center" as const,
    ctaText: "PROFIL DESA",
    ctaLink: "/profil-desa/",
  },
  {
    id: "slide-2",
    number: "02",
    category: "PELAYANAN MANDIRI",
    title: "PELAYANAN",
    subtitle: "ADMINISTRASI SURAT & LAYANAN PUBLIK DIGITAL",
    description:
      "Kemudahan pengajuan surat pengantar dan layanan administrasi warga secara cepat dari rumah.",
    bgImage:
      "https://images.unsplash.com/photo-1521737711867-e3b97375f902?q=80&w=2070&auto=format&fit=crop",
    imageUrl:
      "https://images.unsplash.com/photo-1521737711867-e3b97375f902?q=80&w=2070&auto=format&fit=crop",
    layout: "bottom-left" as const,
    ctaText: "URUS SURAT MANDIRI",
    ctaLink: "/layanan-surat/",
  },
  {
    id: "slide-3",
    number: "03",
    category: "STATISTIK DESA",
    title: "STATISTIK",
    subtitle: "DATA KEPENDUDUKAN, APBDES & PERTANIAN",
    description:
      "Transparansi informasi demografi warga, hamparan lahan pesawahan, dan indeks desa membangun.",
    bgImage:
      "https://images.unsplash.com/photo-1500382017468-9049fed747ef?q=80&w=2070&auto=format&fit=crop",
    imageUrl:
      "https://images.unsplash.com/photo-1500382017468-9049fed747ef?q=80&w=2070&auto=format&fit=crop",
    layout: "mid-left" as const,
    ctaText: "LIHAT DATA DESA",
    ctaLink: "/statistik/",
  },
  {
    id: "slide-4",
    number: "04",
    category: "POTENSI & WISATA DESA",
    title: "POTENSI DESA",
    subtitle: "PETERNAKAN KAMBING SAANEN & AGROWISATA",
    description:
      "Sentra peternakan kambing perah Saanen unggulan, ketahanan pangan, dan wisata edukasi desa.",
    bgImage:
      "https://images.unsplash.com/photo-1524024973431-2ad916746881?q=80&w=2070&auto=format&fit=crop",
    imageUrl:
      "https://images.unsplash.com/photo-1524024973431-2ad916746881?q=80&w=2070&auto=format&fit=crop",
    layout: "bottom-left" as const,
    ctaText: "JELAJAHI POTENSI",
    ctaLink: "/potensi-desa/",
  },
  {
    id: "slide-5",
    number: "05",
    category: "PENGADUAN WARGA",
    title: "PENGADUAN",
    subtitle: "LAYANAN ASPIRASI & KETERBUKAAN INFORMASI",
    description:
      "Sampaikan saran, laporan infrastruktur, atau aspirasi pembangunan Desa Sampeldes secara langsung.",
    bgImage:
      "https://images.unsplash.com/photo-1511497584788-876760111969?q=80&w=2070&auto=format&fit=crop",
    imageUrl:
      "https://images.unsplash.com/photo-1511497584788-876760111969?q=80&w=2070&auto=format&fit=crop",
    layout: "center" as const,
    ctaText: "KIRIM ASPIRASI",
    ctaLink: "/pengaduan/",
  },
];

export function HeroSection() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [clockData, setClockData] = useState({
    hour: "00",
    minute: "00",
    second: 0,
    dayNum: "01",
    dayName: "SEN",
    fullDate: "Memuat waktu...",
  });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Mengambil Logo Resmi & Pengaturan Hero Slider dari Firestore
  const firestore = useFirestore();
  const logoRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, "villageLogo", "default");
  }, [firestore]);

  const sliderRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, "villageProfile", "heroSlider");
  }, [firestore]);

  const { data: logoData } = useDoc<VillageLogoInfo>(logoRef, {
    suppressGlobalError: true,
  });

  const { data: sliderData } = useDoc<HeroSliderInfo>(sliderRef, {
    suppressGlobalError: true,
  });

  const slides = React.useMemo(() => {
    if (sliderData?.slides && Array.isArray(sliderData.slides) && sliderData.slides.length > 0) {
      return sliderData.slides.map((s, idx) => ({
        id: s.id || `slide-${idx + 1}`,
        number: String(idx + 1).padStart(2, "0"),
        category: s.tag || "DESA SAMPELDES",
        tag: s.tag || "DESA SAMPELDES",
        title: s.title || "SAMPELDES",
        subtitle: s.subtitle || "",
        description: s.description || "",
        bgImage: s.imageUrl || s.bgImage || "https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=2070&auto=format&fit=crop",
        imageUrl: s.imageUrl || s.bgImage || "https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=2070&auto=format&fit=crop",
        layout: (s.layout || (idx % 3 === 0 ? "center" : idx % 3 === 1 ? "bottom-left" : "mid-left")) as "center" | "bottom-left" | "mid-left",
        ctaText: s.actionText || "LIHAT SELENGKAPNYA",
        ctaLink: s.actionUrl || "/profil-desa/",
      }));
    }
    return DEFAULT_HERO_SLIDES;
  }, [sliderData]);

  const autoIntervalSec = Number(sliderData?.autoSlideInterval) || 5;
  const safeIndex = currentIndex >= slides.length ? 0 : currentIndex;
  const activeSlide = slides[safeIndex] || slides[0] || DEFAULT_HERO_SLIDES[0];

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      const timeParts = new Intl.DateTimeFormat("id-ID", {
        timeZone: "Asia/Jakarta",
        hour: "2-digit",
        minute: "2-digit",
        second: "numeric",
        hour12: false,
      }).formatToParts(now);

      const hour = timeParts.find((p) => p.type === "hour")?.value || "00";
      const minute = timeParts.find((p) => p.type === "minute")?.value || "00";
      const second = parseInt(timeParts.find((p) => p.type === "second")?.value || "0", 10);

      const dateParts = new Intl.DateTimeFormat("id-ID", {
        timeZone: "Asia/Jakarta",
        day: "numeric",
        weekday: "short",
      }).formatToParts(now);

      const dayNum = dateParts.find((p) => p.type === "day")?.value || "01";
      const rawDay = dateParts.find((p) => p.type === "weekday")?.value || "RAB";
      const dayName = rawDay.replace(/[^a-zA-Z]/g, "").slice(0, 3).toUpperCase();

      const fullDate = new Intl.DateTimeFormat("id-ID", {
        timeZone: "Asia/Jakarta",
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      }).format(now);

      setClockData({
        hour,
        minute,
        second,
        dayNum,
        dayName,
        fullDate,
      });
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleNext = useCallback(() => {
    setDirection(1);
    setCurrentIndex((prev) => (prev + 1) % slides.length);
  }, [slides.length]);

  // Otomatis ganti slide sesuai konfigurasi admin (default 5 detik)
  useEffect(() => {
    const slideTimer = setInterval(() => {
      handleNext();
    }, autoIntervalSec * 1000);

    return () => clearInterval(slideTimer);
  }, [currentIndex, handleNext, autoIntervalSec]);

  const handlePrev = useCallback(() => {
    setDirection(-1);
    setCurrentIndex((prev) => (prev - 1 + slides.length) % slides.length);
  }, [slides.length]);

  const handleRandomSlide = () => {
    if (slides.length <= 1) return;
    let nextIdx = Math.floor(Math.random() * slides.length);
    if (nextIdx === safeIndex) nextIdx = (safeIndex + 1) % slides.length;
    setDirection(nextIdx > safeIndex ? 1 : -1);
    setCurrentIndex(nextIdx);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLElement>) => {
    const x = (e.clientX / window.innerWidth - 0.5) * 2;
    const y = (e.clientY / window.innerHeight - 0.5) * 2;
    setMousePos({ x, y });
  };

  const handleAnchorClick = (e: React.MouseEvent<HTMLAnchorElement>, link: string) => {
    if (link.startsWith("#")) {
      e.preventDefault();
      const targetMap: Record<string, string> = {
        "#profil": "jelajahi-desa",
        "#pelayanan": "layanan-desa",
        "#statistik": "statistik-desa",
        "#potensi": "potensi-desa",
        "#pengaduan": "kontak-warga",
        "#berita": "berita-desa",
        "#surat-mandiri": "layanan-desa",
      };
      const directId = link.substring(1);
      const targetId = targetMap[link] || directId;
      const el = document.getElementById(targetId) || document.getElementById(directId);
      if (el) {
        el.scrollIntoView({ behavior: "smooth" });
      }
    }
  };

  const handleExploreClick = (e: React.MouseEvent) => {
    e.preventDefault();
    const target = document.getElementById("jelajahi-desa");
    if (target) {
      target.scrollIntoView({ behavior: "smooth" });
    } else {
      handleNext();
    }
  };

  const bgVariants = {
    enter: (dir: number) => ({
      y: dir > 0 ? "22%" : "-22%",
      scale: 1.16,
      opacity: 0,
    }),
    center: {
      y: "0%",
      scale: 1.06,
      opacity: 1,
      transition: { duration: 1.15, ease: [0.22, 1, 0.36, 1] as const },
    },
    exit: (dir: number) => ({
      y: dir > 0 ? "-22%" : "22%",
      scale: 1.08,
      opacity: 0,
      transition: { duration: 0.95, ease: [0.22, 1, 0.36, 1] as const },
    }),
  };

  const contentVariants = {
    enter: (dir: number) => ({
      y: dir > 0 ? 90 : -90,
      opacity: 0,
    }),
    center: {
      y: 0,
      opacity: 1,
      transition: { duration: 1.0, delay: 0.12, ease: [0.16, 1, 0.3, 1] as const },
    },
    exit: (dir: number) => ({
      y: dir > 0 ? -90 : 90,
      opacity: 0,
      transition: { duration: 0.65, ease: [0.22, 1, 0.36, 1] as const },
    }),
  };

  const maskStyle: React.CSSProperties = {
    WebkitMaskImage:
      "linear-gradient(to bottom, rgba(0,0,0,1) 55%, rgba(0,0,0,0.65) 82%, rgba(0,0,0,0.1) 100%)",
    maskImage:
      "linear-gradient(to bottom, rgba(0,0,0,1) 55%, rgba(0,0,0,0.65) 82%, rgba(0,0,0,0.1) 100%)",
  };

  return (
    <section
      id="hero-roto-section"
      onMouseMove={handleMouseMove}
      className="relative h-screen w-full overflow-hidden bg-[#070a0c] text-white select-none font-sans snap-section"
    >
      {/* 1. BACKGROUND LAYER */}
      <AnimatePresence initial={false} custom={direction} mode="popLayout">
        <motion.div
          key={`bg-${activeSlide.id}`}
          custom={direction}
          variants={bgVariants}
          initial="enter"
          animate="center"
          exit="exit"
          className="absolute inset-0 z-0"
        >
          <motion.div
            animate={{ x: mousePos.x * -16, y: mousePos.y * -16 }}
            transition={{ type: "spring", stiffness: 55, damping: 25 }}
            className="h-full w-full"
          >
            <img
              src={activeSlide.bgImage}
              alt={activeSlide.title}
              className="h-full w-full object-cover object-center brightness-[0.68] contrast-[1.08]"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/65 via-black/15 to-black/85" />
          </motion.div>
        </motion.div>
      </AnimatePresence>

      {/* 2. DYNAMIC TYPOGRAPHY & CTA LAYER */}
      <div className="relative z-20 flex h-full w-full items-center justify-center px-4 sm:px-10 md:px-28 pt-16 pb-24 sm:pb-16 md:py-0 pointer-events-none">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={`content-${activeSlide.id}`}
            custom={direction}
            variants={contentVariants}
            initial="enter"
            animate="center"
            exit="exit"
            className="w-full max-w-7xl"
          >
            <motion.div
              animate={{ x: mousePos.x * 10, y: mousePos.y * 10 }}
              transition={{ type: "spring", stiffness: 70, damping: 25 }}
            >
              {activeSlide.layout === "center" && (
                <div className="flex flex-col items-center text-center">
                  <span className="mb-2.5 sm:mb-3 rounded-full border border-teal-400/40 bg-black/40 px-3 sm:px-4 py-1 text-[10px] sm:text-[11px] font-bold tracking-[0.25em] sm:tracking-[0.35em] text-teal-300 uppercase backdrop-blur-md">
                    {activeSlide.category} • {activeSlide.subtitle}
                  </span>
                  <h1
                    style={maskStyle}
                    className="text-4xl sm:text-6xl md:text-[8.5vw] font-black uppercase leading-tight sm:leading-none tracking-[0.04em] sm:tracking-[0.06em] text-white drop-shadow-[0_15px_40px_rgba(0,0,0,0.75)] break-words max-w-full"
                  >
                    {activeSlide.title}
                  </h1>
                  <p className="mt-3 sm:mt-4 max-w-xl text-xs md:text-sm text-white/75 leading-relaxed px-2">
                    {activeSlide.description}
                  </p>
                  <div className="mt-5 sm:mt-7 flex w-full max-w-4xl justify-center md:justify-end pointer-events-auto">
                    <Link
                      href={activeSlide.ctaLink}
                      onClick={(e) => handleAnchorClick(e, activeSlide.ctaLink)}
                      className="group flex items-center gap-2.5 sm:gap-3 rounded-xl bg-white px-5 sm:px-6 py-3 sm:py-3.5 text-xs font-extrabold tracking-[0.16em] sm:tracking-[0.2em] text-slate-950 shadow-[0_12px_35px_rgba(0,0,0,0.55)] transition-all duration-300 hover:bg-gradient-to-r hover:from-teal-400 hover:to-emerald-400 active:scale-95"
                    >
                      <span>{activeSlide.ctaText}</span>
                      <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1.5" />
                    </Link>
                  </div>
                </div>
              )}

              {activeSlide.layout === "bottom-left" && (
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 sm:gap-8 pt-12 sm:pt-20">
                  <div className="flex flex-col items-start text-left">
                    <span className="mb-2 text-[10px] sm:text-xs font-bold tracking-[0.25em] sm:tracking-[0.35em] text-teal-400 uppercase">
                      {activeSlide.category} — {activeSlide.subtitle}
                    </span>
                    <h1
                      style={maskStyle}
                      className="text-4xl sm:text-6xl md:text-[8.5vw] font-black uppercase leading-tight sm:leading-none tracking-[0.04em] text-white drop-shadow-[0_15px_40px_rgba(0,0,0,0.75)] break-words max-w-full"
                    >
                      {activeSlide.title}
                    </h1>
                    <p className="mt-3 max-w-lg text-xs md:text-sm text-white/75 leading-relaxed">
                      {activeSlide.description}
                    </p>
                  </div>
                  <div className="pointer-events-auto md:mb-6">
                    <Link
                      href={activeSlide.ctaLink}
                      onClick={(e) => handleAnchorClick(e, activeSlide.ctaLink)}
                      className="group inline-flex items-center gap-2.5 sm:gap-3 rounded-xl bg-white px-5 sm:px-6 py-3 sm:py-3.5 text-xs font-extrabold tracking-[0.16em] sm:tracking-[0.2em] text-slate-950 shadow-[0_12px_35px_rgba(0,0,0,0.55)] transition-all duration-300 hover:bg-gradient-to-r hover:from-teal-400 hover:to-emerald-400 active:scale-95"
                    >
                      <span>{activeSlide.ctaText}</span>
                      <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1.5" />
                    </Link>
                  </div>
                </div>
              )}

              {activeSlide.layout === "mid-left" && (
                <div className="flex flex-col items-start text-left max-w-4xl">
                  <span className="mb-2 text-[10px] sm:text-xs font-bold tracking-[0.25em] sm:tracking-[0.35em] text-teal-400 uppercase">
                    {activeSlide.category} • {activeSlide.subtitle}
                  </span>
                  <h1
                    style={maskStyle}
                    className="text-4xl sm:text-6xl md:text-[8.5vw] font-black uppercase leading-tight sm:leading-none tracking-[0.04em] sm:tracking-[0.05em] text-white drop-shadow-[0_15px_40px_rgba(0,0,0,0.75)] break-words max-w-full"
                  >
                    {activeSlide.title}
                  </h1>
                  <p className="mt-3 sm:mt-4 max-w-lg text-xs md:text-sm text-white/75 leading-relaxed">
                    {activeSlide.description}
                  </p>
                  <div className="mt-5 sm:mt-7 pointer-events-auto">
                    <Link
                      href={activeSlide.ctaLink}
                      onClick={(e) => handleAnchorClick(e, activeSlide.ctaLink)}
                      className="group inline-flex items-center gap-2.5 sm:gap-3 rounded-xl bg-white px-5 sm:px-6 py-3 sm:py-3.5 text-xs font-extrabold tracking-[0.16em] sm:tracking-[0.2em] text-slate-950 shadow-[0_12px_35px_rgba(0,0,0,0.55)] transition-all duration-300 hover:bg-gradient-to-r hover:from-teal-400 hover:to-emerald-400 active:scale-95"
                    >
                      <span>{activeSlide.ctaText}</span>
                      <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1.5" />
                    </Link>
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* 3. HEADER (SESUAI SISTEM RESMI APLIKASI DESA SAMPELDES) */}
      <header className="absolute inset-x-0 top-0 z-40 flex items-center justify-between px-3.5 sm:px-8 md:px-12 py-3 sm:py-5">
        {/* Brand / Logo (Kiri) */}
        <Link href="/" className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1 sm:flex-initial group mr-2">
          {logoData?.logoImageUrl ? (
            <div className="relative flex h-9 w-9 sm:h-11 sm:w-11 items-center justify-center rounded-xl overflow-hidden p-1 bg-white/10 border border-white/20 shadow-md backdrop-blur-md shrink-0">
              <Image
                src={logoData.logoImageUrl}
                alt="Logo Desa Sampeldes"
                width={44}
                height={44}
                className="h-full w-full object-contain"
                priority
              />
            </div>
          ) : (
            <div className="flex h-9 w-9 sm:h-11 sm:w-11 items-center justify-center rounded-xl bg-teal-500/20 border border-teal-400/50 text-teal-300 backdrop-blur-md shrink-0">
              <Globe2 className="h-5 w-5" />
            </div>
          )}
          <div className="flex flex-col text-left min-w-0">
            <h2 className="text-xs sm:text-base font-extrabold tracking-[0.12em] sm:tracking-[0.16em] text-white uppercase leading-none truncate">
              DESA SAMPELDES
            </h2>
            <p className="text-[8px] sm:text-[10px] tracking-[0.18em] sm:tracking-[0.22em] text-teal-400 uppercase font-bold mt-1 truncate">
              GANDRUNGMANGU • CILACAP
            </p>
          </div>
        </Link>

        {/* Center Nav Items (Sesuai Sistem: HOME, PELAYANAN, PROFIL, STATISTIK, TATA KELOLA DESA, BERITA, LAINNYA) */}
        <nav className="hidden lg:flex items-center gap-4 xl:gap-6 text-[11px] xl:text-xs font-bold tracking-[0.1em] text-white/85">
          {primaryNavItems.map((item) => {
            const isActive = item.isHome;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`py-1.5 transition-colors uppercase relative whitespace-nowrap ${
                  isActive
                    ? "text-white border-b-2 border-teal-400 drop-shadow"
                    : "hover:text-teal-300"
                }`}
              >
                {item.label}
              </Link>
            );
          })}

          {/* Dropdown LAINNYA */}
          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-1 py-1.5 transition-colors uppercase outline-none cursor-pointer hover:text-teal-300 whitespace-nowrap">
              <span>LAINNYA</span>
              <ChevronDown className="h-3.5 w-3.5 transition-transform duration-200" />
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="mt-2 w-60 rounded-2xl p-2.5 border border-white/20 bg-[#081d27]/95 backdrop-blur-2xl text-white shadow-2xl z-50"
            >
              {moreLinks.map((link) => (
                <DropdownMenuItem
                  key={link.href}
                  asChild
                  className="rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-100 hover:text-teal-300 hover:bg-white/10 focus:bg-white/10 focus:text-teal-300 transition-colors cursor-pointer"
                >
                  <Link href={link.href}>{link.label}</Link>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </nav>

        {/* Right Action Icons (Sesuai Sistem: Search, User/Login, NightModeSwitch, Surat Mandiri) */}
        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
          <Link
            href="/#pbb-section"
            aria-label="Cari Pajak PBB"
            title="Cek Pajak PBB-P2 Online"
            className="hidden sm:flex p-2 text-white/85 hover:text-teal-300 hover:bg-white/10 rounded-full transition cursor-pointer"
          >
            <Search className="h-4 w-4" />
          </Link>

          <Link
            href="/login/"
            aria-label="Portal Admin / Akun"
            title="Portal Pamong Desa"
            className="p-2 text-white/90 hover:text-teal-300 hover:bg-white/10 rounded-xl transition cursor-pointer"
          >
            <User className="h-4 w-4" />
          </Link>

          {/* NightModeSwitch Resmi Sistem */}
          <div className="flex items-center">
            <NightModeSwitch size="sm" />
          </div>

          <Link
            href="/layanan-surat/"
            className="hidden sm:inline-flex rounded-full bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 px-5 py-2 text-[11px] font-black tracking-[0.14em] text-slate-950 shadow-[0_0_20px_rgba(20,184,166,0.35)] transition hover:scale-105 active:scale-95 whitespace-nowrap cursor-pointer"
          >
            SURAT MANDIRI
          </Link>

          {/* Mobile Burger Menu Button & Sheet Drawer */}
          <div className="lg:hidden flex items-center">
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <button
                  type="button"
                  aria-label="Buka Menu"
                  className="p-2 text-white bg-teal-600/90 hover:bg-teal-500 active:scale-95 rounded-xl border border-teal-400/40 shadow-md shadow-teal-950/40 cursor-pointer shrink-0"
                >
                  <Menu className="h-5 w-5" />
                </button>
              </SheetTrigger>
              <SheetContent
                side="right"
                className="w-[300px] sm:w-[360px] bg-[#081d27] text-white border-l border-white/10 p-6 flex flex-col justify-between z-50 overflow-y-auto"
              >
                <div>
                  <SheetHeader className="text-left mb-6">
                    <SheetTitle className="text-base font-extrabold tracking-wider text-white uppercase">
                      DESA SAMPELDES
                    </SheetTitle>
                    <SheetDescription className="text-xs text-teal-400 tracking-widest uppercase font-bold">
                      Menu Navigasi Portal
                    </SheetDescription>
                  </SheetHeader>

                  <div className="space-y-1">
                    {primaryNavItems.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className="block px-3 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider text-white/90 hover:text-teal-300 hover:bg-white/5 transition-colors"
                      >
                        {item.label}
                      </Link>
                    ))}
                  </div>

                  <div className="mt-5 pt-4 border-t border-white/10">
                    <p className="text-[10px] font-bold text-teal-400 uppercase tracking-widest px-3 mb-2">
                      LAYANAN LAINNYA
                    </p>
                    <div className="space-y-0.5 max-h-[220px] overflow-y-auto pr-1">
                      {moreLinks.map((link) => (
                        <Link
                          key={link.href}
                          href={link.href}
                          onClick={() => setMobileMenuOpen(false)}
                          className="block px-3 py-2 rounded-lg text-xs font-medium text-slate-300 hover:text-white hover:bg-white/5 transition-colors"
                        >
                          {link.label}
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-white/10 flex flex-col gap-3">
                  <Link
                    href="/layanan-surat/"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 text-slate-950 font-black text-xs uppercase tracking-wider text-center shadow-md shadow-teal-500/20"
                  >
                    Urus Surat Mandiri
                  </Link>
                  <Link
                    href="/login/"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full py-2.5 rounded-xl bg-white/10 text-white font-bold text-xs uppercase tracking-wider text-center border border-white/15 hover:bg-white/20"
                  >
                    Portal Pamong
                  </Link>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      {/* 4. LEFT SIDEBAR CONTROLS (PERSIS VIDEO, DISEMBUNYIKAN DI MOBILE AGAR TIDAK MENABRAK TEKS) */}
      <div className="absolute left-6 md:left-12 top-28 bottom-28 z-30 hidden md:flex flex-col items-center justify-between pointer-events-auto">
        <div className="flex items-baseline gap-1 font-mono">
          <div className="relative h-8 w-8 overflow-hidden">
            <AnimatePresence mode="popLayout" custom={direction}>
              <motion.span
                key={activeSlide.number}
                custom={direction}
                initial={{ y: direction > 0 ? 28 : -28, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: direction > 0 ? -28 : 28, opacity: 0 }}
                transition={{ duration: 0.4, ease: "circOut" }}
                className="absolute inset-0 text-xl md:text-2xl font-extrabold text-white"
              >
                {activeSlide.number}
              </motion.span>
            </AnimatePresence>
          </div>
          <span className="text-[11px] text-white/50">
            / {String(slides.length).padStart(2, "0")}
          </span>
        </div>

        <div className="my-auto flex flex-col items-center gap-3">
          <button
            onClick={handlePrev}
            aria-label="Slide Sebelumnya"
            className="rounded-full border border-white/15 bg-black/30 p-1.5 text-white/75 backdrop-blur-sm transition hover:border-teal-400 hover:text-teal-300 cursor-pointer"
          >
            <ChevronUp className="h-3.5 w-3.5" />
          </button>

          <div className="relative h-36 md:h-44 w-[1.5px] bg-white/15 overflow-hidden rounded-full">
            <motion.div
              className="w-full bg-gradient-to-b from-teal-400 to-emerald-400"
              animate={{
                height: `${((safeIndex + 1) / slides.length) * 100}%`,
              }}
              transition={{ duration: 0.5, ease: "easeInOut" }}
            />
          </div>

          <button
            onClick={handleNext}
            aria-label="Slide Selanjutnya"
            className="rounded-full border border-white/15 bg-black/30 p-1.5 text-white/75 backdrop-blur-sm transition hover:border-teal-400 hover:text-teal-300 cursor-pointer"
          >
            <ChevronDown className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* 5. FOOTER / KONTROL BAWAH (RESPONSIF MOBILE DENGAN JARAK AMAN) */}
      <div className="absolute inset-x-0 bottom-0 z-30 flex items-end justify-between px-4 sm:px-8 md:px-12 py-4 sm:py-6 pointer-events-auto">
        <Link
          href="/pengaduan/"
          className="flex items-center gap-2 rounded-full border border-white/20 bg-black/60 px-3.5 sm:px-5 py-2 sm:py-2.5 text-[11px] sm:text-xs font-bold tracking-[0.12em] sm:tracking-[0.16em] text-white backdrop-blur-md transition hover:border-teal-400 hover:bg-black/80 active:scale-95 cursor-pointer shadow-lg"
        >
          <MessageSquare className="h-3.5 w-3.5 text-teal-400 shrink-0" />
          <span className="hidden sm:inline">AJUKAN </span>
          <span>PENGADUAN</span>
        </Link>

        <button
          onClick={handleExploreClick}
          className="hidden sm:flex flex-col items-center gap-1.5 group cursor-pointer"
        >
          <Mouse className="h-4 w-4 text-white/60 animate-bounce group-hover:text-teal-300" />
          <span className="text-[10px] font-semibold tracking-[0.32em] text-white/80 uppercase">
            JELAJAHI DESA KAMI
          </span>
          <div className="h-0.5 w-12 bg-gradient-to-r from-transparent via-teal-400 to-transparent" />
        </button>

        <div className="flex flex-col items-end gap-2.5 sm:gap-3.5">
          {/* Circular Minimalist Clock (Hanya ditampilkan pada sm+ agar tidak menutupi UI Mobile) */}
          <div
            title={`${clockData.fullDate} • Pukul ${clockData.hour}.${clockData.minute} WIB`}
            className="hidden sm:flex group relative items-center justify-center select-none cursor-default transition-all duration-300 hover:scale-105"
          >
            {/* SVG Arc Ring Outside */}
            <div className="relative w-28 h-28 sm:w-32 sm:h-32 flex items-center justify-center">
              <svg
                viewBox="0 0 100 100"
                className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none"
              >
                {/* Subtle base circular track */}
                <circle
                  cx="50"
                  cy="50"
                  r="46"
                  fill="none"
                  stroke="rgba(255, 255, 255, 0.12)"
                  strokeWidth="2.5"
                />
                {/* Active progress arc indicator (tracing seconds) */}
                <circle
                  cx="50"
                  cy="50"
                  r="46"
                  fill="none"
                  stroke="rgba(255, 255, 255, 0.95)"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeDasharray="289.03"
                  strokeDashoffset={289.03 - (289.03 * (clockData.second || 1)) / 60}
                  className="transition-all duration-500 ease-linear"
                  style={{
                    filter: "drop-shadow(0 0 5px rgba(255, 255, 255, 0.8))",
                  }}
                />
              </svg>

              {/* Inner Dial (Dark Glass Circle) */}
              <div className="w-[82%] h-[82%] rounded-full bg-gradient-to-br from-[#0c141d]/85 via-[#08131d]/80 to-[#04080d]/90 backdrop-blur-xl border border-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.6)] flex items-center justify-center relative overflow-hidden">
                {/* Thin center vertical line divider */}
                <div className="absolute top-[22%] bottom-[22%] left-1/2 -translate-x-1/2 w-[1px] bg-white/35" />

                {/* Content grid */}
                <div className="grid grid-cols-2 w-full h-full text-white">
                  {/* Left Column: Hour (Top), Date of Month (Bottom) */}
                  <div className="flex flex-col items-center justify-center pr-2 sm:pr-2.5">
                    <span className="font-sans font-light text-xl sm:text-2xl tracking-tight text-white leading-none">
                      {clockData.hour}
                    </span>
                    <span className="font-sans text-[10px] sm:text-[11px] font-normal text-white/70 tracking-wider leading-none mt-1 sm:mt-1.5">
                      {clockData.dayNum}
                    </span>
                  </div>

                  {/* Right Column: Minute (Top), Day in Indonesian (Bottom) */}
                  <div className="flex flex-col items-center justify-center pl-2 sm:pl-2.5">
                    <span className="font-sans font-light text-xl sm:text-2xl tracking-tight text-white leading-none">
                      {clockData.minute}
                    </span>
                    <span className="font-sans text-[10px] sm:text-[11px] font-bold text-teal-300 tracking-wider leading-none mt-1 sm:mt-1.5 uppercase">
                      {clockData.dayName}
                    </span>
                  </div>
                </div>

                {/* Subtle WIB indicator badge */}
                <div className="absolute top-1.5 left-1/2 -translate-x-1/2 text-[7.5px] font-bold tracking-widest text-teal-400/80 uppercase">
                  WIB
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <span className="hidden sm:inline text-xs font-semibold tracking-[0.2em] text-white/85 uppercase">
              ACAK DESTINASI
            </span>
            <button
              onClick={handleRandomSlide}
              aria-label="Acak Slide"
              title="Ganti Slide Acak"
              className="group flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-gradient-to-r from-teal-400 to-emerald-400 text-slate-950 shadow-[0_0_15px_rgba(20,184,166,0.35)] transition hover:scale-105 active:scale-95 cursor-pointer"
            >
              <RotateCw className="h-3.5 w-3.5 sm:h-4 sm:w-4 transition-transform duration-500 group-hover:rotate-180" />
            </button>
          </div>
        </div>
      </div>

      {/* 6. INDIKATOR PROGRESS OTOMATIS GANTI SLIDE */}
      <div className="absolute inset-x-0 bottom-0 z-40 h-[2.5px] bg-white/10 overflow-hidden pointer-events-none">
        <motion.div
          key={`${safeIndex}-${autoIntervalSec}`}
          initial={{ width: "0%" }}
          animate={{ width: "100%" }}
          transition={{ duration: autoIntervalSec, ease: "linear" }}
          className="h-full bg-gradient-to-r from-teal-400 via-emerald-400 to-teal-300 shadow-[0_0_10px_rgba(45,212,191,0.7)]"
        />
      </div>
    </section>
  );
}

export default HeroSection;
