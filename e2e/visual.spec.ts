import { test } from '@playwright/test'

const BASE = process.env.BASE_URL ?? 'http://localhost:3000'

const routes = [
  { path: '/', name: 'home' },
  { path: '/billing?tab=resumo', name: 'billing-resumo' },
  { path: '/login', name: 'login' },
]

for (const r of routes) {
  test(`visual - ${r.name}`, async ({ page }) => {
    const url = `${BASE}${r.path}`
    await page.goto(url, { waitUntil: 'networkidle' })

    // Wait a bit for animations and fonts to settle
    await page.waitForTimeout(600)

    const file = `e2e/screenshots/${r.name}.png`
    await page.screenshot({ path: file, fullPage: true })
  })
}
