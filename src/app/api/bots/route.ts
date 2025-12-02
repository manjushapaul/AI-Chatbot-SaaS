import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createTenantDB } from '@/lib/db';
import { prisma } from '@/lib/db';
import { canPerformPaidAction } from '@/lib/trial-check';

export async function GET(request: NextRequest) {
  try {
    // Get user session to get tenant context
    const session = await getServerSession(authOptions);
    if (!session?.user?.tenantId) {
      return NextResponse.json(
        { error: 'User not authenticated or tenant not found' },
        { status: 401 }
      );
    }

    // Get all bots for the tenant
    const tenantDB = createTenantDB(session.user.tenantId);
    const bots = await tenantDB.getBots();

    return NextResponse.json({
      success: true,
      data: bots,
    });

  } catch (error) {
    console.error('Get bots API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get user session to get tenant context
    const session = await getServerSession(authOptions);
    if (!session?.user?.tenantId) {
      console.error('User not authenticated or tenant not found');
      return NextResponse.json(
        { error: 'User not authenticated or tenant not found' },
        { status: 401 }
      );
    }

    console.log('Creating bot for tenant:', session.user.tenantId);

    // Parse request body
    const {
      name,
      description,
      avatar,
      personality,
      model,
      temperature,
      maxTokens,
      status,
    } = await request.json();

    console.log('Bot creation data:', { name, description, avatar, personality, model, temperature, maxTokens, status });

    if (!name) {
      return NextResponse.json(
        { error: 'Bot name is required' },
        { status: 400 }
      );
    }

    // Check if trial expired
    const canPerform = await canPerformPaidAction(session.user.tenantId);
    if (!canPerform.allowed) {
      return NextResponse.json(
        { error: canPerform.reason || 'Trial expired. Please upgrade to continue.' },
        { status: 403 }
      );
    }

    // Test database connection first
    try {
      console.log('Testing database connection...');
      await prisma.$connect();
      console.log('Database connection successful');
    } catch (dbError) {
      console.error('Database connection failed:', dbError);
      return NextResponse.json(
        { error: 'Database connection failed', details: dbError instanceof Error ? dbError.message : 'Unknown error' },
        { status: 500 }
      );
    }

    // Create new bot
    try {
      const tenantDB = createTenantDB(session.user.tenantId);
      console.log('TenantDB created for tenant:', session.user.tenantId);
      
      const bot = await tenantDB.createBot({
        name,
        description,
        avatar,
        personality,
        model,
        temperature,
        maxTokens,
        status,
      });

      console.log('Bot created successfully:', bot);

      return NextResponse.json({
        success: true,
        data: bot,
      }, { status: 200 });
    } catch (createError) {
      console.error('Bot creation failed:', createError);
      return NextResponse.json(
        { error: 'Failed to create bot', details: createError instanceof Error ? createError.message : 'Unknown error' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Create bot API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 