import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

// Tenant-scoped database operations
export class TenantDB {
  constructor(private tenantId: string) {}

  // Bot operations
  async getBots() {
    return prisma.bot.findMany({
      where: { tenantId: this.tenantId },
      include: {
        knowledgeBases: true,
        widgets: true,
        _count: {
          select: {
            conversations: true,
          },
        },
      },
    });
  }

  async getBot(id: string) {
    return prisma.bot.findFirst({
      where: { id, tenantId: this.tenantId },
      include: {
        knowledgeBases: {
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
    console.log('Creating bot with data:', data);
    console.log('Tenant ID:', this.tenantId);
    
    try {
      const bot = await prisma.bot.create({
        data: {
          ...data,
          tenantId: this.tenantId,
          // Ensure status is properly set
          status: data.status || 'ACTIVE',
        },
      });
      
      console.log('Bot created successfully:', bot);
      return bot;
    } catch (error) {
      console.error('Error creating bot:', error);
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
  }>) {
    return prisma.bot.update({
      where: { id, tenantId: this.tenantId },
      data,
    });
  }

  async deleteBot(id: string) {
    return prisma.bot.delete({
      where: { id, tenantId: this.tenantId },
    });
  }

  // Knowledge base operations
  async getKnowledgeBases(botId?: string) {
    return prisma.knowledgeBase.findMany({
      where: { 
        tenantId: this.tenantId,
        ...(botId && { botId }),
      },
      include: {
        documents: true,
        faqs: true,
        bot: {
          select: { name: true },
        },
      },
    });
  }

  async createKnowledgeBase(data: {
    name: string;
    description?: string;
    botId: string;
  }) {
    return prisma.knowledgeBase.create({
      data: {
        ...data,
        tenantId: this.tenantId,
      },
    });
  }

  async updateKnowledgeBase(id: string, data: {
    name?: string;
    description?: string;
  }) {
    return prisma.knowledgeBase.update({
      where: { id, tenantId: this.tenantId },
      data,
    });
  }

  async deleteKnowledgeBase(id: string) {
    return prisma.knowledgeBase.delete({
      where: { id, tenantId: this.tenantId },
    });
  }

  // FAQ operations
  async createFAQ(data: {
    question: string;
    answer: string;
    category?: string;
    knowledgeBaseId: string;
  }) {
    return prisma.fAQ.create({
      data: {
        question: data.question,
        answer: data.answer,
        category: data.category,
        knowledgeBase: {
          connect: {
            id: data.knowledgeBaseId,
          },
        },
      },
    });
  }

  async getFAQsByKnowledgeBase(knowledgeBaseId: string) {
    return prisma.fAQ.findMany({
      where: {
        knowledgeBaseId,
        knowledgeBase: {
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
    return prisma.fAQ.update({
      where: { id },
      data,
    });
  }

  async deleteFAQ(id: string) {
    return prisma.fAQ.delete({
      where: { id },
    });
  }

  // Document operations
  async addDocument(data: {
    title: string;
    content: string;
    type: 'PDF' | 'DOCX' | 'TXT' | 'HTML' | 'MARKDOWN' | 'JSON';
    url?: string;
    knowledgeBaseId: string;
    embeddings?: Record<string, unknown>[];
  }) {
    return prisma.document.create({
      data: {
        title: data.title,
        content: data.content,
        type: data.type,
        url: data.url,
        embeddings: data.embeddings,
        knowledgeBase: {
          connect: {
            id: data.knowledgeBaseId,
          },
        },
      },
    });
  }

  async getDocumentsByKnowledgeBase(knowledgeBaseId: string) {
    return prisma.document.findMany({
      where: {
        knowledgeBaseId,
        knowledgeBase: {
          tenantId: this.tenantId,
        },
      },
      select: {
        id: true,
        title: true,
        type: true,
        createdAt: true,
        updatedAt: true,
        status: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async getDocument(id: string) {
    return prisma.document.findFirst({
      where: {
        id,
        knowledgeBase: {
          tenantId: this.tenantId,
        },
      },
      include: {
        knowledgeBase: {
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
    return prisma.document.update({
      where: { id },
      data,
    });
  }

  async deleteDocument(id: string) {
    return prisma.document.delete({
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
    return prisma.conversation.create({
      data: {
        tenantId: this.tenantId,
        userId: data.userId,
        botId: data.botId,
        title: data.title,
        metadata: data.metadata,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        bot: {
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
    return prisma.conversation.findMany({
      where: {
        tenantId: this.tenantId,
        ...(filters?.userId && { userId: filters.userId }),
        ...(filters?.botId && { botId: filters.botId }),
        ...(filters?.status && { status: filters.status }),
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        bot: {
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
    return prisma.conversation.findFirst({
      where: {
        id,
        tenantId: this.tenantId,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        bot: {
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
    return prisma.conversation.update({
      where: { id },
      data,
    });
  }

  async closeConversation(id: string) {
    return prisma.conversation.update({
      where: { id },
      data: {
        status: 'CLOSED',
        closedAt: new Date(),
      },
    });
  }

  async deleteConversation(id: string) {
    return prisma.conversation.delete({
      where: { id },
    });
  }

  // Message operations
  async addMessage(data: {
    conversationId: string;
    role: 'USER' | 'ASSISTANT' | 'SYSTEM';
    content: string;
    tokens: number;
    cost: number;
    model?: string;
    responseTime?: number;
    metadata?: Record<string, unknown>;
  }) {
    const message = await prisma.message.create({
      data: {
        conversationId: data.conversationId,
        role: data.role,
        content: data.content,
        tokens: data.tokens,
        cost: data.cost,
        model: data.model,
        responseTime: data.responseTime,
        metadata: data.metadata,
      },
    });

    // Update conversation stats
    await prisma.conversation.update({
      where: { id: data.conversationId },
      data: {
        messageCount: {
          increment: 1,
        },
        totalTokens: {
          increment: data.tokens,
        },
        totalCost: {
          increment: data.cost,
        },
        lastMessageAt: new Date(),
      },
    });

    return message;
  }

  async getMessages(conversationId: string) {
    return prisma.message.findMany({
      where: {
        conversationId,
        conversation: {
          tenantId: this.tenantId,
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });
  }

  async getConversationStats(conversationId: string) {
    const conversation = await prisma.conversation.findFirst({
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
    const documentCount = await prisma.document.count({
      where: {
        knowledgeBaseId,
        knowledgeBase: {
          tenantId: this.tenantId,
        },
      },
    });

    return {
      documentCount,
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
    return prisma.widget.create({
      data: {
        name: data.name,
        type: data.type,
        config: data.config,
        tenantId: this.tenantId,
        botId: data.botId,
      },
    });
  }

  async getWidgets(botId?: string) {
    return prisma.widget.findMany({
      where: { 
        tenantId: this.tenantId,
        ...(botId && { botId }),
      },
      include: {
        bot: {
          select: { name: true },
        },
      },
    });
  }

  async getWidget(id: string) {
    return prisma.widget.findFirst({
      where: { 
        id,
        tenantId: this.tenantId,
      },
      include: {
        bot: {
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
    return prisma.widget.update({
      where: { id, tenantId: this.tenantId },
      data,
    });
  }

  async deleteWidget(id: string) {
    return prisma.widget.delete({
      where: { id, tenantId: this.tenantId },
    });
  }

  // User operations
  async getUsers() {
    return prisma.user.findMany({
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
            apiKeys: true,
          },
        },
      },
    });
  }

  async getUser(id: string) {
    return prisma.user.findFirst({
      where: { id, tenantId: this.tenantId },
    });
  }

  async getUserByEmail(email: string) {
    return prisma.user.findFirst({
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
    return prisma.user.create({
      data: {
        email: data.email,
        name: data.name,
        password: data.password,
        role: data.role,
        status: data.status,
        tenantId: this.tenantId,
      },
    });
  }

  async updateUser(id: string, data: Partial<{
    name: string;
    role: 'SUPER_ADMIN' | 'TENANT_ADMIN' | 'USER' | 'BOT_OPERATOR';
    status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
    lastActive: Date;
  }>) {
    return prisma.user.update({
      where: { id, tenantId: this.tenantId },
      data,
    });
  }

  async updateUserPassword(id: string, password: string) {
    return prisma.user.update({
      where: { id, tenantId: this.tenantId },
      data: { password },
    });
  }

  async deleteUser(id: string) {
    return prisma.user.delete({
      where: { id, tenantId: this.tenantId },
    });
  }

  async getConversationCountByUser(userId: string): Promise<number> {
    const count = await prisma.conversation.count({
      where: { 
        userId,
        tenantId: this.tenantId 
      },
    });
    return count;
  }

  async getApiKeyCountByUser(userId: string): Promise<number> {
    const count = await prisma.apiKey.count({
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
    return prisma.apiKey.create({
      data: {
        ...data,
        tenantId: this.tenantId,
      },
    });
  }

  async getApiKeys() {
    return prisma.apiKey.findMany({
      where: { tenantId: this.tenantId },
      include: {
        user: {
          select: { name: true, email: true },
        },
      },
    });
  }

  async validateApiKey(key: string) {
    return prisma.apiKey.findFirst({
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
        user: true,
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

      return await prisma.notification.create({
        data: {
          userId: data.userId,
          tenantId: this.tenantId,
          type: mappedType,
          title: data.title,
          message: data.message,
          category: mappedCategory,
          priority: mappedPriority,
          actionUrl: data.actionUrl,
          metadata: data.metadata || {},
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
    return prisma.notification.updateMany({
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
    return prisma.notification.updateMany({
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

      const notifications = await prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: filters?.limit || 20,
        ...(filters?.cursor && {
          cursor: { id: filters.cursor },
          skip: 1,
        }),
      });

      const unreadCount = await prisma.notification.count({
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
      return await prisma.notificationPreference.findMany({
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
      prisma.notificationPreference.upsert({
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
          userId,
          category: pref.category as 'bot_activity' | 'system' | 'metrics' | 'team' | 'billing',
          inAppEnabled: pref.inAppEnabled ?? true,
          emailEnabled: pref.emailEnabled ?? false,
          smsEnabled: pref.smsEnabled ?? false,
          frequency: (pref.frequency || 'REALTIME') as 'REALTIME' | 'HOURLY_DIGEST' | 'DAILY_DIGEST',
          quietHoursStart: pref.quietHoursStart,
          quietHoursEnd: pref.quietHoursEnd,
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
  return prisma.tenant.findUnique({
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
  return prisma.tenant.findUnique({
    where: { subdomain },
  });
}

export async function getTenantByCustomDomain(customDomain: string) {
  return prisma.tenant.findFirst({
    where: { customDomain },
  });
}

export async function createTenant(data: {
  name: string;
  subdomain: string;
  customDomain?: string;
  plan?: string;
}) {
  return prisma.tenant.create({
    data: {
      ...data,
      plan: (data.plan as 'FREE' | 'STARTER' | 'PROFESSIONAL' | 'ENTERPRISE' | 'WHITE_LABEL' | undefined) || 'FREE',
    },
  });
} 