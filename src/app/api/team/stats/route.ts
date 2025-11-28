import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { userManagementService } from '@/lib/user-management';
import { getTenantContext } from '@/lib/tenant';

export async function GET(request: NextRequest) {
  try {
    // Get session to verify authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get tenant context
    const tenantContext = await getTenantContext();
    if (!tenantContext) {
      return NextResponse.json(
        { error: 'Tenant not found' },
        { status: 404 }
      );
    }

    // Get team statistics
    const stats = await userManagementService.getTeamStats(tenantContext.id);
    
    // Get available roles
    const roles = await userManagementService.getAvailableRoles(tenantContext.id);
    
    // Check if can add more users
    const canAddUser = await userManagementService.canAddUser(tenantContext.id);

    return NextResponse.json({
      success: true,
      data: {
        stats,
        roles,
        canAddUser
      }
    });
  } catch (error) {
    console.error('Error getting team stats:', error);
    return NextResponse.json(
      { error: 'Failed to get team statistics' },
      { status: 500 }
    );
  }
} 