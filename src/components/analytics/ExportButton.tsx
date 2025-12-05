'use client'

import { Button } from '@/components/ui/button'
import type { AnalyticsSummary, ClientProfitability, RevenueData } from '@/lib/analytics/calculations'
import { FileDown, Loader2 } from 'lucide-react'
import { useState } from 'react'

export interface ExportButtonProps {
  data: {
    revenue: RevenueData[]
    profitability: ClientProfitability[]
    summary: AnalyticsSummary
  }
  format?: 'csv' | 'json'
  filename?: string
  className?: string
}

/**
 * ExportButton Component
 *
 * Permite exportar dados de analytics em CSV ou JSON
 *
 * @example
 * ```tsx
 * <ExportButton
 *   data={analyticsData}
 *   format="csv"
 *   filename="relatorio-dezembro-2025"
 * />
 * ```
 */
export function ExportButton({
  data,
  format = 'csv',
  filename = `analytics-${new Date().toISOString().slice(0, 10)}`,
  className,
}: ExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false)

  const handleExport = async () => {
    setIsExporting(true)

    try {
      let content: string
      let mimeType: string
      let fileExtension: string

      if (format === 'json') {
        content = JSON.stringify(data, null, 2)
        mimeType = 'application/json'
        fileExtension = 'json'
      } else {
        // CSV format
        content = generateCSV(data)
        mimeType = 'text/csv;charset=utf-8;'
        fileExtension = 'csv'
      }

      // Create blob and download
      const blob = new Blob([content], { type: mimeType })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)

      link.setAttribute('href', url)
      link.setAttribute('download', `${filename}.${fileExtension}`)
      link.style.visibility = 'hidden'

      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      // Cleanup
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Export failed:', error)
      alert('Erro ao exportar dados')
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <Button
      onClick={handleExport}
      disabled={isExporting}
      variant="secondary"
      size="sm"
      className={className}
    >
      {isExporting ? (
        <>
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          Exportando...
        </>
      ) : (
        <>
          <FileDown className="h-4 w-4 mr-2" />
          Exportar {format.toUpperCase()}
        </>
      )}
    </Button>
  )
}

/**
 * Gerar CSV a partir dos dados de analytics
 */
function generateCSV(data: {
  revenue: RevenueData[]
  profitability: ClientProfitability[]
  summary: AnalyticsSummary
}): string {
  const lines: string[] = []

  // Header do sumário
  lines.push('=== SUMÁRIO DE ANALYTICS ===')
  lines.push('')
  lines.push('Métrica,Valor')
  lines.push(`Receita Total,"R$ ${(data.summary.totalRevenue / 100).toFixed(2)}"`)
  lines.push(`Custo Total,"R$ ${(data.summary.totalCost / 100).toFixed(2)}"`)
  lines.push(`Lucro Total,"R$ ${(data.summary.totalProfit / 100).toFixed(2)}"`)
  lines.push(`Margem Média,${data.summary.avgProfitMargin.toFixed(2)}%`)
  lines.push(`Crescimento Receita,${data.summary.revenueGrowth.toFixed(2)}%`)
  lines.push(`Crescimento Custo,${data.summary.costGrowth.toFixed(2)}%`)
  lines.push(`Crescimento Lucro,${data.summary.profitGrowth.toFixed(2)}%`)
  lines.push('')

  // Dados de receita mensal
  lines.push('=== RECEITA MENSAL ===')
  lines.push('')
  lines.push('Mês,Receita,Custo,Lucro,Margem (%)')
  for (const item of data.revenue) {
    lines.push(
      `${item.month},"R$ ${(item.revenue / 100).toFixed(2)}","R$ ${(item.cost / 100).toFixed(2)}","R$ ${(item.profit / 100).toFixed(2)}",${item.profitMargin.toFixed(2)}`
    )
  }
  lines.push('')

  // Dados de lucratividade por cliente
  lines.push('=== LUCRATIVIDADE POR CLIENTE ===')
  lines.push('')
  lines.push('Cliente,Receita,Custo,Lucro,Margem (%),Faturas,Ticket Médio')
  for (const item of data.profitability) {
    lines.push(
      `"${item.clientName}","R$ ${(item.revenue / 100).toFixed(2)}","R$ ${(item.cost / 100).toFixed(2)}","R$ ${(item.profit / 100).toFixed(2)}",${item.profitMargin.toFixed(2)},${item.invoiceCount},"R$ ${(item.avgInvoiceValue / 100).toFixed(2)}"`
    )
  }

  return lines.join('\n')
}
