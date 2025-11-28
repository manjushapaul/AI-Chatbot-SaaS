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
        },
        include: {
          messages: {
            orderBy: { createdAt: 'asc' },
            take: 50 // Limit to recent messages
          }
        }
      });
      
      if (!conversation) {
        return NextResponse.json(
          { error: 'Conversation not found' },
          { status: 404 }
        );
      }
    } else {
      // Create new conversation for public chat
      // For public chats, we need a userId. We'll use the bot's tenant's first admin user
      // or create a system user if none exists
      let userId: string;
      const tenantUser = await prisma.user.findFirst({
        where: { tenantId: bot.tenantId },
        orderBy: { createdAt: 'asc' }
      });
      
      if (tenantUser) {
        userId = tenantUser.id;
      } else {
        // Create a system user for public chats if no users exist
        const systemUser = await prisma.user.create({
          data: {
            email: `system@${bot.tenantId}.public`,
            name: 'Public Chat User',
            tenantId: bot.tenantId,
            role: 'USER'
          }
        });
        userId = systemUser.id;
      }
      
      const sessionId = `public_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      conversation = await prisma.conversation.create({
        data: {
          userId,
          botId,
          tenantId: bot.tenantId,
          status: 'ACTIVE',
          metadata: {
            sessionId,
            isPublic: true
          }
        }
      });
    }

    // Basic rate limiting - check conversation count in last hour for this bot
    const recentConversations = await prisma.conversation.count({
      where: {
        botId: botId,
        startedAt: {
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
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
      },
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
          orderBy: { createdAt: 'asc' }
        }
      }
    });

    if (!conversation) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      );
    }

    // Get sessionId from metadata if it exists
    const sessionId = (conversation.metadata as { sessionId?: string } | null)?.sessionId || conversation.id;
    
    return NextResponse.json({
      success: true,
      data: {
        conversationId: conversation.id,
        sessionId: sessionId,
        messages: conversation.messages.map((msg: { id: string; content: string; role: string; createdAt: Date }) => ({
          id: msg.id,
          content: msg.content,
          role: msg.role.toLowerCase(),
          timestamp: msg.createdAt
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
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
      },
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