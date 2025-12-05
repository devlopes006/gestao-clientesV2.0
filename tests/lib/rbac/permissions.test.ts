import {
  getRoleDescription,
  getRoleLabel,
  getRolePermissions,
  hasAllPermissions,
  hasAnyPermission,
  hasHigherRole,
  hasPermission,
  Permission,
  RoleHierarchy,
  UserRole,
} from '@/lib/rbac/permissions'
import { describe, expect, it } from 'vitest'

describe('RBAC Permissions', () => {
  describe('hasPermission', () => {
    it('should grant admin all permissions', () => {
      const adminPermissions = getRolePermissions(UserRole.ADMIN)
      expect(adminPermissions.length).toBeGreaterThan(15)
      expect(hasPermission(UserRole.ADMIN, Permission.USER_CREATE)).toBe(true)
    })

    it('should deny viewer delete permissions', () => {
      expect(hasPermission(UserRole.VIEWER, Permission.USER_DELETE)).toBe(false)
      expect(hasPermission(UserRole.VIEWER, Permission.CLIENT_DELETE)).toBe(
        false
      )
    })

    it('should grant viewer read permissions', () => {
      expect(hasPermission(UserRole.VIEWER, Permission.CLIENT_READ)).toBe(true)
      expect(hasPermission(UserRole.VIEWER, Permission.INVOICE_READ)).toBe(true)
    })

    it('should grant accountant financial permissions', () => {
      expect(hasPermission(UserRole.ACCOUNTANT, Permission.INVOICE_READ)).toBe(
        true
      )
      expect(
        hasPermission(UserRole.ACCOUNTANT, Permission.TRANSACTION_CREATE)
      ).toBe(true)
      expect(hasPermission(UserRole.ACCOUNTANT, Permission.REPORT_EXPORT)).toBe(
        true
      )
    })

    it('should deny accountant user management', () => {
      expect(hasPermission(UserRole.ACCOUNTANT, Permission.USER_CREATE)).toBe(
        false
      )
      expect(hasPermission(UserRole.ACCOUNTANT, Permission.USER_DELETE)).toBe(
        false
      )
    })

    it('should grant sales client permissions', () => {
      expect(hasPermission(UserRole.SALES, Permission.CLIENT_CREATE)).toBe(true)
      expect(hasPermission(UserRole.SALES, Permission.INVOICE_SEND)).toBe(true)
      expect(hasPermission(UserRole.SALES, Permission.INVOICE_CREATE)).toBe(
        true
      )
    })

    it('should deny sales user management', () => {
      expect(hasPermission(UserRole.SALES, Permission.USER_DELETE)).toBe(false)
      expect(hasPermission(UserRole.SALES, Permission.SETTINGS_UPDATE)).toBe(
        false
      )
    })
  })

  describe('hasAnyPermission', () => {
    it('should return true if user has any permission', () => {
      const permissions = [Permission.USER_DELETE, Permission.CLIENT_CREATE]
      expect(hasAnyPermission(UserRole.SALES, permissions)).toBe(true)
    })

    it('should return false if user has none', () => {
      const permissions = [Permission.USER_DELETE, Permission.USER_MANAGE_ROLES]
      expect(hasAnyPermission(UserRole.SALES, permissions)).toBe(false)
    })
  })

  describe('hasAllPermissions', () => {
    it('should return true if admin has all permissions', () => {
      const permissions = [
        Permission.CLIENT_CREATE,
        Permission.INVOICE_CREATE,
        Permission.USER_DELETE,
      ]
      expect(hasAllPermissions(UserRole.ADMIN, permissions)).toBe(true)
    })

    it('should return false if missing one permission', () => {
      const permissions = [
        Permission.CLIENT_CREATE,
        Permission.USER_MANAGE_ROLES,
      ]
      expect(hasAllPermissions(UserRole.SALES, permissions)).toBe(false)
    })
  })

  describe('getRolePermissions', () => {
    it('should return all permissions for admin', () => {
      const perms = getRolePermissions(UserRole.ADMIN)
      expect(perms.length).toBeGreaterThan(15)
      expect(perms).toContain(Permission.USER_CREATE)
      expect(perms).toContain(Permission.CLIENT_DELETE)
    })

    it('should return limited permissions for viewer', () => {
      const perms = getRolePermissions(UserRole.VIEWER)
      expect(perms.length).toBe(3) // Only 3 read permissions
      expect(perms).not.toContain(Permission.USER_DELETE)
    })
  })

  describe('getRoleLabel', () => {
    it('should return Portuguese labels', () => {
      expect(getRoleLabel(UserRole.ADMIN)).toBe('Administrador')
      expect(getRoleLabel(UserRole.VIEWER)).toBe('Visualizador')
      expect(getRoleLabel(UserRole.ACCOUNTANT)).toBe('Contador')
    })
  })

  describe('getRoleDescription', () => {
    it('should return descriptions in Portuguese', () => {
      const desc = getRoleDescription(UserRole.ADMIN)
      expect(desc).toContain('usuários')
      expect(desc).toContain('dados')
    })
  })

  describe('Role Hierarchy', () => {
    it('should have correct hierarchy order', () => {
      expect(RoleHierarchy[0]).toBe(UserRole.SUPER_ADMIN)
      expect(RoleHierarchy[RoleHierarchy.length - 1]).toBe(UserRole.VIEWER)
    })

    it('hasHigherRole should work correctly', () => {
      expect(hasHigherRole(UserRole.ADMIN, UserRole.USER)).toBe(true)
      expect(hasHigherRole(UserRole.USER, UserRole.ADMIN)).toBe(false)
      expect(hasHigherRole(UserRole.SUPER_ADMIN, UserRole.VIEWER)).toBe(true)
    })

    it('should identify same role as not higher', () => {
      expect(hasHigherRole(UserRole.ADMIN, UserRole.ADMIN)).toBe(false)
    })
  })

  describe('Permission Groups', () => {
    it('should have user management permissions only for admin roles', () => {
      expect(hasPermission(UserRole.ADMIN, Permission.USER_MANAGE_ROLES)).toBe(
        true
      )
      expect(hasPermission(UserRole.MANAGER, Permission.USER_UPDATE)).toBe(true)
      expect(hasPermission(UserRole.SALES, Permission.USER_MANAGE_ROLES)).toBe(
        false
      )
    })

    it('should have settings permissions only for admin', () => {
      expect(hasPermission(UserRole.ADMIN, Permission.SETTINGS_UPDATE)).toBe(
        true
      )
      expect(hasPermission(UserRole.MANAGER, Permission.SETTINGS_UPDATE)).toBe(
        false
      )
      expect(hasPermission(UserRole.USER, Permission.SETTINGS_READ)).toBe(false)
    })

    it('should have audit permissions only for admin', () => {
      expect(hasPermission(UserRole.ADMIN, Permission.AUDIT_READ)).toBe(true)
      expect(hasPermission(UserRole.VIEWER, Permission.AUDIT_READ)).toBe(false)
    })
  })
})

describe('Permission Matrices', () => {
  it('super admin should have all permissions', () => {
    const allPermissions = Object.values(Permission)
    allPermissions.forEach((perm) => {
      expect(hasPermission(UserRole.SUPER_ADMIN, perm)).toBe(true)
    })
  })

  it('viewer should have only read permissions', () => {
    const viewerPerms = getRolePermissions(UserRole.VIEWER)
    viewerPerms.forEach((perm) => {
      expect(perm).toMatch(/read/)
    })
  })

  it('should have proper escalation of permissions', () => {
    // User should have fewer permissions than Manager
    const userPerms = getRolePermissions(UserRole.USER).length
    const managerPerms = getRolePermissions(UserRole.MANAGER).length
    expect(managerPerms).toBeGreaterThan(userPerms)

    // Manager should have fewer than Admin
    const adminPerms = getRolePermissions(UserRole.ADMIN).length
    expect(adminPerms).toBeGreaterThan(managerPerms)
  })
})
