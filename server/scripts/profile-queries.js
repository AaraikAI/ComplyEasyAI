#!/usr/bin/env node
/**
 * Database Query Profiling Script
 * Profiles Prisma queries and identifies slow queries
 */

require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { PrismaClient } = require('@prisma/client');
const path = require('path');

const prisma = new PrismaClient({
  log: [
    { emit: 'event', level: 'query' },
    { emit: 'event', level: 'error' },
    { emit: 'event', level: 'info' },
    { emit: 'event', level: 'warn' },
  ],
});

const queryStats = {
  queries: [],
  slowQueries: [],
  totalTime: 0,
  queryCount: 0,
};

// Track all queries
prisma.$on('query', (e) => {
  const duration = e.duration || 0;
  queryStats.queries.push({
    query: e.query,
    params: e.params,
    duration,
    target: e.target,
    timestamp: new Date(),
  });

  queryStats.totalTime += duration;
  queryStats.queryCount++;

  // Flag slow queries (>100ms)
  if (duration > 100) {
    queryStats.slowQueries.push({
      query: e.query,
      duration,
      params: e.params,
    });
  }
});

async function profileQueries() {
  console.log('🔍 Starting Query Profiling...\n');

  try {
    // Run common queries
    console.log('Running test queries...\n');

    // Test 1: Simple select
    await prisma.user.findMany({ take: 10 });
    console.log('✅ Test 1: User list query');

    // Test 2: Join query
    await prisma.organization.findMany({
      include: {
        users: true,
        risks: true,
      },
      take: 5,
    });
    console.log('✅ Test 2: Organization with relations');

    // Test 3: Complex query
    await prisma.riskItem.findMany({
      where: {
        severity: 'High',
      },
      include: {
        organization: true,
        assignedTo: true,
      },
      orderBy: {
        detectedAt: 'desc',
      },
      take: 20,
    });
    console.log('✅ Test 3: Complex risk query');

    // Test 4: Aggregation
    await prisma.riskItem.groupBy({
      by: ['severity'],
      _count: {
        id: true,
      },
    });
    console.log('✅ Test 4: Aggregation query');

    // Generate report
    console.log('\n📊 Query Profiling Report');
    console.log('='.repeat(60));
    console.log(`Total Queries: ${queryStats.queryCount}`);
    console.log(`Total Time: ${queryStats.totalTime.toFixed(2)}ms`);
    console.log(`Average Time: ${(queryStats.totalTime / queryStats.queryCount).toFixed(2)}ms`);
    console.log(`Slow Queries (>100ms): ${queryStats.slowQueries.length}`);

    if (queryStats.slowQueries.length > 0) {
      console.log('\n⚠️  Slow Queries:');
      queryStats.slowQueries.forEach((q, i) => {
        console.log(`\n${i + 1}. Duration: ${q.duration}ms`);
        console.log(`   Query: ${q.query.substring(0, 100)}...`);
      });
    }

    // Top 10 slowest queries
    const sortedQueries = queryStats.queries
      .sort((a, b) => b.duration - a.duration)
      .slice(0, 10);

    console.log('\n🐌 Top 10 Slowest Queries:');
    sortedQueries.forEach((q, i) => {
      console.log(`${i + 1}. ${q.duration}ms - ${q.query.substring(0, 80)}...`);
    });

    // Recommendations
    console.log('\n💡 Recommendations:');
    if (queryStats.slowQueries.length > 0) {
      console.log('1. Add indexes for frequently queried fields');
      console.log('2. Use select() to limit fields returned');
      console.log('3. Consider pagination for large result sets');
      console.log('4. Review join queries and add proper indexes');
    } else {
      console.log('✅ All queries are performing well!');
    }

  } catch (error) {
    console.error('❌ Error during profiling:', error);
  } finally {
    await prisma.$disconnect();
  }
}

profileQueries();

