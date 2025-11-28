import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getTenantContext } from '@/lib/tenant';
import { createTenantDB } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tenant = await getTenantContext();
    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 400 });
    }

    const { id } = await params;
    const db = createTenantDB(tenant.id);
    const conversation = await db.getConversation(id);
    
    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    // Transform the data to match the frontend interface
    const transformedConversation = {
      id: conversation.id,
      userId: conversation.userId,
      botId: conversation.botId,
      botName: conversation.bot?.name || 'Unknown Bot',
      userName: conversation.user?.name || 'Unknown User',
      userEmail: conversation.user?.email || 'unknown@example.com',
      status: conversation.status,
      title: conversation.title,
      messageCount: conversation.messages?.length || 0,
      startedAt: conversation.startedAt?.toISOString(),
      lastMessageAt: conversation.lastMessageAt?.toISOString(),
      closedAt: conversation.closedAt?.toISOString(),
      totalTokens: conversation.totalTokens,
      totalCost: conversation.totalCost,
      messages: conversation.messages?.map(msg => ({
        id: msg.id,
        role: msg.role,
        content: msg.content,
        tokens: msg.tokens,
        cost: msg.cost,
        model: msg.model,
        responseTime: msg.responseTime,
        createdAt: msg.createdAt.toISOString(),
      })) || [],
    };

    return NextResponse.json({
      success: true,
      data: transformedConversation,
    });

  } catch (error) {
    console.error('Get conversation API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tenant = await getTenantContext();
    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 400 });
    }

    const { id } = await params;
    const { status, title } = await request.json();

    const db = createTenantDB(tenant.id);
    
    // Verify conversation exists and belongs to tenant
    const existingConversation = await db.getConversation(id);
    if (!existingConversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    // Update conversation
    const updatedConversation = await db.updateConversation(id, {
      status,
      title,
      ...(status === 'CLOSED' && { closedAt: new Date() }),
    });

    // Create notification when conversation is closed
    if (status === 'CLOSED' && existingConversation.userId) {
      try {
        const preferences = await db.getNotificationPreferences(existingConversation.userId);
        const botActivityPref = preferences.find(p => p.category === 'bot_activity');
        
        if (!botActivityPref || botActivityPref.inAppEnabled) {
          const bot = await db.getBot(existingConversation.botId);
          await db.createNotification({
            userId: existingConversation.userId,
            type: 'BOT_ACTIVITY',
            title: 'Conversation resolved',
            message: `Your conversation with ${bot?.name || 'the bot'} has been resolved`,
            category: 'bot_activity',
            priority: 'LOW',
            actionUrl: `/dashboard/conversations?conversation=${id}`,
            metadata: {
              conversationId: id,
              botId: existingConversation.botId,
            },
          });
        }
      } catch (error) {
        console.error('Failed to create conversation resolved notification:', error);
      }
    }

    return NextResponse.json({
      success: true,
      data: updatedConversation,
      message: 'Conversation updated successfully'
    });

  } catch (error) {
    console.error('Update conversation API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tenant = await getTenantContext();
    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 400 });
    }

    const { id } = await params;
    const db = createTenantDB(tenant.id);
    
    // Verify conversation exists and belongs to tenant
    const existingConversation = await db.getConversation(id);
    if (!existingConversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    // Delete conversation
    await db.deleteConversation(id);

    return NextResponse.json({
      success: true,
      message: 'Conversation deleted successfully'
    });

  } catch (error) {
    console.error('Delete conversation API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 