import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { getSessionProfile } from '@/services/auth/session'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import MembersAdminPage from './members/page'

export default async function AdminPage() {
  const { user, orgId, role } = await getSessionProfile()

  // Redirecionar se não autenticado
  if (!user || !orgId) {
    redirect('/login')
  }

  // Apenas owners podem acessar
  if (role !== 'OWNER') {
    return (
      <div className="min-h-screen bg-slate-50 p-8">
        <div className="max-w-2xl mx-auto space-y-6">
          <Card className="p-8 text-center">
            <div className="space-y-4">
              <div className="text-5xl">🔒</div>
              <h1 className="text-2xl font-semibold text-slate-900">
                Acesso Restrito
              </h1>
              <p className="text-slate-500">
                Apenas proprietários da organização podem acessar esta página.
              </p>
              <div className="pt-4">
                <Link href="/">
                  <Button>Voltar ao Dashboard</Button>
                </Link>
              </div>
            </div>
          </Card>
        </div>
      </div>
    )
  }

  // Se for owner, renderizar página de membros
  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold text-slate-900">
            Administração
          </h1>
          <p className="text-sm text-slate-500">
            Gerencie membros e permissões da organização
          </p>
        </div>

        <MembersAdminPage />
      </div>
    </div>
  )
}
