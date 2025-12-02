'use client';

import { SignUpForm } from '@/components/auth/SignUpForm';
import { typography } from '@/lib/design-tokens';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function SignUpPage() {
  const router = useRouter();
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
            <h1 className={typography.pageTitle}>Create Account</h1>
            <p className={`${typography.pageSubtitle} mt-2`}>
              Sign up to get started
            </p>
          </div>

          {/* Auth Card */}
          <div className="w-full rounded-2xl bg-white/90 shadow-[0_24px_70px_rgba(15,23,42,0.12)] backdrop-blur border border-white/80 px-6 py-6 space-y-5">
            <SignUpForm onSwitchToSignIn={() => router.push('/auth/signin')} />
          </div>

          {/* Footer Notice */}
          <div className="mt-6 text-center">
            <p className="text-[11px] text-gray-400">
              By creating an account, you agree to our Terms of Service and Privacy Policy.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}



