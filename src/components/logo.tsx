'use client';

import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { VillageLogoInfo } from '@/lib/types';
import { doc } from 'firebase/firestore';
import Image from 'next/image';
import { Mountain } from "lucide-react";
import { Skeleton } from './ui/skeleton';
import { cn } from '@/lib/utils';

export function Logo({ className }: { className?: string } = {}) {
  const firestore = useFirestore();
  const logoRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, 'villageLogo', 'default');
  }, [firestore]);

  const { data: logoData, isLoading } = useDoc<VillageLogoInfo>(logoRef, { suppressGlobalError: true });

  return (
    <div className={cn("flex items-center gap-2 sm:gap-3 min-w-0", className)}>
      {isLoading ? (
        <Skeleton className="h-8 w-8 sm:h-9 sm:w-9 rounded-xl shrink-0" />
      ) : logoData?.logoImageUrl ? (
        <Image
          src={logoData.logoImageUrl}
          alt="Logo Desa"
          width={36}
          height={36}
          className="h-8 w-8 sm:h-9 sm:w-9 object-contain shrink-0"
        />
      ) : (
        <div className="h-8 w-8 sm:h-9 sm:w-9 bg-accent rounded-xl flex items-center justify-center text-white shadow-lg shadow-accent/20 shrink-0">
          <Mountain className="h-4 w-4 sm:h-5 sm:w-5" />
        </div>
      )}
      <div className="flex flex-col min-w-0">
        <span className="text-[11px] sm:text-sm font-sans font-bold leading-tight uppercase tracking-wider sm:tracking-[0.16em] whitespace-nowrap">
          DESA SAMPELDES
        </span>
        <span className="text-[8px] sm:text-[10px] font-bold text-teal-600 dark:text-teal-400 uppercase tracking-wider sm:tracking-[0.2em] mt-0.5 whitespace-nowrap">
          GANDRUNGMANGU • CILACAP
        </span>
      </div>
    </div>
  );
}
