'use client'

import { CreateInvoiceModal } from '@/components/financeiro/CreateInvoiceModal'
import { InvoiceDetailModal } from '@/components/financeiro/InvoiceDetailModal'
import { QuickStats } from '@/components/financeiro/QuickStats'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { exportInvoices } from '@/lib/export-utils'
import { formatCurrency, formatDate } from '@/lib/utils'
import { InvoiceStatus } from '@prisma/client'
import {
  AlertCircle,
  Calendar,
  CheckCircle,
  Download,
  FileText,
  Plus,
  RefreshCw,
  Users,
  X,
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
    const configs: Record<InvoiceStatus, { label: string, styles: string }> = {
      DRAFT: { label: 'Rascunho', styles: 'bg-gradient-to-r from-slate-500/20 to-gray-500/20 text-slate-300 border border-slate-500/30 shadow-sm shadow-slate-500/20' },
      OPEN: { label: 'Em Aberto', styles: 'bg-gradient-to-r from-amber-500/20 to-yellow-500/20 text-amber-300 border border-amber-500/30 shadow-sm shadow-amber-500/20' },
      PAID: { label: 'Pago', styles: 'bg-gradient-to-r from-emerald-500/20 to-green-500/20 text-emerald-300 border border-emerald-500/30 shadow-sm shadow-emerald-500/20' },
      OVERDUE: { label: 'Vencido', styles: 'bg-gradient-to-r from-rose-500/20 to-red-500/20 text-rose-300 border border-rose-500/30 shadow-sm shadow-rose-500/20' },
      CANCELLED: { label: 'Cancelado', styles: 'bg-gradient-to-r from-slate-500/20 to-gray-500/20 text-slate-400 border border-slate-500/30 shadow-sm shadow-slate-500/20' },
    }

    const { styles, label } = configs[status] || configs.OPEN
    return <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold ${styles}`}>{label}</span>
  }

  const filteredInvoices = invoices.filter(inv =>
    !searchTerm ||
    inv.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    inv.client?.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <section className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <p className="text-xs font-bold text-blue-400 uppercase tracking-widest">Gestão Financeira</p>
          <h2 className="text-3xl font-black bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent drop-shadow-lg">Faturas</h2>
          <p className="text-sm text-slate-400 max-w-2xl">
            Cadastre, filtre e acompanhe suas faturas e cobranças com controle total.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button
            variant="outline"
            onClick={handleGenerateMonthly}
            disabled={generating}
            className="border-slate-700 bg-slate-900/50 hover:bg-slate-800 text-slate-200"
          >
            {generating ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
            Gerar Mensais
          </Button>
          <Button
            onClick={() => setModalOpen(true)}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-lg shadow-blue-500/30"
          >
            <Plus className="mr-2 h-4 w-4" />
            Nova Fatura
          </Button>
        </div>
      </div>

      {generationReport && (
        <div className="rounded-2xl border border-blue-500/20 bg-gradient-to-br from-blue-500/5 via-indigo-500/5 to-slate-900/90 backdrop-blur-xl p-6 shadow-xl">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm font-bold text-slate-200">Resultado da Geração Mensal</p>
            <div className="flex flex-wrap gap-3 text-xs font-semibold">
              <span className="text-emerald-400">Geradas: {generationReport.successCount}</span>
              <span className="text-amber-400">Bloqueadas: {generationReport.blockedCount}</span>
              <span className="text-rose-400">Erros: {generationReport.errorCount}</span>
            </div>
          </div>
        </div>
      )}

      <QuickStats />

      {/* Filtros Avançados */}
      <div className="rounded-2xl border border-blue-500/20 bg-gradient-to-br from-slate-900 via-blue-950/10 to-slate-900/90 backdrop-blur-xl p-6 shadow-2xl">
        <div className="bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 h-1 rounded-t-2xl absolute top-0 left-0 right-0" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 mb-5">
          <div className="space-y-2">
            <Label htmlFor="search" className="text-slate-300 font-semibold">Buscar</Label>
            <div className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900/50 px-3 py-2.5 focus-within:border-blue-500/50 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all">
              <FileText className="h-4 w-4 text-slate-400" />
              <Input
                id="search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Número ou cliente"
                className="border-0 p-0 bg-transparent text-slate-100 placeholder:text-slate-500 focus-visible:ring-0"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="status" className="text-slate-300 font-semibold">Status</Label>
            <select
              id="status"
              title="Filtrar por status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-11 w-full rounded-xl border border-slate-700 bg-slate-900/50 px-4 text-sm text-slate-100 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
            >
              <option value="" className="bg-slate-900">Todos</option>
              <option value="DRAFT" className="bg-slate-900">Rascunho</option>
              <option value="OPEN" className="bg-slate-900">Em Aberto</option>
              <option value="PAID" className="bg-slate-900">Pago</option>
              <option value="OVERDUE" className="bg-slate-900">Vencido</option>
              <option value="CANCELLED" className="bg-slate-900">Cancelado</option>
            </select>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-slate-700/30 pt-4">
          <span className="text-sm font-semibold text-slate-300">
            Mostrando <span className="text-blue-400">{filteredInvoices.length}</span> de <span className="text-blue-400">{invoices.length}</span> faturas
          </span>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => { setSearchTerm(''); setStatusFilter(''); }}
              className="text-slate-300 hover:text-slate-100 hover:bg-slate-800"
            >
              <X className="mr-2 h-4 w-4" />
              Limpar filtros
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => exportInvoices(filteredInvoices.map(inv => ({ number: inv.number, clientName: inv.client?.name || null, createdAt: inv.createdAt, dueDate: inv.dueDate, totalAmount: inv.total, status: inv.status, paidAt: inv.paidAt })))}
              className="border-slate-700 bg-slate-900/50 hover:bg-slate-800 text-slate-200"
            >
              <Download className="mr-2 h-4 w-4" />
              Exportar
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
          <div className="flex items-center gap-3 rounded-2xl border border-blue-500/30 bg-gradient-to-br from-blue-500/10 to-slate-900/90 backdrop-blur-xl px-6 py-8 shadow-xl">
            <RefreshCw className="h-5 w-5 animate-spin text-blue-400" />
            <span className="text-sm font-semibold text-slate-200">Carregando faturas...</span>
          </div>
        ) : filteredInvoices.length === 0 ? (
          <div className="rounded-2xl border border-slate-700/50 bg-gradient-to-br from-slate-900/50 to-slate-800/50 backdrop-blur-xl px-6 py-12 text-center shadow-xl">
            <p className="text-sm font-semibold text-slate-400">Nenhuma fatura encontrada.</p>
            <p className="text-xs text-slate-500 mt-1">Tente ajustar os filtros ou criar uma nova fatura.</p>
          </div>
        ) : (
          <>
            {filteredInvoices.map((invoice) => (
              <div
                key={invoice.id}
                onClick={() => handleViewInvoice(invoice.id)}
                className="group rounded-2xl border border-slate-700/50 bg-gradient-to-br from-slate-900/80 to-slate-800/80 backdrop-blur-xl p-5 shadow-lg hover:shadow-xl hover:border-blue-500/30 transition-all duration-300 cursor-pointer"
              >
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-3">
                      <p className="text-base font-bold text-slate-100">#{invoice.number}</p>
                      {getStatusBadge(invoice.status)}
                    </div>
                    {invoice.client?.name && (
                      <div className="flex items-center gap-2 text-sm text-slate-300">
                        <Users className="h-4 w-4 text-slate-400" />
                        <span>{invoice.client.name}</span>
                      </div>
                    )}
                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Vence: {formatDate(invoice.dueDate)}
                      </span>
                      {invoice.paidAt && (
                        <span className="flex items-center gap-1 text-emerald-400">
                          <CheckCircle className="h-3 w-3" />
                          Pago: {formatDate(invoice.paidAt)}
                        </span>
                      )}
                      <span>{invoice.items.length} {invoice.items.length === 1 ? 'item' : 'itens'}</span>
                    </div>
                  </div>
                  <div className="text-right space-y-2">
                    <p className="text-xl font-black bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
                      {formatCurrency(invoice.total)}
                    </p>
                    <div className="flex gap-2">
                      {(invoice.status === 'OPEN' || invoice.status === 'OVERDUE') && (
                        <Button
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleApprovePayment(invoice.id)
                          }}
                          className="bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white"
                        >
                          <CheckCircle className="h-4 w-4" />
                        </Button>
                      )}
                      {invoice.status === 'OPEN' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleCancelInvoice(invoice.id)
                          }}
                          className="border-slate-700 hover:border-rose-500/50 hover:bg-rose-500/10 text-rose-400"
                        >
                          <XCircle className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </>
        )}

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
            <span className="text-blue-400 font-semibold">Página {page} de {totalPages}</span>
          </div>
        )}
      </div>

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
    </section>
  )
}
