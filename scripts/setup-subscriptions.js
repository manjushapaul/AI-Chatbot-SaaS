const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function setupSubscriptions() {
  try {
    console.log('Setting up subscriptions for existing tenants...');

    // Get all existing tenants
    const tenants = await prisma.tenant.findMany({
      select: {
        id: true,
        name: true,
        subdomain: true,
        plan: true,
        createdAt: true
      }
    });

    console.log(`Found ${tenants.length} tenants`);

    for (const tenant of tenants) {
      console.log(`Processing tenant: ${tenant.name} (${tenant.subdomain})`);

      // Check if subscription already exists
      const existingSubscription = await prisma.subscription.findUnique({
        where: { tenantId: tenant.id }
      });

      if (existingSubscription) {
        console.log(`  Subscription already exists for ${tenant.name}`);
        continue;
      }

      // Create subscription record for existing tenant
      const subscription = await prisma.subscription.create({
        data: {
          tenantId: tenant.id,
          plan: tenant.plan,
          status: 'ACTIVE',
          currentPeriodStart: tenant.createdAt,
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
          cancelAtPeriodEnd: false,
          monthlyUsage: {}
        }
      });

      console.log(`  Created subscription for ${tenant.name}: ${subscription.id}`);

      // Create initial billing history entry
      if (tenant.plan !== 'FREE') {
        const billingHistory = await prisma.billingHistory.create({
          data: {
            tenantId: tenant.id,
            invoiceNumber: `SETUP_${Date.now()}`,
            amount: getPlanPrice(tenant.plan),
            currency: 'USD',
            status: 'PAID',
            billingPeriodStart: tenant.createdAt,
            billingPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            plan: tenant.plan,
            description: `Initial setup for ${tenant.plan} plan`,
            metadata: {
              setup: true,
              originalPlan: tenant.plan,
              setupDate: new Date().toISOString()
            }
          }
        });

        console.log(`  Created billing history for ${tenant.name}: ${billingHistory.id}`);
      }
    }

    console.log('Subscription setup completed successfully!');
  } catch (error) {
    console.error('Error setting up subscriptions:', error);
  } finally {
    await prisma.$disconnect();
  }
}

function getPlanPrice(plan) {
  const prices = {
    'FREE': 0,
    'STARTER': 29,
    'PROFESSIONAL': 99,
    'ENTERPRISE': 299,
    'WHITE_LABEL': 499
  };
  return prices[plan] || 0;
}

// Run the setup
setupSubscriptions()
  .then(() => {
    console.log('Setup completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Setup failed:', error);
    process.exit(1);
  }); 