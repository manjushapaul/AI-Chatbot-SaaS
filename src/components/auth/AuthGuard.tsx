'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Loader2 } from 'lucide-react';

interface AuthGuardProps {
  children: React.ReactNode;
}

/**
 * Client-side authentication guard component
 * Redirects unauthenticated users to sign-in page with redirect parameter
 * Shows loading state while checking authentication
 */
export function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === 'loading') return;

    if (!session) {
      // Redirect to sign-in with current path as callbackUrl
      const signInUrl = `/auth/signin?callbackUrl=${encodeURIComponent(pathname)}`;
      router.replace(signInUrl);
    }
  }, [session, status, pathname, router]);

  // Show loading state while checking authentication
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-amber-600" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render children if not authenticated (will redirect)
  if (!session) {
    return null;
  }

  return <>{children}</>;
}






