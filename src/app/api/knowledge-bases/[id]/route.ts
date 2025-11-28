import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getTenantContext } from '@/lib/tenant';
import { createTenantDB } from '@/lib/db';

export async function GET(
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

    const { id } = await params;
    const db = createTenantDB(tenant.id);
    const knowledgeBases = await db.getKnowledgeBases();
    const knowledgeBase = knowledgeBases.find((kb: { id: string }) => kb.id === id);
    
    if (!knowledgeBase) {
      return NextResponse.json({ error: 'Knowledge base not found' }, { status: 404 });
    }

    // Get documents for this knowledge base (use the separate method to ensure we get all documents)
    let documents = await db.getDocumentsByKnowledgeBase(id);
    
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
    console.error('Knowledge base fetch error:', error);
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

    const { id } = await params;
    const { name, description } = await request.json();

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    const db = createTenantDB(tenant.id);
    
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
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tenant = await getTenantContext();
    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 400 });
    }

    const { id } = await params;
    const db = createTenantDB(tenant.id);
    
    // Verify knowledge base exists and belongs to tenant
    const knowledgeBases = await db.getKnowledgeBases();
    const existingKB = knowledgeBases.find((kb: { id: string }) => kb.id === id);
    if (!existingKB) {
      return NextResponse.json({ error: 'Knowledge base not found' }, { status: 404 });
    }

    // Delete knowledge base
    await db.deleteKnowledgeBase(id);

    return NextResponse.json({
      success: true,
      message: 'Knowledge base deleted successfully'
    });

  } catch (error) {
    console.error('Knowledge base deletion error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 