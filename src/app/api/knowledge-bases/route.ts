import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getTenantContext } from '@/lib/tenant';
import { createTenantDB } from '@/lib/db';

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

    return NextResponse.json({
      success: true,
      data: knowledgeBases,
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