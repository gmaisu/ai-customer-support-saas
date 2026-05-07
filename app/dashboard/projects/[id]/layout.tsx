import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeftIcon } from "lucide-react";
import { getProject } from "@/lib/db/projects";
import { ProjectTabs } from "@/components/dashboard/project-tabs";
import { DeleteProjectButton } from "@/components/dashboard/delete-project-button";

export default async function ProjectLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const project = await getProject(id);
  if (!project) notFound();

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/dashboard/projects"
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm"
        >
          <ChevronLeftIcon className="size-4" /> All projects
        </Link>
      </div>

      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <span
            className="mt-1.5 size-4 shrink-0 rounded-full"
            style={{ backgroundColor: project.brand_color }}
            aria-hidden
          />
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{project.name}</h1>
            <p className="text-muted-foreground text-sm">
              Created {new Date(project.created_at).toLocaleDateString()}
            </p>
          </div>
        </div>
        <DeleteProjectButton projectId={project.id} projectName={project.name} />
      </header>

      <ProjectTabs projectId={project.id} />

      <div>{children}</div>
    </div>
  );
}
