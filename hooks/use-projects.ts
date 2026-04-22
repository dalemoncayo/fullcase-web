'use client';

import { useState } from 'react';
import { createProject as createProjectService } from '@/services/project-service';
import type { Project } from '@/types';

export function useProjects() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const createProject = async (
    data: Pick<Project, 'name' | 'description'>,
    user: {
      id: string;
      displayName: string | null;
      email: string | null;
      photoURL: string | null;
    },
  ) => {
    try {
      setLoading(true);
      setError(null);
      const projectId = await createProjectService(data, user);
      return projectId;
    } catch (err) {
      const error =
        err instanceof Error ? err : new Error('Failed to create project');
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return {
    createProject,
    loading,
    error,
  };
}
