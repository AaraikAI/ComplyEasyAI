# Monitoring Setup Guide

This guide explains how to set up monitoring for ComplyEasy AI, including APM, error tracking, and log aggregation.

---

## Table of Contents

1. [Overview](#overview)
2. [Application Performance Monitoring (APM)](#application-performance-monitoring-apm)
3. [Error Tracking (Sentry)](#error-tracking-sentry)
4. [Log Aggregation (ELK Stack)](#log-aggregation-elk-stack)
5. [Configuration](#configuration)
6. [Monitoring Dashboard](#monitoring-dashboard)

---

## Overview

ComplyEasy AI includes comprehensive monitoring capabilities:

- **APM:** Track application performance, response times, and database queries
- **Error Tracking:** Capture and track errors with Sentry
- **Log Aggregation:** Centralized logging with Winston and optional ELK stack

---

## Application Performance Monitoring (APM)

### Supported APM Providers

The application supports multiple APM providers:

1. **Sentry Performance Monitoring** (Built-in)
2. **Elastic APM**
3. **New Relic**
4. **Datadog**
5. **AppDynamics**

### Sentry Performance Monitoring (Recommended)

Sentry is already integrated and provides:
- Transaction tracing
- Performance monitoring
- Database query tracking
- API endpoint profiling

**Setup:**

1. **Create Sentry Account**
   - Sign up at https://sentry.io
   - Create a new project (Node.js)
   - Copy the DSN

2. **Configure Environment Variables**
   ```bash
   SENTRY_ENABLED=true
   SENTRY_DSN=https://your-dsn@sentry.io/project-id
   SENTRY_TRACES_SAMPLE_RATE=0.1  # 10% of transactions
   SENTRY_PROFILES_SAMPLE_RATE=0.1  # 10% of profiles
   ```

3. **Verify Setup**
   ```bash
   # Check monitoring is initialized
   npm run dev
   # Should see: "Sentry initialized successfully"
   ```

### Elastic APM

**Setup:**

1. **Install Elastic APM**
   ```bash
   npm install elastic-apm-node
   ```

2. **Configure Environment Variables**
   ```bash
   APM_ENABLED=true
   ELASTIC_APM_SERVER_URL=http://localhost:8200
   ELASTIC_APM_SERVICE_NAME=complyeasy-api
   ELASTIC_APM_SERVICE_VERSION=2.0.0
   ```

3. **Update Code**
   ```typescript
   // In server/src/config/monitoring.ts
   // Uncomment Elastic APM initialization
   ```

### New Relic

**Setup:**

1. **Install New Relic**
   ```bash
   npm install newrelic
   ```

2. **Create newrelic.js**
   ```javascript
   exports.config = {
     app_name: ['ComplyEasy AI'],
     license_key: process.env.NEW_RELIC_LICENSE_KEY,
     logging: {
       level: 'info'
     }
   };
   ```

3. **Configure Environment Variables**
   ```bash
   APM_ENABLED=true
   NEW_RELIC_LICENSE_KEY=your-license-key
   ```

4. **Update Code**
   ```typescript
   // In server/src/index.ts (at the very top)
   if (process.env.NEW_RELIC_LICENSE_KEY) {
     require('newrelic');
   }
   ```

### Datadog APM

**Setup:**

1. **Install Datadog Agent**
   ```bash
   # Follow Datadog installation guide
   ```

2. **Install Node.js Library**
   ```bash
   npm install dd-trace
   ```

3. **Configure Environment Variables**
   ```bash
   APM_ENABLED=true
   DD_SERVICE=complyeasy-api
   DD_ENV=production
   DD_VERSION=2.0.0
   ```

4. **Update Code**
   ```typescript
   // In server/src/index.ts (at the very top)
   if (process.env.APM_ENABLED === 'true') {
     require('dd-trace').init();
   }
   ```

---

## Error Tracking (Sentry)

### Setup Sentry

1. **Create Sentry Account**
   - Visit https://sentry.io
   - Sign up or log in
   - Create a new project (Node.js/Express)

2. **Get DSN**
   - Copy the DSN from project settings
   - Format: `https://xxx@xxx.ingest.sentry.io/xxx`

3. **Configure Environment Variables**
   ```bash
   SENTRY_ENABLED=true
   SENTRY_DSN=https://your-dsn@sentry.io/project-id
   SENTRY_ENVIRONMENT=production
   SENTRY_TRACES_SAMPLE_RATE=0.1
   SENTRY_PROFILES_SAMPLE_RATE=0.1
   ```

4. **Verify Integration**
   ```bash
   # Start application
   npm run dev
   
   # Trigger an error (test endpoint)
   # Check Sentry dashboard for error
   ```

### Sentry Features

- **Error Tracking:** Automatic error capture
- **Performance Monitoring:** Transaction tracing
- **Release Tracking:** Track deployments
- **User Context:** Associate errors with users
- **Breadcrumbs:** Track user actions before errors
- **Source Maps:** Better error stack traces

### Manual Error Reporting

```typescript
import monitoring from './config/monitoring';

// Capture exception
try {
  // risky operation
} catch (error) {
  monitoring.captureException(error, {
    context: 'additional context'
  });
}

// Capture message
monitoring.captureMessage('Something important happened', 'warning');

// Add breadcrumb
monitoring.addBreadcrumb({
  message: 'User performed action',
  category: 'user-action',
  data: { action: 'clicked-button' }
});
```

---

## Log Aggregation (ELK Stack)

### Setup ELK Stack

1. **Install Elasticsearch, Logstash, and Kibana**
   ```bash
   # Using Docker Compose
   docker-compose -f docker-compose.elk.yml up -d
   ```

2. **Configure Environment Variables**
   ```bash
   ELASTICSEARCH_ENABLED=true
   ELASTICSEARCH_URL=http://localhost:9200
   ELASTICSEARCH_USERNAME=elastic
   ELASTICSEARCH_PASSWORD=your-password
   ELASTICSEARCH_INDEX_PREFIX=complyeasy
   ```

3. **Install Winston Elasticsearch Transport**
   ```bash
   npm install winston-elasticsearch
   ```

4. **Update Logger Configuration**
   ```typescript
   // In server/src/config/logger.ts
   // Elasticsearch transport is already configured
   // Just enable it with environment variables
   ```

### Log Formats

Logs are stored in JSON format for easy parsing:

```json
{
  "timestamp": "2024-12-18T00:00:00Z",
  "level": "info",
  "message": "Request processed",
  "method": "GET",
  "path": "/api/risks",
  "statusCode": 200,
  "duration": 150,
  "userId": "user-123",
  "organizationId": "org-123"
}
```

### Log Levels

- **error:** Errors and exceptions
- **warn:** Warnings and slow operations
- **info:** General information (default)
- **debug:** Debug information (development only)

### Log Files

Logs are written to:
- `logs/combined.log` - All logs
- `logs/error.log` - Error logs only
- `logs/access.log` - HTTP access logs
- `logs/exceptions.log` - Unhandled exceptions
- `logs/rejections.log` - Unhandled promise rejections

---

## Configuration

### Environment Variables

#### Sentry Configuration
```bash
SENTRY_ENABLED=true                    # Enable Sentry
SENTRY_DSN=https://...                 # Sentry DSN
SENTRY_ENVIRONMENT=production          # Environment name
SENTRY_TRACES_SAMPLE_RATE=0.1          # Transaction sampling (0.0-1.0)
SENTRY_PROFILES_SAMPLE_RATE=0.1        # Profile sampling (0.0-1.0)
```

#### APM Configuration
```bash
APM_ENABLED=true                       # Enable APM
APM_SERVICE_NAME=complyeasy-api        # Service name
APM_SERVICE_VERSION=2.0.0              # Service version

# Elastic APM
ELASTIC_APM_SERVER_URL=http://...      # Elastic APM server URL

# New Relic
NEW_RELIC_LICENSE_KEY=...             # New Relic license key

# Datadog
DD_SERVICE=complyeasy-api              # Datadog service name
DD_ENV=production                      # Datadog environment
```

#### Logging Configuration
```bash
LOG_LEVEL=info                         # Log level (error, warn, info, debug)
LOG_CONSOLE=true                       # Enable console logging
LOG_FILE=true                          # Enable file logging
ELASTICSEARCH_ENABLED=false            # Enable Elasticsearch logging
ELASTICSEARCH_URL=http://localhost:9200
ELASTICSEARCH_USERNAME=elastic
ELASTICSEARCH_PASSWORD=password
ELASTICSEARCH_INDEX_PREFIX=complyeasy
```

### Configuration File

Monitoring is configured in `server/src/config/monitoring.ts`:

```typescript
const config = {
  sentry: {
    enabled: process.env.SENTRY_ENABLED === 'true',
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || 'development',
    tracesSampleRate: 0.1,
    profilesSampleRate: 0.1,
  },
  // ...
};
```

---

## Monitoring Dashboard

### Sentry Dashboard

Access your Sentry dashboard at: https://sentry.io

**Key Metrics:**
- Error rate
- Error trends
- Performance metrics
- Release health
- User impact

**Features:**
- Error grouping and deduplication
- Stack traces with source maps
- User context
- Breadcrumbs
- Performance insights

### Kibana Dashboard (ELK)

Access Kibana at: http://localhost:5601

**Create Dashboards:**
1. Go to Kibana → Discover
2. Select index pattern: `complyeasy-*`
3. Create visualizations
4. Build dashboard

**Useful Queries:**
```
# Error logs
level:error

# Slow requests
duration:>1000

# Errors by endpoint
level:error AND path:*

# User activity
userId:*
```

### APM Dashboards

#### Elastic APM
- Access at: http://localhost:5601 (Kibana → APM)
- View services, transactions, and errors
- Analyze performance bottlenecks

#### New Relic
- Access at: https://one.newrelic.com
- View application performance
- Monitor database queries
- Track errors and transactions

#### Datadog
- Access at: https://app.datadoghq.com
- View APM traces
- Monitor services
- Track performance metrics

---

## Best Practices

### Error Tracking

1. **Set Appropriate Sample Rates**
   - Production: 0.1 (10%)
   - Staging: 0.5 (50%)
   - Development: 1.0 (100%)

2. **Filter Sensitive Data**
   - Sentry automatically filters authorization headers
   - Add custom filters for sensitive fields
   - Use `beforeSend` hook for additional filtering

3. **Set User Context**
   - Automatically set in auth middleware
   - Manually set for background jobs

4. **Track Releases**
   - Sentry tracks releases automatically
   - Use version tags for better tracking

### Performance Monitoring

1. **Monitor Key Endpoints**
   - Health check
   - Authentication
   - Critical API endpoints

2. **Track Database Performance**
   - Monitor slow queries
   - Track connection pool usage
   - Profile query performance

3. **Set Performance Budgets**
   - P50 < 200ms
   - P95 < 500ms
   - P99 < 1000ms

### Logging

1. **Use Appropriate Log Levels**
   - Error: Actual errors
   - Warn: Warnings, slow operations
   - Info: General information
   - Debug: Development only

2. **Structured Logging**
   - Use JSON format
   - Include context (userId, organizationId)
   - Add request IDs for tracing

3. **Log Rotation**
   - Configure log rotation
   - Archive old logs
   - Monitor disk space

---

## Troubleshooting

### Sentry Not Capturing Errors

**Check:**
1. SENTRY_ENABLED is true
2. SENTRY_DSN is set correctly
3. Network connectivity to Sentry
4. Check Sentry dashboard for errors

### APM Not Working

**Check:**
1. APM_ENABLED is true
2. APM provider credentials are correct
3. Network connectivity to APM server
4. Check APM dashboard

### Logs Not Appearing in Elasticsearch

**Check:**
1. ELASTICSEARCH_ENABLED is true
2. Elasticsearch is running
3. Network connectivity
4. Check Elasticsearch indices:
   ```bash
   curl http://localhost:9200/_cat/indices
   ```

---

## Monitoring Alerts

### Recommended Alerts

1. **Error Rate**
   - Alert if error rate > 1%
   - Alert if error rate increases > 50%

2. **Response Time**
   - Alert if P95 > 1s
   - Alert if P99 > 2s

3. **Database Performance**
   - Alert if query time > 500ms
   - Alert if connection pool exhausted

4. **Resource Usage**
   - Alert if CPU > 80%
   - Alert if memory > 90%

### Setting Up Alerts

#### Sentry Alerts
1. Go to Sentry → Alerts
2. Create alert rule
3. Set conditions
4. Configure notifications

#### Elasticsearch Alerts
1. Use Watcher (Elasticsearch)
2. Or use external monitoring (Datadog, etc.)

---

## Cost Considerations

### Sentry
- Free tier: 5,000 events/month
- Paid plans start at $26/month
- Consider sampling rates for cost control

### APM Providers
- Elastic APM: Open source (self-hosted)
- New Relic: Free tier available
- Datadog: Paid plans
- AppDynamics: Enterprise pricing

### ELK Stack
- Open source (self-hosted)
- Cloud options: Elastic Cloud (paid)

---

## Support

- **Sentry Docs:** https://docs.sentry.io/platforms/node/
- **Elastic APM Docs:** https://www.elastic.co/guide/en/apm/get-started/current/index.html
- **New Relic Docs:** https://docs.newrelic.com/
- **Datadog Docs:** https://docs.datadoghq.com/

---

**Last Updated:** December 18, 2024

