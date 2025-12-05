import { describe, expect, it } from 'vitest'
import { InvoiceService } from '../InvoiceService'

class MockClientRepo {
  private clients: Array<{ id: string; planAmount: number | null }> = []
  seed(clients: Array<{ id: string; planAmount: number | null }>) {
    this.clients = clients
  }
  async listActiveWithPlan(orgId: string) {
    return this.clients
  }
}

class MockInvoiceRepo {
  private existing = new Set<string>()
  async existsForMonth(orgId: string, clientId: string, month: string) {
    return this.existing.has(clientId)
  }
  markExisting(clientId: string) {
    this.existing.add(clientId)
  }
  async createMonthly(
    orgId: string,
    clientId: string,
    month: string,
    amount: number
  ) {
    return { id: `inv_${clientId}` }
  }
}

describe('InvoiceService (domain)', () => {
  it('creates invoices for clients with plan and no existing invoice', async () => {
    const clients = new MockClientRepo()
    const invoices = new MockInvoiceRepo()
    clients.seed([
      { id: 'c1', planAmount: 100 },
      { id: 'c2', planAmount: 50 },
    ])
    const svc = new InvoiceService(clients as any, invoices as any)
    const res = await svc.generateMonthlyInvoices({
      orgId: 'org1',
      month: '2025-12',
      dryRun: false,
    })
    expect(res.created).toBe(2)
    expect(res.skipped).toBe(0)
    expect(res.details.find((d) => d.clientId === 'c1')?.invoiceId).toBe(
      'inv_c1'
    )
  })

  it('skips clients that already have invoice', async () => {
    const clients = new MockClientRepo()
    const invoices = new MockInvoiceRepo()
    clients.seed([{ id: 'c1', planAmount: 100 }])
    invoices.markExisting('c1')
    const svc = new InvoiceService(clients as any, invoices as any)
    const res = await svc.generateMonthlyInvoices({
      orgId: 'org1',
      month: '2025-12',
      dryRun: false,
    })
    expect(res.created).toBe(0)
    expect(res.skipped).toBe(1)
    expect(res.details[0].reason).toBe('already-exists')
  })

  it('skips clients without plan amount', async () => {
    const clients = new MockClientRepo()
    const invoices = new MockInvoiceRepo()
    clients.seed([{ id: 'c1', planAmount: null }])
    const svc = new InvoiceService(clients as any, invoices as any)
    const res = await svc.generateMonthlyInvoices({
      orgId: 'org1',
      month: '2025-12',
      dryRun: false,
    })
    expect(res.created).toBe(0)
    expect(res.skipped).toBe(1)
    expect(res.details[0].reason).toBe('no-plan')
  })

  it('dryRun does not persist invoices but counts them as created', async () => {
    const clients = new MockClientRepo()
    const invoices = new MockInvoiceRepo()
    clients.seed([{ id: 'c1', planAmount: 100 }])
    const svc = new InvoiceService(clients as any, invoices as any)
    const res = await svc.generateMonthlyInvoices({
      orgId: 'org1',
      month: '2025-12',
      dryRun: true,
    })
    expect(res.created).toBe(1)
    expect(res.details[0].invoiceId).toBeUndefined()
  })
})
