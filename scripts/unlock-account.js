const { PrismaClient } = require('@prisma/client');

async function unlockTestAccount() {
  console.log('🔓 Unlocking test account...');
  
  try {
    // Since the account locking is in-memory, we need to restart the server
    // But first, let's verify the test account exists and show credentials
    
    const prisma = new PrismaClient();
    
    const user = await prisma.user.findFirst({
      where: { email: 'test@example.com' },
      include: { tenant: true }
    });
    
    if (user) {
      console.log('✅ Test Account Found:');
      console.log('=======================');
      console.log('📧 Email: test@example.com');
      console.log('👤 Name:', user.name);
      console.log('🏢 Organization Subdomain:', user.tenant?.subdomain);
      console.log('🔑 Password: test123');
      console.log('---');
      console.log('💡 To unlock the account:');
      console.log('1. Stop the Next.js server (Ctrl+C)');
      console.log('2. Restart it with: npm run dev');
      console.log('3. Try logging in again');
      console.log('---');
      console.log('🔒 Account locking is in-memory and will reset on server restart');
      console.log('⏰ Or wait 15 minutes for automatic unlock');
    } else {
      console.log('❌ Test user not found');
    }
    
    await prisma.$disconnect();
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

unlockTestAccount(); 