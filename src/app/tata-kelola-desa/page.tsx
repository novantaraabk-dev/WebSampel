'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { Header } from '@/components/landing/Header';
import { Footer } from '@/components/landing/Footer';
import { BackgroundPattern } from '@/components/landing/BackgroundPattern';
import { Button } from '@/components/ui/button';
import {
  BarChart3,
  TrendingUp,
  FileText,
  ChevronRight,
  Search,
  Coins,
  Layers,
  ShieldCheck,
  Download,
  ExternalLink,
  ArrowUpRight,
  SlidersHorizontal,
  Calendar,
  Activity,
  Network,
  Users,
  UserCircle2,
  Landmark,
  Crown,
  HeartHandshake,
  MapPin,
  Briefcase,
  BookOpen,
  Check,
  ChevronDown,
  ChevronUp,
  Info,
  Printer,
  Sparkles,
  HardHat
} from 'lucide-react';
import { TransparansiPembangunanPublicTab } from './_components/transparansi-pembangunan-public-tab';
import { AsetDesaPublicTab } from './_components/aset-desa-public-tab';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { ApbdesData, RealisasiApbdesData, ProdukHukumDesa } from '@/lib/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Logo } from '@/components/logo';

type Official = {
  id?: string;
  name: string;
  position: string;
  imageUrl?: string;
  category: 'perangkat' | 'bpd' | 'rtrw' | 'linmas' | 'posyandu';
};

// ─────────────────────────────────────────────────────────────────────────────
// 3D Isometric Bar Chart Component
// ─────────────────────────────────────────────────────────────────────────────

// Helper to format currency safely without throwing errors on undefined/null/NaN
const formatRupiah = (val: any): string => {
  if (val === undefined || val === null || val === '') return '0';
  const num = Number(val);
  if (isNaN(num)) return '0';
  return num.toLocaleString('id-ID');
};

// Compact formatter for charts (e.g., Rp 1.33 M, Rp 256.6 jt)
const formatCompactRupiah = (val: number): string => {
  if (!val || isNaN(val)) return 'Rp 0';
  if (val >= 1e9) {
    return `Rp ${(val / 1e9).toFixed(2).replace(/\.00$/, '')} M`;
  }
  if (val >= 1e6) {
    return `Rp ${(val / 1e6).toFixed(1).replace(/\.0$/, '')} jt`;
  }
  if (val >= 1e3) {
    return `Rp ${(val / 1e3).toFixed(0)} rb`;
  }
  return `Rp ${val.toLocaleString('id-ID')}`;
};

interface IsometricBarProps {
  label: string;
  value: number;
  percentage: number;         // 0–100
  colorTop: string;           // CSS color top face
  colorFront: string;         // CSS color front face
  colorSide: string;          // CSS color side face
  maxHeightPx?: number;
  delay?: number;
  formatter?: (v: number) => string;
}

function IsometricBar({
  label,
  value,
  percentage,
  colorTop,
  colorFront,
  colorSide,
  maxHeightPx = 220,
  delay = 0,
  formatter,
}: IsometricBarProps) {
  const barH = Math.max(12, (percentage / 100) * maxHeightPx);
  const W = 64;   // bar width
  const D = 20;   // depth offset (isometric top)
  const pedestalH = 28;

  const formattedValue = formatter ? formatter(value) : formatRupiah(value);

  return (
    <div className="flex flex-col items-center gap-2.5" style={{ minWidth: 96 }}>
      {/* Label atas */}
      <div className="text-center min-h-[32px] flex items-center justify-center">
        <span className="text-[10px] font-condensed font-bold uppercase tracking-wider text-slate-700 leading-tight block max-w-[96px] text-center">
          {label.length > 22 ? label.substring(0, 22) + '…' : label}
        </span>
      </div>

      {/* SVG 3D bar */}
      <div
        className="relative"
        style={{
          width: W + D,
          height: maxHeightPx + D + pedestalH + 8,
          display: 'flex',
          alignItems: 'flex-end',
        }}
      >
        <svg
          width={W + D}
          height={maxHeightPx + D + pedestalH + 8}
          viewBox={`0 0 ${W + D} ${maxHeightPx + D + pedestalH + 8}`}
          style={{ overflow: 'visible' }}
        >
          {/* ── PEDESTAL (Neumorphic base) ── */}
          {/* Pedestal front face */}
          <polygon
            points={`
              0,${maxHeightPx + D}
              ${W},${maxHeightPx + D}
              ${W},${maxHeightPx + D + pedestalH}
              0,${maxHeightPx + D + pedestalH}
            `}
            fill="rgba(248, 250, 252, 0.8)"
            stroke="#d4cebe"
            strokeWidth="1"
          />
          {/* Pedestal side face */}
          <polygon
            points={`
              ${W},${maxHeightPx + D}
              ${W + D},${maxHeightPx}
              ${W + D},${maxHeightPx + pedestalH}
              ${W},${maxHeightPx + D + pedestalH}
            `}
            fill="#ded8cd"
            stroke="#d4cebe"
            strokeWidth="1"
          />
          {/* Pedestal top face */}
          <polygon
            points={`
              ${D / 2},${maxHeightPx + D - D / 2}
              ${W + D / 2},${maxHeightPx + D - D / 2}
              ${W + D},${maxHeightPx}
              ${D},${maxHeightPx}
            `}
            fill="#f7f3ec"
            stroke="#d4cebe"
            strokeWidth="1"
          />

          {/* ── COLORED BAR ── */}
          {(() => {
            const barY = maxHeightPx + D - barH; // top-left of bar front face

            return (
              <g
                style={{
                  transform: `translateY(${barH}px) scaleY(0)`,
                  transformOrigin: `0 ${maxHeightPx + D}px`,
                  animation: `isoBarGrow 0.7s cubic-bezier(.22,1,.36,1) ${delay}ms forwards`,
                }}
              >
                {/* Front face */}
                <polygon
                  points={`
                    0,${barY}
                    ${W},${barY}
                    ${W},${maxHeightPx + D}
                    0,${maxHeightPx + D}
                  `}
                  fill={colorFront}
                />
                {/* Side face */}
                <polygon
                  points={`
                    ${W},${barY}
                    ${W + D},${barY - D}
                    ${W + D},${maxHeightPx}
                    ${W},${maxHeightPx + D}
                  `}
                  fill={colorSide}
                />
                {/* Top face */}
                <polygon
                  points={`
                    ${D / 2},${barY - D / 2}
                    ${W + D / 2},${barY - D / 2}
                    ${W + D},${barY - D}
                    ${D},${barY - D}
                  `}
                  fill={colorTop}
                />

                {/* Percentage label on front face — show only if bar is tall enough */}
                {barH > 44 && (
                  <text
                    x={W / 2}
                    y={barY + barH / 2 + 5}
                    textAnchor="middle"
                    fill="white"
                    fontSize="12"
                    fontWeight="900"
                    fontFamily="sans-serif"
                  >
                    {percentage.toFixed(0)}%
                  </text>
                )}
              </g>
            );
          })()}
        </svg>
      </div>

      {/* Value label bawah */}
      <div className="text-center space-y-0.5">
        <div
          className="text-xs sm:text-sm font-black tabular-nums font-mono"
          style={{ color: colorFront }}
        >
          {formattedValue}
        </div>
        <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest font-condensed">
          Alokasi
        </div>
      </div>
    </div>
  );
}

// Warna palet per index
const ISO_PALETTES = [
  { top: '#34d399', front: '#059669', side: '#047857' },     // emerald
  { top: '#60a5fa', front: '#2563eb', side: '#1d4ed8' },     // blue
  { top: '#a78bfa', front: '#7c3aed', side: '#6d28d9' },     // violet
  { top: '#f9a8d4', front: '#db2777', side: '#be185d' },     // pink
  { top: '#e6ee9c', front: '#84cc16', side: '#65a30d' },     // lime-citron
  { top: '#5eead4', front: '#0d9488', side: '#0f766e' },     // teal
  { top: '#fb923c', front: '#ea580c', side: '#c2410c' },     // orange
  { top: '#facc15', front: '#ca8a04', side: '#a16207' },     // amber
];

interface IsometricChartProps {
  data: { name: string; nominal: number }[];
  title: string;
  subtitle: string;
  emptyText?: string;
}

