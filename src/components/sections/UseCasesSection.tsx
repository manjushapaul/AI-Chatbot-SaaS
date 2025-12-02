'use client';

import { ReactNode } from 'react';
import { Building2, Briefcase, Sparkles } from 'lucide-react';
import { SupportCharacter } from '@/components/landing/SupportCharacter';

interface UseCaseCardProps {
  icon: ReactNode;
  label: string;
  bullets: string[];
  accentColor: string;
}

function UseCaseCard({ icon, label, bullets, accentColor }: UseCaseCardProps) {
  return (
    <div className="group relative bg-white rounded-xl border border-slate-200 p-6 cursor-pointer transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md hover:border-slate-300">
      {/* Icon Badge */}
      <div className="mb-5">
        <div className={`w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center ${accentColor} transition-colors group-hover:border-slate-300`}>
          {icon}
        </div>
      </div>

      {/* Title */}
      <h3 className="text-lg font-semibold text-slate-900 tracking-tight mb-4">
        {label}
      </h3>

      {/* Bullets */}
      <ul className="space-y-3">
        {bullets.map((bullet, index) => (
          <li key={index} className="text-slate-600 text-sm leading-relaxed">
            {bullet}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function UseCasesSection() {
  const useCases = [
    {
      icon: <Building2 className="w-4 h-4 text-amber-600" />,
      label: 'Hotels & Hospitality',
      bullets: [
        '24/7 guest support for bookings',
        'Automated answers about amenities',
        'Reduce front desk workload by 60%',
      ],
      accentColor: 'group-hover:bg-amber-50',
    },
    {
      icon: <Briefcase className="w-4 h-4 text-amber-600" />,
      label: 'SaaS & Support Teams',
      bullets: [
        'Instant answers from documentation',
        'Scale support without hiring agents',
        'Capture and qualify leads automatically',
      ],
      accentColor: 'group-hover:bg-amber-50',
    },
    {
      icon: <Sparkles className="w-4 h-4 text-amber-600" />,
      label: 'Agencies & Freelancers',
      bullets: [
        'White-label chatbots for clients',
        'Quick setup with templates',
        'Manage multiple bots from one dashboard',
      ],
      accentColor: 'group-hover:bg-amber-50',
    },
  ];

  return (
    <section id="product" className="py-10 md:py-12 bg-gradient-to-b from-[#fff7eb] via-[#ffe9d2] to-[#fff7eb]">
      <div className="max-w-6xl mx-auto px-4 md:px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-14 items-center">
          {/* LEFT: Character Illustration */}
          <div className="order-2 md:order-1 flex items-center justify-center">
            <SupportCharacter />
          </div>

          {/* RIGHT: Content + Cards */}
          <div className="order-1 md:order-2">
            {/* Header */}
            <div className="mb-8">
              <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-3 tracking-tight">
                Built for teams who need answers fast
              </h2>
              <p className="text-lg text-slate-600">
                Trusted by teams across industries to deliver instant, accurate responses
              </p>
            </div>

            {/* Cards Grid */}
            <div className="mt-6 grid grid-cols-1 gap-4">
              {useCases.map((useCase, index) => (
                <UseCaseCard
                  key={index}
                  icon={useCase.icon}
                  label={useCase.label}
                  bullets={useCase.bullets}
                  accentColor={useCase.accentColor}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

