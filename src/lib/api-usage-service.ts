import { prisma } from './db';
import { stripeService } from './stripe';
import { Prisma } from '@prisma/client';
import { randomUUID } from 'crypto';

export interface APIUsageRecord {
  tenantId: string;
  endpoint: string;
  method: string;
  statusCode: number;
  responseTime: number;
  tokensUsed?: number;
  model?: string;
  userId?: string;
  botId?: string;
  conversationId?: string;
  metadata?: Record<string, unknown>;
}

export interface UsageSummary {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  totalTokens: number;
  averageResponseTime: number;
  totalCost: number;
  requestsByEndpoint: Record<string, number>;
  requestsByStatus: Record<string, number>;
}

export interface RateLimitInfo {
  isAllowed: boolean;
  currentUsage: number;
  limit: number;
  remaining: number;
  resetTime: Date;
  nextResetTime: Date;
}

export class APIUsageService {
  /**
   * Record an API usage event
   */
  async recordUsage(usage: APIUsageRecord): Promise<void> {
    try {
      await prisma.api_usage.create({
        data: {
          id: randomUUID().replace(/-/g, ''),
          tenantId: usage.tenantId,
          endpoint: usage.endpoint,
          method: usage.method,
          statusCode: usage.statusCode,
          responseTime: usage.responseTime,
          tokensUsed: usage.tokensUsed ?? null,
          model: usage.model ?? null,
          userId: usage.userId ?? null,
          botId: usage.botId ?? null,
          conversationId: usage.conversationId ?? null,
          metadata: usage.metadata ? (usage.metadata as Prisma.InputJsonValue) : undefined,
          timestamp: new Date()
        }
      });
    } catch (error) {
      console.error('Error recording API usage:', error);
      // Don't throw - usage tracking shouldn't break the main API
    }
  }

  /**
   * Check if tenant can make an API call
   */
  async canMakeAPICall(tenantId: string): Promise<RateLimitInfo> {
    try {
      const tenant = await prisma.tenants.findUnique({
        where: { id: tenantId }
      });

      if (!tenant) {
        return {
          isAllowed: false,
          currentUsage: 0,
          limit: 0,
          remaining: 0,
          resetTime: new Date(),
          nextResetTime: new Date()
        };
      }

      const plan = stripeService.getPlan(tenant.plan);
      if (!plan) {
        return {
          isAllowed: false,
          currentUsage: 0,
          limit: 0,
          remaining: 0,
          resetTime: new Date(),
          nextResetTime: new Date()
        };
      }

      const limit = plan.limits.apiCalls;
      if (limit === -1) {
        // Unlimited plan
        return {
          isAllowed: true,
          currentUsage: await this.getCurrentMonthlyUsage(tenantId),
          limit: -1,
          remaining: -1,
          resetTime: new Date(),
          nextResetTime: this.getNextMonthStart()
        };
      }

      const currentUsage = await this.getCurrentMonthlyUsage(tenantId);
      const remaining = limit - currentUsage;
      const isAllowed = remaining > 0;

      return {
        isAllowed,
        currentUsage,
        limit,
        remaining: Math.max(0, remaining),
        resetTime: this.getCurrentMonthStart(),
        nextResetTime: this.getNextMonthStart()
      };
    } catch (error) {
      console.error('Error checking API call allowance:', error);
      return {
        isAllowed: false,
        currentUsage: 0,
        limit: 0,
        remaining: 0,
        resetTime: new Date(),
        nextResetTime: new Date()
      };
    }
  }

  /**
   * Get current monthly API usage for a tenant
   */
  async getCurrentMonthlyUsage(tenantId: string): Promise<number> {
    try {
      const monthStart = this.getCurrentMonthStart();
      const monthEnd = this.getNextMonthStart();

      const usage = await prisma.api_usage.aggregate({
        where: {
          tenantId,
          timestamp: {
            gte: monthStart,
            lt: monthEnd
          }
        },
        _count: {
          id: true
        }
      });

      return usage._count.id || 0;
    } catch (error) {
      console.error('Error getting current monthly usage:', error);
      return 0;
    }
  }

  /**
   * Get detailed usage summary for a tenant
   */
  async getUsageSummary(tenantId: string, timeRange: 'day' | 'week' | 'month' = 'month'): Promise<UsageSummary> {
    try {
      const startDate = this.getStartDate(timeRange);
      const endDate = new Date();

      const usage = await prisma.api_usage.findMany({
        where: {
          tenantId,
          timestamp: {
            gte: startDate,
            lte: endDate
          }
        }
      });

      const totalRequests = usage.length;
      const successfulRequests = usage.filter((u: { statusCode: number }) => u.statusCode >= 200 && u.statusCode < 300).length;
      const failedRequests = totalRequests - successfulRequests;
      const totalTokens = usage.reduce((sum: number, u: { tokensUsed?: number | null }) => sum + (u.tokensUsed || 0), 0);
      const averageResponseTime = totalRequests > 0 
        ? usage.reduce((sum: number, u: { responseTime: number }) => sum + u.responseTime, 0) / totalRequests 
        : 0;

      // Group by endpoint
      const requestsByEndpoint: Record<string, number> = {};
      usage.forEach((u: { endpoint: string; statusCode: number }) => {
        requestsByEndpoint[u.endpoint] = (requestsByEndpoint[u.endpoint] || 0) + 1;
      });

      // Group by status code
      const requestsByStatus: Record<string, number> = {};
      usage.forEach((u: { endpoint: string; statusCode: number }) => {
        const statusGroup = Math.floor(u.statusCode / 100) + 'xx';
        requestsByStatus[statusGroup] = (requestsByStatus[statusGroup] || 0) + 1;
      });

      // Calculate cost (simplified - you might want to use actual OpenAI pricing)
      const totalCost = this.calculateCost(totalTokens);

      return {
        totalRequests,
        successfulRequests,
        failedRequests,
        totalTokens,
        averageResponseTime,
        totalCost,
        requestsByEndpoint,
        requestsByStatus
      };
    } catch (error) {
      console.error('Error getting usage summary:', error);
      return {
        totalRequests: 0,
        successfulRequests: 0,
        failedRequests: 0,
        totalTokens: 0,
        averageResponseTime: 0,
        totalCost: 0,
        requestsByEndpoint: {},
        requestsByStatus: {}
      };
    }
  }

