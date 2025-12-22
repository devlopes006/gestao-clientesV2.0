import {
  getPermissionCache,
  invalidatePermissionCache,
  permissionCacheUsesRedis,
  setPermissionCache,
} from '@/lib/rbac/cache'
import { describe, expect, it } from 'vitest'

describe('RBAC permission cache', () => {
  it('sets, gets and invalidates (fallback cache)', async () => {
    if (permissionCacheUsesRedis) {
      // Não faz sentido validar fallback quando Redis está configurado
      return
    }

    const userId = 'cache-test-user'
    const orgId = 'cache-test-org'

    await setPermissionCache(userId, orgId, {
      valid: true,
      role: 'ADMIN',
      user: { id: userId },
      org: { id: orgId },
    })

    const cached = await getPermissionCache(userId, orgId)
    expect(cached?.role).toBe('ADMIN')

    await invalidatePermissionCache(userId, orgId)
    const after = await getPermissionCache(userId, orgId)
    expect(after).toBeNull()
  })
})
