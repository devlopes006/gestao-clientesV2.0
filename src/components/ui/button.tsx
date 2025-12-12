import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

import { cn } from "@/lib/utils";
import { Spinner } from "./spinner";

/**
 * Button Component - Design System MyGest
 * Componente de botão sofisticado com gradientes e animações
 */

const buttonVariants = cva(
  "relative inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl font-semibold leading-tight tracking-tight transition-all duration-200 disabled:pointer-events-none disabled:opacity-60 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 [&_svg]:shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-indigo-500/40 shadow-sm",
  {
    variants: {
      variant: {
        default:
          "bg-gradient-to-r from-indigo-600 via-blue-600 to-indigo-700 text-white shadow-indigo-500/20 hover:-translate-y-0.5 hover:shadow-xl active:translate-y-0 focus-visible:ring-indigo-500/50",
        destructive:
          "bg-gradient-to-r from-rose-600 via-red-600 to-rose-700 text-white shadow-rose-500/25 hover:-translate-y-0.5 hover:shadow-xl active:translate-y-0 focus-visible:ring-rose-400/60",
        success:
          "bg-gradient-to-r from-emerald-600 via-green-600 to-emerald-700 text-white shadow-emerald-500/20 hover:-translate-y-0.5 hover:shadow-xl active:translate-y-0 focus-visible:ring-emerald-400/60",
        warning:
          "bg-gradient-to-r from-amber-600 via-orange-500 to-amber-700 text-white shadow-amber-500/25 hover:-translate-y-0.5 hover:shadow-xl active:translate-y-0 focus-visible:ring-amber-400/60",
        secondary:
          "bg-slate-800 border border-slate-700 text-white shadow-sm hover:border-blue-500/50 hover:bg-slate-750 hover:-translate-y-0.5 hover:shadow-lg",
        outline:
          "border border-slate-700 bg-slate-800/50 text-white hover:bg-slate-800 hover:border-slate-600 hover:-translate-y-0.5",
        ghost:
          "text-slate-200 hover:bg-slate-800",
        subtle:
          "bg-slate-800 text-white border border-slate-700 hover:bg-slate-750 hover:-translate-y-0.5",
        link:
          "text-indigo-600 dark:text-indigo-300 underline underline-offset-4 hover:text-indigo-500 dark:hover:text-indigo-200 shadow-none",
      },
      size: {
        xs: "h-9 px-3 text-xs",
        sm: "h-10 px-4 text-sm",
        default: "h-11 px-5 text-sm",
        lg: "h-12 px-6 text-base",
        xl: "h-14 px-8 text-lg",
        icon: "size-10",
        "icon-sm": "size-9",
        "icon-lg": "size-12",
      },
      block: {
        true: "w-full",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ComponentProps<"button">,
  VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  isLoading?: boolean;
  loadingText?: string;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      asChild = false,
      isLoading = false,
      loadingText,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const Comp = asChild ? Slot : "button";

    // When using Slot (asChild), ensure a single React element child and avoid invalid props
    if (asChild) {
      // Slot requires a single React element child. If callers passed multiple
      // nodes (text + icon) or plain text, wrap them in a <span> so Slot
      // always receives a single element and avoids React.Children.only errors.
      const count = React.Children.count(children);
      const singleChild =
        count === 1 && React.isValidElement(children) ? children : <span>{children}</span>;

      // Slot does not accept ref, so omit it
      return (
        <Comp
          data-slot="button"
          data-loading={isLoading || undefined}
          aria-busy={isLoading || undefined}
          className={cn(
            buttonVariants({ variant, size, className }),
            isLoading ? "pointer-events-none opacity-70" : undefined
          )}
          {...props}
        >
          {singleChild}
        </Comp>
      );
    }

    return (
      <Comp
        ref={ref}
        data-slot="button"
        data-loading={isLoading || undefined}
        aria-busy={isLoading || undefined}
        disabled={isLoading || disabled}
        className={cn(buttonVariants({ variant, size, className }))}
        {...props}
      >
        {isLoading && (
          <Spinner size="sm" className="mr-0.5" aria-hidden="true" />
        )}
        {isLoading && loadingText ? loadingText : children}
      </Comp>
    );
  }
);

Button.displayName = "Button";

export { Button, buttonVariants };

