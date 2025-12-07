/**
 * Nonce desabilitado para compatibilidade com Netlify.
 * CSP agora usa 'unsafe-inline' em vez de nonces dinâmicos.
 * @returns undefined
 */
export async function getNonce(): Promise<string | undefined> {
  return undefined
}
