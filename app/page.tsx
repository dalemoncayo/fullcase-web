'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useAuth } from '@/components/shared/auth-provider';
import { Skeleton } from '@/components/ui/skeleton';

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (user) {
        router.replace('/projects');
      } else {
        router.replace('/login');
      }
    }
  }, [user, loading, router]);

  if (loading) return <Skeleton className="h-screen w-full" />;

  return null;
}
