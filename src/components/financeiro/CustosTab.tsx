'use client'

import { CostDetailModal } from '@/components/financeiro/CostDetailModal'
import { CreateCostItemModal } from '@/components/financeiro/CreateCostItemModal'
import { CreateCostSubscriptionModal } from '@/components/financeiro/CreateCostSubscriptionModal'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { formatCurrency, formatDate } from '@/lib/utils'
import {
  AlertCircle,
  Calendar,
  CalendarDays,
  DollarSign,
  Package,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  TrendingUp
} from 'lucide-react'
import { useEffect, useState } from 'react'
interface CostItem {
  id: string
  name: string
  description: string | null
  amount: number
  createdAt: string
}

interface ClientCostSubscription {
  id: string
  clientId: string
  client?: {
    id: string
    name: string
  }
  costItemId: string
  costItem?: {
    id: string
    name: string
    amount: number
    category: string | null
  }
  amount: number
  startDate: string
  endDate: string | null
  createdAt: string
}

export function CustosTab() {
  const [costItems, setCostItems] = useState<CostItem[]>([])
  const [subscriptions, setSubscriptions] = useState<ClientCostSubscription[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [materializing, setMaterializing] = useState(false)
  const [modalItemOpen, setModalItemOpen] = useState(false)
  const [modalSubscriptionOpen, setModalSubscriptionOpen] = useState(false)
  const [detailModalOpen, setDetailModalOpen] = useState(false)
  const [selectedCostId, setSelectedCostId] = useState<string | undefined>()
  const [selectedCostType, setSelectedCostType] = useState<'item' | 'subscription'>('item')

  const [searchTermItems, setSearchTermItems] = useState('')
  const [searchTermSubs, setSearchTermSubs] = useState('')
  const [pageCostItems, setPageCostItems] = useState(1)
  const [totalPagesCostItems, setTotalPagesCostItems] = useState(1)
  const [pageSubscriptions, setPageSubscriptions] = useState(1)
  const [totalPagesSubscriptions, setTotalPagesSubscriptions] = useState(1)

  useEffect(() => {
    fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageCostItems, pageSubscriptions])

  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)

      const itemsParams = new URLSearchParams({
        page: pageCostItems.toString(),
        limit: '20',
      })

      const subsParams = new URLSearchParams({
        page: pageSubscriptions.toString(),
        limit: '20',
      })

      const [itemsRes, subsRes] = await Promise.all([
        fetch(`/api/cost-items?${itemsParams}`),
        fetch(`/api/cost-subscriptions?${subsParams}`),
      ])

      if (!itemsRes.ok || !subsRes.ok) throw new Error('Erro ao carregar dados')

      const itemsData = await itemsRes.json()
      const subsData = await subsRes.json()

      setCostItems(itemsData.data || [])
      setTotalPagesCostItems(itemsData.totalPages || 1)
      setSubscriptions(subsData.data || [])
      setTotalPagesSubscriptions(subsData.totalPages || 1)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
    } finally {
      setLoading(false)
    }
  }

  const handleMaterializeSubscriptions = async () => {
    if (!confirm('Deseja materializar custos de todas as assinaturas ativas?')) return

    try {
      setMaterializing(true)
      setError(null)

      const response = await fetch('/api/cost-subscriptions/materialize', { method: 'POST' })
      if (!response.ok) throw new Error('Erro ao materializar custos')

      const result = await response.json()
      alert(`✅ Custos materializados!\n\nCriadas: ${result.materialized.length} transações`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao materializar')
    } finally {
      setMaterializing(false)
    }
  }

  const handleDeleteCostItem = async (itemId: string) => {
    if (!confirm('Deseja realmente excluir este item de custo?')) return

    try {
      const response = await fetch(`/api/cost-items/${itemId}`, { method: 'DELETE' })
      if (!response.ok) throw new Error('Erro ao excluir item')
      alert('✅ Item excluído!')
      fetchData()
    } catch (err) {
      alert(`❌ ${err instanceof Error ? err.message : 'Erro'}`)
    }
  }

  const handleDeleteSubscription = async (subId: string) => {
    if (!confirm('Deseja realmente excluir esta associação?')) return

    try {
      const response = await fetch(`/api/cost-subscriptions/${subId}`, { method: 'DELETE' })
      if (!response.ok) throw new Error('Erro ao excluir associação')
      alert('✅ Associação excluída!')
      fetchData()
    } catch (err) {
      alert(`❌ ${err instanceof Error ? err.message : 'Erro'}`)
    }
  }

  const handleItemCreated = () => {
    setModalItemOpen(false)
    fetchData()
  }

  const handleSubscriptionCreated = () => {
    setModalSubscriptionOpen(false)
    fetchData()
  }

  const handleViewCostItem = (id: string) => {
    setSelectedCostId(id)
    setSelectedCostType('item')
    setDetailModalOpen(true)
  }

  const handleViewSubscription = (id: string) => {
    setSelectedCostId(id)
    setSelectedCostType('subscription')
    setDetailModalOpen(true)
  }

  const filteredCostItems = costItems.filter(item =>
    !searchTermItems || item.name.toLowerCase().includes(searchTermItems.toLowerCase())
  )

  const filteredSubscriptions = subscriptions.filter(sub =>
    !searchTermSubs ||
    sub.client?.name.toLowerCase().includes(searchTermSubs.toLowerCase()) ||
    sub.costItem?.name.toLowerCase().includes(searchTermSubs.toLowerCase())
  )

  return (
    <section className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <p className="text-xs font-bold text-emerald-400 uppercase tracking-widest">Gestão Financeira</p>
          <h2 className="text-3xl font-black bg-gradient-to-r from-emerald-400 via-green-400 to-teal-400 bg-clip-text text-transparent drop-shadow-lg">Custos por Cliente</h2>
          <p className="text-sm text-slate-400 max-w-2xl">
            Cadastre itens de custo e associe-os aos clientes para rastreamento preciso de margens.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button
            variant="outline"
            onClick={handleMaterializeSubscriptions}
            disabled={materializing}
            className="border-slate-700 bg-slate-900/50 hover:bg-slate-800 text-slate-200"
          >
            {materializing ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <DollarSign className="mr-2 h-4 w-4" />}
            Materializar
          </Button>
          <Button
            onClick={() => setModalItemOpen(true)}
            className="bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 shadow-lg shadow-emerald-500/30"
          >
            <Plus className="mr-2 h-4 w-4" />
            Novo Item
          </Button>
        </div>
      </div>

      <Tabs defaultValue="items" className="space-y-6" onValueChange={(value) => {
        if (value === 'items') {
          setPageCostItems(1)
        } else {
          setPageSubscriptions(1)
        }
      }}>
        <TabsList className="inline-flex h-11 items-center justify-center rounded-xl bg-slate-900/50 p-1 backdrop-blur-sm border border-slate-700/50 shadow-lg">
          <TabsTrigger
            value="items"
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-600 data-[state=active]:to-green-600 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-emerald-500/30"
          >
            <Package className="mr-2 h-4 w-4" />
            Itens de Custo
          </TabsTrigger>
          <TabsTrigger
            value="subscriptions"
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-600 data-[state=active]:to-green-600 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-emerald-500/30"
          >
            <CalendarDays className="mr-2 h-4 w-4" />
            Custos Recorrentes
          </TabsTrigger>
        </TabsList>

        <TabsContent value="items" className="space-y-6 mt-6">

          <div className="rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-slate-900 via-emerald-950/10 to-slate-900/90 backdrop-blur-xl p-6 shadow-2xl">
            <div className="bg-gradient-to-r from-emerald-500 via-green-500 to-teal-500 h-1 rounded-t-2xl absolute top-0 left-0 right-0" />
            <div className="space-y-4">
              <Label htmlFor="search-items" className="text-slate-300 font-semibold">Buscar Item</Label>
              <div className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900/50 px-3 py-2.5 focus-within:border-emerald-500/50 focus-within:ring-2 focus-within:ring-emerald-500/20 transition-all">
                <Search className="h-4 w-4 text-slate-400" />
                <Input
                  id="search-items"
                  placeholder="Nome do item..."
                  value={searchTermItems}
                  onChange={(e) => setSearchTermItems(e.target.value)}
                  className="border-0 p-0 bg-transparent text-slate-100 placeholder:text-slate-500 focus-visible:ring-0"
                />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-violet-500/20 bg-gradient-to-br from-slate-900 via-violet-950/10 to-slate-900/90 backdrop-blur-xl shadow-2xl overflow-hidden">
            <div className="bg-gradient-to-r from-violet-500 via-purple-500 to-indigo-500 h-1 rounded-t-2xl absolute top-0 left-0 right-0" />
            <div className="p-6 border-b border-slate-700/50">
              <h3 className="text-xl font-bold text-white">Itens de Custo Cadastrados</h3>
              <p className="text-sm text-slate-400 mt-1">Mostrando {filteredCostItems.length} de {costItems.length} itens</p>
            </div>
            <div className="p-6">
              {error && <Alert variant="destructive" className="mb-4"><AlertCircle className="h-4 w-4" /><AlertDescription>{error}</AlertDescription></Alert>}
              {loading ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <RefreshCw className="h-12 w-12 text-emerald-500 animate-spin mb-4" />
                  <p className="text-slate-400">Carregando itens de custo...</p>
                </div>
              ) : filteredCostItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <Package className="h-16 w-16 text-slate-600 mb-4" />
                  <p className="text-lg font-medium text-slate-300">Nenhum item de custo encontrado</p>
                  <p className="text-sm text-slate-500 mt-2">Clique em &quot;Novo Item de Custo&quot; para começar</p>
                </div>
              ) : (
                <>
                  <div className="space-y-3 mb-6">
                    {filteredCostItems.map((item) => (
                      <div
                        key={item.id}
                        className="group relative overflow-hidden rounded-xl border border-slate-700/50 bg-slate-900/30 p-4 transition-all hover:border-emerald-500/50 hover:shadow-lg hover:shadow-emerald-500/10 cursor-pointer"
                        onClick={() => handleViewCostItem(item.id)}
                      >
                        <div className="flex items-center gap-4">
                          <div className="shrink-0 p-3 rounded-xl bg-gradient-to-br from-emerald-500/20 to-green-500/20 border border-emerald-500/30">
                            <Package className="h-5 w-5 text-emerald-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-white mb-1">{item.name}</p>
                            {item.description && <p className="text-sm text-slate-400 truncate">{item.description}</p>}
                          </div>
                          <div className="text-right shrink-0">
                            <div className="text-lg font-bold text-emerald-400">{formatCurrency(item.amount)}</div>
                            <div className="text-xs text-slate-500">por unidade</div>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDeleteCostItem(item.id)
                            }}
                            className="text-red-400 hover:text-red-300 hover:bg-red-950/50 border-red-900/50"
                          >
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-slate-700/50">
                    <div className="text-sm text-slate-400">
                      Página {pageCostItems} de {totalPagesCostItems}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPageCostItems(p => Math.max(1, p - 1))}
                        disabled={pageCostItems === 1}
                        className="border-slate-700/50 hover:bg-slate-800/50"
                      >
                        Anterior
                      </Button>
                      <select
                        value={pageCostItems}
                        onChange={(e) => setPageCostItems(Number(e.target.value))}
                        className="px-3 py-1.5 bg-slate-900/50 border border-slate-700/50 rounded-md text-sm"
                        aria-label="Ir para página"
                      >
                        {Array.from({ length: totalPagesCostItems }, (_, i) => i + 1).map(p => (
                          <option key={p} value={p}>Página {p}</option>
                        ))}
                      </select>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPageCostItems(p => Math.min(totalPagesCostItems, p + 1))}
                        disabled={pageCostItems === totalPagesCostItems}
                        className="border-slate-700/50 hover:bg-slate-800/50"
                      >
                        Próxima
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="subscriptions" className="space-y-6 mt-6">
          <div className="flex justify-end">
            <Button
              onClick={() => setModalSubscriptionOpen(true)}
              className="bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 shadow-lg shadow-emerald-500/30"
            >
              <Plus className="mr-2 h-4 w-4" />
              Nova Associação
            </Button>
          </div>

          <div className="rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-slate-900 via-emerald-950/10 to-slate-900/90 backdrop-blur-xl p-6 shadow-2xl">
            <div className="bg-gradient-to-r from-emerald-500 via-green-500 to-teal-500 h-1 rounded-t-2xl absolute top-0 left-0 right-0" />
            <div className="space-y-4">
              <Label htmlFor="search-subs" className="text-slate-300 font-semibold">Buscar Associação</Label>
              <div className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900/50 px-3 py-2.5 focus-within:border-emerald-500/50 focus-within:ring-2 focus-within:ring-emerald-500/20 transition-all">
                <Search className="h-4 w-4 text-slate-400" />
                <Input
                  id="search-subs"
                  placeholder="Cliente ou item..."
                  value={searchTermSubs}
                  onChange={(e) => setSearchTermSubs(e.target.value)}
                  className="border-0 p-0 bg-transparent text-slate-100 placeholder:text-slate-500 focus-visible:ring-0"
                />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-slate-900 via-emerald-950/10 to-slate-900/90 backdrop-blur-xl shadow-2xl overflow-hidden">
            <div className="bg-gradient-to-r from-emerald-500 via-green-500 to-teal-500 h-1 rounded-t-2xl absolute top-0 left-0 right-0" />
            <div className="p-6 border-b border-slate-700/50">
              <h3 className="text-xl font-bold text-white">Associações Cliente-Custo</h3>
              <p className="text-sm text-slate-400 mt-1">Mostrando {filteredSubscriptions.length} de {subscriptions.length} associações</p>
            </div>
            <div className="p-6">
              {error && <Alert variant="destructive" className="mb-4"><AlertCircle className="h-4 w-4" /><AlertDescription>{error}</AlertDescription></Alert>}
              {loading ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <RefreshCw className="h-12 w-12 text-emerald-500 animate-spin mb-4" />
                  <p className="text-slate-400">Carregando associações...</p>
                </div>
              ) : filteredSubscriptions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <CalendarDays className="h-16 w-16 text-slate-600 mb-4" />
                  <p className="text-lg font-medium text-slate-300">Nenhuma associação encontrada</p>
                  <p className="text-sm text-slate-500 mt-2">Clique em &quot;Nova Associação&quot; para começar</p>
                </div>
              ) : (
                <>
                  <div className="space-y-3 mb-6">
                    {filteredSubscriptions.map((sub) => (
                      <div
                        key={sub.id}
                        className="group relative overflow-hidden rounded-xl border border-slate-700/50 bg-slate-900/30 p-4 transition-all hover:border-emerald-500/50 hover:shadow-lg hover:shadow-emerald-500/10 cursor-pointer"
                        onClick={() => handleViewSubscription(sub.id)}
                      >
                        <div className="flex items-center gap-4">
                          <div className="shrink-0 p-3 rounded-xl bg-gradient-to-br from-emerald-500/20 to-green-500/20 border border-emerald-500/30">
                            <TrendingUp className="h-5 w-5 text-emerald-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-semibold text-white">{sub.client?.name || 'Cliente'}</p>
                              <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-gradient-to-r from-emerald-500/20 to-green-500/20 text-emerald-300 border border-emerald-500/30">
                                {sub.costItem?.name || 'Item'}
                              </span>
                            </div>
                            <div className="flex items-center gap-3 text-sm text-slate-400">
                              <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />Início: {formatDate(sub.startDate)}</span>
                              {sub.endDate && <span className="flex items-center gap-1">Fim: {formatDate(sub.endDate)}</span>}
                              {!sub.endDate && (
                                <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-gradient-to-r from-emerald-500/20 to-green-500/20 text-emerald-300 border border-emerald-500/30">
                                  Ativo
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <div className="text-lg font-bold text-emerald-400">{formatCurrency(sub.amount)}</div>
                            <div className="text-xs text-slate-500">custo mensal</div>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDeleteSubscription(sub.id)
                            }}
                            className="text-red-400 hover:text-red-300 hover:bg-red-950/50 border-red-900/50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-slate-700/50">
                    <div className="text-sm text-slate-400">
                      Página {pageSubscriptions} de {totalPagesSubscriptions}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPageSubscriptions(p => Math.max(1, p - 1))}
                        disabled={pageSubscriptions === 1}
                        className="border-slate-700/50 hover:bg-slate-800/50"
                      >
                        Anterior
                      </Button>
                      <select
                        value={pageSubscriptions}
                        onChange={(e) => setPageSubscriptions(Number(e.target.value))}
                        className="px-3 py-1.5 bg-slate-900/50 border border-slate-700/50 rounded-md text-sm"
                        aria-label="Ir para página"
                      >
                        {Array.from({ length: totalPagesSubscriptions }, (_, i) => i + 1).map(p => (
                          <option key={p} value={p}>Página {p}</option>
                        ))}
                      </select>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPageSubscriptions(p => Math.min(totalPagesSubscriptions, p + 1))}
                        disabled={pageSubscriptions === totalPagesSubscriptions}
                        className="border-slate-700/50 hover:bg-slate-800/50"
                      >
                        Próxima
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <CreateCostItemModal
        open={modalItemOpen}
        onOpenChange={setModalItemOpen}
        onSuccess={handleItemCreated}
      />

      <CreateCostSubscriptionModal
        open={modalSubscriptionOpen}
        onOpenChange={setModalSubscriptionOpen}
        onSuccess={handleSubscriptionCreated}
      />

      <CostDetailModal
        open={detailModalOpen}
        onOpenChange={setDetailModalOpen}
        type={selectedCostType}
        costId={selectedCostId}
      />
    </section>
  )
}