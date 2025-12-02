import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getTenantContext } from '@/lib/tenant';
import { prisma } from '@/lib/db';

// Type definitions based on Prisma schema
type ConversationWithMessages = {
  id: string;
  status: 'ACTIVE' | 'CLOSED' | 'ARCHIVED';
  startedAt: Date;
  lastMessageAt: Date;
  tenantId: string;
  botId: string;
  userId?: string;
  messages: Array<{
    id: string;
    content: string;
    role: 'USER' | 'ASSISTANT' | 'SYSTEM';
    createdAt: Date;
    conversationId: string;
  }>;
  bot: {
    id: string;
    name: string;
  };
};

type UserType = {
  id: string;
  email: string;
  name: string | null;
  createdAt: Date;
  updatedAt: Date;
  tenantId: string;
};

type BotType = {
  id: string;
  name: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
  tenantId: string;
};

export async function GET(request: NextRequest) {
  try {
    // Get authenticated session
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get tenant context
    const tenant = await getTenantContext();
    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 400 });
    }

    const tenantId = tenant.id;
    
    const { searchParams } = new URL(request.url);
    const timeRange = searchParams.get('timeRange') || '7d';

    // Calculate date range based on timeRange
    const now = new Date();
    let startDate: Date;
    
    switch (timeRange) {
      case '24h':
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }

    // Get conversations data
    const conversations: ConversationWithMessages[] = await (prisma as any).conversations.findMany({
      where: {
        tenantId,
        startedAt: {
          gte: startDate,
        },
      },
      include: {
        messages: true,
        bot: true,
      },
    });

    // Get users data
    const users: UserType[] = await (prisma as any).users.findMany({
      where: {
        tenantId,
        createdAt: {
          gte: startDate,
        },
      },
    });

    // Calculate metrics
    const totalConversations = conversations.length;
    const activeConversations = conversations.filter((c: ConversationWithMessages) => c.status === 'ACTIVE').length;
    const completedConversations = conversations.filter((c: ConversationWithMessages) => c.status === 'CLOSED').length;
    const abandonedConversations = conversations.filter((c: ConversationWithMessages) => c.status === 'ARCHIVED').length;

    const totalUsers = users.length;
    const newUsers = users.filter((u: UserType) => 
      u.createdAt >= new Date(now.getTime() - 24 * 60 * 60 * 1000)
    ).length;
    const returningUsers = totalUsers - newUsers;

    // Calculate average response time
    const responseTimes = conversations
      .flatMap((c: ConversationWithMessages) => c.messages)
      .filter((m) => m.role === 'ASSISTANT')
      .map((m) => {
        const userMessage = conversations
          .flatMap((c: ConversationWithMessages) => c.messages)
          .find((msg) => msg.role === 'USER' && msg.conversationId === m.conversationId);
        if (userMessage) {
          return new Date(m.createdAt).getTime() - new Date(userMessage.createdAt).getTime();
        }
        return 0;
      })
      .filter((time: number) => time > 0);

    const avgResponseTime = responseTimes.length > 0 
      ? responseTimes.reduce((a: number, b: number) => a + b, 0) / responseTimes.length / 1000 
      : 0;

    // Calculate satisfaction score (placeholder - implement based on your feedback system)
    // For now, we'll use a calculated score based on conversation completion rate
    const satisfactionScore = totalConversations > 0 ? Math.round((completedConversations / totalConversations) * 100) : 0;

    // Generate time series data
    const timeSeriesData = [];
    const days = Math.ceil((now.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000));
    
    for (let i = 0; i < days; i++) {
      const date = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
      const dayConversations = conversations.filter((c: ConversationWithMessages) => 
        c.startedAt.toDateString() === date.toDateString()
      );
      const dayUsers = users.filter((u: UserType) => 
        u.createdAt.toDateString() === date.toDateString()
      );
      
      timeSeriesData.push({
        date: date.toISOString().split('T')[0],
        conversations: dayConversations.length,
        users: dayUsers.length,
        satisfaction: satisfactionScore,
        responseTime: avgResponseTime,
        errors: 0, // Implement error tracking
      });
    }

    // Bot performance data
    const botPerformance = await Promise.all(
      (await (prisma as any).bots.findMany({ where: { tenantId } })).map(async (bot: BotType) => {
        const botConversations = conversations.filter((c: ConversationWithMessages) => c.botId === bot.id);
        const botSatisfaction = satisfactionScore; // Placeholder
        const botResponseTime = avgResponseTime; // Placeholder
        
        return {
          name: bot.name,
          conversations: botConversations.length,
          satisfaction: botSatisfaction,
          responseTime: botResponseTime,
          successRate: 90, // Placeholder
          avgSessionLength: 10, // Placeholder
        };
      })
    );

    // Conversation topics (placeholder - implement based on your message analysis)
    // For now, return empty array until topic analysis is implemented
    const conversationTopics: Array<{
      topic: string;
      count: number;
      percentage: number;
      trend: 'up' | 'down' | 'stable';
      avgResolutionTime: number;
    }> = [];

    // User journey funnel
    const userJourney = [
      { stage: 'Landing Page', users: 1000, conversion: 100, avgTime: 0 },
      { stage: 'Chat Initiated', users: totalConversations, conversion: (totalConversations / 1000) * 100, avgTime: 2.3 },
      { stage: 'First Response', users: activeConversations + completedConversations, conversion: ((activeConversations + completedConversations) / 1000) * 100, avgTime: 5.1 },
      { stage: 'Issue Resolved', users: completedConversations, conversion: (completedConversations / 1000) * 100, avgTime: 12.8 },
      { stage: 'Satisfaction Survey', users: Math.floor(completedConversations * 0.8), conversion: (Math.floor(completedConversations * 0.8) / 1000) * 100, avgTime: 15.2 },
      { stage: 'Return Visit', users: returningUsers, conversion: (returningUsers / 1000) * 100, avgTime: 0 }
    ];

    // Peak hours analysis (placeholder - implement based on your timestamp data)
    // For now, return empty array until hourly analysis is implemented
    const peakHours: Array<{ hour: number; count: number }> = [];

    // Real-time metrics
    const realTimeMetrics = {
      currentUsers: activeConversations, // Simplified - active users = active conversations
      activeConversations: activeConversations,
      avgWaitTime: avgResponseTime,
      systemHealth: 'excellent' as const,
    };

    const analyticsData = {
      conversations: {
        total: totalConversations,
        active: activeConversations,
        completed: completedConversations,
        abandoned: abandonedConversations,
        avgDuration: 8.5, // Placeholder - implement based on your data
        peakHours,
      },
      users: {
        total: totalUsers,
        new: newUsers,
        returning: returningUsers,
        active: activeConversations, // Simplified - active users = active conversations
        demographics: [], // Placeholder - implement based on your user data
        locations: [], // Placeholder - implement based on your user data
      },
      performance: {
        avgResponseTime: Math.round(avgResponseTime * 10) / 10,
        satisfactionScore,
        resolutionRate: completedConversations > 0 ? Math.round((completedConversations / totalConversations) * 100) : 0,
        uptime: 100, // Simplified - assume 100% uptime for now
        errorRate: 0, // Simplified - assume 0% error rate for now
        latency: Math.round(avgResponseTime * 1000), // Convert response time to milliseconds
      },
      timeSeriesData,
      botPerformance,
      conversationTopics,
      userJourney,
      realTimeMetrics,
    };

    return NextResponse.json(analyticsData);
  } catch (error) {
    console.error('Analytics API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 