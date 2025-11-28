const { PrismaClient } = require('@prisma/client');

async function testDatabaseConnection() {
  console.log('🔍 Testing database connection...');
  
  const prisma = new PrismaClient({
    log: ['query', 'error', 'warn'],
  });

  try {
    // Test connection
    console.log('📡 Attempting to connect to database...');
    await prisma.$connect();
    console.log('✅ Database connection successful!');
    
    // Test basic query
    console.log('🔍 Testing basic query...');
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    console.log('✅ Basic query successful:', result);
    
    // Check if tables exist
    console.log('📋 Checking if tables exist...');
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `;
    console.log('📋 Available tables:', tables);
    
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    
    if (error.message.includes('ECONNREFUSED')) {
      console.log('💡 Database server is not running. Please:');
      console.log('   1. Start your PostgreSQL server');
      console.log('   2. Check your DATABASE_URL in .env file');
      console.log('   3. Ensure the database exists');
    } else if (error.message.includes('ENOTFOUND')) {
      console.log('💡 Database host not found. Please check:');
      console.log('   1. DATABASE_URL in .env file');
      console.log('   2. Database host and port');
    } else if (error.message.includes('authentication failed')) {
      console.log('💡 Authentication failed. Please check:');
      console.log('   1. Database username and password');
      console.log('   2. DATABASE_URL in .env file');
    }
    
    console.log('\n📋 Current DATABASE_URL:', process.env.DATABASE_URL || 'Not set');
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testDatabaseConnection().catch(console.error); 