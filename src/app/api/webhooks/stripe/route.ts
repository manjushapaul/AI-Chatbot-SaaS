import { NextRequest, NextResponse } from 'next/server';
import { stripeService } from '@/lib/stripe';
import { prisma } from '@/lib/db';

// Stripe webhook event types
interface StripeSubscription {
  id: string;
  metadata?: {
    tenantId?: string;
  };
  customer?: string;
  status?: string;
  trial_start?: number;
  trial_end?: number;
  current_period_start?: number;
  current_period_end?: number;
  cancel_at_period_end?: boolean;
  items?: {
    data?: Array<{
      price?: {
        id?: string;
      };
    }>;
  };
}

interface StripeInvoice {
  id: string;
  number?: string;
  subscription?: string | {
    metadata?: {
      tenantId?: string;
    };
  };
  customer?: string;
  amount_paid?: number;
  amount_due?: number;
  currency?: string;
  description?: string;
  period_start?: number;
  period_end?: number;
  payment_intent?: string;
  metadata?: {
    tenantId?: string;
  };
}

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
        await handleSubscriptionCreated(event.data.object as StripeSubscription);
        break;

      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as StripeSubscription);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as StripeSubscription);
        break;

      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(event.data.object as StripeInvoice);
        break;

      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object as StripeInvoice);
        break;

      case 'customer.subscription.trial_will_end':
        await handleTrialWillEnd(event.data.object as StripeSubscription);
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

