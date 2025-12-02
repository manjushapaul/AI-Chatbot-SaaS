'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Check } from 'lucide-react';
import { AppPage } from '@/components/dashboard/AppPage';
import { SectionCard } from '@/components/dashboard/SectionCard';
import { typography, spacing, cardBase, cardPadding } from '@/lib/design-tokens';
import { useTheme } from '@/contexts/ThemeContext';

interface Plan {
  id: string;
  name: string;
  price: number;
  interval: string;
  features: string[];
  limits: {
    bots: number;
    knowledgeBases: number;
    documents: number;
    conversations: number;
    users: number;
    apiCalls: number;
  };
}

interface UsageMetrics {
  bots: {
    allowed: boolean;
    currentUsage: number;
    limit: number;
    remaining: number;
  };
  knowledgeBases: {
    allowed: boolean;
    currentUsage: number;
    limit: number;
    remaining: number;
  };
  documents: {
    allowed: boolean;
    currentUsage: number;
    limit: number;
    remaining: number;
  };
  conversations: {
    allowed: boolean;
    currentUsage: number;
    limit: number;
    remaining: number;
  };
  users: {
    allowed: boolean;
    currentUsage: number;
    limit: number;
    remaining: number;
  };
  apiCalls: {
    allowed: boolean;
    currentUsage: number;
    limit: number;
    remaining: number;
  };
  storage: {
    allowed: boolean;
    currentUsage: number;
    limit: number;
    remaining: number;
  };
}

interface SubscriptionStatus {
  isActive: boolean;
  currentPlan: string;
  status: string;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  nextBillingDate: Date;
}

