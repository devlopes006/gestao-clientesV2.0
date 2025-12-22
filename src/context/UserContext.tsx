"use client";
import {
  AuthError,
  AuthErrorCode,
  createAuthError,
  parseFirebaseError,
} from "@/lib/auth-errors";
import { auth, provider } from "@/lib/firebase";
import { logger, type LogContext } from "@/lib/logger";
import { usePresence } from "@/lib/usePresence";
import {
  getRedirectResult,
  onAuthStateChanged,
  signInWithPopup,
  signInWithRedirect,
  signOut,
  User,
} from "firebase/auth";
import { useRouter } from "next/navigation";
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

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

/**
 * Token state in context
 * Stores access token, refresh token, and expiration time
 */
interface TokenState {
  accessToken: string | null;
  refreshToken: string | null;
  expiresAt: number | null; // Unix timestamp in milliseconds
}

interface UserContextType {
  user: ExtendedUser | null;
  loading: boolean;
  error: AuthError | null;
  tokenState: TokenState;
  loginWithGoogle: (inviteToken?: string | null) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  clearError: () => void;
  saveTokens: (accessToken: string, refreshToken: string, expiresIn: number) => void;
  isTokenExpired: (bufferSeconds?: number) => boolean;
  refreshTokens: () => Promise<boolean>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<ExtendedUser | null>(null);
  const [error, setError] = useState<AuthError | null>(null);
  const [tokenState, setTokenState] = useState<TokenState>({
    accessToken: null,
    refreshToken: null,
    expiresAt: null,
  });
  usePresence(user?.uid);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const [retryCount, setRetryCount] = useState(0);

  const MAX_RETRIES = 3;
  const INITIAL_RETRY_DELAY = 1000; // 1 segundo

  /**
   * Save tokens to state
   * @param accessToken - ID token from Firebase
   * @param refreshToken - Refresh token from /api/session
   * @param expiresIn - Token expiration in seconds
   */
  const saveTokens = useCallback((accessToken: string, refreshToken: string, expiresIn: number) => {
    const expiresAt = Date.now() + expiresIn * 1000;
    setTokenState({
      accessToken,
      refreshToken,
      expiresAt,
    });
    if (DEBUG_AUTH) {
      logger.debug('UserContext: tokens saved', {
        expiresIn,
        expiresAt: new Date(expiresAt).toISOString(),
      });
    }
  }, []);

  /**
   * Check if current access token is expired
   * @param bufferSeconds - Buffer in seconds before actual expiration (default: 60)
   * @returns true if token is expired or expiring soon
   */
  const isTokenExpired = useCallback((bufferSeconds = 60): boolean => {
    if (!tokenState.expiresAt) return true;
    const now = Date.now();
    const expiryBuffer = bufferSeconds * 1000; // Convert to milliseconds
    const isExpired = now >= tokenState.expiresAt - expiryBuffer;
    if (DEBUG_AUTH && isExpired) {
      logger.debug('UserContext: token expired', {
        now: new Date(now).toISOString(),
        expiresAt: new Date(tokenState.expiresAt).toISOString(),
      });
    }
    return isExpired;
  }, [tokenState.expiresAt]);

