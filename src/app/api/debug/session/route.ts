import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getTenantContext } from '@/lib/tenant';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const tenantContext = await getTenantContext();

    return NextResponse.json({
      session: {
        user: session?.user ? {
          email: session.user.email,
          name: session.user.name,
          role: session.user.role,
          tenantId: session.user.tenantId,
          tenant: session.user.tenant,
        } : null,
        authenticated: !!session,
      },
      tenantContext: tenantContext,
    });
  } catch (error) {
    console.error('Error getting session debug info:', error);
    return NextResponse.json(
      { error: 'Failed to get session info' },
      { status: 500 }
    );
  }
}



