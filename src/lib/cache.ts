/**
 * Simple in-memory cache with TTL support
 * For production, consider using Redis or similar
 */

interface CacheEntry<T> {
  value: T
  expiresAt: number
}

class CacheManager {
  private cache: Map<string, CacheEntry<any>> = new Map()
  private cleanupInterval: NodeJS.Timeout | null = null

  constructor() {
    // Cleanup expired entries every 5 minutes
    this.cleanupInterval = setInterval(
      () => {
        this.cleanup()
      },
      5 * 60 * 1000
    )
  }

  /**
   * Get value from cache
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key)

    if (!entry) {
      return null
    }

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key)
      return null
    }

    return entry.value as T
  }

  /**
   * Set value in cache with TTL in seconds
   */
  set<T>(key: string, value: T, ttlSeconds: number = 300): void {
    const expiresAt = Date.now() + ttlSeconds * 1000
    this.cache.set(key, { value, expiresAt })
  }

  /**
   * Delete specific key
   */
  delete(key: string): void {
    this.cache.delete(key)
  }

  /**
   * Delete all keys matching pattern
   */
  deletePattern(pattern: string): void {
    const regex = new RegExp(pattern.replace(/\*/g, '.*'))
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key)
      }
    }
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear()
  }

  /**
   * Cleanup expired entries
   */
  private cleanup(): void {
    const now = Date.now()
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key)
      }
    }
  }

  /**
   * Get cache stats
   */
  getStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    }
  }

  /**
   * Destroy cache manager
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
      this.cleanupInterval = null
    }
    this.clear()
  }
}

// Singleton instance
export const cacheManager = new CacheManager()

/**
 * Cache decorator for async functions
 */
export function cached<T extends (...args: any[]) => Promise<any>>(
  keyPrefix: string,
  ttlSeconds: number = 300
) {
  return function (
    target: any,
    propertyName: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value

    descriptor.value = async function (...args: Parameters<T>) {
      // Generate cache key from arguments
      const cacheKey = `${keyPrefix}:${JSON.stringify(args)}`

      // Try to get from cache
      const cached = cacheManager.get<ReturnType<T>>(cacheKey)
      if (cached !== null) {
        return cached
      }

      // Execute original method
      const result = await originalMethod.apply(this, args)

      // Store in cache
      cacheManager.set(cacheKey, result, ttlSeconds)

      return result
    }

    return descriptor
  }
}

/**
 * Helper to wrap async function with cache
 */
export function withCache<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  keyPrefix: string,
  ttlSeconds: number = 300
): T {
  return (async (...args: Parameters<T>) => {
    const cacheKey = `${keyPrefix}:${JSON.stringify(args)}`

    const cached = cacheManager.get<Awaited<ReturnType<T>>>(cacheKey)
    if (cached !== null) {
      return cached
    }

    const result = await fn(...args)
    cacheManager.set(cacheKey, result, ttlSeconds)

    return result
  }) as T
}

/**
 * Cache invalidation helpers
 */
export const cacheInvalidation = {
  /**
   * Invalidate all transaction-related caches
   */
  transactions(orgId: string) {
    cacheManager.deletePattern(`transactions:*:${orgId}*`)
    cacheManager.deletePattern(`dashboard:*:${orgId}*`)
    cacheManager.deletePattern(`reports:*:${orgId}*`)
  },

  /**
   * Invalidate all invoice-related caches
   */
  invoices(orgId: string) {
    cacheManager.deletePattern(`invoices:*:${orgId}*`)
    cacheManager.deletePattern(`dashboard:*:${orgId}*`)
    cacheManager.deletePattern(`reports:*:${orgId}*`)
  },

  /**
   * Invalidate client-specific caches
   */
  client(clientId: string) {
    cacheManager.deletePattern(`*:${clientId}*`)
  },

  /**
   * Invalidate organization caches
   */
  organization(orgId: string) {
    cacheManager.deletePattern(`*:${orgId}*`)
  },
}
