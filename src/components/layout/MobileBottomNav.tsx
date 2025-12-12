"use client";

import { cn } from "@/lib/utils";
import { Bell, DollarSign, Home, LayoutDashboard, Plus, Settings, Users } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

type NavItem = {
  href: string;
  label: string;
  icon: React.ReactNode;
  roles?: string[];
};

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
  const [menuOpen, setMenuOpen] = useState(false);
  const [quickOpen, setQuickOpen] = useState(false);
  const [userProfile, setUserProfile] = useState<{ name?: string; avatarUrl?: string } | null>(null);
  const [alertsCount, setAlertsCount] = useState<number>(0);

  // Fetch user role from sidebar-stats API (same as SidebarV3)
  useEffect(() => {
    // Perfil (inclui imagem R2) como na página de perfil
    fetch("/api/profile", { credentials: "include" })
      .then(async (res) => {
        if (!res.ok) return;
        const p = await res.json();
        const avatar = p?.image || null;
        const name = p?.name || p?.email;
        setUserProfile({ name, avatarUrl: avatar });
      })
      .catch(() => { });

    // Stats (role e alertsCount) como no SidebarV3
    fetch("/api/sidebar-stats", { credentials: "include" }).then(async (res) => {
      if (res.ok) {
        const data = await res.json();
        if (data?.role) setUserRole(data.role);
        if (typeof data?.alertsCount === "number") setAlertsCount(data.alertsCount);
      }
    });
  }, []);

  // Filtrar items baseado no role do usuário
  const filteredItems = useMemo(() => {
    return navItems.filter((item) => {
      if (!item.roles) return true;
      // Enquanto não carregou role, mostra itens padrão
      if (!userRole) return true;
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

  // Renderiza dock mesmo antes de carregar role (global após login)

  return (
    <nav
      className={cn(
        // Posicionamento fixo na parte inferior (mobile + desktop)
        "fixed bottom-3 md:bottom-5 left-1/2 -translate-x-1/2 z-40",
        // Estilo do container (glass)
        "rounded-xl border border-slate-200 dark:border-slate-800",
        "shadow-xl backdrop-blur-md bg-white/85 dark:bg-slate-950/80",
      )}
    >
      <div
        className={cn(
          "flex items-center gap-1.5 sm:gap-2 md:gap-3",
          "px-2.5 py-1.5 md:px-3 md:py-2",
        )}
      >
        {/* Botão de ações rápidas */}
        <button
          onClick={() => setQuickOpen((v) => !v)}
          aria-label="Ações rápidas"
          title="Ações rápidas"
          className={cn(
            "flex items-center justify-center",
            "p-2 rounded-lg transition-all duration-200",
            "text-slate-600 dark:text-slate-400",
            "hover:bg-slate-100 dark:hover:bg-slate-800",
          )}
        >
          <span className="flex items-center justify-center">
            <Plus className="w-5 h-5" />
          </span>
        </button>

        {filteredItems.map((item) => {
          const isActive = getIsActive(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                // Layout
                "flex items-center justify-center",
                "p-2 sm:p-2.5 rounded-lg transition-all duration-200",
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
            </Link>
          );
        })}

        {/* Notificações (badge exemplo) */}
        <Link
          href="/notifications"
          aria-label="Notificações"
          title="Notificações"
          className={cn(
            "relative flex items-center justify-center",
            "p-2 rounded-lg transition-all duration-200",
            "text-slate-600 dark:text-slate-400",
            "hover:bg-slate-100 dark:hover:bg-slate-800",
          )}
        >
          <span className="flex items-center justify-center">
            <Bell className="w-5 h-5" />
          </span>
          {alertsCount > 0 && (
            <span className="absolute -top-1 -right-1 inline-flex items-center justify-center min-w-[16px] h-[16px] px-1 rounded-full text-[10px] bg-red-500 text-white">
              {alertsCount}
            </span>
          )}
        </Link>

        {/* Botão de perfil */}
        <button
          onClick={() => setMenuOpen((v) => !v)}
          aria-label="Perfil do usuário"
          title="Perfil do usuário"
          className={cn(
            "flex items-center justify-center",
            "p-2 rounded-lg transition-all duration-200",
            "text-slate-600 dark:text-slate-400",
            "hover:bg-slate-100 dark:hover:bg-slate-800",
            "hover:text-slate-900 dark:hover:text-slate-200",
          )}
        >
          <span className="flex items-center justify-center">
            {userProfile?.avatarUrl ? (
              <div className="w-6 h-6 rounded-full overflow-hidden">
                <Image
                  src={userProfile.avatarUrl}
                  alt="Avatar"
                  width={24}
                  height={24}
                  className="w-full h-full object-cover"
                  unoptimized
                  onError={() => setUserProfile((p) => (p ? { ...p, avatarUrl: undefined } : p))}
                />
              </div>
            ) : (
              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-300 text-slate-700 text-xs font-semibold">
                {(userProfile?.name?.[0] || "U").toUpperCase()}
              </span>
            )}
          </span>
        </button>

        {menuOpen && (
          <div
            className={cn(
              "absolute bottom-16 right-4",
              "bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800",
              "rounded-lg shadow-xl p-2 w-44",
            )}
            aria-label="Menu do perfil"
          >
            <ul aria-label="Menu do perfil">
              <li>
                <Link href="/profile" className="block px-3 py-2 rounded hover:bg-slate-100 dark:hover:bg-slate-800">
                  Editar perfil
                </Link>
              </li>
              <li>
                <Link href="/logout" className="block px-3 py-2 rounded hover:bg-slate-100 dark:hover:bg-slate-800">
                  Sair
                </Link>
              </li>
            </ul>
          </div>
        )}

        {quickOpen && (
          <div
            className={cn(
              "absolute bottom-16 left-4",
              "bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800",
              "rounded-lg shadow-xl p-2 w-44",
            )}
            aria-label="Menu de ações rápidas"
          >
            <ul aria-label="Menu de ações rápidas">
              <li>
                <Link href="/clients/new" className="block px-3 py-2 rounded hover:bg-slate-100 dark:hover:bg-slate-800">
                  Novo cliente
                </Link>
              </li>
              <li>
                <Link href="/tasks/new" className="block px-3 py-2 rounded hover:bg-slate-100 dark:hover:bg-slate-800">
                  Nova tarefa
                </Link>
              </li>
            </ul>
          </div>
        )}
      </div>
    </nav>
  );
}

export default MobileBottomNav;
