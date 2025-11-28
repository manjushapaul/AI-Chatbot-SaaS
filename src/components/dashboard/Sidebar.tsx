'use client';

import { useState } from 'react';
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Bot, 
  Database, 
  MessageSquare, 
  BarChart3, 
  Settings, 
  Users, 
  Square, 
  ChevronDown,
  Plus,
  CreditCard
} from 'lucide-react';

interface SidebarItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  children?: SidebarItem[];
}

const sidebarItems: SidebarItem[] = [
  {
    label: 'Dashboard',
    href: '/dashboard',
    icon: <BarChart3 className="w-5 h-5 text-gray-700" />,
  },
  {
    label: 'Bots',
    href: '/dashboard/bots',
    icon: <Bot className="w-5 h-5 text-gray-700" />,
    children: [
      { label: 'All Bots', href: '/dashboard/bots', icon: <Bot className="w-4 h-4 text-gray-700" /> },
      { label: 'Create Bot', href: '/dashboard/bots/create', icon: <Plus className="w-4 h-4 text-gray-700" /> },
    ],
  },
  {
    label: 'Knowledge Bases',
    href: '/dashboard/knowledge-bases',
    icon: <Database className="w-5 h-5 text-gray-700" />,
    children: [
      { label: 'All Knowledge Bases', href: '/dashboard/knowledge-bases', icon: <Database className="w-4 h-4 text-gray-700" /> },
      { label: 'Upload Documents', href: '/dashboard/knowledge-bases/upload', icon: <Plus className="w-4 h-4 text-gray-700" /> },
    ],
  },
  {
    label: 'Conversations',
    href: '/dashboard/conversations',
    icon: <MessageSquare className="w-5 h-5 text-gray-700" />,
  },
  {
    label: 'Widgets',
    href: '/dashboard/widgets',
    icon: <Square className="w-5 h-5 text-gray-700" />,
  },
  {
    label: 'Users',
    href: '/dashboard/users',
    icon: <Users className="w-5 h-5 text-gray-700" />,
  },
  {
    label: 'Analytics',
    href: '/dashboard/analytics',
    icon: <BarChart3 className="w-5 h-5 text-gray-700" />,
  },
  {
    label: 'Billing',
    href: '/dashboard/billing',
    icon: <CreditCard className="w-5 h-5 text-gray-700" />,
  },
  {
    label: 'Settings',
    href: '/dashboard/settings',
    icon: <Settings className="w-5 h-5 text-gray-700" />,
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const [expandedItems, setExpandedItems] = useState<string[]>(['Bots', 'Knowledge Bases']);

  const toggleExpanded = (label: string) => {
    setExpandedItems(prev => 
      prev.includes(label) 
        ? prev.filter(item => item !== label)
        : [...prev, label]
    );
  };

  const isActive = (href: string) => {
    // Normalize paths by removing trailing slashes
    const normalizedPathname = pathname.replace(/\/$/, '');
    const normalizedHref = href.replace(/\/$/, '');
    
    // Exact match
    if (normalizedPathname === normalizedHref) return true;
    
    // For non-dashboard routes, check if pathname starts with href (for nested routes)
    // But exclude /dashboard to avoid matching /dashboard/settings when href is /dashboard
    if (normalizedHref !== '/dashboard' && normalizedPathname.startsWith(normalizedHref + '/')) {
      return true;
    }
    
    return false;
  };
  const isChildActive = (item: SidebarItem) => 
    item.children?.some(child => isActive(child.href)) || false;

  return (
    <aside className="w-64 border-r border-gray-200 min-h-screen">
      <div className="p-6">
        <div className="flex items-center space-x-3 mb-8">
          <div className="w-10 h-10 bg-white/20 backdrop-blur-md border border-white/30 rounded-lg flex items-center justify-center shadow-md">
            <span className="text-gray-900 font-bold text-lg">AI</span>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">ChatBot SaaS</h2>
            <p className="text-sm text-gray-500">Admin Console</p>
          </div>
        </div>

        <nav className="space-y-2">
          {sidebarItems.map((item) => (
            <div key={item.label}>
              {item.children ? (
                <div>
                  <button
                    onClick={() => toggleExpanded(item.label)}
                    className={`w-full flex items-center justify-between px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                      isChildActive(item) 
                        ? 'bg-accent-strong-50 text-white' 
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <div className={`flex items-center space-x-3 ${isChildActive(item) ? '[&_svg]:text-white' : ''}`}>
                      {item.icon}
                      <span>{item.label}</span>
                    </div>
                    <ChevronDown 
                      className={`w-4 h-4 ${isChildActive(item) ? 'text-white' : 'text-gray-700'} transition-transform ${
                        expandedItems.includes(item.label) ? 'rotate-180' : ''
                      }`} 
                    />
                  </button>
                  
                  {expandedItems.includes(item.label) && (
                    <div className="ml-8 mt-2 space-y-1">
                      {item.children.map((child) => (
                        <Link
                          key={child.href}
                          href={child.href}
                          className={`flex items-center space-x-3 px-3 py-2 text-sm rounded-lg transition-colors ${
                            isActive(child.href)
                              ? 'bg-accent-strong-50 text-white'
                              : 'text-gray-600 hover:bg-gray-100'
                          }`}
                        >
                          <div className={isActive(child.href) ? '[&_svg]:text-white' : ''}>
                          {child.icon}
                          </div>
                          <span>{child.label}</span>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  href={item.href}
                  className={`flex items-center space-x-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                    isActive(item.href)
                      ? 'bg-accent-strong-50 text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <div className={isActive(item.href) ? '[&_svg]:text-white' : ''}>
                  {item.icon}
                  </div>
                  <span>{item.label}</span>
                </Link>
              )}
            </div>
          ))}
        </nav>
      </div>
    </aside>
  );
} 