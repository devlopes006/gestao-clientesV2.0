'use client'

import { CreateRecurringExpenseModal } from '@/components/financeiro/CreateRecurringExpenseModal'
import { RecurringExpenseDetailModal } from '@/components/financeiro/RecurringExpenseDetailModal'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { formatCurrency, formatDate } from '@/lib/utils'
import { ExpenseCycle } from '@prisma/client'
import {
  AlertCircle,
  Calendar,
  CheckCircle,
  Plus,
  RefreshCw,
  Repeat,
  ToggleLeft,
  ToggleRight,
  Trash2
} from 'lucide-react'
import { useEffect, useState } from 'react'

interface RecurringExpense {
  id: string
  name: string
  description: string | null
  amount: number
  cycle: ExpenseCycle
  isActive: boolean
  nextDueDate: string
  createdAt: string
  paidThisMonth?: boolean
}

type RecurringExpenseApi = {
  id: string
  name: string
  description?: string | null
  amount: number
  cycle: ExpenseCycle
  active?: boolean
  isActive?: boolean
  dayOfMonth?: number | null
  createdAt?: string | Date | null
}

type TxItem = {
  metadata?: { recurringExpenseId?: string | null } | null
}

export function DespesasTab() {
  const [expenses, setExpenses] = useState<RecurringExpense[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [materializing, setMaterializing] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [detailModalOpen, setDetailModalOpen] = useState(false)
  const [selectedExpenseId, setSelectedExpenseId] = useState<string | undefined>()

  const [cycleFilter, setCycleFilter] = useState<string>('')
  const [activeFilter, setActiveFilter] = useState<string>('')
  const [searchTerm, setSearchTerm] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  useEffect(() => {
    fetchExpenses()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cycleFilter, activeFilter, page])

  const fetchExpenses = async () => {
    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams({
        ...(cycleFilter && { cycle: cycleFilter }),
        ...(activeFilter === 'active' ? { active: 'true' } : {}),
        ...(activeFilter === 'inactive' ? { active: 'false' } : {}),
        ...(searchTerm ? { search: searchTerm } : {}),
        page: page.toString(),
        limit: '20',
      })

      const response = await fetch(`/api/recurring-expenses?${params}`)

      if (!response.ok) throw new Error('Erro ao carregar despesas')

      const result = await response.json()
      const items = Array.isArray(result) ? result : (result?.data ?? [])

      // Buscar transações de despesas fixas confirmadas no mês corrente para travar o botão
      const now = new Date()
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)
      const txParams = new URLSearchParams({
        type: 'EXPENSE',
        subtype: 'FIXED_EXPENSE',
        status: 'CONFIRMED',
        dateFrom: firstDay.toISOString(),
        dateTo: lastDay.toISOString(),
        limit: '500',
      })
      const paidSet = new Set<string>()
      try {
        const txRes = await fetch(`/api/transactions?${txParams.toString()}`)
        if (txRes.ok) {
          const txJson = await txRes.json()
          const txList = (txJson?.data ?? []) as TxItem[]
          for (const t of txList) {
            const rid = t?.metadata?.recurringExpenseId || undefined
            if (rid) paidSet.add(rid)
          }
        }
      } catch {
        // Silencia falhas aqui; não deve bloquear listagem
      }

      const mapped: RecurringExpense[] = (items as RecurringExpenseApi[]).map((e) => {
        const next = computeNextDueDate(e)
        const paidThisMonth = paidSet.has(e.id)
        return {
          id: e.id,
          name: e.name,
          description: e.description ?? null,
          amount: e.amount,
          cycle: e.cycle,
          isActive: e.active ?? e.isActive ?? false,
          nextDueDate: next.toISOString(),
          createdAt: ((): string => {
            if (!e.createdAt) return new Date().toISOString()
            if (typeof e.createdAt === 'string') return new Date(e.createdAt).toISOString()
            return e.createdAt.toISOString()
          })(),
          paidThisMonth,
        }
      })

      setExpenses(mapped)
      setTotalPages(Array.isArray(result) ? 1 : result.totalPages || 1)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
    } finally {
      setLoading(false)
    }
  }

  function computeNextDueDate(e: RecurringExpenseApi): Date {
    try {
      const cycle: ExpenseCycle = e.cycle
      const now = new Date()
      if (cycle === 'ANNUAL') {
        // Próximo vencimento anual: hoje (simples) ou fim do ano
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

  const handleMaterialize = async () => {
    if (!confirm('Deseja materializar todas as despesas mensais ativas?')) return

    try {
      setMaterializing(true)
      setError(null)

      const response = await fetch('/api/recurring-expenses/materialize', { method: 'POST' })
      if (!response.ok) throw new Error('Erro ao materializar despesas')

      const result = await response.json()
      const created = Number(result?.success ?? result?.details?.success?.length ?? 0)
      const skipped = Number(result?.skipped ?? result?.details?.skipped?.length ?? 0)
      const errors = Number(result?.errors ?? result?.details?.errors?.length ?? 0)
      alert(`✅ Despesas materializadas!\n\nCriadas: ${created}\nIgnoradas: ${skipped}\nErros: ${errors}`)
      fetchExpenses()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao materializar')
    } finally {
      setMaterializing(false)
    }
  }

  const handleToggleActive = async (expenseId: string, currentStatus: boolean, e?: React.MouseEvent) => {
    e?.stopPropagation()
    try {
      const response = await fetch(`/api/recurring-expenses/${expenseId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !currentStatus }),
      })

      if (!response.ok) throw new Error('Erro ao atualizar despesa')
      fetchExpenses()
    } catch (err) {
      alert(`❌ ${err instanceof Error ? err.message : 'Erro'}`)
    }
  }

  const handleDelete = async (expenseId: string, e?: React.MouseEvent) => {
    e?.stopPropagation()
    if (!confirm('Deseja realmente excluir esta despesa recorrente?')) return

    try {
      const response = await fetch(`/api/recurring-expenses/${expenseId}`, {
        method: 'DELETE',
      })

      if (!response.ok) throw new Error('Erro ao excluir despesa')
      alert('✅ Despesa excluída!')
      fetchExpenses()
    } catch (err) {
      alert(`❌ ${err instanceof Error ? err.message : 'Erro'}`)
    }
  }

  const handleMaterializeOne = async (expenseId: string, e?: React.MouseEvent) => {
    e?.stopPropagation()
    try {
      const res = await fetch(`/api/recurring-expenses/${expenseId}/materialize`, { method: 'POST' })
      if (!res.ok) throw new Error('Erro ao materializar despesa')
      const data = await res.json()
      const created = data?.result?.status === 'created'
      alert(created ? '✅ Despesa materializada!' : '⏭️ Já materializada este mês')
      // Recarrega para refletir o travamento do botão
      fetchExpenses()
    } catch (err) {
      alert(`❌ ${err instanceof Error ? err.message : 'Erro'}`)
    }
  }

  const handleExpenseCreated = () => {
    setModalOpen(false)
    fetchExpenses()
  }

  const handleViewExpense = (id: string) => {
    setSelectedExpenseId(id)
    setDetailModalOpen(true)
  }

  const getCycleBadge = (cycle: ExpenseCycle) => {
    const configs: Record<ExpenseCycle, { label: string, styles: string }> = {
      MONTHLY: { label: 'Mensal', styles: 'bg-gradient-to-r from-rose-500/20 to-orange-500/20 text-rose-200 border border-rose-500/30 shadow-sm shadow-rose-500/20' },
      ANNUAL: { label: 'Anual', styles: 'bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-pink-200 border border-pink-500/30 shadow-sm shadow-pink-500/20' },
    }

    const { label, styles } = configs[cycle] || configs.MONTHLY

    return <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold ${styles}`}><Calendar className="mr-1 h-3 w-3" />{label}</span>
  }

  const filteredExpenses = expenses.filter(exp => {
    const matchesSearch = !searchTerm || exp.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesActive = !activeFilter || (activeFilter === 'active' ? exp.isActive : !exp.isActive)
    return matchesSearch && matchesActive
  })

  return (
    <section className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <p className="text-xs font-bold text-rose-400 uppercase tracking-widest">Gestão Financeira</p>
          <h2 className="text-3xl font-black bg-gradient-to-r from-rose-400 via-red-400 to-orange-400 bg-clip-text text-transparent drop-shadow-lg">Despesas Fixas</h2>
          <p className="text-sm text-slate-400 max-w-2xl">
            Cadastre, materialize e acompanhe suas despesas recorrentes com controle total.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button
            variant="outline"
            onClick={handleMaterialize}
            disabled={materializing}
            className="border-slate-700 bg-slate-900/50 hover:bg-slate-800 text-slate-200"
          >
            {materializing ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <Repeat className="mr-2 h-4 w-4" />}
            Materializar
          </Button>
          <Button
            onClick={() => setModalOpen(true)}
            className="bg-gradient-to-r from-rose-600 to-orange-600 hover:from-rose-500 hover:to-orange-500 shadow-lg shadow-rose-500/30"
          >
            <Plus className="mr-2 h-4 w-4" />
            Nova Despesa
          </Button>
        </div>
      </div>

      <div className="rounded-2xl border border-rose-500/20 bg-gradient-to-br from-slate-900 via-rose-950/10 to-slate-900/90 backdrop-blur-xl p-6 shadow-2xl">
        <div className="bg-gradient-to-r from-rose-500 via-red-500 to-orange-500 h-1 rounded-t-2xl absolute top-0 left-0 right-0" />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3 mb-5">
          <div className="space-y-2">
            <Label htmlFor="search" className="text-slate-300 font-semibold">Buscar</Label>
            <div className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900/50 px-3 py-2.5 focus-within:border-rose-500/50 focus-within:ring-2 focus-within:ring-rose-500/20 transition-all">
              <Repeat className="h-4 w-4 text-slate-400" />
              <Input
                id="search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Nome da despesa"
                className="border-0 p-0 bg-transparent text-slate-100 placeholder:text-slate-500 focus-visible:ring-0"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="cycle" className="text-slate-300 font-semibold">Ciclo</Label>
            <select
              id="cycle"
              title="Filtrar por ciclo"
              value={cycleFilter}
              onChange={(e) => setCycleFilter(e.target.value)}
              className="h-11 w-full rounded-xl border border-slate-700 bg-slate-900/50 px-4 text-sm text-slate-100 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 transition-all"
            >
              <option value="" className="bg-slate-900">Todos</option>
              <option value="MONTHLY" className="bg-slate-900">Mensal</option>
              <option value="ANNUAL" className="bg-slate-900">Anual</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="active" className="text-slate-300 font-semibold">Status</Label>
            <select
              id="active"
              title="Filtrar por status"
              value={activeFilter}
              onChange={(e) => setActiveFilter(e.target.value)}
              className="h-11 w-full rounded-xl border border-slate-700 bg-slate-900/50 px-4 text-sm text-slate-100 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 transition-all"
            >
              <option value="" className="bg-slate-900">Todos</option>
              <option value="active" className="bg-slate-900">Ativos</option>
              <option value="inactive" className="bg-slate-900">Inativos</option>
            </select>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-slate-700/30 pt-4">
          <span className="text-sm font-semibold text-slate-300">
            Mostrando <span className="text-rose-400">{filteredExpenses.length}</span> de <span className="text-rose-400">{expenses.length}</span> despesas
          </span>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => { setSearchTerm(''); setCycleFilter(''); setActiveFilter('') }}
              className="text-slate-300 hover:text-slate-100 hover:bg-slate-800"
            >
              Limpar filtros
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleMaterialize}
              disabled={materializing}
              className="border-slate-700 bg-slate-900/50 hover:bg-slate-800 text-slate-200"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Materializar agora
            </Button>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {error && (
          <Alert variant="destructive" className="border-red-500/30 bg-red-500/10">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-slate-100">{error}</AlertDescription>
          </Alert>
        )}
        {loading ? (
          <div className="flex items-center gap-3 rounded-2xl border border-rose-500/30 bg-gradient-to-br from-rose-500/10 to-slate-900/90 backdrop-blur-xl px-6 py-8 shadow-xl">
            <RefreshCw className="h-5 w-5 animate-spin text-rose-400" />
            <span className="text-sm font-semibold text-slate-200">Carregando despesas...</span>
          </div>
        ) : filteredExpenses.length === 0 ? (
          <div className="rounded-2xl border border-slate-700/50 bg-gradient-to-br from-slate-900/50 to-slate-800/50 backdrop-blur-xl px-6 py-12 text-center shadow-xl">
            <p className="text-sm font-semibold text-slate-400">Nenhuma despesa encontrada.</p>
            <p className="text-xs text-slate-500 mt-1">Tente ajustar os filtros ou criar uma nova despesa.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredExpenses.map((expense) => (
              <div
                key={expense.id}
                onClick={() => handleViewExpense(expense.id)}
                className="group rounded-2xl border border-slate-700/50 bg-gradient-to-br from-slate-900/80 to-slate-800/80 backdrop-blur-xl p-5 shadow-lg hover:shadow-xl hover:border-rose-500/30 transition-all duration-300 cursor-pointer"
              >
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-full border ${expense.isActive ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300' : 'border-slate-700 bg-slate-900/60 text-slate-400'}`}>
                      {expense.isActive ? <ToggleRight className="h-4 w-4" /> : <ToggleLeft className="h-4 w-4" />}
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-base font-bold text-slate-100 line-clamp-1">{expense.name}</p>
                        {getCycleBadge(expense.cycle)}
                        {!expense.isActive && <span className="inline-flex items-center rounded-full px-3 py-1 text-xs font-bold bg-slate-800 text-slate-300 border border-slate-700">Inativo</span>}
                      </div>
                      {expense.description && <p className="text-sm text-slate-400 line-clamp-2">{expense.description}</p>}
                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Próximo: {formatDate(expense.nextDueDate)}
                        </span>
                        {expense.paidThisMonth && (
                          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-2 py-1 text-[11px] font-semibold text-emerald-300">
                            <CheckCircle className="h-3 w-3" /> Pago este mês
                          </span>
                        )}
                        <span className="text-slate-500">{expense.cycle === 'MONTHLY' ? '/ mês' : '/ ano'}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right space-y-2">
                    <p className="text-xl font-black bg-gradient-to-r from-rose-400 to-orange-400 bg-clip-text text-transparent">
                      {formatCurrency(expense.amount)}
                    </p>
                    <div className="flex gap-2 justify-end">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(ev) => handleToggleActive(expense.id, expense.isActive, ev)}
                        className="border-slate-700 text-slate-200 hover:border-rose-500/40 hover:text-rose-300"
                      >
                        {expense.isActive ? <ToggleLeft className="h-4 w-4" /> : <ToggleRight className="h-4 w-4" />}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(ev) => handleDelete(expense.id, ev)}
                        className="border-slate-700 text-rose-400 hover:border-rose-500/50 hover:text-rose-300"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        onClick={(ev) => handleMaterializeOne(expense.id, ev)}
                        disabled={!expense.isActive || expense.paidThisMonth}
                        title={expense.paidThisMonth ? 'Já pago/materializado este mês' : 'Pagar este mês'}
                        className="bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white disabled:opacity-50"
                      >
                        <CheckCircle className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-slate-700/50 bg-gradient-to-br from-slate-900/90 to-slate-800/90 backdrop-blur-xl p-4 text-sm text-slate-300 md:flex-row md:justify-between shadow-lg">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="border-slate-700 bg-slate-900/50 hover:bg-slate-800 text-slate-200"
            >
              Anterior
            </Button>
            <Button
              variant="outline"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="border-slate-700 bg-slate-900/50 hover:bg-slate-800 text-slate-200"
            >
              Próxima
            </Button>
          </div>
          <span className="text-rose-400 font-semibold">Página {page} de {totalPages}</span>
        </div>
      )}

      <CreateRecurringExpenseModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        onSuccess={handleExpenseCreated}
      />

      <RecurringExpenseDetailModal
        open={detailModalOpen}
        onOpenChange={setDetailModalOpen}
        expenseId={selectedExpenseId}
      />
    </section>
  )
}
