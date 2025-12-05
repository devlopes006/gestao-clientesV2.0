import { FinancialAutomationService } from '@/domain/automation/FinancialAutomationService'
import { prisma } from '@/lib/prisma'
import { InvoiceStatus } from '@prisma/client'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    client: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
    },
    invoice: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      updateMany: vi.fn(),
    },
  },
}))

vi.mock('@/services/financial/InvoiceService', () => ({
  InvoiceService: {
    create: vi.fn(),
  },
}))

describe('FinancialAutomationService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('generateSmartMonthlyInvoices', () => {
    it('should skip clients with ended contracts', async () => {
      const pastDate = new Date('2024-01-01')
      const mockClient = {
        id: 'client-1',
        name: 'Client A',
        contractValue: 1000,
        contractEnd: pastDate,
        status: 'active',
      }

      vi.mocked(prisma.client.findMany).mockResolvedValue([mockClient] as any)

      const result =
        await FinancialAutomationService.generateSmartMonthlyInvoices('org-1')

      expect(result.blocked).toHaveLength(1)
      expect(result.blocked[0].type).toBe('CONTRACT_ENDED')
      expect(result.success).toHaveLength(0)
    })

    it('should skip clients with future contract start', async () => {
      const futureDate = new Date('2026-01-01')
      const mockClient = {
        id: 'client-1',
        name: 'Client A',
        contractValue: 1000,
        contractStart: futureDate,
        status: 'active',
      }

      vi.mocked(prisma.client.findMany).mockResolvedValue([mockClient] as any)

      const result =
        await FinancialAutomationService.generateSmartMonthlyInvoices('org-1')

      expect(result.blocked).toHaveLength(1)
      expect(result.blocked[0].type).toBe('CONTRACT_NOT_STARTED')
    })

    it('should generate regular invoice when no existing invoice', async () => {
      const mockClient = {
        id: 'client-1',
        name: 'Client A',
        contractValue: 1000,
        status: 'active',
        plan: 'Premium',
        paymentDay: 10,
        isInstallment: false,
      }

      const mockInvoice = {
        id: 'inv-1',
        number: 'INV-001',
        total: 1000,
        dueDate: new Date(),
      }

      vi.mocked(prisma.client.findMany).mockResolvedValue([mockClient] as any)
      vi.mocked(prisma.invoice.findFirst).mockResolvedValue(null)

      const { InvoiceService } = await import(
        '@/services/financial/InvoiceService'
      )
      vi.mocked(InvoiceService.create).mockResolvedValue(mockInvoice as any)

      const result =
        await FinancialAutomationService.generateSmartMonthlyInvoices('org-1')

      expect(result.success).toHaveLength(1)
      expect(result.summary.regular).toBe(1)
      expect(InvoiceService.create).toHaveBeenCalled()
    })

    it('should skip if invoice already exists for the month', async () => {
      const mockClient = {
        id: 'client-1',
        name: 'Client A',
        contractValue: 1000,
        status: 'active',
        isInstallment: false,
      }

      vi.mocked(prisma.client.findMany).mockResolvedValue([mockClient] as any)
      vi.mocked(prisma.invoice.findFirst).mockResolvedValue({
        id: 'existing-inv',
      } as any)

      const result =
        await FinancialAutomationService.generateSmartMonthlyInvoices('org-1')

      expect(result.blocked).toHaveLength(1)
      expect(result.blocked[0].type).toBe('MONTHLY_ALREADY_GENERATED')
    })
  })

  describe('updateOverdueInvoices', () => {
    it('should update open invoices past due date to overdue', async () => {
      vi.mocked(prisma.invoice.updateMany).mockResolvedValue({
        count: 3,
      } as any)

      const result =
        await FinancialAutomationService.updateOverdueInvoices('org-1')

      expect(result).toBe(3)
      expect(prisma.invoice.updateMany).toHaveBeenCalledWith({
        where: {
          orgId: 'org-1',
          status: InvoiceStatus.OPEN,
          dueDate: expect.any(Object),
          deletedAt: null,
        },
        data: {
          status: InvoiceStatus.OVERDUE,
        },
      })
    })

    it('should return 0 when no invoices need update', async () => {
      vi.mocked(prisma.invoice.updateMany).mockResolvedValue({
        count: 0,
      } as any)

      const result =
        await FinancialAutomationService.updateOverdueInvoices('org-1')

      expect(result).toBe(0)
    })
  })

  describe('syncClientFinancialData', () => {
    it('should set status to OVERDUE when client has overdue invoices', async () => {
      const mockClient = {
        id: 'client-1',
        orgId: 'org-1',
        invoices: [
          { id: 'inv-1', status: InvoiceStatus.OVERDUE },
          { id: 'inv-2', status: InvoiceStatus.OPEN },
        ],
      }

      vi.mocked(prisma.client.findFirst).mockResolvedValue(mockClient as any)
      vi.mocked(prisma.client.update).mockResolvedValue({} as any)

      await FinancialAutomationService.syncClientFinancialData(
        'client-1',
        'org-1'
      )

      expect(prisma.client.update).toHaveBeenCalledWith({
        where: { id: 'client-1' },
        data: { paymentStatus: 'OVERDUE' },
      })
    })

    it('should set status to PENDING when client has open invoices', async () => {
      const mockClient = {
        id: 'client-1',
        orgId: 'org-1',
        invoices: [{ id: 'inv-1', status: InvoiceStatus.OPEN }],
      }

      vi.mocked(prisma.client.findFirst).mockResolvedValue(mockClient as any)
      vi.mocked(prisma.client.update).mockResolvedValue({} as any)

      await FinancialAutomationService.syncClientFinancialData(
        'client-1',
        'org-1'
      )

      expect(prisma.client.update).toHaveBeenCalledWith({
        where: { id: 'client-1' },
        data: { paymentStatus: 'PENDING' },
      })
    })

    it('should set status to PAID when no open or overdue invoices', async () => {
      const mockClient = {
        id: 'client-1',
        orgId: 'org-1',
        invoices: [],
      }

      vi.mocked(prisma.client.findFirst).mockResolvedValue(mockClient as any)
      vi.mocked(prisma.client.update).mockResolvedValue({} as any)

      await FinancialAutomationService.syncClientFinancialData(
        'client-1',
        'org-1'
      )

      expect(prisma.client.update).toHaveBeenCalledWith({
        where: { id: 'client-1' },
        data: { paymentStatus: 'PAID' },
      })
    })

    it('should handle client not found gracefully', async () => {
      vi.mocked(prisma.client.findFirst).mockResolvedValue(null)

      await expect(
        FinancialAutomationService.syncClientFinancialData(
          'nonexistent',
          'org-1'
        )
      ).resolves.toBeUndefined()

      expect(prisma.client.update).not.toHaveBeenCalled()
    })
  })
})
