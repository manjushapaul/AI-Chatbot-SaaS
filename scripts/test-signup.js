const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testSignup() {
  try {
    console.log('🧪 Testing signup process...\n');

    // Test 1: Check if we can create a tenant
    console.log('1. Testing tenant creation...');
    const testTenant = await prisma.tenant.create({
      data: {
        name: 'Test Organization',
        subdomain: 'testorg' + Date.now(),
        plan: 'FREE',
        status: 'ACTIVE'
      }
    });
    console.log('✅ Tenant created successfully:', testTenant.subdomain);

    // Test 2: Check if we can create a user
    console.log('\n2. Testing user creation...');
    const testUser = await prisma.user.create({
      data: {
        email: `test${Date.now()}@example.com`,
        name: 'Test User',
        password: 'hashedpassword123',
        tenantId: testTenant.id,
        role: 'TENANT_ADMIN',
        status: 'ACTIVE'
      }
    });
    console.log('✅ User created successfully:', testUser.email);

    // Test 3: Check if we can create a subscription
    console.log('\n3. Testing subscription creation...');
    const testSubscription = await prisma.subscription.create({
      data: {
        tenantId: testTenant.id,
        plan: 'FREE',
        status: 'ACTIVE',
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        cancelAtPeriodEnd: false
      }
    });
    console.log('✅ Subscription created successfully:', testSubscription.id);

    // Test 4: Clean up test data
    console.log('\n4. Cleaning up test data...');
    await prisma.subscription.delete({ where: { id: testSubscription.id } });
    await prisma.user.delete({ where: { id: testUser.id } });
    await prisma.tenant.delete({ where: { id: testTenant.id } });
    console.log('✅ Test data cleaned up successfully');

    console.log('\n🎉 All signup tests passed! The system is working correctly.');
    
  } catch (error) {
    console.error('❌ Signup test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testSignup(); 