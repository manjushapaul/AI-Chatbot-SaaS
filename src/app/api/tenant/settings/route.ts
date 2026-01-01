import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getTenantContext } from '@/lib/tenant';
import { prisma } from '@/lib/db';

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

    // Get tenant settings
    const tenantSettings = {
      id: tenant.id,
      name: tenant.name,
      subdomain: tenant.subdomain,
      customDomain: tenant.customDomain,
      branding: {
        logo: undefined,
        primaryColor: '#3B82F6',
        companyName: tenant.name,
        supportEmail: `support@${tenant.subdomain}.example.com`
      },
      integrations: {
        slack: undefined,
        discord: undefined,
        webhook: undefined
      },
      limits: {
        maxUsers: 10,
        maxBots: 5,
        maxStorage: 1000, // MB
        maxApiCalls: 10000
      }
    };

    return NextResponse.json({
      success: true,
      data: tenantSettings
    });

  } catch (error) {
    console.error('Get tenant settings API error:', error);
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

    // Check if user has permission to update tenant settings
    if (session.user.role !== 'TENANT_ADMIN' && session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const { name, customDomain, branding } = await request.json();

    // Update tenant settings
    const updatedTenant = await prisma.tenants.update({
      where: { id: tenant.id },
      data: {
        name: name || undefined,
        customDomain: customDomain || undefined
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Tenant settings updated successfully',
      data: updatedTenant
    });

  } catch (error) {
    console.error('Update tenant settings API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 