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
import { AlertTriangle, Calendar, Power, Trash2 } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'

interface RecurringExpenseDetailModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  expenseId?: string
}

interface RecurringExpense {
  id: string
  name: string
  description?: string
  amount: number
  cycle: 'MONTHLY' | 'ANNUAL'
  isActive: boolean
  nextDueDate: string
  createdAt: string
}

export function RecurringExpenseDetailModal({
  open,
  onOpenChange,
  expenseId,
}: RecurringExpenseDetailModalProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<RecurringExpense | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)

  const fetchExpense = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/recurring-expenses/${expenseId}`)

      if (!response.ok) {
        throw new Error('Erro ao carregar despesa recorrente')
      }

      const expense = await response.json()
      const mapped = {
        id: expense.id,
        name: expense.name,
        description: expense.description ?? undefined,
        amount: expense.amount,
        cycle: expense.cycle,
        isActive: expense.active ?? expense.isActive ?? false,
        nextDueDate: computeNextDueDate(expense).toISOString(),
        createdAt: (expense.createdAt ? new Date(expense.createdAt) : new Date()).toISOString(),
      } as RecurringExpense
      setData(mapped)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
    } finally {
      setLoading(false)
    }
  }, [expenseId])

  useEffect(() => {
    if (open && expenseId) {
      fetchExpense()
    } else if (!open) {
      setData(null)
      setError(null)
    }
  }, [open, expenseId, fetchExpense])

  async function handleToggleActive() {
    if (!expenseId || !data) return

    const action = data.isActive ? 'desativar' : 'ativar'
    const confirmed = confirm(
      `Tem certeza que deseja ${action} esta despesa recorrente?`
    )

    if (!confirmed) return

    setIsProcessing(true)
    setError(null)

    try {
      const response = await fetch(`/api/recurring-expenses/${expenseId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !data.isActive }),
      })

      if (!response.ok) {
        throw new Error(`Erro ao ${action} despesa`)
      }

      await fetchExpense()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao processar')
    } finally {
      setIsProcessing(false)
    }
  }

  async function handleMaterialize() {
    if (!expenseId) return

    const confirmed = confirm(
      'Tem certeza que deseja materializar esta despesa? Isso criará uma transação imediatamente.'
    )

    if (!confirmed) return

    setIsProcessing(true)
    setError(null)

    try {
      const response = await fetch(
        `/api/recurring-expenses/${expenseId}/materialize`,
        { method: 'POST' }
      )

      if (!response.ok) {
        throw new Error('Erro ao materializar despesa')
      }

      await fetchExpense()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao materializar')
    } finally {
      setIsProcessing(false)
    }
  }

  function computeNextDueDate(e: { cycle: 'MONTHLY' | 'ANNUAL'; dayOfMonth?: number | null }): Date {
    try {
      const cycle = e.cycle
      const now = new Date()
      if (cycle === 'ANNUAL') {
        return new Date(now.getFullYear(), 11, 31)
      }
      const day: number = e.dayOfMonth ? Number(e.dayOfMonth) : 1
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
      const targetDay = Math.max(1, Math.min(day, lastDay))
      return new Date(now.getFullYear(), now.getMonth(), targetDay)
    } catch {
      return new Date()
    }
  }

  async function handleDelete() {
    if (!expenseId) return

    const confirmed = confirm(
      'Tem certeza que deseja excluir esta despesa recorrente? Esta ação não pode ser desfeita.'
    )

    if (!confirmed) return

    setIsProcessing(true)
    setError(null)

    try {
      const response = await fetch(`/api/recurring-expenses/${expenseId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Erro ao excluir despesa')
      }

      onOpenChange(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao excluir')
    } finally {
      setIsProcessing(false)
    }
  }

  function getCycleBadgeVariant(cycle: string) {
    switch (cycle) {
      case 'MONTHLY':
        return 'info'
      case 'ANNUAL':
        return 'purple'
      default:
        return 'default'
    }
  }

  function getCycleLabel(cycle: string) {
    switch (cycle) {
      case 'MONTHLY':
        return 'Mensal'
      case 'ANNUAL':
        return 'Anual'
      default:
        return cycle
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Detalhes da Despesa Recorrente</DialogTitle>
          <DialogDescription>
            Visualize e gerencie a despesa recorrente
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
            <div>
              <p className="text-sm text-muted-foreground mb-1">Nome</p>
              <p className="text-xl font-bold">{data.name}</p>
            </div>

            {data.description && (
              <div>
                <p className="text-sm text-muted-foreground mb-1">Descrição</p>
                <p className="text-base">{data.description}</p>
              </div>
            )}

            <div>
              <p className="text-sm text-muted-foreground mb-1">Valor</p>
              <p className="text-2xl font-bold text-blue-600">
                {formatCurrency(data.amount)}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Ciclo</p>
                <Badge variant={getCycleBadgeVariant(data.cycle)}>
                  {getCycleLabel(data.cycle)}
                </Badge>
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-1">Status</p>
                <Badge variant={data.isActive ? 'success' : 'inactive'}>
                  {data.isActive ? 'Ativo' : 'Inativo'}
                </Badge>
              </div>
            </div>

            <div>
              <p className="text-sm text-muted-foreground mb-1">
                Próximo Vencimento
              </p>
              <p className="text-base font-medium">
                {formatDate(data.nextDueDate)}
              </p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground mb-1">
                Data de Criação
              </p>
              <p className="text-base">{formatDate(data.createdAt)}</p>
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
          <Button
            variant={data?.isActive ? 'warning' : 'success'}
            onClick={handleToggleActive}
            disabled={isProcessing || !data}
            isLoading={isProcessing}
          >
            <Power className="h-4 w-4" />
            {data?.isActive ? 'Desativar' : 'Ativar'}
          </Button>
          <Button
            variant="secondary"
            onClick={handleMaterialize}
            disabled={isProcessing || !data || !data.isActive}
            isLoading={isProcessing}
          >
            <Calendar className="h-4 w-4" />
            Materializar
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isProcessing || !data}
            isLoading={isProcessing}
          >
            <Trash2 className="h-4 w-4" />
            Excluir
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
