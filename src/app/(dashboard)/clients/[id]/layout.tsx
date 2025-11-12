import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { StatusBadge } from '@/features/clients/components/StatusBadge'
import { getSessionProfile } from '@/services/auth/session'
import { getClientById } from '@/services/repositories/clients'
import { ClientStatus } from '@/types/client'
import {
  ArrowLeft,
  Briefcase,
  Calendar,
  FileText,
  Image,
  Info,
  Lightbulb,
  ListTodo,
  Trash2,
  UserPlus
} from 'lucide-react'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'

interface ClientLayoutProps {
  children: React.ReactNode
  params: Promise<{ id: string }>
}

export default async function ClientLayout({ children, params }: ClientLayoutProps) {
  const { id } = await params
  const { user, orgId, role } = await getSessionProfile()

  if (!user || !orgId) {
    redirect('/login')
  }

  const client = await getClientById(id)

  if (!client || client.orgId !== orgId) {
    notFound()
  }

  // Se for CLIENT, verificar se tem acesso a este cliente
  if (role === 'CLIENT' && client.clientUserId !== user.id) {
    notFound()
  }

  const navItems = [
    { href: `/clients/${id}/info`, label: 'Informações', icon: Info },
    { href: `/clients/${id}/tasks`, label: 'Tarefas', icon: ListTodo },
    { href: `/clients/${id}/media`, label: 'Mídias', icon: Image },
    { href: `/clients/${id}/strategy`, label: 'Estratégia', icon: Lightbulb },
    { href: `/clients/${id}/branding`, label: 'Branding', icon: Briefcase },
    { href: `/clients/${id}/reports`, label: 'Relatórios', icon: FileText },
    { href: `/clients/${id}/meetings`, label: 'Reuniões', icon: Calendar },
    { href: `/clients/${id}/invite`, label: 'Convidar', icon: UserPlus },
    { href: `/clients/${id}/delete`, label: 'Excluir', icon: Trash2, destructive: true },
  ]

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link href="/clients">
            <Button variant="outline" size="sm" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </Button>
          </Link>
          <div className="flex-1">
            <h1 className="text-3xl font-semibold text-slate-900">{client.name}</h1>
            <p className="text-sm text-slate-500 mt-1">Gerencie todas as informações do cliente</p>
          </div>
          <StatusBadge status={client.status as ClientStatus} />
        </div>

        {/* Navigation Tabs */}
        <Card className="p-2">
          <nav className="flex flex-wrap gap-1">
            {navItems.map((item) => {
              const Icon = item.icon
              return (
                <Link key={item.href} href={item.href}>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`gap-2 ${item.destructive
                      ? 'text-red-600 hover:text-red-700 hover:bg-red-50'
                      : 'hover:bg-slate-100'
                      }`}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Button>
                </Link>
              )
            })}
          </nav>
        </Card>

        {/* Page Content */}
        {children}
      </div>
    </div>
  )
}
