import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

const inputVariants = cva(
  "w-full rounded-lg border-2 transition-all duration-200 px-4 py-2.5 bg-white placeholder:text-slate-500 disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "border-slate-200 dark:border-slate-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20",
        error:
          "border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20",
      },
      size: {
        sm: "h-9 text-sm",
        default: "h-10 text-base",
        lg: "h-12 text-lg",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
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
    const finalVariant = hasError ? "error" : variant;

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

