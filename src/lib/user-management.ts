import { prisma } from './db';
import { stripeService } from './stripe';

export interface UserRole {
  id: string;
  name: string;
  permissions: string[];
  description: string;
}

export interface TeamMember {
  id: string;
  email: string;
  name: string;
  role: string;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'DELETED';
  joinedAt: Date;
  lastActive?: Date;
}

export interface TeamStats {
  totalMembers: number;
  activeMembers: number;
  invitedMembers: number;
  suspendedMembers: number;
  roles: Record<string, number>;
}

export class UserManagementService {
  /**
   * Get all team members for a tenant
   */
  async getTeamMembers(tenantId: string): Promise<TeamMember[]> {
    try {
      const users = await prisma.user.findMany({
        where: { tenantId },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          status: true,
          createdAt: true,
          updatedAt: true
        },
        orderBy: { createdAt: 'desc' }
      });

      return users.map(user => ({
        id: user.id,
        email: user.email,
        name: user.name || 'Unknown User',
        role: user.role || 'USER',
        status: user.status || 'ACTIVE',
        joinedAt: user.createdAt,
        lastActive: user.updatedAt
      }));
    } catch (error) {
      console.error('Error getting team members:', error);
      throw new Error('Failed to get team members');
    }
  }

  /**
   * Get team statistics
   */
  async getTeamStats(tenantId: string): Promise<TeamStats> {
    try {
      const users = await prisma.user.findMany({
        where: { tenantId },
        select: {
          status: true,
          role: true
        }
      });

      const stats: TeamStats = {
        totalMembers: users.length,
        activeMembers: users.filter(u => u.status === 'ACTIVE').length,
        invitedMembers: 0, // No invited status in current schema
        suspendedMembers: users.filter(u => u.status === 'SUSPENDED').length,
        roles: {}
      };

      // Count users by role
      users.forEach(user => {
        const role = user.role || 'USER';
        stats.roles[role] = (stats.roles[role] || 0) + 1;
      });

      return stats;
    } catch (error) {
      console.error('Error getting team stats:', error);
      throw new Error('Failed to get team statistics');
    }
  }

  /**
   * Update user role
   */
  async updateUserRole(
    tenantId: string,
    userId: string,
    newRole: string,
    updatedBy: string
  ): Promise<void> {
    try {
      // Check if user exists and belongs to tenant
      const user = await prisma.user.findFirst({
        where: { 
          id: userId,
          tenantId 
        }
      });

      if (!user) {
        throw new Error('User not found');
      }

      // Check if updater has permission
      const updater = await prisma.user.findFirst({
        where: { 
          id: updatedBy,
          tenantId 
        }
      });

      if (!updater || !this.canManageUsers(updater.role)) {
        throw new Error('Insufficient permissions');
      }

      // Update user role
      await prisma.user.update({
        where: { id: userId },
        data: { 
          role: newRole as 'SUPER_ADMIN' | 'TENANT_ADMIN' | 'USER' | 'BOT_OPERATOR',
          updatedAt: new Date()
        }
      });
    } catch (error) {
      console.error('Error updating user role:', error);
      throw error;
    }
  }

  /**
   * Suspend user
   */
  async suspendUser(
    tenantId: string,
    userId: string,
    reason: string,
    suspendedBy: string
  ): Promise<void> {
    try {
      // Check if user exists and belongs to tenant
      const user = await prisma.user.findFirst({
        where: { 
          id: userId,
          tenantId 
        }
      });

      if (!user) {
        throw new Error('User not found');
      }

      // Check if suspender has permission
      const suspender = await prisma.user.findFirst({
        where: { 
          id: suspendedBy,
          tenantId 
        }
      });

      if (!suspender || !this.canManageUsers(suspender.role)) {
        throw new Error('Insufficient permissions');
      }

      // Update user status
      await prisma.user.update({
        where: { id: userId },
        data: { 
          status: 'SUSPENDED',
          updatedAt: new Date()
        }
      });
    } catch (error) {
      console.error('Error suspending user:', error);
      throw error;
    }
  }

  /**
   * Reactivate suspended user
   */
  async reactivateUser(
    tenantId: string,
    userId: string,
    reactivatedBy: string
  ): Promise<void> {
    try {
      // Check if user exists and belongs to tenant
      const user = await prisma.user.findFirst({
        where: { 
          id: userId,
          tenantId 
        }
      });

      if (!user) {
        throw new Error('User not found');
      }

      if (user.status !== 'SUSPENDED') {
        throw new Error('User is not suspended');
      }

      // Check if reactivator has permission
      const reactivator = await prisma.user.findFirst({
        where: { 
          id: reactivatedBy,
          tenantId 
        }
      });

      if (!reactivator || !this.canManageUsers(reactivator.role)) {
        throw new Error('Insufficient permissions');
      }

      // Update user status
      await prisma.user.update({
        where: { id: userId },
        data: { 
          status: 'ACTIVE',
          updatedAt: new Date()
        }
      });
    } catch (error) {
      console.error('Error reactivating user:', error);
      throw error;
    }
  }

  /**
   * Remove user from team
   */
  async removeUser(
    tenantId: string,
    userId: string,
    reason: string,
    removedBy: string
  ): Promise<void> {
    try {
      // Check if user exists and belongs to tenant
      const user = await prisma.user.findFirst({
        where: { 
          id: userId,
          tenantId 
        }
      });

      if (!user) {
        throw new Error('User not found');
      }

      // Check if remover has permission
      const remover = await prisma.user.findFirst({
        where: { 
          id: removedBy,
          tenantId 
        }
      });

      if (!remover || !this.canManageUsers(remover.role)) {
        throw new Error('Insufficient permissions');
      }

      // Check if user is the last admin
      if (user.role === 'TENANT_ADMIN') {
        const adminCount = await prisma.user.count({
          where: { 
            tenantId,
            role: 'TENANT_ADMIN',
            status: 'ACTIVE'
          }
        });

        if (adminCount <= 1) {
          throw new Error('Cannot remove the last admin user');
        }
      }

      // Soft delete user
      await prisma.user.update({
        where: { id: userId },
        data: { 
          status: 'DELETED',
          updatedAt: new Date()
        }
      });
    } catch (error) {
      console.error('Error removing user:', error);
      throw error;
    }
  }

  /**
   * Check if tenant can add more users
   */
  async canAddUser(tenantId: string): Promise<{ allowed: boolean; reason?: string }> {
    try {
      const currentUserCount = await prisma.user.count({
        where: { 
          tenantId,
          status: { in: ['ACTIVE'] }
        }
      });

      const tenant = await prisma.tenant.findUnique({
        where: { id: tenantId }
      });

      if (!tenant) {
        return { allowed: false, reason: 'Tenant not found' };
      }

      const plan = stripeService.getPlan(tenant.plan);
      if (!plan) {
        return { allowed: false, reason: 'Invalid plan' };
      }

      const userLimit = plan.limits.users;
      if (userLimit === -1) {
        return { allowed: true }; // Unlimited
      }

      if (currentUserCount >= userLimit) {
        return { 
          allowed: false, 
          reason: `User limit reached (${currentUserCount}/${userLimit})` 
        };
      }

      return { allowed: true };
    } catch (error) {
      console.error('Error checking user limit:', error);
      return { allowed: false, reason: 'Error checking limits' };
    }
  }

  /**
   * Check if user can manage other users
   */
  private canManageUsers(role: string): boolean {
    return ['TENANT_ADMIN', 'SUPER_ADMIN'].includes(role);
  }

  /**
   * Get available roles for the tenant
   */
  async getAvailableRoles(tenantId: string): Promise<UserRole[]> {
    const roles: UserRole[] = [
      {
        id: 'SUPER_ADMIN',
        name: 'Super Admin',
        permissions: ['*'],
        description: 'Full access to all features and settings'
      },
      {
        id: 'TENANT_ADMIN',
        name: 'Tenant Administrator',
        permissions: ['manage_users', 'manage_bots', 'manage_knowledge_bases', 'view_analytics'],
        description: 'Can manage team members and content'
      },
      {
        id: 'BOT_OPERATOR',
        name: 'Bot Operator',
        permissions: ['manage_bots', 'manage_knowledge_bases', 'view_analytics'],
        description: 'Can create and edit bots and knowledge bases'
      },
      {
        id: 'USER',
        name: 'User',
        permissions: ['view_bots', 'view_knowledge_bases', 'view_analytics'],
        description: 'Can view content and analytics'
      }
    ];

    return roles;
  }
}

// Export singleton instance
export const userManagementService = new UserManagementService(); 