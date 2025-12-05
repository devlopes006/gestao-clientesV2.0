import { describe, expect, it } from 'vitest'
import { RecurringExpenseService } from '../RecurringExpenseService'

class MockRecurringRepo {
  private rows: any[] = []
  async create(data: any) {
    return { id: 'rec_' + Math.random().toString(36).slice(2, 10) }
  }
  async update(id: string, orgId: string, input: any) {
    return { id }
  }
  async getById(id: string, orgId: string) {
    return this.rows.find((r) => r.id === id) ?? null
  }
  async list() {
    return this.rows
  }
  seed(rows: any[]) {
    this.rows = rows
  }
}

class MockTransactionRepo {
  async create(data: any) {
    return { id: 'tx_' + Math.random().toString(36).slice(2, 10) }
  }
}

describe('RecurringExpenseService (domain)', () => {
  it('creates a recurring expense delegating to repository', async () => {
    const recRepo = new MockRecurringRepo()
    const txRepo = new MockTransactionRepo()
    const svc = new RecurringExpenseService(recRepo as any, txRepo as any)
    const result = await svc.create({
      name: 'Aluguel',
      amount: 1000,
      cycle: 'MONTHLY',
      orgId: 'org1',
    } as any)
    expect(result).toHaveProperty('id')
  })

  it('materializeMonthly creates transactions for monthly expenses', async () => {
    const recRepo = new MockRecurringRepo()
    const txRepo = new MockTransactionRepo()
    recRepo.seed([
      {
        id: 'r1',
        name: 'Aluguel',
        amount: 1000,
        dayOfMonth: 1,
        cycle: 'MONTHLY',
      },
      {
        id: 'r2',
        name: 'Internet',
        amount: 100,
        dayOfMonth: 5,
        cycle: 'MONTHLY',
      },
    ])
    const svc = new RecurringExpenseService(recRepo as any, txRepo as any)
    const res = await svc.materializeMonthly('org1', 'system')
    expect(res.success.length).toBe(2)
    expect(res.errors.length).toBe(0)
  })
})
