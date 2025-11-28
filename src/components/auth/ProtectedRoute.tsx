'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Loader2, Shield, AlertTriangle } from 'lucide-react';
import { Permission, hasPermission, hasAnyPermission, hasAllPermissions } from '@/lib/auth-utils';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: string;
  requiredPermissions?: Permission[];
  requireAnyPermission?: Permission[];
  requireAllPermissions?: Permission[];
  fallback?: React.ReactNode;
  redirectTo?: string;
}

export function ProtectedRoute({ 
  children, 
  requiredRole, 
  requiredPermissions = [],
  requireAnyPermission = [],
  requireAllPermissions = [],
  fallback,
  redirectTo
}: ProtectedRouteProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [accessDenied, setAccessDenied] = useState(false);

  useEffect(() => {
    if (status === 'loading') return;

    if (!session) {
      router.push('/auth');
      return;
    }

    // Check role requirement
    if (requiredRole && session.user.role !== requiredRole) {
      setAccessDenied(true);
      if (redirectTo) {
        router.push(redirectTo);
      }
      return;
    }

    // Check permission requirements
    if (requiredPermissions.length > 0 && 
        !requiredPermissions.every(permission => hasPermission(session.user.role, permission))) {
      setAccessDenied(true);
      if (redirectTo) {
        router.push(redirectTo);
      }
      return;
    }

    // Check "any permission" requirement
    if (requireAnyPermission.length > 0 && 
        !hasAnyPermission(session.user.role, requireAnyPermission)) {
      setAccessDenied(true);
      if (redirectTo) {
        router.push(redirectTo);
      }
      return;
    }

    // Check "all permissions" requirement
    if (requireAllPermissions.length > 0 && 
        !hasAllPermissions(session.user.role, requireAllPermissions)) {
      setAccessDenied(true);
      if (redirectTo) {
        router.push(redirectTo);
      }
      return;
    }

    setAccessDenied(false);
  }, [session, status, router, requiredRole, requiredPermissions, requireAnyPermission, requireAllPermissions, redirectTo]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  if (accessDenied) {
    if (fallback) {
      return <>{fallback}</>;
    }
    
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <Shield className="h-16 w-16 text-accent-strong mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600 mb-4">
            You don&apos;t have permission to access this resource.
          </p>
          {requiredRole && (
            <p className="text-sm text-gray-500 mb-4">
              Required role: <span className="font-medium">{requiredRole}</span>
            </p>
          )}
          {requiredPermissions.length > 0 && (
            <div className="text-sm text-gray-500 mb-4">
              <p className="font-medium mb-1">Required permissions:</p>
              <ul className="list-disc list-inside space-y-1">
                {requiredPermissions.map(permission => (
                  <li key={permission}>{permission}</li>
                ))}
              </ul>
            </div>
          )}
          <button
            onClick={() => router.push('/dashboard')}
            className="px-4 py-2 bg-gradient-to-r from-[#FFFCEB] via-[#F8EAFE] to-[#FFD6EF] text-gray-900 rounded-md hover:opacity-90 transition-colors"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
} 