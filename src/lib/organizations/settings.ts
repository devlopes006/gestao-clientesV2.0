/**
 * Organization Settings Management
 *
 * Handles organization-level configurations and preferences
 * NOTE: Uses optional Firebase for real-time settings sync.
 * If Firebase is not configured, functions return null/defaults.
 */

import { db } from '@/lib/firebase'
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore'

// Guard to check if Firebase is initialized
const isFirebaseReady = () => {
  return db !== undefined && db !== null
}

/**
 * Organization settings interface
 */
export interface OrganizationSettings {
  id: string
  organizationId: string
  // Branding
  companyName: string
  companyEmail: string
  companyPhone?: string
  companyAddress?: string
  logoUrl?: string
  website?: string

  // Features
  enableInvoices: boolean
  enableClients: boolean
  enableAnalytics: boolean
  enableReports: boolean
  enableMobileApp: boolean
  enableAudit: boolean

  // Financial settings
  currencyCode: string // e.g., 'BRL'
  taxRate?: number // Percentage
  invoicePrefix?: string
  invoiceStartNumber: number

  // Security
  requireTwoFactor: boolean
  sessionTimeout: number // in minutes
  passwordPolicy?: {
    minLength: number
    requireUppercase: boolean
    requireNumbers: boolean
    requireSpecialChars: boolean
  }

  // Notifications
  enableEmailNotifications: boolean
  enableSmsNotifications: boolean
  notificationEmail?: string

  // Integration
  stripeEnabled: boolean
  whatsappEnabled: boolean
  webhooksEnabled: boolean

  // Data retention
  retentionDays: number // How long to keep audit logs

  // Metadata
  timezone: string // e.g., 'America/Sao_Paulo'
  language: string // e.g., 'pt-BR'
  createdAt: Date
  updatedAt: Date
}

/**
 * Default organization settings
 */
export const DEFAULT_SETTINGS: Omit<
  OrganizationSettings,
  'id' | 'organizationId' | 'createdAt' | 'updatedAt'
> = {
  companyName: '',
  companyEmail: '',
  logoUrl: undefined,
  website: undefined,

  // Features
  enableInvoices: true,
  enableClients: true,
  enableAnalytics: true,
  enableReports: true,
  enableMobileApp: true,
  enableAudit: true,

  // Financial
  currencyCode: 'BRL',
  invoicePrefix: 'INV',
  invoiceStartNumber: 1000,

  // Security
  requireTwoFactor: false,
  sessionTimeout: 30,
  passwordPolicy: {
    minLength: 8,
    requireUppercase: true,
    requireNumbers: true,
    requireSpecialChars: true,
  },

  // Notifications
  enableEmailNotifications: true,
  enableSmsNotifications: false,

  // Integration
  stripeEnabled: false,
  whatsappEnabled: false,
  webhooksEnabled: false,

  // Data retention
  retentionDays: 365,

  // Metadata
  timezone: 'America/Sao_Paulo',
  language: 'pt-BR',
}

/**
 * Get organization settings
 */
export async function getOrganizationSettings(
  organizationId: string
): Promise<OrganizationSettings | null> {
  try {
    if (!isFirebaseReady()) {
      console.warn('Firebase not initialized, returning default settings')
      return {
        id: 'general',
        organizationId,
        ...DEFAULT_SETTINGS,
      } as OrganizationSettings
    }

    const docRef = doc(
      db!,
      'organizations',
      organizationId,
      'settings',
      'general'
    )
    const docSnap = await getDoc(docRef)

    if (!docSnap.exists()) {
      return null
    }

    const data = docSnap.data()
    return {
      id: docSnap.id,
      organizationId,
      ...data,
      createdAt: data.createdAt?.toDate(),
      updatedAt: data.updatedAt?.toDate(),
    } as OrganizationSettings
  } catch (error) {
    console.error('Failed to get organization settings:', error)
    // Return defaults instead of throwing
    return {
      id: 'general',
      organizationId,
      ...DEFAULT_SETTINGS,
    } as OrganizationSettings
  }
}

/**
 * Create default organization settings
 */
