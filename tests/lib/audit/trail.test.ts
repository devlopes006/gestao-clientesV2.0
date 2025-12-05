import { AuditAction, getActionLabel } from '@/lib/audit/trail'
import { describe, expect, it } from 'vitest'

describe('Audit Trail', () => {
  describe('AuditAction enum', () => {
    it('should have user action types', () => {
      expect(AuditAction.USER_LOGIN).toBe('user_login')
      expect(AuditAction.USER_LOGOUT).toBe('user_logout')
      expect(AuditAction.USER_CREATED).toBe('user_created')
    })

    it('should have client action types', () => {
      expect(AuditAction.CLIENT_CREATED).toBe('client_created')
      expect(AuditAction.CLIENT_UPDATED).toBe('client_updated')
      expect(AuditAction.CLIENT_DELETED).toBe('client_deleted')
    })

    it('should have invoice action types', () => {
      expect(AuditAction.INVOICE_CREATED).toBe('invoice_created')
      expect(AuditAction.INVOICE_SENT).toBe('invoice_sent')
      expect(AuditAction.INVOICE_PAID).toBe('invoice_paid')
    })

    it('should have security action types', () => {
      expect(AuditAction.PERMISSION_DENIED).toBe('permission_denied')
      expect(AuditAction.UNAUTHORIZED_ACCESS).toBe('unauthorized_access')
    })

    it('should have organization action types', () => {
      expect(AuditAction.ORG_SETTINGS_CHANGED).toBe('org_settings_changed')
      expect(AuditAction.ORG_MEMBER_ADDED).toBe('org_member_added')
    })
  })

  describe('getActionLabel', () => {
    it('should return Portuguese labels for user actions', () => {
      expect(getActionLabel(AuditAction.USER_LOGIN)).toBe('Login do usuário')
      expect(getActionLabel(AuditAction.USER_CREATED)).toBe('Usuário criado')
      expect(getActionLabel(AuditAction.USER_ROLE_CHANGED)).toContain('Função')
    })

    it('should return Portuguese labels for client actions', () => {
      expect(getActionLabel(AuditAction.CLIENT_CREATED)).toContain('Cliente')
      expect(getActionLabel(AuditAction.CLIENT_DELETED)).toContain('Cliente')
    })

    it('should return Portuguese labels for invoice actions', () => {
      expect(getActionLabel(AuditAction.INVOICE_CREATED)).toContain('Invoice')
      expect(getActionLabel(AuditAction.INVOICE_SENT)).toContain('Invoice')
    })

    it('should return Portuguese labels for security actions', () => {
      expect(getActionLabel(AuditAction.PERMISSION_DENIED)).toContain('negada')
      expect(getActionLabel(AuditAction.UNAUTHORIZED_ACCESS)).toContain(
        'não autorizado'
      )
    })

    it('should return labels for organization actions', () => {
      const label = getActionLabel(AuditAction.ORG_SETTINGS_CHANGED)
      expect(label).toContain('Configurações')
    })
  })

  describe('Audit Log Patterns', () => {
    it('should have action types for all major features', () => {
      const actionCount = Object.values(AuditAction).length
      expect(actionCount).toBeGreaterThan(15)
    })

    it('should follow naming convention (resource_action)', () => {
      const actions = Object.values(AuditAction) as string[]
      actions.forEach((action) => {
        expect(action as string).toMatch(/^[a-z]+_[a-z_]+$/)
      })
    })

    it('should have complementary create/update/delete actions', () => {
      const createActions = Object.values(AuditAction).filter((a) =>
        (a as string).includes('created')
      )
      const updateActions = Object.values(AuditAction).filter((a) =>
        (a as string).includes('updated')
      )
      const deleteActions = Object.values(AuditAction).filter((a) =>
        (a as string).includes('deleted')
      )

      expect(createActions.length).toBeGreaterThan(0)
      expect(updateActions.length).toBeGreaterThan(0)
      expect(deleteActions.length).toBeGreaterThan(0)
    })
  })

  describe('Security Actions', () => {
    it('should track permission denials', () => {
      expect(AuditAction.PERMISSION_DENIED).toBeDefined()
    })

    it('should track unauthorized access', () => {
      expect(AuditAction.UNAUTHORIZED_ACCESS).toBeDefined()
    })

    it('should track role changes', () => {
      expect(AuditAction.USER_ROLE_CHANGED).toBeDefined()
    })
  })

  describe('Financial Actions', () => {
    it('should track invoice lifecycle', () => {
      expect(AuditAction.INVOICE_CREATED).toBeDefined()
      expect(AuditAction.INVOICE_SENT).toBeDefined()
      expect(AuditAction.INVOICE_PAID).toBeDefined()
    })

    it('should track transaction actions', () => {
      expect(AuditAction.TRANSACTION_CREATED).toBeDefined()
      expect(AuditAction.TRANSACTION_UPDATED).toBeDefined()
    })
  })

  describe('Organization Management', () => {
    it('should track org settings changes', () => {
      expect(AuditAction.ORG_SETTINGS_CHANGED).toBeDefined()
    })

    it('should track member changes', () => {
      expect(AuditAction.ORG_MEMBER_ADDED).toBeDefined()
      expect(AuditAction.ORG_MEMBER_REMOVED).toBeDefined()
    })
  })
})
