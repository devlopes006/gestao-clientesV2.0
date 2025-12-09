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

  useEffect(() => {
    const current = searchParams ? new URLSearchParams(searchParams.toString()) : new URLSearchParams()
    if (current.get('tab') === activeTab) return
    current.set('tab', activeTab)
    router.replace(`${pathname}?${current.toString()}`)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab])

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-8">
        <header className="space-y-3">
          <div className="space-y-1">
            <p className="text-xs font-medium text-slate-600">Financeiro</p>
            <h1 className="text-3xl font-semibold">Gestão financeira</h1>
            <p className="text-sm text-slate-600">
              Controle centralizado de receitas, despesas, faturas e custos com navegação simples.
            </p>
          </div>
          <div className="flex flex-wrap gap-3 text-sm text-slate-700">
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

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-5">
          <TabsList className="grid grid-cols-2 gap-2 rounded-lg border bg-white p-2 sm:grid-cols-5">
            <TabsTrigger value="dashboard" className="text-sm font-medium">
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="transacoes" className="text-sm font-medium">
              Transações
            </TabsTrigger>
            <TabsTrigger value="faturas" className="text-sm font-medium">
              Faturas
            </TabsTrigger>
            <TabsTrigger value="despesas" className="text-sm font-medium">
              Despesas
            </TabsTrigger>
            <TabsTrigger value="custos" className="text-sm font-medium">
              Custos
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-5">
            <DashboardFinanceiro />
          </TabsContent>

          <TabsContent value="transacoes" className="space-y-5">
            <TransacoesTab />
          </TabsContent>

          <TabsContent value="faturas" className="space-y-5">
            <FaturasTab />
          </TabsContent>

          <TabsContent value="despesas" className="space-y-5">
            <DespesasTab />
          </TabsContent>

          <TabsContent value="custos" className="space-y-5">
            <CustosTab />
          </TabsContent>
        </Tabs>
      </div>
    </main>
  )
}
