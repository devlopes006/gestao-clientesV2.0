import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { StatusBadge } from '@/features/clients/components/StatusBadge'
import { formatDate } from '@/lib/utils'
import { getSessionProfile } from '@/services/auth/session'
import { listClientsByOrg } from '@/services/repositories/clients'
import { ClientStatus } from '@/types/client'
import type { AppClient } from '@/types/tables'
import { ArrowLeft, Plus, Sparkles } from 'lucide-react'
import Link from 'next/link'

export const revalidate = 60

export default async function ClientsPage() {
  const { user, orgId } = await getSessionProfile()

  if (!user || !orgId) {
    return (
      <div className="relative min-h-screen bg-linear-to-br from-slate-50 via-blue-50/30 to-slate-100 dark:from-slate-950 dark:via-blue-950/20 dark:to-slate-900 flex items-center justify-center p-8">
        <Card className="p-8 text-center text-slate-500 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-dashed space-y-3 max-w-md">
          <p>Você precisa estar autenticado para ver os clientes.</p>
          <Button size="sm" className="rounded-full bg-linear-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
            <Link href="/login">Ir para login</Link>
          </Button>
        </Card>
      </div>
    )
  }

  let clients: AppClient[] = []
  try {
    clients = await listClientsByOrg(orgId)
  } catch {
    return (
      <div className="relative min-h-screen bg-linear-to-br from-slate-50 via-blue-50/30 to-slate-100 dark:from-slate-950 dark:via-blue-950/20 dark:to-slate-900 flex items-center justify-center p-8">
        <Card className="p-6 text-red-600 bg-rose-50/80 dark:bg-rose-950/20 backdrop-blur-sm border-rose-200 dark:border-rose-900 shadow-sm max-w-md">
          Erro ao carregar clientes. Tente novamente.
        </Card>
      </div>
    )
  }

  return (
    <div className="relative min-h-screen bg-linear-to-br from-slate-50 via-blue-50/30 to-slate-100 dark:from-slate-950 dark:via-blue-950/20 dark:to-slate-900">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 -left-4 w-96 h-96 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob" />
        <div className="absolute top-0 -right-4 w-96 h-96 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-2000" />
        <div className="absolute -bottom-8 left-20 w-96 h-96 bg-pink-400 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-4000" />
      </div>

      <div className="relative space-y-8 p-8 max-w-7xl mx-auto">
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="outline" size="sm" className="gap-2 backdrop-blur-sm bg-white/80 dark:bg-slate-900/80 border-slate-200 dark:border-slate-700">
                <ArrowLeft className="h-4 w-4" />
                Voltar
              </Button>
            </Link>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <div className="relative">
                  <div className="absolute inset-0 bg-linear-to-tr from-blue-600 to-purple-600 rounded-xl blur-md opacity-50" />
                  <div className="relative w-10 h-10 bg-linear-to-tr from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-white" />
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium uppercase tracking-[0.15em] text-slate-500 dark:text-slate-400">
                    Gestão de clientes
                  </p>
                  <h1 className="text-4xl font-bold bg-linear-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
                    Meus Clientes
                  </h1>
                </div>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400 max-w-md">
                Visualize e gerencie todos os clientes da sua organização com informações atualizadas.
              </p>
            </div>
            <Link href="/clients/new">
              <Button size="lg" className="rounded-full bg-linear-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 shadow-lg shadow-blue-500/30 gap-2">
                <Plus className="w-5 h-5" />
                Novo Cliente
              </Button>
            </Link>
          </div>
        </div>

        {!clients.length ? (
          <Card className="p-12 text-center border border-dashed text-slate-500 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm space-y-4">
            <div className="inline-flex w-16 h-16 rounded-2xl bg-linear-to-tr from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-600 items-center justify-center text-3xl mb-2">
              👥
            </div>
            <div>
              <p className="text-lg font-semibold text-slate-900 dark:text-white">Nenhum cliente cadastrado ainda.</p>
              <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Que tal começar agora?</p>
            </div>
            <Link href="/clients/new">
              <Button size="sm" className="mt-4 rounded-full bg-linear-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 gap-2">
                <Plus className="w-4 h-4" />
                Adicionar Cliente
              </Button>
            </Link>
          </Card>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {clients.map(client => (
              <Link key={client.id} href={`/clients/${client.id}/info`}>
                <Card className="group relative overflow-hidden rounded-3xl border border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm p-6 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                  <div className="relative flex flex-col gap-3">
                    <div className="flex items-start justify-between">
                      <h3 className="font-bold text-lg text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {client.name}
                      </h3>
                      <StatusBadge status={client.status as ClientStatus} />
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      {client.plan ?? '—'} • {client.main_channel ?? '—'}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-500">
                      Criado em <span className="font-medium">{formatDate(client.created_at)}</span>
                    </p>
                  </div>
                  <div className="absolute bottom-0 left-0 w-full h-1 bg-linear-to-r from-blue-600 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
