import { prisma } from './db';
import { $Enums } from '@prisma/client';
import { randomUUID } from 'crypto';
import { stripeService, PlanDetails } from './stripe';
import { planLimitsService } from './plan-limits';

export interface PlanChangeRequest {
  tenantId: string;
  newPlanId: string;
  userId: string;
  reason?: string;
}

export interface PlanChangeResult {
  success: boolean;
  message: string;
  subscriptionId?: string;
  previousPlan?: string;
  newPlan: string;
  effectiveDate: Date;
  prorationAmount?: number;
}

export interface SubscriptionStatus {
  isActive: boolean;
  currentPlan: string;
  status: string;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  nextBillingDate: Date;
}

export class SubscriptionService {
  /**
   * Change tenant plan (upgrade/downgrade)
   */
  async changePlan(request: PlanChangeRequest): Promise<PlanChangeResult> {
    try {
      const { tenantId, newPlanId, userId, reason } = request;

      // Get current subscription
      const currentSubscription = await this.getSubscription(tenantId);
      const currentPlan = currentSubscription?.plan || 'FREE';
      
      // Validate plan change
      const validation = await this.validatePlanChange(tenantId, currentPlan, newPlanId);
      if (!validation.allowed) {
        return {
          success: false,
          message: validation.reason || 'Plan change not allowed',
          newPlan: newPlanId,
          effectiveDate: new Date()
        };
      }

      // Get plan details
      const newPlan = stripeService.getPlan(newPlanId);
      if (!newPlan) {
        return {
          success: false,
          message: 'Invalid plan selected',
          newPlan: newPlanId,
          effectiveDate: new Date()
        };
      }

      // Handle free plan (no Stripe needed)
      if (newPlan.price === 0) {
        return await this.downgradeToFree(tenantId, currentPlan, newPlanId, userId, reason);
      }

      // Handle paid plans
      if (currentSubscription?.stripeSubscriptionId) {
        return await this.changePaidPlan(tenantId, currentSubscription, newPlanId, userId, reason);
      } else {
        return await this.createNewSubscription(tenantId, newPlanId, userId, reason);
      }
    } catch (error) {
      console.error('Error changing plan:', error);
      return {
        success: false,
        message: 'Failed to change plan',
        newPlan: request.newPlanId,
        effectiveDate: new Date()
      };
    }
  }

  /**
   * Validate if plan change is allowed
   */
  private async validatePlanChange(
    tenantId: string,
    currentPlan: string,
    newPlanId: string
  ): Promise<{ allowed: boolean; reason?: string }> {
    // Check if downgrading
    if (this.isPlanDowngrade(currentPlan, newPlanId)) {
      // Validate that current usage doesn't exceed new plan limits
      const usageCheck = await planLimitsService.getUsageCheck(tenantId);
      const newPlan = stripeService.getPlan(newPlanId);
      
      if (!newPlan) {
        return { allowed: false, reason: 'Invalid plan' };
      }

      // Check each resource type
      const checks = [
        { resource: 'bots', usage: usageCheck.bots.currentUsage, limit: newPlan.limits.bots },
        { resource: 'knowledgeBases', usage: usageCheck.knowledgeBases.currentUsage, limit: newPlan.limits.knowledgeBases },
        { resource: 'documents', usage: usageCheck.documents.currentUsage, limit: newPlan.limits.documents },
        { resource: 'users', usage: usageCheck.users.currentUsage, limit: newPlan.limits.users },
        { resource: 'storage', usage: usageCheck.storage.currentUsage, limit: newPlan.limits.storage }
      ];

      for (const check of checks) {
        if (check.limit !== -1 && check.usage > check.limit) {
          return {
            allowed: false,
            reason: `Cannot downgrade: ${check.resource} usage (${check.usage}) exceeds new plan limit (${check.limit})`
          };
        }
      }
    }

    return { allowed: true };
  }

