import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getTenantContext } from '@/lib/tenant';
import { createTenantDB } from '@/lib/db';

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

    const { message, widgetId } = await request.json();
    
    if (!message || !widgetId) {
      return NextResponse.json({ error: 'Message and widget ID are required' }, { status: 400 });
    }

    const db = createTenantDB(tenant.id);
    
    // Get widget and bot information
    const widget = await db.getWidget(widgetId);
    if (!widget) {
      return NextResponse.json({ error: 'Widget not found' }, { status: 404 });
    }

    // For testing purposes, we'll create a simple AI response
    // In a real implementation, this would use OpenAI API with RAG from knowledge bases
    
    let aiResponse = '';
    
    // Simple keyword-based responses for testing
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('hey')) {
      aiResponse = `Hello! I'm ${widget.bot?.name || 'your AI assistant'}. How can I help you today?`;
    } else if (lowerMessage.includes('help') || lowerMessage.includes('support')) {
      aiResponse = `I'm here to help! I can assist you with questions about our services, pricing, or any other topics. What would you like to know?`;
    } else if (lowerMessage.includes('pricing') || lowerMessage.includes('cost') || lowerMessage.includes('price')) {
      aiResponse = `We offer flexible pricing plans starting from $29/month. Our plans include different levels of features and usage limits. Would you like me to explain the details?`;
    } else if (lowerMessage.includes('features') || lowerMessage.includes('what can you do')) {
      aiResponse = `I can help with customer support, answer questions about products/services, provide information, and assist with various inquiries. I'm constantly learning and improving!`;
    } else if (lowerMessage.includes('company') || lowerMessage.includes('about')) {
      aiResponse = `We're a technology company focused on providing AI-powered solutions to help businesses improve their customer experience and operational efficiency.`;
    } else if (lowerMessage.includes('contact') || lowerMessage.includes('email') || lowerMessage.includes('phone')) {
      aiResponse = `You can reach our team at support@company.com or call us at +1-555-0123. I'm also available 24/7 to help with immediate questions!`;
    } else if (lowerMessage.includes('thank')) {
      aiResponse = `You're welcome! I'm happy to help. Is there anything else you'd like to know?`;
    } else if (lowerMessage.includes('bye') || lowerMessage.includes('goodbye')) {
      aiResponse = `Goodbye! Feel free to come back if you have more questions. Have a great day!`;
    } else {
      // Generate a contextual response based on the message
      aiResponse = `I understand you're asking about "${message}". This is a great question! In a production environment, I would search through our knowledge base to provide you with the most accurate and helpful information. For now, I can tell you that I'm ${widget.bot?.name || 'your AI assistant'} and I'm here to help with any questions you might have.`;
    }

    // Add some personality and context
    aiResponse += `\n\n[Note: This is a test response. In production, I would use real AI processing and knowledge base search.]`;

    // Create a conversation record for testing
    try {
      const conversation = await db.createConversation({
        title: `Test Chat - ${message.substring(0, 50)}...`,
        botId: widget.botId,
        userId: session.user.id
      });

      // Add the user message
      await db.addMessage({
        conversationId: conversation.id,
        content: message,
        role: 'USER',
        tokens: Math.ceil(message.length / 4), // Rough token estimation
        cost: 0.001, // Minimal cost for testing
        metadata: { userId: session.user.id }
      });

      // Add the AI response
      await db.addMessage({
        conversationId: conversation.id,
        content: aiResponse,
        role: 'ASSISTANT',
        tokens: Math.ceil(aiResponse.length / 4), // Rough token estimation
        cost: 0.002, // Minimal cost for testing
        metadata: { userId: session.user.id }
      });

      // Update conversation status
      await db.updateConversation(conversation.id, {
        status: 'CLOSED'
      });

    } catch (dbError) {
      console.log('Database logging failed (test mode):', dbError);
      // Continue even if database logging fails in test mode
    }

    return NextResponse.json({
      success: true,
      response: aiResponse,
      conversationId: 'test-' + Date.now()
    });

  } catch (error) {
    console.error('Chat test error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
