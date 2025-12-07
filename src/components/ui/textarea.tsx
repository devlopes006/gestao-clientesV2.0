"use client";

import { cn } from "@/lib/utils";

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "input-surface placeholder:text-muted-foreground focus-visible:border-indigo-400 focus-visible:ring-2 focus-visible:ring-indigo-500/30 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-900 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive flex field-sizing-content min-h-24 w-full rounded-xl bg-white/85 dark:bg-slate-900/50 px-4 py-3 text-sm shadow-sm transition-[color,box-shadow] outline-none disabled:cursor-not-allowed",
        className
      )}
      {...props}
    />
  )
}

export { Textarea };

