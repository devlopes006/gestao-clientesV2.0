"use client";

import { cn } from "@/lib/utils";
import {
  DollarSign,
  Home,
  LayoutDashboard,
  Settings,
  Users
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  roles?: string[];
}

const navItems: NavItem[] = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: <Home className="w-5 h-5" />,
    roles: ["OWNER", "STAFF"],
  },
  {
    href: "/clients",
    label: "Clientes",
    icon: <Users className="w-5 h-5" />,
    roles: ["OWNER", "STAFF"],
  },
  {
    href: "/financeiro",
    label: "Financeiro",
    icon: <DollarSign className="w-5 h-5" />,
    roles: ["OWNER"],
  },
  {
    href: "/admin",
    label: "Administração",
    icon: <LayoutDashboard className="w-5 h-5" />,
    roles: ["OWNER"],
  },
  {
    href: "/settings",
    label: "Configurações",
    icon: <Settings className="w-5 h-5" />,
    roles: ["OWNER", "STAFF"],
  },
];

export function MobileBottomNav() {
  const pathname = usePathname();
  const [userRole, setUserRole] = useState<string | null>(null);

  // Fetch user role from sidebar-stats API (same as SidebarV3)
  useEffect(() => {
    fetch("/api/sidebar-stats", { credentials: "include" }).then(async (res) => {
      if (res.ok) {
        const data = await res.json();
        if (data?.role) setUserRole(data.role);
      }
    });
  }, []);

  // Filtrar items baseado no role do usuário
  const filteredItems = useMemo(() => {
    return navItems.filter((item) => {
      if (!item.roles) return true;
      if (!userRole) return false;
      return item.roles.includes(userRole);
    });
  }, [userRole]);

  // Detectar item ativo (matching de path)
  const getIsActive = (href: string) => {
    if (href === "/dashboard") return pathname?.startsWith("/dashboard");
    if (href === "/clients") return pathname?.startsWith("/clients");
    if (href === "/financeiro") return pathname?.startsWith("/financeiro");
    if (href === "/admin") return pathname?.startsWith("/admin");
    if (href === "/settings") return pathname?.startsWith("/settings");
    return pathname === href;
  };

  // Não renderizar se não houver role
  if (!userRole) return null;

  return (
    <nav
      className={cn(
        // Posicionamento fixo na parte inferior (mobile only)
        "fixed bottom-0 left-0 right-0 z-40 lg:hidden",
        // Estilo do container
        "bg-white dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800",
        "shadow-2xl backdrop-blur-md bg-white/80 dark:bg-slate-950/80",
      )}
    >
      <div
        className={cn(
          "flex items-center justify-around max-w-2xl mx-auto",
          "px-2 py-2 sm:py-3",
        )}
      >
        {filteredItems.map((item) => {
          const isActive = getIsActive(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                // Layout
                "flex flex-col items-center justify-center gap-1",
                "p-2 sm:p-2.5 rounded-lg transition-all duration-200",
                "text-[11px] sm:text-xs font-medium",
                // Estados
                isActive
                  ? cn(
                    "bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/30 dark:to-purple-900/30",
                    "text-blue-700 dark:text-blue-200",
                    "shadow-md",
                  )
                  : cn(
                    "text-slate-600 dark:text-slate-400",
                    "hover:bg-slate-100 dark:hover:bg-slate-800",
                    "hover:text-slate-900 dark:hover:text-slate-200",
                  ),
                // Transição de cor
                "hover:transition-colors",
              )}
              aria-label={item.label}
              title={item.label}
            >
              <span
                className={cn(
                  "flex items-center justify-center",
                  isActive
                    ? "text-blue-600 dark:text-blue-300"
                    : "text-slate-500 dark:text-slate-400",
                )}
              >
                {item.icon}
              </span>
              <span className="hidden sm:inline truncate max-w-[3rem]">
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export default MobileBottomNav;
