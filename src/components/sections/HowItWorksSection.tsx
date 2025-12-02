'use client';

import { TimelineStep } from './TimelineStep';
import { AnalyticsPreviewSolid } from './AnalyticsPreviewSolid';
import { AnalyticsPreviewGlass } from './AnalyticsPreviewGlass';

interface Step {
  number: string;
  title: string;
  description: string;
}

function HowItWorksSteps() {
  const steps: Step[] = [
    {
      number: '01',
      title: 'Connect your knowledge',
      description: 'Upload PDFs, docs, FAQs, or URLs and we index them into a searchable knowledge base.',
    },
    {
      number: '02',
      title: 'Configure your bot',
      description: 'Choose tone, languages, fallback behavior, and map common questions to answers.',
    },
    {
      number: '03',
      title: 'Deploy everywhere',
      description: 'Embed on your site, share a link, or connect WhatsApp and other channels.',
    },
  ];

  return (
    <div>
      {/* Label */}
      <span className="text-sm font-medium text-amber-600 mb-2 block">
        How it works
      </span>
      
      {/* Main Title */}
      <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-2 tracking-tight">
        Guideline to smarter AI chats
      </h2>
      
      {/* Steps Timeline */}
      <div className="mt-8 space-y-8">
        {steps.map((step, index) => (
          <TimelineStep
            key={step.number}
            index={index + 1}
            isFirst={index === 0}
            isLast={index === steps.length - 1}
            isActive={index === 0}
          >
            <h3 className="text-sm md:text-base font-semibold text-slate-900 mb-1.5">
              {step.title}
            </h3>
            <p className="text-xs md:text-sm text-slate-600 leading-snug">
              {step.description}
            </p>
          </TimelineStep>
        ))}
      </div>
    </div>
  );
}

interface HowItWorksSectionProps {
  variant?: 'solid' | 'glass';
}

export function HowItWorksSection({ variant = 'solid' }: HowItWorksSectionProps) {
  return (
    <section id="how-it-works" className="py-10 md:py-12 bg-gradient-to-b from-[#fff7eb] via-[#ffe9d2] to-[#fff7eb]">
      <div className="max-w-7xl mx-auto px-4">
        {/* Content Grid */}
        <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] gap-10 md:gap-12 items-stretch">
          {/* Left Column - Steps Timeline */}
          <div className="flex items-center">
            <HowItWorksSteps />
          </div>

          {/* Right Column - Preview Card */}
          <div className="flex items-center">
            {variant === 'solid' ? (
              <AnalyticsPreviewSolid />
            ) : (
              <AnalyticsPreviewGlass />
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
