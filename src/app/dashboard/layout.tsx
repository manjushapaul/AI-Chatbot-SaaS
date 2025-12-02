'use client';

import { ReactNode, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { Header } from '@/components/dashboard/Header';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { TrialExpirationBanner } from '@/components/dashboard/TrialExpirationBanner';
import { TrialExpiredScreen } from '@/components/dashboard/TrialExpiredScreen';

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [isTrialExpired, setIsTrialExpired] = useState(false);
  const [isCheckingTrial, setIsCheckingTrial] = useState(true);

  useEffect(() => {
    if (status === 'loading' || !session?.user?.tenantId) return;

    // Client-side trial expiration check (backup to middleware)
    const checkTrialExpiration = async () => {
      try {
        const res = await fetch('/api/billing/subscription');
        if (!res.ok) {
          const errorText = await res.text();
          console.error('[Client] Failed to fetch subscription:', res.status, errorText);
          setIsCheckingTrial(false);
          return;
        }
        
        const data = await res.json();
        const subscription = data.data;
        
        console.log('[Client] Subscription check:', {
          isTrialExpired: subscription?.isTrialExpired,
          status: subscription?.status,
          trialEndsAt: subscription?.trialEndsAt
        });
        
        // Check if trial is expired
        const now = new Date();
        const trialEnd = subscription?.trialEndsAt ? new Date(subscription.trialEndsAt) : null;
        const isExpired = trialEnd && trialEnd <= now;
        
        if ((subscription?.isTrialExpired || isExpired) && subscription?.status === 'TRIALING') {
          console.log('[Client] Trial expired, showing paywall');
          setIsTrialExpired(true);
        }
        
        setIsCheckingTrial(false);
      } catch (error) {
        console.error('[Client] Error checking trial expiration:', error);
        setIsCheckingTrial(false);
      }
    };

    checkTrialExpiration();
  }, [session, status, router]);

  // Show trial expired screen if trial has ended
  if (isTrialExpired) {
    return (
      <ProtectedRoute>
        <TrialExpiredScreen />
      </ProtectedRoute>
    );
  }

  // Show loading state while checking trial
  if (isCheckingTrial) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-amber-500 border-r-transparent"></div>
            <p className="mt-4 text-slate-600">Loading...</p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen">
        <Header />
        <TrialExpirationBanner />
        <div className="flex">
          <Sidebar />
          <main className="flex-1 p-6">
            {children}
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
} 