export async function createOrganizationSettings(
  organizationId: string,
  overrides?: Partial<OrganizationSettings>
): Promise<OrganizationSettings> {
  try {
    const settings: OrganizationSettings = {
      id: 'general',
      organizationId,
      ...DEFAULT_SETTINGS,
      ...overrides,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    if (!isFirebaseReady()) {
      console.warn('Firebase not initialized, returning in-memory settings')
      return settings
    }

    const docRef = doc(
      db!,
      'organizations',
      organizationId,
      'settings',
      'general'
    )
    await setDoc(docRef, {
      ...settings,
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    return settings
  } catch (error) {
    console.error('Failed to create organization settings:', error)
    // Return settings anyway for resilience
    return {
      id: 'general',
      organizationId,
      ...DEFAULT_SETTINGS,
      ...overrides,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as OrganizationSettings
  }
}

/**
 * Update organization settings
 */
export async function updateOrganizationSettings(
  organizationId: string,
  updates: Partial<OrganizationSettings>
): Promise<OrganizationSettings> {
  try {
    if (!isFirebaseReady()) {
      console.warn('Firebase not initialized, returning merged settings')
      // Return merged settings in-memory
      const current = await getOrganizationSettings(organizationId)
      return { ...(current || ({} as any)), ...updates } as OrganizationSettings
    }

    const docRef = doc(
      db!,
      'organizations',
      organizationId,
      'settings',
      'general'
    )

    // Ensure we're not updating ID fields
    const { id, organizationId: _, createdAt, ...cleanUpdates } = updates

    await updateDoc(docRef, {
      ...cleanUpdates,
      updatedAt: new Date(),
    })

    // Fetch and return updated document
    const updated = await getOrganizationSettings(organizationId)
    if (!updated) {
      throw new Error('Settings not found after update')
    }

    return updated
  } catch (error) {
    console.error('Failed to update organization settings:', error)
    throw new Error('Failed to update organization settings')
  }
}

/**
 * Check if a feature is enabled
 */
export async function isFeatureEnabled(
  organizationId: string,
  feature: keyof Pick<
    OrganizationSettings,
    | 'enableInvoices'
    | 'enableClients'
    | 'enableAnalytics'
    | 'enableReports'
    | 'enableMobileApp'
    | 'enableAudit'
    | 'stripeEnabled'
    | 'whatsappEnabled'
    | 'webhooksEnabled'
  >
): Promise<boolean> {
  try {
    const settings = await getOrganizationSettings(organizationId)
    if (!settings) return false

    return settings[feature] ?? false
  } catch (error) {
    console.error('Failed to check feature:', error)
    return false
  }
}

/**
 * Get invoice numbering info
 */
export async function getInvoiceNumbering(organizationId: string): Promise<{
  prefix: string
  nextNumber: number
}> {
  try {
    const settings = await getOrganizationSettings(organizationId)
    if (!settings) {
      return {
        prefix: DEFAULT_SETTINGS.invoicePrefix || 'INV',
        nextNumber: DEFAULT_SETTINGS.invoiceStartNumber,
      }
    }

    return {
      prefix: settings.invoicePrefix || 'INV',
      nextNumber: settings.invoiceStartNumber + 1000, // Simplified counter
    }
  } catch (error) {
    console.error('Failed to get invoice numbering:', error)
    throw new Error('Failed to get invoice numbering')
  }
}

/**
 * Get organization branding
 */
export async function getOrganizationBranding(organizationId: string): Promise<{
  companyName: string
  logoUrl?: string
  primaryColor?: string
}> {
  try {
    const settings = await getOrganizationSettings(organizationId)
    if (!settings) {
      return {
        companyName: 'Seu Negócio',
        logoUrl: undefined,
      }
    }

    return {
      companyName: settings.companyName,
      logoUrl: settings.logoUrl,
    }
  } catch (error) {
    console.error('Failed to get organization branding:', error)
    throw new Error('Failed to get organization branding')
  }
}

/**
 * Validate password against organization policy
 */
export async function validatePassword(
  organizationId: string,
  password: string
): Promise<{ valid: boolean; errors: string[] }> {
  try {
    const settings = await getOrganizationSettings(organizationId)
    const policy = settings?.passwordPolicy || DEFAULT_SETTINGS.passwordPolicy

    const errors: string[] = []

    if (!policy) {
      return { valid: true, errors: [] }
    }

    if (password.length < policy.minLength) {
      errors.push(`Senha deve ter pelo menos ${policy.minLength} caracteres`)
    }

    if (policy.requireUppercase && !/[A-Z]/.test(password)) {
      errors.push('Senha deve conter letras maiúsculas')
    }

    if (policy.requireNumbers && !/\d/.test(password)) {
      errors.push('Senha deve conter números')
    }

    if (policy.requireSpecialChars && !/[!@#$%^&*]/.test(password)) {
      errors.push('Senha deve conter caracteres especiais')
    }

    return {
      valid: errors.length === 0,
      errors,
    }
  } catch (error) {
    console.error('Failed to validate password:', error)
    throw new Error('Failed to validate password')
  }
}

/**
 * Get security settings
 */
export async function getSecuritySettings(organizationId: string): Promise<{
  requireTwoFactor: boolean
  sessionTimeout: number
  passwordPolicy?: OrganizationSettings['passwordPolicy']
}> {
  try {
    const settings = await getOrganizationSettings(organizationId)
    if (!settings) {
      return {
        requireTwoFactor: DEFAULT_SETTINGS.requireTwoFactor,
        sessionTimeout: DEFAULT_SETTINGS.sessionTimeout,
        passwordPolicy: DEFAULT_SETTINGS.passwordPolicy,
      }
    }

    return {
      requireTwoFactor: settings.requireTwoFactor,
      sessionTimeout: settings.sessionTimeout,
      passwordPolicy: settings.passwordPolicy,
    }
  } catch (error) {
    console.error('Failed to get security settings:', error)
    throw new Error('Failed to get security settings')
  }
}
