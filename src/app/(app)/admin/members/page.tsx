'use client'

import { activateMemberAction, cancelInviteAction, deactivateMemberAction, deleteInviteAction, inviteStaffAction, resendInviteAction } from '@/app/(app)/admin/members/actions'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { DeleteMemberButton } from '@/features/admin/components/DeleteMemberButton'
import { UpdateRoleForm } from '@/features/admin/components/UpdateRoleForm'
import { Clock, Copy, Link as LinkIcon, Mail, RefreshCcw, Shield, Trash2, User, UserPlus, Users, XCircle } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import useSWR from 'swr'

// 🔹 Mapas de papéis
type Role = 'OWNER' | 'STAFF' | 'CLIENT'

const ROLE_LABEL: Record<Role, string> = {
  OWNER: 'Proprietário',
  STAFF: 'Equipe',
  CLIENT: 'Cliente',
}

const ROLE_DESCRIPTION: Record<Role, string> = {
  OWNER: 'Acesso total e gestão de permissões',
  STAFF: 'Pode gerenciar clientes e tarefas',
  CLIENT: 'Acesso restrito à própria área',
}

// 🔹 Fetcher para SWR
const fetcher = (url: string) => fetch(url).then((r) => r.json())
const invitesFetcher = (url: string) => fetch(url).then((r) => r.json())
const clientsFetcher = (url: string) => fetch(url).then((r) => r.json())

// 🔹 Tipagem do membro
type Member = {
  id: string
  user_id: string | null
  role: string | null
  status: string | null
  full_name?: string | null
  email?: string | null
  created_at: string | null
  org_id?: string | null
}

// 🔹 Utilitário de data
function formatDate(value: string | null): string {
  if (!value) return '—'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleDateString('pt-BR')
}

