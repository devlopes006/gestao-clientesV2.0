"use client"

import * as ProgressPrimitive from "@radix-ui/react-progress";
import * as React from "react";

import { cn } from "@/lib/utils";

type ProgressVariant = "blue" | "emerald" | "purple" | "amber" | "red" | "indigo" | "pink";

const variantClass: Record<ProgressVariant, string> = {
  blue: "bg-blue-600",
  emerald: "bg-emerald-600",
  purple: "bg-purple-600",
  amber: "bg-amber-500",
  red: "bg-red-600",
  indigo: "bg-indigo-600",
  pink: "bg-pink-600",
};

interface ProgressProps extends React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root> {
  variant?: ProgressVariant;
}

const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  ProgressProps
>(({ className, value, variant = "blue", ...props }, ref) => (
  <ProgressPrimitive.Root
    ref={ref}
    className={cn(
      "relative h-2 w-full overflow-hidden rounded-full bg-slate-900/60 dark:bg-slate-800",
      className
    )}
    {...props}
  >
    <ProgressPrimitive.Indicator
      className={cn("h-full w-full flex-1 transition-all duration-300 ease-in-out", variantClass[variant])}
      style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
    />
  </ProgressPrimitive.Root>
))
Progress.displayName = ProgressPrimitive.Root.displayName

export { Progress };

