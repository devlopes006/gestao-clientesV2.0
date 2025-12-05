import { render } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

// Mock next-themes
vi.mock('next-themes', () => ({
  useTheme: () => ({ theme: 'light', systemTheme: 'light' }),
}))

// Mock recharts
vi.mock('recharts', () => ({
  LineChart: ({ children }: any) => <div data-testid="line-chart">{children}</div>,
  AreaChart: ({ children }: any) => <div data-testid="area-chart">{children}</div>,
  BarChart: ({ children }: any) => <div data-testid="bar-chart">{children}</div>,
  XAxis: () => <div />,
  YAxis: () => <div />,
  CartesianGrid: () => <div />,
  Tooltip: () => <div />,
  Legend: () => <div />,
  Line: () => <div />,
  Area: () => <div />,
  Bar: () => <div />,
  ResponsiveContainer: ({ children }: any) => <div>{children}</div>,
}))

// Mock lucide-react
vi.mock('lucide-react', () => ({
  DollarSign: () => <div />,
  TrendingUp: () => <div />,
  Target: () => <div />,
  AlertCircle: () => <div />,
}))

// Import after mocks are set up
import {
  AnalyticsSummaryCards,
  ProfitabilityChart,
  ProfitabilityTable,
  RevenueChart,
} from '@/components/analytics/AnalyticsCharts'
import type { AnalyticsSummary, ClientProfitability, RevenueData } from '@/lib/analytics/calculations'

const mockRevenueData: RevenueData[] = [
  { month: '2025-01', revenue: 10000, cost: 6000, profit: 4000, profitMargin: 40 },
  { month: '2025-02', revenue: 12000, cost: 7000, profit: 5000, profitMargin: 41.67 },
]

const mockProfitabilityData: ClientProfitability[] = [
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
    revenue: 8000,
    cost: 6000,
    profit: 2000,
    profitMargin: 25,
    invoiceCount: 4,
    avgInvoiceValue: 2000,
  },
]

const mockSummary: AnalyticsSummary = {
  totalRevenue: 22000,
  totalCost: 13000,
  totalProfit: 9000,
  avgProfitMargin: 40.84,
  revenueGrowth: { trend: 'up', changePercent: 20 },
  profitGrowth: { trend: 'up', changePercent: 25 },
  topClientByRevenue: mockProfitabilityData[0],
  topClientByProfit: mockProfitabilityData[0],
  bottomClientByProfit: mockProfitabilityData[1],
}

describe('Analytics Components', () => {
  describe('RevenueChart', () => {
    it('should render', () => {
      const { container } = render(<RevenueChart data={mockRevenueData} />)
      expect(container).toBeInTheDocument()
    })
  })

  describe('ProfitabilityChart', () => {
    it('should render', () => {
      const { container } = render(<ProfitabilityChart data={mockProfitabilityData} />)
      expect(container).toBeInTheDocument()
    })
  })

  describe('AnalyticsSummaryCards', () => {
    it('should render', () => {
      const { container } = render(<AnalyticsSummaryCards summary={mockSummary} />)
      expect(container).toBeInTheDocument()
    })
  })

  describe('ProfitabilityTable', () => {
    it('should render', () => {
      const { container } = render(<ProfitabilityTable data={mockProfitabilityData} />)
      expect(container).toBeInTheDocument()
    })

    it('should have table element', () => {
      const { container } = render(<ProfitabilityTable data={mockProfitabilityData} />)
      const table = container.querySelector('table')
      expect(table).toBeTruthy()
    })
  })
})
