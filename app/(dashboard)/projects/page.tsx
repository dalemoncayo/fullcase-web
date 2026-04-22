import { PageHeader } from '@/components/shared/page-header';

export default function ProjectsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Projects"
        description="Manage your projects and testing modules."
      />
      <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
        <p>You don&apos;t have any projects yet.</p>
      </div>
    </div>
  );
}
