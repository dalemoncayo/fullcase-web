'use client';

import { FolderCode } from 'lucide-react';
import { useState } from 'react';
import { CreateProjectDialog } from '@/components/projects/project-dialog';
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/shared/empty-state';
import { Button } from '@/components/ui/button';

export default function ProjectsPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  return (
    <div className="flex h-full items-center justify-center">
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <FolderCode />
          </EmptyMedia>
          <EmptyTitle>No Projects Yet</EmptyTitle>
          <EmptyDescription>
            You haven&apos;t created any projects yet. Get started by creating
            your first project.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent className="flex-row justify-center gap-2">
          <Button onClick={() => setIsDialogOpen(true)}>Create Project</Button>
          <Button variant="outline">Import Project</Button>
        </EmptyContent>
      </Empty>

      <CreateProjectDialog open={isDialogOpen} onOpenChange={setIsDialogOpen} />
    </div>
  );
}
