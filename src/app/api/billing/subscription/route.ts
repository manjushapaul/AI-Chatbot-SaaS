import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../lib/auth';
import { subscriptionService } from '@/lib/subscription-service';
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

    // Get subscription status
    const subscriptionStatus = await subscriptionService.getSubscriptionStatus(tenantContext.id);

    return NextResponse.json({
      success: true,
      data: subscriptionStatus
    });
  } catch (error) {
    console.error('Error fetching subscription status:', error);
    return NextResponse.json(
      { error: 'Failed to fetch subscription status' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
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

    // Parse request body
    const { action, planId, reason } = await request.json();

    if (!action) {
      return NextResponse.json(
        { error: 'Action is required' },
        { status: 400 }
      );
    }

    let result;

    switch (action) {
      case 'change_plan':
        if (!planId) {
          return NextResponse.json(
            { error: 'Plan ID is required for plan change' },
            { status: 400 }
          );
        }
        
        result = await subscriptionService.changePlan({
          tenantId: tenantContext.id,
          newPlanId: planId,
          userId: session.user.id,
          reason
        });
        break;

      case 'cancel':
        result = await subscriptionService.cancelSubscription(
          tenantContext.id,
          session.user.id,
          reason
        );
        break;

      case 'reactivate':
        result = await subscriptionService.reactivateSubscription(
          tenantContext.id,
          session.user.id
        );
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }

    if (result && typeof result === 'boolean') {
      // For cancel/reactivate actions
      return NextResponse.json({
        success: result,
        message: result ? 'Action completed successfully' : 'Action failed'
      });
    } else if (result && typeof result === 'object') {
      // For plan change actions
      return NextResponse.json({
        success: result.success,
        data: result
      });
    }

    return NextResponse.json({
      success: false,
      message: 'Action failed'
    });

  } catch (error) {
    console.error('Error processing subscription action:', error);
    return NextResponse.json(
      { error: 'Failed to process subscription action' },
      { status: 500 }
    );
  }
} 