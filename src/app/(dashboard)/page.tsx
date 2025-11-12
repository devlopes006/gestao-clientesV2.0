'use client'

import { AdminLink } from '@/components/AdminLink'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useUser } from '@/context/UserContext'
import { motion } from 'framer-motion'
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
      } catch (err) {
        console.error('Erro ao carregar dashboard:', err)
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
    } catch (err) {
      console.error('Erro ao fazer logout:', err)
    }
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-gray-600 animate-pulse">
          <div className="h-8 w-8 rounded-full border-4 border-t-transparent border-gray-400 animate-spin" />
          <p className="text-sm">Carregando dashboard...</p>
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
    <motion.div
      className="space-y-10 p-8 max-w-7xl mx-auto"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      {/* VISÃO GERAL + NAVBAR */}
      <header className="flex flex-wrap items-start justify-between gap-6">
        <div className="space-y-2">
          <p className="text-sm font-medium uppercase tracking-[0.25em] text-slate-400">
            Visão geral
          </p>
          <h1 className="text-3xl font-semibold text-slate-900">
            Painel de Gestão
          </h1>
          <p className="max-w-xl text-sm text-slate-500">
            Bem-vindo, <strong>{data.user.name || data.user.email}</strong>!
            Aqui está o resumo da sua operação.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <AdminLink />
          <Link href="/clients">
            <Button variant="outline">Ver clientes</Button>
          </Link>
          <Button onClick={handleLogout} variant="ghost">
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
          color="bg-blue-500/10 text-blue-700"
        />
        <KpiCard
          icon="📋"
          label="Tarefas pendentes"
          value={pendingTasks.length}
          color="bg-amber-500/10 text-amber-700"
        />
        <KpiCard
          icon="🔄"
          label="Em progresso"
          value={inProgressTasks.length}
          color="bg-purple-500/10 text-purple-700"
        />
        <KpiCard
          icon="✅"
          label="Concluídas"
          value={completedTasks.length}
          color="bg-emerald-500/10 text-emerald-700"
        />
      </section>

      {/* PRIORIDADES */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">
            Tarefas pendentes
          </h2>
          <Link
            href="/clients"
            className="text-xs text-brand-600 hover:underline"
          >
            ver tudo
          </Link>
        </div>

        {priorities.length === 0 ? (
          <Card className="p-6 text-sm text-slate-500">
            Nada pendente agora. Universo em equilíbrio ✨
          </Card>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {priorities.map((task) => (
              <Card
                key={task.id}
                className="p-4 flex flex-col gap-2 border-l-4 border-amber-400 bg-white/70"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="font-medium text-slate-800">{task.title}</p>
                  <span className="text-[10px] px-2 py-1 rounded-full bg-amber-100 text-amber-700 uppercase tracking-wide">
                    {task.status}
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  Cliente: {task.client.name}
                </p>
                {task.description && (
                  <p className="text-xs text-slate-400 line-clamp-2">
                    {task.description}
                  </p>
                )}
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* Insights extras: cliente com mais pendências / mais tarefas urgentes */}
      {metrics && (
        <section className="grid gap-4 md:grid-cols-2">
          {metrics.mostPendingClient && (
            <Card className="p-5 border-l-4 border-orange-400">
              <div className="text-xs uppercase tracking-wider text-slate-500 mb-1">
                Cliente com mais pendências
              </div>
              <div className="text-lg font-semibold text-slate-900">{metrics.mostPendingClient.name}</div>
              <div className="text-sm text-slate-600 mt-1">{metrics.mostPendingClient.pending} tarefas pendentes</div>
            </Card>
          )}
          {metrics.mostUrgentClient && (
            <Card className="p-5 border-l-4 border-red-500">
              <div className="text-xs uppercase tracking-wider text-slate-500 mb-1">
                Cliente com mais tarefas urgentes
              </div>
              <div className="text-lg font-semibold text-slate-900">{metrics.mostUrgentClient.name}</div>
              <div className="text-sm text-slate-600 mt-1">{metrics.mostUrgentClient.urgent} tarefa(s) urgente(s)</div>
            </Card>
          )}
        </section>
      )}

      {/* Tarefas Urgentes (de toda org) */}
      {metrics && metrics.urgentTasks.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">
              Tarefas Urgentes na Organização
            </h2>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {metrics.urgentTasks.slice(0, 10).map((t) => (
              <Card key={t.id} className="p-4 border-l-4 border-red-500 bg-red-50/30">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <div className="font-medium text-slate-900">{t.title}</div>
                    <div className="text-xs text-slate-600 mt-1">Cliente: {t.client.name}</div>
                    <div className="text-xs text-slate-500 mt-1">
                      Prioridade: {t.priority} • Score urgência: {t.urgencyScore}
                      {t.dueDate && <> • Prazo: {new Date(t.dueDate).toLocaleDateString('pt-BR')}</>}
                    </div>
                  </div>
                  <span className="text-[10px] px-2 py-1 rounded-full bg-red-100 text-red-700 uppercase tracking-wide">{t.status}</span>
                </div>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* CLIENTES RECENTES */}
      <section className="space-y-3 pb-10">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">
            Últimos clientes
          </h2>
          <Link
            href="/clients"
            className="text-xs text-brand-600 hover:underline"
          >
            ver todos
          </Link>
        </div>

        {clients.length === 0 ? (
          <Card className="p-6 text-sm text-slate-500">
            Nenhum cliente cadastrado ainda.
          </Card>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {clients.slice(0, 6).map((client) => {
              return (
                <Card
                  key={client.id}
                  className="p-5 rounded-2xl border border-slate-200 bg-white shadow-sm hover:shadow-md transition"
                >
                  <h3 className="font-medium text-slate-900">
                    {client.name || 'Sem nome'}
                  </h3>
                  {client.email && (
                    <p className="text-xs text-slate-500 mt-1">{client.email}</p>
                  )}
                  <p className="text-xs text-slate-400 mt-2">
                    Criado em:{' '}
                    {new Date(client.createdAt).toLocaleDateString('pt-BR', {
                      day: '2-digit',
                      month: 'short',
                    })}
                  </p>
                </Card>
              )
            })}
          </div>
        )}
      </section>
    </motion.div>
  )
}

function KpiCard({
  icon,
  label,
  value,
  color,
}: {
  icon: string
  label: string
  value: number
  color: string
}) {
  return (
    <Card
      className={`p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col gap-2 ${color}`}
    >
      <div className="text-3xl leading-none">{icon}</div>
      <div className="text-2xl font-semibold">{value}</div>
      <div className="text-sm opacity-80">{label}</div>
    </Card>
  )
}
