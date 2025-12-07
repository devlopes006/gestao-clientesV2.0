"use client";

import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Briefcase,
  Calendar,
  ChevronDown,
  Image,
  Info,
  Lightbulb,
  ListTodo,
  Trash2,
  UserPlus,
} from "lucide-react";

type IconKey =
  | "info"
  | "listTodo"
  | "image"
  | "lightbulb"
  | "briefcase"
  | "calendar"
  | "userPlus"
  | "trash2";

const iconMap: Record<IconKey, LucideIcon> = {
  info: Info,
  listTodo: ListTodo,
  image: Image,
  lightbulb: Lightbulb,
  briefcase: Briefcase,
  calendar: Calendar,
  userPlus: UserPlus,
  trash2: Trash2,
};

interface TabItem {
  href: string;
  label: string;
  icon: string;
  destructive?: boolean;
}

interface ClientNavigationProps {
  items: TabItem[];
}

export function ClientNavigation({ items }: ClientNavigationProps) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  // Encontrar item ativo
  const activeItem = items.find((item) => pathname?.startsWith(item.href));
  const activeLabel = activeItem?.label || "Navegação";
  const activeIcon = activeItem?.icon;
  const ActiveIcon = activeIcon ? iconMap[activeIcon as IconKey] : Info;

  // Separar itens destrutivos dos normais
  const normalItems = items.filter((item) => !item.destructive);
  const destructiveItems = items.filter((item) => item.destructive);

  return (
    <>
      {/* Mobile: Dropdown Menu (md breakpoint: 768px) */}
      <div className="md:hidden">
        <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
          <DropdownMenuTrigger>
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-between gap-2 rounded-lg"
            >
              <span className="flex items-center gap-2 min-w-0">
                <ActiveIcon className="h-4 w-4 flex-shrink-0" />
                <span className="truncate">{activeLabel}</span>
              </span>
              <ChevronDown className="h-4 w-4 flex-shrink-0" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56">
            {normalItems.map((item) => {
              const Icon = iconMap[item.icon as IconKey];
              const isActive = pathname?.startsWith(item.href);
              return (
                <DropdownMenuItem
                  key={item.href}
                  onClick={() => {
                    setIsOpen(false);
                    // Navigation handled by Link
                  }}
                >
                  <Link
                    href={item.href}
                    className={`flex w-full items-center gap-2 ${isActive
                        ? "bg-slate-100 dark:bg-slate-800 font-semibold"
                        : ""
                      }`}
                  >
                    {Icon && <Icon className="h-4 w-4" />}
                    <span>{item.label}</span>
                  </Link>
                </DropdownMenuItem>
              );
            })}

            {destructiveItems.length > 0 && (
              <>
                <DropdownMenuSeparator />
                {destructiveItems.map((item) => {
                  const Icon = iconMap[item.icon as IconKey];
                  return (
                    <DropdownMenuItem
                      key={item.href}
                      onClick={() => setIsOpen(false)}
                    >
                      <Link
                        href={item.href}
                        className="flex w-full items-center gap-2 text-red-600 hover:text-red-700 dark:text-red-400"
                      >
                        {Icon && <Icon className="h-4 w-4" />}
                        <span>{item.label}</span>
                      </Link>
                    </DropdownMenuItem>
                  );
                })}
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Desktop: Tab Navigation (md breakpoint: 768px) */}
      <div className="hidden md:block client-nav-wrapper">
        <nav className="flex gap-1 overflow-x-auto pb-2 no-scrollbar -mx-0.5">
          {items.map((item) => {
            const Icon = iconMap[item.icon as IconKey];
            const isActive = pathname?.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`nav-tab ${item.destructive
                    ? "nav-tab-destructive"
                    : isActive
                      ? "nav-tab-active"
                      : "nav-tab-inactive"
                  }`}
              >
                {Icon && <Icon className="h-4 w-4 flex-shrink-0" />}
                <span className="hidden sm:inline">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </>
  );
}

export default ClientNavigation;
