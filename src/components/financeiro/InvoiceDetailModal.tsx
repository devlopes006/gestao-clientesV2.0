'use client'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { formatCurrency, formatDate } from '@/lib/utils'
import { AlertTriangle, CheckCircle, XCircle } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'

interface InvoiceDetailModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  invoiceId?: string
}

interface InvoiceItem {
  id: string
  description: string
  quantity: number
  unitPrice: number
  total: number
}

interface Invoice {
  id: string
  invoiceNumber: string
  status: 'DRAFT' | 'OPEN' | 'PAID' | 'OVERDUE' | 'CANCELLED'
  issueDate: string
  dueDate: string
  paidAt?: string
  total: number
  clientId: string
  client: {
    name: string
  }
  items: InvoiceItem[]
}

export function InvoiceDetailModal({
  open,
  onOpenChange,
  invoiceId,
}: InvoiceDetailModalProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<Invoice | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)

  const fetchInvoice = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/invoices/${invoiceId}`)

      if (!response.ok) {
        throw new Error('Erro ao carregar fatura')
      }

      const invoice = await response.json()
      setData(invoice)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
    } finally {
      setLoading(false)
    }
  }, [invoiceId])

  useEffect(() => {
    if (open && invoiceId) {
      fetchInvoice()
    } else if (!open) {
      setData(null)
      setError(null)
    }
  }, [open, invoiceId, fetchInvoice])



  async function handleApprovePayment() {
    if (!invoiceId) return

    const confirmed = confirm(
      'Tem certeza que deseja aprovar o pagamento desta fatura?'
    )

    if (!confirmed) return

    setIsProcessing(true)
    setError(null)

    try {
      const response = await fetch(`/api/invoices/${invoiceId}/approve`, {
        method: 'POST',
      })

      if (!response.ok) {
        throw new Error('Erro ao aprovar pagamento')
      }

      await fetchInvoice()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao aprovar')
    } finally {
      setIsProcessing(false)
    }
  }

  async function handleCancel() {
    if (!invoiceId) return

    const confirmed = confirm(
      'Tem certeza que deseja cancelar esta fatura? Esta ação não pode ser desfeita.'
    )

    if (!confirmed) return

    setIsProcessing(true)
    setError(null)

    try {
      const response = await fetch(`/api/invoices/${invoiceId}/cancel`, {
        method: 'POST',
      })

      if (!response.ok) {
        throw new Error('Erro ao cancelar fatura')
      }

      onOpenChange(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao cancelar')
    } finally {
      setIsProcessing(false)
    }
  }

  function getStatusBadgeVariant(status: string) {
    switch (status) {
      case 'PAID':
        return 'success'
      case 'OPEN':
        return 'warning'
      case 'OVERDUE':
        return 'danger'
      case 'DRAFT':
        return 'draft'
      case 'CANCELLED':
        return 'danger'
      default:
        return 'default'
    }
  }

  function getStatusLabel(status: string) {
    switch (status) {
      case 'PAID':
        return 'Paga'
      case 'OPEN':
        return 'Aberta'
      case 'OVERDUE':
        return 'Atrasada'
      case 'DRAFT':
        return 'Rascunho'
      case 'CANCELLED':
        return 'Cancelada'
      default:
        return status
    }
  }

  const canApprovePayment = data && ['OPEN', 'OVERDUE'].includes(data.status)
  const canCancel = data && data.status === 'OPEN'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Detalhes da Fatura</DialogTitle>
          <DialogDescription>
            Visualize as informações detalhadas da fatura
          </DialogDescription>
        </DialogHeader>

        {loading && (
          <div className="space-y-4">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Erro</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {!loading && !error && data && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">
                  Número da Fatura
                </p>
                <p className="text-base font-medium">{data.invoiceNumber}</p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-1">Status</p>
                <Badge variant={getStatusBadgeVariant(data.status)}>
                  {getStatusLabel(data.status)}
                </Badge>
              </div>
            </div>

            <div>
              <p className="text-sm text-muted-foreground mb-1">Cliente</p>
              <p className="text-base font-medium">{data.client.name}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">
                  Data de Emissão
                </p>
                <p className="text-base">{formatDate(data.issueDate)}</p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-1">
                  Data de Vencimento
                </p>
                <p className="text-base">{formatDate(data.dueDate)}</p>
              </div>
            </div>

            {data.paidAt && (
              <div>
                <p className="text-sm text-muted-foreground mb-1">
                  Data de Pagamento
                </p>
                <p className="text-base">{formatDate(data.paidAt)}</p>
              </div>
            )}

            <div>
              <p className="text-sm text-muted-foreground mb-2">Itens</p>
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-slate-50 dark:bg-slate-900">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium">
                        Descrição
                      </th>
                      <th className="px-4 py-3 text-right text-sm font-medium">
                        Qtd.
                      </th>
                      <th className="px-4 py-3 text-right text-sm font-medium">
                        Valor Unit.
                      </th>
                      <th className="px-4 py-3 text-right text-sm font-medium">
                        Total
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {data.items.map((item) => (
                      <tr key={item.id}>
                        <td className="px-4 py-3 text-sm">
                          {item.description}
                        </td>
                        <td className="px-4 py-3 text-sm text-right">
                          {item.quantity}
                        </td>
                        <td className="px-4 py-3 text-sm text-right">
                          {formatCurrency(item.unitPrice)}
                        </td>
                        <td className="px-4 py-3 text-sm text-right font-medium">
                          {formatCurrency(item.total)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t">
              <div className="text-right">
                <p className="text-sm text-muted-foreground mb-1">
                  Valor Total
                </p>
                <p className="text-3xl font-bold text-blue-600">
                  {formatCurrency(data.total)}
                </p>
              </div>
            </div>
          </div>
        )}

        <DialogFooter className="gap-2 flex-wrap">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isProcessing}
          >
            Fechar
          </Button>
          {canApprovePayment && (
            <Button
              variant="success"
              onClick={handleApprovePayment}
              disabled={isProcessing}
              isLoading={isProcessing}
            >
              <CheckCircle className="h-4 w-4" />
              Aprovar Pagamento
            </Button>
          )}
          {canCancel && (
            <Button
              variant="destructive"
              onClick={handleCancel}
              disabled={isProcessing}
              isLoading={isProcessing}
            >
              <XCircle className="h-4 w-4" />
              Cancelar Fatura
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
