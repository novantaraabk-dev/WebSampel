'use client';

import React from 'react';
import Image from 'next/image';

export function BackgroundPattern() {
  return (
    <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none select-none">
      {/* 1. Base Canvas */}
      <div className="absolute inset-0 bg-[#F8FAFC] dark:bg-[#060b11] transition-colors duration-500" />

      {/* 2. Silhouette Forest & Hills Landscape Photo (Persis Kartu Referensi) */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        {/* Dark Mode Silhouette (Siluet Hutan Pinus & Perbukitan Alam Sampeldes) */}
        <div className="hidden dark:block absolute inset-0 opacity-[0.20] brightness-75 contrast-125 mix-blend-luminosity pointer-events-none">
          <Image
            src="https://images.unsplash.com/photo-1511497584788-876760111969?q=80&w=2400&auto=format&fit=crop"
            alt="Siluet Alam Desa Sampeldes"
            fill
            priority
            sizes="100vw"
            className="object-cover object-center pointer-events-none"
          />
        </div>

        {/* Light Mode Silhouette (Siluet Lembut Monokrom) */}
        <div className="block dark:hidden absolute inset-0 opacity-[0.06] mix-blend-multiply contrast-125 grayscale pointer-events-none">
          <Image
            src="https://images.unsplash.com/photo-1511497584788-876760111969?q=80&w=2400&auto=format&fit=crop"
            alt="Siluet Alam Desa Sampeldes"
            fill
            priority
            sizes="100vw"
            className="object-cover object-center pointer-events-none"
          />
        </div>

        {/* Ambient Overlay Vignette Gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#F8FAFC]/50 to-[#F8FAFC]/80 dark:from-transparent dark:via-[#060b11]/55 dark:to-[#060b11]/85 pointer-events-none" />
      </div>

      {/* 3. Ambient Teal & Emerald Glow Highlights */}
      <div className="absolute -top-[10%] left-[10%] h-[600px] w-[600px] rounded-full bg-gradient-to-br from-teal-400/10 dark:from-teal-500/15 via-emerald-400/5 to-transparent blur-[140px] pointer-events-none transform-gpu" />
      <div className="absolute top-[28%] -right-[8%] h-[650px] w-[650px] rounded-full bg-gradient-to-bl from-teal-500/10 dark:from-teal-600/15 via-sky-400/5 to-transparent blur-[150px] pointer-events-none transform-gpu" />
      <div className="absolute top-[58%] -left-[10%] h-[700px] w-[700px] rounded-full bg-gradient-to-tr from-emerald-500/10 dark:from-emerald-600/15 via-teal-400/5 to-transparent blur-[160px] pointer-events-none transform-gpu" />
      <div className="absolute top-[82%] right-[5%] h-[600px] w-[600px] rounded-full bg-gradient-to-tl from-teal-400/10 dark:from-teal-500/15 via-slate-300/10 to-transparent blur-[150px] pointer-events-none transform-gpu" />

      {/* 4. Ultra-Fine Geometric Micro-Grid Texture */}
      <div
        className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05] pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(#081d27 1.2px, transparent 1.2px)`,
          backgroundSize: '32px 32px',
        }}
      />
    </div>
  );
}

export default BackgroundPattern;
