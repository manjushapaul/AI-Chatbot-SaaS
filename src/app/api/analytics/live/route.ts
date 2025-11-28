import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getTenantContext } from '@/lib/tenant';
import { prisma } from '@/lib/db';

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

    // Get real-time metrics from database
    const [
      currentUsers,
      activeConversations,
      totalConversations,
      totalMessages,
      avgResponseTime,
      systemStatus
    ] = await Promise.all([
      // Current active users (users with activity in last 5 minutes)
      prisma.user.count({
        where: {
          tenantId,
          updatedAt: {
            gte: new Date(Date.now() - 5 * 60 * 1000) // Last 5 minutes
          }
        }
      }),
      
      // Currently active conversations
      prisma.conversation.count({
        where: {
          tenantId,
          status: 'ACTIVE'
        }
      }),
      
      // Total conversations today
      prisma.conversation.count({
        where: {
          tenantId,
          startedAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)) // Today
          }
        }
      }),
      
      // Total messages today
      prisma.message.count({
        where: {
          conversation: {
            tenantId,
            startedAt: {
              gte: new Date(new Date().setHours(0, 0, 0, 0)) // Today
            }
          }
        }
      }),
      
      // Average response time (last 24 hours)
      prisma.message.aggregate({
        where: {
          conversation: {
            tenantId,
            startedAt: {
              gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
            }
          },
          role: 'ASSISTANT'
        },
        _avg: {
          responseTime: true
        }
      }),
      
      // System health check (uptime, errors, etc.)
      prisma.conversation.aggregate({
        where: {
          tenantId,
          startedAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
          }
        },
        _count: true
      })
    ]);

    // Calculate system health based on actual metrics
    let systemHealth: 'excellent' | 'good' | 'warning' | 'critical' = 'excellent';
    
    // If no conversations in 24 hours, system might be down
    if (totalConversations === 0) {
      systemHealth = 'warning';
    }
    
    // If response time is very high, system might be slow
    const avgResponseTimeMs = avgResponseTime._avg.responseTime || 0;
    if (avgResponseTimeMs > 10000) { // 10 seconds
      systemHealth = 'warning';
    } else if (avgResponseTimeMs > 30000) { // 30 seconds
      systemHealth = 'critical';
    }

    // Calculate average wait time (simplified - based on response time)
    const avgWaitTime = avgResponseTimeMs > 0 ? (avgResponseTimeMs / 1000).toFixed(1) : '0.0';

    // Get recent bot activity
    const recentBotActivity = await prisma.bot.findMany({
      where: { tenantId },
      select: {
        id: true,
        name: true,
        _count: {
          select: {
            conversations: {
              where: {
                startedAt: {
                  gte: new Date(Date.now() - 60 * 60 * 1000) // Last hour
                }
              }
            }
          }
        }
      }
    });

    const realTimeMetrics = {
      currentUsers: currentUsers,
      activeConversations: activeConversations,
      totalConversationsToday: totalConversations,
      totalMessagesToday: totalMessages,
      avgWaitTime: parseFloat(avgWaitTime),
      systemHealth: systemHealth,
      lastUpdated: new Date().toISOString(),
      botActivity: recentBotActivity.map(bot => ({
        name: bot.name,
        recentConversations: bot._count.conversations
      }))
    };

    return NextResponse.json(realTimeMetrics);

  } catch (error) {
    console.error('Live metrics API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 