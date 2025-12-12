"use client";

import {
  Briefcase,
  Calendar,
  Image,
  Info,
  Lightbulb,
  ListTodo,
  Trash2,
  type LucideIcon
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

type IconKey =
  | "info"
  | "listTodo"
  | "image"
  | "lightbulb"
  | "briefcase"
  | "calendar"
  | "trash2";

const iconMap: Record<IconKey, LucideIcon> = {
  info: Info,
  listTodo: ListTodo,
  image: Image,
  lightbulb: Lightbulb,
  briefcase: Briefcase,
  calendar: Calendar,
  trash2: Trash2,
};

interface NavItem {
  href: string;
  label: string;
  icon: string;
  description?: string;
  badge?: string | number;
  destructive?: boolean;
}

interface ClientDetailNavProps {
  items: NavItem[];
  clientName?: string;
}

export function ClientDetailNav({ items, clientName }: ClientDetailNavProps) {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="inline-flex items-center gap-1 bg-gradient-to-r from-slate-900/50 to-slate-950/50 border border-slate-700/50 rounded-xl p-1.5 backdrop-blur-sm shadow-lg">
      {items.map((item) => {
        const Icon = iconMap[item.icon as IconKey];
        const isActive = pathname?.startsWith(item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`
              group relative flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg
              text-xs sm:text-sm font-medium whitespace-nowrap
              transition-all duration-300
              ${item.destructive
                ? "text-red-400 hover:text-red-300 hover:bg-red-500/10 border border-transparent hover:border-red-500/30"
                : isActive
                  ? "bg-gradient-to-br from-blue-500/20 to-blue-600/10 border border-blue-500/30 text-white shadow-lg shadow-blue-500/20"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/50 border border-transparent hover:border-slate-600/50"
              }
            `}
          >
            {/* Animated gradient on hover */}
            {!item.destructive && !isActive && (
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/0 to-purple-500/0 group-hover:from-blue-500/10 group-hover:to-purple-500/5 transition-all duration-500 rounded-lg" />
            )}

            {/* Icon */}
            <div className={`relative z-10 p-0.5 rounded-md transition-all duration-300 ${isActive ? 'bg-blue-500/20' : 'group-hover:bg-slate-700/50'
              }`}>
              <Icon className={`h-4 w-4 transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110'
                }`} />
            </div>

            {/* Label */}
            <span className="hidden sm:inline relative z-10">{item.label}</span>

            {/* Active indicator */}
            {isActive && (
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3/4 h-0.5 bg-gradient-to-r from-transparent via-blue-400 to-transparent rounded-full" />
            )}
          </Link>
        );
      })}
    </div>
  );
}
