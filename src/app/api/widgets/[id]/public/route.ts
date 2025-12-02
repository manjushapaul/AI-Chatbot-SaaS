import { NextRequest, NextResponse } from 'next/server';
import { createTenantDB } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: widgetId } = await params;
    
    if (!widgetId) {
      return NextResponse.json(
        { error: 'Widget ID is required' },
        { status: 400 }
      );
    }

    // For public widget access, we need to find the widget across all tenants
    // This is a simplified approach - in production you might want to use subdomain routing
    // or public widget IDs with proper tenant isolation
    
    // Get the hostname to determine tenant
    const hostname = request.headers.get('host') || '';
    let tenantId = null;
    
    // Try to extract tenant from subdomain or use a default approach
    if (hostname.includes('localhost') || hostname.includes('127.0.0.1')) {
      // Development environment - use a default tenant
      // In production, you'd want to implement proper tenant resolution
      tenantId = 'default';
    } else {
      // Production - extract tenant from subdomain
      const subdomain = hostname.split('.')[0];
      // You would implement proper tenant lookup here
      tenantId = subdomain;
    }
    
    if (!tenantId) {
      return NextResponse.json(
        { error: 'Tenant not found' },
        { status: 404 }
      );
    }

    // For now, we'll use a direct Prisma query to find the widget
    // In production, you'd want proper tenant isolation
    const { prisma } = await import('@/lib/db');
    
    const widget = await (prisma as any).widgets.findFirst({
      where: { id: widgetId },
      include: {
        bot: {
          select: { name: true, id: true },
        },
        tenant: {
          select: { id: true, name: true },
        },
      },
    });
    
    if (!widget) {
      return NextResponse.json(
        { error: 'Widget not found' },
        { status: 404 }
      );
    }

    // Return public widget data with CORS headers for external embedding
    return NextResponse.json({
      success: true,
      data: {
        id: widget.id,
        name: widget.name,
        type: widget.type,
        config: widget.config,
        botId: widget.botId,
        status: widget.status
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
    console.error('Public widget API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
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