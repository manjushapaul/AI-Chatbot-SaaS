const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createUser() {
  try {
    console.log('🔍 Finding existing tenant...');
    
    // Find the existing tenant
    const tenant = await prisma.tenant.findFirst({
      where: { subdomain: 'test' }
    });
    
    if (!tenant) {
      console.error('❌ No tenant found with subdomain "test"');
      return;
    }
    
    console.log('✅ Found tenant:', tenant.name, `(ID: ${tenant.id})`);
    
    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: { 
        email: 'admin@test.com',
        tenantId: tenant.id
      }
    });
    
    if (existingUser) {
      console.log('✅ User already exists:', existingUser.email);
      console.log('\n📋 Login Credentials:');
      console.log('   Email: admin@test.com');
      console.log('   Password: password123');
      console.log('   Tenant: test');
      return;
    }
    
    // Create the user
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
    console.log('\n📋 Login Credentials:');
    console.log('   Email: admin@test.com');
    console.log('   Password: password123');
    console.log('   Tenant: test');
    
  } catch (error) {
    console.error('❌ Error creating user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createUser(); 