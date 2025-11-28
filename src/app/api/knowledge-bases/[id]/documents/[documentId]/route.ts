import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getTenantContext } from '@/lib/tenant';
import { createTenantDB } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; documentId: string } }
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

    const db = createTenantDB(tenant.id);
    
    // Verify knowledge base exists and belongs to tenant
    const knowledgeBases = await db.getKnowledgeBases();
    const existingKB = knowledgeBases.find((kb: { id: string }) => kb.id === params.id);
    if (!existingKB) {
      return NextResponse.json({ error: 'Knowledge base not found' }, { status: 404 });
    }

    // Get the specific document
    const document = await db.getDocument(params.documentId);
    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: document,
    });

  } catch (error) {
    console.error('Document fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; documentId: string } }
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

    const db = createTenantDB(tenant.id);
    
    // Verify knowledge base exists and belongs to tenant
    const knowledgeBases = await db.getKnowledgeBases();
    const existingKB = knowledgeBases.find((kb: { id: string }) => kb.id === params.id);
    if (!existingKB) {
      return NextResponse.json({ error: 'Knowledge base not found' }, { status: 404 });
    }

    // Delete the document
    await db.deleteDocument(params.documentId);

    return NextResponse.json({
      success: true,
      message: 'Document deleted successfully',
    });

  } catch (error) {
    console.error('Document deletion error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 