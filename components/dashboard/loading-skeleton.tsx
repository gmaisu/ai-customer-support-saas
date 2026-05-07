import { Skeleton } from "@/components/ui/skeleton";

/**
 * Shared loading skeletons for the dashboard. Drop into a `loading.tsx` to
 * give the user something visually consistent while the server component is
 * fetching.
 */

export function ProjectsListSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-7 w-32" />
        <Skeleton className="h-4 w-72" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="space-y-3 rounded-lg border p-4">
            <div className="flex items-center gap-2">
              <Skeleton className="size-3 rounded-full" />
              <Skeleton className="h-4 flex-1" />
            </div>
            <Skeleton className="h-3 w-2/3" />
            <Skeleton className="h-3 w-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function ProjectDetailSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-4 w-24" />
      <div className="space-y-2">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-48" />
      </div>
      <div className="flex gap-4 border-b">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-7 w-24" />
        ))}
      </div>
      <div className="space-y-3 rounded-lg border p-4">
        <Skeleton className="h-5 w-1/2" />
        <Skeleton className="h-4 w-3/4" />
      </div>
    </div>
  );
}
