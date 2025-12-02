import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../lib/auth';
import { subscriptionService } from '@/lib/subscription-service';
import { getTenantContext } from '../../../../lib/tenant';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  let session;
  try {
    // Get session to verify authentication
    session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get tenant ID from session (more reliable)
    const tenantId = session.user.tenantId;
    if (!tenantId) {
      console.error('[API] No tenantId in session');
      return NextResponse.json(
        { error: 'Tenant not found in session' },
        { status: 404 }
      );
    }

    // Get subscription directly from database
    console.log('[API] Fetching subscription for tenantId:', tenantId);
    console.log('[API] Prisma models available:', Object.keys(prisma).filter(k => !k.startsWith('_') && !k.startsWith('$')));
    console.log('[API] prisma.subscriptions type:', typeof (prisma as any).subscriptions);
    
    // Try to access subscriptions model
    let subscription;
    try {
      subscription = await (prisma as any).subscriptions.findUnique({
        where: { tenantId: tenantId }
      });
    } catch (dbError) {
      console.error('[API] Database query error:', dbError);
      console.error('[API] Attempted to call: prisma.subscriptions.findUnique');
      throw dbError;
    }
    
    console.log('[API] Subscription found:', !!subscription);
    if (subscription) {
      console.log('[API] Subscription data:', {
        status: subscription.status,
        trialEndsAt: subscription.trialEndsAt,
        isTrialExpired: subscription.isTrialExpired
      });
    }

    if (!subscription) {
      return NextResponse.json({
        success: true,
        data: {
          isActive: false,
          currentPlan: 'FREE',
          status: 'INACTIVE',
          currentPeriodEnd: new Date().toISOString(),
          cancelAtPeriodEnd: false,
          nextBillingDate: new Date().toISOString(),
          trialEndsAt: null,
          isTrialExpired: false
        }
      });
    }

    // Check if trial is actually expired (server-side check)
    const now = new Date();
    const trialEnd = subscription.trialEndsAt;
    const isExpired = trialEnd ? new Date(trialEnd) <= now : false;
    
    // Update isTrialExpired flag if needed
    if (isExpired && !subscription.isTrialExpired) {
      try {
        await (prisma as any).subscriptions.update({
          where: { id: subscription.id },
          data: { isTrialExpired: true }
        });
        console.log('[API] Updated isTrialExpired flag to true');
      } catch (updateError) {
        console.error('[API] Error updating trial flag:', updateError);
        // Continue even if update fails
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        isActive: subscription.status === 'ACTIVE' && !isExpired,
        currentPlan: subscription.plan,
        status: subscription.status,
        currentPeriodEnd: subscription.currentPeriodEnd?.toISOString() || new Date().toISOString(),
        cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
        nextBillingDate: subscription.currentPeriodEnd?.toISOString() || new Date().toISOString(),
        trialEndsAt: subscription.trialEndsAt?.toISOString() || null,
        isTrialExpired: isExpired || subscription.isTrialExpired || false
      }
    });
  } catch (error) {
    console.error('[API] Error fetching subscription status:', error);
    console.error('[API] Error details:', {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      tenantId: session?.user?.tenantId,
      errorName: error instanceof Error ? error.name : typeof error
    });
    return NextResponse.json(
      { 
        error: 'Failed to fetch subscription status',
        details: error instanceof Error ? error.message : String(error)
      },
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