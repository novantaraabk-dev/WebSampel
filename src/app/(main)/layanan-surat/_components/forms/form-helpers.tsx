'use client';

import React, { useState } from 'react';
import { z } from 'zod';
import { FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { UploadCloud, FileCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Schema validasi nomor HP / WhatsApp:
 * Mengizinkan string kosong / undefined untuk pengajuan Admin.
 * Jika diisi, memeriksa apakah berformat nomor HP (minimal 9 digit angka).
 */
export const phoneValidationSchema = z
  .string()
  .optional()
  .refine((val) => !val || /^[0-9+\-\s]{9,}$/.test(val.trim()), {
    message: 'Nomor HP/WA minimal 9 digit dan hanya boleh angka.',
  });

/**
 * Validasi keabsahan nomor HP/WA sebelum submit:
 * - Jika isAdmin = true: tidak wajib (mengembalikan true meskipun kosong)
 * - Jika warga (isAdmin = false): wajib diisi minimal 9 digit angka
 */
export function validatePhoneForSubmission(phone: string | undefined | null, isAdmin: boolean): boolean {
  if (isAdmin) return true;
  if (!phone || typeof phone !== 'string') return false;
  const clean = phone.trim();
  return clean.length >= 9 && /^[0-9+\-\s]+$/.test(clean);
}

export interface FormSectionProps {
  title?: string;
  icon?: any;
  children: React.ReactNode;
  className?: string;
}

export function FormSection({ title, icon: Icon, children, className }: FormSectionProps) {
  return (
    <div
      className={cn(
        'neu-card-elevated bg-[#ECE8E1] dark:bg-[#0d141e] rounded-[20px] min-[400px]:rounded-[24px] sm:rounded-[30px] p-3.5 min-[400px]:p-4 sm:p-6 md:p-8 border border-white/70 dark:border-white/10 space-y-3.5 sm:space-y-5 transition-all',
        className
      )}
    >
      {title && (
        <div className="flex items-center gap-2.5 sm:gap-3 border-b border-black/5 dark:border-white/10 pb-2.5 sm:pb-3.5">
          {Icon && (
            <div className="neu-inset w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center text-emerald-800 dark:text-[#d4e157] shrink-0">
              {React.isValidElement(Icon) ? (
                Icon
              ) : typeof Icon === 'function' ? (
                <Icon className="h-4 w-4 sm:h-4.5 sm:w-4.5" />
              ) : null}
            </div>
          )}
          <h3 className="text-xs sm:text-sm md:text-base font-condensed font-black uppercase tracking-tight text-slate-800 dark:text-white">
            {title}
          </h3>
        </div>
      )}
      <div>{children}</div>
    </div>
  );
}

export interface GoogleFileUploaderProps {
  label: string;
  onFileSelect?: (file: File, fieldName: string) => void;
  onUploadSuccess?: (file: File, fieldName: string) => void;
  fieldName: string;
  isRequired?: boolean;
  disabled?: boolean;
}

export function GoogleFileUploader({
  label,
  onFileSelect,
  onUploadSuccess,
  fieldName,
  isRequired,
  disabled,
}: GoogleFileUploaderProps) {
  const [fileName, setFileName] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFileName(file.name);
      if (onFileSelect) onFileSelect(file, fieldName);
      if (onUploadSuccess) onUploadSuccess(file, fieldName);
    }
  };

  return (
    <div className="flex flex-col space-y-1.5 w-full">
      <label
        className={cn(
          'text-[10px] min-[400px]:text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200',
          isRequired && "after:content-['*'] after:ml-0.5 after:text-rose-500 font-black"
        )}
      >
        {label}
      </label>
      <div
        className={cn(
          'relative group neu-inset rounded-2xl p-3 sm:p-4 transition-all border border-white/60 dark:border-white/10 cursor-pointer overflow-hidden',
          fileName && 'bg-emerald-500/10 border-emerald-500/30',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
      >
        <input
          type="file"
          onChange={handleFileChange}
          disabled={disabled}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed z-10"
          accept="image/jpeg,image/png,application/pdf"
        />
        <div className="flex flex-col items-center justify-center text-center gap-1.5 sm:gap-2 py-1">
          {fileName ? (
            <>
              <div className="p-1.5 neu-btn-circle w-8 h-8 sm:w-9 sm:h-9 text-emerald-700 dark:text-[#d4e157] shrink-0">
                <FileCheck className="h-4 w-4 animate-in zoom-in" />
              </div>
              <p className="text-[10px] sm:text-[11px] font-black text-emerald-950 dark:text-emerald-300 max-w-[200px] truncate uppercase tracking-tight">
                {fileName}
              </p>
              <span className="text-[9px] font-bold text-emerald-700 dark:text-emerald-400">Berkas Terlampir (Klik untuk Ganti)</span>
            </>
          ) : (
            <>
              <div className="p-1.5 neu-btn-circle w-8 h-8 sm:w-9 sm:h-9 text-slate-600 dark:text-slate-300 group-hover:text-emerald-700 dark:group-hover:text-[#d4e157] shrink-0">
                <UploadCloud className="h-4 w-4" />
              </div>
              <p className="text-[10px] sm:text-[11px] font-black text-slate-700 dark:text-slate-200 uppercase tracking-wider group-hover:text-emerald-800 dark:group-hover:text-[#d4e157]">
                Pilih Berkas
              </p>
              <span className="text-[9px] text-slate-400 dark:text-slate-500">JPG, PNG atau PDF (Maks 5MB)</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
