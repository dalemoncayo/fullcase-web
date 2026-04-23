'use client';

import { toast } from 'sonner';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { useProjectActions } from '@/hooks/use-projects';

interface DeleteProjectDialogProps {
  projectId: string;
  projectName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DeleteProjectDialog({
  projectId,
  projectName,
  open,
  onOpenChange,
}: DeleteProjectDialogProps) {
  const { deleteProject } = useProjectActions();

  const handleDelete = async () => {
    try {
      await deleteProject(projectId);
      toast.success('Project deleted successfully');
      onOpenChange(false);
    } catch (error) {
      toast.error('Failed to delete project');
      console.error(error);
    }
  };

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      onConfirm={handleDelete}
      title="Delete Project"
      description={`Are you sure you want to delete "${projectName}"? This action cannot be undone and all associated data will be lost.`}
      confirmText="Delete"
      variant="destructive"
    />
  );
}
