/**
 * Multi-tenant RBAC and Permissions System
 *
 * Provides role-based access control and granular permissions
 * for multi-tenant applications
 */

/**
 * Available roles in the system
 */
export enum UserRole {
  // System roles
  SUPER_ADMIN = 'super_admin', // Can do everything
  ADMIN = 'admin', // Can manage organization
  MANAGER = 'manager', // Can manage users and projects
  ACCOUNTANT = 'accountant', // Can manage financial data
  SALES = 'sales', // Can manage clients and invoices
  USER = 'user', // Basic read access
  VIEWER = 'viewer', // Read-only access
}

/**
 * Permission definitions
 */
export enum Permission {
  // Organization
  ORG_CREATE = 'org:create',
  ORG_READ = 'org:read',
  ORG_UPDATE = 'org:update',
  ORG_DELETE = 'org:delete',

  // Users
  USER_CREATE = 'user:create',
  USER_READ = 'user:read',
  USER_UPDATE = 'user:update',
  USER_DELETE = 'user:delete',
  USER_MANAGE_ROLES = 'user:manage_roles',

  // Clients
  CLIENT_CREATE = 'client:create',
  CLIENT_READ = 'client:read',
  CLIENT_UPDATE = 'client:update',
  CLIENT_DELETE = 'client:delete',

  // Invoices
  INVOICE_CREATE = 'invoice:create',
  INVOICE_READ = 'invoice:read',
  INVOICE_UPDATE = 'invoice:update',
  INVOICE_DELETE = 'invoice:delete',
  INVOICE_DOWNLOAD = 'invoice:download',
  INVOICE_SEND = 'invoice:send',

  // Transactions
  TRANSACTION_CREATE = 'transaction:create',
  TRANSACTION_READ = 'transaction:read',
  TRANSACTION_UPDATE = 'transaction:update',
  TRANSACTION_DELETE = 'transaction:delete',

  // Reports
  REPORT_READ = 'report:read',
  REPORT_EXPORT = 'report:export',

  // Settings
  SETTINGS_READ = 'settings:read',
  SETTINGS_UPDATE = 'settings:update',

  // Audit
  AUDIT_READ = 'audit:read',
}

/**
 * Role-to-permissions mapping
 */
export const RolePermissions: Record<UserRole, Permission[]> = {
  [UserRole.SUPER_ADMIN]: [
    // All permissions
    ...Object.values(Permission),
  ],

  [UserRole.ADMIN]: [
    // Organization
    Permission.ORG_READ,
    Permission.ORG_UPDATE,

    // Users
    Permission.USER_CREATE,
    Permission.USER_READ,
    Permission.USER_UPDATE,
    Permission.USER_DELETE,
    Permission.USER_MANAGE_ROLES,

    // All data access
    Permission.CLIENT_CREATE,
    Permission.CLIENT_READ,
    Permission.CLIENT_UPDATE,
    Permission.CLIENT_DELETE,
    Permission.INVOICE_CREATE,
    Permission.INVOICE_READ,
    Permission.INVOICE_UPDATE,
    Permission.INVOICE_DELETE,
    Permission.INVOICE_DOWNLOAD,
    Permission.INVOICE_SEND,
    Permission.TRANSACTION_CREATE,
    Permission.TRANSACTION_READ,
    Permission.TRANSACTION_UPDATE,
    Permission.TRANSACTION_DELETE,
    Permission.REPORT_READ,
    Permission.REPORT_EXPORT,
    Permission.SETTINGS_READ,
    Permission.SETTINGS_UPDATE,
    Permission.AUDIT_READ,
  ],

  [UserRole.MANAGER]: [
    // Organization
    Permission.ORG_READ,

    // Users (limited)
    Permission.USER_READ,
    Permission.USER_CREATE,
    Permission.USER_UPDATE,

    // Data access
    Permission.CLIENT_READ,
    Permission.CLIENT_CREATE,
    Permission.CLIENT_UPDATE,
    Permission.INVOICE_READ,
    Permission.INVOICE_CREATE,
    Permission.INVOICE_UPDATE,
    Permission.TRANSACTION_READ,
    Permission.REPORT_READ,
    Permission.REPORT_EXPORT,
  ],

  [UserRole.ACCOUNTANT]: [
    // Financial data
    Permission.INVOICE_READ,
    Permission.INVOICE_UPDATE,
    Permission.INVOICE_DOWNLOAD,
    Permission.TRANSACTION_READ,
    Permission.TRANSACTION_CREATE,
    Permission.TRANSACTION_UPDATE,
    Permission.REPORT_READ,
    Permission.REPORT_EXPORT,
    Permission.CLIENT_READ,
  ],

  [UserRole.SALES]: [
    // Sales operations
    Permission.CLIENT_READ,
    Permission.CLIENT_CREATE,
    Permission.CLIENT_UPDATE,
    Permission.INVOICE_READ,
    Permission.INVOICE_CREATE,
    Permission.INVOICE_UPDATE,
    Permission.INVOICE_SEND,
    Permission.INVOICE_DOWNLOAD,
  ],

  [UserRole.USER]: [
    // Basic read access
    Permission.CLIENT_READ,
    Permission.INVOICE_READ,
    Permission.REPORT_READ,
  ],

  [UserRole.VIEWER]: [
    // Read-only access
    Permission.CLIENT_READ,
    Permission.INVOICE_READ,
    Permission.REPORT_READ,
  ],
}

