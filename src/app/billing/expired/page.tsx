'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Lock, Check, ArrowRight, X } from 'lucide-react';
import Link from 'next/link';

interface Plan {
  id: string;
  name: string;
  price: number;
  interval: string;
  features: string[];
  popular?: boolean;
}

export default function TrialExpiredPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [subscription, setSubscription] = useState<any>(null);

  useEffect(() => {
    if (session?.user?.tenantId) {
      fetchSubscription();
    }
  }, [session]);

  const fetchSubscription = async () => {
    try {
      const res = await fetch('/api/billing/subscription');
      if (res.ok) {
        const data = await res.json();
        setSubscription(data.data);
      }
    } catch (err) {
      console.error('Error fetching subscription:', err);
    }
  };

  const handleUpgrade = async (planId: string) => {
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/billing/upgrade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to upgrade');
      }

      // Redirect to Stripe checkout if URL provided
      if (data.data?.url) {
        window.location.href = data.data.url;
      } else {
        // If already paid, refresh and redirect to dashboard
        router.push('/dashboard');
        router.refresh();
      }
    } catch (err: any) {
      setError(err.message || 'Failed to upgrade. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDowngradeToFree = async () => {
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/billing/downgrade-to-free', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to downgrade');
      }

      // Refresh session and redirect to dashboard
      router.push('/dashboard');
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Failed to downgrade. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const plans: Plan[] = [
    {
      id: 'STARTER',
      name: 'Starter',
      price: 29,
      interval: 'month',
      features: [
        '5 Bots',
        '5 Knowledge Bases',
        '1,000 Documents',
        '10,000 Conversations/month',
        '10 Users',
        '100,000 API calls/month',
        'Priority support',
      ],
    },
    {
      id: 'PROFESSIONAL',
      name: 'Professional',
      price: 99,
      interval: 'month',
      popular: true,
      features: [
        '25 Bots',
        '25 Knowledge Bases',
        '10,000 Documents',
        '100,000 Conversations/month',
        '50 Users',
        '1,000,000 API calls/month',
        'Advanced analytics',
        'Custom branding',
        'Priority support',
      ],
    },
    {
      id: 'ENTERPRISE',
      name: 'Enterprise',
      price: 299,
      interval: 'month',
      features: [
        'Unlimited Bots',
        'Unlimited Knowledge Bases',
        'Unlimited Documents',
        'Unlimited Conversations',
        'Unlimited Users',
        'Unlimited API calls',
        'White-label solution',
        'Dedicated support',
        'Custom integrations',
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#fff7eb] via-[#ffe9d2] to-[#fff7eb] flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-amber-100 rounded-full mb-4">
            <Lock className="w-8 h-8 text-amber-600" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
            Your free trial has ended
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Upgrade to a paid plan to continue using all features, or switch to our free plan with limited access.
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* What You Keep / Lose */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white/90 backdrop-blur rounded-xl p-6 border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Check className="w-5 h-5 text-green-600 mr-2" />
              What you keep
            </h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>• Access to your dashboard</li>
              <li>• View existing bots and conversations</li>
              <li>• Export your data</li>
              <li>• 1 Bot, 1 Knowledge Base (free plan)</li>
            </ul>
          </div>
          <div className="bg-white/90 backdrop-blur rounded-xl p-6 border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <X className="w-5 h-5 text-red-600 mr-2" />
              What you lose
            </h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>• Creating new bots</li>
              <li>• Uploading new documents</li>
              <li>• Advanced analytics</li>
              <li>• Priority support</li>
            </ul>
          </div>
        </div>

        {/* Plan Selector */}
        <div className="bg-white/90 backdrop-blur rounded-2xl p-8 border border-gray-200 shadow-lg mb-6">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6 text-center">
            Choose your plan
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {plans.map((plan) => (
              <div
                key={plan.id}
                className={`relative rounded-xl border-2 p-6 ${
                  plan.popular
                    ? 'border-amber-500 bg-amber-50/50'
                    : 'border-gray-200 bg-white'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-amber-600 text-white text-xs font-semibold px-3 py-1 rounded-full">
                      Most Popular
                    </span>
                  </div>
                )}
                <div className="text-center mb-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {plan.name}
                  </h3>
                  <div className="mb-4">
                    <span className="text-3xl font-bold text-gray-900">
                      ${plan.price}
                    </span>
                    <span className="text-gray-600">/{plan.interval}</span>
                  </div>
                </div>
                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start text-sm text-gray-700">
                      <Check className="w-4 h-4 text-amber-600 mr-2 mt-0.5 flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => handleUpgrade(plan.id)}
                  disabled={loading}
                  className={`w-full py-3 px-4 rounded-lg font-semibold text-sm transition-colors ${
                    plan.popular
                      ? 'bg-amber-600 text-white hover:bg-amber-700'
                      : 'bg-gray-900 text-white hover:bg-gray-800'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {loading ? 'Processing...' : 'Upgrade to Pro'}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Free Plan Option */}
        <div className="bg-white/90 backdrop-blur rounded-xl p-6 border border-gray-200 text-center">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Continue with Free Plan
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            Switch to our free plan with limited features. You can upgrade anytime.
          </p>
          <button
            onClick={handleDowngradeToFree}
            disabled={loading}
            className="inline-flex items-center px-6 py-2.5 border-2 border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Continue with Free Plan
          </button>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            Need help?{' '}
            <Link href="/pricing" className="text-amber-600 hover:underline">
              View all plans
            </Link>
            {' or '}
            <Link href="/dashboard/settings" className="text-amber-600 hover:underline">
              Contact support
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}



