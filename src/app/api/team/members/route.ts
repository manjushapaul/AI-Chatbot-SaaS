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

    // Get team members
    const members = await userManagementService.getTeamMembers(tenantContext.id);

    return NextResponse.json({
      success: true,
      data: members
    });
  } catch (error) {
    console.error('Error getting team members:', error);
    return NextResponse.json(
      { error: 'Failed to get team members' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
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

    const { action, userId, ...data } = await request.json();

    switch (action) {
      case 'update_role':
        if (!userId || !data.role) {
          return NextResponse.json(
            { error: 'User ID and role are required' },
            { status: 400 }
          );
        }
        
        await userManagementService.updateUserRole(
          tenantContext.id,
          userId,
          data.role,
          session.user.id
        );
        break;

      case 'suspend_user':
        if (!userId || !data.reason) {
          return NextResponse.json(
            { error: 'User ID and reason are required' },
            { status: 400 }
          );
        }
        
        await userManagementService.suspendUser(
          tenantContext.id,
          userId,
          data.reason,
          session.user.id
        );
        break;

      case 'reactivate_user':
        if (!userId) {
          return NextResponse.json(
            { error: 'User ID is required' },
            { status: 400 }
          );
        }
        
        await userManagementService.reactivateUser(
          tenantContext.id,
          userId,
          session.user.id
        );
        break;

      case 'remove_user':
        if (!userId || !data.reason) {
          return NextResponse.json(
            { error: 'User ID and reason are required' },
            { status: 400 }
          );
        }
        
        await userManagementService.removeUser(
          tenantContext.id,
          userId,
          data.reason,
          session.user.id
        );
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      message: 'Action completed successfully'
    });
  } catch (error) {
    console.error('Error performing team action:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to perform action' },
      { status: 500 }
    );
  }
} 