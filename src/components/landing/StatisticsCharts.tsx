'use client';

import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, Home, MapPin, Layers, Sparkles, Activity, PieChart as PieIcon, BarChart2 } from 'lucide-react';

// Palet harmonis sesuai tema Neumorphism Landing Page: Emerald 600 & Warm Amber 600
const GENDER_COLORS = ['#059669', '#D97706', '#0284C7'];

interface StatisticsChartsProps {
  statsDoc?: any;
  isLoading?: boolean;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const dataObj = payload[0].payload;
    return (
      <div className="neu-card-elevated rounded-2xl p-3 sm:p-3.5 text-slate-900 text-xs space-y-1 z-50 border border-stone-300/80">
        <p className="font-sans font-bold uppercase tracking-wider text-slate-600 text-[10px]">
          {label || dataObj?.name || payload[0].name}
        </p>
        <p className="text-sm sm:text-base font-display font-light text-slate-900">
          {Number(payload[0].value).toLocaleString('id-ID')}{' '}
          <span className="text-xs font-sans font-normal text-slate-500">jiwa</span>
        </p>
        {dataObj?.pct && (
          <p className="text-[10.5px] font-sans font-semibold text-emerald-700">
            Proporsi: {dataObj.pct}
          </p>
        )}
      </div>
    );
  }
  return null;
};