  /**
   * Refresh access token using refresh token
   * Calls /api/refresh endpoint to get new access token
   * @returns true if refresh successful, false otherwise
   */
  const refreshTokens = useCallback(async (): Promise<boolean> => {
    try {
      if (!tokenState.refreshToken) {
        if (DEBUG_AUTH) logger.debug('UserContext: no refresh token available');
        return false;
      }

      if (DEBUG_AUTH) logger.debug('UserContext: attempting token refresh');

      const response = await fetch('/api/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          refreshToken: tokenState.refreshToken,
        }),
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = (await response.json()) as { ok?: boolean; error?: string };
        console.error('UserContext: token refresh failed', errorData);

        // If refresh fails, clear tokens and redirect to login
        setTokenState({
          accessToken: null,
          refreshToken: null,
          expiresAt: null,
        });
        return false;
      }

      const data = (await response.json()) as {
        ok?: boolean;
        accessToken?: string;
        expiresIn?: number;
      };

      if (!data.ok || !data.accessToken || !data.expiresIn) {
        console.error('UserContext: invalid refresh response', data);
        return false;
      }

      // Save new tokens
      saveTokens(data.accessToken, tokenState.refreshToken, data.expiresIn);
      if (DEBUG_AUTH) logger.debug('UserContext: token refreshed successfully');
      return true;
    } catch (err) {
      console.error('UserContext: token refresh error', err);
      return false;
    }
  }, [tokenState.refreshToken, saveTokens]);

  // Auto-refresh token when approaching expiration
  useEffect(() => {
    if (!tokenState.expiresAt) return;

    // Calculate when to refresh (5 minutes before expiration)
    const expiresIn = tokenState.expiresAt - Date.now();
    const refreshBefore = 5 * 60 * 1000; // 5 minutes in milliseconds

    if (expiresIn <= refreshBefore) {
      // Token is already expiring soon, refresh immediately
      if (DEBUG_AUTH) logger.debug('UserContext: token expiring soon, refreshing now');
      refreshTokens();
    } else {
      // Schedule refresh for later
      const timeout = expiresIn - refreshBefore;
      const timeoutId = setTimeout(() => {
        if (DEBUG_AUTH) logger.debug('UserContext: scheduled token refresh triggered');
        refreshTokens();
      }, timeout);

      return () => clearTimeout(timeoutId);
    }
  }, [tokenState.expiresAt, refreshTokens]);


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
  const handleAuthResult = useCallback(
    async (firebaseUser: User, inviteToken?: string | null, retryIdx = 0) => {
      if (DEBUG_AUTH)
        logger.debug("UserContext: setUser", { uid: firebaseUser.uid });
      try {
        const idToken = await firebaseUser.getIdToken(true);
        if (!idToken) throw new Error("Falha ao obter ID token");

        const apiUrl =
          typeof window !== "undefined"
            ? new URL("/api/session", window.location.origin).toString()
            : "/api/session";

        const response = await fetch(apiUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            idToken,
            skipOrgCreation: inviteToken ? true : false,
            inviteToken: inviteToken || undefined,
          }),
          credentials: "include",
        });

        if (!response.ok) {
          let errorJson: { error?: string } | undefined;
          try {
            errorJson = await response.json();
          } catch { }

          if (response.status === 401) {
            const authErr = createAuthError(AuthErrorCode.INVALID_TOKEN);
            setError(authErr);
            throw authErr;
          }

          if (response.status === 500) {
            // Retry em erro de servidor
            if (retryIdx < MAX_RETRIES) {
              const delay = INITIAL_RETRY_DELAY * Math.pow(2, retryIdx);
              if (DEBUG_AUTH)
                logger.debug(
                  `UserContext: retry ${retryIdx + 1}/${MAX_RETRIES} após ${delay}ms`
                );
              await new Promise((r) => setTimeout(r, delay));
              return handleAuthResult(firebaseUser, inviteToken, retryIdx + 1);
            }
          }

          const err = errorJson?.error
            ? new Error(`Session error: ${errorJson.error}`)
            : new Error("Falha ao criar sessão");
          const authErr = createAuthError(
            AuthErrorCode.SESSION_CREATION_FAILED
          );
          setError(authErr);
          throw err;
        }

        if (DEBUG_AUTH) logger.debug("UserContext: sessão OK");
        setError(null); // Clear error on success

        // Parse session response body
        let sessionJson: unknown = null;
        try {
          sessionJson = await response.clone().json().catch(() => null);
        } catch { }

        // Save tokens if present in response
        if (sessionJson && typeof sessionJson === "object") {
          const session = sessionJson as {
            accessToken?: string;
            refreshToken?: string;
            expiresIn?: number;
          };
          if (session.accessToken && session.refreshToken && session.expiresIn) {
            saveTokens(session.accessToken, session.refreshToken, session.expiresIn);
          }
        }

        // Check for invite mismatch
        try {
          const inviteStatus =
            sessionJson &&
              typeof sessionJson === "object" &&
              "inviteStatus" in sessionJson
              ? (
                sessionJson as {
                  inviteStatus?: { status?: string; email?: string };
                }
              ).inviteStatus
              : undefined;
          if (inviteStatus && inviteStatus.status === "mismatch") {
            const authErr = createAuthError(
              AuthErrorCode.INVITE_EMAIL_MISMATCH
            );
            setError(authErr);
            throw new Error(
              `INVITE_MISMATCH:${inviteStatus.email || ""}`
            );
          }
        } catch (e) {
          throw e;
        }

        // Fetch user profile using server session
        try {
          const enrichedUser = await enrichUserWithProfile(firebaseUser);
          setUser(enrichedUser);
        } catch (err) {
          if (DEBUG_AUTH)
            logger.debug(
              "UserContext: falha ao obter profile após criar sessão",
              err as LogContext
            );
        }

        let nextPath: string | null =
          sessionJson && typeof sessionJson === "object" && "nextPath" in sessionJson
            ? (sessionJson as { nextPath?: string | null }).nextPath || null
            : null;

        if (!nextPath) {
          try {
            const s = await fetch("/api/session", { credentials: "include" });
            if (s.ok) {
              const j = await s.json();
              nextPath = j.orgId ? "/" : "/onboarding";
            } else nextPath = "/login";
          } catch {
            nextPath = "/";
          }
        }

        if (DEBUG_AUTH) logger.debug("UserContext: redirect", { nextPath });
        router.refresh();
        setTimeout(() => {
          if (nextPath) router.push(nextPath);
        }, 300);
      } catch (error) {
        console.error("Error in handleAuthResult:", error);
        throw error;
      }
    },
    [router, enrichUserWithProfile]
  );

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
        if (DEBUG_AUTH)
          logger.error("[UserContext] Timeout no login após redirect");
        const authErr = createAuthError(AuthErrorCode.REDIRECT_TIMEOUT);
        setError(authErr);
        setLoading(false);
      }, 30000); // 30 segundos (aumentado para conexões lentas)

      try {
        const result = await getRedirectResult(auth);
        if (DEBUG_AUTH) logger.debug('[UserContext] getRedirectResult', {
          hasUser: !!result?.user,
          userEmail: result?.user?.email,
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
      const authErr = createAuthError(AuthErrorCode.UNKNOWN_ERROR);
      setError(authErr);
      throw authErr;
    }

    setError(null); // Clear previous errors
    setLoading(true);
    setRetryCount(0);

    const userAgent = navigator.userAgent;
    const isSafari =
      /Safari|iPhone|iPad/.test(userAgent) && !/Chrome|Firefox/.test(userAgent);
    const useMobile = isMobileDevice();

    if (DEBUG_AUTH)
      logger.debug("UserContext: login iniciado", {
        inviteToken,
        userAgent,
        isSafari,
        useMobile,
      });

    // Store invite token
    if (inviteToken) {
      sessionStorage.setItem("pendingInviteToken", inviteToken);
    }

    // Adicionar scopes
    if (provider) {
      provider.addScope("profile");
      provider.addScope("email");
    }

    try {
      if (DEBUG_AUTH)
        logger.debug("UserContext: tentando signInWithPopup", {
          isSafari,
          useMobile,
        });

      try {
        const result = await signInWithPopup(auth, provider);
        if (DEBUG_AUTH)
          logger.debug("UserContext: popup funcionou!", {
            user: result.user?.email,
          });
        await handleAuthResult(result.user, inviteToken);
        return;
      } catch (popupError: unknown) {
        const code = (popupError as { code?: string } | null)?.code || "";

        if (DEBUG_AUTH)
          logger.warn("UserContext: popup falhou", {
            code,
            error:
              popupError instanceof Error
                ? popupError.message
                : String(popupError),
          });

        const errorCode = parseFirebaseError(popupError);
        const isBlockedError = [
          AuthErrorCode.POPUP_BLOCKED,
          AuthErrorCode.CANCELLED_POPUP_REQUEST,
          AuthErrorCode.POPUP_CLOSED_BY_USER,
          AuthErrorCode.NETWORK_ERROR,
        ].includes(errorCode);

        if (!isBlockedError) {
          // Erro não é de bloqueio, relançar
          const authErr = createAuthError(errorCode);
          setError(authErr);
          setLoading(false);
          throw authErr;
        }

        // Popup bloqueado, usar redirect como fallback
        if (DEBUG_AUTH)
          logger.debug(
            "UserContext: popup bloqueado, usando redirect como fallback",
            { isSafari, useMobile }
          );

        localStorage.setItem("pendingAuthRedirect", "true");
        await signInWithRedirect(auth, provider);
        // Flow continues in checkRedirectResult
      }
    } catch (error: unknown) {
      // Cleanup storage
      localStorage.removeItem("pendingAuthRedirect");
      sessionStorage.removeItem("pendingInviteToken");
      setLoading(false);

      if (DEBUG_AUTH)
        logger.error("[UserContext] Erro no login Google", {
          error:
            error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
        });

      if (error instanceof Error && error.message.includes("INVITE_MISMATCH")) {
        // Already set error in handleAuthResult
        return;
      }

      // Set structured error if not already set
      const isAuthError = (e: unknown): e is AuthError => {
        return typeof e === "object" && e !== null && "code" in e && "isRetryable" in e;
      };

      if (!isAuthError(error)) {
        const code = parseFirebaseError(error);
        const authErr = createAuthError(code);
        setError(authErr);
        throw authErr;
      }

      throw error;
    }
  };

  const logout = async () => {
    if (!auth) throw new Error("Firebase auth not initialized");

    try {
      // Remove cookie do servidor PRIMEIRO
      await fetch("/api/logout", { method: "POST", credentials: 'include' });

      // Clear tokens from context
      setTokenState({
        accessToken: null,
        refreshToken: null,
        expiresAt: null,
      });

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
      } catch { }
      const enrichedUser = await enrichUserWithProfile(auth.currentUser);
      setUser(enrichedUser);
      try {
        router.refresh();
      } catch { }
    }
  }, [router, enrichUserWithProfile]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return (
    <UserContext.Provider
      value={{
        user,
        loading,
        error,
        tokenState,
        loginWithGoogle,
        logout,
        refreshUser,
        clearError,
        saveTokens,
        isTokenExpired,
        refreshTokens,
      }}
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
