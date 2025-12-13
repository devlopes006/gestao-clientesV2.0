'use client'
import React from 'react'

type SkeletonProps = React.HTMLAttributes<HTMLDivElement> & {
  width?: string
  height?: string
  rounded?: string
}

export const Skeleton = ({ width = 'w-full', height = 'h-4', rounded = 'rounded-md', className = '', ...rest }: SkeletonProps) => {
  const classes = `${width} ${height} ${rounded} bg-gradient-to-r from-slate-700 via-slate-800 to-slate-700 dark:from-slate-700 dark:via-slate-800 dark:to-slate-700 animate-pulse ${className}`
  return <div aria-hidden className={classes} {...rest} />
}

export const SkeletonCircle = ({ className = '', ...rest }: React.HTMLAttributes<HTMLDivElement>) => (
  <div aria-hidden className={`h-10 w-10 rounded-full bg-gradient-to-r from-slate-700 via-slate-800 to-slate-700 animate-pulse ${className}`} {...rest} />
)

export const SkeletonAvatar = ({ size = 12, className = '', ...rest }: { size?: number; className?: string } & React.HTMLAttributes<HTMLDivElement>) => {
  const s = `${size}rem`
  return <div aria-hidden style={{ width: s, height: s }} className={`rounded-full bg-gradient-to-r from-slate-700 via-slate-800 to-slate-700 animate-pulse ${className}`} {...rest} />
}

export const CardSkeleton = ({ className = '' }: { className?: string }) => (
  <div className={`p-4 rounded-2xl border border-slate-700/50 bg-slate-900/60 shadow-sm ${className}`}>
    <div className="flex items-center gap-4">
      <SkeletonCircle />
      <div className="flex-1">
        <Skeleton height="h-4" className="mb-2" />
        <Skeleton height="h-3" width="w-1/2" />
      </div>
    </div>
    <div className="mt-4 grid grid-cols-3 gap-3">
      <Skeleton height="h-8" rounded="rounded-lg" />
      <Skeleton height="h-8" rounded="rounded-lg" />
      <Skeleton height="h-8" rounded="rounded-lg" />
    </div>
  </div>
)

export const MetricSkeleton = ({ className = '' }: { className?: string }) => (
  <div className={`p-4 rounded-xl border border-slate-700/50 bg-slate-900/50 ${className}`}>
    <Skeleton height="h-6" width="w-3/4" className="mb-3" />
    <Skeleton height="h-10" rounded="rounded-lg" />
  </div>
)

export const TableSkeleton = ({ rows = 5 }: { rows?: number }) => (
  <div className="w-full rounded-2xl border border-slate-700/50 bg-slate-900/50 overflow-hidden">
    <div className="p-4">
      <Skeleton height="h-6" width="w-1/3" className="mb-3" />
      <div className="space-y-3">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center gap-4">
            <Skeleton height="h-4" width="w-1/3" />
            <Skeleton height="h-4" width="w-1/4" />
            <Skeleton height="h-4" width="w-1/6" />
          </div>
        ))}
      </div>
    </div>
  </div>
)

export const ChartSkeleton = ({ className = '' }: { className?: string }) => (
  <div className={`rounded-2xl border border-slate-700/50 bg-slate-900/50 p-4 ${className}`}>
    <Skeleton height="h-8" width="w-1/4" className="mb-4" />
    <div className="h-40 bg-gradient-to-b from-slate-800 to-slate-900 rounded-lg" />
  </div>
)

export const PageSkeleton = () => (
  <div className="min-h-screen p-6 space-y-6 bg-slate-900 text-slate-200">
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Skeleton height="h-8" width="w-48" rounded="rounded-lg" />
          <Skeleton height="h-6" width="w-32" rounded="rounded-lg" />
        </div>
        <Skeleton height="h-10" width="w-32" rounded="rounded-2xl" />
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <MetricSkeleton />
        <MetricSkeleton />
        <MetricSkeleton />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <CardSkeleton />
        <ChartSkeleton />
      </div>
    </div>
  </div>
)

export default Skeleton

// Backwards-compatible named exports
export function DashboardSkeleton() {
  return <PageSkeleton />
}

export function ClientsGridSkeleton({ items = 9 }: { items?: number }) {
  // simple clients grid approximation using CardSkeleton
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="p-2">
          <CardSkeleton />
        </div>
      ))}
    </div>
  )
}

