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

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') as 'unread' | 'all' | null;
    const limit = parseInt(searchParams.get('limit') || '20');
    const cursor = searchParams.get('cursor') || undefined;
    const category = searchParams.get('category') || undefined;

    const tenantDB = createTenantDB(session.user.tenantId);
    const result = await tenantDB.getUserNotifications(session.user.id, {
      status: status || 'all',
      limit,
      cursor,
      category,
    });

    return NextResponse.json({
      success: true,
      data: result.notifications || [],
      unreadCount: result.unreadCount || 0,
      hasMore: result.hasMore || false,
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;
    console.error('Error stack:', errorStack);
    return NextResponse.json(
      { error: 'Internal server error', details: errorMessage },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !session?.user?.tenantId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    
    // Check if this is a test notification
    if (body.test === true) {
      try {
        const tenantDB = createTenantDB(session.user.tenantId);
        const notification = await tenantDB.createNotification({
          userId: session.user.id,
          type: 'SYSTEM',
          title: 'Test Notification',
          message: 'This is a test notification to verify your notification settings are working correctly.',
          category: 'system',
          priority: 'MEDIUM',
          actionUrl: '/dashboard',
        });

        console.log('Test notification created successfully:', notification.id);

        return NextResponse.json({
          success: true,
          message: 'Test notification sent successfully',
        });
      } catch (notifError) {
        console.error('Error creating test notification:', notifError);
        const errorMessage = notifError instanceof Error ? notifError.message : 'Unknown error';
        const errorStack = notifError instanceof Error ? notifError.stack : undefined;
        console.error('Error stack:', errorStack);
        return NextResponse.json(
          { 
            success: false,
            error: 'Failed to create notification',
            details: errorMessage
          },
          { status: 500 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Invalid request' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Create notification error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

