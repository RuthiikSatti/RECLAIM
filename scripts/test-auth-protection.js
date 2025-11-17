#!/usr/bin/env node
/**
 * Test Auth Protection Script
 *
 * Verifies that protected routes correctly redirect unauthenticated users to /login
 *
 * Usage: node scripts/test-auth-protection.js
 */

const http = require('http');

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

const PROTECTED_ROUTES = [
  '/marketplace',
  '/create',
  '/profile/test-user-id',
  '/messages',
  '/admin',
  '/edit/test-listing-id'
];

async function testRoute(path) {
  return new Promise((resolve) => {
    const url = new URL(path, BASE_URL);

    const options = {
      hostname: url.hostname,
      port: url.port || 80,
      path: url.pathname,
      method: 'GET',
      headers: {
        'User-Agent': 'Auth-Test-Script/1.0'
      }
    };

    const req = http.request(options, (res) => {
      const isRedirect = res.statusCode === 302 || res.statusCode === 307 || res.statusCode === 308;
      const redirectLocation = res.headers['location'];
      const redirectsToLogin = redirectLocation && redirectLocation.includes('/login');

      resolve({
        path,
        statusCode: res.statusCode,
        isRedirect,
        redirectLocation,
        redirectsToLogin,
        success: isRedirect && redirectsToLogin
      });
    });

    req.on('error', (error) => {
      resolve({
        path,
        error: error.message,
        success: false
      });
    });

    req.end();
  });
}

async function runTests() {
  console.log('🔐 Testing Auth Protection\n');
  console.log(`Base URL: ${BASE_URL}\n`);
  console.log('Testing protected routes without authentication...\n');

  const results = [];

  for (const route of PROTECTED_ROUTES) {
    const result = await testRoute(route);
    results.push(result);

    const icon = result.success ? '✅' : '❌';
    console.log(`${icon} ${result.path}`);

    if (result.error) {
      console.log(`   Error: ${result.error}`);
    } else if (!result.success) {
      console.log(`   Expected: Redirect to /login`);
      console.log(`   Got: ${result.statusCode} ${result.redirectLocation || 'No redirect'}`);
    }
  }

  const successCount = results.filter(r => r.success).length;
  const totalCount = results.length;

  console.log(`\n📊 Results: ${successCount}/${totalCount} tests passed`);

  if (successCount === totalCount) {
    console.log('✅ All protected routes correctly redirect to /login\n');
    process.exit(0);
  } else {
    console.log('❌ Some routes are not properly protected\n');
    process.exit(1);
  }
}

// Check if server is running
http.get(BASE_URL, (res) => {
  runTests();
}).on('error', () => {
  console.error(`❌ Server not running at ${BASE_URL}`);
  console.error('Please start the development server with: npm run dev\n');
  process.exit(1);
});
