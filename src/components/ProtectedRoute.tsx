'use client'

import { useUser } from '@/context/UserContext'
import { db } from '@/lib/firebase'
import { doc, getDoc } from 'firebase/firestore'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useUser()
  const router = useRouter()

  const [checking, setChecking] = useState(true)

  useEffect(() => {
    const verifyOrg = async () => {
      // Ainda está carregando o estado de autenticação
      if (loading) {
        setChecking(true)
        return
      }

      // Sem usuário → redireciona para login
      if (!user) {
        router.replace('/login')
        return
      }

      // Firestore não inicializado
      if (!db) {
        console.error('❌ Firestore não inicializado!')
        setChecking(false)
        return
      }

      try {
        // Primeiro buscamos o documento do usuário para obter orgId
        const userRef = doc(db, 'users', user.uid)
        const userSnap = await getDoc(userRef)

        if (!userSnap.exists()) {
          // Usuário ainda não foi provisionado pelo fluxo de callback admin
          router.replace('/onboarding')
          return
        }

        const data = userSnap.data() as { orgId?: string }
        if (!data?.orgId) {
          router.replace('/onboarding')
          return
        }

        // Verifica se a organização existe
        const orgRef = doc(db, 'orgs', data.orgId)
        const orgSnap = await getDoc(orgRef)
        if (!orgSnap.exists()) {
          router.replace('/onboarding')
          return
        }

        // Tudo OK, permite acesso
        setChecking(false)
      } catch (err) {
        console.error('⚠️ Erro ao verificar organização do usuário:', err)
        setChecking(false)
      }
    }

    void verifyOrg()
  }, [user, loading, router])

  // Mostra loading enquanto verifica
  if (loading || checking) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3 text-gray-600 animate-pulse">
          <div className="h-8 w-8 rounded-full border-4 border-t-transparent border-gray-400 animate-spin" />
          <p className="text-sm">
            {loading ? 'Carregando...' : 'Verificando conta...'}
          </p>
        </div>
      </div>
    )
  }

  // Caso não tenha usuário após loading (previne render prematuro)
  if (!user) return null

  return <>{children}</>
}
