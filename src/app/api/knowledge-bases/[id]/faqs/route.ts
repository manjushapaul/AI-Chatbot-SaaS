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

    // Get FAQs for this knowledge base
    const faqs = await db.getFAQsByKnowledgeBase(id);

    return NextResponse.json({
      success: true,
      data: faqs,
    });

  } catch (error) {
    console.error('FAQs fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(
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

    // Create FAQ
    const faq = await db.createFAQ({
      question,
      answer,
      category,
      knowledgeBaseId: id,
    });

    return NextResponse.json({
      success: true,
      data: faq,
      message: 'FAQ created successfully'
    });

  } catch (error) {
    console.error('FAQ creation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 