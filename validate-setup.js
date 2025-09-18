#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🧪 Leadership Training App - Setup Validation\n');

const checks = [];

// Check 1: Monorepo structure
const requiredDirs = [
  'packages/frontend',
  'packages/backend',
  'packages/shared',
  'database/init'
];

requiredDirs.forEach(dir => {
  const exists = fs.existsSync(path.join(__dirname, dir));
  checks.push({
    name: `Directory structure: ${dir}`,
    passed: exists,
    required: true
  });
});

// Check 2: Package files
const requiredFiles = [
  'package.json',
  'docker-compose.yml',
  '.env',
  'packages/frontend/package.json',
  'packages/backend/package.json',
  'packages/shared/package.json',
  'packages/frontend/index.html',
  'packages/backend/src/main.ts',
  'packages/shared/src/index.ts',
  'database/init/01-create-tables.sql'
];

requiredFiles.forEach(file => {
  const exists = fs.existsSync(path.join(__dirname, file));
  checks.push({
    name: `Required file: ${file}`,
    passed: exists,
    required: true
  });
});

// Check 3: TypeScript configuration
const tsConfigs = [
  'packages/frontend/tsconfig.json',
  'packages/backend/tsconfig.json',
  'packages/shared/tsconfig.json'
];

tsConfigs.forEach(config => {
  const exists = fs.existsSync(path.join(__dirname, config));
  checks.push({
    name: `TypeScript config: ${config}`,
    passed: exists,
    required: true
  });
});

// Check 4: Docker files
const dockerFiles = [
  'packages/frontend/Dockerfile',
  'packages/backend/Dockerfile'
];

dockerFiles.forEach(file => {
  const exists = fs.existsSync(path.join(__dirname, file));
  checks.push({
    name: `Docker file: ${file}`,
    passed: exists,
    required: true
  });
});

// Check 5: Built artifacts
const buildOutputs = [
  'packages/shared/dist',
  'packages/backend/dist',
  'packages/frontend/dist'
];

buildOutputs.forEach(dir => {
  const exists = fs.existsSync(path.join(__dirname, dir));
  checks.push({
    name: `Build output: ${dir}`,
    passed: exists,
    required: false
  });
});

// Print results
console.log('📋 Validation Results:\n');

let passed = 0;
let failed = 0;
let warnings = 0;

checks.forEach(check => {
  const status = check.passed ? '✅' : (check.required ? '❌' : '⚠️');
  const type = check.required ? 'REQUIRED' : 'OPTIONAL';

  console.log(`${status} ${check.name} (${type})`);

  if (check.passed) {
    passed++;
  } else if (check.required) {
    failed++;
  } else {
    warnings++;
  }
});

console.log(`\n📊 Summary:`);
console.log(`✅ Passed: ${passed}`);
console.log(`❌ Failed: ${failed}`);
console.log(`⚠️  Warnings: ${warnings}`);

if (failed === 0) {
  console.log('\n🎉 Story 1.1 Setup Complete!');
  console.log('\n📝 Next Steps:');
  console.log('1. Start the development environment: npm run dev');
  console.log('2. Test the integration manually');
  console.log('3. Proceed to Story 1.2: Database Schema & Roles');
} else {
  console.log('\n❌ Setup incomplete. Please fix the failed checks above.');
  process.exit(1);
}

console.log('\n🔗 Quick Links:');
console.log('- Frontend: http://localhost:3000');
console.log('- Backend API: http://localhost:3001/api');
console.log('- Health Check: http://localhost:3001/api/health');
console.log('- Documentation: ./README.md');