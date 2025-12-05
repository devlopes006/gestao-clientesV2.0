import { expect, test, vi } from 'vitest'
import { TransactionService } from '../../src/domain/transactions/TransactionService'

const mockRepo = {
  create: vi.fn(async (data: any) => ({ id: 'tx-1' })),
  listInRange: vi.fn(async (orgId: string, start: Date, end: Date) => [
    { type: 'INCOME', amount: 100 },
    { type: 'EXPENSE', amount: 40 },
  ]),
}

test('create delegates to repository and returns id', async () => {
  const svc = new TransactionService(mockRepo as any)
  const input = {
    orgId: 'org1',
    type: 'INCOME',
    subtype: 'SALARY',
    amount: 100,
    date: '2025-12-01',
    description: 'Salary',
  }
  const res = await svc.create(input as any)
  expect(res).toEqual({ id: 'tx-1' })
  expect(mockRepo.create).toHaveBeenCalledWith(input)
})

test('summary aggregates income and expense correctly', async () => {
  const svc = new TransactionService(mockRepo as any)
  const summary = await svc.summary({
    orgId: 'org1',
    startDate: '2025-12-01',
    endDate: '2025-12-31',
  })
  expect(summary).toEqual({ income: 100, expense: 40, net: 60 })
  expect(mockRepo.listInRange).toHaveBeenCalled()
})
