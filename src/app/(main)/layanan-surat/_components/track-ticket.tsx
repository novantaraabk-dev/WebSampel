'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { LetterSubmission } from '@/lib/types';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CheckCircle, Info, Loader2, Search, XCircle } from 'lucide-react';
import { getSubmissionById } from '@/lib/submissions';
import { useFirebase } from '@/firebase';

export function TrackTicket() {
  const [ticketNumber, setTicketNumber] = useState('');
  const [searchResult, setSearchResult] = useState<LetterSubmission | 'not_found' | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { firestore } = useFirebase();

  const handleSearch = async () => {
    if (!ticketNumber.trim()) {
      setSearchResult(null);
      return;
    }
    setIsLoading(true);
    setSearchResult(null);

    const foundSubmission = await getSubmissionById(firestore, ticketNumber.trim());

    if (foundSubmission) {
      setSearchResult(foundSubmission);
    } else {
      setSearchResult('not_found');
    }
    setIsLoading(false);
  };

  const getStatusInfo = (status: 'approved' | 'pending' | 'rejected' | 'processing') => {
    switch (status) {
      case 'approved':
        return {
          title: 'Telah Diproses',
          variant: 'default',
          icon: <CheckCircle className="h-4 w-4 text-emerald-500" />,
          description: 'Surat pengajuan Anda telah selesai diproses dan sudah bisa diambil ke Pelayanan Desa Sampeldes pada pukul 07.00 WIB s.d 16.00 WIB (Senin s.d Jumat). Terima Kasih.'
        };
      case 'pending':
      case 'processing':
        return {
          title: 'Sedang Diproses',
          variant: 'default',
          icon: <Loader2 className="h-4 w-4 text-yellow-500 animate-spin" />,
          description: 'Pengajuan Anda sedang dalam proses peninjauan oleh administrasi desa. Silakan cek kembali secara berkala.'
        };
      case 'rejected':
        return {
          title: 'Ditolak',
          variant: 'destructive',
          icon: <XCircle className="h-4 w-4" />,
          description: 'Maaf, pengajuan Anda ditolak. Silakan hubungi kantor desa untuk informasi lebih lanjut.'
        };
    }
  }

  return (
    <div className="neu-card-elevated rounded-[22px] min-[400px]:rounded-[26px] sm:rounded-[36px] p-4 min-[400px]:p-5 sm:p-8 border border-white/60 dark:border-white/10">
      <div className="space-y-1 mb-4 sm:mb-5">
        <h3 className="text-sm min-[400px]:text-base sm:text-xl font-condensed font-black uppercase tracking-tight text-slate-900 dark:text-white">
          Cek Status Pengajuan Tiket
        </h3>
        <p className="text-[11px] sm:text-sm text-stone-600 dark:text-stone-300 font-medium">
          Masukkan kode tiket Anda untuk melacak progres pengajuan surat secara langsung.
        </p>
      </div>

      <div>
        <div className="flex flex-col sm:flex-row w-full max-w-xl items-stretch sm:items-center gap-2.5 sm:gap-3">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Contoh: Abc123Xyz..."
              value={ticketNumber}
              onChange={(e) => setTicketNumber(e.target.value)}
              disabled={isLoading}
              onKeyUp={(e) => e.key === 'Enter' && handleSearch()}
              className="w-full h-11 sm:h-12 px-4 sm:px-5 rounded-full text-xs sm:text-sm neu-inset text-slate-900 dark:text-white placeholder:text-stone-400 dark:placeholder:text-stone-500 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-700/50 dark:focus:ring-teal-500/50"
            />
          </div>
          <button
            onClick={handleSearch}
            disabled={isLoading || !firestore}
            className="neu-btn-dark h-11 sm:h-12 rounded-full px-5 sm:px-6 font-bold uppercase tracking-wider text-xs sm:text-sm shrink-0 flex items-center justify-center gap-2 hover:opacity-90 transition-opacity border-0"
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin text-emerald-400" /> : <Search className="h-4 w-4 text-emerald-400" />}
            <span>Cek Tiket</span>
          </button>
        </div>

        {searchResult && (
          <div className="mt-4 sm:mt-5">
            {searchResult === 'not_found' ? (
              <div className="neu-inset rounded-2xl p-4 border border-rose-500/30 bg-rose-500/10 flex items-start gap-3">
                <Info className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <p className="text-xs sm:text-sm font-bold text-rose-950">Tidak Ditemukan</p>
                  <p className="text-[11px] sm:text-xs text-rose-800 leading-relaxed">
                    Kode tiket tidak ditemukan. Pastikan Anda memasukkan kode yang benar.
                  </p>
                </div>
              </div>
            ) : (
              <div className="neu-inset rounded-2xl p-4 border border-emerald-500/30 bg-emerald-500/10 flex items-start gap-3">
                <div className="mt-0.5 shrink-0">
                  {getStatusInfo(searchResult.status).icon}
                </div>
                <div className="space-y-0.5">
                  <p className="text-xs sm:text-sm font-bold text-emerald-950">
                    {getStatusInfo(searchResult.status).title}
                  </p>
                  <p className="text-[11px] sm:text-xs text-emerald-900 leading-relaxed">
                    {getStatusInfo(searchResult.status).description}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
