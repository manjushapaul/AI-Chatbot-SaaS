import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testTrialExpiration() {
  try {
    // Get all subscriptions with trials
    // @ts-ignore - Prisma client uses lowercase model names
    const subscriptions = await prisma.subscriptions.findMany({
      where: {
        status: 'TRIALING',
        trialEndsAt: { not: null }
      },
      include: {
        tenants: {
          include: {
            users: {
              where: { role: 'TENANT_ADMIN' },
              take: 1
            }
          }
        }
      }
    });

    if (subscriptions.length === 0) {
      console.log('❌ No active trials found.');
      console.log('\n💡 To create a test trial, sign up for a free trial account first.');
      return;
    }

    console.log(`\n📋 Found ${subscriptions.length} active trial(s):\n`);
    
    subscriptions.forEach((sub: any, index: number) => {
      const user = sub.tenants?.users[0];
      console.log(`${index + 1}. Tenant: ${sub.tenants?.name || sub.tenants?.subdomain || 'N/A'}`);
      console.log(`   User: ${user?.email || 'N/A'}`);
      console.log(`   Current trial ends: ${sub.trialEndsAt?.toLocaleString() || 'N/A'}`);
      console.log(`   Status: ${sub.status}`);
      console.log(`   Subscription ID: ${sub.id}`);
      console.log('');
    });

    // Example: Set trial to expire in 1 hour (for immediate testing)
    const expireIn1Hour = new Date(Date.now() + 60 * 60 * 1000);
    
    // Example: Set trial to expire in the past (already expired)
    const expired = new Date(Date.now() - 24 * 60 * 60 * 1000); // 1 day ago

    console.log('🔧 Options to test trial expiration:\n');
    console.log('1. Expire in 1 hour (for testing soon):');
    console.log(`   UPDATE "subscriptions" SET "trialEndsAt" = '${expireIn1Hour.toISOString()}', "isTrialExpired" = false WHERE id = '<subscription-id>';\n`);
    
    console.log('2. Already expired (for immediate testing):');
    console.log(`   UPDATE "subscriptions" SET "trialEndsAt" = '${expired.toISOString()}', "isTrialExpired" = true WHERE id = '<subscription-id>';\n`);
    
    console.log('3. Reset to 14 days from now:');
    const resetTo14Days = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
    console.log(`   UPDATE "subscriptions" SET "trialEndsAt" = '${resetTo14Days.toISOString()}', "isTrialExpired" = false WHERE id = '<subscription-id>';\n`);

    // Interactive option
    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    rl.question('\n❓ Do you want to expire the first trial now? (y/n): ', async (answer: string) => {
      if (answer.toLowerCase() === 'y' && subscriptions.length > 0) {
        const firstSub = subscriptions[0];
        // @ts-ignore - Prisma client uses lowercase model names
        await prisma.subscriptions.update({
          where: { id: firstSub.id },
          data: {
            trialEndsAt: expired,
            isTrialExpired: true
          }
        });
        console.log(`\n✅ Trial expired for ${firstSub.tenants?.name || firstSub.tenants?.subdomain || 'N/A'}`);
        console.log('   Try accessing /dashboard - you should be redirected to /billing/expired');
      } else {
        console.log('\n💡 Use the SQL queries above to manually update trials as needed.');
      }
      rl.close();
      await prisma.$disconnect();
    });

  } catch (error) {
    console.error('❌ Error:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

testTrialExpiration();
