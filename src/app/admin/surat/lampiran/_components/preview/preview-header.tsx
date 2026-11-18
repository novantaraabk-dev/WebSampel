'use client';

import { DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { FileCode2, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { LampiranSuratItem } from '@/lib/lampiran-surat-data';

interface PreviewHeaderProps {
  item: LampiranSuratItem;
  isLandscape: boolean;
  previewMode: 'blanko' | 'html';
  onModeChange: (mode: 'blanko' | 'html') => void;
}

export function PreviewHeader({
  item,
  isLandscape,
  previewMode,
  onModeChange,
}: PreviewHeaderProps) {
  return (
    <DialogHeader className="border-b pb-3 bg-white -mx-6 -mt-6 p-6 shadow-xs sticky top-0 z-10 print:hidden">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <DialogTitle className="text-lg font-black font-condensed uppercase tracking-tight text-slate-900">
            Pratinjau Format Lampiran: {item.kode} — {item.nama}
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500">
            Format Standar Resmi OpenSID & {item.dasarHukum} ({item.instansi})
          </DialogDescription>
        </div>
        <div className="flex items-center gap-2">
          <div className="inline-flex rounded-lg border border-slate-200 bg-slate-100 p-0.5">
            <button
              type="button"
              onClick={() => onModeChange('blanko')}
              className={cn(
                'inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-[11px] font-semibold transition-all',
                previewMode === 'blanko'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              )}
            >
              <FileText className="h-3 w-3" />
              Blanko Standar
            </button>
            <button
              type="button"
              onClick={() => onModeChange('html')}
              className={cn(
                'inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-[11px] font-semibold transition-all',
                previewMode === 'html'
                  ? 'bg-white text-sky-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              )}
            >
              <FileCode2 className="h-3 w-3" />
              Template HTML [Kode_Isian]
            </button>
          </div>
          <Badge className="bg-sky-700 font-mono text-[11px]">
            {item.formatLembar} • {isLandscape ? 'Landscape' : 'Potrait'}
          </Badge>
        </div>
      </div>
    </DialogHeader>
  );
}


