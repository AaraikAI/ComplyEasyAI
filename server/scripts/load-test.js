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
  {
    name: 'List Risks',
    path: '/api/risks',
    method: 'GET',
    headers: {
      'Authorization': 'Bearer test-token',
    },
  },
  {
    name: 'List Frameworks',
    path: '/api/frameworks',
    method: 'GET',
    headers: {
      'Authorization': 'Bearer test-token',
    },
  },
];

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
      shell: true,
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

