'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '@/components/theme/ThemeProvider';
import { cn } from '@/lib/utils';
import { Moon, Sun } from 'lucide-react';

interface NightModeSwitchProps {
  className?: string;
  size?: 'sm' | 'md';
}

export function NightModeSwitch({ className, size = 'md' }: NightModeSwitchProps) {
  const { isDark, toggleTheme } = useTheme();

  const isSmall = size === 'sm';

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isDark}
      aria-label={isDark ? 'Mode Malam Aktif (Klik untuk OFF)' : 'Mode Siang (Klik untuk ON Mode Malam)'}
      onClick={toggleTheme}
      title={isDark ? 'Mode Malam Aktif — Klik untuk Mematikan (OFF)' : 'Mode Siang — Klik untuk Menyalakan Mode Malam (ON)'}
      className={cn(
        'group relative inline-flex items-center shrink-0 cursor-pointer select-none rounded-full transition-all duration-300 focus:outline-hidden focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2',
        // Bezel & Dimensi yang presisi dan proporsional
        isSmall
          ? 'h-[27px] w-[72px] p-[2px]'
          : 'h-[32px] w-[86px] p-[3px]',
        // Frame Luar Taktil Gelap Premium
        'bg-[#0f1319] border shadow-[inset_0_2px_4px_rgba(0,0,0,0.9),0_2px_6px_rgba(0,0,0,0.5)]',
        isDark
          ? 'border-rose-500/40 shadow-[inset_0_2px_5px_rgba(0,0,0,0.9),0_0_12px_rgba(244,63,94,0.35)]'
          : 'border-sky-500/40 shadow-[inset_0_2px_5px_rgba(0,0,0,0.9),0_0_12px_rgba(56,189,248,0.35)]',
        className
      )}
    >
      {/* Track Background */}
      <div
        className={cn(
          'relative w-full h-full rounded-full overflow-hidden transition-all duration-300',
          isDark
            ? 'bg-gradient-to-r from-rose-600 via-red-600 to-[#151a22] shadow-[inset_0_2px_6px_rgba(0,0,0,0.75)]'
            : 'bg-gradient-to-r from-[#151a22] via-blue-600 to-sky-500 shadow-[inset_0_2px_6px_rgba(0,0,0,0.75)]'
        )}
      >
        {/* Label OFF (Terletak di Kiri — Terbuka Utuh saat Thumb di Kanan) */}
        <div
          className={cn(
            'absolute left-0 top-0 bottom-0 flex items-center justify-center font-sans font-black tracking-wider transition-all duration-200 select-none leading-none z-0',
            isSmall ? 'w-[43px] gap-1 text-[8.5px]' : 'w-[51px] gap-1.5 text-[9.5px]',
            isDark
              ? 'opacity-100 text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)] scale-100'
              : 'opacity-0 scale-75 pointer-events-none'
          )}
        >
          <Sun className={cn(isSmall ? 'h-3 w-3' : 'h-3.5 w-3.5', 'text-amber-200 fill-amber-300/80 shrink-0')} />
          <span>OFF</span>
        </div>

        {/* Label ON (Terletak di Kanan — Terbuka Utuh saat Thumb di Kiri) */}
        <div
          className={cn(
            'absolute right-0 top-0 bottom-0 flex items-center justify-center font-sans font-black tracking-wider transition-all duration-200 select-none leading-none z-0',
            isSmall ? 'w-[43px] gap-1 text-[8.5px]' : 'w-[51px] gap-1.5 text-[9.5px]',
            !isDark
              ? 'opacity-100 text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)] scale-100'
              : 'opacity-0 scale-75 pointer-events-none'
          )}
        >
          <span>ON</span>
          <Moon className={cn(isSmall ? 'h-3 w-3' : 'h-3.5 w-3.5', 'text-sky-200 fill-sky-200/50 shrink-0')} />
        </div>
      </div>

      {/* Thumb Slider dengan Grip Dots Taktil Presisi */}
      <motion.div
        layout
        transition={{
          type: 'spring',
          stiffness: 520,
          damping: 34,
        }}
        className={cn(
          'absolute rounded-full flex items-center justify-center pointer-events-none z-10 transition-shadow',
          isSmall
            ? 'h-[23px] w-[27px] top-[2px]'
            : 'h-[26px] w-[32px] top-[3px]',
          isDark
            ? isSmall ? 'left-[43px]' : 'left-[51px]'
            : isSmall ? 'left-[2px]' : 'left-[3px]',
          // Neumorphic Gradient & Highlights pada Thumb Slider
          'bg-gradient-to-b from-[#3a414e] via-[#262c35] to-[#181d24]',
          'border border-[#556073]/70 shadow-[0_3px_8px_rgba(0,0,0,0.85),inset_0_1px_1px_rgba(255,255,255,0.35)]',
          'group-hover:border-[#73829c] group-active:scale-95'
        )}
      >
        {/* Grip Dots Grid (Titik Taktil 3 Kolom x 2 Baris) */}
        <div className="grid grid-cols-3 gap-x-1.5 gap-y-1 p-0.5 opacity-85 group-hover:opacity-100 transition-opacity">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className={cn(
                'rounded-full bg-[#11161d] shadow-[inset_0_1px_1.5px_rgba(0,0,0,0.95),0_0.5px_0.5px_rgba(255,255,255,0.25)]',
                isSmall ? 'w-[3px] h-[3px]' : 'w-[4px] h-[4px]'
              )}
            />
          ))}
        </div>
      </motion.div>
    </button>
  );
}
