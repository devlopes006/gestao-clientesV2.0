import { randomBytes } from 'crypto'
import { headers } from 'next/headers'

/**
 * Recupera o nonce da requisição atual.
 * Deve ser chamado apenas em Server Components.
 * Se o middleware não estiver ativo (ex: build Netlify), gera um nonce temporário.
 * @returns O nonce único desta requisição
 */
export async function getNonce(): Promise<string> {
  const headersList = await headers()
  const existingNonce = headersList.get('x-nonce')

  // Se o middleware estiver ativo, usa o nonce dele
  if (existingNonce) {
    return existingNonce
  }

  // Fallback: gera um nonce local se middleware não estiver disponível
  // (ex: durante build do Netlify ou em ambientes sem middleware)
  return randomBytes(16).toString('base64')
}
