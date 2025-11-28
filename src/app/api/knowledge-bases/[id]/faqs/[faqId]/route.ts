import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getTenantContext } from '@/lib/tenant';
import { createTenantDB } from '@/lib/db';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; faqId: string }> }
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

    const { id, faqId } = await params;
    const { question, answer, category } = await request.json();

    if (!question || !answer) {
      return NextResponse.json({ error: 'Question and answer are required' }, { status: 400 });
    }

    const db = createTenantDB(tenant.id);
    
    // Verify knowledge base exists and belongs to tenant
    const knowledgeBases = await db.getKnowledgeBases();
    const existingKB = knowledgeBases.find((kb: { id: string }) => kb.id === id);
    if (!existingKB) {
      return NextResponse.json({ error: 'Knowledge base not found' }, { status: 404 });
    }

    // Update FAQ
    const updatedFAQ = await db.updateFAQ(faqId, {
      question,
      answer,
      category,
    });

    return NextResponse.json({
      success: true,
      data: updatedFAQ,
      message: 'FAQ updated successfully'
    });

  } catch (error) {
    console.error('FAQ update error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; faqId: string }> }
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

    const { id, faqId } = await params;
    const db = createTenantDB(tenant.id);
    
    // Verify knowledge base exists and belongs to tenant
    const knowledgeBases = await db.getKnowledgeBases();
    const existingKB = knowledgeBases.find((kb: { id: string }) => kb.id === id);
    if (!existingKB) {
      return NextResponse.json({ error: 'Knowledge base not found' }, { status: 404 });
    }

    // Delete FAQ
    await db.deleteFAQ(faqId);

    return NextResponse.json({
      success: true,
      message: 'FAQ deleted successfully'
    });

  } catch (error) {
    console.error('FAQ deletion error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 