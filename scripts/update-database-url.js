#!/usr/bin/env node
/**
 * Script to update DATABASE_URL in .env.local with the correct Supabase connection string
 * 
 * Usage:
 *   node scripts/update-database-url.js "postgresql://postgres.xxx:password@host:port/db?sslmode=require"
 */

const fs = require('fs');
const path = require('path');

const newDatabaseUrl = process.argv[2];

if (!newDatabaseUrl) {
  console.error('❌ Error: Please provide the new DATABASE_URL');
  console.log('\n📋 Usage:');
  console.log('   node scripts/update-database-url.js "postgresql://postgres.xxx:password@host:port/db?sslmode=require"');
  console.log('\n💡 To get the correct connection string:');
  console.log('   1. Go to https://app.supabase.com');
  console.log('   2. Select your project');
  console.log('   3. Settings → Database → Connection Pooling');
  console.log('   4. Copy "Transaction mode" connection string');
  process.exit(1);
}

const envPath = path.join(process.cwd(), '.env.local');

if (!fs.existsSync(envPath)) {
  console.error('❌ Error: .env.local file not found');
  process.exit(1);
}

// Read the file
let content = fs.readFileSync(envPath, 'utf8');

// Replace DATABASE_URL
const lines = content.split('\n');
const updated = lines.map(line => {
  if (line.trim().startsWith('DATABASE_URL=')) {
    return `DATABASE_URL="${newDatabaseUrl}"`;
  }
  return line;
}).join('\n');

// Write back
fs.writeFileSync(envPath, updated);

console.log('✅ Successfully updated DATABASE_URL in .env.local');
console.log('\n📋 Next steps:');
console.log('   1. Restart your dev server (npm run dev)');
console.log('   2. Try signing in again');
console.log('\n🔗 New connection string starts with:', newDatabaseUrl.substring(0, 60) + '...');

