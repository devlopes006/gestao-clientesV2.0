import { cacheManager } from '@/lib/cache'
import { Redis } from '@upstash/redis'
import { createClient, type RedisClientType } from 'redis'

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
const upstashConfigured =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
const redisRest = upstashConfigured ? Redis.fromEnv() : null
const genericRedisUrl = process.env.REDIS_URL
let redisNode: RedisClientType | null = null

async function ensureNode() {
  if (redisNode || !genericRedisUrl) return
  try {
    redisNode = createClient({ url: genericRedisUrl })
    redisNode.on('error', (err) => {
      console.error('[RBAC Cache] node-redis error', err)
    })
    await redisNode.connect()
  } catch (err) {
    console.error('[RBAC Cache] failed to connect to REDIS_URL', err)
    redisNode = null
  }
}

const keyFor = (userId: string, orgId: string) =>
  `rbac:perms:${userId}:${orgId}`

export const permissionCacheUsesRedis = Boolean(genericRedisUrl || redisRest)

export async function getPermissionCache(
  userId: string,
  orgId: string
): Promise<PermissionCacheEntry | null> {
  const key = keyFor(userId, orgId)
  try {
    if (genericRedisUrl) {
      await ensureNode()
      if (redisNode) {
        const raw = await redisNode.get(key)
        return raw ? (JSON.parse(raw) as PermissionCacheEntry) : null
      }
    } else if (redisRest) {
      const cached = await redisRest.get<PermissionCacheEntry>(key)
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
    if (genericRedisUrl) {
      await ensureNode()
      if (redisNode) {
        await redisNode.set(key, JSON.stringify(value), { EX: ttlSeconds })
        return
      }
    } else if (redisRest) {
      await redisRest.set(key, value, { ex: ttlSeconds })
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
    if (genericRedisUrl) {
      await ensureNode()
      if (redisNode) await redisNode.del(key)
    } else if (redisRest) {
      await redisRest.del(key)
    }
  } catch (error) {
    console.error('[RBAC Cache] redis del error', error)
  } finally {
    cacheManager.delete(key)
  }
}
