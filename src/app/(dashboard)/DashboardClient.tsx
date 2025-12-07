"use client";
import { DashboardNotes } from '@/features/dashboard/components/DashboardNotes';
import { MonthlyCalendar } from '@/features/dashboard/components/MonthlyCalendar';
import { AppRole } from '@/lib/permissions';
import { DashboardData } from '@/modules/dashboard/domain/schema';
import { motion } from 'framer-motion';
import { Activity, ArrowUpRight, Calendar, CheckCircle2, Clock, ListTodo, TrendingUp, Users } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
interface DashboardClientProps { initialData: DashboardData; initialMonthKey: string; role: AppRole | null }

export function DashboardClient({ initialData, initialMonthKey, role }: DashboardClientProps) {
  const searchParams = useSearchParams()
  const [data, setData] = useState<DashboardData | null>(initialData)
  const [monthKey, setMonthKey] = useState(initialMonthKey)
  const [loadingMonth, setLoadingMonth] = useState(false);

  // Sync state when server data changes (after router.refresh())
  useEffect(() => {
    setData(initialData);
  }, [initialData]);

  useEffect(() => {
    const m = searchParams?.get('month')
    if (m && m !== monthKey) {
      setMonthKey(m)
    }
    // deliberate exclusion of monthKey from deps to avoid cascade
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])

  // Refetch when month changes (progressively enhance server prefetched data)
  useEffect(() => {
    if (!monthKey || !data) return
    setLoadingMonth(true)
    fetch(`/api/dashboard?month=${encodeURIComponent(monthKey)}`)
      .then(r => r.ok ? r.json() : Promise.reject('Falha ao atualizar mês'))
      .then(j => setData(j))
      .catch(() => {/* ignore */ })
      .finally(() => setLoadingMonth(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [monthKey])

  if (!data) {
    return <div className="p-8">Falha ao carregar</div>
  }

  const tasks = data.tasks
  const clients = data.clients
  const metrics = data.metrics
  const totalClients = metrics?.totals.clients ?? clients.length
  const totalTasks = metrics?.totals.tasks ?? tasks.length

  // Normalize status checking
  const isPendingStatus = (s: string) => {
    const normalized = s.toUpperCase().replace(/-/g, '_')
    return normalized === 'TODO' || normalized === 'PENDING'
  }
  const isInProgressStatus = (s: string) => {
    const normalized = s.toUpperCase().replace(/-/g, '_')
    return normalized === 'IN_PROGRESS' || normalized === 'REVIEW'
  }
  const isDoneStatus = (s: string) => {
    const normalized = s.toUpperCase().replace(/-/g, '_')
    return normalized === 'DONE' || normalized === 'CANCELLED'
  }

  // Count from full metrics instead of limited array samples
  const pendingTasks = tasks.filter(t => isPendingStatus(t.status))
  const inProgressTasks = tasks.filter(t => isInProgressStatus(t.status))
  const completedTasks = tasks.filter(t => isDoneStatus(t.status))

  // Calculate totals from metrics when available (more accurate)
  const totalPendingTasks = metrics?.taskAggByClient
    ? Object.values(metrics.taskAggByClient).reduce((sum, agg) => sum + agg.pending, 0)
    : pendingTasks.length
  const totalInProgressTasks = metrics?.taskAggByClient
    ? Object.values(metrics.taskAggByClient).reduce((sum, agg) => sum + agg.inProgress, 0)
    : inProgressTasks.length
  const totalCompletedTasks = metrics?.taskAggByClient
    ? Object.values(metrics.taskAggByClient).reduce((sum, agg) => sum + agg.done, 0)
    : completedTasks.length

  const priorities = pendingTasks.slice(0, 6)
  const completedPercent = totalTasks > 0 ? Math.round((totalCompletedTasks / totalTasks) * 100) : 0

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <div className="page-shell py-6 sm:py-8 lg:py-12 space-y-8">

        {/* Header Redesigned */}
        <motion.div
          className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 p-8 sm:p-10 shadow-2xl shadow-indigo-500/25"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-400/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-400/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

          <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-3">
              <motion.div
                className="inline-flex items-center gap-2 rounded-full bg-white/20 backdrop-blur-sm px-4 py-2 text-xs font-bold text-white ring-1 ring-white/30 shadow-lg"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                <span className="h-2 w-2 rounded-full bg-white animate-pulse shadow-lg shadow-white/50" />
                Visão Geral
              </motion.div>
              <div>
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white leading-tight tracking-tight">
                  Painel de Gestão
                </h1>
                <p className="text-base sm:text-lg text-white/90 font-medium mt-2">
                  Olá, {data.user.name || 'Usuário'}! Aqui está um resumo do seu negócio.
                </p>
              </div>
            </div>
            <motion.div
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
            >
              <div className="flex items-center gap-3 rounded-2xl bg-white/20 backdrop-blur-sm px-6 py-4 ring-1 ring-white/30 shadow-xl">
                <div className="p-3 rounded-xl bg-white/20 backdrop-blur-sm">
                  <Calendar className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wider text-white/70 font-bold">Hoje</p>
                  <p className="text-sm font-bold text-white">
                    {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* KPIs Redesigned */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* KPI 1 - Total Clientes */}
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: 0.15, duration: 0.4 }}
              className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 p-6 shadow-xl shadow-blue-500/25 hover:shadow-2xl hover:shadow-blue-500/40 transition-all duration-300 hover:-translate-y-1"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl translate-x-8 -translate-y-8" />
              <div className="relative z-10 flex items-start justify-between mb-4">
                <div className="p-3 rounded-xl bg-white/20 backdrop-blur-sm ring-1 ring-white/30">
                  <Users className="h-6 w-6 text-white" />
                </div>
                <div className="text-right">
                  <div className="text-4xl font-black text-white">{totalClients}</div>
                </div>
              </div>
              <div className="relative z-10">
                <h3 className="text-sm font-bold text-white/90 uppercase tracking-wide">Total de Clientes</h3>
                <p className="text-xs text-white/70 mt-1">Base de clientes ativa</p>
              </div>
            </motion.div>

            {/* KPI 2 - Tarefas Pendentes */}
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: 0.25, duration: 0.4 }}
              className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 p-6 shadow-xl shadow-amber-500/25 hover:shadow-2xl hover:shadow-amber-500/40 transition-all duration-300 hover:-translate-y-1"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl translate-x-8 -translate-y-8" />
              <div className="relative z-10 flex items-start justify-between mb-4">
                <div className="p-3 rounded-xl bg-white/20 backdrop-blur-sm ring-1 ring-white/30">
                  <ListTodo className="h-6 w-6 text-white" />
                </div>
                <div className="text-right">
                  <div className="text-4xl font-black text-white">{totalPendingTasks}</div>
                </div>
              </div>
              <div className="relative z-10">
                <h3 className="text-sm font-bold text-white/90 uppercase tracking-wide">Tarefas Pendentes</h3>
                <p className="text-xs text-white/70 mt-1">Requerem atenção</p>
              </div>
            </motion.div>

            {/* KPI 3 - Em Progresso */}
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: 0.35, duration: 0.4 }}
              className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-500 p-6 shadow-xl shadow-indigo-500/25 hover:shadow-2xl hover:shadow-indigo-500/40 transition-all duration-300 hover:-translate-y-1"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl translate-x-8 -translate-y-8" />
              <div className="relative z-10 flex items-start justify-between mb-4">
                <div className="p-3 rounded-xl bg-white/20 backdrop-blur-sm ring-1 ring-white/30">
                  <Activity className="h-6 w-6 text-white" />
                </div>
                <div className="text-right">
                  <div className="text-4xl font-black text-white">{totalInProgressTasks}</div>
                </div>
              </div>
              <div className="relative z-10">
                <h3 className="text-sm font-bold text-white/90 uppercase tracking-wide">Em Progresso</h3>
                <p className="text-xs text-white/70 mt-1">Do total de tarefas</p>
              </div>
            </motion.div>

            {/* KPI 4 - Concluídas */}
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: 0.45, duration: 0.4 }}
              className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 p-6 shadow-xl shadow-emerald-500/25 hover:shadow-2xl hover:shadow-emerald-500/40 transition-all duration-300 hover:-translate-y-1"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl translate-x-8 -translate-y-8" />
              <div className="relative z-10 flex items-start justify-between mb-4">
                <div className="p-3 rounded-xl bg-white/20 backdrop-blur-sm ring-1 ring-white/30">
                  <CheckCircle2 className="h-6 w-6 text-white" />
                </div>
                <div className="text-right">
                  <div className="text-4xl font-black text-white">{totalCompletedTasks}</div>
                </div>
              </div>
              <div className="relative z-10 space-y-2">
                <h3 className="text-sm font-bold text-white/90 uppercase tracking-wide">Concluídas</h3>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 bg-white/20 rounded-full overflow-hidden backdrop-blur-sm">
                    <motion.div
                      className="h-full bg-white rounded-full shadow-lg"
                      initial={{ width: 0 }}
                      animate={{ width: `${completedPercent}%` }}
                      transition={{ delay: 0.8, duration: 1, ease: "easeOut" }}
                    />
                  </div>
                  <span className="text-xs font-bold text-white/90">{completedPercent}%</span>
                </div>
              </div>
            </motion.div>
          </div>
        </motion.section>


        {/* Grid: Calendário + Notas Redesigned */}
        <motion.div
          className="grid grid-cols-1 lg:grid-cols-3 gap-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          {/* Calendário (2/3) */}
          <div className="lg:col-span-2">
            {data.activities && (
              <div className="relative overflow-hidden rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 shadow-2xl shadow-slate-900/10">
                <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-full blur-3xl" />

                <div className="relative z-10 p-6 sm:p-8 border-b border-slate-200/50 dark:border-slate-800/50 bg-gradient-to-br from-slate-50/50 to-transparent dark:from-slate-800/30 dark:to-transparent">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 shadow-lg shadow-blue-500/25">
                        <Calendar className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">Calendário de Atividades</h2>
                        <p className="text-sm text-slate-600 dark:text-slate-400 mt-0.5">Acompanhe entregas e compromissos</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="relative z-10 p-6 sm:p-8">
                  <MonthlyCalendar
                    key={monthKey}
                    activities={data.activities.map(a => ({
                      ...a,
                      description: a.description === null ? undefined : a.description,
                    })) as typeof data.activities}
                    initialMonth={(() => {
                      const [y, m] = monthKey.split('-').map(Number);
                      return new Date(y, (m || 1) - 1, 1)
                    })()}
                    onMonthChange={(d) => {
                      const mm = String(d.getMonth() + 1).padStart(2, '0');
                      const value = `${d.getFullYear()}-${mm}`;
                      setMonthKey(value);
                      try {
                        const url = new URL(window.location.href);
                        url.searchParams.set('month', value);
                        window.history.replaceState(null, '', url.toString());
                      } catch { }
                    }}
                    userRole={role}
                  />
                  {loadingMonth && (
                    <p className="text-xs mt-2 text-slate-600 dark:text-slate-400 animate-pulse">
                      Atualizando mês...
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Notas Rápidas (1/3) */}
          <div className="lg:col-span-1">
            <div className="relative overflow-visible rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 shadow-2xl shadow-slate-900/10 h-full">
              <div className="absolute top-0 left-0 w-48 h-48 bg-gradient-to-br from-amber-500/10 to-orange-500/10 rounded-full blur-3xl pointer-events-none" />

              <div className="relative z-10 p-6 border-b border-slate-200/50 dark:border-slate-800/50 bg-gradient-to-br from-slate-50/50 to-transparent dark:from-slate-800/30 dark:to-transparent">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 shadow-lg shadow-amber-500/25">
                      <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <h2 className="text-lg font-black text-slate-900 dark:text-white">Notas Rápidas</h2>
                  </div>
                </div>
              </div>

              <div className="relative z-10 overflow-visible">
                <DashboardNotes
                  initialNotes={(data.notes || []).map((note) => {
                    const n = note as unknown as { title?: string; color?: string; position?: number }
                    return {
                      id: note.id,
                      title: n.title ?? "",
                      content: note.content,
                      color: n.color ?? "yellow",
                      position: n.position ?? 0,
                      createdAt: note.createdAt,
                      updatedAt: note.updatedAt || note.createdAt,
                    }
                  })}
                />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Grid: Métricas + Tarefas Redesigned */}
        <motion.div
          className="grid grid-cols-1 lg:grid-cols-3 gap-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          {/* Métricas (2/3) */}
          <div className="lg:col-span-2 space-y-6">

            {/* Métricas Detalhadas */}
            {metrics && (
              <div className="relative overflow-hidden rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 shadow-2xl shadow-slate-900/10">
                <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-full blur-3xl" />

                <div className="relative z-10 p-6 sm:p-8 border-b border-slate-200/50 dark:border-slate-800/50 bg-gradient-to-br from-slate-50/50 to-transparent dark:from-slate-800/30 dark:to-transparent">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 shadow-lg shadow-purple-500/25">
                      <TrendingUp className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">Métricas do Negócio</h2>
                      <p className="text-sm text-slate-600 dark:text-slate-400 mt-0.5">Insights automáticos sobre clientes e tarefas</p>
                    </div>
                  </div>
                </div>

                <div className="relative z-10 p-6 sm:p-8 space-y-4">
                  {metrics.mostPendingClient && (
                    <motion.div
                      className="group relative overflow-hidden p-5 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border border-amber-200/50 dark:border-amber-800/50 hover:shadow-xl hover:shadow-amber-500/20 transition-all duration-300 cursor-default"
                      whileHover={{ y: -2, scale: 1.01 }}
                    >
                      <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl" />
                      <div className="relative z-10 flex items-start justify-between gap-3">
                        <div className="space-y-1 flex-1">
                          <h4 className="text-xs font-black text-amber-700 dark:text-amber-300 uppercase tracking-wider">Mais Tarefas Pendentes</h4>
                          <p className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                            {metrics.mostPendingClient.name}
                          </p>
                          <p className="text-sm text-slate-600 dark:text-slate-400">
                            <span className="font-bold text-amber-600 dark:text-amber-400">{metrics.mostPendingClient.pending}</span> tarefas aguardando
                          </p>
                        </div>
                        <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 shadow-lg shadow-amber-500/25">
                          <ListTodo className="h-6 w-6 text-white" />
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {metrics.mostUrgentClient && (
                    <motion.div
                      className="group relative overflow-hidden p-5 rounded-2xl bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-950/30 dark:to-rose-950/30 border border-red-200/50 dark:border-red-800/50 hover:shadow-xl hover:shadow-red-500/20 transition-all duration-300 cursor-default"
                      whileHover={{ y: -2, scale: 1.01 }}
                    >
                      <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 rounded-full blur-2xl" />
                      <div className="relative z-10 flex items-start justify-between gap-3">
                        <div className="space-y-1 flex-1">
                          <h4 className="text-xs font-black text-red-700 dark:text-red-300 uppercase tracking-wider">Mais Tarefas Urgentes</h4>
                          <p className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                            {metrics.mostUrgentClient.name}
                          </p>
                          <p className="text-sm text-slate-600 dark:text-slate-400">
                            <span className="font-bold text-red-600 dark:text-red-400">{metrics.mostUrgentClient.urgent}</span> tarefas urgentes
                          </p>
                        </div>
                        <div className="p-4 rounded-2xl bg-gradient-to-br from-red-500 to-rose-500 shadow-lg shadow-red-500/25">
                          <Clock className="h-6 w-6 text-white" />
                        </div>
                      </div>
                    </motion.div>
                  )}

                  <div className="pt-4 border-t-2 border-slate-200 dark:border-slate-700">
                    <div className="grid grid-cols-2 gap-4">
                      <motion.div
                        className="group relative overflow-hidden text-center p-6 rounded-2xl bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/30 dark:to-cyan-950/30 border border-blue-200/50 dark:border-blue-800/50 hover:shadow-xl hover:shadow-blue-500/20 transition-all duration-300 cursor-default"
                        whileHover={{ scale: 1.05, y: -4 }}
                      >
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-cyan-500/5" />
                        <div className="relative z-10">
                          <p className="text-4xl sm:text-5xl font-black bg-gradient-to-br from-blue-600 to-cyan-600 dark:from-blue-300 dark:to-cyan-300 bg-clip-text text-transparent">
                            {metrics.totals.clients}
                          </p>
                          <p className="text-xs font-black text-slate-600 dark:text-slate-400 mt-2 uppercase tracking-wider">
                            Clientes
                          </p>
                        </div>
                      </motion.div>
                      <motion.div
                        className="group relative overflow-hidden text-center p-6 rounded-2xl bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30 border border-purple-200/50 dark:border-purple-800/50 hover:shadow-xl hover:shadow-purple-500/20 transition-all duration-300 cursor-default"
                        whileHover={{ scale: 1.05, y: -4 }}
                      >
                        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-pink-500/5" />
                        <div className="relative z-10">
                          <p className="text-4xl sm:text-5xl font-black bg-gradient-to-br from-purple-600 to-pink-600 dark:from-purple-300 dark:to-pink-300 bg-clip-text text-transparent">
                            {metrics.totals.tasks}
                          </p>
                          <p className="text-xs font-black text-slate-600 dark:text-slate-400 mt-2 uppercase tracking-wider">
                            Tarefas
                          </p>
                        </div>
                      </motion.div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar (1/3) - Tarefas */}
          <div className="space-y-6">

            {/* Tarefas Mais Urgentes */}
            {metrics && metrics.urgentTasks.length > 0 && (
              <div className="relative overflow-hidden rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 shadow-2xl shadow-slate-900/10">
                <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-br from-red-500/10 to-rose-500/10 rounded-full blur-3xl" />

                <div className="relative z-10 p-6 border-b border-slate-200/50 dark:border-slate-800/50 bg-gradient-to-br from-slate-50/50 to-transparent dark:from-slate-800/30 dark:to-transparent">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-gradient-to-br from-red-500 to-rose-500 shadow-lg shadow-red-500/25">
                      <Clock className="h-5 w-5 text-white" />
                    </div>
                    <h2 className="text-base font-black text-slate-900 dark:text-white">Tarefas Urgentes</h2>
                  </div>
                </div>

                <div className="relative z-10 p-4 space-y-3">
                  {metrics.urgentTasks.slice(0, 4).map(t => (
                    <Link
                      key={t.id}
                      href={`/clients/${t.client.id}/tasks`}
                      className="block p-4 rounded-xl bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-950/20 dark:to-rose-950/20 border border-red-200/50 dark:border-red-800/50 hover:shadow-lg hover:shadow-red-500/20 hover:-translate-y-1 transition-all duration-200 group"
                    >
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse shadow-lg shadow-red-500/50" />
                          <h4 className="font-bold text-sm truncate text-slate-900 dark:text-white group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors">
                            {t.title}
                          </h4>
                        </div>
                        <span className="px-2.5 py-1 rounded-lg bg-red-500 text-white text-[10px] font-black uppercase shrink-0">
                          {t.priority}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-400 mb-2 font-medium">
                        {t.client.name}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <span className="font-semibold">Score: {t.urgencyScore.toFixed(0)}</span>
                        {t.dueDate && (
                          <span>• {new Date(t.dueDate).toLocaleDateString('pt-BR')}</span>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>

                {metrics.urgentTasks.length > 4 && (
                  <div className="relative z-10 p-4 pt-0">
                    <Link
                      href="/clients"
                      className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-gradient-to-r from-red-500 to-rose-500 text-white font-bold text-sm hover:shadow-lg hover:shadow-red-500/30 transition-all duration-200 hover:-translate-y-0.5"
                    >
                      Ver todas
                      <ArrowUpRight className="h-4 w-4" />
                    </Link>
                  </div>
                )}
              </div>
            )}

            {/* Tarefas Prioritárias */}
            {priorities.length > 0 && (
              <div className="relative overflow-hidden rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 shadow-2xl shadow-slate-900/10">
                <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-br from-amber-500/10 to-orange-500/10 rounded-full blur-3xl" />

                <div className="relative z-10 p-6 border-b border-slate-200/50 dark:border-slate-800/50 bg-gradient-to-br from-slate-50/50 to-transparent dark:from-slate-800/30 dark:to-transparent">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 shadow-lg shadow-amber-500/25">
                      <ListTodo className="h-5 w-5 text-white" />
                    </div>
                    <h2 className="text-base font-black text-slate-900 dark:text-white">Tarefas Prioritárias</h2>
                  </div>
                </div>

                <div className="relative z-10 p-4 space-y-3">
                  {priorities.slice(0, 6).map(task => (
                    <Link
                      key={task.id}
                      href={`/clients/${task.client.id}/tasks`}
                      className="block p-4 rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 border border-amber-200/50 dark:border-amber-800/50 hover:shadow-lg hover:shadow-amber-500/20 hover:-translate-y-1 transition-all duration-200 group"
                    >
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <h4 className="font-bold text-sm truncate text-slate-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors flex-1">
                          {task.title}
                        </h4>
                        <span className="px-2.5 py-1 rounded-lg bg-amber-500 text-white text-[10px] font-black uppercase shrink-0">
                          {task.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-400 mb-2 font-medium">
                        {task.client.name}
                      </p>
                      {task.dueDate && (
                        <div className="flex items-center gap-1 text-xs text-slate-500">
                          <Clock className="h-3 w-3" />
                          {new Date(task.dueDate).toLocaleDateString('pt-BR')}
                        </div>
                      )}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

        </motion.div>
      </div>
    </div>
  )
}