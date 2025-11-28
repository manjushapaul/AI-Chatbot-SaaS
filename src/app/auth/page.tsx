'use client';

import { useState } from 'react';
import { SignInForm } from '@/components/auth/SignInForm';
import { SignUpForm } from '@/components/auth/SignUpForm';
import { typography } from '@/lib/design-tokens';

export default function AuthPage() {
  const [isSignUp, setIsSignUp] = useState(false);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-white via-[#F7EAFB] to-[#FDEFF6]">
      <div className="w-full max-w-6xl mx-auto px-6 pt-16 pb-10">
        <div className="flex flex-col items-center justify-center">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className={typography.pageTitle}>AI Chatbot Platform</h1>
            <p className={`${typography.pageSubtitle} mt-2`}>
              {isSignUp ? 'Create your account' : 'Sign in to your account'}
            </p>
          </div>

          {/* Auth Card */}
          <div className="w-full max-w-md rounded-2xl bg-white/90 shadow-[0_24px_70px_rgba(15,23,42,0.12)] backdrop-blur border border-white/80 px-6 py-6 space-y-5">
            {isSignUp ? (
              <SignUpForm onSwitchToSignIn={() => setIsSignUp(false)} />
            ) : (
              <SignInForm onSwitchToSignUp={() => setIsSignUp(true)} />
            )}
          </div>

          {/* Footer Notice */}
          <div className="mt-6 text-center max-w-md mx-auto">
            <p className="text-[11px] text-gray-400">
              By using this platform, you agree to our Terms of Service and Privacy Policy.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 