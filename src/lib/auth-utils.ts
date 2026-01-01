import { getServerSession } from 'next-auth';
import { authOptions } from './auth';
import { prisma } from './db';

export type Permission = 
  | 'bot:create' 
  | 'bot:read' 
  | 'bot:update' 
  | 'bot:delete'
  | 'knowledge:create' 
  | 'knowledge:read' 
  | 'knowledge:update' 
  | 'knowledge:delete'
  | 'user:manage' 
  | 'analytics:view' 
  | 'widget:manage'
  | 'api:manage';

export const ROLE_PERMISSIONS: Record<string, Permission[]> = {
  SUPER_ADMIN: [
    'bot:create', 'bot:read', 'bot:update', 'bot:delete',
    'knowledge:create', 'knowledge:read', 'knowledge:update', 'knowledge:delete',
    'user:manage', 'analytics:view', 'widget:manage', 'api:manage'
  ],
  TENANT_ADMIN: [
    'bot:create', 'bot:read', 'bot:update', 'bot:delete',
    'knowledge:create', 'knowledge:read', 'knowledge:update', 'knowledge:delete',
    'user:manage', 'analytics:view', 'widget:manage', 'api:manage'
  ],
  BOT_OPERATOR: [
    'bot:read', 'bot:update',
    'knowledge:read', 'knowledge:update',
    'analytics:view'
  ],
  USER: [
    'bot:read',
    'knowledge:read',
    'analytics:view'
  ]
};

export async function getCurrentUser() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;
  
  return await prisma.users.findUnique({
    where: { id: session.user.id },
    include: { tenant: true }
  });
}

export async function getCurrentTenant() {
  const user = await getCurrentUser();
  return user?.tenant || null;
}

export function hasPermission(userRole: string, permission: Permission): boolean {
  const permissions = ROLE_PERMISSIONS[userRole] || [];
  return permissions.includes(permission);
}

export function hasAnyPermission(userRole: string, permissions: Permission[]): boolean {
  return permissions.some(permission => hasPermission(userRole, permission));
}

export function hasAllPermissions(userRole: string, permissions: Permission[]): boolean {
  return permissions.every(permission => hasPermission(userRole, permission));
}

export function isAdmin(userRole: string): boolean {
  return userRole === 'SUPER_ADMIN' || userRole === 'TENANT_ADMIN';
}

export function isSuperAdmin(userRole: string): boolean {
  return userRole === 'SUPER_ADMIN';
}

export function canManageUsers(userRole: string): boolean {
  return hasPermission(userRole, 'user:manage');
}

export function canManageBots(userRole: string): boolean {
  return hasPermission(userRole, 'bot:create') || 
         hasPermission(userRole, 'bot:update') || 
         hasPermission(userRole, 'bot:delete');
}

export function canManageKnowledge(userRole: string): boolean {
  return hasPermission(userRole, 'knowledge:create') || 
         hasPermission(userRole, 'knowledge:update') || 
         hasPermission(userRole, 'knowledge:delete');
}

export async function validateUserAccess(userId: string, tenantId: string): Promise<boolean> {
  const user = await prisma.users.findUnique({
    where: { id: userId },
    select: { tenantId: true, status: true }
  });
  
  return user?.tenantId === tenantId && user?.status === 'ACTIVE';
}

export async function validateResourceAccess(
  resourceTenantId: string, 
  userTenantId: string
): Promise<boolean> {
  return resourceTenantId === userTenantId;
}

export function getAuthRedirectUrl(role: string, tenantSubdomain: string): string {
  if (isSuperAdmin(role)) {
    return '/dashboard';
  }
  
  return `/${tenantSubdomain}/dashboard`;
}

export function sanitizeAuthError(error: unknown): string {
  if (typeof error === 'string') return error;
  
  if (error?.message) {
    // Don't expose internal errors to users
    if (error.message.includes('password') || error.message.includes('credentials')) {
      return 'Invalid credentials';
    }
    if (error.message.includes('tenant')) {
      return 'Tenant not found or access denied';
    }
    return 'Authentication failed';
  }
  
  return 'An unexpected error occurred';
} 