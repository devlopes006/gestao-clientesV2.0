'use client'

import { useAutoRefresh } from '@/hooks/useAutoRefresh'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'

/**
 * Componente global que fornece auto-refresh automático para toda a aplicação
 * Pode ser desabilitado em páginas específicas através de contexto
 */
export function GlobalAutoRefresh() {
  const pathname = usePathname()
  const [enabled, setEnabled] = useState(true)

  // Lista de páginas onde o auto-refresh deve ser desabilitado
  const disabledPaths = [
    '/login',
    '/signup',
    '/forgot-password',
    '/reset-password',
    '/onboarding',
  ]

  useEffect(() => {
    // Verifica se a página atual está na lista de desabilitados
    const shouldDisable = disabledPaths.some(path => pathname?.startsWith(path))
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setEnabled(!shouldDisable)
  }, [pathname])

  useAutoRefresh({
    interval: 5000, // 5 segundos
    refreshOnFocus: true,
    refreshOnReconnect: true,
    enabled,
    showToast: true,
  })

  return null // Este componente não renderiza nada
}
