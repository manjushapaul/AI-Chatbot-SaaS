import { Check } from 'lucide-react';

export interface PricingCardProps {
  name: string;
  price: string;
  priceNote?: string;
  description: string;
  ctaLabel: string;
  featured?: boolean;
  features: string[];
  gradientClass: string;
  onCtaClick?: () => void;
}

export function PricingCard({
  name,
  price,
  priceNote = 'per month',
  description,
  ctaLabel,
  featured = false,
  features,
  gradientClass,
  onCtaClick,
}: PricingCardProps) {
  return (
    <div
      className={`relative flex flex-col rounded-3xl bg-white/90 shadow-[0_18px_45px_rgba(15,23,42,0.08)] border border-white/60 overflow-hidden transition-all duration-300 hover:shadow-[0_24px_60px_rgba(15,23,42,0.12)] ${
        featured
          ? 'ring-2 ring-indigo-300 md:-mt-4 md:pb-10'
          : ''
      }`}
    >
      {/* Header with gradient */}
      <div className={`${gradientClass} px-6 pt-6 pb-5`}>
        <div className="mb-3">
          <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wide">
            {name}
          </h3>
        </div>
        <div className="mt-2">
          <p className="text-xs text-slate-500 mb-2">Starts at</p>
          <div className="flex items-baseline gap-1">
            <span className="text-4xl font-bold text-slate-900">{price}</span>
            {priceNote && (
              <span className="text-sm text-slate-600 ml-1">{priceNote}</span>
            )}
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="px-6 pb-6 pt-3 bg-white/90 flex-1 flex flex-col">
        <p className="text-xs md:text-sm text-slate-600 mb-4 leading-relaxed">
          {description}
        </p>

        {/* CTA Button */}
        <button
          onClick={onCtaClick}
          className="w-full rounded-full py-2.5 text-sm font-semibold transition-colors bg-amber-600 text-white hover:bg-amber-700 shadow-sm hover:shadow-md"
        >
          {ctaLabel}
        </button>

        {/* Features List */}
        <div className="mt-5 space-y-2.5">
          {features.map((feature, index) => (
            <div key={index} className="flex items-start gap-2">
              <Check className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
              <span className="text-xs md:text-sm text-slate-600 leading-relaxed">
                {feature}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

