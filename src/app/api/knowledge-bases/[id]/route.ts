import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createTenantDB } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    console.log('[KB GET] Starting request');
    
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      console.log('[KB GET] Unauthorized - no session');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get tenant ID from session (most reliable)
    const tenantId = session.user.tenantId;
    
    if (!tenantId) {
      console.log('[KB GET] Tenant not found - no tenant ID in session');
      return NextResponse.json({ error: 'Tenant not found. Please ensure you are logged in.' }, { status: 401 });
    }
    
    console.log('[KB GET] Tenant ID from session:', tenantId);

    const { id } = await params;
    console.log('[KB GET] Knowledge base ID:', id, 'Tenant ID:', tenantId);
    
    if (!id) {
      console.error('[KB GET] Missing knowledge base ID in route params');
      return NextResponse.json({ error: 'Knowledge base ID is required' }, { status: 400 });
    }

    const db = createTenantDB(tenantId);
    const knowledgeBases = await db.getKnowledgeBases();
    const knowledgeBase = knowledgeBases.find((kb: { id: string }) => kb.id === id);
    
    if (!knowledgeBase) {
      console.log('[KB GET] Knowledge base not found for ID:', id);
      return NextResponse.json({ error: 'Knowledge base not found' }, { status: 404 });
    }
    
    console.log('[KB GET] Knowledge base found:', knowledgeBase.name);
    console.log(`[KB GET] KB has ${knowledgeBase.documents?.length || 0} documents from getKnowledgeBases query`);

    // Get documents for this knowledge base (use the separate method to ensure we get all documents)
    let documents = await db.getDocumentsByKnowledgeBase(id);
    console.log(`[KB GET] getDocumentsByKnowledgeBase returned ${documents.length} documents`);
    
    // If getDocumentsByKnowledgeBase returns empty but knowledgeBase has documents, use those
    // This handles cases where the separate query might have filtering issues
    if (!documents || documents.length === 0) {
      documents = knowledgeBase.documents || [];
    }
    
    // Get FAQs for this knowledge base
    let faqs = await db.getFAQsByKnowledgeBase(id).catch(() => null);
    if (!faqs || faqs.length === 0) {
      faqs = knowledgeBase.faqs || [];
    }
    
    // Get stats
    const stats = await db.getKnowledgeBaseStats(id).catch(() => ({
      documentCount: documents.length,
      faqCount: faqs.length,
    }));

    // Remove documents and faqs from knowledgeBase before spreading to avoid duplication
    const { documents: _, faqs: __, ...kbWithoutRelations } = knowledgeBase;

    return NextResponse.json({
      success: true,
      data: {
        ...kbWithoutRelations,
        documents: documents || [],
        faqs: faqs || [],
        stats,
      },
    });

  } catch (error) {
    console.error('[KB GET] Error:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;
    console.error('[KB GET] Error details:', { message: errorMessage, stack: errorStack });
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
      },
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

    // Get tenant ID from session (most reliable)
    const tenantId = session.user.tenantId;
    
    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant not found. Please ensure you are logged in.' }, { status: 401 });
    }

    const { id } = await params;
    const { name, description } = await request.json();

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    const db = createTenantDB(tenantId);
    
    // Verify knowledge base exists and belongs to tenant
    const knowledgeBases = await db.getKnowledgeBases();
    const existingKB = knowledgeBases.find((kb: { id: string }) => kb.id === id);
    if (!existingKB) {
      return NextResponse.json({ error: 'Knowledge base not found' }, { status: 404 });
    }

    // Update knowledge base
    const updatedKB = await db.updateKnowledgeBase(id, {
      name,
      description,
    });

    return NextResponse.json({
      success: true,
      data: updatedKB,
      message: 'Knowledge base updated successfully'
    });

  } catch (error) {
    console.error('Knowledge base update error:', error);
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
    console.log('[KB DELETE] Starting request');
    
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      console.log('[KB DELETE] Unauthorized - no session');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get tenant ID from session (most reliable)
    const tenantId = session.user.tenantId;
    
    if (!tenantId) {
      console.log('[KB DELETE] Tenant not found - no tenant ID in session');
      return NextResponse.json({ error: 'Tenant not found. Please ensure you are logged in.' }, { status: 401 });
    }
    
    console.log('[KB DELETE] Tenant ID from session:', tenantId);

    const { id } = await params;
    console.log('[KB DELETE] Knowledge base ID:', id, 'Tenant ID:', tenantId);
    
    if (!id) {
      console.error('[KB DELETE] Missing knowledge base ID in route params');
      return NextResponse.json({ error: 'Knowledge base ID is required' }, { status: 400 });
    }

    const db = createTenantDB(tenantId);
    
    // Verify knowledge base exists and belongs to tenant
    console.log('[KB DELETE] Verifying knowledge base exists...');
    const knowledgeBases = await db.getKnowledgeBases();
    const existingKB = knowledgeBases.find((kb: { id: string }) => kb.id === id);
    if (!existingKB) {
      console.log('[KB DELETE] Knowledge base not found for ID:', id);
      return NextResponse.json({ error: 'Knowledge base not found' }, { status: 404 });
    }

    console.log(`[KB DELETE] Deleting knowledge base: "${existingKB.name}" (${id})`);
    
    // Delete knowledge base
    await db.deleteKnowledgeBase(id);

    console.log('[KB DELETE] Knowledge base deleted successfully');

    return NextResponse.json({
      success: true,
      message: 'Knowledge base deleted successfully'
    });

  } catch (error) {
    console.error('[KB DELETE] Error:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;
    console.error('[KB DELETE] Error details:', { message: errorMessage, stack: errorStack });
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
      },
      { status: 500 }
    );
  }
} 