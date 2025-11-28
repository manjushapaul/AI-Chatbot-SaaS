import { NextRequest, NextResponse } from 'next/server';
import { createAIService } from '@/lib/ai';
import { prisma } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const { message, conversationId, botId } = await request.json();

    if (!message || !botId) {
      return NextResponse.json(
        { error: 'Message and botId are required' },
        { status: 400 }
      );
    }

    // Validate message length
    if (message.length > 1000) {
      return NextResponse.json(
        { error: 'Message too long. Maximum 1000 characters allowed.' },
        { status: 400 }
      );
    }

    // Get bot and validate it exists and is active
    const bot = await prisma.bot.findFirst({
      where: { 
        id: botId,
        status: 'ACTIVE'
      },
      include: {
        tenant: {
          select: { id: true, name: true, status: true }
        }
      }
    });

    if (!bot) {
      return NextResponse.json(
        { error: 'Bot not found or inactive' },
        { status: 404 }
      );
    }

    // Check if tenant is active
    if (bot.tenant.status !== 'ACTIVE') {
      return NextResponse.json(
        { error: 'Bot service temporarily unavailable' },
        { status: 503 }
      );
    }

    // Create AI service for the bot's tenant
    const aiService = createAIService(bot.tenantId);

    let conversation;
    
    if (conversationId) {
      // Get existing conversation
      conversation = await prisma.conversation.findFirst({
        where: { 
          id: conversationId,
          botId: botId
        }
      });
      
      if (!conversation) {
        return NextResponse.json(
          { error: 'Conversation not found' },
          { status: 404 }
        );
      }
    } else {
      // Create new conversation with better session management
      // Create a new conversation for public chat
      // Note: We need a userId for the conversation, so we'll use a placeholder or create an anonymous user
      // For now, we'll use the bot's tenant's first user or create a system user
      const tenantUsers = await prisma.user.findMany({
        where: { tenantId: bot.tenantId },
        take: 1
      });
      
      const userId = tenantUsers[0]?.id || bot.tenantId; // Fallback to tenantId if no users exist
      
      conversation = await prisma.conversation.create({
        data: {
          userId,
          botId,
          tenantId: bot.tenantId,
          status: 'ACTIVE'
        }
      });
    }

    // Basic rate limiting - check conversation count in last hour
    const recentConversations = await prisma.conversation.count({
      where: {
        sessionId: conversation.sessionId,
        createdAt: {
          gte: new Date(Date.now() - 60 * 60 * 1000) // Last hour
        }
      }
    });

    if (recentConversations > 50) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        { status: 429 }
      );
    }

    // Process chat with AI
    let response;
    try {
      response = await aiService.chat(message, conversation.id, botId);
    } catch (aiError) {
      console.error('AI service error:', aiError);
      return NextResponse.json(
        { error: 'AI service temporarily unavailable. Please try again.' },
        { status: 503 }
      );
    }

    // Store the user message and bot response in the conversation
    try {
      await prisma.message.createMany({
        data: [
          {
            content: message,
            role: 'USER',
            conversationId: conversation.id,
          },
          {
            content: response.message,
            role: 'ASSISTANT',
            conversationId: conversation.id,
          }
        ]
      });
    } catch (dbError) {
      console.error('Database error storing messages:', dbError);
      // Continue even if message storage fails - the chat response is more important
    }

    return NextResponse.json({
      success: true,
      data: {
        conversationId: conversation.id,
        message: response.message,
        sources: response.sources,
        metadata: response.metadata,
      },
    }, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      }
    });

  } catch (error) {
    console.error('Public chat API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get('conversationId');
    const botId = searchParams.get('botId');

    if (!conversationId || !botId) {
      return NextResponse.json(
        { error: 'Conversation ID and botId are required' },
        { status: 400 }
      );
    }

    // Get conversation and validate it belongs to the bot
    const conversation = await prisma.conversation.findFirst({
      where: { 
        id: conversationId,
        botId: botId
      },
      include: {
        messages: {
          orderBy: { timestamp: 'asc' }
        }
      }
    });

    if (!conversation) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        conversationId: conversation.id,
        sessionId: conversation.sessionId,
        messages: conversation.messages.map((msg: { id: string; content: string; role: string; timestamp: Date }) => ({
          id: msg.id,
          content: msg.content,
          role: msg.role.toLowerCase(),
          timestamp: msg.timestamp
        }))
      }
    }, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      }
    });

  } catch (error) {
    console.error('Get public conversation API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
} 