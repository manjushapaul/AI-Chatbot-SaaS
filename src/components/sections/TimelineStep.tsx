'use client';

import { ReactNode } from 'react';

interface TimelineStepProps {
  index: number;
  isFirst?: boolean;
  isLast?: boolean;
  isActive?: boolean;
  children: ReactNode;
}

export function TimelineStep({
  index,
  isFirst = false,
  isLast = false,
  isActive = false,
  children,
}: TimelineStepProps) {
  const stepNumber = String(index).padStart(2, '0');

  return (
    <div className="relative grid grid-cols-[auto,1fr] gap-x-4 gap-y-2">
      {/* Timeline Column */}
      <div className="relative flex flex-col items-center">
        {/* Top Line */}
        {!isFirst && (
          <div className="absolute top-0 bottom-1/2 w-px bg-slate-200"></div>
        )}
        
        {/* Step Circle */}
        <div className="relative z-10">
          <div
            className={`
              h-9 w-9 rounded-full flex items-center justify-center
              border border-slate-200
              transition-all duration-200
              ${
                isActive
                  ? 'bg-amber-500 border-amber-500 shadow-sm'
                  : 'bg-white'
              }
            `}
          >
            <span
              className={`
                text-xs font-semibold tracking-[0.12em] uppercase
                ${
                  isActive
                    ? 'text-white'
                    : 'text-slate-600'
                }
              `}
            >
              {stepNumber}
            </span>
          </div>
        </div>

        {/* Bottom Line */}
        {!isLast && (
          <div className="absolute top-1/2 bottom-0 w-px bg-slate-200"></div>
        )}
      </div>

      {/* Content Column */}
      <div className="pt-0.5">
        {children}
      </div>
    </div>
  );
}



