"use client"

import styles from "@/app/login/login.module.css";
import { Spinner } from "@/components/ui/spinner";

type Props = {
  isLogging: boolean;
  loading: boolean;
  hasInvite: boolean;
  error: string | null;
  onLogin: () => Promise<void> | void;
  onSignOutForInvite: () => void;
};

export default function AuthCard({ isLogging, loading, hasInvite, error, onLogin, onSignOutForInvite }: Props) {
  return (
    <aside
      className={`auth-card-wrapper mx-auto w-full ${styles.authCard} ${styles.minimalWrapper} text-slate-100`}
      aria-labelledby="login-heading"
    >
      <div className="text-center">
        <div className={styles.logo} aria-hidden>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="10" fill="var(--c-peach)" />
            <path d="M8 12l2.5 2.5L16 9" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>

        <h2 id="login-heading" className={`text-2xl font-bold ${styles.heading}`}>{hasInvite ? "Você foi convidado" : "Acesse sua conta"}</h2>
        <p className={`text-sm ${styles.muted}`}>{hasInvite ? "Use o e-mail do convite para entrar." : "Entre com sua conta Google para acessar o painel."}</p>
      </div>

      <div className="mt-6">
        <button onClick={onLogin} disabled={isLogging || loading} className={`w-full py-3 rounded-lg font-medium ${styles.btnPrimary}`} aria-label="Entrar com Google">
          {isLogging || loading ? (
            <div className="flex items-center gap-2 justify-center">
              <Spinner size="sm" variant="white" />
              <span>{hasInvite ? "Aceitando convite..." : "Entrando..."}</span>
            </div>
          ) : (
            <span className="flex items-center justify-center gap-2">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path d="M21.35 11.1h-9.2v2.8h5.35c-.22 1.4-1.03 2.6-2.2 3.4v2.8h3.55c2.07-1.9 3.25-4.7 3.25-8z" fill="#4285F4" />
              </svg>
              <span>Continuar com Google</span>
            </span>
          )}
        </button>

        {error && (
          <div role="alert" className={styles.errorBox} aria-live="polite">
            <p className="font-medium">{error}</p>
            {error.includes("convite") && (
              <button onClick={onSignOutForInvite} className="mt-2 inline-flex items-center gap-2 text-xs font-medium underline">
                Usar outro e-mail
              </button>
            )}
          </div>
        )}

        <p className={`text-center text-xs mt-4 ${styles.muted}`}>Ao continuar você concorda com nossos Termos de Uso e Política de Privacidade.</p>
      </div>
    </aside>
  );
}
