import { ReactNode } from 'react';
import Link from 'next/link';

interface StatCardProps {
  icon: ReactNode;
  title: string;
  value: string | number;
  link?: {
    href: string;
    text: string;
  };
}

export function StatCard({ icon, title, value, link }: StatCardProps) {
  return (
    <div className="rounded-2xl bg-white/80 shadow-[0_18px_45px_rgba(15,23,42,0.06)] backdrop-blur px-6 py-4 border border-white/70">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-700">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
        <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
          {icon}
        </div>
      </div>
      {link && (
        <div className="mt-4">
          <Link
            href={link.href}
            className="text-xs text-accent-soft hover:underline"
          >
            {link.text} →
          </Link>
        </div>
      )}
    </div>
  );
}

