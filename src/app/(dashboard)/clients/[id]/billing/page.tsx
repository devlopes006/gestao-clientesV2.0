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
      PAID: 'bg-emerald-900/40 text-emerald-300 border border-emerald-700/50',
      OVERDUE: 'bg-red-900/40 text-red-300 border border-red-700/50',
      OPEN: 'bg-blue-900/40 text-blue-300 border border-blue-700/50',
      DRAFT: 'bg-slate-800 text-slate-300 border border-slate-700/50',
      CANCELLED: 'bg-slate-800 text-slate-400 border border-slate-700/50',
    }
    return colors[status] || 'bg-slate-800 text-slate-300 border border-slate-700/50'
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
    <div className="space-y-3 sm:space-y-4 lg:space-y-6 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 bg-slate-900 min-h-screen">
      {/* Header */}
      <div className="rounded-2xl border border-slate-700/50 bg-slate-900/80 backdrop-blur-sm px-4 sm:px-6 py-4 sm:py-5 shadow-lg">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-blue-400 bg-clip-text text-transparent">Faturas do Cliente</h1>
            <p className="text-sm sm:text-base text-slate-300">ID: {clientId || '—'}</p>
          </div>
          <div className="flex gap-2 sm:gap-3 w-full sm:w-auto">
            <Link href={`/financeiro`} className="w-full sm:w-auto">
              <Button
                variant="outline"
                className="w-full sm:w-auto rounded-2xl bg-slate-800/80 text-white hover:bg-slate-700/80 border border-slate-700/60 shadow-sm"
              >
                Ver Sistema Financeiro
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Invoices List */}
      <Card className="overflow-hidden bg-slate-900 border border-slate-700/50 rounded-2xl shadow-lg">
        <CardHeader>
          <CardTitle className="text-white">Faturas ({invoices.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0 sm:p-6">
          {invoices.length === 0 ? (
            <p className="text-center text-slate-400 py-8 px-4">Nenhuma fatura encontrada</p>
          ) : (
            <>
              {/* Mobile cards */}
              <div className="grid gap-3 sm:hidden px-3 pb-4">
                {invoices.map((invoice) => (
                  <div key={invoice.id} className="rounded-2xl border border-slate-700/50 bg-slate-800 shadow-sm p-4 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-xs text-slate-400">Número</div>
                      <Badge className={`${getStatusColor(invoice.status)} text-[10px] px-2 py-0.5`}>{getStatusLabel(invoice.status)}</Badge>
                    </div>
                    <div className="text-base font-semibold text-white truncate">{invoice.number}</div>
                    <div className="grid grid-cols-2 gap-2 text-xs text-slate-300">
                      <div className="space-y-1">
                        <div className="font-medium text-slate-200">Emissão</div>
                        <div>{new Date(invoice.issueDate).toLocaleDateString('pt-BR')}</div>
                      </div>
                      <div className="space-y-1">
                        <div className="font-medium text-slate-200">Vencimento</div>
                        <div>{new Date(invoice.dueDate).toLocaleDateString('pt-BR')}</div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-2">
                      <div className="text-xs text-slate-400">Total</div>
                      <div className="text-base font-semibold text-white">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(invoice.total)}
                      </div>
                    </div>
                    <div className="pt-1">
                      <Link href={`/financeiro`} className="inline-flex w-full">
                        <Button variant="ghost" size="sm" className="w-full justify-center text-white hover:bg-white/20">Ver no financeiro</Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop table */}
              <div className="hidden sm:block overflow-x-auto -mx-2 sm:mx-0">
                <table className="w-full text-[10px] sm:text-xs lg:text-sm">
                  <thead className="border-b border-slate-700/50 text-white">
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
                      <tr key={invoice.id} className="border-b border-slate-700/50 hover:bg-slate-800">
                        <td className="py-1.5 sm:py-2 px-1 sm:px-2 lg:px-3 font-medium text-[10px] sm:text-xs lg:text-sm truncate max-w-[80px] sm:max-w-none text-white">{invoice.number}</td>
                        <td className="py-1.5 sm:py-2 px-1 sm:px-2 lg:px-3">
                          <Badge className={`${getStatusColor(invoice.status)} text-[9px] sm:text-xs px-1 sm:px-1.5 py-0 sm:py-0.5`}>
                            {getStatusLabel(invoice.status)}
                          </Badge>
                        </td>
                        <td className="py-1.5 sm:py-2 px-1 sm:px-2 lg:px-3 hidden sm:table-cell text-[10px] sm:text-xs lg:text-sm text-slate-300">{new Date(invoice.issueDate).toLocaleDateString('pt-BR')}</td>
                        <td className="py-1.5 sm:py-2 px-1 sm:px-2 lg:px-3 hidden sm:table-cell text-[10px] sm:text-xs lg:text-sm text-slate-300">{new Date(invoice.dueDate).toLocaleDateString('pt-BR')}</td>
                        <td className="py-1.5 sm:py-2 px-1 sm:px-2 lg:px-3 text-right font-medium text-[10px] sm:text-xs lg:text-sm text-white">
                          {new Intl.NumberFormat('pt-BR', {
                            style: 'currency',
                            currency: 'BRL',
                          }).format(invoice.total)}
                        </td>
                        <td className="py-1.5 sm:py-2 px-1 sm:px-2 lg:px-3 hidden md:table-cell">
                          <Link href={`/financeiro`}>
                            <Button variant="ghost" size="sm" className="text-[10px] sm:text-xs h-6 sm:h-8 px-1.5 sm:px-2 text-white hover:bg-white/20">
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
      <Card className="bg-slate-900 border border-slate-700/50 rounded-2xl shadow-lg">
        <CardHeader>
          <CardTitle className="text-white">ℹ️ Sistema Financeiro Modernizado</CardTitle>
        </CardHeader>
        <CardContent className="text-slate-300">
          <p>Esta página de billing foi migrada para o novo sistema financeiro em <code className="bg-slate-800 px-2 py-1 rounded border border-slate-700/50">/financeiro</code></p>
          <p className="mt-2">
            Para gerenciar faturas, despesas, transações e custos, acesse o{' '}
            <Link href="/app/financeiro" className="underline font-semibold hover:opacity-80 text-white">
              novo sistema financeiro
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
