import { Skeleton } from "@/components/ui/skeleton";

export default function ClientLoading() {
  return (
    <main className="flex-1 overflow-y-auto bg-gradient-to-br from-slate-950 via-slate-900/95 to-slate-950">
      <div className="space-y-6 p-6">
        {/* Header skeleton */}
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-24 rounded-lg" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-8 w-72 rounded-lg" />
            <Skeleton className="h-3 w-96" />
          </div>
          <Skeleton className="h-11 w-36 rounded-lg" />
        </div>

        {/* Tabs skeleton */}
        <div className="flex items-center gap-2 overflow-x-auto border-b border-slate-700/50 pb-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-9 w-24 rounded-lg shrink-0" />
          ))}
        </div>

        {/* KPI Cards skeleton */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-lg border border-slate-700/50 bg-gradient-to-br from-slate-900/50 to-slate-950/30 p-4 shadow-md">
              <div className="flex items-center gap-2 mb-2">
                <Skeleton className="h-10 w-10 rounded-lg" />
                <Skeleton className="h-6 w-12" />
              </div>
              <Skeleton className="h-4 w-32" />
            </div>
          ))}
        </div>

        {/* Content grid skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-lg border border-slate-700/50 bg-gradient-to-br from-slate-900/50 to-slate-950/30 p-4 shadow-md">
              <div className="space-y-3">
                <Skeleton className="h-5 w-3/4" />
                <div className="space-y-2">
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-2/3" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Large content area skeleton */}
        <div className="rounded-lg border border-slate-700/50 bg-gradient-to-br from-slate-900/50 to-slate-950/30 p-6 shadow-md">
          <Skeleton className="h-6 w-48 mb-6" />
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-slate-800/30 border border-slate-700/30">
                <Skeleton className="h-10 w-10 rounded-lg shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-3 w-4/5" />
                  <Skeleton className="h-3 w-3/5" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