export function StatisticsCharts({ statsDoc, isLoading }: StatisticsChartsProps) {
  const [chartView, setChartView] = useState<'dusun' | 'umur'>('dusun');

  const firestore = useFirestore();
  const profileRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, 'villageProfile', 'default');
  }, [firestore]);

  const { data: profile } = useDoc<Record<string, any>>(profileRef);

  const population = statsDoc?.total || 8236;
  const areaKm = profile?.areaKm || profile?.area || profile?.luas || '6,43';
  const totalKK = statsDoc?.totalKK || 2640;
  const male = statsDoc?.maleCount ?? 4220;
  const female = statsDoc?.femaleCount ?? 4016;

  const genderData = useMemo(() => {
    const other = statsDoc?.otherCount ?? 0;
    return [
      { name: `Laki-laki (${male.toLocaleString('id-ID')} / 51,2%)`, value: male, pct: '51.2%' },
      { name: `Perempuan (${female.toLocaleString('id-ID')} / 48,8%)`, value: female, pct: '48.8%' },
      ...(other > 0 ? [{ name: 'Lainnya', value: other, pct: '0%' }] : []),
    ];
  }, [statsDoc, male, female]);

  const dusunDistribution = useMemo(() => {
    if (statsDoc?.dusunBreakdown && Array.isArray(statsDoc.dusunBreakdown) && statsDoc.dusunBreakdown.length > 0) {
      return statsDoc.dusunBreakdown;
    }
    return [
      { name: 'Dsn. Pangampiran', count: 4210, pct: '51.1%' },
      { name: 'Dsn. Ciloning', count: 4026, pct: '48.9%' },
    ];
  }, [statsDoc]);

  const ageDistribution = useMemo(() => {
    return [
      { name: '0–4 Th', count: 655, pct: '8.0%' },
      { name: '5–9 Th', count: 710, pct: '8.6%' },
      { name: '10–14 Th', count: 720, pct: '8.7%' },
      { name: '15–19 Th', count: 685, pct: '8.3%' },
      { name: '20–24 Th', count: 715, pct: '8.7%' },
      { name: '25–29 Th', count: 760, pct: '9.2%' },
      { name: '30–34 Th', count: 755, pct: '9.2%' },
      { name: '35–39 Th', count: 710, pct: '8.6%' },
      { name: '40–44 Th', count: 680, pct: '8.3%' },
      { name: '45–49 Th', count: 660, pct: '8.0%' },
      { name: '50–54 Th', count: 615, pct: '7.5%' },
      { name: '55–59 Th', count: 520, pct: '6.3%' },
      { name: '60+ Th', count: 766, pct: '9.3%' },
    ];
  }, []);

  if (isLoading) {
    return (
      <div className="mt-4 sm:mt-6 grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
        <Skeleton className="col-span-2 lg:col-span-1 h-[280px] sm:h-[360px] rounded-[28px]" />
        <Skeleton className="col-span-1 h-[260px] sm:h-[360px] rounded-[28px]" />
        <Skeleton className="col-span-1 h-[260px] sm:h-[360px] rounded-[28px]" />
      </div>
    );
  }

  return (
    <div className="mt-3 sm:mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-5 xl:gap-6">
      {/* ═══════════ CARD 1: KILAS DATA WILAYAH & DEMOGRAFI ═══════════ */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.15 }}
        transition={{ duration: 0.45 }}
        whileHover={{ y: -3 }}
        className="col-span-1 md:col-span-2 lg:col-span-1 relative overflow-hidden rounded-[26px] sm:rounded-[30px] neu-card-elevated p-3.5 sm:p-5 transition-all duration-300 flex flex-col justify-between"
      >
        <div>
          <div className="flex items-center gap-2.5 sm:gap-3 mb-2.5 sm:mb-3">
            <div className="neu-convex flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-2xl text-emerald-800 shrink-0">
              <Layers className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>
            <div>
              <span className="neu-pill px-2.5 py-0.5 rounded-full text-[8.5px] sm:text-[9px] font-sans font-bold text-emerald-800 uppercase tracking-wider inline-block">
                Demografi Resmi
              </span>
              <h4 className="text-xs sm:text-sm font-sans font-extrabold uppercase tracking-tight text-slate-900 mt-0.5">
                Kilas Data Wilayah &amp; Penduduk
              </h4>
            </div>
          </div>

          <div className="space-y-2 pt-0.5">
            {/* Total Penduduk */}
            <div className="neu-inset flex items-center justify-between p-2 sm:p-2.5 rounded-2xl">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-emerald-700 shrink-0" />
                <span className="text-[11px] sm:text-xs font-sans font-semibold text-slate-700">Total Penduduk</span>
              </div>
              <div className="text-right">
                <span className="text-xs sm:text-sm font-display font-light text-slate-900">{population.toLocaleString('id-ID')}</span>
                <span className="text-[9px] sm:text-[10px] text-slate-500 font-sans font-medium ml-1">Jiwa</span>
              </div>
            </div>

            {/* Split Laki-laki & Perempuan */}
            <div className="grid grid-cols-2 gap-2">
              <div className="neu-inset p-2 rounded-2xl">
                <p className="text-[8.5px] sm:text-[9px] font-sans font-bold uppercase tracking-wider text-emerald-800">Laki-laki</p>
                <p className="text-xs sm:text-sm font-display font-light text-slate-900 mt-0.5">
                  {male.toLocaleString('id-ID')} <span className="text-[9.5px] font-sans font-semibold text-emerald-700">(51,2%)</span>
                </p>
              </div>
              <div className="neu-inset p-2 rounded-2xl">
                <p className="text-[8.5px] sm:text-[9px] font-sans font-bold uppercase tracking-wider text-amber-800">Perempuan</p>
                <p className="text-xs sm:text-sm font-display font-light text-slate-900 mt-0.5">
                  {female.toLocaleString('id-ID')} <span className="text-[9.5px] font-sans font-semibold text-amber-700">(48,8%)</span>
                </p>
              </div>
            </div>

            {/* Kepala Keluarga */}
            <div className="neu-inset flex items-center justify-between p-2 sm:p-2.5 rounded-2xl">
              <div className="flex items-center gap-2">
                <Home className="h-4 w-4 text-emerald-700 shrink-0" />
                <span className="text-[11px] sm:text-xs font-sans font-semibold text-slate-700">Kepala Keluarga (KK)</span>
              </div>
              <div className="text-right">
                <span className="text-xs sm:text-sm font-display font-light text-slate-900">{totalKK.toLocaleString('id-ID')}</span>
                <span className="text-[9px] sm:text-[10px] text-slate-500 font-sans font-medium ml-1">KK</span>
              </div>
            </div>

            {/* Luas & Kepadatan */}
            <div className="neu-inset flex items-center justify-between p-2 sm:p-2.5 rounded-2xl">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-emerald-700 shrink-0" />
                <span className="text-[11px] sm:text-xs font-sans font-semibold text-slate-700">Luas &amp; Kepadatan</span>
              </div>
              <div className="text-right">
                <span className="text-[10.5px] sm:text-xs font-sans font-semibold text-slate-800">{areaKm} km² · 1.281 jiwa/km²</span>
              </div>
            </div>

            {/* Sex Ratio */}
            <div className="neu-inset flex items-center justify-between p-2 sm:p-2.5 rounded-2xl">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-emerald-700 shrink-0" />
                <span className="text-[11px] sm:text-xs font-sans font-semibold text-slate-700">Sex Ratio (Rasio Gender)</span>
              </div>
              <span className="text-xs sm:text-sm font-sans font-extrabold text-emerald-900">105,08</span>
            </div>
          </div>
        </div>

        <div className="mt-2.5 pt-2 flex items-center justify-between text-xs border-t border-stone-300/60">
          <span className="flex items-center gap-1.5 text-slate-700 font-sans font-semibold text-[10px]">
            <Sparkles className="h-3.5 w-3.5 text-amber-600" />
            Data Resmi Desa Sampeldes
          </span>
          <span className="neu-pill px-2.5 py-0.5 rounded-full text-[9px] uppercase font-sans font-bold tracking-wider text-slate-600">
            Kec. Gandrungmangu
          </span>
        </div>
      </motion.div>

      {/* ═══════════ CARD 2: KOMPOSISI JENIS KELAMIN ═══════════ */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.15 }}
        transition={{ duration: 0.45, delay: 0.08 }}
        whileHover={{ y: -3 }}
        className="col-span-1 relative overflow-hidden rounded-[26px] sm:rounded-[30px] neu-card-elevated p-3 min-[380px]:p-3.5 sm:p-5 transition-all duration-300 flex flex-col justify-between"
      >
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2.5">
              <div className="neu-convex flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-2xl text-emerald-800 shrink-0">
                <PieIcon className="h-4 w-4 sm:h-5 sm:w-5" />
              </div>
              <div>
                <span className="neu-pill px-2.5 py-0.5 rounded-full text-[8.5px] sm:text-[9px] font-sans font-bold text-emerald-800 uppercase tracking-wider inline-block">
                  Persentase
                </span>
                <h4 className="text-xs sm:text-sm font-sans font-extrabold uppercase tracking-tight text-slate-900 mt-0.5 leading-tight">
                  Jenis Kelamin
                </h4>
              </div>
            </div>
            <span className="neu-pill px-2.5 sm:px-3 py-1 rounded-full text-[9px] sm:text-[9.5px] font-sans font-bold text-slate-700 uppercase">
              {population.toLocaleString('id-ID')} Jiwa
            </span>
          </div>

          <div className="neu-inset p-2 rounded-2xl w-full h-[145px] sm:h-[185px] my-1 sm:my-2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                <Pie
                  data={genderData}
                  dataKey="value"
                  nameKey="name"
                  outerRadius="80%"
                  innerRadius="52%"
                  paddingAngle={5}
                  startAngle={90}
                  endAngle={-270}
                  stroke="rgba(248, 250, 252, 0.8)"
                  strokeWidth={3}
                >
                  {genderData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={GENDER_COLORS[index % GENDER_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  verticalAlign="bottom"
                  height={26}
                  wrapperStyle={{ fontSize: 9.5, fontWeight: 700, bottom: 0 }}
                  formatter={(value) => <span className="text-slate-800 font-sans font-semibold text-[9.5px] tracking-tight">{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="mt-2 pt-2 grid grid-cols-2 gap-2 border-t border-stone-300/60 text-center">
          <div className="neu-inset p-2 rounded-xl">
            <p className="text-[8.5px] sm:text-[9px] font-sans font-bold text-emerald-800 uppercase">Laki-Laki</p>
            <p className="text-xs sm:text-sm font-display font-light text-slate-900 mt-0.5">
              {male.toLocaleString('id-ID')} <span className="text-[9px] sm:text-[9.5px] font-sans font-semibold text-emerald-700">(51,2%)</span>
            </p>
          </div>
          <div className="neu-inset p-2 rounded-xl">
            <p className="text-[8.5px] sm:text-[9px] font-sans font-bold text-amber-800 uppercase">Perempuan</p>
            <p className="text-xs sm:text-sm font-display font-light text-slate-900 mt-0.5">
              {female.toLocaleString('id-ID')} <span className="text-[9px] sm:text-[9.5px] font-sans font-semibold text-amber-700">(48,8%)</span>
            </p>
          </div>
        </div>
      </motion.div>

      {/* ═══════════ CARD 3: SEBARAN PENDUDUK PER DUSUN & USIA ═══════════ */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.15 }}
        transition={{ duration: 0.45, delay: 0.16 }}
        whileHover={{ y: -3 }}
        className="col-span-1 relative overflow-hidden rounded-[26px] sm:rounded-[30px] neu-card-elevated p-3 min-[380px]:p-3.5 sm:p-5 transition-all duration-300 flex flex-col justify-between"
      >
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2.5">
              <div className="neu-convex flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-2xl text-emerald-800 shrink-0">
                <BarChart2 className="h-4 w-4 sm:h-5 sm:w-5" />
              </div>
              <div>
                <span className="neu-pill px-2.5 py-0.5 rounded-full text-[8.5px] sm:text-[9px] font-sans font-bold text-emerald-800 uppercase tracking-wider inline-block">
                  Distribusi
                </span>
                <h4 className="text-xs sm:text-sm font-sans font-extrabold uppercase tracking-tight text-slate-900 mt-0.5 leading-tight">
                  {chartView === 'dusun' ? 'Sebaran Dusun' : 'Kelompok Usia'}
                </h4>
              </div>
            </div>

            {/* View Switch Buttons Neumorphic */}
            <div className="neu-pill p-1 rounded-full flex items-center gap-1">
              <button
                type="button"
                onClick={() => setChartView('dusun')}
                className={`px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full text-[9px] sm:text-[10px] font-sans uppercase tracking-wider transition-all cursor-pointer ${chartView === 'dusun'
                    ? 'neu-btn-dark font-bold'
                    : 'text-slate-600 hover:text-slate-900 font-semibold'
                  }`}
              >
                Dusun
              </button>
              <button
                type="button"
                onClick={() => setChartView('umur')}
                className={`px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full text-[9px] sm:text-[10px] font-sans uppercase tracking-wider transition-all cursor-pointer ${chartView === 'umur'
                    ? 'neu-btn-dark font-bold'
                    : 'text-slate-600 hover:text-slate-900 font-semibold'
                  }`}
              >
                Usia
              </button>
            </div>
          </div>

          <div className="neu-inset p-2 rounded-2xl w-full h-[145px] sm:h-[185px] my-1 sm:my-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartView === 'dusun' ? dusunDistribution : ageDistribution}
                margin={{ top: 8, right: 4, left: -24, bottom: chartView === 'dusun' ? 8 : 0 }}
              >
                <defs>
                  <linearGradient id="barGradientDusun" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#059669" stopOpacity={0.95} />
                    <stop offset="100%" stopColor="#047857" stopOpacity={0.7} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#d5d0c6" vertical={false} />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 9, fill: '#475569', fontWeight: 600 }}
                  tickFormatter={(val: string) => val.replace('Dsn. ', '')}
                  axisLine={false}
                  tickLine={false}
                  interval={0}
                  angle={chartView === 'dusun' ? -12 : -35}
                  textAnchor="end"
                />
                <YAxis tick={{ fontSize: 8.5, fill: '#64748b' }} axisLine={false} tickLine={false} width={24} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" fill="url(#barGradientDusun)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="mt-2 pt-2 flex items-center justify-between text-xs border-t border-stone-300/60">
          <span className="neu-pill px-2.5 py-0.5 rounded-full font-sans font-bold text-slate-700 uppercase text-[9px] sm:text-[10px]">
            {chartView === 'dusun' ? `${dusunDistribution.length} Dusun` : '13 Kategori Usia'}
          </span>
          <span className="font-sans font-bold text-emerald-800 uppercase shrink-0 text-[10px] sm:text-xs">
            {population.toLocaleString('id-ID')} Jiwa
          </span>
        </div>
      </motion.div>
    </div>
  );
}
