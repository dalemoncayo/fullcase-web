'use client';

import { useRouter } from 'next/navigation';
import { ReactNode, useEffect } from 'react';
import { AppShell } from '@/components/shared/app-shell';
import { useAuth } from '@/components/shared/auth-provider';
import { Skeleton } from '@/components/ui/skeleton';

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [loading, user, router]);

  if (loading || !user) {
    return <Skeleton className="h-screen w-full" />;
  }

  return <AppShell>{children}</AppShell>;
}