export default function BillingPage() {
  const { theme } = useTheme();
  const { data: session, status } = useSession();
  const router = useRouter();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [usage, setUsage] = useState<UsageMetrics | null>(null);
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  useEffect(() => {
    if (status === 'loading') return;
    
    if (status === 'unauthenticated') {
      router.push('/auth');
      return;
    }

    fetchPlans();
    fetchUsage();
    fetchSubscriptionStatus();
  }, [status, router]);

  const fetchPlans = async () => {
    try {
      const response = await fetch('/api/billing/plans');
      if (response.ok) {
        const data = await response.json();
        setPlans(data.data);
      }
    } catch (error) {
      console.error('Error fetching plans:', error);
    }
  };

  const fetchUsage = async () => {
    try {
      const response = await fetch('/api/billing/usage');
      if (response.ok) {
        const data = await response.json();
        setUsage(data.data.usage);
      }
    } catch (error) {
      console.error('Error fetching usage:', error);
    }
  };

  const fetchSubscriptionStatus = async () => {
    try {
      const response = await fetch('/api/billing/subscription');
      if (response.ok) {
        const data = await response.json();
        setSubscriptionStatus(data.data);
        setLoading(false);
      }
    } catch (error) {
      console.error('Error fetching subscription status:', error);
      setLoading(false);
    }
  };

  const handleUpgrade = async (planId: string) => {
    if (planId === subscriptionStatus?.currentPlan) return;

    setUpgrading(true);
    try {
      const response = await fetch('/api/billing/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          planId,
          successUrl: typeof window !== 'undefined' ? `${window.location.origin}/dashboard/billing?success=true` : '',
          cancelUrl: typeof window !== 'undefined' ? `${window.location.origin}/dashboard/billing?canceled=true` : '',
          reason: 'Plan upgrade'
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.data.url) {
          window.location.href = data.data.url;
        } else {
          await fetchSubscriptionStatus();
          await fetchUsage();
        }
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error('Error upgrading plan:', error);
      alert('Failed to upgrade plan. Please try again.');
    } finally {
      setUpgrading(false);
    }
  };

  const handleCancelSubscription = async () => {
    try {
      const response = await fetch('/api/billing/subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'cancel',
          reason: cancelReason
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          alert('Subscription cancelled successfully. You will continue to have access until the end of your billing period.');
          setShowCancelModal(false);
          setCancelReason('');
          await fetchSubscriptionStatus();
        } else {
          alert('Failed to cancel subscription. Please try again.');
        }
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      alert('Failed to cancel subscription. Please try again.');
    }
  };

  const handleReactivateSubscription = async () => {
    try {
      const response = await fetch('/api/billing/subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'reactivate'
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          alert('Subscription reactivated successfully!');
          await fetchSubscriptionStatus();
        } else {
          alert('Failed to reactivate subscription. Please try again.');
        }
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error('Error reactivating subscription:', error);
      alert('Failed to reactivate subscription. Please try again.');
    }
  };

  const formatLimit = (limit: number) => {
    if (limit === -1) return 'Unlimited';
    return limit.toLocaleString();
  };

  const formatUsage = (usage: number) => {
    return usage.toLocaleString();
  };

  const getUsagePercentage = (current: number, limit: number) => {
    if (limit === -1) return 0;
    return Math.min((current / limit) * 100, 100);
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <AppPage>
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-600 mx-auto mb-4"></div>
          <p className={typography.body}>Loading billing information...</p>
        </div>
      </AppPage>
    );
  }

  const currentPlanData = plans.find(p => p.id === subscriptionStatus?.currentPlan);

  return (
    <AppPage>
      <div className={spacing.pageBlock}>
        {/* Header */}
        <div>
          <h1 className={typography.pageTitle}>Billing & Subscription</h1>
          <p className={typography.pageSubtitle}>Manage your subscription plan and monitor usage</p>
        </div>

        {/* Current Plan & Status */}
        <SectionCard title="Current Plan & Status">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className={`text-lg font-semibold mb-1 ${
                theme === 'dark' ? 'text-accent-soft' : 'text-amber-500'
              }`}>
                {currentPlanData?.name || 'Free'}
              </div>
              <p className={`${typography.body} mb-2`}>
                {subscriptionStatus?.currentPlan === 'FREE' ? 'No cost' : `$${currentPlanData?.price}/month`}
              </p>
              <div>
                {subscriptionStatus?.isActive ? (
                  <span className="inline-flex items-center rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-600">
                    Active
                  </span>
                ) : (
                  <span className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">
                    {subscriptionStatus?.status || 'Inactive'}
                  </span>
                )}
              </div>
            </div>
            <div className="text-right">
              {subscriptionStatus?.cancelAtPeriodEnd && (
                <div className="mb-2">
                  <span className="inline-flex items-center rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-600">
                    Cancelling at period end
                  </span>
                </div>
              )}
              <p className={typography.meta}>
                Next billing: {subscriptionStatus ? formatDate(subscriptionStatus.nextBillingDate) : 'N/A'}
              </p>
              {subscriptionStatus?.cancelAtPeriodEnd && (
                <p className={typography.meta}>
                  Access until: {subscriptionStatus ? formatDate(subscriptionStatus.currentPeriodEnd) : 'N/A'}
                </p>
              )}
            </div>
          </div>
          
          {/* Subscription Actions */}
          {subscriptionStatus && (
            <div className="mt-4 flex flex-wrap gap-3">
              {subscriptionStatus.cancelAtPeriodEnd ? (
                <button
                  onClick={handleReactivateSubscription}
                  className="rounded-full bg-emerald-600 text-white px-4 py-2 text-sm font-medium hover:bg-emerald-700 transition-colors"
                >
                  Reactivate Subscription
                </button>
              ) : subscriptionStatus.currentPlan !== 'FREE' ? (
                <button
                  onClick={() => setShowCancelModal(true)}
                  className="rounded-full bg-red-600 text-white px-4 py-2 text-sm font-medium hover:bg-red-700 transition-colors"
                >
                  Cancel Subscription
                </button>
              ) : null}
            </div>
          )}
        </SectionCard>

        {/* Usage This Month */}
        {usage && (
          <SectionCard title="Usage This Month">
            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
              {Object.entries(usage).map(([key, metric]) => {
                const percentage = getUsagePercentage(metric.currentUsage, metric.limit);
                return (
                  <div key={key} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className={typography.meta}>
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </span>
                      <span className={`${typography.body} font-medium`}>
                        {formatUsage(metric.currentUsage)} / {formatLimit(metric.limit)}
                      </span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full overflow-hidden h-2">
                      <div
                        className={`h-2 rounded-full transition-all ${
                          percentage > 80
                            ? 'bg-red-500'
                            : percentage > 60
                            ? 'bg-amber-500'
                            : 'bg-emerald-500'
                        }`}
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </SectionCard>
        )}

        {/* Available Plans */}
        <SectionCard title="Available Plans">
          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            {plans.map((plan) => {
              const isCurrentPlan = plan.id === subscriptionStatus?.currentPlan;
              return (
                <div
                  key={plan.id}
                  className={`flex flex-col rounded-2xl border px-5 py-5 shadow-[0_14px_35px_rgba(15,23,42,0.06)] ${
                    isCurrentPlan
                      ? `border-accent-soft ${theme === 'dark' ? 'bg-[#F5E6D3]' : 'bg-amber-50'}`
                      : 'border-gray-100 bg-white/90'
                  }`}
                >
                  <div className="text-center mb-4">
                    <h3 className={typography.sectionTitle}>{plan.name}</h3>
                    <div className="mt-2">
                      <span className="text-2xl font-semibold text-gray-900">
                        ${plan.price}
                      </span>
                      <span className={typography.meta}>/month</span>
                    </div>
                  </div>
                  
                  <ul className="space-y-1 flex-1">
                    {plan.features.slice(0, 4).map((feature, index) => (
                      <li key={index} className={`flex items-center ${typography.meta} text-gray-600`}>
                        <Check className="w-4 h-4 text-emerald-500 mr-2 flex-shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <button
                    onClick={() => handleUpgrade(plan.id)}
                    disabled={isCurrentPlan || upgrading}
                    className={`mt-4 w-full rounded-full py-2 text-sm font-medium transition-colors ${
                      isCurrentPlan
                        ? 'bg-gray-100 text-gray-700 cursor-not-allowed'
                        : upgrading
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-accent-soft text-white hover:bg-accent-soft/80'
                    }`}
                  >
                    {isCurrentPlan
                      ? 'Current Plan'
                      : upgrading
                      ? 'Processing...'
                      : plan.price === 0
                      ? 'Downgrade'
                      : 'Upgrade'}
                  </button>
                </div>
              );
            })}
          </div>
        </SectionCard>

        {/* Cancel Subscription Modal */}
        {showCancelModal && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white/80 backdrop-blur-xl rounded-lg max-w-md w-full border border-white/60 shadow-2xl">
              <div className="p-6 border-b border-gray-200">
                <h3 className={`${typography.sectionTitle} text-base`}>Cancel Subscription</h3>
              </div>
              <div className="p-6 space-y-4">
                <p className={typography.body}>
                  Are you sure you want to cancel your subscription? You&apos;ll continue to have access until the end of your current billing period.
                </p>
                <textarea
                  placeholder="Reason for cancellation (optional)"
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-accent-soft/40 focus:border-accent-soft bg-white/80 text-gray-900 placeholder:text-gray-400 text-sm"
                  rows={3}
                />
              </div>
              <div className="p-6 border-t border-gray-200 flex gap-3">
                <button
                  onClick={() => setShowCancelModal(false)}
                  className="flex-1 rounded-full bg-white text-gray-700 border border-gray-200 px-4 py-2 text-sm font-medium hover:bg-gray-50 transition-colors"
                >
                  Keep Subscription
                </button>
                <button
                  onClick={handleCancelSubscription}
                  className="flex-1 rounded-full bg-red-600 text-white px-4 py-2 text-sm font-medium hover:bg-red-700 transition-colors"
                >
                  Cancel Subscription
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppPage>
  );
}
