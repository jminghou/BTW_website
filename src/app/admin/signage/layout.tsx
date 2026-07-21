'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import SignageNavbar from '@/components/signage/SignageNavbar';

export default function SignageAdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [isAuthChecked, setIsAuthChecked] = useState(false);

  // 簡易認證守衛：沿用官網的 localStorage userInfo 機制
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const userInfo = localStorage.getItem('userInfo');
    if (!userInfo) {
      router.replace('/admin');
      return;
    }
    setIsAuthChecked(true);
  }, [router]);

  if (!isAuthChecked) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">驗證中...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <SignageNavbar />
      <main className="mx-auto max-w-7xl px-4 pb-10 pt-28 sm:px-6 md:pt-20 lg:px-8">
        {children}
      </main>
    </div>
  );
}
