import { ReactNode } from 'react';

interface AppPageProps {
  children: ReactNode;
}

export function AppPage({ children }: AppPageProps) {
  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {children}
    </div>
  );
}

