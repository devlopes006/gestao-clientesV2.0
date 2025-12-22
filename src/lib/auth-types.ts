/**
 * Token management types and interfaces
 * Used across auth services and API endpoints
 */

/**
 * Firebase ID Token structure
 * Contains user info, org info, and expiration
 */
export interface FirebaseIdToken {
  iss: string
  aud: string
  auth_time: number
  user_id: string
  sub: string
  iat: number
  exp: number
  email: string
  email_verified: boolean
  name?: string
  picture?: string
  firebase: {
    identities: Record<string, unknown>
    sign_in_provider: string
  }
}

/**
 * Token stored in cookie/storage
 */
export interface StoredTokens {
  accessToken: string
  refreshToken: string
  expiresAt: number // Unix timestamp in milliseconds
}

/**
 * Token state in context
 */
export interface TokenState {
  accessToken: string | null
  refreshToken: string | null
  expiresAt: number | null // Unix timestamp in milliseconds
}

/**
 * Session API response when logging in
 */
export interface SessionResponse {
  user: {
    id: string
    email: string
    name: string
  }
  orgId: string
  role: string
  accessToken: string
  refreshToken: string
  expiresIn: number // seconds
}

/**
 * Refresh API request
 */
export interface RefreshTokenRequest {
  refreshToken: string
}

/**
 * Refresh API success response
 */
export interface RefreshTokenSuccessResponse {
  ok: true
  accessToken: string
  expiresIn: number // seconds
}

/**
 * Refresh API error response
 */
export interface RefreshTokenErrorResponse {
  ok: false
  error: string
}

/**
 * Refresh API response union type
 */
export type RefreshTokenResponse =
  | RefreshTokenSuccessResponse
  | RefreshTokenErrorResponse

/**
 * Generic API error response
 */
export interface ApiErrorResponse {
  ok: false
  error: string
}

/**
 * Check if token is about to expire
 * @param expiresAt Unix timestamp in milliseconds
 * @param bufferSeconds Buffer to consider token expired (default: 60 seconds before actual expiry)
 * @returns true if token is expired or expiring soon
 */
export function isTokenExpired(
  expiresAt: number | null,
  bufferSeconds = 60
): boolean {
  if (!expiresAt) return true
  const now = Date.now()
  const expiryBuffer = bufferSeconds * 1000 // Convert to milliseconds
  return now >= expiresAt - expiryBuffer
}

/**
 * Get time until token expiration
 * @param expiresAt Unix timestamp in milliseconds
 * @returns milliseconds until expiration, or -1 if already expired
 */
export function getTimeUntilExpiry(expiresAt: number | null): number {
  if (!expiresAt) return -1
  const timeRemaining = expiresAt - Date.now()
  return Math.max(timeRemaining, -1)
}

/**
 * Parse Firebase error response
 */
export interface FirebaseErrorResponse {
  error: {
    code: string
    message: string
  }
}
