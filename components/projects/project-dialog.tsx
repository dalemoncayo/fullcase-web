'use client';

import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useAuth } from '@/hooks/use-auth';
import { createProject } from '@/services/project-service';
import { ProjectForm, ProjectFormValues } from './project-form';

interface CreateProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateProjectDialog({
  open,
  onOpenChange,
}: CreateProjectDialogProps) {
  const { user } = useAuth();

  const handleSubmit = async (values: ProjectFormValues) => {
    if (!user) {
      toast.error('You must be logged in to create a project');
      return;
    }

    try {
      await createProject(values, {
        id: user.uid,
        displayName: user.displayName || 'Anonymous',
        email: user.email || '',
        photoURL: user.photoURL,
      });

      toast.success('Project created successfully');
      onOpenChange(false);
    } catch (error) {
      console.error('Error creating project:', error);
      toast.error('Failed to create project. Please try again.');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create Project</DialogTitle>
          <DialogDescription>
            Add a new project to organize your modules and test cases.
          </DialogDescription>
        </DialogHeader>
        <ProjectForm onSubmit={handleSubmit} />
      </DialogContent>
    </Dialog>
  );
}
