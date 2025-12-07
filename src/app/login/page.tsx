"use client";

import { AuthDebug } from "@/components/AuthDebug";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useUser } from "@/context/UserContext";
import { ArrowRight, CheckCircle2, ShieldCheck, Sparkles, Zap } from 'lucide-react';
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

function LoginPageInner() {
  const { loginWithGoogle, loading } = useUser();
  const searchParams = useSearchParams();
  const inviteToken = searchParams?.get?.("invite") ?? null;
  const [isLogging, setIsLogging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasInvite = Boolean(inviteToken);

  const handleLogin = async () => {
    try {
      setError(null);
      setIsLogging(true);
      await loginWithGoogle();
    } catch (err: any) {
      setError(err?.message || "Erro ao autenticar");
    } finally {
      setIsLogging(false);
    }
  };

  const handleSignOutForInvite = () => {
    // noop placeholder for invite flows
    console.warn("handleSignOutForInvite called");
  };

  return (
    <div className="relative flex min-h-screen w-full overflow-hidden bg-background text-foreground items-center justify-center">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 -left-4 w-96 h-96 rounded-full mix-blend-multiply filter blur-3xl opacity-15 animate-blob bg-blue-300/40 dark:bg-blue-600/30" />
        <div className="absolute top-0 -right-4 w-96 h-96 rounded-full mix-blend-multiply filter blur-3xl opacity-15 animate-blob animation-delay-2000 bg-purple-300/40 dark:bg-purple-600/30" />
        <div className="absolute -bottom-8 left-20 w-96 h-96 rounded-full mix-blend-multiply filter blur-3xl opacity-15 animate-blob animation-delay-4000 bg-pink-300/40 dark:bg-pink-600/30" />
      </div>

      {/* Left Panel - Brand & Features */}
      <div className="relative hidden lg:flex lg:w-1/2 flex-col justify-between p-8 xl:p-10">
        <div className="relative z-10 flex flex-col gap-12">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="absolute inset-0 bg-linear-to-r from-blue-600 to-purple-600 rounded-2xl blur-lg opacity-50" />
              <div className="relative w-12 h-12 bg-linear-to-r from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-xl">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
            </div>
            <span className="text-3xl font-bold text-gradient-primary">MyGest</span>
          </div>

          {/* Headline */}
          <div className="space-y-4 max-w-lg">
            <h1 className="text-4xl sm:text-5xl font-bold leading-tight text-slate-900 dark:text-white">
              Gestão inteligente
              <br />
              <span className="text-gradient-brand">para seu negócio</span>
            </h1>
            <p className="text-base sm:text-lg text-slate-600 dark:text-slate-400 leading-relaxed">
              Centralize clientes, projetos e equipes em uma plataforma moderna
              e intuitiva
            </p>
          </div>

          {/* Features */}
          <div className="space-y-4">
            {[
              {
                icon: CheckCircle2,
                title: 'Gestão completa de clientes',
                desc: 'Acompanhe cada etapa do relacionamento',
              },
              {
                icon: Zap,
                title: 'Workflow otimizado',
                desc: 'Tarefas, prazos e prioridades organizadas',
              },
              {
                icon: ShieldCheck,
                title: 'Seguro e confiável',
                desc: 'Autenticação robusta e dados protegidos',
              },
            ].map((feature) => (
              <div
                key={feature.title}
                className="flex items-start gap-4 p-4 rounded-xl bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm border-2 border-slate-200 dark:border-slate-700 transition-all hover:bg-white/80 dark:hover:bg-slate-800/80 hover:scale-[1.02]"
              >
                <div className="shrink-0 w-10 h-10 bg-linear-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center shadow-lg">
                  <feature.icon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 dark:text-white mb-1">{feature.title}</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <p className="relative z-10 text-sm text-slate-500 dark:text-slate-500">© {new Date().getFullYear()} MyGest. Todos os direitos reservados.</p>
      </div>

      {/* Right Panel - Login Form */}
      <div className="relative flex w-full lg:w-1/2 items-center justify-center p-4">
        <div className="w-full max-w-md space-y-6">
          {/* Mobile Logo */}
          <div className="flex lg:hidden items-center justify-center gap-3 mb-8">
            <div className="relative">
              <div className="absolute inset-0 bg-linear-to-r from-blue-600 to-purple-600 rounded-2xl blur-lg opacity-50" />
              <div className="relative w-12 h-12 bg-linear-to-r from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-xl">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
            </div>
            <span className="text-3xl font-bold text-gradient-primary">MyGest</span>
          </div>

          {/* Login Card */}
          <div className="relative">
            {/* Glow effect */}
            <div className="absolute -inset-1 bg-linear-to-r from-blue-600 to-purple-600 rounded-3xl blur opacity-20" />

            {/* Card */}
            <div className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border-2 border-slate-200 dark:border-slate-800 p-6 sm:p-8 space-y-6 transition-all">
              {/* Header */}
              <div className="text-center space-y-2">
                {hasInvite ? (
                  <>
                    <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">Você foi convidado!</h2>
                    <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400">Entre para aceitar o convite e acessar a organização</p>
                  </>
                ) : (
                  <>
                    <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">Bem-vindo de volta</h2>
                    <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400">Entre com sua conta para continuar</p>
                  </>
                )}
              </div>

              {/* Google Button */}
              <Button onClick={handleLogin} disabled={isLogging || loading} size="lg" className="w-full h-14 text-base font-semibold">
                {isLogging || loading ? (
                  <div className="flex items-center gap-3">
                    <Spinner size="sm" variant="white" />
                    <span>{hasInvite ? 'Aceitando convite...' : 'Conectando...'}</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-3">
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                      <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                    <span>{hasInvite ? 'Aceitar convite com Google' : 'Continuar com Google'}</span>
                    <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                  </div>
                )}
              </Button>

              {/* Error Message */}
              {error && (
                <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 mt-4">
                  <p className="text-sm text-red-600 dark:text-red-400 text-center font-medium">{error}</p>
                  {error.includes('convite') && (
                    <div className="mt-3 text-center">
                      <button onClick={handleSignOutForInvite} className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border rounded-md text-sm">Sair e entrar com o e-mail do convite</button>
                    </div>
                  )}
                </div>
              )}

              {/* Divider */}
              <div className="relative mt-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t-2 border-slate-200 dark:border-slate-700" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white dark:bg-slate-900 px-3 text-slate-500 dark:text-slate-400 font-medium">Acesso seguro</span>
                </div>
              </div>

              {/* Footer */}
              <div className="space-y-4">
                <p className="text-center text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Ao continuar, você concorda com nossos{' '}
                  <a href="#" className="font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 underline underline-offset-2 transition-colors">Termos de Uso</a>{' '}e{' '}
                  <a href="#" className="font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 underline underline-offset-2 transition-colors">Política de Privacidade</a>
                </p>
              </div>
            </div>
          </div>

          {/* Help text */}
          <p className="text-center text-sm text-slate-600 dark:text-slate-400">Precisa de uma conta? <span className="font-semibold text-slate-900 dark:text-white">Solicite acesso ao administrador</span></p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          Carregando...
        </div>
      }
    >
      <LoginPageInner />
      {process.env.NODE_ENV === 'development' && <AuthDebug />}
    </Suspense>
  );
}
