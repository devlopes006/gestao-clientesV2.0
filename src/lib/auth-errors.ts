/**
 * Structured Auth Error Handling
 *
 * Provides typed, user-friendly error messages for auth flows
 */

export enum AuthErrorCode {
  // Network & Connectivity
  NETWORK_ERROR = 'auth/network-error',
  TIMEOUT = 'auth/timeout',

  // Firebase Popup
  POPUP_BLOCKED = 'auth/popup-blocked',
  POPUP_CLOSED_BY_USER = 'auth/popup-closed-by-user',
  CANCELLED_POPUP_REQUEST = 'auth/cancelled-popup-request',

  // Firebase Redirect
  REDIRECT_TIMEOUT = 'auth/redirect-timeout',

  // Credentials & Validation
  INVALID_EMAIL = 'auth/invalid-email',
  USER_DISABLED = 'auth/user-disabled',
  USER_NOT_FOUND = 'auth/user-not-found',
  OPERATION_NOT_ALLOWED = 'auth/operation-not-allowed',

  // Session & Backend
  INVALID_TOKEN = 'auth/invalid-token',
  SESSION_CREATION_FAILED = 'auth/session-creation-failed',
  NOT_AUTHENTICATED = 'auth/not-authenticated',

  // Invite & Onboarding
  INVITE_NOT_FOUND = 'auth/invite-not-found',
  INVITE_EXPIRED = 'auth/invite-expired',
  INVITE_EMAIL_MISMATCH = 'auth/invite-email-mismatch',
  INVITE_ALREADY_ACCEPTED = 'auth/invite-already-accepted',

  // Organization
  NO_ORGANIZATION = 'auth/no-organization',
  ORG_CREATION_FAILED = 'auth/org-creation-failed',

  // Generic
  UNKNOWN_ERROR = 'auth/unknown-error',
}

export interface AuthError {
  code: AuthErrorCode
  message: string
  userMessage: string // Message to show to user
  suggestion?: string // Suggested action
  isDismissible: boolean
  isRetryable: boolean
}

export const authErrorMap: Record<AuthErrorCode, Omit<AuthError, 'code'>> = {
  [AuthErrorCode.NETWORK_ERROR]: {
    message: 'Falha na conexão com servidor',
    userMessage: 'Verifique sua conexão de internet e tente novamente',
    suggestion: 'Clique novamente para tentar',
    isDismissible: false,
    isRetryable: true,
  },

  [AuthErrorCode.TIMEOUT]: {
    message: 'Login demorou muito tempo',
    userMessage: 'O login excedeu o tempo limite. Tente novamente.',
    suggestion:
      'Se o problema persistir, tente limpar o cache do navegador (Ctrl+Shift+Delete)',
    isDismissible: false,
    isRetryable: true,
  },

  [AuthErrorCode.POPUP_BLOCKED]: {
    message: 'Popup de login foi bloqueado',
    userMessage: 'Desbloqueie popups neste site e tente novamente',
    suggestion:
      'Clique no ícone de bloqueio na barra de endereço e permita popups',
    isDismissible: true,
    isRetryable: true,
  },

  [AuthErrorCode.POPUP_CLOSED_BY_USER]: {
    message: 'Você fechou a janela de login',
    userMessage: 'A janela de autenticação foi fechada',
    suggestion: 'Clique em "Continuar com Google" para tentar novamente',
    isDismissible: true,
    isRetryable: true,
  },

  [AuthErrorCode.CANCELLED_POPUP_REQUEST]: {
    message: 'Login foi cancelado',
    userMessage: 'Você cancelou o login',
    suggestion: 'Clique em "Continuar com Google" para tentar novamente',
    isDismissible: true,
    isRetryable: true,
  },

  [AuthErrorCode.REDIRECT_TIMEOUT]: {
    message: 'Redirecionamento de login demorou muito',
    userMessage:
      'O login demorou muito. Você pode estar offline ou com conexão lenta.',
    suggestion: 'Verifique sua internet e tente novamente em alguns segundos',
    isDismissible: false,
    isRetryable: true,
  },

  [AuthErrorCode.INVALID_EMAIL]: {
    message: 'Email inválido',
    userMessage: 'O email fornecido não é válido',
    suggestion: 'Verifique o email e tente novamente',
    isDismissible: true,
    isRetryable: true,
  },

  [AuthErrorCode.USER_DISABLED]: {
    message: 'Usuário desativado',
    userMessage: 'Sua conta foi desativada',
    suggestion: 'Entre em contato com o suporte se achar que é um erro',
    isDismissible: true,
    isRetryable: false,
  },

  [AuthErrorCode.USER_NOT_FOUND]: {
    message: 'Usuário não encontrado',
    userMessage: 'Esse usuário não existe',
    suggestion: 'Verifique o email e tente novamente',
    isDismissible: true,
    isRetryable: true,
  },

  [AuthErrorCode.OPERATION_NOT_ALLOWED]: {
    message: 'Operação não permitida',
    userMessage: 'Essa operação não é permitida no momento',
    suggestion: 'Contate o suporte se o problema persistir',
    isDismissible: true,
    isRetryable: false,
  },

  [AuthErrorCode.INVALID_TOKEN]: {
    message: 'Token de autenticação inválido',
    userMessage:
      'Sua sessão é inválida. Por favor, tente fazer login novamente.',
    suggestion: 'Limpe o cache (Ctrl+Shift+Delete) e tente novamente',
    isDismissible: false,
    isRetryable: true,
  },

  [AuthErrorCode.SESSION_CREATION_FAILED]: {
    message: 'Falha ao criar sessão no servidor',
    userMessage: 'Não conseguimos criar sua sessão. Tente novamente.',
    suggestion: 'Se o problema persistir, contate o suporte',
    isDismissible: false,
    isRetryable: true,
  },

  [AuthErrorCode.NOT_AUTHENTICATED]: {
    message: 'Você não está autenticado',
    userMessage: 'Você precisa fazer login para acessar',
    suggestion: 'Clique em "Continuar com Google" para fazer login',
    isDismissible: true,
    isRetryable: true,
  },

  [AuthErrorCode.INVITE_NOT_FOUND]: {
    message: 'Convite não encontrado',
    userMessage: 'Esse convite não existe ou foi removido',
    suggestion: 'Solicite um novo convite ao administrador',
    isDismissible: true,
    isRetryable: false,
  },

  [AuthErrorCode.INVITE_EXPIRED]: {
    message: 'Convite expirou',
    userMessage: 'Esse convite expirou',
    suggestion: 'Solicite um novo convite ao administrador',
    isDismissible: true,
    isRetryable: false,
  },

  [AuthErrorCode.INVITE_EMAIL_MISMATCH]: {
    message: 'Email do convite não corresponde',
    userMessage: 'O email da sua conta Google não bate com o email do convite',
    suggestion:
      'Faça login com a conta Google correta ou solicite um novo convite',
    isDismissible: true,
    isRetryable: true,
  },

  [AuthErrorCode.INVITE_ALREADY_ACCEPTED]: {
    message: 'Convite já foi aceito',
    userMessage: 'Esse convite já foi aceito',
    suggestion: 'Você já deve ter acesso à organização',
    isDismissible: true,
    isRetryable: false,
  },

  [AuthErrorCode.NO_ORGANIZATION]: {
    message: 'Usuário não tem organização',
    userMessage: 'Você não está associado a nenhuma organização',
    suggestion: 'Peça ao administrador para criá-lo ou enviá-lo um convite',
    isDismissible: true,
    isRetryable: false,
  },

  [AuthErrorCode.ORG_CREATION_FAILED]: {
    message: 'Falha ao criar organização',
    userMessage: 'Não conseguimos criar sua organização. Tente novamente.',
    suggestion: 'Se o problema persistir, contate o suporte',
    isDismissible: false,
    isRetryable: true,
  },

  [AuthErrorCode.UNKNOWN_ERROR]: {
    message: 'Erro desconhecido na autenticação',
    userMessage: 'Algo deu errado. Tente novamente em alguns instantes.',
    suggestion: 'Se o problema persistir, contate o suporte',
    isDismissible: false,
    isRetryable: true,
  },
}

