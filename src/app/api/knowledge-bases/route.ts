import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getTenantContext } from '@/lib/tenant';
import { createTenantDB } from '@/lib/db';
import { canPerformPaidAction } from '@/lib/trial-check';

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

    const { searchParams } = new URL(request.url);
    const botId = searchParams.get('botId');

    const db = createTenantDB(tenant.id);
    const knowledgeBases = await db.getKnowledgeBases(botId || undefined);

    // Ensure document counts are accurate by fetching them separately if needed
    const knowledgeBasesWithCounts = await Promise.all(
      knowledgeBases.map(async (kb: { id: string; documents?: unknown[]; [key: string]: unknown }) => {
        // If documents array is empty or missing, fetch count directly
        if (!kb.documents || kb.documents.length === 0) {
          const stats = await db.getKnowledgeBaseStats(kb.id).catch(() => ({ documentCount: 0, faqCount: 0 }));
          return {
            ...kb,
            documents: [], // Ensure documents array exists
            _documentCount: stats.documentCount, // Add count for debugging
          };
        }
        return kb;
      })
    );

    console.log(`[KB GET] Returning ${knowledgeBasesWithCounts.length} knowledge bases`);
    knowledgeBasesWithCounts.forEach((kb: { id: string; name: string; documents?: unknown[]; _documentCount?: number }) => {
      console.log(`[KB GET] KB "${kb.name}" (${kb.id}): ${kb.documents?.length || 0} docs (count: ${kb._documentCount || 'N/A'})`);
    });

    return NextResponse.json({
      success: true,
      data: knowledgeBasesWithCounts,
    });

  } catch (error) {
    console.error('Knowledge bases fetch error:', error);
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

    const { name, description, botId } = await request.json();

    if (!name || !botId) {
      return NextResponse.json({ error: 'Name and botId are required' }, { status: 400 });
    }

    // Check if trial expired
    const canPerform = await canPerformPaidAction(tenant.id);
    if (!canPerform.allowed) {
      return NextResponse.json(
        { error: canPerform.reason || 'Trial expired. Please upgrade to continue.' },
        { status: 403 }
      );
    }

    const db = createTenantDB(tenant.id);
    
    // Verify bot exists and belongs to tenant
    const bot = await db.getBot(botId);
    if (!bot) {
      return NextResponse.json({ error: 'Bot not found' }, { status: 404 });
    }

    const knowledgeBase = await db.createKnowledgeBase({
      name,
      description,
      botId,
    });

    return NextResponse.json({
      success: true,
      data: knowledgeBase,
      message: 'Knowledge base created successfully'
    });

  } catch (error) {
    console.error('Knowledge base creation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 