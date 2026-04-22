'use client';

import { useRouter } from 'next/navigation';
import { ReactNode, useEffect } from 'react';
import { useAuth } from '@/components/shared/auth-provider';

export default function AuthLayout({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.replace('/projects');
    }
  }, [loading, user, router]);

  if (loading || user) {
    return null;
  }

  return <>{children}</>;
}
