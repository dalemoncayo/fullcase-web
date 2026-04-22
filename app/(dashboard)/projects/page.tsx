'use client';

import { ArrowUpRightIcon, FolderCode } from 'lucide-react';
import Link from 'next/link';
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
          <Button>Create Project</Button>
          <Button variant="outline">Import Project</Button>
        </EmptyContent>
        <Button
          variant="link"
          asChild
          className="text-muted-foreground mt-4"
          size="sm"
        >
          <Link href="/docs">
            Learn More <ArrowUpRightIcon />
          </Link>
        </Button>
      </Empty>
    </div>
  );
}
