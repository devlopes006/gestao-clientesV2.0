'use client'

import { CustosTab } from '@/components/financeiro/CustosTab'
import { DashboardFinanceiro } from '@/components/financeiro/DashboardFinanceiro'
import { DespesasTab } from '@/components/financeiro/DespesasTab'
import { FaturasTab } from '@/components/financeiro/FaturasTab'
import { TransacoesTab } from '@/components/financeiro/TransacoesTab'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Calendar, DollarSign, Repeat, TrendingUp, Wallet } from 'lucide-react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'

export default function FinanceiroPage() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const validTabs = useMemo(() => new Set(['dashboard', 'transacoes', 'faturas', 'despesas', 'custos']), [])

  const initialTab = (() => {
    const q = searchParams?.get('tab') || ''
    return validTabs.has(q) ? q : 'dashboard'
  })()

  const [activeTab, setActiveTab] = useState(initialTab)

  // Keep URL in sync when tab changes
  useEffect(() => {
    const current = searchParams ? new URLSearchParams(searchParams.toString()) : new URLSearchParams()
    if (current.get('tab') === activeTab) return
    current.set('tab', activeTab)
    // Preserve other params (e.g., status/type) and update only tab
    router.replace(`${pathname}?${current.toString()}`)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab])

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-8">
        <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Financeiro</p>
            <h1 className="text-3xl font-semibold">Gestão de caixa</h1>
            <p className="text-sm text-muted-foreground">Acompanhe receitas, despesas, faturas e custos em um só lugar.</p>
          </div>
          <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              <span>Dashboard</span>
            </div>
            <div className="flex items-center gap-2">
              <Wallet className="h-4 w-4" />
              <span>Transações</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span>Faturas</span>
            </div>
            <div className="flex items-center gap-2">
              <Repeat className="h-4 w-4" />
              <span>Despesas</span>
            </div>
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              <span>Custos</span>
            </div>
          </div>
        </header>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-5 gap-2 rounded-md bg-muted p-1">
            <TabsTrigger value="dashboard" className="text-sm">
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="transacoes" className="text-sm">
              Transações
            </TabsTrigger>
            <TabsTrigger value="faturas" className="text-sm">
              Faturas
            </TabsTrigger>
            <TabsTrigger value="despesas" className="text-sm">
              Despesas
            </TabsTrigger>
            <TabsTrigger value="custos" className="text-sm">
              Custos
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            <DashboardFinanceiro />
          </TabsContent>

          <TabsContent value="transacoes" className="space-y-6">
            <TransacoesTab />
          </TabsContent>

          <TabsContent value="faturas" className="space-y-6">
            <FaturasTab />
          </TabsContent>

          <TabsContent value="despesas" className="space-y-6">
            <DespesasTab />
          </TabsContent>

          <TabsContent value="custos" className="space-y-6">
            <CustosTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
