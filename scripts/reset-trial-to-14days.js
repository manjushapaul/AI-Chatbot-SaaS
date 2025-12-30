const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function resetTrialTo14Days() {
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

    // Reset to 14 days from now
    const trialEnd = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
    
    subscription = await prisma.subscriptions.update({
      where: { id: subscription.id },
      data: {
        trialEndsAt: trialEnd,
        isTrialExpired: false,
        status: 'TRIALING'
      }
    });

    console.log(`\n✅ Trial reset for ${user.email}`);
    console.log(`   Trial now ends: ${subscription.trialEndsAt.toLocaleString()}`);
    console.log(`   Status: ${subscription.status}`);
    console.log(`   Is expired: ${subscription.isTrialExpired}`);
    console.log(`\n🎉 The user now has a full 14-day trial!`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

resetTrialTo14Days();



