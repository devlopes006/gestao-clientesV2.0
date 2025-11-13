import AppShell from '@/components/layout/AppShell'
import { PageHeader } from '@/components/layout/PageHeader'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { Card } from '@/components/ui/card'
import { getSessionProfile } from '@/services/auth/session'
import { Shield } from 'lucide-react'
import { redirect } from 'next/navigation'
import MembersAdminPage from './members/page'

export default async function AdminPage() {
  const { user, orgId, role } = await getSessionProfile()

  if (!user || !orgId) {
    redirect('/login')
  }

  if (role !== 'OWNER') {
    return (
      <ProtectedRoute>
        <AppShell>
          <div className="p-8">
            <Card className="p-8 text-center max-w-md mx-auto">
              <div className="space-y-4">
                <div className="text-5xl">🔒</div>
                <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">
                  Acesso Restrito
                </h1>
                <p className="text-slate-500 dark:text-slate-400">
                  Apenas proprietários da organização podem acessar esta página.
                </p>
              </div>
            </Card>
          </div>
        </AppShell>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <AppShell>
        <div className="p-6 sm:p-8 space-y-6">
          <PageHeader
            title="Administração"
            description="Gerencie membros e permissões da organização"
            icon={Shield}
            iconColor="bg-indigo-600"
          />
          <MembersAdminPage />
        </div>
      </AppShell>
    </ProtectedRoute>
  )
}
