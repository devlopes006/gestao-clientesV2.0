import { prisma } from '@/lib/prisma'
import {
  InvoiceStatus,
  TransactionStatus,
  TransactionType,
} from '@prisma/client'
import { InvoiceService } from './InvoiceService'

interface InstallmentPlan {
  installmentNumber: number
  dueDate: Date
  amount: number
  description: string
}

export class FinancialAutomationService {
  /**
   * Gera faturas mensais inteligentes
   * - Suporta pagamento parcelado
   * - Suporta pagamento integral
   * - Respeita status do cliente
   * - Sincroniza com dados cadastrais
   */
  static async generateSmartMonthlyInvoices(
    orgId: string,
    createdBy?: string
  ): Promise<{
    success: Array<{
      id: string
      number: string | null
      client?: { name?: string | null } | null
      total: number
      dueDate: Date
      installmentInfo?: {
        current: number
        total: number
        remaining: number
      }
    }>
    blocked: Array<{
      clientId: string
      clientName: string
      reason: string
      type:
        | 'CONTRACT_ENDED'
        | 'CONTRACT_NOT_STARTED'
        | 'ALL_INSTALLMENTS_GENERATED'
        | 'MONTHLY_ALREADY_GENERATED'
    }>
    errors: Array<{
      clientId: string
      clientName: string
      error: string
      type: 'GENERATION_ERROR'
    }>
    summary: {
      total: number
      generated: number
      blocked: number
      errors: number
      totalAmount: number
      installments: number
      regular: number
    }
  }> {
    const results: {
      success: Array<{
        id: string
        number: string | null
        client?: { name?: string | null } | null
        total: number
        dueDate: Date
        installmentInfo?: {
          current: number
          total: number
          remaining: number
        }
      }>
      blocked: Array<{
        clientId: string
        clientName: string
        reason: string
        type:
          | 'CONTRACT_ENDED'
          | 'CONTRACT_NOT_STARTED'
          | 'ALL_INSTALLMENTS_GENERATED'
          | 'MONTHLY_ALREADY_GENERATED'
      }>
      errors: Array<{
        clientId: string
        clientName: string
        error: string
        type: 'GENERATION_ERROR'
      }>
    } = {
      success: [],
      blocked: [],
      errors: [],
    }

    // Buscar clientes com contrato (exclui apenas encerrados)
    const clients = await prisma.client.findMany({
      where: {
        orgId,
        contractValue: { gt: 0 },
        status: { not: 'closed' },
      },
      orderBy: { name: 'asc' },
    })

    const now = new Date()
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)

    let installmentsGenerated = 0
    let regularInvoicesGenerated = 0
    let totalAmount = 0

    for (const client of clients) {
      try {
        // Validar contrato ativo
        if (client.contractEnd && client.contractEnd < now) {
          results.blocked.push({
            clientId: client.id,
            clientName: client.name,
            reason: 'Contrato encerrado',
            type: 'CONTRACT_ENDED',
          })
          continue
        }

        if (client.contractStart && client.contractStart > now) {
          results.blocked.push({
            clientId: client.id,
            clientName: client.name,
            reason: 'Contrato ainda não iniciado',
            type: 'CONTRACT_NOT_STARTED',
          })
          continue
        }

        // CLIENTE COM PAGAMENTO PARCELADO
        if (
          client.isInstallment &&
          client.installmentCount &&
          client.installmentValue
        ) {
          const installmentResults = await this.generateInstallmentInvoices(
            client,
            orgId,
            now,
            createdBy
          )

          if (installmentResults.blocked) {
            results.blocked.push(installmentResults.blocked)
          } else if (installmentResults.invoices.length > 0) {
            installmentsGenerated += installmentResults.invoices.length
            totalAmount += installmentResults.invoices.reduce(
              (sum, inv) => sum + inv.total,
              0
            )
            results.success.push(...installmentResults.invoices)
          }
        }
        // CLIENTE COM PAGAMENTO MENSAL INTEGRAL
        else {
          const regularResult = await this.generateRegularInvoice(
            client,
            orgId,
            now,
            firstDayOfMonth,
            lastDayOfMonth,
            createdBy
          )

          if (regularResult.blocked) {
            results.blocked.push(regularResult.blocked)
          } else if (regularResult.invoice) {
            regularInvoicesGenerated++
            totalAmount += regularResult.invoice.total
            results.success.push(regularResult.invoice)
          }
        }
      } catch (error) {
        results.errors.push({
          clientId: client.id,
          clientName: client.name,
          error: error instanceof Error ? error.message : 'Erro desconhecido',
          type: 'GENERATION_ERROR',
        })
      }
    }

