import { notFound } from "next/navigation";
import { getProject } from "@/lib/db/projects";
import { ProjectSettingsForm } from "@/components/dashboard/project-settings-form";
import { EmbedSnippet } from "@/components/dashboard/embed-snippet";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default async function ProjectSettingsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const project = await getProject(id);
  if (!project) notFound();

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://helpforge.vercel.app";

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Customization</CardTitle>
          <CardDescription>
            How the chatbot identifies itself and what it falls back on. Brand color also drives the
            project chip in your projects list.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ProjectSettingsForm project={project} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Embed snippet</CardTitle>
          <CardDescription>
            Drop this into any HTML page to mount the Helpforge chat widget bound to this project.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <EmbedSnippet projectId={project.id} siteUrl={siteUrl} />
          <p className="text-muted-foreground mt-3 text-xs">
            Note: <code>widget.js</code> is currently a stub — the actual embeddable widget is on
            the Phase 7 polish list. The snippet itself is final and ready to ship.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
