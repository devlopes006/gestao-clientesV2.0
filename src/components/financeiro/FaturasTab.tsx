'use client'

import { CreateInvoiceModal } from '@/components/financeiro/CreateInvoiceModal'
import { InvoiceDetailModal } from '@/components/financeiro/InvoiceDetailModal'
import { QuickStats } from '@/components/financeiro/QuickStats'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { exportInvoices } from '@/lib/export-utils'
import { formatCurrency, formatDate } from '@/lib/utils'
import { InvoiceStatus } from '@prisma/client'
import { AnimatePresence, motion } from 'framer-motion'
import {
  AlertCircle,
  Calendar,
  CheckCircle,
  Clock,
  Download,
  FileText,
  Plus,
  RefreshCw,
  TrendingUp,
  Users,
  XCircle
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

interface Invoice {
  id: string
  number: string
  clientId: string
  client?: {
    id: string
    name: string
    email?: string | null
  }
  status: InvoiceStatus
  total: number
  dueDate: string
  paidAt: string | null
  createdAt: string
  items: Array<{
    description: string
    total: number
    quantity: number
  }>
}

export function FaturasTab() {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [generating, setGenerating] = useState(false)
  const [generationReport, setGenerationReport] = useState<null | {
    successCount: number
    blockedCount: number
    errorCount: number
    summary?: unknown
    success?: Array<{ id: string; number: string; clientName?: string; total: number; dueDate: string; installmentInfo?: unknown }>
    blocked?: Array<{ clientId: string; clientName: string; reason: string; type?: string }>
    errors?: Array<{ clientId: string; clientName: string; error: string; type?: string }>
  }>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [detailModalOpen, setDetailModalOpen] = useState(false)
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | undefined>()

  const [statusFilter, setStatusFilter] = useState<string>('')
  const [searchTerm, setSearchTerm] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  useEffect(() => {
    fetchInvoices()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, page])

  const fetchInvoices = async () => {
    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams({
        ...(statusFilter && { status: statusFilter }),
        page: page.toString(),
        limit: '20',
      })

      const response = await fetch(`/api/invoices?${params}`)

      if (!response.ok) throw new Error('Erro ao carregar faturas')

      const result = await response.json()
      // ApiResponseHandler.success retorna { data: { invoices: [], meta: {} } }
      const data = result.data || result
      setInvoices(Array.isArray(data.invoices) ? data.invoices : [])
      setTotalPages(data.meta?.totalPages || 1)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
    } finally {
      setLoading(false)
    }
  }

  const handleGenerateMonthly = async () => {
    if (!confirm('Deseja gerar faturas mensais para todos os clientes ativos?')) return

    try {
      setGenerating(true)
      setError(null)
      toast.loading('Gerando faturas mensais...')

      const response = await fetch('/api/invoices/generate-monthly', { method: 'POST' })
      if (!response.ok) throw new Error('Erro ao gerar faturas')

      const result = await response.json()
      setGenerationReport(result)
      toast.success(`✅ ${result.successCount} faturas geradas com sucesso!`, {
        description: `Bloqueadas: ${result.blockedCount} | Erros: ${result.errorCount}`
      })
      fetchInvoices()
    } catch (err) {
      toast.error('Erro ao gerar faturas', {
        description: err instanceof Error ? err.message : 'Erro desconhecido'
      })
      setError(err instanceof Error ? err.message : 'Erro ao gerar faturas')
    } finally {
      setGenerating(false)
    }
  }

  const handleApprovePayment = async (invoiceId: string) => {
    if (!confirm('Confirmar pagamento desta fatura?')) return

    try {
      toast.loading('Processando pagamento...')
      const response = await fetch(`/api/invoices/${invoiceId}/approve-payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paidAt: new Date().toISOString() }),
      })

      if (!response.ok) throw new Error('Erro ao aprovar pagamento')
      toast.success('Pagamento aprovado com sucesso!')
      fetchInvoices()
    } catch (err) {
      toast.error('Erro ao aprovar pagamento', {
        description: err instanceof Error ? err.message : 'Erro desconhecido'
      })
    }
  }

  const handleCancelInvoice = async (invoiceId: string) => {
    const reason = prompt('Motivo do cancelamento:')
    if (!reason) return

    try {
      toast.loading('Cancelando fatura...')
      const response = await fetch(`/api/invoices/${invoiceId}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      })

      if (!response.ok) throw new Error('Erro ao cancelar fatura')
      toast.success('Fatura cancelada com sucesso!')
      fetchInvoices()
    } catch (err) {
      toast.error('Erro ao cancelar fatura', {
        description: err instanceof Error ? err.message : 'Erro desconhecido'
      })
    }
  }

  const handleInvoiceCreated = () => {
    setModalOpen(false)
    fetchInvoices()
  }

  const handleViewInvoice = (id: string) => {
    setSelectedInvoiceId(id)
    setDetailModalOpen(true)
  }

  const getStatusBadge = (status: InvoiceStatus) => {
    const configs: Record<InvoiceStatus, { icon: typeof Clock, label: string, className: string }> = {
      DRAFT: { icon: Clock, label: 'Rascunho', className: 'bg-gray-100 text-gray-800' },
      OPEN: { icon: Clock, label: 'Em Aberto', className: 'bg-yellow-100 text-yellow-800' },
      PAID: { icon: CheckCircle, label: 'Pago', className: 'bg-green-100 text-green-800' },
      OVERDUE: { icon: AlertCircle, label: 'Vencido', className: 'bg-red-100 text-red-800' },
      CANCELLED: { icon: XCircle, label: 'Cancelado', className: 'bg-gray-100 text-gray-800' },
    }

    const config = configs[status] || configs.OPEN
    const Icon = config.icon

    return (
      <Badge className={config.className}>
        <Icon className="mr-1 h-3 w-3" />
        {config.label}
      </Badge>
    )
  }

  const filteredInvoices = invoices.filter(inv =>
    !searchTerm ||
    inv.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    inv.client?.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/30 to-pink-50/40 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <div className="page-shell py-2 sm:py-6 lg:py-8 space-y-2 sm:space-y-6 lg:space-y-8">

        {/* Header */}
        <motion.div
          className="relative overflow-hidden rounded-xl sm:rounded-3xl bg-gradient-to-br from-purple-600 via-pink-600 to-fuchsia-600 p-3 sm:p-6 lg:p-8 shadow-lg sm:shadow-xl lg:shadow-2xl shadow-purple-500/25"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-pink-400/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

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
                  Faturas
                </h1>
                <p className="text-xs sm:text-sm md:text-base text-white/90 font-medium mt-1 sm:mt-2">
                  Gestão de faturas e cobranças
                </p>
              </div>
            </div>
            <motion.div
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
              className="flex gap-2"
            >
              <Button variant="secondary" onClick={handleGenerateMonthly} disabled={generating} className="shadow-lg bg-white/90 hover:bg-white font-bold">
                {generating ? <RefreshCw className="h-4 w-4 sm:h-5 sm:w-5 animate-spin" /> : <FileText className="h-4 w-4 sm:h-5 sm:w-5" />}
                <span className="ml-2">Gerar Mensais</span>
              </Button>
              <Button onClick={() => setModalOpen(true)} className="shadow-lg bg-white text-purple-600 hover:bg-white/90 font-bold">
                <Plus className="h-4 w-4 sm:h-5 sm:w-5" />
                <span className="ml-2">Nova Fatura</span>
              </Button>
            </motion.div>
          </div>

          {generationReport && (
            <div className="relative z-10 mt-4 rounded-xl border border-white/20 bg-white/10 backdrop-blur-sm p-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
                <div className="font-semibold text-white">Resultado da Geração Mensal</div>
                <div className="text-sm text-white/80">
                  Geradas: {generationReport.successCount} • Bloqueadas: {generationReport.blockedCount} • Erros: {generationReport.errorCount}
                </div>
              </div>
              {generationReport.blocked && generationReport.blocked.length > 0 && (
                <div className="mt-2">
                  <div className="text-sm font-medium mb-1 text-white/90">Bloqueadas (motivos):</div>
                  <div className="grid md:grid-cols-2 gap-2">
                    {Object.entries(
                      generationReport.blocked.reduce<Record<string, Array<{ clientName: string; reason: string }>>>((acc, b) => {
                        const key = b.type || b.reason
                        if (!acc[key]) acc[key] = []
                        acc[key].push({ clientName: b.clientName, reason: b.reason })
                        return acc
                      }, {})
                    ).map(([reasonKey, items]) => (
                      <div key={reasonKey} className="rounded-md border border-white/20 p-2 bg-white/5">
                        <div className="text-xs font-semibold mb-1 text-white">{reasonKey}</div>
                        <div className="text-xs text-white/70">
                          {items.slice(0, 5).map((i, idx) => (
                            <span key={idx}>{i.clientName}{idx < Math.min(items.length, 5) - 1 ? ', ' : ''}</span>
                          ))}
                          {items.length > 5 && <span> e mais {items.length - 5}…</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {generationReport.errors && generationReport.errors.length > 0 && (
                <div className="mt-3">
                  <div className="text-sm font-medium mb-1 text-white/90">Erros:</div>
                  <ul className="text-xs text-red-300 list-disc pl-5">
                    {generationReport.errors.slice(0, 5).map((e, idx) => (
                      <li key={idx}>{e.clientName}: {e.error}</li>
                    ))}
                    {generationReport.errors.length > 5 && (
                      <li>… e mais {generationReport.errors.length - 5}</li>
                    )}
                  </ul>
                </div>
              )}
            </div>
          )}
        </motion.div>

        {/* KPIs */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <QuickStats />
        </motion.section>

        {/* Filtros Avançados */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 shadow-lg sm:shadow-xl hover-raise transition-base">
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-full blur-3xl" />

            <div className="relative z-10 p-4 sm:p-6 border-b border-slate-200/50 dark:border-slate-800/50 bg-gradient-to-br from-slate-50/50 to-transparent dark:from-slate-800/30 dark:to-transparent">
              <div className="flex items-center gap-3">
                <div className="p-2 sm:p-2.5 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 shadow-lg shadow-purple-500/25">
                  <TrendingUp className="h-5 w-5 text-white" />
                </div>
                <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">Filtros Avançados</h2>
              </div>
            </div>

            <div className="relative z-10 p-4 sm:p-6">
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <motion.div className="space-y-2" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
                    <Label htmlFor="search" className="font-semibold">Buscar</Label>
                    <Input
                      id="search"
                      placeholder="Número ou cliente..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="h-11 border-purple-200 focus:border-purple-500 focus:ring-purple-500 dark:border-purple-800"
                    />
                  </motion.div>
                  <motion.div className="space-y-2" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }}>
                    <Label htmlFor="status" className="font-semibold">Status</Label>
                    <select
                      id="status"
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="w-full h-11 px-3 py-2 border rounded-md border-purple-200 focus:border-purple-500 focus:ring-purple-500 dark:border-purple-800 dark:bg-slate-900"
                      aria-label="Filtrar por status"
                    >
                      <option value="">Todos</option>
                      <option value="DRAFT">Rascunho</option>
                      <option value="OPEN">Em Aberto</option>
                      <option value="PAID">Pago</option>
                      <option value="OVERDUE">Vencido</option>
                      <option value="CANCELLED">Cancelado</option>
                    </select>
                  </motion.div>
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="flex-1">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSearchTerm('')
                        setStatusFilter('')
                      }}
                      className="w-full border-purple-200 hover:border-purple-500 dark:border-purple-800"
                    >
                      Limpar Filtros
                    </Button>
                  </motion.div>
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="flex-1">
                    <Button
                      variant="outline"
                      onClick={() =>
                        exportInvoices(
                          filteredInvoices.map((inv) => ({
                            number: inv.number,
                            clientName: inv.client?.name || null,
                            createdAt: inv.createdAt,
                            dueDate: inv.dueDate,
                            totalAmount: inv.total,
                            status: inv.status,
                            paidAt: inv.paidAt,
                          }))
                        )
                      }
                      className="w-full gap-2 border-purple-200 hover:border-purple-500 dark:border-purple-800"
                    >
                      <Download className="h-4 w-4" />
                      Exportar ({filteredInvoices.length})
                    </Button>
                  </motion.div>
                </div>
              </div>
            </div>
          </div>
        </motion.section>

        {/* Lista de Faturas */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 shadow-lg sm:shadow-xl lg:shadow-2xl shadow-slate-900/10">
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-full blur-3xl" />

            <div className="relative z-10 p-4 sm:p-6 lg:p-8 border-b border-slate-200/50 dark:border-slate-800/50 bg-gradient-to-br from-slate-50/50 to-transparent dark:from-slate-800/30 dark:to-transparent">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="p-2 sm:p-2.5 lg:p-3 rounded-xl sm:rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 shadow-lg shadow-purple-500/25">
                  <FileText className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl lg:text-2xl font-black text-slate-900 dark:text-white">Faturas Registradas</h2>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-0.5">
                    Mostrando {filteredInvoices.length} de {invoices.length} faturas • Página {page} de {totalPages}
                  </p>
                </div>
              </div>
            </div>

            <div className="relative z-10 p-4 sm:p-6 lg:p-8">
              <div className="flex justify-between items-center gap-3 mb-6 p-4 bg-gradient-to-r from-purple-50 via-pink-50 to-fuchsia-50 dark:from-purple-950/20 dark:via-pink-950/20 dark:to-fuchsia-950/20 rounded-lg border border-purple-200 dark:border-purple-800">
                <motion.div className="text-sm font-semibold text-purple-600 dark:text-purple-400" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  Página {page} de {totalPages}
                </motion.div>
                <div className="flex items-center gap-3">
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="border-purple-200 hover:border-purple-500 dark:border-purple-800"
                    >
                      Anterior
                    </Button>
                  </motion.div>
                  <select
                    value={page}
                    onChange={(e) => setPage(Number(e.target.value))}
                    className="px-3 py-1.5 border rounded-md text-sm font-medium border-purple-200 focus:border-purple-500 focus:ring-purple-500 dark:border-purple-800 dark:bg-slate-900"
                    aria-label="Ir para página"
                  >
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                      <option key={p} value={p}>Página {p}</option>
                    ))}
                  </select>
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                      className="border-purple-200 hover:border-purple-500 dark:border-purple-800"
                    >
                      Próxima
                    </Button>
                  </motion.div>
                </div>
              </div>
              {error && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
                  <Alert variant="destructive" className="mb-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                </motion.div>
              )}
              {loading ? (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-12">
                  <div className="inline-block">
                    <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity }}>
                      <RefreshCw className="h-8 w-8 text-purple-600" />
                    </motion.div>
                  </div>
                  <p className="text-muted-foreground mt-2">Carregando faturas...</p>
                </motion.div>
              ) : filteredInvoices.length === 0 ? (
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-12 text-muted-foreground">
                  <FileText className="h-16 w-16 mx-auto mb-4 opacity-20" />
                  <p className="text-lg font-medium">Nenhuma fatura encontrada</p>
                  <p className="text-sm mt-1">Crie uma nova fatura para começar</p>
                </motion.div>
              ) : (
                <div className="space-y-3">
                  <AnimatePresence>
                    {filteredInvoices.map((invoice, index) => (
                      <motion.div
                        key={invoice.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ delay: index * 0.05 }}
                        className="responsive-list-item border rounded-xl bg-gradient-to-r from-white to-slate-50 dark:from-slate-950 dark:to-slate-900 hover:from-purple-50 hover:to-pink-50 dark:hover:from-purple-950/30 dark:hover:to-pink-950/30 hover:shadow-lg hover:border-purple-200 dark:hover:border-purple-800 transition-all cursor-pointer group"
                        onClick={() => handleViewInvoice(invoice.id)}
                        whileHover={{ y: -2 }}
                      >
                        <div className="responsive-flex-container">
                          <motion.div className="p-2.5 sm:p-3 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900/40 dark:to-blue-800/40 group-hover:from-purple-100 group-hover:to-purple-200 shrink-0" whileHover={{ scale: 1.1 }}>
                            <FileText className="responsive-icon text-blue-600 dark:text-blue-400" />
                          </motion.div>
                          <div className="responsive-content">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-semibold responsive-text">#{invoice.number}</p>
                              {getStatusBadge(invoice.status)}
                            </div>
                            <div className="responsive-meta text-muted-foreground mt-1.5 sm:mt-2">
                              {invoice.client?.name && (
                                <span className="flex items-center gap-1 px-2 py-0.5 sm:py-1 bg-slate-100 dark:bg-slate-800 rounded-full shrink-0">
                                  <Users className="h-3 w-3 shrink-0" />
                                  <span className="truncate max-w-[100px] sm:max-w-none">{invoice.client.name}</span>
                                </span>
                              )}
                              <span className="flex items-center gap-1 shrink-0">
                                <Calendar className="h-3 w-3" />
                                Vence: {formatDate(invoice.dueDate)}
                              </span>
                              {invoice.paidAt && (
                                <span className="flex items-center gap-1 text-green-600 px-2 py-0.5 sm:py-1 bg-green-50 dark:bg-green-950/30 rounded-full shrink-0 text-[10px] sm:text-xs">
                                  <CheckCircle className="h-3 w-3" />
                                  Pago: {formatDate(invoice.paidAt)}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="responsive-actions">
                          <div className="text-left sm:text-right shrink-0">
                            <div className="responsive-value bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                              {formatCurrency(invoice.total)}
                            </div>
                            <div className="responsive-badge text-muted-foreground">{invoice.items.length} {invoice.items.length === 1 ? 'item' : 'itens'}</div>
                          </div>
                          <div className="flex gap-1.5 sm:gap-2 shrink-0">
                            {invoice.status === 'OPEN' && (
                              <>
                                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleApprovePayment(invoice.id)
                                    }}
                                    className="text-green-600 hover:bg-green-50 border-green-200 dark:border-green-800"
                                  >
                                    <CheckCircle className="h-4 w-4" />
                                  </Button>
                                </motion.div>
                                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleCancelInvoice(invoice.id)
                                    }}
                                    className="text-red-600 hover:bg-red-50 border-red-200 dark:border-red-800"
                                  >
                                    <XCircle className="h-4 w-4" />
                                  </Button>
                                </motion.div>
                              </>
                            )}
                            {invoice.status === 'OVERDUE' && (
                              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleApprovePayment(invoice.id)
                                  }}
                                  className="text-green-600 hover:bg-green-50 border-green-200 dark:border-green-800"
                                >
                                  <CheckCircle className="mr-1 h-4 w-4" />
                                  Aprovar
                                </Button>
                              </motion.div>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </div>
          </div>
        </motion.section>

        {/* Modals */}
        <CreateInvoiceModal
          open={modalOpen}
          onOpenChange={setModalOpen}
          onSuccess={handleInvoiceCreated}
        />

        <InvoiceDetailModal
          open={detailModalOpen}
          onOpenChange={setDetailModalOpen}
          invoiceId={selectedInvoiceId}
        />
      </div>
    </div>
  )
}
