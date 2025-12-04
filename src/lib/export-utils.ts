/**
 * Utilitários para exportação de dados financeiros
 */

export interface ExportData {
  headers: string[]
  rows: (string | number)[][]
  filename: string
}

/**
 * Converte dados para CSV
 */
export function convertToCSV(data: ExportData): string {
  const { headers, rows } = data

  const csvRows = [
    headers.join(','),
    ...rows.map((row) =>
      row
        .map((cell) => {
          // Escapar vírgulas e aspas
          const cellStr = String(cell)
          if (
            cellStr.includes(',') ||
            cellStr.includes('"') ||
            cellStr.includes('\n')
          ) {
            return `"${cellStr.replace(/"/g, '""')}"`
          }
          return cellStr
        })
        .join(',')
    ),
  ]

  return csvRows.join('\n')
}

/**
 * Faz download de um arquivo CSV
 */
export function downloadCSV(data: ExportData): void {
  const csv = convertToCSV(data)
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)

  link.setAttribute('href', url)
  link.setAttribute('download', `${data.filename}.csv`)
  link.style.visibility = 'hidden'

  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

/**
 * Exporta transações para CSV
 */
export type TransactionExport = {
  date: string | number | Date
  type: 'INCOME' | 'EXPENSE'
  subtype?: string | null
  description?: string | null
  category?: string | null
  clientName?: string | null
  amount: number
  status: string
}

export function exportTransactions(transactions: TransactionExport[]): void {
  const data: ExportData = {
    filename: `transacoes-${new Date().toISOString().split('T')[0]}`,
    headers: [
      'Data',
      'Tipo',
      'Subtipo',
      'Descrição',
      'Categoria',
      'Cliente',
      'Valor',
      'Status',
    ],
    rows: transactions.map((t) => [
      new Date(t.date).toLocaleDateString('pt-BR'),
      t.type === 'INCOME' ? 'Receita' : 'Despesa',
      t.subtype?.replace(/_/g, ' ') || '-',
      t.description || '-',
      t.category || '-',
      t.clientName || '-',
      t.amount.toFixed(2),
      t.status,
    ]),
  }

  downloadCSV(data)
}

/**
 * Exporta faturas para CSV
 */
export type InvoiceExport = {
  number: string
  clientName?: string | null
  createdAt: string | number | Date
  dueDate: string | number | Date
  totalAmount: number
  status: string
  paidAt?: string | number | Date | null
}

export function exportInvoices(invoices: InvoiceExport[]): void {
  const data: ExportData = {
    filename: `faturas-${new Date().toISOString().split('T')[0]}`,
    headers: [
      'Número',
      'Cliente',
      'Data Emissão',
      'Vencimento',
      'Valor Total',
      'Status',
      'Pago em',
    ],
    rows: invoices.map((inv) => [
      inv.number,
      inv.clientName || '-',
      new Date(inv.createdAt).toLocaleDateString('pt-BR'),
      new Date(inv.dueDate).toLocaleDateString('pt-BR'),
      inv.totalAmount.toFixed(2),
      inv.status,
      inv.paidAt ? new Date(inv.paidAt).toLocaleDateString('pt-BR') : '-',
    ]),
  }

  downloadCSV(data)
}

/**
 * Exporta relatório do dashboard
 */
export type DashboardExport = {
  financial: {
    totalIncome: number
    totalExpense: number
    netProfit: number
    profitMargin: number
    pendingIncome: number
    pendingExpense: number
  }
  invoices: {
    open: { count: number; total: number }
    paid: { count: number; total: number }
    overdue: { count: number; total: number }
    cancelled: { count: number }
    totalReceivable: number
  }
  topClients: {
    byRevenue: Array<{ clientName: string; totalRevenue: number }>
  }
}

export function exportDashboard(
  data: DashboardExport,
  period: { year: number; month: number }
): void {
  const exportData: ExportData = {
    filename: `dashboard-${period.year}-${String(period.month).padStart(2, '0')}`,
    headers: ['Métrica', 'Valor'],
    rows: [
      ['Período', `${String(period.month).padStart(2, '0')}/${period.year}`],
      [''],
      ['--- FINANCEIRO ---'],
      ['Total de Receitas', data.financial.totalIncome.toFixed(2)],
      ['Total de Despesas', data.financial.totalExpense.toFixed(2)],
      ['Lucro Líquido', data.financial.netProfit.toFixed(2)],
      ['Margem de Lucro', `${data.financial.profitMargin.toFixed(2)}%`],
      ['Receita Pendente', data.financial.pendingIncome.toFixed(2)],
      ['Despesa Pendente', data.financial.pendingExpense.toFixed(2)],
      [''],
      ['--- FATURAS ---'],
      ['Faturas em Aberto', data.invoices.open.count],
      ['Valor em Aberto', data.invoices.open.total.toFixed(2)],
      ['Faturas Pagas', data.invoices.paid.count],
      ['Valor Pago', data.invoices.paid.total.toFixed(2)],
      ['Faturas Vencidas', data.invoices.overdue.count],
      ['Valor Vencido', data.invoices.overdue.total.toFixed(2)],
      ['Faturas Canceladas', data.invoices.cancelled.count],
      ['Total a Receber', data.invoices.totalReceivable.toFixed(2)],
      [''],
      ['--- TOP CLIENTES ---'],
      ...data.topClients.byRevenue
        .slice(0, 5)
        .map((c, i: number) => [
          `${i + 1}. ${c.clientName}`,
          c.totalRevenue.toFixed(2),
        ]),
    ],
  }

  downloadCSV(exportData)
}
