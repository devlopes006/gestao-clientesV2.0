import { redirect } from 'next/navigation'

/**
 * Página de billing foi migrada para o novo sistema financeiro
 * Redirecionando para /app/financeiro
 */
export default function BillingPage() {
  redirect('/app/financeiro')
}
