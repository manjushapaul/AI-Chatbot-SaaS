'use client';

import { useState, useEffect } from 'react';
import { Users, UserPlus, Shield, Mail, Calendar, Edit, Trash2, UserCheck, UserX, Key, Search, Settings } from 'lucide-react';
import { AppPage } from '@/components/dashboard/AppPage';
import { ToolbarCard } from '@/components/dashboard/ToolbarCard';
import { SectionCard } from '@/components/dashboard/SectionCard';
import { typography, spacing, cardBase, cardPadding } from '@/lib/design-tokens';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'SUPER_ADMIN' | 'TENANT_ADMIN' | 'USER' | 'BOT_OPERATOR';
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  createdAt: string;
  lastLogin?: string;
  conversationCount: number;
  apiKeyCount: number;
}

interface InviteData {
  email: string;
  name: string;
  role: 'TENANT_ADMIN' | 'USER' | 'BOT_OPERATOR';
}

interface EditUserData {
  id: string;
  name: string;
  role: 'SUPER_ADMIN' | 'TENANT_ADMIN' | 'USER' | 'BOT_OPERATOR';
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
}

const roleLabels = {
  SUPER_ADMIN: 'Super Admin',
  TENANT_ADMIN: 'Tenant Admin',
  USER: 'User',
  BOT_OPERATOR: 'Bot Operator'
};

