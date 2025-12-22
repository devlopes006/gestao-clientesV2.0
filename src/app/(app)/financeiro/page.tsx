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
        <header className="space-y-3">
          <div className="space-y-2">
            <p className="text-xs font-bold text-blue-400 uppercase tracking-widest">Financeiro</p>
            <h1 className="text-4xl sm:text-5xl font-black bg-gradient-to-r from-blue-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent drop-shadow-2xl">
              Gestão Financeira
            </h1>
            <p className="text-sm sm:text-base text-slate-400 max-w-2xl">
              Controle centralizado de receitas, despesas, faturas e custos com navegação simples.
            </p>
          </div>
        </header>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="inline-flex h-auto w-full sm:w-auto items-center justify-start gap-2 rounded-2xl border border-slate-700/50 bg-slate-900/80 backdrop-blur-2xl p-1.5 shadow-2xl">
            <TabsTrigger
              value="dashboard"
              className="group relative px-4 py-2.5 text-sm font-semibold rounded-xl transition-all duration-300 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-indigo-500 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-blue-500/50 text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
            >
              <TrendingUp className="inline-block h-4 w-4 mr-2" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger
              value="transacoes"
              className="group relative px-4 py-2.5 text-sm font-semibold rounded-xl transition-all duration-300 data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-green-500 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-emerald-500/50 text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
            >
              <Wallet className="inline-block h-4 w-4 mr-2" />
              Transações
            </TabsTrigger>
            <TabsTrigger
              value="faturas"
              className="group relative px-4 py-2.5 text-sm font-semibold rounded-xl transition-all duration-300 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-500 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-purple-500/50 text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
            >
              <Calendar className="inline-block h-4 w-4 mr-2" />
              Faturas
            </TabsTrigger>
            <TabsTrigger
              value="despesas"
              className="group relative px-4 py-2.5 text-sm font-semibold rounded-xl transition-all duration-300 data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-red-500 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-orange-500/50 text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
            >
              <Repeat className="inline-block h-4 w-4 mr-2" />
              Despesas
            </TabsTrigger>
            <TabsTrigger
              value="custos"
              className="group relative px-4 py-2.5 text-sm font-semibold rounded-xl transition-all duration-300 data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500 data-[state=active]:to-blue-500 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-cyan-500/50 text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
            >
              <DollarSign className="inline-block h-4 w-4 mr-2" />
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
