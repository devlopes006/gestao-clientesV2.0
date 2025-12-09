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
    const variants: Record<TransactionStatus, { variant: 'outline' | 'default'; label: string }> = {
      CONFIRMED: { variant: 'default', label: 'Confirmado' },
      PENDING: { variant: 'outline', label: 'Pendente' },
      CANCELLED: { variant: 'outline', label: 'Cancelado' },
    }

    const config = variants[status] || variants.PENDING
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  const getTypeBadge = (type: TransactionType) => {
    if (type === 'INCOME') {
      return <Badge className="bg-emerald-100 text-emerald-800">Receita</Badge>
    }
    return <Badge className="bg-rose-100 text-rose-800">Despesa</Badge>
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
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Movimentações</p>
          <h2 className="text-2xl font-semibold">Transações</h2>
          <p className="text-sm text-muted-foreground">Crie, acompanhe e exporte suas movimentações financeiras.</p>
        </div>
        <div className="flex gap-2">
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

      <div className="space-y-4 rounded-lg border bg-card p-4">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-2">
            <Label htmlFor="search">Buscar</Label>
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                id="search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Descrição ou cliente"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="type">Tipo</Label>
            <select
              id="type"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="h-10 rounded-md border px-3 text-sm"
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
              className="h-10 rounded-md border px-3 text-sm"
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

        <div className="flex flex-wrap items-center justify-between gap-3 rounded-md bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
          <span>
            Mostrando {filteredTransactions.length} de {totalCount} transações
          </span>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={handleClearFilters}>
              <X className="mr-2 h-4 w-4" />
              Limpar filtros
            </Button>
            <Button size="sm" variant="secondary" onClick={() => exportTransactions(filteredTransactions)}>
              Exportar lista
            </Button>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border bg-card">
        {error && (
          <Alert variant="destructive" className="m-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {loading ? (
          <div className="flex items-center justify-center gap-2 p-8 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Carregando transações...
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">
            Nenhuma transação encontrada.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
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
                  <tr key={transaction.id} className="border-t">
                    <td className="px-4 py-3">{new Date(transaction.date).toLocaleDateString('pt-BR')}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-1">
                        <span className="font-medium">{transaction.description}</span>
                        {transaction.category && (
                          <span className="text-xs text-muted-foreground">{transaction.category}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 space-x-2">
                      {getTypeBadge(transaction.type)}
                      <Badge variant="outline">{transaction.subtype.replace('_', ' ')}</Badge>
                    </td>
                    <td className="px-4 py-3">{getStatusBadge(transaction.status)}</td>
                    <td className="px-4 py-3 font-semibold">
                      {transaction.type === 'INCOME' ? '+' : '-'}{formatCurrency(transaction.amount)}
                    </td>
                    <td className="px-4 py-3">{transaction.client?.name || '-'}</td>
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
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between gap-3">
          <Button
            variant="outline"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            Anterior
          </Button>
          <span className="text-sm text-muted-foreground">Página {page} de {totalPages}</span>
          <Button
            variant="outline"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
          >
            Próxima
          </Button>
        </div>
      )}

      <TransactionDetailModal
        open={detailModalOpen}
        onOpenChange={setDetailModalOpen}
        transactionId={selectedTransactionId}
        onUpdated={fetchTransactions}
      />
    </div>
  )
}
