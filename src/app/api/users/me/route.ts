import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getTenantContext } from '@/lib/tenant';
import { createTenantDB } from '@/lib/db';
import bcrypt from 'bcryptjs';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tenant = await getTenantContext();
    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 400 });
    }

    const db = createTenantDB(tenant.id);
    const user = await db.getUser(session.user.id || '');
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get user's recent login activity (simplified)
    const loginHistory = [
      {
        date: new Date().toISOString(),
        ip: '127.0.0.1',
        location: 'Local',
        device: 'Web Browser'
      }
    ];

    // Try to get preferences from localStorage (passed via header or stored server-side)
    // For now, we'll use defaults but this could be enhanced to store in DB
    const userSettings = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      preferences: {
        theme: 'system',
        language: 'en',
        timezone: 'UTC',
        notifications: {
          email: true,
          push: true,
          sms: false
        },
        privacy: {
          profileVisibility: 'team',
          activitySharing: true,
          analyticsSharing: true
        }
      },
      security: {
        twoFactorEnabled: false,
        lastPasswordChange: user.updatedAt.toISOString(),
        loginHistory
      }
    };

    return NextResponse.json({
      success: true,
      data: userSettings
    });

  } catch (error) {
    console.error('Get user settings API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tenant = await getTenantContext();
    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 400 });
    }

    const { name, email, timezone, language } = await request.json();

    const db = createTenantDB(tenant.id);
    
    // Update user profile
    const updatedUser = await db.updateUser(session.user.id || '', {
      name: name || undefined
    });

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully',
      data: updatedUser
    });

  } catch (error) {
    console.error('Update user settings API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tenant = await getTenantContext();
    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 400 });
    }

    const db = createTenantDB(tenant.id);
    
    // Delete user account
    await db.deleteUser(session.user.id || '');

    return NextResponse.json({
      success: true,
      message: 'Account deleted successfully'
    });

  } catch (error) {
    console.error('Delete user account API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 