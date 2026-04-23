'use client';

import { FolderCode, Plus } from 'lucide-react';
import { useState } from 'react';
import { CreateProjectDialog } from '@/components/projects/project-dialog';
import { ProjectList } from '@/components/projects/project-list';
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/shared/empty-state';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useProjects } from '@/hooks/use-projects';

export default function ProjectsPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { projects, loading } = useProjects();

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex justify-end">
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-48 w-full rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col p-6 space-y-6">
      {projects.length > 0 && (
        <div className="flex justify-end">
          <Button onClick={() => setIsDialogOpen(true)}>
            <Plus className="h-4 w-4" />
            Create Project
          </Button>
        </div>
      )}

      {projects.length > 0 ? (
        <ProjectList projects={projects} />
      ) : (
        <div className="flex flex-1 items-center justify-center">
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <FolderCode />
              </EmptyMedia>
              <EmptyTitle>No Projects Yet</EmptyTitle>
              <EmptyDescription>
                You haven&apos;t created any projects yet. Get started by
                creating your first project.
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent className="flex-row justify-center gap-2">
              <Button onClick={() => setIsDialogOpen(true)}>
                Create Project
              </Button>
              <Button variant="outline">Import Project</Button>
            </EmptyContent>
          </Empty>
        </div>
      )}

      <CreateProjectDialog open={isDialogOpen} onOpenChange={setIsDialogOpen} />
    </div>
  );
}
