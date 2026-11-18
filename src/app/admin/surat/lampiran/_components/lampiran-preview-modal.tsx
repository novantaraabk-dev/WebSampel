'use client';

import { useState, useEffect } from 'react';
import type { LampiranSuratItem } from '@/lib/lampiran-surat-data';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import {
  PreviewHeader,
  PreviewFooter,
  PreviewPrintStyle,
  PreviewSheet,
} from './preview';

interface LampiranPreviewModalProps {
  item: LampiranSuratItem | null;
  onClose: () => void;
}

export function LampiranPreviewModal({ item, onClose }: LampiranPreviewModalProps) {
  const [previewMode, setPreviewMode] = useState<'blanko' | 'html'>('blanko');

  useEffect(() => {
    if (item) {
      setPreviewMode(item.useCustomTemplate ? 'html' : 'blanko');
    }
  }, [item]);

  if (!item) return null;

  const isF101 = item.kode.toUpperCase().includes('F-1.01') || item.kode.toUpperCase() === 'F1.01';
  const isLandscape =
    item.orientasi === 'Landscape' ||
    isF101 ||
    (item.formatLembar && item.formatLembar.toLowerCase().includes('landscape'));

  const marginStyle =
    !item.marginGlobal && item.margin
      ? {
          paddingTop: `${item.margin.atas}cm`,
          paddingRight: `${item.margin.kanan}cm`,
          paddingBottom: `${item.margin.bawah}cm`,
          paddingLeft: `${item.margin.kiri}cm`,
        }
      : undefined;

  return (
    <>
      {/* Global CSS for Print so ONLY the sheet prints */}
      <PreviewPrintStyle
        isLandscape={!!isLandscape}
        isF101={isF101}
        previewMode={previewMode}
      />

      <Dialog open={!!item} onOpenChange={(open) => !open && onClose()}>
        <DialogContent
          className={cn(
            'max-h-[92vh] overflow-y-auto p-6 bg-slate-100 print:p-0 print:bg-white print:max-w-none print:overflow-visible print:h-auto',
            isLandscape ? 'max-w-6xl' : 'max-w-3xl'
          )}
        >
          {/* Header */}
          <PreviewHeader
            item={item}
            isLandscape={!!isLandscape}
            previewMode={previewMode}
            onModeChange={setPreviewMode}
          />

          {/* Printable Document Sheet Container */}
          <PreviewSheet
            item={item}
            previewMode={previewMode}
            marginStyle={marginStyle}
          />

          {/* Footer */}
          <PreviewFooter previewMode={previewMode} onClose={onClose} />
        </DialogContent>
      </Dialog>
    </>
  );
}

