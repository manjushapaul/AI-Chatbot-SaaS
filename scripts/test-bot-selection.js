const { PrismaClient } = require('@prisma/client');

async function testBotSelection() {
  console.log('🧪 Testing Bot Selection and Dynamic Values...');
  
  try {
    const prisma = new PrismaClient();
    
    // Check available bots
    const bots = await prisma.bot.findMany({
      select: { 
        id: true, 
        name: true, 
        model: true, 
        temperature: true, 
        maxTokens: true,
        personality: true,
        tenantId: true
      }
    });
    
    console.log('📊 Available Bots:');
    console.log('==================');
    
    if (bots.length === 0) {
      console.log('❌ No bots found in database');
      console.log('💡 Create a bot first at /dashboard/bots/create');
      return;
    }
    
    bots.forEach((bot, index) => {
      console.log(`${index + 1}. ${bot.name}`);
      console.log(`   ID: ${bot.id}`);
      console.log(`   Model: ${bot.model}`);
      console.log(`   Temperature: ${bot.temperature}`);
      console.log(`   Max Tokens: ${bot.maxTokens || 'Not set'}`);
      console.log(`   Personality: ${bot.personality || 'Not set'}`);
      console.log(`   Tenant ID: ${bot.tenantId}`);
      console.log('');
    });
    
    // Check if bots have proper data
    const validBots = bots.filter(bot => 
      bot.name && bot.model && bot.temperature !== undefined
    );
    
    console.log('✅ Bot Data Validation:');
    console.log('=======================');
    console.log(`Total bots: ${bots.length}`);
    console.log(`Valid bots: ${validBots.length}`);
    console.log(`Bots with complete data: ${validBots.length}`);
    
    if (validBots.length === 0) {
      console.log('❌ No bots have complete data');
      console.log('💡 Ensure bots have name, model, and temperature set');
    } else {
      console.log('✅ Bots are ready for knowledge base creation');
    }
    
    await prisma.$disconnect();
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testBotSelection(); 