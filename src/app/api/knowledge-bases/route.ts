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

    console.log('[KB API] Session user:', session.user.email, 'Tenant ID:', session.user.tenantId);

    // Try to get tenant context, but fallback to session tenantId if available
    let tenant = await getTenantContext();
    
    // If getTenantContext fails, try using tenantId from session
    if (!tenant && session.user.tenantId) {
      console.log('[KB API] Tenant context not found, using session tenantId:', session.user.tenantId);
      // Create a minimal tenant object from session
      tenant = {
        id: session.user.tenantId,
        name: 'Unknown',
        subdomain: '',
      };
    }

    if (!tenant) {
      console.error('[KB API] No tenant found in context or session');
      // Return empty data instead of error to prevent dashboard from breaking
      return NextResponse.json({
        success: true,
        data: [],
      });
    }

    console.log('[KB API] Using tenant:', tenant.id);

    try {
      const { searchParams } = new URL(request.url);
      const botId = searchParams.get('botId');

      const db = createTenantDB(tenant.id);
      const knowledgeBases = await db.getKnowledgeBases(botId || undefined).catch((error) => {
        console.error('[KB API] Error fetching knowledge bases:', error);
        return [];
      });

      // Ensure document counts are accurate by fetching them separately if needed
      const knowledgeBasesWithCounts = await Promise.all(
        knowledgeBases.map(async (kb: { id: string; documents?: unknown[]; [key: string]: unknown }) => {
          try {
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
          } catch (kbError) {
            console.error(`[KB API] Error processing KB ${kb.id}:`, kbError);
            // Return KB without stats if processing fails
            return {
              ...kb,
              documents: kb.documents || [],
            };
          }
        })
      );

      console.log(`[KB GET] Returning ${knowledgeBasesWithCounts.length} knowledge bases`);
      knowledgeBasesWithCounts.forEach((kb: Record<string, unknown>) => {
        console.log(`[KB GET] KB "${kb.name as string}" (${kb.id as string}): ${(kb.documents as unknown[] | undefined)?.length || 0} docs (count: ${kb._documentCount as number | undefined || 'N/A'})`);
      });

      return NextResponse.json({
        success: true,
        data: knowledgeBasesWithCounts,
      });
    } catch (dbError) {
      console.error('[KB API] Database error:', dbError);
      // Return empty data instead of error
      return NextResponse.json({
        success: true,
        data: [],
      });
    }

  } catch (error) {
    console.error('[KB API] Knowledge bases fetch error:', error);
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