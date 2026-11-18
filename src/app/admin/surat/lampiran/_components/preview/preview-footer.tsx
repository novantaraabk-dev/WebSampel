'use client';

import { DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Printer } from 'lucide-react';

interface PreviewFooterProps {
  previewMode: 'blanko' | 'html';
  onClose: () => void;
}

export function PreviewFooter({ previewMode, onClose }: PreviewFooterProps) {
  return (
    <DialogFooter className="bg-white -mx-6 -mb-6 p-4 border-t gap-2 sm:gap-0 sticky bottom-0 z-10 print:hidden">
      <Button variant="outline" size="sm" onClick={onClose}>
        Tutup Pratinjau
      </Button>
      <Button
        size="sm"
        onClick={() => window.print()}
        className="bg-slate-900 hover:bg-slate-800 text-white gap-1.5 shadow-sm"
      >
        <Printer className="h-3.5 w-3.5" />
        <span>Cetak Lampiran ({previewMode === 'html' ? 'Template HTML' : 'Blanko Standar'})</span>
      </Button>
    </DialogFooter>
  );
}


