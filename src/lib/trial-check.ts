// Note: Prisma removed - this file may not be actively used
import { subscriptionService } from './subscription-service';

/**
 * Check if trial is expired for a tenant
 * Returns true if trial expired and user should be blocked from paid features
 */
export async function isTrialExpired(tenantId: string): Promise<boolean> {
  try {
    return await subscriptionService.isTrialExpired(tenantId);
  } catch (error) {
    console.error('Error checking trial expiration:', error);
    return false; // Don't block on error
  }
}

/**
 * Check if user can perform paid actions (create/edit bots, upload docs, etc.)
 * Returns { allowed: boolean, reason?: string }
 */
export async function canPerformPaidAction(tenantId: string): Promise<{ allowed: boolean; reason?: string }> {
  try {
    const subscription = await subscriptionService.getSubscription(tenantId);
    
    if (!subscription) {
      return { allowed: true }; // No subscription means free tier, allow basic actions
    }

    // Check if trial expired
    const expired = await subscriptionService.isTrialExpired(tenantId);
    if (expired && subscription.status === 'TRIALING') {
      return {
        allowed: false,
        reason: 'Your trial has ended. Upgrade to continue using this feature.'
      };
    }

    return { allowed: true };
  } catch (error) {
    console.error('Error checking paid action permission:', error);
    return { allowed: true }; // Allow on error to avoid blocking users
  }
}





