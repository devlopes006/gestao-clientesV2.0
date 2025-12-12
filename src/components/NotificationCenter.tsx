"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { NotificationItem, useNotifications } from "@/hooks/useNotifications";
import { cn } from "@/lib/utils";
import {
  AlertCircle,
  Bell,
  Calendar,
  Check,
  CheckCheck,
  CreditCard,
  FileText,
  ListTodo,
  Trash2,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

interface NotificationCenterProps {
  variant?: "default" | "compact" | "pill";
  className?: string;
}

const NotificationIcon = ({
  type,
  priority,
}: {
  type: string;
  priority?: string;
}) => {
  const getColor = () => {
    if (priority === "urgent") return "text-red-600 bg-red-100";
    if (priority === "high") return "text-orange-600 bg-orange-100";
    return "text-blue-600 bg-blue-100";
  };

  const getIcon = () => {
    switch (type) {
      case "task":
      case "task_created":
      case "task_updated":
      case "task_completed":
      case "task_overdue":
        return <ListTodo className="h-4 w-4" />;
      case "meeting":
      case "meeting_created":
      case "meeting_updated":
      case "meeting_cancelled":
        return <Calendar className="h-4 w-4" />;
      case "payment":
      case "payment_confirmed":
      case "payment_overdue":
      case "installment_created":
        return <CreditCard className="h-4 w-4" />;
      case "client_created":
      case "client_updated":
      case "client_deleted":
        return <Users className="h-4 w-4" />;
      case "member_added":
      case "member_removed":
        return <UserPlus className="h-4 w-4" />;
      case "finance_created":
      case "finance_updated":
        return <FileText className="h-4 w-4" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  return (
    <div
      className={`h-10 w-10 rounded-full flex items-center justify-center ${getColor()}`}
    >
      {getIcon()}
    </div>
  );
};

export function NotificationCenter({
  variant = "default",
  className,
}: NotificationCenterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const containerRef = useRef<HTMLDivElement | null>(null);

  const {
    notifications,
    unreadCount,
    isLoading,
    actionLoading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  } = useNotifications({
    unreadOnly: filter === "unread",
  });

  const handleNotificationClick = async (
    notification: NotificationItem,
  ) => {
    if (notification.unread) {
      await markAsRead(notification.id);
    }
  };

  const baseUnread = unreadCount > 9 ? "9+" : unreadCount;

  // Fecha o popover ao clicar fora ou pressionar Esc (mesmo padrão do menu de perfil)
  useEffect(() => {
    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      if (
        isOpen &&
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("touchstart", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("touchstart", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  // Deduplicate notifications by id to prevent React key collisions
  const uniqueNotifications: NotificationItem[] = useMemo(() => {
    const seen = new Set<string>();
    const deduped = notifications.filter((n) => {
      if (seen.has(n.id)) return false;
      seen.add(n.id);
      return true;
    });
    if (deduped.length !== notifications.length) {
      console.warn(
        "[NotificationCenter] Duplicate notification IDs filtered:",
        notifications.length - deduped.length
      );
    }
    return deduped;
  }, [notifications]);
  const renderButton = () => {
    const baseBtn =
      "relative flex items-center justify-center transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/70";
    const baseColors =
      "bg-slate-900/80 border border-slate-700/70 text-slate-200 hover:border-blue-500/40 hover:text-white shadow-[0_10px_40px_-24px_rgba(59,130,246,0.6)]";
    if (variant === "compact") {
      return (
        <Button
          variant="ghost"
          size="icon"
          className={cn(baseBtn, baseColors, "h-10 w-10 rounded-xl backdrop-blur-md")}
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Notificações"
          title="Notificações"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 h-4 min-w-4 px-1 rounded-full bg-rose-500 text-[10px] leading-none text-white flex items-center justify-center font-semibold shadow ring-1 ring-white/50 dark:ring-red-900/60">
              {baseUnread}
            </span>
          )}
        </Button>
      );
    }
    if (variant === "pill") {
      return (
        <Button
          variant="ghost"
          className={cn(
            baseBtn,
            "h-8 px-3 rounded-full flex items-center gap-2 text-xs font-medium",
            "bg-slate-50 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200",
          )}
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Abrir notificações"
          title="Abrir notificações"
        >
          <Bell className="h-4 w-4" />
          <span className="hidden xl:inline">Notificações</span>
          {unreadCount > 0 && (
            <span className="ml-1 inline-flex items-center justify-center rounded-full bg-red-600 text-white text-[10px] h-5 px-2 font-semibold shadow ring-1 ring-white/50 dark:ring-red-900/60">
              {baseUnread}
            </span>
          )}
        </Button>
      );
    }
    // default
    return (
      <Button
        variant="ghost"
        size="icon"
        className={cn(baseBtn, baseColors, "h-10 w-10 rounded-full")}
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Notificações"
        title="Notificações"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 h-5 min-w-5 px-1 rounded-full bg-red-600 text-white text-[11px] flex items-center justify-center font-semibold shadow ring-1 ring-white/50 dark:ring-red-900/60">
            {baseUnread}
          </span>
        )}
      </Button>
    );
  };

  return (
    <div className={cn("relative", className)} ref={containerRef}>
      {renderButton()}

      {/* Dropdown */}
      {isOpen && (
        <Card
          role="dialog"
          aria-modal="true"
          aria-label="Notificações"
          className={cn(
            "absolute right-0 bottom-14 w-[360px] max-w-[90vw] max-h-[560px] z-50 overflow-hidden flex flex-col",
            "bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 backdrop-blur-xl",
            "border border-blue-500/20 rounded-2xl",
            "shadow-[0_20px_60px_-10px_rgba(59,130,246,0.3)]"
          )}
          style={{
            scrollbarWidth: 'thin',
            scrollbarColor: 'rgba(59,130,246,0.3) transparent',
          } as any}
        >
          {/* Header */}
          <div className="p-4 border-b border-blue-500/10 bg-gradient-to-r from-slate-900/80 to-slate-900/40 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-lg flex items-center gap-2 text-white">
                <Bell className="h-5 w-5 text-blue-400" />
                Notificações
              </h3>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors"
                aria-label="Fechar painel de notificações"
                onClick={() => setIsOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Filtros */}
            <div className="flex gap-2 text-sm">
              <Button
                variant={filter === "all" ? "default" : "outline"}
                size="sm"
                aria-pressed={filter === "all"}
                onClick={() => setFilter("all")}
                className={cn(
                  "flex-1 font-medium transition-all",
                  filter === "all"
                    ? "bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg shadow-blue-500/30 hover:from-blue-500 hover:to-blue-400"
                    : "border border-slate-700/50 text-slate-300 hover:border-blue-500/40 hover:text-white hover:bg-slate-800/40",
                )}
              >
                Todas
              </Button>
              <Button
                variant={filter === "unread" ? "default" : "outline"}
                size="sm"
                aria-pressed={filter === "unread"}
                onClick={() => setFilter("unread")}
                className={cn(
                  "flex-1 font-medium transition-all",
                  filter === "unread"
                    ? "bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg shadow-blue-500/30 hover:from-blue-500 hover:to-blue-400"
                    : "border border-slate-700/50 text-slate-300 hover:border-blue-500/40 hover:text-white hover:bg-slate-800/40",
                )}
              >
                Não lidas ({unreadCount})
              </Button>
            </div>

            {/* Marcar todas como lidas */}
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={markAllAsRead}
                disabled={actionLoading}
                className="w-full mt-2 text-xs text-blue-200 hover:text-white hover:bg-blue-500/15 transition-colors"
                aria-label="Marcar todas como lidas"
              >
                <CheckCheck className="h-3 w-3 mr-1" />
                Marcar todas como lidas
              </Button>
            )}
          </div>

          {/* Lista de notificações */}
          <div
            className="flex-1 overflow-y-auto bg-gradient-to-b from-slate-950/40 via-slate-900/20 to-slate-950/40"
            style={{
              scrollbarWidth: 'thin',
              scrollbarColor: 'rgba(59,130,246,0.4) rgba(15,23,42,0.3)',
            } as any}
          >
            {isLoading ? (
              <div className="flex items-center justify-center p-8">
                <Spinner size="md" variant="primary" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 text-center text-slate-400">
                <AlertCircle className="h-12 w-12 mb-2 opacity-40 text-blue-300" />
                <p className="text-sm font-medium">
                  {filter === "unread"
                    ? "Nenhuma notificação não lida"
                    : "Nenhuma notificação"}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-800/50">
                {uniqueNotifications.map((notification: NotificationItem) => (
                  <div
                    key={notification.id}
                    className={cn(
                      "p-4 transition-all duration-200",
                      notification.unread
                        ? "bg-gradient-to-r from-blue-600/8 to-cyan-600/5 hover:from-blue-500/15 hover:to-cyan-500/10 border-l-3 border-blue-500/60"
                        : "hover:bg-slate-800/40",
                    )}
                  >
                    <div className="flex gap-3">
                      <NotificationIcon
                        type={notification.type}
                        priority={notification.priority}
                      />
                      <div className="flex-1 min-w-0">
                        {notification.link ? (
                          <Link
                            href={notification.link}
                            onClick={() => {
                              handleNotificationClick(notification);
                              setIsOpen(false);
                            }}
                            className="block"
                            tabIndex={0}
                            aria-label={notification.title}
                          >
                            <h4 className="font-semibold text-sm text-white hover:text-blue-300 transition-colors">
                              {notification.title}
                            </h4>
                            <p className="text-xs text-slate-300 mt-0.5 line-clamp-2 leading-relaxed">
                              {notification.message}
                            </p>
                            <p className="text-[11px] text-slate-500 mt-1.5 font-medium">
                              {notification.time}
                            </p>
                          </Link>
                        ) : (
                          <>
                            <h4 className="font-semibold text-sm text-white">
                              {notification.title}
                            </h4>
                            <p className="text-xs text-slate-300 mt-0.5 line-clamp-2 leading-relaxed">
                              {notification.message}
                            </p>
                            <p className="text-[11px] text-slate-500 mt-1.5 font-medium">
                              {notification.time}
                            </p>
                          </>
                        )}
                        <div className="flex items-center gap-2 mt-3">
                          {notification.unread && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => markAsRead(notification.id)}
                              disabled={actionLoading}
                              className="h-7 text-xs px-2 text-blue-300 hover:text-white hover:bg-blue-500/25 transition-colors font-medium"
                              aria-label={`Marcar '${notification.title}' como lida`}
                            >
                              <Check className="h-3 w-3 mr-1" />
                              Marcar lida
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteNotification(notification.id)}
                            disabled={actionLoading}
                            className="h-7 text-xs px-2 text-red-300 hover:text-red-100 hover:bg-red-500/20 transition-colors font-medium"
                            aria-label={`Excluir '${notification.title}'`}
                          >
                            <Trash2 className="h-3 w-3 mr-1" />
                            Excluir
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  )
}