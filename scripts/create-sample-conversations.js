const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createSampleConversations() {
  try {
    console.log('🎭 Creating sample conversations for the frontend...\n');

    // Get the first tenant, user, and bot
    const tenant = await prisma.tenant.findFirst({
      include: {
        users: { take: 1 },
        bots: { take: 1 },
      },
    });

    if (!tenant || !tenant.users.length || !tenant.bots.length) {
      console.log('❌ No tenant, user, or bot found. Please run setup-test-data.js first.');
      return;
    }

    const user = tenant.users[0];
    const bot = tenant.bots[0];

    console.log(`✅ Using tenant: ${tenant.name}`);
    console.log(`✅ Using user: ${user.name || user.email}`);
    console.log(`✅ Using bot: ${bot.name}`);

    // Sample conversation data
    const sampleConversations = [
      {
        title: 'Customer Support Inquiry',
        status: 'CLOSED',
        messages: [
          {
            role: 'USER',
            content: 'Hello, I need help with my account.',
            tokens: 12,
            cost: 0.00024,
          },
          {
            role: 'ASSISTANT',
            content: 'Hello! I\'d be happy to help you with your account. What specific issue are you experiencing?',
            tokens: 25,
            cost: 0.0005,
          },
          {
            role: 'USER',
            content: 'I can\'t log in to my dashboard.',
            tokens: 10,
            cost: 0.0002,
          },
          {
            role: 'ASSISTANT',
            content: 'I understand you\'re having trouble logging in. Let me help you troubleshoot this. Have you tried resetting your password?',
            tokens: 28,
            cost: 0.00056,
          },
        ],
      },
      {
        title: 'Product Information Request',
        status: 'ACTIVE',
        messages: [
          {
            role: 'USER',
            content: 'What features does your AI chatbot platform offer?',
            tokens: 15,
            cost: 0.0003,
          },
          {
            role: 'ASSISTANT',
            content: 'Our AI chatbot platform offers several key features including natural language processing, multi-language support, customizable appearance, integration with knowledge bases, and real-time analytics. Would you like me to elaborate on any specific feature?',
            tokens: 45,
            cost: 0.0009,
          },
        ],
      },
      {
        title: 'Pricing Question',
        status: 'CLOSED',
        messages: [
          {
            role: 'USER',
            content: 'What are your pricing plans?',
            tokens: 10,
            cost: 0.0002,
          },
          {
            role: 'ASSISTANT',
            content: 'We offer several pricing tiers: Free (basic features), Starter ($29/month), Professional ($99/month), and Enterprise (custom pricing). Each plan includes different features and usage limits. Which plan would be most suitable for your needs?',
            tokens: 52,
            cost: 0.00104,
          },
          {
            role: 'USER',
            content: 'Thanks, that helps a lot!',
            tokens: 8,
            cost: 0.00016,
          },
        ],
      },
    ];

    for (let i = 0; i < sampleConversations.length; i++) {
      const convData = sampleConversations[i];
      console.log(`\n📝 Creating conversation ${i + 1}: ${convData.title}`);

      // Create conversation
      const conversation = await prisma.conversation.create({
        data: {
          tenantId: tenant.id,
          userId: user.id,
          botId: bot.id,
          title: convData.title,
          status: convData.status,
          totalTokens: 0,
          totalCost: 0.0,
          messageCount: 0,
          ...(convData.status === 'CLOSED' && { closedAt: new Date() }),
        },
      });

      console.log(`✅ Conversation created: ${conversation.id}`);

      // Add messages
      let totalTokens = 0;
      let totalCost = 0.0;

      for (const msgData of convData.messages) {
        const message = await prisma.message.create({
          data: {
            conversationId: conversation.id,
            role: msgData.role,
            content: msgData.content,
            tokens: msgData.tokens,
            cost: msgData.cost,
            model: 'gpt-3.5-turbo',
            ...(msgData.role === 'ASSISTANT' && { responseTime: 1200 + Math.random() * 1000 }),
          },
        });

        totalTokens += msgData.tokens;
        totalCost += msgData.cost;

        console.log(`   💬 ${msgData.role} message added: ${message.id}`);
      }

      // Update conversation with totals
      await prisma.conversation.update({
        where: { id: conversation.id },
        data: {
          totalTokens,
          totalCost,
          messageCount: convData.messages.length,
        },
      });

      console.log(`   📊 Updated totals: ${totalTokens} tokens, $${totalCost.toFixed(6)} cost`);
    }

    console.log('\n🎉 Sample conversations created successfully!');
    console.log('\n📋 Summary:');
    console.log(`   Created ${sampleConversations.length} conversations`);
    console.log(`   Total messages: ${sampleConversations.reduce((sum, conv) => sum + conv.messages.length, 0)}`);
    console.log(`   Statuses: ${sampleConversations.map(conv => conv.status).join(', ')}`);

  } catch (error) {
    console.error('❌ Sample conversation creation failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
createSampleConversations(); 