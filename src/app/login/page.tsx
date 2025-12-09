"use client";

import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useUser } from "@/context/UserContext";
import { CheckCircle2, ShieldCheck, Zap } from "lucide-react";
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
    <div className="min-h-screen bg-neutral-50 text-slate-900 px-4 py-10">
      <div className="mx-auto flex max-w-5xl flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
        <section className="space-y-4 lg:max-w-xl">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">MyGest</p>
            <h1 className="text-3xl font-semibold leading-tight">Centralize clientes, tarefas e finanças em um só lugar.</h1>
            <p className="text-sm text-slate-600">Interface limpa, fluxo simples e autenticação segura.</p>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {[{ icon: CheckCircle2, title: "Clientes organizados" }, { icon: Zap, title: "Fluxo ágil" }, { icon: ShieldCheck, title: "Proteção de dados" }].map((feature) => (
              <div key={feature.title} className="flex items-center gap-2 rounded-lg border bg-white p-3 text-sm shadow-sm">
                <feature.icon className="h-4 w-4 text-slate-700" />
                <span className="font-medium text-slate-800">{feature.title}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="w-full max-w-lg rounded-lg border bg-white p-6 shadow-sm">
          <div className="space-y-1 text-center">
            {hasInvite ? (
              <>
                <h2 className="text-2xl font-semibold">Você foi convidado</h2>
                <p className="text-sm text-slate-600">Entre com Google para acessar a organização.</p>
              </>
            ) : (
              <>
                <h2 className="text-2xl font-semibold">Acesse sua conta</h2>
                <p className="text-sm text-slate-600">Use seu e-mail Google para continuar.</p>
              </>
            )}
          </div>

          <div className="mt-6 space-y-4">
            <Button onClick={handleLogin} disabled={isLogging || loading} className="w-full justify-center text-base font-medium">
              {isLogging || loading ? (
                <div className="flex items-center gap-2">
                  <Spinner size="sm" variant="white" />
                  <span>{hasInvite ? "Aceitando convite..." : "Entrando..."}</span>
                </div>
              ) : (
                <span>Continuar com Google</span>
              )}
            </Button>

            {error && (
              <div className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                <p>{error}</p>
                {error.includes("convite") && (
                  <button onClick={handleSignOutForInvite} className="mt-2 inline-flex items-center gap-2 text-xs font-medium text-red-700 underline">
                    Usar o e-mail do convite
                  </button>
                )}
              </div>
            )}

            <p className="text-center text-xs text-slate-600">
              Ao continuar você concorda com nossos Termos de Uso e Política de Privacidade.
            </p>
          </div>
        </section>
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
    </Suspense>
  );
}
