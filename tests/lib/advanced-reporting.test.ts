import * as advancedReporting from '@/lib/advanced-reporting'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    invoice: {
      findMany: vi.fn(),
      count: vi.fn(),
    },
  },
}))

describe('Advanced Reporting Utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('aggregateMonthlyRevenue', () => {
    it('agrega invoices por mês corretamente', () => {
      const invoices = [
        {
          issueDate: new Date('2024-01-15'),
          status: 'PAID',
          total: 1000,
          client: { name: 'Cliente A' },
        },
        {
          issueDate: new Date('2024-01-20'),
          status: 'OPEN',
          total: 500,
          client: { name: 'Cliente B' },
        },
        {
          issueDate: new Date('2024-02-10'),
          status: 'OVERDUE',
          total: 750,
          client: { name: 'Cliente A' },
        },
      ]

      const result = advancedReporting.aggregateMonthlyRevenue(invoices as any)

      expect(result.size).toBe(2)
      expect(result.get('2024-01')).toMatchObject({
        month: '2024-01',
        confirmedRevenue: 1000,
        projectedRevenue: 500,
        paidCount: 1,
        openCount: 1,
      })
      expect(result.get('2024-02')).toMatchObject({
        atRiskRevenue: 750,
        overdueCount: 1,
      })
    })

    it('retorna Map vazio para array vazio', () => {
      const result = advancedReporting.aggregateMonthlyRevenue([])
      expect(result.size).toBe(0)
    })
  })

  describe('aggregateClientRevenue', () => {
    it('agrega receita por cliente corretamente', () => {
      const invoices = [
        {
          clientId: 'client-1',
          status: 'PAID',
          total: 1000,
          client: { name: 'Cliente A' },
        },
        {
          clientId: 'client-1',
          status: 'OPEN',
          total: 500,
          client: { name: 'Cliente A' },
        },
        {
          clientId: 'client-2',
          status: 'OVERDUE',
          total: 750,
          client: { name: 'Cliente B' },
        },
      ]

      const result = advancedReporting.aggregateClientRevenue(invoices as any)

      expect(result.size).toBe(2)
      const client1 = result.get('client-1')!
      expect(client1.totalProjected).toBe(1500)
      expect(client1.confirmedRevenue).toBe(1000)
      expect(client1.projectedRevenue).toBe(500)
      expect(client1.invoiceCount).toBe(2)
    })
  })

  describe('calculateRiskLevel', () => {
    it('retorna LOW para 0 dias', () => {
      expect(advancedReporting.calculateRiskLevel(0, 0)).toBe('LOW')
    })

    it('retorna LOW para < 7 dias e < 1000', () => {
      expect(advancedReporting.calculateRiskLevel(5, 500)).toBe('LOW')
    })

    it('retorna MEDIUM para < 15 dias e < 5000', () => {
      expect(advancedReporting.calculateRiskLevel(10, 2000)).toBe('MEDIUM')
    })

    it('retorna HIGH para < 30 dias', () => {
      expect(advancedReporting.calculateRiskLevel(25, 10000)).toBe('HIGH')
    })

    it('retorna CRITICAL para >= 30 dias', () => {
      expect(advancedReporting.calculateRiskLevel(35, 10000)).toBe('CRITICAL')
    })
  })

  describe('calculatePaymentSuccessRate', () => {
    it('retorna 100% quando não há faturas', () => {
      expect(advancedReporting.calculatePaymentSuccessRate(0, 0)).toBe(100)
    })

    it('calcula taxa de sucesso corretamente', () => {
      expect(advancedReporting.calculatePaymentSuccessRate(5, 10)).toBe(50)
      expect(advancedReporting.calculatePaymentSuccessRate(10, 10)).toBe(100)
    })
  })

  describe('calculateProjectionAccuracy', () => {
    it('retorna 0 para 0 meses totais', () => {
      expect(advancedReporting.calculateProjectionAccuracy(6, 0)).toBe(0)
    })

    it('calcula acurácia baseada em cobertura histórica', () => {
      expect(advancedReporting.calculateProjectionAccuracy(6, 12)).toBe(50)
      expect(advancedReporting.calculateProjectionAccuracy(12, 12)).toBe(100)
      expect(advancedReporting.calculateProjectionAccuracy(15, 12)).toBe(100) // cap em 100
    })
  })

  describe('getDaysOverdue', () => {
    it('retorna 0 para data futura', () => {
      const futureDate = new Date()
      futureDate.setDate(futureDate.getDate() + 5)
      expect(advancedReporting.getDaysOverdue(futureDate)).toBe(0)
    })

    it('calcula dias corretamente para data passada', () => {
      const pastDate = new Date()
      pastDate.setDate(pastDate.getDate() - 5)
      const days = advancedReporting.getDaysOverdue(pastDate)
      expect(days).toBe(5)
    })
  })

  describe('topClientsByRevenue', () => {
    it('retorna top N clientes ordenado por receita', () => {
      const clients = [
        { totalProjected: 1000, clientName: 'A' } as any,
        { totalProjected: 3000, clientName: 'C' } as any,
        { totalProjected: 2000, clientName: 'B' } as any,
      ]

      const result = advancedReporting.topClientsByRevenue(clients, 2)

      expect(result).toHaveLength(2)
      expect(result[0].totalProjected).toBe(3000)
      expect(result[1].totalProjected).toBe(2000)
    })
  })

  describe('groupDelinquenciesByRiskLevel', () => {
    it('agrupa clientes por nível de risco', () => {
      const clients = [
        { riskLevel: 'CRITICAL' as const, clientName: 'A' } as any,
        { riskLevel: 'HIGH' as const, clientName: 'B' } as any,
        { riskLevel: 'MEDIUM' as const, clientName: 'C' } as any,
        { riskLevel: 'LOW' as const, clientName: 'D' } as any,
        { riskLevel: 'CRITICAL' as const, clientName: 'E' } as any,
      ]

      const result = advancedReporting.groupDelinquenciesByRiskLevel(clients)

      expect(result.critical).toHaveLength(2)
      expect(result.high).toHaveLength(1)
      expect(result.medium).toHaveLength(1)
      expect(result.low).toHaveLength(1)
    })
  })

  describe('buildRevenueProjectionWhere', () => {
    it('constrói WHERE clause com filtros corretos', () => {
      const from = new Date('2024-01-01')
      const to = new Date('2024-12-31')
      const orgId = 'org-123'

      const where = advancedReporting.buildRevenueProjectionWhere(
        from,
        to,
        orgId
      )

      expect(where.organizationId || where.orgId).toBe(orgId)
      expect(where.status).toMatchObject({ in: ['PAID', 'OPEN', 'OVERDUE'] })
      expect(where.issueDate).toBeDefined()
    })
  })

  describe('buildDelinquencyWhere', () => {
    it('constrói WHERE clause para faturas vencidas', () => {
      const orgId = 'org-123'
      const where = advancedReporting.buildDelinquencyWhere(orgId, 0)

      expect(where.organizationId || where.orgId).toBe(orgId)
      expect(where.status).toBe('OVERDUE')
    })
  })

  describe('revenueProjectionSchema', () => {
    it('valida parâmetros de projeção', () => {
      const valid = advancedReporting.revenueProjectionSchema.safeParse({
        months: 12,
        fromDate: new Date().toISOString(),
      })

      expect(valid.success).toBe(true)
    })

    it('rejeita parâmetros inválidos', () => {
      const invalid = advancedReporting.revenueProjectionSchema.safeParse({
        months: 100, // > 24
      })

      expect(invalid.success).toBe(false)
    })
  })

  describe('delinquencyAnalysisSchema', () => {
    it('valida parâmetros de análise', () => {
      const valid = advancedReporting.delinquencyAnalysisSchema.safeParse({
        minDaysOverdue: 7,
        limit: 50,
      })

      expect(valid.success).toBe(true)
    })

    it('usa valores padrão', () => {
      const result = advancedReporting.delinquencyAnalysisSchema.parse({})

      expect(result.minDaysOverdue).toBe(0)
      expect(result.limit).toBe(50)
    })
  })
})
