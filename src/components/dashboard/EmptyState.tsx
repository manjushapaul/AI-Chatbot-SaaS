'use client';

import { ReactNode } from 'react';
import Link from 'next/link';
import { useTheme } from '@/contexts/ThemeContext';

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description: string;
  action?: {
    href: string;
    text: string;
    variant?: 'primary' | 'secondary';
  };
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  const { theme } = useTheme();
  
  const getPrimaryButtonClass = () => {
    return theme === 'dark' 
      ? 'bg-[#563517e6] text-white hover:bg-[#563517b3] hover:shadow-lg hover:scale-[1.02]'
      : 'bg-accent-soft text-white hover:bg-accent-soft/80 hover:shadow-lg hover:scale-[1.02]';
  };

  return (
    <div className="text-center py-8">
      <div className="bg-accent-soft/10 text-accent-soft rounded-full p-3 w-fit mx-auto mb-4">
        {icon}
      </div>
      <h3 className="text-sm font-medium text-gray-800 mb-2">{title}</h3>
      <p className="text-xs text-gray-500 max-w-md mx-auto mb-4">{description}</p>
      {action && (
        action.href === '#' ? (
          <button
            onClick={() => window.location.reload()}
            className={`rounded-full px-4 py-2 text-xs transition-all inline-flex items-center gap-2 ${
              action.variant === 'primary'
                ? getPrimaryButtonClass()
                : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 hover:shadow-md hover:scale-[1.02]'
            }`}
          >
            {action.text}
          </button>
        ) : (
          <Link
            href={action.href}
            className={`rounded-full px-4 py-2 text-xs transition-all inline-flex items-center gap-2 ${
              action.variant === 'primary'
                ? getPrimaryButtonClass()
                : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 hover:shadow-md hover:scale-[1.02]'
            }`}
          >
            {action.text}
          </Link>
        )
      )}
    </div>
  );
}

