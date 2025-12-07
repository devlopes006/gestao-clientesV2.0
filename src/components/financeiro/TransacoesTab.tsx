'use client'

import AdvancedFilters from '@/components/financeiro/AdvancedFilters'
import { QuickStats } from '@/components/financeiro/QuickStats'
import { TransactionDetailModal } from '@/components/financeiro/TransactionDetailModal'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { exportTransactions } from '@/lib/export-utils'
import { formatCurrency } from '@/lib/utils'
import { TransactionStatus, TransactionSubtype, TransactionType } from '@prisma/client'
import { AnimatePresence, motion } from 'framer-motion'
import {
  AlertCircle,
  Calendar,
  DollarSign,
  Download,
  Plus,
  RefreshCw,
  TrendingDown,
  TrendingUp
} from 'lucide-react'
import { useSearchParams } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'
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

  // Filtros
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  // Initialize filters from URL (status, type, dateFrom, dateTo)
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
      // ApiResponseHandler retorna { data: { transactions, meta } } ou { data: [] }
      const data = result.data || result
      setTransactions(Array.isArray(data) ? data : (data.transactions || []))
      const meta = result.meta || data.meta || {}
      setTotalPages(meta.totalPages || result.totalPages || 1)
      setTotalCount(meta.total || result.total || 0)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
    } finally {
      setLoading(false)
    }
  }, [page, typeFilter, statusFilter, dateFrom, dateTo])

  useEffect(() => {
    fetchTransactions()
  }, [fetchTransactions])



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
    const variants: Record<TransactionStatus, { variant: 'default' | 'secondary' | 'destructive' | 'outline', label: string }> = {
      CONFIRMED: { variant: 'default', label: 'Confirmado' },
      PENDING: { variant: 'secondary', label: 'Pendente' },
      CANCELLED: { variant: 'destructive', label: 'Cancelado' },
    }

    const config = variants[status] || variants.PENDING
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  const getTypeBadge = (type: TransactionType) => {
    if (type === 'INCOME') {
      return <Badge className="bg-green-100 text-green-800">Receita</Badge>
    }
    return <Badge className="bg-red-100 text-red-800">Despesa</Badge>
  }

  const filteredTransactions = transactions.filter(t =>
    !searchTerm ||
    t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.client?.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-green-50/30 to-emerald-50/40 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <div className="page-shell py-2 sm:py-6 lg:py-8 space-y-2 sm:space-y-6 lg:space-y-8">

        {/* Header */}
        <motion.div
          className="relative overflow-hidden rounded-xl sm:rounded-3xl bg-gradient-to-br from-green-600 via-emerald-600 to-teal-600 p-3 sm:p-6 lg:p-8 shadow-lg sm:shadow-xl lg:shadow-2xl shadow-green-500/25"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-400/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

          <div className="relative z-10 flex flex-col gap-3 sm:gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-2 sm:space-y-3">
              <motion.div
                className="inline-flex items-center gap-1.5 sm:gap-2 rounded-full bg-white/20 backdrop-blur-sm px-2.5 sm:px-3 lg:px-4 py-1 sm:py-1.5 lg:py-2 text-xs font-bold text-white ring-1 ring-white/30 shadow-lg"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                <span className="h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full bg-white animate-pulse shadow-lg shadow-white/50" />
                Gestão Financeira
              </motion.div>
              <div>
                <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-black text-white leading-tight tracking-tight">
                  Transações
                </h1>
                <p className="text-xs sm:text-sm md:text-base text-white/90 font-medium mt-1 sm:mt-2">
                  Histórico completo de movimentações financeiras
                </p>
              </div>
            </div>
            <motion.div
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
            >
              <Button onClick={() => setModalOpen(true)} className="shadow-lg bg-white text-green-600 hover:bg-white/90 font-bold">
                <Plus className="h-4 w-4 sm:h-5 sm:w-5" />
                <span className="ml-2">Nova Transação</span>
              </Button>
            </motion.div>
          </div>
        </motion.div>

        {/* KPIs */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <QuickStats />
        </motion.section>

        {/* Modal */}
        <CreateTransactionModal
          open={modalOpen}
          onOpenChange={setModalOpen}
          onSuccess={handleTransactionCreated}
        />

        {/* Filtros Avançados */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <AdvancedFilters
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            dateFrom={dateFrom}
            onDateFromChange={setDateFrom}
            dateTo={dateTo}
            onDateToChange={setDateTo}
            statusFilter={statusFilter}
            onStatusChange={setStatusFilter}
            statusOptions={[
              { value: 'PENDING', label: 'Pendente' },
              { value: 'CONFIRMED', label: 'Confirmado' },
              { value: 'CANCELLED', label: 'Cancelado' },
            ]}
            onClear={() => {
              setSearchTerm('')
              setTypeFilter('')
              setStatusFilter('')
              setDateFrom('')
              setDateTo('')
              setPage(1)
            }}
          >
            <motion.div className="space-y-2" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }}>
              <Label htmlFor="typeFilter" className="font-semibold">Tipo</Label>
              <select
                id="typeFilter"
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="w-full px-3 py-2 border rounded-md border-green-200 focus:border-green-500 focus:ring-green-500 dark:border-green-800 dark:bg-slate-900"
                aria-label="Filtrar por tipo"
              >
                <option value="">Todos</option>
                <option value="INCOME">Receita</option>
                <option value="EXPENSE">Despesa</option>
              </select>
            </motion.div>
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button variant="outline" className="w-full gap-2 border-green-200 hover:border-green-500 dark:border-green-800" onClick={() => exportTransactions(filteredTransactions)}>
                <Download className="h-4 w-4" />
                Exportar ({filteredTransactions.length})
              </Button>
            </motion.div>
          </AdvancedFilters>
        </motion.section>

        {/* Lista de Transações */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 shadow-lg sm:shadow-xl lg:shadow-2xl shadow-slate-900/10 hover-raise transition-base">
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-full blur-3xl" />

            <div className="relative z-10 p-4 sm:p-6 lg:p-8 border-b border-slate-200/50 dark:border-slate-800/50 bg-gradient-to-br from-slate-50/50 to-transparent dark:from-slate-800/30 dark:to-transparent">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="p-2 sm:p-2.5 lg:p-3 rounded-xl sm:rounded-2xl bg-gradient-to-br from-green-500 to-emerald-500 shadow-lg shadow-green-500/25">
                  <DollarSign className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl lg:text-2xl font-black text-slate-900 dark:text-white">Transações Registradas</h2>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-0.5">
                    Mostrando {transactions.length} de {totalCount} transações {totalPages > 1 && `(Página ${page} de ${totalPages})`}
                  </p>
                </div>
              </div>
            </div>

            <div className="relative z-10 p-4 sm:p-6 lg:p-8">
              {error && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
                  <Alert variant="destructive" className="mb-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                </motion.div>
              )}            {loading ? (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-12">
                  <div className="inline-block">
                    <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity }}>
                      <RefreshCw className="h-8 w-8 text-green-600" />
                    </motion.div>
                  </div>
                  <p className="text-muted-foreground mt-2">Carregando transações...</p>
                </motion.div>
              ) : filteredTransactions.length === 0 ? (
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-12 text-muted-foreground">
                  <DollarSign className="h-16 w-16 mx-auto mb-4 opacity-20" />
                  <p className="text-lg font-medium">Nenhuma transação encontrada</p>
                  <p className="text-sm mt-1">Crie uma nova transação para começar</p>
                </motion.div>
              ) : (
                <div className="space-y-3">
                  <AnimatePresence>
                    {filteredTransactions.map((transaction, index) => (
                      <motion.div
                        key={transaction.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ delay: index * 0.05 }}
                        className={`responsive-list-item border rounded-xl bg-gradient-to-r from-white to-slate-50 dark:from-slate-950 dark:to-slate-900 hover:shadow-lg transition-all cursor-pointer group ${transaction.type === 'INCOME'
                          ? 'hover:from-green-50 hover:to-emerald-50 dark:hover:from-green-950/30 dark:hover:to-emerald-950/30 hover:border-green-200 dark:hover:border-green-800'
                          : 'hover:from-red-50 hover:to-orange-50 dark:hover:from-red-950/30 dark:hover:to-orange-950/30 hover:border-red-200 dark:hover:border-red-800'
                          }`}
                        onClick={() => handleViewTransaction(transaction.id)}
                        whileHover={{ y: -2 }}
                      >
                        <div className="responsive-flex-container">
                          <motion.div
                            className={`p-2.5 sm:p-3 rounded-full group-hover:scale-110 shrink-0 ${transaction.type === 'INCOME'
                              ? 'bg-gradient-to-br from-green-100 to-emerald-200 dark:from-green-900/40 dark:to-emerald-800/40'
                              : 'bg-gradient-to-br from-red-100 to-orange-200 dark:from-red-900/40 dark:to-orange-800/40'
                              }`}
                            whileHover={{ scale: 1.1 }}
                          >
                            {transaction.type === 'INCOME' ? (
                              <TrendingUp className="responsive-icon text-green-600 dark:text-green-400" />
                            ) : (
                              <TrendingDown className="responsive-icon text-red-600 dark:text-red-400" />
                            )}
                          </motion.div>

                          <div className="responsive-content">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-semibold responsive-text">{transaction.description}</p>
                              {getTypeBadge(transaction.type)}
                              {getStatusBadge(transaction.status)}
                            </div>
                            <div className="responsive-meta text-muted-foreground mt-1.5 sm:mt-2">
                              {transaction.client?.name && (
                                <span className="flex items-center gap-1 px-2 py-0.5 sm:py-1 bg-slate-100 dark:bg-slate-800 rounded-full shrink-0">
                                  <DollarSign className="h-3 w-3 shrink-0" />
                                  <span className="truncate max-w-[100px] sm:max-w-none">{transaction.client.name}</span>
                                </span>
                              )}
                              <span className="flex items-center gap-1 shrink-0">
                                <Calendar className="h-3 w-3" />
                                {new Date(transaction.date).toLocaleDateString('pt-BR')}
                              </span>
                              {transaction.category && (
                                <Badge variant="outline" className="responsive-badge bg-gradient-to-r from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700">
                                  {transaction.category}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="responsive-actions">
                          <div className="text-left sm:text-right shrink-0">
                            <div
                              className={`responsive-value bg-gradient-to-r ${transaction.type === 'INCOME' ? 'from-green-600 to-emerald-600' : 'from-red-600 to-orange-600'
                                } bg-clip-text text-transparent`}
                            >
                              {transaction.type === 'INCOME' ? '+' : '-'}{formatCurrency(transaction.amount)}
                            </div>
                            <div className="responsive-badge text-muted-foreground">
                              {transaction.subtype.replace('_', ' ')}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}

              {/* Paginação */}
              {totalPages > 1 && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center justify-between gap-2 mt-6 pt-6 border-t">
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button
                      variant="outline"
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                    >
                      Anterior
                    </Button>
                  </motion.div>
                  <span className="text-sm font-semibold text-center py-1">
                    Página {page} de {totalPages}
                  </span>
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button
                      variant="outline"
                      onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                    >
                      Próxima
                    </Button>
                  </motion.div>
                </motion.div>
              )}
            </div>
          </div>
        </motion.section>

        {/* Modals */}
        <CreateTransactionModal
          open={modalOpen}
          onOpenChange={setModalOpen}
          onSuccess={handleTransactionCreated}
        />

        <TransactionDetailModal
          open={detailModalOpen}
          onOpenChange={setDetailModalOpen}
          transactionId={selectedTransactionId}
          onUpdated={fetchTransactions}
        />
      </div>
    </div>
  )
}
