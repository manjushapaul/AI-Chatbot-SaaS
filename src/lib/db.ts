import { PrismaClient, Prisma } from '@prisma/client';

// Use Web Crypto API which works in both Node.js and Edge Runtime
function randomUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback for older Node.js versions (shouldn't be needed in modern Node.js)
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
});

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

// Tenant-scoped database operations
export class TenantDB {
  constructor(private tenantId: string) {}

  // Bot operations
  async getBots() {
    // Verify Prisma client is available
    if (!prisma) {
      console.error(`[TenantDB] Prisma client not initialized for tenant ${this.tenantId}`);
      return [];
    }

    // Validate tenantId
    if (!this.tenantId || typeof this.tenantId !== 'string' || this.tenantId.trim() === '') {
      console.error(`[TenantDB] Invalid tenantId: ${this.tenantId}`);
      return [];
    }

    try {
      // Start with absolute simplest query - no relations, no complex filters, no orderBy
      const bots = await prisma.bots.findMany({
        where: { 
          tenantId: this.tenantId,
        },
      });

      // Ensure bots is an array
      if (!Array.isArray(bots)) {
        console.warn(`[TenantDB] getBots() returned non-array for tenant ${this.tenantId}`);
        return [];
      }

      // If no bots found, return empty array
      if (bots.length === 0) {
        return [];
      }

      // Add empty relations for now - we can enhance this later if needed
      // This prevents any relation query errors from breaking the API
      return bots.map((bot: Record<string, unknown>) => ({
        ...bot,
        knowledge_bases: [],
        widgets: [],
        _count: {
          conversations: 0,
        },
      }));
    } catch (error) {
      console.error(`[TenantDB] Error fetching bots for tenant ${this.tenantId}:`, error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorCode = (error as { code?: string })?.code;
      const errorStack = error instanceof Error ? error.stack : 'No stack';
      console.error(`[TenantDB] Error details: ${errorMessage}`);
      console.error(`[TenantDB] Error code: ${errorCode || 'N/A'}`);
      console.error(`[TenantDB] Error stack: ${errorStack}`);
      
      // Return empty array as last resort - never throw
      return [];
    }
  }

  async getBot(id: string) {
    return prisma.bots.findFirst({
      where: { id, tenantId: this.tenantId },
      include: {
        knowledge_bases: {
          include: {
            documents: true,
            faqs: true,
          },
        },
        widgets: true,
      },
    });
  }

  async createBot(data: {
    name: string;
    description?: string;
    avatar?: string;
    personality?: string;
    model?: string;
    temperature?: number;
    maxTokens?: number;
    status?: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'DELETED';
  }) {
    console.log('[TenantDB] Creating bot with data:', data);
    console.log('[TenantDB] Tenant ID:', this.tenantId);
    
    try {
      // Verify Prisma client is available
      if (!prisma) {
        const error = new Error('Prisma client not initialized');
        console.error('[TenantDB]', error.message);
        throw error;
      }

      // Generate a unique ID for the bot
      const botId = randomUUID().replace(/-/g, '');
      const now = new Date();
      
      const bot = await prisma.bots.create({
        data: {
          id: botId,
          ...data,
          tenantId: this.tenantId,
          // Ensure status is properly set
          status: data.status || 'ACTIVE',
          createdAt: now,
          updatedAt: now,
        },
      });
      
      console.log('[TenantDB] Bot created successfully:', bot?.id);
      return bot;
    } catch (error) {
      console.error('[TenantDB] Error creating bot:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorCode = (error as { code?: string })?.code;
      
      // Check for database connection errors
      if (errorCode === 'P1001' || errorCode === 'P1000' || 
          errorMessage.includes('Can\'t reach database') ||
          errorMessage.includes('connection')) {
        const connectionError = new Error('Database connection failed');
        (connectionError as Error & { code?: string }).code = errorCode;
        throw connectionError;
      }
      
      throw error;
    }
  }

  async updateBot(id: string, data: Partial<{
    name: string;
    description: string;
    avatar: string;
    personality: string;
    model: string;
    temperature: number;
    maxTokens: number;
    status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'DELETED';
    config?: Prisma.InputJsonValue | null;
  }>) {
    // Build the update data object using Prisma's generated types
    const updateData: Prisma.botsUpdateInput = {};

    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.avatar !== undefined) updateData.avatar = data.avatar;
    if (data.personality !== undefined) updateData.personality = data.personality;
    if (data.model !== undefined) updateData.model = data.model;
    if (data.temperature !== undefined) updateData.temperature = data.temperature;
    if (data.maxTokens !== undefined) updateData.maxTokens = data.maxTokens;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.config !== undefined) {
      // Convert config to Prisma Json type
      updateData.config = data.config as Prisma.InputJsonValue;
    }

    return prisma.bots.update({
      where: { id, tenantId: this.tenantId },
      data: updateData,
    });
  }

