'use client';

import {
  collection,
  onSnapshot,
  orderBy,
  query,
  where,
} from 'firebase/firestore';
import { useCallback, useEffect, useState } from 'react';
import { db } from '@/lib/firebase/config';
import {
  createProject as createProjectService,
  deleteProject as deleteProjectService,
} from '@/services/project-service';
import type { Project } from '@/types';
import { useAuth } from './use-auth';

export function useProjects() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!user?.uid) {
      if (!user) {
        setProjects([]);
        setLoading(false);
      }
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
  }, [user?.uid, user]);

  return {
    projects,
    loading,
    error,
  };
}

export function useProjectActions() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const createProject = useCallback(
    async (
      data: Pick<Project, 'name' | 'description'>,
      userData: {
        id: string;
        displayName: string | null;
        email: string | null;
        photoURL: string | null;
      },
    ) => {
      try {
        setLoading(true);
        setError(null);
        const projectId = await createProjectService(data, userData);
        return projectId;
      } catch (err) {
        const error =
          err instanceof Error ? err : new Error('Failed to create project');
        setError(error);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const deleteProject = useCallback(async (projectId: string) => {
    try {
      setLoading(true);
      setError(null);
      await deleteProjectService(projectId);
    } catch (err) {
      const error =
        err instanceof Error ? err : new Error('Failed to delete project');
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    createProject,
    deleteProject,
    loading,
    error,
  };
}
