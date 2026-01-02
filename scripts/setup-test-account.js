const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function setupTestAccount() {
  try {
    console.log('🚀 Setting up test account...');

    // Check if test tenant already exists
    let tenant = await prisma.tenants.findUnique({
      where: { subdomain: 'test' }
    });

    if (!tenant) {
      // Create a test tenant
      const { randomUUID } = require('crypto');
      const tenantId = randomUUID().replace(/-/g, '');
      const now = new Date();
      
      tenant = await prisma.tenants.create({
        data: {
          id: tenantId,
          name: 'Test Company',
          subdomain: 'test',
          plan: 'FREE',
          status: 'ACTIVE',
          createdAt: now,
          updatedAt: now
        }
      });
      console.log('✅ Tenant created:', tenant.name, `(ID: ${tenant.id})`);
    } else {
      console.log('ℹ️  Tenant already exists:', tenant.name, `(ID: ${tenant.id})`);
    }

    console.log('✅ Tenant created:', tenant.name, `(ID: ${tenant.id})`);

    // Check if test bot already exists
    let bot = await prisma.bots.findFirst({
      where: { 
        name: 'Test Bot',
        tenantId: tenant.id 
      }
    });

    if (!bot) {
      // Create a test bot
      const { randomUUID } = require('crypto');
      const botId = randomUUID().replace(/-/g, '');
      const now = new Date();
      
      bot = await prisma.bots.create({
      data: {
        name: 'Test Bot',
        description: 'A test bot for development',
        personality: 'I am a helpful test bot. I can answer questions and help users.',
        model: 'gpt-3.5-turbo',
        temperature: 0.7,
        maxTokens: 1000,
        status: 'ACTIVE',
        tenantId: tenant.id,
        createdAt: now,
        updatedAt: now
      }
      });
      console.log('✅ Bot created:', bot.name, `(ID: ${bot.id})`);
    } else {
      console.log('ℹ️  Bot already exists:', bot.name, `(ID: ${bot.id})`);
    }

    // Check if test user already exists
    let user = await prisma.users.findFirst({
      where: {
        email: 'admin@test.com',
        tenantId: tenant.id
      }
    });

    if (!user) {
      // Create a test user
      const hashedPassword = await bcrypt.hash('password123', 12);
      const { randomUUID } = require('crypto');
      const userId = randomUUID().replace(/-/g, '');
      const now = new Date();
      
      user = await prisma.users.create({
        data: {
          id: userId,
          email: 'admin@test.com',
          name: 'Test Admin',
          password: hashedPassword,
          role: 'TENANT_ADMIN',
          status: 'ACTIVE',
          tenantId: tenant.id,
          createdAt: now,
          updatedAt: now
        }
      });
      console.log('✅ User created:', user.email, `(ID: ${user.id})`);
    } else {
      console.log('ℹ️  User already exists:', user.email, `(ID: ${user.id})`);
      // Update password to ensure it's correct
      const hashedPassword = await bcrypt.hash('password123', 12);
      await prisma.users.update({
        where: { id: user.id },
        data: { password: hashedPassword }
      });
      console.log('✅ Password reset to: password123');
    }

    // Check if test knowledge base already exists
    let knowledgeBase = await prisma.knowledge_bases.findFirst({
      where: {
        name: 'Test Knowledge Base',
        tenantId: tenant.id
      }
    });

    if (!knowledgeBase) {
      // Create a test knowledge base
      const { randomUUID } = require('crypto');
      const kbId = randomUUID().replace(/-/g, '');
      const now = new Date();
      
      knowledgeBase = await prisma.knowledge_bases.create({
      data: {
        id: kbId,
        name: 'Test Knowledge Base',
        description: 'A test knowledge base for development',
        status: 'ACTIVE',
        tenantId: tenant.id,
        botId: bot.id,
        createdAt: now,
        updatedAt: now
      }
      });
      console.log('✅ Knowledge base created:', knowledgeBase.name, `(ID: ${knowledgeBase.id})`);
    } else {
      console.log('ℹ️  Knowledge base already exists:', knowledgeBase.name, `(ID: ${knowledgeBase.id})`);
    }

    // Check if test widget already exists
    let widget = await prisma.widgets.findFirst({
      where: {
        name: 'Test Widget',
        tenantId: tenant.id
      }
    });

    if (!widget) {
      // Create a test widget
      const { randomUUID } = require('crypto');
      const widgetId = randomUUID().replace(/-/g, '');
      const now = new Date();
      
      widget = await prisma.widgets.create({
      data: {
        name: 'Test Widget',
        type: 'CHAT_WIDGET',
        id: widgetId,
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
        botId: bot.id,
        createdAt: now,
        updatedAt: now
      }
      });
      console.log('✅ Widget created:', widget.name, `(ID: ${widget.id})`);
    } else {
      console.log('ℹ️  Widget already exists:', widget.name, `(ID: ${widget.id})`);
    }

    console.log('\n🎉 Test account setup complete!');
    console.log('\n📋 Login Credentials:');
    console.log('   Email: admin@test.com');
    console.log('   Password: password123');
    console.log('   Tenant: test');
    console.log('\n🔗 Dashboard URL: http://localhost:3000/dashboard');
    console.log('\n🤖 Test Bot ID:', bot.id);
    console.log('📱 Test Widget ID:', widget.id);
    console.log('\n💡 You can now:');
    console.log('   1. Login to the dashboard');
    console.log('   2. Create and manage bots');
    console.log('   3. Configure widgets');
    console.log('   4. Test the public chat endpoint');
    console.log('   5. Embed widgets on websites');

  } catch (error) {
    console.error('❌ Error setting up test account:', error.message);
    if (error.stack) console.error(error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the setup
setupTestAccount(); 