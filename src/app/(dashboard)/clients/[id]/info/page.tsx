import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ProgressBar } from '@/components/ui/progress-bar'
import { ClientInfoDisplay } from '@/features/clients/components/ClientInfoDisplay'
import ContractManager from '@/features/clients/components/ContractManager'
import { StatusBadge } from '@/features/clients/components/StatusBadge'
import { can } from '@/lib/permissions'
import { formatDate } from '@/lib/utils'
import { getSessionProfile } from '@/services/auth/session'
import { getClientById } from '@/services/repositories/clients'
import { ClientStatus } from '@/types/client'
import {
  CalendarDays,
  Clock,
  DollarSign,
  FileText,
  FolderKanban,
  Image as ImageIcon,
  Lightbulb,
  TrendingUp,
  Users,
  Video,
} from 'lucide-react'

interface ClientInfoPageProps {
  params: Promise<{ id: string }>
}

function StatCard({
  icon: Icon,
  label,
  value,
  subtitle,
  trend,
}: {
  icon: React.ElementType
  label: string
  value: string | number
  subtitle?: string
  trend?: 'up' | 'down' | 'neutral'
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 text-sm text-slate-500 mb-1">
              <Icon className="h-4 w-4" />
              <span>{label}</span>
            </div>
            <div className="text-2xl font-bold text-slate-900">{value}</div>
            {subtitle && (
              <p className="text-xs text-slate-500 mt-1">{subtitle}</p>
            )}
          </div>
          {trend && (
            <div
              className={`text-xs font-medium px-2 py-1 rounded ${trend === 'up'
                ? 'bg-green-100 text-green-700'
                : trend === 'down'
                  ? 'bg-red-100 text-red-700'
                  : 'bg-slate-100 text-slate-700'
                }`}
            >
              {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export default async function ClientInfoPage({ params }: ClientInfoPageProps) {
  const { id } = await params
  const { orgId, role } = await getSessionProfile()

  if (!role) return null

  const client = await getClientById(id)

  if (!client || client.orgId !== orgId) {
    return null
  }

  const base = process.env.NEXT_PUBLIC_APP_URL || ''

  interface ClientDashboard {
    counts: {
      tasks: { total: number; todo: number; inProgress: number; done: number; overdue: number }
      finance: { income: number; expense: number; net: number }
      media: number
      brandings: number
      strategies: number
    }
    meetings: Array<{ id: string; title: string; startTime: string; description?: string }>
    urgentTasks: Array<{
      id: string
      title: string
      status: string
      priority: string
      dueDate: string | null
      urgencyScore: number
    }>
  }

  let dash: ClientDashboard | null = null
  try {
    const res = await fetch(`${base}/api/clients/${id}/dashboard`, {
      cache: 'no-store',
    })
    if (res.ok) dash = (await res.json()) as ClientDashboard
  } catch { }

  const isOwner = can(role, 'update', 'finance')

  const nextPayment = client.payment_day
    ? (() => {
      const today = new Date()
      const currentMonth = today.getMonth()
      const currentYear = today.getFullYear()
      let nextPaymentDate = new Date(currentYear, currentMonth, client.payment_day)

      if (nextPaymentDate < today) {
        nextPaymentDate = new Date(currentYear, currentMonth + 1, client.payment_day)
      }

      const daysUntil = Math.ceil((nextPaymentDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
      return { date: nextPaymentDate, daysUntil }
    })()
    : null

  const contractDuration =
    client.contract_start && client.contract_end
      ? (() => {
        const diffMs = new Date(client.contract_end).getTime() - new Date(client.contract_start).getTime()
        const diffMonths = Math.round(diffMs / (1000 * 60 * 60 * 24 * 30))
        return diffMonths
      })()
      : null

  return (
    <div className="space-y-6">
      {/* Editor de informações básicas */}
      <ClientInfoDisplay client={client} canEdit={isOwner} />

      {/* Contract Manager */}
      {isOwner && (
        <ContractManager
          clientId={client.id}
          clientName={client.name}
          contractStart={client.contract_start}
          contractEnd={client.contract_end}
          paymentDay={client.payment_day}
          contractValue={client.contract_value}
        />
      )}

      {isOwner && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            icon={DollarSign}
            label="Valor do Contrato"
            value={
              client.contract_value
                ? `R$ ${client.contract_value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                : 'Não definido'
            }
            subtitle={client.plan ? `Plano: ${client.plan}` : undefined}
          />
          <StatCard
            icon={CalendarDays}
            label="Próximo Pagamento"
            value={nextPayment ? `${nextPayment.daysUntil} dias` : 'Não definido'}
            subtitle={
              nextPayment
                ? new Date(nextPayment.date).toLocaleDateString('pt-BR', {
                  day: '2-digit',
                  month: 'short',
                })
                : client.payment_day
                  ? `Dia ${client.payment_day} de cada mês`
                  : undefined
            }
            trend={nextPayment && nextPayment.daysUntil <= 5 ? 'down' : 'neutral'}
          />
          <StatCard
            icon={Clock}
            label="Duração do Contrato"
            value={contractDuration ? `${contractDuration} meses` : 'Indefinido'}
            subtitle={
              client.contract_end
                ? `Até ${new Date(client.contract_end).toLocaleDateString('pt-BR')}`
                : 'Sem data de término'
            }
          />
          <StatCard
            icon={TrendingUp}
            label="Receita vs Despesa"
            value={
              dash && dash.counts.finance.net !== 0
                ? `R$ ${Math.abs(dash.counts.finance.net).toLocaleString('pt-BR')}`
                : 'R$ 0'
            }
            subtitle={
              dash
                ? `Receita: R$ ${dash.counts.finance.income} | Despesa: R$ ${dash.counts.finance.expense}`
                : undefined
            }
            trend={
              dash && dash.counts.finance.net > 0
                ? 'up'
                : dash && dash.counts.finance.net < 0
                  ? 'down'
                  : 'neutral'
            }
          />
        </div>
      )}

      {dash && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            icon={FolderKanban}
            label="Tarefas Ativas"
            value={dash.counts.tasks.total - dash.counts.tasks.done}
            subtitle={`${dash.counts.tasks.done} concluídas de ${dash.counts.tasks.total} total`}
            trend={dash.counts.tasks.overdue > 0 ? 'down' : 'up'}
          />
          <StatCard
            icon={ImageIcon}
            label="Mídias"
            value={dash.counts.media}
            subtitle="Arquivos no sistema"
          />
          <StatCard
            icon={Lightbulb}
            label="Estratégias"
            value={dash.counts.strategies}
            subtitle="Documentos estratégicos"
          />
          <StatCard
            icon={FileText}
            label="Brandings"
            value={dash.counts.brandings}
            subtitle="Materiais de marca"
          />
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {dash && dash.urgentTasks.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FolderKanban className="h-5 w-5" />
                  Tarefas Urgentes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {dash.urgentTasks.slice(0, 5).map((task) => (
                    <div
                      key={task.id}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm text-slate-900 truncate">
                          {task.title}
                        </h4>
                        <div className="flex items-center gap-2 mt-1">
                          <span
                            className={`text-xs px-2 py-0.5 rounded font-medium ${task.priority === 'high'
                              ? 'bg-red-100 text-red-700'
                              : task.priority === 'medium'
                                ? 'bg-amber-100 text-amber-700'
                                : 'bg-slate-100 text-slate-700'
                              }`}
                          >
                            {task.priority === 'high'
                              ? 'Alta'
                              : task.priority === 'medium'
                                ? 'Média'
                                : 'Baixa'}
                          </span>
                          {task.dueDate && (
                            <span className="text-xs text-slate-500">
                              Prazo: {new Date(task.dueDate).toLocaleDateString('pt-BR')}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs font-medium text-slate-500">
                          Urgência
                        </div>
                        <div className="text-lg font-bold text-red-600">
                          {task.urgencyScore.toFixed(0)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {dash && (
            <Card>
              <CardHeader>
                <CardTitle>Progresso de Tarefas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-slate-700">Pendentes</span>
                    <span className="text-sm font-bold text-amber-600">
                      {dash.counts.tasks.todo}
                    </span>
                  </div>
                  <ProgressBar
                    value={dash.counts.tasks.todo}
                    max={dash.counts.tasks.total}
                    color="amber"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-slate-700">Em Progresso</span>
                    <span className="text-sm font-bold text-blue-600">
                      {dash.counts.tasks.inProgress}
                    </span>
                  </div>
                  <ProgressBar
                    value={dash.counts.tasks.inProgress}
                    max={dash.counts.tasks.total}
                    color="blue"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-slate-700">Concluídas</span>
                    <span className="text-sm font-bold text-green-600">
                      {dash.counts.tasks.done}
                    </span>
                  </div>
                  <ProgressBar
                    value={dash.counts.tasks.done}
                    max={dash.counts.tasks.total}
                    color="green"
                  />
                </div>
                {dash.counts.tasks.overdue > 0 && (
                  <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-700 font-medium">
                      ⚠️ {dash.counts.tasks.overdue} tarefa(s) atrasada(s)
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Informações de Contato
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <div className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">
                    Email
                  </div>
                  <div className="text-sm text-slate-900">
                    {client.email ? (
                      <a
                        href={`mailto:${client.email}`}
                        className="hover:underline text-blue-600"
                      >
                        {client.email}
                      </a>
                    ) : (
                      <span className="text-slate-400">Não informado</span>
                    )}
                  </div>
                </div>
                <div>
                  <div className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">
                    Telefone
                  </div>
                  <div className="text-sm text-slate-900">
                    {client.phone ? (
                      <a
                        href={`tel:${client.phone}`}
                        className="hover:underline text-blue-600"
                      >
                        {client.phone}
                      </a>
                    ) : (
                      <span className="text-slate-400">Não informado</span>
                    )}
                  </div>
                </div>
                <div>
                  <div className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">
                    Canal Principal
                  </div>
                  <div className="text-sm text-slate-900">
                    {client.main_channel || <span className="text-slate-400">Não definido</span>}
                  </div>
                </div>
                <div>
                  <div className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">
                    Status
                  </div>
                  <div className="text-sm text-slate-900">
                    <StatusBadge status={client.status as ClientStatus} />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          {dash && dash.meetings.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Video className="h-5 w-5" />
                  Próximas Reuniões
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {dash.meetings.slice(0, 3).map((meeting) => (
                    <div
                      key={meeting.id}
                      className="p-3 border rounded-lg hover:bg-slate-50 transition-colors"
                    >
                      <h4 className="font-medium text-sm text-slate-900 mb-1">
                        {meeting.title}
                      </h4>
                      <p className="text-xs text-slate-500">
                        {new Date(meeting.startTime).toLocaleString('pt-BR', {
                          day: '2-digit',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                      {meeting.description && (
                        <p className="text-xs text-slate-600 mt-2 line-clamp-2">
                          {meeting.description}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {isOwner && (
            <Card className="border-amber-200 bg-amber-50/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-amber-900">
                  <FileText className="h-5 w-5" />
                  Dados do Contrato
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <div className="text-xs font-medium text-amber-700 uppercase tracking-wider mb-1">
                    Início do Contrato
                  </div>
                  <div className="text-sm text-amber-900">
                    {client.contract_start
                      ? new Date(client.contract_start).toLocaleDateString('pt-BR')
                      : 'Não definido'}
                  </div>
                </div>
                <div>
                  <div className="text-xs font-medium text-amber-700 uppercase tracking-wider mb-1">
                    Término do Contrato
                  </div>
                  <div className="text-sm text-amber-900">
                    {client.contract_end
                      ? new Date(client.contract_end).toLocaleDateString('pt-BR')
                      : 'Indefinido'}
                  </div>
                </div>
                <div>
                  <div className="text-xs font-medium text-amber-700 uppercase tracking-wider mb-1">
                    Dia de Pagamento
                  </div>
                  <div className="text-sm text-amber-900">
                    {client.payment_day ? `Dia ${client.payment_day}` : 'Não definido'}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Metadados</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <div className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">
                  Criado em
                </div>
                <div className="text-sm text-slate-900">
                  {formatDate(client.created_at)}
                </div>
              </div>
              <div>
                <div className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">
                  Última atualização
                </div>
                <div className="text-sm text-slate-900">
                  {formatDate(client.updated_at)}
                </div>
              </div>
              <div>
                <div className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">
                  ID do Cliente
                </div>
                <div className="text-xs text-slate-900 font-mono bg-slate-100 px-2 py-1 rounded break-all">
                  {client.id}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