export default function MembersAdminPage() {
  const { data, error, isLoading, mutate } = useSWR('/api/members', fetcher)
  const { data: invitesData, mutate: mutateInvites } = useSWR('/api/invites', invitesFetcher)
  const { data: clientsData } = useSWR('/api/clients?lite=1', clientsFetcher)
  const [selectedRole, setSelectedRole] = useState<Role>('STAFF')
  const [selectedClient, setSelectedClient] = useState<string>('')
  const [submitting, setSubmitting] = useState(false)
  const [resendingId, setResendingId] = useState<string | null>(null)

  // 🕒 Carregamento elegante
  if (isLoading)
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] text-slate-500">
        <Clock className="h-6 w-6 mb-3 animate-spin" />
        Carregando informações...
      </div>
    )

  // 🧨 Erro de carregamento
  if (error || !data?.data)
    return (
      <div className="p-10 text-center text-red-600 font-medium">
        Erro ao carregar membros.
      </div>
    )

  const members: Member[] = data.data
  const totalByRole = members.reduce<Record<Role, number>>(
    (acc, member) => {
      const role = (member.role as Role) || 'CLIENT'
      acc[role] = (acc[role] || 0) + 1
      return acc
    },
    { OWNER: 0, STAFF: 0, CLIENT: 0 }
  )

  // 🔹 Envio de convites
  async function handleInvite(formData: FormData) {
    setSubmitting(true)
    try {
      const result = (await inviteStaffAction(formData)) as
        | { ok: true; reusedToken: boolean; emailSent: boolean }
        | undefined

      if (result && 'ok' in result) {
        if (result.reusedToken) {
          toast.success(
            result.emailSent
              ? 'Convite pendente encontrado: e-mail reenviado!'
              : 'Convite pendente encontrado: não foi possível reenviar e-mail'
          )
        } else {
          toast.success(
            result.emailSent
              ? 'Convite criado e e-mail enviado!'
              : 'Convite criado, mas não foi possível enviar e-mail'
          )
        }
      } else {
        toast.success('Convite processado.')
      }
      mutateInvites()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao enviar convite.')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleCancelInvite(inviteId: string) {
    try {
      if (!window.confirm('Cancelar este convite?')) return
      const fd = new FormData()
      fd.append('invite_id', inviteId)
      await cancelInviteAction(fd)
      toast.success('Convite cancelado')
      mutateInvites()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erro ao cancelar convite')
    }
  }

  async function handleDeleteInvite(inviteId: string) {
    try {
      if (!window.confirm('Excluir este convite permanentemente?')) return
      const fd = new FormData()
      fd.append('invite_id', inviteId)
      await deleteInviteAction(fd)
      toast.success('Convite excluído')
      mutateInvites()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erro ao excluir convite')
    }
  }

  async function handleResendInvite(inviteId: string) {
    try {
      setResendingId(inviteId)
      const fd = new FormData()
      fd.append('invite_id', inviteId)
      await resendInviteAction(fd)
      toast.success('Convite reenviado')
      mutateInvites()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erro ao reenviar convite')
    } finally {
      setResendingId(null)
    }
  }

  async function toggleMemberActive(memberId: string, currentStatus: string | null) {
    try {
      const fd = new FormData()
      fd.append('member_id', memberId)
      if (currentStatus === 'inactive') {
        await activateMemberAction(fd)
        toast.success('Membro ativado')
      } else {
        if (!window.confirm('Desativar este membro? Ele perderá o acesso.')) return
        await deactivateMemberAction(fd)
        toast.success('Membro desativado')
      }
      mutate()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erro ao atualizar status')
    }
  }

  function RoleBadge({ role }: { role: Role }) {
    const styles =
      role === 'OWNER'
        ? 'bg-violet-50 text-violet-700 border-violet-200'
        : role === 'STAFF'
          ? 'bg-sky-50 text-sky-700 border-sky-200'
          : 'bg-emerald-50 text-emerald-700 border-emerald-200'
    return (
      <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-medium ${styles}`}>
        {ROLE_LABEL[role]}
      </span>
    )
  }

  function MemberStatusBadge({ status }: { status: string | null }) {
    const active = status !== 'inactive'
    const styles = active
      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
      : 'bg-slate-100 text-slate-600 border-slate-200'
    return (
      <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium ${styles}`}>
        {active ? 'Ativo' : 'Inativo'}
      </span>
    )
  }

  function InviteStatusBadge({ status }: { status: string }) {
    const styles =
      status === 'PENDING'
        ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
        : status === 'ACCEPTED'
          ? 'bg-blue-50 text-blue-700 border-blue-200'
          : status === 'CANCELED'
            ? 'bg-amber-50 text-amber-700 border-amber-200'
            : 'bg-rose-50 text-rose-700 border-rose-200'
    return (
      <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-medium ${styles}`}>
        {status}
      </span>
    )
  }

  return (
    <div className="space-y-8 md:space-y-10">
      {/* Cabeçalho */}
      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-slate-900">Gerenciar Membros</h1>
        <p className="text-sm text-slate-500">Convide e gerencie membros da sua organização</p>
      </div>

      {/* 📨 CONVITE */}
      <Card className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-6 py-5 bg-slate-50 rounded-t-2xl">
          <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-slate-500" />
            Convidar novo membro
          </h2>
          <p className="text-sm text-slate-500">
            Envie um convite por e-mail para liberar acesso como cliente ou
            membro da equipe.
          </p>
        </div>

        <form
          action={handleInvite}
          className="grid gap-4 px-6 py-6"
        >
          <input type="hidden" name="allow_resend_existing" value="true" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <Label htmlFor="invite-email">E-mail</Label>
              <Input
                id="invite-email"
                name="email"
                type="email"
                required
                placeholder="pessoa@empresa.com"
                autoComplete="email"
                inputMode="email"
                pattern="[^\s@]+@[^\s@]+\.[^\s@]{2,}"
                className="border border-slate-300 bg-white"
              />
            </div>

            <div>
              <Label htmlFor="invite-role">Papel</Label>
              <select
                id="invite-role"
                name="role"
                value={selectedRole}
                onChange={(e) => {
                  setSelectedRole(e.target.value as Role)
                  setSelectedClient('') // Limpa seleção ao mudar papel
                }}
                className="h-11 w-full rounded-md border border-slate-300 bg-white px-4 text-sm font-medium text-slate-700 shadow-sm focus:ring-2 focus:ring-indigo-500"
                title="Selecionar papel"
                aria-label="Selecionar papel"
              >
                <option value="STAFF">Equipe</option>
                <option value="CLIENT">Cliente</option>
              </select>
            </div>

            {selectedRole === 'CLIENT' && (
              <div>
                <Label htmlFor="invite-client">Cliente</Label>
                <select
                  id="invite-client"
                  name="client_id"
                  value={selectedClient}
                  onChange={(e) => setSelectedClient(e.target.value)}
                  className="h-11 w-full rounded-md border border-slate-300 bg-white px-4 text-sm font-medium text-slate-700 shadow-sm focus:ring-2 focus:ring-indigo-500"
                  title="Selecionar cliente para vincular"
                  aria-label="Selecionar cliente para vincular"
                >
                  <option value="">Criar novo cliente automaticamente</option>
                  {clientsData?.data?.map((client: { id: string; name: string }) => (
                    <option key={client.id} value={client.id}>
                      {client.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="flex justify-end pt-2">
            <Button
              type="submit"
              disabled={submitting}
              className="bg-indigo-600 hover:bg-indigo-700 px-8 gap-2"
              aria-busy={submitting}
              aria-disabled={submitting}
            >
              {submitting ? (
                'Enviando...'
              ) : (
                <>
                  <UserPlus className="h-4 w-4" />
                  Enviar convite
                </>
              )}
            </Button>
          </div>
        </form>
      </Card>

      {/* 📊 RESUMO DE ROLES */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {(['OWNER', 'STAFF', 'CLIENT'] as Role[]).map((roleKey) => {
          const Icon =
            roleKey === 'OWNER' ? Shield : roleKey === 'STAFF' ? Users : User
          const count = totalByRole[roleKey]
          return (
            <Card
              key={roleKey}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.15em] text-slate-400">
                    {ROLE_LABEL[roleKey]}
                  </p>
                  <p className="text-3xl font-semibold text-slate-900">
                    {count}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    {ROLE_DESCRIPTION[roleKey]}
                  </p>
                </div>
                <Icon className="w-6 h-6 text-slate-400" />
              </div>
            </Card>
          )
        })}
      </div >

      {/* 👥 LISTA DE MEMBROS */}
      < Card className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden" >
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5 bg-slate-50">
          <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
            <Users className="h-5 w-5 text-slate-500" />
            Membros da organização
          </h2>
          <Badge
            variant="secondary"
            className="rounded-full px-3 py-1 text-xs uppercase tracking-wide"
          >
            {members.length} membro(s)
          </Badge>
        </div>

        {
          members.length === 0 ? (
            <p className="px-6 py-10 text-sm text-slate-500 text-center">
              Nenhum membro cadastrado até o momento.
            </p>
          ) : (
            <div className="divide-y divide-slate-100">
              {members.map((m) => (
                <div
                  key={m.id}
                  className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 px-6 py-5 hover:bg-slate-50/70 transition-colors"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-slate-900">
                        {m.full_name || m.email?.split('@')[0] || 'Usuário'}
                      </p>
                      <MemberStatusBadge status={m.status} />
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <span>{m.email || '—'}</span>
                      <span className="text-slate-300">•</span>
                      <span>Desde {formatDate(m.created_at)}</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 justify-end md:justify-start">
                    <RoleBadge role={(m.role as Role) || 'CLIENT'} />
                    <UpdateRoleForm
                      memberId={m.id}
                      currentRole={m.role || 'CLIENT'}
                      onSuccess={() => mutate()}
                    />

                    <Button
                      size="sm"
                      variant={m.status === 'inactive' ? 'secondary' : 'outline'}
                      onClick={() => toggleMemberActive(m.id, m.status)}
                      className="rounded-full"
                    >
                      {m.status === 'inactive' ? 'Ativar' : 'Desativar'}
                    </Button>

                    {m.role !== 'OWNER' && (
                      <DeleteMemberButton
                        memberId={m.id}
                        displayName={m.full_name || m.email || 'Usuário'}
                        onSuccess={() => mutate()}
                      />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )
        }
      </Card >

      {/* ✉️ CONVITES PENDENTES */}
      < Card className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden" >
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5 bg-slate-50">
          <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
            <Mail className="h-5 w-5 text-slate-500" />
            Convites pendentes
          </h2>
          <Badge variant="secondary" className="rounded-full px-3 py-1 text-xs uppercase tracking-wide">
            {invitesData?.data?.length || 0}
          </Badge>
        </div>
        {
          !invitesData?.data?.length ? (
            <p className="px-6 py-8 text-sm text-slate-500 text-center">Nenhum convite pendente.</p>
          ) : (
            <div className="divide-y divide-slate-100">
              {invitesData.data.map((invite: { id: string; email: string; roleRequested: string; status: string; expiresAt: string; token: string }) => (
                <div key={invite.id} className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 px-6 py-5 hover:bg-slate-50/70 transition-colors">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-slate-900">{invite.email}</p>
                      <RoleBadge role={(invite.roleRequested as Role) || 'CLIENT'} />
                    </div>
                    <p className="text-[11px] text-slate-500">Expira em {formatDate(invite.expiresAt)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <InviteStatusBadge status={invite.status} />
                    {invite.status === 'PENDING' && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleResendInvite(invite.id)}
                          disabled={resendingId === invite.id}
                        >
                          {resendingId === invite.id ? (
                            'Reenviando...'
                          ) : (
                            <>
                              <RefreshCcw className="h-3.5 w-3.5 mr-1" />
                              Reenviar
                            </>
                          )}
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleCancelInvite(invite.id)} className="gap-1">
                          <XCircle className="h-3.5 w-3.5" />
                          Cancelar
                        </Button>
                      </>
                    )}
                    <Button size="sm" variant="destructive" onClick={() => handleDeleteInvite(invite.id)} className="gap-1">
                      <Trash2 className="h-3.5 w-3.5" />
                      Excluir
                    </Button>
                    <a
                      href={`/invite/${invite.token}`}
                      className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:underline"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <LinkIcon className="h-3.5 w-3.5" /> Abrir link
                    </a>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={async () => {
                        try {
                          const url = `${window.location.origin}/invite/${invite.token}`
                          await navigator.clipboard.writeText(url)
                          toast.success('Link copiado')
                        } catch {
                          toast.error('Não foi possível copiar o link')
                        }
                      }}
                      className="gap-1"
                    >
                      <Copy className="h-3.5 w-3.5" /> Copiar
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )
        }
      </Card >
    </div >
  )
}
