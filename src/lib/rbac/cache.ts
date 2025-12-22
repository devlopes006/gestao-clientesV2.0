import { cacheManager } from '@/lib/cache'
import { Redis } from '@upstash/redis'

export interface PermissionCacheEntry {
  valid: boolean
  reason?: string
  role?: string
  user?: {
    id: string
    email?: string
    name?: string
  }
  org?: {
    id: string
    name?: string
  }
  cachedAt: string
}

const TTL_SECONDS = 300
const redisConfigured =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
const redis = redisConfigured ? Redis.fromEnv() : null

const keyFor = (userId: string, orgId: string) =>
  `rbac:perms:${userId}:${orgId}`

export const permissionCacheUsesRedis = Boolean(redis)

export async function getPermissionCache(
  userId: string,
  orgId: string
): Promise<PermissionCacheEntry | null> {
  const key = keyFor(userId, orgId)
  try {
    if (redis) {
      const cached = await redis.get<PermissionCacheEntry>(key)
      return cached ?? null
    }
    return cacheManager.get<PermissionCacheEntry>(key)
  } catch (error) {
    console.error('[RBAC Cache] get error', error)
    return null
  }
}

export async function setPermissionCache(
  userId: string,
  orgId: string,
  entry: Omit<PermissionCacheEntry, 'cachedAt'>,
  ttlSeconds: number = TTL_SECONDS
): Promise<void> {
  const key = keyFor(userId, orgId)
  const value: PermissionCacheEntry = {
    ...entry,
    cachedAt: new Date().toISOString(),
  }

  try {
    if (redis) {
      await redis.set(key, value, { ex: ttlSeconds })
      return
    }
    cacheManager.set(key, value, ttlSeconds)
  } catch (error) {
    console.error('[RBAC Cache] set error', error)
  }
}

export async function invalidatePermissionCache(
  userId: string,
  orgId: string
): Promise<void> {
  const key = keyFor(userId, orgId)
  try {
    if (redis) {
      await redis.del(key)
    }
  } catch (error) {
    console.error('[RBAC Cache] redis del error', error)
  } finally {
    cacheManager.delete(key)
  }
}
