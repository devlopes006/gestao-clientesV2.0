"use client";

import { AuthCard } from "@/components/login";
import { useUser } from "@/context/UserContext";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import styles from "./login.module.css";

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
    <div className={`${styles.palette} ${styles.pageBg} min-h-screen relative overflow-hidden px-4 py-10`}>
      <div className="absolute inset-0 -z-10 overflow-hidden">
        {/* <GradientBlobs /> */}
      </div>

      <div className={`mx-auto w-full max-w-3xl px-6 ${styles.loginContainer} flex flex-col items-center`}>
        <h1 className="text-yellow-400">MyGest</h1>
        <div className={`${styles.enter} flex items-center justify-center`} style={{ minHeight: '60vh' }}>
          <div className={styles.authCard}>
            <AuthCard
              isLogging={isLogging}
              loading={loading}
              hasInvite={hasInvite}
              error={error}
              onLogin={handleLogin}
              onSignOutForInvite={handleSignOutForInvite}
            />
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
