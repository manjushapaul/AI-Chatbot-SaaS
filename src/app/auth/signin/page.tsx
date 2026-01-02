'use client';

import { signIn } from 'next-auth/react';
import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { SignInForm } from '@/components/auth/SignInForm';
import { typography } from '@/lib/design-tokens';
import { Loader2 } from 'lucide-react';

// Force dynamic rendering for this page
export const dynamic = 'force-dynamic';

function SignInContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const callbackUrl = searchParams.get('callbackUrl') || searchParams.get('redirect') || '/dashboard';

  useEffect(() => {
    const errorParam = searchParams.get('error');
    if (errorParam) {
      setError(getErrorMessage(errorParam));
    }
  }, [searchParams]);

  const getErrorMessage = (error: string): string => {
    switch (error) {
      case 'CredentialsSignin':
        return 'Invalid email or password';
      case 'OAuthSignin':
        return 'Error occurred during OAuth sign-in';
      case 'OAuthCallback':
        return 'Error occurred during OAuth callback';
      case 'OAuthCreateAccount':
        return 'Could not create OAuth account';
      case 'EmailCreateAccount':
        return 'Could not create email account';
      case 'Callback':
        return 'Error in callback';
      case 'OAuthAccountNotLinked':
        return 'Account already exists with different provider';
      case 'EmailSignin':
        return 'Check your email for the sign-in link';
      case 'CredentialsSignin':
        return 'Sign in failed. Check your credentials.';
      case 'SessionRequired':
        return 'Please sign in to access this page';
      default:
        return 'An error occurred during sign-in';
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await signIn('google', { callbackUrl, redirect: true });
    } catch (_err) {
      setError('Failed to sign in with Google');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-[#fff7eb] via-[#ffe9d2] to-[#fff7eb]">
      <div className="w-full max-w-md mx-auto px-6 pt-16 pb-10">
        <div className="flex flex-col items-center justify-center">
          {/* Logo */}
          <Link href="/" className="mb-8 flex items-center space-x-3 hover:opacity-80 transition-opacity">
            <div className="w-10 h-10 bg-white/20 backdrop-blur-md border border-white/30 rounded-lg flex items-center justify-center shadow-md">
              <span className="text-gray-900 font-bold text-base">AI</span>
            </div>
            <h1 className="text-xl font-semibold text-gray-900">ChatBot SaaS</h1>
          </Link>

          {/* Header */}
          <div className="text-center mb-8">
            <h1 className={typography.pageTitle}>Sign In</h1>
            <p className={`${typography.pageSubtitle} mt-2`}>
              Sign in to your account to continue
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="w-full mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* Auth Card */}
          <div className="w-full rounded-2xl bg-white/90 shadow-[0_24px_70px_rgba(15,23,42,0.12)] backdrop-blur border border-white/80 px-6 py-6 space-y-5">
            {/* Email/Password Sign In */}
            <SignInForm onSwitchToSignUp={() => router.push('/auth/signup')} />
          </div>

          {/* Footer Notice */}
          <div className="mt-6 text-center">
            <p className="text-[11px] text-gray-400">
              By signing in, you agree to our Terms of Service and Privacy Policy.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-gray-600" />
      </div>
    }>
      <SignInContent />
    </Suspense>
  );
}

