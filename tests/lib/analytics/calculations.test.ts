import {
  calculateAnalyticsSummary,
  calculateClientProfitability,
  calculateGrowthTrend,
  calculateMonthlyRevenue,
  formatCurrency,
  formatPercent,
  generateMockAnalyticsData,
  type ClientProfitability,
  type RevenueData,
} from '@/lib/analytics/calculations'
import { describe, expect, it } from 'vitest'

describe('Analytics Calculations', () => {
  describe('calculateMonthlyRevenue', () => {
    it('should calculate monthly revenue correctly', () => {
      const invoices = [
        {
          issueDate: new Date('2025-01-15'),
          status: 'PAID',
          total: 1000,
        },
        {
          issueDate: new Date('2025-01-20'),
          status: 'PAID',
          total: 2000,
        },
        {
          issueDate: new Date('2025-02-10'),
          status: 'PAID',
          total: 1500,
        },
      ]

      const costs = [
        {
          date: new Date('2025-01-05'),
          amount: 600,
        },
        {
          date: new Date('2025-02-05'),
          amount: 800,
        },
      ]

      const result = calculateMonthlyRevenue(invoices, costs)

      expect(result).toHaveLength(2)
      expect(result[0].month).toBe('2025-01')
      expect(result[0].revenue).toBe(3000)
      expect(result[0].cost).toBe(600)
      expect(result[0].profit).toBe(2400)
    })

    it('should only count PAID invoices', () => {
      const invoices = [
        {
          issueDate: new Date('2025-01-15'),
          status: 'PAID',
          total: 1000,
        },
        {
          issueDate: new Date('2025-01-20'),
          status: 'OPEN',
          total: 2000,
        },
      ]

      const costs: any[] = []

      const result = calculateMonthlyRevenue(invoices, costs)

      expect(result[0].revenue).toBe(1000)
    })

    it('should calculate profit margin correctly', () => {
      const invoices = [
        {
          issueDate: new Date('2025-01-15'),
          status: 'PAID',
          total: 1000,
        },
      ]

      const costs = [
        {
          date: new Date('2025-01-05'),
          amount: 400,
        },
      ]

      const result = calculateMonthlyRevenue(invoices, costs)

      expect(result[0].profitMargin).toBe(60) // (1000 - 400) / 1000 * 100 = 60%
    })
  })

  describe('calculateClientProfitability', () => {
    it('should calculate profitability per client', () => {
      const clients = [
        { id: 'cli_1', name: 'Client A' },
        { id: 'cli_2', name: 'Client B' },
      ]

      const invoices = [
        {
          clientId: 'cli_1',
          status: 'PAID',
          total: 5000,
        },
        {
          clientId: 'cli_1',
          status: 'PAID',
          total: 3000,
        },
        {
          clientId: 'cli_2',
          status: 'PAID',
          total: 2000,
        },
      ]

      const costs = [
        {
          clientId: 'cli_1',
          amount: 4000,
        },
        {
          clientId: 'cli_2',
          amount: 1500,
        },
      ]

      const result = calculateClientProfitability(clients, invoices, costs)

      expect(result).toHaveLength(2)
      expect(result[0].clientId).toBe('cli_1')
      expect(result[0].revenue).toBe(8000)
      expect(result[0].cost).toBe(4000)
      expect(result[0].profit).toBe(4000)
      expect(result[0].invoiceCount).toBe(2)
    })

    it('should calculate profit margin', () => {
      const clients = [{ id: 'cli_1', name: 'Client A' }]
      const invoices = [
        {
          clientId: 'cli_1',
          status: 'PAID',
          total: 1000,
        },
      ]
      const costs = [
        {
          clientId: 'cli_1',
          amount: 600,
        },
      ]

      const result = calculateClientProfitability(clients, invoices, costs)

      expect(result[0].profitMargin).toBe(40)
    })

    it('should calculate average invoice value', () => {
      const clients = [{ id: 'cli_1', name: 'Client A' }]
      const invoices = [
        { clientId: 'cli_1', status: 'PAID', total: 1000 },
        { clientId: 'cli_1', status: 'PAID', total: 2000 },
      ]
      const costs: any[] = []

      const result = calculateClientProfitability(clients, invoices, costs)

      expect(result[0].avgInvoiceValue).toBe(1500)
    })

    it('should sort by profit descending', () => {
      const clients = [
        { id: 'cli_1', name: 'Client A' },
        { id: 'cli_2', name: 'Client B' },
      ]

      const invoices = [
        { clientId: 'cli_1', status: 'PAID', total: 1000 },
        { clientId: 'cli_2', status: 'PAID', total: 5000 },
      ]

      const costs = [
        { clientId: 'cli_1', amount: 900 },
        { clientId: 'cli_2', amount: 4000 },
      ]

      const result = calculateClientProfitability(clients, invoices, costs)

      expect(result[0].clientId).toBe('cli_2') // Higher profit first
    })
  })

  describe('calculateGrowthTrend', () => {
    it('should detect uptrend', () => {
      const result = calculateGrowthTrend(150, 100)

      expect(result.trend).toBe('up')
      expect(result.changePercent).toBe(50)
    })

    it('should detect downtrend', () => {
      const result = calculateGrowthTrend(80, 100)

      expect(result.trend).toBe('down')
      expect(result.changePercent).toBe(-20)
    })

    it('should detect stable trend', () => {
      const result = calculateGrowthTrend(101, 100)

      expect(result.trend).toBe('stable')
      expect(result.changePercent).toBe(1)
    })

    it('should handle zero previous value', () => {
      const result = calculateGrowthTrend(100, 0)

      expect(result.trend).toBe('up')
      expect(result.changePercent).toBe(100)
    })
  })

  describe('calculateAnalyticsSummary', () => {
    it('should calculate summary correctly', () => {
      const revenue: RevenueData[] = [
        {
          month: '2025-01',
          revenue: 10000,
          cost: 6000,
          profit: 4000,
          profitMargin: 40,
        },
        {
          month: '2025-02',
          revenue: 12000,
          cost: 7000,
          profit: 5000,
          profitMargin: 41.67,
        },
      ]

      const profitability: ClientProfitability[] = [
        {
          clientId: 'cli_1',
          clientName: 'Client A',
          revenue: 10000,
          cost: 5000,
          profit: 5000,
          profitMargin: 50,
          invoiceCount: 5,
          avgInvoiceValue: 2000,
        },
        {
          clientId: 'cli_2',
          clientName: 'Client B',
          revenue: 12000,
          cost: 8000,
          profit: 4000,
          profitMargin: 33.33,
          invoiceCount: 6,
          avgInvoiceValue: 2000,
        },
      ]

      const result = calculateAnalyticsSummary(revenue, profitability)

      expect(result.totalRevenue).toBe(22000)
      expect(result.totalCost).toBe(13000)
      expect(result.totalProfit).toBe(9000)
      expect(result.avgProfitMargin).toBeCloseTo(40.84, 1)
      expect(result.topClientByRevenue.name).toBe('Client B')
      expect(result.topClientByProfit.name).toBe('Client A')
    })
  })

  describe('formatCurrency', () => {
    it('should format as Brazilian real', () => {
      const result = formatCurrency(1000)

      expect(result).toContain('R$')
      expect(result).toContain('1.000')
    })

    it('should handle decimals', () => {
      const result = formatCurrency(1234.56)

      expect(result).toContain('1.234,56')
    })

    it('should handle zero', () => {
      const result = formatCurrency(0)

      expect(result).toContain('R$')
      expect(result).toContain('0')
    })
  })

  describe('formatPercent', () => {
    it('should format as percentage', () => {
      const result = formatPercent(50)

      expect(result).toBe('50.0%')
    })

    it('should handle decimals', () => {
      const result = formatPercent(33.333, 2)

      expect(result).toBe('33.33%')
    })

    it('should handle negative', () => {
      const result = formatPercent(-12.5)

      expect(result).toBe('-12.5%')
    })
  })

  describe('generateMockAnalyticsData', () => {
    it('should generate mock data with correct structure', () => {
      const data = generateMockAnalyticsData()

      expect(data.revenue).toHaveLength(5)
      expect(data.profitability).toHaveLength(3)
      expect(data.summary).toBeDefined()
      expect(data.summary.totalRevenue).toBeGreaterThan(0)
    })

    it('should have valid revenue data points', () => {
      const data = generateMockAnalyticsData()

      for (const item of data.revenue) {
        expect(item.profit).toBe(item.revenue - item.cost)
        expect(item.profitMargin).toBeGreaterThan(0)
      }
    })
  })
})
