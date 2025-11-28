import Stripe from 'stripe';
import { prisma } from './db';

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-07-30.basil',
});

export interface PlanDetails {
  id: string;
  name: string;
  price: number;
  interval: string;
  features: string[];
  limits: {
    bots: number;
    knowledgeBases: number;
    documents: number;
    conversations: number;
    users: number;
    apiCalls: number;
    storage: number;
  };
  stripePriceId?: string;
}

export interface UsageMetrics {
  bots: number;
  knowledgeBases: number;
  documents: number;
  conversations: number;
  users: number;
  apiCalls: number;
  storage: number;
}

export interface StripeCustomer {
  id: string;
  email: string;
  name?: string;
  metadata: Record<string, string>;
}

export interface StripeCheckoutSession {
  id: string;
  url: string;
  customerId: string;
  subscriptionId?: string;
}

export interface StripeInvoice {
  id: string;
  number: string;
  amount: number;
  currency: string;
  status: string;
  dueDate: Date;
  paid: boolean;
  pdfUrl?: string;
}

export interface StripePaymentIntent {
  id: string;
  amount: number;
  currency: string;
  status: string;
  clientSecret: string;
}

export class StripeService {
  private plans: PlanDetails[] = [
    {
      id: 'FREE',
      name: 'Free',
      price: 0,
      interval: 'month',
      features: [
        'AI-powered chat widget',
        'Document upload (100 docs)',
        'Basic analytics',
        '1 Bot',
        '1 Knowledge Base',
        '2 Users',
        '1,000 conversations/month',
        '10,000 API calls/month'
      ],
      limits: {
        bots: 1,
        knowledgeBases: 1,
        documents: 100,
        conversations: 1000,
        users: 2,
        apiCalls: 10000,
        storage: 100 // MB
      }
    },
    {
      id: 'STARTER',
      name: 'Starter',
      price: 29,
      interval: 'month',
      features: [
        'Everything in Free',
        'Priority support',
        '5 Bots',
        '5 Knowledge Bases',
        '1,000 Documents',
        '10 Users',
        '10,000 conversations/month',
        '100,000 API calls/month'
      ],
      limits: {
        bots: 5,
        knowledgeBases: 5,
        documents: 1000,
        conversations: 10000,
        users: 10,
        apiCalls: 100000,
        storage: 1000 // MB
      },
      stripePriceId: process.env.STRIPE_STARTER_PRICE_ID
    },
    {
      id: 'PROFESSIONAL',
      name: 'Professional',
      price: 99,
      interval: 'month',
      features: [
        'Everything in Starter',
        'Advanced analytics',
        'Custom branding',
        '25 Bots',
        '25 Knowledge Bases',
        '10,000 Documents',
        '50 Users',
        '100,000 conversations/month',
        '1,000,000 API calls/month'
      ],
      limits: {
        bots: 25,
        knowledgeBases: 25,
        documents: 10000,
        conversations: 100000,
        users: 50,
        apiCalls: 1000000,
        storage: 10000 // MB
      },
      stripePriceId: process.env.STRIPE_PROFESSIONAL_PRICE_ID
    },
    {
      id: 'ENTERPRISE',
      name: 'Enterprise',
      price: 299,
      interval: 'month',
      features: [
        'Everything in Professional',
        'White-label solution',
        'Dedicated account manager',
        'Unlimited Bots',
        'Unlimited Knowledge Bases',
        'Unlimited Documents',
        'Unlimited Users',
        'Unlimited conversations',
        'Unlimited API calls'
      ],
      limits: {
        bots: -1, // Unlimited
        knowledgeBases: -1,
        documents: -1,
        conversations: -1,
        users: -1,
        apiCalls: -1,
        storage: -1
      },
      stripePriceId: process.env.STRIPE_ENTERPRISE_PRICE_ID
    }
  ];

  /**
   * Get all available plans
   */
  getPlans(): PlanDetails[] {
    return this.plans;
  }

  /**
   * Get a specific plan by ID
   */
  getPlan(planId: string): PlanDetails | undefined {
    return this.plans.find(plan => plan.id === planId);
  }

  /**
   * Create or get a Stripe customer
   */
  async createCustomer(
    email: string,
    name: string,
    metadata: Record<string, string>
  ): Promise<StripeCustomer> {
    try {
      // Check if customer already exists
      const existingCustomers = await stripe.customers.list({
        email,
        limit: 1
      });

      if (existingCustomers.data.length > 0) {
        const customer = existingCustomers.data[0];
        return {
          id: customer.id,
          email: customer.email!,
          name: customer.name || undefined,
          metadata: customer.metadata
        };
      }

      // Create new customer
      const customer = await stripe.customers.create({
        email,
        name,
        metadata
      });

      return {
        id: customer.id,
        email: customer.email!,
        name: customer.name || undefined,
        metadata: customer.metadata
      };
    } catch (error) {
      console.error('Error creating Stripe customer:', error);
      throw new Error('Failed to create Stripe customer');
    }
  }

