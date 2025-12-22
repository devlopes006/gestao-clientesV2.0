"use client";

import { AuthCard } from "@/components/login";
import { useUser } from "@/context/UserContext";
import { BarChart3, ShieldCheck, Sparkles } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import styles from "./login.module.css";

function LoginPageInner() {
  const { loginWithGoogle, loading, error, clearError } = useUser();
  const searchParams = useSearchParams();
  const inviteToken = searchParams?.get?.("invite") ?? null;
  const [isLogging, setIsLogging] = useState(false);

  const hasInvite = Boolean(inviteToken);

  const handleLogin = async () => {
    try {
      clearError();
      setIsLogging(true);
      await loginWithGoogle(inviteToken);
    } catch (err) {
      // Error already handled in UserContext
      console.error("Login error:", err);
    } finally {
      setIsLogging(false);
    }
  };

  const handleRetry = async () => {
    await handleLogin();
  };

  const handleSignOutForInvite = () => {
    // TODO: Implement sign out for different email
    console.warn("handleSignOutForInvite called");
  };

  return (
    <div className={`${styles.pageBg} relative min-h-screen overflow-hidden`}>
      <div className="absolute inset-0 -z-10">
        <div className="absolute -left-32 top-10 h-72 w-72 rounded-full bg-cyan-500/20 blur-3xl" />
        <div className="absolute right-0 -top-16 h-80 w-80 rounded-full bg-amber-400/15 blur-3xl" />
        <div className="absolute left-24 bottom-0 h-64 w-64 rounded-full bg-pink-500/15 blur-3xl" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-6 lg:px-8 py-12 lg:py-16">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-cyan-400/30 bg-slate-900/5 text-xs font-semibold text-cyan-100 mb-8 shadow-[0_10px_60px_-40px_rgba(34,211,238,0.8)]">
          <span className="inline-block h-2 w-2 rounded-full bg-emerald-400" />
          Painel MyGest · Acesso Seguro
        </div>

        <div className="grid lg:grid-cols-2 gap-10 items-center">
          <div className="space-y-6">
            <div className="space-y-3">
              <h1 className="text-3xl lg:text-4xl font-bold text-white leading-tight">
                Entre para agir: tarefas, agenda, cobrança e KPIs em um só painel.
              </h1>
              <p className="text-slate-300 text-base leading-relaxed">
                O login destrava o dashboard completo: calendário premium, tarefas urgentes, saúde de clientes e indicadores financeiros prontos para decisão.
              </p>
            </div>

            <div className="grid sm:grid-cols-3 gap-3">
              <div className="relative overflow-hidden rounded-xl border border-slate-700/60 bg-slate-800/60 backdrop-blur-sm p-4 flex items-start gap-3 shadow-[0_16px_60px_-40px_rgba(0,0,0,0.8)]">
                <div className="p-2 rounded-lg bg-emerald-500/15 border border-emerald-400/30 text-emerald-200"><ShieldCheck className="w-4 h-4" /></div>
                <div>
                  <p className="text-sm font-semibold text-white">Acesso seguro</p>
                  <p className="text-xs text-slate-400">Google + convite para manter equipes certas dentro.</p>
                </div>
              </div>
              <div className="relative overflow-hidden rounded-xl border border-slate-700/60 bg-slate-800/60 backdrop-blur-sm p-4 flex items-start gap-3 shadow-[0_16px_60px_-40px_rgba(0,0,0,0.8)]">
                <div className="p-2 rounded-lg bg-amber-500/15 border border-amber-400/30 text-amber-200"><Sparkles className="w-4 h-4" /></div>
                <div>
                  <p className="text-sm font-semibold text-white">Fluxos prontos</p>
                  <p className="text-xs text-slate-400">Criar tarefas, reuniões e notas sem sair do painel.</p>
                </div>
              </div>
              <div className="relative overflow-hidden rounded-xl border border-slate-700/60 bg-slate-800/60 backdrop-blur-sm p-4 flex items-start gap-3 shadow-[0_16px_60px_-40px_rgba(0,0,0,0.8)]">
                <div className="p-2 rounded-lg bg-cyan-500/15 border border-cyan-400/30 text-cyan-200"><BarChart3 className="w-4 h-4" /></div>
                <div>
                  <p className="text-sm font-semibold text-white">KPIs acionáveis</p>
                  <p className="text-xs text-slate-400">Financeiro, saúde de clientes e agenda integrados.</p>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-3 text-sm text-slate-300">
              <span className="px-3 py-1.5 rounded-full border border-slate-700/60 bg-slate-900/5">Agenda premium</span>
              <span className="px-3 py-1.5 rounded-full border border-slate-700/60 bg-slate-900/5">Tarefas e notas rápidas</span>
              <span className="px-3 py-1.5 rounded-full border border-slate-700/60 bg-slate-900/5">KPIs financeiros</span>
              <span className="px-3 py-1.5 rounded-full border border-slate-700/60 bg-slate-900/5">Alertas e billing</span>
            </div>
          </div>

          <div className="relative">
            <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-cyan-500/30 via-blue-500/20 to-amber-400/30 blur-2xl" />
            <div className="relative bg-slate-900/70 border border-slate-700/60 rounded-2xl shadow-[0_24px_120px_-60px_rgba(0,0,0,0.9)] backdrop-blur-lg p-6">
              <AuthCard
                isLogging={isLogging}
                loading={loading}
                hasInvite={hasInvite}
                error={error}
                onLogin={handleLogin}
                onSignOutForInvite={handleSignOutForInvite}
                onRetry={handleRetry}
                onDismiss={clearError}
              />
            </div>
          </div>
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
    </Suspense>
  );
}
