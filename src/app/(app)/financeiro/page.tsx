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
    <div className="container mx-auto px-4 py-8 space-y-8 min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800">
      {/* Header Premium */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 p-8 shadow-2xl shadow-purple-500/30">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full -ml-24 -mb-24 pointer-events-none" />
        <div className="relative">
          <h1 className="text-4xl font-bold tracking-tight text-white mb-2">Sistema Financeiro</h1>
          <p className="text-blue-100 text-lg">
            Gestão completa de finanças, faturas, despesas e custos
          </p>
        </div>
      </div>

      {/* Tabs Modernos */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5 h-auto p-1 bg-gradient-to-r from-slate-100 to-slate-200 dark:from-slate-900 dark:to-slate-800 rounded-xl shadow-lg">
          <TabsTrigger
            value="dashboard"
            className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-indigo-600 data-[state=active]:text-white py-3 px-4 rounded-lg transition-all"
          >
            <TrendingUp className="h-4 w-4" />
            <span className="hidden sm:inline">Dashboard</span>
          </TabsTrigger>
          <TabsTrigger
            value="transacoes"
            className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-emerald-600 data-[state=active]:text-white py-3 px-4 rounded-lg transition-all"
          >
            <Wallet className="h-4 w-4" />
            <span className="hidden sm:inline">Transações</span>
          </TabsTrigger>
          <TabsTrigger
            value="faturas"
            className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-600 data-[state=active]:text-white py-3 px-4 rounded-lg transition-all"
          >
            <Calendar className="h-4 w-4" />
            <span className="hidden sm:inline">Faturas</span>
          </TabsTrigger>
          <TabsTrigger
            value="despesas"
            className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-red-500 data-[state=active]:to-rose-600 data-[state=active]:text-white py-3 px-4 rounded-lg transition-all"
          >
            <Repeat className="h-4 w-4" />
            <span className="hidden sm:inline">Despesas</span>
          </TabsTrigger>
          <TabsTrigger
            value="custos"
            className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-500 data-[state=active]:to-orange-600 data-[state=active]:text-white py-3 px-4 rounded-lg transition-all"
          >
            <DollarSign className="h-4 w-4" />
            <span className="hidden sm:inline">Custos</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-6 mt-6">
          <DashboardFinanceiro />
        </TabsContent>

        <TabsContent value="transacoes" className="space-y-6 mt-6">
          <TransacoesTab />
        </TabsContent>

        <TabsContent value="faturas" className="space-y-6 mt-6">
          <FaturasTab />
        </TabsContent>

        <TabsContent value="despesas" className="space-y-6 mt-6">
          <DespesasTab />
        </TabsContent>

        <TabsContent value="custos" className="space-y-6 mt-6">
          <CustosTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}
