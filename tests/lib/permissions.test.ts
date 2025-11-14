import { can } from '@/lib/permissions'
import { describe, expect, it } from 'vitest'

describe('permissions - can()', () => {
  describe('OWNER role', () => {
    it('should allow OWNER to manage all resources', () => {
      expect(can('OWNER', 'manage', 'client')).toBe(true)
      expect(can('OWNER', 'manage', 'task')).toBe(true)
      expect(can('OWNER', 'manage', 'finance')).toBe(true)
      expect(can('OWNER', 'manage', 'member')).toBe(true)
      expect(can('OWNER', 'manage', 'org')).toBe(true)
    })

    it('should allow OWNER to create all resources', () => {
      expect(can('OWNER', 'create', 'client')).toBe(true)
      expect(can('OWNER', 'create', 'task')).toBe(true)
      expect(can('OWNER', 'create', 'finance')).toBe(true)
      expect(can('OWNER', 'create', 'branding')).toBe(true)
    })

    it('should allow OWNER to read all resources', () => {
      expect(can('OWNER', 'read', 'org')).toBe(true)
      expect(can('OWNER', 'read', 'client')).toBe(true)
      expect(can('OWNER', 'read', 'finance')).toBe(true)
    })

    it('should allow OWNER to update all resources', () => {
      expect(can('OWNER', 'update', 'org')).toBe(true)
      expect(can('OWNER', 'update', 'client')).toBe(true)
      expect(can('OWNER', 'update', 'finance')).toBe(true)
    })

    it('should allow OWNER to delete all resources', () => {
      expect(can('OWNER', 'delete', 'client')).toBe(true)
      expect(can('OWNER', 'delete', 'task')).toBe(true)
      expect(can('OWNER', 'delete', 'finance')).toBe(true)
    })
  })

  describe('STAFF role', () => {
    it('should allow STAFF to manage limited resources', () => {
      expect(can('STAFF', 'manage', 'client')).toBe(true)
      expect(can('STAFF', 'manage', 'task')).toBe(true)
      expect(can('STAFF', 'manage', 'branding')).toBe(true)
      expect(can('STAFF', 'manage', 'strategy')).toBe(true)
    })

    it('should NOT allow STAFF to manage org or finance', () => {
      expect(can('STAFF', 'manage', 'org')).toBe(false)
      expect(can('STAFF', 'manage', 'finance')).toBe(false)
      expect(can('STAFF', 'manage', 'member')).toBe(false)
    })

    it('should allow STAFF to create specific resources', () => {
      expect(can('STAFF', 'create', 'task')).toBe(true)
      expect(can('STAFF', 'create', 'branding')).toBe(true)
      expect(can('STAFF', 'create', 'strategy')).toBe(true)
    })

    it('should NOT allow STAFF to create finance', () => {
      expect(can('STAFF', 'create', 'finance')).toBe(false)
    })

    it('should allow STAFF to read client and task data', () => {
      expect(can('STAFF', 'read', 'org')).toBe(true)
      expect(can('STAFF', 'read', 'client')).toBe(true)
      expect(can('STAFF', 'read', 'task')).toBe(true)
    })

    it('should allow STAFF to update client and tasks', () => {
      expect(can('STAFF', 'update', 'client')).toBe(true)
      expect(can('STAFF', 'update', 'task')).toBe(true)
    })

    it('should allow STAFF to delete tasks but not clients', () => {
      expect(can('STAFF', 'delete', 'task')).toBe(true)
      expect(can('STAFF', 'delete', 'client')).toBe(false)
    })
  })

  describe('CLIENT role', () => {
    it('should NOT allow CLIENT to manage anything', () => {
      expect(can('CLIENT', 'manage', 'client')).toBe(false)
      expect(can('CLIENT', 'manage', 'task')).toBe(false)
      expect(can('CLIENT', 'manage', 'org')).toBe(false)
    })

    it('should NOT allow CLIENT to create anything', () => {
      expect(can('CLIENT', 'create', 'client')).toBe(false)
      expect(can('CLIENT', 'create', 'task')).toBe(false)
      expect(can('CLIENT', 'create', 'finance')).toBe(false)
    })

    it('should allow CLIENT to read limited resources', () => {
      expect(can('CLIENT', 'read', 'client')).toBe(true)
      expect(can('CLIENT', 'read', 'task')).toBe(true)
      expect(can('CLIENT', 'read', 'branding')).toBe(true)
      expect(can('CLIENT', 'read', 'strategy')).toBe(true)
    })

    it('should NOT allow CLIENT to read org or finance', () => {
      expect(can('CLIENT', 'read', 'org')).toBe(false)
      expect(can('CLIENT', 'read', 'finance')).toBe(false)
    })

    it('should NOT allow CLIENT to update anything', () => {
      expect(can('CLIENT', 'update', 'client')).toBe(false)
      expect(can('CLIENT', 'update', 'task')).toBe(false)
    })

    it('should NOT allow CLIENT to delete anything', () => {
      expect(can('CLIENT', 'delete', 'client')).toBe(false)
      expect(can('CLIENT', 'delete', 'task')).toBe(false)
    })
  })

  describe('edge cases', () => {
    it('should return false for unknown action', () => {
      // @ts-expect-error Testing invalid action
      expect(can('OWNER', 'unknown', 'client')).toBe(false)
    })

    it('should return false for unknown resource', () => {
      // @ts-expect-error Testing invalid resource
      expect(can('OWNER', 'read', 'unknown')).toBe(false)
    })
  })
})
