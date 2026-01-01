/**
 * Script to verify sign-in credentials and reset password if needed
 * Usage: node scripts/verify-signin-credentials.js
 */

require('dotenv').config({ path: '.env.local' });
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function verifyCredentials() {
  try {
    console.log('🔍 Verifying sign-in credentials...\n');

    // Test database connection first
    await prisma.$connect();
    console.log('✅ Database connection successful\n');

    // Check tenant
    const tenant = await prisma.tenants.findFirst({
      where: { subdomain: 'domain' }
    });

    if (!tenant) {
      console.log('❌ Tenant "domain" not found in database');
      console.log('\n📋 Available tenants:');
      const allTenants = await prisma.tenants.findMany({
        select: { id: true, subdomain: true, name: true, status: true }
      });
      allTenants.forEach(t => {
        console.log(`   - Subdomain: ${t.subdomain}, Name: ${t.name}, Status: ${t.status}`);
      });
      await prisma.$disconnect();
      return;
    }

    console.log('✅ Tenant found:');
    console.log(`   Subdomain: ${tenant.subdomain}`);
    console.log(`   Name: ${tenant.name}`);
    console.log(`   Status: ${tenant.status}`);
    console.log(`   Tenant ID: ${tenant.id}\n`);

    // Check user
    const user = await prisma.users.findFirst({
      where: {
        email: 'manjushapaul391@gmail.com',
        tenantId: tenant.id
      }
    });

    if (!user) {
      console.log('❌ User "manjushapaul391@gmail.com" not found in tenant "domain"');
      console.log('\n📋 Available users in this tenant:');
      const allUsers = await prisma.users.findMany({
        where: { tenantId: tenant.id },
        select: { id: true, email: true, name: true, role: true, status: true }
      });
      allUsers.forEach(u => {
        console.log(`   - Email: ${u.email}, Name: ${u.name}, Role: ${u.role}, Status: ${u.status}`);
      });
      await prisma.$disconnect();
      return;
    }

    console.log('✅ User found:');
    console.log(`   Email: ${user.email}`);
    console.log(`   Name: ${user.name}`);
    console.log(`   Role: ${user.role}`);
    console.log(`   Status: ${user.status}`);
    console.log(`   Password hash exists: ${user.password ? 'YES' : 'NO'}\n`);

    // Test password
    if (user.password) {
      const passwordToTest = 'manjusha';
      const isValid = await bcrypt.compare(passwordToTest, user.password);
      
      if (isValid) {
        console.log('✅ Password "manjusha" is CORRECT\n');
        console.log('🎉 Sign-in credentials are valid!');
        console.log('\n📝 Sign-in details:');
        console.log('   Tenant Subdomain: domain');
        console.log('   Email: manjushapaul391@gmail.com');
        console.log('   Password: manjusha');
      } else {
        console.log('❌ Password "manjusha" is INCORRECT\n');
        console.log('💡 Would you like to reset the password?');
        console.log('   Run: node scripts/reset-password.js manjushapaul391@gmail.com manjusha');
      }
    } else {
      console.log('❌ User has no password set\n');
      console.log('💡 Setting password to "manjusha"...');
      const hashedPassword = await bcrypt.hash('manjusha', 12);
      await prisma.users.update({
        where: { id: user.id },
        data: { password: hashedPassword }
      });
      console.log('✅ Password set successfully!');
      console.log('\n📝 Sign-in details:');
      console.log('   Tenant Subdomain: domain');
      console.log('   Email: manjushapaul391@gmail.com');
      console.log('   Password: manjusha');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.message.includes('Tenant or user not found')) {
      console.error('\n🔴 Database connection failed!');
      console.error('   The database password in .env.local is incorrect.');
      console.error('   Please reset the password in Supabase and update .env.local');
    }
  } finally {
    await prisma.$disconnect();
  }
}

verifyCredentials();