  /**
   * Create a checkout session for subscription
   */
  async createCheckoutSession(
    customerId: string,
    priceId: string,
    successUrl: string,
    cancelUrl: string,
    metadata: Record<string, string>
  ): Promise<StripeCheckoutSession> {
    try {
      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        payment_method_types: ['card'],
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        mode: 'subscription',
        success_url: successUrl,
        cancel_url: cancelUrl,
        metadata,
        subscription_data: {
          metadata
        },
        allow_promotion_codes: true,
        billing_address_collection: 'required',
        tax_id_collection: {
          enabled: true,
        }
      });

      return {
        id: session.id,
        url: session.url!,
        customerId: customerId
      };
    } catch (error) {
      console.error('Error creating checkout session:', error);
      throw new Error('Failed to create checkout session');
    }
  }

  /**
   * Create a customer portal session
   */
  async createPortalSession(customerId: string, returnUrl: string): Promise<string> {
    try {
      const session = await stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: returnUrl,
        configuration: process.env.STRIPE_PORTAL_CONFIGURATION_ID || undefined
      });

      return session.url;
    } catch (error) {
      console.error('Error creating portal session:', error);
      throw new Error('Failed to create portal session');
    }
  }

  /**
   * Get subscription details from Stripe
   */
  async getSubscription(subscriptionId: string) {
    try {
      return await stripe.subscriptions.retrieve(subscriptionId);
    } catch (error) {
      console.error('Error retrieving subscription:', error);
      throw new Error('Failed to retrieve subscription');
    }
  }

  /**
   * Cancel subscription at period end
   */
  async cancelSubscription(subscriptionId: string): Promise<void> {
    try {
      await stripe.subscriptions.update(subscriptionId, {
        cancel_at_period_end: true
      });
    } catch (error) {
      console.error('Error canceling subscription:', error);
      throw new Error('Failed to cancel subscription');
    }
  }

  /**
   * Reactivate a canceled subscription
   */
  async reactivateSubscription(subscriptionId: string): Promise<void> {
    try {
      await stripe.subscriptions.update(subscriptionId, {
        cancel_at_period_end: false
      });
    } catch (error) {
      console.error('Error reactivating subscription:', error);
      throw new Error('Failed to reactivate subscription');
    }
  }

  /**
   * Update subscription to new plan
   */
  async updateSubscription(
    subscriptionId: string,
    newPriceId: string,
    prorationBehavior: 'create_prorations' | 'none' = 'create_prorations'
  ): Promise<void> {
    try {
      await stripe.subscriptions.update(subscriptionId, {
        items: [{
          id: (await this.getSubscription(subscriptionId)).items.data[0].id,
          price: newPriceId,
        }],
        proration_behavior: prorationBehavior,
      });
    } catch (error) {
      console.error('Error updating subscription:', error);
      throw new Error('Failed to update subscription');
    }
  }

  /**
   * Create a payment intent for one-time charges
   */
  async createPaymentIntent(
    amount: number,
    currency: string = 'usd',
    customerId?: string,
    metadata?: Record<string, string>
  ): Promise<StripePaymentIntent> {
    try {
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency,
        customer: customerId,
        metadata,
        automatic_payment_methods: {
          enabled: true,
        },
      });

      return {
        id: paymentIntent.id,
        amount: amount,
        currency: paymentIntent.currency,
        status: paymentIntent.status,
        clientSecret: paymentIntent.client_secret!
      };
    } catch (error) {
      console.error('Error creating payment intent:', error);
      throw new Error('Failed to create payment intent');
    }
  }

  /**
   * Get customer invoices
   */
  async getCustomerInvoices(customerId: string, limit: number = 10): Promise<StripeInvoice[]> {
    try {
      const invoices = await stripe.invoices.list({
        customer: customerId,
        limit
      });

      return invoices.data.map(invoice => ({
        id: invoice.id || '',
        number: invoice.number || '',
        amount: (invoice.amount_paid || 0) / 100, // Convert from cents
        currency: invoice.currency,
        status: invoice.status || 'draft',
        dueDate: invoice.due_date ? new Date(invoice.due_date * 1000) : new Date(),
        paid: invoice.status === 'paid',
        pdfUrl: invoice.hosted_invoice_url || undefined
      }));
    } catch (error) {
      console.error('Error retrieving customer invoices:', error);
      throw new Error('Failed to retrieve customer invoices');
    }
  }

  /**
   * Get specific invoice
   */
  async getInvoice(invoiceId: string): Promise<StripeInvoice> {
    try {
      const invoice = await stripe.invoices.retrieve(invoiceId);
      
      return {
        id: invoice.id || '',
        number: invoice.number || '',
        amount: (invoice.amount_paid || 0) / 100,
        currency: invoice.currency,
        status: invoice.status || 'draft',
        dueDate: invoice.due_date ? new Date(invoice.due_date * 1000) : new Date(),
        paid: invoice.status === 'paid',
        pdfUrl: invoice.hosted_invoice_url || undefined
      };
    } catch (error) {
      console.error('Error retrieving invoice:', error);
      throw new Error('Failed to retrieve invoice');
    }
  }

  /**
   * Create invoice PDF
   */
  async createInvoicePDF(invoiceId: string): Promise<string> {
    try {
      const invoice = await stripe.invoices.retrieve(invoiceId, {
        expand: ['customer', 'subscription']
      });

      if (!invoice.hosted_invoice_url) {
        throw new Error('Invoice PDF not available');
      }

      return invoice.hosted_invoice_url;
    } catch (error) {
      console.error('Error creating invoice PDF:', error);
      throw new Error('Failed to create invoice PDF');
    }
  }

  /**
   * Refund a payment
   */
  async refundPayment(paymentIntentId: string, amount?: number, reason?: string): Promise<void> {
    try {
      const refundData: { payment_intent: string; amount?: number; reason?: string; [key: string]: unknown } = {
        payment_intent: paymentIntentId,
      };

      if (amount) {
        refundData.amount = Math.round(amount * 100);
      }

      if (reason) {
        refundData.reason = reason;
      }

      await stripe.refunds.create(refundData);
    } catch (error) {
      console.error('Error refunding payment:', error);
      throw new Error('Failed to refund payment');
    }
  }

  /**
   * Get customer payment methods
   */
  async getCustomerPaymentMethods(customerId: string): Promise<Array<{ id: string; type: string; [key: string]: unknown }>> {
    try {
      const paymentMethods = await stripe.paymentMethods.list({
        customer: customerId,
        type: 'card'
      });

      return paymentMethods.data.map(pm => ({
        id: pm.id,
        type: pm.type,
        card: pm.card ? {
          brand: pm.card.brand,
          last4: pm.card.last4,
          expMonth: pm.card.exp_month,
          expYear: pm.card.exp_year
        } : null,
        billingDetails: pm.billing_details
      }));
    } catch (error) {
      console.error('Error retrieving payment methods:', error);
      throw new Error('Failed to retrieve payment methods');
    }
  }

  /**
   * Attach payment method to customer
   */
  async attachPaymentMethod(paymentMethodId: string, customerId: string): Promise<void> {
    try {
      await stripe.paymentMethods.attach(paymentMethodId, {
        customer: customerId,
      });
    } catch (error) {
      console.error('Error attaching payment method:', error);
      throw new Error('Failed to attach payment method');
    }
  }

  /**
   * Detach payment method from customer
   */
  async detachPaymentMethod(paymentMethodId: string): Promise<void> {
    try {
      await stripe.paymentMethods.detach(paymentMethodId);
    } catch (error) {
      console.error('Error detaching payment method:', error);
      throw new Error('Failed to detach payment method');
    }
  }

  /**
   * Set default payment method
   */
  async setDefaultPaymentMethod(customerId: string, paymentMethodId: string): Promise<void> {
    try {
      await stripe.customers.update(customerId, {
        invoice_settings: {
          default_payment_method: paymentMethodId,
        },
      });
    } catch (error) {
      console.error('Error setting default payment method:', error);
      throw new Error('Failed to set default payment method');
    }
  }

  /**
   * Get customer by ID
   */
  async getCustomer(customerId: string) {
    try {
      return await stripe.customers.retrieve(customerId);
    } catch (error) {
      console.error('Error retrieving customer:', error);
      throw new Error('Failed to retrieve customer');
    }
  }

  /**
   * Update customer
   */
  async updateCustomer(customerId: string, updateData: Record<string, unknown>) {
    try {
      return await stripe.customers.update(customerId, updateData);
    } catch (error) {
      console.error('Error updating customer:', error);
      throw new Error('Failed to update customer');
    }
  }

  /**
   * Get price by ID
   */
  async getPrice(priceId: string) {
    try {
      return await stripe.prices.retrieve(priceId);
    } catch (error) {
      console.error('Error retrieving price:', error);
      throw new Error('Failed to retrieve price');
    }
  }

  /**
   * Create upcoming invoice (placeholder for future implementation)
   */
  async createUpcomingInvoice(params: Record<string, unknown>) {
    // This will be implemented when needed
    console.log('Upcoming invoice creation not yet implemented');
    throw new Error('Upcoming invoice creation not yet implemented');
  }

  /**
   * Verify webhook signature
   */
  verifyWebhookSignature(
    body: string,
    signature: string,
    secret: string
  ): Stripe.Event {
    try {
      return stripe.webhooks.constructEvent(body, signature, secret);
    } catch (error) {
      console.error('Webhook signature verification failed:', error);
      throw new Error('Webhook signature verification failed');
    }
  }

  /**
   * Get subscription usage records (placeholder for future implementation)
   */
  async getSubscriptionUsage(subscriptionId: string): Promise<{ usage?: number; [key: string]: unknown }> {
    // This will be implemented when metered billing is needed
    console.log('Usage records not yet implemented');
    return [];
  }

  /**
   * Create usage record for metered billing (placeholder for future implementation)
   */
  async createUsageRecord(
    subscriptionItemId: string,
    quantity: number,
    timestamp: number = Math.floor(Date.now() / 1000)
  ): Promise<void> {
    // This will be implemented when metered billing is needed
    console.log('Usage record creation not yet implemented');
  }
}

// Export singleton instance
export const stripeService = new StripeService(); 