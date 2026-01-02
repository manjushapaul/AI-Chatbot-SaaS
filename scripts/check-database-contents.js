const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  log: ['error'],
});

async function checkDatabase() {
  try {
    console.log('📋 Checking database contents...\n');
    
    // Test connection first
    await prisma.$connect();
    console.log('✅ Connected to database\n');
    
    // Check tenants
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
        console.log(`      Plan: ${t.plan}`);
        console.log(`      ID: ${t.id.substring(0, 8)}...\n`);
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

    // Check bots
    const bots = await prisma.$queryRaw`
      SELECT id, name, status
      FROM bots
      ORDER BY "createdAt" DESC
      LIMIT 5
    `;
    
    console.log('🤖 Bots (' + bots.length + ' total, showing first 5):');
    if (bots.length === 0) {
      console.log('   ⚠️  No bots found\n');
    } else {
      bots.forEach((b, i) => {
        console.log(`   ${i+1}. Name: ${b.name}`);
        console.log(`      Status: ${b.status}\n`);
      });
    }

    console.log('✅ Database check complete!');

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.message.includes('authentication')) {
      console.error('\n💡 Authentication failed. This might mean:');
      console.error('   1. The database password in .env.local is incorrect');
      console.error('   2. Need to check Supabase dashboard for correct password');
    }
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabase();
