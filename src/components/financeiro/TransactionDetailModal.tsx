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
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '@/lib/prisma-enums'
import { formatCurrency, formatDate } from '@/lib/utils'
import { TransactionStatus, TransactionType } from '@prisma/client'
import { AlertTriangle, Edit3, Save, Trash2, X } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'

interface TransactionDetailModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  transactionId?: string
  onUpdated?: () => void
}

interface Transaction {
  id: string
  type: TransactionType
  status: TransactionStatus
  description: string
  category: string | null
  amount: number
  date: string
  clientId?: string
  client?: { name: string }
}

export function TransactionDetailModal({
  open,
  onOpenChange,
  transactionId,
  onUpdated,
}: TransactionDetailModalProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<Transaction | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [form, setForm] = useState<{
    description: string
    category: string
    amount: string
    date: string
    status: TransactionStatus
  } | null>(null)

  const fetchTransaction = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/transactions/${transactionId}`)

      if (!response.ok) {
        throw new Error('Erro ao carregar transação')
      }

      const transaction = await response.json()
      setData(transaction)
      setForm({
        description: transaction.description ?? '',
        category: transaction.category ?? '',
        amount: String(transaction.amount ?? ''),
        date: transaction.date ? new Date(transaction.date).toISOString().slice(0, 10) : '',
        status: transaction.status,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
    } finally {
      setLoading(false)
    }
  }, [transactionId])

  useEffect(() => {
    if (open && transactionId) {
      fetchTransaction()
    } else if (!open) {
      setData(null)
      setError(null)
    }
  }, [open, transactionId, fetchTransaction])

  function onFieldChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    if (!form) return
    const { name, value } = e.target
    setForm({ ...form, [name]: value })
  }

  async function handleSave() {
    if (!transactionId || !form) return
    setError(null)
    try {
      const res = await fetch(`/api/transactions/${transactionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: form.description,
          category: form.category || null,
          amount: parseFloat(form.amount),
          date: form.date ? new Date(form.date) : undefined,
          status: form.status,
        }),
      })
      if (!res.ok) throw new Error('Erro ao atualizar transação')
      await fetchTransaction()
      onUpdated?.()
      setEditMode(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar')
    }
  }

  async function handleDelete() {
    if (!transactionId) return

    const confirmed = confirm(
      'Tem certeza que deseja excluir esta transação? Esta ação não pode ser desfeita.'
    )

    if (!confirmed) return

    setIsDeleting(true)
    setError(null)

    try {
      const response = await fetch(`/api/transactions/${transactionId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Erro ao excluir transação')
      }

      onOpenChange(false)
      onUpdated?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao excluir')
    } finally {
      setIsDeleting(false)
    }
  }

  function getTypeBadgeVariant(type: string) {
    switch (type) {
      case 'INCOME':
        return 'success'
      case 'EXPENSE':
        return 'danger'
      default:
        return 'default'
    }
  }

  function getTypeLabel(type: string) {
    switch (type) {
      case 'INCOME':
        return 'Receita'
      case 'EXPENSE':
        return 'Despesa'
      default:
        return type
    }
  }

  function getStatusBadgeVariant(status: string) {
    switch (status) {
      case 'CONFIRMED':
        return 'success'
      case 'PENDING':
        return 'warning'
      case 'CANCELLED':
        return 'danger'
      default:
        return 'default'
    }
  }

  function getStatusLabel(status: string) {
    switch (status) {
      case 'CONFIRMED':
        return 'Confirmada'
      case 'PENDING':
        return 'Pendente'
      case 'CANCELLED':
        return 'Cancelada'
      default:
        return status
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Detalhes da Transação</DialogTitle>
          <DialogDescription>
            Visualize as informações detalhadas da transação
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
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Tipo</p>
                <Badge variant={getTypeBadgeVariant(data.type)}>
                  {getTypeLabel(data.type)}
                </Badge>
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-1">Status</p>
                {editMode ? (
                  <select
                    name="status"
                    value={form?.status || 'PENDING'}
                    onChange={onFieldChange}
                    className="px-2 py-1 border rounded-md"
                    aria-label="Status da transação"
                  >
                    <option value="PENDING">Pendente</option>
                    <option value="CONFIRMED">Confirmado</option>
                    <option value="CANCELLED">Cancelado</option>
                  </select>
                ) : (
                  <Badge variant={getStatusBadgeVariant(data.status)}>
                    {getStatusLabel(data.status)}
                  </Badge>
                )}
              </div>
            </div>

            <div>
              <p className="text-sm text-muted-foreground mb-1">Descrição</p>
              {editMode ? (
                <input
                  name="description"
                  value={form?.description || ''}
                  onChange={onFieldChange}
                  className="w-full px-3 py-2 border rounded-md"
                  placeholder="Descrição"
                  title="Descrição"
                />
              ) : (
                <p className="text-base font-medium">{data.description}</p>
              )}
            </div>

            <div>
              <p className="text-sm text-muted-foreground mb-1">Categoria</p>
              {editMode ? (
                <>
                  <input
                    list="tx-category-options"
                    name="category"
                    value={form?.category || ''}
                    onChange={onFieldChange}
                    className="w-full px-3 py-2 border rounded-md"
                    placeholder="Categoria"
                    title="Categoria"
                  />
                  <datalist id="tx-category-options">
                    {((data?.type === 'INCOME') ? INCOME_CATEGORIES : EXPENSE_CATEGORIES).map((c) => (
                      <option key={c} value={c} />
                    ))}
                  </datalist>
                </>
              ) : (
                <p className="text-base">{data.category}</p>
              )}
            </div>

            <div>
              <p className="text-sm text-muted-foreground mb-1">Valor</p>
              {editMode ? (
                <input
                  name="amount"
                  type="number"
                  step="0.01"
                  value={form?.amount || ''}
                  onChange={onFieldChange}
                  className="w-full px-3 py-2 border rounded-md"
                  placeholder="Valor"
                  title="Valor"
                />
              ) : (
                <p className="text-2xl font-bold text-blue-600">{formatCurrency(data.amount)}</p>
              )}
            </div>

            <div>
              <p className="text-sm text-muted-foreground mb-1">Data</p>
              {editMode ? (
                <input
                  name="date"
                  type="date"
                  value={form?.date || ''}
                  onChange={onFieldChange}
                  className="px-3 py-2 border rounded-md"
                  title="Data"
                />
              ) : (
                <p className="text-base">{formatDate(data.date)}</p>
              )}
            </div>

            {data.client && (
              <div>
                <p className="text-sm text-muted-foreground mb-1">Cliente</p>
                <p className="text-base">{data.client.name}</p>
              </div>
            )}
          </div>
        )}

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isDeleting}
          >
            Fechar
          </Button>
          {editMode ? (
            <>
              <Button variant="secondary" onClick={handleSave}>
                <Save className="h-4 w-4" />
                Salvar
              </Button>
              <Button variant="outline" onClick={() => setEditMode(false)}>
                <X className="h-4 w-4" />
                Cancelar
              </Button>
            </>
          ) : (
            <Button variant="secondary" onClick={() => setEditMode(true)}>
              <Edit3 className="h-4 w-4" />
              Editar
            </Button>
          )}
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting || !data}
            isLoading={isDeleting}
          >
            <Trash2 className="h-4 w-4" />
            Excluir
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
