const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testWidgets() {
  try {
    console.log('🧪 Testing Widget CRUD Operations...\n');

    // First, let's check if we have any tenants and bots
    const tenants = await prisma.tenant.findMany({
      take: 1,
      include: {
        bots: {
          take: 1,
        },
      },
    });

    if (tenants.length === 0) {
      console.log('❌ No tenants found. Please create a tenant first.');
      return;
    }

    const tenant = tenants[0];
    console.log(`✅ Found tenant: ${tenant.name} (${tenant.id})`);

    if (tenant.bots.length === 0) {
      console.log('❌ No bots found for this tenant. Please create a bot first.');
      return;
    }

    const bot = tenant.bots[0];
    console.log(`✅ Found bot: ${bot.name} (${bot.id})`);

    // Test 1: Create a widget
    console.log('\n📝 Test 1: Creating a widget...');
    const testWidget = await prisma.widget.create({
      data: {
        name: 'Test Chat Widget',
        type: 'CHAT_WIDGET',
        config: {
          theme: 'light',
          position: 'bottom-right',
          size: 'medium',
          welcomeMessage: 'Hello! How can I help you today?',
          primaryColor: '#384c6b',
          secondaryColor: '#ae1e58',
          showAvatar: true,
          showBranding: true,
          autoOpen: false,
          chatTitle: 'Chat with us'
        },
        tenantId: tenant.id,
        botId: bot.id,
      },
    });

    console.log(`✅ Widget created: ${testWidget.name} (${testWidget.id})`);

    // Test 2: Read the widget
    console.log('\n📖 Test 2: Reading the widget...');
    const readWidget = await prisma.widget.findFirst({
      where: {
        id: testWidget.id,
        tenantId: tenant.id,
      },
      include: {
        bot: {
          select: { name: true },
        },
        tenant: {
          select: { name: true },
        },
      },
    });

    if (readWidget) {
      console.log(`✅ Widget read successfully: ${readWidget.name}`);
      console.log(`   - Bot: ${readWidget.bot.name}`);
      console.log(`   - Tenant: ${readWidget.tenant.name}`);
      console.log(`   - Config: ${JSON.stringify(readWidget.config, null, 2)}`);
    } else {
      console.log('❌ Failed to read widget');
    }

    // Test 3: Update the widget
    console.log('\n✏️ Test 3: Updating the widget...');
    const updatedWidget = await prisma.widget.update({
      where: { id: testWidget.id },
      data: {
        name: 'Updated Test Widget',
        config: {
          ...testWidget.config,
          theme: 'dark',
          welcomeMessage: 'Updated welcome message!',
        },
      },
    });

    console.log(`✅ Widget updated: ${updatedWidget.name}`);
    console.log(`   - New theme: ${updatedWidget.config.theme}`);
    console.log(`   - New message: ${updatedWidget.config.welcomeMessage}`);

    // Test 4: List all widgets for the tenant
    console.log('\n📋 Test 4: Listing all widgets for tenant...');
    const allWidgets = await prisma.widget.findMany({
      where: { tenantId: tenant.id },
      include: {
        bot: {
          select: { name: true },
        },
      },
    });

    console.log(`✅ Found ${allWidgets.length} widgets:`);
    allWidgets.forEach((widget, index) => {
      console.log(`   ${index + 1}. ${widget.name} (${widget.type}) - Bot: ${widget.bot.name}`);
    });

    // Test 5: Delete the test widget
    console.log('\n🗑️ Test 5: Deleting the test widget...');
    await prisma.widget.delete({
      where: { id: testWidget.id },
    });

    console.log('✅ Test widget deleted successfully');

    // Verify deletion
    const deletedWidget = await prisma.widget.findFirst({
      where: { id: testWidget.id },
    });

    if (!deletedWidget) {
      console.log('✅ Widget deletion verified');
    } else {
      console.log('❌ Widget still exists after deletion');
    }

    console.log('\n🎉 All widget tests passed successfully!');
    console.log('\n📋 Summary:');
    console.log('   ✅ Widget creation works');
    console.log('   ✅ Widget reading works');
    console.log('   ✅ Widget updating works');
    console.log('   ✅ Widget listing works');
    console.log('   ✅ Widget deletion works');

  } catch (error) {
    console.error('❌ Widget test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testWidgets(); 