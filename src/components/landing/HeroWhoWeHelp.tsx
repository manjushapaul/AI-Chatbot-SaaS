'use client';

import { Building2, Layers, Briefcase } from 'lucide-react';
import { ChatbotAvatar } from './ChatbotAvatar';

export function HeroWhoWeHelp() {
  const features = [
    {
      icon: <Building2 className="w-5 h-5" />,
      iconBg: 'bg-amber-100',
      iconColor: 'text-amber-600',
      title: 'Hotels & Hospitality',
      bullets: [
        '24/7 guest support for bookings',
        'Automated answers about amenities',
        'Reduce front desk workload by up to 60%',
      ],
      rowBg: 'bg-white/60 backdrop-blur-sm shadow-sm/0 border border-white/0',
    },
    {
      icon: <Layers className="w-5 h-5" />,
      iconBg: 'bg-sky-100',
      iconColor: 'text-sky-600',
      title: 'SaaS & Support Teams',
      bullets: [
        'Instant answers from documentation',
        'Scale support without hiring extra agents',
        'Capture and qualify leads automatically',
      ],
      rowBg: 'bg-white/30 backdrop-blur-sm',
    },
    {
      icon: <Briefcase className="w-5 h-5" />,
      iconBg: 'bg-emerald-100',
      iconColor: 'text-emerald-600',
      title: 'Agencies & Freelancers',
      bullets: [
        'White-label chatbots for client projects',
        'Launch quickly with ready-made templates',
        'Manage multiple bots from one dashboard',
      ],
      rowBg: 'bg-white/60 backdrop-blur-sm',
    },
  ];

  return (
    <section id="modern-teams" className="relative w-full bg-gradient-to-b from-[#fff7eb] via-[#ffe9d2] to-[#fff7eb]">
      {/* Dot Pattern Layer - Left Half Only */}
      <div className="pointer-events-none absolute inset-y-10 left-0 w-1/2 md:w-1/2 opacity-60">
        <div
          className="h-full w-full"
          style={{
            backgroundImage: `
              radial-gradient(circle at 1px 1px, rgba(251,191,36,0.35) 1px, transparent 0),
              radial-gradient(circle at 1px 1px, rgba(56,189,248,0.30) 1px, transparent 0)
            `,
            backgroundSize: '32px 32px, 48px 48px',
          }}
        />
      </div>

      {/* Main Content Container */}
      <div className="relative max-w-6xl mx-auto px-4 py-10 md:py-12">
        {/* Heading Section */}
        <div className="text-center mb-8 md:mb-12">
          <div className="text-xs font-medium uppercase tracking-[0.2em] text-slate-700/70 mb-2">
            AI Chatbot for Modern Teams
          </div>
          {/* Main Heading */}
          <h2 className="text-2xl md:text-3xl font-semibold text-slate-900">
            Who AI Chatbot Helps
          </h2>
          {/* Subheading */}
          <p className="mt-2 text-sm md:text-base text-slate-700/80 max-w-2xl mx-auto">
            Built for teams that need instant, accurate answers without adding more support staff.
          </p>
        </div>

        {/* Content Section */}
        <div className="flex flex-col md:flex-row gap-6 sm:gap-8 md:gap-12 items-center">
          {/* Left Column: Character Image */}
          <div className="w-full md:w-2/5 flex justify-center md:justify-start order-2 md:order-1">
            <ChatbotAvatar />
          </div>

          {/* Right Column: Content */}
          <div className="w-full md:w-3/5 flex flex-col justify-center text-center md:text-left order-1 md:order-2">
            {/* Feature List */}
            <div className="mt-6 flex flex-col gap-3 items-center md:items-stretch">
              {features.map((feature, index) => (
                <div
                  key={index}
                  className={`flex gap-3 items-start rounded-2xl px-4 py-3 w-full ${feature.rowBg}`}
                >
                  {/* Icon Circle */}
                  <div className={`mt-1 h-9 w-9 rounded-full flex items-center justify-center flex-shrink-0 ${feature.iconBg} ${feature.iconColor}`}>
                    {feature.icon}
                  </div>

                  {/* Text Stack */}
                  <div className="flex-1 space-y-1">
                    <h3 className="text-sm font-semibold text-slate-900">
                      {feature.title}
                    </h3>
                    <ul className="text-xs md:text-sm text-slate-700/90 leading-relaxed list-disc list-inside space-y-0.5">
                      {feature.bullets.map((bullet, bulletIndex) => (
                        <li key={bulletIndex}>{bullet}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

