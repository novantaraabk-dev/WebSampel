'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ManajemenRootPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/manajemen/dashboard');
  }, [router]);

  return null;
}
