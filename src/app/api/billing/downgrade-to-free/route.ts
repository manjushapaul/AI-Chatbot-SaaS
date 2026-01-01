import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getTenantContext } from '@/lib/tenant';
import { subscriptionService } from '@/lib/subscription-service';
import { stripeService } from '@/lib/stripe';
import { prisma } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const tenantContext = await getTenantContext();
    if (!tenantContext) {
      return NextResponse.json(
        { error: 'Tenant not found' },
        { status: 404 }
      );
    }

    // Get current subscription
    const subscription = await subscriptionService.getSubscription(tenantContext.id);

    // Cancel Stripe subscription if exists
    if (subscription?.stripeSubscriptionId) {
      try {
        await stripeService.cancelSubscription(subscription.stripeSubscriptionId);
      } catch (error) {
        console.error('Error canceling Stripe subscription:', error);
        // Continue even if Stripe cancellation fails
      }
    }

    // Downgrade to free plan
    const result = await subscriptionService.changePlan({
      tenantId: tenantContext.id,
      newPlanId: 'FREE',
      userId: session.user.id,
      reason: 'Trial expired - downgrade to free'
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.message || 'Failed to downgrade' },
        { status: 400 }
      );
    }

    // Update subscription to mark trial as expired and set to free
    if (subscription) {
      await prisma.subscriptions.update({
        where: { id: subscription.id },
        data: {
          plan: 'FREE',
          status: 'INACTIVE',
          isTrialExpired: true,
          cancelAtPeriodEnd: false,
          updatedAt: new Date()
        }
      });
    }

    // Update tenant plan
    await prisma.tenants.update({
      where: { id: tenantContext.id },
      data: { plan: 'FREE' }
    });

    return NextResponse.json({
      success: true,
      message: 'Successfully downgraded to free plan',
      data: {
        plan: 'FREE',
        effectiveDate: result.effectiveDate
      }
    });
  } catch (error) {
    console.error('Error downgrading to free:', error);
    return NextResponse.json(
      { error: 'Failed to downgrade to free plan' },
      { status: 500 }
    );
  }
}




