import { FinanceManagerGlobal } from '@/features/finance/components/FinanceManagerGlobal'
import { getSessionProfile } from '@/services/auth/session'
import { redirect } from 'next/navigation'

export default async function FinancePage() {
  const { orgId, role } = await getSessionProfile()

  if (!orgId || !role) {
    redirect('/login')
  }

  return <FinanceManagerGlobal orgId={orgId} />
}
