import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../lib/auth';
import { stripeService } from '@/lib/stripe';
import { subscriptionService } from '@/lib/subscription-service';
import { getTenantContext } from '../../../../lib/tenant';

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
    const { planId, successUrl, cancelUrl, reason } = await request.json();

    if (!planId || !successUrl || !cancelUrl) {
      return NextResponse.json(
        { error: 'Missing required fields: planId, successUrl, cancelUrl' },
        { status: 400 }
      );
    }

    // Get plan details
    const plan = stripeService.getPlan(planId);
    if (!plan) {
      return NextResponse.json(
        { error: 'Invalid plan' },
        { status: 400 }
      );
    }

    // Free plan doesn't require Stripe
    if (plan.price === 0) {
      const result = await subscriptionService.changePlan({
        tenantId: tenantContext.id,
        newPlanId: planId,
        userId: session.user.id,
        reason
      });

      if (result.success) {
        return NextResponse.json({
          success: true,
          data: {
            planId,
            message: result.message,
            effectiveDate: result.effectiveDate
          }
        });
      } else {
        return NextResponse.json(
          { error: result.message },
          { status: 400 }
        );
      }
    }

    // Check if plan has Stripe price ID
    if (!plan.stripePriceId) {
      return NextResponse.json(
        { error: 'Plan not configured for payments' },
        { status: 400 }
      );
    }

    // Create or get Stripe customer
    let customerId = tenantContext.id; // Use tenant ID as fallback
    try {
      const customer = await stripeService.createCustomer(
        session.user.email!,
        tenantContext.name || 'Unknown Tenant',
        { tenantId: tenantContext.id }
      );
      customerId = customer.id;
    } catch (error) {
      console.error('Error creating Stripe customer:', error);
      return NextResponse.json(
        { error: 'Failed to create payment customer' },
        { status: 500 }
      );
    }

    // Create checkout session
    const checkoutSession = await stripeService.createCheckoutSession(
      customerId,
      plan.stripePriceId,
      successUrl,
      cancelUrl,
      {
        tenantId: tenantContext.id,
        planId,
        userId: session.user.id,
        reason: reason || 'Plan upgrade'
      }
    );

    return NextResponse.json({
      success: true,
      data: {
        sessionId: checkoutSession.id,
        url: checkoutSession.url,
        planId,
        customerId
      }
    });
  } catch (error) {
    console.error('Error creating subscription:', error);
    return NextResponse.json(
      { error: 'Failed to create subscription' },
      { status: 500 }
    );
  }
} 