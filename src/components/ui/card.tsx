"use client";

import { cn } from "@/lib/utils";
import * as React from "react";

/**
 * Card Component - Design System MyGest
 * Componente de card sofisticado com suporte a variantes e estados
 */

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'interactive' | 'bordered';
  hover?: boolean;
  size?: 'sm' | 'md' | 'lg'
}

// Provide card size to subcomponents via context so header/content can adapt
// Use `null` as default to detect absence of a parent Card provider.
const CardSizeContext = React.createContext<'sm' | 'md' | 'lg' | null>(null)

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = 'default', hover = false, size, ...props }, ref) => {
    // detect parent card size (if any)
    const parentSize = React.useContext(CardSizeContext)
    // If `size` prop is provided, use it. Otherwise, if we're nested (parentSize != null)
    // default to 'sm' for nested cards, else default to 'md' for top-level cards.
    const effectiveSize: 'sm' | 'md' | 'lg' = (size as any) ?? (parentSize ? 'sm' : 'md')
    const variantClasses = {
      default:
        'border border-slate-200/80 dark:border-slate-800/70 bg-white/90 dark:bg-slate-900/80 shadow-sm backdrop-blur overflow-hidden',
      elevated:
        'border border-slate-200/80 dark:border-slate-800/60 bg-white/95 dark:bg-slate-900/85 shadow-lg shadow-indigo-500/10 dark:shadow-none backdrop-blur-lg overflow-hidden ring-1 ring-indigo-50 dark:ring-indigo-500/10',
      interactive:
        'border border-slate-200/80 dark:border-slate-800/70 bg-white/90 dark:bg-slate-900/75 shadow-sm backdrop-blur overflow-hidden cursor-pointer hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0 transition-transform',
      bordered:
        'border border-slate-300/80 dark:border-slate-700/70 bg-gradient-to-br from-white/85 to-slate-50/80 dark:from-slate-900/70 dark:to-slate-900/60 backdrop-blur overflow-hidden',
    };

    return (
      <CardSizeContext.Provider value={effectiveSize}>
        <div
          ref={ref}
          className={cn(
            // Base styles
            'rounded-2xl text-card-foreground transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-indigo-200 dark:focus-visible:ring-indigo-500/40 ring-offset-1 ring-offset-white dark:ring-offset-slate-950',
            // Variant styles
            variantClasses[variant],
            // Hover effect
            hover && 'hover:shadow-lg hover:border-slate-300/90 dark:hover:border-slate-700/90',
            className,
          )}
          {...props}
        />
      </CardSizeContext.Provider>
    )
  }
);
Card.displayName = "Card";

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  const size = React.useContext(CardSizeContext)
  const base = size === 'sm' ? 'p-3 sm:p-4 space-y-1' : size === 'lg' ? 'p-6 sm:p-8 space-y-2' : 'p-4 sm:p-6 space-y-1.5'
  return (
    <div
      ref={ref}
      className={cn(base, className)}
      {...props}
    />
  )
});
CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => {
  const size = React.useContext(CardSizeContext)
  const sizeClass = size === 'sm' ? 'text-sm sm:text-base' : size === 'lg' ? 'text-xl sm:text-2xl' : 'text-lg sm:text-xl'
  return (
    <h3
      ref={ref}
      className={cn(
        `${sizeClass} font-semibold leading-tight tracking-tight text-slate-900 dark:text-white`,
        className,
      )}
      {...props}
    />
  )
});
CardTitle.displayName = "CardTitle";

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => {
  const size = React.useContext(CardSizeContext)
  const textClass = size === 'sm' ? 'text-xs' : size === 'lg' ? 'text-base' : 'text-sm'
  return (
    <p
      ref={ref}
      className={cn(
        `${textClass} text-slate-600 dark:text-slate-400 leading-relaxed`,
        className
      )}
      {...props}
    />
  )
});
CardDescription.displayName = "CardDescription";

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  const size = React.useContext(CardSizeContext)
  const pad = size === 'sm' ? 'px-3 sm:px-4 pb-3 sm:pb-4' : size === 'lg' ? 'px-6 sm:px-8 pb-6 sm:pb-8' : 'px-4 sm:px-6 pb-4 sm:pb-6'
  return (
    <div
      ref={ref}
      className={cn(pad, className)}
      {...props}
    />
  )
});
CardContent.displayName = "CardContent";

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  const size = React.useContext(CardSizeContext)
  const pad = size === 'sm' ? 'px-3 sm:px-4 pb-3 sm:pb-4' : size === 'lg' ? 'px-6 sm:px-8 pb-6 sm:pb-8' : 'px-4 sm:px-6 pb-4 sm:pb-6'
  return (
    <div
      ref={ref}
      className={cn(
        'flex items-center gap-2',
        pad,
        className
      )}
      {...props}
    />
  )
});
CardFooter.displayName = "CardFooter";

export {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
};

