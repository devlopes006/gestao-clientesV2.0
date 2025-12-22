/**
 * E2E Tests - Session & Token Management
 *
 * Testes end-to-end para validar todo o fluxo de autenticação, refresh de tokens e validação de permissões.
 */

import { expect, test } from '@playwright/test'

/**
 * Configurações de teste
 */
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000'
const TEST_EMAIL = process.env.TEST_EMAIL || 'test-session@example.com'
const TEST_PASSWORD = process.env.TEST_PASSWORD || 'Test@123456'

/**
 * Teste 1: Login e Geração de Tokens
 *
 * Valida:
 * - User consegue fazer login
 * - Tokens são gerados corretamente
 * - Cookies são criados (auth + refresh)
 */
test.describe('Session Management', () => {
  test('should login and create session tokens', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`)

    // Preencher credenciais
    await page.fill('input[name="email"]', TEST_EMAIL)
    await page.fill('input[name="password"]', TEST_PASSWORD)

    // Fazer login
    await page.click('button[type="submit"]')

    // Esperar redirecionamento
    await page.waitForURL(`${BASE_URL}/dashboard`)

    // Verificar que cookies foram criados
    const cookies = await page.context().cookies()
    const authCookie = cookies.find((c) => c.name === 'auth')
    const refreshCookie = cookies.find((c) => c.name === 'refresh')

    expect(authCookie).toBeDefined()
    expect(authCookie?.httpOnly).toBe(true)
    expect(authCookie?.secure).toBe(process.env.NODE_ENV === 'production')

    expect(refreshCookie).toBeDefined()
    expect(refreshCookie?.httpOnly).toBe(true)
  })

  /**
   * Teste 2: Token Refresh Automático
   *
   * Valida:
   * - Quando token expira, refresh é chamado automaticamente
   * - Novo token é gerado e armazenado
   * - Request é retentado com novo token
   * - User não vê erro 401
   */
  test.skip('should auto-refresh token when expired', async ({
    page,
    context,
  }) => {
    // Login primeiro
    await page.goto(`${BASE_URL}/login`)
    await page.fill('input[name="email"]', TEST_EMAIL)
    await page.fill('input[name="password"]', TEST_PASSWORD)
    await page.click('button[type="submit"]')
    await page.waitForURL(`${BASE_URL}/dashboard`)

    // Obter token atual
    let cookies = await context.cookies()
    const originalToken = cookies.find((c) => c.name === 'auth')?.value

    // Esperar token expirar (1 hora)
    // Em teste: simular expiração alterando cookie
    await context.clearCookies({ name: 'auth' })
    await context.addCookies([
      {
        name: 'auth',
        value: 'expired-token',
        domain: new URL(BASE_URL).hostname,
        path: '/',
        httpOnly: true,
        secure: false,
        sameSite: 'Lax',
        expires: Math.floor(Date.now() / 1000) - 1000, // Já expirou
      },
    ])

    // Fazer request que precisa de token
    const response = await page.request.get(`${BASE_URL}/api/session`)

    // Se interceptor funcionou, token foi renovado
    // Verificar que não há erro 401
    expect(response.status()).not.toBe(401)

    // Verificar que novo token foi gerado
    cookies = await context.cookies()
    const newToken = cookies.find((c) => c.name === 'auth')?.value
    expect(newToken).not.toBe('expired-token')
    expect(newToken).not.toBe(originalToken)
  })

  /**
   * Teste 3: Logout Limpa Tokens
   *
   * Valida:
   * - Logout remove cookies
   * - User é redirecionado para login
   * - Request posterior retorna 401
   */
  test('should clear tokens on logout', async ({ page, context }) => {
    // Login
    await page.goto(`${BASE_URL}/login`)
    await page.fill('input[name="email"]', TEST_EMAIL)
    await page.fill('input[name="password"]', TEST_PASSWORD)
    await page.click('button[type="submit"]')
    await page.waitForURL(`${BASE_URL}/dashboard`)

    // Verificar que tem cookies
    let cookies = await context.cookies()
    expect(cookies.find((c) => c.name === 'auth')).toBeDefined()

    // Fazer logout
    await page.click('button[aria-label="menu"]')
    await page.click('text=Sair')

    // Esperar redirecionamento
    await page.waitForURL(`${BASE_URL}/login`)

    // Verificar que cookies foram removidos
    cookies = await context.cookies()
    expect(cookies.find((c) => c.name === 'auth')).toBeUndefined()
    expect(cookies.find((c) => c.name === 'refresh')).toBeUndefined()
  })

  /**
   * Teste 4: Request sem Token Retorna 401
   *
   * Valida:
   * - Request sem token retorna 401
   * - Frontend redireciona para login
   */
  test('should redirect to login on 401', async ({ page, context }) => {
    // Ir direto para dashboard (sem estar logado)
    await page.goto(`${BASE_URL}/dashboard`)

    // Deve redirecionar para login (401)
    await page.waitForURL(`${BASE_URL}/login`, { timeout: 5000 }).catch(() => {
      // Se não redirecionar, a página pode estar bloqueando via cliente
    })

    // Verificar que estamos no login
    const url = page.url()
    expect(url).toContain('/login')
  })

  /**
   * Teste 5: Múltiplas Abas (Sincronização de Logout)
   *
   * Valida:
   * - Login em aba 1
   * - Logout em aba 2
   * - Aba 1 detecta logout (next request retorna 401)
   */
  test.skip('should sync logout across tabs', async ({ browser }) => {
    // Abrir aba 1 (login)
    const tab1 = await browser.newContext()
    const page1 = await tab1.newPage()
    await page1.goto(`${BASE_URL}/login`)
    await page1.fill('input[name="email"]', TEST_EMAIL)
    await page1.fill('input[name="password"]', TEST_PASSWORD)
    await page1.click('button[type="submit"]')
    await page1.waitForURL(`${BASE_URL}/dashboard`)

    // Abrir aba 2 (mesma sessão)
    const tab2 = await browser.newContext()
    const page2 = await tab2.newPage()
    // Copiar cookies da aba 1
    const cookies = await tab1.cookies()
    await tab2.addCookies(cookies)
    await page2.goto(`${BASE_URL}/dashboard`)

    // Fazer logout na aba 2
    await page2.click('button[aria-label="menu"]')
    await page2.click('text=Sair')

    // Esperamos que cookies sejam removidos na aba 2
    const cookiesAfter = await tab2.cookies()
    expect(cookiesAfter.find((c) => c.name === 'auth')).toBeUndefined()

    // Nota: Sincronização cross-tab requer storage events ou websockets
    // Este teste pode precisar de ajustes dependendo da implementação

    await tab1.close()
    await tab2.close()
  })

  /**
   * Teste 6: Validação de Permissões Revogadas
   *
   * Valida:
   * - Admin remove user de um team
   * - User tenta acessar recurso do team
   * - Request retorna 403 (não 401)
   * - User deve fazer login novamente
   */
  test.skip('should return 403 when permissions revoked', async ({
    page,
    context,
  }) => {
    // Login
    await page.goto(`${BASE_URL}/login`)
    await page.fill('input[name="email"]', TEST_EMAIL)
    await page.fill('input[name="password"]', TEST_PASSWORD)
    await page.click('button[type="submit"]')
    await page.waitForURL(`${BASE_URL}/dashboard`)

    // Em outro contexto (admin), remover user do team
    const adminPage = await context.newPage()
    // ... (fazer login como admin)
    // ... (remover user de team)

    // Voltar para página do user e fazer request
    const response = await page.request.get(`${BASE_URL}/api/session`)

    // Esperamos 403 (acesso revogado) ou 401 (precisa refazer login)
    expect([403, 401]).toContain(response.status())

    // Se 403, página deve mostrar mensagem de acesso negado
    if (response.status() === 403) {
      await expect(page).toContainText('Acesso negado')
    }
  })

  /**
   * Teste 7: Token Expiry Handling
   *
   * Valida:
   * - Token com expiração < 5 minutos é renovado
   * - Novo token é usado em próximo request
   * - Sem delay perceptível para user
   */
  test.skip('should refresh token before expiry buffer', async ({ page }) => {
    // Login
    await page.goto(`${BASE_URL}/login`)
    await page.fill('input[name="email"]', TEST_EMAIL)
    await page.fill('input[name="password"]', TEST_PASSWORD)
    await page.click('button[type="submit"]')
    await page.waitForURL(`${BASE_URL}/dashboard`)

    // Simular token que expira em 4 minutos
    // ... (modificar localStorage/context para simular)

    // Fazer request
    const startTime = Date.now()
    const response = await page.request.get(`${BASE_URL}/api/data`)
    const duration = Date.now() - startTime

    // Request não deve levar muito tempo (sem delay extra do refresh)
    expect(duration).toBeLessThan(2000) // < 2 segundos
    expect(response.status()).toBe(200)
  })
})

/**
 * Teste 8: Segurança - httpOnly Cookies
 *
 * Valida:
 * - JavaScript não consegue acessar token
 * - Token não é exposto em window.document.cookie
 */
test('should protect tokens in httpOnly cookies', async ({ page }) => {
  // Login
  await page.goto(`${BASE_URL}/login`)
  await page.fill('input[name="email"]', TEST_EMAIL)
  await page.fill('input[name="password"]', TEST_PASSWORD)
  await page.click('button[type="submit"]')
  await page.waitForURL(`${BASE_URL}/dashboard`)

  // Tentar acessar cookies via JavaScript
  const jsAccessibleCookies = await page.evaluate(() => document.cookie)

  // Cookies httpOnly não devem aparecer
  expect(jsAccessibleCookies).not.toContain('auth')
  expect(jsAccessibleCookies).not.toContain('refresh')

  // Cookies devem estar vazios ou não conter tokens
  expect(jsAccessibleCookies.length).toBeLessThan(50) // Valor típico de cookies vazios
})
