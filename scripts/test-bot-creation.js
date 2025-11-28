const { PrismaClient } = require('@prisma/client');

async function testBotCreation() {
  console.log('🔍 Testing bot creation directly...');
  
  const prisma = new PrismaClient({
    log: ['query', 'error', 'warn'],
  });

  try {
    // Test database connection
    await prisma.$connect();
    console.log('✅ Database connection successful');
    
    // Get a tenant ID for testing
    const tenant = await prisma.tenant.findFirst();
    if (!tenant) {
      console.log('❌ No tenants found. Please create a tenant first.');
      return;
    }
    
    console.log('📋 Using tenant:', tenant.id, tenant.name);
    
    // Test bot creation
    const botData = {
      name: 'Test Bot',
      description: 'A test bot for debugging',
      avatar: '🤖',
      personality: 'You are a helpful test bot.',
      model: 'gpt-3.5-turbo',
      temperature: 0.7,
      maxTokens: 1000,
      status: 'ACTIVE',
      tenantId: tenant.id
    };
    
    console.log('📝 Creating bot with data:', botData);
    
    const bot = await prisma.bot.create({
      data: botData
    });
    
    console.log('✅ Bot created successfully:', bot);
    
    // Test fetching the bot
    const fetchedBot = await prisma.bot.findFirst({
      where: { id: bot.id, tenantId: tenant.id }
    });
    
    console.log('🔍 Bot fetched successfully:', fetchedBot);
    
    // Clean up - delete the test bot
    await prisma.bot.delete({
      where: { id: bot.id }
    });
    
    console.log('🧹 Test bot cleaned up');
    
  } catch (error) {
    console.error('❌ Bot creation test failed:', error);
    
    if (error.code === 'P2002') {
      console.log('💡 Unique constraint violation - check if bot name already exists');
    } else if (error.code === 'P2003') {
      console.log('💡 Foreign key constraint violation - check if tenant exists');
    }
    
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testBotCreation().catch(console.error); 