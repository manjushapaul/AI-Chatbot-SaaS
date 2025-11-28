import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createTenantDB } from '@/lib/db';
import { getTenantContext } from '@/lib/tenant';

export async function GET(
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

    const { id: botId } = await params;
    const db = createTenantDB(tenant.id);
    const bot = await db.getBot(botId);

    if (!bot) {
      return NextResponse.json(
        { error: 'Bot not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: bot,
    });

  } catch (error) {
    console.error('Get bot API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get user session to get tenant context
    const session = await getServerSession(authOptions);
    if (!session?.user?.tenantId) {
      return NextResponse.json(
        { error: 'User not authenticated or tenant not found' },
        { status: 401 }
      );
    }

    const botId = params.id;
    console.log('Deleting bot:', botId, 'for tenant:', session.user.tenantId);

    // Delete bot for the tenant
    const tenantDB = createTenantDB(session.user.tenantId);
    await tenantDB.deleteBot(botId);

    return NextResponse.json({
      success: true,
      message: 'Bot deleted successfully',
    });

  } catch (error) {
    console.error('Delete bot API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

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

    const { id: botId } = await params;
    const { name, description, personality, model, temperature, maxTokens } = await request.json();

    const db = createTenantDB(tenant.id);
    await db.updateBot(botId, { name, description, personality, model, temperature, maxTokens });

    return NextResponse.json({
      success: true,
      message: 'Bot updated successfully',
    });

  } catch (error) {
    console.error('Update bot API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 