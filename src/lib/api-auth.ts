import { getServerSession } from 'next-auth';
import { authOptions } from './auth';
import { NextRequest, NextResponse } from 'next/server';

/**
 * Get the current authenticated session for API routes
 * Returns null if not authenticated
 */
export async function getApiSession() {
  return await getServerSession(authOptions);
}

/**
 * Protect an API route handler - returns session or redirects
 * Use this in API route handlers that require authentication
 */
export async function requireAuth(request?: NextRequest) {
  const session = await getApiSession();
  
  if (!session) {
    return {
      error: NextResponse.json(
        { error: 'Unauthorized', message: 'Authentication required' },
        { status: 401 }
      ),
      session: null,
    };
  }

  return { session, error: null };
}

/**
 * Check if user has required role
 */
export function hasRole(session: any, requiredRole: string): boolean {
  return session?.user?.role === requiredRole;
}

/**
 * Check if user has any of the required roles
 */
export function hasAnyRole(session: any, requiredRoles: string[]): boolean {
  return requiredRoles.includes(session?.user?.role);
}




