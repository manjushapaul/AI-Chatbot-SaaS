import { NextRequest, NextResponse } from 'next/server';
import { stripeService } from '@/lib/stripe';
import { prisma } from '@/lib/db';

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json(
      { error: 'Missing stripe-signature header' },
      { status: 400 }
    );
  }

  try {
    // Verify webhook signature
    const event = stripeService.verifyWebhookSignature(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );

    // Handle different event types
    switch (event.type) {
      case 'customer.subscription.created':
        await handleSubscriptionCreated(event.data.object);
        break;

      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object);
        break;

      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(event.data.object);
        break;

      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object);
        break;

      case 'customer.subscription.trial_will_end':
        await handleTrialWillEnd(event.data.object);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook signature verification failed:', error);
    return NextResponse.json(
      { error: 'Webhook signature verification failed' },
      { status: 400 }
    );
  }
}

async function handleSubscriptionCreated(subscription: any) {
  try {
    const tenantId = subscription.metadata.tenantId;
    if (!tenantId) {
      console.error('No tenant ID in subscription metadata');
      return;
    }

    // Get plan from price ID
    const planId = await getPlanIdFromPriceId(subscription.items.data[0].price.id);
    
    // Create or update subscription record
    await prisma.subscription.upsert({
      where: { tenantId },
      update: {
        plan: planId,
        stripeSubscriptionId: subscription.id,
        stripeCustomerId: subscription.customer,
        stripePriceId: subscription.items.data[0].price.id,
        status: subscription.status.toUpperCase(),
        currentPeriodStart: new Date(subscription.current_period_start * 1000),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
        updatedAt: new Date()
      },
      create: {
        tenantId,
        plan: planId,
        stripeSubscriptionId: subscription.id,
        stripeCustomerId: subscription.customer,
        stripePriceId: subscription.items.data[0].price.id,
        status: subscription.status.toUpperCase(),
        currentPeriodStart: new Date(subscription.current_period_start * 1000),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        cancelAtPeriodEnd: subscription.cancel_at_period_end
      }
    });

    // Update tenant plan
    await prisma.tenant.update({
      where: { id: tenantId },
      data: { plan: planId }
    });

    console.log(`Subscription created for tenant ${tenantId}, plan ${planId}`);
  } catch (error) {
    console.error('Error handling subscription created:', error);
  }
}

async function handleSubscriptionUpdated(subscription: any) {
  try {
    const tenantId = subscription.metadata.tenantId;
    if (!tenantId) {
      console.error('No tenant ID in subscription metadata');
      return;
    }

    // Get plan from price ID
    const planId = await getPlanIdFromPriceId(subscription.items.data[0].price.id);

    // Update subscription record
    await prisma.subscription.updateMany({
      where: { tenantId },
      data: {
        plan: planId,
        status: subscription.status.toUpperCase(),
        currentPeriodStart: new Date(subscription.current_period_start * 1000),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
        updatedAt: new Date()
      }
    });

    // Update tenant plan
    await prisma.tenant.update({
      where: { id: tenantId },
      data: { plan: planId }
    });

    console.log(`Subscription updated for tenant ${tenantId}, plan ${planId}`);
  } catch (error) {
    console.error('Error handling subscription updated:', error);
  }
}

async function handleSubscriptionDeleted(subscription: any) {
  try {
    const tenantId = subscription.metadata.tenantId;
    if (!tenantId) {
      console.error('No tenant ID in subscription metadata');
      return;
    }

    // Update subscription record
    await prisma.subscription.updateMany({
      where: { tenantId },
      data: {
        status: 'CANCELED',
        cancelAtPeriodEnd: true,
        updatedAt: new Date()
      }
    });

    // Reset tenant to free plan
    await prisma.tenant.update({
      where: { id: tenantId },
      data: { plan: 'FREE' }
    });

    console.log(`Subscription deleted for tenant ${tenantId}`);
  } catch (error) {
    console.error('Error handling subscription deleted:', error);
  }
}

async function handlePaymentSucceeded(invoice: any) {
  try {
    const tenantId = invoice.subscription?.metadata?.tenantId;
    if (!tenantId) {
      console.error('No tenant ID in invoice metadata');
      return;
    }

    // Record successful payment in billing history
    await prisma.billingHistory.create({
      data: {
        tenantId,
        invoiceNumber: invoice.number || `INV_${Date.now()}`,
        amount: invoice.amount_paid / 100, // Convert from cents
        currency: invoice.currency.toUpperCase(),
        status: 'PAID',
        billingPeriodStart: new Date(invoice.period_start * 1000),
        billingPeriodEnd: new Date(invoice.period_end * 1000),
        plan: 'FREE', // This should be updated to actual plan
        stripeInvoiceId: invoice.id,
        stripePaymentIntentId: invoice.payment_intent,
        description: `Payment for ${invoice.description || 'subscription'}`,
        metadata: {
          invoiceId: invoice.id,
          subscriptionId: invoice.subscription,
          amountPaid: invoice.amount_paid,
          currency: invoice.currency
        }
      }
    });

    console.log(`Payment succeeded for tenant ${tenantId}`);
  } catch (error) {
    console.error('Error handling payment succeeded:', error);
  }
}

async function handlePaymentFailed(invoice: any) {
  try {
    const tenantId = invoice.subscription?.metadata?.tenantId;
    if (!tenantId) {
      console.error('No tenant ID in invoice metadata');
      return;
    }

    // Record failed payment in billing history
    await prisma.billingHistory.create({
      data: {
        tenantId,
        invoiceNumber: invoice.number || `INV_${Date.now()}`,
        amount: invoice.amount_due / 100, // Convert from cents
        currency: invoice.currency.toUpperCase(),
        status: 'FAILED',
        billingPeriodStart: new Date(invoice.period_start * 1000),
        billingPeriodEnd: new Date(invoice.period_end * 1000),
        plan: 'FREE', // This should be updated to actual plan
        stripeInvoiceId: invoice.id,
        description: `Failed payment for ${invoice.description || 'subscription'}`,
        metadata: {
          invoiceId: invoice.id,
          subscriptionId: invoice.subscription,
          amountDue: invoice.amount_due,
          currency: invoice.currency,
          failureReason: invoice.last_payment_error?.message
        }
      }
    });

    console.log(`Payment failed for tenant ${tenantId}`);
  } catch (error) {
    console.error('Error handling payment failed:', error);
  }
}

async function handleTrialWillEnd(subscription: any) {
  try {
    const tenantId = subscription.metadata.tenantId;
    if (!tenantId) {
      console.error('No tenant ID in subscription metadata');
      return;
    }

    console.log(`Trial will end for tenant ${tenantId}`);
    // You could send an email notification here
  } catch (error) {
    console.error('Error handling trial will end:', error);
  }
}

async function getPlanIdFromPriceId(priceId: string): Promise<string> {
  // This is a simplified mapping - in production, you'd want to store this in a config
  const priceMappings: Record<string, string> = {
    [process.env.STRIPE_STARTER_PRICE_ID || '']: 'STARTER',
    [process.env.STRIPE_PROFESSIONAL_PRICE_ID || '']: 'PROFESSIONAL',
    [process.env.STRIPE_ENTERPRISE_PRICE_ID || '']: 'ENTERPRISE'
  };

  return priceMappings[priceId] || 'FREE';
} 