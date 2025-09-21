#!/usr/bin/env node

/**
 * Generate secure JWT secrets for production use
 * Run with: node generate-secrets.js
 */

const crypto = require('crypto');

console.log('🔐 Generating secure JWT secrets for production...\n');

console.log('Production JWT Secrets:');
console.log('======================');
console.log('JWT_SECRET=' + crypto.randomBytes(64).toString('hex'));
console.log('JWT_REFRESH_SECRET=' + crypto.randomBytes(64).toString('hex'));

console.log('\nNextAuth Secret:');
console.log('================');
console.log('NEXTAUTH_SECRET=' + crypto.randomBytes(32).toString('hex'));

console.log('\n⚠️  IMPORTANT: Use these NEW secrets for production only!');
console.log('   Never use the same secrets for development and production.');
console.log('   Add these to your Vercel Dashboard > Environment Variables.');
