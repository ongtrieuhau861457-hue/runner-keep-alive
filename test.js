#!/usr/bin/env node

/**
 * Test script for actions-keep-alive package
 */

console.log('🧪 Testing actions-keep-alive package...\n');

// Test 1: Check if package can be required
try {
  const { keepAlive } = require('./index.js');
  console.log('✅ Package can be required');
} catch (error) {
  console.error('❌ Failed to require package:', error.message);
  process.exit(1);
}

// Test 2: Check if CLI exists
const fs = require('fs');
if (fs.existsSync('./cli.js')) {
  console.log('✅ CLI file exists');
} else {
  console.error('❌ CLI file not found');
  process.exit(1);
}

// Test 3: Check package.json
try {
  const pkg = require('./package.json');
  console.log('✅ package.json is valid');
  console.log(`   Name: ${pkg.name}`);
  console.log(`   Version: ${pkg.version}`);
  console.log(`   Bin: ${pkg.bin['actions-keep-alive']}`);
} catch (error) {
  console.error('❌ Invalid package.json:', error.message);
  process.exit(1);
}

// Test 4: Test help command
const { execSync } = require('child_process');
try {
  execSync('node cli.js --help', { stdio: 'ignore' });
  console.log('✅ Help command works');
} catch (error) {
  console.error('❌ Help command failed:', error.message);
  process.exit(1);
}

console.log('\n✨ All tests passed!');
console.log('\nTo test the keep-alive functionality:');
console.log('  node cli.js --interval 10');
console.log('\nPress Ctrl+C after a few iterations to stop.');
