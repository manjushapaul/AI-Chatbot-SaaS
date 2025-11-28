import { stripeService, PlanDetails, UsageMetrics } from '@/lib/stripe';
import { createTenantDB, getTenant, prisma } from './db';
import { apiUsageService } from './api-usage-service';

export interface PlanCheckResult {
  allowed: boolean;
  reason?: string;
  currentUsage: number;
  limit: number;
  remaining: number;
}

export interface UsageCheck {
  bots: PlanCheckResult;
  knowledgeBases: PlanCheckResult;
  documents: PlanCheckResult;
  conversations: PlanCheckResult;
  users: PlanCheckResult;
  apiCalls: PlanCheckResult;
  storage: PlanCheckResult;
}

export class PlanLimitsService {
  /**
   * Check if a tenant can perform a specific action
   */
  async checkActionAllowed(
    tenantId: string,
    action: keyof UsageMetrics,
    increment: number = 1
  ): Promise<PlanCheckResult> {
    try {
      const tenant = await getTenant(tenantId);
      
      if (!tenant) {
        return {
          allowed: false,
          reason: 'Tenant not found',
          currentUsage: 0,
          limit: 0,
          remaining: 0
        };
      }

      const plan = stripeService.getPlan(tenant.plan);
      if (!plan) {
        return {
          allowed: false,
          reason: 'Invalid plan',
          currentUsage: 0,
          limit: 0,
          remaining: 0
        };
      }

      const currentUsage = await this.getCurrentUsage(tenantId, action);
      const limit = plan.limits[action as keyof typeof plan.limits];
      
      // Unlimited plans
      if (limit === -1) {
        return {
          allowed: true,
          currentUsage: currentUsage,
          limit: -1,
          remaining: -1
        };
      }

      const remaining = limit - currentUsage;
      const allowed = remaining >= increment;

      return {
        allowed,
        reason: allowed ? undefined : `Plan limit exceeded. ${action} limit: ${limit}`,
        currentUsage,
        limit,
        remaining: Math.max(0, remaining)
      };
    } catch (error) {
      console.error('Error checking plan limits:', error);
      return {
        allowed: false,
        reason: 'Error checking limits',
        currentUsage: 0,
        limit: 0,
        remaining: 0
      };
    }
  }

  /**
   * Get current usage for a specific metric
   */
  private async getCurrentUsage(tenantId: string, metric: keyof UsageMetrics): Promise<number> {
    try {
      const tenantDB = createTenantDB(tenantId);
      
      switch (metric) {
        case 'bots':
          const bots = await tenantDB.getBots();
          return bots.length;

        case 'knowledgeBases':
          const knowledgeBases = await tenantDB.getKnowledgeBases();
          return knowledgeBases.length;

        case 'documents':
          const documents = await prisma.document.findMany({
            where: { knowledgeBase: { tenantId: tenantId } }
          });
          return documents.length;

        case 'conversations':
          const conversations = await prisma.conversation.findMany({
            where: { tenantId: tenantId }
          });
          return conversations.length;

        case 'users':
          const users = await tenantDB.getUsers();
          return users.length;

        case 'apiCalls':
          // Get real API usage from the usage tracking service
          return await apiUsageService.getCurrentMonthlyUsage(tenantId);

        case 'storage':
          // Calculate storage in MB
          const docs = await prisma.document.findMany({
            where: { knowledgeBase: { tenantId: tenantId } }
          });
          const totalSize = docs.reduce((acc: number, doc: any) => {
            // Estimate size: 1 character ≈ 1 byte
            return acc + (doc.content?.length || 0);
          }, 0);
          return Math.ceil(totalSize / (1024 * 1024)); // Convert to MB

        default:
          return 0;
      }
    } catch (error) {
      console.error(`Error getting usage for ${metric}:`, error);
      return 0;
    }
  }

  /**
   * Get comprehensive usage check for a tenant
   */
  async getUsageCheck(tenantId: string): Promise<UsageCheck> {
    try {
      const tenantDB = createTenantDB(tenantId);
      
      const [
        bots,
        knowledgeBases,
        documents,
        conversations,
        users,
        apiCalls,
        storage
      ] = await Promise.all([
        this.checkActionAllowed(tenantId, 'bots'),
        this.checkActionAllowed(tenantId, 'knowledgeBases'),
        this.checkActionAllowed(tenantId, 'documents'),
        this.checkActionAllowed(tenantId, 'conversations'),
        this.checkActionAllowed(tenantId, 'users'),
        this.checkActionAllowed(tenantId, 'apiCalls'),
        this.checkActionAllowed(tenantId, 'storage')
      ]);

      return {
        bots,
        knowledgeBases,
        documents,
        conversations,
        users,
        apiCalls,
        storage
      };
    } catch (error) {
      console.error('Error getting usage check:', error);
      throw new Error('Failed to get usage information');
    }
  }

