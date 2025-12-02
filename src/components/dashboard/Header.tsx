'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { User, Settings, LogOut, ChevronDown } from 'lucide-react';
import { NotificationBell } from './NotificationBell';

export function Header() {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const { data: session } = useSession();
  const router = useRouter();
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    };

    if (isProfileOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isProfileOpen]);

  const handleSignOut = () => {
    setIsProfileOpen(false);
    signOut({ callbackUrl: '/' });
  };

  const handleProfileClick = () => {
    setIsProfileOpen(false);
    router.push('/dashboard/settings?tab=profile');
  };

  const handleSettingsClick = () => {
    setIsProfileOpen(false);
    router.push('/dashboard/settings');
  };

  return (
    <header className="border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Logo and Brand */}
        <div className="flex items-center space-x-4">
          <div className="w-8 h-8 bg-white/20 backdrop-blur-md border border-white/30 rounded-lg flex items-center justify-center shadow-md">
            <span className="text-gray-900 font-bold text-sm">AI</span>
          </div>
          <h1 className="text-xl font-semibold text-gray-900">ChatBot SaaS</h1>
          {session?.user?.tenant && (
            <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
              {session.user.tenant.name || session.user.tenant.subdomain}
            </span>
          )}
        </div>

        {/* Right side - Notifications and Profile */}
        <div className="flex items-center space-x-4">
          {/* Notifications */}
          <NotificationBell />

          {/* Profile Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="flex items-center space-x-2 p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-gray-700" />
              </div>
              <span className="text-sm font-medium">
                {session?.user?.name || 'User'}
              </span>
              <ChevronDown className="w-4 h-4 text-gray-700" />
            </button>

            {isProfileOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                <div className="px-4 py-2 border-b border-gray-100">
                  <p className="text-sm font-medium text-gray-900">
                    {session?.user?.name || 'User'}
                  </p>
                  <p className="text-xs text-gray-500">
                    {session?.user?.email}
                  </p>
                  <p className="text-xs text-gray-500 capitalize">
                    Role: {session?.user?.role}
                  </p>
                </div>
                <button 
                  onClick={handleProfileClick}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                >
                  <User className="w-4 h-4 text-gray-700" />
                  <span>Profile</span>
                </button>
                <button 
                  onClick={handleSettingsClick}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                >
                  <Settings className="w-4 h-4 text-gray-700" />
                  <span>Settings</span>
                </button>
                <hr className="my-2" />
                <button 
                  onClick={handleSignOut}
                  className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2"
                >
                  <LogOut className="w-4 h-4 text-gray-700" />
                  <span>Sign Out</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
} 