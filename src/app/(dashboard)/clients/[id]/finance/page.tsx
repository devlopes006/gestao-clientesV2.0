import { FinanceManager } from '@/features/clients/components/FinanceManager'

interface ClientFinancePageProps {
  params: Promise<{ id: string }>
}

export default async function ClientFinancePage({ params }: ClientFinancePageProps) {
  const { id } = await params

  return <FinanceManager clientId={id} />
}
