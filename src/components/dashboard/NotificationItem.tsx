'use client';

import { Bot, AlertCircle, TrendingUp, CreditCard, Shield, FileText, Globe, Bell } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';
import { useTheme } from '@/contexts/ThemeContext';

interface NotificationItemProps {
  id: string;
  type: string;
  title: string;
  message: string;
  category: string;
  priority: string;
  actionUrl?: string | null;
  isRead: boolean;
  createdAt: string;
  onMarkRead: (id: string) => void;
}

const categoryIcons: Record<string, React.ReactNode> = {
  bot_activity: <Bot className="w-4 h-4" />,
  system: <AlertCircle className="w-4 h-4" />,
  metrics: <TrendingUp className="w-4 h-4" />,
  team: <Bell className="w-4 h-4" />,
  billing: <CreditCard className="w-4 h-4" />,
  security: <Shield className="w-4 h-4" />,
  kb: <FileText className="w-4 h-4" />,
  widget: <Globe className="w-4 h-4" />,
};

export function NotificationItem({
  id,
  type,
  title,
  message,
  category,
  priority,
  actionUrl,
  isRead,
  createdAt,
  onMarkRead,
}: NotificationItemProps) {
  const { theme } = useTheme();
  const handleClick = () => {
    if (!isRead) {
      onMarkRead(id);
    }
    if (actionUrl) {
      window.location.href = actionUrl;
    }
  };

  const icon = categoryIcons[category] || <Bell className="w-4 h-4" />;
  const priorityColors: Record<string, string> = {
    LOW: 'bg-blue-100 text-blue-600',
    MEDIUM: 'bg-gray-100 text-gray-600',
    HIGH: 'bg-orange-100 text-orange-600',
    CRITICAL: 'bg-red-100 text-red-600',
  };

  return (
    <div
      onClick={handleClick}
      className={`rounded-xl px-3 py-3 cursor-pointer transition-colors ${
        isRead
          ? 'bg-white/90 border border-white/80'
          : theme === 'dark' 
            ? 'bg-[#F5E6D3] border border-accent-soft/20'
            : 'bg-[#FDF2FF] border border-accent-soft/20'
      } shadow-sm hover:shadow-md`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
            isRead ? 'bg-gray-100 text-gray-600' : 'bg-accent-soft/10 text-accent-soft'
          }`}
        >
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="text-sm font-medium text-gray-900">{title}</h4>
                {!isRead && (
                  <span className="w-2 h-2 bg-accent-soft rounded-full flex-shrink-0"></span>
                )}
              </div>
              <p className="text-xs text-gray-500 line-clamp-2 mb-2">{message}</p>
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-gray-400">
                  {formatDistanceToNow(new Date(createdAt), { addSuffix: true })}
                </span>
                {actionUrl && (
                  <Link
                    href={actionUrl}
                    onClick={(e) => e.stopPropagation()}
                    className="text-[11px] text-accent-soft font-medium hover:underline"
                  >
                    View
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

