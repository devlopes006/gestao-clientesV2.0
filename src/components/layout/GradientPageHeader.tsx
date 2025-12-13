import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";
import { ReactNode } from "react";

interface GradientPageHeaderProps {
  title: string;
  subtitle?: string;
  icon: LucideIcon;
  gradient?: "primary" | "success" | "danger" | "brand";
  actions?: ReactNode;
  className?: string;
}

const gradients: Record<NonNullable<GradientPageHeaderProps["gradient"]>, string> = {
  primary: "from-blue-600 via-indigo-600 to-purple-600",
  success: "from-emerald-600 via-teal-600 to-cyan-600",
  danger: "from-red-600 via-rose-600 to-orange-500",
  brand: "from-slate-900 via-slate-800 to-slate-700",
};

export function GradientPageHeader({
  title,
  subtitle,
  icon: Icon,
  gradient = "primary",
  actions,
  className,
}: GradientPageHeaderProps) {
  return (
    <header
      className={cn(
        "relative overflow-hidden rounded-2xl bg-linear-to-br p-4 sm:p-6 lg:p-8 text-white shadow-2xl hover:shadow-3xl transition-all duration-200",
        gradients[gradient],
        className,
      )}
    >
      {/* Animated blob backgrounds */}
      <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
      <div className="absolute top-0 right-0 w-64 h-64 sm:w-96 sm:h-96 bg-slate-900/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 animate-blob" />
      <div className="absolute bottom-0 left-0 w-48 h-48 sm:w-64 sm:h-64 bg-slate-900/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 animate-blob animation-delay-2000" />
      <div className="absolute top-1/2 left-1/2 w-56 h-56 sm:w-80 sm:h-80 bg-slate-900/5 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 animate-blob animation-delay-4000" />

      <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
        <div className="flex items-center gap-2 sm:gap-3 lg:gap-4">
          <div className="h-10 w-10 sm:h-12 sm:w-12 lg:h-14 lg:w-14 rounded-xl bg-slate-900/20 backdrop-blur-sm flex items-center justify-center group hover:scale-110 hover:bg-slate-900/30 transition-all duration-200 shadow-lg">
            <Icon className="h-5 w-5 sm:h-6 sm:w-6 lg:h-7 lg:w-7 transition-transform group-hover:scale-110" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold">{title}</h1>
            {subtitle ? (
              <p className="text-xs sm:text-sm lg:text-base text-white/80 mt-0.5 sm:mt-1">{subtitle}</p>
            ) : null}
          </div>
        </div>
        {actions ? <div className="flex items-center gap-2 w-full sm:w-auto">{actions}</div> : null}
      </div>
    </header>
  );
}

export default GradientPageHeader;
