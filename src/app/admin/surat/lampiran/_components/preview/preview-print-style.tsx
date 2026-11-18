'use client';

interface PreviewPrintStyleProps {
  isLandscape: boolean;
  isF101: boolean;
  previewMode: 'blanko' | 'html';
}

export function PreviewPrintStyle({ isLandscape, isF101, previewMode }: PreviewPrintStyleProps) {
  return (
    <style jsx global>{`
      @media print {
        body {
          background: white !important;
          margin: 0 !important;
          padding: 0 !important;
        }
        body * {
          visibility: hidden !important;
        }
        #printable-lampiran-sheet,
        #printable-lampiran-sheet * {
          visibility: visible !important;
        }
        #printable-lampiran-sheet {
          position: ${isF101 && previewMode === 'blanko' ? 'static' : 'absolute'} !important;
          left: 0 !important;
          top: 0 !important;
          width: 100% !important;
          max-width: 100% !important;
          margin: 0 !important;
          padding: ${isF101 && previewMode === 'blanko' ? '0' : '8mm 12mm'} !important;
          background: white !important;
          color: black !important;
          box-shadow: none !important;
          border: none !important;
          display: block !important;
        }
        .f101-page-1 {
          width: 100% !important;
          max-width: 100% !important;
          margin: 0 !important;
          padding: 1.5mm 3mm !important;
          page-break-after: always !important;
          break-after: page !important;
          page-break-inside: avoid !important;
          break-inside: avoid !important;
          box-sizing: border-box !important;
          display: block !important;
        }
        .f101-page-2 {
          width: 100% !important;
          max-width: 100% !important;
          margin: 0 !important;
          padding: 1.5mm 3mm !important;
          page-break-before: always !important;
          break-before: page !important;
          page-break-after: avoid !important;
          break-after: avoid !important;
          page-break-inside: avoid !important;
          break-inside: avoid !important;
          box-sizing: border-box !important;
          display: block !important;
        }
        @page {
          size: ${isLandscape ? 'landscape' : 'auto'};
          margin: ${isLandscape ? '4mm 6mm' : '8mm'};
        }
      }
    `}</style>
  );
}


