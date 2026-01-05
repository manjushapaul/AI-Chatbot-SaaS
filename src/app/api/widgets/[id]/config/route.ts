import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// This is a PUBLIC endpoint - no authentication required
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: widgetId } = await params;
    
    console.log('[Widget Config API] Looking up widget:', widgetId?.substring(0, 8) + '...');
    
    if (!widgetId) {
      return NextResponse.json(
        { error: 'Widget ID is required' },
        { 
          status: 400,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
          }
        }
      );
    }

    // Directly query the database to find the widget
    // This works for public widgets across all tenants
    // NO AUTHENTICATION REQUIRED - this is a public endpoint
    const widget = await prisma.widgets.findFirst({
      where: { 
        id: widgetId,
        status: 'ACTIVE' // Only return active widgets
      },
      include: {
        bots: {
          select: { id: true, name: true },
        },
      },
    });
    
    if (!widget) {
      console.error('[Widget Config API] Widget not found:', widgetId?.substring(0, 8) + '...');
      return NextResponse.json(
        { error: 'Widget not found' },
        { 
          status: 404,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
          }
        }
      );
    }
    
    console.log('[Widget Config API] Widget found:', { widgetId: widget.id, botId: widget.botId, status: widget.status });
    
    // Return widget configuration with CORS headers for external embedding
    return NextResponse.json({
      success: true,
      data: {
        id: widget.id,
        name: widget.name,
        type: widget.type,
        config: widget.config,
        botId: widget.botId || widget.bots?.id || null
      }
    }, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Cache-Control': 'public, max-age=300' // Cache for 5 minutes
      }
    });

  } catch (error) {
    console.error('[Widget Config API] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;
    console.error('[Widget Config API] Error details:', { message: errorMessage, stack: errorStack });
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
      },
      { 
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        }
      }
    );
  }
}

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
} 