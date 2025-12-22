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
    const variants: Record<TransactionStatus, { styles: string; label: string }> = {
      CONFIRMED: {
        styles: 'bg-gradient-to-r from-emerald-500/20 to-green-500/20 text-emerald-300 border border-emerald-500/30 shadow-sm shadow-emerald-500/20',
        label: 'Confirmado'
      },
      PENDING: {
        styles: 'bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-300 border border-amber-500/30 shadow-sm shadow-amber-500/20',
        label: 'Pendente'
      },
      CANCELLED: {
        styles: 'bg-gradient-to-r from-slate-500/20 to-gray-500/20 text-slate-300 border border-slate-500/30 shadow-sm shadow-slate-500/20',
        label: 'Cancelado'
      },
    }

    const { styles, label } = variants[status]
    return <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold ${styles}`}>{label}</span>
  }

  const getTypeBadge = (type: TransactionType) => {
    const label = type === 'INCOME' ? 'Receita' : 'Despesa'
    const styles = type === 'INCOME'
      ? 'bg-gradient-to-r from-emerald-500/20 to-green-500/20 text-emerald-300 border border-emerald-500/30 shadow-sm shadow-emerald-500/20'
      : 'bg-gradient-to-r from-rose-500/20 to-red-500/20 text-rose-300 border border-rose-500/30 shadow-sm shadow-rose-500/20'
    return <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold ${styles}`}>{label}</span>
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
    <section className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <p className="text-xs font-bold text-emerald-400 uppercase tracking-widest">Movimentações</p>
          <h2 className="text-3xl font-black bg-gradient-to-r from-emerald-400 via-green-400 to-teal-400 bg-clip-text text-transparent drop-shadow-lg">Transações</h2>
          <p className="text-sm text-slate-400 max-w-2xl">
            Cadastre, filtre e acompanhe suas movimentações financeiras com controle total.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button
            variant="outline"
            onClick={() => exportTransactions(filteredTransactions)}
            className="border-slate-700 bg-slate-900/50 hover:bg-slate-800 text-slate-200"
          >
            <Download className="mr-2 h-4 w-4" />
            Exportar
          </Button>
          <Button
            onClick={() => setModalOpen(true)}
            className="bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 shadow-lg shadow-emerald-500/30"
          >
            Nova transação
          </Button>
        </div>
      </div>

      <QuickStats />

      <CreateTransactionModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        onSuccess={handleTransactionCreated}
      />

      <div className="rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-slate-900 via-emerald-950/10 to-slate-900/90 backdrop-blur-xl p-6 shadow-2xl">
        <div className="bg-gradient-to-r from-emerald-500 via-green-500 to-teal-500 h-1 rounded-t-2xl absolute top-0 left-0 right-0" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-5">
          <div className="space-y-2">
            <Label htmlFor="search" className="text-slate-300 font-semibold">Buscar</Label>
            <div className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900/50 px-3 py-2.5 focus-within:border-emerald-500/50 focus-within:ring-2 focus-within:ring-emerald-500/20 transition-all">
              <Search className="h-4 w-4 text-slate-400" />
              <Input
                id="search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Descrição ou cliente"
                className="border-0 p-0 bg-transparent text-slate-100 placeholder:text-slate-500 focus-visible:ring-0"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="type" className="text-slate-300 font-semibold">Tipo</Label>
            <select
              id="type"
              title="Filtrar por tipo de transação"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="h-11 w-full rounded-xl border border-slate-700 bg-slate-900/50 px-4 text-sm text-slate-100 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
            >
              <option value="" className="bg-slate-900">Todos</option>
              <option value="INCOME" className="bg-slate-900">Receita</option>
              <option value="EXPENSE" className="bg-slate-900">Despesa</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="status" className="text-slate-300 font-semibold">Status</Label>
            <select
              id="status"
              title="Filtrar por status de transação"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-11 w-full rounded-xl border border-slate-700 bg-slate-900/50 px-4 text-sm text-slate-100 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
            >
              <option value="" className="bg-slate-900">Todos</option>
              <option value="PENDING" className="bg-slate-900">Pendente</option>
              <option value="CONFIRMED" className="bg-slate-900">Confirmado</option>
              <option value="CANCELLED" className="bg-slate-900">Cancelado</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="dateFrom" className="text-slate-300 font-semibold">De</Label>
              <Input
                id="dateFrom"
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="h-11 rounded-xl border-slate-700 bg-slate-900/50 text-slate-100 focus:border-emerald-500 focus:ring-emerald-500/20"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dateTo" className="text-slate-300 font-semibold">Até</Label>
              <Input
                id="dateTo"
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="h-11 rounded-xl border-slate-700 bg-slate-900/50 text-slate-100 focus:border-emerald-500 focus:ring-emerald-500/20"
              />
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-slate-700/30 pt-4">
          <span className="text-sm font-semibold text-slate-300">
            Mostrando <span className="text-emerald-400">{filteredTransactions.length}</span> de <span className="text-emerald-400">{totalCount}</span> transações
          </span>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearFilters}
              className="text-slate-300 hover:text-slate-100 hover:bg-slate-800"
            >
              <X className="mr-2 h-4 w-4" />
              Limpar filtros
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => exportTransactions(filteredTransactions)}
              className="border-slate-700 bg-slate-900/50 hover:bg-slate-800 text-slate-200"
            >
              Exportar lista
            </Button>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {error && (
          <Alert variant="destructive" className="border-red-500/30 bg-red-500/10">
            <AlertDescription className="text-slate-100">{error}</AlertDescription>
          </Alert>
        )}

        {loading && (
          <div className="flex items-center gap-3 rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 to-slate-900/90 backdrop-blur-xl px-6 py-8 shadow-xl">
            <Loader2 className="h-5 w-5 animate-spin text-emerald-400" />
            <span className="text-sm font-semibold text-slate-200">Carregando transações...</span>
          </div>
        )}

        {!loading && filteredTransactions.length === 0 && (
          <div className="rounded-2xl border border-slate-700/50 bg-gradient-to-br from-slate-900/50 to-slate-800/50 backdrop-blur-xl px-6 py-12 text-center shadow-xl">
            <p className="text-sm font-semibold text-slate-400">Nenhuma transação encontrada.</p>
            <p className="text-xs text-slate-500 mt-1">Tente ajustar os filtros ou criar uma nova transação.</p>
          </div>
        )}

        {!loading && filteredTransactions.length > 0 && (
          <>
            <div className="space-y-3 md:hidden">
              {filteredTransactions.map((transaction) => (
                <div key={transaction.id} className="group rounded-2xl border border-slate-700/50 bg-gradient-to-br from-slate-900/80 to-slate-800/80 backdrop-blur-xl p-5 shadow-lg hover:shadow-xl hover:border-emerald-500/30 transition-all duration-300">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="space-y-1 flex-1">
                      <p className="text-sm font-bold text-slate-100 line-clamp-1">{transaction.description}</p>
                      <p className="text-xs text-slate-400">
                        {new Date(transaction.date).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                    {getTypeBadge(transaction.type)}
                  </div>
                  {transaction.category && (
                    <p className="text-xs text-slate-400 mb-3">{transaction.category}</p>
                  )}
                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    {getStatusBadge(transaction.status)}
                    <Badge variant="outline" className="text-xs border-slate-600 text-slate-300">{transaction.subtype.replace('_', ' ')}</Badge>
                  </div>
                  <div className="flex items-center justify-between pt-3 border-t border-slate-700/50">
                    <div>
                      <span className="text-xs text-slate-400 block mb-0.5">Valor</span>
                      <span className={`text-lg font-black ${transaction.type === 'INCOME' ? 'text-emerald-400' : 'text-rose-400'
                        }`}>
                        {transaction.type === 'INCOME' ? '+' : '-'}{formatCurrency(transaction.amount)}
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleViewTransaction(transaction.id)}
                      className="text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10"
                    >
                      Detalhes
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            <div className="hidden md:block overflow-hidden rounded-2xl border border-emerald-500/20 bg-gradient-to-b from-slate-900 to-slate-900/80 shadow-2xl backdrop-blur-xl">
              <div className="bg-gradient-to-r from-emerald-500 via-green-500 to-teal-500 h-1" />
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="border-b border-slate-700/50 bg-gradient-to-r from-slate-800/80 to-slate-900/80">
                    <tr>
                      <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider text-slate-300">Data</th>
                      <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider text-slate-300">Descrição</th>
                      <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider text-slate-300">Tipo</th>
                      <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider text-slate-300">Status</th>
                      <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider text-slate-300">Valor</th>
                      <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider text-slate-300">Cliente</th>
                      <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider text-slate-300">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTransactions.map((transaction) => (
                      <tr key={transaction.id} className="group border-b border-slate-700/30 last:border-b-0 hover:bg-gradient-to-r hover:from-emerald-500/5 hover:to-green-500/5 transition-all duration-300 hover:shadow-lg">
                        <td className="px-5 py-4 text-sm text-slate-300 group-hover:text-slate-200 transition-colors">
                          {new Date(transaction.date).toLocaleDateString('pt-BR')}
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex flex-col gap-1">
                            <span className="font-semibold text-slate-100 group-hover:text-emerald-400 transition-colors line-clamp-1">{transaction.description}</span>
                            {transaction.category && (
                              <span className="text-xs text-slate-400 group-hover:text-slate-300 transition-colors">{transaction.category}</span>
                            )}
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex flex-wrap items-center gap-2">
                            {getTypeBadge(transaction.type)}
                            <Badge variant="outline" className="text-xs border-slate-600 text-slate-300 group-hover:border-emerald-500/30 transition-colors">{transaction.subtype.replace('_', ' ')}</Badge>
                          </div>
                        </td>
                        <td className="px-5 py-4">{getStatusBadge(transaction.status)}</td>
                        <td className="px-5 py-4">
                          <span className={`text-base font-black whitespace-nowrap ${transaction.type === 'INCOME' ? 'text-emerald-400 group-hover:text-emerald-300' : 'text-rose-400 group-hover:text-rose-300'
                            } transition-colors`}>
                            {transaction.type === 'INCOME' ? '+' : '-'}{formatCurrency(transaction.amount)}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-sm text-slate-300 group-hover:text-slate-200 transition-colors">{transaction.client?.name || '-'}</td>
                        <td className="px-5 py-4">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewTransaction(transaction.id)}
                            className="text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 transition-all duration-300"
                          >
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
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-slate-700/50 bg-gradient-to-br from-slate-900/90 to-slate-800/90 backdrop-blur-xl p-4 text-sm text-slate-300 md:flex-row md:justify-between shadow-lg">
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
