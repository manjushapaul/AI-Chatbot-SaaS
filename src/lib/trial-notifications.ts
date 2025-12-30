import { prisma } from './db';
import { subscriptionService } from './subscription-service';

/**
 * Send trial start notification
 */
export async function sendTrialStartNotification(tenantId: string, userId: string) {
  try {
    const subscription = await subscriptionService.getSubscription(tenantId);
    if (!subscription?.trialEndsAt) {
      return;
    }

    const trialEndDate = subscription.trialEndsAt;
    const formattedDate = trialEndDate.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    // Create in-app notification
    await (prisma as any).notifications.create({
      data: {
        userId,
        tenantId,
        type: 'BILLING',
        title: 'Your 14-day trial is live! 🎉',
        message: `Your free trial started today and ends on ${formattedDate}. Explore all features and upgrade anytime.`,
        category: 'billing',
        priority: 'MEDIUM',
        actionUrl: '/dashboard/billing',
        metadata: {
          trialEndsAt: trialEndDate.toISOString(),
          type: 'trial_start'
        }
      }
    });

    // TODO: Send email notification
    // await sendEmail({
    //   to: userEmail,
    //   subject: 'Your 14-day free trial has started',
    //   template: 'trial-start',
    //   data: { trialEndDate: formattedDate }
    // });

    console.log(`Trial start notification sent for tenant ${tenantId}`);
  } catch (error) {
    console.error('Error sending trial start notification:', error);
  }
}

/**
 * Send trial ending soon notification (3-7 days before)
 */
export async function sendTrialEndingSoonNotification(tenantId: string, userId: string) {
  try {
    const subscription = await subscriptionService.getSubscription(tenantId);
    if (!subscription?.trialEndsAt) {
      return;
    }

    const trialEndDate = subscription.trialEndsAt;
    const now = new Date();
    const daysRemaining = Math.ceil((trialEndDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (daysRemaining < 3 || daysRemaining > 7) {
      return; // Only send if within 3-7 days
    }

    const formattedDate = trialEndDate.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    // Create in-app notification
    await (prisma as any).notifications.create({
      data: {
        userId,
        tenantId,
        type: 'BILLING',
        title: `Your trial ends in ${daysRemaining} day${daysRemaining !== 1 ? 's' : ''}`,
        message: `Your free trial ends on ${formattedDate}. Upgrade now to keep all your bots and data active.`,
        category: 'billing',
        priority: 'HIGH',
        actionUrl: '/billing/expired',
        metadata: {
          trialEndsAt: trialEndDate.toISOString(),
          daysRemaining,
          type: 'trial_ending_soon'
        }
      }
    });

    // TODO: Send email notification
    // await sendEmail({
    //   to: userEmail,
    //   subject: `Your trial ends in ${daysRemaining} days`,
    //   template: 'trial-ending-soon',
    //   data: { trialEndDate: formattedDate, daysRemaining }
    // });

    console.log(`Trial ending soon notification sent for tenant ${tenantId}`);
  } catch (error) {
    console.error('Error sending trial ending soon notification:', error);
  }
}

/**
 * Send trial expired notification
 */
export async function sendTrialExpiredNotification(tenantId: string, userId: string) {
  try {
    // Create in-app notification
    await (prisma as any).notifications.create({
      data: {
        userId,
        tenantId,
        type: 'BILLING',
        title: 'Your trial has ended',
        message: 'Your free trial has ended. Upgrade now to keep your bots online and continue using all features.',
        category: 'billing',
        priority: 'CRITICAL',
        actionUrl: '/billing/expired',
        metadata: {
          type: 'trial_expired'
        }
      }
    });

    // TODO: Send email notification
    // await sendEmail({
    //   to: userEmail,
    //   subject: 'Your free trial has ended',
    //   template: 'trial-expired',
    //   data: {}
    // });

    console.log(`Trial expired notification sent for tenant ${tenantId}`);
  } catch (error) {
    console.error('Error sending trial expired notification:', error);
  }
}

/**
 * Check and send trial notifications for a tenant
 * This should be called periodically (e.g., via cron job or scheduled task)
 */
export async function checkAndSendTrialNotifications(tenantId: string) {
  try {
    const subscription = await subscriptionService.getSubscription(tenantId);
    if (!subscription || subscription.status !== 'TRIALING') {
      return;
    }

    const isExpired = await subscriptionService.isTrialExpired(tenantId);
    if (isExpired) {
      // Get tenant admin user
      const tenant = await (prisma as any).tenants.findUnique({
        where: { id: tenantId },
        include: {
          users: {
            where: { role: 'TENANT_ADMIN' },
            take: 1
          }
        }
      });

      if (tenant?.users?.[0]) {
        await sendTrialExpiredNotification(tenantId, tenant.users[0].id);
      }
      return;
    }

    // Check if trial is ending soon
    if (subscription.trialEndsAt) {
      const now = new Date();
      const daysRemaining = Math.ceil(
        (subscription.trialEndsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (daysRemaining >= 3 && daysRemaining <= 7) {
        // Get tenant admin user
        const tenant = await (prisma as any).tenants.findUnique({
          where: { id: tenantId },
          include: {
            users: {
              where: { role: 'TENANT_ADMIN' },
              take: 1
            }
          }
        });

        if (tenant?.users?.[0]) {
          await sendTrialEndingSoonNotification(tenantId, tenant.users[0].id);
        }
      }
    }
  } catch (error) {
    console.error('Error checking trial notifications:', error);
  }
}



