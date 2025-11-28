import { prisma } from './db';
import { stripeService, StripeInvoice, StripePaymentIntent } from './stripe';

export interface PaymentMethod {
  id: string;
  type: string;
  card?: {
    brand: string;
    last4: string;
    expMonth: number;
    expYear: number;
  };
  billingDetails?: {
    name?: string;
    email?: string;
    address?: any;
  };
}

export interface InvoiceDetails {
  id: string;
  number: string;
  amount: number;
  currency: string;
  status: string;
  dueDate: Date;
  paid: boolean;
  pdfUrl?: string;
  description?: string;
  metadata?: Record<string, any>;
}

export interface PaymentHistory {
  id: string;
  amount: number;
  currency: string;
  status: string;
  date: Date;
  description?: string;
  invoiceId?: string;
}

export class PaymentService {
  /**
   * Get customer payment methods
   */
  async getPaymentMethods(customerId: string): Promise<PaymentMethod[]> {
    try {
      const paymentMethods = await stripeService.getCustomerPaymentMethods(customerId);
      return paymentMethods.map(pm => ({
        id: pm.id,
        type: pm.type,
        card: pm.card,
        billingDetails: pm.billingDetails
      }));
    } catch (error) {
      console.error('Error getting payment methods:', error);
      throw new Error('Failed to get payment methods');
    }
  }

  /**
   * Add new payment method
   */
  async addPaymentMethod(paymentMethodId: string, customerId: string): Promise<void> {
    try {
      await stripeService.attachPaymentMethod(paymentMethodId, customerId);
    } catch (error) {
      console.error('Error adding payment method:', error);
      throw new Error('Failed to add payment method');
    }
  }

  /**
   * Remove payment method
   */
  async removePaymentMethod(paymentMethodId: string): Promise<void> {
    try {
      await stripeService.detachPaymentMethod(paymentMethodId);
    } catch (error) {
      console.error('Error removing payment method:', error);
      throw new Error('Failed to remove payment method');
    }
  }

  /**
   * Set default payment method
   */
  async setDefaultPaymentMethod(customerId: string, paymentMethodId: string): Promise<void> {
    try {
      await stripeService.setDefaultPaymentMethod(customerId, paymentMethodId);
    } catch (error) {
      console.error('Error setting default payment method:', error);
      throw new Error('Failed to set default payment method');
    }
  }

  /**
   * Get customer invoices
   */
  async getInvoices(customerId: string, limit: number = 10): Promise<InvoiceDetails[]> {
    try {
      const invoices = await stripeService.getCustomerInvoices(customerId, limit);
      
      // Enhance with local billing history data
      const localInvoices = await prisma.billingHistory.findMany({
        where: { tenantId: customerId },
        orderBy: { createdAt: 'desc' },
        take: limit
      });

      // Combine Stripe invoices with local billing history
      const allInvoices = [...invoices, ...localInvoices.map((local: any) => ({
        id: local.id,
        number: local.invoiceNumber,
        amount: local.amount,
        currency: local.currency,
        status: local.status.toLowerCase(),
        dueDate: local.billingPeriodEnd,
        paid: local.status === 'PAID',
        description: local.description,
        metadata: local.metadata
      }))];

      // Sort by date and return
      return allInvoices
        .sort((a, b) => b.dueDate.getTime() - a.dueDate.getTime())
        .slice(0, limit);
    } catch (error) {
      console.error('Error getting invoices:', error);
      throw new Error('Failed to get invoices');
    }
  }

  /**
   * Get specific invoice
   */
  async getInvoice(invoiceId: string): Promise<InvoiceDetails | null> {
    try {
      // Try to get from Stripe first
      try {
        const stripeInvoice = await stripeService.getInvoice(invoiceId);
        return {
          id: stripeInvoice.id,
          number: stripeInvoice.number,
          amount: stripeInvoice.amount,
          currency: stripeInvoice.currency,
          status: stripeInvoice.status,
          dueDate: stripeInvoice.dueDate,
          paid: stripeInvoice.paid,
          pdfUrl: stripeInvoice.pdfUrl
        };
      } catch (stripeError) {
        // If not found in Stripe, check local billing history
        const localInvoice = await prisma.billingHistory.findUnique({
          where: { id: invoiceId }
        });

        if (localInvoice) {
          return {
            id: localInvoice.id,
            number: localInvoice.invoiceNumber,
            amount: localInvoice.amount,
            currency: localInvoice.currency,
            status: localInvoice.status.toLowerCase(),
            dueDate: localInvoice.billingPeriodEnd,
            paid: localInvoice.status === 'PAID',
            description: localInvoice.description,
            metadata: localInvoice.metadata
          };
        }
      }

      return null;
    } catch (error) {
      console.error('Error getting invoice:', error);
      throw new Error('Failed to get invoice');
    }
  }