  /**
   * Check if this is a plan downgrade
   */
  private isPlanDowngrade(currentPlan: string, newPlanId: string): boolean {
    const planOrder = ['FREE', 'STARTER', 'PROFESSIONAL', 'ENTERPRISE'];
    const currentIndex = planOrder.indexOf(currentPlan);
    const newIndex = planOrder.indexOf(newPlanId);
    
    return newIndex < currentIndex;
  }

  /**
   * Downgrade to free plan
   */
  private async downgradeToFree(
    tenantId: string,
    currentPlan: string,
    newPlanId: string,
    userId: string,
    reason?: string
  ): Promise<PlanChangeResult> {
    // Update tenant plan
    await prisma.tenants.update({
      where: { id: tenantId },
      data: { plan: newPlanId as $Enums.Plan }
    });

    // Update subscription record
    if (currentPlan !== 'FREE') {
      await prisma.subscriptions.updateMany({
        where: { tenantId },
        data: {
          plan: newPlanId as $Enums.Plan,
          previousPlan: currentPlan as $Enums.Plan,
          status: 'INACTIVE',
          cancelAtPeriodEnd: true,
          updatedAt: new Date()
        }
      });
    }

    // Record billing history
    await this.recordPlanChange(tenantId, currentPlan, newPlanId, 'DOWNGRADE', userId, reason);

    return {
      success: true,
      message: 'Successfully downgraded to Free plan',
      previousPlan: currentPlan,
      newPlan: newPlanId,
      effectiveDate: new Date()
    };
  }

  /**
   * Change existing paid subscription
   */
  private async changePaidPlan(
    tenantId: string,
    currentSubscription: { id: string; plan: string; [key: string]: unknown },
    newPlanId: string,
    userId: string,
    reason?: string
  ): Promise<PlanChangeResult> {
    const newPlan = stripeService.getPlan(newPlanId);
    if (!newPlan?.stripePriceId) {
      return {
        success: false,
        message: 'Plan not configured for payments',
        newPlan: newPlanId,
        effectiveDate: new Date()
      };
    }

    try {
      // Update Stripe subscription
      const stripeSubscriptionId = currentSubscription.stripeSubscriptionId as string;
      if (!stripeSubscriptionId) {
        throw new Error('Stripe subscription ID not found');
      }
      await stripeService.updateSubscription(
        stripeSubscriptionId,
        newPlan.stripePriceId
      );

      // Update local subscription record
      await prisma.subscriptions.update({
        where: { id: currentSubscription.id },
        data: {
          plan: newPlanId as $Enums.Plan,
          previousPlan: currentSubscription.plan as $Enums.Plan,
          stripePriceId: newPlan.stripePriceId,
          updatedAt: new Date()
        }
      });

      // Update tenant plan
      await prisma.tenants.update({
        where: { id: tenantId },
        data: { plan: newPlanId as $Enums.Plan }
      });

      // Record billing history
      await this.recordPlanChange(tenantId, currentSubscription.plan, newPlanId, 'UPGRADE', userId, reason);

      return {
        success: true,
        message: 'Plan changed successfully',
        subscriptionId: stripeSubscriptionId,
        previousPlan: currentSubscription.plan,
        newPlan: newPlanId,
        effectiveDate: new Date()
      };
    } catch (error) {
      console.error('Error changing paid plan:', error);
      return {
        success: false,
        message: 'Failed to change plan in payment system',
        newPlan: newPlanId,
        effectiveDate: new Date()
      };
    }
  }

  /**
   * Create new paid subscription
   */
  private async createNewSubscription(
    tenantId: string,
    newPlanId: string,
    userId: string,
    reason?: string
  ): Promise<PlanChangeResult> {
    // This would typically be handled by the checkout flow
    // For now, return success but indicate Stripe checkout is needed
    return {
      success: true,
      message: 'Plan change requires Stripe checkout',
      newPlan: newPlanId,
      effectiveDate: new Date()
    };
  }

  /**
   * Get subscription for a tenant
   */
  async getSubscription(tenantId: string) {
    try {
      return await prisma.subscriptions.findUnique({
        where: { tenantId }
      });
    } catch (error) {
      console.error('[SubscriptionService] Error fetching subscription:', error);
      // Return null on error to prevent blocking other operations
      return null;
    }
  }

