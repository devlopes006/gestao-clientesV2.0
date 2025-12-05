import { CostTrackingService } from '@/domain/costs/CostTrackingService'
import { prisma } from '@/lib/prisma'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    costItem: {
      create: vi.fn(),
      update: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
    },
    clientCostSubscription: {
      create: vi.fn(),
      update: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
    },
    transaction: {
      findFirst: vi.fn(),
      aggregate: vi.fn(),
    },
  },
}))

vi.mock('@/services/financial/TransactionService', () => ({
  TransactionService: {
    create: vi.fn().mockResolvedValue({ id: 'tx-123' }),
  },
}))

describe('CostTrackingService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('createCostItem', () => {
    it('should create a cost item with valid data', async () => {
      const mockCostItem = {
        id: 'cost-1',
        name: 'Servidor AWS',
        amount: 100,
        orgId: 'org-1',
        active: true,
        description: 'Hosting',
        category: 'INFRA',
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      vi.mocked(prisma.costItem.create).mockResolvedValue(mockCostItem)

      const result = await CostTrackingService.createCostItem({
        name: 'Servidor AWS',
        amount: 100,
        orgId: 'org-1',
        description: 'Hosting',
        category: 'INFRA',
      })

      expect(result).toEqual(mockCostItem)
      expect(prisma.costItem.create).toHaveBeenCalledWith({
        data: {
          name: 'Servidor AWS',
          amount: 100,
          orgId: 'org-1',
          description: 'Hosting',
          category: 'INFRA',
          active: true,
        },
      })
    })

    it('should throw error for zero or negative amount', async () => {
      await expect(
        CostTrackingService.createCostItem({
          name: 'Test',
          amount: 0,
          orgId: 'org-1',
        })
      ).rejects.toThrow('O valor do custo deve ser maior que zero')

      await expect(
        CostTrackingService.createCostItem({
          name: 'Test',
          amount: -10,
          orgId: 'org-1',
        })
      ).rejects.toThrow('O valor do custo deve ser maior que zero')
    })
  })

  describe('createSubscription', () => {
    it('should create subscription when no conflict exists', async () => {
      const mockSubscription = {
        id: 'sub-1',
        clientId: 'client-1',
        costItemId: 'cost-1',
        startDate: new Date('2025-01-01'),
        endDate: null,
        active: true,
        orgId: 'org-1',
        client: { id: 'client-1', name: 'Client A' },
        costItem: { id: 'cost-1', name: 'AWS', amount: 100 },
      }

      vi.mocked(prisma.clientCostSubscription.findFirst).mockResolvedValue(null)
      vi.mocked(prisma.clientCostSubscription.create).mockResolvedValue(
        mockSubscription as any
      )

      const result = await CostTrackingService.createSubscription({
        clientId: 'client-1',
        costItemId: 'cost-1',
        startDate: new Date('2025-01-01'),
        orgId: 'org-1',
      })

      expect(result.id).toBe('sub-1')
      expect(prisma.clientCostSubscription.findFirst).toHaveBeenCalled()
    })

    it('should throw error if subscription already exists', async () => {
      vi.mocked(prisma.clientCostSubscription.findFirst).mockResolvedValue({
        id: 'existing-sub',
      } as any)

      await expect(
        CostTrackingService.createSubscription({
          clientId: 'client-1',
          costItemId: 'cost-1',
          startDate: new Date('2025-01-01'),
          orgId: 'org-1',
        })
      ).rejects.toThrow(
        'Já existe uma associação ativa para este cliente e custo'
      )
    })

    it('should throw error if endDate is before startDate', async () => {
      await expect(
        CostTrackingService.createSubscription({
          clientId: 'client-1',
          costItemId: 'cost-1',
          startDate: new Date('2025-06-01'),
          endDate: new Date('2025-01-01'),
          orgId: 'org-1',
        })
      ).rejects.toThrow('A data final não pode ser anterior à data inicial')
    })
  })

  describe('calculateClientMargin', () => {
    it('should calculate margin correctly with income and expenses', async () => {
      vi.mocked(prisma.transaction.aggregate)
        .mockResolvedValueOnce({ _sum: { amount: 5000 }, _count: 5 } as any) // income
        .mockResolvedValueOnce({ _sum: { amount: 2000 }, _count: 3 } as any) // expenses

      const result = await CostTrackingService.calculateClientMargin(
        'client-1',
        'org-1',
        new Date('2025-01-01'),
        new Date('2025-12-31')
      )

      expect(result.income).toBe(5000)
      expect(result.expenses).toBe(2000)
      expect(result.netProfit).toBe(3000)
      expect(result.profitMargin).toBe(60) // (3000 / 5000) * 100
    })

    it('should handle zero income gracefully', async () => {
      vi.mocked(prisma.transaction.aggregate)
        .mockResolvedValueOnce({ _sum: { amount: 0 }, _count: 0 } as any)
        .mockResolvedValueOnce({ _sum: { amount: 1000 }, _count: 2 } as any)

      const result = await CostTrackingService.calculateClientMargin(
        'client-1',
        'org-1'
      )

      expect(result.income).toBe(0)
      expect(result.expenses).toBe(1000)
      expect(result.netProfit).toBe(-1000)
      expect(result.profitMargin).toBe(0)
    })
  })

  describe('materializeMonthly', () => {
    it('should skip already materialized subscriptions', async () => {
      const mockSubscription = {
        id: 'sub-1',
        clientId: 'client-1',
        costItemId: 'cost-1',
        orgId: 'org-1',
        client: { id: 'client-1', name: 'Client A' },
        costItem: { id: 'cost-1', name: 'AWS', amount: 100, category: 'INFRA' },
      }

      vi.mocked(prisma.clientCostSubscription.findMany).mockResolvedValue([
        mockSubscription,
      ] as any)
      vi.mocked(prisma.transaction.findFirst).mockResolvedValue({
        id: 'existing-tx',
      } as any)

      const result = await CostTrackingService.materializeMonthly('org-1')

      expect(result.skipped).toHaveLength(1)
      expect(result.skipped[0].reason).toBe('Já materializado neste mês')
      expect(result.success).toHaveLength(0)
    })

    it('should create transaction for unmaterialized subscription', async () => {
      const mockSubscription = {
        id: 'sub-1',
        clientId: 'client-1',
        costItemId: 'cost-1',
        orgId: 'org-1',
        client: { id: 'client-1', name: 'Client A' },
        costItem: { id: 'cost-1', name: 'AWS', amount: 100, category: 'INFRA' },
      }

      vi.mocked(prisma.clientCostSubscription.findMany).mockResolvedValue([
        mockSubscription,
      ] as any)
      vi.mocked(prisma.transaction.findFirst).mockResolvedValue(null)

      const { TransactionService } = await import(
        '@/services/financial/TransactionService'
      )
      vi.mocked(TransactionService.create).mockResolvedValue({
        id: 'tx-123',
      } as any)

      const result = await CostTrackingService.materializeMonthly(
        'org-1',
        'user-1'
      )

      expect(result.success).toHaveLength(1)
      expect(result.success[0].transactionId).toBe('tx-123')
      expect(result.errors).toHaveLength(0)
    })
  })
})
