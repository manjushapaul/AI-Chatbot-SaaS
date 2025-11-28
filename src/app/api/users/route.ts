import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getTenantContext } from '@/lib/tenant';
import { userManagementService } from '@/lib/user-management';
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

    // Get team members and stats
    const [teamMembers, teamStats] = await Promise.all([
      userManagementService.getTeamMembers(tenant.id),
      userManagementService.getTeamStats(tenant.id)
    ]);

    // Get additional user data for conversation and API key counts
    const db = createTenantDB(tenant.id);
    const usersWithStats = await Promise.all(
      teamMembers.map(async (user) => {
        const [conversationCount, apiKeyCount] = await Promise.all([
          db.getConversationCountByUser(user.id),
          db.getApiKeyCountByUser(user.id)
        ]);

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          status: user.status,
          createdAt: user.joinedAt.toISOString(),
          lastLogin: user.lastActive?.toISOString(),
          conversationCount: conversationCount || 0,
          apiKeyCount: apiKeyCount || 0,
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: {
        users: usersWithStats,
        stats: teamStats,
      }
    });

  } catch (error) {
    console.error('Get users API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tenant = await getTenantContext();
    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 400 });
    }

    const { email, name, role } = await request.json();

    if (!email || !name || !role) {
      return NextResponse.json({ 
        error: 'Email, name, and role are required' 
      }, { status: 400 });
    }

    // Check if user can be added
    const canAdd = await userManagementService.canAddUser(tenant.id);
    if (!canAdd.allowed) {
      return NextResponse.json({ 
        error: canAdd.reason || 'Cannot add user' 
      }, { status: 400 });
    }

    // Check if user already exists in this tenant
    const db = createTenantDB(tenant.id);
    const existingUser = await db.getUserByEmail(email);
    
    if (existingUser) {
      return NextResponse.json({ 
        error: 'User with this email already exists' 
      }, { status: 400 });
    }

    // Create new user with temporary password
    const tempPassword = Math.random().toString(36).slice(-8);
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    const newUser = await db.createUser({
      email,
      name,
      password: hashedPassword,
      role,
      status: 'ACTIVE',
      tenantId: tenant.id
    });

    // TODO: Send invitation email with temporary password
    // For now, return the temporary password in the response
    // In production, this should be sent via email

    return NextResponse.json({
      success: true,
      message: 'User created successfully',
      data: { 
        user: {
          id: newUser.id,
          email: newUser.email,
          name: newUser.name,
          role: newUser.role,
          status: newUser.status
        },
        temporaryPassword: tempPassword,
        note: 'Please share this temporary password with the user. They should change it on first login.'
      }
    }, { status: 201 });

  } catch (error) {
    console.error('Create user API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 