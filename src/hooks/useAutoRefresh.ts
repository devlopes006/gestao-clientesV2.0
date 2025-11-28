'use client'

import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useRef } from 'react'

interface UseAutoRefreshOptions {
  /**
   * Intervalo de atualização em milissegundos
   * @default 30000 (30 segundos)
   */
  interval?: number
  /**
   * Se deve fazer refresh quando a aba volta ao foco
   * @default true
   */
  refreshOnFocus?: boolean
  /**
   * Se deve fazer refresh quando volta da navegação
   * @default true
   */
  refreshOnReconnect?: boolean
  /**
   * Caminho customizado para revalidar (opcional)
   */
  path?: string
  /**
   * Se o auto-refresh está habilitado
   * @default true
   */
  enabled?: boolean
}

/**
 * Hook para atualização automática de dados do servidor
 * - Faz polling periódico
 * - Atualiza quando a aba volta ao foco
 * - Atualiza quando reconecta à internet
 */
export function useAutoRefresh(options: UseAutoRefreshOptions = {}) {
  const {
    interval = 30000, // 30 segundos
    refreshOnFocus = true,
    refreshOnReconnect = true,
    enabled = true,
  } = options

  const router = useRouter()
  const lastRefreshRef = useRef<number>(0)
  const intervalIdRef = useRef<NodeJS.Timeout | null>(null)

  const refresh = useCallback(() => {
    const now = Date.now()
    // Evita refreshes muito próximos (menos de 5 segundos)
    if (now - lastRefreshRef.current < 5000) {
      return
    }
    lastRefreshRef.current = now
    router.refresh()
  }, [router])

  useEffect(() => {
    if (!enabled) return

    // Inicializa o timestamp na primeira montagem
    if (lastRefreshRef.current === 0) {
      lastRefreshRef.current = Date.now()
    }

    // Polling periódico
    intervalIdRef.current = setInterval(() => {
      refresh()
    }, interval)

    // Cleanup
    return () => {
      if (intervalIdRef.current) {
        clearInterval(intervalIdRef.current)
      }
    }
  }, [interval, enabled, refresh])

  useEffect(() => {
    if (!enabled || !refreshOnFocus) return

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        refresh()
      }
    }

    const handleFocus = () => {
      refresh()
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('focus', handleFocus)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('focus', handleFocus)
    }
  }, [enabled, refreshOnFocus, refresh])

  useEffect(() => {
    if (!enabled || !refreshOnReconnect) return

    const handleOnline = () => {
      refresh()
    }

    window.addEventListener('online', handleOnline)

    return () => {
      window.removeEventListener('online', handleOnline)
    }
  }, [enabled, refreshOnReconnect, refresh])

  return { refresh }
}