/**
 * Check if a user has a specific permission
 */
export function hasPermission(
  userRole: UserRole,
  permission: Permission
): boolean {
  const permissions = RolePermissions[userRole]
  return permissions.includes(permission)
}

/**
 * Check if a user has any of the specified permissions
 */
export function hasAnyPermission(
  userRole: UserRole,
  permissions: Permission[]
): boolean {
  return permissions.some((permission) => hasPermission(userRole, permission))
}

/**
 * Check if a user has all of the specified permissions
 */
export function hasAllPermissions(
  userRole: UserRole,
  permissions: Permission[]
): boolean {
  return permissions.every((permission) => hasPermission(userRole, permission))
}

/**
 * Get all permissions for a role
 */
export function getRolePermissions(role: UserRole): Permission[] {
  return RolePermissions[role]
}

/**
 * Get role label for display
 */
export function getRoleLabel(role: UserRole): string {
  const labels: Record<UserRole, string> = {
    [UserRole.SUPER_ADMIN]: 'Super Administrador',
    [UserRole.ADMIN]: 'Administrador',
    [UserRole.MANAGER]: 'Gerente',
    [UserRole.ACCOUNTANT]: 'Contador',
    [UserRole.SALES]: 'Vendedor',
    [UserRole.USER]: 'Usuário',
    [UserRole.VIEWER]: 'Visualizador',
  }
  return labels[role]
}

/**
 * Get role description
 */
export function getRoleDescription(role: UserRole): string {
  const descriptions: Record<UserRole, string> = {
    [UserRole.SUPER_ADMIN]:
      'Acesso total a todas as funcionalidades do sistema',
    [UserRole.ADMIN]: 'Pode gerenciar usuários, organização e todos os dados',
    [UserRole.MANAGER]: 'Pode gerenciar usuários e dados operacionais',
    [UserRole.ACCOUNTANT]: 'Acesso a dados financeiros e relatórios contábeis',
    [UserRole.SALES]: 'Pode gerenciar clientes e gerar invoices',
    [UserRole.USER]: 'Acesso básico de leitura aos dados',
    [UserRole.VIEWER]: 'Acesso apenas para visualização de dados',
  }
  return descriptions[role]
}

/**
 * Available roles ordered by hierarchy
 */
export const RoleHierarchy = [
  UserRole.SUPER_ADMIN,
  UserRole.ADMIN,
  UserRole.MANAGER,
  UserRole.ACCOUNTANT,
  UserRole.SALES,
  UserRole.USER,
  UserRole.VIEWER,
]

/**
 * Check if a role has higher hierarchy than another
 */
export function hasHigherRole(role1: UserRole, role2: UserRole): boolean {
  return RoleHierarchy.indexOf(role1) < RoleHierarchy.indexOf(role2)
}
