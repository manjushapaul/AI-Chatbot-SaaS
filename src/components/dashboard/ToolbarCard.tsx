import { ReactNode } from 'react';

interface ToolbarCardProps {
  children: ReactNode;
}

export function ToolbarCard({ children }: ToolbarCardProps) {
  return (
    <div className="rounded-2xl bg-white/70 shadow-[0_18px_45px_rgba(15,23,42,0.04)] backdrop-blur px-4 py-3 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      {children}
    </div>
  );
}