/**
 * Create a structured auth error
 */
export function createAuthError(code: AuthErrorCode): AuthError {
  const base = authErrorMap[code] || authErrorMap[AuthErrorCode.UNKNOWN_ERROR]
  return {
    code,
    ...base,
  }
}

/**
 * Parse Firebase error code to our AuthErrorCode
 */
export function parseFirebaseError(error: unknown): AuthErrorCode {
  const errorObj = error as Record<string, unknown> | null | undefined
  const code = errorObj?.code as string | undefined

  if (!code) return AuthErrorCode.UNKNOWN_ERROR

  // Map Firebase codes to our codes
  const codeMap: Record<string, AuthErrorCode> = {
    'auth/popup-blocked': AuthErrorCode.POPUP_BLOCKED,
    'auth/popup-closed-by-user': AuthErrorCode.POPUP_CLOSED_BY_USER,
    'auth/cancelled-popup-request': AuthErrorCode.CANCELLED_POPUP_REQUEST,
    'auth/network-request-failed': AuthErrorCode.NETWORK_ERROR,
    'auth/invalid-email': AuthErrorCode.INVALID_EMAIL,
    'auth/user-disabled': AuthErrorCode.USER_DISABLED,
    'auth/user-not-found': AuthErrorCode.USER_NOT_FOUND,
    'auth/operation-not-allowed': AuthErrorCode.OPERATION_NOT_ALLOWED,
    'auth/invalid-api-key': AuthErrorCode.INVALID_TOKEN,
  }

  return codeMap[code] || AuthErrorCode.UNKNOWN_ERROR
}

/**
 * Check if error is related to network
 */
export function isNetworkError(error: unknown): boolean {
  const errorObj = error as Record<string, unknown> | null | undefined
  const code = errorObj?.code as string | undefined
  const message = errorObj?.message as string | undefined
  return Boolean(
    code?.includes('network') || message?.toLowerCase().includes('network')
  )
}

/**
 * Check if error is retriable
 */
export function isRetriableError(error: AuthError): boolean {
  return error.isRetryable
}
