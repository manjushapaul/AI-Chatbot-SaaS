const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testUsersAPI() {
  try {
    console.log('👥 Testing Users API functionality...\n');

    // Get the test tenant
    const tenant = await prisma.tenant.findFirst({
      include: {
        users: true,
      },
    });

    if (!tenant) {
      console.log('❌ No tenant found. Please run setup-test-data.js first.');
      return;
    }

    console.log(`✅ Using tenant: ${tenant.name}`);
    console.log(`✅ Current users: ${tenant.users.length}`);

    // Test basic user queries
    console.log('\n📊 Testing user queries...');
    
    // Get all users for the tenant
    const users = await prisma.user.findMany({
      where: { tenantId: tenant.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: { createdAt: 'desc' }
    });

    console.log(`✅ Found ${users.length} users:`);
    users.forEach(user => {
      console.log(`   - ${user.name || 'Unknown'} (${user.email}) - ${user.role || 'USER'} - ${user.status || 'ACTIVE'}`);
    });

    // Count users by role
    const roleCounts = await prisma.user.groupBy({
      by: ['role'],
      where: { tenantId: tenant.id },
      _count: { role: true }
    });

    console.log('\n📈 Role distribution:');
    roleCounts.forEach(roleCount => {
      console.log(`   - ${roleCount.role || 'USER'}: ${roleCount._count.role}`);
    });

    // Count users by status
    const statusCounts = await prisma.user.groupBy({
      by: ['status'],
      where: { tenantId: tenant.id },
      _count: { status: true }
    });

    console.log('\n📊 Status distribution:');
    statusCounts.forEach(statusCount => {
      console.log(`   - ${statusCount.status || 'ACTIVE'}: ${statusCount._count.status}`);
    });

    console.log('\n🎉 Users API test completed successfully!');

  } catch (error) {
    console.error('❌ Users API test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testUsersAPI(); 