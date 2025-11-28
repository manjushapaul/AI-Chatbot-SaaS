const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function setupAPIUsage() {
  try {
    console.log('Setting up initial API usage data...');

    // Get all tenants
    const tenants = await prisma.tenant.findMany({
      select: {
        id: true,
        name: true,
        subdomain: true
      }
    });

    console.log(`Found ${tenants.length} tenants`);

    for (const tenant of tenants) {
      console.log(`Processing tenant: ${tenant.name} (${tenant.subdomain})`);

      // Generate sample API usage data for the last 30 days
      const days = 30;
      const now = new Date();

      for (let i = 0; i < days; i++) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);

        // Generate random usage for each day
        const requests = Math.floor(Math.random() * 100) + 10; // 10-110 requests per day
        const baseTokens = Math.floor(Math.random() * 5000) + 1000; // 1000-6000 tokens per day

        for (let j = 0; j < requests; j++) {
          const timestamp = new Date(date);
          timestamp.setHours(Math.floor(Math.random() * 24));
          timestamp.setMinutes(Math.floor(Math.random() * 60));
          timestamp.setSeconds(Math.floor(Math.random() * 60));

          // Random endpoint
          const endpoints = ['/api/chat', '/api/bots', '/api/knowledge-bases', '/api/analytics'];
          const endpoint = endpoints[Math.floor(Math.random() * endpoints.length)];

          // Random status code (mostly successful)
          const statusCodes = [200, 200, 200, 200, 400, 401, 500]; // 5/7 success rate
          const statusCode = statusCodes[Math.floor(Math.random() * statusCodes.length)];

          // Random response time
          const responseTime = Math.floor(Math.random() * 500) + 50; // 50-550ms

          // Random tokens (only for chat endpoint)
          const tokensUsed = endpoint === '/api/chat' ? Math.floor(Math.random() * 200) + 50 : null;

          // Random model (only for chat endpoint)
          const models = ['gpt-3.5-turbo', 'gpt-4'];
          const model = endpoint === '/api/chat' ? models[Math.floor(Math.random() * models.length)] : null;

          // Create API usage record
          await prisma.aPIUsage.create({
            data: {
              tenantId: tenant.id,
              endpoint,
              method: 'POST',
              statusCode,
              responseTime,
              tokensUsed,
              model,
              timestamp,
              metadata: {
                sample: true,
                generated: true
              }
            }
          });
        }

        console.log(`  Generated ${requests} requests for ${date.toDateString()}`);
      }

      console.log(`  Completed setup for ${tenant.name}`);
    }

    console.log('API usage setup completed successfully!');
  } catch (error) {
    console.error('Error setting up API usage:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the setup
setupAPIUsage()
  .then(() => {
    console.log('Setup completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Setup failed:', error);
    process.exit(1);
  }); 