  async deleteBot(id: string) {
    return prisma.bots.delete({
      where: { id, tenantId: this.tenantId },
    });
  }

  // Knowledge base operations
  async getKnowledgeBases(botId?: string) {
    const knowledgeBases = await prisma.knowledge_bases.findMany({
      where: { 
        tenantId: this.tenantId,
        status: 'ACTIVE',
        ...(botId && { botId }),
      },
      include: {
        documents: {
          where: {
            status: 'ACTIVE',
          },
          select: {
            id: true,
            title: true,
            type: true,
            content: true,
            createdAt: true,
            updatedAt: true,
            status: true,
          },
        },
        faqs: {
          where: {
            status: 'ACTIVE',
          },
        },
        bots: {
          select: { 
            id: true,
            name: true,
            description: true 
          },
        },
      },
    });
    
    // Debug logging
    knowledgeBases.forEach(kb => {
      console.log(`[getKnowledgeBases] KB "${kb.name}" (${kb.id}): ${kb.documents?.length || 0} documents, ${kb.faqs?.length || 0} FAQs`);
    });
    
    return knowledgeBases;
  }

  async createKnowledgeBase(data: {
    name: string;
    description?: string;
    botId: string;
  }) {
    const kbId = randomUUID().replace(/-/g, '');
    const now = new Date();
    
    return prisma.knowledge_bases.create({
      data: {
        id: kbId,
        ...data,
        tenantId: this.tenantId,
        createdAt: now,
        updatedAt: now,
      },
    });
  }

  async updateKnowledgeBase(id: string, data: {
    name?: string;
    description?: string;
  }) {
    return prisma.knowledge_bases.update({
      where: { id, tenantId: this.tenantId },
      data,
    });
  }

  async deleteKnowledgeBase(id: string) {
    console.log(`[deleteKnowledgeBase] Deleting KB ${id} for tenant ${this.tenantId}`);
    
    // First verify the knowledge base exists and belongs to this tenant
    const kb = await prisma.knowledge_bases.findFirst({
      where: { id, tenantId: this.tenantId },
    });
    
    if (!kb) {
      throw new Error(`Knowledge base ${id} not found or doesn't belong to tenant ${this.tenantId}`);
    }
    
    // Delete the knowledge base (cascade will handle related documents and FAQs)
    const result = await prisma.knowledge_bases.delete({
      where: { id, tenantId: this.tenantId },
    });
    
    console.log(`[deleteKnowledgeBase] Successfully deleted KB "${kb.name}" (${id})`);
    
    return result;
  }

  // FAQ operations
  async createFAQ(data: {
    question: string;
    answer: string;
    category?: string;
    knowledgeBaseId: string;
  }) {
    const faqId = randomUUID().replace(/-/g, '');
    const now = new Date();
    
    return prisma.faqs.create({
      data: {
        id: faqId,
        question: data.question,
        answer: data.answer,
        category: data.category,
        knowledgeBaseId: data.knowledgeBaseId,
        createdAt: now,
        updatedAt: now,
      },
    });
  }

