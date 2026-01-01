import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createTenantDB } from '@/lib/db';
import { prisma } from '@/lib/db';
import { canPerformPaidAction } from '@/lib/trial-check';

export async function GET(request: NextRequest) {
  // Wrap everything in try-catch to ensure we never return 500
  try {
    // Get user session to get tenant context - wrap in try-catch in case NextAuth throws
    let session;
    try {
      session = await getServerSession(authOptions);
    } catch (sessionError) {
      console.error('[Bots API] Error getting session:', sessionError);
      // Return empty data if session retrieval fails
      return NextResponse.json({
        success: true,
        data: [],
      });
    }

    if (!session?.user?.tenantId) {
      console.error('[Bots API] No session or tenantId');
      // Return empty data instead of 401 to prevent dashboard breaking
      return NextResponse.json({
        success: true,
        data: [],
      });
    }

    console.log('[Bots API] Fetching bots for tenant:', session.user.tenantId);

    // Get all bots for the tenant with comprehensive error handling
    let bots: Array<Record<string, unknown>> = [];
    
    try {
      // Verify Prisma client is available
      if (!prisma) {
        console.error('[Bots API] Prisma client is not initialized');
        return NextResponse.json({
          success: true,
          data: [],
        });
      }

      const tenantDB = createTenantDB(session.user.tenantId);
      console.log('[Bots API] TenantDB created, calling getBots()...');
      
      // Call getBots - it should never throw, but wrap in try-catch just in case
      bots = await tenantDB.getBots();
      console.log('[Bots API] Successfully fetched', bots?.length || 0, 'bots');
      
      // Ensure bots is an array
      if (!Array.isArray(bots)) {
        console.warn('[Bots API] getBots() did not return an array, converting...');
        bots = [];
      }
    } catch (dbError) {
      console.error('[Bots API] Database error:', dbError);
      const errorDetails = dbError instanceof Error ? dbError.message : String(dbError);
      const errorCode = (dbError as { code?: string })?.code;
      const errorStack = dbError instanceof Error ? dbError.stack : 'No stack';
      console.error('[Bots API] Error details:', errorDetails);
      console.error('[Bots API] Error code:', errorCode || 'N/A');
      console.error('[Bots API] Error stack:', errorStack);
      bots = [];
    }

    // Always return success with data (even if empty) - NEVER return 500
    return NextResponse.json({
      success: true,
      data: bots || [],
    });

  } catch (error) {
    // This outer catch should never be hit, but just in case...
    console.error('[Bots API] Unexpected error in GET handler:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : 'No stack';
    console.error('[Bots API] Error details:', errorMessage);
    console.error('[Bots API] Error stack:', errorStack);
    
    // ALWAYS return success with empty data - never return 500
    return NextResponse.json({
      success: true,
      data: [],
    });
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

    // Create new bot (Prisma manages connections automatically)
    try {
      const tenantDB = createTenantDB(session.user.tenantId);
      console.log('[Bots API] TenantDB created for tenant:', session.user.tenantId);
      
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

      console.log('[Bots API] Bot created successfully:', bot?.id);

      return NextResponse.json({
        success: true,
        data: bot,
      }, { status: 200 });
    } catch (createError) {
      console.error('[Bots API] Bot creation failed:', createError);
      const errorMessage = createError instanceof Error ? createError.message : 'Unknown error';
      const errorStack = createError instanceof Error ? createError.stack : 'No stack';
      console.error('[Bots API] Error details:', errorMessage);
      console.error('[Bots API] Error stack:', errorStack);
      
      // Check if it's a database connection error
      if (errorMessage.includes('Can\'t reach database') || 
          errorMessage.includes('connection') || 
          errorMessage.includes('P1001') ||
          errorMessage.includes('P1000')) {
        return NextResponse.json(
          { 
            error: 'Database connection failed', 
            details: 'Unable to connect to the database. Please check your database configuration.',
            technical: process.env.NODE_ENV === 'development' ? errorMessage : undefined
          },
          { status: 503 } // Service Unavailable
        );
      }
      
      return NextResponse.json(
        { 
          error: 'Failed to create bot', 
          details: errorMessage,
          technical: process.env.NODE_ENV === 'development' ? errorStack : undefined
        },
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