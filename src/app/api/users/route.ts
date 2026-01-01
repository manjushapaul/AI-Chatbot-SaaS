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

    console.log('[Users API] Session user:', session.user.email, 'Tenant ID:', session.user.tenantId);

    // Try to get tenant context, but fallback to session tenantId if available
    let tenant = await getTenantContext();
    
    // If getTenantContext fails, try using tenantId from session
    if (!tenant && session.user.tenantId) {
      console.log('[Users API] Tenant context not found, using session tenantId:', session.user.tenantId);
      // Create a minimal tenant object from session
      tenant = {
        id: session.user.tenantId,
        name: 'Unknown',
        subdomain: '',
      };
    }

    if (!tenant) {
      console.error('[Users API] No tenant found in context or session');
      // Return empty data instead of error to prevent dashboard from breaking
      return NextResponse.json({
        success: true,
        data: {
          users: [],
          stats: {
            totalMembers: 0,
            activeMembers: 0,
            invitedMembers: 0,
            suspendedMembers: 0,
            roles: {},
          },
        },
      });
    }

    console.log('[Users API] Using tenant:', tenant.id);

    try {
      // Get team members and stats
      const [teamMembers, teamStats] = await Promise.all([
        userManagementService.getTeamMembers(tenant.id).catch((error) => {
          console.error('[Users API] Error getting team members:', error);
          return [];
        }),
        userManagementService.getTeamStats(tenant.id).catch((error) => {
          console.error('[Users API] Error getting team stats:', error);
          return {
            totalMembers: 0,
            activeMembers: 0,
            invitedMembers: 0,
            suspendedMembers: 0,
            roles: {},
          };
        }),
      ]);

      // Get additional user data for conversation and API key counts
      const db = createTenantDB(tenant.id);
      const usersWithStats = await Promise.all(
        teamMembers.map(async (user) => {
          try {
            const [conversationCount, apiKeyCount] = await Promise.all([
              db.getConversationCountByUser(user.id).catch(() => 0),
              db.getApiKeyCountByUser(user.id).catch(() => 0),
            ]);

            return {
              id: user.id,
              name: user.name,
              email: user.email,
              role: user.role,
              status: user.status,
              createdAt: user.joinedAt?.toISOString() || new Date().toISOString(),
              lastLogin: user.lastActive?.toISOString() || null,
              conversationCount: conversationCount || 0,
              apiKeyCount: apiKeyCount || 0,
            };
          } catch (userError) {
            console.error(`[Users API] Error processing user ${user.id}:`, userError);
            // Return basic user data without stats
            return {
              id: user.id,
              name: user.name,
              email: user.email,
              role: user.role,
              status: user.status,
              createdAt: user.joinedAt?.toISOString() || new Date().toISOString(),
              lastLogin: user.lastActive?.toISOString() || null,
              conversationCount: 0,
              apiKeyCount: 0,
            };
          }
        })
      );

      return NextResponse.json({
        success: true,
        data: {
          users: usersWithStats,
          stats: teamStats,
        },
      });
    } catch (dbError) {
      console.error('[Users API] Database error:', dbError);
      // Return empty data instead of error
      return NextResponse.json({
        success: true,
        data: {
          users: [],
          stats: {
            totalMembers: 0,
            activeMembers: 0,
            invitedMembers: 0,
            suspendedMembers: 0,
            roles: {},
          },
        },
      });
    }

  } catch (error) {
    console.error('[Users API] Get users API error:', error);
    // Return empty data instead of error to prevent dashboard from breaking
    return NextResponse.json({
      success: true,
      data: {
        users: [],
        stats: {
          totalMembers: 0,
          activeMembers: 0,
          invitedMembers: 0,
          suspendedMembers: 0,
          roles: {},
        },
      },
    });
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