import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createTenantDB } from '@/lib/db';
import { getTenantContext } from '@/lib/tenant';
import { Prisma } from '@prisma/client';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('[GET Bot] Session user:', session.user.email, 'Tenant:', session.user.tenantId);

    const tenant = await getTenantContext();
    console.log('[GET Bot] Tenant context:', tenant?.id, tenant?.subdomain);
    
    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 400 });
    }

    const { id: botId } = await params;
    console.log('[GET Bot] Fetching bot:', botId, 'for tenant:', tenant.id);
    
    const db = createTenantDB(tenant.id);
    const bot = await db.getBot(botId);
    
    console.log('[GET Bot] Bot found:', !!bot);

    if (!bot) {
      return NextResponse.json(
        { error: 'Bot not found' },
        { status: 404 }
      );
    }

    // Ensure config field exists (may be null for existing bots)
    const botData = {
      ...bot,
      config: bot.config || null,
    };

    return NextResponse.json({
      success: true,
      data: botData,
    });

  } catch (error) {
    console.error('Get bot API error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      { error: errorMessage, details: process.env.NODE_ENV === 'development' ? String(error) : undefined },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Get user session to get tenant context
    const session = await getServerSession(authOptions);
    if (!session?.user?.tenantId) {
      return NextResponse.json(
        { error: 'User not authenticated or tenant not found' },
        { status: 401 }
      );
    }

    const { id: botId } = await params;
    console.log('Deleting bot:', botId, 'for tenant:', session.user.tenantId);

    // Delete bot for the tenant
    const tenantDB = createTenantDB(session.user.tenantId);
    await tenantDB.deleteBot(botId);

    return NextResponse.json({
      success: true,
      message: 'Bot deleted successfully',
    });

  } catch (error) {
    console.error('Delete bot API error:', error);
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

    const { id: botId } = await params;
    const updateData = await request.json();
    
    // Extract fields that exist in the schema
    const {
      name,
      description,
      avatar,
      personality,
      model,
      temperature,
      maxTokens,
      status,
      // Additional fields that will be stored in config/metadata
      category,
      tone,
      responseLength,
      safetyLevel,
      systemPrompt,
      linkedKnowledgeBaseIds,
      fallbackStrategy,
      fallbackMessage,
      handoffEnabled,
      handoffAfterMessages,
      escalationKeywords,
      handoffChannel,
    } = updateData;

    // Build config object for additional fields
    const config: Record<string, unknown> = {};
    if (category !== undefined) config.category = category;
    if (tone !== undefined) config.tone = tone;
    if (responseLength !== undefined) config.responseLength = responseLength;
    if (safetyLevel !== undefined) config.safetyLevel = safetyLevel;
    if (systemPrompt !== undefined) config.systemPrompt = systemPrompt;
    if (linkedKnowledgeBaseIds !== undefined) config.linkedKnowledgeBaseIds = linkedKnowledgeBaseIds;
    if (fallbackStrategy !== undefined) config.fallbackStrategy = fallbackStrategy;
    if (fallbackMessage !== undefined) config.fallbackMessage = fallbackMessage;
    if (handoffEnabled !== undefined) config.handoffEnabled = handoffEnabled;
    if (handoffAfterMessages !== undefined) config.handoffAfterMessages = handoffAfterMessages;
    if (escalationKeywords !== undefined) config.escalationKeywords = escalationKeywords;
    if (handoffChannel !== undefined) config.handoffChannel = handoffChannel;

    const db = createTenantDB(tenant.id);
    
    // Update bot with schema fields
    const updatePayload: {
      name?: string;
      description?: string;
      avatar?: string;
      personality?: string;
      model?: string;
      temperature?: number;
      maxTokens?: number;
      status?: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'DELETED';
      config?: Prisma.InputJsonValue | null;
    } = {};
    
    if (name !== undefined) updatePayload.name = name;
    if (description !== undefined) updatePayload.description = description;
    if (avatar !== undefined) updatePayload.avatar = avatar;
    if (personality !== undefined) updatePayload.personality = personality;
    if (model !== undefined) updatePayload.model = model;
    if (temperature !== undefined) updatePayload.temperature = temperature;
    if (maxTokens !== undefined) updatePayload.maxTokens = maxTokens;
    if (status !== undefined) updatePayload.status = status;
    if (Object.keys(config).length > 0) {
      // Convert config to Prisma InputJsonValue
      updatePayload.config = config as Prisma.InputJsonValue;
    }
    
    await db.updateBot(botId, updatePayload);

    return NextResponse.json({
      success: true,
      message: 'Bot updated successfully',
    });

  } catch (error) {
    console.error('Update bot API error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      { error: errorMessage, details: process.env.NODE_ENV === 'development' ? String(error) : undefined },
      { status: 500 }
    );
  }
} 