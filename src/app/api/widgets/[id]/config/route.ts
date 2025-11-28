import { NextRequest, NextResponse } from 'next/server';
import { createTenantDB } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const widgetId = params.id;
    
    if (!widgetId) {
      return NextResponse.json(
        { error: 'Widget ID is required' },
        { status: 400 }
      );
    }

    // For public widget access, we need to get the tenant from the widget
    // This is a simplified approach - in production you might want to use subdomain routing
    const response = await fetch(`${request.nextUrl.origin}/api/widgets/${widgetId}/public`);
    
    if (!response.ok) {
      return NextResponse.json(
        { error: 'Widget not found' },
        { status: 404 }
      );
    }

    const widgetData = await response.json();
    
    // Return widget configuration with CORS headers for external embedding
    return NextResponse.json({
      success: true,
      data: {
        id: widgetData.data.id,
        name: widgetData.data.name,
        type: widgetData.data.type,
        config: widgetData.data.config,
        botId: widgetData.data.botId
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
    console.error('Widget config API error:', error);
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