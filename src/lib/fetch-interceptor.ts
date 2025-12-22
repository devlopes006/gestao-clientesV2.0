/**
 * Request/Response Interceptor for automatic token refresh
 *
 * Intercepta fetch requests e responses para:
 * - Adicionar credentials automáticas
 * - Interceptar 401 e tentar refresh
 * - Retry automático com novo token
 *
 * Padrão: RequestInterceptor -> RequestHandler -> ResponseInterceptor -> Client
 */

'use client'

/**
 * Fetch interceptor request config
 */
export interface InterceptedFetchConfig extends RequestInit {
  /** Se true, não tenta refresh automático em 401 */
  skipTokenRefresh?: boolean
  /** Número máximo de retries (default: 1) */
  maxRetries?: number
  /** Timeout em milliseconds (default: 30000) */
  timeout?: number
}

/**
 * Wrapper para adicionar timeout a um fetch
 */
function fetchWithTimeout(
  url: string,
  options: InterceptedFetchConfig = {}
): Promise<Response> {
  const { timeout = 30000, ...fetchOptions } = options

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeout)

  return fetch(url, {
    ...fetchOptions,
    signal: controller.signal,
  }).finally(() => clearTimeout(timeoutId))
}

/**
 * Fetch interceptor para aplicar lógica de refresh automático
 * Retorna um novo fetch que implementa retry logic
 *
 * Uso:
 * const interceptedFetch = createFetchInterceptor(
 *   ({ refreshTokens, tokenState, router }) => ({
 *     refreshTokens,
 *     tokenState,
 *     router,
 *   })
 * )
 *
 * const response = await interceptedFetch('/api/data')
 */
export function createFetchInterceptor(
  contextProvider: () => {
    refreshTokens?: () => Promise<boolean>
    tokenState?: {
      accessToken: string | null
      refreshToken: string | null
      expiresAt: number | null
    }
    router?: { push: (path: string) => void }
    user?: { uid: string } | null
  }
) {
  return async function interceptedFetch(
    url: string,
    options: InterceptedFetchConfig = {}
  ): Promise<Response> {
    const {
      skipTokenRefresh = false,
      maxRetries = 1,
      timeout = 30000,
      ...fetchOptions
    } = options

    const context = contextProvider()
    const { refreshTokens, router, user } = context

    let retryCount = 0

    async function attemptFetch(): Promise<Response> {
      try {
        // Faz a requisição com timeout
        const response = await fetchWithTimeout(url, {
          ...fetchOptions,
          timeout,
          credentials: 'include',
        })

        // Intercepta 401 e tenta refresh
        if (
          response.status === 401 &&
          !skipTokenRefresh &&
          user &&
          refreshTokens &&
          retryCount < maxRetries
        ) {
          console.debug(
            `[Interceptor] 401 detected, attempting refresh (retry ${retryCount + 1}/${maxRetries})`
          )

          const refreshSuccess = await refreshTokens()

          if (!refreshSuccess) {
            console.error(
              '[Interceptor] Token refresh failed, redirecting to login'
            )
            if (router) router.push('/login')
            return response
          }

          console.debug(
            '[Interceptor] Token refreshed, retrying original request'
          )
          retryCount++
          return attemptFetch()
        }

        return response
      } catch (error) {
        if (
          (error as unknown) instanceof DOMException &&
          (error as DOMException).name === 'AbortError'
        ) {
          console.error('[Interceptor] Request timeout after', timeout, 'ms')
          throw new Error(`Request timeout: ${url}`)
        }
        throw error
      }
    }

    return attemptFetch()
  }
}

/**
 * Tipo para exported fetch interceptor
 */
export type InterceptedFetch = (
  url: string,
  options?: InterceptedFetchConfig
) => Promise<Response>
