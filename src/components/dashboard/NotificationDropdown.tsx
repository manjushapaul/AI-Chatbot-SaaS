'use client';

import { useState, useEffect, useRef } from 'react';
import { Bell, Check, Inbox } from 'lucide-react';
import { NotificationItem } from './NotificationItem';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  category: string;
  priority: string;
  actionUrl?: string | null;
  isRead: boolean;
  createdAt: string;
}

interface NotificationDropdownProps {
  notifications: Notification[];
  unreadCount: number;
  onMarkRead: (id: string) => void;
  onMarkAllRead: () => void;
  onLoadMore?: () => void;
  hasMore?: boolean;
}

export function NotificationDropdown({
  notifications,
  unreadCount,
  onMarkRead,
  onMarkAllRead,
  onLoadMore,
  hasMore,
}: NotificationDropdownProps) {
  const [activeFilter, setActiveFilter] = useState<'all' | 'unread' | 'important'>('all');
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);

  const filteredNotifications =
    activeFilter === 'unread'
      ? notifications.filter((n) => !n.isRead)
      : activeFilter === 'important'
      ? notifications.filter((n) => n.priority === 'HIGH' || n.priority === 'CRITICAL')
      : notifications;

  const groupedNotifications = groupNotificationsByDate(filteredNotifications);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!dropdownRef.current) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setFocusedIndex((prev) =>
          prev < filteredNotifications.length - 1 ? prev + 1 : prev
        );
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setFocusedIndex((prev) => (prev > 0 ? prev - 1 : -1));
      } else if (e.key === 'Enter' && focusedIndex >= 0) {
        e.preventDefault();
        const notification = filteredNotifications[focusedIndex];
        if (notification) {
          onMarkRead(notification.id);
          if (notification.actionUrl) {
            window.location.href = notification.actionUrl;
          }
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        // Close dropdown - handled by parent
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [focusedIndex, filteredNotifications, onMarkRead]);

  useEffect(() => {
    if (focusedIndex >= 0 && itemRefs.current[focusedIndex]) {
      itemRefs.current[focusedIndex]?.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
      });
    }
  }, [focusedIndex]);

  // Always show scrollbar when there are 4+ items, but make it visible all the time

  return (
    <div
      ref={dropdownRef}
      className="w-[380px] bg-white rounded-2xl shadow-[0_24px_70px_rgba(15,23,42,0.12)] border border-white/80 backdrop-blur z-50 flex flex-col"
      style={{ maxHeight: '480px' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 flex-shrink-0">
        <h3 className="text-sm font-semibold text-gray-900">Notifications</h3>
        {unreadCount > 0 && (
          <button
            onClick={onMarkAllRead}
            className="text-xs text-accent-soft font-medium hover:underline flex items-center gap-1"
          >
            <Check className="w-3 h-3" />
            Mark all as read
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1 px-2 py-2 border-b border-gray-100 flex-shrink-0">
        {(['all', 'unread', 'important'] as const).map((filter) => (
          <button
            key={filter}
            onClick={() => {
              setActiveFilter(filter);
              setFocusedIndex(-1);
            }}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors capitalize ${
              activeFilter === filter
                ? 'bg-accent-soft text-white shadow-sm'
                : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100/70'
            }`}
          >
            {filter}
          </button>
        ))}
      </div>

      {/* Notifications List */}
      <div 
        className="px-3 py-2 space-y-3 flex-1 min-h-0 notification-scrollbar"
        style={{ overflowY: 'scroll' }}
      >
        {filteredNotifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
              <Inbox className="w-6 h-6 text-gray-400" />
            </div>
            <p className="text-sm font-medium text-gray-800 mb-1">You're all caught up</p>
            <p className="text-xs text-gray-500">No new notifications</p>
          </div>
        ) : (
          Object.entries(groupedNotifications).map(([group, groupNotifications]) => (
            <div key={group}>
              <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2 px-1">
                {group}
              </h4>
              <div className="space-y-2">
                {groupNotifications.map((notification, index) => {
                  const globalIndex = filteredNotifications.indexOf(notification);
                  return (
                    <div
                      key={notification.id}
                      ref={(el) => {
                        itemRefs.current[globalIndex] = el;
                      }}
                    >
                      <NotificationItem
                        {...notification}
                        onMarkRead={onMarkRead}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}

        {/* Load More */}
        {hasMore && onLoadMore && (
          <button
            onClick={onLoadMore}
            className="w-full py-2 text-xs text-accent-soft font-medium hover:underline"
          >
            Load more
          </button>
        )}
      </div>
    </div>
  );
}

function groupNotificationsByDate(notifications: Notification[]) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const thisWeek = new Date(today);
  thisWeek.setDate(thisWeek.getDate() - 7);

  const groups: Record<string, Notification[]> = {
    Today: [],
    Yesterday: [],
    'This Week': [],
    Older: [],
  };

  notifications.forEach((notification) => {
    const date = new Date(notification.createdAt);
    if (date >= today) {
      groups.Today.push(notification);
    } else if (date >= yesterday) {
      groups.Yesterday.push(notification);
    } else if (date >= thisWeek) {
      groups['This Week'].push(notification);
    } else {
      groups.Older.push(notification);
    }
  });

  // Remove empty groups
  Object.keys(groups).forEach((key) => {
    if (groups[key].length === 0) {
      delete groups[key];
    }
  });

  return groups;
}

