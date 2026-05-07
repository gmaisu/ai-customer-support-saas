"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

/**
 * Subscribe to row updates on `sources` for one project and refresh the page
 * data whenever a row changes. Drop this anywhere underneath a server-rendered
 * sources list to get live progress UI without restructuring the parent.
 *
 * Implementation note: we call router.refresh() rather than maintaining
 * client-side state, which keeps the Source rendering on the server (where
 * it can use server-only DB helpers) and avoids drift between client + server
 * representations.
 */
export function SourcesRealtime({ projectId }: { projectId: string }) {
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`sources:${projectId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "sources",
          filter: `project_id=eq.${projectId}`,
        },
        () => {
          router.refresh();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [projectId, router]);

  return null;
}
