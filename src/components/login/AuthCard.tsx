"use client"

import styles from "@/app/login/login.module.css";
import { Spinner } from "@/components/ui/spinner";
import { AuthError } from "@/lib/auth-errors";
import { AlertCircle } from "lucide-react";

type Props = {
  isLogging: boolean;
  loading: boolean;
  hasInvite: boolean;
  error: AuthError | string | null;
  onLogin: () => Promise<void> | void;
  onSignOutForInvite: () => void;
  onRetry?: () => Promise<void> | void;
  onDismiss?: () => void;
};

export default function AuthCard({
  isLogging,
  loading,
  hasInvite,
  error,
  onLogin,
  onSignOutForInvite,
  onRetry,
  onDismiss,
}: Props) {
  // Parse error to get structured message
  const errorObj = typeof error === "string" ? null : (error as AuthError | null);
  const errorMessage: string | null = errorObj?.userMessage || (typeof error === "string" ? error : null) || null;
  const errorSuggestion = errorObj?.suggestion || null;
  const isRetryable = errorObj?.isRetryable ?? true;
  const isDismissible = errorObj?.isDismissible ?? true;

  return (
    <aside
      className={`auth-card-wrapper mx-auto w-full ${styles.authCard} ${styles.minimalWrapper} text-slate-100`}
      aria-labelledby="login-heading"
    >
      <div className="text-center">
        <div className={styles.logo} aria-hidden>
          <svg
            width="48"
            height="48"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle cx="12" cy="12" r="10" fill="var(--c-peach)" />
            <path
              d="M8 12l2.5 2.5L16 9"
              stroke="#fff"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        <h2 id="login-heading" className={`text-2xl font-bold ${styles.heading}`}>
          {hasInvite ? "Você foi convidado" : "Acesse sua conta"}
        </h2>
        <p className={`text-sm ${styles.muted}`}>
          {hasInvite
            ? "Use o e-mail do convite para entrar."
            : "Entre com sua conta Google para acessar o painel."}
        </p>
      </div>

      <div className="mt-6">
        <button
          onClick={onLogin}
          disabled={isLogging || loading}
          className={`w-full py-3 rounded-lg font-medium ${styles.btnPrimary}`}
          aria-label="Entrar com Google"
        >
          {isLogging || loading ? (
            <div className="flex items-center gap-2 justify-center">
              <Spinner size="sm" variant="white" />
              <span>
                {hasInvite ? "Aceitando convite..." : "Entrando..."}
              </span>
            </div>
          ) : (
            <span className="flex items-center justify-center gap-2">
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden
              >
                <path
                  d="M21.35 11.1h-9.2v2.8h5.35c-.22 1.4-1.03 2.6-2.2 3.4v2.8h3.55c2.07-1.9 3.25-4.7 3.25-8z"
                  fill="#4285F4"
                />
              </svg>
              <span>Continuar com Google</span>
            </span>
          )}
        </button>

        {errorMessage && (
          <div
            role="alert"
            className={`${styles.errorBox} mt-4 p-4 rounded-lg border border-red-500/50 bg-red-950/30`}
            aria-live="polite"
          >
            <div className="flex gap-3">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-medium text-red-100">{errorMessage}</p>
                {errorSuggestion && (
                  <p className="text-xs text-red-300/80 mt-1">
                    {errorSuggestion}
                  </p>
                )}

                <div className="flex gap-2 mt-3">
                  {isRetryable && onRetry && (
                    <button
                      onClick={onRetry}
                      className="text-xs font-medium px-3 py-1.5 rounded bg-red-500/20 hover:bg-red-500/30 text-red-100 transition-colors"
                    >
                      Tentar novamente
                    </button>
                  )}
                  {isDismissible && onDismiss && (
                    <button
                      onClick={onDismiss}
                      className="text-xs font-medium px-3 py-1.5 rounded bg-slate-700/50 hover:bg-slate-700 text-slate-300 transition-colors"
                    >
                      Descartar
                    </button>
                  )}
                </div>
              </div>
            </div>

            {errorObj?.code?.includes("INVITE_EMAIL_MISMATCH") && (
              <button
                onClick={onSignOutForInvite}
                className="mt-3 inline-flex items-center gap-2 text-xs font-medium text-cyan-400 hover:text-cyan-300 underline"
              >
                Usar outro e-mail
              </button>
            )}
          </div>
        )}

        <p className={`text-center text-xs mt-4 ${styles.muted}`}>
          Ao continuar você concorda com nossos Termos de Uso e Política de
          Privacidade.
        </p>
      </div>
    </aside>
  );
}
