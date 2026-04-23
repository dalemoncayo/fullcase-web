'use client';

import { FolderCode, MoreVertical } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { Project } from '@/types';

interface ProjectCardProps {
  project: Project;
}

export function ProjectCard({ project }: ProjectCardProps) {
  return (
    <Card className="group relative overflow-hidden transition-all hover:border-primary/50 hover:shadow-md">
      <Link href={`/projects/${project.id}`} className="absolute inset-0 z-0">
        <span className="sr-only">View project {project.name}</span>
      </Link>

      <CardHeader className="relative z-10 pb-2">
        <div className="flex items-start justify-between">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
            <FolderCode size={20} />
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreVertical size={16} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>Settings</DropdownMenuItem>
              <DropdownMenuItem className="text-destructive">
                Delete Project
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <CardTitle className="mt-4 line-clamp-1">{project.name}</CardTitle>
        <CardDescription className="line-clamp-2 min-h-[2.5rem]">
          {project.description || 'No description provided.'}
        </CardDescription>
      </CardHeader>

      <CardContent className="relative z-10 pt-0 text-xs text-muted-foreground">
        Created{' '}
        {new Date(project.createdAt.seconds * 1000).toLocaleDateString()}
      </CardContent>
    </Card>
  );
}
