const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

async function fixTestPassword() {
  console.log('🔧 Fixing test account password...');
  
  try {
    const prisma = new PrismaClient();
    
    // Check if test user exists
    const user = await prisma.user.findFirst({
      where: { email: 'test@example.com' },
      include: { tenant: true }
    });
    
    if (!user) {
      console.log('❌ Test user not found');
      return;
    }
    
    console.log('✅ Test user found:', user.email);
    console.log('🔍 Current password status:', user.password ? 'Set' : 'Not set');
    
    // Hash the password 'test123'
    const hashedPassword = await bcrypt.hash('test123', 12);
    
    // Update the user with the hashed password
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword }
    });
    
    console.log('✅ Password updated successfully!');
    console.log('\n🔑 Test Account Credentials:');
    console.log('📧 Email: test@example.com');
    console.log('🔑 Password: test123');
    console.log('🏢 Organization Subdomain:', user.tenant?.subdomain);
    console.log('\n💡 You can now log in at: http://localhost:3000/auth');
    
    await prisma.$disconnect();
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

fixTestPassword(); 