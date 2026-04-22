'use client';

import { useRouter } from 'next/navigation';
import { ReactNode, useEffect } from 'react';
import { useAuth } from '@/components/shared/auth-provider';
import { Skeleton } from '@/components/ui/skeleton';

export default function AuthLayout({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.replace('/projects');
    }
  }, [loading, user, router]);

  if (loading) {
    return <Skeleton className="h-screen w-full" />;
  }
  if (user) {
    return null; // redirect pending
  }

  return <>{children}</>;
}
