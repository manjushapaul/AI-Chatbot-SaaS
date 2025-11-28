import { ReactNode } from 'react';
import { typography } from '@/lib/design-tokens';

interface FormCardProps {
  icon: ReactNode;
  title: string;
  children: ReactNode;
  useLargeTypography?: boolean;
}

export function FormCard({ icon, title, children, useLargeTypography = false }: FormCardProps) {
  return (
    <div className="rounded-2xl bg-white/85 shadow-[0_18px_45px_rgba(15,23,42,0.06)] backdrop-blur border border-white/70 px-6 py-5 space-y-4">
      <div className="flex items-center space-x-3">
        <div className="bg-accent-soft/10 text-accent-soft rounded-full p-2">
          {icon}
        </div>
        <h3 className={useLargeTypography ? typography.sectionTitleLarge : typography.sectionTitle}>{title}</h3>
      </div>
      {children}
    </div>
  );
}

