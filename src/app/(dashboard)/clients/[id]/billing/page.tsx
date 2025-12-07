'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useEffect, useState } from 'react'

interface Invoice {
  id: string
  number: string
  status: string
  issueDate: Date
  dueDate: Date
  total: number
}

export default function BillingPage() {
  const params = useParams()
  const clientId = typeof params?.id === 'string' ? params.id : Array.isArray(params?.id) ? params.id[0] : ''
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const id = clientId
    if (!id) return
      ; (async () => {
        try {
          const res = await fetch(`/api/clients/${id}/invoices`)
          if (res.ok) {
            const data = await res.json()
            if (Array.isArray(data)) {
              setInvoices(data as Invoice[])
            } else if (data && Array.isArray(data.data)) {
              setInvoices(data.data as Invoice[])
            } else {
              setInvoices([])
            }
          } else {
            setInvoices([])
          }
        } catch (error) {
          console.error('Erro ao carregar faturas:', error)
        } finally {
          setLoading(false)
        }
      })()
  }, [clientId])

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      PAID: 'bg-green-100 text-green-800',
      OVERDUE: 'bg-red-100 text-red-800',
      OPEN: 'bg-blue-100 text-blue-800',
      DRAFT: 'bg-gray-100 text-gray-800',
      CANCELLED: 'bg-gray-100 text-gray-500',
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      PAID: 'Paga',
      OVERDUE: 'Vencida',
      OPEN: 'Em Aberto',
      DRAFT: 'Rascunho',
      CANCELLED: 'Cancelada',
    }
    return labels[status] || status
  }

  if (loading) {
    return <div className="p-6 text-center">Carregando...</div>
  }

  return (
    <div className="space-y-3 sm:space-y-4 lg:space-y-6 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">Faturas do Cliente</h1>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 mt-1">ID: {clientId || '—'}</p>
        </div>
        <div className="flex gap-2 sm:gap-3 w-full sm:w-auto">
          <Link href={`/financeiro`} className="w-full sm:w-auto">
            <Button variant="outline" className="w-full sm:w-auto">Ver Sistema Financeiro</Button>
          </Link>
        </div>
      </div>

      {/* Invoices List */}
      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle>Faturas ({invoices.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0 sm:p-6">
          {invoices.length === 0 ? (
            <p className="text-center text-slate-600 py-8 px-4">Nenhuma fatura encontrada</p>
          ) : (
            <>
              {/* Mobile cards */}
              <div className="grid gap-3 sm:hidden px-3 pb-4">
                {invoices.map((invoice) => (
                  <div key={invoice.id} className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm p-4 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-xs text-muted-foreground">Número</div>
                      <Badge className={`${getStatusColor(invoice.status)} text-[10px] px-2 py-0.5`}>{getStatusLabel(invoice.status)}</Badge>
                    </div>
                    <div className="text-base font-semibold text-slate-900 dark:text-white truncate">{invoice.number}</div>
                    <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 dark:text-slate-300">
                      <div className="space-y-1">
                        <div className="font-medium text-slate-700 dark:text-slate-200">Emissão</div>
                        <div>{new Date(invoice.issueDate).toLocaleDateString('pt-BR')}</div>
                      </div>
                      <div className="space-y-1">
                        <div className="font-medium text-slate-700 dark:text-slate-200">Vencimento</div>
                        <div>{new Date(invoice.dueDate).toLocaleDateString('pt-BR')}</div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-2">
                      <div className="text-xs text-muted-foreground">Total</div>
                      <div className="text-base font-semibold text-slate-900 dark:text-white">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(invoice.total)}
                      </div>
                    </div>
                    <div className="pt-1">
                      <Link href={`/financeiro`} className="inline-flex w-full">
                        <Button variant="ghost" size="sm" className="w-full justify-center">Ver no financeiro</Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop table */}
              <div className="hidden sm:block overflow-x-auto -mx-2 sm:mx-0">
                <table className="w-full text-[10px] sm:text-xs lg:text-sm">
                  <thead className="border-b">
                    <tr>
                      <th className="text-left py-1 sm:py-1.5 px-1 sm:px-2 lg:px-3">Número</th>
                      <th className="text-left py-1 sm:py-1.5 px-1 sm:px-2 lg:px-3">Status</th>
                      <th className="text-left py-1 sm:py-1.5 px-1 sm:px-2 lg:px-3 hidden sm:table-cell">Emissão</th>
                      <th className="text-left py-1 sm:py-1.5 px-1 sm:px-2 lg:px-3 hidden sm:table-cell">Vencimento</th>
                      <th className="text-right py-1 sm:py-1.5 px-1 sm:px-2 lg:px-3">Total</th>
                      <th className="text-left py-1 sm:py-1.5 px-1 sm:px-2 lg:px-3 hidden md:table-cell">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoices.map((invoice) => (
                      <tr key={invoice.id} className="border-b hover:bg-slate-50 dark:hover:bg-slate-800">
                        <td className="py-1.5 sm:py-2 px-1 sm:px-2 lg:px-3 font-medium text-[10px] sm:text-xs lg:text-sm truncate max-w-[80px] sm:max-w-none">{invoice.number}</td>
                        <td className="py-1.5 sm:py-2 px-1 sm:px-2 lg:px-3">
                          <Badge className={`${getStatusColor(invoice.status)} text-[9px] sm:text-xs px-1 sm:px-1.5 py-0 sm:py-0.5`}>
                            {getStatusLabel(invoice.status)}
                          </Badge>
                        </td>
                        <td className="py-1.5 sm:py-2 px-1 sm:px-2 lg:px-3 hidden sm:table-cell text-[10px] sm:text-xs lg:text-sm">{new Date(invoice.issueDate).toLocaleDateString('pt-BR')}</td>
                        <td className="py-1.5 sm:py-2 px-1 sm:px-2 lg:px-3 hidden sm:table-cell text-[10px] sm:text-xs lg:text-sm">{new Date(invoice.dueDate).toLocaleDateString('pt-BR')}</td>
                        <td className="py-1.5 sm:py-2 px-1 sm:px-2 lg:px-3 text-right font-medium text-[10px] sm:text-xs lg:text-sm">
                          {new Intl.NumberFormat('pt-BR', {
                            style: 'currency',
                            currency: 'BRL',
                          }).format(invoice.total)}
                        </td>
                        <td className="py-1.5 sm:py-2 px-1 sm:px-2 lg:px-3 hidden md:table-cell">
                          <Link href={`/financeiro`}>
                            <Button variant="ghost" size="sm" className="text-[10px] sm:text-xs h-6 sm:h-8 px-1.5 sm:px-2">
                              Detalhes
                            </Button>
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Info Box */}
      <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
        <CardHeader>
          <CardTitle className="text-blue-900 dark:text-blue-100">ℹ️ Sistema Financeiro Modernizado</CardTitle>
        </CardHeader>
        <CardContent className="text-blue-800 dark:text-blue-200">
          <p>Esta página de billing foi migrada para o novo sistema financeiro em <code className="bg-white/50 dark:bg-black/30 px-2 py-1 rounded">/financeiro</code></p>
          <p className="mt-2">
            Para gerenciar faturas, despesas, transações e custos, acesse o{' '}
            <Link href="/app/financeiro" className="underline font-semibold hover:opacity-80">
              novo sistema financeiro
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
