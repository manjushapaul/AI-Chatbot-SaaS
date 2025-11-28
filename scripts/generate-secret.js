#!/usr/bin/env node

const crypto = require('crypto');

// Generate a random 32-byte hex string
const secret = crypto.randomBytes(32).toString('hex');

console.log('Generated NextAuth Secret:');
console.log(secret);
console.log('\nAdd this to your .env file as:');
console.log(`NEXTAUTH_SECRET="${secret}"`); 