'use client'
import { auth, provider } from '@/lib/firebase'
import { onAuthStateChanged, signInWithPopup, signOut, User } from 'firebase/auth'
import { useRouter } from 'next/navigation'
import { createContext, ReactNode, useContext, useEffect, useState } from 'react'

interface UserContextType {
  user: User | null
  loading: boolean
  loginWithGoogle: () => Promise<void>
  logout: () => Promise<void>
}

const UserContext = createContext<UserContextType | undefined>(undefined)

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    if (!auth) {
      // If auth is not initialized (missing env or server-side), don't try to
      // subscribe. Mark loading as false so the UI can continue.
      // Avoid synchronous setState inside effect body (can trigger cascading renders)
      Promise.resolve().then(() => setLoading(false))
      return
    }

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  const loginWithGoogle = async () => {
    if (!auth || !provider) throw new Error('Firebase auth not initialized')

    // Faz login com Google
    await signInWithPopup(auth, provider)
    const idToken = await auth.currentUser?.getIdToken()
    if (!idToken) throw new Error('Falha ao obter ID token do usuário')

    // Seta cookie de sessão HttpOnly e faz onboarding via rota API
    const response = await fetch('/api/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken }),
    })

    if (!response.ok) {
      throw new Error('Falha ao criar sessão')
    }

    // Redireciona para dashboard sem reload
    router.push('/dashboard')
  }

  const logout = async () => {
    if (!auth) throw new Error('Firebase auth not initialized')

    try {
      // Remove cookie do servidor PRIMEIRO
      await fetch('/api/logout', { method: 'POST' })

      // Faz logout do Firebase
      await signOut(auth)

      // Redireciona para login sem reload
      router.push('/login')
    } catch (error) {
      console.error('Erro ao fazer logout:', error)
      // Mesmo com erro, tenta redirecionar
      router.push('/login')
    }
  }

  return (
    <UserContext.Provider value={{ user, loading, loginWithGoogle, logout }}>
      {children}
    </UserContext.Provider>
  )
}

export const useUser = () => {
  const ctx = useContext(UserContext)
  if (!ctx) throw new Error('useUser deve ser usado dentro de UserProvider')
  return ctx
}
