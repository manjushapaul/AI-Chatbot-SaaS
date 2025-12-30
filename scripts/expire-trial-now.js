const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function expireTrialNow() {
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
      await prisma.$disconnect();
      return;
    }

    // Find subscription
    let subscription = await prisma.subscriptions.findUnique({
      where: { tenantId: user.tenantId }
    });

    if (!subscription) {
      console.log('❌ No subscription found for this account');
      await prisma.$disconnect();
      return;
    }

    // Expire immediately (set to 1 hour ago)
    const expired = new Date(Date.now() - 60 * 60 * 1000);
    
    subscription = await prisma.subscriptions.update({
      where: { id: subscription.id },
      data: {
        trialEndsAt: expired,
        isTrialExpired: true,
        status: 'TRIALING'
      }
    });

    console.log(`\n✅ Trial expired for ${user.email}`);
    console.log(`   Trial ended at: ${subscription.trialEndsAt.toLocaleString()}`);
    console.log(`\n🧪 Now try:`);
    console.log(`   1. Clear browser cookies or use incognito mode`);
    console.log(`   2. Sign in with: manjushapaul392@gmail.com`);
    console.log(`   3. Try accessing /dashboard`);
    console.log(`   4. You should be redirected to /billing/expired`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

expireTrialNow();

