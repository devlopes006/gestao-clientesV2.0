import { cn } from "@/lib/utils";

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-lg bg-gradient-to-r from-slate-700/50 to-slate-800/50",
        className,
      )}
      aria-live="polite"
      aria-busy="true"
    />
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-3 rounded-lg border border-slate-700/30 bg-slate-900/30">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-3 w-2/3" />
          </div>
          <Skeleton className="h-8 w-20 rounded-lg" />
        </div>
      ))}
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="rounded-lg border border-slate-700/50 bg-gradient-to-br from-slate-900/50 to-slate-950/30 p-4 shadow-md">
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <Skeleton className="h-12 w-12 rounded-lg" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-3 w-1/3" />
          </div>
        </div>
        <Skeleton className="h-20 w-full" />
        <div className="flex gap-2 pt-2">
          <Skeleton className="h-9 w-24 rounded-lg" />
          <Skeleton className="h-9 w-24 rounded-lg" />
        </div>
      </div>
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="relative min-h-screen bg-linear-to-br from-slate-950 via-blue-950/20 to-slate-900 overflow-hidden">
      {/* Animated background blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-96 h-96 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-2000" />
        <div className="absolute bottom-0 left-20 w-96 h-96 bg-pink-400 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-4000" />
      </div>

      <div className="relative space-y-8 p-6 lg:p-10">
        {/* Header Skeleton */}
        <div className="flex items-center justify-between">
          <div className="space-y-3">
            <Skeleton className="h-10 w-56 rounded-xl" />
            <Skeleton className="h-5 w-96 rounded-lg" />
          </div>
          <Skeleton className="h-11 w-40 rounded-full" />
        </div>

        {/* KPI Cards Skeleton - Modern glassmorphism */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="relative overflow-hidden rounded-2xl border border-slate-700/50 bg-slate-900/50 backdrop-blur-xl p-6 shadow-lg"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-4 w-28 rounded-md" />
                  <Skeleton className="h-6 w-6 rounded-full" />
                </div>
                <Skeleton className="h-9 w-24 rounded-lg" />
                <div className="flex items-center gap-2">
                  <Skeleton className="h-4 w-4 rounded" />
                  <Skeleton className="h-3 w-20 rounded-md" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Main Content Grid Skeleton */}
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            {/* Chart Card */}
            <div className="rounded-3xl border border-slate-700/50 bg-slate-900/50 backdrop-blur-xl p-8 shadow-lg">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-7 w-48 rounded-lg" />
                  <Skeleton className="h-9 w-32 rounded-full" />
                </div>
                <Skeleton className="h-80 w-full rounded-2xl" />
              </div>
            </div>

            {/* Recent Activity */}
            <div className="rounded-3xl border border-slate-700/50 bg-slate-900/50 backdrop-blur-xl p-8 shadow-lg">
              <Skeleton className="h-6 w-40 rounded-lg mb-6" />
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-full rounded-md" />
                      <Skeleton className="h-3 w-2/3 rounded-md" />
                    </div>
                    <Skeleton className="h-8 w-20 rounded-full" />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar Skeleton */}
          <div className="space-y-6">
            {/* Calendar Widget */}
            <div className="rounded-3xl border border-slate-700/50 bg-slate-900/50 backdrop-blur-xl p-6 shadow-lg">
              <Skeleton className="h-6 w-32 rounded-lg mb-4" />
              <Skeleton className="h-64 w-full rounded-2xl" />
            </div>

            {/* Quick Actions */}
            <div className="rounded-3xl border border-slate-700/50 bg-slate-900/50 backdrop-blur-xl p-6 shadow-lg">
              <Skeleton className="h-6 w-36 rounded-lg mb-4" />
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full rounded-xl" />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * ClientCardSkeleton - Skeleton para card de cliente
 */
export function ClientCardSkeleton() {
  return (
    <div className="rounded-lg border border-slate-700/50 bg-gradient-to-br from-slate-900/50 to-slate-950/30 p-3 shadow-md">
      <div className="space-y-3">
        <div className="flex-1">
          <Skeleton className="h-5 w-3/4 mb-1" />
          <Skeleton className="h-3 w-1/2" />
        </div>
        <div className="space-y-1.5 text-xs pt-2 border-t border-slate-700/30">
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-full" />
        </div>
        <div className="pt-2">
          <Skeleton className="h-6 w-16 rounded-md" />
        </div>
      </div>
    </div>
  );
}

