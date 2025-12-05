/**
 * Audit Trail System
 *
 * Tracks all important actions in the system for compliance
 * and security purposes
 *
 * NOTE: Uses optional Firebase for real-time audit logs.
 * If Firebase is not configured, logs are silently dropped.
 */

import { db } from '@/lib/firebase'
import {
  addDoc,
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  where,
} from 'firebase/firestore'

// Guard to check if Firebase is initialized
const isFirebaseReady = () => {
  return db !== undefined && db !== null
}

/**
 * Audit action types
 */
export enum AuditAction {
  // User actions
  USER_LOGIN = 'user_login',
  USER_LOGOUT = 'user_logout',
  USER_CREATED = 'user_created',
  USER_UPDATED = 'user_updated',
  USER_DELETED = 'user_deleted',
  USER_ROLE_CHANGED = 'user_role_changed',

  // Client actions
  CLIENT_CREATED = 'client_created',
  CLIENT_UPDATED = 'client_updated',
  CLIENT_DELETED = 'client_deleted',

  // Invoice actions
  INVOICE_CREATED = 'invoice_created',
  INVOICE_UPDATED = 'invoice_updated',
  INVOICE_DELETED = 'invoice_deleted',
  INVOICE_SENT = 'invoice_sent',
  INVOICE_PAID = 'invoice_paid',

  // Transaction actions
  TRANSACTION_CREATED = 'transaction_created',
  TRANSACTION_UPDATED = 'transaction_updated',
  TRANSACTION_DELETED = 'transaction_deleted',

  // Organization actions
  ORG_SETTINGS_CHANGED = 'org_settings_changed',
  ORG_MEMBER_ADDED = 'org_member_added',
  ORG_MEMBER_REMOVED = 'org_member_removed',

  // Report actions
  REPORT_GENERATED = 'report_generated',
  REPORT_EXPORTED = 'report_exported',

  // Permission/Access actions
  PERMISSION_DENIED = 'permission_denied',
  UNAUTHORIZED_ACCESS = 'unauthorized_access',
}

/**
 * Audit log entry
 */
export interface AuditLogEntry {
  id?: string
  organizationId: string
  userId: string
  action: AuditAction
  resourceType: string
  resourceId: string
  resourceName?: string
  changes?: Record<string, { before: unknown; after: unknown }>
  ipAddress?: string
  userAgent?: string
  timestamp: Date
  metadata?: Record<string, unknown>
}

/**
 * Create an audit log entry
 */
export async function createAuditLog(entry: AuditLogEntry): Promise<string> {
  try {
    if (!isFirebaseReady()) {
      console.warn('Firebase not initialized, skipping audit log')
      return 'noop'
    }

    const docRef = await addDoc(collection(db!, 'audit_logs'), {
      ...entry,
      timestamp: new Date(),
    })
    return docRef.id
  } catch (error) {
    console.error('Failed to create audit log:', error)
    // Don't throw - audit logs are non-critical
    return 'error'
  }
}

/**
 * Get audit logs for an organization
 */
export async function getAuditLogs(
  organizationId: string,
  options?: {
    limit?: number
    userId?: string
    action?: AuditAction
    resourceType?: string
    startDate?: Date
    endDate?: Date
  }
): Promise<AuditLogEntry[]> {
  try {
    if (!isFirebaseReady()) {
      console.warn('Firebase not initialized, returning empty audit logs')
      return []
    }

    const conditions: any[] = [where('organizationId', '==', organizationId)]

    if (options?.userId) {
      conditions.push(where('userId', '==', options.userId))
    }

    if (options?.action) {
      conditions.push(where('action', '==', options.action))
    }

    if (options?.resourceType) {
      conditions.push(where('resourceType', '==', options.resourceType))
    }

    const q = query(
      collection(db!, 'audit_logs'),
      ...conditions,
      orderBy('timestamp', 'desc')
    )

    const snapshot = await getDocs(q)
    const logs = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      timestamp: doc.data().timestamp?.toDate(),
    })) as AuditLogEntry[]

    // Filter by date range if provided
    if (options?.startDate || options?.endDate) {
      return logs.filter((log) => {
        if (options.startDate && log.timestamp < options.startDate) return false
        if (options.endDate && log.timestamp > options.endDate) return false
        return true
      })
    }

    return logs.slice(0, options?.limit || 100)
  } catch (error) {
    console.error('Failed to get audit logs:', error)
    return []
  }
}

/**
 * Get audit logs for a specific resource
 */
export async function getResourceAuditLogs(
  organizationId: string,
  resourceType: string,
  resourceId: string
): Promise<AuditLogEntry[]> {
  try {
    if (!isFirebaseReady()) {
      return []
    }

    const q = query(
      collection(db!, 'audit_logs'),
      where('organizationId', '==', organizationId),
      where('resourceType', '==', resourceType),
      where('resourceId', '==', resourceId),
      orderBy('timestamp', 'desc'),
      limit(50)
    )

    const snapshot = await getDocs(q)
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      timestamp: doc.data().timestamp?.toDate(),
    })) as AuditLogEntry[]
  } catch (error) {
    console.error('Failed to get resource audit logs:', error)
    return []
  }
}

