#!/usr/bin/env node
/**
 * ZakatFlow Build and Verification Script
 * Validates files, tests, and deployment integrity.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('⚡ Starting ZakatFlow build verification...\n');

const projectRoot = path.resolve(__dirname, '..');

// 1. Check critical files existence
const requiredFiles = [
  'index.html',
  'styles.css',
  'app.js',
  'nisab.js',
  'api/prices.js'
];

for (const rel of requiredFiles) {
  const fullPath = path.join(projectRoot, rel);
  if (!fs.existsSync(fullPath)) {
    console.error(`❌ Build Error: Missing required file: ${rel}`);
    process.exit(1);
  }
  const stat = fs.statSync(fullPath);
  console.log(`  ✓ Checked ${rel} (${(stat.size / 1024).toFixed(1)} KB)`);
}

// 2. Syntax validation
try {
  execSync(`node --check "${path.join(projectRoot, 'app.js')}"`, { stdio: 'pipe' });
  execSync(`node --check "${path.join(projectRoot, 'nisab.js')}"`, { stdio: 'pipe' });
  execSync(`node --check "${path.join(projectRoot, 'api/prices.js')}"`, { stdio: 'pipe' });
  require(path.join(projectRoot, 'nisab.js'));
  require(path.join(projectRoot, 'api/prices.js'));
  console.log('  ✓ JS syntax check passed (app.js, nisab.js, api/prices.js)');
} catch (err) {
  console.error('❌ JS syntax error:', err.message || err);
  process.exit(1);
}

// 3. Run unit tests
console.log('\n🧪 Running unit test suite...');
try {
  execSync('node --test tests/*.test.js', { cwd: projectRoot, stdio: 'inherit' });
  console.log('  ✓ All unit tests passed successfully');
} catch (err) {
  console.error('❌ Unit test suite failed');
  process.exit(1);
}

console.log('\n✨ Build and verification completed successfully! Ready for deployment.');
