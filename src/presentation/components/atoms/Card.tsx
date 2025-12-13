/**
 * Componente Card base
 * Container padrão para conteúdo agrupado
 */

import { cn } from '@/lib/utils'
import { cva, type VariantProps } from 'class-variance-authority'
import { forwardRef, HTMLAttributes } from 'react'

const cardVariants = cva(
  'surface-panel text-card-foreground transition-all duration-200 rounded-2xl overflow-hidden ring-offset-1 ring-offset-white dark:ring-offset-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-200 dark:focus-visible:ring-indigo-500/40',
  {
    variants: {
      variant: {
        default: 'border border-slate-200/70 dark:border-slate-800/70 shadow-sm',
        outline: 'border-2 border-slate-300/70 dark:border-slate-700/70 shadow-sm',
        ghost: 'border-0 shadow-none bg-transparent',
        elevated: 'border border-slate-200/80 dark:border-slate-800/60 bg-slate-900/95 dark:bg-slate-900/85 shadow-lg shadow-indigo-500/10 dark:shadow-none backdrop-blur-lg overflow-hidden ring-1 ring-indigo-50 dark:ring-indigo-500/10',
        interactive: 'border border-slate-200/80 dark:border-slate-800/70 bg-slate-900/90 dark:bg-slate-900/75 shadow-sm cursor-pointer hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0 transition-transform',
        bordered: 'border border-slate-300/80 dark:border-slate-700/70 bg-gradient-to-br from-slate-900/85 to-slate-900/80 dark:from-slate-900/70 dark:to-slate-900/60 backdrop-blur overflow-hidden',
      },
      hover: {
        true: 'hover:-translate-y-0.5 hover:shadow-lg hover:border-slate-300/80 dark:hover:border-slate-700/80',
        false: '',
      },
    },
    defaultVariants: {
      variant: 'default',
      hover: false,
    },
  }
)

export interface CardProps
  extends HTMLAttributes<HTMLDivElement>,
  VariantProps<typeof cardVariants> { }

const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, hover, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(cardVariants({ variant, hover }), className)}
      {...props}
    />
  )
)
Card.displayName = 'Card'

const CardHeader = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('flex flex-col space-y-1.5 p-6', className)}
      {...props}
    />
  )
)
CardHeader.displayName = 'CardHeader'

const CardTitle = forwardRef<
  HTMLParagraphElement,
  HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn('font-semibold leading-none tracking-tight', className)}
    {...props}
  />
))
CardTitle.displayName = 'CardTitle'

const CardDescription = forwardRef<
  HTMLParagraphElement,
  HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn('text-sm text-muted-foreground', className)}
    {...props}
  />
))
CardDescription.displayName = 'CardDescription'

const CardContent = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('p-6 pt-0', className)} {...props} />
  )
)
CardContent.displayName = 'CardContent'

const CardFooter = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('flex items-center p-6 pt-0', className)}
      {...props}
    />
  )
)
CardFooter.displayName = 'CardFooter'

export { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle }

