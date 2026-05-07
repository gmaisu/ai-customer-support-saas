import Link from "next/link";
import { ArrowRightIcon } from "lucide-react";
import { listProjects } from "@/lib/db/projects";
import { NewProjectDialog } from "@/components/dashboard/new-project-dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata = {
  title: "Projects — Helpforge",
};

function formatRelative(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.round(diff / 60000);
  if (min < 1) return "just now";
  if (min < 60) return `${min} min ago`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.round(hr / 24);
  return `${day}d ago`;
}

export default async function ProjectsPage() {
  const projects = await listProjects();

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Projects</h1>
          <p className="text-muted-foreground text-sm">
            Each project is one chatbot trained on its own content.
          </p>
        </div>
        {projects.length > 0 && <NewProjectDialog />}
      </header>

      {projects.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center gap-4 py-12 text-center">
            <div className="bg-muted text-muted-foreground rounded-full p-4">
              <ArrowRightIcon className="size-6" />
            </div>
            <div className="space-y-1">
              <p className="font-medium">No projects yet</p>
              <p className="text-muted-foreground max-w-sm text-sm">
                Create your first project to start forging an AI support bot from your website,
                PDFs, or pasted FAQ text.
              </p>
            </div>
            <NewProjectDialog triggerLabel="Create your first project" />
          </CardContent>
        </Card>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((p) => (
            <li key={p.id}>
              <Link href={`/dashboard/projects/${p.id}`}>
                <Card className="hover:border-primary/40 transition-all hover:shadow-sm">
                  <CardHeader className="flex flex-row items-start gap-3">
                    <span
                      className="mt-1 size-3 shrink-0 rounded-full"
                      style={{ backgroundColor: p.brand_color }}
                      aria-hidden
                    />
                    <div className="min-w-0 flex-1">
                      <CardTitle className="truncate text-base">{p.name}</CardTitle>
                      <CardDescription>Updated {formatRelative(p.updated_at)}</CardDescription>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground line-clamp-2 text-sm">{p.greeting}</p>
                  </CardContent>
                </Card>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
