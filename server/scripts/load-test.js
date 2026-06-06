#!/usr/bin/env node
/**
 * Load Testing Script
 * Uses autocannon for simple load testing
 * Install: npm install -g autocannon
 * Or use: npx autocannon
 */

const { spawn } = require('child_process');
const path = require('path');

const API_URL = process.env.API_URL || 'http://localhost:3001';
const DURATION = process.env.DURATION || 30; // seconds
const CONNECTIONS = process.env.CONNECTIONS || 10;
const PIPELINING = process.env.PIPELINING || 1;
// Bearer token for authenticated scenarios. Supply a real, valid token via
// LOAD_TEST_TOKEN to exercise the authenticated code path; without it the
// authenticated scenarios are skipped (they would only measure the 401 path).
const AUTH_TOKEN = process.env.LOAD_TEST_TOKEN || '';

console.log('🚀 Starting Load Test...');
console.log(`Target: ${API_URL}`);
console.log(`Duration: ${DURATION}s`);
console.log(`Connections: ${CONNECTIONS}`);
console.log(`Pipelining: ${PIPELINING}\n`);

// Test scenarios
const scenarios = [
  {
    name: 'Health Check',
    path: '/health',
    method: 'GET',
  },
];

// Authenticated scenarios are only meaningful with a real token; otherwise they
// just measure the 401 rejection path.
if (AUTH_TOKEN) {
  scenarios.push(
    {
      name: 'List Risks',
      path: '/api/risks',
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${AUTH_TOKEN}`,
      },
    },
    {
      name: 'List Frameworks',
      path: '/api/frameworks',
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${AUTH_TOKEN}`,
      },
    },
  );
} else {
  console.log('⚠️  LOAD_TEST_TOKEN not set — skipping authenticated scenarios (set it to load-test /api routes).\n');
}

// Run autocannon for each scenario
scenarios.forEach((scenario, index) => {
  setTimeout(() => {
    console.log(`\n📊 Testing: ${scenario.name}`);
    
    const args = [
      '-c', CONNECTIONS.toString(),
      '-p', PIPELINING.toString(),
      '-d', DURATION.toString(),
      '-m', scenario.method,
      `${API_URL}${scenario.path}`,
    ];

    if (scenario.headers) {
      Object.entries(scenario.headers).forEach(([key, value]) => {
        args.push('-H', `${key}: ${value}`);
      });
    }

    const autocannon = spawn('npx', ['autocannon', ...args], {
      stdio: 'inherit',
    });

    autocannon.on('close', (code) => {
      if (code === 0) {
        console.log(`✅ ${scenario.name} test completed`);
      } else {
        console.log(`❌ ${scenario.name} test failed with code ${code}`);
      }
    });
  }, index * (parseInt(DURATION) + 5) * 1000);
});

console.log('\n⏳ Load tests are running...');
console.log('Install autocannon globally for better performance: npm install -g autocannon\n');

