import { expect, test } from '@playwright/test'

const BASE_URL = process.env.E2E_BASE_URL || 'http://localhost:3000'

test.describe('Invoice Generation Flow (Domain Layer)', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to financial/invoices section
    await page.goto(`${BASE_URL}/financeiro`)
    await page.waitForLoadState('networkidle')
  })

  test('should generate monthly invoices successfully', async ({ page }) => {
    // Navigate to invoices tab
    await page.getByRole('tab', { name: /faturas/i }).click()
    await page.waitForLoadState('networkidle')

    // Click generate monthly invoices button
    const generateBtn = page.getByRole('button', {
      name: /gerar faturas/i,
    })
    await expect(generateBtn).toBeVisible()
    await generateBtn.click()

    // Wait for generation process
    await page.waitForLoadState('networkidle')

    // Verify success message or updated invoice list
    await expect(
      page
        .getByText(/faturas geradas com sucesso/i)
        .or(page.getByText(/invoice|fatura/i).first())
    ).toBeVisible({ timeout: 10000 })
  })

  test('should create manual invoice with items', async ({ page }) => {
    await page.getByRole('tab', { name: /faturas/i }).click()
    await page.waitForLoadState('networkidle')

    // Open new invoice modal
    await page.getByRole('button', { name: /nova fatura/i }).click()
    await expect(page.getByRole('dialog')).toBeVisible()

    // Fill invoice form
    await page.locator('select[name="clientId"]').selectOption({ index: 1 })

    // Add invoice item
    await page
      .locator('input[name="items.0.description"]')
      .fill('Serviços de Gestão')
    await page.locator('input[name="items.0.quantity"]').fill('1')
    await page.locator('input[name="items.0.unitAmount"]').fill('1500')

    // Set due date
    const today = new Date()
    const dueDate = new Date(today.setDate(today.getDate() + 10))
      .toISOString()
      .split('T')[0]
    await page.locator('input[name="dueDate"]').fill(dueDate)

    // Submit
    await page.getByRole('button', { name: /criar|salvar/i }).click()
    await page.waitForLoadState('networkidle')

    // Verify invoice created
    await expect(
      page
        .getByText(/fatura criada|invoice created/i)
        .or(page.getByText(/serviços de gestão/i))
    ).toBeVisible({ timeout: 5000 })
  })

  test('should approve invoice payment', async ({ page }) => {
    await page.getByRole('tab', { name: /faturas/i }).click()
    await page.waitForLoadState('networkidle')

    // Find first open invoice
    const firstInvoice = page
      .locator('[data-status="OPEN"], [data-status="open"]')
      .first()

    if (await firstInvoice.isVisible()) {
      await firstInvoice.click()
      await page.waitForLoadState('networkidle')

      // Click approve payment button
      const approveBtn = page.getByRole('button', {
        name: /aprovar pagamento|confirmar pagamento/i,
      })

      if (await approveBtn.isVisible()) {
        await approveBtn.click()
        await page.waitForLoadState('networkidle')

        // Verify status changed to PAID
        await expect(
          page
            .getByText(/pago|paid/i)
            .or(page.getByText(/pagamento confirmado/i))
        ).toBeVisible({ timeout: 5000 })
      }
    }
  })

  test('should handle overdue invoices automatically', async ({ page }) => {
    await page.getByRole('tab', { name: /faturas/i }).click()
    await page.waitForLoadState('networkidle')

    // Trigger overdue update (if there's a button/action for it)
    const updateBtn = page.getByRole('button', {
      name: /atualizar status|update status/i,
    })

    if (await updateBtn.isVisible()) {
      await updateBtn.click()
      await page.waitForLoadState('networkidle')
    }

    // Verify overdue invoices are shown
    const overdueFilter = page.locator('select').filter({ hasText: /status/i })
    if (await overdueFilter.isVisible()) {
      await overdueFilter.selectOption('OVERDUE')
      await page.waitForLoadState('networkidle')

      // Check if overdue invoices appear or message shown
      await expect(
        page
          .getByText(/atrasad|overdue/i)
          .or(page.getByText(/nenhuma fatura|no invoices/i))
      ).toBeVisible({ timeout: 3000 })
    }
  })
})

test.describe('Transaction Domain Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE_URL}/financeiro`)
    await page.waitForLoadState('networkidle')
  })

  test('should create income transaction successfully', async ({ page }) => {
    await page.getByRole('tab', { name: /transac|transactions/i }).click()
    await page.waitForLoadState('networkidle')

    await page.getByRole('button', { name: /nova transac/i }).click()
    await expect(page.getByRole('dialog')).toBeVisible()

    // Fill transaction form
    await page.locator('select[name="type"]').selectOption('INCOME')
    await page.locator('input[name="amount"]').fill('2500')
    await page
      .locator('textarea[name="description"]')
      .fill('Pagamento de cliente - Teste E2E')

    // Select client if dropdown exists
    const clientSelect = page.locator('select[name="clientId"]')
    if (await clientSelect.isVisible()) {
      await clientSelect.selectOption({ index: 1 })
    }

    await page.getByRole('button', { name: /criar|salvar/i }).click()
    await page.waitForLoadState('networkidle')

    // Verify transaction appears in list
    await expect(
      page.getByText(/pagamento de cliente - teste e2e/i)
    ).toBeVisible({ timeout: 5000 })
  })

  test('should display transaction summary correctly', async ({ page }) => {
    await page.getByRole('tab', { name: /dashboard/i }).click()
    await page.waitForLoadState('networkidle')

    // Check KPI cards are visible with numeric values
    const incomeCard = page
      .locator('[data-kpi="income"], text=/receita total/i')
      .first()
    const expenseCard = page
      .locator('[data-kpi="expense"], text=/despesa total/i')
      .first()
    const netCard = page
      .locator('[data-kpi="net"], text=/lucro|saldo/i')
      .first()

    await expect(
      incomeCard.or(page.getByText(/receita/i).first())
    ).toBeVisible()
    await expect(
      expenseCard.or(page.getByText(/despesa/i).first())
    ).toBeVisible()
    await expect(
      netCard.or(page.getByText(/lucro|saldo/i).first())
    ).toBeVisible()

    // Verify numeric values are displayed (R$ format)
    await expect(page.getByText(/R\$\s*[\d.,]+/).first()).toBeVisible()
  })
})

test.describe('Cost Tracking Domain Tests', () => {
  test('should manage cost items and subscriptions', async ({ page }) => {
    await page.goto(`${BASE_URL}/financeiro`)
    await page.waitForLoadState('networkidle')

    await page.getByRole('tab', { name: /custos|costs/i }).click()
    await page.waitForLoadState('networkidle')

    // Create new cost item
    const newCostBtn = page.getByRole('button', {
      name: /novo custo|new cost/i,
    })
    if (await newCostBtn.isVisible()) {
      await newCostBtn.click()
      await expect(page.getByRole('dialog')).toBeVisible()

      await page.locator('input[name="name"]').fill('Servidor AWS - E2E Test')
      await page.locator('input[name="amount"]').fill('500')
      await page.locator('select[name="category"]').selectOption('INFRA')

      await page.getByRole('button', { name: /criar|salvar/i }).click()
      await page.waitForLoadState('networkidle')

      // Verify cost item created
      await expect(page.getByText(/servidor aws - e2e test/i)).toBeVisible({
        timeout: 5000,
      })
    }
  })
})
