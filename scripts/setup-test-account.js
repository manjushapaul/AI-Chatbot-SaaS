const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function setupTestAccount() {
  try {
    console.log('🚀 Setting up test account...');

    // Create a test tenant
    const tenant = await prisma.tenant.create({
      data: {
        name: 'Test Company',
        subdomain: 'test',
        plan: 'FREE',
        status: 'ACTIVE'
      }
    });

    console.log('✅ Tenant created:', tenant.name, `(ID: ${tenant.id})`);

    // Create a test bot
    const bot = await prisma.bot.create({
      data: {
        name: 'Test Bot',
        description: 'A test bot for development',
        personality: 'I am a helpful test bot. I can answer questions and help users.',
        model: 'gpt-3.5-turbo',
        temperature: 0.7,
        maxTokens: 1000,
        status: 'ACTIVE',
        tenantId: tenant.id
      }
    });

    console.log('✅ Bot created:', bot.name, `(ID: ${bot.id})`);

    // Create a test user
    const hashedPassword = await bcrypt.hash('password123', 12);
    const user = await prisma.user.create({
      data: {
        email: 'admin@test.com',
        name: 'Test Admin',
        password: hashedPassword,
        role: 'TENANT_ADMIN',
        status: 'ACTIVE',
        tenantId: tenant.id
      }
    });

    console.log('✅ User created:', user.email, `(ID: ${user.id})`);

    // Create a test knowledge base
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

    // Create a test widget
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
    console.error('❌ Error setting up test account:', error);
    
    if (error.code === 'P2002') {
      console.log('\n💡 The test account already exists. You can use:');
      console.log('   Email: admin@test.com');
      console.log('   Password: password123');
      console.log('   Tenant: test');
    }
  } finally {
    await prisma.$disconnect();
  }
}

// Run the setup
setupTestAccount(); 