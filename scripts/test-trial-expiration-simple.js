const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  try {
    // Get all subscriptions with trials
    const subscriptions = await prisma.subscription.findMany({
      where: {
        status: 'TRIALING',
        trialEndsAt: { not: null }
      },
      include: {
        tenant: {
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
      await prisma.$disconnect();
      return;
    }

    console.log(`\n📋 Found ${subscriptions.length} active trial(s):\n`);
    
    subscriptions.forEach((sub, index) => {
      const user = sub.tenant.users[0];
      console.log(`${index + 1}. Tenant: ${sub.tenant.name || sub.tenant.subdomain}`);
      console.log(`   User: ${user?.email || 'N/A'}`);
      console.log(`   Current trial ends: ${sub.trialEndsAt?.toLocaleString() || 'N/A'}`);
      console.log(`   Status: ${sub.status}`);
      console.log(`   Subscription ID: ${sub.id}`);
      console.log('');
    });

    // Set trial to expire in the past (already expired)
    const expired = new Date(Date.now() - 24 * 60 * 60 * 1000); // 1 day ago
    
    if (subscriptions.length > 0) {
      const firstSub = subscriptions[0];
      await prisma.subscription.update({
        where: { id: firstSub.id },
        data: {
          trialEndsAt: expired,
          isTrialExpired: true
        }
      });
      console.log(`\n✅ Trial expired for ${firstSub.tenant.name || firstSub.tenant.subdomain}`);
      console.log('   Try accessing /dashboard - you should be redirected to /billing/expired');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();