  /**
   * Create invoice PDF
   */
  async createInvoicePDF(invoiceId: string): Promise<string> {
    try {
      return await stripeService.createInvoicePDF(invoiceId);
    } catch (error) {
      console.error('Error creating invoice PDF:', error);
      throw new Error('Failed to create invoice PDF');
    }
  }

  /**
   * Create payment intent for one-time charges
   */
  async createPaymentIntent(
    amount: number,
    currency: string = 'usd',
    customerId?: string,
    metadata?: Record<string, string>
  ): Promise<StripePaymentIntent> {
    try {
      return await stripeService.createPaymentIntent(amount, currency, customerId, metadata);
    } catch (error) {
      console.error('Error creating payment intent:', error);
      throw new Error('Failed to create payment intent');
    }
  }

  /**
   * Process refund
   */
  async processRefund(
    paymentIntentId: string,
    amount?: number,
    reason?: string
  ): Promise<void> {
    try {
      await stripeService.refundPayment(paymentIntentId, amount, reason);
      
      // Record refund in local billing history
      if (amount) {
        await prisma.billingHistory.create({
          data: {
            tenantId: 'system', // This should be the actual tenant ID
            invoiceNumber: `REFUND_${Date.now()}`,
            amount: -amount, // Negative amount for refunds
            currency: 'USD',
            status: 'REFUNDED',
            billingPeriodStart: new Date(),
            billingPeriodEnd: new Date(),
            plan: 'FREE',
            description: `Refund for payment ${paymentIntentId}${reason ? ` - ${reason}` : ''}`,
            metadata: {
              paymentIntentId,
              reason,
              refundAmount: amount,
              refundDate: new Date().toISOString()
            }
          }
        });
      }
    } catch (error) {
      console.error('Error processing refund:', error);
      throw new Error('Failed to process refund');
    }
  }

  /**
   * Get payment history
   */
  async getPaymentHistory(customerId: string, limit: number = 20): Promise<PaymentHistory[]> {
    try {
      const billingHistory = await prisma.billingHistory.findMany({
        where: { tenantId: customerId },
        orderBy: { createdAt: 'desc' },
        take: limit
      });

      return billingHistory.map((record: any) => ({
        id: record.id,
        amount: record.amount,
        currency: record.currency,
        status: record.status,
        date: record.createdAt,
        description: record.description,
        invoiceId: record.id
      }));
    } catch (error) {
      console.error('Error getting payment history:', error);
      throw new Error('Failed to get payment history');
    }
  }

  /**
   * Create customer portal session
   */
  async createCustomerPortalSession(customerId: string, returnUrl: string): Promise<string> {
    try {
      return await stripeService.createPortalSession(customerId, returnUrl);
    } catch (error) {
      console.error('Error creating customer portal session:', error);
      throw new Error('Failed to create customer portal session');
    }
  }

  /**
   * Get subscription billing information
   */
  async getSubscriptionBilling(subscriptionId: string): Promise<any> {
    try {
      const subscription = await stripeService.getSubscription(subscriptionId);
      
      return {
        id: subscription.id,
        status: subscription.status,
        currentPeriodStart: new Date((subscription as any).current_period_start * 1000),
        currentPeriodEnd: new Date((subscription as any).current_period_end * 1000),
        cancelAtPeriodEnd: (subscription as any).cancel_at_period_end,
        defaultPaymentMethod: (subscription as any).default_payment_method,
        latestInvoice: (subscription as any).latest_invoice,
        nextPendingInvoiceItemInvoice: (subscription as any).next_pending_invoice_item_invoice
      };
    } catch (error) {
      console.error('Error getting subscription billing:', error);
      throw new Error('Failed to get subscription billing');
    }
  }
}

// Export singleton instance
export const paymentService = new PaymentService(); 