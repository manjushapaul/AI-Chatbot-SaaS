const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function resetPassword(email, newPassword) {
  try {
    // Find the user
    const user = await prisma.users.findFirst({
      where: { email: email },
      include: { tenants: true }
    });

    if (!user) {
      console.log(`❌ User not found: ${email}`);
      await prisma.$disconnect();
      return;
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    
    // Update the password
    await prisma.users.update({
      where: { id: user.id },
      data: { password: hashedPassword }
    });

    console.log(`\n✅ Password reset successful!\n`);
    console.log('User Details:');
    console.log('  Email:', user.email);
    console.log('  Name:', user.name);
    console.log('  Role:', user.role);
    console.log('  Tenant:', user.tenants.name);
    console.log('  Subdomain:', user.tenants.subdomain);
    console.log('  New Password:', newPassword);
    console.log('\n🔐 Login URL: http://localhost:3000/auth/signin');
    console.log('   Or with subdomain: http://' + user.tenants.subdomain + '.localhost:3000/auth/signin\n');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Get email and password from command line arguments
const email = process.argv[2];
const newPassword = process.argv[3];

if (!email || !newPassword) {
  console.log('Usage: node scripts/reset-password.js <email> <new-password>');
  console.log('Example: node scripts/reset-password.js manjushapaul391@gmail.com newpassword123');
  process.exit(1);
}

resetPassword(email, newPassword);







