'use client';

import {
  collection,
  onSnapshot,
  orderBy,
  query,
  where,
} from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase/config';
import { createProject as createProjectService } from '@/services/project-service';
import type { Project } from '@/types';
import { useAuth } from './use-auth';

export function useProjects() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!user) {
      setProjects([]);
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'projects'),
      where('memberIds', 'array-contains', user.uid),
      orderBy('createdAt', 'desc'),
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const items = snapshot.docs.map(
          (doc) => ({ id: doc.id, ...doc.data() }) as Project,
        );
        setProjects(items);
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching projects:', err);
        setError(
          err instanceof Error ? err : new Error('Failed to fetch projects'),
        );
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, [user]);

  const createProject = async (
    data: Pick<Project, 'name' | 'description'>,
    userData: {
      id: string;
      displayName: string | null;
      email: string | null;
      photoURL: string | null;
    },
  ) => {
    try {
      setError(null);
      const projectId = await createProjectService(data, userData);
      return projectId;
    } catch (err) {
      const error =
        err instanceof Error ? err : new Error('Failed to create project');
      setError(error);
      throw error;
    }
  };

  return {
    projects,
    createProject,
    loading,
    error,
  };
}
