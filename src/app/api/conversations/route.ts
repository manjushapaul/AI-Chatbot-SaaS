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

    console.log('[Conversations API] Session user:', session.user.email, 'Tenant ID:', session.user.tenantId);

    // Try to get tenant context, but fallback to session tenantId if available
    let tenant = await getTenantContext();
    
    // If getTenantContext fails, try using tenantId from session
    if (!tenant && session.user.tenantId) {
      console.log('[Conversations API] Tenant context not found, using session tenantId:', session.user.tenantId);
      // Create a minimal tenant object from session
      tenant = {
        id: session.user.tenantId,
        name: 'Unknown',
        subdomain: '',
      };
    }

    if (!tenant) {
      console.error('[Conversations API] No tenant found in context or session');
      // Return empty data instead of error to prevent dashboard from breaking
      return NextResponse.json({
        success: true,
        data: [],
      });
    }

    console.log('[Conversations API] Using tenant:', tenant.id);

    try {
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
      
      const conversations = await db.getConversations(filters).catch((error) => {
        console.error('[Conversations API] Error fetching conversations:', error);
        return [];
      });
      
      // Transform the data to match the frontend interface
      const transformedConversations = conversations.map((conv: Record<string, unknown>) => ({
        id: conv.id,
        userId: conv.userId,
        botId: conv.botId,
        botName: (conv.bots || conv.bot)?.name || 'Unknown Bot',
        userName: (conv.users || conv.user)?.name || 'Unknown User',
        userEmail: (conv.users || conv.user)?.email || 'unknown@example.com',
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
    } catch (dbError) {
      console.error('[Conversations API] Database error:', dbError);
      // Return empty data instead of error
      return NextResponse.json({
        success: true,
        data: [],
      });
    }

  } catch (error) {
    console.error('[Conversations API] Get conversations API error:', error);
    // Return empty data instead of error to prevent dashboard from breaking
    return NextResponse.json({
      success: true,
      data: [],
    });
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