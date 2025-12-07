"use client";
import { auth, provider } from "@/lib/firebase";
import { logger, type LogContext } from '@/lib/logger';
import { usePresence } from "@/lib/usePresence";
import { getRedirectResult, onAuthStateChanged, signInWithPopup, signInWithRedirect, signOut, User } from "firebase/auth";
import { useRouter } from 'next/navigation';
import { createContext, ReactNode, useCallback, useContext, useEffect, useState } from "react";

// Lightweight mobile detection (popup vs redirect)
const isMobileDevice = () => {
  if (typeof window === "undefined") return false;
  return /android|iphone|ipad|ipod|mobile|windows phone|opera mini|blackberry|webos/i.test(navigator.userAgent.toLowerCase()) || window.innerWidth < 768;
};

// Enable verbose auth debug logs only if explicitly requested
const DEBUG_AUTH = typeof process !== "undefined" && process.env.NEXT_PUBLIC_DEBUG_AUTH === "true";

// Extend Firebase User with custom properties from DB
interface ExtendedUser extends User {
  image?: string | null;
}

interface UserContextType {
  user: ExtendedUser | null;
  loading: boolean;
  loginWithGoogle: (inviteToken?: string | null) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<ExtendedUser | null>(null);
  // Atualiza presença em tempo real no Firebase Realtime Database
  usePresence(user?.uid);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Fetch user profile from DB and merge with Firebase user
  const enrichUserWithProfile = useCallback(async (firebaseUser: User): Promise<ExtendedUser> => {
    try {
      const res = await fetch("/api/profile", { credentials: 'include' });
      if (res.ok) {
        const profile = await res.json();
        return {
          ...firebaseUser,
          image: profile.image || firebaseUser.photoURL || null,
        };
      }
    } catch (err) {
      if (DEBUG_AUTH) logger.debug('Failed to fetch user profile', err as LogContext);
    }
    return {
      ...firebaseUser,
      image: firebaseUser.photoURL || null,
    };
  }, []);

