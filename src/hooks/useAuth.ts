'use client';

import { useSession } from 'next-auth/react';
import { useMemo } from 'react';
import { 
  Permission, 
  hasPermission, 
  hasAnyPermission, 
  hasAllPermissions,
  isAdmin,
  isSuperAdmin,
  canManageUsers,
  canManageBots,
  canManageKnowledge
} from '@/lib/auth-utils';

export function useAuth() {
  const { data: session, status, update } = useSession();

  const user = useMemo(() => session?.user, [session]);
  const isAuthenticated = useMemo(() => !!user, [user]);
  const isLoading = useMemo(() => status === 'loading', [status]);

  const permissions = useMemo(() => {
    if (!user) return [];
    
    const rolePermissions: Permission[] = [];
    
    // Add permissions based on role
    if (user.role === 'SUPER_ADMIN' || user.role === 'TENANT_ADMIN') {
      rolePermissions.push(
        'bot:create', 'bot:read', 'bot:update', 'bot:delete',
        'knowledge:create', 'knowledge:read', 'knowledge:update', 'knowledge:delete',
        'user:manage', 'analytics:view', 'widget:manage', 'api:manage'
      );
    } else if (user.role === 'BOT_OPERATOR') {
      rolePermissions.push(
        'bot:read', 'bot:update',
        'knowledge:read', 'knowledge:update',
        'analytics:view'
      );
    } else if (user.role === 'USER') {
      rolePermissions.push(
        'bot:read',
        'knowledge:read',
        'analytics:view'
      );
    }
    
    return rolePermissions;
  }, [user]);

  const checkPermission = useMemo(() => {
    return (permission: Permission) => {
      if (!user) return false;
      return hasPermission(user.role, permission);
    };
  }, [user]);

  const checkAnyPermission = useMemo(() => {
    return (permissions: Permission[]) => {
      if (!user) return false;
      return hasAnyPermission(user.role, permissions);
    };
  }, [user]);

  const checkAllPermissions = useMemo(() => {
    return (permissions: Permission[]) => {
      if (!user) return false;
      return hasAllPermissions(user.role, permissions);
    };
  }, [user]);

  const isUserAdmin = useMemo(() => {
    if (!user) return false;
    return isAdmin(user.role);
  }, [user]);

  const isUserSuperAdmin = useMemo(() => {
    if (!user) return false;
    return isSuperAdmin(user.role);
  }, [user]);

  const canUserManageUsers = useMemo(() => {
    if (!user) return false;
    return canManageUsers(user.role);
  }, [user]);

  const canUserManageBots = useMemo(() => {
    if (!user) return false;
    return canManageBots(user.role);
  }, [user]);

  const canUserManageKnowledge = useMemo(() => {
    if (!user) return false;
    return canManageKnowledge(user.role);
  }, [user]);

  const tenant = useMemo(() => user?.tenant, [user]);

  return {
    // Session state
    user,
    isAuthenticated,
    isLoading,
    status,
    update,
    
    // User properties
    role: user?.role,
    tenantId: user?.tenantId,
    tenant,
    
    // Permissions
    permissions,
    checkPermission,
    checkAnyPermission,
    checkAllPermissions,
    
    // Role checks
    isAdmin: isUserAdmin,
    isSuperAdmin: isUserSuperAdmin,
    
    // Capability checks
    canManageUsers: canUserManageUsers,
    canManageBots: canUserManageBots,
    canManageKnowledge: canUserManageKnowledge,
    
    // Utility functions
    hasAccess: (requiredPermissions: Permission[]) => {
      if (!user) return false;
      return requiredPermissions.every(permission => hasPermission(user.role, permission));
    },
    
    hasAnyAccess: (permissions: Permission[]) => {
      if (!user) return false;
      return hasAnyPermission(user.role, permissions);
    }
  };
}

// Specialized hooks for common use cases
export function usePermissions() {
  const { permissions, checkPermission, checkAnyPermission, checkAllPermissions } = useAuth();
  return { permissions, checkPermission, checkAnyPermission, checkAllPermissions };
}

export function useRole() {
  const { role, isAdmin, isSuperAdmin } = useAuth();
  return { role, isAdmin, isSuperAdmin };
}

export function useTenant() {
  const { tenant, tenantId } = useAuth();
  return { tenant, tenantId };
} 