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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Faturas do Cliente</h1>
            <p className="text-slate-600 dark:text-slate-400 mt-1">ID: {clientId || '—'}</p>
          </div>
          <div className="space-x-3">
            <Link href={`/financeiro`}>
              <Button variant="outline">Ver Sistema Financeiro</Button>
            </Link>
          </div>
        </div>

        {/* Invoices List */}
        <Card>
          <CardHeader>
            <CardTitle>Faturas ({invoices.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {invoices.length === 0 ? (
              <p className="text-center text-slate-600 py-8">Nenhuma fatura encontrada</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b">
                    <tr>
                      <th className="text-left py-2 px-4">Número</th>
                      <th className="text-left py-2 px-4">Status</th>
                      <th className="text-left py-2 px-4">Data Emissão</th>
                      <th className="text-left py-2 px-4">Data Vencimento</th>
                      <th className="text-right py-2 px-4">Total</th>
                      <th className="text-left py-2 px-4">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoices.map((invoice) => (
                      <tr key={invoice.id} className="border-b hover:bg-slate-50 dark:hover:bg-slate-800">
                        <td className="py-3 px-4 font-medium">{invoice.number}</td>
                        <td className="py-3 px-4">
                          <Badge className={getStatusColor(invoice.status)}>
                            {getStatusLabel(invoice.status)}
                          </Badge>
                        </td>
                        <td className="py-3 px-4">{new Date(invoice.issueDate).toLocaleDateString('pt-BR')}</td>
                        <td className="py-3 px-4">{new Date(invoice.dueDate).toLocaleDateString('pt-BR')}</td>
                        <td className="py-3 px-4 text-right font-medium">
                          {new Intl.NumberFormat('pt-BR', {
                            style: 'currency',
                            currency: 'BRL',
                          }).format(invoice.total)}
                        </td>
                        <td className="py-3 px-4">
                          <Link href={`/financeiro`}>
                            <Button variant="ghost" size="sm">
                              Detalhes
                            </Button>
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
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
    </div>
  )
}