async function handleSubscriptionCreated(subscription: StripeSubscription) {
  try {
    const tenantId = subscription.metadata?.tenantId;
    if (!tenantId) {
      console.error('No tenant ID in subscription metadata');
      return;
    }

    // Get plan from price ID
    const priceId = subscription.items?.data?.[0]?.price?.id;
    const planId = priceId ? await getPlanIdFromPriceId(priceId) : 'FREE';
    
    const trialEnd = subscription.trial_end ? new Date(subscription.trial_end * 1000) : null;
    const now = new Date();
    const isTrialExpired = trialEnd ? trialEnd <= now : false;
    
    // Create or update subscription record
    await prisma.subscriptions.upsert({
      where: { tenantId },
      update: {
        plan: planId as 'FREE' | 'STARTER' | 'PROFESSIONAL' | 'ENTERPRISE' | 'WHITE_LABEL',
        stripeSubscriptionId: subscription.id,
        stripeCustomerId: subscription.customer as string,
        stripePriceId: priceId,
        status: (subscription.status?.toUpperCase() || 'ACTIVE') as 'ACTIVE' | 'INACTIVE' | 'PAST_DUE' | 'CANCELED' | 'TRIALING' | 'UNPAID',
        trialEndsAt: trialEnd,
        isTrialExpired: isTrialExpired,
        currentPeriodStart: new Date(subscription.current_period_start! * 1000),
        currentPeriodEnd: new Date(subscription.current_period_end! * 1000),
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
        updatedAt: new Date()
      },
      create: {
        id: crypto.randomUUID().replace(/-/g, ''),
        tenantId,
        plan: planId as 'FREE' | 'STARTER' | 'PROFESSIONAL' | 'ENTERPRISE' | 'WHITE_LABEL',
        stripeSubscriptionId: subscription.id,
        stripeCustomerId: subscription.customer as string,
        stripePriceId: priceId,
        status: (subscription.status?.toUpperCase() || 'ACTIVE') as 'ACTIVE' | 'INACTIVE' | 'PAST_DUE' | 'CANCELED' | 'TRIALING' | 'UNPAID',
        trialEndsAt: trialEnd,
        isTrialExpired: isTrialExpired,
        currentPeriodStart: new Date(subscription.current_period_start! * 1000),
        currentPeriodEnd: new Date(subscription.current_period_end! * 1000),
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });

    // Only update tenant plan if not in trial or trial expired with payment
    if (subscription.status === 'ACTIVE' && !isTrialExpired) {
      await prisma.tenants.update({
        where: { id: tenantId },
        data: { plan: planId as 'FREE' | 'STARTER' | 'PROFESSIONAL' | 'ENTERPRISE' | 'WHITE_LABEL' }
      });
    }

    console.log(`Subscription created for tenant ${tenantId}, plan ${planId}, trial ends: ${trialEnd}`);
  } catch (error) {
    console.error('Error handling subscription created:', error);
  }
}

async function handleSubscriptionUpdated(subscription: StripeSubscription) {
  try {
    const tenantId = subscription.metadata?.tenantId;
    if (!tenantId) {
      console.error('No tenant ID in subscription metadata');
      return;
    }

    // Get plan from price ID
    const priceId = subscription.items?.data?.[0]?.price?.id;
    const planId = priceId ? await getPlanIdFromPriceId(priceId) : 'FREE';

    const now = new Date();
    const trialEnd = subscription.trial_end ? new Date(subscription.trial_end * 1000) : null;
    const isTrialExpired = trialEnd ? trialEnd <= now : false;
    const status = (subscription.status?.toUpperCase() || 'ACTIVE') as 'ACTIVE' | 'INACTIVE' | 'PAST_DUE' | 'CANCELED' | 'TRIALING' | 'UNPAID';

    // If trial ended and status is still TRIALING, mark as expired
    const finalStatus = (status === 'TRIALING' && isTrialExpired) ? 'TRIALING' : status;
    const finalIsTrialExpired = (status === 'TRIALING' && isTrialExpired) || (status === 'ACTIVE' && !subscription.trial_end);

    // Update subscription record
    await prisma.subscriptions.updateMany({
      where: { tenantId },
      data: {
        plan: planId as 'FREE' | 'STARTER' | 'PROFESSIONAL' | 'ENTERPRISE' | 'WHITE_LABEL',
        status: finalStatus,
        trialEndsAt: trialEnd,
        isTrialExpired: finalIsTrialExpired,
        currentPeriodStart: new Date(subscription.current_period_start! * 1000),
        currentPeriodEnd: new Date(subscription.current_period_end! * 1000),
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
        updatedAt: new Date()
      }
    });

    // If trial expired and no payment, keep on FREE plan
    // If payment succeeded, update tenant plan
    if (status === 'ACTIVE' && !isTrialExpired) {
      await prisma.tenants.update({
        where: { id: tenantId },
        data: { plan: planId as 'FREE' | 'STARTER' | 'PROFESSIONAL' | 'ENTERPRISE' | 'WHITE_LABEL' }
      });
    }

    console.log(`Subscription updated for tenant ${tenantId}, plan ${planId}, trial expired: ${finalIsTrialExpired}`);
  } catch (error) {
    console.error('Error handling subscription updated:', error);
  }
}

async function handleSubscriptionDeleted(subscription: StripeSubscription) {
  try {
    const tenantId = subscription.metadata?.tenantId;
    if (!tenantId) {
      console.error('No tenant ID in subscription metadata');
      return;
    }

    // Update subscription record
    await prisma.subscriptions.updateMany({
      where: { tenantId },
      data: {
        status: 'CANCELED',
        cancelAtPeriodEnd: true,
        updatedAt: new Date()
      }
    });

    // Reset tenant to free plan
    await prisma.tenants.update({
      where: { id: tenantId },
      data: { plan: 'FREE' }
    });

    console.log(`Subscription deleted for tenant ${tenantId}`);
  } catch (error) {
    console.error('Error handling subscription deleted:', error);
  }
}

async function handlePaymentSucceeded(invoice: StripeInvoice) {
  try {
    const tenantId = typeof invoice.subscription === 'object' 
      ? invoice.subscription?.metadata?.tenantId 
      : null;
    
    if (!tenantId) {
      // Try to get from subscription record
      const subscriptionId = typeof invoice.subscription === 'string' 
        ? invoice.subscription 
        : (invoice.subscription as { id?: string } | undefined)?.id;
      
      if (subscriptionId) {
        const sub = await prisma.subscriptions.findFirst({
          where: { stripeSubscriptionId: subscriptionId }
        });
        if (sub) {
          const tenantId = sub.tenantId;
          
          // Update subscription to clear trial expiration
          await prisma.subscriptions.update({
            where: { id: sub.id },
            data: {
              isTrialExpired: false,
              status: 'ACTIVE',
              updatedAt: new Date()
            }
          });
          
          // Record payment
          await prisma.billing_history.create({
            data: {
              id: crypto.randomUUID().replace(/-/g, ''),
              tenantId: sub.tenantId,
              invoiceNumber: invoice.number || `INV_${Date.now()}`,
              amount: (invoice.amount_paid || 0) / 100,
              currency: (invoice.currency || 'USD').toUpperCase(),
              status: 'PAID',
              billingPeriodStart: new Date((invoice.period_start || 0) * 1000),
              billingPeriodEnd: new Date((invoice.period_end || 0) * 1000),
              plan: sub.plan,
              stripeInvoiceId: invoice.id,
              stripePaymentIntentId: invoice.payment_intent as string,
              description: `Payment for ${invoice.description || 'subscription'}`,
              metadata: {
                invoiceId: invoice.id,
                subscriptionId: subscriptionId,
                amountPaid: invoice.amount_paid,
                currency: invoice.currency
              },
              createdAt: new Date(),
              updatedAt: new Date()
            }
          });
          
          console.log(`Payment succeeded for tenant ${sub.tenantId}`);
          return;
        }
      }
      
      console.error('No tenant ID found for payment succeeded');
      return;
    }

    // Get subscription to determine plan
    const subscription = await prisma.subscriptions.findUnique({
      where: { tenantId }
    });

    // Update subscription to clear trial expiration
    if (subscription) {
      await prisma.subscriptions.update({
        where: { id: subscription.id },
        data: {
          isTrialExpired: false,
          status: 'ACTIVE',
          updatedAt: new Date()
        }
      });
    }

    // Record successful payment in billing history
    await prisma.billing_history.create({
      data: {
        id: crypto.randomUUID().replace(/-/g, ''),
        tenantId,
        invoiceNumber: invoice.number || `INV_${Date.now()}`,
        amount: (invoice.amount_paid || 0) / 100, // Convert from cents
        currency: (invoice.currency || 'USD').toUpperCase(),
        status: 'PAID',
        billingPeriodStart: new Date((invoice.period_start || 0) * 1000),
        billingPeriodEnd: new Date((invoice.period_end || 0) * 1000),
        plan: subscription?.plan || 'FREE',
        stripeInvoiceId: invoice.id,
        stripePaymentIntentId: invoice.payment_intent as string,
        description: `Payment for ${invoice.description || 'subscription'}`,
        metadata: {
          invoiceId: invoice.id,
          subscriptionId: typeof invoice.subscription === 'string' ? invoice.subscription : (invoice.subscription as { id?: string } | undefined)?.id,
          amountPaid: invoice.amount_paid,
          currency: invoice.currency
        },
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });

    console.log(`Payment succeeded for tenant ${tenantId}`);
  } catch (error) {
    console.error('Error handling payment succeeded:', error);
  }
}

async function handlePaymentFailed(invoice: StripeInvoice) {
  try {
    const tenantId = typeof invoice.subscription === 'object' 
      ? invoice.subscription?.metadata?.tenantId 
      : undefined;
    if (!tenantId) {
      console.error('No tenant ID in invoice metadata');
      return;
    }

    // Record failed payment in billing history
    await prisma.billing_history.create({
      data: {
        id: crypto.randomUUID().replace(/-/g, ''),
        tenantId,
        invoiceNumber: invoice.number || `INV_${Date.now()}`,
        amount: (invoice.amount_due || 0) / 100, // Convert from cents
        currency: (invoice.currency || 'USD').toUpperCase(),
        status: 'FAILED',
        billingPeriodStart: new Date((invoice.period_start || 0) * 1000),
        billingPeriodEnd: new Date((invoice.period_end || 0) * 1000),
        plan: 'FREE', // This should be updated to actual plan
        stripeInvoiceId: invoice.id,
        description: `Failed payment for ${invoice.description || 'subscription'}`,
        metadata: {
          invoiceId: invoice.id,
          subscriptionId: typeof invoice.subscription === 'string' ? invoice.subscription : (invoice.subscription as { id?: string } | undefined)?.id,
          amountDue: invoice.amount_due,
          currency: invoice.currency,
          failureReason: (invoice as { last_payment_error?: { message?: string } }).last_payment_error?.message
        },
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });

    console.log(`Payment failed for tenant ${tenantId}`);
  } catch (error) {
    console.error('Error handling payment failed:', error);
  }
}

async function handleTrialWillEnd(subscription: StripeSubscription) {
  try {
    const tenantId = subscription.metadata?.tenantId;
    if (!tenantId) {
      console.error('No tenant ID in subscription metadata');
      return;
    }

    const trialEnd = subscription.trial_end ? new Date(subscription.trial_end * 1000) : null;
    
    // Update subscription with trial end date
    if (trialEnd) {
      await prisma.subscriptions.updateMany({
        where: { tenantId },
        data: {
          trialEndsAt: trialEnd,
          updatedAt: new Date()
        }
      });
    }

    // TODO: Send email notification (3-7 days before trial ends)
    // This would integrate with your notification system
    console.log(`Trial will end for tenant ${tenantId} on ${trialEnd}`);
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