import { ReactNode } from 'react';

interface SectionCardProps {
  title: string | ReactNode;
  action?: ReactNode;
  children: ReactNode;
}

export function SectionCard({ title, action, children }: SectionCardProps) {
  return (
    <div className="mt-6 rounded-2xl bg-white/85 shadow-[0_24px_70px_rgba(15,23,42,0.08)] backdrop-blur px-6 py-5 border border-white/70">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-gray-900">{title}</h2>
        {action && <div>{action}</div>}
      </div>
      {children}
    </div>
  );
}

