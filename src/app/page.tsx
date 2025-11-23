import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export default async function HomeRedirect() {
  const cookieStore = await cookies()
  const token = cookieStore.get('auth')?.value
  if (!token) {
    redirect('/login')
  }
  redirect('/dashboard')
}
