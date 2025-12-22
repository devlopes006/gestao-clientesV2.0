'use client'

import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle, Mail, RefreshCw } from 'lucide-react'
import { useState } from 'react'

interface ExpiredInviteCardProps {
  token: string
  expiresAt: Date
  adminEmail: string
}

export function ExpiredInviteCard({
  token,
  expiresAt,
  adminEmail
}: ExpiredInviteCardProps) {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const handleResend = async () => {
    try {
      setLoading(true)
      setMessage(null)

      const res = await fetch('/api/invites/resend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token })
      })

      const data = await res.json()

      if (res.ok) {
        setMessage({
          type: 'success',
          text: data.message || 'Convite renovado! Verifique seu email.'
        })
      } else {
        setMessage({
          type: 'error',
          text: data.error || 'Erro ao renovar convite'
        })
      }
    } catch (err) {
      setMessage({
        type: 'error',
        text: 'Erro na conexão. Tente novamente.'
      })
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('pt-BR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  return (
    <Card className='w-full max-w-md mx-auto'>
      <CardHeader>
        <div className='flex items-center gap-2 text-yellow-600'>
          <AlertCircle className='h-5 w-5' />
          <CardTitle>Convite Expirado</CardTitle>
        </div>
        <CardDescription>
          Esse convite expirou em {formatDate(expiresAt)}
        </CardDescription>
      </CardHeader>

      <CardContent className='space-y-4'>
        {message && (
          <Alert variant={message.type === 'success' ? 'default' : 'destructive'}>
            <AlertDescription>{message.text}</AlertDescription>
          </Alert>
        )}

        {(!message || message.type === 'error') && (
          <Button
            onClick={handleResend}
            disabled={loading}
            className='w-full'
          >
            {loading ? (
              <>
                <RefreshCw className='mr-2 h-4 w-4 animate-spin' />
                Renovando...
              </>
            ) : (
              <>
                <RefreshCw className='mr-2 h-4 w-4' />
                Solicitar novo convite
              </>
            )}
          </Button>
        )}

        <div className='border-t pt-4'>
          <p className='text-sm text-muted-foreground flex items-center gap-2'>
            <Mail className='h-4 w-4' />
            <span>
              <strong>Dúvidas?</strong> Entre em contato:{' '}
              <code className='text-xs bg-muted px-2 py-1 rounded'>{adminEmail}</code>
            </span>
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
