'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, Mail, Lock, Building } from 'lucide-react';
import { typography } from '@/lib/design-tokens';

interface SignInFormProps {
  tenant?: string;
  onSwitchToSignUp?: () => void;
}

export function SignInForm({ tenant, onSwitchToSignUp }: SignInFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [tenantSubdomain, setTenantSubdomain] = useState(tenant || '');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const result = await signIn('credentials', {
        email,
        password,
        tenant: tenantSubdomain,
        redirect: false,
        callbackUrl,
      });

      if (result?.error) {
        setError('Invalid credentials or tenant not found');
      } else {
        // Redirect to the originally requested URL or dashboard
        router.push(callbackUrl);
        router.refresh();
      }
    } catch (error) {
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full space-y-5">
      {/* Card Header */}
      <div className="space-y-2">
        <h2 className="text-lg font-semibold text-gray-900">Sign In</h2>
        <p className={typography.helperTextLarge}>
          Welcome back! Please sign in to your account.
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {!tenant && (
          <div className="space-y-2">
            <label htmlFor="tenant" className={typography.labelLarge}>
              Tenant Subdomain
            </label>
            <div className="relative">
              <Building className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 z-10 pointer-events-none" />
              <input
                id="tenant"
                type="text"
                placeholder="yourcompany"
                value={tenantSubdomain}
                onChange={(e) => setTenantSubdomain(e.target.value)}
                required
                className="w-full rounded-xl border border-gray-200 bg-white/80 px-4 py-2.5 pl-10 text-sm text-gray-800 placeholder:text-gray-400 focus:border-accent-soft focus:ring-2 focus:ring-accent-soft/40 focus:outline-none"
              />
            </div>
            <p className={typography.helperText}>
              Enter your company&apos;s subdomain (e.g., yourcompany.yourdomain.com)
            </p>
          </div>
        )}

        <div className="space-y-2">
          <label htmlFor="email" className={typography.labelLarge}>
            Email
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 z-10 pointer-events-none" />
            <input
              id="email"
              type="email"
              placeholder="you@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-xl border border-gray-200 bg-white/80 px-4 py-2.5 pl-10 text-sm text-gray-800 placeholder:text-gray-400 focus:border-accent-soft focus:ring-2 focus:ring-accent-soft/40 focus:outline-none"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="password" className={typography.labelLarge}>
            Password
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 z-10 pointer-events-none" />
            <input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full rounded-xl border border-gray-200 bg-white/80 px-4 py-2.5 pl-10 text-sm text-gray-800 placeholder:text-gray-400 focus:border-accent-soft focus:ring-2 focus:ring-accent-soft/40 focus:outline-none"
            />
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full rounded-full bg-accent-soft text-white text-sm font-medium py-2.5 shadow hover:bg-accent-soft/80 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors mt-2 flex items-center justify-center"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Signing in...
            </>
          ) : (
            'Sign In'
          )}
        </button>
      </form>

      {/* Secondary Text */}
      {onSwitchToSignUp && (
        <div className="text-center pt-2">
          <p className="text-xs text-gray-500">
            Don&apos;t have an account?{' '}
            <button
              onClick={onSwitchToSignUp}
              className="text-accent-soft font-medium hover:underline"
            >
              Sign up
            </button>
          </p>
        </div>
      )}
    </div>
  );
} 