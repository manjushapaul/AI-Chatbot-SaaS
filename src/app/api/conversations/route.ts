import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getTenantContext } from '@/lib/tenant';
import { createTenantDB } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tenant = await getTenantContext();
    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 400 });
    }

    const db = createTenantDB(tenant.id);
    
    // Get query parameters for filtering
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const botId = searchParams.get('botId');
    const status = searchParams.get('status') as 'ACTIVE' | 'CLOSED' | 'ARCHIVED' | null;
    
    const filters: { userId?: string; botId?: string; status?: 'ACTIVE' | 'CLOSED' | 'ARCHIVED' } = {};
    if (userId) filters.userId = userId;
    if (botId) filters.botId = botId;
    if (status) filters.status = status;
    
    const conversations = await db.getConversations(filters);
    
    // Transform the data to match the frontend interface
    const transformedConversations = conversations.map((conv: { id: string; userId: string | null; botId: string; bot?: { name: string | null; id: string } | null; user?: { name: string | null; email: string; id: string } | null; status: string; startedAt?: Date; lastMessageAt?: Date; totalTokens?: number; totalCost?: number; _count?: { messages?: number }; [key: string]: unknown }) => ({
      id: conv.id,
      userId: conv.userId,
      botId: conv.botId,
      botName: conv.bot?.name || 'Unknown Bot',
      userName: conv.user?.name || 'Unknown User',
      userEmail: conv.user?.email || 'unknown@example.com',
      status: conv.status,
      messageCount: conv._count?.messages || 0,
      startedAt: conv.startedAt?.toISOString() || new Date().toISOString(),
      lastMessageAt: conv.lastMessageAt?.toISOString() || new Date().toISOString(),
      totalTokens: conv.totalTokens || 0,
      totalCost: conv.totalCost || 0,
      createdAt: conv.startedAt?.toISOString() || new Date().toISOString(),
      updatedAt: conv.lastMessageAt?.toISOString() || new Date().toISOString()
    }));

    return NextResponse.json({
      success: true,
      data: transformedConversations,
    });

  } catch (error) {
    console.error('Get conversations API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tenant = await getTenantContext();
    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 400 });
    }

    const { userId, botId, initialMessage } = await request.json();

    if (!userId || !botId) {
      return NextResponse.json(
        { error: 'User ID and Bot ID are required' },
        { status: 400 }
      );
    }

    const db = createTenantDB(tenant.id);
    
    // Create a new conversation in the database
    const conversation = await db.createConversation({
      userId,
      botId,
      title: initialMessage ? initialMessage.substring(0, 100) : 'New Conversation',
      status: 'ACTIVE',
      totalTokens: 0,
      totalCost: 0.0,
      messageCount: 0,
    });

    // If there's an initial message, add it
    if (initialMessage) {
      await db.addMessage({
        conversationId: conversation.id,
        role: 'USER',
        content: initialMessage,
        tokens: Math.ceil(initialMessage.length / 4), // Rough token estimate
        cost: 0.0001, // Rough cost estimate
        model: 'gpt-3.5-turbo',
      });
      
      // Update conversation with message count
      await db.updateConversation(conversation.id, {
        messageCount: 1,
        lastMessageAt: new Date(),
      });
    }

    return NextResponse.json({
      success: true,
      data: conversation,
    }, { status: 201 });

  } catch (error) {
    console.error('Create conversation API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 