  // Shared logic for handling authentication result (from popup or redirect)
  const handleAuthResult = useCallback(async (firebaseUser: User, inviteToken?: string | null) => {
    if (DEBUG_AUTH) logger.debug('UserContext: setUser', { uid: firebaseUser.uid });
    // Não é possível checar cookie httpOnly via JS, confiar no backend
    const idToken = await firebaseUser.getIdToken(true);
    if (!idToken) throw new Error("Falha ao obter ID token");

    let response: Response;
    try {
      const apiUrl = typeof window !== 'undefined' ? new URL('/api/session', window.location.origin).toString() : '/api/session';
      response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken, skipOrgCreation: inviteToken ? true : false, inviteToken: inviteToken || undefined }),
        credentials: 'include',
      });

      if (!response.ok) {
        let errorText = '';
        let errorJson: { error?: string } | undefined;
        try {
          errorJson = await response.json();
          errorText = JSON.stringify(errorJson);
        } catch {
          errorText = 'Erro ao autenticar';
        }
        if (DEBUG_AUTH) logger.error('UserContext: erro sessão', errorText);
        const invalid = /Invalid token/.test(errorText) || errorJson?.error === 'Invalid token';
        if (invalid && auth) { await signOut(auth); setUser(null); }
        throw new Error("Falha ao criar sessão");
      }
      if (DEBUG_AUTH) logger.debug('UserContext: sessão OK');

      // Parse session response body (server may have accepted invite and returned nextPath/inviteStatus)
      let sessionJson: unknown = null
      try {
        sessionJson = await response.clone().json().catch(() => null)
      } catch { }

      // If server indicated an invite mismatch, surface as explicit error so UI can handle it
      try {
        const inviteStatus =
          sessionJson && typeof sessionJson === 'object' && 'inviteStatus' in sessionJson
            ? (sessionJson as { inviteStatus?: { status?: string; email?: string } }).inviteStatus
            : undefined
        if (inviteStatus && inviteStatus.status === 'mismatch') {
          // Provide the invited email in the error message so UI can show it
          throw new Error(`INVITE_MISMATCH:${inviteStatus.email || ''}`)
        }
      } catch (e) {
        // Re-throw to be caught by outer try/catch
        throw e
      }

      // Session cookie should be set now; fetch profile using server session
      try {
        const enrichedUser = await enrichUserWithProfile(firebaseUser);
        setUser(enrichedUser);
      } catch (err) {
        if (DEBUG_AUTH) logger.debug('UserContext: falha ao obter profile após criar sessão', err as LogContext);
      }

      let nextPath: string | null =
        sessionJson && typeof sessionJson === 'object' && 'nextPath' in sessionJson
          ? (sessionJson as { nextPath?: string | null }).nextPath || null
          : null;

      // If server didn't accept invite during session creation, fallback to client-side check
      if (!nextPath) {
        try {
          const inv = await fetch("/api/invites/for-me", { credentials: 'include' });
          if (inv.ok) {
            const data = await inv.json();
            const invite = Array.isArray(data?.data) ? data.data[0] : undefined;
            if (invite) {
              if (DEBUG_AUTH) logger.debug('UserContext: convite pendente, redirecionando para aceitar');
              const r = await fetch("/api/invites/accept", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token: invite.token }), credentials: 'include' });
              if (r.ok) { const j = await r.json(); nextPath = j.nextPath || null; }
            }
          }
        } catch { }
      }

      if (!nextPath) {
        try {
          const s = await fetch("/api/session", { credentials: 'include' });
          if (s.ok) {
            const j = await s.json();
            nextPath = j.orgId ? "/" : "/onboarding";
          } else nextPath = "/login";
        } catch { nextPath = "/"; }
      }
      if (DEBUG_AUTH) logger.debug('UserContext: redirect', { nextPath });
      router.refresh();
      // Adiciona pequeno delay para garantir que sessão/cookie foi propagado
      setTimeout(() => {
        if (nextPath) router.push(nextPath);
      }, 300);
    } catch (error) {
      console.error('Error in handleAuthResult:', error);
      throw error;
    }
  }, [router, enrichUserWithProfile]);

  useEffect(() => {
    if (!auth) {
      // If auth is not initialized (missing env or server-side), don't try to
      // subscribe. Mark loading as false so the UI can continue.
      // Avoid synchronous setState inside effect body (can trigger cascading renders)
      Promise.resolve().then(() => setLoading(false));
      return;
    }

    let isCheckingRedirect = false;


    // Adiciona timeout visual e logs para diagnóstico
    let loginTimeout: NodeJS.Timeout | null = null;
    const checkRedirectResult = async () => {
      if (!auth || isCheckingRedirect) return;
      isCheckingRedirect = true;
      const wasPendingRedirect = localStorage.getItem("pendingAuthRedirect") === "true";
      const isSafari = /Safari|iPhone|iPad/.test(navigator.userAgent) && !/Chrome|Firefox/.test(navigator.userAgent);

      if (DEBUG_AUTH) logger.debug('[UserContext] Iniciando checkRedirectResult', { wasPendingRedirect, isSafari });

      // Dar tempo extra para Safari processar o redirect
      if (wasPendingRedirect && isSafari) {
        if (DEBUG_AUTH) logger.debug('[UserContext] Safari redirect detectado, aguardando 2s antes de processar');
        await new Promise(r => setTimeout(r, 2000));
      }

      loginTimeout = setTimeout(() => {
        if (DEBUG_AUTH) logger.error('[UserContext] Timeout no login após redirect');
        setLoading(false);
      }, 15000); // 15 segundos (aumentado para Safari)

      try {
        const result = await getRedirectResult(auth);
        if (DEBUG_AUTH) logger.debug('[UserContext] getRedirectResult', {
          hasUser: !!result?.user,
          userEmail: result?.user?.email,
          hasCredential: !!result?.credential,
          result
        });

        if (result?.user) {
          if (DEBUG_AUTH) logger.debug('[UserContext] Login bem-sucedido via redirect', { email: result.user.email });
          localStorage.removeItem("pendingAuthRedirect");
          const inviteToken = sessionStorage.getItem("pendingInviteToken");
          if (inviteToken) sessionStorage.removeItem("pendingInviteToken");
          await handleAuthResult(result.user, inviteToken);
        } else {
          if (wasPendingRedirect) {
            if (DEBUG_AUTH) logger.warn('[UserContext] Redirect foi iniciado mas getRedirectResult retornou vazio');
            localStorage.removeItem("pendingAuthRedirect");
            sessionStorage.removeItem("pendingInviteToken");
          }
          setLoading(false);
        }
      } catch (err) {
        if (DEBUG_AUTH) logger.error('[UserContext] Erro em getRedirectResult', {
          error: err instanceof Error ? err.message : String(err),
          stack: err instanceof Error ? err.stack : undefined
        });
        localStorage.removeItem("pendingAuthRedirect");
        sessionStorage.removeItem("pendingInviteToken");
        setLoading(false);
      } finally {
        if (loginTimeout) clearTimeout(loginTimeout);
        isCheckingRedirect = false;
      }
    };

    checkRedirectResult();

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {

      // Se usuário autenticado mas sem sessão ativa, pode ser resultado de redirect mobile
      if (firebaseUser) {
        const wasPendingRedirect =
          localStorage.getItem("pendingAuthRedirect") === "true";

        // Verifica se tem sessão ativa
        try {
          const sessionCheck = await fetch("/api/session", { method: "GET", credentials: 'include' });
          const hasSession = sessionCheck.ok;



          // Se tem usuário mas não tem sessão e tinha redirect pendente, processar
          if (!hasSession && wasPendingRedirect) {

            const inviteToken = sessionStorage.getItem("pendingInviteToken");
            if (inviteToken) {
              sessionStorage.removeItem("pendingInviteToken");
            }
            localStorage.removeItem("pendingAuthRedirect");
            await handleAuthResult(firebaseUser, inviteToken);
            return; // Exit early to avoid setting loading to false
          }
        } catch {

        }
      }

      const enrichedUser = firebaseUser ? await enrichUserWithProfile(firebaseUser) : null;
      setUser(enrichedUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [handleAuthResult, enrichUserWithProfile]);

  const loginWithGoogle = async (inviteToken?: string | null) => {
    if (!auth || !provider) {
      console.error("[UserContext] ❌ Firebase não inicializado");
      throw new Error("Firebase auth not initialized");
    }

    const userAgent = navigator.userAgent;
    const isSafari = /Safari|iPhone|iPad/.test(userAgent) && !/Chrome|Firefox/.test(userAgent);
    const useMobile = isMobileDevice();

    if (DEBUG_AUTH) logger.debug('UserContext: login iniciado', {
      inviteToken,
      userAgent,
      isSafari,
      useMobile
    });

    // Store invite token in sessionStorage so it's available after redirect
    if (inviteToken) {
      sessionStorage.setItem("pendingInviteToken", inviteToken);
    }

    // Garantir que o provider tem os scopes necessários
    if (provider) {
      provider.addScope('profile');
      provider.addScope('email');
    }

    try {
      // Estratégia: SEMPRE tentar popup primeiro (funciona melhor na maioria dos casos)
      // Fallback para redirect apenas se popup falhar

      if (DEBUG_AUTH) logger.debug('UserContext: tentando signInWithPopup (estratégia universal)', {
        isSafari,
        useMobile
      });

      try {
        // Tentar popup sempre (mesmo em mobile/Safari)
        const result = await signInWithPopup(auth, provider);
        if (DEBUG_AUTH) logger.debug('UserContext: popup funcionou!', { user: result.user?.email });
        await handleAuthResult(result.user, inviteToken);
        return;
      } catch (popupError: unknown) {
        const code = (popupError as { code?: string } | null | undefined)?.code || "";
        if (DEBUG_AUTH) logger.warn('UserContext: popup falhou', {
          code,
          error: popupError instanceof Error ? popupError.message : String(popupError)
        });

        // Se popup foi bloqueado, usar redirect
        const isBlocked = [
          "auth/popup-blocked",
          "auth/cancelled-popup-request",
          "auth/popup-closed-by-user",
          "auth/network-request-failed"
        ].includes(code);

        if (!isBlocked) {
          // Se não foi problema de bloqueio, relançar o erro
          throw popupError;
        }

        // Popup foi bloqueado, usar redirect como fallback
        if (DEBUG_AUTH) logger.debug('UserContext: popup bloqueado, usando redirect como fallback', {
          isSafari,
          useMobile
        });

        localStorage.setItem("pendingAuthRedirect", "true");
        await signInWithRedirect(auth, provider);
        // redirect flow continues in checkRedirectResult
      }
    } catch (error) {
      // Limpar storage em caso de erro
      localStorage.removeItem("pendingAuthRedirect");
      sessionStorage.removeItem("pendingInviteToken");

      if (DEBUG_AUTH) logger.error('[UserContext] Erro no login Google', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
      throw error;
    }
  };

  const logout = async () => {
    if (!auth) throw new Error("Firebase auth not initialized");

    try {
      // Remove cookie do servidor PRIMEIRO
      await fetch("/api/logout", { method: "POST", credentials: 'include' });

      // Faz logout do Firebase
      await signOut(auth);

      // Força refresh e redireciona
      router.refresh();
      router.push("/login");
    } catch (error) {
      console.error("Erro ao fazer logout:", error);
      // Mesmo com erro, tenta redirecionar
      router.push("/login");
    }
  };

  const refreshUser = useCallback(async () => {
    if (!auth) return;
    if (auth.currentUser) {
      try {
        await auth.currentUser.reload();
      } catch {

      }
      const enrichedUser = await enrichUserWithProfile(auth.currentUser);
      setUser(enrichedUser);
      // Também força um refresh do router para SSR consumir novos dados
      try {
        router.refresh();
      } catch { }
    }
  }, [router, enrichUserWithProfile]);

  return (
    <UserContext.Provider
      value={{ user, loading, loginWithGoogle, logout, refreshUser }}
    >
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error("useUser deve ser usado dentro de UserProvider");
  return ctx;
};
