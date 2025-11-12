'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

interface InvitePayload {
  id: string
  email: string
  roleRequested: string
  status: string
  expiresAt: string
  createdAt: string
}

export default function AcceptInvitePage({ params }: { params: { token: string } }) {
  const { token } = params
  const router = useRouter()
  const [invite, setInvite] = useState<InvitePayload | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/invites/accept?token=${token}`)
        const json = await res.json()
        if (!res.ok) throw new Error(json.error || 'Convite inválido')
        setInvite(json.data)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Erro ao validar convite')
      } finally {
        setLoading(false)
      }
    }
    void load()
  }, [token])

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-background">
      <div className="w-full max-w-lg">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Aceitar convite</CardTitle>
            <CardDescription>Revise os detalhes antes de prosseguir.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {loading && <p className="text-sm text-muted-foreground">Validando convite...</p>}
            {!loading && error && (
              <p className="text-sm font-medium text-destructive">{error}</p>
            )}
            {!loading && invite && (
              <div className="space-y-3 text-sm">
                <p><span className="font-medium">E-mail:</span> {invite.email}</p>
                <p><span className="font-medium">Papel:</span> {invite.roleRequested}</p>
                <p><span className="font-medium">Expira em:</span> {new Date(invite.expiresAt).toLocaleDateString('pt-BR')}</p>
                {invite.status !== 'PENDING' && (
                  <p className="text-xs text-muted-foreground">Status: {invite.status}</p>
                )}
              </div>
            )}
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => router.push('/login')}>Voltar</Button>
              <Button
                disabled={!invite || invite.status !== 'PENDING'}
                onClick={() => router.push(`/login?invite=${token}`)}
              >
                Aceitar e entrar
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
