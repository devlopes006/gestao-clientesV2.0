/**
 * useFetch Hook - Fetch wrapper with automatic token refresh
 *
 * Intercepta respostas 401 e tenta refresh automático
 * Se refresh falhar, redireciona para /login
 *
 * Uso:
 * const { fetch } = useFetch()
 * const response = await fetch('/api/data')
 */

'use client'

import { useUser } from '@/context/UserContext'
import { useRouter } from 'next/navigation'
import { useCallback } from 'react'

interface FetchOptions extends RequestInit {
  skipTokenRefresh?: boolean // Se true, não tenta refresh automático
}

interface UseFetchReturn {
  fetch: (url: string, options?: FetchOptions) => Promise<Response>
}

/**
 * Hook that wraps fetch with automatic token refresh on 401
 *
 * Features:
 * - Intercepta respostas 401
 * - Tenta refresh automático usando refreshTokens()
 * - Retenta a requisição original com novo token
 * - Se refresh falhar, redireciona para /login
 * - Suporta skipTokenRefresh para endpoints que não precisam de retry
 */
export function useFetch(): UseFetchReturn {
  const { refreshTokens, tokenState, user } = useUser()
  const router = useRouter()

  const fetchWithRetry = useCallback(
    async (url: string, options: FetchOptions = {}): Promise<Response> => {
      const { skipTokenRefresh = false, ...fetchOptions } = options

      try {
        // Faz a requisição inicial
        let response = await fetch(url, {
          ...fetchOptions,
          credentials: 'include',
        })

        // Se receber 401 e não está em skipTokenRefresh mode
        if (response.status === 401 && !skipTokenRefresh && user) {
          console.debug('[useFetch] Intercepted 401, attempting token refresh')

          // Tenta refresh do token
          const refreshSuccess = await refreshTokens()

          if (!refreshSuccess) {
            console.error(
              '[useFetch] Token refresh failed, redirecting to login'
            )
            // Refresh falhou, redireciona para login
            router.push('/login')
            return response
          }

          console.debug(
            '[useFetch] Token refreshed successfully, retrying original request'
          )

          // Retry a requisição original com o novo token
          response = await fetch(url, {
            ...fetchOptions,
            credentials: 'include',
          })

          // Se ainda for 401 após refresh, pode ser falta de permissão
          if (response.status === 401) {
            console.error(
              '[useFetch] Still 401 after refresh, access may be revoked'
            )
            router.push('/login')
            return response
          }
        }

        return response
      } catch (error) {
        console.error('[useFetch] Fetch error:', error)
        throw error
      }
    },
    [refreshTokens, user, router]
  )

  return {
    fetch: fetchWithRetry,
  }
}
