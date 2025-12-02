'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { 
  Users, 
  UserPlus, 
  Shield, 
  Settings, 
  MoreVertical,
  Edit,
  UserX,
  UserCheck,
  Trash2,
  AlertTriangle,
  CheckCircle,
  Clock,
  Eye,
  EyeOff
} from 'lucide-react';

interface TeamMember {
  id: string;
  email: string;
  name: string;
  role: string;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'DELETED';
  joinedAt: Date;
  lastActive?: Date;
}

interface UserRole {
  id: string;
  name: string;
  permissions: string[];
  description: string;
}

interface TeamStats {
  totalMembers: number;
  activeMembers: number;
  invitedMembers: number;
  suspendedMembers: number;
  roles: Record<string, number>;
}

interface TeamData {
  members: TeamMember[];
  stats: TeamStats;
  roles: UserRole[];
  canAddUser: { allowed: boolean; reason?: string };
}

export default function TeamPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [teamData, setTeamData] = useState<TeamData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [showActionModal, setShowActionModal] = useState(false);
  const [actionType, setActionType] = useState<'role' | 'suspend' | 'reactivate' | 'remove'>('role');
  const [formData, setFormData] = useState({ role: '', reason: '' });

  useEffect(() => {
    if (status === 'loading') return;
    
    if (status === 'unauthenticated') {
      router.push('/auth');
      return;
    }

    fetchTeamData();
  }, [status, router]);

  const fetchTeamData = async () => {
    try {
      setLoading(true);
      
      // Fetch team members
      const membersResponse = await fetch('/api/team/members');
      const membersData = await membersResponse.json();
      
      // Fetch team stats
      const statsResponse = await fetch('/api/team/stats');
      const statsData = await statsResponse.json();

      if (membersResponse.ok && statsResponse.ok) {
        setTeamData({
          members: membersData.data || [],
          stats: statsData.data.stats || {},
          roles: statsData.data.roles || [],
          canAddUser: statsData.data.canAddUser || { allowed: false }
        });
      }
    } catch (error) {
      console.error('Error fetching team data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async () => {
    if (!selectedMember || !formData.role) return;

    try {
      const response = await fetch('/api/team/members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: actionType === 'role' ? 'update_role' : 
                  actionType === 'suspend' ? 'suspend_user' :
                  actionType === 'reactivate' ? 'reactivate_user' :
                  'remove_user',
          userId: selectedMember.id,
          role: formData.role,
          reason: formData.reason
        })
      });

      if (response.ok) {
        await fetchTeamData();
        setShowActionModal(false);
        setSelectedMember(null);
        setFormData({ role: '', reason: '' });
      }
    } catch (error) {
      console.error('Error performing action:', error);
    }
  };

  const openActionModal = (member: TeamMember, type: 'role' | 'suspend' | 'reactivate' | 'remove') => {
    setSelectedMember(member);
    setActionType(type);
    setFormData({ role: member.role, reason: '' });
    setShowActionModal(true);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <CheckCircle className="w-4 h-4 text-accent-strong" />;
      case 'SUSPENDED':
        return <AlertTriangle className="w-4 h-4 text-accent-strong" />;
      case 'INACTIVE':
        return <Clock className="w-4 h-4 text-accent-strong" />;
      case 'DELETED':
        return <UserX className="w-4 h-4 text-accent-strong" />;
      default:
        return <Eye className="w-4 h-4 text-accent-strong" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-800';
      case 'SUSPENDED':
        return 'bg-yellow-100 text-yellow-800';
      case 'INACTIVE':
        return 'bg-gray-100 text-gray-800';
      case 'DELETED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return 'bg-amber-100 text-amber-800';
      case 'TENANT_ADMIN':
        return 'bg-blue-100 text-blue-800';
      case 'BOT_OPERATOR':
        return 'bg-green-100 text-green-800';
      case 'USER':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading team information...</p>
        </div>
      </div>
    );
  }

  if (!teamData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-accent-strong mx-auto" />
          <p className="mt-4 text-gray-600">Failed to load team data</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Team Management</h1>
          <p className="mt-2 text-gray-600">
            Manage your team members, roles, and permissions
          </p>
        </div>

        {/* Team Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white/20 backdrop-blur-md rounded-lg shadow-2xl border border-white/30 shadow-2xl p-6">
            <div className="flex items-center">
              <Users className="w-8 h-8 text-accent-strong" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Members</p>
                <p className="text-2xl font-bold text-gray-900">
                  {teamData.stats.totalMembers}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white/20 backdrop-blur-md rounded-lg shadow-2xl border border-white/30 shadow-2xl p-6">
            <div className="flex items-center">
              <CheckCircle className="w-8 h-8 text-accent-strong" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Members</p>
                <p className="text-2xl font-bold text-gray-900">
                  {teamData.stats.activeMembers}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white/20 backdrop-blur-md rounded-lg shadow-2xl border border-white/30 shadow-2xl p-6">
            <div className="flex items-center">
              <AlertTriangle className="w-8 h-8 text-accent-strong" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Suspended</p>
                <p className="text-2xl font-bold text-gray-900">
                  {teamData.stats.suspendedMembers}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white/20 backdrop-blur-md rounded-lg shadow-2xl border border-white/30 shadow-2xl p-6">
            <div className="flex items-center">
              <Shield className="w-8 h-8 text-accent-strong" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Can Add Users</p>
                <p className="text-2xl font-bold text-gray-900">
                  {teamData.canAddUser.allowed ? 'Yes' : 'No'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Team Members Table */}
        <div className="bg-white/20 backdrop-blur-md rounded-lg shadow-2xl border border-white/30 shadow-2xl">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Team Members</h2>
            {!teamData.canAddUser.allowed && (
              <p className="text-sm text-accent-strong mt-1">
                {teamData.canAddUser.reason}
              </p>
            )}
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Joined
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Active
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white/20 backdrop-blur-md divide-y divide-gray-200 border border-white/30 shadow-2xl">
                {teamData.members.map((member) => (
                  <tr key={member.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <Users className="w-4 h-4 text-accent-strong" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {member.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {member.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleColor(member.role)}`}>
                        {member.role.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {getStatusIcon(member.status)}
                        <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(member.status)}`}>
                          {member.status.toLowerCase()}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(member.joinedAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {member.lastActive ? formatDate(member.lastActive) : 'Never'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => openActionModal(member, 'role')}
                          className="text-accent-strong hover:text-blue-900 p-1"
                          title="Change role"
                        >
                          <Edit className="w-4 h-4 text-accent-strong" />
                        </button>
                        
                        {member.status === 'ACTIVE' && (
                          <button
                            onClick={() => openActionModal(member, 'suspend')}
                            className="text-accent-strong hover:text-yellow-900 p-1"
                            title="Suspend user"
                          >
                            <UserX className="w-4 h-4 text-accent-strong" />
                          </button>
                        )}
                        
                        {member.status === 'SUSPENDED' && (
                          <button
                            onClick={() => openActionModal(member, 'reactivate')}
                            className="text-accent-strong hover:text-green-900 p-1"
                            title="Reactivate user"
                          >
                            <UserCheck className="w-4 h-4 text-accent-strong" />
                          </button>
                        )}
                        
                        <button
                          onClick={() => openActionModal(member, 'remove')}
                          className="text-accent-strong hover:text-red-900 p-1"
                          title="Remove user"
                        >
                          <Trash2 className="w-4 h-4 text-accent-strong" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Action Modal */}
        {showActionModal && selectedMember && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-2xl rounded-md bg-white/20 backdrop-blur-md">
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  {actionType === 'role' && 'Change User Role'}
                  {actionType === 'suspend' && 'Suspend User'}
                  {actionType === 'reactivate' && 'Reactivate User'}
                  {actionType === 'remove' && 'Remove User'}
                </h3>
                
                <div className="space-y-4">
                  {actionType === 'role' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        New Role
                      </label>
                      <select
                        value={formData.role}
                        onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                        className="w-full border border-gray-300 rounded-md px-3 py-2"
                      >
                        {teamData.roles.map((role) => (
                          <option key={role.id} value={role.id}>
                            {role.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                  
                  {(actionType === 'suspend' || actionType === 'remove') && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Reason
                      </label>
                      <textarea
                        value={formData.reason}
                        onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                        className="w-full border border-gray-300 rounded-md px-3 py-2"
                        rows={3}
                        placeholder="Enter reason..."
                      />
                    </div>
                  )}
                  
                  <div className="flex justify-end space-x-3">
                    <button
                      onClick={() => setShowActionModal(false)}
                      className="px-4 py-2 text-gray-600 hover:text-gray-800"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleAction}
                      className={`px-4 py-2 rounded-md text-white ${
                        actionType === 'remove' ? 'bg-red-600 hover:bg-red-700' :
                        actionType === 'suspend' ? 'bg-yellow-600 hover:bg-yellow-700' :
                        'bg-accent-strong text-white hover:opacity-90'
                      }`}
                    >
                      {actionType === 'role' && 'Update Role'}
                      {actionType === 'suspend' && 'Suspend User'}
                      {actionType === 'reactivate' && 'Reactivate User'}
                      {actionType === 'remove' && 'Remove User'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 