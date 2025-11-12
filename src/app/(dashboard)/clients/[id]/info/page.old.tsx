import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { StatusBadge } from '@/features/clients/components/StatusBadge'
import { formatDate } from '@/lib/utils'
import { getSessionProfile } from '@/services/auth/session'
import { getClientById } from '@/services/repositories/clients'
import { ClientStatus } from '@/types/client'

interface ClientInfoPageProps {
  params: Promise<{ id: string }>
}

function Kpi({ label, value }: { label: string; value: number }) {
  return (
    <Card className="p-4">
      <div className="text-xs text-slate-500">{label}</div>
      <div className="text-xl font-semibold">{value}</div>
    </Card>
  )
}

export default async function ClientInfoPage({ params }: ClientInfoPageProps) {
  const { id } = await params
  const { orgId } = await getSessionProfile()
  const client = await getClientById(id)

  if (!client || client.orgId !== orgId) {
    return null
  }

  const base = process.env.NEXT_PUBLIC_APP_URL || ''
  interface ClientDashboard {
    counts: {
      tasks: { total: number; todo: number; inProgress: number; done: number }
      finance: { income: number; expense: number; net: number }
    }
    meetings: Array<{ id: string; title: string; startTime: string }>
    urgentTasks: Array<{ id: string; title: string; status: string; priority: string; dueDate: string | null }>
  }
  let dash: ClientDashboard | null = null
  try {
    const res = await fetch(`${base}/api/clients/${id}/dashboard`, { cache: 'no-store' })
    if (res.ok) dash = (await res.json()) as ClientDashboard
  } catch { }

  return (
    <div className="space-y-6">
      {dash && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Kpi label="Tarefas (total)" value={dash.counts.tasks.total} />
          <Kpi label="Pendentes" value={dash.counts.tasks.todo} />
          <Kpi label="Em Progresso" value={dash.counts.tasks.inProgress} />
          <Kpi label="Concluídas" value={dash.counts.tasks.done} />
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Informações de Contato</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Email</div>
              <div className="text-sm text-slate-900">
                {client.email ? <a href={`mailto:${client.email}`} className="hover:underline text-blue-600">{client.email}</a> : <span className="text-slate-400">Não informado</span>}
              </div>
            </div>
            <div>
              <div className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Telefone</div>
              <div className="text-sm text-slate-900">
                {client.phone ? <a href={`tel:${client.phone}`} className="hover:underline text-blue-600">{client.phone}</a> : <span className="text-slate-400">Não informado</span>}
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Informações Comerciais</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Plano</div>
              <div className="text-sm text-slate-900">{client.plan || <span className="text-slate-400">Não definido</span>}</div>
            </div>
            <div>
              <div className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Canal Principal</div>
              <div className="text-sm text-slate-900">{client.main_channel || <span className="text-slate-400">Não definido</span>}</div>
            </div>
            <div>
              <div className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Status</div>
              <div className="text-sm text-slate-900"><StatusBadge status={client.status as ClientStatus} /></div>
            </div>
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Metadados</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <div className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">ID do Cliente</div>
              <div className="text-sm text-slate-900 font-mono bg-slate-100 px-2 py-1 rounded">{client.id}</div>
            </div>
            <div>
              <div className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">ID da Organização</div>
              <div className="text-sm text-slate-900 font-mono bg-slate-100 px-2 py-1 rounded">{client.orgId}</div>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <div className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Criado em</div>
              <div className="text-sm text-slate-900">{formatDate(client.created_at)}</div>
            </div>
            <div>
              <div className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Última atualização</div>
              <div className="text-sm text-slate-900">{formatDate(client.updated_at)}</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}