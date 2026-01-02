const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient({
  log: ['error', 'warn'],
});

async function testAuth() {
  const email = 'admin@test.com';
  const password = 'password123';
  const tenant = 'test';
  
  try {
    console.log('🔍 Testing auth flow with credentials:');
    console.log(`   Email: ${email}`);
    console.log(`   Tenant: ${tenant}\n`);
    
    // Step 1: Find tenant
    const tenantRecord = await prisma.tenants.findUnique({
      where: { subdomain: tenant },
    });
    
    if (!tenantRecord) {
      console.log('❌ Tenant not found');
      return;
    }
    console.log('✅ Tenant found:', tenantRecord.subdomain, '- Status:', tenantRecord.status);
    
    if (tenantRecord.status !== 'ACTIVE') {
      console.log('❌ Tenant is not ACTIVE');
      return;
    }
    
    // Step 2: Find user
    const user = await prisma.users.findFirst({
      where: {
        email: email.toLowerCase(),
        tenantId: tenantRecord.id,
        status: 'ACTIVE'
      },
      include: {
        tenants: true
      }
    });
    
    if (!user) {
      console.log('❌ User not found');
      return;
    }
    console.log('✅ User found:', user.email, '- Status:', user.status);
    
    // Step 3: Verify password
    if (!user.password) {
      console.log('❌ User has no password');
      return;
    }
    
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      console.log('❌ Password is invalid');
      return;
    }
    
    console.log('✅ Password is valid!');
    console.log('\n🎉 Authentication successful!');
    console.log(`   User: ${user.name} (${user.email})`);
    console.log(`   Role: ${user.role}`);
    console.log(`   Tenant: ${user.tenants.subdomain}`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.code) console.error('   Error code:', error.code);
    if (error.stack) console.error(error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

testAuth();