/**
 * TaskCardSkeleton - Skeleton para card de tarefa
 */
export function TaskCardSkeleton() {
  return (
    <div className="rounded-lg border border-slate-700/50 bg-gradient-to-br from-slate-900/50 to-slate-950/30 p-3 shadow-md">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-1/2" />
          <Skeleton className="h-6 w-16 rounded-full" />
        </div>
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-4/5" />
        <div className="flex items-center gap-2 pt-2">
          <Skeleton className="h-8 w-8 rounded-full" />
          <Skeleton className="h-3 w-24" />
        </div>
      </div>
    </div>
  );
}

/**
 * FormSkeleton - Skeleton para formulários
 */
export function FormSkeleton({ fields = 5 }: { fields?: number }) {
  return (
    <div className="space-y-6">
      {Array.from({ length: fields }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-10 w-full rounded-md" />
        </div>
      ))}
      <div className="flex gap-3 pt-4">
        <Skeleton className="h-10 w-32 rounded-full" />
        <Skeleton className="h-10 w-24 rounded-full" />
      </div>
    </div>
  );
}

/**
 * MediaGridSkeleton - Skeleton para grade de mídias
 */
export function MediaGridSkeleton({ items = 12 }: { items?: number }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
      {Array.from({ length: items }).map((_, i) => (
        <div
          key={i}
          className="aspect-square rounded-lg border border-slate-700/50 bg-slate-900 p-2"
        >
          <Skeleton className="h-full w-full rounded-md" />
        </div>
      ))}
    </div>
  );
}

/**
 * ClientsGridSkeleton - Skeleton para grade de clientes
 */
export function ClientsGridSkeleton({ items = 9 }: { items?: number }) {
  return (
    <div className="relative min-h-screen bg-linear-to-br from-slate-950 via-blue-950/20 to-slate-900">
      <div className="relative space-y-10 p-8">
        {/* Header skeleton */}
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Skeleton className="h-9 w-24 rounded-lg" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-32 rounded-md" />
              <Skeleton className="h-8 w-48 rounded-lg" />
              <Skeleton className="h-4 w-96 rounded-md" />
            </div>
            <Skeleton className="h-11 w-40 rounded-full" />
          </div>
        </div>

        {/* Search & Filters */}
        <div className="flex items-center gap-4">
          <Skeleton className="flex-1 h-11 rounded-full" />
          <Skeleton className="h-11 w-32 rounded-full" />
          <Skeleton className="h-11 w-32 rounded-full" />
        </div>

        {/* Clients grid skeleton - Modern cards with glassmorphism */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: items }).map((_, i) => (
            <div
              key={i}
              className="group relative overflow-hidden rounded-3xl border border-slate-700/50 bg-slate-900/50 backdrop-blur-xl p-6 shadow-lg transition-all duration-300 hover:shadow-2xl hover:-translate-y-1"
            >
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-14 w-14 rounded-2xl" />
                    <div className="space-y-2">
                      <Skeleton className="h-5 w-32 rounded-lg" />
                      <Skeleton className="h-3 w-24 rounded-md" />
                    </div>
                  </div>
                  <Skeleton className="h-6 w-20 rounded-full" />
                </div>
                <Skeleton className="h-4 w-40 rounded-md" />
                <Skeleton className="h-3 w-36 rounded-md" />
                <div className="flex items-center justify-between pt-2">
                  <div className="flex gap-2">
                    <Skeleton className="h-6 w-16 rounded-full" />
                    <Skeleton className="h-6 w-16 rounded-full" />
                  </div>
                  <Skeleton className="h-9 w-24 rounded-full" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * PageSkeleton - Skeleton para página inteira
 */
export function PageSkeleton() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Page Header */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-96" />
      </div>

      {/* Content */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <CardSkeleton />
        </div>
        <div>
          <CardSkeleton />
        </div>
      </div>
    </div>
  );
}