export default function UsersPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showSuspendModal, setShowSuspendModal] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<any>({});
  const [isLoading, setIsLoading] = useState(true);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [inviteData, setInviteData] = useState<InviteData>({
    email: '',
    name: '',
    role: 'USER'
  });
  const [editData, setEditData] = useState<EditUserData>({
    id: '',
    name: '',
    role: 'USER',
    status: 'ACTIVE'
  });
  const [suspendReason, setSuspendReason] = useState('');
  const [deleteReason, setDeleteReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch users on component mount
  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/users');
      if (response.ok) {
        const data = await response.json();
        setUsers(data.data.users || []);
        setStats(data.data.stats || {});
      } else {
        console.error('Failed to fetch users:', response.statusText);
        setUsers([]);
        setStats({});
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
      setUsers([]);
      setStats({});
    } finally {
      setIsLoading(false);
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
    return matchesSearch && matchesRole && matchesStatus;
  });

  const handleInviteUser = async () => {
    if (!inviteData.email || !inviteData.name) {
      setError('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(inviteData)
      });

      if (response.ok) {
        setSuccess('User invitation sent successfully!');
        setShowInviteModal(false);
        setInviteData({ email: '', name: '', role: 'USER' });
        fetchUsers();
      } else {
        const result = await response.json();
        setError(result.error || 'Failed to send invitation');
      }
    } catch (error) {
      setError('Failed to send invitation');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditUser = async () => {
    if (!editData.name) {
      setError('Name is required');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/users/${editData.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'updateRole',
          role: editData.role
        })
      });

      if (response.ok) {
        setSuccess('User updated successfully!');
        setShowEditModal(false);
        setSelectedUser(null);
        fetchUsers();
      } else {
        const result = await response.json();
        setError(result.error || 'Failed to update user');
      }
    } catch (error) {
      setError('Failed to update user');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSuspendUser = async () => {
    if (!suspendReason.trim()) {
      setError('Please provide a reason for suspension');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/users/${selectedUser?.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'suspend',
          reason: suspendReason
        })
      });

      if (response.ok) {
        setSuccess('User suspended successfully!');
        setShowSuspendModal(false);
        setSelectedUser(null);
        setSuspendReason('');
        fetchUsers();
      } else {
        const result = await response.json();
        setError(result.error || 'Failed to suspend user');
      }
    } catch (error) {
      setError('Failed to suspend user');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReactivateUser = async (userId: string) => {
    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'reactivate'
        })
      });

      if (response.ok) {
        setSuccess('User reactivated successfully!');
        fetchUsers();
      } else {
        const result = await response.json();
        setError(result.error || 'Failed to reactivate user');
      }
    } catch (error) {
      setError('Failed to reactivate user');
    }
  };

  const handleDeleteUser = async () => {
    if (!deleteReason.trim()) {
      setError('Please provide a reason for removal');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/users/${selectedUser?.id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reason: deleteReason
        })
      });

      if (response.ok) {
        setSuccess('User removed successfully!');
        setShowDeleteModal(false);
        setSelectedUser(null);
        setDeleteReason('');
        fetchUsers();
      } else {
        const result = await response.json();
        setError(result.error || 'Failed to remove user');
      }
    } catch (error) {
      setError('Failed to remove user');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditModal = (user: User) => {
    setEditData({
      id: user.id,
      name: user.name,
      role: user.role,
      status: user.status
    });
    setShowEditModal(true);
  };

  const openSuspendModal = (user: User) => {
    setSelectedUser(user);
    setShowSuspendModal(true);
  };

  const openDeleteModal = (user: User) => {
    setSelectedUser(user);
    setShowDeleteModal(true);
  };

  const closeModals = () => {
    setShowInviteModal(false);
    setShowEditModal(false);
    setShowDeleteModal(false);
    setShowSuspendModal(false);
    setSelectedUser(null);
    setInviteData({ email: '', name: '', role: 'USER' });
    setEditData({ id: '', name: '', role: 'USER', status: 'ACTIVE' });
    setSuspendReason('');
    setDeleteReason('');
    setError(null);
  };

  // Clear notifications after 5 seconds
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(null), 5000);
      return () => clearTimeout(timer);
    }
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [success, error]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getRolePill = (role: string) => {
    if (role === 'TENANT_ADMIN') {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-accent-soft/10 px-3 py-1 text-xs font-medium text-[#BE185D]">
          {roleLabels[role as keyof typeof roleLabels]}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">
        {roleLabels[role as keyof typeof roleLabels]}
      </span>
    );
  };

  const getStatusPill = (status: string) => {
    if (status === 'ACTIVE') {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-600">
          {status}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">
        {status}
      </span>
    );
  };

  return (
    <AppPage>
      <div className={spacing.pageBlock}>
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className={typography.pageTitle}>Team Members</h1>
            <p className={typography.pageSubtitle}>Manage your team's access and permissions</p>
          </div>
          <button
            onClick={() => setShowInviteModal(true)}
            className="rounded-full bg-accent-soft text-white text-sm font-medium px-5 py-2 shadow hover:bg-accent-soft/80 transition-colors flex items-center space-x-2"
          >
            <UserPlus className="w-4 h-4 text-white" />
            <span>Invite Member</span>
          </button>
        </div>

        {/* Success Message */}
        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
            <strong>Success:</strong> {success}
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            <strong>Error:</strong> {error}
          </div>
        )}

        {/* Stats Cards */}
        <div className={`grid grid-cols-1 gap-5 md:grid-cols-4`}>
          <div className={`${cardBase} ${cardPadding.default}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={typography.sectionTitle}>Total Members</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalMembers || 0}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-gray-700" />
              </div>
            </div>
          </div>

          <div className={`${cardBase} ${cardPadding.default}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={typography.sectionTitle}>Active Users</p>
                <p className="text-2xl font-bold text-gray-900">{stats.activeUsers || 0}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <UserCheck className="w-6 h-6 text-gray-700" />
              </div>
            </div>
          </div>

          <div className={`${cardBase} ${cardPadding.default}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={typography.sectionTitle}>Admins</p>
                <p className="text-2xl font-bold text-gray-900">{stats.admins || 0}</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Shield className="w-6 h-6 text-gray-700" />
              </div>
            </div>
          </div>

          <div className={`${cardBase} ${cardPadding.default}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={typography.sectionTitle}>Bot Operators</p>
                <p className="text-2xl font-bold text-gray-900">{stats.botOperators || 0}</p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <Key className="w-6 h-6 text-gray-700" />
              </div>
            </div>
          </div>
        </div>

        {/* Search + Filters Toolbar */}
        <ToolbarCard>
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder="Search users by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-300 focus:border-transparent bg-white/50 text-gray-900 placeholder:text-gray-400 text-sm"
            />
          </div>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-300 focus:border-transparent bg-white/50 text-gray-700 text-sm"
          >
            <option value="all">All Roles</option>
            <option value="SUPER_ADMIN">Super Admin</option>
            <option value="TENANT_ADMIN">Tenant Admin</option>
            <option value="USER">User</option>
            <option value="BOT_OPERATOR">Bot Operator</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-300 focus:border-transparent bg-white/50 text-gray-700 text-sm"
          >
            <option value="all">All Status</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
            <option value="SUSPENDED">Suspended</option>
          </select>
        </ToolbarCard>

        {/* Members Table */}
        <SectionCard title="Team Members">
          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-600 mx-auto mb-4"></div>
              <p className={typography.body}>Loading team members...</p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className={`${typography.sectionTitle} mb-2`}>No users found</h3>
              <p className={typography.meta}>
                {searchTerm || roleFilter !== 'all' || statusFilter !== 'all'
                  ? 'Try adjusting your search or filters'
                  : 'Get started by inviting your first team member'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b border-white/80">
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">User</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Role</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Status</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Activity</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Joined</th>
                    <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100/70">
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-white/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-gray-700 font-medium text-sm">
                              {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                            </span>
                          </div>
                          <div className="min-w-0">
                            <div className={`${typography.body} font-medium truncate`}>{user.name}</div>
                            <div className={`${typography.meta} flex items-center gap-1`}>
                              <Mail className="w-3 h-3" />
                              <span className="truncate">{user.email}</span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {getRolePill(user.role)}
                      </td>
                      <td className="px-6 py-4">
                        {getStatusPill(user.status)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <div className={typography.meta}>
                            {user.conversationCount} conversations
                          </div>
                          <div className={typography.meta}>
                            {user.apiKeyCount} API keys
                          </div>
                          {user.lastLogin && (
                            <div className={`${typography.meta} flex items-center gap-1`}>
                              <Calendar className="w-3 h-3" />
                              <span>Last: {formatDate(user.lastLogin)}</span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className={`px-6 py-4 ${typography.meta}`}>
                        {formatDate(user.createdAt)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2 text-gray-400">
                          <button 
                            onClick={() => openEditModal(user)}
                            className="p-1.5 hover:bg-gray-100 rounded-full transition-colors text-gray-600 hover:text-gray-900"
                            title="Edit User"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => openEditModal(user)}
                            className="p-1.5 hover:bg-gray-100 rounded-full transition-colors text-gray-600 hover:text-gray-900"
                            title="Permissions"
                          >
                            <Settings className="w-4 h-4" />
                          </button>
                          {user.status === 'SUSPENDED' ? (
                            <button 
                              onClick={() => handleReactivateUser(user.id)}
                              className="p-1.5 hover:bg-emerald-50 rounded-full transition-colors text-gray-600 hover:text-emerald-600"
                              title="Reactivate User"
                            >
                              <UserCheck className="w-4 h-4" />
                            </button>
                          ) : (
                            <button 
                              onClick={() => openSuspendModal(user)}
                              className="p-1.5 hover:bg-amber-50 rounded-full transition-colors text-gray-600 hover:text-amber-600"
                              title="Suspend User"
                            >
                              <UserX className="w-4 h-4" />
                            </button>
                          )}
                          <button 
                            onClick={() => openDeleteModal(user)}
                            className="p-1.5 hover:bg-red-50 rounded-full transition-colors text-gray-600 hover:text-red-600"
                            title="Remove User"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </SectionCard>

        {/* Invite Modal */}
        {showInviteModal && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white/80 backdrop-blur-xl rounded-lg max-w-md w-full border border-white/60 shadow-2xl">
              <div className="p-6 border-b border-gray-200">
                <h3 className={`${typography.sectionTitle} text-base`}>Invite Team Member</h3>
              </div>
              
              <div className="p-6 space-y-4">
                <div>
                  <label className={`${typography.label} block mb-1`}>Name *</label>
                  <input
                    type="text"
                    value={inviteData.name}
                    onChange={(e) => setInviteData({ ...inviteData, name: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-accent-soft/40 focus:border-accent-soft bg-white/80 text-gray-900 placeholder:text-gray-400 text-sm"
                    placeholder="Enter full name"
                  />
                </div>
                
                <div>
                  <label className={`${typography.label} block mb-1`}>Email *</label>
                  <input
                    type="email"
                    value={inviteData.email}
                    onChange={(e) => setInviteData({ ...inviteData, email: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-accent-soft/40 focus:border-accent-soft bg-white/80 text-gray-900 placeholder:text-gray-400 text-sm"
                    placeholder="Enter email address"
                  />
                </div>
                
                <div>
                  <label className={`${typography.label} block mb-1`}>Role *</label>
                  <select
                    value={inviteData.role}
                    onChange={(e) => setInviteData({ ...inviteData, role: e.target.value as 'TENANT_ADMIN' | 'USER' | 'BOT_OPERATOR' })}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-accent-soft/40 focus:border-accent-soft bg-white/80 text-gray-900 text-sm"
                  >
                    <option value="USER">User</option>
                    <option value="TENANT_ADMIN">Tenant Admin</option>
                    <option value="BOT_OPERATOR">Bot Operator</option>
                  </select>
                </div>
              </div>
              
              <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
                <button
                  onClick={closeModals}
                  className="rounded-full bg-white text-gray-700 border border-gray-200 px-4 py-2 text-sm font-medium hover:bg-gray-50 transition-colors"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button 
                  onClick={handleInviteUser}
                  className="rounded-full bg-accent-soft text-white px-4 py-2 text-sm font-medium shadow hover:bg-accent-soft/80 transition-colors disabled:opacity-50"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Sending...' : 'Send Invite'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit User Modal */}
        {showEditModal && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white/80 backdrop-blur-xl rounded-lg max-w-md w-full border border-white/60 shadow-2xl">
              <div className="p-6 border-b border-gray-200">
                <h3 className={`${typography.sectionTitle} text-base`}>Edit User</h3>
              </div>
              
              <div className="p-6 space-y-4">
                <div>
                  <label className={`${typography.label} block mb-1`}>Name *</label>
                  <input
                    type="text"
                    value={editData.name}
                    onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-accent-soft/40 focus:border-accent-soft bg-white/80 text-gray-900 placeholder:text-gray-400 text-sm"
                  />
                </div>
                
                <div>
                  <label className={`${typography.label} block mb-1`}>Role *</label>
                  <select
                    value={editData.role}
                    onChange={(e) => setEditData({ ...editData, role: e.target.value as 'SUPER_ADMIN' | 'TENANT_ADMIN' | 'USER' | 'BOT_OPERATOR' })}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-accent-soft/40 focus:border-accent-soft bg-white/80 text-gray-900 text-sm"
                  >
                    <option value="USER">User</option>
                    <option value="TENANT_ADMIN">Tenant Admin</option>
                    <option value="BOT_OPERATOR">Bot Operator</option>
                  </select>
                </div>
              </div>
              
              <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
                <button
                  onClick={closeModals}
                  className="rounded-full bg-white text-gray-700 border border-gray-200 px-4 py-2 text-sm font-medium hover:bg-gray-50 transition-colors"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button 
                  onClick={handleEditUser}
                  className="rounded-full bg-accent-soft text-white px-4 py-2 text-sm font-medium shadow hover:bg-accent-soft/80 transition-colors disabled:opacity-50"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Updating...' : 'Update User'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Suspend User Modal */}
        {showSuspendModal && selectedUser && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white/80 backdrop-blur-xl rounded-lg max-w-md w-full border border-white/60 shadow-2xl">
              <div className="p-6 border-b border-gray-200">
                <h3 className={`${typography.sectionTitle} text-base`}>Suspend User</h3>
              </div>
              
              <div className="p-6 space-y-4">
                <p className={typography.body}>
                  Are you sure you want to suspend <strong>{selectedUser.name}</strong>? 
                  They will not be able to access the system until reactivated.
                </p>
                
                <div>
                  <label className={`${typography.label} block mb-1`}>Reason for suspension *</label>
                  <textarea
                    value={suspendReason}
                    onChange={(e) => setSuspendReason(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-accent-soft/40 focus:border-accent-soft bg-white/80 text-gray-900 placeholder:text-gray-400 text-sm"
                    placeholder="Enter reason for suspension"
                    rows={3}
                  />
                </div>
              </div>
              
              <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
                <button
                  onClick={closeModals}
                  className="rounded-full bg-white text-gray-700 border border-gray-200 px-4 py-2 text-sm font-medium hover:bg-gray-50 transition-colors"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button 
                  onClick={handleSuspendUser}
                  className="rounded-full bg-amber-600 text-white px-4 py-2 text-sm font-medium hover:bg-amber-700 transition-colors disabled:opacity-50"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Suspending...' : 'Suspend User'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete User Modal */}
        {showDeleteModal && selectedUser && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white/80 backdrop-blur-xl rounded-lg max-w-md w-full border border-white/60 shadow-2xl">
              <div className="p-6 border-b border-gray-200">
                <h3 className={`${typography.sectionTitle} text-base`}>Remove User</h3>
              </div>
              
              <div className="p-6 space-y-4">
                <p className={typography.body}>
                  Are you sure you want to remove <strong>{selectedUser.name}</strong>? 
                  This action cannot be undone and will permanently delete their account.
                </p>
                
                <div>
                  <label className={`${typography.label} block mb-1`}>Reason for removal *</label>
                  <textarea
                    value={deleteReason}
                    onChange={(e) => setDeleteReason(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-accent-soft/40 focus:border-accent-soft bg-white/80 text-gray-900 placeholder:text-gray-400 text-sm"
                    placeholder="Enter reason for removal"
                    rows={3}
                  />
                </div>
              </div>
              
              <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
                <button
                  onClick={closeModals}
                  className="rounded-full bg-white text-gray-700 border border-gray-200 px-4 py-2 text-sm font-medium hover:bg-gray-50 transition-colors"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button 
                  onClick={handleDeleteUser}
                  className="rounded-full bg-red-600 text-white px-4 py-2 text-sm font-medium hover:bg-red-700 transition-colors disabled:opacity-50"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Removing...' : 'Remove User'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppPage>
  );
}
