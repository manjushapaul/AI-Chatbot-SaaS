require('dotenv').config({ path: '.env.local' });
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkCredentials() {
  try {
    console.log('🔍 Checking Supabase database credentials...\n');

    // List all tenants
    console.log('📋 All Tenants:');
    const tenants = await prisma.tenants.findMany({
      select: { id: true, subdomain: true, name: true, status: true },
      orderBy: { subdomain: 'asc' }
    });
    
    if (tenants.length === 0) {
      console.log('   ⚠️  No tenants found in database\n');
    } else {
      tenants.forEach(t => {
        console.log(`   - Subdomain: "${t.subdomain}", Name: ${t.name}, Status: ${t.status}`);
      });
    }

    // List all users
    console.log('\n👥 All Users:');
    const users = await prisma.users.findMany({
      select: { 
        id: true, 
        email: true, 
        name: true, 
        tenantId: true, 
        status: true, 
        role: true 
      },
      include: { 
        tenants: { 
          select: { subdomain: true } 
        } 
      },
      orderBy: { email: 'asc' }
    });
    
    if (users.length === 0) {
      console.log('   ⚠️  No users found in database\n');
    } else {
      users.forEach(u => {
        console.log(`   - Email: ${u.email}`);
        console.log(`     Tenant: ${u.tenants?.subdomain || 'N/A'}, Status: ${u.status}, Role: ${u.role}`);
      });
    }

    console.log('\n✅ Database check completed!');
    console.log('\n💡 To sign in, use:');
    console.log('   - Tenant Subdomain: (from list above)');
    console.log('   - Email: (from list above)');
    console.log('   - Password: (set during signup or via reset-password.js)');

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.message.includes('protocol')) {
      console.error('\n🔴 DATABASE_URL format error!');
      console.error('   Please check your .env.local file');
    }
  } finally {
    await prisma.$disconnect();
  }
}

checkCredentials();
