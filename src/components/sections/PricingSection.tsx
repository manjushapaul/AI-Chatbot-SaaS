'use client';

import { PricingCard } from './PricingCard';

interface PricingSectionProps {
  onCtaClick?: () => void;
}

export function PricingSection({ onCtaClick }: PricingSectionProps) {
  const plans = [
    {
      name: 'Starter',
      price: '$12',
      priceNote: 'per seat / month',
      description: 'Perfect for solo founders & small teams',
      ctaLabel: 'Get started',
      featured: false,
      gradientClass: 'bg-gradient-to-br from-amber-100 via-orange-50 to-sky-50',
      features: [
        'Up to 2 bots',
        '1,000 messages/month',
        'Basic knowledge base',
        'Email support',
        'Website widget',
      ],
    },
    {
      name: 'Teams',
      price: '$49',
      priceNote: 'per seat / month',
      description: 'For teams that scale support',
      ctaLabel: 'Start free trial',
      featured: true,
      gradientClass: 'bg-gradient-to-br from-indigo-100 via-sky-100 to-amber-100',
      features: [
        'Unlimited bots',
        '10,000+ messages/month',
        'Advanced knowledge base',
        'Priority support + API access',
        'Multi-channel deployment',
        'Team collaboration',
      ],
    },
    {
      name: 'Enterprise',
      price: 'Custom',
      priceNote: 'contact us',
      description: 'For large organizations with custom needs',
      ctaLabel: 'Talk to sales',
      featured: false,
      gradientClass: 'bg-gradient-to-br from-sky-100 via-slate-50 to-emerald-50',
      features: [
        'Unlimited everything',
        'Custom integrations',
        'Dedicated support',
        'SLA guarantees',
        'On-premise deployment',
        'Custom training',
      ],
    },
  ];

  return (
    <section id="pricing" className="py-12 bg-gradient-to-b from-[#fff7eb] via-[#ffe9d2] to-[#fff7eb]">
      <div className="max-w-5xl mx-auto px-4 text-center">
        <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
          Simple pricing for growing teams
        </h2>
        <p className="text-lg text-gray-600 mb-6">
          Choose the plan that fits your team
        </p>
        
        {/* Badge */}
        <div className="inline-flex items-center space-x-2 bg-amber-50 text-amber-800 px-4 py-2 rounded-full text-sm font-medium mb-10">
          <span>✨ 30-day free trial · No credit card</span>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 mt-10">
          {plans.map((plan, index) => (
            <PricingCard
              key={index}
              name={plan.name}
              price={plan.price}
              priceNote={plan.priceNote}
              description={plan.description}
              ctaLabel={plan.ctaLabel}
              featured={plan.featured}
              features={plan.features}
              gradientClass={plan.gradientClass}
              onCtaClick={onCtaClick}
            />
          ))}
        </div>
      </div>
    </section>
  );
}


