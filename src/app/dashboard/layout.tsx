import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies()
  const token = cookieStore.get('auth')?.value
  if (!token) {
    redirect('/login')
  }

  // If needed later, enforce role-based redirects here
  // const role = cookieStore.get('role')?.value
  // if (role === 'CLIENT') redirect('/clients')

  return <>{children}</>
}