  async getFAQsByKnowledgeBase(knowledgeBaseId: string) {
    return prisma.faqs.findMany({
      where: {
        knowledgeBaseId,
        knowledge_bases: {
          tenantId: this.tenantId,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async updateFAQ(id: string, data: {
    question?: string;
    answer?: string;
    category?: string;
  }) {
    return prisma.faqs.update({
      where: { id },
      data,
    });
  }

  async deleteFAQ(id: string) {
    return prisma.faqs.delete({
      where: { id },
    });
  }

  // Document operations
  async addDocument(data: {
    title: string;
    content: string;
    type: 'DOCX' | 'TXT' | 'HTML' | 'MARKDOWN' | 'JSON';
    url?: string;
    knowledgeBaseId: string;
    embeddings?: Record<string, unknown>[];
  }) {
    console.log(`[addDocument] Creating document "${data.title}" for KB ${data.knowledgeBaseId}, tenant ${this.tenantId}`);
    
    // Verify knowledge base exists and belongs to tenant
    const kb = await prisma.knowledge_bases.findFirst({
      where: {
        id: data.knowledgeBaseId,
        tenantId: this.tenantId,
      },
    });
    
    if (!kb) {
      throw new Error(`Knowledge base ${data.knowledgeBaseId} not found or doesn't belong to tenant ${this.tenantId}`);
    }
    
    const docId = randomUUID().replace(/-/g, '');
    const now = new Date();
    
    const document = await prisma.documents.create({
      data: {
        id: docId,
        title: data.title,
        content: data.content,
        type: data.type,
        url: data.url,
        embeddings: data.embeddings as Prisma.InputJsonValue | undefined,
        status: 'ACTIVE', // Explicitly set status to ACTIVE
        knowledgeBaseId: data.knowledgeBaseId,
        createdAt: now,
        updatedAt: now,
      },
    });
    
    console.log(`[addDocument] Document created successfully: ${document.id} for KB ${data.knowledgeBaseId}`);
    
    // Verify document was created and can be retrieved
    const verifyDoc = await prisma.documents.findFirst({
      where: {
        id: document.id,
        knowledgeBaseId: data.knowledgeBaseId,
      },
    });
    
    if (!verifyDoc) {
      console.error(`[addDocument] WARNING: Document ${document.id} was created but cannot be retrieved!`);
    } else {
      console.log(`[addDocument] Document verified: ${verifyDoc.id}, status: ${verifyDoc.status}`);
    }
    
    return document;
  }

  async getDocumentsByKnowledgeBase(knowledgeBaseId: string) {
    console.log(`[getDocumentsByKnowledgeBase] Fetching documents for KB ${knowledgeBaseId}, tenant ${this.tenantId}`);
    
    // First, get all documents (including non-ACTIVE) for debugging
    const allDocs = await prisma.documents.findMany({
      where: {
        knowledgeBaseId,
        knowledge_bases: {
          tenantId: this.tenantId,
        },
      },
      select: {
        id: true,
        title: true,
        type: true,
        status: true,
      },
    });
    console.log(`[getDocumentsByKnowledgeBase] Found ${allDocs.length} total documents (all statuses)`);
    allDocs.forEach(doc => {
      console.log(`[getDocumentsByKnowledgeBase] - ${doc.title}: status=${doc.status || 'NULL'}`);
    });
    
    // Then get only ACTIVE documents
    const activeDocs = await prisma.documents.findMany({
      where: {
        knowledgeBaseId,
        status: 'ACTIVE', // Only get ACTIVE documents
        knowledge_bases: {
          tenantId: this.tenantId,
        },
      },
      select: {
        id: true,
        title: true,
        type: true,
        content: true,
        createdAt: true,
        updatedAt: true,
        status: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    
    console.log(`[getDocumentsByKnowledgeBase] Returning ${activeDocs.length} ACTIVE documents`);
    return activeDocs;
  }

  async getDocument(id: string) {
    return prisma.documents.findFirst({
      where: {
        id,
        knowledge_bases: {
          tenantId: this.tenantId,
        },
      },
      include: {
        knowledge_bases: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }

  async updateDocument(id: string, data: {
    title?: string;
    content?: string;
  }) {
    return prisma.documents.update({
      where: { id },
      data,
    });
  }

  async deleteDocument(id: string) {
    return prisma.documents.delete({
      where: { id },
    });
  }

  // Conversation operations
  async createConversation(data: {
    userId: string;
    botId: string;
    title?: string;
    metadata?: Record<string, unknown>;
  }) {
    const convId = randomUUID().replace(/-/g, '');
    const now = new Date();
    
    return prisma.conversations.create({
      data: {
        id: convId,
        tenantId: this.tenantId,
        userId: data.userId,
        botId: data.botId,
        title: data.title,
        metadata: data.metadata as Prisma.InputJsonValue | undefined,
        lastMessageAt: now,
        startedAt: now,
      },
      include: {
        users: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        bots: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }

  async getConversations(filters?: {
    userId?: string;
    botId?: string;
    status?: 'ACTIVE' | 'CLOSED' | 'ARCHIVED';
  }) {
    return prisma.conversations.findMany({
      where: {
        tenantId: this.tenantId,
        ...(filters?.userId && { userId: filters.userId }),
        ...(filters?.botId && { botId: filters.botId }),
        ...(filters?.status && { status: filters.status }),
      },
      include: {
        users: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        bots: {
          select: {
            id: true,
            name: true,
          },
        },
        messages: {
          orderBy: {
            createdAt: 'asc',
          },
          take: 1, // Only get first message for preview
        },
        _count: {
          select: {
            messages: true,
          },
        },
      },
      orderBy: {
        lastMessageAt: 'desc',
      },
    });
  }

  async getConversation(id: string) {
    return prisma.conversations.findFirst({
      where: {
        id,
        tenantId: this.tenantId,
      },
      include: {
        users: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        bots: {
          select: {
            id: true,
            name: true,
          },
        },
        messages: {
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
    });
  }

  async updateConversation(id: string, data: {
    status?: 'ACTIVE' | 'CLOSED' | 'ARCHIVED';
    title?: string;
    metadata?: Record<string, unknown>;
    closedAt?: Date;
  }) {
    const updateData: {
      status?: 'ACTIVE' | 'CLOSED' | 'ARCHIVED';
      title?: string;
      metadata?: Prisma.InputJsonValue;
      closedAt?: Date;
    } = {
      ...data,
      metadata: data.metadata ? (data.metadata as Prisma.InputJsonValue) : undefined,
    };
    return prisma.conversations.update({
      where: { id },
      data: updateData,
    });
  }

  async closeConversation(id: string) {
    return prisma.conversations.update({
      where: { id },
      data: {
        status: 'CLOSED',
        closedAt: new Date(),
      },
    });
  }

  async deleteConversation(id: string) {
    return prisma.conversations.delete({
      where: { id },
    });
  }

  // Message operations
  async addMessage(data: {
    conversationId: string;
    role: 'USER' | 'ASSISTANT' | 'SYSTEM';
    content: string;
    tokens?: number;
    cost?: number;
    model?: string;
    responseTime?: number;
    metadata?: Record<string, unknown>;
  }) {
    const msgId = randomUUID().replace(/-/g, '');
    
    const message = await prisma.messages.create({
      data: {
        id: msgId,
        conversationId: data.conversationId,
        role: data.role,
        content: data.content,
        tokens: data.tokens ?? 0,
        cost: data.cost ?? 0.0,
        model: data.model,
        responseTime: data.responseTime,
        metadata: data.metadata as Prisma.InputJsonValue | undefined,
      },
    });

    // Update conversation stats
    const updateData: {
      messageCount: { increment: number };
      totalTokens?: { increment: number };
      totalCost?: { increment: number };
      lastMessageAt: Date;
    } = {
      messageCount: {
        increment: 1,
      },
      lastMessageAt: new Date(),
    };

    // Only increment tokens and cost if they are defined and are numbers
    if (typeof data.tokens === 'number' && !isNaN(data.tokens)) {
      updateData.totalTokens = {
        increment: data.tokens,
      };
    }

    if (typeof data.cost === 'number' && !isNaN(data.cost)) {
      updateData.totalCost = {
        increment: data.cost,
      };
    }

    await prisma.conversations.update({
      where: { id: data.conversationId },
      data: updateData,
    });

    return message;
  }

  async getMessages(conversationId: string) {
    return prisma.messages.findMany({
      where: {
        conversationId,
        conversations: {
          tenantId: this.tenantId,
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });
  }

  async getConversationStats(conversationId: string) {
    const conversation = await prisma.conversations.findFirst({
      where: {
        id: conversationId,
        tenantId: this.tenantId,
      },
      select: {
        messageCount: true,
        totalTokens: true,
        totalCost: true,
        startedAt: true,
        lastMessageAt: true,
        closedAt: true,
      },
    });

    return conversation || {
      messageCount: 0,
      totalTokens: 0,
      totalCost: 0,
      startedAt: null,
      lastMessageAt: null,
      closedAt: null,
    };
  }

  async getKnowledgeBaseStats(knowledgeBaseId: string) {
    const documentCount = await prisma.documents.count({
      where: {
        knowledgeBaseId,
        status: 'ACTIVE', // Only count ACTIVE documents
        knowledge_bases: {
          tenantId: this.tenantId,
        },
      },
    });

    const faqCount = await prisma.faqs.count({
      where: {
        knowledgeBaseId,
        status: 'ACTIVE', // Only count ACTIVE FAQs
        knowledge_bases: {
          tenantId: this.tenantId,
        },
      },
    });

    return {
      documentCount,
      faqCount,
      totalSize: 0, // Simplified for now
    };
  }

  // Widget operations
  async createWidget(data: {
    name: string;
    type: 'CHAT_WIDGET' | 'POPUP' | 'EMBEDDED' | 'FLOATING';
    config: Record<string, unknown>;
    botId: string;
  }) {
    const widgetId = randomUUID().replace(/-/g, '');
    const now = new Date();
    
    return prisma.widgets.create({
      data: {
        id: widgetId,
        name: data.name,
        type: data.type,
        config: data.config as Prisma.InputJsonValue,
        tenantId: this.tenantId,
        botId: data.botId,
        createdAt: now,
        updatedAt: now,
      },
    });
  }

  async getWidgets(botId?: string) {
    return prisma.widgets.findMany({
      where: { 
        tenantId: this.tenantId,
        ...(botId && { botId }),
      },
      include: {
        bots: {
          select: { name: true },
        },
      },
    });
  }

  async getWidget(id: string) {
    return prisma.widgets.findFirst({
      where: { 
        id,
        tenantId: this.tenantId,
      },
      include: {
        bots: {
          select: { name: true },
        },
      },
    });
  }

  async updateWidget(id: string, data: Partial<{
    name: string;
    type: 'CHAT_WIDGET' | 'POPUP' | 'EMBEDDED' | 'FLOATING';
    config: Record<string, unknown>;
    status: string;
  }>) {
    const updateData: {
      name?: string;
      type?: 'CHAT_WIDGET' | 'POPUP' | 'EMBEDDED' | 'FLOATING';
      config?: Prisma.InputJsonValue;
      status?: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'DELETED';
    } = {
      ...data,
      config: data.config ? (data.config as Prisma.InputJsonValue) : undefined,
      status: data.status as 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'DELETED' | undefined,
    };
    return prisma.widgets.update({
      where: { id, tenantId: this.tenantId },
      data: updateData,
    });
  }

  async deleteWidget(id: string) {
    return prisma.widgets.delete({
      where: { id, tenantId: this.tenantId },
    });
  }

  // User operations
  async getUsers() {
    return prisma.users.findMany({
      where: { tenantId: this.tenantId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
        createdAt: true,
        _count: {
          select: {
            conversations: true,
            api_keys: true,
          },
        },
      },
    });
  }

  async getUser(id: string) {
    return prisma.users.findFirst({
      where: { id, tenantId: this.tenantId },
    });
  }

  async getUserByEmail(email: string) {
    return prisma.users.findFirst({
      where: { email, tenantId: this.tenantId },
    });
  }

  async createUser(data: {
    email: string;
    name: string;
    password: string;
    role: 'SUPER_ADMIN' | 'TENANT_ADMIN' | 'USER' | 'BOT_OPERATOR';
    status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
    tenantId: string;
  }) {
    const userId = randomUUID().replace(/-/g, '');
    const now = new Date();
    
    return prisma.users.create({
      data: {
        id: userId,
        email: data.email,
        name: data.name,
        password: data.password,
        role: data.role,
        status: data.status,
        tenantId: this.tenantId,
        createdAt: now,
        updatedAt: now,
      },
    });
  }

  async updateUser(id: string, data: Partial<{
    name: string;
    role: 'SUPER_ADMIN' | 'TENANT_ADMIN' | 'USER' | 'BOT_OPERATOR';
    status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
    lastActive: Date;
  }>) {
    return prisma.users.update({
      where: { id, tenantId: this.tenantId },
      data,
    });
  }

  async updateUserPassword(id: string, password: string) {
    return prisma.users.update({
      where: { id, tenantId: this.tenantId },
      data: { password },
    });
  }

  async deleteUser(id: string) {
    return prisma.users.delete({
      where: { id, tenantId: this.tenantId },
    });
  }

  async getConversationCountByUser(userId: string): Promise<number> {
    const count = await prisma.conversations.count({
      where: { 
        userId,
        tenantId: this.tenantId 
      },
    });
    return count;
  }

  async getApiKeyCountByUser(userId: string): Promise<number> {
    const count = await prisma.api_keys.count({
      where: { 
        userId,
        tenantId: this.tenantId,
        status: 'ACTIVE'
      },
    });
    return count;
  }

  // API Key operations
  async createApiKey(data: {
    name: string;
    key: string;
    permissions: Record<string, unknown>;
    userId: string;
    expiresAt?: Date;
  }) {
    const apiKeyId = randomUUID().replace(/-/g, '');
    const now = new Date();
    
    return prisma.api_keys.create({
      data: {
        id: apiKeyId,
        ...data,
        permissions: data.permissions as Prisma.InputJsonValue,
        tenantId: this.tenantId,
        createdAt: now,
        updatedAt: now,
      },
    });
  }

  async getApiKeys() {
    return prisma.api_keys.findMany({
      where: { tenantId: this.tenantId },
      include: {
        users: {
          select: { name: true, email: true },
        },
      },
    });
  }

  async validateApiKey(key: string) {
    return prisma.api_keys.findFirst({
      where: { 
        key,
        tenantId: this.tenantId,
        status: 'ACTIVE',
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } },
        ],
      },
      include: {
        users: true,
      },
    });
  }

  // Notification operations
  async createNotification(data: {
    userId: string;
    type: string;
    title: string;
    message: string;
    category: string;
    priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    actionUrl?: string;
    metadata?: Record<string, unknown>;
  }) {
    try {
      // Validate required fields
      if (!data.userId || !data.title || !data.message || !data.type || !data.category) {
        throw new Error('Missing required notification fields');
      }

      // Map string types to Prisma enum values
      const typeMap: Record<string, 'BOT_ACTIVITY' | 'SYSTEM' | 'METRICS' | 'TEAM' | 'BILLING' | 'SECURITY' | 'KB' | 'WIDGET'> = {
        'BOT_ACTIVITY': 'BOT_ACTIVITY',
        'SYSTEM': 'SYSTEM',
        'METRICS': 'METRICS',
        'TEAM': 'TEAM',
        'BILLING': 'BILLING',
        'SECURITY': 'SECURITY',
        'KB': 'KB',
        'WIDGET': 'WIDGET',
      };

      const categoryMap: Record<string, 'bot_activity' | 'system' | 'metrics' | 'team' | 'billing' | 'security' | 'kb' | 'widget'> = {
        'bot_activity': 'bot_activity',
        'system': 'system',
        'metrics': 'metrics',
        'team': 'team',
        'billing': 'billing',
        'security': 'security',
        'kb': 'kb',
        'widget': 'widget',
      };

      const priorityMap: Record<string, 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'> = {
        'LOW': 'LOW',
        'MEDIUM': 'MEDIUM',
        'HIGH': 'HIGH',
        'CRITICAL': 'CRITICAL',
      };

      const mappedType = typeMap[data.type] || 'SYSTEM';
      const mappedCategory = categoryMap[data.category] || 'system';
      const mappedPriority = data.priority ? priorityMap[data.priority] || 'MEDIUM' : 'MEDIUM';

      const notifId = randomUUID().replace(/-/g, '');
      
      return await prisma.notifications.create({
        data: {
          id: notifId,
          userId: data.userId,
          tenantId: this.tenantId,
          type: mappedType,
          title: data.title,
          message: data.message,
          category: mappedCategory,
          priority: mappedPriority,
          actionUrl: data.actionUrl,
          metadata: (data.metadata || {}) as Prisma.InputJsonValue,
        },
      });
    } catch (error) {
      console.error('Error creating notification:', error);
      console.error('Notification data:', JSON.stringify(data, null, 2));
      if (error instanceof Error) {
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
      }
      throw error;
    }
  }

  async markNotificationRead(id: string, userId: string) {
    return prisma.notifications.updateMany({
      where: {
        id,
        userId,
        tenantId: this.tenantId,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });
  }

  async markAllNotificationsRead(userId: string) {
    return prisma.notifications.updateMany({
      where: {
        userId,
        tenantId: this.tenantId,
        isRead: false,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });
  }

  async getUserNotifications(
    userId: string,
    filters?: {
      status?: 'unread' | 'all';
      limit?: number;
      cursor?: string;
      category?: string;
    }
  ) {
    try {
      const where: { userId: string; tenantId: string; [key: string]: unknown } = {
        userId,
        tenantId: this.tenantId,
      };

      if (filters?.status === 'unread') {
        where.isRead = false;
      }

      if (filters?.category) {
        where.category = filters.category;
      }

      const notifications = await prisma.notifications.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: filters?.limit || 20,
        ...(filters?.cursor && {
          cursor: { id: filters.cursor },
          skip: 1,
        }),
      });

      const unreadCount = await prisma.notifications.count({
        where: {
          userId,
          tenantId: this.tenantId,
          isRead: false,
        },
      });

      return {
        notifications,
        unreadCount,
        hasMore: notifications.length === (filters?.limit || 20),
      };
    } catch (error) {
      console.error('Error fetching user notifications:', error);
      // Return empty results if there's an error
      return {
        notifications: [],
        unreadCount: 0,
        hasMore: false,
      };
    }
  }

  async getNotificationPreferences(userId: string) {
    try {
      return await prisma.notification_preferences.findMany({
        where: { userId },
        orderBy: { category: 'asc' },
      });
    } catch (error) {
      console.error('Error fetching notification preferences:', error);
      // Return empty array if there's an error (e.g., table doesn't exist yet)
      return [];
    }
  }

  async updateNotificationPreferences(
    userId: string,
    preferences: Array<{
      category: string;
      inAppEnabled?: boolean;
      emailEnabled?: boolean;
      smsEnabled?: boolean;
      frequency?: string;
      quietHoursStart?: string | null;
      quietHoursEnd?: string | null;
    }>
  ) {
    const operations = preferences.map((pref) =>
      prisma.notification_preferences.upsert({
        where: {
          userId_category: {
            userId,
            category: pref.category as 'bot_activity' | 'system' | 'metrics' | 'team' | 'billing',
          },
        },
        update: {
          inAppEnabled: pref.inAppEnabled,
          emailEnabled: pref.emailEnabled,
          smsEnabled: pref.smsEnabled,
          frequency: (pref.frequency || 'REALTIME') as 'REALTIME' | 'HOURLY_DIGEST' | 'DAILY_DIGEST',
          quietHoursStart: pref.quietHoursStart,
          quietHoursEnd: pref.quietHoursEnd,
        },
        create: {
          id: randomUUID().replace(/-/g, ''),
          userId,
          category: pref.category as 'bot_activity' | 'system' | 'metrics' | 'team' | 'billing',
          inAppEnabled: pref.inAppEnabled ?? true,
          emailEnabled: pref.emailEnabled ?? false,
          smsEnabled: pref.smsEnabled ?? false,
          frequency: (pref.frequency || 'REALTIME') as 'REALTIME' | 'HOURLY_DIGEST' | 'DAILY_DIGEST',
          quietHoursStart: pref.quietHoursStart,
          quietHoursEnd: pref.quietHoursEnd,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      })
    );

    return prisma.$transaction(operations);
  }
}

// Helper function to create tenant-scoped database instance
export function createTenantDB(tenantId: string): TenantDB {
  return new TenantDB(tenantId);
}

// Global database operations (for platform-level operations)
export async function getTenant(tenantId: string) {
  return prisma.tenants.findUnique({
    where: { id: tenantId },
    include: {
      _count: {
        select: {
          users: true,
          bots: true,
          conversations: true,
        },
      },
    },
  });
}

export async function getTenantBySubdomain(subdomain: string) {
  return prisma.tenants.findUnique({
    where: { subdomain },
  });
}

export async function getTenantByCustomDomain(customDomain: string) {
  return prisma.tenants.findFirst({
    where: { customDomain },
  });
}

export async function createTenant(data: {
  name: string;
  subdomain: string;
  customDomain?: string;
  plan?: string;
}) {
  const tenantId = randomUUID().replace(/-/g, '');
  const now = new Date();
  return prisma.tenants.create({
    data: {
      id: tenantId,
      ...data,
      plan: (data.plan as 'FREE' | 'STARTER' | 'PROFESSIONAL' | 'ENTERPRISE' | 'WHITE_LABEL' | undefined) || 'FREE',
      createdAt: now,
      updatedAt: now,
    },
  });
} 