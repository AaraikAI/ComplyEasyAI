# Performance Testing Guide

This document provides guidance on performance testing for ComplyEasy AI.

## Overview

Performance testing ensures the application can handle production workloads efficiently. This includes load testing, stress testing, and query optimization.

## Tools

### Load Testing
- **autocannon**: Fast HTTP benchmarking tool
- **k6**: Modern load testing tool (optional)
- **artillery**: Feature-rich load testing (optional)

### Query Profiling
- **Prisma Query Logging**: Built-in query performance tracking
- **PostgreSQL EXPLAIN ANALYZE**: Database query analysis

## Running Performance Tests

### Load Testing

#### Using autocannon (Recommended)

```bash
# Install globally (optional)
npm install -g autocannon

# Run load test script
cd server
npm run performance:load

# Or run directly
npx autocannon -c 10 -d 30 http://localhost:3001/health
```

#### Manual Load Testing

```bash
# Health check endpoint
npx autocannon -c 10 -d 30 http://localhost:3001/health

# API endpoint (requires auth token)
npx autocannon -c 10 -d 30 \
  -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3001/api/risks

# Multiple endpoints
npx autocannon -c 10 -d 30 \
  -m GET \
  -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3001/api/frameworks
```

#### Load Test Scenarios

1. **Baseline Test**
   - Connections: 10
   - Duration: 30 seconds
   - Target: Health check endpoint

2. **Normal Load**
   - Connections: 50
   - Duration: 60 seconds
   - Target: Main API endpoints

3. **Stress Test**
   - Connections: 100
   - Duration: 120 seconds
   - Target: All endpoints

4. **Spike Test**
   - Connections: 200
   - Duration: 30 seconds
   - Target: Critical endpoints

### Query Profiling

```bash
# Run query profiling
cd server
npm run performance:profile
```

This script will:
- Execute common queries
- Track query execution times
- Identify slow queries (>100ms)
- Provide optimization recommendations

### Database Query Analysis

```sql
-- Enable query logging in PostgreSQL
SET log_min_duration_statement = 100; -- Log queries >100ms

-- Analyze slow queries
EXPLAIN ANALYZE SELECT * FROM "RiskItem" WHERE "severity" = 'High';

-- Check index usage
SELECT * FROM pg_stat_user_indexes WHERE schemaname = 'public';
```

## Performance Metrics

### Key Metrics to Monitor

1. **Response Time**
   - P50 (median): Should be < 200ms
   - P95: Should be < 500ms
   - P99: Should be < 1000ms

2. **Throughput**
   - Requests per second (RPS)
   - Target: > 100 RPS for main endpoints

3. **Error Rate**
   - Should be < 0.1% under normal load
   - Should be < 1% under stress

4. **Database Performance**
   - Query time: < 100ms for simple queries
   - Query time: < 500ms for complex queries
   - Connection pool utilization

### Performance Targets

| Endpoint | Target Response Time | Target RPS |
|----------|---------------------|-------------|
| GET /health | < 50ms | 1000+ |
| GET /api/risks | < 200ms | 100+ |
| POST /api/risks | < 300ms | 50+ |
| GET /api/frameworks | < 150ms | 100+ |
| POST /api/ai/report | < 2000ms | 10+ |

## Optimization Strategies

### Database Optimization

1. **Add Indexes**
   ```sql
   -- Example: Add index for frequently queried fields
   CREATE INDEX idx_risk_severity ON "RiskItem"("severity");
   CREATE INDEX idx_risk_organization ON "RiskItem"("organizationId");
   ```

2. **Query Optimization**
   - Use `select()` to limit fields
   - Implement pagination
   - Use `include` judiciously
   - Avoid N+1 queries

3. **Connection Pooling**
   - Configure Prisma connection pool
   - Monitor pool usage

### API Optimization

1. **Caching**
   - Implement Redis for frequently accessed data
   - Cache framework lists
   - Cache user sessions

2. **Response Compression**
   - Enable gzip compression
   - Minimize payload sizes

3. **Rate Limiting**
   - Fine-tune rate limits based on load tests
   - Implement per-user rate limits

## Continuous Performance Monitoring

### Production Monitoring

1. **APM Tools**
   - New Relic
   - Datadog
   - AppDynamics

2. **Metrics to Track**
   - Response times
   - Error rates
   - Database query times
   - Memory usage
   - CPU usage

### Performance Budgets

Set performance budgets for:
- Bundle size
- API response times
- Database query times
- Page load times

## Troubleshooting

### Slow Queries

1. Check query execution plan
2. Verify indexes are being used
3. Consider query restructuring
4. Add missing indexes

### High Response Times

1. Check database connection pool
2. Review N+1 query patterns
3. Implement caching
4. Optimize API endpoints

### Memory Issues

1. Monitor memory usage
2. Check for memory leaks
3. Optimize data structures
4. Consider pagination

## Best Practices

1. **Regular Testing**
   - Run load tests before releases
   - Profile queries after schema changes
   - Monitor production performance

2. **Gradual Load Increase**
   - Start with low load
   - Gradually increase
   - Monitor for degradation

3. **Realistic Scenarios**
   - Test with production-like data
   - Simulate real user behavior
   - Test peak usage patterns

4. **Documentation**
   - Document performance targets
   - Track performance over time
   - Share results with team

---

**Last Updated:** December 18, 2024

