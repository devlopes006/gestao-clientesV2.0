"use client";

import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";
import React from "react";

const inputVariants = cva(
  "input-surface text-sm placeholder:text-slate-500 dark:placeholder:text-slate-400 px-4 py-2.5 focus-visible:ring-2 focus-visible:ring-indigo-500/35 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-900 focus-visible:border-indigo-400 shadow-sm disabled:cursor-not-allowed",
  {
    variants: {
      variant: {
        default: "border-slate-200/70 dark:border-slate-800/70",
        error: "border-red-400/80 focus-visible:ring-red-400/30 focus-visible:border-red-400",
        subtle: "bg-slate-100/70 dark:bg-slate-900/60 border-slate-200/60 dark:border-slate-800/60",
      },
      size: {
        sm: "h-10 text-xs sm:text-sm",
        default: "h-11 text-sm",
        lg: "h-12 text-base",
      },
      full: {
        true: "w-full",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      full: true,
    },
  }
);

export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'>,
  VariantProps<typeof inputVariants> {
  error?: string;
  isInvalid?: boolean;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, error, isInvalid, variant, size, ...props }, ref) => {
    const hasError = isInvalid || !!error;
    const finalVariant = (hasError ? "error" : variant) as any;

    return (
      <input
        type={type}
        className={cn(inputVariants({ variant: finalVariant, size }), className)}
        ref={ref}
        aria-invalid={hasError ? "true" : undefined}
        aria-describedby={
          error ? `${props.id}-error` : props["aria-describedby"]
        }
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export { Input, inputVariants };

