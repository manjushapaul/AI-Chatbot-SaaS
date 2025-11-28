import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getTenantContext } from '@/lib/tenant';
import { createTenantDB } from '@/lib/db';

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

    const { id } = await params;
    const db = createTenantDB(tenant.id);
    const widget = await db.getWidget(id);
    
    if (!widget) {
      return NextResponse.json({ error: 'Widget not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: widget,
    });

  } catch (error) {
    console.error('Widget fetch error:', error);
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

    const { id } = await params;
    const { name, config } = await request.json();

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    const db = createTenantDB(tenant.id);
    
    // Verify widget exists and belongs to tenant
    const existingWidget = await db.getWidget(id);
    if (!existingWidget) {
      return NextResponse.json({ error: 'Widget not found' }, { status: 404 });
    }

    // Update widget
    const updatedWidget = await db.updateWidget(id, {
      name,
      config,
    });

    return NextResponse.json({
      success: true,
      data: updatedWidget,
      message: 'Widget updated successfully'
    });

  } catch (error) {
    console.error('Widget update error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
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

    const { id } = await params;
    const db = createTenantDB(tenant.id);
    
    // Verify widget exists and belongs to tenant
    const existingWidget = await db.getWidget(id);
    if (!existingWidget) {
      return NextResponse.json({ error: 'Widget not found' }, { status: 404 });
    }

    // Delete widget
    await db.deleteWidget(id);

    return NextResponse.json({
      success: true,
      message: 'Widget deleted successfully'
    });

  } catch (error) {
    console.error('Widget deletion error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 