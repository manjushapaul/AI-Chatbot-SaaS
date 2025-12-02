'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, X, Lock } from 'lucide-react';

interface TrialStatus {
  isTrialExpired: boolean;
  trialEndsAt: string | null;
  daysRemaining: number | null;
  status: string;
}

export function TrialExpirationBanner() {
  const router = useRouter();
  const [trialStatus, setTrialStatus] = useState<TrialStatus | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTrialStatus();
  }, []);

  const fetchTrialStatus = async () => {
    try {
      const res = await fetch('/api/billing/subscription');
      if (res.ok) {
        const data = await res.json();
        const subscription = data.data;
        
        // Calculate days remaining
        let daysRemaining = null;
        if (subscription.trialEndsAt) {
          const trialEnd = new Date(subscription.trialEndsAt);
          const now = new Date();
          const diff = trialEnd.getTime() - now.getTime();
          daysRemaining = Math.ceil(diff / (1000 * 60 * 60 * 24));
        }

        setTrialStatus({
          isTrialExpired: subscription.isTrialExpired || false,
          trialEndsAt: subscription.trialEndsAt,
          daysRemaining,
          status: subscription.status
        });
      }
    } catch (error) {
      console.error('Error fetching trial status:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || dismissed || !trialStatus) {
    return null;
  }

  // Show banner if trial expired or expiring soon (within 7 days)
  const shouldShow = trialStatus.isTrialExpired || 
    (trialStatus.daysRemaining !== null && trialStatus.daysRemaining <= 7 && trialStatus.status === 'TRIALING');

  if (!shouldShow) {
    return null;
  }

  const handleUpgrade = () => {
    router.push('/billing/expired');
  };

  return (
    <div className="bg-amber-50 border-b border-amber-200 px-6 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-3">
          {trialStatus.isTrialExpired ? (
            <Lock className="w-5 h-5 text-amber-600 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
          )}
          <div>
            <p className="text-sm font-medium text-amber-900">
              {trialStatus.isTrialExpired
                ? 'Your trial has ended. Upgrade now to keep your bots online.'
                : `Your trial ends in ${trialStatus.daysRemaining} day${trialStatus.daysRemaining !== 1 ? 's' : ''}. Upgrade to continue using all features.`}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={handleUpgrade}
            className="px-4 py-1.5 bg-amber-600 text-white text-sm font-medium rounded-lg hover:bg-amber-700 transition-colors"
          >
            {trialStatus.isTrialExpired ? 'Upgrade Now' : 'Upgrade'}
          </button>
          <button
            onClick={() => setDismissed(true)}
            className="text-amber-600 hover:text-amber-700 p-1"
            aria-label="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

