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
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-100">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <header className="space-y-4">
          <div className="space-y-2">
            <p className="text-xs font-medium text-blue-400 uppercase tracking-wider">Financeiro</p>
            <h1 className="text-3xl sm:text-4xl font-bold text-white bg-gradient-to-r from-blue-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">Gestão Financeira</h1>
            <p className="text-sm sm:text-base text-slate-400">
              Controle centralizado de receitas, despesas, faturas e custos com navegação simples.
            </p>
          </div>
          <div className="flex flex-wrap gap-3 sm:gap-4 text-xs sm:text-sm">
            <div className="flex items-center gap-2 bg-blue-500/10 text-blue-300 px-3 py-1.5 rounded-lg border border-blue-500/20">
              <TrendingUp className="h-4 w-4" />
              <span className="font-medium">Dashboard</span>
            </div>
            <div className="flex items-center gap-2 bg-emerald-500/10 text-emerald-300 px-3 py-1.5 rounded-lg border border-emerald-500/20">
              <Wallet className="h-4 w-4" />
              <span className="font-medium">Transações</span>
            </div>
            <div className="flex items-center gap-2 bg-purple-500/10 text-purple-300 px-3 py-1.5 rounded-lg border border-purple-500/20">
              <Calendar className="h-4 w-4" />
              <span className="font-medium">Faturas</span>
            </div>
            <div className="flex items-center gap-2 bg-orange-500/10 text-orange-300 px-3 py-1.5 rounded-lg border border-orange-500/20">
              <Repeat className="h-4 w-4" />
              <span className="font-medium">Despesas</span>
            </div>
            <div className="flex items-center gap-2 bg-cyan-500/10 text-cyan-300 px-3 py-1.5 rounded-lg border border-cyan-500/20">
              <DollarSign className="h-4 w-4" />
              <span className="font-medium">Custos</span>
            </div>
          </div>
        </header>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid grid-cols-2 gap-2 rounded-2xl border border-slate-800/70 bg-slate-900/50 backdrop-blur-xl p-2 sm:grid-cols-5 shadow-xl">
            <TabsTrigger
              value="dashboard"
              className="text-xs sm:text-sm font-medium rounded-xl data-[state=active]:bg-gradient-to-br data-[state=active]:from-blue-600/30 data-[state=active]:to-purple-500/20 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all"
            >
              Dashboard
            </TabsTrigger>
            <TabsTrigger
              value="transacoes"
              className="text-xs sm:text-sm font-medium rounded-xl data-[state=active]:bg-gradient-to-br data-[state=active]:from-emerald-600/30 data-[state=active]:to-cyan-500/20 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all"
            >
              Transações
            </TabsTrigger>
            <TabsTrigger
              value="faturas"
              className="text-xs sm:text-sm font-medium rounded-xl data-[state=active]:bg-gradient-to-br data-[state=active]:from-purple-600/30 data-[state=active]:to-pink-500/20 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all"
            >
              Faturas
            </TabsTrigger>
            <TabsTrigger
              value="despesas"
              className="text-xs sm:text-sm font-medium rounded-xl data-[state=active]:bg-gradient-to-br data-[state=active]:from-orange-600/30 data-[state=active]:to-red-500/20 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all"
            >
              Despesas
            </TabsTrigger>
            <TabsTrigger
              value="custos"
              className="text-xs sm:text-sm font-medium rounded-xl data-[state=active]:bg-gradient-to-br data-[state=active]:from-cyan-600/30 data-[state=active]:to-blue-500/20 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all"
            >
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
