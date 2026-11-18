'use client';

import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, ShieldCheck } from 'lucide-react';
import { Logo } from '@/components/logo';

export default function PortalPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] dark:bg-[#060b11] p-4 font-sans">
      <Card className="w-full max-w-md shadow-xl rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white/95 dark:bg-[#081d27]/90 backdrop-blur-xl overflow-hidden">
        <CardHeader className="text-center space-y-4 pt-8">
          <div className="flex justify-center">
            <Logo />
          </div>
          <div className="space-y-2">
            <CardTitle className="text-2xl font-condensed font-bold uppercase tracking-tight text-slate-900 dark:text-white">Portal Layanan Digital</CardTitle>
            <CardDescription className="text-slate-600 dark:text-slate-400 text-xs sm:text-sm">
              Warga dapat langsung menggunakan layanan publik tanpa mengisi data telepon atau email. Login hanya untuk admin desa.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="px-6 pb-6">
          <Button onClick={() => router.push('/dashboard')} className="w-full h-11 bg-teal-600 hover:bg-teal-500 text-white font-condensed font-bold uppercase tracking-wider rounded-full shadow-md">
            Masuk ke Layanan
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </CardContent>
        <CardFooter className="bg-slate-50 dark:bg-white/[0.02] border-t border-slate-100 dark:border-white/10 flex items-center justify-center p-4">
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 font-medium">
            <ShieldCheck className="h-4 w-4 text-teal-600 dark:text-teal-400" />
            Akses layanan publik tersedia tanpa registrasi tambahan.
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
