'use client';

import { ReactNode } from 'react';

interface HowItWorksCardProps {
  step: number;
  title: string;
  description: string;
  icon: ReactNode;
}

export function HowItWorksCard({
  step,
  title,
  description,
  icon,
}: HowItWorksCardProps) {
  return (
    <div className="flex items-start gap-6 group">
      {/* Step Number and Icon */}
      <div className="flex-shrink-0">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-100 to-amber-200 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform duration-200">
          {icon}
        </div>
        <div className="text-4xl font-bold text-slate-900/20 leading-none">
          {String(step).padStart(2, '0')}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 pt-2">
        <h3 className="text-xl font-semibold text-slate-900 mb-2 tracking-tight">
          {title}
        </h3>
        <p className="text-slate-600 leading-relaxed">
          {description}
        </p>
      </div>
    </div>
  );
}
