import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getTenantContext } from '@/lib/tenant';
import { userManagementService } from '@/lib/user-management';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tenant = await getTenantContext();
    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 400 });
    }

    const { id } = await params;
    const { action, ...data } = await request.json();

    switch (action) {
      case 'updateRole':
        await userManagementService.updateUserRole(
          tenant.id,
          id,
          data.role,
          session.user.id || ''
        );
        break;

      case 'suspend':
        await userManagementService.suspendUser(
          tenant.id,
          id,
          data.reason || 'No reason provided',
          session.user.id || ''
        );
        break;

      case 'reactivate':
        await userManagementService.reactivateUser(
          tenant.id,
          id,
          session.user.id || ''
        );
        break;

      case 'remove':
        await userManagementService.removeUser(
          tenant.id,
          id,
          data.reason || 'No reason provided',
          session.user.id || ''
        );
        break;

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: `User ${action} completed successfully`
    });

  } catch (error) {
    console.error('Update user API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tenant = await getTenantContext();
    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 400 });
    }

    const { id } = await params;

    const { reason } = await request.json();

    await userManagementService.removeUser(
      tenant.id,
      id,
      reason || 'No reason provided',
      session.user.id || ''
    );

    return NextResponse.json({
      success: true,
      message: 'User removed successfully'
    });

  } catch (error) {
    console.error('Delete user API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
} 