/**
 * Componentes de estado de carregamento
 * Skeletons e spinners reutilizáveis
 */

import { cn } from '@/lib/utils'
import { Loader2 } from 'lucide-react'
import { HTMLAttributes } from 'react'

/**
 * Skeleton para carregamento de conteúdo
 */
export function Skeleton({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('animate-pulse rounded-md bg-gradient-to-r from-slate-700/50 to-slate-800/50', className)}
      {...props}
    />
  )
}

/**
 * Spinner genérico
 */
export function Spinner({
  className,
  size = 'default',
}: {
  className?: string
  size?: 'sm' | 'default' | 'lg'
}) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    default: 'h-6 w-6',
    lg: 'h-8 w-8',
  }

  return (
    <Loader2
      className={cn('animate-spin text-slate-300', sizeClasses[size], className)}
    />
  )
}

/**
 * Loading overlay para cobrir áreas específicas
 */
export function LoadingOverlay({
  message,
  className,
}: {
  message?: string
  className?: string
}) {
  return (
    <div
      className={cn(
        'absolute inset-0 z-50 flex flex-col items-center justify-center gap-3 bg-slate-900/80 backdrop-blur-sm',
        className
      )}
    >
      <Spinner size="lg" />
      {message && <p className="text-sm text-slate-300">{message}</p>}
    </div>
  )
}

/**
 * Card skeleton para listagens
 */
export function CardSkeleton() {
  return (
    <div className="rounded-lg border border-slate-700/50 bg-slate-900/50 p-6 shadow-sm">
      <Skeleton className="mb-2 h-5 w-3/4" />
      <Skeleton className="mb-4 h-4 w-1/2" />
      <div className="space-y-2">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-5/6" />
      </div>
    </div>
  )
}

/**
 * Table row skeleton
 */
export function TableRowSkeleton({ columns = 4 }: { columns?: number }) {
  return (
    <tr>
      {Array.from({ length: columns }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <Skeleton className="h-4 w-full" />
        </td>
      ))}
    </tr>
  )
}
