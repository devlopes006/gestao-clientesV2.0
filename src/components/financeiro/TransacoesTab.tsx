import { QuickStats } from '@/components/financeiro/QuickStats'
import { TransactionDetailModal } from '@/components/financeiro/TransactionDetailModal'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { exportTransactions } from '@/lib/export-utils'
import { formatCurrency } from '@/lib/utils'
import { TransactionStatus, TransactionSubtype, TransactionType } from '@prisma/client'
import { Download, Loader2, Search, X } from 'lucide-react'
import { useSearchParams } from 'next/navigation'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { CreateTransactionModal } from './CreateTransactionModal'

interface Transaction {
  id: string
  type: TransactionType
  subtype: TransactionSubtype
  amount: number
  description: string
  category: string | null
  date: string
  status: TransactionStatus
  client?: {
    id: string
    name: string
    email?: string | null
  } | null
  createdAt: string
}

export function TransacoesTab() {
  const searchParams = useSearchParams()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [modalOpen, setModalOpen] = useState(false)
  const [detailModalOpen, setDetailModalOpen] = useState(false)
  const [selectedTransactionId, setSelectedTransactionId] = useState<string | undefined>()

  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  useEffect(() => {
    const s = searchParams?.get('status') || ''
    const t = searchParams?.get('type') || ''
    const df = searchParams?.get('dateFrom') || ''
    const dt = searchParams?.get('dateTo') || ''
    if (s) setStatusFilter(s)
    if (t) setTypeFilter(t)
    if (df) setDateFrom(df)
    if (dt) setDateTo(dt)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const fetchTransactions = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        ...(typeFilter && { type: typeFilter }),
        ...(statusFilter && { status: statusFilter }),
        ...(dateFrom && { dateFrom }),
        ...(dateTo && { dateTo }),
      })

      const response = await fetch(`/api/transactions?${params}`)

      if (!response.ok) {
        throw new Error('Erro ao carregar transações')
      }

      const result = await response.json()
      const data = result.data || result
      const list = Array.isArray(data) ? data : data.transactions || []
      const meta = result.meta || data.meta || {}

      setTransactions(list)
      setTotalPages(meta.totalPages || result.totalPages || 1)
      setTotalCount(meta.total || result.total || list.length)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
    } finally {
      setLoading(false)
    }
  }, [page, typeFilter, statusFilter, dateFrom, dateTo])

  useEffect(() => {
    fetchTransactions()
  }, [fetchTransactions])

  useEffect(() => {
    setPage(1)
  }, [typeFilter, statusFilter, dateFrom, dateTo])

  const handleTransactionCreated = () => {
    setPage(1)
    fetchTransactions()
    toast.success('Transação criada com sucesso!')
  }

  const handleViewTransaction = (id: string) => {
    setSelectedTransactionId(id)
    setDetailModalOpen(true)
  }

  const getStatusBadge = (status: TransactionStatus) => {
    const variants: Record<TransactionStatus, { variant: 'secondary' | 'outline'; label: string }> = {
      CONFIRMED: { variant: 'secondary', label: 'Confirmado' },
      PENDING: { variant: 'outline', label: 'Pendente' },
      CANCELLED: { variant: 'outline', label: 'Cancelado' },
    }

    const { variant, label } = variants[status]
    return <Badge variant={variant}>{label}</Badge>
  }

  const getTypeBadge = (type: TransactionType) => {
    const label = type === 'INCOME' ? 'Receita' : 'Despesa'
    const tone = type === 'INCOME' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
    return <span className={`rounded-full px-3 py-1 text-xs font-medium ${tone}`}>{label}</span>
  }

  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      if (searchTerm) {
        const search = searchTerm.toLowerCase()
        const descriptionMatches = t.description?.toLowerCase().includes(search)
        const clientMatches = t.client?.name?.toLowerCase().includes(search)
        if (!descriptionMatches && !clientMatches) {
          return false
        }
      }
      return true
    })
  }, [transactions, searchTerm])

  const handleClearFilters = () => {
    setSearchTerm('')
    setTypeFilter('')
    setStatusFilter('')
    setDateFrom('')
    setDateTo('')
    setPage(1)
  }

  return (
    <section className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <p className="text-xs font-medium text-slate-600">Movimentações</p>
          <h2 className="text-2xl font-semibold text-slate-900">Transações</h2>
          <p className="text-sm text-slate-600">
            Cadastre, filtre e acompanhe suas movimentações com uma visualização limpa.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => exportTransactions(filteredTransactions)}>
            <Download className="mr-2 h-4 w-4" />
            Exportar
          </Button>
          <Button onClick={() => setModalOpen(true)}>Nova transação</Button>
        </div>
      </div>

      <QuickStats />

      <CreateTransactionModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        onSuccess={handleTransactionCreated}
      />

      <div className="space-y-4 rounded-lg border bg-slate-900 p-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-2">
            <Label htmlFor="search">Buscar</Label>
            <div className="flex items-center gap-2 rounded-md border px-3 py-2">
              <Search className="h-4 w-4 text-slate-500" />
              <Input
                id="search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Descrição ou cliente"
                className="border-0 p-0 focus-visible:ring-0"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="type">Tipo</Label>
            <select
              id="type"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="h-10 w-full rounded-md border px-3 text-sm"
            >
              <option value="">Todos</option>
              <option value="INCOME">Receita</option>
              <option value="EXPENSE">Despesa</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <select
              id="status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-10 w-full rounded-md border px-3 text-sm"
            >
              <option value="">Todos</option>
              <option value="PENDING">Pendente</option>
              <option value="CONFIRMED">Confirmado</option>
              <option value="CANCELLED">Cancelado</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-2">
              <Label htmlFor="dateFrom">De</Label>
              <Input
                id="dateFrom"
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dateTo">Até</Label>
              <Input
                id="dateTo"
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-3 text-sm text-slate-600">
          <span>
            Mostrando {filteredTransactions.length} de {totalCount} transações
          </span>
          <div className="flex flex-wrap gap-2">
            <Button variant="ghost" size="sm" onClick={handleClearFilters}>
              <X className="mr-2 h-4 w-4" />
              Limpar filtros
            </Button>
            <Button size="sm" variant="outline" onClick={() => exportTransactions(filteredTransactions)}>
              Exportar lista
            </Button>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {loading && (
          <div className="flex items-center gap-2 rounded-md border bg-slate-900 px-4 py-6 text-sm text-slate-700">
            <Loader2 className="h-4 w-4 animate-spin" />
            Carregando transações...
          </div>
        )}

        {!loading && filteredTransactions.length === 0 && (
          <div className="rounded-md border bg-slate-900 px-4 py-6 text-center text-sm text-slate-700">
            Nenhuma transação encontrada.
          </div>
        )}

        {!loading && filteredTransactions.length > 0 && (
          <>
            <div className="space-y-2 md:hidden">
              {filteredTransactions.map((transaction) => (
                <div key={transaction.id} className="rounded-md border bg-slate-900 p-4 shadow-sm">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-slate-900">{transaction.description}</p>
                      <p className="text-xs text-slate-600">
                        {new Date(transaction.date).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                    {getTypeBadge(transaction.type)}
                  </div>
                  {transaction.category && (
                    <p className="mt-1 text-xs text-slate-600">{transaction.category}</p>
                  )}
                  <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-slate-700">
                    {getStatusBadge(transaction.status)}
                    <Badge variant="outline">{transaction.subtype.replace('_', ' ')}</Badge>
                    <span className="font-semibold">
                      {transaction.type === 'INCOME' ? '+' : '-'}{formatCurrency(transaction.amount)}
                    </span>
                  </div>
                  <div className="mt-3 flex items-center justify-between text-sm text-slate-700">
                    <span>{transaction.client?.name || 'Sem cliente'}</span>
                    <Button variant="ghost" size="sm" onClick={() => handleViewTransaction(transaction.id)}>
                      Detalhes
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            <div className="overflow-hidden rounded-lg border bg-slate-900 shadow-sm md:block">
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm text-slate-800">
                  <thead className="border-b bg-slate-900/60 text-xs uppercase text-slate-600">
                    <tr>
                      <th className="px-4 py-3">Data</th>
                      <th className="px-4 py-3">Descrição</th>
                      <th className="px-4 py-3">Tipo</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Valor</th>
                      <th className="px-4 py-3">Cliente</th>
                      <th className="px-4 py-3">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTransactions.map((transaction) => (
                      <tr key={transaction.id} className="border-b last:border-b-0">
                        <td className="px-4 py-3 text-slate-700">
                          {new Date(transaction.date).toLocaleDateString('pt-BR')}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-col gap-1">
                            <span className="font-medium text-slate-900">{transaction.description}</span>
                            {transaction.category && (
                              <span className="text-xs text-slate-600">{transaction.category}</span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 space-x-2">
                          {getTypeBadge(transaction.type)}
                          <Badge variant="outline">{transaction.subtype.replace('_', ' ')}</Badge>
                        </td>
                        <td className="px-4 py-3">{getStatusBadge(transaction.status)}</td>
                        <td className="px-4 py-3 font-semibold text-slate-900">
                          {transaction.type === 'INCOME' ? '+' : '-'}{formatCurrency(transaction.amount)}
                        </td>
                        <td className="px-4 py-3 text-slate-700">{transaction.client?.name || '-'}</td>
                        <td className="px-4 py-3">
                          <Button variant="ghost" size="sm" onClick={() => handleViewTransaction(transaction.id)}>
                            Detalhes
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex flex-col items-center gap-3 rounded-md border bg-slate-900 p-4 text-sm text-slate-700 md:flex-row md:justify-between">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              Anterior
            </Button>
            <Button
              variant="outline"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              Próxima
            </Button>
          </div>
          <span>Página {page} de {totalPages}</span>
        </div>
      )}

      <TransactionDetailModal
        open={detailModalOpen}
        onOpenChange={setDetailModalOpen}
        transactionId={selectedTransactionId}
        onUpdated={fetchTransactions}
      />
    </section>
  )
}