  /**
   * Get usage trends over time
   */
  async getUsageTrends(tenantId: string, days: number = 30): Promise<Array<{ date: string; requests: number; tokens: number }>> {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const usage = await prisma.api_usage.findMany({
        where: {
          tenantId,
          timestamp: {
            gte: startDate
          }
        },
        select: {
          timestamp: true,
          tokensUsed: true
        }
      });

      // Group by date
      const dailyUsage: Record<string, { requests: number; tokens: number }> = {};
      
      usage.forEach(u => {
        const date = u.timestamp.toISOString().split('T')[0];
        if (!dailyUsage[date]) {
          dailyUsage[date] = { requests: 0, tokens: 0 };
        }
        dailyUsage[date].requests += 1;
        dailyUsage[date].tokens += u.tokensUsed || 0;
      });

      // Fill in missing dates with 0
      const trends = [];
      for (let i = 0; i < days; i++) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        
        trends.unshift({
          date: dateStr,
          requests: dailyUsage[dateStr]?.requests || 0,
          tokens: dailyUsage[dateStr]?.tokens || 0
        });
      }

      return trends;
    } catch (error) {
      console.error('Error getting usage trends:', error);
      return [];
    }
  }

  /**
   * Get top API consumers (users/bots)
   */
  async getTopConsumers(tenantId: string, timeRange: 'day' | 'week' | 'month' = 'month'): Promise<Array<{ id: string; type: 'user' | 'bot'; requests: number; tokens: number }>> {
    try {
      const startDate = this.getStartDate(timeRange);
      const endDate = new Date();

      const usage = await prisma.api_usage.findMany({
        where: {
          tenantId,
          timestamp: {
            gte: startDate,
            lte: endDate
          },
          OR: [
            { userId: { not: null } },
            { botId: { not: null } }
          ]
        },
        select: {
          userId: true,
          botId: true,
          tokensUsed: true
        }
      });

      const consumers: Record<string, { type: 'user' | 'bot'; requests: number; tokens: number }> = {};

      usage.forEach(u => {
        if (u.userId) {
          if (!consumers[u.userId]) {
            consumers[u.userId] = { type: 'user', requests: 0, tokens: 0 };
          }
          consumers[u.userId].requests += 1;
          consumers[u.userId].tokens += u.tokensUsed || 0;
        } else if (u.botId) {
          if (!consumers[u.botId]) {
            consumers[u.botId] = { type: 'bot', requests: 0, tokens: 0 };
          }
          consumers[u.botId].requests += 1;
          consumers[u.botId].tokens += u.tokensUsed || 0;
        }
      });

      return Object.entries(consumers)
        .map(([id, data]) => ({ id, ...data }))
        .sort((a, b) => b.requests - a.requests)
        .slice(0, 10);
    } catch (error) {
      console.error('Error getting top consumers:', error);
      return [];
    }
  }

  /**
   * Clean up old usage data
   */
  async cleanupOldUsage(olderThanDays: number = 90): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

      const result = await prisma.api_usage.deleteMany({
        where: {
          timestamp: {
            lt: cutoffDate
          }
        }
      });

      return result.count;
    } catch (error) {
      console.error('Error cleaning up old usage data:', error);
      return 0;
    }
  }

  /**
   * Get current month start date
   */
  private getCurrentMonthStart(): Date {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  }

  /**
   * Get next month start date
   */
  private getNextMonthStart(): Date {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth() + 1, 1);
  }

  /**
   * Get start date for time range
   */
  private getStartDate(timeRange: 'day' | 'week' | 'month'): Date {
    const now = new Date();
    switch (timeRange) {
      case 'day':
        return new Date(now.getFullYear(), now.getMonth(), now.getDate());
      case 'week':
        const dayOfWeek = now.getDay();
        const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
        now.setDate(now.getDate() - daysToSubtract);
        return new Date(now.getFullYear(), now.getMonth(), now.getDate());
      case 'month':
        return new Date(now.getFullYear(), now.getMonth(), 1);
      default:
        return new Date(now.getFullYear(), now.getMonth(), 1);
    }
  }

  /**
   * Calculate cost based on token usage
   */
  private calculateCost(tokens: number): number {
    // Simplified cost calculation - adjust based on your actual pricing
    // OpenAI GPT-3.5-turbo: $0.002 per 1K tokens
    const costPer1KTokens = 0.002;
    return (tokens / 1000) * costPer1KTokens;
  }
}

// Export singleton instance
export const apiUsageService = new APIUsageService(); 