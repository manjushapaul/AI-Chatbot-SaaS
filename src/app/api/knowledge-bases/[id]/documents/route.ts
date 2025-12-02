import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createTenantDB } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    console.log('[KB Documents GET] Starting request');
    
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      console.log('[KB Documents GET] Unauthorized - no session');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get tenant ID from session (most reliable)
    const tenantId = session.user.tenantId;
    
    if (!tenantId) {
      console.log('[KB Documents GET] Tenant not found - no tenant ID in session');
      return NextResponse.json({ error: 'Tenant not found. Please ensure you are logged in.' }, { status: 401 });
    }
    
    console.log('[KB Documents GET] Tenant ID from session:', tenantId);

    const { id } = await params;
    console.log('[KB Documents GET] Knowledge base ID:', id, 'Tenant ID:', tenantId);
    
    if (!id) {
      console.error('[KB Documents GET] Missing knowledge base ID in route params');
      return NextResponse.json({ error: 'Knowledge base ID is required' }, { status: 400 });
    }

    const db = createTenantDB(tenantId);
    
    // Verify knowledge base exists and belongs to tenant
    console.log('[KB Documents GET] Verifying knowledge base exists...');
    const knowledgeBases = await db.getKnowledgeBases();
    const existingKB = knowledgeBases.find((kb: { id: string }) => kb.id === id);
    if (!existingKB) {
      console.log('[KB Documents GET] Knowledge base not found for ID:', id);
      return NextResponse.json({ error: 'Knowledge base not found' }, { status: 404 });
    }

    console.log(`[KB Documents GET] KB found: "${existingKB.name}", has ${existingKB.documents?.length || 0} documents from getKnowledgeBases`);
    console.log('[KB Documents GET] Fetching documents via getDocumentsByKnowledgeBase...');
    // Get documents for this knowledge base
    const documents = await db.getDocumentsByKnowledgeBase(id);
    console.log(`[KB Documents GET] getDocumentsByKnowledgeBase returned ${documents?.length || 0} documents`);
    if (documents && documents.length > 0) {
      documents.forEach((doc: { id: string; title: string; status: string }) => {
        console.log(`[KB Documents GET] - Document: ${doc.title} (${doc.id}), status: ${doc.status}`);
      });
    }

    return NextResponse.json({
      success: true,
      data: documents || [],
    });

  } catch (error) {
    console.error('[KB Documents GET] Error:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;
    console.error('[KB Documents GET] Error details:', { message: errorMessage, stack: errorStack });
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
      },
      { status: 500 }
    );
  }
} 