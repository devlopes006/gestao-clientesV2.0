import { expect, test } from '@playwright/test'

const BASE_URL = process.env.E2E_BASE_URL || 'http://localhost:3000'

test.describe('Transacoes', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE_URL}/app/financeiro`)
    await page.waitForLoadState('networkidle')
  })

  test('deve exibir dashboard com KPIs', async ({ page }) => {
    await expect(
      page.getByRole('heading', { name: /financeiro/i })
    ).toBeVisible()

    await expect(page.getByRole('tab', { name: /dashboard/i })).toBeVisible()
    await expect(page.getByRole('tab', { name: /transacoes/i })).toBeVisible()
    await expect(page.getByRole('tab', { name: /faturas/i })).toBeVisible()
    await expect(page.getByRole('tab', { name: /despesas/i })).toBeVisible()
    await expect(page.getByRole('tab', { name: /custos/i })).toBeVisible()
  })

  test('deve abrir modal de nova transacao', async ({ page }) => {
    await page.getByRole('tab', { name: /transacoes/i }).click()
    await page.waitForLoadState('networkidle')

    await page.getByRole('button', { name: /nova transacao/i }).click()
    await page.waitForLoadState('networkidle')

    await expect(page.getByRole('dialog')).toBeVisible()

    await expect(page.locator('select[name="type"]')).toBeVisible()
    await expect(page.locator('input[name="amount"]')).toBeVisible()
    await expect(page.locator('textarea[name="description"]')).toBeVisible()
  })

  test('deve filtrar transacoes por tipo', async ({ page }) => {
    await page.getByRole('tab', { name: /transacoes/i }).click()
    await page.waitForLoadState('networkidle')

    await page
      .locator('select')
      .filter({ hasText: /tipo/i })
      .selectOption('INCOME')
    await page.waitForLoadState('networkidle')

    const badges = page.locator('text=/receita/i')
    await expect(badges.first()).toBeVisible()
  })
})

test.describe('Faturas', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE_URL}/app/financeiro`)
    await page.waitForLoadState('networkidle')
  })

  test('deve exibir lista de faturas', async ({ page }) => {
    await page.getByRole('tab', { name: /faturas/i }).click()
    await page.waitForLoadState('networkidle')

    await expect(page.getByRole('heading', { name: /faturas/i })).toBeVisible()
    await expect(
      page.getByRole('button', { name: /gerar faturas mensais/i })
    ).toBeVisible()
    await expect(
      page.getByRole('button', { name: /nova fatura/i })
    ).toBeVisible()
  })

  test('deve abrir modal de nova fatura', async ({ page }) => {
    await page.getByRole('tab', { name: /faturas/i }).click()
    await page.waitForLoadState('networkidle')

    await page.getByRole('button', { name: /nova fatura/i }).click()
    await page.waitForLoadState('networkidle')

    await expect(page.getByRole('dialog')).toBeVisible()
    await expect(page.locator('input[name="amount"]')).toBeVisible()
  })
})

test.describe('Despesas', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE_URL}/app/financeiro`)
    await page.waitForLoadState('networkidle')
  })

  test('deve exibir lista de despesas', async ({ page }) => {
    await page.getByRole('tab', { name: /despesas/i }).click()
    await page.waitForLoadState('networkidle')

    await expect(
      page.getByRole('heading', { name: /despesas fixas/i })
    ).toBeVisible()
    await expect(
      page.getByRole('button', { name: /nova despesa/i })
    ).toBeVisible()
  })

  test('deve abrir modal de nova despesa', async ({ page }) => {
    await page.getByRole('tab', { name: /despesas/i }).click()
    await page.waitForLoadState('networkidle')

    await page.getByRole('button', { name: /nova despesa/i }).click()
    await page.waitForLoadState('networkidle')

    await expect(page.getByRole('dialog')).toBeVisible()
    await expect(page.locator('input[name="name"]')).toBeVisible()
  })
})

test.describe('Custos', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE_URL}/app/financeiro`)
    await page.waitForLoadState('networkidle')
  })

  test('deve exibir abas de custos', async ({ page }) => {
    await page.getByRole('tab', { name: /custos/i }).click()
    await page.waitForLoadState('networkidle')

    await expect(
      page.getByRole('tab', { name: /itens de custo/i })
    ).toBeVisible()
    await expect(page.getByRole('tab', { name: /associacoes/i })).toBeVisible()
  })

  test('deve trocar entre abas', async ({ page }) => {
    await page.getByRole('tab', { name: /custos/i }).click()
    await page.waitForLoadState('networkidle')

    await page.getByRole('tab', { name: /associacoes/i }).click()
    await page.waitForLoadState('networkidle')
    await expect(
      page.getByRole('heading', { name: /associacoes/i })
    ).toBeVisible()

    await page.getByRole('tab', { name: /itens de custo/i }).click()
    await page.waitForLoadState('networkidle')
    await expect(
      page.getByRole('heading', { name: /itens de custo/i })
    ).toBeVisible()
  })
})

test.describe('Responsividade', () => {
  test('deve ser responsivo em mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto(`${BASE_URL}/app/financeiro`)
    await page.waitForLoadState('networkidle')

    await expect(
      page.getByRole('heading', { name: /financeiro/i })
    ).toBeVisible()
    await expect(page.getByRole('tab', { name: /dashboard/i })).toBeVisible()
  })

  test('deve ser responsivo em tablet', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 })
    await page.goto(`${BASE_URL}/app/financeiro`)
    await page.waitForLoadState('networkidle')

    await expect(
      page.getByRole('heading', { name: /financeiro/i })
    ).toBeVisible()
    await expect(page.getByRole('tab', { name: /dashboard/i })).toBeVisible()
  })
})
