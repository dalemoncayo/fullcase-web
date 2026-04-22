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
    return (
      <div className="flex h-screen w-full items-center justify-center p-8">
        <Skeleton className="h-full w-full rounded-xl" />
      </div>
    );
  }

  return <AppShell>{children}</AppShell>;
}
