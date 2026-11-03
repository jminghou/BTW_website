'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import SignageNavbar from '@/components/signage/SignageNavbar';
import { fieldStaffHome, isFieldStaff, readStaffSession } from '@/lib/fieldAccess';

export default function SignageAdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthChecked, setIsAuthChecked] = useState(false);
  const [fieldLocked, setFieldLocked] = useState(false);

  // 簡易認證守衛：沿用官網的 localStorage userInfo 機制。
  // 現場人員只能停留在所屬廠區的排程頁。
  useEffect(() => {
    const session = readStaffSession();
    if (!session) {
      setIsAuthChecked(false);
      router.replace('/admin');
      return;
    }
    if (isFieldStaff(session)) {
      const home = fieldStaffHome(session);
      if (!home) {
        localStorage.removeItem('userInfo');
        setIsAuthChecked(false);
        router.replace('/admin');
        return;
      }
      if (pathname !== home) {
        setIsAuthChecked(false);
        router.replace(home);
        return;
      }
      setFieldLocked(true);
    } else {
      setFieldLocked(false);
    }
    setIsAuthChecked(true);
  }, [router, pathname]);

  if (!isAuthChecked) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">驗證中...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <SignageNavbar fieldLocked={fieldLocked} />
      <main className="mx-auto max-w-7xl px-4 pb-10 pt-28 sm:px-6 md:pt-20 lg:px-8">
        {children}
      </main>
    </div>
  );
}
