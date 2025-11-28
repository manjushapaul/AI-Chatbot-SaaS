import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createTenantDB } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized - No user session' },
        { status: 401 }
      );
    }

    if (!session?.user?.tenantId) {
      return NextResponse.json(
        { error: 'Unauthorized - No tenant ID' },
        { status: 401 }
      );
    }

    const tenantDB = createTenantDB(session.user.tenantId);
    const preferences = await tenantDB.getNotificationPreferences(session.user.id);

    return NextResponse.json({
      success: true,
      data: preferences || [],
    });
  } catch (error) {
    console.error('Get notification preferences error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;
    console.error('Error stack:', errorStack);
    return NextResponse.json(
      { error: 'Internal server error', details: errorMessage },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !session?.user?.tenantId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { preferences } = body;

    if (!Array.isArray(preferences)) {
      return NextResponse.json(
        { error: 'Preferences must be an array' },
        { status: 400 }
      );
    }

    const tenantDB = createTenantDB(session.user.tenantId);
    await tenantDB.updateNotificationPreferences(session.user.id, preferences);

    return NextResponse.json({
      success: true,
      message: 'Notification preferences updated',
    });
  } catch (error) {
    console.error('Update notification preferences error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

