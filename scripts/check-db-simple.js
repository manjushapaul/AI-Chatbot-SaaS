const { PrismaClient } = require('@prisma/client');

// Override DIRECT_URL to use DATABASE_URL if needed
process.env.DIRECT_URL = process.env.DIRECT_URL || process.env.DATABASE_URL;

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
      directUrl: process.env.DIRECT_URL || process.env.DATABASE_URL
    }
  }
});

async function checkDatabase() {
  try {
    console.log('📋 Checking database contents...\n');
    
    // Use raw query to check tenants
    const tenants = await prisma.$queryRaw`
      SELECT id, subdomain, name, status, plan 
      FROM tenants 
      ORDER BY "createdAt" DESC 
      LIMIT 10
    `;
    
    console.log('📊 Tenants (' + tenants.length + '):');
    if (tenants.length === 0) {
      console.log('   ⚠️  No tenants found\n');
    } else {
      tenants.forEach((t, i) => {
        console.log(`   ${i+1}. Subdomain: "${t.subdomain}"`);
        console.log(`      Name: ${t.name}`);
        console.log(`      Status: ${t.status}`);
        console.log(`      Plan: ${t.plan}\n`);
      });
    }

    // Check users
    const users = await prisma.$queryRaw`
      SELECT u.id, u.email, u.name, u.status, u.role, t.subdomain 
      FROM users u 
      LEFT JOIN tenants t ON u."tenantId" = t.id 
      ORDER BY u."createdAt" DESC 
      LIMIT 10
    `;
    
    console.log('👥 Users (' + users.length + '):');
    if (users.length === 0) {
      console.log('   ⚠️  No users found\n');
    } else {
      users.forEach((u, i) => {
        console.log(`   ${i+1}. Email: ${u.email}`);
        console.log(`      Name: ${u.name || 'N/A'}`);
        console.log(`      Role: ${u.role || 'USER'}`);
        console.log(`      Status: ${u.status}`);
        console.log(`      Tenant: ${u.subdomain || 'N/A'}\n`);
      });
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabase();
