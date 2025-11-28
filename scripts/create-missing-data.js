const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createMissingData() {
  try {
    console.log('🔍 Finding existing tenant and bot...');
    
    // Find the existing tenant
    const tenant = await prisma.tenant.findFirst({
      where: { subdomain: 'test' }
    });
    
    if (!tenant) {
      console.error('❌ No tenant found with subdomain "test"');
      return;
    }
    
    // Find the existing bot
    const bot = await prisma.bot.findFirst({
      where: { tenantId: tenant.id }
    });
    
    if (!bot) {
      console.error('❌ No bot found for tenant');
      return;
    }
    
    console.log('✅ Found tenant:', tenant.name, `(ID: ${tenant.id})`);
    console.log('✅ Found bot:', bot.name, `(ID: ${bot.id})`);
    
    // Check if knowledge base exists
    const existingKB = await prisma.knowledgeBase.findFirst({
      where: { 
        tenantId: tenant.id,
        botId: bot.id
      }
    });
    
    if (existingKB) {
      console.log('✅ Knowledge base already exists:', existingKB.name);
    } else {
      // Create knowledge base
      const knowledgeBase = await prisma.knowledgeBase.create({
        data: {
          name: 'Test Knowledge Base',
          description: 'A test knowledge base for development',
          status: 'ACTIVE',
          tenantId: tenant.id,
          botId: bot.id
        }
      });
      console.log('✅ Knowledge base created:', knowledgeBase.name, `(ID: ${knowledgeBase.id})`);
    }
    
    // Check if widget exists
    const existingWidget = await prisma.widget.findFirst({
      where: { 
        tenantId: tenant.id,
        botId: bot.id
      }
    });
    
    if (existingWidget) {
      console.log('✅ Widget already exists:', existingWidget.name);
    } else {
      // Create widget
      const widget = await prisma.widget.create({
        data: {
          name: 'Test Widget',
          type: 'CHAT_WIDGET',
          config: {
            theme: 'light',
            position: 'bottom-right',
            size: 'medium',
            welcomeMessage: 'Hello! How can I help you today?',
            primaryColor: '#007bff',
            secondaryColor: '#6c757d',
            showAvatar: true,
            showBranding: true,
            autoOpen: false,
            chatTitle: 'Test Chat'
          },
          status: 'ACTIVE',
          tenantId: tenant.id,
          botId: bot.id
        }
      });
      console.log('✅ Widget created:', widget.name, `(ID: ${widget.id})`);
    }
    
    console.log('\n🎉 All data created successfully!');
    
  } catch (error) {
    console.error('❌ Error creating missing data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createMissingData(); 