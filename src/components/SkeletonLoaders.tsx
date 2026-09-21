import { Skeleton } from "@/components/ui/skeleton";

/** Matches the public Winners page's WinnerCard grid while data loads. */
export function WinnerCardSkeleton() {
  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-primary/10 bg-card/40">
      <Skeleton className="h-64 w-full rounded-none" />
      <div className="flex flex-1 flex-col gap-3 p-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-9 w-9 rounded-full" />
          <Skeleton className="h-4 w-16 rounded-full" />
        </div>
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </div>
    </div>
  );
}

export function WinnerGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <WinnerCardSkeleton key={i} />
      ))}
    </div>
  );
}

/** Matches the Admin › Winners tab's compact row layout while data loads. */
export function WinnerRowSkeleton() {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-primary/10 bg-white px-4 py-3">
      <Skeleton className="h-10 w-10 shrink-0 rounded-full" />
      <div className="min-w-0 flex-1 space-y-1.5">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-3 w-56" />
      </div>
      <Skeleton className="h-8 w-24 shrink-0 rounded-md" />
    </div>
  );
}
