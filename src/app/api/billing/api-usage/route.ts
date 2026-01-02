import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../lib/auth';
import { apiUsageService } from '@/lib/api-usage-service';
import { getTenantContext } from '../../../../lib/tenant';

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    // Get session to verify authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get tenant context
    const tenantContext = await getTenantContext();
    if (!tenantContext) {
      return NextResponse.json(
        { error: 'Tenant not found' },
        { status: 404 }
      );
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const timeRange = (searchParams.get('timeRange') as 'day' | 'week' | 'month') || 'month';
    const days = parseInt(searchParams.get('days') || '30');

    // Get comprehensive usage data
    const [
      usageSummary,
      usageTrends,
      topConsumers,
      rateLimitInfo
    ] = await Promise.all([
      apiUsageService.getUsageSummary(tenantContext.id, timeRange),
      apiUsageService.getUsageTrends(tenantContext.id, days),
      apiUsageService.getTopConsumers(tenantContext.id, timeRange),
      apiUsageService.canMakeAPICall(tenantContext.id)
    ]);

    return NextResponse.json({
      success: true,
      data: {
        summary: usageSummary,
        trends: usageTrends,
        topConsumers,
        rateLimit: rateLimitInfo,
        timeRange,
        lastUpdated: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error fetching API usage:', error);
    return NextResponse.json(
      { error: 'Failed to fetch API usage information' },
      { status: 500 }
    );
  }
} 