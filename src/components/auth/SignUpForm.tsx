'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Mail, Lock, Building, User } from 'lucide-react';
import { typography } from '@/lib/design-tokens';

interface SignUpFormProps {
  tenant?: string;
  onSwitchToSignIn?: () => void;
}

export function SignUpForm({ tenant, onSwitchToSignIn }: SignUpFormProps) {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    tenant: tenant || ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          name: formData.name,
          tenant: formData.tenant
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Signup failed');
      }

      setSuccess('Account and organization created successfully! You can now sign in.');
      setTimeout(() => {
        if (onSwitchToSignIn) {
          onSwitchToSignIn();
        }
      }, 2000);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full space-y-5">
      {/* Card Header */}
      <div className="space-y-2">
        <h2 className="text-lg font-semibold text-gray-900">Create Account</h2>
        <p className={typography.helperTextLarge}>
          Sign up for your AI chatbot platform account.
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {!tenant && (
          <div className="space-y-2">
            <label htmlFor="tenant" className={typography.labelLarge}>
              Organization Subdomain
            </label>
            <div className="relative">
              <Building className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 z-10 pointer-events-none" />
              <input
                id="tenant"
                name="tenant"
                type="text"
                placeholder="yourcompany"
                value={formData.tenant}
                onChange={handleChange}
                required
                className="w-full rounded-xl border border-gray-200 bg-white/80 px-4 py-2.5 pl-10 text-sm text-gray-800 placeholder:text-gray-400 focus:border-accent-soft focus:ring-2 focus:ring-accent-soft/40 focus:outline-none"
              />
            </div>
            <p className={typography.helperText}>
              Choose a unique subdomain for your organization (e.g., yourcompany)
            </p>
          </div>
        )}

        <div className="space-y-2">
          <label htmlFor="name" className={typography.labelLarge}>
            Full Name
          </label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 z-10 pointer-events-none" />
            <input
              id="name"
              name="name"
              type="text"
              placeholder="John Doe"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full rounded-xl border border-gray-200 bg-white/80 px-4 py-2.5 pl-10 text-sm text-gray-800 placeholder:text-gray-400 focus:border-accent-soft focus:ring-2 focus:ring-accent-soft/40 focus:outline-none"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="email" className={typography.labelLarge}>
            Email
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 z-10 pointer-events-none" />
            <input
              id="email"
              name="email"
              type="email"
              placeholder="you@company.com"
              value={formData.email}
              onChange={handleChange}
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
              name="password"
              type="password"
              placeholder="••••••••"
              value={formData.password}
              onChange={handleChange}
              required
              className="w-full rounded-xl border border-gray-200 bg-white/80 px-4 py-2.5 pl-10 text-sm text-gray-800 placeholder:text-gray-400 focus:border-accent-soft focus:ring-2 focus:ring-accent-soft/40 focus:outline-none"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="confirmPassword" className={typography.labelLarge}>
            Confirm Password
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 z-10 pointer-events-none" />
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              placeholder="••••••••"
              value={formData.confirmPassword}
              onChange={handleChange}
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

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
            {success}
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
              Creating account...
            </>
          ) : (
            'Create Account'
          )}
        </button>
      </form>

      {/* Secondary Text */}
      {onSwitchToSignIn && (
        <div className="text-center pt-2">
          <p className="text-xs text-gray-500">
            Already have an account?{' '}
            <button
              onClick={onSwitchToSignIn}
              className="text-accent-soft font-medium hover:underline"
            >
              Sign in
            </button>
          </p>
        </div>
      )}
    </div>
  );
} 