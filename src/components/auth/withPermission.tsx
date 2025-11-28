'use client';

import { useSession } from 'next-auth/react';
import { Permission, hasPermission, hasAnyPermission, hasAllPermissions } from '@/lib/auth-utils';
import { Shield } from 'lucide-react';

interface WithPermissionProps {
  children: React.ReactNode;
  requiredPermissions?: Permission[];
  requireAnyPermission?: Permission[];
  requireAllPermissions?: Permission[];
  fallback?: React.ReactNode;
  showAccessDenied?: boolean;
}

export function withPermission<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  options: {
    requiredPermissions?: Permission[];
    requireAnyPermission?: Permission[];
    requireAllPermissions?: Permission[];
    fallback?: React.ReactNode;
    showAccessDenied?: boolean;
  } = {}
) {
  return function PermissionWrappedComponent(props: P) {
    const { data: session } = useSession();
    
    if (!session?.user) {
      return null;
    }

    const { 
      requiredPermissions = [], 
      requireAnyPermission = [], 
      requireAllPermissions = [],
      fallback,
      showAccessDenied = true
    } = options;

    // Check permission requirements
    let hasAccess = true;

    if (requiredPermissions.length > 0) {
      hasAccess = hasAccess && requiredPermissions.every(permission => 
        hasPermission(session.user.role, permission)
      );
    }

    if (requireAnyPermission.length > 0) {
      hasAccess = hasAccess && hasAnyPermission(session.user.role, requireAnyPermission);
    }

    if (requireAllPermissions.length > 0) {
      hasAccess = hasAccess && hasAllPermissions(session.user.role, requireAllPermissions);
    }

    if (!hasAccess) {
      if (fallback) {
        return <>{fallback}</>;
      }

      if (showAccessDenied) {
        return (
          <div className="flex items-center justify-center p-4 border border-red-200 rounded-md bg-red-50">
            <Shield className="h-5 w-5 text-accent-strong mr-2" />
            <span className="text-sm text-red-700">Access denied</span>
          </div>
        );
      }

      return null;
    }

    return <WrappedComponent {...props} />;
  };
}

// Usage examples:
// const ProtectedBotList = withPermission(BotList, { 
//   requiredPermissions: ['bot:read'] 
// });
// 
// const AdminOnlyComponent = withPermission(AdminPanel, { 
//   requireAnyPermission: ['user:manage', 'bot:delete'] 
// }); 