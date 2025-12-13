'use client'

import { CostDetailModal } from '@/components/financeiro/CostDetailModal'
import { CreateCostItemModal } from '@/components/financeiro/CreateCostItemModal'
import { CreateCostSubscriptionModal } from '@/components/financeiro/CreateCostSubscriptionModal'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { formatCurrency, formatDate } from '@/lib/utils'
import { motion } from 'framer-motion'
import {
  AlertCircle,
  Calendar,
  DollarSign,
  Package,
  Plus,
  RefreshCw,
  Trash2,
  TrendingUp,
  Users
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900/60 via-amber-50/30 to-orange-50/40 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <div className="page-shell py-2 sm:py-6 lg:py-8 space-y-2 sm:space-y-6 lg:space-y-8">

        {/* Header */}
        <motion.div
          className="relative overflow-hidden rounded-xl sm:rounded-3xl bg-gradient-to-br from-amber-600 via-orange-600 to-yellow-600 p-3 sm:p-6 lg:p-8 shadow-lg sm:shadow-xl lg:shadow-2xl shadow-amber-500/25"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="absolute top-0 right-0 w-96 h-96 bg-slate-900/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-orange-400/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

          <div className="relative z-10 flex flex-col gap-3 sm:gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-2 sm:space-y-3">
              <motion.div
                className="inline-flex items-center gap-1.5 sm:gap-2 rounded-full bg-slate-900/20 backdrop-blur-sm px-2.5 sm:px-3 lg:px-4 py-1 sm:py-1.5 lg:py-2 text-xs font-bold text-white ring-1 ring-white/30 shadow-lg"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
              >
                <span className="h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full bg-slate-900 animate-pulse shadow-lg shadow-white/50" />
                Gestão Financeira
              </motion.div>
              <div>
                <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-black text-white leading-tight tracking-tight">
                  Custos por Cliente
                </h1>
                <p className="text-xs sm:text-sm md:text-base text-white/90 font-medium mt-1 sm:mt-2">
                  Rastreamento de custos e margens
                </p>
              </div>
            </div>
            <motion.div
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
            >
              <Button onClick={handleMaterializeSubscriptions} disabled={materializing} className="shadow-lg bg-slate-900 text-amber-600 hover:bg-slate-900/90 font-bold">
                {materializing ? <RefreshCw className="h-4 w-4 sm:h-5 sm:w-5 animate-spin" /> : <DollarSign className="h-4 w-4 sm:h-5 sm:w-5" />}
                <span className="ml-2">Materializar Custos</span>
              </Button>
            </motion.div>
          </div>
        </motion.div>

        {/* Tabs */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >

          <Tabs defaultValue="items" className="space-y-6" onValueChange={(value) => {
            if (value === 'items') {
              setPageCostItems(1)
            } else {
              setPageSubscriptions(1)
            }
          }}>
            <TabsList className="grid w-full grid-cols-2 h-auto p-1 bg-gradient-to-r from-slate-100 to-slate-200 dark:from-slate-900 dark:to-slate-800 rounded-xl shadow-md">
              <TabsTrigger value="items" className="flex items-center gap-1.5 sm:gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-indigo-600 data-[state=active]:text-white py-2.5 sm:py-3 px-2 sm:px-4 rounded-lg transition-all text-xs sm:text-sm">
                <Package className="h-4 w-4 shrink-0" />
                <span className="truncate">Itens de Custo</span>
              </TabsTrigger>
              <TabsTrigger value="subscriptions" className="flex items-center gap-1.5 sm:gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-cyan-600 data-[state=active]:text-white py-2.5 sm:py-3 px-2 sm:px-4 rounded-lg transition-all text-xs sm:text-sm">
                <Users className="h-4 w-4 shrink-0" />
                <span className="truncate">Associações</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="items" className="space-y-6 mt-6">
              <div className="flex justify-end">
                <Button onClick={() => setModalItemOpen(true)} className="shadow-lg">
                  <Plus className="mr-2 h-4 w-4" />
                  Novo Item de Custo
                </Button>
              </div>

              <Card size="md" className="surface-elevated hover-raise transition-base">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg">Filtros</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-2">
                    <Label htmlFor="search-items">Buscar</Label>
                    <Input id="search-items" placeholder="Nome do item..." value={searchTermItems} onChange={(e) => setSearchTermItems(e.target.value)} className="h-11" />
                  </div>
                </CardContent>
              </Card>

              <Card size="md" className="surface-elevated hover-raise transition-base">
                <CardHeader className="pb-4">
                  <CardTitle className="text-xl">Itens de Custo Cadastrados</CardTitle>
                  <CardDescription className="text-base">Mostrando {filteredCostItems.length} de {costItems.length} itens</CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-3 mb-3 sm:mb-4 lg:mb-6 p-2 sm:p-3 lg:p-4 bg-gradient-to-r from-slate-900/60 to-slate-100 dark:from-slate-900 dark:to-slate-800 rounded-lg">
                    <div className="text-xs sm:text-sm font-medium text-muted-foreground">
                      Página {pageCostItems} de {totalPagesCostItems}
                    </div>
                    <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPageCostItems(p => Math.max(1, p - 1))}
                        disabled={pageCostItems === 1}
                        className="text-xs"
                      >
                        Anterior
                      </Button>
                      <select
                        value={pageCostItems}
                        onChange={(e) => setPageCostItems(Number(e.target.value))}
                        className="px-2 sm:px-3 py-1.5 border rounded-md text-xs sm:text-sm font-medium flex-1 sm:flex-none"
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
                        className="text-xs"
                      >
                        Próxima
                      </Button>
                    </div>
                  </div>
                  {error && <Alert variant="destructive" className="mb-4"><AlertCircle className="h-4 w-4" /><AlertDescription>{error}</AlertDescription></Alert>}
                  {loading ? <div className="text-center py-12 text-muted-foreground">Carregando...</div> : filteredCostItems.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <Package className="h-16 w-16 mx-auto mb-4 opacity-20" />
                      <p className="text-lg font-medium">Nenhum item de custo encontrado</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {filteredCostItems.map((item) => (
                        <div key={item.id} className="responsive-list-item border rounded-xl hover:bg-gradient-to-r hover:from-purple-50 hover:to-indigo-50 dark:hover:from-purple-950/20 dark:hover:to-indigo-950/20 hover:shadow-md transition-all cursor-pointer group" onClick={() => handleViewCostItem(item.id)}>
                          <div className="responsive-flex-container">
                            <div className="p-2 rounded-full bg-purple-100 shrink-0">
                              <Package className="responsive-icon text-purple-600" />
                            </div>
                            <div className="responsive-content">
                              <p className="font-medium responsive-text">{item.name}</p>
                              {item.description && <p className="text-xs sm:text-sm text-muted-foreground mt-1 truncate">{item.description}</p>}
                            </div>
                          </div>
                          <div className="responsive-actions">
                            <div className="text-left sm:text-right shrink-0">
                              <div className="responsive-value text-purple-600">{formatCurrency(item.amount)}</div>
                              <div className="responsive-badge text-muted-foreground">por unidade</div>
                            </div>
                            <Button size="sm" variant="outline" onClick={() => handleDeleteCostItem(item.id)} className="text-red-600 shrink-0">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="subscriptions" className="space-y-6 mt-6">
              <div className="flex justify-end">
                <Button onClick={() => setModalSubscriptionOpen(true)} className="shadow-lg">
                  <Plus className="mr-2 h-4 w-4" />
                  Nova Associação
                </Button>
              </div>

              <Card size="md" className="surface-elevated hover-raise transition-base">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg">Filtros</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-2">
                    <Label htmlFor="search-subs">Buscar</Label>
                    <Input id="search-subs" placeholder="Cliente ou item..." value={searchTermSubs} onChange={(e) => setSearchTermSubs(e.target.value)} className="h-11" />
                  </div>
                </CardContent>
              </Card>

              <Card size="md" className="surface-elevated hover-raise transition-base">
                <CardHeader className="pb-4">
                  <CardTitle className="text-xl">Associações Cliente-Custo</CardTitle>
                  <CardDescription className="text-base">Mostrando {filteredSubscriptions.length} de {subscriptions.length} associações</CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-3 mb-3 sm:mb-4 lg:mb-6 p-2 sm:p-3 lg:p-4 bg-gradient-to-r from-slate-900/60 to-slate-100 dark:from-slate-900 dark:to-slate-800 rounded-lg">
                    <div className="text-xs sm:text-sm font-medium text-muted-foreground">
                      Página {pageSubscriptions} de {totalPagesSubscriptions}
                    </div>
                    <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPageSubscriptions(p => Math.max(1, p - 1))}
                        disabled={pageSubscriptions === 1}
                        className="text-xs"
                      >
                        Anterior
                      </Button>
                      <select
                        value={pageSubscriptions}
                        onChange={(e) => setPageSubscriptions(Number(e.target.value))}
                        className="px-2 sm:px-3 py-1.5 border rounded-md text-xs sm:text-sm font-medium flex-1 sm:flex-none"
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
                        className="text-xs"
                      >
                        Próxima
                      </Button>
                    </div>
                  </div>
                  {error && <Alert variant="destructive" className="mb-4"><AlertCircle className="h-4 w-4" /><AlertDescription>{error}</AlertDescription></Alert>}
                  {loading ? <div className="text-center py-12 text-muted-foreground">Carregando...</div> : filteredSubscriptions.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <Users className="h-16 w-16 mx-auto mb-4 opacity-20" />
                      <p className="text-lg font-medium">Nenhuma associação encontrada</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {filteredSubscriptions.map((sub) => (
                        <div key={sub.id} className="responsive-list-item border rounded-xl hover:bg-gradient-to-r hover:from-blue-50 hover:to-cyan-50 dark:hover:from-blue-950/20 dark:hover:to-cyan-950/20 hover:shadow-md transition-all cursor-pointer group" onClick={() => handleViewSubscription(sub.id)}>
                          <div className="responsive-flex-container">
                            <div className="p-2 rounded-full bg-indigo-100 shrink-0">
                              <TrendingUp className="responsive-icon text-indigo-600" />
                            </div>
                            <div className="responsive-content">
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className="font-medium responsive-text">{sub.client?.name || 'Cliente'}</p>
                                <Badge variant="outline" className="shrink-0 text-xs">{sub.costItem?.name || 'Item'}</Badge>
                              </div>
                              <div className="responsive-meta text-muted-foreground mt-1">
                                <span className="flex items-center gap-1 shrink-0"><Calendar className="h-3 w-3" />Início: {formatDate(sub.startDate)}</span>
                                {sub.endDate && <span className="flex items-center gap-1 shrink-0">Fim: {formatDate(sub.endDate)}</span>}
                                {!sub.endDate && <Badge className="bg-green-100 text-green-800 shrink-0 responsive-badge">Ativo</Badge>}
                              </div>
                            </div>
                          </div>
                          <div className="responsive-actions">
                            <div className="text-left sm:text-right shrink-0">
                              <div className="responsive-value text-indigo-600">{formatCurrency(sub.amount)}</div>
                              <div className="responsive-badge text-muted-foreground">custo mensal</div>
                            </div>
                            <Button size="sm" variant="outline" onClick={() => handleDeleteSubscription(sub.id)} className="text-red-600 shrink-0">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </motion.section>

        {/* Modals */}
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
      </div>
    </div>
  )
}