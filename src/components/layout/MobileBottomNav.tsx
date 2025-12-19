"use client";

import { NotificationCenter } from "@/components/NotificationCenter";
import { useUser } from "@/context/UserContext";
import { cn } from "@/lib/utils";
import { DollarSign, Home, LayoutDashboard, MessageCircle, Plus, Settings, Users } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

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
    href: "/messages",
    label: "Mensagens",
    icon: <MessageCircle className="w-5 h-5" />,
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
  const navRef = useRef<HTMLDivElement | null>(null);
  const [userProfile, setUserProfile] = useState<{ name?: string; avatarUrl?: string } | null>(null);
  const { logout } = useUser();

  const handleLogout = async () => {
    setMenuOpen(false);
    try {
      await logout();
    } catch {
      // fallback handled inside logout
    }
  };

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
      }
    });
  }, []);

  // Fecha popovers ao clicar fora do dock
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
        setQuickOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
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
        "fixed bottom-3 md:bottom-6 left-1/2 -translate-x-1/2 z-40",
        "rounded-2xl border border-slate-800/70 ring-1 ring-blue-500/10",
        "shadow-2xl shadow-blue-900/40 backdrop-blur-2xl",
        "bg-gradient-to-r from-slate-900/85 via-slate-950/85 to-slate-900/75",
      )}
      ref={navRef}
    >
      <div
        className={cn(
          "flex items-center gap-1.5 sm:gap-2 md:gap-3",
          "px-3 py-2 md:px-4 md:py-2.5",
        )}
      >
        {/* Botão de ações rápidas */}
        <button
          onClick={() => setQuickOpen((v) => !v)}
          aria-label="Ações rápidas"
          title="Ações rápidas"
          className={cn(
            "flex items-center justify-center",
            "p-2 rounded-xl transition-all duration-200",
            "text-slate-200",
            "hover:bg-blue-500/10 hover:text-white",
            "border border-slate-800/60",
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
                "p-2 sm:p-2.5 rounded-xl transition-all duration-200",
                // Estados
                isActive
                  ? cn(
                    "bg-gradient-to-br from-blue-600/30 via-purple-500/25 to-cyan-500/20",
                    "text-white",
                    "shadow-[0_10px_30px_-12px_rgba(59,130,246,0.6)]",
                  )
                  : cn(
                    "text-slate-300",
                    "hover:bg-slate-800/70",
                    "hover:text-white",
                    "border border-transparent hover:border-slate-700/80",
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
                    ? "text-white"
                    : "text-slate-300",
                )}
              >
                {item.icon}
              </span>
            </Link>
          );
        })}

        {/* Notificações com popover inline */}
        <div className="relative">
          <NotificationCenter variant="compact" />
        </div>

        {/* Botão de perfil */}
        <button
          onClick={() => setMenuOpen((v) => !v)}
          aria-label="Perfil do usuário"
          title="Perfil do usuário"
          className={cn(
            "flex items-center justify-center",
            "p-2 rounded-xl transition-all duration-200",
            "text-slate-300",
            "hover:bg-slate-800/70 hover:text-white",
            "border border-transparent hover:border-slate-700/80",
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
              "bg-slate-950/95 border border-slate-800/80",
              "rounded-xl shadow-2xl p-2 w-44 backdrop-blur-xl",
            )}
            aria-label="Menu do perfil"
          >
            <ul aria-label="Menu do perfil">
              <li>
                <Link href="/profile" className="block px-3 py-2 rounded-lg text-slate-200 hover:bg-slate-800/70">
                  Editar perfil
                </Link>
              </li>
              <li>
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-3 py-2 rounded-lg text-slate-200 hover:bg-slate-800/70"
                >
                  Sair
                </button>
              </li>
            </ul>
          </div>
        )}

        {quickOpen && (
          <div
            className={cn(
              "absolute bottom-16 left-4",
              "bg-slate-950/95 border border-slate-800/80",
              "rounded-xl shadow-2xl p-2 w-44 backdrop-blur-xl",
            )}
            aria-label="Menu de ações rápidas"
          >
            <ul aria-label="Menu de ações rápidas">
              <li>
                <Link href="/clients/new" className="block px-3 py-2 rounded-lg text-slate-200 hover:bg-slate-800/70">
                  Novo cliente
                </Link>
              </li>
              <li>
                <Link href="/tasks/new" className="block px-3 py-2 rounded-lg text-slate-200 hover:bg-slate-800/70">
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