  /**
   * Check if tenant can create a new bot
   */
  async canCreateBot(tenantId: string): Promise<PlanCheckResult> {
    return this.checkActionAllowed(tenantId, 'bots');
  }

  /**
   * Check if tenant can create a new knowledge base
   */
  async canCreateKnowledgeBase(tenantId: string): Promise<PlanCheckResult> {
    return this.checkActionAllowed(tenantId, 'knowledgeBases');
  }

  /**
   * Check if tenant can upload more documents
   */
  async canUploadDocuments(tenantId: string, documentCount: number = 1): Promise<PlanCheckResult> {
    return this.checkActionAllowed(tenantId, 'documents', documentCount);
  }

  /**
   * Check if tenant can add more users
   */
  async canAddUser(tenantId: string): Promise<PlanCheckResult> {
    return this.checkActionAllowed(tenantId, 'users');
  }

  /**
   * Check if tenant can make API calls
   */
  async canMakeAPICall(tenantId: string): Promise<PlanCheckResult> {
    return this.checkActionAllowed(tenantId, 'apiCalls');
  }

  /**
   * Get plan upgrade recommendations
   */
  getUpgradeRecommendations(tenantId: string, usageCheck: UsageCheck): string[] {
    const recommendations: string[] = [];

    if (!usageCheck.bots.allowed) {
      recommendations.push('Upgrade to add more bots');
    }

    if (!usageCheck.knowledgeBases.allowed) {
      recommendations.push('Upgrade to add more knowledge bases');
    }

    if (!usageCheck.documents.allowed) {
      recommendations.push('Upgrade to upload more documents');
    }

    if (!usageCheck.users.allowed) {
      recommendations.push('Upgrade to add more team members');
    }

    if (!usageCheck.apiCalls.allowed) {
      recommendations.push('Upgrade for higher API limits');
    }

    if (!usageCheck.storage.allowed) {
      recommendations.push('Upgrade for more storage');
    }

    return recommendations;
  }

  /**
   * Check if feature is available for plan
   */
  isFeatureAvailable(planId: string, feature: string): boolean {
    const plan = stripeService.getPlan(planId);
    if (!plan) return false;

    const featureMap: Record<string, string[]> = {
      'FREE': ['basic_chat', 'document_upload', 'basic_analytics'],
      'STARTER': ['basic_chat', 'document_upload', 'basic_analytics', 'priority_support'],
      'PROFESSIONAL': ['basic_chat', 'document_upload', 'basic_analytics', 'priority_support', 'advanced_analytics', 'custom_branding'],
      'ENTERPRISE': ['basic_chat', 'document_upload', 'basic_analytics', 'priority_support', 'advanced_analytics', 'custom_branding', 'white_label', 'dedicated_support']
    };

    return featureMap[planId]?.includes(feature) || false;
  }

  /**
   * Get plan comparison for upgrade page
   */
  getPlanComparison(): Array<{
    plan: PlanDetails;
    features: Array<{
      name: string;
      available: boolean;
      description: string;
    }>;
  }> {
    const allFeatures = [
      { name: 'basic_chat', description: 'AI-powered chat widget' },
      { name: 'document_upload', description: 'Upload and process documents' },
      { name: 'basic_analytics', description: 'Basic usage analytics' },
      { name: 'priority_support', description: 'Priority customer support' },
      { name: 'advanced_analytics', description: 'Advanced analytics and insights' },
      { name: 'custom_branding', description: 'Customize widget appearance' },
      { name: 'white_label', description: 'White-label solution' },
      { name: 'dedicated_support', description: 'Dedicated account manager' }
    ];

    return stripeService.getPlans().map(plan => ({
      plan,
      features: allFeatures.map(feature => ({
        ...feature,
        available: this.isFeatureAvailable(plan.id, feature.name)
      }))
    }));
  }
}

// Export singleton instance
export const planLimitsService = new PlanLimitsService(); 