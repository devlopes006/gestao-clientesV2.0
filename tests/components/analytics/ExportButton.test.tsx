import { ExportButton } from '@/components/analytics/ExportButton'
import type { ClientProfitability, RevenueData } from '@/lib/analytics/calculations'
import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

// Mock lucide-react
vi.mock('lucide-react', () => ({
  FileDown: ({ className }: any) => <span data-testid="file-down-icon" className={className} />,
}))

const mockRevenueData: RevenueData[] = [
  {
    month: '2025-01',
    revenue: 10000,
    cost: 6000,
    profit: 4000,
    profitMargin: 40,
  },
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
]

const mockData = {
  revenue: mockRevenueData,
  profitability: mockProfitabilityData,
  summary: {
    totalRevenue: 10000,
    totalCost: 5000,
    totalProfit: 5000,
    avgProfitMargin: 50,
    revenueGrowth: {
      trend: 'up' as const,
      changePercent: 10,
    },
    profitGrowth: {
      trend: 'up' as const,
      changePercent: 15,
    },
    topClientByRevenue: mockProfitabilityData[0],
    topClientByProfit: mockProfitabilityData[0],
    bottomClientByProfit: mockProfitabilityData[0],
  },
}

describe('ExportButton', () => {
  it('should render export button', () => {
    render(<ExportButton data={mockData} />)

    expect(screen.getByRole('button')).toBeInTheDocument()
  })

  it('should have default CSV format', () => {
    render(<ExportButton data={mockData} />)

    const button = screen.getByRole('button')
    expect(button).toBeInTheDocument()
  })

  it('should render with custom filename', () => {
    render(<ExportButton data={mockData} filename="custom-export" />)

    expect(screen.getByRole('button')).toBeInTheDocument()
  })

  it('should render with custom className', () => {
    const { container } = render(
      <ExportButton data={mockData} className="custom-class" />
    )

    const button = container.querySelector('button')
    expect(button).toHaveClass('custom-class')
  })

  it('should support JSON format', () => {
    render(<ExportButton data={mockData} format="json" />)

    expect(screen.getByRole('button')).toBeInTheDocument()
  })
})
