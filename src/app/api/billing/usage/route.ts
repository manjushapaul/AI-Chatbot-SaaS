import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../lib/auth';
import { planLimitsService } from '../../../../lib/plan-limits';
import { getTenantContext } from '../../../../lib/tenant';

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

    // Get comprehensive usage check
    const usageCheck = await planLimitsService.getUsageCheck(tenantContext.id);

    // Get upgrade recommendations
    const recommendations = planLimitsService.getUpgradeRecommendations(tenantContext.id, usageCheck);

    return NextResponse.json({
      success: true,
      data: {
        usage: usageCheck,
        recommendations,
        lastUpdated: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error fetching usage:', error);
    return NextResponse.json(
      { error: 'Failed to fetch usage information' },
      { status: 500 }
    );
  }
} 