import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getTenantContext } from '@/lib/tenant';
import { createAIService } from '@/lib/ai';
import { createTenantDB } from '@/lib/db';
import { apiUsageService } from '@/lib/api-usage-service';

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // Get user session
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get tenant context
    const tenantContext = await getTenantContext();
    if (!tenantContext) {
      return NextResponse.json(
        { error: 'Tenant not found' },
        { status: 404 }
      );
    }

    // Check API usage limits before processing
    const rateLimitInfo = await apiUsageService.canMakeAPICall(tenantContext.id);
    if (!rateLimitInfo.isAllowed) {
      return NextResponse.json(
        { 
          error: 'API call limit exceeded',
          currentUsage: rateLimitInfo.currentUsage,
          limit: rateLimitInfo.limit,
          resetTime: rateLimitInfo.nextResetTime
        },
        { status: 429 }
      );
    }

    // Parse request body
    const { message, conversationId, botId } = await request.json();

    if (!message || !botId) {
      return NextResponse.json(
        { error: 'Message and botId are required' },
        { status: 400 }
      );
    }

    // Create tenant-scoped services
    const tenantDB = createTenantDB(tenantContext.id);
    const aiService = createAIService(tenantContext.id);

    // Validate bot exists and belongs to tenant
    const bot = await tenantDB.getBot(botId);
    if (!bot) {
      return NextResponse.json(
        { error: 'Bot not found' },
        { status: 404 }
      );
    }

    let conversation;
    
    if (conversationId) {
      // Get existing conversation
      conversation = await tenantDB.getConversation(conversationId);
      if (!conversation) {
        return NextResponse.json(
          { error: 'Conversation not found' },
          { status: 404 }
        );
      }
    } else {
      // Create new conversation
      conversation = await tenantDB.createConversation({
        userId: session.user.id,
        botId,
      });

      // Create notification for new conversation (check preferences first)
      try {
        const preferences = await tenantDB.getNotificationPreferences(session.user.id);
        const botActivityPref = preferences.find(p => p.category === 'bot_activity');
        
        // Only create notification if in-app notifications are enabled for bot_activity
        if (!botActivityPref || botActivityPref.inAppEnabled) {
          await tenantDB.createNotification({
            userId: session.user.id,
            type: 'BOT_ACTIVITY',
            title: 'New conversation started',
            message: `A new conversation has been started with ${bot.name}`,
            category: 'bot_activity',
            priority: 'MEDIUM',
            actionUrl: `/dashboard/conversations?conversation=${conversation.id}`,
            metadata: {
              conversationId: conversation.id,
              botId: bot.id,
              botName: bot.name,
            },
          });
        }
      } catch (error) {
        // Don't fail the request if notification creation fails
        console.error('Failed to create conversation notification:', error);
      }
    }

    // Process chat with AI
    let response;
    try {
      response = await aiService.chat(message, conversation.id, botId);
    } catch (error) {
      // If it's an API key error and we're in development, provide a helpful message
      if (error instanceof Error && error.message.includes('API key') && !process.env.OPENAI_API_KEY) {
        // The AI service should have provided a mock response, but if it didn't, 
        // we'll return a helpful error
        return NextResponse.json(
          { 
            success: false,
            error: 'OpenAI API key is not configured. The chatbot is using mock responses. Add OPENAI_API_KEY to your .env file for real AI responses.'
          },
          { status: 200 } // Return 200 so the UI can display the message
        );
      }
      throw error; // Re-throw other errors
    }
    
    const endTime = Date.now();
    const responseTime = endTime - startTime;

    // Record API usage asynchronously
    apiUsageService.recordUsage({
      tenantId: tenantContext.id,
      endpoint: '/api/chat',
      method: 'POST',
      statusCode: 200,
      responseTime,
      tokensUsed: response.metadata?.tokens as number | undefined,
      model: response.metadata?.model as string | undefined,
      userId: conversation.userId || undefined,
      botId,
      conversationId: conversation.id,
      metadata: {
        messageLength: message.length,
        responseLength: response.message.length,
        model: response.metadata?.model,
        tokens: response.metadata?.tokens
      }
    }).catch(error => {
      console.error('Error recording API usage:', error);
    });

    // Add rate limit headers
    const responseObj = NextResponse.json({
      success: true,
      data: {
        conversationId: conversation.id,
        message: response.message,
        sources: response.sources,
        metadata: response.metadata,
      },
    });

    responseObj.headers.set('X-RateLimit-Limit', rateLimitInfo.limit.toString());
    responseObj.headers.set('X-RateLimit-Remaining', (rateLimitInfo.remaining - 1).toString());
    responseObj.headers.set('X-RateLimit-Reset', rateLimitInfo.nextResetTime.toISOString());

    return responseObj;

  } catch (error) {
    const endTime = Date.now();
    const responseTime = endTime - startTime;

    // Record failed API usage
    const tenantContext = await getTenantContext();
    if (tenantContext) {
      apiUsageService.recordUsage({
        tenantId: tenantContext.id,
        endpoint: '/api/chat',
        method: 'POST',
        statusCode: 500,
        responseTime,
        metadata: {
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      }).catch(console.error);
    }

    console.error('Chat API error:', error);
    
    // Provide more specific error messages
    let errorMessage = 'Internal server error';
    let statusCode = 500;
    
    if (error instanceof Error) {
      errorMessage = error.message;
      
      // Map specific errors to appropriate status codes
      if (error.message.includes('not found')) {
        statusCode = 404;
      } else if (error.message.includes('API key') || error.message.includes('not configured') || error.message.includes('OPENAI_API_KEY')) {
        statusCode = 503; // Service unavailable
        errorMessage = 'OpenAI API key is not configured. Please add OPENAI_API_KEY to your .env file and restart the server.';
      } else if (error.message.includes('rate limit') || error.message.includes('quota')) {
        statusCode = 429; // Too many requests
      }
    }
    
    return NextResponse.json(
      { 
        success: false,
        error: errorMessage 
      },
      { status: statusCode }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Get tenant context
    const tenantContext = await getTenantContext();
    if (!tenantContext) {
      return NextResponse.json(
        { error: 'Tenant not found' },
        { status: 404 }
      );
    }

    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get('conversationId');

    if (!conversationId) {
      return NextResponse.json(
        { error: 'Conversation ID is required' },
        { status: 400 }
      );
    }

    // Get conversation
    const tenantDB = createTenantDB(tenantContext.id);
    const conversation = await tenantDB.getConversation(conversationId);

    if (!conversation) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: conversation,
    });

  } catch (error) {
    console.error('Get conversation API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 