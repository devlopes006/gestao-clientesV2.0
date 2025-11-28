"use client";

import { RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";

interface RefreshIndicatorProps {
  /**
   * Intervalo de atualização em milissegundos
   */
  interval?: number;
}

/**
 * Componente visual que indica quando os dados foram atualizados pela última vez
 * e quando será a próxima atualização
 */
export function RefreshIndicator({ interval = 30000 }: RefreshIndicatorProps) {
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [timeAgo, setTimeAgo] = useState<string>("agora");

  useEffect(() => {
    // Atualiza o timestamp quando o componente monta
    const updateTimestamp = () => {
      setLastUpdate(new Date());
      setTimeAgo("agora");
    };

    // Listener para atualizar quando o router.refresh() é chamado
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        updateTimestamp();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    // Timer para atualizar o "tempo atrás"
    const timer = setInterval(() => {
      const now = Date.now();
      const diff = now - lastUpdate.getTime();
      const seconds = Math.floor(diff / 1000);

      if (seconds < 10) {
        setTimeAgo("agora");
      } else if (seconds < 60) {
        setTimeAgo(`${seconds}s atrás`);
      } else {
        const minutes = Math.floor(seconds / 60);
        setTimeAgo(`${minutes}m atrás`);
      }
    }, 1000);

    // Atualiza o timestamp a cada intervalo (simula o refresh)
    const refreshTimer = setInterval(updateTimestamp, interval);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      clearInterval(timer);
      clearInterval(refreshTimer);
    };
  }, [lastUpdate, interval]);

  return (
    <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
      <RefreshCw className="h-3 w-3 animate-spin-slow" />
      <span>Atualizado {timeAgo}</span>
    </div>
  );
}
