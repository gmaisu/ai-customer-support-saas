"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const tabs = [
  { slug: "sources", label: "Sources" },
  { slug: "chat", label: "Chat" },
  { slug: "conversations", label: "Conversations" },
  { slug: "settings", label: "Settings" },
];

export function ProjectTabs({ projectId }: { projectId: string }) {
  const pathname = usePathname();

  return (
    <div className="border-b">
      <nav className="-mb-px flex gap-4 overflow-x-auto">
        {tabs.map((t) => {
          const href = `/dashboard/projects/${projectId}/${t.slug}`;
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={t.slug}
              href={href}
              className={cn(
                "border-b-2 px-1 py-3 text-sm font-medium whitespace-nowrap transition-colors",
                active
                  ? "border-primary text-foreground"
                  : "text-muted-foreground hover:text-foreground border-transparent",
              )}
            >
              {t.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
