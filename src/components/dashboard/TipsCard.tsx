import { ReactNode } from 'react';
import { typography } from '@/lib/design-tokens';

interface TipItem {
  text: string;
  color?: 'emerald' | 'sky';
}

interface TipsCardProps {
  leftColumn: {
    title: string;
    tips: TipItem[];
  };
  rightColumn: {
    title: string;
    tips: TipItem[];
  };
  useLargeTypography?: boolean;
}

export function TipsCard({ leftColumn, rightColumn, useLargeTypography = false }: TipsCardProps) {
  const getDotColor = (color?: 'emerald' | 'sky') => {
    return color === 'emerald' ? 'bg-emerald-400' : 'bg-sky-400';
  };

  return (
    <div className="w-full rounded-2xl bg-white/85 shadow-[0_18px_45px_rgba(15,23,42,0.06)] backdrop-blur border border-white/70 px-6 py-5 grid grid-cols-1 gap-4 md:grid-cols-2">
      <div>
        <h4 className={useLargeTypography ? typography.sectionTitleLarge : 'text-xs font-semibold text-gray-900 mb-3'}>{leftColumn.title}</h4>
        <ul className="space-y-2">
          {leftColumn.tips.map((tip, index) => (
            <li key={index} className={`flex items-start gap-2 ${useLargeTypography ? typography.bodyLarge : 'text-xs text-gray-600'}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${getDotColor(tip.color)} mt-1.5 flex-shrink-0`}></span>
              <span>{tip.text}</span>
            </li>
          ))}
        </ul>
      </div>
      <div>
        <h4 className={useLargeTypography ? typography.sectionTitleLarge : 'text-xs font-semibold text-gray-900 mb-3'}>{rightColumn.title}</h4>
        <ul className="space-y-2">
          {rightColumn.tips.map((tip, index) => (
            <li key={index} className={`flex items-start gap-2 ${useLargeTypography ? typography.bodyLarge : 'text-xs text-gray-600'}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${getDotColor(tip.color)} mt-1.5 flex-shrink-0`}></span>
              <span>{tip.text}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

