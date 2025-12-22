/**
 * EXEMPLO DE USO: Hooks de Fetch com Auto-Refresh de Token
 * 
 * Existem 2 formas de usar:
 * 1. Hook useFetch (mais simples, recomendado para componentes)
 * 2. createFetchInterceptor (mais flexible, para casos avançados)
 */

'use client'

import { useUser } from '@/context/UserContext'
import { createFetchInterceptor } from '@/lib/fetch-interceptor'
import { useFetch } from '@/lib/useFetch'
import { useRouter } from 'next/navigation'

/**
 * EXEMPLO 1: Usar o hook useFetch em um componente (RECOMENDADO)
 */
export function MyComponent() {
  const { fetch } = useFetch()

  async function loadData() {
    try {
      // fetch aqui já tem retry automático em 401!
      const response = await fetch('/api/data')

      if (response.ok) {
        const data = await response.json()
        console.log('Data:', data)
      } else {
        console.error('Error:', response.status)
      }
    } catch (error) {
      console.error('Fetch failed:', error)
    }
  }

  // Se precisar pular o retry logic para algum endpoint específico:
  async function loginWithoutRetry() {
    const { fetch: fetchNoRetry } = useFetch()
    const response = await fetchNoRetry('/api/login', {
      method: 'POST',
      skipTokenRefresh: true, // Pula retry automático
    })
    return response
  }

  return (
    <button onClick={loadData}>
      Load Data
    </button>
  )
}

/**
 * EXEMPLO 2: createFetchInterceptor (para casos avançados)
 */
export function MyAdvancedComponent() {
  const { refreshTokens, tokenState, user } = useUser()
  const router = useRouter()

  // Criar um fetch interceptado personalizado
  const interceptedFetch = createFetchInterceptor(() => ({
    refreshTokens,
    tokenState,
    router,
    user,
  }))

  async function loadDataWithTimeout() {
    try {
      // Com timeout customizado e máximo de retries
      const response = await interceptedFetch('/api/data', {
        timeout: 60000, // 60 segundos
        maxRetries: 2, // Até 2 retries em 401
      })

      if (response.ok) {
        const data = await response.json()
        console.log('Data:', data)
      }
    } catch (error) {
      console.error('Fetch failed:', error)
    }
  }

  return (
    <button onClick={loadDataWithTimeout}>
      Load with Custom Timeout
    </button>
  )
}

/**
 * EXEMPLO 3: Padrão de Requisições Comuns
 */
export function DataService() {
  const { fetch } = useFetch()

  // GET request
  async function getUser(userId: string) {
    const response = await fetch(`/api/users/${userId}`)
    if (response.ok) return response.json()
    throw new Error(`Failed to get user: ${response.status}`)
  }

  // POST request
  async function createItem(data: unknown) {
    const response = await fetch('/api/items', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (response.ok) return response.json()
    throw new Error(`Failed to create item: ${response.status}`)
  }

  // DELETE request
  async function deleteItem(itemId: string) {
    const response = await fetch(`/api/items/${itemId}`, {
      method: 'DELETE',
    })
    if (response.ok) return { success: true }
    throw new Error(`Failed to delete item: ${response.status}`)
  }

  return { getUser, createItem, deleteItem }
}

/**
 * FLUXO DE EXECUÇÃO:
 * 
 * 1. Client faz fetch('/api/data')
 *    ↓
 * 2. useFetch intercepta e adiciona credentials
 *    ↓
 * 3. Server retorna response
 *    ↓
 * 4a. Se 401 (token expirado):
 *      - useFetch chama refreshTokens()
 *      - refreshTokens() chama /api/refresh
 *      - Novo token recebido e armazenado
 *      - Retry automático fetch('/api/data') com novo token
 *      ↓
 * 4b. Se 401 permanece após refresh:
 *      - Token inválido ou acesso revogado
 *      - Redirect para /login
 *      ↓
 * 4c. Se não é 401:
 *      - Retorna response para o componente
 * 
 * 5. Componente recebe response
 */

/**
 * CONFIGURAÇÕES AVANÇADAS:
 * 
 * Para customizar o comportamento:
 * 
 * - skipTokenRefresh: true → Não tenta refresh em 401 (útil para login endpoints)
 * - maxRetries: N → Número máximo de retries (default: 1)
 * - timeout: MS → Timeout em milliseconds (default: 30000)
 * 
 * Exemplo:
 * const response = await fetch('/api/sensitive-data', {
 *   timeout: 60000,        // 60 segundos
 *   maxRetries: 3,         // Até 3 tentativas
 *   skipTokenRefresh: false, // Permitir retry em 401
 * })
 */

