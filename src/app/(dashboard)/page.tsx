'use client'

import { AdminLink } from '@/components/AdminLink'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useUser } from '@/context/UserContext'
import { motion } from 'framer-motion'
import { ArrowRight, Sparkles, Users } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

interface DashboardData {
  clients: Array<{
    id: string
    name: string
    email: string | null
    createdAt: Date
  }>
  tasks: Array<{
    id: string
    title: string
    status: string
    description: string | null
    createdAt: Date
    priority: string
    dueDate: Date | null
    client: {
      id: string
      name: string
    }
  }>
  user: {
    id: string
    name: string | null
    email: string
  }
  metrics?: {
    totals: { clients: number; tasks: number }
    mostPendingClient: { clientId: string; pending: number; name: string } | null
    mostUrgentClient: { clientId: string; urgent: number; name: string } | null
    urgentTasks: Array<{
      id: string
      title: string
      status: string
      priority: string
      dueDate: Date | null
      urgencyScore: number
      client: { id: string; name: string }
    }>
  }
}

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <RealtimeDashboard />
    </ProtectedRoute>
  )
}

function RealtimeDashboard() {
  const { logout } = useUser()
  const router = useRouter()
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadDashboard() {
      try {
        const res = await fetch('/api/dashboard')
        if (!res.ok) {
          throw new Error('Falha ao carregar dashboard')
        }
        const json = await res.json()
        setData(json)
      } catch {
        setError('Não foi possível carregar os dados.')
      } finally {
        setLoading(false)
      }
    }

    void loadDashboard()
  }, [])

  const handleLogout = async () => {
    try {
      await logout()
    } catch {
      // Error handled silently
    }
  }

  if (loading) {
    return (
      <div className="relative flex h-screen items-center justify-center bg-linear-to-br from-slate-50 via-blue-50/30 to-slate-100 dark:from-slate-950 dark:via-blue-950/20 dark:to-slate-900">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-linear-to-tr from-blue-500 to-purple-600 opacity-20 blur-xl animate-pulse" />
            <div className="relative h-16 w-16 rounded-full border-4 border-t-transparent border-blue-600 animate-spin" />
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400">Carregando dashboard...</p>
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="p-10 text-center">
        <p className="text-red-600 font-medium mb-4">{error || 'Erro desconhecido'}</p>
        <Button onClick={() => router.push('/login')}>Voltar ao login</Button>
      </div>
    )
  }

  const { clients, tasks } = data

  // Cálculos derivados com fix status
  const isPendingStatus = (s: string) => s === 'pending' || s === 'todo'
  const isInProgressStatus = (s: string) => s === 'in_progress' || s === 'in-progress'
  const isDoneStatus = (s: string) => s === 'done' || s === 'completed'

  const pendingTasks = tasks.filter((t) => isPendingStatus(t.status))
  const inProgressTasks = tasks.filter((t) => isInProgressStatus(t.status))
  const completedTasks = tasks.filter((t) => isDoneStatus(t.status))
  const priorities = pendingTasks.slice(0, 6)

  const metrics = data.metrics

  return (
    <div className="relative min-h-screen bg-linear-to-br from-slate-50 via-blue-50/30 to-slate-100 dark:from-slate-950 dark:via-blue-950/20 dark:to-slate-900">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 -left-4 w-96 h-96 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob" />
        <div className="absolute top-0 -right-4 w-96 h-96 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-2000" />
        <div className="absolute -bottom-8 left-20 w-96 h-96 bg-pink-400 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-4000" />
      </div>

      <motion.div
        className="relative space-y-8 p-8 max-w-7xl mx-auto"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* VISÃO GERAL + NAVBAR */}
        <header className="flex flex-wrap items-start justify-between gap-6">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="absolute inset-0 bg-linear-to-tr from-blue-600 to-purple-600 rounded-2xl blur-lg opacity-50" />
                <div className="relative w-12 h-12 bg-linear-to-tr from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
              </div>
              <div>
                <p className="text-sm font-medium uppercase tracking-[0.15em] text-slate-500 dark:text-slate-400">
                  Visão geral
                </p>
                <h1 className="text-4xl font-bold bg-linear-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
                  Painel de Gestão
                </h1>
              </div>
            </div>
            <p className="max-w-xl text-slate-600 dark:text-slate-400">
              Bem-vindo, <strong className="text-slate-900 dark:text-white">{data.user.name || data.user.email}</strong>!
              Aqui está o resumo completo da sua operação.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <AdminLink />
            <Link href="/finance">
              <Button variant="outline" className="gap-2 backdrop-blur-sm bg-white/80 dark:bg-slate-900/80 border-slate-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800">
                💰 Financeiro
              </Button>
            </Link>
            <Link href="/clients">
              <Button className="gap-2 bg-linear-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg shadow-blue-500/30">
                <Users className="w-4 h-4" />
                Ver clientes
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <Button onClick={handleLogout} variant="ghost" className="text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white">
              Sair
            </Button>
          </div>
        </header>

        {/* KPIs */}
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard
            icon="👥"
            label="Total de clientes"
            value={clients.length}
            iconBg="from-blue-500 to-blue-600"
            textColor="text-blue-700 dark:text-blue-400"
          />
          <KpiCard
            icon="📋"
            label="Tarefas pendentes"
            value={pendingTasks.length}
            iconBg="from-amber-500 to-orange-600"
            textColor="text-amber-700 dark:text-amber-400"
          />
          <KpiCard
            icon="🔄"
            label="Em progresso"
            value={inProgressTasks.length}
            iconBg="from-purple-500 to-purple-600"
            textColor="text-purple-700 dark:text-purple-400"
          />
          <KpiCard
            icon="✅"
            label="Concluídas"
            value={completedTasks.length}
            iconBg="from-emerald-500 to-emerald-600"
            textColor="text-emerald-700 dark:text-emerald-400"
          />
        </section>

        {/* PRIORIDADES */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
              Tarefas pendentes
            </h2>
            <Link
              href="/clients"
              className="text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors"
            >
              ver tudo →
            </Link>
          </div>

          {priorities.length === 0 ? (
            <Card className="p-8 text-center border border-dashed bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm">
              <p className="text-slate-600 dark:text-slate-400">Nada pendente agora. Universo em equilíbrio ✨</p>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {priorities.map((task) => (
                <Card
                  key={task.id}
                  className="p-5 border-l-4 border-amber-400 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm hover:shadow-lg transition-all duration-200"
                >
                  <div className="flex items-center justify-between gap-3 mb-2">
                    <p className="font-semibold text-slate-900 dark:text-white">{task.title}</p>
                    <span className="text-[10px] px-2 py-1 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 uppercase tracking-wide font-medium">
                      {task.status}
                    </span>
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Cliente: <span className="font-medium">{task.client.name}</span>
                  </p>
                  {task.description && (
                    <p className="text-sm text-slate-500 dark:text-slate-500 line-clamp-2 mt-2">
                      {task.description}
                    </p>
                  )}
                </Card>
              ))}
            </div>
          )}
        </section>

        {/* Insights extras */}
        {metrics && (
          <section className="grid gap-4 md:grid-cols-2">
            {metrics.mostPendingClient && (
              <Card className="p-6 border-l-4 border-orange-400 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
                <div className="text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                  Cliente com mais pendências
                </div>
                <div className="text-xl font-bold text-slate-900 dark:text-white">{metrics.mostPendingClient.name}</div>
                <div className="text-sm text-slate-600 dark:text-slate-400 mt-1">{metrics.mostPendingClient.pending} tarefas pendentes</div>
              </Card>
            )}
            {metrics.mostUrgentClient && (
              <Card className="p-6 border-l-4 border-red-500 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
                <div className="text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                  Cliente com mais tarefas urgentes
                </div>
                <div className="text-xl font-bold text-slate-900 dark:text-white">{metrics.mostUrgentClient.name}</div>
                <div className="text-sm text-slate-600 dark:text-slate-400 mt-1">{metrics.mostUrgentClient.urgent} tarefa(s) urgente(s)</div>
              </Card>
            )}
          </section>
        )}

        {/* Tarefas Urgentes */}
        {metrics && metrics.urgentTasks.length > 0 && (
          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
              Tarefas Urgentes na Organização
            </h2>
            <div className="grid gap-4 md:grid-cols-2">
              {metrics.urgentTasks.slice(0, 10).map((t) => (
                <Card key={t.id} className="p-5 border-l-4 border-red-500 bg-red-50/50 dark:bg-red-950/20 backdrop-blur-sm">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <div className="font-semibold text-slate-900 dark:text-white">{t.title}</div>
                      <div className="text-sm text-slate-600 dark:text-slate-400 mt-1">Cliente: {t.client.name}</div>
                      <div className="text-xs text-slate-500 dark:text-slate-500 mt-2">
                        Prioridade: {t.priority} • Score: {t.urgencyScore}
                        {t.dueDate && <> • Prazo: {new Date(t.dueDate).toLocaleDateString('pt-BR')}</>}
                      </div>
                    </div>
                    <span className="text-[10px] px-2 py-1 rounded-full bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 uppercase tracking-wide font-medium">{t.status}</span>
                  </div>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* CLIENTES RECENTES */}
        <section className="space-y-4 pb-10">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
              Últimos clientes
            </h2>
            <Link
              href="/clients"
              className="text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors"
            >
              ver todos →
            </Link>
          </div>

          {clients.length === 0 ? (
            <Card className="p-8 text-center border border-dashed bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm">
              <p className="text-slate-600 dark:text-slate-400">Nenhum cliente cadastrado ainda.</p>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {clients.slice(0, 6).map((client) => (
                <Card
                  key={client.id}
                  className="p-6 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
                >
                  <h3 className="font-semibold text-lg text-slate-900 dark:text-white">
                    {client.name || 'Sem nome'}
                  </h3>
                  {client.email && (
                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{client.email}</p>
                  )}
                  <p className="text-xs text-slate-500 dark:text-slate-500 mt-3">
                    Criado em{' '}
                    {new Date(client.createdAt).toLocaleDateString('pt-BR', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </p>
                </Card>
              ))}
            </div>
          )}
        </section>
      </motion.div>
    </div>
  )
}

function KpiCard({
  icon,
  label,
  value,
  iconBg,
  textColor,
}: {
  icon: string
  label: string
  value: number
  iconBg: string
  textColor: string
}) {
  return (
    <Card className="relative overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm hover:shadow-lg transition-all duration-300 group">
      <div className="p-6 space-y-3">
        <div className={`inline-flex w-12 h-12 rounded-xl bg-linear-to-tr ${iconBg} items-center justify-center text-2xl shadow-lg group-hover:scale-110 transition-transform duration-300`}>
          {icon}
        </div>
        <div className={`text-3xl font-bold ${textColor}`}>{value}</div>
        <div className="text-sm text-slate-600 dark:text-slate-400">{label}</div>
      </div>
      <div className={`absolute bottom-0 left-0 w-full h-1 bg-linear-to-r ${iconBg} opacity-50`} />
    </Card>
  )
}
