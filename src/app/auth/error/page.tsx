'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { AlertTriangle, ArrowLeft } from 'lucide-react';
import { typography } from '@/lib/design-tokens';

export default function AuthErrorPage() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');

  const getErrorMessage = (error: string | null): string => {
    if (!error) return 'An unknown error occurred';

    switch (error) {
      case 'Configuration':
        return 'There is a problem with the server configuration.';
      case 'AccessDenied':
        return 'You do not have permission to sign in.';
      case 'Verification':
        return 'The verification token has expired or has already been used.';
      case 'Default':
      default:
        return 'An error occurred during authentication.';
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center  bg-gradient-to-b from-[#fff7eb] via-[#ffe9d2] to-[#fff7eb]  px-4">
      <div className="w-full max-w-md">
        <div className="rounded-2xl bg-white/90 shadow-[0_24px_70px_rgba(15,23,42,0.12)] backdrop-blur border border-white/80 px-8 py-10 text-center">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
          </div>

          <h1 className={`${typography.pageTitle} mb-3`}>Authentication Error</h1>
          <p className={`${typography.body} text-gray-600 mb-8`}>
            {getErrorMessage(error)}
          </p>

          <div className="space-y-3">
            <Link
              href="/auth/signin"
              className="block w-full px-4 py-3 bg-accent-soft text-white rounded-xl font-medium hover:bg-accent-soft/90 transition-colors"
            >
              Try Again
            </Link>
            <Link
              href="/"
              className="flex items-center justify-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Go back home</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}