/**
 * Get user activity summary
 */
export async function getUserActivitySummary(
  organizationId: string,
  userId: string,
  days: number = 30
): Promise<{
  totalActions: number
  actionsByType: Record<AuditAction, number>
  lastActivity?: Date
}> {
  try {
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    const logs = await getAuditLogs(organizationId, {
      userId,
      startDate,
    })

    const actionsByType: Record<AuditAction, number> = {} as Record<
      AuditAction,
      number
    >

    logs.forEach((log) => {
      actionsByType[log.action] = (actionsByType[log.action] || 0) + 1
    })

    return {
      totalActions: logs.length,
      actionsByType,
      lastActivity: logs[0]?.timestamp,
    }
  } catch (error) {
    console.error('Failed to get user activity summary:', error)
    throw new Error('Failed to retrieve user activity summary')
  }
}

/**
 * Check for suspicious activity
 */
export async function checkSuspiciousActivity(
  organizationId: string,
  userId: string,
  threshold: number = 100 // actions in 5 minutes
): Promise<boolean> {
  try {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000)

    const logs = await getAuditLogs(organizationId, {
      userId,
      startDate: fiveMinutesAgo,
    })

    // Check for unusual activity patterns
    const deletionCount = logs.filter((log) =>
      log.action.includes('deleted')
    ).length

    // Flag if many deletions in short time
    if (deletionCount > 5) {
      return true
    }

    // Flag if many failed access attempts
    const deniedCount = logs.filter(
      (log) => log.action === AuditAction.PERMISSION_DENIED
    ).length

    if (deniedCount > 10) {
      return true
    }

    // Flag if actions exceed threshold
    if (logs.length > threshold) {
      return true
    }

    return false
  } catch (error) {
    console.error('Failed to check suspicious activity:', error)
    return false
  }
}

/**
 * Export audit logs
 */
export async function exportAuditLogs(
  organizationId: string,
  options?: {
    userId?: string
    action?: AuditAction
    startDate?: Date
    endDate?: Date
  }
): Promise<Record<string, unknown>[]> {
  const logs = await getAuditLogs(organizationId, {
    limit: 10000, // Export max 10k records
    ...options,
  })

  return logs.map((log) => ({
    timestamp: log.timestamp?.toISOString(),
    userId: log.userId,
    action: log.action,
    resourceType: log.resourceType,
    resourceId: log.resourceId,
    resourceName: log.resourceName,
    changes: log.changes,
    metadata: log.metadata,
  }))
}

/**
 * Get action label for display
 */
export function getActionLabel(action: AuditAction): string {
  const labels: Record<AuditAction, string> = {
    [AuditAction.USER_LOGIN]: 'Login do usuário',
    [AuditAction.USER_LOGOUT]: 'Logout do usuário',
    [AuditAction.USER_CREATED]: 'Usuário criado',
    [AuditAction.USER_UPDATED]: 'Usuário atualizado',
    [AuditAction.USER_DELETED]: 'Usuário deletado',
    [AuditAction.USER_ROLE_CHANGED]: 'Função do usuário alterada',
    [AuditAction.CLIENT_CREATED]: 'Cliente criado',
    [AuditAction.CLIENT_UPDATED]: 'Cliente atualizado',
    [AuditAction.CLIENT_DELETED]: 'Cliente deletado',
    [AuditAction.INVOICE_CREATED]: 'Invoice criada',
    [AuditAction.INVOICE_UPDATED]: 'Invoice atualizada',
    [AuditAction.INVOICE_DELETED]: 'Invoice deletada',
    [AuditAction.INVOICE_SENT]: 'Invoice enviada',
    [AuditAction.INVOICE_PAID]: 'Invoice paga',
    [AuditAction.TRANSACTION_CREATED]: 'Transação criada',
    [AuditAction.TRANSACTION_UPDATED]: 'Transação atualizada',
    [AuditAction.TRANSACTION_DELETED]: 'Transação deletada',
    [AuditAction.ORG_SETTINGS_CHANGED]:
      'Configurações da organização alteradas',
    [AuditAction.ORG_MEMBER_ADDED]: 'Membro adicionado à organização',
    [AuditAction.ORG_MEMBER_REMOVED]: 'Membro removido da organização',
    [AuditAction.REPORT_GENERATED]: 'Relatório gerado',
    [AuditAction.REPORT_EXPORTED]: 'Relatório exportado',
    [AuditAction.PERMISSION_DENIED]: 'Permissão negada',
    [AuditAction.UNAUTHORIZED_ACCESS]: 'Acesso não autorizado',
  }
  return labels[action]
}
