'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useUser } from '@/context/UserContext'
import { cn } from '@/lib/utils'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function LoginPage() {
  const { loginWithGoogle, loading, user } = useUser()
  const router = useRouter()

  useEffect(() => {
    if (!loading && user) {
      router.replace('/')
    }
  }, [loading, user, router])

  return (
    <div className="relative flex min-h-screen w-full flex-col lg:flex-row bg-background">
      {/* Decorative gradient / brand panel */}
      <div className="relative hidden lg:flex lg:w-5/12 xl:w-1/2 flex-col justify-between overflow-hidden p-10 text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,var(--color-brand-500),transparent_70%)]" aria-hidden="true" />
        <div className="absolute inset-0 bg-linear-to-br from-brand-800 via-brand-700 to-brand-600 opacity-90" aria-hidden="true" />
        <div className="relative z-10 flex flex-col gap-8">
          <div>
            <h1 className="text-4xl font-bold tracking-tight">
              MyGest<span className="text-brand-300">.</span>
            </h1>
            <p className="mt-4 max-w-sm text-brand-100 leading-relaxed">
              Plataforma moderna para gestão de clientes, tarefas e ativos de mídia – produtividade com elegância.
            </p>
          </div>
          <ul className="space-y-4 text-sm text-brand-100/90">
            <li className="flex items-start gap-3">
              <span className="mt-1 size-2 rounded-full bg-brand-300" />
              <span>Visão centralizada dos clientes e status do relacionamento.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-1 size-2 rounded-full bg-brand-300" />
              <span>Workflow de equipe com papéis e permissões.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-1 size-2 rounded-full bg-brand-300" />
              <span>Organização de tarefas e conteúdos em um só lugar.</span>
            </li>
          </ul>
        </div>
        <div className="relative z-10 mt-auto text-xs text-brand-200/70">
          © {new Date().getFullYear()} MyGest. Todos os direitos reservados.
        </div>
        {/* Subtle glass overlay for depth */}
        <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" aria-hidden="true" />
      </div>

      {/* Auth form panel */}
      <div className="flex w-full flex-1 items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-md">
          <Card className={cn('border border-border/60 bg-card/95 backdrop-blur-sm shadow-xl shadow-brand-900/5')}>
            <CardHeader>
              <CardTitle className="text-2xl">Acessar conta</CardTitle>
              <CardDescription>
                Entre para continuar gerenciando sua operação.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Utilize sua conta Google para autenticação segura e rápida.
                </p>
              </div>
              <Button
                onClick={() => loginWithGoogle()}
                disabled={loading}
                className="w-full h-11 text-base font-semibold shadow-sm shadow-brand-700/30 hover:shadow-brand-700/40"
              >
                {loading ? 'Carregando...' : 'Entrar com Google'}
              </Button>
              <div className="text-center text-xs text-muted-foreground">
                Ao continuar você concorda com nossos{' '}
                <a
                  href="#"
                  className="underline underline-offset-4 hover:text-foreground"
                >
                  Termos de Uso
                </a>{' '}
                e{' '}
                <a
                  href="#"
                  className="underline underline-offset-4 hover:text-foreground"
                >
                  Política de Privacidade
                </a>
                .
              </div>
            </CardContent>
          </Card>
          <div className="mt-8 text-center text-xs text-muted-foreground">
            Precisa de uma conta? <span className="text-foreground">Solicite acesso ao administrador.</span>
          </div>
        </div>
      </div>
    </div>
  )
}
