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

    const { planId } = await request.json();
    if (!planId) {
      return NextResponse.json(
        { error: 'Plan ID is required' },
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

    // Free plan doesn't require Stripe checkout
    if (plan.price === 0) {
      return NextResponse.json(
        { error: 'Use downgrade endpoint for free plan' },
        { status: 400 }
      );
    }

    // Get current subscription
    const subscription = await subscriptionService.getSubscription(tenantContext.id);

    // Create or get Stripe customer
    let customerId = subscription?.stripeCustomerId;
    if (!customerId) {
      try {
        const customer = await stripeService.createCustomer(
          session.user.email!,
          tenantContext.name || 'Unknown Tenant',
          { tenantId: tenantContext.id }
        );
        customerId = customer.id;

        // Update subscription with customer ID
        if (subscription) {
          await (prisma as any).subscriptions.update({
            where: { id: subscription.id },
            data: { stripeCustomerId: customerId }
          });
        }
      } catch (error) {
        console.error('Error creating Stripe customer:', error);
        return NextResponse.json(
          { error: 'Failed to create payment customer' },
          { status: 500 }
        );
      }
    }

    // Create checkout session
    const successUrl = new URL('/dashboard', request.url).toString();
    const cancelUrl = new URL('/billing/expired', request.url).toString();

    const checkoutSession = await stripeService.createCheckoutSession(
      customerId,
      plan.stripePriceId!,
      successUrl,
      cancelUrl,
      {
        tenantId: tenantContext.id,
        planId,
        userId: session.user.id,
        reason: 'Trial upgrade'
      }
    );

    return NextResponse.json({
      success: true,
      data: {
        sessionId: checkoutSession.id,
        url: checkoutSession.url,
        planId
      }
    });
  } catch (error) {
    console.error('Error creating upgrade checkout:', error);
    return NextResponse.json(
      { error: 'Failed to create upgrade checkout' },
      { status: 500 }
    );
  }
}