  /**
   * Get subscription status
   */
  async getSubscriptionStatus(tenantId: string): Promise<SubscriptionStatus> {
    const subscription = await this.getSubscription(tenantId);
    const tenant = await prisma.tenants.findUnique({ where: { id: tenantId } });

    if (!subscription || !tenant) {
      return {
        isActive: false,
        currentPlan: tenant?.plan || 'FREE',
        status: 'INACTIVE',
        currentPeriodEnd: new Date(),
        cancelAtPeriodEnd: false,
        nextBillingDate: new Date()
      };
    }

    return {
      isActive: subscription.status === 'ACTIVE',
      currentPlan: subscription.plan,
      status: subscription.status,
      currentPeriodEnd: subscription.currentPeriodEnd,
      cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
      nextBillingDate: subscription.currentPeriodEnd
    };
  }

  /**
   * Cancel subscription
   */
  async cancelSubscription(tenantId: string, userId: string, reason?: string): Promise<boolean> {
    try {
      const subscription = await this.getSubscription(tenantId);
      if (!subscription?.stripeSubscriptionId) {
        return false;
      }

      // Cancel in Stripe
      await stripeService.cancelSubscription(subscription.stripeSubscriptionId);

      // Update local record
      await prisma.subscriptions.update({
        where: { id: subscription.id },
        data: {
          status: 'CANCELED',
          cancelAtPeriodEnd: true,
          updatedAt: new Date()
        }
      });

      // Record billing history
      await this.recordPlanChange(
        tenantId,
        subscription.plan,
        subscription.plan,
        'CANCELLATION',
        userId,
        reason
      );

      return true;
    } catch (error) {
      console.error('Error canceling subscription:', error);
      return false;
    }
  }

  /**
   * Reactivate canceled subscription
   */
  async reactivateSubscription(tenantId: string, userId: string): Promise<boolean> {
    try {
      const subscription = await this.getSubscription(tenantId);
      if (!subscription?.stripeSubscriptionId) {
        return false;
      }

      // Reactivate in Stripe
      await stripeService.reactivateSubscription(subscription.stripeSubscriptionId);

      // Update local record
      await prisma.subscriptions.update({
        where: { id: subscription.id },
        data: {
          status: 'ACTIVE',
          cancelAtPeriodEnd: false,
          updatedAt: new Date()
        }
      });

      // Record billing history
      await this.recordPlanChange(
        tenantId,
        subscription.plan,
        subscription.plan,
        'REACTIVATION',
        userId
      );

      return true;
    } catch (error) {
      console.error('Error reactivating subscription:', error);
      return false;
    }
  }

  /**
   * Record plan change in billing history
   */
  private async recordPlanChange(
    tenantId: string,
    fromPlan: string,
    toPlan: string,
    changeType: 'UPGRADE' | 'DOWNGRADE' | 'CANCELLATION' | 'REACTIVATION',
    userId: string,
    reason?: string
  ): Promise<void> {
    const fromPlanDetails = stripeService.getPlan(fromPlan);
    const toPlanDetails = stripeService.getPlan(toPlan);

    const billingId = randomUUID().replace(/-/g, '');
    const now = new Date();
    
    await prisma.billing_history.create({
      data: {
        id: billingId,
        tenantId,
        invoiceNumber: `PLAN_CHANGE_${Date.now()}`,
        createdAt: now,
        updatedAt: now,
        amount: toPlanDetails?.price || 0,
        currency: 'USD',
        status: 'PENDING',
        billingPeriodStart: new Date(),
        billingPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        plan: toPlan as 'FREE' | 'STARTER' | 'PROFESSIONAL' | 'ENTERPRISE',
        planChange: changeType,
        description: `Plan change from ${fromPlan} to ${toPlan}`,
        metadata: {
          fromPlan,
          toPlan,
          changeType,
          userId,
          reason,
          fromPlanPrice: fromPlanDetails?.price || 0,
          toPlanPrice: toPlanDetails?.price || 0
        }
      }
    });
  }
}

// Export singleton instance
export const subscriptionService = new SubscriptionService(); 