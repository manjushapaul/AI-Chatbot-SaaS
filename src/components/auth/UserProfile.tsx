'use client';

import { useSession, signOut } from 'next-auth/react';
import { Button } from '@/components/ui/Button';
import { LogOut, User, Building, Shield } from 'lucide-react';

export function UserProfile() {
  const { data: session } = useSession();

  if (!session) {
    return null;
  }

  const handleSignOut = () => {
    signOut({ callbackUrl: '/' });
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center space-x-4 mb-6">
        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
          <User className="w-6 h-6 text-accent-strong" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-gray-900">
            {session.user.name || 'User'}
          </h2>
          <p className="text-gray-600">{session.user.email}</p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center space-x-3">
          <Building className="w-5 h-5 text-gray-400" />
          <div>
            <p className="text-sm font-medium text-gray-900">Tenant</p>
            <p className="text-sm text-gray-600">
              {session.user.tenant?.name || session.user.tenant?.subdomain || 'Unknown'}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <Shield className="w-5 h-5 text-gray-400" />
          <div>
            <p className="text-sm font-medium text-gray-900">Role</p>
            <p className="text-sm text-gray-600 capitalize">
              {session.user.role.toLowerCase()}
            </p>
          </div>
        </div>

        <div className="pt-4 border-t">
          <Button
            onClick={handleSignOut}
            variant="outline"
            className="w-full"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </div>
    </div>
  );
} 