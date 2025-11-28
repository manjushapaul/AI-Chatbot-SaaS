const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function setupTestData() {
  try {
    console.log('🔧 Setting up test data for conversations...\n');

    // Create a test tenant
    console.log('📝 Creating test tenant...');
    const tenant = await prisma.tenant.create({
      data: {
        name: 'Test Company',
        subdomain: 'test-company',
        status: 'ACTIVE',
      },
    });
    console.log(`✅ Tenant created: ${tenant.name} (${tenant.id})`);

    // Create a test user
    console.log('\n👤 Creating test user...');
    const user = await prisma.user.create({
      data: {
        email: 'test@example.com',
        name: 'Test User',
        role: 'TENANT_ADMIN',
        status: 'ACTIVE',
        tenantId: tenant.id,
      },
    });
    console.log(`✅ User created: ${user.name} (${user.email})`);

    // Create a test bot
    console.log('\n🤖 Creating test bot...');
    const bot = await prisma.bot.create({
      data: {
        name: 'Test Bot',
        description: 'A test bot for conversation testing',
        personality: 'Helpful and friendly',
        model: 'gpt-3.5-turbo',
        temperature: 0.7,
        maxTokens: 1000,
        status: 'ACTIVE',
        tenantId: tenant.id,
      },
    });
    console.log(`✅ Bot created: ${bot.name} (${bot.id})`);

    // Create a subscription for the tenant
    console.log('\n💳 Creating subscription...');
    const subscription = await prisma.subscription.create({
      data: {
        tenantId: tenant.id,
        plan: 'FREE',
        status: 'ACTIVE',
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        monthlyUsage: {},
      },
    });
    console.log(`✅ Subscription created: ${subscription.plan} plan`);

    console.log('\n🎉 Test data setup completed successfully!');
    console.log('\n📋 Summary:');
    console.log(`   Tenant: ${tenant.name} (${tenant.id})`);
    console.log(`   User: ${user.name} (${user.email})`);
    console.log(`   Bot: ${bot.name} (${bot.id})`);
    console.log(`   Subscription: ${subscription.plan} plan`);

  } catch (error) {
    console.error('❌ Test data setup failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the setup
setupTestData(); 