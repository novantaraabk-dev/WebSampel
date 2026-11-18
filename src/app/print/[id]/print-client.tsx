'use client';

import { useParams, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { getSubmissionById } from '@/lib/submissions';
import { LetterSubmission } from '@/lib/types';
import { Loader2, AlertCircle, FileSearch, ShieldAlert } from 'lucide-react';
import { OpenSidPrintTemplate } from '../_components/opensid-print-template';
import { useFirebase, useCollection, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';
import type { PermohonanSuratItem } from '@/lib/permohonan-surat-data';

export function PrintClient() {
  const params = useParams();
  const searchParams = useSearchParams();
  const rawId = params?.id as string;
  const queryId = searchParams?.get('id');
  
  let id = '';
  if (queryId) {
    id = decodeURIComponent(queryId).trim();
  } else if (rawId && rawId !== 'preview') {
    id = decodeURIComponent(rawId).trim();
  } else if (typeof window !== 'undefined') {
    const pathParts = window.location.pathname.split('/').filter(Boolean);
    const lastPart = pathParts[pathParts.length - 1];
    if (lastPart && lastPart !== 'print' && lastPart !== 'preview') {
      id = decodeURIComponent(lastPart).trim();
    }
  }
  
  const [submission, setSubmission] = useState<LetterSubmission | 'not_found' | 'error' | 'verifying' | null>(null);
  const { firestore, isUserLoading } = useFirebase();

  const masterSuratRef = useMemoFirebase(
    () => (firestore ? collection(firestore, 'pengaturan_permohonan_surat') : null),
    [firestore],
  );
  const { data: masterItems } = useCollection<PermohonanSuratItem>(masterSuratRef);

  useEffect(() => {
    // Tunggu hingga Firebase siap
    if (!id || !firestore || isUserLoading) return;

    const fetchSubmission = async () => {
      try {
        const foundSubmission = await getSubmissionById(firestore, id);
        if (foundSubmission) {
          setSubmission(foundSubmission);
        } else {
          setSubmission('not_found');
        }
      } catch (error: any) {
        console.error("Error fetching submission for print:", error);
        setSubmission('error');
      }
    };
    
    fetchSubmission();
  }, [id, firestore, isUserLoading]);

  if (!id && !isUserLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-50 p-8">
        <div className="max-w-md w-full p-8 bg-white rounded-[2rem] shadow-xl border border-slate-100 text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center">
            <FileSearch className="h-8 w-8 text-slate-400" />
          </div>
          <h2 className="text-xl font-black text-slate-900 uppercase">Halaman Cetak Dokumen</h2>
          <p className="text-slate-500 text-sm leading-relaxed">
            Tidak ada dokumen yang dipilih untuk dicetak. Silakan pilih dokumen dari menu Admin Surat.
          </p>
        </div>
      </div>
    );
  }

  // Loading state yang lebih sabar
  if (isUserLoading || (id && !submission)) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center bg-slate-50">
        <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
        <div className="text-center space-y-2">
            <p className="text-sm font-black uppercase tracking-widest text-slate-900">
                Memverifikasi Otoritas Admin
            </p>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest animate-pulse">
                Mohon tunggu sejenak, sedang memulihkan sesi Anda...
            </p>
        </div>
      </div>
    );
  }

  if (submission === 'error') {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-50 p-8">
        <div className="max-w-md w-full p-10 bg-white rounded-[3rem] shadow-2xl border border-red-100 text-center space-y-6">
            <div className="mx-auto w-20 h-20 bg-red-50 rounded-3xl flex items-center justify-center">
                <ShieldAlert className="h-10 w-10 text-red-500" />
            </div>
            <div className="space-y-2">
                <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight italic">Akses Dibatasi</h2>
                <p className="text-slate-500 text-sm leading-relaxed">
                    Sistem tidak dapat memverifikasi izin Admin Anda. Hal ini biasanya terjadi jika sesi login kadaluwarsa atau tab baru gagal mendeteksi identitas Anda.
                </p>
            </div>
            <div className="pt-4 flex flex-col gap-3">
                <button 
                  onClick={() => window.location.reload()} 
                  className="w-full py-4 bg-primary text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-800 transition-all active:scale-95 shadow-xl shadow-primary/20"
                >
                  MUAT ULANG HALAMAN
                </button>
                <button 
                  onClick={() => window.location.href = '/login'} 
                  className="w-full py-4 bg-slate-100 text-slate-600 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-200 transition-all"
                >
                  LOGIN ULANG ADMIN
                </button>
            </div>
        </div>
      </div>
    );
  }

  if (submission === 'not_found') {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[#FAF8F5] p-8 font-sans">
        <div className="max-w-md w-full p-8 bg-white rounded-[1.4rem] shadow-md border border-stone-200/90 text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-[#d4e157]/20 rounded-2xl flex items-center justify-center">
                <FileSearch className="h-8 w-8 text-[#4c5b08]" />
            </div>
            <h2 className="text-xl font-condensed font-bold text-slate-900 uppercase">Data Tidak Ditemukan</h2>
            <p className="text-slate-500 text-sm leading-relaxed">
                Maaf, data pengajuan dengan ID tersebut tidak tersedia di database.
            </p>
        </div>
      </div>
    );
  }

  if (submission && typeof submission !== 'string' && !submission.documentNumber) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[#FAF8F5] p-8 font-sans">
        <div className="max-w-md w-full p-8 bg-white rounded-[1.4rem] shadow-md border border-stone-200/90 text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-[#d4e157]/20 rounded-2xl flex items-center justify-center">
                <AlertCircle className="h-8 w-8 text-[#4c5b08]" />
            </div>
            <h2 className="text-xl font-condensed font-bold text-slate-900 uppercase">Nomor Surat Belum Ada</h2>
            <p className="text-slate-500 text-sm leading-relaxed">
                Dokumen tidak dapat dicetak karena belum memiliki nomor surat resmi. <br/>
                Silakan kembali ke dasbor admin dan klik tombol <strong>"Buat Nomor"</strong> terlebih dahulu.
            </p>
        </div>
      </div>
    );
  }

  if (!submission || typeof submission === 'string') return null;

  return (
    <div className="relative">
      <OpenSidPrintTemplate submission={submission} masterItems={masterItems || undefined} />
    </div>
  );
}
