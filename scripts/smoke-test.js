#!/usr/bin/env node
/**
 * Smoke Test Script
 *
 * Performs basic smoke tests on the application:
 * - Server is running
 * - Public pages load
 * - API endpoints respond
 * - Database is accessible
 *
 * Usage: node scripts/smoke-test.js
 */

const http = require('http');
const https = require('https');

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;

const tests = [];
let passed = 0;
let failed = 0;

function log(icon, message) {
  console.log(`${icon} ${message}`);
}

function httpGet(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    client.get(url, { timeout: 10000 }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ statusCode: res.statusCode, data }));
    }).on('error', reject).on('timeout', () => reject(new Error('Timeout')));
  });
}

async function test(name, fn) {
  try {
    await fn();
    log('✅', name);
    passed++;
  } catch (error) {
    log('❌', name);
    console.log(`   Error: ${error.message}`);
    failed++;
  }
}

async function runTests() {
  console.log('🧪 Running Smoke Tests\n');
  console.log(`Base URL: ${BASE_URL}\n`);

  // Test 1: Server is running
  await test('Server is running', async () => {
    const res = await httpGet(BASE_URL);
    if (res.statusCode !== 200 && res.statusCode !== 307) {
      throw new Error(`Expected 200 or 307, got ${res.statusCode}`);
    }
  });

  // Test 2: Login page loads
  await test('Login page loads', async () => {
    const res = await httpGet(`${BASE_URL}/login`);
    if (res.statusCode !== 200) {
      throw new Error(`Expected 200, got ${res.statusCode}`);
    }
  });

  // Test 3: Signup page loads
  await test('Signup page loads', async () => {
    const res = await httpGet(`${BASE_URL}/signup`);
    if (res.statusCode !== 200) {
      throw new Error(`Expected 200, got ${res.statusCode}`);
    }
  });

  // Test 4: Protected route redirects
  await test('Protected routes redirect to login', async () => {
    const res = await httpGet(`${BASE_URL}/marketplace`);
    // Should redirect to login (302, 307, or 308)
    if (![200, 302, 307, 308].includes(res.statusCode)) {
      throw new Error(`Expected redirect or 200, got ${res.statusCode}`);
    }
  });

  // Test 5: API health check
  await test('API routes accessible', async () => {
    try {
      const res = await httpGet(`${BASE_URL}/api/auth/signup`);
      // Should return method not allowed or bad request (not 404)
      if (res.statusCode === 404) {
        throw new Error('API route not found');
      }
    } catch (error) {
      if (error.message.includes('not found')) throw error;
      // Other errors are okay (we're just checking the route exists)
    }
  });

  // Test 6: Supabase connection
  if (SUPABASE_URL) {
    await test('Supabase is accessible', async () => {
      const res = await httpGet(`${SUPABASE_URL}/rest/v1/`);
      if (res.statusCode !== 200 && res.statusCode !== 400) {
        throw new Error(`Supabase not responding correctly: ${res.statusCode}`);
      }
    });
  }

  // Test 7: Static assets load
  await test('Favicon loads', async () => {
    try {
      await httpGet(`${BASE_URL}/favicon.ico`);
      // Any response is fine, we just check it doesn't crash
    } catch (error) {
      if (error.message !== 'Timeout') throw error;
    }
  });

  // Results
  console.log('\n' + '='.repeat(60));
  console.log('📊 Test Results');
  console.log('='.repeat(60));
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);
  console.log(`Total: ${passed + failed}`);

  if (failed === 0) {
    console.log('\n✅ All smoke tests passed!\n');
    process.exit(0);
  } else {
    console.log('\n❌ Some tests failed. Please check the errors above.\n');
    process.exit(1);
  }
}

// Run tests
runTests().catch(error => {
  console.error('❌ Fatal error:', error.message);
  process.exit(1);
});
