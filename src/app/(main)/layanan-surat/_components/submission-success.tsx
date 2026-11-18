
'use client';

import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, Ticket, FilePlus2, Download, Loader2 } from 'lucide-react';
import { toPng } from 'html-to-image';
import { useToast } from '@/hooks/use-toast';

interface SubmissionSuccessProps {
  ticketNumber: string;
  onReset: () => void;
}

export function SubmissionSuccess({ ticketNumber, onReset }: SubmissionSuccessProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const { toast } = useToast();

  const handleDownloadImage = async () => {
    if (cardRef.current === null) return;

    setIsDownloading(true);
    try {
      // Tunggu sebentar agar render UI stabil
      await new Promise(resolve => setTimeout(resolve, 300));

      const options = {
        backgroundColor: '#ffffff',
        cacheBust: true,
        pixelRatio: 2, // Kualitas lebih tajam
        style: {
          margin: '0',
          padding: '20px',
        }
      };

      let dataUrl;
      try {
        // Percobaan pertama: Normal
        dataUrl = await toPng(cardRef.current, options);
      } catch (innerError) {
        // Percobaan kedua: Tanpa font embedding jika terjadi SecurityError
        console.warn("Mencoba mengunduh tanpa font embedding karena pembatasan keamanan CSS.");
        dataUrl = await toPng(cardRef.current, { ...options, fontEmbedCSS: '' });
      }

      const link = document.createElement('a');
      link.download = `tiket-desa-${ticketNumber}.png`;
      link.href = dataUrl;
      link.click();

      toast({
        title: "Berhasil",
        description: "Tiket telah disimpan ke perangkat Anda.",
      });
    } catch (err) {
      console.error('Gagal mengunduh gambar:', err);
      toast({
        title: "Gagal Mengunduh",
        description: "Maaf, terjadi kesalahan saat memproses gambar. Silakan screenshot layar Anda sebagai alternatif.",
        variant: "destructive",
      });
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="flex flex-col items-center py-4 sm:py-8 space-y-6">
      <div ref={cardRef} className="w-full max-w-lg neu-card-elevated bg-white dark:bg-[#081d27] rounded-[24px] sm:rounded-[32px] border border-white/70 p-5 sm:p-7">
        <div className="flex flex-col items-center text-center space-y-3">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full neu-btn-circle text-emerald-700">
            <CheckCircle className="w-8 h-8 sm:w-9 sm:h-9" />
          </div>
          <div className="space-y-1">
            <h2 className="text-xl sm:text-2xl font-condensed font-black uppercase tracking-tight text-slate-900">
              Selamat! Pengajuan Berhasil
            </h2>
            <p className="text-xs sm:text-sm text-slate-600">
              Simpan tiket ini untuk mengecek progres surat Anda.
            </p>
          </div>
        </div>

        <div className="mt-6 space-y-4">
          <div className="neu-inset rounded-2xl p-4 sm:p-6 text-center border border-white/60">
            <p className="text-[10px] sm:text-[11px] font-black text-emerald-800 uppercase tracking-widest mb-1.5">
              KODE TIKET ANDA
            </p>
            <div className="flex items-center justify-center gap-2.5">
              <Ticket className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-700 shrink-0" />
              <p className="text-2xl min-[400px]:text-3xl sm:text-4xl font-mono font-black tracking-widest text-emerald-950">
                {ticketNumber}
              </p>
            </div>
          </div>

          <div className="neu-inset rounded-2xl p-4 text-xs sm:text-sm text-slate-700 space-y-2 border border-white/60">
            <p className="font-bold text-slate-900 uppercase text-[11px] tracking-wider">
              Informasi Pengambilan Surat:
            </p>
            <p className="leading-relaxed">
              Ketika status <strong className="text-emerald-800 font-bold">"Disetujui"</strong>, surat dapat diambil di <strong className="text-slate-900 font-bold">Balai Desa Sampeldes</strong>.
            </p>
            <ul className="list-disc pl-4 space-y-0.5 text-[11px] sm:text-xs text-slate-600">
              <li><strong>Senin - Jumat:</strong> 07:00 - 16:00 WIB</li>
              <li><strong>Sabtu & Minggu:</strong> Libur</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 w-full max-w-lg">
        <Button
          onClick={handleDownloadImage}
          variant="outline"
          className="flex-1 h-12 rounded-full neu-btn text-emerald-800 hover:text-emerald-950 font-bold uppercase text-[11px] tracking-wider border-0"
          disabled={isDownloading}
        >
          {isDownloading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
          Simpan Tiket (Gambar)
        </Button>
        <Button
          onClick={onReset}
          className="flex-1 h-12 rounded-full neu-btn-dark text-white font-bold uppercase text-[11px] tracking-wider border-0"
        >
          <FilePlus2 className="mr-2 h-4 w-4" />
          Buat Pengajuan Baru
        </Button>
      </div>
    </div>
  );
}