function IsometricChart({ data, title, subtitle, emptyText }: IsometricChartProps) {
  const maxNominal = Math.max(...data.map(d => d.nominal), 1);

  return (
    <div className="neu-card-elevated rounded-[28px] border border-white/80 p-4 sm:p-6 space-y-4 shadow-sm">
      <div className="pb-2 border-b border-black/5">
        <h4 className="text-sm min-[380px]:text-base sm:text-lg font-condensed font-bold text-slate-900 uppercase tracking-tight">
          {title}
        </h4>
        <p className="text-[11px] sm:text-xs text-slate-600 font-medium leading-relaxed">
          {subtitle}
        </p>
      </div>

      {data.length === 0 ? (
        <div className="neu-inset rounded-2xl py-10 sm:py-14 text-center text-slate-500 font-bold text-xs sm:text-sm">
          {emptyText || 'Data kosong'}
        </div>
      ) : (
        <>
          {/* CSS animation keyframe injected once */}
          <style>{`
            @keyframes isoBarGrow {
              from { transform: scaleY(0); }
              to   { transform: scaleY(1); }
            }
          `}</style>

          {/* Scrollable bar area */}
          <div className="overflow-x-auto pb-3 -mx-1 sm:mx-0">
            <div
              className="flex gap-4 sm:gap-6 items-end justify-start min-w-max px-2 sm:px-4 pt-2 sm:pt-4"
              style={{ minHeight: 310 }}
            >
              {data.map((item, i) => {
                const pct = (item.nominal / maxNominal) * 100;
                const palette = ISO_PALETTES[i % ISO_PALETTES.length];
                return (
                  <IsometricBar
                    key={`bar-${item.name}-${i}`}
                    label={item.name}
                    value={item.nominal}
                    percentage={pct}
                    colorTop={palette.top}
                    colorFront={palette.front}
                    colorSide={palette.side}
                    maxHeightPx={190}
                    delay={i * 80}
                    formatter={(v) => formatCompactRupiah(v)}
                  />
                );
              })}
            </div>
          </div>

          {/* Legend / total */}
          <div className="flex flex-wrap gap-2 pt-3 border-t border-black/5">
            {data.map((item, i) => {
              const palette = ISO_PALETTES[i % ISO_PALETTES.length];
              return (
                <div
                  key={`legend-${item.name}-${i}`}
                  className="neu-inset rounded-xl px-2.5 py-1.5 flex items-center gap-2 text-[10px] sm:text-xs font-bold text-slate-700"
                >
                  <span
                    className="w-2.5 h-2.5 rounded-sm shrink-0"
                    style={{ backgroundColor: palette.front }}
                  />
                  <span className="truncate max-w-[130px] sm:max-w-[170px]">{item.name}</span>
                  <span className="font-mono text-slate-500 font-normal">
                    Rp {formatRupiah(item.nominal)}
                  </span>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Konfigurasi 7 Sub-Tab Produk Hukum Desa
// ─────────────────────────────────────────────────────────────────────────────

const PRODUK_HUKUM_SUB_TABS = [
  { id: 'all', tabNum: '', label: 'Semua Dokumen', shortLabel: 'Semua', desc: 'Seluruh arsip regulasi & produk hukum desa' },
  { id: 'rpjmdes', tabNum: '1', label: 'RPJMDes', shortLabel: 'RPJMDes', desc: 'Rencana Pembangunan Jangka Menengah Desa' },
  { id: 'rkpdes', tabNum: '2', label: 'RKPDes', shortLabel: 'RKPDes', desc: 'Rencana Kerja Pembangunan Desa' },
  { id: 'perdes', tabNum: '3', label: 'Peraturan Desa (Perdes)', shortLabel: 'Perdes', desc: 'Peraturan Desa' },
  { id: 'perkades', tabNum: '4', label: 'Perkades', shortLabel: 'Perkades', desc: 'Peraturan Kepala Desa' },
  { id: 'sk_desa', tabNum: '5', label: 'Keputusan Kepala Desa', shortLabel: 'Keputusan Kades', desc: 'Surat Keputusan Kepala Desa' },
  { id: 'lkpd', tabNum: '6', label: 'LKPD', shortLabel: 'LKPD', desc: 'Laporan Keuangan Pemerintah Desa' },
  { id: 'lppd', tabNum: '7', label: 'LPPD', shortLabel: 'LPPD', desc: 'Laporan Penyelenggaraan Pemerintahan Desa' },
];

const normalizeJenisProduk = (jenis: string) => {
  const j = (jenis || '').toLowerCase().trim();
  if (j === 'rpjmdes' || j.includes('rpjm')) return 'rpjmdes';
  if (j === 'rkpdes' || j.includes('rkp')) return 'rkpdes';
  if (j === 'perdes' || j.includes('peraturan desa')) return 'perdes';
  if (j === 'perkades' || j.includes('peraturan kepala')) return 'perkades';
  if (j === 'sk_desa' || j === 'sk' || j.includes('keputusan')) return 'sk_desa';
  if (j === 'lkpd' || j.includes('lkpd') || j.includes('lkpj')) return 'lkpd';
  if (j === 'lppd' || j.includes('lppd')) return 'lppd';
  return j;
};

const getProdukLabel = (jenis: string) => {
  const norm = normalizeJenisProduk(jenis);
  const found = PRODUK_HUKUM_SUB_TABS.find(t => t.id === norm);
  return found ? found.label : (jenis || '').toUpperCase();
};

// ─────────────────────────────────────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────────────────────────────────────

export default function TataKelolaDesa() {
  const [activeTab, setActiveTab] = useState('apbdes');
  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [searchRealisasi, setSearchRealisasi] = useState('');
  const [activeProdukSubTab, setActiveProdukSubTab] = useState<string>('all');
  const [searchProduk, setSearchProduk] = useState<string>('');
  const firestore = useFirestore();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tab = params.get('tab');
      if (tab && ['apbdes', 'realisasi', 'produk', 'struktur', 'pembangunan', 'aset'].includes(tab)) {
        setActiveTab(tab);
      }
    }
  }, []);

  const apbdesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'apbdes'), orderBy('tahun', 'desc'));
  }, [firestore]);

  const realisasiQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'realisasiApbdes'), orderBy('tahun', 'desc'));
  }, [firestore]);

  const produkHukumQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'produkHukumDesa'), orderBy('tahun', 'desc'));
  }, [firestore]);

  const { data: allApbdes, isLoading: isLoadingApbdes } = useCollection<ApbdesData>(apbdesQuery);
  const { data: allRealisasi, isLoading: isLoadingRealisasi } = useCollection<RealisasiApbdesData>(realisasiQuery);
  const { data: allProdukHukum, isLoading: isLoadingProduk } = useCollection<ProdukHukumDesa>(produkHukumQuery);

  // Robustly extract unique numeric years to prevent any duplicate key errors
  const availableYears = useMemo(() => {
    const yearSet = new Set<number>();
    const currentYear = new Date().getFullYear();
    yearSet.add(Number(currentYear));

    const addValidYear = (val: any) => {
      if (val !== undefined && val !== null) {
        const num = Number(val);
        if (!isNaN(num) && num > 1900 && num < 2100) {
          yearSet.add(num);
        }
      }
    };

    allApbdes?.forEach(d => addValidYear(d.tahun));
    allRealisasi?.forEach(d => addValidYear(d.tahun));
    allProdukHukum?.forEach(d => addValidYear(d.tahun));

    return Array.from(yearSet).sort((a, b) => b - a);
  }, [allApbdes, allRealisasi, allProdukHukum]);

  // Otomatis sinkronisasi ke tahun yang valid jika tahun saat ini belum ada data
  useEffect(() => {
    if (availableYears.length > 0 && !availableYears.includes(selectedYear)) {
      setSelectedYear(availableYears[0]);
    }
  }, [availableYears, selectedYear]);

  // Map untuk konversi bidang jika data diisi dalam kode angka
  const BIDANG_NUM_MAP: Record<number, string> = {
    1: 'Penyelenggaraan Pemerintahan Desa',
    2: 'Pelaksanaan Pembangunan Desa',
    3: 'Pembinaan Kemasyarakatan',
    4: 'Pemberdayaan Masyarakat',
    5: 'Penanggulangan Bencana, Darurat dan Mendesak Desa',
  };

  const currentApbdes = useMemo(() => {
    if (!allApbdes || allApbdes.length === 0) return null;

    // 1. Prioritas utama: Dokumen induk yang menyimpan array `items` lengkap (format /admin/tata-kelola-desa)
    const docWithItems = allApbdes.find(
      d => Number(d.tahun) === Number(selectedYear) && Array.isArray(d.items) && d.items.length > 0
    );
    if (docWithItems) return docWithItems;

    // 2. Dokumen dengan items kosong jika memang belum ada rincian
    const anyDocWithItems = allApbdes.find(
      d => Number(d.tahun) === Number(selectedYear) && Array.isArray(d.items)
    );
    if (anyDocWithItems) return anyDocWithItems;

    // 3. Fallback: Jika data APBDes tersimpan sebagai dokumen individual per-kegiatan di koleksi apbdes
    const yearDocs = allApbdes.filter(d => Number(d.tahun) === Number(selectedYear));
    if (yearDocs.length > 0) {
      // Prioritaskan APBDes Perubahan jika tersedia, atau APBDes murni jika belum ada perubahan
      const hasPerubahan = yearDocs.some((d: any) => d.tipe === 'APBDes Perubahan');
      const targetDocs = hasPerubahan
        ? yearDocs.filter((d: any) => d.tipe === 'APBDes Perubahan')
        : yearDocs.filter((d: any) => !d.tipe || d.tipe === 'APBDes');

      const aggregatedItems = targetDocs.map(d => {
        const anyDoc = d as any;
        let b = anyDoc.bidang || 'Umum';
        if (typeof b === 'number' || (!isNaN(Number(b)) && Number(b) in BIDANG_NUM_MAP)) {
          b = BIDANG_NUM_MAP[Number(b)] || `Bidang ${b}`;
        }
        return {
          bidang: String(b),
          kodeRekening: anyDoc.kode || anyDoc.kodeRekening || '',
          kegiatan: anyDoc.uraian || anyDoc.kegiatan || '',
          volume: anyDoc.volume || anyDoc.satuan || '1',
          nominal: Number(anyDoc.nominal) || 0,
          sumberAnggaran: anyDoc.sumber || anyDoc.sumberAnggaran || 'APBDes',
        };
      });

      const total = aggregatedItems.reduce((sum, it) => sum + it.nominal, 0);
      return {
        id: `aggregated-apbdes-${selectedYear}`,
        tahun: Number(selectedYear),
        totalAnggaran: total,
        items: aggregatedItems,
      } as ApbdesData;
    }

    return null;
  }, [allApbdes, selectedYear]);

  const currentRealisasi = useMemo(() => {
    if (!allRealisasi || allRealisasi.length === 0) return null;

    // 1. Prioritas utama: Dokumen induk realisasi yang menyimpan array `items` lengkap
    const docWithItems = allRealisasi.find(
      d => Number(d.tahun) === Number(selectedYear) && Array.isArray(d.items) && d.items.length > 0
    );
    if (docWithItems) return docWithItems;

    const anyDocWithItems = allRealisasi.find(
      d => Number(d.tahun) === Number(selectedYear) && Array.isArray(d.items)
    );
    if (anyDocWithItems) return anyDocWithItems;

    // 2. Fallback jika data tersimpan sebagai baris individual
    const yearDocs = allRealisasi.filter(d => Number(d.tahun) === Number(selectedYear));
    if (yearDocs.length > 0) {
      const aggregatedItems = yearDocs.map(d => {
        const anyDoc = d as any;
        let b = anyDoc.bidang || 'Umum';
        if (typeof b === 'number' || (!isNaN(Number(b)) && Number(b) in BIDANG_NUM_MAP)) {
          b = BIDANG_NUM_MAP[Number(b)] || `Bidang ${b}`;
        }
        return {
          bidang: String(b),
          kodeRekening: anyDoc.kode || anyDoc.kodeRekening || '',
          kegiatan: anyDoc.uraian || anyDoc.kegiatan || '',
          volume: anyDoc.volume || anyDoc.satuan || '1',
          nominal: Number(anyDoc.nominal) || 0,
          sumberAnggaran: anyDoc.sumber || anyDoc.sumberAnggaran || 'APBDes',
        };
      });

      const total = aggregatedItems.reduce((sum, it) => sum + it.nominal, 0);
      return {
        id: `aggregated-realisasi-${selectedYear}`,
        tahun: Number(selectedYear),
        totalRealisasi: total,
        items: aggregatedItems,
      } as RealisasiApbdesData;
    }

    return null;
  }, [allRealisasi, selectedYear]);

  const currentProdukHukum = useMemo(() => {
    return allProdukHukum?.filter(p => Number(p.tahun) === Number(selectedYear)) || [];
  }, [allProdukHukum, selectedYear]);

  // Filter Dokumen Produk Hukum berdasarkan Sub-Tab yang dipilih dan Kata Kunci Pencarian
  const filteredProdukHukum = useMemo(() => {
    let list = currentProdukHukum;
    if (activeProdukSubTab !== 'all') {
      list = list.filter(p => normalizeJenisProduk(p.jenis) === activeProdukSubTab);
    }
    if (searchProduk.trim()) {
      const q = searchProduk.toLowerCase();
      list = list.filter(p =>
        p.nama?.toLowerCase().includes(q) ||
        p.nomor?.toLowerCase().includes(q) ||
        p.jenis?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [currentProdukHukum, activeProdukSubTab, searchProduk]);

  // Hitungan dokumen per sub-tab untuk tahun terpilih
  const produkCountsPerSubTab = useMemo(() => {
    const map: Record<string, number> = { all: currentProdukHukum.length };
    PRODUK_HUKUM_SUB_TABS.forEach(t => {
      if (t.id !== 'all') {
        map[t.id] = currentProdukHukum.filter(p => normalizeJenisProduk(p.jenis) === t.id).length;
      }
    });
    return map;
  }, [currentProdukHukum]);

  // Deteksi dokumen di tahun lain jika tab tertentu kosong di tahun aktif (misal RPJMDes)
  const fallbackOtherYearsDocs = useMemo(() => {
    if (activeProdukSubTab === 'all' || !allProdukHukum) return [];
    return allProdukHukum.filter(
      p => normalizeJenisProduk(p.jenis) === activeProdukSubTab && Number(p.tahun) !== Number(selectedYear)
    );
  }, [allProdukHukum, activeProdukSubTab, selectedYear]);

  const apbdesChartData = useMemo(() => {
    if (!currentApbdes?.items) return [];
    const bidangData: Record<string, any> = {};
    currentApbdes.items.forEach(item => {
      const key = item.bidang || 'Lainnya';
      if (!bidangData[key]) bidangData[key] = { name: key, nominal: 0 };
      bidangData[key].nominal += (Number(item.nominal) || 0);
    });
    return Object.values(bidangData);
  }, [currentApbdes]);

  const apbdesSumberChartData = useMemo(() => {
    if (!currentApbdes?.items) return [];
    const sumberData: Record<string, any> = {};
    currentApbdes.items.forEach(item => {
      const src = item.sumberAnggaran || 'Lainnya';
      if (!sumberData[src]) sumberData[src] = { name: src, nominal: 0 };
      sumberData[src].nominal += (Number(item.nominal) || 0);
    });
    return Object.values(sumberData);
  }, [currentApbdes]);

  const realisasiChartData = useMemo(() => {
    if (!currentRealisasi?.items) return [];
    const bidangData: Record<string, any> = {};
    currentRealisasi.items.forEach(item => {
      const key = item.bidang || 'Lainnya';
      if (!bidangData[key]) bidangData[key] = { name: key, nominal: 0 };
      bidangData[key].nominal += (Number(item.nominal) || 0);
    });
    return Object.values(bidangData);
  }, [currentRealisasi]);

  const realisasiSumberChartData = useMemo(() => {
    if (!currentRealisasi?.items) return [];
    const sumberData: Record<string, any> = {};
    currentRealisasi.items.forEach(item => {
      const src = item.sumberAnggaran || 'Lainnya';
      if (!sumberData[src]) sumberData[src] = { name: src, nominal: 0 };
      sumberData[src].nominal += (Number(item.nominal) || 0);
    });
    return Object.values(sumberData);
  }, [currentRealisasi]);

  const totalAnggaranValue = useMemo(() => {
    if (!currentApbdes) return 0;
    if (currentApbdes.totalAnggaran !== undefined && currentApbdes.totalAnggaran !== null) {
      const num = Number(currentApbdes.totalAnggaran);
      if (!isNaN(num) && num > 0) return num;
    }
    if (Array.isArray(currentApbdes.items)) {
      return currentApbdes.items.reduce((sum, it) => sum + (Number(it?.nominal) || 0), 0);
    }
    return 0;
  }, [currentApbdes]);

  const totalRealisasiValue = useMemo(() => {
    if (!currentRealisasi) return 0;
    if (currentRealisasi.totalRealisasi !== undefined && currentRealisasi.totalRealisasi !== null) {
      const num = Number(currentRealisasi.totalRealisasi);
      if (!isNaN(num) && num > 0) return num;
    }
    if (Array.isArray(currentRealisasi.items)) {
      return currentRealisasi.items.reduce((sum, it) => sum + (Number(it?.nominal) || 0), 0);
    }
    return 0;
  }, [currentRealisasi]);

  const absorptionStats = useMemo(() => {
    if (!totalAnggaranValue || !totalRealisasiValue) return { percentage: 0, formatted: '0.0%' };
    const pct = (totalRealisasiValue / totalAnggaranValue) * 100;
    return { percentage: pct, formatted: (Number(pct) || 0).toFixed(1) + '%' };
  }, [totalAnggaranValue, totalRealisasiValue]);

  const outputAchievementStats = useMemo(() => {
    if (!currentApbdes?.items || !currentRealisasi?.items) return { percentage: 0, formatted: '0.0%' };
    let totalItems = 0;
    let totalAchievementSum = 0;
    currentRealisasi.items.forEach(realisasiItem => {
      const rNominal = Number(realisasiItem?.nominal) || 0;
      const apbdesItem = currentApbdes.items.find(
        a => a.kegiatan && realisasiItem.kegiatan && a.kegiatan.trim().toLowerCase() === realisasiItem.kegiatan.trim().toLowerCase()
      ) || currentApbdes.items.find(
        a => a.kodeRekening && realisasiItem.kodeRekening && a.kodeRekening.trim() === realisasiItem.kodeRekening.trim() &&
          a.bidang && realisasiItem.bidang && a.bidang.trim().toLowerCase() === realisasiItem.bidang.trim().toLowerCase()
      );
      const targetNominal = Number(apbdesItem?.nominal) || 0;
      if (targetNominal > 0) {
        totalAchievementSum += Math.min(100, (rNominal / targetNominal) * 100);
        totalItems++;
      } else if (rNominal > 0) {
        totalAchievementSum += 100;
        totalItems++;
      }
    });
    const pct = totalItems > 0 ? totalAchievementSum / totalItems : 0;
    return { percentage: pct, formatted: pct.toFixed(1) + '%' };
  }, [currentApbdes, currentRealisasi]);

  const filteredRealisasiItems = useMemo(() => {
    if (!currentRealisasi?.items) return [];
    if (!searchRealisasi.trim()) return currentRealisasi.items;
    const q = searchRealisasi.toLowerCase();
    return currentRealisasi.items.filter(item =>
      item.kegiatan?.toLowerCase().includes(q) ||
      item.bidang?.toLowerCase().includes(q) ||
      item.kodeRekening?.toLowerCase().includes(q) ||
      item.sumberAnggaran?.toLowerCase().includes(q)
    );
  }, [currentRealisasi, searchRealisasi]);

  // ─── QUERY OFFICIALS (PERANGKAT DESA DARI /admin/pemerintahan) ───
  const officialsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'officials'), orderBy('name', 'asc'));
  }, [firestore]);

  const { data: officials, isLoading: isOfficialsLoading } = useCollection<Official>(officialsQuery);

  const perangkatOfficials = useMemo(() => {
    if (!officials) return [];
    return officials.filter(o => o.category === 'perangkat');
  }, [officials]);

  const bpdOfficials = useMemo(() => {
    if (!officials) return [];
    return officials.filter(o => o.category === 'bpd');
  }, [officials]);

  const tabs = [
    { id: 'apbdes', label: 'APBDes', icon: BarChart3 },
    { id: 'realisasi', label: 'Realisasi APBDes', icon: TrendingUp },
    { id: 'produk', label: 'Produk Hukum', icon: FileText },
    { id: 'struktur', label: 'Struktur Organisasi & Tupoksi', icon: Network },
    { id: 'pembangunan', label: 'Transparansi Pembangunan', icon: HardHat },
    { id: 'aset', label: 'Aset Desa', icon: Landmark },
  ];

  const activeTabObj = tabs.find(t => t.id === activeTab) || tabs[0];

  return (
    <div className="relative flex flex-col min-h-screen bg-[#F8FAFC] dark:bg-[#060b11] text-slate-900 dark:text-slate-100 overflow-x-hidden font-sans">
      <BackgroundPattern />
      <Header />

      <main className="relative flex-1 pt-24 sm:pt-28 pb-16 sm:pb-24">
        <div className="container mx-auto px-2.5 sm:px-4 py-4 sm:py-6 md:py-8 max-w-7xl">
          {/* HERO TITLE SECTION */}
          <section className="text-center max-w-3xl mx-auto space-y-2 sm:space-y-3 mb-8 sm:mb-10">
            <div className="flex items-center justify-center gap-2">
              <span className="w-5 h-[2px] bg-teal-600 dark:bg-teal-400 shrink-0" />
              <span className="text-[11px] sm:text-xs font-bold uppercase tracking-widest text-teal-700 dark:text-teal-400">
                Transparansi &amp; Akuntabilitas Publik
              </span>
            </div>

            <h1 className="text-2xl min-[380px]:text-3xl sm:text-4xl md:text-5xl font-condensed font-bold text-slate-900 dark:text-white uppercase tracking-tight leading-[0.95]">
              Tata Kelola <span className="text-teal-600 dark:text-teal-400">Desa</span>
            </h1>

            <p className="text-xs sm:text-sm leading-relaxed text-slate-600 dark:text-slate-300 max-w-2xl mx-auto font-medium">
              Keterbukaan informasi realisasi Anggaran Pendapatan &amp; Belanja Desa (APBDes) serta produk hukum resmi Pemerintah Desa Sampeldes demi tata kelola yang bersih dan terpercaya.
            </p>
          </section>

          {/* GRID LAYOUT SESUAI KONSEP /profil-desa */}
          <div className="grid lg:grid-cols-12 gap-5 lg:gap-8 items-start">
            {/* SIDEBAR NAVIGATION (Desktop) / TOP CONTROLS (Mobile) */}
            <aside className="lg:col-span-3 lg:sticky lg:top-28 z-40">
              {/* Desktop Navigation List */}
              <div className="hidden lg:flex neu-card-elevated rounded-[28px] p-3 border border-white/60 flex-col gap-1.5">
                <div className="px-3.5 py-2 text-[10px] font-bold uppercase tracking-wider text-stone-500 border-b border-stone-300/70 mb-1">
                  Menu Tata Kelola
                </div>
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setActiveTab(tab.id);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className={cn(
                      "flex items-center gap-3.5 px-4 py-3 rounded-xl transition-all duration-300 whitespace-nowrap w-full group text-left cursor-pointer",
                      activeTab === tab.id
                        ? "neu-btn-dark text-emerald-400 shadow-sm font-bold"
                        : "neu-convex text-stone-700 hover:text-emerald-800 font-medium"
                    )}
                  >
                    <tab.icon className={cn("h-4 w-4 transition-transform group-hover:scale-110 shrink-0", activeTab === tab.id ? "text-emerald-400" : "text-stone-400")} />
                    <span className="font-condensed font-bold uppercase text-xs tracking-wider">{tab.label}</span>
                  </button>
                ))}
              </div>

              {/* Mobile Navigation */}
              <div className="block lg:hidden w-full mb-4 space-y-2.5">
                {/* Quick Dropdown Selector for instant switching */}
                <div className="flex items-center gap-2">
                  <Select
                    value={activeTab}
                    onValueChange={(val) => {
                      setActiveTab(val);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                  >
                    <SelectTrigger className="w-full h-11 neu-card-elevated border border-white/60 rounded-2xl font-condensed font-bold uppercase tracking-wider text-xs shadow-xs">
                      <div className="flex items-center gap-2 truncate">
                        <activeTabObj.icon className="h-4 w-4 text-emerald-800 shrink-0" />
                        <span className="truncate">{activeTabObj.label}</span>
                      </div>
                    </SelectTrigger>
                    <SelectContent className="neu-card-elevated rounded-2xl shadow-xl border-white/60 max-h-72">
                      {tabs.map((tab) => (
                        <SelectItem key={tab.id} value={tab.id} className="font-condensed font-bold uppercase text-xs py-2.5">
                          <div className="flex items-center gap-2">
                            <tab.icon className="h-4 w-4 text-emerald-800 shrink-0" />
                            <span>{tab.label}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Wrapped Chip Pills */}
                <div className="flex flex-wrap items-center gap-1.5 w-full pt-0.5">
                  {tabs.map((tab) => {
                    const isCurrent = activeTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => {
                          setActiveTab(tab.id);
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        className={cn(
                          "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-condensed font-bold uppercase tracking-wider transition-all cursor-pointer",
                          isCurrent
                            ? "neu-btn-dark text-emerald-400 font-bold shadow-xs"
                            : "neu-convex text-stone-700 hover:text-emerald-800"
                        )}
                      >
                        <tab.icon className={cn("h-3.5 w-3.5", isCurrent ? "text-emerald-400" : "text-stone-400")} />
                        <span>{tab.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Quick Summary Card (Desktop Only) */}
              <div className="hidden lg:block neu-card-elevated p-5 rounded-[28px] border border-white/60 space-y-3 mt-6">
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-800 uppercase tracking-wider">
                  {activeTab === 'struktur' ? <Network className="h-4 w-4" /> : activeTab === 'aset' ? <Landmark className="h-4 w-4" /> : <Activity className="h-4 w-4" />}
                  <span>{activeTab === 'struktur' ? 'Ringkasan SOTK Desa' : activeTab === 'aset' ? 'Rekapitulasi Aset Desa' : 'Ringkasan Keuangan'}</span>
                </div>
                {activeTab === 'struktur' ? (
                  <div className="space-y-1.5 sm:space-y-2 text-xs text-stone-600 divide-y divide-stone-300/60">
                    <div className="flex justify-between py-1">
                      <span className="text-stone-500">Dasar Hukum:</span>
                      <span className="font-bold text-slate-800">Perbup No. 132/2023</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-stone-500">Perangkat Terdaftar:</span>
                      <span className="font-bold text-emerald-700">{perangkatOfficials.length} Personel</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-stone-500">Pimpinan:</span>
                      <span className="font-bold text-slate-800">Kepala Desa</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-stone-500">Sekretariat:</span>
                      <span className="font-bold text-slate-800">Sekdes &amp; 3 Kaur</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-stone-500">Pelaksana Teknis:</span>
                      <span className="font-bold text-slate-800">3 Seksi (Kasi)</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-stone-500">Pelaksana Wilayah:</span>
                      <span className="font-bold text-slate-800">Kepala Dusun</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-stone-500">Mitra Pengawas:</span>
                      <span className="font-bold text-slate-800">BPD ({bpdOfficials.length})</span>
                    </div>
                  </div>
                ) : activeTab === 'aset' ? (
                  <div className="space-y-1.5 sm:space-y-2 text-xs text-stone-600 divide-y divide-stone-300/60">
                    <div className="flex justify-between py-1">
                      <span className="text-stone-500">Dasar Regulasi:</span>
                      <span className="font-bold text-slate-800">Permendagri 1/2016</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-stone-500">Sub-Kategori 1:</span>
                      <span className="font-bold text-slate-800">Tanah Kas Desa (TKD)</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-stone-500">Sub-Kategori 2:</span>
                      <span className="font-bold text-slate-800">Gedung &amp; Bangunan</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-stone-500">Sub-Kategori 3:</span>
                      <span className="font-bold text-slate-800">Ambulans &amp; Siaga</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-stone-500">Sub-Kategori 4:</span>
                      <span className="font-bold text-slate-800">Alsintan Pertanian</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-stone-500">Keterbukaan:</span>
                      <span className="font-bold text-emerald-700">Publik &amp; Terbuka</span>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-1.5 sm:space-y-2 text-xs text-stone-600 divide-y divide-stone-300/60">
                    <div className="flex justify-between py-1">
                      <span className="text-stone-500">Tahun Anggaran:</span>
                      <span className="font-bold text-slate-800">{selectedYear}</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-stone-500">Total APBDes:</span>
                      <span className="font-bold text-slate-800 font-mono">Rp {formatCompactRupiah(totalAnggaranValue)}</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-stone-500">Realisasi:</span>
                      <span className="font-bold text-slate-800 font-mono">Rp {formatCompactRupiah(totalRealisasiValue)}</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-stone-500">Serapan:</span>
                      <span className="font-bold text-emerald-700">{absorptionStats.formatted}</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-stone-500">Capaian Output:</span>
                      <span className="font-bold text-blue-700">{outputAchievementStats.formatted}</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-stone-500">Produk Hukum:</span>
                      <span className="font-bold text-slate-800">{currentProdukHukum.length} Berkas</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Card Bantuan / Info Transparansi (Desktop Only) */}
              <div className="hidden lg:block mt-6 p-6 neu-card-elevated rounded-[28px] border border-white/60 relative overflow-hidden">
                <div className="relative z-10 space-y-3">
                  <div className="inline-flex items-center gap-2 text-xs font-semibold tracking-wider text-emerald-800 uppercase">
                    <span className="w-2 h-2 rounded-full bg-emerald-600 shrink-0" />
                    <span>Akuntabilitas Publik</span>
                  </div>
                  <h4 className="text-lg font-condensed font-black uppercase tracking-tight leading-snug text-slate-900">
                    {activeTab === 'struktur' ? 'SOTK Pemerintah Desa' : activeTab === 'aset' ? 'Pengelolaan Aset Desa' : 'Transparansi Anggaran Desa'}
                  </h4>
                  <p className="text-xs text-stone-600 leading-relaxed">
                    {activeTab === 'struktur'
                      ? 'Struktur organisasi dan tata kerja Pemerintah Desa Sampeldes diatur untuk memastikan pembagian tugas dan pelayanan publik yang efektif dan akuntabel.'
                      : activeTab === 'aset'
                        ? 'Pencatatan tanah kas desa, gedung pemerintahan, mobil siaga/ambulans, dan mesin pertanian dikelola secara tertib demi kemaslahatan warga.'
                        : 'Setiap anggaran dan pelaksanaan kegiatan fisik maupun pemberdayaan dilaporkan secara transparan untuk seluruh masyarakat Desa Sampeldes.'}
                  </p>
                </div>
              </div>
            </aside>

            {/* MAIN CONTENT AREA */}
            <div className="lg:col-span-9 space-y-6 sm:space-y-8 min-w-0">
              {/* TOP BAR / CONTEXT BAR */}
              {activeTab === 'struktur' ? (
                <div className="neu-card-elevated rounded-[24px] p-3.5 sm:p-4 border border-white/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <Landmark className="h-4 w-4 text-emerald-800 shrink-0" />
                    <span className="text-xs font-condensed font-bold text-slate-800 uppercase tracking-wider">
                      SOTK Pemerintah Desa Sampeldes
                    </span>
                    <span className="neu-btn-gold px-2.5 py-0.5 rounded-full font-condensed font-bold uppercase text-[9px] tracking-wider text-slate-900">
                      Perbup Cilacap No. 132 Tahun 2023
                    </span>
                  </div>

                  <div className="inline-flex items-center gap-2 text-[11px] font-bold text-emerald-900 font-condensed bg-emerald-50/50 px-3 py-1.5 rounded-xl border border-emerald-600/20">
                    <ShieldCheck className="h-4 w-4 text-emerald-700 shrink-0" />
                    <span>Data Resmi Perangkat Desa ({perangkatOfficials.length} Personel)</span>
                  </div>
                </div>
              ) : activeTab === 'aset' ? (
                <div className="neu-card-elevated rounded-[24px] p-3.5 sm:p-4 border border-white/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <Landmark className="h-4 w-4 text-emerald-800 shrink-0" />
                    <span className="text-xs font-condensed font-bold text-slate-800 uppercase tracking-wider">
                      Buku Inventaris &amp; Aset Milik Desa Sampeldes
                    </span>
                    <span className="neu-btn-gold px-2.5 py-0.5 rounded-full font-condensed font-bold uppercase text-[9px] tracking-wider text-slate-900">
                      Permendagri No. 1/2016
                    </span>
                  </div>

                  <div className="inline-flex items-center gap-2 text-[11px] font-bold text-emerald-900 font-condensed bg-emerald-50/50 px-3 py-1.5 rounded-xl border border-emerald-600/20">
                    <ShieldCheck className="h-4 w-4 text-emerald-700 shrink-0" />
                    <span>Tertib Hukum, Administrasi &amp; Fisik</span>
                  </div>
                </div>
              ) : (
                <div className="neu-card-elevated rounded-[24px] p-3.5 sm:p-4 border border-white/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <Calendar className="h-4 w-4 text-emerald-800 shrink-0" />
                    <span className="text-xs font-condensed font-bold text-slate-700 uppercase tracking-wider">
                      Tahun Anggaran:
                    </span>
                    <Select value={selectedYear.toString()} onValueChange={(v) => setSelectedYear(parseInt(v))}>
                      <SelectTrigger className="w-36 sm:w-44 h-10 text-xs sm:text-sm rounded-xl neu-btn text-slate-800 border border-white/80 font-condensed font-bold cursor-pointer">
                        <SelectValue placeholder="Pilih Tahun" />
                      </SelectTrigger>
                      <SelectContent className="neu-flat rounded-2xl border border-white/80 text-slate-900 shadow-xl">
                        {availableYears.map(year => (
                          <SelectItem
                            key={`year-opt-${year}`}
                            value={year.toString()}
                            className="text-xs sm:text-sm font-condensed font-bold cursor-pointer hover:bg-black/5 rounded-xl"
                          >
                            Tahun {year}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="inline-flex items-center gap-2 text-[11px] font-bold text-emerald-900 font-condensed bg-emerald-50/50 px-3 py-1.5 rounded-xl border border-emerald-600/20">
                    <ShieldCheck className="h-4 w-4 text-emerald-700 shrink-0" />
                    <span>Data Resmi Pemerintah Desa Sampeldes</span>
                  </div>
                </div>
              )}

              {/* ─── TAB 1: APBDES ─── */}
              {activeTab === 'apbdes' && (
                <div className="space-y-6 sm:space-y-8">
                  {isLoadingApbdes ? (
                    <div className="neu-card-elevated rounded-[28px] p-8 sm:p-12 border border-white/80">
                      <Skeleton className="h-48 w-full rounded-2xl bg-stone-300/60" />
                    </div>
                  ) : currentApbdes ? (
                    <>
                      {/* Overview Card */}
                      <div className="neu-card-elevated-dark rounded-[28px] p-5 sm:p-8 text-white relative overflow-hidden border border-white/10 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="space-y-2">
                          <span className="text-[10px] sm:text-xs font-condensed font-bold bg-teal-500/20 text-teal-400 border border-teal-500/30 px-3 py-1 rounded-full uppercase tracking-wider inline-block">
                            Anggaran Pendapatan &amp; Belanja Desa
                          </span>
                          <h3 className="text-xl min-[380px]:text-2xl sm:text-3xl font-condensed font-bold uppercase tracking-tight text-white">
                            APBDes Tahun {selectedYear}
                          </h3>
                          <p className="text-slate-300 font-medium text-xs sm:text-sm max-w-xl">
                            Rekapitulasi rencana alokasi anggaran belanja Desa Sampeldes demi pembangunan infrastruktur, pelayanan warga, dan kemajuan desa.
                          </p>
                        </div>

                        <div className="p-4 sm:p-6 bg-white/10 rounded-[22px] backdrop-blur-md border border-white/15 min-w-[220px] sm:min-w-[280px]">
                          <span className="text-[10px] sm:text-xs text-teal-400 font-bold uppercase tracking-wider font-condensed block">
                            Total Rencana Anggaran
                          </span>
                          <div className="text-2xl sm:text-3xl font-condensed font-bold text-teal-400 mt-1 font-mono">
                            Rp {formatRupiah(totalAnggaranValue)}
                          </div>
                          <div className="text-[10px] text-slate-300 mt-1 font-mono font-medium">
                            {currentApbdes.items?.length || 0} Kegiatan Terdaftar
                          </div>
                        </div>
                      </div>

                      {/* 3D Isometric Charts */}
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
                        <IsometricChart
                          data={apbdesChartData}
                          title="Perbandingan Total per Bidang"
                          subtitle="Rincian alokasi anggaran belanja untuk setiap bidang pembangunan."
                          emptyText="Data Bidang Belum Tersedia"
                        />
                        <IsometricChart
                          data={apbdesSumberChartData}
                          title="Perbandingan Total per Sumber Anggaran"
                          subtitle="Asal/sumber dana anggaran pendapatan dan belanja desa."
                          emptyText="Data Sumber Dana Belum Tersedia"
                        />
                      </div>

                    </>
                  ) : (
                    <div className="neu-card-elevated rounded-[28px] p-10 sm:p-14 text-center border border-white/80 space-y-3">
                      <div className="h-12 w-12 rounded-2xl neu-inset text-slate-400 mx-auto flex items-center justify-center">
                        <BarChart3 className="h-6 w-6" />
                      </div>
                      <h4 className="text-base sm:text-lg font-condensed font-bold text-slate-800 uppercase tracking-tight">
                        Data APBDes Tahun {selectedYear} Belum Tersedia
                      </h4>
                      <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto font-medium">
                        Pemerintah Desa Sampeldes sedang menyusun data APBDes untuk tahun ini. Silakan pilih tahun anggaran lain pada menu di atas.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* ─── TAB 2: REALISASI APBDES ─── */}
              {activeTab === 'realisasi' && (
                <div className="space-y-6 sm:space-y-8">
                  {isLoadingRealisasi ? (
                    <div className="neu-card-elevated rounded-[28px] p-8 sm:p-12 border border-white/80">
                      <Skeleton className="h-48 w-full rounded-2xl bg-stone-300/60" />
                    </div>
                  ) : currentRealisasi ? (
                    <>
                      {/* Metric Cards - 3 Columns responsive */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                        {/* Kartu 1: Total Realisasi */}
                        <div className="neu-card-elevated-dark rounded-[28px] p-5 sm:p-6 text-white flex flex-col justify-between min-h-[180px] border border-white/10 shadow-lg">
                          <div>
                            <span className="text-[10px] sm:text-xs font-condensed font-bold bg-teal-500/20 text-teal-400 border border-teal-500/30 px-3 py-1 rounded-full uppercase tracking-wider inline-block">
                              Realisasi Anggaran Belanja
                            </span>
                            <h3 className="text-lg sm:text-xl font-condensed font-bold text-white uppercase tracking-tight mt-2">
                              Realisasi {selectedYear}
                            </h3>
                          </div>
                          <div className="mt-4">
                            <span className="text-[10px] text-teal-400/90 font-bold uppercase tracking-wider font-condensed block">
                              Total Realisasi Belanja
                            </span>
                            <div className="text-2xl sm:text-3xl font-condensed font-bold text-teal-400 mt-0.5 font-mono">
                              Rp {formatRupiah(totalRealisasiValue)}
                            </div>
                            {totalAnggaranValue > 0 && (
                              <div className="text-[11px] text-slate-300 font-medium mt-1 font-mono">
                                Dari Rencana: Rp {formatRupiah(totalAnggaranValue)}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Kartu 2: Penyerapan Anggaran */}
                        <div className="neu-card-elevated rounded-[28px] p-5 sm:p-6 border border-white/80 flex flex-col justify-between min-h-[180px] shadow-sm">
                          <div>
                            <h4 className="text-base sm:text-lg font-condensed font-bold text-slate-900 uppercase tracking-tight">
                              Penyerapan Anggaran
                            </h4>
                            <p className="text-[11px] sm:text-xs text-slate-500 font-medium mt-0.5">
                              Persentase rencana anggaran yang telah terealisasi.
                            </p>
                          </div>
                          <div className="my-2">
                            <div className="text-3xl min-[380px]:text-4xl sm:text-5xl font-condensed font-bold text-emerald-700">
                              {absorptionStats.formatted}
                            </div>
                            <div className="neu-inset w-full rounded-full h-3 mt-2.5 p-0.5 overflow-hidden">
                              <div
                                className="bg-gradient-to-r from-emerald-500 to-teal-500 h-full rounded-full transition-all duration-1000"
                                style={{ width: `${Math.min(100, Math.max(0, absorptionStats.percentage))}%` }}
                              />
                            </div>
                          </div>
                          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider font-condensed">
                            Anggaran Terserap
                          </span>
                        </div>

                        {/* Kartu 3: Capaian Output */}
                        <div className="neu-card-elevated rounded-[28px] p-5 sm:p-6 border border-white/80 flex flex-col justify-between min-h-[180px] sm:col-span-2 lg:col-span-1 shadow-sm">
                          <div>
                            <h4 className="text-base sm:text-lg font-condensed font-bold text-slate-900 uppercase tracking-tight">
                              Capaian Output
                            </h4>
                            <p className="text-[11px] sm:text-xs text-slate-500 font-medium mt-0.5">
                              Rata-rata persentase realisasi kegiatan pembangunan.
                            </p>
                          </div>
                          <div className="my-2">
                            <div className="text-3xl min-[380px]:text-4xl sm:text-5xl font-condensed font-bold text-teal-700">
                              {outputAchievementStats.formatted}
                            </div>
                            <div className="neu-inset w-full rounded-full h-3 mt-2.5 p-0.5 overflow-hidden">
                              <div
                                className="bg-gradient-to-r from-teal-500 to-emerald-500 h-full rounded-full transition-all duration-1000"
                                style={{ width: `${Math.min(100, Math.max(0, outputAchievementStats.percentage))}%` }}
                              />
                            </div>
                          </div>
                          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider font-condensed">
                            Kegiatan Terealisasi
                          </span>
                        </div>
                      </div>

                      {/* 3D Isometric Charts */}
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
                        <IsometricChart
                          data={realisasiChartData}
                          title="Perbandingan Total per Bidang"
                          subtitle="Jumlah realisasi belanja untuk masing-masing bidang pembangunan."
                          emptyText="Data Bidang Kosong"
                        />
                        <IsometricChart
                          data={realisasiSumberChartData}
                          title="Perbandingan Total per Sumber Anggaran"
                          subtitle="Realisasi belanja dikelompokkan berdasarkan asal/sumber anggaran."
                          emptyText="Data Sumber Anggaran Kosong"
                        />
                      </div>

                      {/* Rincian Tabel Realisasi APBDes */}
                      {currentRealisasi.items && currentRealisasi.items.length > 0 && (
                        <div className="neu-card-elevated rounded-[28px] border border-white/80 p-4 sm:p-6 space-y-4 shadow-sm">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-black/5">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="w-2.5 h-2.5 rounded-full bg-teal-500" />
                                <h4 className="text-base sm:text-lg font-condensed font-bold text-slate-900 uppercase tracking-tight">
                                  Rincian Realisasi Kegiatan {selectedYear}
                                </h4>
                              </div>
                              <p className="text-xs text-slate-500 font-medium mt-0.5">
                                Menampilkan {filteredRealisasiItems.length} dari {currentRealisasi.items.length} kegiatan realisasi
                              </p>
                            </div>

                            {/* Search Input */}
                            <div className="relative w-full sm:w-72">
                              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                              <Input
                                placeholder="Cari kegiatan, bidang, sumber..."
                                value={searchRealisasi}
                                onChange={(e) => setSearchRealisasi(e.target.value)}
                                className="neu-inset pl-9 h-10 text-xs rounded-2xl bg-white dark:bg-[#081d27] border border-white/60 focus:bg-white text-slate-800"
                              />
                            </div>
                          </div>

                          {/* Desktop Table View */}
                          <div className="hidden md:block overflow-x-auto rounded-2xl border border-white/80 shadow-xs">
                            <table className="w-full text-xs">
                              <thead className="neu-inset bg-white dark:bg-[#081d27] font-bold uppercase tracking-wider text-slate-700">
                                <tr>
                                  <th className="px-4 py-3.5 text-left font-condensed">Bidang</th>
                                  <th className="px-4 py-3.5 text-left font-condensed">Kode Rekening</th>
                                  <th className="px-4 py-3.5 text-left font-condensed">Kegiatan</th>
                                  <th className="px-4 py-3.5 text-right font-condensed">Rencana APBDes</th>
                                  <th className="px-4 py-3.5 text-right font-condensed">Realisasi Belanja</th>
                                  <th className="px-4 py-3.5 text-center font-condensed">Capaian</th>
                                  <th className="px-4 py-3.5 text-left font-condensed">Sumber Dana</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-black/5 bg-white/70">
                                {filteredRealisasiItems.length === 0 ? (
                                  <tr>
                                    <td colSpan={7} className="px-4 py-8 text-center text-slate-400 font-medium">
                                      Tidak ada kegiatan yang cocok dengan pencarian &quot;{searchRealisasi}&quot;
                                    </td>
                                  </tr>
                                ) : (
                                  filteredRealisasiItems.map((item, idx) => {
                                    const matchedApbdesItem = currentApbdes?.items?.find(
                                      a => a.kegiatan && item.kegiatan && a.kegiatan.trim().toLowerCase() === item.kegiatan.trim().toLowerCase()
                                    ) || currentApbdes?.items?.find(
                                      a => a.kodeRekening && item.kodeRekening && a.kodeRekening.trim() === item.kodeRekening.trim() &&
                                        a.bidang && item.bidang && a.bidang.trim().toLowerCase() === item.bidang.trim().toLowerCase()
                                    );
                                    const targetNominal = Number(matchedApbdesItem?.nominal) || 0;
                                    const realNominal = Number(item?.nominal) || 0;
                                    const achievement = targetNominal > 0 ? (realNominal / targetNominal) * 100 : 100;

                                    return (
                                      <tr key={`realisasi-row-${idx}`} className="hover:bg-black/5 transition-colors">
                                        <td className="px-4 py-3 font-semibold text-slate-800">{item.bidang}</td>
                                        <td className="px-4 py-3 font-mono text-[11px] text-slate-500">{item.kodeRekening}</td>
                                        <td className="px-4 py-3 font-medium text-slate-700">{item.kegiatan}</td>
                                        <td className="px-4 py-3 text-right font-mono text-slate-500">
                                          {targetNominal > 0 ? `Rp ${formatRupiah(targetNominal)}` : '-'}
                                        </td>
                                        <td className="px-4 py-3 text-right font-mono font-bold text-teal-700">
                                          Rp {formatRupiah(realNominal)}
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                          <span className={cn(
                                            'px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono inline-block',
                                            achievement >= 90 ? 'bg-emerald-100 text-emerald-800' :
                                              achievement >= 50 ? 'bg-amber-100 text-amber-800' :
                                                'bg-rose-100 text-rose-800'
                                          )}>
                                            {achievement.toFixed(1)}%
                                          </span>
                                        </td>
                                        <td className="px-4 py-3 text-slate-600">
                                          <span className="neu-pill px-2.5 py-0.5 rounded-lg text-[10px] font-bold text-slate-700">
                                            {item.sumberAnggaran || 'APBDes'}
                                          </span>
                                        </td>
                                      </tr>
                                    );
                                  })
                                )}
                              </tbody>
                            </table>
                          </div>

                          {/* Mobile Cards View */}
                          <div className="md:hidden space-y-2.5">
                            {filteredRealisasiItems.length === 0 ? (
                              <div className="text-center py-6 text-xs text-slate-400 font-medium">
                                Tidak ada kegiatan yang cocok
                              </div>
                            ) : (
                              filteredRealisasiItems.map((item, idx) => {
                                const matchedApbdesItem = currentApbdes?.items?.find(
                                  a => a.kegiatan && item.kegiatan && a.kegiatan.trim().toLowerCase() === item.kegiatan.trim().toLowerCase()
                                ) || currentApbdes?.items?.find(
                                  a => a.kodeRekening && item.kodeRekening && a.kodeRekening.trim() === item.kodeRekening.trim() &&
                                    a.bidang && item.bidang && a.bidang.trim().toLowerCase() === item.bidang.trim().toLowerCase()
                                );
                                const targetNominal = Number(matchedApbdesItem?.nominal) || 0;
                                const realNominal = Number(item?.nominal) || 0;
                                const achievement = targetNominal > 0 ? (realNominal / targetNominal) * 100 : 100;

                                return (
                                  <div key={`realisasi-card-${idx}`} className="neu-pill-elevated rounded-2xl p-3.5 space-y-2 border border-white/70">
                                    <div className="flex items-start justify-between gap-2">
                                      <div>
                                        <span className="text-[10px] font-bold text-teal-800 uppercase tracking-wider block font-condensed">
                                          {item.bidang}
                                        </span>
                                        <h5 className="text-xs font-bold text-slate-900 mt-0.5">{item.kegiatan}</h5>
                                        <span className="text-[10px] font-mono text-slate-400 block mt-0.5">{item.kodeRekening}</span>
                                      </div>
                                      <span className={cn(
                                        'px-2 py-0.5 rounded-full text-[9px] font-bold font-mono shrink-0',
                                        achievement >= 90 ? 'bg-emerald-100 text-emerald-800' :
                                          achievement >= 50 ? 'bg-amber-100 text-amber-800' :
                                            'bg-rose-100 text-rose-800'
                                      )}>
                                        {achievement.toFixed(0)}%
                                      </span>
                                    </div>
                                    <div className="flex items-center justify-between pt-1.5 border-t border-black/5 text-xs">
                                      <span className="text-[11px] text-slate-500">
                                        Target: {targetNominal > 0 ? `Rp ${(targetNominal / 1e6).toFixed(1)}jt` : '-'}
                                      </span>
                                      <span className="font-mono font-bold text-teal-700">
                                        Rp {formatRupiah(realNominal)}
                                      </span>
                                    </div>
                                  </div>
                                );
                              })
                            )}
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="neu-card-elevated rounded-[28px] p-10 sm:p-14 text-center border border-white/80 space-y-3">
                      <div className="h-12 w-12 rounded-2xl neu-inset text-slate-400 mx-auto flex items-center justify-center">
                        <TrendingUp className="h-6 w-6" />
                      </div>
                      <h4 className="text-base sm:text-lg font-condensed font-bold text-slate-800 uppercase tracking-tight">
                        Data Realisasi Tahun {selectedYear} Belum Tersedia
                      </h4>
                      <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto font-medium">
                        Laporan realisasi belanja APBDes untuk tahun ini belum diunggah. Silakan pilih tahun anggaran lain melalui menu di atas.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* ─── TAB 3: PRODUK HUKUM DESA ─── */}
              {activeTab === 'produk' && (
                <div className="space-y-6 sm:space-y-8">
                  {/* SUB-TAB NAVIGASI 7 KATEGORI + SEMUA DI BAWAH TAHUN */}
                  <div className="neu-card-elevated rounded-[28px] p-4 sm:p-5 border border-white/70 space-y-3.5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-emerald-600 shrink-0" />
                          <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-emerald-800">
                            Klasifikasi Regulasi &amp; Produk Hukum
                          </span>
                        </div>
                        <h3 className="text-sm sm:text-base font-condensed font-bold uppercase text-slate-900 tracking-tight mt-0.5">
                          Pilih Jenis Dokumen Hukum Desa
                        </h3>
                      </div>
                      <div className="text-[11px] text-stone-600 font-medium">
                        Tahun Anggaran Terpilih: <span className="font-bold text-slate-800 font-mono">Tahun {selectedYear}</span>
                      </div>
                    </div>

                    {/* 7 Tab Produk Hukum Sesuai Permintaan User (+ Tab Semua) */}
                    <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-2 pt-1 scrollbar-none">
                      {PRODUK_HUKUM_SUB_TABS.map((subTab) => {
                        const isActive = activeProdukSubTab === subTab.id;
                        const count = produkCountsPerSubTab[subTab.id] || 0;
                        return (
                          <button
                            key={`subtab-${subTab.id}`}
                            type="button"
                            onClick={() => setActiveProdukSubTab(subTab.id)}
                            className={cn(
                              "flex items-center gap-2 px-3 sm:px-3.5 py-2 rounded-xl text-xs font-condensed uppercase tracking-wider whitespace-nowrap transition-all duration-300 cursor-pointer shrink-0",
                              isActive
                                ? "neu-btn-dark text-emerald-400 font-black shadow-sm scale-[1.02]"
                                : "neu-convex text-stone-700 hover:text-emerald-900 font-bold"
                            )}
                          >
                            {subTab.tabNum && (
                              <span className={cn(
                                "w-4 h-4 rounded-full text-[9px] font-black flex items-center justify-center shrink-0",
                                isActive ? "bg-emerald-400 text-slate-900" : "bg-black/10 text-stone-700"
                              )}>
                                {subTab.tabNum}
                              </span>
                            )}
                            <span>{subTab.label}</span>
                            <span className={cn(
                              "text-[10px] px-1.5 py-0.5 rounded-full font-mono font-bold",
                              isActive ? "bg-emerald-400/20 text-emerald-300" : "bg-black/5 text-stone-500"
                            )}>
                              {count}
                            </span>
                          </button>
                        );
                      })}
                    </div>

                    {/* Search Bar Produk Hukum */}
                    <div className="pt-2.5 border-t border-black/5 flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center">
                      <div className="relative flex-1">
                        <Search className="h-4 w-4 absolute left-3.5 top-3 text-slate-400" />
                        <Input
                          value={searchProduk}
                          onChange={(e) => setSearchProduk(e.target.value)}
                          placeholder="Cari judul dokumen hukum, nomor dokumen, atau regulasi..."
                          className="neu-inset pl-9 rounded-xl border-none text-xs sm:text-sm h-10 bg-transparent text-slate-800 placeholder:text-slate-400"
                        />
                      </div>
                      {searchProduk && (
                        <Button
                          variant="ghost"
                          onClick={() => setSearchProduk('')}
                          className="neu-pill h-10 px-3.5 text-xs font-condensed font-bold uppercase text-slate-600 shrink-0"
                        >
                          Reset Filter
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* DAFTAR DOKUMEN PRODUK HUKUM */}
                  {isLoadingProduk ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
                      {Array.from({ length: 6 }).map((_, i) => (
                        <Skeleton key={`prod-skel-${i}`} className="h-36 sm:h-48 rounded-[24px] bg-stone-300/60" />
                      ))}
                    </div>
                  ) : filteredProdukHukum.length === 0 ? (
                    <div className="space-y-6">
                      {/* Fallback Jika di Tahun Ini Kosong, Tapi Tersedia di Tahun Lain (Misal RPJMDes Periode 6 Tahunan) */}
                      {fallbackOtherYearsDocs.length > 0 ? (
                        <div className="neu-card-elevated rounded-[28px] p-6 sm:p-8 border border-white/80 space-y-4">
                          <div className="flex items-start gap-3.5">
                            <div className="h-10 w-10 rounded-2xl neu-inset text-emerald-700 flex items-center justify-center shrink-0">
                              <FileText className="h-5 w-5" />
                            </div>
                            <div className="space-y-1">
                              <h4 className="text-sm sm:text-base font-condensed font-bold text-slate-900 uppercase">
                                Dokumen {getProdukLabel(activeProdukSubTab)} Tersedia di Tahun Lain
                              </h4>
                              <p className="text-xs text-stone-600 leading-relaxed">
                                Tidak ada arsip dokumen {getProdukLabel(activeProdukSubTab)} yang terbit di tahun {selectedYear}. Namun sistem menemukan dokumen ini dari arsip periode lain di bawah ini:
                              </p>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
                            {fallbackOtherYearsDocs.map(produk => (
                              <div
                                key={`fallback-produk-${produk.id}`}
                                className="neu-card-elevated rounded-[24px] p-4 sm:p-5 border border-white/80 flex flex-col justify-between hover:scale-[1.01] transition-all space-y-4"
                              >
                                <div className="space-y-2">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className="neu-btn-gold px-2.5 py-0.5 rounded-full font-condensed font-bold uppercase text-[9px] sm:text-[10px] inline-block tracking-wider">
                                      {getProdukLabel(produk.jenis)}
                                    </span>
                                    <span className="neu-pill px-2 py-0.5 rounded-full font-mono text-[9px] font-bold text-slate-700">
                                      Tahun {produk.tahun}
                                    </span>
                                  </div>
                                  <h4 className="text-xs min-[380px]:text-sm sm:text-base font-condensed font-bold uppercase tracking-tight text-slate-900 line-clamp-2 leading-snug">
                                    {produk.nama}
                                  </h4>
                                  <p className="text-[10.5px] sm:text-xs text-slate-500 font-medium">
                                    Nomor: <strong>{produk.nomor}</strong>
                                  </p>
                                </div>

                                <div className="space-y-2 pt-2 border-t border-black/5">
                                  {(produk.filePdfUrl || produk.driveLink) && (
                                    <a href={produk.filePdfUrl || produk.driveLink} target="_blank" rel="noopener noreferrer" className="block">
                                      <Button className="neu-btn-dark text-teal-400 w-full rounded-xl gap-2 h-9 text-[10px] sm:text-xs font-condensed font-bold uppercase tracking-wider border-0 shadow-sm">
                                        <FileText className="h-3.5 w-3.5" />
                                        <span>Buka Dokumen PDF / Drive</span>
                                        <ArrowUpRight className="h-3 w-3 ml-auto opacity-70" />
                                      </Button>
                                    </a>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="neu-card-elevated rounded-[28px] p-10 sm:p-14 text-center border border-white/80 space-y-3">
                          <div className="h-12 w-12 rounded-2xl neu-inset text-slate-400 mx-auto flex items-center justify-center">
                            <FileText className="h-6 w-6" />
                          </div>
                          <h4 className="text-base sm:text-lg font-condensed font-bold text-slate-800 uppercase tracking-tight">
                            {activeProdukSubTab !== 'all'
                              ? `Dokumen ${getProdukLabel(activeProdukSubTab)} Belum Tersedia`
                              : `Belum Ada Produk Hukum Tahun ${selectedYear}`}
                          </h4>
                          <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto font-medium">
                            {activeProdukSubTab !== 'all'
                              ? `Belum ada dokumen ${getProdukLabel(activeProdukSubTab)} yang diarsipkan untuk tahun ${selectedYear}. Silakan cek tab kategori lain atau pilih tahun anggaran yang berbeda.`
                              : `Belum ada dokumen Peraturan Desa (Perdes), Perkades, Keputusan Kades, atau dokumen lainnya yang diarsipkan untuk tahun ${selectedYear}.`}
                          </p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                      {filteredProdukHukum.map(produk => {
                        const targetLink = produk.filePdfUrl || produk.driveLink;
                        return (
                          <div
                            key={`produk-${produk.id}`}
                            className="neu-card-elevated rounded-[24px] p-4 sm:p-5 border border-white/80 flex flex-col justify-between hover:scale-[1.01] transition-all space-y-4"
                          >
                            <div className="space-y-2">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="neu-btn-gold px-2.5 py-0.5 rounded-full font-condensed font-bold uppercase text-[9px] sm:text-[10px] inline-block tracking-wider">
                                  {getProdukLabel(produk.jenis)}
                                </span>
                                <span className="neu-pill px-2 py-0.5 rounded-full font-mono text-[9px] font-bold text-slate-700">
                                  Tahun {produk.tahun}
                                </span>
                              </div>
                              <h4 className="text-xs min-[380px]:text-sm sm:text-base font-condensed font-bold uppercase tracking-tight text-slate-900 line-clamp-2 leading-snug">
                                {produk.nama}
                              </h4>
                              <p className="text-[10.5px] sm:text-xs text-slate-500 font-medium">
                                Nomor: <strong>{produk.nomor}</strong>
                              </p>
                            </div>

                            <div className="space-y-2 pt-2 border-t border-black/5">
                              {produk.filePdfUrl && (
                                <a href={produk.filePdfUrl} target="_blank" rel="noopener noreferrer" className="block">
                                  <Button className="neu-btn-dark text-teal-400 w-full rounded-xl gap-2 h-9 text-[10px] sm:text-xs font-condensed font-bold uppercase tracking-wider border-0 shadow-sm">
                                    <FileText className="h-3.5 w-3.5" />
                                    <span>Buka PDF Dokumen</span>
                                    <ArrowUpRight className="h-3 w-3 ml-auto opacity-70" />
                                  </Button>
                                </a>
                              )}
                              {produk.driveLink && !produk.filePdfUrl && (
                                <a href={produk.driveLink} target="_blank" rel="noopener noreferrer" className="block">
                                  <Button className="neu-btn-dark text-teal-400 w-full rounded-xl gap-2 h-9 text-[10px] sm:text-xs font-condensed font-bold uppercase tracking-wider border-0 shadow-sm">
                                    <ExternalLink className="h-3.5 w-3.5" />
                                    <span>Buka di Google Drive</span>
                                    <ArrowUpRight className="h-3 w-3 ml-auto opacity-70" />
                                  </Button>
                                </a>
                              )}
                              {produk.driveLink && produk.filePdfUrl && (
                                <a href={produk.driveLink} target="_blank" rel="noopener noreferrer" className="block">
                                  <Button variant="ghost" className="neu-pill w-full rounded-xl gap-2 h-9 text-[10px] sm:text-xs font-condensed font-bold uppercase tracking-wider text-slate-700 hover:text-slate-900">
                                    <ExternalLink className="h-3.5 w-3.5" />
                                    <span>Buka di Google Drive</span>
                                  </Button>
                                </a>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* ─── TAB 4: STRUKTUR ORGANISASI & TUPOKSI ─── */}
              {activeTab === 'struktur' && (
                <StrukturOrganisasiTupoksiTab
                  officials={perangkatOfficials}
                  bpdOfficials={bpdOfficials}
                  isLoading={isOfficialsLoading}
                />
              )}

              {/* ─── TAB 5: TRANSPARANSI PEMBANGUNAN ─── */}
              {activeTab === 'pembangunan' && (
                <TransparansiPembangunanPublicTab />
              )}

              {/* ─── TAB 6: ASET DESA ─── */}
              {activeTab === 'aset' && (
                <AsetDesaPublicTab />
              )}
            </div>
          </div>
        </div>
      </main>

      {/* OFFICIAL PORTAL FOOTER */}
      <Footer />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// DATA MASTER TUPOKSI: PERBUP CILACAP NOMOR 132 TAHUN 2023
// (Perubahan atas Perbup Cilacap No. 64 Th 2016 tentang SOTK Pemerintah Desa)
// ─────────────────────────────────────────────────────────────────────────────

interface TupoksiItem {
  id: string;
  code: string;
  category: 'kades' | 'sekdes' | 'kaur' | 'kasi' | 'kadus' | 'staf' | 'bpd';
  categoryLabel: string;
  jabatan: string;
  dasarHukum: string;
  kedudukan: string;
  tugasPokok: string;
  fungsi: string[];
  ruangLingkup: string[];
  colorBadge: string;
  keywords: string[];
}

const TUPOKSI_DATA: TupoksiItem[] = [
  {
    id: 'kades',
    code: 'KADES',
    category: 'kades',
    categoryLabel: 'Pucuk Pimpinan Desa',
    jabatan: 'Kepala Desa',
    dasarHukum: 'Perbup Cilacap No. 132 Th 2023 Pasal 6 - 8',
    kedudukan: 'Pemimpin penyelenggaraan Pemerintahan Desa yang berkedudukan sebagai penanggung jawab utama dan pemegang kekuasaan pengelolaan keuangan dan aset desa.',
    tugasPokok: 'Menyelenggarakan Pemerintahan Desa, melaksanakan Pembangunan Desa, pembinaan kemasyarakatan Desa, dan pemberdayaan masyarakat Desa.',
    fungsi: [
      'Memimpin penyelenggaraan pemerintahan desa berdasarkan kebijakan yang ditetapkan bersama Badan Permusyawaratan Desa (BPD).',
      'Mengajukan rancangan dan menetapkan Peraturan Desa (Perdes) yang telah mendapatkan persetujuan bersama BPD.',
      'Menetapkan Anggaran Pendapatan dan Belanja Desa (APBDes) setelah dievaluasi oleh Camat atas nama Bupati.',
      'Membina ketenteraman, ketertiban, dan kerukunan hidup masyarakat di seluruh wilayah desa.',
      'Memegang kekuasaan pengelolaan keuangan dan aset milik desa, serta mengarahkan pemanfaatannya demi kesejahteraan warga.',
      'Membina dan meningkatkan perekonomian desa serta mengintegrasikannya dengan potensi BUMDes dan kelembagaan ekonomi rakyat.',
      'Mewakili desanya di dalam dan di luar pengadilan atau menunjuk kuasa hukum untuk bertindak atas nama Pemerintah Desa.',
      'Menyampaikan Laporan Penyelenggaraan Pemerintahan Desa (LPPD) kepada Bupati melalui Camat dan Laporan Keterangan Penyelenggaraan Pemerintahan Desa (LKPJ) kepada BPD pada setiap akhir tahun anggaran.'
    ],
    ruangLingkup: ['Kebijakan Strategis', 'Pengelolaan APBDes & Aset', 'Penetapan Perdes/Perkades', 'Trantibum Desa', 'LPPD & LKPJ Akhir Tahun'],
    colorBadge: 'bg-amber-100 text-amber-900 border-amber-300',
    keywords: ['kepala desa', 'kades', 'kebijakan', 'apbdes', 'perdes', 'lppd', 'lkpj', 'pimpinan', 'aset']
  },
  {
    id: 'sekdes',
    code: 'SEKDES',
    category: 'sekdes',
    categoryLabel: 'Pimpinan Sekretariat',
    jabatan: 'Sekretaris Desa',
    dasarHukum: 'Perbup Cilacap No. 132 Th 2023 Pasal 9 - 11',
    kedudukan: 'Pimpinan Sekretariat Desa yang bertugas membantu Kepala Desa dalam bidang administrasi pemerintahan dan bertindak selaku Koordinator Pelaksana Pengelolaan Keuangan Desa (PPKD).',
    tugasPokok: 'Membantu Kepala Desa dalam mengoordinasikan perumusan kebijakan, pengorganisasian tugas perangkat, pembinaan administrasi, dan pelayanan tata laksana pemerintahan desa.',
    fungsi: [
      'Melaksanakan urusan ketatausahaan, tata naskah dinas, administrasi surat-menyurat, kearsipan desa, dan ekspedisi.',
      'Melaksanakan urusan umum, penataan administrasi kepegawaian aparatur desa, penyediaan sarana kantor, penyiapan rapat dinas, dan pengadministrasian inventaris aset desa.',
      'Mengoordinasikan penyusunan rancangan APBDes, perubahan APBDes, dan laporan pertanggungjawaban realisasi APBDes.',
      'Melakukan verifikasi kelengkapan dan keabsahan bukti pengeluaran serta Surat Permintaan Pembayaran (SPP) dari para Kepala Seksi dan Kepala Urusan.',
      'Mengoordinasikan penyusunan dokumen perencanaan desa (RPJMDes dan RKPDes), profil desa, serta monitoring dan evaluasi pembangunan desa.',
      'Melaksanakan pembinaan dan pengawasan administratif terhadap tugas-tugas Kepala Urusan dan Kepala Seksi.'
    ],
    ruangLingkup: ['Koordinator PPKD', 'Verifikasi SPP & Anggaran', 'Tata Naskah & Arsip', 'Perencanaan RKPDes', 'Administrasi Aparatur'],
    colorBadge: 'bg-emerald-100 text-emerald-900 border-emerald-300',
    keywords: ['sekretaris desa', 'sekdes', 'ppkd', 'verifikasi', 'spp', 'administrasi', 'naskah dinas', 'rkpdes']
  },
  {
    id: 'kaur-tu',
    code: 'KAUR_TU',
    category: 'kaur',
    categoryLabel: 'Unsur Staf Sekretariat',
    jabatan: 'Kepala Urusan Tata Usaha & Umum',
    dasarHukum: 'Perbup Cilacap No. 132 Th 2023 Pasal 12 - 13',
    kedudukan: 'Unsur staf sekretariat desa di bawah pimpinan Sekretaris Desa yang membidangi tata usaha, kearsipan, dan perlengkapan umum.',
    tugasPokok: 'Membantu Sekretaris Desa dalam pelaksanaan ketatausahaan, pengelolaan naskah dinas, administrasi kepegawaian, sarana perlengkapan kantor, dan pelayanan umum.',
    fungsi: [
      'Mencatat, mengagendakan, mendistribusikan surat masuk dan surat keluar, serta menata kearsipan desa secara tertib dan aman.',
      'Mengelola tata naskah dinas dan format korespondensi kedinasan sesuai standar perundang-undangan.',
      'Menginventarisasi, memelihara, mencatat mutasi sarana prasarana, serta pemeliharaan aset kantor desa.',
      'Menyiapkan sarana prasarana, akomodasi, dan perlengkapan pelaksanaan rapat kedinasan, musyawarah, dan upacara resmi desa.',
      'Memberikan pelayanan administrasi umum, penerimaan kunjungan dinas, dan penataan arsip kepegawaian aparatur desa.'
    ],
    ruangLingkup: ['Agenda Surat Masuk/Keluar', 'Tata Naskah Dinas', 'Inventaris & Perlengkapan', 'Akomodasi Rapat', 'Kearsipan Umum'],
    colorBadge: 'bg-sky-100 text-sky-900 border-sky-300',
    keywords: ['tata usaha', 'umum', 'surat', 'arsip', 'naskah dinas', 'inventaris', 'rapat', 'sarana']
  },
  {
    id: 'kaur-keuangan',
    code: 'KAUR_KEU',
    category: 'kaur',
    categoryLabel: 'Unsur Staf Sekretariat',
    jabatan: 'Kepala Urusan Keuangan (Bendahara Desa)',
    dasarHukum: 'Perbup Cilacap No. 132 Th 2023 Pasal 14 - 15',
    kedudukan: 'Unsur staf sekretariat desa di bawah koordinasi Sekretaris Desa yang melaksanakan fungsi penatausahaan kas dan perbendaharaan desa.',
    tugasPokok: 'Membantu Sekretaris Desa dalam penatausahaan keuangan desa, penerimaan pendapatan, penyimpanan kas, penyetoran, dan pembukuan transaksi APBDes.',
    fungsi: [
      'Menyusun Rencana Anggaran Kas (RAK) desa berdasarkan Dokumen Pelaksanaan Anggaran (DPA) yang telah disahkan.',
      'Menerima, menyimpan, membukukan, dan menyetorkan seluruh penerimaan pendapatan asli desa maupun transfer dana (DD, ADD, BHP, BKK).',
      'Melaksanakan verifikasi teknis dan melakukan pembayaran atas beban APBDes yang telah diverifikasi Sekdes dan disetujui Kepala Desa.',
      'Menyelenggarakan pembukuan Buku Kas Umum (BKU), Buku Kas Pembantu Pajak, dan Buku Bank Desa secara real-time dan akurat.',
      'Memungut, memotong, dan menyetorkan pajak penghasilan (PPh), PPN, dan pajak daerah lainnya ke kas negara dan kas daerah tepat waktu.',
      'Menyusun laporan pertanggungjawaban kas harian/bulanan serta menyiapkan bahan laporan realisasi APBDes berkala.'
    ],
    ruangLingkup: ['Bendahara Desa', 'Buku Kas Umum (BKU)', 'Pembayaran & SPP', 'Pungut & Setor Pajak', 'Rekonsiliasi Bank Desa'],
    colorBadge: 'bg-blue-100 text-blue-900 border-blue-300',
    keywords: ['keuangan', 'bendahara', 'kas', 'bku', 'pajak', 'spp', 'bank', 'anggaran', 'apbdes']
  },
  {
    id: 'kaur-perencanaan',
    code: 'KAUR_REN',
    category: 'kaur',
    categoryLabel: 'Unsur Staf Sekretariat',
    jabatan: 'Kepala Urusan Perencanaan',
    dasarHukum: 'Perbup Cilacap No. 132 Th 2023 Pasal 16 - 17',
    kedudukan: 'Unsur staf sekretariat desa di bawah koordinasi Sekretaris Desa yang membidangi perencanaan pembangunan, data statistik, dan evaluasi program.',
    tugasPokok: 'Membantu Sekretaris Desa dalam urusan perencanaan pembangunan desa, pengumpulan dan analisis data potensi desa, serta monitoring dan evaluasi hasil pembangunan.',
    fungsi: [
      'Mengoordinasikan persiapan bahan musyawarah dusun (Musdus) dan musyawarah desa (Musdes) perencanaan pembangunan desa.',
      'Menyiapkan draf dokumen Rencana Pembangunan Jangka Menengah Desa (RPJMDes) dan Rencana Kerja Pemerintah Desa (RKPDes).',
      'Menginventarisasi usulan program dan kegiatan prioritas pembangunan dari tingkat RT, RW, dan Dusun.',
      'Mengompilasi dan mengelola database Profil Desa, data Monografi Desa, serta data indikator Indeks Desa Membangun (IDM).',
      'Melakukan monitoring, evaluasi berkala capaian program pembangunan desa, serta menyusun laporan perkembangan realisasi program.'
    ],
    ruangLingkup: ['RPJMDes & RKPDes', 'Musrenbangdes', 'Profil Desa & IDM', 'Monitoring Program', 'Evaluasi Capaian'],
    colorBadge: 'bg-indigo-100 text-indigo-900 border-indigo-300',
    keywords: ['perencanaan', 'rkpdes', 'rpjmdes', 'musrenbang', 'profil desa', 'idm', 'monitoring', 'evaluasi']
  },
  {
    id: 'kasi-pemerintahan',
    code: 'KASI_PEM',
    category: 'kasi',
    categoryLabel: 'Pelaksana Teknis',
    jabatan: 'Kepala Seksi Pemerintahan',
    dasarHukum: 'Perbup Cilacap No. 132 Th 2023 Pasal 18 - 20',
    kedudukan: 'Unsur pelaksana teknis operasional pembantu Kepala Desa di bidang tata praja pemerintahan desa, pertanahan, kependudukan, dan ketertiban.',
    tugasPokok: 'Membantu Kepala Desa dalam melaksanakan manajemen tata praja pemerintahan, administrasi kependudukan, pembinaan ketenteraman, pertanahan, dan penegakan regulasi desa.',
    fungsi: [
      'Melaksanakan manajemen pelayanan administrasi kependudukan (KTP, KK, Surat Pindah, Akta Kelahiran/Kematian, dan Surat Keterangan Domisili).',
      'Menyusun rancangan regulasi desa (Peraturan Desa, Peraturan Bersama Kades, dan Keputusan Kepala Desa) di bidang pemerintahan.',
      'Melaksanakan pembinaan ketenteraman, ketertiban umum masyarakat desa (Trantibum), serta pengoordinasian Satuan Perlindungan Masyarakat (Satlinmas).',
      'Mengelola administrasi pertanahan desa (Buku Letter C, pencatatan mutasi tanah, penerbitan surat keterangan hibah/waris, dan mediasi sengketa batas tanah).',
      'Melaksanakan pembinaan dan penataan kelembagaan Rukun Tetangga (RT), Rukun Warga (RW), dan lembaga kemasyarakatan bidang pemerintahan.',
      'Mengelola dan memperbarui data batas wilayah desa, peta blok desa, dan monografi pemerintahan desa.'
    ],
    ruangLingkup: ['Administrasi Kependudukan', 'Pertanahan (Letter C)', 'Trantibum & Satlinmas', 'Perancangan Perdes', 'Pembinaan RT/RW'],
    colorBadge: 'bg-purple-100 text-purple-900 border-purple-300',
    keywords: ['pemerintahan', 'kependudukan', 'ktp', 'kk', 'letter c', 'tanah', 'trantibum', 'linmas', 'rt', 'rw', 'perdes']
  },
  {
    id: 'kasi-kesejahteraan',
    code: 'KASI_KESRA',
    category: 'kasi',
    categoryLabel: 'Pelaksana Teknis',
    jabatan: 'Kepala Seksi Kesejahteraan',
    dasarHukum: 'Perbup Cilacap No. 132 Th 2023 Pasal 21 - 23',
    kedudukan: 'Unsur pelaksana teknis operasional pembantu Kepala Desa di bidang pembangunan infrastruktur sarpras, pemberdayaan ekonomi, dan kesejahteraan masyarakat.',
    tugasPokok: 'Membantu Kepala Desa dalam pengelolaan pembangunan sarana prasarana fisik desa, pembinaan ekonomi perdesaan, pendidikan, kesehatan, dan kelestarian lingkungan.',
    fungsi: [
      'Merencanakan, mengawasi, dan mengoordinasikan pembangunan serta pemeliharaan sarana prasarana fisik desa (jalan desa, jembatan, drainase, talud, irigasi).',
      'Bertindak sebagai koordinator atau Tim Pelaksana Kegiatan (TPK) bidang pembangunan infrastruktur dan kegiatan fisik APBDes.',
      'Mengelola dan memfasilitasi program peningkatan sarana pendidikan desa, PAUD, serta sarana kesehatan (Posyandu dan Pos Kesehatan Desa).',
      'Memfasilitasi program ketahanan pangan desa, pertanian, peternakan, perikanan, serta pengembangan Badan Usaha Milik Desa (BUMDes).',
      'Melaksanakan sosialisasi dan pemberdayaan masyarakat dalam pengelolaan lingkungan hidup, sanitasi, kebersihan, dan mitigasi kebencanaan.'
    ],
    ruangLingkup: ['Pembangunan Sarpras Jalan/Drainase', 'Ketua TPK Fisik', 'Kesehatan & Pendidikan', 'Ketahanan Pangan & BUMDes', 'Lingkungan Hidup'],
    colorBadge: 'bg-teal-100 text-teal-900 border-teal-300',
    keywords: ['kesejahteraan', 'kesra', 'pembangunan', 'infrastruktur', 'jalan', 'sarpras', 'tpk', 'bumdes', 'pertanian', 'kesehatan']
  },
  {
    id: 'kasi-pelayanan',
    code: 'KASI_YAN',
    category: 'kasi',
    categoryLabel: 'Pelaksana Teknis',
    jabatan: 'Kepala Seksi Pelayanan',
    dasarHukum: 'Perbup Cilacap No. 132 Th 2023 Pasal 24 - 26',
    kedudukan: 'Unsur pelaksana teknis operasional pembantu Kepala Desa di bidang pelayanan sosial kemasyarakatan, kepemudaan, keagamaan, dan budaya.',
    tugasPokok: 'Membantu Kepala Desa dalam melaksanakan pelayanan publik langsung kepada masyarakat, pembinaan pemuda, olahraga, seni budaya, keagamaan, dan perlindungan sosial.',
    fungsi: [
      'Mengoordinasikan loket pelayanan administrasi umum terpadu dan penerbitan surat pengantar atau keterangan kemasyarakatan bagi warga.',
      'Melaksanakan pembinaan, bimbingan, dan fasilitasi kegiatan kepemudaan, Karang Taruna, dan keolahragaan desa.',
      'Membina kerukunan umat beragama, kegiatan majelis taklim, peribadatan, serta pelestarian adat istiadat dan seni budaya lokal.',
      'Mengoordinasikan pendataan, verifikasi, dan validasi data kemiskinan (DTKS), penerima bantuan sosial (BLT, PKH, BPNT), lansia, dan penyandang disabilitas.',
      'Memfasilitasi kegiatan pemberdayaan perempuan dan perlindungan anak (PPPA), PKK, serta pencegahan dan penanganan stunting di desa.'
    ],
    ruangLingkup: ['Pelayanan Surat Warga', 'Karang Taruna & Olahraga', 'Keagamaan & Budaya', 'Bansos & Data Kemiskinan', 'PKK & Penanganan Stunting'],
    colorBadge: 'bg-rose-100 text-rose-900 border-rose-300',
    keywords: ['pelayanan', 'surat', 'karang taruna', 'pemuda', 'agama', 'budaya', 'bansos', 'dtks', 'blt', 'stunting', 'pkk']
  },
  {
    id: 'kadus',
    code: 'KADUS',
    category: 'kadus',
    categoryLabel: 'Pelaksana Kewilayahan',
    jabatan: 'Kepala Dusun (Pelaksana Kewilayahan)',
    dasarHukum: 'Perbup Cilacap No. 132 Th 2023 Pasal 27 - 29',
    kedudukan: 'Unsur pelaksana kewilayahan yang berkedudukan di bawah dan bertanggung jawab langsung kepada Kepala Desa di wilayah dusun binaannya.',
    tugasPokok: 'Membantu Kepala Desa dalam pelaksanaan tugas penyelenggaraan pemerintahan, pembangunan, pembinaan ketenteraman, dan pemberdayaan masyarakat di wilayah dusun.',
    fungsi: [
      'Membina ketenteraman, ketertiban umum, dan kerukunan warga masyarakat di wilayah dusun binaannya.',
      'Menggerakkan partisipasi, swadaya gotong royong warga dusun dalam pelaksanaan pembangunan sarana prasarana dusun.',
      'Menyosialisasikan kebijakan, program pemerintah desa, serta peraturan perundang-undangan kepada seluruh warga dusun.',
      'Menampung, menghimpun, dan menyalurkan aspirasi, kebutuhan, dan keluhan warga dusun kepada Kepala Desa.',
      'Membantu penarikan Pajak Bumi dan Bangunan (PBB-P2) serta retribusi desa yang menjadi kewajiban warga dusun.'
    ],
    ruangLingkup: ['Ketenteraman Wilayah Dusun', 'Gotong Royong & Swadaya', 'Sosialisasi Kebijakan', 'Penjaringan Aspirasi', 'Pengawasan PBB Dusun'],
    colorBadge: 'bg-emerald-100 text-emerald-900 border-emerald-300',
    keywords: ['kadus', 'kepala dusun', 'dusun', 'wilayah', 'gotong royong', 'swadaya', 'pbb', 'warga']
  },
  {
    id: 'bpd',
    code: 'BPD',
    category: 'bpd',
    categoryLabel: 'Lembaga Mitra Pengawasan',
    jabatan: 'Badan Permusyawaratan Desa (BPD)',
    dasarHukum: 'Permendagri No. 110 Th 2016 & Perda Cilacap terkait BPD',
    kedudukan: 'Lembaga permusyawaratan desa yang berkedudukan sebagai mitra kerja sejajar Pemerintah Desa dalam penyelenggaraan pemerintahan desa.',
    tugasPokok: 'Membahas dan menyepakati rancangan Perdes bersama Kades, menampung dan menyalurkan aspirasi masyarakat, serta mengawasi kinerja Kades.',
    fungsi: [
      'Menggali, menampung, menghimpun, mengelola, dan menyalurkan aspirasi masyarakat desa.',
      'Membahas dan menyepakati Rancangan Peraturan Desa (Perdes) bersama Kepala Desa.',
      'Melaksanakan pengawasan terhadap kinerja Kepala Desa dan pelaksanaan APBDes.',
      'Melakukan evaluasi terhadap Laporan Keterangan Penyelenggaraan Pemerintahan Desa (LKPJ).'
    ],
    ruangLingkup: ['Legislasi Desa', 'Pengawasan APBDes', 'Penjaringan Aspirasi', 'Musyawarah Desa'],
    colorBadge: 'bg-slate-100 text-slate-800 border-slate-300',
    keywords: ['bpd', 'permusyawaratan', 'pengawasan', 'aspirasi', 'legislasi', 'musdes']
  }
];

// ─────────────────────────────────────────────────────────────────────────────
// KOMPONEN UTAMA: STRUKTUR ORGANISASI & TUPOKSI TAB
// ─────────────────────────────────────────────────────────────────────────────

function StrukturOrganisasiTupoksiTab({
  officials = [],
  bpdOfficials = [],
  isLoading = false
}: {
  officials: Official[];
  bpdOfficials: Official[];
  isLoading?: boolean;
}) {
  const [subView, setSubView] = useState<'bagan' | 'tupoksi' | 'direktori'>('bagan');
  const [baganZoom, setBaganZoom] = useState<number>(1);
  const [searchTupoksi, setSearchTupoksi] = useState('');
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>('all');
  const [expandedTupoksiId, setExpandedTupoksiId] = useState<string | null>('kades');

  // Match officials by keywords with robust fallback
  const matchOfficial = (keywords: string[]) => {
    return officials.find(o => {
      const pos = (o.position || '').toLowerCase();
      return keywords.some(k => pos.includes(k.toLowerCase()));
    });
  };

  const matchOfficials = (keywords: string[]) => {
    return officials.filter(o => {
      const pos = (o.position || '').toLowerCase();
      return keywords.some(k => pos.includes(k.toLowerCase()));
    });
  };

  // Roles in SOTK Sampeldes matching real officials from database
  const kades = officials.find(o => {
    const pos = (o.position || '').toLowerCase();
    return pos.includes('kepala desa') || pos === 'kades';
  }) || matchOfficial(['kepala desa', 'kades']);

  const bpdLeader = bpdOfficials.find(o => o.position?.toLowerCase().includes('ketua')) || bpdOfficials[0];

  const sekdes = officials.find(o => {
    const pos = (o.position || '').toLowerCase();
    return pos.includes('sekretaris');
  }) || matchOfficial(['sekretaris desa', 'sekdes']);

  const kasiPem = officials.find(o => {
    const pos = (o.position || '').toLowerCase();
    return pos.includes('pemerintahan') && !pos.includes('staf');
  }) || matchOfficial(['kasi pemerintahan', 'pemerintahan']);

  const kasiKesra = officials.find(o => {
    const pos = (o.position || '').toLowerCase();
    return pos.includes('kesejahteraan') && !pos.includes('staf');
  }) || matchOfficial(['kasi kesejahteraan', 'kesejahteraan', 'kesra']);

  const kasiYan = officials.find(o => {
    const pos = (o.position || '').toLowerCase();
    return pos.includes('pelayanan') && !pos.includes('staf');
  }) || matchOfficial(['kasi pelayanan', 'pelayanan']);

  const kaurTU = officials.find(o => {
    const pos = (o.position || '').toLowerCase();
    return (pos.includes('tata usaha') || pos.includes('umum')) && !pos.includes('staf') && !pos.includes('perencanaan');
  }) || officials.find(o => {
    const pos = (o.position || '').toLowerCase();
    return (pos.includes('umum') || pos.includes('tu')) && !pos.includes('staf');
  }) || officials.find(o => (o.position || '').toLowerCase().includes('umum'));

  const kaurKeu = officials.find(o => {
    const pos = (o.position || '').toLowerCase();
    return (pos.includes('keuangan') || pos.includes('bendahara')) && !pos.includes('staf');
  }) || matchOfficial(['kaur keuangan', 'keuangan', 'bendahara']);

  const kaurRen = officials.find(o => {
    const pos = (o.position || '').toLowerCase();
    return pos.includes('perencanaan') && !pos.includes('staf') && !pos.includes('umum');
  }) || officials.find(o => {
    const pos = (o.position || '').toLowerCase();
    return pos.includes('perencanaan') && o.name !== kaurTU?.name;
  });

  const kadusList = officials.filter(o => {
    const pos = (o.position || '').toLowerCase();
    return pos.includes('kadus') || pos.includes('kepala dusun');
  });

  const kadus1 = kadusList.find(k => (k.position || '').toLowerCase().includes('ciloning')) || kadusList[0] || { position: 'KEPALA DUSUN CILONING', name: 'SUBRONTO' };
  const kadus2 = kadusList.find(k => (k.position || '').toLowerCase().includes('pengampiran')) || kadusList[1] || { position: 'KEPALA DUSUN PENGAMPIRAN', name: 'TEGUH PURNAMA' };

  // Pemetaan Staf per Seksi dan Kaur sesuai data riil /profil-desa
  const stafPemList = officials.filter(o => {
    const pos = (o.position || '').toLowerCase();
    return pos.includes('staf') && pos.includes('pemerintahan');
  });
  const stafPem1 = stafPemList[0] || { position: 'STAF SEKSI PEMERINTAHAN', name: 'MUSLIKHUDIN' };
  const stafPem2 = stafPemList[1] || { position: 'STAF SEKSI PEMERINTAHAN', name: 'SUYONO POL' };

  const stafKesraList = officials.filter(o => {
    const pos = (o.position || '').toLowerCase();
    return pos.includes('staf') && (pos.includes('kesejahteraan') || pos.includes('kesra'));
  });
  const stafKesra1 = stafKesraList[0] || { position: 'STAF SEKSI KESEJAHTERAAN', name: 'SAMSIYAH' };
  const stafKesra2 = stafKesraList[1] || { position: 'STAF SEKSI KESEJAHTERAAN', name: 'FITRIA ANI WALJINAH' };

  const stafYanList = officials.filter(o => {
    const pos = (o.position || '').toLowerCase();
    return pos.includes('staf') && pos.includes('pelayanan');
  });
  const stafYan1 = stafYanList[0] || { position: 'STAF SEKSI PELAYANAN', name: 'M IMRON MUBAKIR' };
  const stafYan2 = stafYanList[1] || { position: 'STAF SEKSI PELAYANAN', name: "MUHAMAD MA'SUM" };

  const stafTUList = officials.filter(o => {
    const pos = (o.position || '').toLowerCase();
    return pos.includes('staf') && (pos.includes('tata usaha') || pos.includes('umum'));
  });
  const stafTU1 = stafTUList[0] || { position: 'STAF UMUM & PERENCANAAN', name: 'SUYONO' };

  const stafKeuList = officials.filter(o => {
    const pos = (o.position || '').toLowerCase();
    return pos.includes('staf') && pos.includes('keuangan');
  });
  const stafKeu1 = stafKeuList[0] || { position: 'STAF URUSAN KEUANGAN', name: 'NANI YUNINGSIH' };

  const stafRenList = officials.filter(o => {
    const pos = (o.position || '').toLowerCase();
    return pos.includes('staf') && pos.includes('perencanaan');
  });
  const stafRen1 = stafRenList.find(s => s.name !== stafTU1.name) || stafRenList[0] || { position: 'STAF PERENCANAAN', name: '-' };

  const stafList = matchOfficials(['staf', 'staff']);

  // Handle jump from chart node to Tupoksi
  const handleJumpToTupoksi = (tupoksiId: string) => {
    setSubView('tupoksi');
    setExpandedTupoksiId(tupoksiId);
    setTimeout(() => {
      const el = document.getElementById(`tupoksi-card-${tupoksiId}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 150);
  };

  // Filtered Tupoksi
  const filteredTupoksi = useMemo(() => {
    return TUPOKSI_DATA.filter(item => {
      const matchCat = activeCategoryFilter === 'all' || item.category === activeCategoryFilter;
      if (!matchCat) return false;
      if (!searchTupoksi.trim()) return true;
      const q = searchTupoksi.toLowerCase();
      return (
        item.jabatan.toLowerCase().includes(q) ||
        item.tugasPokok.toLowerCase().includes(q) ||
        item.keywords.some(k => k.includes(q)) ||
        item.fungsi.some(f => f.toLowerCase().includes(q)) ||
        item.ruangLingkup.some(r => r.toLowerCase().includes(q))
      );
    });
  }, [activeCategoryFilter, searchTupoksi]);

  // Helper untuk mendapatkan official terkait tiap tupoksi item
  const getOfficialForTupoksi = (tupoksiId: string) => {
    switch (tupoksiId) {
      case 'kades': return kades;
      case 'sekdes': return sekdes;
      case 'kaur-tu': return kaurTU;
      case 'kaur-keuangan': return kaurKeu;
      case 'kaur-perencanaan': return kaurRen;
      case 'kasi-pemerintahan': return kasiPem;
      case 'kasi-kesejahteraan': return kasiKesra;
      case 'kasi-pelayanan': return kasiYan;
      case 'bpd': return bpdLeader;
      default: return undefined;
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8 min-w-0">
      {/* ─── BANNER HEADER SOTK ─── */}
      <div className="neu-card-elevated-dark rounded-[28px] p-5 sm:p-8 text-white relative overflow-hidden border border-white/10 shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] sm:text-xs font-condensed font-bold bg-teal-500/20 text-teal-400 border border-teal-500/30 px-3 py-1 rounded-full uppercase tracking-wider inline-flex items-center gap-1.5">
                <Landmark className="h-3 w-3" />
                SOTK Pemerintah Desa Sampeldes
              </span>
              <span className="text-[10px] sm:text-xs font-condensed font-bold bg-white/10 text-white border border-white/20 px-3 py-1 rounded-full uppercase tracking-wider">
                Perbup Cilacap No. 132 Tahun 2023
              </span>
            </div>
            <h2 className="text-xl min-[380px]:text-2xl sm:text-3xl md:text-4xl font-condensed font-bold uppercase tracking-tight text-white leading-tight">
              Struktur Organisasi &amp; Tupoksi
            </h2>
            <p className="text-xs sm:text-sm text-stone-300 max-w-2xl font-medium leading-relaxed">
              Bagan tata kerja dan rincian tugas pokok serta fungsi perangkat desa berdasarkan Peraturan Bupati Cilacap Nomor 132 Tahun 2023 demi pelayanan publik prima dan akuntabel.
            </p>
          </div>

          {/* Navigasi Sub-Tab View */}
          <div className="flex items-center gap-1.5 p-1.5 rounded-2xl bg-black/40 border border-white/10 shrink-0 self-start md:self-center flex-wrap">
            <button
              onClick={() => setSubView('bagan')}
              className={cn(
                "px-3.5 py-2 rounded-xl text-xs font-condensed font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5",
                subView === 'bagan'
                  ? "bg-teal-500 text-slate-950 shadow-sm"
                  : "text-stone-300 hover:text-white"
              )}
            >
              <Network className="h-3.5 w-3.5" />
              <span>Bagan Struktur</span>
            </button>
            <button
              onClick={() => setSubView('tupoksi')}
              className={cn(
                "px-3.5 py-2 rounded-xl text-xs font-condensed font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5",
                subView === 'tupoksi'
                  ? "bg-teal-500 text-slate-950 shadow-sm"
                  : "text-stone-300 hover:text-white"
              )}
            >
              <BookOpen className="h-3.5 w-3.5" />
              <span>Rincian Tupoksi</span>
            </button>
            <button
              onClick={() => setSubView('direktori')}
              className={cn(
                "px-3.5 py-2 rounded-xl text-xs font-condensed font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5",
                subView === 'direktori'
                  ? "bg-teal-500 text-slate-950 shadow-sm"
                  : "text-stone-300 hover:text-white"
              )}
            >
              <Users className="h-3.5 w-3.5" />
              <span>Daftar Personel ({officials.length})</span>
            </button>
          </div>
        </div>
      </div>

      {/* ─── VIEW 1: BAGAN STRUKTUR ORGANISASI VISUAL (SESUAI GAMBAR RESMI SOTK) ─── */}
      {subView === 'bagan' && (
        <div className="space-y-6">
          <div className="neu-card-elevated rounded-[28px] p-4 sm:p-7 border border-white/80 space-y-5">
            {/* Toolbar Controls */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-black/5">
              <div>
                <h3 className="text-base sm:text-xl font-condensed font-bold text-slate-900 uppercase tracking-tight flex items-center gap-2">
                  <Network className="h-5 w-5 text-emerald-700" />
                  Bagan Struktur Organisasi Pemerintah Desa
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  Susunan Organisasi dan Tata Kerja (SOTK) sesuai Peraturan Bupati Cilacap Nomor 132 Tahun 2023
                </p>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {/* Zoom Controller */}
                <div className="flex items-center gap-1 neu-inset p-1 rounded-2xl">
                  <button
                    type="button"
                    onClick={() => setBaganZoom(prev => Math.max(0.6, Number((prev - 0.1).toFixed(1))))}
                    className="w-7 h-7 rounded-xl neu-btn flex items-center justify-center text-xs font-bold text-slate-700 cursor-pointer"
                    title="Perkecil Bagan"
                  >
                    -
                  </button>
                  <span className="text-[11px] font-mono font-bold px-2 text-slate-800 min-w-[44px] text-center">
                    {Math.round(baganZoom * 100)}%
                  </span>
                  <button
                    type="button"
                    onClick={() => setBaganZoom(prev => Math.min(1.4, Number((prev + 0.1).toFixed(1))))}
                    className="w-7 h-7 rounded-xl neu-btn flex items-center justify-center text-xs font-bold text-slate-700 cursor-pointer"
                    title="Perbesar Bagan"
                  >
                    +
                  </button>
                  <button
                    type="button"
                    onClick={() => setBaganZoom(1)}
                    className="text-[10px] font-condensed font-bold px-2.5 py-1 rounded-xl neu-btn text-slate-700 cursor-pointer ml-0.5"
                    title="Reset Ukuran"
                  >
                    100%
                  </button>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.print()}
                  className="neu-pill h-8 text-[11px] font-bold rounded-xl gap-1.5 text-slate-700 hover:text-slate-950"
                >
                  <Printer className="h-3.5 w-3.5 text-slate-600" />
                  <span>Cetak Bagan</span>
                </Button>
                <Button
                  size="sm"
                  onClick={() => {
                    const el = document.getElementById('tupoksi-section');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="neu-btn-gold h-8 text-[11px] font-bold rounded-xl gap-1.5 text-slate-950 shadow-sm border-0"
                >
                  <BookOpen className="h-3.5 w-3.5" />
                  <span>Rincian Tupoksi</span>
                </Button>
              </div>
            </div>

            {/* Hint pan horizontal di HP */}
            <div className="block lg:hidden text-center">
              <span className="text-[10.5px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-3.5 py-1 rounded-full border border-emerald-200 inline-flex items-center gap-1.5 shadow-xs">
                <ChevronRight className="h-3 w-3 animate-pulse text-emerald-600" />
                Geser ke samping untuk melihat bagan horizontal secara lengkap
              </span>
            </div>

            {/* Canvas Bagan Format Sesuai Tema Neumorphic WebSampeldes */}
            <div className="overflow-x-auto pb-6 pt-2 -mx-2 sm:mx-0 scrollbar-thin">
              <div
                style={{ transform: `scale(${baganZoom})`, transformOrigin: 'top center' }}
                className="transition-transform duration-200 ease-out"
              >
                <div className="w-[1160px] mx-auto neu-card-elevated rounded-[32px] border border-white/90 relative overflow-hidden p-6 sm:p-10 select-none bg-gradient-to-b from-slate-50 via-slate-100 to-slate-200 dark:from-[#081d27] dark:via-[#07131b] dark:to-[#060b11]">

                  {/* Left natural geometric emerald accents */}
                  <div className="absolute left-0 top-0 bottom-0 w-36 pointer-events-none overflow-hidden z-0">
                    <svg viewBox="0 0 160 850" className="w-full h-full object-cover" preserveAspectRatio="none">
                      <polygon points="0,0 160,0 0,220" fill="#064e3b" opacity="0.12" />
                      <polygon points="0,150 140,280 0,420" fill="#047857" opacity="0.10" />
                      <polygon points="0,380 160,520 0,660" fill="#059669" opacity="0.08" />
                      <polygon points="0,600 120,720 0,850" fill="#10b981" opacity="0.10" />
                      <polygon points="0,0 60,300 0,600" fill="#00a884" opacity="0.12" />
                    </svg>
                  </div>

                  {/* Right natural geometric emerald accents */}
                  <div className="absolute right-0 top-0 bottom-0 w-36 pointer-events-none overflow-hidden z-0">
                    <svg viewBox="0 0 160 850" className="w-full h-full object-cover" preserveAspectRatio="none">
                      <polygon points="160,0 0,0 160,220" fill="#064e3b" opacity="0.12" />
                      <polygon points="160,150 20,280 160,420" fill="#047857" opacity="0.10" />
                      <polygon points="160,380 0,520 160,660" fill="#059669" opacity="0.08" />
                      <polygon points="160,600 40,720 160,850" fill="#10b981" opacity="0.10" />
                      <polygon points="160,0 100,300 160,600" fill="#00a884" opacity="0.12" />
                    </svg>
                  </div>

                  {/* Top Center: Logo & Judul Bagan Sesuai Tema */}
                  <div className="relative z-10 flex flex-col items-center justify-center text-center pb-5">
                    <div className="w-16 h-16 rounded-full neu-convex p-2 shadow-sm border border-white flex items-center justify-center mb-2.5">
                      <Logo />
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-condensed font-black tracking-tight text-slate-900 uppercase leading-none">
                      STRUKTUR ORGANISASI DAN TATA KERJA PEMERINTAH DESA SAMPELDES
                    </h2>
                    <p className="text-xs font-condensed font-bold tracking-widest text-slate-600 uppercase mt-2">
                      KECAMATAN GANDRUNGMANGU &bull; KABUPATEN CILACAP
                    </p>
                    <span className="text-[10.5px] font-mono font-bold text-emerald-900 bg-emerald-500/15 px-3.5 py-1 rounded-full border border-emerald-600/30 uppercase mt-2 shadow-xs">
                      Peraturan Bupati Cilacap Nomor 132 Tahun 2023
                    </span>

                    {/* Keterangan Hierarki & Warna / Legend */}
                    <div className="flex items-center justify-center gap-2 sm:gap-3 flex-wrap mt-3.5 pt-2.5 border-t border-slate-300/40">
                      <div className="flex items-center gap-1.5 px-3 py-1 rounded-full neu-pill text-[10.5px] font-bold text-slate-800">
                        <span className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-amber-600 to-amber-500 shadow-xs" />
                        <span>Pimpinan (Kades)</span>
                      </div>
                      <div className="flex items-center gap-1.5 px-3 py-1 rounded-full neu-pill text-[10.5px] font-bold text-slate-800">
                        <span className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-slate-900 to-slate-800 shadow-xs" />
                        <span>Sekretariat (Sekdes &amp; Kaur)</span>
                      </div>
                      <div className="flex items-center gap-1.5 px-3 py-1 rounded-full neu-pill text-[10.5px] font-bold text-slate-800">
                        <span className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-emerald-800 to-emerald-700 shadow-xs" />
                        <span>Pelaksana Teknis (Kasi)</span>
                      </div>
                      <div className="flex items-center gap-1.5 px-3 py-1 rounded-full neu-pill text-[10.5px] font-bold text-slate-800">
                        <span className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-teal-950 to-teal-800 shadow-xs" />
                        <span>Pelaksana Kewilayahan (Kadus)</span>
                      </div>
                      <div className="flex items-center gap-1.5 px-3 py-1 rounded-full neu-pill text-[10.5px] font-bold text-slate-800">
                        <span className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-teal-700 to-emerald-600 shadow-xs" />
                        <span>Staf Pembantu (Seksi &amp; Urusan)</span>
                      </div>
                    </div>
                  </div>

                  {/* Area Koordinat Bagan Visual & Garis Penghubung SOTK */}
                  <div className="relative z-10 w-[1100px] h-[1050px] mx-auto mt-2">
                    {/* SVG Connector Lines Layer */}
                    <svg className="absolute inset-0 w-full h-full pointer-events-none z-0" viewBox="0 0 1100 1050">
                      {/* Glow/Shadow under lines */}
                      <g stroke="#ffffff" strokeWidth="5.5" opacity="0.8" strokeLinecap="round" strokeLinejoin="round">
                        {/* 1. Kades vertikal turun ke bar Kadus di y=815 */}
                        <line x1="550" y1="180" x2="550" y2="815" />
                        {/* 2. Sekdes horizontal */}
                        <line x1="550" y1="115" x2="750" y2="115" />
                        {/* 3. Sekdes ke bar Kaur */}
                        <line x1="835" y1="205" x2="835" y2="235" />
                        <line x1="660" y1="235" x2="1010" y2="235" />
                        <line x1="660" y1="235" x2="660" y2="265" />
                        <line x1="835" y1="235" x2="835" y2="265" />
                        <line x1="1010" y1="235" x2="1010" y2="265" />
                        {/* 4. Bar Kasi */}
                        <line x1="110" y1="235" x2="550" y2="235" />
                        <line x1="110" y1="235" x2="110" y2="265" />
                        <line x1="285" y1="235" x2="285" y2="265" />
                        <line x1="460" y1="235" x2="460" y2="265" />
                        {/* 5. Drop line ke Staf Baris 1 (y=440 ke y=465) */}
                        <line x1="110" y1="440" x2="110" y2="465" />
                        <line x1="285" y1="440" x2="285" y2="465" />
                        <line x1="460" y1="440" x2="460" y2="465" />
                        <line x1="660" y1="440" x2="660" y2="465" />
                        <line x1="835" y1="440" x2="835" y2="465" />
                        <line x1="1010" y1="440" x2="1010" y2="465" />
                        {/* 6. Drop line ke Staf Baris 2 (y=610 ke y=635) untuk 3 Kasi */}
                        <line x1="110" y1="610" x2="110" y2="635" />
                        <line x1="285" y1="610" x2="285" y2="635" />
                        <line x1="460" y1="610" x2="460" y2="635" />
                        {/* 7. Bar distribusi Kadus (y=815) dan drop ke 2 Kadus (x=370 dan x=730) */}
                        <line x1="370" y1="815" x2="730" y2="815" />
                        <line x1="370" y1="815" x2="370" y2="845" />
                        <line x1="730" y1="815" x2="730" y2="845" />
                      </g>

                      {/* Main Emerald Connecting Lines */}
                      <g stroke="#059669" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        {/* 1. Garis vertikal utama dari Kades (x=550, y=180) turun ke bar Kadus (y=815) */}
                        <line x1="550" y1="180" x2="550" y2="815" />

                        {/* 2. Cabang horizontal ke Sekdes: dari garis vertikal (x=550, y=115) ke kartu Sekdes (x=750, y=115) */}
                        <line x1="550" y1="115" x2="750" y2="115" />

                        {/* 3. Garis vertikal turun dari Sekdes (x=835, y=205) ke bar horizontal Kaur (y=235) */}
                        <line x1="835" y1="205" x2="835" y2="235" />

                        {/* 4. Bar horizontal distribusi Kaur: dari Kaur TU (x=660) sampai Kaur Perencanaan (x=1010) di y=235 */}
                        <line x1="660" y1="235" x2="1010" y2="235" />

                        {/* 5. Tiga garis vertikal turun ke masing-masing kartu Kaur */}
                        <line x1="660" y1="235" x2="660" y2="265" />
                        <line x1="835" y1="235" x2="835" y2="265" />
                        <line x1="1010" y1="235" x2="1010" y2="265" />

                        {/* 6. Bar horizontal distribusi Kasi: cabang ke kiri dari garis utama (x=550, y=235) ke Kasi Pem (x=110, y=235) */}
                        <line x1="110" y1="235" x2="550" y2="235" />

                        {/* 7. Tiga garis vertikal turun ke masing-masing kartu Kasi */}
                        <line x1="110" y1="235" x2="110" y2="265" />
                        <line x1="285" y1="235" x2="285" y2="265" />
                        <line x1="460" y1="235" x2="460" y2="265" />

                        {/* 8. Garis penghubung Kasi & Kaur turun ke Staf Baris 1 */}
                        <line x1="110" y1="440" x2="110" y2="465" />
                        <line x1="285" y1="440" x2="285" y2="465" />
                        <line x1="460" y1="440" x2="460" y2="465" />
                        <line x1="660" y1="440" x2="660" y2="465" />
                        <line x1="835" y1="440" x2="835" y2="465" />
                        <line x1="1010" y1="440" x2="1010" y2="465" />

                        {/* 9. Garis penghubung Staf Baris 1 turun ke Staf Baris 2 (untuk 3 Kasi) */}
                        <line x1="110" y1="610" x2="110" y2="635" />
                        <line x1="285" y1="610" x2="285" y2="635" />
                        <line x1="460" y1="610" x2="460" y2="635" />

                        {/* 10. Bar horizontal distribusi Kadus di tingkat kewilayahan (y=815, dari x=370 sampai x=730) */}
                        <line x1="370" y1="815" x2="730" y2="815" />

                        {/* 11. Dua garis vertikal turun ke masing-masing kartu Kadus resmi */}
                        <line x1="370" y1="815" x2="370" y2="845" />
                        <line x1="730" y1="815" x2="730" y2="845" />
                      </g>

                      {/* Junction Circles / Dots */}
                      <g fill="#047857" stroke="#ffffff" strokeWidth="1.5">
                        <circle cx="550" cy="115" r="4" />
                        <circle cx="550" cy="235" r="4" />
                        <circle cx="835" cy="235" r="4" />
                        <circle cx="550" cy="815" r="4" />
                        <circle cx="110" cy="235" r="3" />
                        <circle cx="285" cy="235" r="3" />
                        <circle cx="460" cy="235" r="3" />
                        <circle cx="660" cy="235" r="3" />
                        <circle cx="1010" cy="235" r="3" />
                        {/* Staff baris 1 dots */}
                        <circle cx="110" cy="452" r="3" />
                        <circle cx="285" cy="452" r="3" />
                        <circle cx="460" cy="452" r="3" />
                        <circle cx="660" cy="452" r="3" />
                        <circle cx="835" cy="452" r="3" />
                        <circle cx="1010" cy="452" r="3" />
                        {/* Staff baris 2 dots */}
                        <circle cx="110" cy="622" r="3" />
                        <circle cx="285" cy="622" r="3" />
                        <circle cx="460" cy="622" r="3" />
                        {/* Kadus dots */}
                        <circle cx="370" cy="815" r="3" />
                        <circle cx="730" cy="815" r="3" />
                      </g>
                    </svg>

                    {/* LEVEL 1: KEPALA DESA (Tengah Atas, center x=550, top=0) */}
                    <div className="absolute left-[465px] top-0 w-[170px] z-10">
                      <SotkOfficialBoxCard
                        roleTitle="KEPALA DESA"
                        official={kades}
                        onViewTupoksi={() => handleJumpToTupoksi('kades')}
                        widthClass="w-[170px]"
                        tier="kades"
                      />
                    </div>

                    {/* LEVEL 1.5: SEKRETARIS DESA (Kanan, center x=835, top=25) */}
                    <div className="absolute left-[750px] top-[25px] w-[170px] z-10">
                      <SotkOfficialBoxCard
                        roleTitle="SEKRETARIS DESA"
                        official={sekdes}
                        onViewTupoksi={() => handleJumpToTupoksi('sekdes')}
                        widthClass="w-[170px]"
                        tier="sekretariat"
                      />
                    </div>

                    {/* LEVEL 2 KIRI: 3 KEPALA SEKSI (PELAKSANA TEKNIS, top=265) */}
                    <div className="absolute left-[30px] top-[265px] w-[160px] z-10">
                      <SotkOfficialBoxCard
                        roleTitle="KEPALA SEKSI PEMERINTAHAN"
                        official={kasiPem}
                        onViewTupoksi={() => handleJumpToTupoksi('kasi-pemerintahan')}
                        widthClass="w-[160px]"
                        tier="teknis"
                      />
                    </div>
                    <div className="absolute left-[205px] top-[265px] w-[160px] z-10">
                      <SotkOfficialBoxCard
                        roleTitle="KEPALA SEKSI KESEJAHTERAAN"
                        official={kasiKesra}
                        onViewTupoksi={() => handleJumpToTupoksi('kasi-kesejahteraan')}
                        widthClass="w-[160px]"
                        tier="teknis"
                      />
                    </div>
                    <div className="absolute left-[380px] top-[265px] w-[160px] z-10">
                      <SotkOfficialBoxCard
                        roleTitle="KEPALA SEKSI PELAYANAN"
                        official={kasiYan}
                        onViewTupoksi={() => handleJumpToTupoksi('kasi-pelayanan')}
                        widthClass="w-[160px]"
                        tier="teknis"
                      />
                    </div>

                    {/* LEVEL 2 KANAN: 3 KEPALA URUSAN (STAF SEKRETARIAT, top=265) */}
                    <div className="absolute left-[580px] top-[265px] w-[160px] z-10">
                      <SotkOfficialBoxCard
                        roleTitle="KAUR TATA USAHA DAN UMUM"
                        official={kaurTU}
                        onViewTupoksi={() => handleJumpToTupoksi('kaur-tu')}
                        widthClass="w-[160px]"
                        tier="sekretariat"
                      />
                    </div>
                    <div className="absolute left-[755px] top-[265px] w-[160px] z-10">
                      <SotkOfficialBoxCard
                        roleTitle="KAUR KEUANGAN"
                        official={kaurKeu}
                        onViewTupoksi={() => handleJumpToTupoksi('kaur-keuangan')}
                        widthClass="w-[160px]"
                        tier="sekretariat"
                      />
                    </div>
                    <div className="absolute left-[930px] top-[265px] w-[160px] z-10">
                      <SotkOfficialBoxCard
                        roleTitle="KAUR PERENCANAAN"
                        official={kaurRen}
                        onViewTupoksi={() => handleJumpToTupoksi('kaur-perencanaan')}
                        widthClass="w-[160px]"
                        tier="sekretariat"
                      />
                    </div>

                    {/* LEVEL 3: STAF BARIS 1 (Di bawah masing-masing Kasi & Kaur, top=465) */}
                    <div className="absolute left-[30px] top-[465px] w-[160px] z-10">
                      <SotkOfficialBoxCard
                        roleTitle={stafPem1?.position || "STAF SEKSI PEMERINTAHAN"}
                        official={stafPem1}
                        onViewTupoksi={() => handleJumpToTupoksi('kasi-pemerintahan')}
                        widthClass="w-[160px]"
                        tier="staf-teknis"
                        isCompact
                      />
                    </div>
                    <div className="absolute left-[205px] top-[465px] w-[160px] z-10">
                      <SotkOfficialBoxCard
                        roleTitle={stafKesra1?.position || "STAF SEKSI KESEJAHTERAAN"}
                        official={stafKesra1}
                        onViewTupoksi={() => handleJumpToTupoksi('kasi-kesejahteraan')}
                        widthClass="w-[160px]"
                        tier="staf-teknis"
                        isCompact
                      />
                    </div>
                    <div className="absolute left-[380px] top-[465px] w-[160px] z-10">
                      <SotkOfficialBoxCard
                        roleTitle={stafYan1?.position || "STAF SEKSI PELAYANAN"}
                        official={stafYan1}
                        onViewTupoksi={() => handleJumpToTupoksi('kasi-pelayanan')}
                        widthClass="w-[160px]"
                        tier="staf-teknis"
                        isCompact
                      />
                    </div>
                    <div className="absolute left-[580px] top-[465px] w-[160px] z-10">
                      <SotkOfficialBoxCard
                        roleTitle={stafTU1?.position || "STAF UMUM & PERENCANAAN"}
                        official={stafTU1}
                        onViewTupoksi={() => handleJumpToTupoksi('kaur-tu')}
                        widthClass="w-[160px]"
                        tier="staf-sekretariat"
                        isCompact
                      />
                    </div>
                    <div className="absolute left-[755px] top-[465px] w-[160px] z-10">
                      <SotkOfficialBoxCard
                        roleTitle={stafKeu1?.position || "STAF URUSAN KEUANGAN"}
                        official={stafKeu1}
                        onViewTupoksi={() => handleJumpToTupoksi('kaur-keuangan')}
                        widthClass="w-[160px]"
                        tier="staf-sekretariat"
                        isCompact
                      />
                    </div>
                    <div className="absolute left-[930px] top-[465px] w-[160px] z-10">
                      <SotkOfficialBoxCard
                        roleTitle={stafRen1?.position || "STAF PERENCANAAN"}
                        official={stafRen1}
                        onViewTupoksi={() => handleJumpToTupoksi('kaur-perencanaan')}
                        widthClass="w-[160px]"
                        tier="staf-sekretariat"
                        isCompact
                      />
                    </div>

                    {/* LEVEL 4: STAF BARIS 2 (Staf ke-2 untuk Seksi Pemerintahan, Kesejahteraan, dan Pelayanan, top=635) */}
                    <div className="absolute left-[30px] top-[635px] w-[160px] z-10">
                      <SotkOfficialBoxCard
                        roleTitle={stafPem2?.position || "STAF SEKSI PEMERINTAHAN"}
                        official={stafPem2}
                        onViewTupoksi={() => handleJumpToTupoksi('kasi-pemerintahan')}
                        widthClass="w-[160px]"
                        tier="staf-teknis"
                        isCompact
                      />
                    </div>
                    <div className="absolute left-[205px] top-[635px] w-[160px] z-10">
                      <SotkOfficialBoxCard
                        roleTitle={stafKesra2?.position || "STAF SEKSI KESEJAHTERAAN"}
                        official={stafKesra2}
                        onViewTupoksi={() => handleJumpToTupoksi('kasi-kesejahteraan')}
                        widthClass="w-[160px]"
                        tier="staf-teknis"
                        isCompact
                      />
                    </div>
                    <div className="absolute left-[380px] top-[635px] w-[160px] z-10">
                      <SotkOfficialBoxCard
                        roleTitle={stafYan2?.position || "STAF SEKSI PELAYANAN"}
                        official={stafYan2}
                        onViewTupoksi={() => handleJumpToTupoksi('kasi-pelayanan')}
                        widthClass="w-[160px]"
                        tier="staf-teknis"
                        isCompact
                      />
                    </div>

                    {/* LEVEL 5 BAWAH: PELAKSANA KEWILAYAHAN (KEPALA DUSUN RESMI, top=845) */}
                    <div className="absolute left-[290px] top-[845px] w-[160px] z-10">
                      <SotkOfficialBoxCard
                        roleTitle={kadus1?.position || "KEPALA DUSUN CILONING"}
                        official={kadus1}
                        onViewTupoksi={() => handleJumpToTupoksi('kadus')}
                        widthClass="w-[160px]"
                        tier="wilayah"
                      />
                    </div>
                    <div className="absolute left-[650px] top-[845px] w-[160px] z-10">
                      <SotkOfficialBoxCard
                        roleTitle={kadus2?.position || "KEPALA DUSUN PENGAMPIRAN"}
                        official={kadus2}
                        onViewTupoksi={() => handleJumpToTupoksi('kadus')}
                        widthClass="w-[160px]"
                        tier="wilayah"
                      />
                    </div>

                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── VIEW 2 & 1 (BOTTOM SECTION): RINCIAN TUPOKSI PER SEKSI ─── */}
      <div id="tupoksi-section" className="space-y-6 pt-4">
        <div className="neu-card-elevated rounded-[28px] p-5 sm:p-8 border border-white/80 space-y-5">

          {/* Header Tupoksi Section */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-black/5">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-4 h-[2px] bg-emerald-600" />
                <span className="text-[10.5px] font-bold uppercase tracking-widest text-emerald-800">
                  Pedoman Resmi Tata Kerja
                </span>
              </div>
              <h3 className="text-lg sm:text-2xl font-condensed font-bold text-slate-900 uppercase tracking-tight mt-1">
                Tugas Pokok &amp; Fungsi (Tupoksi) per Seksi
              </h3>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Berdasarkan Peraturan Bupati Cilacap Nomor 132 Tahun 2023 tentang Susunan Organisasi dan Tata Kerja Pemerintah Desa
              </p>
            </div>

            {/* Pencarian Tupoksi */}
            <div className="relative w-full md:w-80">
              <Search className="h-4 w-4 absolute left-3 top-2.5 text-slate-400" />
              <Input
                value={searchTupoksi}
                onChange={(e) => setSearchTupoksi(e.target.value)}
                placeholder="Cari tugas, wewenang, izin, tanah, pajak..."
                className="pl-9 h-9 text-xs rounded-xl neu-inset border-0 bg-white dark:bg-[#081d27] text-slate-900 placeholder:text-slate-400 font-medium"
              />
            </div>
          </div>

          {/* Filter Kategori Jabatan */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mr-1">
              Filter:
            </span>
            {[
              { id: 'all', label: 'Semua Jabatan' },
              { id: 'kades', label: 'Kepala Desa' },
              { id: 'sekdes', label: 'Sekretaris Desa' },
              { id: 'kaur', label: 'Kaur (Sekretariat)' },
              { id: 'kasi', label: 'Kasi (Pelaksana Teknis)' },
              { id: 'kadus', label: 'Kepala Dusun' },
            ].map(f => (
              <button
                key={`filter-${f.id}`}
                onClick={() => setActiveCategoryFilter(f.id)}
                className={cn(
                  "px-3 py-1.5 rounded-xl text-[11px] font-condensed font-bold uppercase tracking-wider transition-all cursor-pointer",
                  activeCategoryFilter === f.id
                    ? "neu-btn-dark text-emerald-400 font-black shadow-xs"
                    : "neu-convex text-stone-700 hover:text-emerald-900"
                )}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Daftar Kartu Tupoksi */}
          <div className="space-y-4 pt-2">
            {filteredTupoksi.map((item) => {
              const activeOfficial = getOfficialForTupoksi(item.id);
              const isExpanded = expandedTupoksiId === item.id;

              return (
                <div
                  key={`tupoksi-${item.id}`}
                  id={`tupoksi-card-${item.id}`}
                  className={cn(
                    "neu-card-elevated rounded-[24px] border transition-all duration-300 overflow-hidden",
                    isExpanded ? "border-emerald-500/60 shadow-md ring-1 ring-emerald-500/20" : "border-white/80 hover:border-emerald-300"
                  )}
                >
                  {/* Header Kartu (Klik untuk Expand/Collapse) */}
                  <div
                    onClick={() => setExpandedTupoksiId(isExpanded ? null : item.id)}
                    className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 cursor-pointer select-none bg-white/70 hover:bg-white transition-colors"
                  >
                    <div className="flex items-start gap-3.5">
                      {/* Avatar / Foto Pejabat Aktif */}
                      <div className="relative shrink-0">
                        {activeOfficial?.imageUrl ? (
                          <img
                            src={activeOfficial.imageUrl}
                            alt={activeOfficial.name}
                            className="w-12 h-12 rounded-2xl object-cover border border-white shadow-sm"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-2xl neu-inset flex items-center justify-center text-slate-500 font-bold text-sm">
                            <UserCircle2 className="h-6 w-6 text-slate-400" />
                          </div>
                        )}
                        <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-600 border border-white flex items-center justify-center text-[9px] text-white font-bold">
                          ✓
                        </span>
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={cn("px-2 py-0.5 rounded-md font-condensed font-bold uppercase text-[9px] tracking-wider border", item.colorBadge)}>
                            {item.categoryLabel}
                          </span>
                          <span className="text-[10px] font-mono text-slate-500 font-semibold">
                            {item.dasarHukum}
                          </span>
                        </div>
                        <h4 className="text-base sm:text-lg font-condensed font-black uppercase text-slate-900 tracking-tight leading-snug">
                          {item.jabatan}
                        </h4>
                        <p className="text-xs text-slate-600 font-medium">
                          Pejabat Aktif:{' '}
                          <span className="font-bold text-emerald-800">
                            {activeOfficial ? activeOfficial.name : 'Dalam Pengisian / Terjadwal'}
                          </span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                      <span className="text-[11px] font-bold text-slate-500 font-condensed uppercase tracking-wider hidden sm:inline-block">
                        {isExpanded ? 'Tutup Rincian' : 'Lihat Rincian'}
                      </span>
                      <div className="w-8 h-8 rounded-xl neu-convex flex items-center justify-center text-slate-700">
                        {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </div>
                    </div>
                  </div>

                  {/* Body Rincian Tupoksi (Accordion Content) */}
                  {isExpanded && (
                    <div className="p-4 sm:p-6 border-t border-slate-100 bg-slate-100/50 dark:bg-white/5 space-y-5 animate-in fade-in-50 duration-200">

                      {/* Kedudukan & Tugas Pokok */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="neu-card-elevated rounded-2xl p-4 border border-white/80 bg-white/90 space-y-1.5">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                            Kedudukan Jabatan:
                          </span>
                          <p className="text-xs text-slate-700 leading-relaxed font-medium">
                            {item.kedudukan}
                          </p>
                        </div>
                        <div className="neu-card-elevated rounded-2xl p-4 border border-white/80 bg-white/90 space-y-1.5">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 block">
                            Tugas Pokok:
                          </span>
                          <p className="text-xs text-slate-800 leading-relaxed font-semibold">
                            {item.tugasPokok}
                          </p>
                        </div>
                      </div>

                      {/* Rincian Fungsi Resmi Perbup */}
                      <div className="neu-card-elevated rounded-2xl p-4 sm:p-5 border border-white/80 bg-white space-y-3">
                        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                          <span className="text-xs font-condensed font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
                            <Check className="h-4 w-4 text-emerald-600" />
                            Rincian Fungsi Resmi (Perbup Cilacap No. 132/2023)
                          </span>
                          <span className="text-[10.5px] font-bold text-slate-500">
                            {item.fungsi.length} Butir Fungsi
                          </span>
                        </div>

                        <ul className="space-y-2.5">
                          {item.fungsi.map((fn, idx) => (
                            <li key={`fn-${idx}`} className="flex items-start gap-2.5 text-xs text-slate-700 leading-relaxed">
                              <span className="w-5 h-5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                                {idx + 1}
                              </span>
                              <span>{fn}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Ruang Lingkup Kerja / Output Layanan */}
                      <div className="space-y-1.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                          Ruang Lingkup &amp; Fokus Pelayanan:
                        </span>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {item.ruangLingkup.map((tag, tIdx) => (
                            <span key={`tag-${tIdx}`} className="neu-pill px-2.5 py-1 rounded-lg text-[10.5px] font-semibold text-slate-700 bg-white border border-slate-200">
                              • {tag}
                            </span>
                          ))}
                        </div>
                      </div>

                    </div>
                  )}
                </div>
              );
            })}
          </div>

        </div>
      </div>

      {/* ─── VIEW 3: DIREKTORI KARTU PERANGKAT DESA (GRID LENGKAP) ─── */}
      {subView === 'direktori' && (
        <div className="neu-card-elevated rounded-[28px] p-5 sm:p-8 border border-white/80 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-black/5">
            <div>
              <h3 className="text-base sm:text-xl font-condensed font-bold text-slate-900 uppercase tracking-tight">
                Direktori Personel Perangkat Desa Sampeldes ({officials.length})
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Data resmi aparatur dan foto yang terkelola melalui portal admin pemerintahan
              </p>
            </div>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-44 rounded-2xl bg-stone-300/60" />
              ))}
            </div>
          ) : officials.length === 0 ? (
            <div className="neu-inset rounded-2xl p-10 text-center space-y-2">
              <Users className="h-8 w-8 text-slate-400 mx-auto" />
              <p className="text-sm font-bold text-slate-700">Belum ada data perangkat desa yang tercatat</p>
              <p className="text-xs text-slate-500">Data dapat diinput melalui menu Admin &gt; Pemerintahan &gt; Perangkat Desa.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
              {officials.map((person) => (
                <div
                  key={`person-${person.id || person.name}`}
                  className="neu-card-elevated rounded-[24px] p-4 sm:p-5 border border-white/80 flex items-center gap-4 hover:scale-[1.01] transition-transform"
                >
                  {person.imageUrl ? (
                    <img
                      src={person.imageUrl}
                      alt={person.name}
                      className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover border-2 border-white shadow-sm shrink-0"
                    />
                  ) : (
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl neu-inset flex items-center justify-center text-slate-400 shrink-0 border border-white/60">
                      <UserCircle2 className="h-8 w-8 text-slate-400" />
                    </div>
                  )}

                  <div className="space-y-1 min-w-0">
                    <span className="neu-btn-gold px-2 py-0.5 rounded-full font-condensed font-bold uppercase text-[9px] tracking-wider inline-block text-slate-900 truncate max-w-full">
                      {person.position}
                    </span>
                    <h4 className="font-condensed font-black uppercase text-sm sm:text-base text-slate-900 tracking-tight leading-snug truncate">
                      {person.name}
                    </h4>
                    <p className="text-[10.5px] text-slate-500 font-medium">
                      Pemerintah Desa Sampeldes
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SUB-KOMPONEN KARTU KOTAK SOTK PEMERINTAH DESA (SESUAI TEMA NEUMORPHIC SAMPELDES)
// ─────────────────────────────────────────────────────────────────────────────

function SotkOfficialBoxCard({
  roleTitle,
  official,
  onViewTupoksi,
  widthClass = "w-[160px]",
  tier = "teknis",
  isCompact = false,
}: {
  roleTitle: string;
  official?: Official | { name: string; position: string; imageUrl?: string };
  onViewTupoksi: () => void;
  widthClass?: string;
  tier?: 'kades' | 'sekretariat' | 'teknis' | 'wilayah' | 'staf-teknis' | 'staf-sekretariat' | 'staf';
  isCompact?: boolean;
}) {
  const displayName = official?.name && official.name !== '-' ? official.name : 'BELUM TERISI';
  const hasOfficial = official?.name && official.name !== '-';

  // Skema styling per tingkatan hierarki SOTK
  const tierConfig = {
    kades: {
      headerBg: "bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 text-slate-950 font-black",
      cardBorder: "border-amber-400/80 shadow-md ring-2 ring-amber-400/30",
      icon: <Crown className="h-3 w-3 text-amber-950 shrink-0 inline mr-1" />
    },
    sekretariat: {
      headerBg: "bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-emerald-400 font-bold",
      cardBorder: "border-slate-300/90 shadow-sm",
      icon: null
    },
    teknis: {
      headerBg: "bg-gradient-to-r from-emerald-800 via-emerald-700 to-emerald-800 text-emerald-100 font-bold",
      cardBorder: "border-emerald-700/30 shadow-sm",
      icon: null
    },
    wilayah: {
      headerBg: "bg-gradient-to-r from-teal-950 via-slate-900 to-teal-900 text-teal-200 font-bold",
      cardBorder: "border-teal-700/30 shadow-sm",
      icon: null
    },
    'staf-teknis': {
      headerBg: "bg-gradient-to-r from-teal-800 via-emerald-800 to-teal-800 text-emerald-200 font-bold",
      cardBorder: "border-emerald-600/40 shadow-xs",
      icon: null
    },
    'staf-sekretariat': {
      headerBg: "bg-gradient-to-r from-slate-800 via-slate-700 to-slate-800 text-slate-200 font-bold",
      cardBorder: "border-slate-400/40 shadow-xs",
      icon: null
    },
    staf: {
      headerBg: "bg-gradient-to-r from-slate-700 via-slate-600 to-slate-700 text-slate-100 font-bold",
      cardBorder: "border-slate-400/40 shadow-xs",
      icon: null
    }
  }[tier];

  return (
    <div
      onClick={onViewTupoksi}
      title="Klik untuk melihat Uraian Tugas Pokok & Fungsi"
      className={cn(
        "rounded-2xl neu-convex border transition-all duration-300 flex flex-col overflow-hidden text-center cursor-pointer group select-none hover:-translate-y-1.5 hover:shadow-xl",
        tierConfig.cardBorder,
        widthClass
      )}
    >
      {/* Header Pita SOTK Sesuai Tingkatan Hierarki */}
      <div className={cn(
        "px-2 font-condensed uppercase leading-tight tracking-wide flex items-center justify-center transition-all",
        isCompact ? "py-1 text-[9px] min-h-[32px]" : "py-1.5 text-[10px] sm:text-[10.5px] min-h-[38px]",
        tierConfig.headerBg
      )}>
        <span className="line-clamp-2">
          {tierConfig.icon}
          {roleTitle}
        </span>
      </div>

      {/* Bagian Foto Pegawai dalam Inset Well Neumorphic */}
      <div className={cn(
        "px-2 bg-gradient-to-b from-transparent to-black/[0.02] flex flex-col items-center justify-center flex-1",
        isCompact ? "py-1.5" : "py-2.5"
      )}>
        <div className="relative p-1 rounded-full neu-inset">
          {official?.imageUrl ? (
            <img
              src={official.imageUrl}
              alt={displayName}
              className={cn(
                "rounded-full object-cover border-2 border-white shadow-xs group-hover:scale-105 transition-transform",
                isCompact ? "w-11 h-11" : "w-16 h-16 sm:w-18 sm:h-18"
              )}
            />
          ) : (
            <div className={cn(
              "rounded-full bg-white dark:bg-[#081d27] flex items-center justify-center text-slate-400 group-hover:scale-105 transition-transform",
              isCompact ? "w-11 h-11" : "w-16 h-16 sm:w-18 sm:h-18"
            )}>
              <UserCircle2 className={isCompact ? "h-7 w-7 text-slate-400" : "h-10 w-10 text-slate-400"} />
            </div>
          )}
        </div>
      </div>

      {/* Bagian Nama Pejabat */}
      <div className={cn(
        "bg-slate-100/60 dark:bg-white/5 border-t border-slate-200/60 px-1.5 text-center flex items-center justify-center",
        isCompact ? "py-1 min-h-[34px]" : "py-2 min-h-[42px]"
      )}>
        <span className={cn(
          "font-condensed font-black uppercase tracking-tight leading-snug line-clamp-2",
          isCompact ? "text-[11px]" : "text-xs",
          hasOfficial ? "text-slate-900 group-hover:text-emerald-700 transition-colors" : "text-slate-400 italic font-medium"
        )}>
          {displayName}
        </span>
      </div>

      {/* Micro Action Button / Quick Tupoksi Link */}
      <div className="bg-white/70 group-hover:bg-emerald-700 group-hover:text-white transition-colors py-1 px-1 text-[8.5px] font-condensed font-bold uppercase tracking-wider text-slate-600 flex items-center justify-center gap-1 border-t border-slate-200/50">
        <span>Rincian Tupoksi</span>
        <ChevronRight className="h-2.5 w-2.5" />
      </div>
    </div>
  );
}
