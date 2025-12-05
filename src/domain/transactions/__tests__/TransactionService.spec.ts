import { describe, expect, it } from 'vitest'
import type { TransactionRepository } from '../TransactionService'
import { TransactionService } from '../TransactionService'

class MockTransactionRepo implements TransactionRepository {
  private rows: Array<{ type: 'INCOME' | 'EXPENSE'; amount: number }> = []
  async create(data: any): Promise<{ id: string }> {
    // emulate created id
    return { id: 'tx_' + Math.random().toString(36).slice(2, 10) }
  }
  async listInRange(orgId: string, start: Date, end: Date) {
    return this.rows
  }
  // helper to seed rows
  seed(rows: Array<{ type: 'INCOME' | 'EXPENSE'; amount: number }>) {
    this.rows = rows
  }
}

describe('TransactionService (domain)', () => {
  it('creates a transaction delegating to repository', async () => {
    const repo = new MockTransactionRepo()
    const svc = new TransactionService(repo)
    const result = await svc.create({
      orgId: 'org1',
      type: 'INCOME',
      subtype: 'MANUAL',
      amount: 100,
      date: '2025-01-01',
      description: 'Test income',
    })
    expect(result).toHaveProperty('id')
    expect(typeof result.id).toBe('string')
  })

  it('computes summary correctly', async () => {
    const repo = new MockTransactionRepo()
    repo.seed([
      { type: 'INCOME', amount: 100 },
      { type: 'EXPENSE', amount: 40 },
      { type: 'INCOME', amount: 60 },
    ])
    const svc = new TransactionService(repo)
    const summary = await svc.summary({
      orgId: 'org1',
      startDate: '2025-01-01',
      endDate: '2025-01-31',
    })
    expect(summary.income).toBe(160)
    expect(summary.expense).toBe(40)
    expect(summary.net).toBe(120)
  })
})
