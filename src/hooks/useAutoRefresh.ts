'use client'

import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useRef } from 'react'
import { toast } from 'sonner'

interface UseAutoRefreshOptions {
  /**
   * Intervalo de atualização em milissegundos
   * @default 5000 (5 segundos)
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
  /**
   * Se deve mostrar toast de feedback visual
   * @default true
   */
  showToast?: boolean
  /**
   * Callback chamado antes do refresh
   */
  onRefreshStart?: () => void
  /**
   * Callback chamado após o refresh
   */
  onRefreshEnd?: () => void
}

/**
 * Hook para atualização automática de dados do servidor
 * - Faz polling periódico
 * - Atualiza quando a aba volta ao foco
 * - Atualiza quando reconecta à internet
 */
export function useAutoRefresh(options: UseAutoRefreshOptions = {}) {
  const {
    interval = 5000, // 5 segundos
    refreshOnFocus = true,
    refreshOnReconnect = true,
    enabled = true,
    showToast = true,
    onRefreshStart,
    onRefreshEnd,
  } = options

  const router = useRouter()
  const lastRefreshRef = useRef<number>(0)
  const intervalIdRef = useRef<NodeJS.Timeout | null>(null)
  const toastIdRef = useRef<string | number | null>(null)

  const refresh = useCallback(() => {
    const now = Date.now()
    // Evita refreshes muito próximos (menos de 2 segundos)
    if (now - lastRefreshRef.current < 2000) {
      return
    }
    lastRefreshRef.current = now

    // Callback antes do refresh
    onRefreshStart?.()

    // Mostra toast de atualização
    if (showToast) {
      toastIdRef.current = toast.loading('Atualizando conteúdo...', {
        duration: Infinity,
      })
    }

    // Executa refresh
    router.refresh()

    // Aguarda um momento para dar feedback visual
    setTimeout(() => {
      if (showToast && toastIdRef.current !== null) {
        toast.dismiss(toastIdRef.current)
        toast.success('Conteúdo atualizado!', {
          duration: 2000,
        })
      }
      onRefreshEnd?.()
    }, 800)
  }, [router, showToast, onRefreshStart, onRefreshEnd])

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