    return {
      success: results.success,
      blocked: results.blocked,
      errors: results.errors,
      summary: {
        total: clients.length,
        generated: results.success.length,
        blocked: results.blocked.length,
        errors: results.errors.length,
        totalAmount,
        installments: installmentsGenerated,
        regular: regularInvoicesGenerated,
      },
    }
  }

  /**
   * Gera faturas parceladas para um cliente
   */
  private static async generateInstallmentInvoices(
    client: {
      id: string
      name: string
      installmentCount: number
      installmentValue: number
      installmentPaymentDays?: number[] | null
      paymentDay?: number | null
      plan?: string | null
    },
    orgId: string,
    now: Date,
    createdBy?: string
  ): Promise<{
    invoices: Array<{
      id: string
      number: string | null
      total: number
      dueDate: Date
      installmentInfo: { current: number; total: number; remaining: number }
    }>
    blocked?: {
      clientId: string
      clientName: string
      reason: string
      type: 'ALL_INSTALLMENTS_GENERATED'
    }
  }> {
    // Buscar parcelas já geradas
    const existingInvoices = await prisma.invoice.findMany({
      where: {
        clientId: client.id,
        orgId,
        deletedAt: null,
        notes: {
          contains: 'Parcela',
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    })

    const totalGenerated = existingInvoices.length

    // Verificar se todas as parcelas já foram geradas
    if (totalGenerated >= client.installmentCount) {
      return {
        invoices: [],
        blocked: {
          clientId: client.id,
          clientName: client.name,
          reason: `Todas as ${client.installmentCount} parcelas já foram geradas`,
          type: 'ALL_INSTALLMENTS_GENERATED',
        },
      }
    }

    // Calcular quantas parcelas faltam
    const remainingInstallments = client.installmentCount - totalGenerated

    // Determinar dias de vencimento
    const paymentDays =
      client.installmentPaymentDays && client.installmentPaymentDays.length > 0
        ? client.installmentPaymentDays
        : [client.paymentDay || 10]

    // Gerar plano de parcelas
    const installmentPlan = this.createInstallmentPlan(
      totalGenerated + 1,
      remainingInstallments,
      client.installmentValue,
      paymentDays,
      now,
      client.plan || 'Serviços'
    )

    const invoices: Array<{
      id: string
      number: string | null
      total: number
      dueDate: Date
      installmentInfo: { current: number; total: number; remaining: number }
    }> = []

    // Gerar apenas parcelas deste mês (ou próximas)
    for (const plan of installmentPlan.slice(
      0,
      Math.min(2, remainingInstallments)
    )) {
      // Verificar se já existe fatura para esta data
      const existing = await prisma.invoice.findFirst({
        where: {
          clientId: client.id,
          orgId,
          dueDate: plan.dueDate,
          deletedAt: null,
        },
      })

      if (existing) continue

      const invoice = await InvoiceService.create({
        clientId: client.id,
        orgId,
        dueDate: plan.dueDate,
        items: [
          {
            description: plan.description,
            quantity: 1,
            unitAmount: plan.amount,
          },
        ],
        notes: `Parcela ${plan.installmentNumber} de ${client.installmentCount}`,
        createdBy,
      })

      invoices.push({
        ...invoice,
        installmentInfo: {
          current: plan.installmentNumber,
          total: client.installmentCount,
          remaining: client.installmentCount - plan.installmentNumber,
        },
      })
    }

    return { invoices }
  }

  /**
   * Cria plano de parcelas
   */
  private static createInstallmentPlan(
    startNumber: number,
    count: number,
    amount: number,
    paymentDays: number[],
    startDate: Date,
    planName: string
  ): InstallmentPlan[] {
    const plan: InstallmentPlan[] = []
    const currentDate = new Date(startDate)

    for (let i = 0; i < count; i++) {
      const installmentNumber = startNumber + i
      const dayIndex = i % paymentDays.length
      const paymentDay = paymentDays[dayIndex]

      // Calcular data de vencimento (clamp ao último dia do mês alvo)
      const targetMonth =
        currentDate.getMonth() + Math.floor(i / paymentDays.length)
      const lastDayTargetMonth = new Date(
        currentDate.getFullYear(),
        targetMonth + 1,
        0
      ).getDate()
      const effectiveDay = Math.min(paymentDay, lastDayTargetMonth)
      const dueDate = new Date(
        currentDate.getFullYear(),
        targetMonth,
        effectiveDay
      )

      // Se a data já passou, usar próximo mês
      if (dueDate < startDate) {
        dueDate.setMonth(dueDate.getMonth() + 1)
      }

      plan.push({
        installmentNumber,
        dueDate,
        amount,
        description: `Parcela ${installmentNumber} - ${planName} - ${dueDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}`,
      })
    }

    return plan
  }

  /**
   * Gera fatura mensal regular
   */
  private static async generateRegularInvoice(
    client: {
      id: string
      name: string
      contractValue: number | null
      paymentDay?: number | null
      plan?: string | null
    },
    orgId: string,
    now: Date,
    firstDayOfMonth: Date,
    lastDayOfMonth: Date,
    createdBy?: string
  ): Promise<{
    invoice?: {
      id: string
      number: string | null
      total: number
      dueDate: Date
    }
    blocked?: {
      clientId: string
      clientName: string
      reason: string
      type: 'MONTHLY_ALREADY_GENERATED'
    }
  }> {
    // Verificar se já existe fatura com vencimento neste mês
    // Importante: não usar createdAt aqui, pois faturas de meses anteriores
    // criadas no mês atual não devem bloquear a geração do mês corrente.
    const existingInvoice = await prisma.invoice.findFirst({
      where: {
        clientId: client.id,
        orgId,
        dueDate: {
          gte: firstDayOfMonth,
          lte: lastDayOfMonth,
        },
        deletedAt: null,
      },
    })

    if (existingInvoice) {
      return {
        blocked: {
          clientId: client.id,
          clientName: client.name,
          reason: 'Fatura já gerada neste mês',
          type: 'MONTHLY_ALREADY_GENERATED',
        },
      }
    }

    // Calcular data de vencimento (respeitando último dia do mês)
    const paymentDay = client.paymentDay || 10
    const lastDay = lastDayOfMonth.getDate()
    const effectiveDay = Math.min(paymentDay, lastDay)
    const dueDate = new Date(now.getFullYear(), now.getMonth(), effectiveDay)

    // Se o dia de pagamento já passou, usar próximo mês
    if (dueDate < now) {
      dueDate.setMonth(dueDate.getMonth() + 1)
    }

    // Gerar fatura
    const invoice = await InvoiceService.create({
      clientId: client.id,
      orgId,
      dueDate,
      items: [
        {
          description: `${client.plan || 'Serviços de gestão'} - ${now.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}`,
          quantity: 1,
          unitAmount: client.contractValue!,
        },
      ],
      notes: 'Fatura mensal',
      createdBy,
    })

    return { invoice }
  }

  /**
   * Atualiza status de faturas vencidas automaticamente
   */
  static async updateOverdueInvoices(orgId: string): Promise<number> {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const result = await prisma.invoice.updateMany({
      where: {
        orgId,
        status: InvoiceStatus.OPEN,
        dueDate: {
          lt: today,
        },
        deletedAt: null,
      },
      data: {
        status: InvoiceStatus.OVERDUE,
      },
    })

    return result.count
  }

  /**
   * Sincroniza dados financeiros com cadastro de clientes
   */
  static async syncClientFinancialData(
    clientId: string,
    orgId: string
  ): Promise<void> {
    const client = await prisma.client.findFirst({
      where: { id: clientId, orgId },
      include: {
        invoices: {
          where: {
            deletedAt: null,
            status: {
              in: [InvoiceStatus.OPEN, InvoiceStatus.OVERDUE],
            },
          },
        },
      },
    })

    if (!client) return

    // Atualizar status de pagamento do cliente
    const hasOverdue = client.invoices.some(
      (inv) => inv.status === InvoiceStatus.OVERDUE
    )
    const hasOpen = client.invoices.some(
      (inv) => inv.status === InvoiceStatus.OPEN
    )

    let paymentStatus = 'PAID'
    if (hasOverdue) paymentStatus = 'OVERDUE'
    else if (hasOpen) paymentStatus = 'PENDING'

    await prisma.client.update({
      where: { id: clientId },
      data: {
        paymentStatus: paymentStatus as 'PAID' | 'OVERDUE' | 'PENDING',
      },
    })
  }

  /**
   * Calcula projeção financeira
   */
  static async calculateProjection(
    orgId: string,
    months: number = 3
  ): Promise<{
    projections: Array<{
      month: string
      expectedRevenue: number
      confirmedRevenue: number
      clients: number
    }>
  }> {
    const clients = await prisma.client.findMany({
      where: {
        orgId,
        status: 'active',
        contractValue: { gt: 0 },
      },
    })

    const projections: Array<{
      month: string
      expectedRevenue: number
      confirmedRevenue: number
      clients: number
    }> = []
    const now = new Date()

    for (let i = 0; i < months; i++) {
      const targetMonth = new Date(now.getFullYear(), now.getMonth() + i, 1)
      const monthName = targetMonth.toLocaleDateString('pt-BR', {
        month: 'long',
        year: 'numeric',
      })

      let expectedRevenue = 0
      let activeClients = 0

      for (const client of clients) {
        // Verificar se contrato está ativo no mês
        const contractStart = client.contractStart || new Date(0)
        const contractEnd = client.contractEnd || new Date(9999, 11, 31)

        if (targetMonth >= contractStart && targetMonth <= contractEnd) {
          activeClients++
          expectedRevenue +=
            client.isInstallment && client.installmentValue
              ? client.installmentValue
              : client.contractValue || 0
        }
      }

      // Buscar receita já confirmada
      const firstDay = new Date(
        targetMonth.getFullYear(),
        targetMonth.getMonth(),
        1
      )
      const lastDay = new Date(
        targetMonth.getFullYear(),
        targetMonth.getMonth() + 1,
        0
      )

      const confirmedTransactions = await prisma.transaction.aggregate({
        where: {
          orgId,
          type: TransactionType.INCOME,
          status: TransactionStatus.CONFIRMED,
          date: {
            gte: firstDay,
            lte: lastDay,
          },
        },
        _sum: {
          amount: true,
        },
      })

      projections.push({
        month: monthName,
        expectedRevenue,
        confirmedRevenue: confirmedTransactions._sum.amount || 0,
        clients: activeClients,
      })
    }

    return { projections }
  }
}
