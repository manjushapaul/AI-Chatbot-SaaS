const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  log: ['query', 'error', 'warn'],
});

async function expireTrialIn5Minutes() {
  try {
    // Find the user by email
    const user = await prisma.users.findFirst({
      where: {
        email: 'manjushapaul392@gmail.com'
      },
      include: {
        tenants: true
      }
    });

    if (!user) {
      console.log('❌ User not found: manjushapaul392@gmail.com');
      console.log('\n💡 Make sure the account exists and try again.');
      await prisma.$disconnect();
      return;
    }

    console.log(`\n✅ Found user: ${user.email}`);
    console.log(`   Tenant: ${user.tenants.name || user.tenants.subdomain}`);
    console.log(`   Tenant ID: ${user.tenantId}`);

    // Find or create subscription
    let subscription = await prisma.subscriptions.findUnique({
      where: { tenantId: user.tenantId }
    });

    if (!subscription) {
      console.log('\n⚠️  No subscription found. Creating one...');
      subscription = await prisma.subscriptions.create({
        data: {
          tenantId: user.tenantId,
          plan: 'FREE',
          status: 'TRIALING',
          trialEndsAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes from now
          isTrialExpired: false,
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + 5 * 60 * 1000),
          cancelAtPeriodEnd: false
        }
      });
      console.log('✅ Subscription created with 5-minute trial');
    } else {
      // Update existing subscription to expire in 5 minutes
      const expiresIn5Min = new Date(Date.now() + 5 * 60 * 1000);
      
      subscription = await prisma.subscriptions.update({
        where: { id: subscription.id },
        data: {
          trialEndsAt: expiresIn5Min,
          isTrialExpired: false,
          status: 'TRIALING',
          currentPeriodEnd: expiresIn5Min
        }
      });
      console.log('✅ Subscription updated');
    }

    console.log(`\n⏰ Trial will expire at: ${subscription.trialEndsAt.toLocaleString()}`);
    console.log(`   Current time: ${new Date().toLocaleString()}`);
    console.log(`   Time remaining: ~5 minutes`);
    console.log(`\n🧪 Testing Instructions:`);
    console.log(`   1. Wait 5 minutes (or manually expire it)`);
    console.log(`   2. Try accessing /dashboard`);
    console.log(`   3. You should be redirected to /billing/expired`);
    console.log(`\n💡 To expire immediately, run:`);
    console.log(`   node scripts/expire-trial-now.js`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

expireTrialIn5Minutes();

