'use client';

import { useMemo } from 'react';
import { cn } from '@/lib/utils';
import {
  type LampiranSuratItem,
  getDefaultLampiranHtmlTemplate,
  buildLampiranDummyPreviewContext,
  renderLampiranPagesForLetter,
} from '@/lib/lampiran-surat-data';
import { replaceOpenSidKodeIsian } from '@/lib/opensid-surat-engine';

interface PreviewSheetProps {
  item: LampiranSuratItem;
  previewMode: 'blanko' | 'html';
  marginStyle?: React.CSSProperties;
}

export function PreviewSheet({ item, previewMode, marginStyle }: PreviewSheetProps) {
  const dummyCtx = useMemo(() => buildLampiranDummyPreviewContext(item), [item]);

  const renderedPages = useMemo(() => {
    // 1. Coba render halaman presisi dari modul resmi lampiran
    const letterPages = renderLampiranPagesForLetter([item.kode], dummyCtx);
    if (letterPages && letterPages.length > 0) {
      return letterPages.map((p) => p.html);
    }

    // 2. Fallback ke template HTML mentah (jika kustom desa atau format generik)
    const rawHtml = item.templateHtml || getDefaultLampiranHtmlTemplate(item);
    return replaceOpenSidKodeIsian(rawHtml, dummyCtx).split(
      /<!--\s*(?:pagebreak|page_break)\s*-->/i
    );
  }, [item, dummyCtx]);

  return (
    <div
      id="printable-lampiran-sheet"
      style={marginStyle}
      className="mt-4 bg-white p-8 rounded-xl shadow-md border border-slate-200 print:m-0 print:p-0 print:shadow-none print:border-none"
    >
      <div className="space-y-6">
        {renderedPages.map((pageHtml, idx) => (
          <div
            key={idx}
            className={cn(
              'opensid-lampiran-rendered text-black',
              idx > 0 &&
                'border-t-2 border-dashed border-slate-300 pt-6 print:border-none print:pt-0 print:break-before-page'
            )}
            dangerouslySetInnerHTML={{ __html: pageHtml }}
          />
        ))}
      </div>
    </div>
  );
}


